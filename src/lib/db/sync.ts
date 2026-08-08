import { db } from './db'
import {
  fetchTcgpSeries,
  fetchSetDetails,
  fetchCardDetails,
} from '../tcgdex/client'
import type { Card, CardRecord } from '../tcgdex/types'

const SYNC_META_KEY = 'tcgp-cards'

export function mapCardToRecord(card: Card): CardRecord {
  return {
    id: card.id,
    localId: card.localId,
    name: card.name,
    image: card.image,
    category: card.category,
    rarity: card.rarity,
    hp: card.hp,
    types: card.types,
    stage: card.stage,
    attacks: card.attacks,
    retreat: card.retreat,
    setId: card.set.id,
    setName: card.set.name,
  }
}

/**
 * Voller Sync: Serie "tcgp" -> alle Sets -> alle Karten (volle Objekte, da
 * die Set-Listing-Antwort nur Kurzform ohne Typ/HP liefert). Sets werden
 * nacheinander verarbeitet, Karten innerhalb eines Sets parallel -- Kompromiss
 * zwischen Ladezeit und Rate-Limit-Schonung (siehe CLAUDE.md Tech Debt).
 */
export async function syncTcgpCards(): Promise<CardRecord[]> {
  const serie = await fetchTcgpSeries()
  const records: CardRecord[] = []

  for (const setResume of serie.sets) {
    const set = await fetchSetDetails(setResume.id)
    const cards = await Promise.all(
      set.cards.map((cardResume) => fetchCardDetails(cardResume.id)),
    )
    records.push(...cards.map(mapCardToRecord))
  }

  await db.transaction('rw', db.cards, db.meta, async () => {
    await db.cards.clear()
    await db.cards.bulkPut(records)
    await db.meta.put({ key: SYNC_META_KEY, syncedAt: Date.now() })
  })

  return records
}

export async function getCachedCards(): Promise<CardRecord[]> {
  return db.cards.toArray()
}

export async function hasCachedCards(): Promise<boolean> {
  return (await db.cards.count()) > 0
}

/**
 * Liefert die tcgp-Karten aus Dexie, synct beim ersten Laden (leerer Cache)
 * oder wenn `forceSync` gesetzt ist (manuelle Cache-Invalidierung).
 */
export async function loadTcgpCards(options?: {
  forceSync?: boolean
}): Promise<CardRecord[]> {
  if (!options?.forceSync && (await hasCachedCards())) {
    return getCachedCards()
  }
  return syncTcgpCards()
}
