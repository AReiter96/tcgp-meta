import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../db/db'

// Mocked at the raw client.ts level (not cachedClient) -- this test proves
// the actual claim of Teil C.2 (geteilter Ladepfad): /tierlist and
// /matchups both go through the same Dexie-cached fetchers, so once one
// page has loaded a tournament's standings, the other page reuses them
// from the cache instead of hitting the network again.
vi.mock('./client', () => ({
  fetchTournaments: vi.fn(),
  fetchStandings: vi.fn(),
  fetchPairings: vi.fn(),
}))

import { fetchPairings, fetchStandings, fetchTournaments } from './client'
import { loadTierlistData } from '../tierlist/loadTierlist'
import { loadMatchupData } from '../matchups/loadMatchups'
import {
  mewtwoDeckStandingFixture,
  pikachuDeckStandingFixture,
  pikachuVsMewtwoPairingFixture,
  tournamentFixture,
} from '../../test/fixtures/limitless'

const mockedFetchTournaments = vi.mocked(fetchTournaments)
const mockedFetchStandings = vi.mocked(fetchStandings)
const mockedFetchPairings = vi.mocked(fetchPairings)

beforeEach(() => {
  mockedFetchTournaments.mockReset()
  mockedFetchStandings.mockReset()
  mockedFetchPairings.mockReset()
  mockedFetchTournaments.mockResolvedValue([tournamentFixture])
  mockedFetchStandings.mockResolvedValue([
    pikachuDeckStandingFixture,
    mewtwoDeckStandingFixture,
  ])
  mockedFetchPairings.mockResolvedValue([pikachuVsMewtwoPairingFixture])
})

afterEach(async () => {
  await db.limitlessCache.clear()
})

describe('shared load path between /tierlist and /matchups', () => {
  it('reuses the same cached standings for a /matchups visit after a /tierlist visit', async () => {
    await loadTierlistData()
    expect(mockedFetchStandings).toHaveBeenCalledTimes(1)
    expect(mockedFetchTournaments).toHaveBeenCalledTimes(1)

    await loadMatchupData()

    // Standings for the same tournament were already cached by the
    // /tierlist load -- /matchups should not re-fetch them, only pairings
    // (a resource /tierlist never needed) go to the network.
    expect(mockedFetchStandings).toHaveBeenCalledTimes(1)
    expect(mockedFetchPairings).toHaveBeenCalledTimes(1)
    // Tournaments list is cached under the same key/limit too.
    expect(mockedFetchTournaments).toHaveBeenCalledTimes(1)
  })

  it('derives consistent archetype usage data for both pages from the shared dataset', async () => {
    const { stats: tierlistStats } = await loadTierlistData()
    const { stats: matchupStats } = await loadMatchupData()

    const tierlistIds = tierlistStats.map((s) => s.archetype.id).sort()
    const matchupIds = matchupStats.map((s) => s.archetype.id).sort()

    expect(matchupIds).toEqual(tierlistIds)
  })
})
