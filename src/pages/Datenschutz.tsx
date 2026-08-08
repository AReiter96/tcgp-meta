import { DraftBanner } from '../components/DraftBanner'

export function Datenschutz() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <DraftBanner />
      <h1 className="text-2xl font-semibold">Datenschutz</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. TODO: echte
        Datenschutzerklaerung gemaess DSGVO einfuegen (verantwortliche Stelle,
        verarbeitete Daten, Rechtsgrundlagen, Betroffenenrechte).
      </p>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
        TODO: Angaben zu lokalem Storage (Dexie.js) und externen API-Aufrufen
        (TCGdex, Limitless) ergaenzen.
      </p>
    </div>
  )
}
