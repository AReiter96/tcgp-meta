import { describe, expect, it } from 'vitest'
import { resolvePairings } from './resolvePairings'
import type {
  LimitlessDeck,
  LimitlessPairing,
  LimitlessStanding,
} from '../limitless/types'

function deck(id: string): LimitlessDeck {
  return { id, name: id, icons: [] }
}

function standing(player: string, d: LimitlessDeck | null): LimitlessStanding {
  return {
    placing: 1,
    player,
    deck: d,
    record: { wins: 0, losses: 0, ties: 0 },
  }
}

const deckA = deck('deck-a')
const deckB = deck('deck-b')

describe('resolvePairings', () => {
  it('resolves a player1 win via the username join against standings', () => {
    const pairings: LimitlessPairing[] = [
      {
        round: 1,
        phase: 1,
        table: 1,
        player1: 'alice',
        player2: 'bob',
        winner: 'alice',
      },
    ]
    const standings = [standing('alice', deckA), standing('bob', deckB)]

    const result = resolvePairings(pairings, standings)

    expect(result).toEqual([
      {
        archetype1: { id: 'deck-a', name: 'deck-a', icons: [] },
        archetype2: { id: 'deck-b', name: 'deck-b', icons: [] },
        outcome: 'player1',
      },
    ])
  })

  it('resolves a player2 win', () => {
    const pairings: LimitlessPairing[] = [
      {
        round: 1,
        phase: 1,
        table: 1,
        player1: 'alice',
        player2: 'bob',
        winner: 'bob',
      },
    ]
    const standings = [standing('alice', deckA), standing('bob', deckB)]

    const [result] = resolvePairings(pairings, standings)

    expect(result.outcome).toBe('player2')
  })

  it('resolves winner: 0 as a draw', () => {
    const pairings: LimitlessPairing[] = [
      {
        round: 1,
        phase: 1,
        table: 1,
        player1: 'alice',
        player2: 'bob',
        winner: 0,
      },
    ]
    const standings = [standing('alice', deckA), standing('bob', deckB)]

    const [result] = resolvePairings(pairings, standings)

    expect(result.outcome).toBe('draw')
  })

  it('skips a bye (player2 field missing entirely) without throwing -- regression for the 2026-08-12 production crash', () => {
    const pairings: LimitlessPairing[] = [
      { round: 1, phase: 1, table: null, player1: 'alice', winner: -1 },
    ]
    const standings = [standing('alice', deckA)]

    expect(() => resolvePairings(pairings, standings)).not.toThrow()
    expect(resolvePairings(pairings, standings)).toHaveLength(0)
  })

  it('skips a pairing whose winner matches neither player', () => {
    const pairings: LimitlessPairing[] = [
      {
        round: 1,
        phase: 1,
        table: 1,
        player1: 'alice',
        player2: 'bob',
        winner: -1,
      },
    ]
    const standings = [standing('alice', deckA), standing('bob', deckB)]

    expect(resolvePairings(pairings, standings)).toHaveLength(0)
  })

  it('falls back to the "Unbekannt" archetype for a player missing from standings', () => {
    const pairings: LimitlessPairing[] = [
      {
        round: 1,
        phase: 1,
        table: 1,
        player1: 'alice',
        player2: 'ghost',
        winner: 'alice',
      },
    ]
    const standings = [standing('alice', deckA)]

    const [result] = resolvePairings(pairings, standings)

    expect(result.archetype2.id).toBe('unknown')
  })

  it('falls back to the "Unbekannt" archetype for a standings entry with deck: null', () => {
    const pairings: LimitlessPairing[] = [
      {
        round: 1,
        phase: 1,
        table: 1,
        player1: 'alice',
        player2: 'bob',
        winner: 'alice',
      },
    ]
    const standings = [standing('alice', deckA), standing('bob', null)]

    const [result] = resolvePairings(pairings, standings)

    expect(result.archetype2.id).toBe('unknown')
  })

  it('pools multiple pairings independently, preserving order', () => {
    const pairings: LimitlessPairing[] = [
      {
        round: 1,
        phase: 1,
        table: 1,
        player1: 'alice',
        player2: 'bob',
        winner: 'alice',
      },
      { round: 1, phase: 1, table: null, player1: 'carol', winner: -1 }, // bye, skipped
      {
        round: 2,
        phase: 1,
        table: 1,
        player1: 'alice',
        player2: 'carol',
        winner: 0,
      },
    ]
    const standings = [
      standing('alice', deckA),
      standing('bob', deckB),
      standing('carol', deckB),
    ]

    const result = resolvePairings(pairings, standings)

    expect(result).toHaveLength(2)
    expect(result[0].outcome).toBe('player1')
    expect(result[1].outcome).toBe('draw')
  })
})
