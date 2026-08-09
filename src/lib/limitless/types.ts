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

export type LimitlessPairingOutcome = 'player1' | 'player2' | 'draw'

export interface LimitlessPairingPlayer {
  name: string
  deck: LimitlessDeck | null
}

/**
 * GATE (unverifiziert, seit M3): Form basiert auf typischer
 * TCG-Turniersoftware-Konvention (Swiss-Pairing pro Runde), nicht gegen eine
 * echte /pairings-Response verifiziert -- Netzwerkzugriff auf
 * play.limitlesstcg.com war in jeder bisherigen Session blockiert, wie bei
 * POCKET_GAME_ID und den Rate-Limit-Header-Namen. Insbesondere unverifiziert:
 * (1) ob GET /tournaments/{id}/pairings wirklich ALLE Runden in einer
 * Response liefert (Annahme, auf der das Budget von einem Request pro
 * Turnier beruht) statt nur der aktuellen/letzten Runde, (2) exakte
 * Feldnamen, (3) ob Freilose (Byes) als eigener Eintrag auftauchen oder ganz
 * fehlen, (4) Kodierung von "outcome". Vor Produktions-Deploy pruefen (siehe
 * CLAUDE.md "Bekannte Risiken").
 */
export interface LimitlessPairing {
  round: number
  player1: LimitlessPairingPlayer
  /** null = Freilos (Bye) -- kein zweiter Spieler, kein verwertbares Ergebnis */
  player2: LimitlessPairingPlayer | null
  /** null = Ergebnis nicht auswertbar */
  outcome: LimitlessPairingOutcome | null
}
