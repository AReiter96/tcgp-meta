import { useState } from 'react'
import { buildCardImageUrl } from '../lib/tcgdex/client'
import type { CardRecord } from '../lib/tcgdex/types'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface CardTileProps {
  card: CardRecord
}

const HATCH_BG =
  'repeating-linear-gradient(135deg,var(--color-bg-raised),var(--color-bg-raised)_4px,var(--color-bg-base)_4px,var(--color-bg-base)_8px)'

export function CardTile({ card }: CardTileProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const isOnline = useOnlineStatus()

  return (
    <li className="flex flex-col gap-2 text-xs">
      {card.image && !imageFailed ? (
        <div
          className="aspect-[5/7] w-full border border-line-strong"
          style={imageLoaded ? undefined : { background: HATCH_BG }}
        >
          <img
            src={buildCardImageUrl(card.image, 'low', 'webp')}
            alt={card.name}
            loading="lazy"
            className={`h-full w-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <div className="flex aspect-[5/7] w-full flex-col items-center justify-center gap-1.5 border border-dashed border-line-strong bg-bg-panel p-2 text-center">
          <div className="font-mono text-[9px] tracking-[0.1em] text-text-dim">
            BILD FEHLT
          </div>
          <div className="text-[11px] leading-snug text-text-faint">
            {/* Kartenbilder werden bewusst nicht offline gecacht (siehe
                CLAUDE.md) -- onError statt navigator.onLine allein, da ein
                Ladefehler auch online auftreten kann (z.B. defekter Link). */}
            {isOnline
              ? 'Bild nicht verfuegbar'
              : 'Kein Internet -- Kartenbilder sind offline nicht verfuegbar'}
          </div>
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        <span className="truncate text-[12px] font-medium text-text">
          {card.name}
        </span>
        <span className="truncate font-mono text-[10px] text-text-faint">
          {card.setName}
        </span>
      </div>
    </li>
  )
}
