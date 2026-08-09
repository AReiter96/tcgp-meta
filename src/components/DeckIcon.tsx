import { useState } from 'react'

interface DeckIconProps {
  src: string
  className?: string
}

/**
 * `icon` kommt direkt aus Limitless' `deck.icons`-Feld, dessen genaues
 * URL-Format (M2/M3) nie live verifiziert wurde -- deshalb hier defensiv:
 * bei Ladefehler (falsches Format, CORS, tote URL, ...) ein sichtbares
 * Platzhalter-Icon statt der kaputten Bild-Box des Browsers.
 */
export function DeckIcon({
  src,
  className = 'h-6 w-6 rounded-full',
}: DeckIconProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        role="img"
        aria-label="Deck-Icon nicht verfuegbar"
        className={`flex items-center justify-center bg-gray-200 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400 ${className}`}
      >
        ?
      </span>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
