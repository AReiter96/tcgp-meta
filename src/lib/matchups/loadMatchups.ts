import {
  fetchPairings,
  fetchStandings,
  fetchTournaments,
} from '../limitless/client'
import { POCKET_GAME_ID } from '../limitless/types'
import { aggregateArchetypeStats } from '../tierlist/aggregate'
import { DEFAULT_TOURNAMENT_LIMIT } from '../tierlist/loadTierlist'
import { aggregateMatchupStats, type ArchetypeMatchupStats } from './aggregate'

/**
 * Laedt Standings UND Pairings der zuletzt gelisteten POCKET-Turniere
 * (verdoppelt gegenueber M2s reinem Standings-Ladevorgang: 1x /tournaments +
 * Nx /standings + Nx /pairings, siehe CLAUDE.md "Bekannte Risiken"). Nutzt
 * dieselbe DEFAULT_TOURNAMENT_LIMIT und aggregateArchetypeStats wie die
 * Tierlist, um die Nutzungsrate-Rangfolge fuer die Top-5-Gegner-Gewichtung
 * nicht doppelt zu berechnen.
 *
 * Fail-fast wie loadTierlistData(): ein einzelner fehlgeschlagener
 * Standings- oder Pairings-Aufruf laesst die gesamte Ladeoperation
 * fehlschlagen, kein stilles Ueberspringen einzelner Turniere.
 */
export async function loadMatchupData(
  limit: number = DEFAULT_TOURNAMENT_LIMIT,
): Promise<ArchetypeMatchupStats[]> {
  const tournaments = await fetchTournaments({ game: POCKET_GAME_ID, limit })

  const perTournament = await Promise.all(
    tournaments.map(async (tournament) => {
      const [standings, pairings] = await Promise.all([
        fetchStandings(tournament.id),
        fetchPairings(tournament.id),
      ])
      return { tournamentId: tournament.id, standings, pairings }
    }),
  )

  const usageStats = aggregateArchetypeStats(
    perTournament.map(({ tournamentId, standings }) => ({
      tournamentId,
      standings,
    })),
  )
  const allPairings = perTournament.flatMap((t) => t.pairings)

  return aggregateMatchupStats(allPairings, usageStats)
}
