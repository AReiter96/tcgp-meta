import { describe, expect, it } from 'vitest'
import { getDeckArchetype } from './archetype'

describe('getDeckArchetype', () => {
  it('passes a populated Limitless deck through', () => {
    expect(
      getDeckArchetype({
        id: 'pikachu-ex-zebstrika',
        name: 'Pikachu ex / Zebstrika',
        icons: ['https://example.com/pikachu-ex.png'],
      }),
    ).toEqual({
      id: 'pikachu-ex-zebstrika',
      name: 'Pikachu ex / Zebstrika',
      icons: ['https://example.com/pikachu-ex.png'],
    })
  })

  it('defaults icons to an empty array when missing', () => {
    expect(
      getDeckArchetype({
        id: 'mewtwo-ex',
        name: 'Mewtwo ex',
      } as never),
    ).toEqual({ id: 'mewtwo-ex', name: 'Mewtwo ex', icons: [] })
  })

  it('falls back to Unbekannt when deck is null', () => {
    expect(getDeckArchetype(null)).toEqual({
      id: 'unknown',
      name: 'Unbekannt',
      icons: [],
    })
  })

  it('falls back to Unbekannt when deck is undefined', () => {
    expect(getDeckArchetype(undefined)).toEqual({
      id: 'unknown',
      name: 'Unbekannt',
      icons: [],
    })
  })

  it('falls back to Unbekannt when deck has an empty id', () => {
    expect(getDeckArchetype({ id: '', name: '', icons: [] })).toEqual({
      id: 'unknown',
      name: 'Unbekannt',
      icons: [],
    })
  })
})
