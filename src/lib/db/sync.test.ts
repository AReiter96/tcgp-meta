import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../tcgdex/client', () => ({
  fetchTcgpSeries: vi.fn(),
  fetchSetDetails: vi.fn(),
  fetchCardDetails: vi.fn(),
}))

import {
  fetchTcgpSeries,
  fetchSetDetails,
  fetchCardDetails,
} from '../tcgdex/client'
import { db } from './db'
import {
  getCachedCards,
  hasCachedCards,
  loadTcgpCards,
  mapCardToRecord,
  syncTcgpCards,
} from './sync'
import {
  pikachuCardFixture,
  bulbasaurCardFixture,
  tcgpSerieFixture,
  tcgpSetFixture,
} from '../../test/fixtures/tcgdex'

const mockedFetchTcgpSeries = vi.mocked(fetchTcgpSeries)
const mockedFetchSetDetails = vi.mocked(fetchSetDetails)
const mockedFetchCardDetails = vi.mocked(fetchCardDetails)

beforeEach(() => {
  mockedFetchTcgpSeries.mockReset()
  mockedFetchSetDetails.mockReset()
  mockedFetchCardDetails.mockReset()
})

afterEach(async () => {
  await db.cards.clear()
  await db.meta.clear()
})

describe('mapCardToRecord', () => {
  it('maps a full TCGdex Card to a flat CardRecord', () => {
    expect(mapCardToRecord(pikachuCardFixture)).toEqual({
      id: 'A1-001',
      localId: '001',
      name: 'Pikachu',
      image: 'https://assets.tcgdex.net/en/tcgp/A1/001',
      category: 'Pokemon',
      rarity: 'Common',
      hp: 60,
      types: ['Lightning'],
      stage: 'Basic',
      attacks: [{ cost: ['Lightning'], name: 'Gnaw', damage: 20 }],
      retreat: 1,
      setId: 'A1',
      setName: 'Genetic Apex',
    })
  })
})

describe('syncTcgpCards', () => {
  it('fetches the tcgp serie, all sets and all full cards, then persists them to Dexie', async () => {
    mockedFetchTcgpSeries.mockResolvedValue(tcgpSerieFixture)
    mockedFetchSetDetails.mockResolvedValue(tcgpSetFixture)
    mockedFetchCardDetails.mockImplementation(async (id) => {
      if (id === 'A1-001') return pikachuCardFixture
      if (id === 'A1-002') return bulbasaurCardFixture
      throw new Error(`unexpected card id ${String(id)}`)
    })

    const records = await syncTcgpCards()

    expect(records).toHaveLength(2)
    expect(mockedFetchSetDetails).toHaveBeenCalledWith('A1')
    expect(mockedFetchCardDetails).toHaveBeenCalledTimes(2)
    await expect(db.cards.count()).resolves.toBe(2)
    await expect(db.cards.get('A1-001')).resolves.toMatchObject({
      name: 'Pikachu',
    })
  })
})

describe('loadTcgpCards', () => {
  it('syncs from TCGdex when the cache is empty', async () => {
    mockedFetchTcgpSeries.mockResolvedValue(tcgpSerieFixture)
    mockedFetchSetDetails.mockResolvedValue(tcgpSetFixture)
    mockedFetchCardDetails.mockImplementation(async (id) =>
      id === 'A1-001' ? pikachuCardFixture : bulbasaurCardFixture,
    )

    const records = await loadTcgpCards()

    expect(records).toHaveLength(2)
    expect(mockedFetchTcgpSeries).toHaveBeenCalledTimes(1)
  })

  it('reads from the Dexie cache without hitting TCGdex when cards are already cached', async () => {
    await db.cards.bulkPut([
      {
        id: 'A1-001',
        localId: '001',
        name: 'Pikachu',
        category: 'Pokemon',
        rarity: 'Common',
        setId: 'A1',
        setName: 'Genetic Apex',
      },
    ])

    const records = await loadTcgpCards()

    expect(records).toHaveLength(1)
    expect(mockedFetchTcgpSeries).not.toHaveBeenCalled()
  })

  it('forces a resync when forceSync is set, even if cards are already cached', async () => {
    await db.cards.bulkPut([
      {
        id: 'stale',
        localId: '999',
        name: 'Stale',
        category: 'Pokemon',
        rarity: 'Common',
        setId: 'A1',
        setName: 'Genetic Apex',
      },
    ])
    mockedFetchTcgpSeries.mockResolvedValue(tcgpSerieFixture)
    mockedFetchSetDetails.mockResolvedValue(tcgpSetFixture)
    mockedFetchCardDetails.mockImplementation(async (id) =>
      id === 'A1-001' ? pikachuCardFixture : bulbasaurCardFixture,
    )

    const records = await loadTcgpCards({ forceSync: true })

    expect(records.map((r) => r.id).sort()).toEqual(['A1-001', 'A1-002'])
    expect(await hasCachedCards()).toBe(true)
    expect(await getCachedCards()).toHaveLength(2)
  })
})
