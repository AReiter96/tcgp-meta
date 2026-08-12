export const LIMITLESS_API_BASE = 'https://play.limitlesstcg.com/api'

/**
 * Basis-URL fuer Deck-Icon-Bilder. LimitlessDeck.icons liefert nur nackte
 * Dateinamen-Fragmente (z.B. "lucario-mega"), keine vollen URLs -- eine
 * Session-lang bestand die unverifizierte Annahme, es seien bereits fertige
 * URLs (der alte Fake-Wert in den Test-Fixtures,
 * limitlesstcg.nyc3.digitaloceanspaces.com/pocket/..., war ebenfalls nur
 * geraten und liefert 403). Live verifiziert am 2026-08-12: die Fragmente
 * per Browser direkt gegen play.limitlesstcg.com/decks?game=POCKET
 * abgeglichen (dort exakt dieselben Fragment-Namen als <img src>) und
 * GET .../furfrou.png -> 200 mit echtem PNG bestaetigt.
 */
export const LIMITLESS_DECK_ICON_BASE = 'https://r2.limitlesstcg.net/pokemon/gen9'

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
  /** Username, identisch mit LimitlessPairing.player1/player2 -- Join-Schluessel fuer resolvePairings(). */
  player: string
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

/**
 * GATE-Historie: Die urspruengliche Form (seit M3) nahm player1/player2 als
 * {name, deck}-Objekte mit eingebettetem Deck und ein separates
 * outcome-Feld an -- spekuliert nach typischer TCG-Turniersoftware-
 * Konvention, nie gegen die echte API geprueft. Ein erster Live-Fund
 * (2026-08-12, Production-Crash auf /matchups) deckte auf, dass ein Freilos
 * `player2` komplett weglaesst statt `null` zu senden. Eine anschliessende
 * Live-Inspektion des Production-IndexedDB-Caches (echte /pairings-Response,
 * 2026-08-12) zeigte: die GESAMTE urspruengliche Annahme war falsch, nicht
 * nur die Freilos-Kodierung. Tatsaechliche Form:
 * - player1/player2 sind Username-STRINGS (identisch mit
 *   LimitlessStanding.player), OHNE eingebettetes Deck -- das Deck muss ueber
 *   den Username gegen die Standings desselben Turniers gejoint werden
 *   (siehe src/lib/matchups/resolvePairings.ts)
 * - kein `outcome`-Feld. Stattdessen `winner`: Username-String des
 *   Gewinners, `0` = Unentschieden, `-1` = Freilos/kein Ergebnis (player2
 *   fehlt dann zusaetzlich als Feld komplett)
 * - `phase`/`table`/optionales `match` (z.B. "T4-2" in Top-Cut-Runden,
 *   phase 2) sind vorhanden, werden aber nicht ausgewertet
 * Weiterhin unverifiziert: ob GET /tournaments/{id}/pairings wirklich ALLE
 * Runden eines Turniers in einer Response liefert (Annahme, auf der das
 * Budget von einem Request pro Turnier beruht) statt nur der aktuellen/
 * letzten Runde.
 */
export interface LimitlessPairing {
  round: number
  phase: number
  table: number | null
  /** Nur in Top-Cut-Runden (phase 2) vorhanden, z.B. "T4-2". Nicht ausgewertet. */
  match?: string
  player1: string
  /** Fehlt komplett (kein `null`) bei einem Freilos (Bye). */
  player2?: string
  /** Username des Gewinners, 0 = Unentschieden, -1 = Freilos/kein Ergebnis. */
  winner: string | 0 | -1
}
