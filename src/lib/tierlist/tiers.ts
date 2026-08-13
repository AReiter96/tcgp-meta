import type { ArchetypeStats } from './aggregate'

export const TIER_LABELS = ['S', 'A', 'B', 'C'] as const
export type TierLabel = (typeof TIER_LABELS)[number]

export interface TierGroup {
  label: TierLabel
  bg: string
  fg: string
  count: number
  decks: ArchetypeStats[]
}

const TIER_STYLES: Record<TierLabel, { bg: string; fg: string }> = {
  S: { bg: '#45e0f5', fg: '#04222a' },
  A: { bg: '#1a6b78', fg: '#dffaff' },
  B: { bg: '#2a2f3a', fg: '#c6cdda' },
  C: { bg: '#8a3c74', fg: '#ffe7f6' },
}

/**
 * Schwellenwerte aus dem Design-System (Tierlist-Screen-Legende):
 * S >= 52 WR & >= 2.5 USE, A >= 50 WR, B 46-50 WR, C < 46 WR. Rein
 * anzeigebasierte Gruppierung ueber bereits berechnete ArchetypeStats --
 * keine eigene Datenerhebung.
 */
function tierLabelFor(stat: ArchetypeStats): TierLabel {
  if (stat.winratePercent >= 52 && stat.usageRatePercent >= 2.5) return 'S'
  if (stat.winratePercent >= 50) return 'A'
  if (stat.winratePercent >= 46) return 'B'
  return 'C'
}

export function groupIntoTiers(stats: ArchetypeStats[]): TierGroup[] {
  const buckets = new Map<TierLabel, ArchetypeStats[]>()

  for (const stat of stats) {
    const label = tierLabelFor(stat)
    const decks = buckets.get(label) ?? []
    decks.push(stat)
    buckets.set(label, decks)
  }

  return TIER_LABELS.filter((label) => buckets.has(label)).map((label) => {
    const decks = buckets.get(label) as ArchetypeStats[]
    return {
      label,
      ...TIER_STYLES[label],
      count: decks.length,
      decks,
    }
  })
}
