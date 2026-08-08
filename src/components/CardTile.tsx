import { buildCardImageUrl } from '../lib/tcgdex/client'
import type { CardRecord } from '../lib/tcgdex/types'

interface CardTileProps {
  card: CardRecord
}

export function CardTile({ card }: CardTileProps) {
  return (
    <li className="flex flex-col items-center gap-1 rounded border border-gray-200 p-2 text-center text-xs dark:border-gray-800">
      {card.image && (
        <img
          src={buildCardImageUrl(card.image, 'low', 'webp')}
          alt={card.name}
          loading="lazy"
          className="aspect-[5/7] w-full rounded object-cover"
        />
      )}
      <span className="font-medium">{card.name}</span>
      <span className="text-gray-500 dark:text-gray-400">{card.setName}</span>
    </li>
  )
}
