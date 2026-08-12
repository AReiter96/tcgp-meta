import { describe, expect, it } from 'vitest'
import { aggregateArchetypeStats } from './aggregate'
import type { LimitlessStanding } from '../limitless/types'

const pikachuDeck = {
  id: 'pikachu-ex-zebstrika',
  name: 'Pikachu ex / Zebstrika',
  icons: ['https://example.com/pikachu-ex.png'],
}

const mewtwoDeck = {
  id: 'mewtwo-ex',
  name: 'Mewtwo ex',
  icons: ['https://example.com/mewtwo-ex.png'],
}

function standing(
  deck: typeof pikachuDeck | typeof mewtwoDeck | null,
  wins: number,
  losses: number,
  ties = 0,
): LimitlessStanding {
  return { placing: 1, player: 'player', deck, record: { wins, losses, ties } }
}

// t1: 1 Spieler (nur Pikachu). t2: 5 Spieler (3x Pikachu, 1x Mewtwo,
// 1x nicht kategorisierbar). Bewusst unterschiedliche Turniergroessen, damit
// gepoolte vs. naiv gemittelte Werte auseinanderfallen (Simpson's Paradox).
const t1: LimitlessStanding[] = [standing(pikachuDeck, 3, 0)]
const t2: LimitlessStanding[] = [
  standing(pikachuDeck, 1, 2),
  standing(pikachuDeck, 1, 2),
  standing(pikachuDeck, 1, 2),
  standing(mewtwoDeck, 2, 1),
  standing(null, 0, 3),
]

const tournamentStandings = [
  { tournamentId: 't1', standings: t1 },
  { tournamentId: 't2', standings: t2 },
]

describe('aggregateArchetypeStats', () => {
  it('pools usage rate across tournaments instead of averaging per-tournament percentages', () => {
    const stats = aggregateArchetypeStats(tournamentStandings)
    const pikachu = stats.find((s) => s.archetype.id === pikachuDeck.id)!

    // Naiver Durchschnitt der Turnier-Prozentsaetze waere (100% + 60%) / 2 = 80%.
    // Gepoolt: 4 von 6 Spielern insgesamt = 66.67%.
    expect(pikachu.playerCount).toBe(4)
    expect(pikachu.usageRatePercent).toBeCloseTo((4 / 6) * 100, 5)
    expect(pikachu.usageRatePercent).not.toBeCloseTo(80, 1)
  })

  it('pools winrate across tournaments instead of averaging per-tournament winrates', () => {
    const stats = aggregateArchetypeStats(tournamentStandings)
    const pikachu = stats.find((s) => s.archetype.id === pikachuDeck.id)!

    // Naiver Durchschnitt der Turnier-Winraten waere (100% + 33.33%) / 2 = 66.67%.
    // Gepoolt: 6 Siege von 12 Spielen insgesamt = 50%.
    expect(pikachu.wins).toBe(6)
    expect(pikachu.losses).toBe(6)
    expect(pikachu.winratePercent).toBeCloseTo(50, 5)
    expect(pikachu.winratePercent).not.toBeCloseTo(66.67, 1)
  })

  it('tracks tournamentCount separately from playerCount', () => {
    const stats = aggregateArchetypeStats(tournamentStandings)
    const pikachu = stats.find((s) => s.archetype.id === pikachuDeck.id)!
    const mewtwo = stats.find((s) => s.archetype.id === mewtwoDeck.id)!

    expect(pikachu.tournamentCount).toBe(2)
    expect(mewtwo.tournamentCount).toBe(1)
    expect(mewtwo.playerCount).toBe(1)
  })

  it('includes an Unbekannt row for uncategorized decks, not a silent drop', () => {
    const stats = aggregateArchetypeStats(tournamentStandings)
    const unknown = stats.find((s) => s.archetype.id === 'unknown')!

    expect(unknown).toBeDefined()
    expect(unknown.archetype.name).toBe('Unbekannt')
    expect(unknown.playerCount).toBe(1)
  })

  it('usage rates across all rows (including Unbekannt) sum to ~100%', () => {
    const stats = aggregateArchetypeStats(tournamentStandings)
    const total = stats.reduce((sum, s) => sum + s.usageRatePercent, 0)

    expect(total).toBeCloseTo(100, 5)
  })

  it('sorts by usage rate descending', () => {
    const stats = aggregateArchetypeStats(tournamentStandings)

    expect(stats[0].archetype.id).toBe(pikachuDeck.id)
  })

  it('returns an empty list for no tournaments', () => {
    expect(aggregateArchetypeStats([])).toEqual([])
  })
})
