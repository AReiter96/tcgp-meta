import {
  LIMITLESS_API_BASE,
  type LimitlessGame,
  type LimitlessPairing,
  type LimitlessRateLimitInfo,
  type LimitlessStanding,
  type LimitlessTournament,
} from './types'

const RATE_LIMIT_HEADER_MAP: Record<keyof LimitlessRateLimitInfo, string[]> = {
  limit: ['x-ratelimit-limit', 'ratelimit-limit'],
  remaining: ['x-ratelimit-remaining', 'ratelimit-remaining'],
  reset: ['x-ratelimit-reset', 'ratelimit-reset'],
  retryAfter: ['retry-after'],
}

let lastRateLimitInfo: LimitlessRateLimitInfo | null = null

function captureRateLimitHeaders(response: Response): void {
  const info: LimitlessRateLimitInfo = {}
  let found = false

  for (const [key, headerNames] of Object.entries(RATE_LIMIT_HEADER_MAP)) {
    for (const headerName of headerNames) {
      const value = response.headers.get(headerName)
      if (value !== null) {
        info[key as keyof LimitlessRateLimitInfo] = value
        found = true
        break
      }
    }
  }

  if (!found) {
    return
  }

  lastRateLimitInfo = info
  console.info('Limitless API Rate-Limit-Info:', info)

  const remaining = info.remaining !== undefined ? Number(info.remaining) : NaN
  if (!Number.isNaN(remaining) && remaining <= 5) {
    console.warn(
      `Limitless API Rate-Limit fast erreicht: noch ${info.remaining} Anfragen uebrig.`,
    )
  }
}

export function getLimitlessRateLimitInfo(): LimitlessRateLimitInfo | null {
  return lastRateLimitInfo
}

async function limitlessFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${LIMITLESS_API_BASE}${path}`)
  captureRateLimitHeaders(response)

  if (!response.ok) {
    throw new Error(
      `Limitless API: Anfrage an "${path}" fehlgeschlagen (Status ${response.status})`,
    )
  }

  return response.json() as Promise<T>
}

export async function fetchGames(): Promise<LimitlessGame[]> {
  return limitlessFetch<LimitlessGame[]>('/games')
}

export async function fetchTournaments(params: {
  game: string
  limit: number
  page?: number
}): Promise<LimitlessTournament[]> {
  const query = new URLSearchParams({
    game: params.game,
    limit: String(params.limit),
  })
  if (params.page !== undefined) {
    query.set('page', String(params.page))
  }
  return limitlessFetch<LimitlessTournament[]>(
    `/tournaments?${query.toString()}`,
  )
}

export async function fetchStandings(
  tournamentId: string,
): Promise<LimitlessStanding[]> {
  return limitlessFetch<LimitlessStanding[]>(
    `/tournaments/${tournamentId}/standings`,
  )
}

export async function fetchPairings(
  tournamentId: string,
): Promise<LimitlessPairing[]> {
  return limitlessFetch<LimitlessPairing[]>(
    `/tournaments/${tournamentId}/pairings`,
  )
}
