import type { Card, CardResume, Set, SetResume, Serie } from '@tcgdex/sdk'

export type { Card, CardResume, Set, SetResume, Serie }

export const TCGP_SERIES_ID = 'tcgp'

/**
 * Flache Kartenstruktur fuer Dexie -- abgeleitet aus dem vollen TCGdex-`Card`-
 * Objekt, reduziert auf die Felder, die Browse/Such-UI und Filter brauchen.
 * Bild-URL bleibt ein reiner String-Verweis (kein Bild-Hosting/-Caching).
 */
export interface CardRecord {
  id: string
  localId: string
  name: string
  image?: string
  category: string
  rarity: string
  hp?: number
  types?: string[]
  stage?: string
  attacks?: Array<{
    cost?: string[]
    name: string
    effect?: string
    damage?: string | number
  }>
  retreat?: number
  setId: string
  setName: string
}
