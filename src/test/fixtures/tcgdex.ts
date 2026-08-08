import type { Card, CardResume, Serie, Set } from '../../lib/tcgdex/types'

export const pikachuCardFixture: Card = {
  id: 'A1-001',
  localId: '001',
  name: 'Pikachu',
  image: 'https://assets.tcgdex.net/en/tcgp/A1/001',
  category: 'Pokemon',
  rarity: 'Common',
  hp: 60,
  types: ['Lightning'],
  stage: 'Basic',
  attacks: [{ cost: ['Lightning'], name: 'Gnaw', damage: 20 }],
  retreat: 1,
  legal: { standard: true, expanded: true },
  set: {
    id: 'A1',
    name: 'Genetic Apex',
    cardCount: { total: 286, official: 286 },
  },
}

export const bulbasaurCardFixture: Card = {
  id: 'A1-002',
  localId: '002',
  name: 'Bulbasaur',
  image: 'https://assets.tcgdex.net/en/tcgp/A1/002',
  category: 'Pokemon',
  rarity: 'Common',
  hp: 70,
  types: ['Grass'],
  stage: 'Basic',
  attacks: [],
  retreat: 1,
  legal: { standard: true, expanded: true },
  set: {
    id: 'A1',
    name: 'Genetic Apex',
    cardCount: { total: 286, official: 286 },
  },
}

export const tcgpSetResumeFixture: Set['cards'][number] = {
  id: 'A1-001',
  localId: '001',
  name: 'Pikachu',
  image: 'https://assets.tcgdex.net/en/tcgp/A1/001',
}

export const tcgpSetFixture: Set = {
  id: 'A1',
  name: 'Genetic Apex',
  cardCount: {
    total: 2,
    official: 2,
    normal: 2,
    reverse: 0,
    holo: 0,
  },
  serie: { id: 'tcgp', name: 'TCG Pocket' },
  releaseDate: '2024-10-30',
  legal: { standard: true, expanded: true },
  cards: [
    tcgpSetResumeFixture,
    {
      id: 'A1-002',
      localId: '002',
      name: 'Bulbasaur',
      image: 'https://assets.tcgdex.net/en/tcgp/A1/002',
    } satisfies CardResume,
  ],
}

export const tcgpSerieFixture: Serie = {
  id: 'tcgp',
  name: 'TCG Pocket',
  sets: [
    {
      id: 'A1',
      name: 'Genetic Apex',
      cardCount: { total: 2, official: 2 },
    },
  ],
}
