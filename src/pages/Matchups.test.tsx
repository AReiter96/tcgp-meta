import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Matchups } from './Matchups'
import { useMatchups } from '../hooks/useMatchups'
import { buildDeckIconUrl } from '../lib/limitless/client'
import type { ArchetypeMatchupStats } from '../lib/matchups/aggregate'

vi.mock('../hooks/useMatchups', () => ({
  useMatchups: vi.fn(),
}))

afterEach(() => {
  cleanup()
})

const mockedUseMatchups = vi.mocked(useMatchups)

const pikachuMatchupStats: ArchetypeMatchupStats = {
  archetype: {
    id: 'pikachu-ex-zebstrika',
    name: 'Pikachu ex / Zebstrika',
    icons: ['pikachu-ex'],
  },
  gamesPlayed: 30,
  counterMetaScorePercent: 60,
  hasSufficientData: true,
  matchups: [
    {
      opponent: { id: 'mewtwo-ex', name: 'Mewtwo ex', icons: [] },
      wins: 12,
      losses: 8,
      ties: 0,
      gamesPlayed: 20,
      winratePercent: 60,
      hasSufficientData: true,
      isMirrorMatchup: false,
    },
    {
      opponent: { id: 'long-tail-deck', name: 'Long Tail Deck', icons: [] },
      wins: 2,
      losses: 1,
      ties: 0,
      gamesPlayed: 3,
      winratePercent: null,
      hasSufficientData: false,
      isMirrorMatchup: false,
    },
  ],
}

function baseUseMatchupsResult(
  overrides: Partial<ReturnType<typeof useMatchups>>,
) {
  return {
    stats: [],
    meta: undefined,
    updatedAt: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isRefetching: false,
    ...overrides,
  } as ReturnType<typeof useMatchups>
}

describe('Matchups page', () => {
  it('shows a loading indicator while data is loading', () => {
    mockedUseMatchups.mockReturnValue(
      baseUseMatchupsResult({ isLoading: true }),
    )

    render(<Matchups />)

    expect(
      screen.getByText(/lade turnier- und matchup-daten/i),
    ).toBeInTheDocument()
  })

  it('shows a visible error state when loading fails, not a silent failure', () => {
    mockedUseMatchups.mockReturnValue(
      baseUseMatchupsResult({
        isError: true,
        error: new Error('Limitless nicht erreichbar'),
      }),
    )

    render(<Matchups />)

    expect(screen.getByRole('alert')).toHaveTextContent(/nicht erreichbar/i)
  })

  it('renders aggregated Counter-Meta-Score rows with every opponent matchup visible directly', () => {
    mockedUseMatchups.mockReturnValue(
      baseUseMatchupsResult({ stats: [pikachuMatchupStats] }),
    )

    render(<Matchups />)

    expect(screen.getAllByText('Pikachu ex / Zebstrika').length).toBeGreaterThan(
      0,
    )
    expect(screen.getAllByText('60.0').length).toBeGreaterThan(0)
    expect(screen.getAllByText('30 Spiele').length).toBeGreaterThan(0)
    // Opponent breakdown is always visible -- no expand/collapse anymore.
    expect(screen.getAllByText('Mewtwo ex').length).toBeGreaterThan(0)
  })

  it('resolves a deck icon fragment to the full CDN url instead of passing it through unchanged -- regression for the broken-icon bug', () => {
    mockedUseMatchups.mockReturnValue(
      baseUseMatchupsResult({ stats: [pikachuMatchupStats] }),
    )

    const { container } = render(<Matchups />)

    const img = container.querySelector('img')
    expect(img).toHaveAttribute('src', buildDeckIconUrl('pikachu-ex'))
  })

  it('renders the fan-content disclaimer', () => {
    mockedUseMatchups.mockReturnValue(baseUseMatchupsResult({}))

    render(<Matchups />)

    expect(screen.getByText(/inoffizielle fan-anwendung/i)).toBeInTheDocument()
  })

  it('shows a compact insufficient-data marker instead of a percentage for both the score and the matchup cell', () => {
    mockedUseMatchups.mockReturnValue(
      baseUseMatchupsResult({
        stats: [
          {
            ...pikachuMatchupStats,
            counterMetaScorePercent: null,
            hasSufficientData: false,
          },
        ],
      }),
    )

    render(<Matchups />)

    // Score cells (desktop + mobile) render '–' for an insufficient sample.
    expect(screen.getAllByText('–').length).toBeGreaterThan(0)
    // The individual matchup with < 5 games renders its sample size.
    expect(screen.getAllByText('n=3').length).toBeGreaterThan(0)
  })

  it('marks a mirror matchup cell as excluded from the score', () => {
    mockedUseMatchups.mockReturnValue(
      baseUseMatchupsResult({
        stats: [
          {
            ...pikachuMatchupStats,
            matchups: [
              ...pikachuMatchupStats.matchups,
              {
                opponent: pikachuMatchupStats.archetype,
                wins: 5,
                losses: 5,
                ties: 0,
                gamesPlayed: 10,
                winratePercent: 50,
                hasSufficientData: true,
                isMirrorMatchup: true,
              },
            ],
          },
        ],
      }),
    )

    render(<Matchups />)

    const mirrorCells = screen.getAllByText('SPIEGEL')
    expect(mirrorCells.length).toBeGreaterThan(0)
    expect(mirrorCells[0]).toHaveAttribute(
      'title',
      'Spiegel-Matchup: nicht im Gesamt-Score enthalten',
    )
  })
})
