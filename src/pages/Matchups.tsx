import { useMemo } from 'react'
import { useMatchups } from '../hooks/useMatchups'
import { FanContentNotice } from '../components/FanContentNotice'
import { DeckIcon } from '../components/DeckIcon'
import { AktualisierenButton } from '../components/AktualisierenButton'
import { HeaderMetaBar } from '../components/HeaderMetaBar'
import { LoadingRows } from '../components/LoadingRows'
import { ErrorNotice } from '../components/ErrorNotice'
import { useHeaderSlot } from '../components/layout/useHeaderSlot'
import { buildDeckIconUrl } from '../lib/limitless/client'
import {
  matchupCellStyle,
  scoreColor,
  MIRROR_HATCH_BG,
} from '../lib/matchups/cellColor'
import type { ArchetypeMatchupStats } from '../lib/matchups/aggregate'
import type { DeckArchetype } from '../lib/archetype'

function formatScore(entry: ArchetypeMatchupStats): string {
  if (!entry.hasSufficientData || entry.counterMetaScorePercent === null) {
    return '–'
  }
  return entry.counterMetaScorePercent.toFixed(1)
}

function Legend() {
  const swatches = [
    '#f062c0',
    '#8a3c74',
    '#2a2f3a',
    '#1d6c79',
    '#45e0f5',
  ]
  return (
    <div className="flex flex-wrap items-center gap-6 border-b border-line px-3.5 py-4 md:px-6">
      <div className="flex items-center">
        <span className="mr-2.5 font-mono text-[10px] tracking-[0.14em] text-text-faint">
          WINRATE
        </span>
        {swatches.map((color) => (
          <div key={color} className="h-4 w-[34px]" style={{ background: color }} />
        ))}
        <span className="ml-2.5 font-mono text-[10px] text-text-faint">
          ≤35 → ≥62
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-[22px] border border-dashed border-[#3a4252] bg-bg-panel" />
        <span className="font-mono text-[10px] tracking-[0.08em] text-text-faint">
          &lt; 5 SPIELE — KEINE AUSSAGE
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="h-4 w-[22px] border border-line-strong"
          style={{ background: MIRROR_HATCH_BG }}
        />
        <span className="font-mono text-[10px] tracking-[0.08em] text-text-faint">
          SPIEGEL — NICHT IM SCORE
        </span>
      </div>
    </div>
  )
}

function OpponentHeaderCell({ opponent }: { opponent: DeckArchetype }) {
  return (
    <div className="flex flex-col items-center justify-end gap-1 bg-bg-base px-1.5 py-2">
      <div className="flex gap-0.5">
        {opponent.icons.map((icon, index) => (
          <DeckIcon
            key={`${icon}-${index}`}
            src={buildDeckIconUrl(icon)}
            className="h-[22px] w-[22px] border border-line-strong"
          />
        ))}
      </div>
      <div className="text-center font-mono text-[9px] leading-tight text-text-dim">
        {opponent.name}
      </div>
    </div>
  )
}

function MatchupGrid({ stats }: { stats: ArchetypeMatchupStats[] }) {
  const opponents = stats[0]?.matchups.map((m) => m.opponent) ?? []
  const gridTemplateColumns = `280px 84px repeat(${opponents.length}, 1fr)`

  return (
    <div className="hidden overflow-x-auto px-3.5 pb-6 md:block md:px-6">
      <div
        className="grid gap-px bg-line"
        style={{ gridTemplateColumns, minWidth: 1000 }}
      >
        <div className="flex items-end bg-bg-base px-2.5 py-2 font-mono text-[10px] tracking-[0.14em] text-text-faint">
          ARCHETYP
        </div>
        <div className="flex items-end justify-end bg-bg-base px-2.5 py-2 text-right font-mono text-[10px] tracking-[0.14em] text-text-faint">
          SCORE
        </div>
        {opponents.map((opponent) => (
          <OpponentHeaderCell key={opponent.id} opponent={opponent} />
        ))}

        {stats.map((entry) => (
          <MatchupRow key={entry.archetype.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function MatchupRow({ entry }: { entry: ArchetypeMatchupStats }) {
  return (
    <>
      <div className="flex h-[46px] items-center gap-2.5 bg-bg-panel px-2.5">
        <div className="flex flex-none gap-0.5">
          {entry.archetype.icons.map((icon, index) => (
            <DeckIcon
              key={`${icon}-${index}`}
              src={buildDeckIconUrl(icon)}
              className="h-[22px] w-[22px] border border-line-strong"
            />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium">
            {entry.archetype.name}
          </div>
          <div className="font-mono text-[10px] text-text-faint">
            {entry.gamesPlayed} Spiele
          </div>
        </div>
      </div>
      <div
        className="flex h-[46px] items-center justify-end bg-bg-panel px-2.5 font-mono text-[15px]"
        style={{ color: scoreColor(entry.counterMetaScorePercent) }}
        title={entry.hasSufficientData ? undefined : 'Zu wenig Daten'}
      >
        {formatScore(entry)}
      </div>
      {entry.matchups.map((matchup) => {
        const style = matchupCellStyle(matchup)
        return (
          <div
            key={matchup.opponent.id}
            className="flex h-[46px] items-center justify-center font-mono text-[13px]"
            style={{
              background: style.bg,
              color: style.fg,
              border: style.border,
            }}
            title={cellTitle(matchup)}
          >
            {style.text}
          </div>
        )
      })}
    </>
  )
}

function cellTitle(matchup: {
  isMirrorMatchup: boolean
  hasSufficientData: boolean
  gamesPlayed: number
}): string | undefined {
  if (matchup.isMirrorMatchup) {
    return 'Spiegel-Matchup: nicht im Gesamt-Score enthalten'
  }
  if (!matchup.hasSufficientData) {
    return `Zu wenig Daten (${matchup.gamesPlayed} Spiele)`
  }
  return undefined
}

function MobileMatchupCard({ entry }: { entry: ArchetypeMatchupStats }) {
  return (
    <div className="border-b border-line">
      <div className="flex items-center gap-2.5 border-b border-line bg-bg-panel px-3.5 py-3">
        <div className="flex flex-none gap-0.5">
          {entry.archetype.icons.map((icon, index) => (
            <DeckIcon
              key={`${icon}-${index}`}
              src={buildDeckIconUrl(icon)}
              className="h-[26px] w-[26px] border border-line-strong"
            />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-medium">
            {entry.archetype.name}
          </div>
          <div className="font-mono text-[10px] text-text-faint">
            {entry.gamesPlayed} Spiele
          </div>
        </div>
        <div
          className="font-mono text-[17px]"
          style={{ color: scoreColor(entry.counterMetaScorePercent) }}
          title={entry.hasSufficientData ? undefined : 'Zu wenig Daten'}
        >
          {formatScore(entry)}
        </div>
      </div>
      <div className="flex flex-col">
        {entry.matchups.map((matchup) => {
          const style = matchupCellStyle(matchup)
          return (
            <div
              key={matchup.opponent.id}
              className="flex items-center gap-2.5 border-b border-[#12151c] px-3.5 py-2 last:border-b-0"
            >
              <div className="flex flex-none gap-0.5">
                {matchup.opponent.icons.map((icon, index) => (
                  <DeckIcon
                    key={`${icon}-${index}`}
                    src={buildDeckIconUrl(icon)}
                    className="h-[22px] w-[22px] border border-line-strong"
                  />
                ))}
              </div>
              <div className="flex-1 truncate text-xs text-text-dim">
                {matchup.opponent.name}
              </div>
              <div
                className="flex h-6 w-14 flex-none items-center justify-center font-mono text-xs"
                style={{
                  background: style.bg,
                  color: style.fg,
                  border: style.border,
                }}
                title={cellTitle(matchup)}
              >
                {style.text}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Matchups() {
  const {
    stats,
    meta,
    updatedAt,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMatchups()

  const opponentCount = useMemo(
    () => stats[0]?.matchups.length ?? 0,
    [stats],
  )

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
        <div className="flex flex-col gap-3 border-b border-line px-3.5 py-4 md:flex-row md:items-start md:justify-between md:px-6 md:py-5">
          <div className="flex max-w-[70ch] flex-col gap-1.5">
            <h1 className="text-xl font-bold tracking-tight md:text-[26px]">
              Matchups
            </h1>
            <p className="text-[13px] leading-normal text-text-dim">
              Counter-Meta-Score: gepoolte Winrate gegen die Top-
              {opponentCount || 5}-Meta-Decks, gewichtet nach Spielhäufigkeit.
              Spiegel-Matchups sind im Score ausgeschlossen, werden aber
              angezeigt.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-3 md:px-6">
          <FanContentNotice />
        </div>

        {isLoading && (
          <div className="px-3.5 pb-4 md:px-6">
            <LoadingRows label="Lade Turnier- und Matchup-Daten…" />
          </div>
        )}

        {isError && (
          <div className="px-3.5 pb-4 md:px-6">
            <ErrorNotice
              message="Matchup-Daten konnten nicht geladen werden."
              detail={error instanceof Error ? error.message : undefined}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <Legend />
            <MatchupGrid stats={stats} />
            <div className="md:hidden">
              {stats.map((entry) => (
                <MobileMatchupCard key={entry.archetype.id} entry={entry} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
