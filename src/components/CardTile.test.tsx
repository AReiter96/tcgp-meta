import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CardTile } from './CardTile'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import type { CardRecord } from '../lib/tcgdex/types'

vi.mock('../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(),
}))

const mockedUseOnlineStatus = vi.mocked(useOnlineStatus)

afterEach(() => {
  cleanup()
})

const pikachuCard: CardRecord = {
  id: 'A1-001',
  localId: '001',
  name: 'Pikachu',
  image: 'https://assets.tcgdex.net/en/tcgp/A1/001',
  category: 'Pokemon',
  rarity: 'Common',
  setId: 'A1',
  setName: 'Genetic Apex',
}

describe('CardTile', () => {
  it('renders the card image when it loads successfully', () => {
    mockedUseOnlineStatus.mockReturnValue(true)

    const { container } = render(<CardTile card={pikachuCard} />)

    expect(container.querySelector('img')).not.toBeNull()
  })

  it('shows an offline-specific placeholder when the image fails to load while offline', () => {
    mockedUseOnlineStatus.mockReturnValue(false)

    const { container } = render(<CardTile card={pikachuCard} />)
    fireEvent.error(container.querySelector('img')!)

    expect(container.querySelector('img')).toBeNull()
    expect(
      screen.getByText(/kartenbilder sind offline nicht verfuegbar/i),
    ).toBeInTheDocument()
  })

  it('shows a neutral placeholder when the image fails to load while online', () => {
    mockedUseOnlineStatus.mockReturnValue(true)

    const { container } = render(<CardTile card={pikachuCard} />)
    fireEvent.error(container.querySelector('img')!)

    expect(screen.getByText(/bild nicht verfuegbar/i)).toBeInTheDocument()
  })

  it('always renders name and set name', () => {
    mockedUseOnlineStatus.mockReturnValue(true)

    render(<CardTile card={pikachuCard} />)

    expect(screen.getByText('Pikachu')).toBeInTheDocument()
    expect(screen.getByText('Genetic Apex')).toBeInTheDocument()
  })
})
