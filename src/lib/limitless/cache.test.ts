import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db/db'
import {
  cached,
  getCached,
  LIMITLESS_CACHE_TTL_MS,
  pairingsCacheKey,
  setCached,
  standingsCacheKey,
  tournamentsCacheKey,
} from './cache'

afterEach(async () => {
  await db.limitlessCache.clear()
  vi.useRealTimers()
})

describe('cache keys', () => {
  it('builds endpoint- and param-specific keys, not a blanket key', () => {
    expect(tournamentsCacheKey('POCKET', 15)).toBe('tournaments:POCKET:15')
    expect(standingsCacheKey('tour-1')).toBe('standings:tour-1')
    expect(pairingsCacheKey('tour-1')).toBe('pairings:tour-1')
    expect(standingsCacheKey('tour-1')).not.toBe(pairingsCacheKey('tour-1'))
  })
})

describe('getCached / setCached', () => {
  it('returns undefined on a cache miss', async () => {
    await expect(getCached('missing-key')).resolves.toBeUndefined()
  })

  it('returns a fresh value written via setCached', async () => {
    await setCached('some-key', { hello: 'world' })

    await expect(getCached('some-key')).resolves.toEqual({ hello: 'world' })
  })

  it('treats an entry older than the TTL as a miss', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(0)
    await setCached('expiring-key', 'value')

    vi.setSystemTime(LIMITLESS_CACHE_TTL_MS + 1)

    await expect(getCached('expiring-key')).resolves.toBeUndefined()
  })

  it('treats an entry exactly at the TTL boundary as still fresh', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(0)
    await setCached('boundary-key', 'value')

    vi.setSystemTime(LIMITLESS_CACHE_TTL_MS)

    await expect(getCached('boundary-key')).resolves.toBe('value')
  })
})

describe('cached', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('calls the fetcher and persists the result on a cache miss', async () => {
    const fetcher = vi.fn().mockResolvedValue('fetched-value')

    const result = await cached('fetch-key', fetcher)

    expect(result).toBe('fetched-value')
    expect(fetcher).toHaveBeenCalledTimes(1)
    await expect(getCached('fetch-key')).resolves.toBe('fetched-value')
  })

  it('does not call the fetcher on a cache hit', async () => {
    await setCached('hit-key', 'cached-value')
    const fetcher = vi.fn().mockResolvedValue('should-not-be-used')

    const result = await cached('hit-key', fetcher)

    expect(result).toBe('cached-value')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('re-fetches and overwrites an expired entry', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(0)
    await setCached('stale-key', 'old-value')
    vi.setSystemTime(LIMITLESS_CACHE_TTL_MS + 1)
    const fetcher = vi.fn().mockResolvedValue('new-value')

    const result = await cached('stale-key', fetcher)

    expect(result).toBe('new-value')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
