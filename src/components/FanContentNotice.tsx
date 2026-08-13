/**
 * Permanenter Fan-Content-Disclaimer (nicht an ein "Entwurf, wird noch
 * final"-GATE wie DraftBanner gekoppelt -- bleibt dauerhaft im UI). Siehe
 * CLAUDE.md "Bekannte Risiken": Pokemon-Takedown-Historie, keine offiziellen
 * Logos/Assets, kein Bezug zu The Pokemon Company/Nintendo/Game Freak.
 */
export function FanContentNotice() {
  return (
    <p className="mb-4 border-l-2 border-line-strong pl-3 py-1 text-[11px] leading-relaxed text-text-faint">
      Inoffizielle Fan-Anwendung. Turnier- und Meta-Daten via Limitless TCG,
      Kartendaten via TCGdex. Nicht verbunden mit oder unterstuetzt durch The
      Pokemon Company, Nintendo, Game Freak oder Creatures Inc.
    </p>
  )
}
