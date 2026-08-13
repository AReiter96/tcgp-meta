import { DraftBanner } from '../components/DraftBanner'

export function Impressum() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <DraftBanner />
      <h1 className="text-2xl font-bold tracking-tight">Impressum</h1>
      <p className="mt-4 text-text-dim">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. TODO: echte
        Angaben gemaess §5 TMG einfuegen (Name, Anschrift, Kontakt,
        vertretungsberechtigte Person).
      </p>
      <p className="mt-4 text-text-dim">
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. TODO:
        Haftungsausschluss und Fan-Content-Disclaimer (kein offizielles
        Pokemon-Produkt) ergaenzen.
      </p>
    </div>
  )
}
