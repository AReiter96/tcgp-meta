import Dexie, { type EntityTable } from 'dexie'
import type { CardRecord } from '../tcgdex/types'

export interface SyncMeta {
  key: string
  syncedAt: number
}

export const db = new Dexie('tcgp-meta') as Dexie & {
  cards: EntityTable<CardRecord, 'id'>
  meta: EntityTable<SyncMeta, 'key'>
}

db.version(1).stores({
  cards: 'id, name, setId, *types',
  meta: 'key',
})
