export interface Deck {
  cards: string[]
}

/**
 * Ordnet einen Deck-Kartensatz einem Archetyp zu.
 *
 * Bewusst austauschbare Abstraktion (M0-Stub): Diese client-seitige
 * Heuristik ist ein MVP-Kompromiss, weil die Limitless-API keinen
 * offiziellen /decks-Endpunkt ohne API-Key liefert. Die echte Heuristik
 * kommt in M2. Sobald ein Limitless-API-Key vorliegt (siehe CLAUDE.md,
 * "Bekannte Risiken"), wird diese Funktion durch einen Aufruf des
 * /decks-Endpunkts via Proxy ersetzt -- die Signatur bleibt gleich, sodass
 * der Rest der App (Aufrufer dieser Funktion) unveraendert bleibt.
 */
export function getDeckArchetype(_deck: Deck): string {
  return 'unknown'
}
