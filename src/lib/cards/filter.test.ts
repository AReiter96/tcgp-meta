import { describe, expect, it } from 'vitest'
import { filterCards, getAvailableTypes } from './filter'
import type { CardRecord } from '../tcgdex/types'

const cards: CardRecord[] = [
  {
    id: 'A1-001',
    localId: '001',
    name: 'Pikachu',
    category: 'Pokemon',
    rarity: 'Common',
    types: ['Lightning'],
    setId: 'A1',
    setName: 'Genetic Apex',
  },
  {
    id: 'A1-002',
    localId: '002',
    name: 'Bulbasaur',
    category: 'Pokemon',
    rarity: 'Common',
    types: ['Grass'],
    setId: 'A1',
    setName: 'Genetic Apex',
  },
  {
    id: 'A1-003',
    localId: '003',
    name: "Professor's Research",
    category: 'Trainer',
    rarity: 'Uncommon',
    setId: 'A1',
    setName: 'Genetic Apex',
  },
]

describe('filterCards', () => {
  it('returns all cards when no filter is given', () => {
    expect(filterCards(cards, {})).toHaveLength(3)
  })

  it('filters case-insensitively by name substring', () => {
    expect(filterCards(cards, { name: 'pika' }).map((c) => c.id)).toEqual([
      'A1-001',
    ])
  })

  it('filters by type', () => {
    expect(filterCards(cards, { type: 'Grass' }).map((c) => c.id)).toEqual([
      'A1-002',
    ])
  })

  it('combines name and type filters', () => {
    expect(
      filterCards(cards, { name: 'bulba', type: 'Lightning' }),
    ).toHaveLength(0)
  })

  it('excludes cards without types when filtering by type', () => {
    expect(filterCards(cards, { type: 'Grass' })).not.toContainEqual(
      expect.objectContaining({ id: 'A1-003' }),
    )
  })
})

describe('getAvailableTypes', () => {
  it('collects unique, sorted types across all cards', () => {
    expect(getAvailableTypes(cards)).toEqual(['Grass', 'Lightning'])
  })
})
