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
  player: 'player-a',
  deck: {
    id: 'pikachu-ex-zebstrika',
    name: 'Pikachu ex / Zebstrika',
    icons: ['pikachu-ex'],
  },
  record: { wins: 6, losses: 1, ties: 0 },
}

export const mewtwoDeckStandingFixture: LimitlessStanding = {
  placing: 2,
  player: 'player-b',
  deck: {
    id: 'mewtwo-ex',
    name: 'Mewtwo ex',
    icons: ['mewtwo-ex'],
  },
  record: { wins: 5, losses: 2, ties: 0 },
}

export const uncategorizedStandingFixture: LimitlessStanding = {
  placing: 3,
  player: 'player-c',
  deck: null,
  record: { wins: 4, losses: 3, ties: 0 },
}

export const pikachuVsMewtwoPairingFixture: LimitlessPairing = {
  round: 1,
  phase: 1,
  table: 1,
  player1: pikachuDeckStandingFixture.player,
  player2: mewtwoDeckStandingFixture.player,
  winner: pikachuDeckStandingFixture.player,
}
