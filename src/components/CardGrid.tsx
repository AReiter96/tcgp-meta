import { CardTile } from './CardTile'
import type { CardRecord } from '../lib/tcgdex/types'

interface CardGridProps {
  cards: CardRecord[]
}

export function CardGrid({ cards }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Keine Karten gefunden.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {cards.map((card) => (
        <CardTile key={card.id} card={card} />
      ))}
    </ul>
  )
}
