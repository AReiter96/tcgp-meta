import {
  fetchStandingsCached,
  fetchTournamentsCached,
} from '../limitless/cachedClient'
import { runInBatches } from '../limitless/batch'
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
 * zur Tierlist. Seit M4: Tournaments/Standings laufen ueber den
 * Dexie-TTL-Cache (../limitless/cachedClient.ts) -- derselbe Ladepfad wie
 * loadMatchupData() (Teil C.2), ein zweiter Seitenbesuch (oder die zweite
 * der beiden Seiten) bekommt Cache-Hits statt erneuter Netzwerk-Calls.
 * Standings-Requests laufen gestaffelt in Batches statt eines vollen
 * Promise.all-Bursts (siehe ../limitless/batch.ts).
 *
 * Fail-fast: schlaegt ein einzelner /standings-Aufruf (nach Retries, siehe
 * ../limitless/retry.ts) fehl, schlaegt die gesamte Ladeoperation fehl
 * (kein stilles Ueberspringen einzelner Turniere) -- Fehlerzustand muss im
 * UI sichtbar sein, mirror zu db/sync.ts's Verhalten bei TCGdex.
 */
export async function loadTierlistData(
  limit: number = DEFAULT_TOURNAMENT_LIMIT,
): Promise<ArchetypeStats[]> {
  const tournaments = await fetchTournamentsCached({
    game: POCKET_GAME_ID,
    limit,
  })

  const tournamentStandings = await runInBatches(
    tournaments,
    async (tournament) => ({
      tournamentId: tournament.id,
      standings: await fetchStandingsCached(tournament.id),
    }),
  )

  return aggregateArchetypeStats(tournamentStandings)
}
