import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DeckIcon } from './DeckIcon'

afterEach(() => {
  cleanup()
})

describe('DeckIcon', () => {
  it('renders an img with the given src', () => {
    const { container } = render(
      <DeckIcon src="https://example.com/pikachu-ex.png" />,
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('src', 'https://example.com/pikachu-ex.png')
  })

  it('falls back to a visible placeholder instead of a broken image box on load error', () => {
    const { container } = render(
      <DeckIcon src="https://example.com/broken.png" />,
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    fireEvent.error(img!)

    expect(container.querySelector('img')).toBeNull()
    const placeholder = screen.getByRole('img', {
      name: /deck-icon nicht verfuegbar/i,
    })
    expect(placeholder.tagName).not.toBe('IMG')
  })
})
