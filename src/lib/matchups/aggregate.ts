import { getDeckArchetype, type DeckArchetype } from '../archetype'
import type {
  LimitlessPairing,
  LimitlessPairingOutcome,
} from '../limitless/types'
import type { ArchetypeStats } from '../tierlist/aggregate'

const UNKNOWN_ARCHETYPE_ID = 'unknown'

export const MIN_MATCHUP_SAMPLE_SIZE = 5
const DEFAULT_TOP_OPPONENT_COUNT = 5
const DEFAULT_TOP_OWN_DECK_COUNT = 15

export interface MatchupBreakdown {
  opponent: DeckArchetype
  wins: number
  losses: number
  ties: number
  gamesPlayed: number
  winratePercent: number | null
  hasSufficientData: boolean
}

export interface ArchetypeMatchupStats {
  archetype: DeckArchetype
  gamesPlayed: number
  counterMetaScorePercent: number | null
  hasSufficientData: boolean
  matchups: MatchupBreakdown[]
}

interface MatchupCell {
  wins: number
  losses: number
  ties: number
}

/** Aktualisiert die Zelle aus Sicht von player1 (ownCell) und die gespiegelte Zelle aus Sicht von player2 (opponentCell). */
function applyOutcome(
  ownCell: MatchupCell,
  opponentCell: MatchupCell,
  outcome: LimitlessPairingOutcome,
): void {
  if (outcome === 'draw') {
    ownCell.ties += 1
    opponentCell.ties += 1
    return
  }
  if (outcome === 'player1') {
    ownCell.wins += 1
    opponentCell.losses += 1
  } else {
    ownCell.losses += 1
    opponentCell.wins += 1
  }
}

/**
 * Baut die volle gepoolte Archetyp-vs-Archetyp-Matrix aus allen Pairings auf
 * (Freilose und nicht auswertbare Ergebnisse werden uebersprungen). Wird auf
 * allen in den Pairings vorkommenden Archetypen aufgebaut, bevor auf
 * Top-5/Top-15 gefiltert wird -- Daten werden vor dem Aggregieren nicht
 * verworfen, nur beim Zurueckgeben.
 */
function buildMatchupMatrix(
  pairings: LimitlessPairing[],
): Map<string, Map<string, MatchupCell>> {
  const matrix = new Map<string, Map<string, MatchupCell>>()

  function cellFor(ownId: string, opponentId: string): MatchupCell {
    const row = matrix.get(ownId) ?? new Map<string, MatchupCell>()
    matrix.set(ownId, row)
    const cell = row.get(opponentId) ?? { wins: 0, losses: 0, ties: 0 }
    row.set(opponentId, cell)
    return cell
  }

  for (const pairing of pairings) {
    if (pairing.player2 === null || pairing.outcome === null) {
      continue
    }
    const a1 = getDeckArchetype(pairing.player1.deck)
    const a2 = getDeckArchetype(pairing.player2.deck)

    const cell1 = cellFor(a1.id, a2.id)
    const cell2 = cellFor(a2.id, a1.id)

    applyOutcome(cell1, cell2, pairing.outcome)
  }

  return matrix
}

function toBreakdown(
  cell: MatchupCell | undefined,
  opponent: DeckArchetype,
  minSampleSize: number,
): MatchupBreakdown {
  const wins = cell?.wins ?? 0
  const losses = cell?.losses ?? 0
  const ties = cell?.ties ?? 0
  const gamesPlayed = wins + losses + ties
  const hasSufficientData = gamesPlayed >= minSampleSize

  return {
    opponent,
    wins,
    losses,
    ties,
    gamesPlayed,
    winratePercent: hasSufficientData ? (wins / gamesPlayed) * 100 : null,
    hasSufficientData,
  }
}

/**
 * Counter-Meta-Score: gepoolte Winrate (wins / (wins+losses+ties), dieselbe
 * Formel wie ArchetypeStats.winratePercent aus M2) ueber alle Spiele gegen
 * die aktuellen Top-5-Nutzungsrate-Archetypen kombiniert -- NICHT der
 * Durchschnitt der 5 Einzel-Matchup-Prozentsaetze. Algebraisch identisch zu
 * einem nach tatsaechlicher Spielhaeufigkeit gewichteten Mittel der 5
 * Matchup-Winraten (Σwins/Σgames = Σ(games_i/Σgames)×winrate_i) -- die
 * geforderte Gewichtung nach Haeufigkeit des jeweiligen Gegners in der
 * Stichprobe ergibt sich damit automatisch aus derselben Pooling-Philosophie
 * wie M2s Tierlist-Aggregation, ohne separate Gewichtungsberechnung. Das ist
 * Haeufigkeit in der beobachteten Pairing-Stichprobe (auch von
 * Swiss-Pairing-Dynamik beeinflusst), nicht identisch mit einer Gewichtung
 * nach ArchetypeStats.usageRatePercent, auch wenn beide stark korrelieren.
 *
 * "Unbekannt" wird sowohl als Gegner als auch als eigene Zeile ausgeschlossen
 * -- keine sinnvoll konterbare Kategorie und wuerde durch potenziell grosse
 * Stichprobe echte Archetypen aus den Top-15 verdraengen. Spiegel-Matchups
 * (eigener Archetyp taucht auch im eigenen Top-5-Gegnerfeld auf) werden
 * bewusst NICHT ausgeschlossen, sondern normal gepoolt -- reale
 * Wettbewerbsinformation. Da player1- und player2-Zelle bei einem
 * Spiegel-Matchup dieselbe Archetyp-Paarung sind, traegt jede Pairing sowohl
 * einen Sieg als auch eine Niederlage in dieselbe Zelle ein -- die Winrate
 * ist dadurch tautologisch 50%, gamesPlayed zaehlt entsprechend 2 pro
 * realer Pairing (nicht ausgeschlossen, aber bewusst dieses Verhalten statt
 * einer beliebigen 1:1-Naeherung).
 */
export function aggregateMatchupStats(
  pairings: LimitlessPairing[],
  usageStats: ArchetypeStats[],
  options?: {
    topOpponentCount?: number
    topOwnDeckCount?: number
    minSampleSize?: number
  },
): ArchetypeMatchupStats[] {
  const minSampleSize = options?.minSampleSize ?? MIN_MATCHUP_SAMPLE_SIZE
  const ranked = usageStats.filter(
    (s) => s.archetype.id !== UNKNOWN_ARCHETYPE_ID,
  )
  const topOpponents = ranked.slice(
    0,
    options?.topOpponentCount ?? DEFAULT_TOP_OPPONENT_COUNT,
  )
  const ownDeckCandidates = ranked.slice(
    0,
    options?.topOwnDeckCount ?? DEFAULT_TOP_OWN_DECK_COUNT,
  )

  const matrix = buildMatchupMatrix(pairings)

  const stats: ArchetypeMatchupStats[] = ownDeckCandidates.map((own) => {
    const row = matrix.get(own.archetype.id)
    const matchups = topOpponents.map((opponent) =>
      toBreakdown(
        row?.get(opponent.archetype.id),
        opponent.archetype,
        minSampleSize,
      ),
    )

    const totalWins = matchups.reduce((sum, m) => sum + m.wins, 0)
    const gamesPlayed = matchups.reduce((sum, m) => sum + m.gamesPlayed, 0)
    const hasSufficientData = gamesPlayed >= minSampleSize

    return {
      archetype: own.archetype,
      gamesPlayed,
      counterMetaScorePercent: hasSufficientData
        ? (totalWins / gamesPlayed) * 100
        : null,
      hasSufficientData,
      matchups,
    }
  })

  return stats.sort((a, b) => {
    if (
      a.counterMetaScorePercent === null &&
      b.counterMetaScorePercent === null
    ) {
      return 0
    }
    if (a.counterMetaScorePercent === null) {
      return 1
    }
    if (b.counterMetaScorePercent === null) {
      return -1
    }
    return b.counterMetaScorePercent - a.counterMetaScorePercent
  })
}
