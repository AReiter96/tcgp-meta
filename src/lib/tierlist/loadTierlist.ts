import { fetchStandings, fetchTournaments } from '../limitless/client'
import { POCKET_GAME_ID } from '../limitless/types'
import { aggregateArchetypeStats, type ArchetypeStats } from './aggregate'

/**
 * Anzahl der zuletzt abgeschlossenen POCKET-Turniere, die fuer die Tierlist
 * herangezogen werden. 15 als Kompromiss zwischen Stichprobengroesse und
 * Anzahl API-Aufrufen (1x /tournaments + Nx /standings, kein API-Key ->
 * niedrigeres Rate-Limit, siehe CLAUDE.md "Bekannte Risiken").
 */
export const DEFAULT_TOURNAMENT_LIMIT = 15

/**
 * Laedt Standings der zuletzt gelisteten POCKET-Turniere und aggregiert sie
 * zur Tierlist. Kein Dexie-Cache fuer diese Domaene (siehe CLAUDE.md
 * Architektur: Dexie bleibt auf Kartentext/-daten beschraenkt).
 *
 * Fail-fast: schlaegt ein einzelner /standings-Aufruf fehl, schlaegt die
 * gesamte Ladeoperation fehl (kein stilles Ueberspringen einzelner
 * Turniere) -- Fehlerzustand muss im UI sichtbar sein, mirror zu
 * db/sync.ts's Verhalten bei TCGdex.
 */
export async function loadTierlistData(
  limit: number = DEFAULT_TOURNAMENT_LIMIT,
): Promise<ArchetypeStats[]> {
  const tournaments = await fetchTournaments({ game: POCKET_GAME_ID, limit })

  const tournamentStandings = await Promise.all(
    tournaments.map(async (tournament) => ({
      tournamentId: tournament.id,
      standings: await fetchStandings(tournament.id),
    })),
  )

  return aggregateArchetypeStats(tournamentStandings)
}
