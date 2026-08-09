import Dexie, { type EntityTable } from 'dexie'
import type { CardRecord } from '../tcgdex/types'

export interface SyncMeta {
  key: string
  syncedAt: number
}

/**
 * Persistenter TTL-Cache fuer Limitless-API-Antworten (Tournaments/
 * Standings/Pairings), seit M4. `key` ist endpunkt-/turnierspezifisch
 * (siehe src/lib/limitless/cache.ts), nicht pauschal -- Ablauf wird per
 * `cachedAt` + TTL zur Lesezeit geprueft, nicht durch Loeschen abgelaufener
 * Zeilen (einfacher, keine Hintergrund-Aufraeumlogik noetig).
 */
export interface LimitlessCacheEntry {
  key: string
  data: unknown
  cachedAt: number
}

export const db = new Dexie('tcgp-meta') as Dexie & {
  cards: EntityTable<CardRecord, 'id'>
  meta: EntityTable<SyncMeta, 'key'>
  limitlessCache: EntityTable<LimitlessCacheEntry, 'key'>
}

db.version(1).stores({
  cards: 'id, name, setId, *types',
  meta: 'key',
})

// v2 (M4): additive -- neue Tabelle, bestehende Tabellen unveraendert, kein
// .upgrade() noetig.
db.version(2).stores({
  cards: 'id, name, setId, *types',
  meta: 'key',
  limitlessCache: 'key, cachedAt',
})
