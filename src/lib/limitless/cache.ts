import { db } from '../db/db'

/**
 * TTL angelehnt an die bestehende TanStack-`staleTime`-Konvention in
 * useTierlist/useMatchups (1h) -- Turnierdaten aendern sich langsam genug,
 * dass eine Stunde alte Daten fuer Tierlist/Matchups noch sinnvoll sind,
 * aber kurz genug, dass neue Turniere zeitnah einfliessen.
 */
export const LIMITLESS_CACHE_TTL_MS = 1000 * 60 * 60

export function tournamentsCacheKey(game: string, limit: number): string {
  return `tournaments:${game}:${limit}`
}

export function standingsCacheKey(tournamentId: string): string {
  return `standings:${tournamentId}`
}

export function pairingsCacheKey(tournamentId: string): string {
  return `pairings:${tournamentId}`
}

export async function getCached<T>(key: string): Promise<T | undefined> {
  const entry = await db.limitlessCache.get(key)
  if (!entry) {
    return undefined
  }
  if (Date.now() - entry.cachedAt > LIMITLESS_CACHE_TTL_MS) {
    return undefined
  }
  return entry.data as T
}

export async function setCached<T>(key: string, data: T): Promise<void> {
  await db.limitlessCache.put({ key, data, cachedAt: Date.now() })
}

/**
 * Get-or-fetch-and-store: liefert einen frischen Cache-Treffer, sonst wird
 * `fetcher` aufgerufen und das Ergebnis fuer folgende Aufrufe (auch von
 * anderen Seiten/Ladepfaden) persistiert. Abgelaufene Eintraege werden beim
 * naechsten erfolgreichen Fetch stillschweigend ueberschrieben.
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = await getCached<T>(key)
  if (hit !== undefined) {
    return hit
  }
  const fresh = await fetcher()
  await setCached(key, fresh)
  return fresh
}
