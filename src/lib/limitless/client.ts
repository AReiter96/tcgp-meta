import {
  LIMITLESS_API_BASE,
  LIMITLESS_DECK_ICON_BASE,
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

/**
 * Traegt den HTTP-Status, damit src/lib/limitless/retry.ts gezielt auf
 * 429/5xx reagieren kann (Retry sinnvoll) statt auf z.B. 404 (Retry
 * zwecklos) -- seit M4. Message-Format bleibt unveraendert, damit
 * bestehende Tests (`rejects.toThrow(/429/)`) weiter gueltig bleiben.
 */
export class LimitlessApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'LimitlessApiError'
    this.status = status
  }
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
    throw new LimitlessApiError(
      `Limitless API: Anfrage an "${path}" fehlgeschlagen (Status ${response.status})`,
      response.status,
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

/**
 * LimitlessDeck.icons liefert nur nackte Dateinamen-Fragmente ohne Endung
 * oder Host, siehe Doc-Comment an LIMITLESS_DECK_ICON_BASE. Reiner
 * String-Aufbau, kein Download/Caching des Bilds selbst (analog zu
 * buildCardImageUrl in src/lib/tcgdex/client.ts).
 */
export function buildDeckIconUrl(icon: string): string {
  return `${LIMITLESS_DECK_ICON_BASE}/${icon}.png`
}
