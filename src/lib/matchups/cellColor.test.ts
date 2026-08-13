import { describe, expect, it } from 'vitest'
import { matchupCellStyle, scoreColor, MIRROR_HATCH_BG } from './cellColor'

function cell(overrides: Partial<Parameters<typeof matchupCellStyle>[0]>) {
  return matchupCellStyle({
    winratePercent: 50,
    hasSufficientData: true,
    isMirrorMatchup: false,
    gamesPlayed: 20,
    ...overrides,
  })
}

describe('matchupCellStyle', () => {
  it('renders a mirror matchup as a hatched cell regardless of winrate', () => {
    const style = cell({ isMirrorMatchup: true, winratePercent: 90 })
    expect(style).toEqual({
      text: 'SPIEGEL',
      bg: MIRROR_HATCH_BG,
      fg: '#8a94a6',
      border: '1px solid #2a3140',
    })
  })

  it('renders insufficient data as a dashed n= cell', () => {
    const style = cell({ hasSufficientData: false, gamesPlayed: 3, winratePercent: null })
    expect(style.text).toBe('n=3')
    expect(style.border).toBe('1px dashed #3a4252')
  })

  it('treats a null winrate as insufficient data even if the flag says otherwise', () => {
    const style = cell({ hasSufficientData: true, winratePercent: null, gamesPlayed: 7 })
    expect(style.text).toBe('n=7')
  })

  it.each([
    [35, '#f062c0'],
    [35.1, '#8a3c74'],
    [45.9, '#8a3c74'],
    [46, '#2a2f3a'],
    [54, '#2a2f3a'],
    [54.1, '#1d6c79'],
    [61.9, '#1d6c79'],
    [62, '#45e0f5'],
  ])('colors winrate %s as %s', (wr, expectedBg) => {
    expect(cell({ winratePercent: wr }).bg).toBe(expectedBg)
  })

  it('formats the winrate text to one decimal', () => {
    expect(cell({ winratePercent: 57.86 }).text).toBe('57.9')
  })
})

describe('scoreColor', () => {
  it('returns faint gray for a null score', () => {
    expect(scoreColor(null)).toBe('#6b7488')
  })

  it('returns accent for >= 52', () => {
    expect(scoreColor(52)).toBe('#45e0f5')
  })

  it('returns text color for 46-51.9', () => {
    expect(scoreColor(46)).toBe('#e6eaf2')
  })

  it('returns pink for below 46', () => {
    expect(scoreColor(45.9)).toBe('#f0a0d4')
  })
})
