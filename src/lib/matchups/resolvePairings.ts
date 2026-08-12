import { getDeckArchetype, type DeckArchetype } from '../archetype'
import type {
  LimitlessDeck,
  LimitlessPairing,
  LimitlessPairingOutcome,
  LimitlessStanding,
} from '../limitless/types'

export interface ResolvedPairing {
  archetype1: DeckArchetype
  archetype2: DeckArchetype
  outcome: LimitlessPairingOutcome
}

function resolveOutcome(
  pairing: LimitlessPairing,
): LimitlessPairingOutcome | null {
  if (pairing.winner === 0) {
    return 'draw'
  }
  if (pairing.winner === pairing.player1) {
    return 'player1'
  }
  if (pairing.winner === pairing.player2) {
    return 'player2'
  }
  return null
}

/**
 * Loest die Roh-Pairings-Form der Limitless-API (player1/player2 sind
 * Username-Strings ohne Deck-Info, siehe Doc-Comment an LimitlessPairing) in
 * archetyp-fertige Paarungen auf, per Join gegen die Standings DESSELBEN
 * Turniers (LimitlessStanding.player). Bewusst pro Turnier aufgeloest statt
 * ueber alle Turniere hinweg gemeinsam gejoint -- ein Username kann in
 * unterschiedlichen Turnieren unterschiedliche Decks gespielt haben, ein
 * turnierweit gemeinsamer Lookup wuerde das verwaschen.
 *
 * Uebersprungen werden: Freilose (player2 fehlt komplett) und Pairings ohne
 * auswertbaren Gewinner (winner passt zu keinem der beiden Spieler, z.B.
 * winner: -1 ausserhalb eines Freilos). Ein Spieler ohne Standings-Eintrag
 * (Dateninkonsistenz) faellt auf den Archetyp "Unbekannt" zurueck statt zu
 * werfen, analog zu getDeckArchetype()s bestehendem Fallback-Verhalten.
 */
export function resolvePairings(
  pairings: LimitlessPairing[],
  standings: LimitlessStanding[],
): ResolvedPairing[] {
  const deckByPlayer = new Map<string, LimitlessDeck | null>(
    standings.map((entry) => [entry.player, entry.deck]),
  )

  const resolved: ResolvedPairing[] = []
  for (const pairing of pairings) {
    if (pairing.player2 === undefined) {
      continue
    }
    const outcome = resolveOutcome(pairing)
    if (outcome === null) {
      continue
    }
    resolved.push({
      archetype1: getDeckArchetype(deckByPlayer.get(pairing.player1) ?? null),
      archetype2: getDeckArchetype(deckByPlayer.get(pairing.player2) ?? null),
      outcome,
    })
  }
  return resolved
}
