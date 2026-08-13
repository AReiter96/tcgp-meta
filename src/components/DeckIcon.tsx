import { useState } from 'react'

interface DeckIconProps {
  src: string
  className?: string
}

const HATCH_BG =
  'repeating-linear-gradient(135deg,var(--color-bg-inset),var(--color-bg-inset)_3px,#151a23_3px,#151a23_6px)'

/**
 * `icon` kommt direkt aus Limitless' `deck.icons`-Feld, dessen genaues
 * URL-Format (M2/M3) nie live verifiziert wurde -- deshalb hier defensiv:
 * bei Ladefehler (falsches Format, CORS, tote URL, ...) ein sichtbares
 * Platzhalter-Icon (Diagonal-Schraffur) statt der kaputten Bild-Box des
 * Browsers.
 */
export function DeckIcon({
  src,
  className = 'h-6 w-6 border border-line-strong',
}: DeckIconProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        role="img"
        aria-label="Deck-Icon nicht verfuegbar"
        className={`block ${className}`}
        style={{ background: HATCH_BG }}
      />
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
