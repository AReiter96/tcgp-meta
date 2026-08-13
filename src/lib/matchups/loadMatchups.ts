import {
  fetchPairingsCached,
  fetchStandingsCached,
  fetchTournamentsCached,
} from '../limitless/cachedClient'
import { runInBatches } from '../limitless/batch'
import { POCKET_GAME_ID } from '../limitless/types'
import { aggregateArchetypeStats } from '../tierlist/aggregate'
import {
  DEFAULT_TOURNAMENT_LIMIT,
  type TierlistMeta,
} from '../tierlist/loadTierlist'
import { aggregateMatchupStats, type ArchetypeMatchupStats } from './aggregate'
import { resolvePairings } from './resolvePairings'

export interface MatchupData {
  stats: ArchetypeMatchupStats[]
  meta: TierlistMeta
}

/**
 * Laedt Standings UND Pairings der zuletzt gelisteten POCKET-Turniere
 * (verdoppelt gegenueber M2s reinem Standings-Ladevorgang: 1x /tournaments +
 * Nx /standings + Nx /pairings, siehe CLAUDE.md "Bekannte Risiken"). Nutzt
 * dieselbe DEFAULT_TOURNAMENT_LIMIT und aggregateArchetypeStats wie die
 * Tierlist, um die Nutzungsrate-Rangfolge fuer die Top-5-Gegner-Gewichtung
 * nicht doppelt zu berechnen. Seit M4: Tournaments/Standings/Pairings
 * laufen ueber denselben Dexie-TTL-Cache wie loadTierlistData() (Teil C.2,
 * geteilter Ladepfad) -- Standings, die bereits von einem /tierlist-Besuch
 * gecacht wurden, werden hier direkt aus dem Cache gelesen. Requests laufen
 * gestaffelt in Batches statt eines vollen Promise.all-Bursts.
 *
 * Fail-fast wie loadTierlistData(): ein einzelner fehlgeschlagener
 * Standings- oder Pairings-Aufruf (nach Retries) laesst die gesamte
 * Ladeoperation fehlschlagen, kein stilles Ueberspringen einzelner
 * Turniere.
 */
export async function loadMatchupData(
  limit: number = DEFAULT_TOURNAMENT_LIMIT,
): Promise<MatchupData> {
  const tournaments = await fetchTournamentsCached({
    game: POCKET_GAME_ID,
    limit,
  })

  const perTournament = await runInBatches(tournaments, async (tournament) => {
    const [standings, pairings] = await Promise.all([
      fetchStandingsCached(tournament.id),
      fetchPairingsCached(tournament.id),
    ])
    return { tournamentId: tournament.id, standings, pairings }
  })

  const usageStats = aggregateArchetypeStats(
    perTournament.map(({ tournamentId, standings }) => ({
      tournamentId,
      standings,
    })),
  )
  // Pro Turnier gejoint (nicht turnierweit gemeinsam), da ein Username in
  // verschiedenen Turnieren unterschiedliche Decks gespielt haben kann --
  // siehe Doc-Comment an resolvePairings().
  const resolvedPairings = perTournament.flatMap(({ standings, pairings }) =>
    resolvePairings(pairings, standings),
  )

  return {
    stats: aggregateMatchupStats(resolvedPairings, usageStats),
    meta: {
      tournamentCount: tournaments.length,
      totalPlayers: tournaments.reduce((sum, t) => sum + t.players, 0),
    },
  }
}
