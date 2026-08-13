export interface MatchupCellStyle {
  text: string
  bg: string
  fg: string
  border: string
}

export const MIRROR_HATCH_BG =
  'repeating-linear-gradient(135deg,var(--color-bg-inset),var(--color-bg-inset) 3px,var(--color-bg-panel) 3px,var(--color-bg-panel) 6px)'

export interface MatchupCellInput {
  winratePercent: number | null
  hasSufficientData: boolean
  isMirrorMatchup: boolean
  gamesPlayed: number
}

/**
 * Zellfarben-Skala aus dem Design-System (Matchups-Screen-Legende): 5-Stufen
 * Winrate-Farbverlauf plus zwei Sonderfaelle (Spiegel-Matchup, zu wenig
 * Daten). Reine Anzeigefunktion ueber bereits berechnete MatchupBreakdown-
 * Werte -- keine eigene Statistik.
 */
export function matchupCellStyle(cell: MatchupCellInput): MatchupCellStyle {
  if (cell.isMirrorMatchup) {
    return {
      text: 'SPIEGEL',
      bg: MIRROR_HATCH_BG,
      fg: '#8a94a6',
      border: '1px solid #2a3140',
    }
  }

  if (!cell.hasSufficientData || cell.winratePercent === null) {
    return {
      text: `n=${cell.gamesPlayed}`,
      bg: '#0c0e14',
      fg: '#6b7488',
      border: '1px dashed #3a4252',
    }
  }

  const wr = cell.winratePercent
  const bg =
    wr <= 35
      ? '#f062c0'
      : wr < 46
        ? '#8a3c74'
        : wr <= 54
          ? '#2a2f3a'
          : wr < 62
            ? '#1d6c79'
            : '#45e0f5'
  const fg =
    wr <= 35
      ? '#2a0620'
      : wr < 46
        ? '#ffe7f6'
        : wr <= 54
          ? '#c6cdda'
          : wr < 62
            ? '#dffaff'
            : '#04222a'

  return { text: wr.toFixed(1), bg, fg, border: '0' }
}

export function scoreColor(score: number | null): string {
  if (score === null) return '#6b7488'
  if (score >= 52) return '#45e0f5'
  if (score >= 46) return '#e6eaf2'
  return '#f0a0d4'
}
