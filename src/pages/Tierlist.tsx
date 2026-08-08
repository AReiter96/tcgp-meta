import { useTierlist } from '../hooks/useTierlist'
import { FanContentNotice } from '../components/FanContentNotice'

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function Tierlist() {
  const { stats, isLoading, isError, error, refetch, isRefetching } =
    useTierlist()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <FanContentNotice />

      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Tierlist</h1>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          {isRefetching ? 'Aktualisiere...' : 'Aktualisieren'}
        </button>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lade Turnierdaten...
        </p>
      )}

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Turnierdaten konnten nicht geladen werden
          {error instanceof Error ? `: ${error.message}` : ''}.
        </p>
      )}

      {!isLoading && !isError && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left dark:border-gray-700">
              <th className="py-2 pr-2">Archetyp</th>
              <th className="py-2 pr-2">Nutzungsrate</th>
              <th className="py-2 pr-2">Winrate</th>
              <th className="py-2">Stichprobe</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((entry) => (
              <tr
                key={entry.archetype.id}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    {entry.archetype.icons.map((icon) => (
                      <img
                        key={icon}
                        src={icon}
                        alt=""
                        className="h-6 w-6 rounded-full"
                      />
                    ))}
                    <span>{entry.archetype.name}</span>
                  </div>
                </td>
                <td className="py-2 pr-2">
                  {formatPercent(entry.usageRatePercent)}
                </td>
                <td className="py-2 pr-2">
                  {formatPercent(entry.winratePercent)}
                </td>
                <td className="py-2 text-gray-500 dark:text-gray-400">
                  {entry.playerCount} Spieler in {entry.tournamentCount}{' '}
                  Turnieren
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
