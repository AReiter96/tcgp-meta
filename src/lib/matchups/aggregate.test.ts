import { describe, expect, it } from 'vitest'
import { aggregateMatchupStats, MIN_MATCHUP_SAMPLE_SIZE } from './aggregate'
import type { ArchetypeStats } from '../tierlist/aggregate'
import type {
  LimitlessDeck,
  LimitlessPairing,
  LimitlessPairingOutcome,
} from '../limitless/types'

function deck(id: string): LimitlessDeck {
  return { id, name: id, icons: [] }
}

function stats(
  archetypeDeck: LimitlessDeck,
  usageRatePercent: number,
): ArchetypeStats {
  return {
    archetype: { id: archetypeDeck.id, name: archetypeDeck.name, icons: [] },
    playerCount: 1,
    tournamentCount: 1,
    wins: 0,
    losses: 0,
    ties: 0,
    usageRatePercent,
    winratePercent: 0,
  }
}

// b='bye': kein zweiter Spieler, player2-Feld explizit null. b='bye-missing':
// kein zweiter Spieler, player2-Feld komplett fehlend (undefined) -- die
// laut Live-Fund vom 2026-08-12 tatsaechlich von der API verwendete Kodierung.
// b=null: zweiter Spieler mit unkategorisiertem Deck (player2.deck: null,
// wird zu Archetyp "Unbekannt").
function pairing(
  a: LimitlessDeck | null,
  b: LimitlessDeck | null | 'bye' | 'bye-missing',
  outcome: LimitlessPairingOutcome | null,
  round = 1,
): LimitlessPairing {
  const base = {
    round,
    player1: { name: 'P1', deck: a },
    outcome,
  }
  if (b === 'bye-missing') {
    return base as LimitlessPairing
  }
  return {
    ...base,
    player2: b === 'bye' ? null : { name: 'P2', deck: b },
  }
}

function repeat<T>(times: number, factory: () => T): T[] {
  return Array.from({ length: times }, factory)
}

const deckA = deck('deck-a')
const deckB = deck('deck-b')
const deckC = deck('deck-c')
const deckD = deck('deck-d')
const deckE = deck('deck-e')
const deckF = deck('deck-f') // 6. Rang -- ausserhalb Top-5-Gegner
const heroDeck = deck('hero')
const unknownArchetypeDeck = deck('unknown')

const top5UsageStats: ArchetypeStats[] = [
  stats(deckA, 30),
  stats(deckB, 20),
  stats(deckC, 15),
  stats(deckD, 10),
  stats(deckE, 5),
]

describe('aggregateMatchupStats', () => {
  it('pools wins/losses/ties across multiple pairings into one matchup cell', () => {
    const pairings: LimitlessPairing[] = [
      pairing(heroDeck, deckA, 'player1'),
      pairing(heroDeck, deckA, 'player1'),
      pairing(heroDeck, deckA, 'player2'),
      pairing(heroDeck, deckA, 'draw'),
    ]
    const usageStats = [...top5UsageStats, stats(heroDeck, 4)]

    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!
    const vsA = hero.matchups.find((m) => m.opponent.id === deckA.id)!

    expect(vsA.wins).toBe(2)
    expect(vsA.losses).toBe(1)
    expect(vsA.ties).toBe(1)
    expect(vsA.gamesPlayed).toBe(4)
  })

  it('weights the Counter-Meta-Score by actual opponent frequency, not an unweighted average of the 5 matchup percentages', () => {
    const pairings: LimitlessPairing[] = [
      ...repeat(18, () => pairing(heroDeck, deckA, 'player1')),
      ...repeat(2, () => pairing(heroDeck, deckA, 'player2')),
      ...repeat(1, () => pairing(heroDeck, deckB, 'player1')),
      ...repeat(4, () => pairing(heroDeck, deckB, 'player2')),
    ]
    const usageStats = [...top5UsageStats, stats(heroDeck, 4)]

    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!

    // Naiver Durchschnitt der beiden Einzelprozentsaetze waere (90% + 20%) / 2 = 55%.
    // Gepoolt (nach tatsaechlicher Haeufigkeit gewichtet): 19 Siege von 25 Spielen = 76%.
    expect(hero.counterMetaScorePercent).toBeCloseTo(76, 5)
    expect(hero.counterMetaScorePercent).not.toBeCloseTo(55, 1)
  })

  it('flags a below-threshold individual matchup as insufficient but still counts its games in the aggregate score', () => {
    const pairings: LimitlessPairing[] = [
      ...repeat(3, () => pairing(heroDeck, deckA, 'player1')),
      ...repeat(5, () => pairing(heroDeck, deckB, 'player1')),
    ]
    const usageStats = [...top5UsageStats, stats(heroDeck, 4)]

    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!
    const vsA = hero.matchups.find((m) => m.opponent.id === deckA.id)!

    expect(vsA.gamesPlayed).toBe(3)
    expect(vsA.hasSufficientData).toBe(false)
    expect(vsA.winratePercent).toBeNull()
    // Gesamtstichprobe (3 + 5 = 8) liegt ueber der Schwelle und zaehlt die
    // 3 Spiele gegen deckA trotzdem mit.
    expect(hero.gamesPlayed).toBe(8)
    expect(hero.hasSufficientData).toBe(true)
    expect(hero.counterMetaScorePercent).toBeCloseTo(100, 5)
  })

  it('per-matchup threshold: exactly 4 games is insufficient, exactly 5 is not', () => {
    const pairings: LimitlessPairing[] = [
      ...repeat(4, () => pairing(heroDeck, deckA, 'player1')),
      ...repeat(5, () => pairing(heroDeck, deckB, 'player1')),
    ]
    const usageStats = [...top5UsageStats, stats(heroDeck, 4)]

    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!
    const vsA = hero.matchups.find((m) => m.opponent.id === deckA.id)!
    const vsB = hero.matchups.find((m) => m.opponent.id === deckB.id)!

    expect(vsA.gamesPlayed).toBe(MIN_MATCHUP_SAMPLE_SIZE - 1)
    expect(vsA.hasSufficientData).toBe(false)
    expect(vsB.gamesPlayed).toBe(MIN_MATCHUP_SAMPLE_SIZE)
    expect(vsB.hasSufficientData).toBe(true)
  })

  it('aggregate threshold: exactly 4 total games vs top-5 is insufficient, exactly 5 is not', () => {
    const usageStats = [...top5UsageStats, stats(heroDeck, 4)]

    const belowThreshold = aggregateMatchupStats(
      [
        ...repeat(2, () => pairing(heroDeck, deckA, 'player1')),
        ...repeat(2, () => pairing(heroDeck, deckB, 'player1')),
      ],
      usageStats,
    ).find((r) => r.archetype.id === heroDeck.id)!
    expect(belowThreshold.gamesPlayed).toBe(4)
    expect(belowThreshold.hasSufficientData).toBe(false)
    expect(belowThreshold.counterMetaScorePercent).toBeNull()

    const atThreshold = aggregateMatchupStats(
      [
        ...repeat(3, () => pairing(heroDeck, deckA, 'player1')),
        ...repeat(2, () => pairing(heroDeck, deckB, 'player1')),
      ],
      usageStats,
    ).find((r) => r.archetype.id === heroDeck.id)!
    expect(atThreshold.gamesPlayed).toBe(5)
    expect(atThreshold.hasSufficientData).toBe(true)
    expect(atThreshold.counterMetaScorePercent).toBeCloseTo(100, 5)
  })

  it('only considers the top-5 usage-rate archetypes as opponents, ignoring games against rank 6+', () => {
    const pairings: LimitlessPairing[] = [
      ...repeat(10, () => pairing(heroDeck, deckA, 'player1')),
      ...repeat(10, () => pairing(heroDeck, deckF, 'player2')),
    ]
    const usageStats = [...top5UsageStats, stats(deckF, 3), stats(heroDeck, 2)]

    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!

    expect(hero.matchups).toHaveLength(5)
    expect(hero.matchups.some((m) => m.opponent.id === deckF.id)).toBe(false)
    expect(hero.gamesPlayed).toBe(10)
    expect(hero.counterMetaScorePercent).toBeCloseTo(100, 5)
  })

  it('excludes "Unbekannt" from the top-5 opponent set', () => {
    const usageStats = [
      stats(deckA, 30),
      stats(unknownArchetypeDeck, 25), // hoehere Nutzungsrate als B-E, darf trotzdem nicht als Gegner zaehlen
      stats(deckB, 20),
      stats(deckC, 15),
      stats(deckD, 10),
      stats(deckE, 5),
      stats(heroDeck, 2),
    ]
    const pairings: LimitlessPairing[] = [
      ...repeat(10, () => pairing(heroDeck, deckA, 'player1')),
      ...repeat(20, () => pairing(heroDeck, null, 'player2')), // Gegner mit unkategorisiertem Deck
    ]

    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!

    expect(hero.matchups.some((m) => m.opponent.id === 'unknown')).toBe(false)
    // Nur die 10 Spiele gegen deckA zaehlen, die 20 gegen Unbekannt nicht.
    expect(hero.gamesPlayed).toBe(10)
  })

  it('never returns "Unbekannt" as an own-deck row, even with a large sample', () => {
    const pairings: LimitlessPairing[] = repeat(20, () =>
      pairing(null, deckA, 'player2'),
    )
    const usageStats = [stats(unknownArchetypeDeck, 40), ...top5UsageStats]

    const result = aggregateMatchupStats(pairings, usageStats)

    expect(result.some((r) => r.archetype.id === 'unknown')).toBe(false)
  })

  it('skips bye pairings (player2: null) without throwing or miscounting', () => {
    const pairings: LimitlessPairing[] = [
      pairing(heroDeck, 'bye', null),
      ...repeat(5, () => pairing(heroDeck, deckA, 'player1')),
    ]
    const usageStats = [...top5UsageStats, stats(heroDeck, 4)]

    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!

    expect(hero.gamesPlayed).toBe(5)
  })

  it('skips bye pairings with a missing player2 field (undefined) without throwing or miscounting -- regression for the 2026-08-12 production crash', () => {
    const pairings: LimitlessPairing[] = [
      pairing(heroDeck, 'bye-missing', null),
      ...repeat(5, () => pairing(heroDeck, deckA, 'player1')),
    ]
    const usageStats = [...top5UsageStats, stats(heroDeck, 4)]

    expect(() => aggregateMatchupStats(pairings, usageStats)).not.toThrow()
    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!

    expect(hero.gamesPlayed).toBe(5)
  })

  it('skips pairings with outcome: null without throwing or miscounting', () => {
    const pairings: LimitlessPairing[] = [
      pairing(heroDeck, deckA, null),
      ...repeat(5, () => pairing(heroDeck, deckA, 'player1')),
    ]
    const usageStats = [...top5UsageStats, stats(heroDeck, 4)]

    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!

    expect(hero.gamesPlayed).toBe(5)
  })

  it('limits own-deck rows to the top 15 by usage rate', () => {
    const decks = Array.from({ length: 16 }, (_, i) => deck(`deck-${i}`))
    const usageStats = decks.map((d, i) => stats(d, 100 - i))
    const pairings: LimitlessPairing[] = decks.flatMap((d, i) =>
      repeat(5, () => pairing(d, decks[(i + 1) % decks.length], 'player1')),
    )

    const result = aggregateMatchupStats(pairings, usageStats)

    expect(result).toHaveLength(15)
    expect(result.some((r) => r.archetype.id === 'deck-15')).toBe(false)
  })

  it('pools mirror matches (own archetype also present in its own top-5 opponent set) instead of excluding them from the breakdown', () => {
    const pairings: LimitlessPairing[] = repeat(5, () =>
      pairing(deckA, deckA, 'player1'),
    )

    const result = aggregateMatchupStats(pairings, top5UsageStats)
    const a = result.find((r) => r.archetype.id === deckA.id)!
    const vsSelf = a.matchups.find((m) => m.opponent.id === deckA.id)!

    // Spiegel-Matchup: player1- und player2-Zelle sind identisch, jede
    // Pairing traegt daher sowohl einen Sieg als auch eine Niederlage in
    // dieselbe Zelle ein (siehe Doc-Comment an aggregateMatchupStats) --
    // Winrate ist tautologisch 50%, die Daten werden aber weiterhin in der
    // Detailaufschluesselung gezeigt (isMirrorMatchup: true), nicht
    // stillschweigend weggelassen.
    expect(vsSelf.gamesPlayed).toBe(10)
    expect(vsSelf.wins).toBe(5)
    expect(vsSelf.losses).toBe(5)
    expect(vsSelf.winratePercent).toBeCloseTo(50, 5)
    expect(vsSelf.isMirrorMatchup).toBe(true)

    // Nur der Spiegel-Gegner ist als Spiegel markiert, die uebrigen
    // Top-5-Gegner (ohne Partien) nicht.
    const others = a.matchups.filter((m) => m.opponent.id !== deckA.id)
    expect(others.every((m) => m.isMirrorMatchup === false)).toBe(true)
  })

  it('excludes the mirror matchup from the Counter-Meta-Score, keeping only the non-mirror top-5 opponents', () => {
    const pairings: LimitlessPairing[] = [
      ...repeat(5, () => pairing(deckA, deckA, 'player1')), // Spiegel: 5 Siege, 5 Niederlagen, tautologisch 50%
      ...repeat(5, () => pairing(deckA, deckB, 'player1')), // 5 echte Siege gegen deckB
    ]

    const result = aggregateMatchupStats(pairings, top5UsageStats)
    const a = result.find((r) => r.archetype.id === deckA.id)!

    // Ohne Spiegel-Ausschluss waeren es (5 Siege Spiegel + 5 Siege vs B) von
    // (10 Spiegel-Spiele + 5 Spiele vs B) = 10/15 = 66.67%. Mit Ausschluss
    // zaehlen nur die 5 Spiele gegen deckB: 5/5 = 100%.
    expect(a.gamesPlayed).toBe(5)
    expect(a.counterMetaScorePercent).toBeCloseTo(100, 5)
    expect(a.counterMetaScorePercent).not.toBeCloseTo(200 / 3, 1)
  })

  it('has insufficient aggregate data when only mirror games are present, even though the raw total incl. mirror clears the threshold', () => {
    const pairings: LimitlessPairing[] = repeat(5, () =>
      pairing(deckA, deckA, 'player1'),
    )

    const result = aggregateMatchupStats(pairings, top5UsageStats)
    const a = result.find((r) => r.archetype.id === deckA.id)!

    // Roh-Stichprobe inkl. Spiegel waere 10 Spiele (ueber der Schwelle von
    // 5), aber ohne die Spiegel-Spiele bleiben 0 zaehlbare Spiele uebrig.
    expect(a.gamesPlayed).toBe(0)
    expect(a.hasSufficientData).toBe(false)
    expect(a.counterMetaScorePercent).toBeNull()
  })

  it('never marks a matchup as mirror for a rank 6-15 archetype, since its own archetype never appears in its own top-5 opponent set', () => {
    const pairings: LimitlessPairing[] = [
      ...repeat(10, () => pairing(heroDeck, deckA, 'player1')),
      ...repeat(10, () => pairing(heroDeck, heroDeck, 'player1')),
    ]
    const usageStats = [...top5UsageStats, stats(heroDeck, 4)]

    const result = aggregateMatchupStats(pairings, usageStats)
    const hero = result.find((r) => r.archetype.id === heroDeck.id)!

    expect(hero.matchups.every((m) => m.isMirrorMatchup === false)).toBe(true)
    // heroDeck ist nicht in den Top-5-Gegnern, also zaehlen weiterhin nur
    // die 10 Spiele gegen deckA (die 10 Spiele gegen sich selbst sind kein
    // Top-5-Matchup und tauchen ueberhaupt nicht in matchups[] auf).
    expect(hero.gamesPlayed).toBe(10)
  })

  it('sorts by Counter-Meta-Score descending, with insufficient-data entries last in stable usage-rate order', () => {
    const heroHigh = deck('hero-high')
    const heroMid = deck('hero-mid')
    const heroNone = deck('hero-none')
    const usageStats = [
      ...top5UsageStats,
      stats(heroHigh, 4),
      stats(heroMid, 3),
      stats(heroNone, 2),
    ]
    const pairings: LimitlessPairing[] = [
      ...repeat(5, () => pairing(heroHigh, deckA, 'player1')), // 100%
      ...repeat(3, () => pairing(heroMid, deckB, 'player1')),
      ...repeat(2, () => pairing(heroMid, deckB, 'player2')), // 60%
      // heroNone spielt keine Partien -> insufficient data
    ]

    const result = aggregateMatchupStats(pairings, usageStats)
    const ids = result.map((r) => r.archetype.id)

    expect(ids[0]).toBe(heroHigh.id)
    expect(ids[1]).toBe(heroMid.id)
    // A-E und heroNone haben keine erfassten Partien -> insufficient data,
    // Reihenfolge bleibt die urspruengliche Nutzungsrate-Reihenfolge.
    expect(ids.slice(2)).toEqual([
      deckA.id,
      deckB.id,
      deckC.id,
      deckD.id,
      deckE.id,
      heroNone.id,
    ])
    expect(result.slice(2).every((r) => r.hasSufficientData === false)).toBe(
      true,
    )
  })

  it('returns an empty list for no pairings/usage stats', () => {
    expect(aggregateMatchupStats([], [])).toEqual([])
    expect(aggregateMatchupStats([], top5UsageStats)).toEqual(
      top5UsageStats.map((s) =>
        expect.objectContaining({
          archetype: s.archetype,
          hasSufficientData: false,
        }),
      ),
    )
  })
})
