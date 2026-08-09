import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Tierlist } from './Tierlist'
import { useTierlist } from '../hooks/useTierlist'
import type { ArchetypeStats } from '../lib/tierlist/aggregate'

vi.mock('../hooks/useTierlist', () => ({
  useTierlist: vi.fn(),
}))

// Aktualisieren-Button und Disclaimer sind in jedem Render-Zustand
// vorhanden -- ohne Cleanup zwischen Tests sammeln sich mehrere Matches an
// (kein globales afterEach in diesem Projekt, siehe vitest.config.ts).
afterEach(() => {
  cleanup()
})

const mockedUseTierlist = vi.mocked(useTierlist)

const pikachuStats: ArchetypeStats = {
  archetype: {
    id: 'pikachu-ex-zebstrika',
    name: 'Pikachu ex / Zebstrika',
    icons: ['https://example.com/pikachu-ex.png'],
  },
  playerCount: 40,
  tournamentCount: 5,
  wins: 60,
  losses: 40,
  ties: 0,
  usageRatePercent: 25,
  winratePercent: 60,
}

function baseUseTierlistResult(
  overrides: Partial<ReturnType<typeof useTierlist>>,
) {
  return {
    stats: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
    ...overrides,
  } as ReturnType<typeof useTierlist>
}

describe('Tierlist page', () => {
  it('shows a loading indicator while data is loading', () => {
    mockedUseTierlist.mockReturnValue(
      baseUseTierlistResult({ isLoading: true }),
    )

    render(<Tierlist />)

    expect(screen.getByText(/lade turnierdaten/i)).toBeInTheDocument()
  })

  it('shows a visible error state when loading fails, not a silent failure', () => {
    mockedUseTierlist.mockReturnValue(
      baseUseTierlistResult({
        isError: true,
        error: new Error('Limitless nicht erreichbar'),
      }),
    )

    render(<Tierlist />)

    expect(screen.getByRole('alert')).toHaveTextContent(/nicht erreichbar/i)
  })

  it('renders aggregated archetype stats', () => {
    mockedUseTierlist.mockReturnValue(
      baseUseTierlistResult({ stats: [pikachuStats] }),
    )

    render(<Tierlist />)

    expect(screen.getByText('Pikachu ex / Zebstrika')).toBeInTheDocument()
    expect(screen.getByText('25.0%')).toBeInTheDocument()
    expect(screen.getByText('60.0%')).toBeInTheDocument()
    expect(screen.getByText(/40 Spieler in 5 Turnieren/)).toBeInTheDocument()
  })

  it('renders the fan-content disclaimer', () => {
    mockedUseTierlist.mockReturnValue(baseUseTierlistResult({}))

    render(<Tierlist />)

    expect(screen.getByText(/inoffizielle fan-anwendung/i)).toBeInTheDocument()
  })
})
