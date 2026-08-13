import { describe, expect, it } from 'vitest'
import { groupIntoTiers } from './tiers'
import type { ArchetypeStats } from './aggregate'

function stat(
  id: string,
  winratePercent: number,
  usageRatePercent: number,
): ArchetypeStats {
  return {
    archetype: { id, name: id, icons: [] },
    playerCount: 10,
    tournamentCount: 5,
    wins: 0,
    losses: 0,
    ties: 0,
    usageRatePercent,
    winratePercent,
  }
}

describe('groupIntoTiers', () => {
  it('places a deck meeting both S thresholds in S', () => {
    const groups = groupIntoTiers([stat('a', 52, 2.5)])
    expect(groups).toEqual([
      expect.objectContaining({ label: 'S', count: 1 }),
    ])
  })

  it('falls back to A when winrate qualifies for S but usage does not', () => {
    const groups = groupIntoTiers([stat('a', 52, 2.4)])
    expect(groups[0].label).toBe('A')
  })

  it('falls back to A when usage qualifies for S but winrate does not', () => {
    const groups = groupIntoTiers([stat('a', 51.9, 2.5)])
    expect(groups[0].label).toBe('A')
  })

  it('places exactly 50 winrate in A', () => {
    expect(groupIntoTiers([stat('a', 50, 0)])[0].label).toBe('A')
  })

  it('places just under 50 winrate in B', () => {
    expect(groupIntoTiers([stat('a', 49.9, 0)])[0].label).toBe('B')
  })

  it('places exactly 46 winrate in B', () => {
    expect(groupIntoTiers([stat('a', 46, 0)])[0].label).toBe('B')
  })

  it('places under 46 winrate in C', () => {
    expect(groupIntoTiers([stat('a', 45.9, 0)])[0].label).toBe('C')
  })

  it('orders groups S, A, B, C and omits empty tiers', () => {
    const groups = groupIntoTiers([
      stat('b1', 47, 0),
      stat('c1', 10, 0),
      stat('s1', 60, 5),
    ])
    expect(groups.map((g) => g.label)).toEqual(['S', 'B', 'C'])
  })

  it('counts decks per tier and preserves them in the group', () => {
    const groups = groupIntoTiers([stat('b1', 47, 0), stat('b2', 48, 0)])
    expect(groups[0]).toMatchObject({ label: 'B', count: 2 })
    expect(groups[0].decks.map((d) => d.archetype.id).sort()).toEqual([
      'b1',
      'b2',
    ])
  })
})
