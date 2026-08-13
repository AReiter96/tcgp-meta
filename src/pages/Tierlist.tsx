import { useMemo, useState } from 'react'
import { useTierlist } from '../hooks/useTierlist'
import { FanContentNotice } from '../components/FanContentNotice'
import { DeckIcon } from '../components/DeckIcon'
import { AktualisierenButton } from '../components/AktualisierenButton'
import { HeaderMetaBar } from '../components/HeaderMetaBar'
import { LoadingRows } from '../components/LoadingRows'
import { ErrorNotice } from '../components/ErrorNotice'
import { useHeaderSlot } from '../components/layout/useHeaderSlot'
import { buildDeckIconUrl } from '../lib/limitless/client'
import { groupIntoTiers, type TierGroup } from '../lib/tierlist/tiers'
import type { ArchetypeStats } from '../lib/tierlist/aggregate'

type SortMode = 'usage' | 'winrate'

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function winrateColorClass(wr: number): string {
  if (wr >= 52) return 'text-accent'
  if (wr >= 46) return 'text-text'
  return 'text-[#f0a0d4]'
}

function SortToggle({
  value,
  onChange,
}: {
  value: SortMode
  onChange: (mode: SortMode) => void
}) {
  return (
    <div className="flex border border-line-strong">
      {(['usage', 'winrate'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          className={`px-3 py-2 font-mono text-[11px] tracking-[0.1em] uppercase ${
            value === mode
              ? 'bg-accent text-accent-ink'
              : 'text-text-dim hover:text-text'
          }`}
        >
          {mode === 'usage' ? 'Nutzung' : 'Winrate'}
        </button>
      ))}
    </div>
  )
}

function DeckCell({ entry }: { entry: ArchetypeStats }) {
  return (
    <div className="flex items-center gap-3 bg-bg-panel px-3.5 py-3 hover:bg-bg-raised">
      <div className="flex flex-none gap-0.5">
        {entry.archetype.icons.map((icon, index) => (
          <DeckIcon
            key={`${icon}-${index}`}
            src={buildDeckIconUrl(icon)}
            className="h-[26px] w-[26px] border border-line-strong"
          />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="truncate text-[13px] font-medium">
          {entry.archetype.name}
        </div>
        <div className="font-mono text-[10px] text-text-faint">
          {entry.playerCount} Spieler · {entry.tournamentCount} Turniere
        </div>
      </div>
      <div className="flex flex-none gap-3.5 text-right font-mono">
        <div>
          <div className="text-sm text-accent">
            {formatPercent(entry.usageRatePercent)}
          </div>
          <div className="text-[9px] tracking-[0.1em] text-text-faint">
            USE
          </div>
        </div>
        <div>
          <div className={`text-sm ${winrateColorClass(entry.winratePercent)}`}>
            {formatPercent(entry.winratePercent)}
          </div>
          <div className="text-[9px] tracking-[0.1em] text-text-faint">
            WR
          </div>
        </div>
      </div>
    </div>
  )
}

function TierBand({ group }: { group: TierGroup }) {
  return (
    <div className="flex flex-col border-t border-line first:border-t-0 md:flex-row">
      <div
        className="flex items-center gap-2 px-3.5 py-2 md:hidden"
        style={{ background: group.bg, color: group.fg }}
      >
        <span className="text-lg font-bold">{group.label}</span>
        <span className="font-mono text-[10px] tracking-[0.14em]">
          {group.count} DECKS
        </span>
      </div>
      <div
        className="hidden w-16 flex-none flex-col items-center justify-start gap-1.5 py-3 md:flex"
        style={{ background: group.bg }}
      >
        <span
          className="text-[30px] leading-none font-bold"
          style={{ color: group.fg }}
        >
          {group.label}
        </span>
        <span
          className="font-mono text-[10px] opacity-70"
          style={{ color: group.fg }}
        >
          {group.count}
        </span>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-px bg-line md:grid-cols-3">
        {group.decks.map((entry) => (
          <DeckCell key={entry.archetype.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

export function Tierlist() {
  const {
    stats,
    meta,
    updatedAt,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useTierlist()
  const [sortMode, setSortMode] = useState<SortMode>('usage')

  const tiers = useMemo(() => {
    const sorted = [...stats].sort((a, b) =>
      sortMode === 'usage'
        ? b.usageRatePercent - a.usageRatePercent
        : b.winratePercent - a.winratePercent,
    )
    return groupIntoTiers(sorted)
  }, [stats, sortMode])

  useHeaderSlot({
    action: (
      <AktualisierenButton onClick={() => refetch()} isLoading={isRefetching} />
    ),
    meta: meta && (
      <HeaderMetaBar
        tournamentCount={meta.tournamentCount}
        totalPlayers={meta.totalPlayers}
        updatedAt={updatedAt}
      />
    ),
  })

  return (
    <div className="mx-auto max-w-[1320px] px-0 py-0 md:px-6 md:py-8">
      <div className="border-line md:border">
        <div className="flex flex-col gap-3 border-b border-line px-3.5 py-4 md:flex-row md:items-center md:justify-between md:px-6 md:py-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold tracking-tight md:text-[26px]">
              Tierlist
            </h1>
            <div className="font-mono text-[11px] text-text-faint">
              {stats.length} ARCHETYPEN
              {meta ? ` · ${meta.tournamentCount} TURNIERE` : ''}
            </div>
          </div>
          <SortToggle value={sortMode} onChange={setSortMode} />
        </div>

        <div className="px-3.5 py-3 md:px-6">
          <FanContentNotice />
        </div>

        {isLoading && (
          <div className="px-3.5 pb-4 md:px-6">
            <LoadingRows label="Lade Turnierdaten…" />
          </div>
        )}

        {isError && (
          <div className="px-3.5 pb-4 md:px-6">
            <ErrorNotice
              message="Turnierdaten konnten nicht geladen werden."
              detail={error instanceof Error ? error.message : undefined}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {tiers.map((group) => (
              <TierBand key={group.label} group={group} />
            ))}
            <div className="flex flex-wrap gap-4 border-t border-line px-3.5 py-3 font-mono text-[10px] tracking-[0.08em] text-text-faint md:gap-5 md:px-6">
              <span>S ≥ 52 WR &amp; ≥ 2.5 USE</span>
              <span>A ≥ 50 WR</span>
              <span>B 46–50 WR</span>
              <span>C &lt; 46 WR</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
