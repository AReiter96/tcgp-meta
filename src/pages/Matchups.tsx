import { Fragment, useState } from 'react'
import { useMatchups } from '../hooks/useMatchups'
import { FanContentNotice } from '../components/FanContentNotice'

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatScore(value: number | null, hasSufficientData: boolean): string {
  if (!hasSufficientData || value === null) {
    return 'zu wenig Daten'
  }
  return formatPercent(value)
}

export function Matchups() {
  const { stats, isLoading, isError, error, refetch, isRefetching } =
    useMatchups()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <FanContentNotice />

      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Matchups</h1>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          {isRefetching ? 'Aktualisiere...' : 'Aktualisieren'}
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Counter-Meta-Score: gepoolte Winrate gegen die aktuellen
        Top-5-Meta-Decks, gewichtet nach tatsaechlicher Spielhaeufigkeit --
        beantwortet "was spiele ich jetzt", nicht "was schlaegt Deck X".
      </p>

      {isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lade Turnier- und Matchup-Daten...
        </p>
      )}

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Matchup-Daten konnten nicht geladen werden
          {error instanceof Error ? `: ${error.message}` : ''}.
        </p>
      )}

      {!isLoading && !isError && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left dark:border-gray-700">
              <th className="py-2 pr-2">Archetyp</th>
              <th className="py-2 pr-2">Counter-Meta-Score</th>
              <th className="py-2">Stichprobe</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((entry) => {
              const isExpanded = expandedId === entry.archetype.id
              return (
                <Fragment key={entry.archetype.id}>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : entry.archetype.id)
                        }
                        aria-expanded={isExpanded}
                        className="flex items-center gap-2 text-left hover:underline"
                      >
                        {entry.archetype.icons.map((icon) => (
                          <img
                            key={icon}
                            src={icon}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                        ))}
                        <span>{entry.archetype.name}</span>
                      </button>
                    </td>
                    <td className="py-2 pr-2">
                      {formatScore(
                        entry.counterMetaScorePercent,
                        entry.hasSufficientData,
                      )}
                    </td>
                    <td className="py-2 text-gray-500 dark:text-gray-400">
                      {entry.gamesPlayed} Spiele
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                      <td colSpan={3} className="py-2 pr-2">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr className="text-left">
                              <th className="py-1 pr-2">Gegner</th>
                              <th className="py-1 pr-2">Winrate</th>
                              <th className="py-1">Stichprobe</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.matchups.map((matchup) => (
                              <tr key={matchup.opponent.id}>
                                <td className="py-1 pr-2">
                                  {matchup.opponent.name}
                                  {matchup.isMirrorMatchup && (
                                    <span
                                      className="ml-2 inline-block rounded-full border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-500 dark:border-gray-700 dark:text-gray-400"
                                      title="Spiegel-Matchup: nicht im Gesamt-Score enthalten"
                                    >
                                      Spiegel &middot; nicht im Score
                                    </span>
                                  )}
                                </td>
                                <td className="py-1 pr-2">
                                  {formatScore(
                                    matchup.winratePercent,
                                    matchup.hasSufficientData,
                                  )}
                                </td>
                                <td className="py-1 text-gray-500 dark:text-gray-400">
                                  {matchup.gamesPlayed} Spiele
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
