import { getDeckArchetype, type DeckArchetype } from '../archetype'
import type { LimitlessStanding } from '../limitless/types'

export interface TournamentStandings {
  tournamentId: string
  standings: LimitlessStanding[]
}

export interface ArchetypeStats {
  archetype: DeckArchetype
  playerCount: number
  tournamentCount: number
  wins: number
  losses: number
  ties: number
  usageRatePercent: number
  winratePercent: number
}

/**
 * Aggregiert Standings ueber mehrere Turniere pro Archetyp. Nutzungsrate und
 * Winrate werden gepoolt berechnet (Summe aller Spieler-Eintraege bzw. aller
 * Spiele ueber alle Turniere hinweg), NICHT als Durchschnitt der einzelnen
 * Turnier-Prozentsaetze -- letzteres wuerde kleine und grosse Turniere gleich
 * gewichten und bei unterschiedlichen Turniergroessen verzerren (Simpson's
 * Paradox). "Unbekannt" (nicht kategorisierbare Decks, siehe
 * getDeckArchetype) faellt in eine eigene Zeile statt stillschweigend
 * herausgefiltert zu werden -- Nutzungsraten summieren sich dadurch weiterhin
 * auf ~100%.
 */
export function aggregateArchetypeStats(
  tournamentStandings: TournamentStandings[],
): ArchetypeStats[] {
  interface Bucket {
    archetype: DeckArchetype
    playerCount: number
    tournamentIds: Set<string>
    wins: number
    losses: number
    ties: number
  }

  const buckets = new Map<string, Bucket>()
  let totalPlayers = 0

  for (const { tournamentId, standings } of tournamentStandings) {
    for (const entry of standings) {
      totalPlayers += 1
      const archetype = getDeckArchetype(entry.deck)

      const bucket = buckets.get(archetype.id) ?? {
        archetype,
        playerCount: 0,
        tournamentIds: new Set<string>(),
        wins: 0,
        losses: 0,
        ties: 0,
      }
      bucket.playerCount += 1
      bucket.tournamentIds.add(tournamentId)
      bucket.wins += entry.record.wins
      bucket.losses += entry.record.losses
      bucket.ties += entry.record.ties
      buckets.set(archetype.id, bucket)
    }
  }

  const stats: ArchetypeStats[] = Array.from(buckets.values()).map((bucket) => {
    const games = bucket.wins + bucket.losses + bucket.ties
    return {
      archetype: bucket.archetype,
      playerCount: bucket.playerCount,
      tournamentCount: bucket.tournamentIds.size,
      wins: bucket.wins,
      losses: bucket.losses,
      ties: bucket.ties,
      usageRatePercent:
        totalPlayers > 0 ? (bucket.playerCount / totalPlayers) * 100 : 0,
      winratePercent: games > 0 ? (bucket.wins / games) * 100 : 0,
    }
  })

  return stats.sort((a, b) => b.usageRatePercent - a.usageRatePercent)
}
