/**
 * Sichtbarer Hinweis fuer Seiten mit Platzhalter-Inhalt (z.B. Impressum,
 * Datenschutz). Muss im UI bleiben, bis der jeweilige Text final ist --
 * siehe CLAUDE.md GATE "kein Produktions-Deploy vor Ersetzung durch echte
 * Texte".
 */
export function DraftBanner() {
  return (
    <div className="mb-4 rounded border border-yellow-500 bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-900 dark:border-yellow-400 dark:bg-yellow-900/40 dark:text-yellow-200">
      ⚠️ ENTWURF – nicht final
    </div>
  )
}
