import { describe, expect, it } from 'vitest'
import { buildCardImageUrl } from './client'

describe('buildCardImageUrl', () => {
  it('appends quality and extension to the base image url', () => {
    expect(buildCardImageUrl('https://assets.tcgdex.net/en/tcgp/A1/001')).toBe(
      'https://assets.tcgdex.net/en/tcgp/A1/001/low.webp',
    )
  })

  it('respects the given quality and extension', () => {
    expect(
      buildCardImageUrl(
        'https://assets.tcgdex.net/en/tcgp/A1/001',
        'high',
        'png',
      ),
    ).toBe('https://assets.tcgdex.net/en/tcgp/A1/001/high.png')
  })
})
