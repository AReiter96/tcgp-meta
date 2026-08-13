/**
 * Sichtbarer Hinweis fuer Seiten mit Platzhalter-Inhalt (z.B. Impressum,
 * Datenschutz). Muss im UI bleiben, bis der jeweilige Text final ist --
 * siehe CLAUDE.md GATE "kein Produktions-Deploy vor Ersetzung durch echte
 * Texte". Bewusst der Kontrastakzent (pink), damit er sich von der
 * neutralen FanContentNotice abhebt -- andere Bedeutung (temporaer statt
 * dauerhaft).
 */
export function DraftBanner() {
  return (
    <div className="mb-4 border-l-2 border-contrast bg-[#170D14] px-4 py-2 text-sm font-medium text-[#FFC7EA]">
      ⚠️ ENTWURF – nicht final
    </div>
  )
}
