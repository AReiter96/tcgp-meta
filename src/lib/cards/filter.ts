import type { CardRecord } from '../tcgdex/types'

export interface CardFilterQuery {
  name?: string
  type?: string
}

export function filterCards(
  cards: CardRecord[],
  query: CardFilterQuery,
): CardRecord[] {
  const name = query.name?.trim().toLowerCase()

  return cards.filter((card) => {
    if (name && !card.name.toLowerCase().includes(name)) {
      return false
    }
    if (query.type && !(card.types ?? []).includes(query.type)) {
      return false
    }
    return true
  })
}

export function getAvailableTypes(cards: CardRecord[]): string[] {
  const types = new Set<string>()
  for (const card of cards) {
    for (const type of card.types ?? []) {
      types.add(type)
    }
  }
  return Array.from(types).sort()
}
