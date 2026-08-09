import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../limitless/cachedClient', () => ({
  fetchTournamentsCached: vi.fn(),
  fetchStandingsCached: vi.fn(),
  fetchPairingsCached: vi.fn(),
}))

import {
  fetchPairingsCached,
  fetchStandingsCached,
  fetchTournamentsCached,
} from '../limitless/cachedClient'
import { loadMatchupData } from './loadMatchups'
import { DEFAULT_TOURNAMENT_LIMIT } from '../tierlist/loadTierlist'
import {
  mewtwoDeckStandingFixture,
  pikachuDeckStandingFixture,
  pikachuVsMewtwoPairingFixture,
  tournamentFixture,
} from '../../test/fixtures/limitless'
import { POCKET_GAME_ID } from '../limitless/types'

const mockedFetchTournamentsCached = vi.mocked(fetchTournamentsCached)
const mockedFetchStandingsCached = vi.mocked(fetchStandingsCached)
const mockedFetchPairingsCached = vi.mocked(fetchPairingsCached)

beforeEach(() => {
  mockedFetchTournamentsCached.mockReset()
  mockedFetchStandingsCached.mockReset()
  mockedFetchPairingsCached.mockReset()
})

describe('loadMatchupData', () => {
  it('uses the cached Limitless fetchers for tournaments, standings and pairings', async () => {
    mockedFetchTournamentsCached.mockResolvedValue([tournamentFixture])
    mockedFetchStandingsCached.mockResolvedValue([
      pikachuDeckStandingFixture,
      mewtwoDeckStandingFixture,
    ])
    mockedFetchPairingsCached.mockResolvedValue([pikachuVsMewtwoPairingFixture])

    const stats = await loadMatchupData()

    expect(mockedFetchTournamentsCached).toHaveBeenCalledWith({
      game: POCKET_GAME_ID,
      limit: DEFAULT_TOURNAMENT_LIMIT,
    })
    expect(mockedFetchStandingsCached).toHaveBeenCalledWith(
      tournamentFixture.id,
    )
    expect(mockedFetchPairingsCached).toHaveBeenCalledWith(tournamentFixture.id)
    expect(stats.length).toBeGreaterThan(0)
  })

  it('propagates a failure instead of silently returning partial data', async () => {
    mockedFetchTournamentsCached.mockResolvedValue([tournamentFixture])
    mockedFetchStandingsCached.mockResolvedValue([pikachuDeckStandingFixture])
    mockedFetchPairingsCached.mockRejectedValue(new Error('rate limited'))

    await expect(loadMatchupData()).rejects.toThrow('rate limited')
  })
})
