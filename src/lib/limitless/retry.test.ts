import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LimitlessApiError } from './client'
import { fetchWithRetry } from './retry'

vi.mock('./client', async () => {
  const actual = await vi.importActual<typeof import('./client')>('./client')
  return {
    ...actual,
    getLimitlessRateLimitInfo: vi.fn(),
  }
})

import { getLimitlessRateLimitInfo } from './client'

const mockedGetRateLimitInfo = vi.mocked(getLimitlessRateLimitInfo)

beforeEach(() => {
  mockedGetRateLimitInfo.mockReturnValue(null)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('fetchWithRetry', () => {
  it('returns the result immediately on success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok')

    const result = await fetchWithRetry(fn)

    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries a 429 and succeeds on a later attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LimitlessApiError('429', 429))
      .mockResolvedValueOnce('ok-after-retry')

    const promise = fetchWithRetry(fn)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('ok-after-retry')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('uses the Retry-After header value when present', async () => {
    mockedGetRateLimitInfo.mockReturnValue({ retryAfter: '5' })
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new LimitlessApiError('429', 429))
      .mockResolvedValueOnce('ok')

    const promise = fetchWithRetry(fn)
    await vi.advanceTimersByTimeAsync(4999)
    expect(fn).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)

    await expect(promise).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not retry a non-retryable error like 404', async () => {
    const fn = vi.fn().mockRejectedValue(new LimitlessApiError('404', 404))

    await expect(fetchWithRetry(fn)).rejects.toThrow(/404/)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('rethrows the original error once retries are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new LimitlessApiError('429', 429))

    const promise = fetchWithRetry(fn, { maxRetries: 2 })
    const assertion = expect(promise).rejects.toThrow(/429/)
    await vi.runAllTimersAsync()
    await assertion
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('retries a plain network error (unknown status)', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce('recovered')

    const promise = fetchWithRetry(fn)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
