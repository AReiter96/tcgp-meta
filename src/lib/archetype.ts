import type { LimitlessDeck } from './limitless/types'

export interface DeckArchetype {
  id: string
  name: string
  icons: string[]
}

const UNKNOWN_ARCHETYPE: DeckArchetype = {
  id: 'unknown',
  name: 'Unbekannt',
  icons: [],
}

/**
 * Liest das von Limitless bereits kategorisierte `deck`-Feld aus einem
 * Standings-Eintrag durch. Limitless liefert die Archetyp-Zuordnung selbst
 * (GET /tournaments/{id}/standings) -- keine eigene Kartenlisten-Heuristik
 * noetig (Korrektur ggue. urspruenglicher M0-Planung). Fehlt `deck` oder hat
 * keine gueltige id (null/undefined/leerer String), ist der Eintrag nicht
 * kategorisierbar: stabiler Fallback statt Raten oder Absturz.
 */
export function getDeckArchetype(
  deck: LimitlessDeck | null | undefined,
): DeckArchetype {
  if (!deck?.id) {
    return UNKNOWN_ARCHETYPE
  }
  return { id: deck.id, name: deck.name, icons: deck.icons ?? [] }
}
