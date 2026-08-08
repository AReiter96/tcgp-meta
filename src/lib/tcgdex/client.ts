import TCGdex from '@tcgdex/sdk'
import type { Quality, Extension } from '@tcgdex/sdk'
import type { Card, Set, Serie } from './types'
import { TCGP_SERIES_ID } from './types'

const tcgdex = new TCGdex('en')

export async function fetchTcgpSeries(): Promise<Serie> {
  const serie = await tcgdex.fetch('series', TCGP_SERIES_ID)
  if (!serie) {
    throw new Error(`TCGdex: Serie "${TCGP_SERIES_ID}" nicht gefunden`)
  }
  return serie
}

export async function fetchSetDetails(setId: string): Promise<Set> {
  const set = await tcgdex.fetch('sets', setId)
  if (!set) {
    throw new Error(`TCGdex: Set "${setId}" nicht gefunden`)
  }
  return set
}

export async function fetchCardDetails(cardId: string): Promise<Card> {
  const card = await tcgdex.fetch('cards', cardId)
  if (!card) {
    throw new Error(`TCGdex: Karte "${cardId}" nicht gefunden`)
  }
  return card
}

/**
 * TCGdex liefert Bild-URLs ohne Endung -- Qualitaet/Format muss angehaengt
 * werden. Reiner String-Aufbau, kein Download/Caching des Bilds selbst.
 */
export function buildCardImageUrl(
  image: string,
  quality: Quality = 'low',
  extension: Extension = 'webp',
): string {
  return `${image}/${quality}.${extension}`
}
