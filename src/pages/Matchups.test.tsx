import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

  it('renders aggregated Counter-Meta-Score rows', () => {
    mockedUseMatchups.mockReturnValue(
      baseUseMatchupsResult({ stats: [pikachuMatchupStats] }),
    )

    render(<Matchups />)

    expect(screen.getByText('Pikachu ex / Zebstrika')).toBeInTheDocument()
    expect(screen.getByText('60.0%')).toBeInTheDocument()
    expect(screen.getByText('30 Spiele')).toBeInTheDocument()
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

  it('expands the matchup breakdown on click and collapses it again on a second click', () => {
    mockedUseMatchups.mockReturnValue(
      baseUseMatchupsResult({ stats: [pikachuMatchupStats] }),
    )

    render(<Matchups />)

    expect(screen.queryByText('Mewtwo ex')).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /pikachu ex \/ zebstrika/i }),
    )
    expect(screen.getByText('Mewtwo ex')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /pikachu ex \/ zebstrika/i }),
    )
    expect(screen.queryByText('Mewtwo ex')).not.toBeInTheDocument()
  })

  it('shows "zu wenig Daten" instead of a percentage at both the row and matchup-breakdown level', () => {
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

    expect(screen.getAllByText('zu wenig Daten')[0]).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /pikachu ex \/ zebstrika/i }),
    )
    expect(screen.getByText('Long Tail Deck')).toBeInTheDocument()
    expect(screen.getAllByText('zu wenig Daten')).toHaveLength(2)
  })

  it('shows a hint badge for a mirror matchup in the breakdown, marking it as excluded from the score', () => {
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

    fireEvent.click(
      screen.getByRole('button', { name: /pikachu ex \/ zebstrika/i }),
    )
    expect(screen.getByText(/nicht im Score/i)).toBeInTheDocument()
    expect(screen.queryAllByText(/nicht im Score/i)).toHaveLength(1)
  })
})
