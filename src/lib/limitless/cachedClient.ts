import { fetchPairings, fetchStandings, fetchTournaments } from './client'
import {
  cached,
  pairingsCacheKey,
  standingsCacheKey,
  tournamentsCacheKey,
} from './cache'
import { fetchWithRetry } from './retry'
import type {
  LimitlessPairing,
  LimitlessStanding,
  LimitlessTournament,
} from './types'

/**
 * Duenne Wrapper um die rohen client.ts-Fetcher: legen Dexie-TTL-Cache
 * (cache.ts) + Einzelrequest-Retry/Backoff (retry.ts) drum herum, ohne
 * client.ts selbst anzufassen (bleibt reine Low-Level-Fetch-Schicht).
 * loadTierlist.ts UND loadMatchups.ts nutzen dieselben Funktionen hier --
 * das ist der geteilte Ladepfad (Teil C.2, Option B): ein zweiter
 * Seitenbesuch (oder die zweite der beiden Seiten) bekommt einen
 * Dexie-Cache-Hit statt eines erneuten Netzwerk-Calls.
 */
export async function fetchTournamentsCached(params: {
  game: string
  limit: number
}): Promise<LimitlessTournament[]> {
  return cached(tournamentsCacheKey(params.game, params.limit), () =>
    fetchWithRetry(() => fetchTournaments(params)),
  )
}

export async function fetchStandingsCached(
  tournamentId: string,
): Promise<LimitlessStanding[]> {
  return cached(standingsCacheKey(tournamentId), () =>
    fetchWithRetry(() => fetchStandings(tournamentId)),
  )
}

export async function fetchPairingsCached(
  tournamentId: string,
): Promise<LimitlessPairing[]> {
  return cached(pairingsCacheKey(tournamentId), () =>
    fetchWithRetry(() => fetchPairings(tournamentId)),
  )
}
