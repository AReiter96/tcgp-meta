import type {
  LimitlessGame,
  LimitlessPairing,
  LimitlessStanding,
  LimitlessTournament,
} from '../../lib/limitless/types'

export const pocketGameFixture: LimitlessGame = {
  id: 'POCKET',
  name: 'Pokemon TCG Pocket',
  metagame: true,
}

export const tournamentFixture: LimitlessTournament = {
  id: 'tour-1',
  game: 'POCKET',
  format: 'standard',
  name: 'Weekly Ranked Cup',
  date: '2026-08-01',
  players: 128,
}

export const pikachuDeckStandingFixture: LimitlessStanding = {
  placing: 1,
  deck: {
    id: 'pikachu-ex-zebstrika',
    name: 'Pikachu ex / Zebstrika',
    icons: [
      'https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/pikachu-ex.png',
    ],
  },
  record: { wins: 6, losses: 1, ties: 0 },
}

export const mewtwoDeckStandingFixture: LimitlessStanding = {
  placing: 2,
  deck: {
    id: 'mewtwo-ex',
    name: 'Mewtwo ex',
    icons: [
      'https://limitlesstcg.nyc3.digitaloceanspaces.com/pocket/mewtwo-ex.png',
    ],
  },
  record: { wins: 5, losses: 2, ties: 0 },
}

export const uncategorizedStandingFixture: LimitlessStanding = {
  placing: 3,
  deck: null,
  record: { wins: 4, losses: 3, ties: 0 },
}

export const pikachuVsMewtwoPairingFixture: LimitlessPairing = {
  round: 1,
  player1: { name: 'Player A', deck: pikachuDeckStandingFixture.deck },
  player2: { name: 'Player B', deck: mewtwoDeckStandingFixture.deck },
  outcome: 'player1',
}
