import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildDeckIconUrl,
  fetchGames,
  fetchPairings,
  fetchStandings,
  fetchTournaments,
  getLimitlessRateLimitInfo,
} from './client'
import {
  pocketGameFixture,
  pikachuDeckStandingFixture,
  pikachuVsMewtwoPairingFixture,
  tournamentFixture,
} from '../../test/fixtures/limitless'

function jsonResponse(
  body: unknown,
  init?: { status?: number; ok?: boolean; headers?: Record<string, string> },
): Response {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    headers: new Headers(init?.headers ?? {}),
    json: () => Promise.resolve(body),
  } as unknown as Response
}

describe('limitless client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches games from the correct endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([pocketGameFixture]))

    const games = await fetchGames()

    expect(fetch).toHaveBeenCalledWith(
      'https://play.limitlesstcg.com/api/games',
    )
    expect(games).toEqual([pocketGameFixture])
  })

  it('builds the tournaments query string with game/limit/page', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([tournamentFixture]))

    await fetchTournaments({ game: 'POCKET', limit: 15, page: 2 })

    expect(fetch).toHaveBeenCalledWith(
      'https://play.limitlesstcg.com/api/tournaments?game=POCKET&limit=15&page=2',
    )
  })

  it('omits the page param when not given', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([tournamentFixture]))

    await fetchTournaments({ game: 'POCKET', limit: 15 })

    expect(fetch).toHaveBeenCalledWith(
      'https://play.limitlesstcg.com/api/tournaments?game=POCKET&limit=15',
    )
  })

  it('fetches standings for a tournament id', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse([pikachuDeckStandingFixture]),
    )

    const standings = await fetchStandings('tour-1')

    expect(fetch).toHaveBeenCalledWith(
      'https://play.limitlesstcg.com/api/tournaments/tour-1/standings',
    )
    expect(standings).toEqual([pikachuDeckStandingFixture])
  })

  it('fetches pairings for a tournament id', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse([pikachuVsMewtwoPairingFixture]),
    )

    const pairings = await fetchPairings('tour-1')

    expect(fetch).toHaveBeenCalledWith(
      'https://play.limitlesstcg.com/api/tournaments/tour-1/pairings',
    )
    expect(pairings).toEqual([pikachuVsMewtwoPairingFixture])
  })

  it('throws a descriptive error on a non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(null, { ok: false, status: 429 }),
    )

    await expect(fetchGames()).rejects.toThrow(/429/)
  })

  it('captures rate-limit headers case-insensitively and exposes them', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse([pocketGameFixture], {
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '3',
        },
      }),
    )

    await fetchGames()

    expect(getLimitlessRateLimitInfo()).toEqual({
      limit: '60',
      remaining: '3',
    })
  })
})

describe('buildDeckIconUrl', () => {
  it('appends the icon fragment as a .png against the verified CDN base', () => {
    expect(buildDeckIconUrl('lucario-mega')).toBe(
      'https://r2.limitlesstcg.net/pokemon/gen9/lucario-mega.png',
    )
  })

  it('does not add any transformation beyond the extension, e.g. for multi-word fragments', () => {
    expect(buildDeckIconUrl('gouging-fire')).toBe(
      'https://r2.limitlesstcg.net/pokemon/gen9/gouging-fire.png',
    )
  })
})
