/**
 * Permanenter Fan-Content-Disclaimer (nicht an ein "Entwurf, wird noch
 * final"-GATE wie DraftBanner gekoppelt -- bleibt dauerhaft im UI). Siehe
 * CLAUDE.md "Bekannte Risiken": Pokemon-Takedown-Historie, keine offiziellen
 * Logos/Assets, kein Bezug zu The Pokemon Company/Nintendo/Game Freak.
 */
export function FanContentNotice() {
  return (
    <p className="mb-4 rounded border border-gray-300 bg-gray-50 px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
      Inoffizielle Fan-Anwendung. Turnier- und Meta-Daten via Limitless TCG,
      Kartendaten via TCGdex. Nicht verbunden mit oder unterstuetzt durch The
      Pokemon Company, Nintendo, Game Freak oder Creatures Inc.
    </p>
  )
}
