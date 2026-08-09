import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../limitless/cachedClient', () => ({
  fetchTournamentsCached: vi.fn(),
  fetchStandingsCached: vi.fn(),
}))

import {
  fetchStandingsCached,
  fetchTournamentsCached,
} from '../limitless/cachedClient'
import { DEFAULT_TOURNAMENT_LIMIT, loadTierlistData } from './loadTierlist'
import {
  pikachuDeckStandingFixture,
  tournamentFixture,
} from '../../test/fixtures/limitless'
import { POCKET_GAME_ID } from '../limitless/types'

const mockedFetchTournamentsCached = vi.mocked(fetchTournamentsCached)
const mockedFetchStandingsCached = vi.mocked(fetchStandingsCached)

beforeEach(() => {
  mockedFetchTournamentsCached.mockReset()
  mockedFetchStandingsCached.mockReset()
})

describe('loadTierlistData', () => {
  it('uses the cached Limitless fetchers, not the raw client', async () => {
    mockedFetchTournamentsCached.mockResolvedValue([tournamentFixture])
    mockedFetchStandingsCached.mockResolvedValue([pikachuDeckStandingFixture])

    const stats = await loadTierlistData()

    expect(mockedFetchTournamentsCached).toHaveBeenCalledWith({
      game: POCKET_GAME_ID,
      limit: DEFAULT_TOURNAMENT_LIMIT,
    })
    expect(mockedFetchStandingsCached).toHaveBeenCalledWith(
      tournamentFixture.id,
    )
    expect(stats).toHaveLength(1)
    expect(stats[0].archetype.id).toBe('pikachu-ex-zebstrika')
  })

  it('propagates a failure instead of silently returning partial data', async () => {
    mockedFetchTournamentsCached.mockResolvedValue([tournamentFixture])
    mockedFetchStandingsCached.mockRejectedValue(new Error('rate limited'))

    await expect(loadTierlistData()).rejects.toThrow('rate limited')
  })
})
