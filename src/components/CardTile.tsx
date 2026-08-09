import { useState } from 'react'
import { buildCardImageUrl } from '../lib/tcgdex/client'
import type { CardRecord } from '../lib/tcgdex/types'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface CardTileProps {
  card: CardRecord
}

export function CardTile({ card }: CardTileProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const isOnline = useOnlineStatus()

  return (
    <li className="flex flex-col items-center gap-1 rounded border border-gray-200 p-2 text-center text-xs dark:border-gray-800">
      {card.image && !imageFailed ? (
        <img
          src={buildCardImageUrl(card.image, 'low', 'webp')}
          alt={card.name}
          loading="lazy"
          className="aspect-[5/7] w-full rounded object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex aspect-[5/7] w-full items-center justify-center rounded bg-gray-100 p-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          {/* Kartenbilder werden bewusst nicht offline gecacht (siehe
              CLAUDE.md) -- onError statt navigator.onLine allein, da ein
              Ladefehler auch online auftreten kann (z.B. defekter Link). */}
          {isOnline
            ? 'Bild nicht verfuegbar'
            : 'Kein Internet -- Kartenbilder sind offline nicht verfuegbar'}
        </div>
      )}
      <span className="font-medium">{card.name}</span>
      <span className="text-gray-500 dark:text-gray-400">{card.setName}</span>
    </li>
  )
}
