import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db/db'
import {
  fetchPairingsCached,
  fetchStandingsCached,
  fetchTournamentsCached,
} from './cachedClient'
import {
  pikachuVsMewtwoPairingFixture,
  pikachuDeckStandingFixture,
  tournamentFixture,
} from '../../test/fixtures/limitless'

vi.mock('./client', () => ({
  fetchTournaments: vi.fn(),
  fetchStandings: vi.fn(),
  fetchPairings: vi.fn(),
}))

import { fetchPairings, fetchStandings, fetchTournaments } from './client'

const mockedFetchTournaments = vi.mocked(fetchTournaments)
const mockedFetchStandings = vi.mocked(fetchStandings)
const mockedFetchPairings = vi.mocked(fetchPairings)

beforeEach(() => {
  mockedFetchTournaments.mockReset()
  mockedFetchStandings.mockReset()
  mockedFetchPairings.mockReset()
})

afterEach(async () => {
  await db.limitlessCache.clear()
})

describe('fetchTournamentsCached', () => {
  it('fetches once and serves the second call from the cache', async () => {
    mockedFetchTournaments.mockResolvedValue([tournamentFixture])

    const first = await fetchTournamentsCached({ game: 'POCKET', limit: 15 })
    const second = await fetchTournamentsCached({ game: 'POCKET', limit: 15 })

    expect(first).toEqual([tournamentFixture])
    expect(second).toEqual([tournamentFixture])
    expect(mockedFetchTournaments).toHaveBeenCalledTimes(1)
  })
})

describe('fetchStandingsCached / fetchPairingsCached share the same cache layer', () => {
  it('lets a second consumer (e.g. the other page) reuse the same standings without a second network call', async () => {
    mockedFetchStandings.mockResolvedValue([pikachuDeckStandingFixture])

    const fromTierlist = await fetchStandingsCached('tour-1')
    const fromMatchups = await fetchStandingsCached('tour-1')

    expect(fromTierlist).toEqual(fromMatchups)
    expect(mockedFetchStandings).toHaveBeenCalledTimes(1)
  })

  it('caches pairings independently of standings under a different key', async () => {
    mockedFetchStandings.mockResolvedValue([pikachuDeckStandingFixture])
    mockedFetchPairings.mockResolvedValue([pikachuVsMewtwoPairingFixture])

    await fetchStandingsCached('tour-1')
    const pairings = await fetchPairingsCached('tour-1')

    expect(pairings).toEqual([pikachuVsMewtwoPairingFixture])
    expect(mockedFetchPairings).toHaveBeenCalledTimes(1)
  })
})
