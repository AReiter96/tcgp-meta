import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Karten } from './Karten'
import { useCards } from '../hooks/useCards'
import type { CardRecord } from '../lib/tcgdex/types'

vi.mock('../hooks/useCards', () => ({
  useCards: vi.fn(),
}))

const mockedUseCards = vi.mocked(useCards)

const pikachuRecord: CardRecord = {
  id: 'A1-001',
  localId: '001',
  name: 'Pikachu',
  category: 'Pokemon',
  rarity: 'Common',
  types: ['Lightning'],
  setId: 'A1',
  setName: 'Genetic Apex',
}

function baseUseCardsResult(overrides: Partial<ReturnType<typeof useCards>>) {
  return {
    cards: [],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    refresh: vi.fn(),
    isRefreshing: false,
    refreshError: null,
    ...overrides,
  } as ReturnType<typeof useCards>
}

describe('Karten page', () => {
  it('shows a loading indicator while cards are loading', () => {
    mockedUseCards.mockReturnValue(baseUseCardsResult({ isLoading: true }))

    render(<Karten />)

    expect(screen.getByText(/lade kartendaten/i)).toBeInTheDocument()
  })

  it('shows a visible error state when loading fails, not a silent failure', () => {
    mockedUseCards.mockReturnValue(
      baseUseCardsResult({
        isError: true,
        error: new Error('TCGdex nicht erreichbar'),
      }),
    )

    render(<Karten />)

    expect(screen.getByRole('alert')).toHaveTextContent(/nicht erreichbar/i)
  })

  it('renders loaded cards', () => {
    mockedUseCards.mockReturnValue(
      baseUseCardsResult({ cards: [pikachuRecord] }),
    )

    render(<Karten />)

    expect(screen.getByText('Pikachu')).toBeInTheDocument()
  })
})
