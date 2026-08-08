import { useMemo, useState } from 'react'
import { useCards } from '../hooks/useCards'
import { filterCards, getAvailableTypes } from '../lib/cards/filter'
import { CardGrid } from '../components/CardGrid'
import { CardSearchBar } from '../components/CardSearchBar'
import { TypeFilter } from '../components/TypeFilter'

export function Karten() {
  const {
    cards,
    isLoading,
    isError,
    error,
    refresh,
    isRefreshing,
    refreshError,
  } = useCards()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')

  const availableTypes = useMemo(() => getAvailableTypes(cards), [cards])
  const filteredCards = useMemo(
    () => filterCards(cards, { name: search, type }),
    [cards, search, type],
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Karten</h1>
        <button
          type="button"
          onClick={() => refresh()}
          disabled={isRefreshing}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          {isRefreshing ? 'Aktualisiere...' : 'Aktualisieren'}
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <CardSearchBar value={search} onChange={setSearch} />
        <TypeFilter types={availableTypes} value={type} onChange={setType} />
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Lade Kartendaten...
        </p>
      )}

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Kartendaten konnten nicht geladen werden
          {error instanceof Error ? `: ${error.message}` : ''}.
        </p>
      )}

      {refreshError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          Aktualisierung fehlgeschlagen
          {refreshError instanceof Error ? `: ${refreshError.message}` : ''}.
        </p>
      )}

      {!isLoading && !isError && <CardGrid cards={filteredCards} />}
    </div>
  )
}
