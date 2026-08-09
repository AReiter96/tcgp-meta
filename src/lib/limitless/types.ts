export const LIMITLESS_API_BASE = 'https://play.limitlesstcg.com/api'

/**
 * Vermutete Game-ID fuer TCG Pocket (aus der URL-Konvention
 * play.limitlesstcg.com/tournaments?game=POCKET abgeleitet). NICHT gegen
 * eine echte /games-Response verifiziert -- die Sandbox in dieser Session
 * hatte keinen Netzwerk-Zugriff auf play.limitlesstcg.com (403 CONNECT).
 * GATE: vor Produktions-Deploy per fetchGames() bestaetigen (metagame===true
 * und Name passt), siehe CLAUDE.md "Bekannte Risiken".
 */
export const POCKET_GAME_ID = 'POCKET'

export interface LimitlessGame {
  id: string
  name: string
  metagame: boolean
}

export interface LimitlessTournament {
  id: string
  game: string
  format: string
  name: string
  date: string
  players: number
}

export interface LimitlessDeck {
  id: string
  name: string
  icons: string[]
}

export interface LimitlessRecord {
  wins: number
  losses: number
  ties: number
}

export interface LimitlessStanding {
  placing: number
  deck: LimitlessDeck | null
  record: LimitlessRecord
}

/**
 * Snapshot der zuletzt beobachteten Rate-Limit-Response-Header. Header-Namen
 * sind (wie die Game-ID) nicht gegen eine echte Response verifiziert --
 * defensiv/case-insensitiv gelesen statt einen exakten Namen hart
 * anzunehmen. Nur zur Sichtbarmachung (Logging), kein hartes Blocken.
 */
export interface LimitlessRateLimitInfo {
  limit?: string
  remaining?: string
  reset?: string
  retryAfter?: string
}
