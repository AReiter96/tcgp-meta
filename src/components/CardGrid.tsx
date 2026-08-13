import { CardTile } from './CardTile'
import type { CardRecord } from '../lib/tcgdex/types'

interface CardGridProps {
  cards: CardRecord[]
}

export function CardGrid({ cards }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <p className="border border-dashed border-line-strong p-3.5 text-center text-xs text-text-faint">
        Keine Karten gefunden.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
      {cards.map((card) => (
        <CardTile key={card.id} card={card} />
      ))}
    </ul>
  )
}
