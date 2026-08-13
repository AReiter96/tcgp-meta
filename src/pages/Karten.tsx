import { useMemo, useState } from 'react'
import { useCards } from '../hooks/useCards'
import { filterCards, getAvailableTypes } from '../lib/cards/filter'
import { CardGrid } from '../components/CardGrid'
import { CardSearchBar } from '../components/CardSearchBar'
import { TypeFilter } from '../components/TypeFilter'
import { FanContentNotice } from '../components/FanContentNotice'
import { AktualisierenButton } from '../components/AktualisierenButton'
import { LoadingRows } from '../components/LoadingRows'
import { ErrorNotice } from '../components/ErrorNotice'
import { useHeaderSlot } from '../components/layout/useHeaderSlot'

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

  useHeaderSlot({
    action: (
      <AktualisierenButton onClick={() => refresh()} isLoading={isRefreshing} />
    ),
  })

  return (
    <div className="mx-auto max-w-[1320px] px-0 py-0 md:px-6 md:py-8">
      <div className="border-line md:border">
        <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight md:text-[26px]">
              Karten
            </h1>
            <div className="font-mono text-[11px] text-text-faint">
              {cards.length.toLocaleString('de-DE')} KARTEN
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-line px-3.5 py-3.5 md:flex-row md:items-center md:px-6">
          <CardSearchBar value={search} onChange={setSearch} />
          <TypeFilter types={availableTypes} value={type} onChange={setType} />
        </div>

        <div className="px-3.5 py-3 md:px-6">
          <FanContentNotice />
        </div>

        {isLoading && (
          <div className="px-3.5 pb-4 md:px-6">
            <LoadingRows label="Lade Kartendaten…" />
          </div>
        )}

        {isError && (
          <div className="px-3.5 pb-4 md:px-6">
            <ErrorNotice
              message="Kartendaten konnten nicht geladen werden."
              detail={error instanceof Error ? error.message : undefined}
            />
          </div>
        )}

        {refreshError && (
          <div className="px-3.5 pb-4 md:px-6">
            <ErrorNotice
              message="Aktualisierung fehlgeschlagen."
              detail={
                refreshError instanceof Error
                  ? refreshError.message
                  : undefined
              }
            />
          </div>
        )}

        {!isLoading && !isError && (
          <div className="px-3.5 pb-6 md:px-6">
            <CardGrid cards={filteredCards} />
          </div>
        )}
      </div>
    </div>
  )
}
