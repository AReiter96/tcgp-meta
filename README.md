# TCGP-Meta

PWA zur Anzeige von Meta-/Tierlist-/Winrate-Daten fuer Pokemon TCG Pocket
Ranked-PVP. Reine Anzeige, keine eigene Berechnung.

Details zu Architektur, Scope und Stand siehe [CLAUDE.md](./CLAUDE.md).

## Setup

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` -- lokaler Dev-Server
- `npm run build` -- Typecheck + Production-Build
- `npm run lint` -- ESLint
- `npm run typecheck` -- TypeScript ohne Emit
- `npm run format` / `npm run format:check` -- Prettier
- `npm run preview` -- Production-Build lokal ansehen
