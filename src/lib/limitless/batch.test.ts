import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runInBatches } from './batch'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('runInBatches', () => {
  it('processes all items and preserves order in the results', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7]
    const fn = vi.fn(async (n: number) => n * 10)

    const promise = runInBatches(items, fn, { batchSize: 3, delayMs: 100 })
    await vi.runAllTimersAsync()
    const results = await promise

    expect(results).toEqual([10, 20, 30, 40, 50, 60, 70])
  })

  it('never has more than batchSize in-flight at once', async () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    let inFlight = 0
    let maxInFlight = 0
    const fn = vi.fn(async (n: number) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 10))
      inFlight--
      return n
    })

    const promise = runInBatches(items, fn, { batchSize: 3, delayMs: 50 })
    await vi.runAllTimersAsync()
    await promise

    expect(maxInFlight).toBeLessThanOrEqual(3)
  })

  it('waits delayMs between chunks but not after the last chunk', async () => {
    const items = [1, 2, 3, 4]
    const fn = vi.fn(async (n: number) => n)

    const promise = runInBatches(items, fn, { batchSize: 2, delayMs: 300 })

    // First chunk resolves without needing a timer advance.
    await Promise.resolve()
    await Promise.resolve()
    expect(fn).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(299)
    expect(fn).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)
    expect(fn).toHaveBeenCalledTimes(4)

    await promise
  })

  it('propagates a rejection from any item (fail-fast, no silent partial dataset)', async () => {
    const fn = vi.fn(async (n: number) => {
      if (n === 2) throw new Error('boom')
      return n
    })

    const promise = runInBatches([1, 2, 3], fn, { batchSize: 3 })
    const assertion = expect(promise).rejects.toThrow('boom')
    await vi.runAllTimersAsync()
    await assertion
  })
})
