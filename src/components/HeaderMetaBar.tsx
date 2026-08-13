export interface HeaderMetaBarProps {
  tournamentCount: number
  totalPlayers: number
  updatedAt: number | undefined
}

function formatUpdatedAt(updatedAt: number | undefined): string {
  if (!updatedAt) return '–'
  const date = new Date(updatedAt)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const time = date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${day}.${month}.${date.getFullYear()} · ${time}`
}

/** Rendert responsiv: volle Zeile mit LIVE-Punkt (Desktop-Topbar) bzw. kompakte einzeilige Fassung (Mobil-Menue). */
export function HeaderMetaBar({
  tournamentCount,
  totalPlayers,
  updatedAt,
}: HeaderMetaBarProps) {
  const stamp = formatUpdatedAt(updatedAt)

  return (
    <>
      <div className="hidden items-center justify-between px-6 py-2 font-mono text-[11px] text-text-faint md:flex">
        <div className="flex gap-5">
          <span>
            DATENSTAND <span className="text-text-dim">{stamp}</span>
          </span>
          <span>
            QUELLE{' '}
            <span className="text-text-dim">
              {tournamentCount} Turniere ·{' '}
              {totalPlayers.toLocaleString('de-DE')} Spieler
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-accent" />
          LIVE
        </div>
      </div>
      <div className="text-center font-mono text-[10px] text-text-faint md:hidden">
        {stamp} · {tournamentCount} TURNIERE
      </div>
    </>
  )
}
