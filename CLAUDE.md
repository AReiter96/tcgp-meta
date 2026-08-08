# TCGP-Meta (Arbeitstitel)

## Zweck
PWA zur Anzeige von Meta-/Tierlist-/Winrate-Daten für Pokemon TCG Pocket
Ranked-PVP. Reine Anzeige, keine eigene Berechnung.

## Stack
- Sprache/Runtime: TypeScript, React 18, Vite
- Framework: Tailwind CSS, vite-plugin-pwa (Workbox), Dexie.js, TanStack Query
- Backend: KEINS im MVP (reiner Client, kein Server/Proxy)
- Build/Test: Vite build, Vitest, GitHub Actions (Lint/Typecheck/Build-Gate)
- Deployment-Ziel: Vercel (Free Tier), automatische PR-Preview-Deployments

## Architektur (Kurzfassung)
- Kartendaten: TCGdex API (tcgp-Serie) primär, GitHub-Kartendatenbank Fallback,
  Bilder nur verlinkt (kein Hosting/Caching)
- Meta/Turnierdaten: Limitless API direkt vom Client, ausschließlich
  unauthentifizierte Endpunkte (kein Key, kein Proxy)
- Archetyp-Gruppierung: client-seitige Heuristik über getDeckArchetype()
  -- bewusst austauschbare Abstraktion, ersetzt später /decks + Proxy ohne
  Refactoring der restlichen App
- Offline: Dexie.js für Kartentext/-daten, Workbox für App-Shell -- Bilder
  offline NICHT verfügbar (bewusste Einschränkung)

## Konventionen
- Code-Style: ESLint + Prettier, TS strict mode
- Commit-Format: Conventional Commits
- Test-Pflicht: keine PR ohne Build-/Typecheck-Erfolg

## Nicht-Ziele / bewusste Einschränkungen
- Kein Empfehlungsalgorithmus (Phase 2, separates Projekt)
- Kein iOS-Store-Release
- Kein eigenes Scraping
- Kein Hosting/Caching von Kartenbildern -> keine Offline-Bilder
- Keine Monetarisierung im MVP (Struktur bleibt erweiterbar)
- Kein Limitless-API-Key im MVP -- Antrag erst sinnvoll, wenn Projekt
  tatsächlich public-facing ist (Formular verlangt begründeten Use-Case)

## Aktueller Stand
- Letztes abgeschlossenes Feature: M0 Setup & Infra
- Nächster Meilenstein: M1
- Offene Entscheidungen: keine

## Checkpoint-Log
<!-- automatisch per Hook, siehe .claude/hooks/append-checkpoint-log.sh -->
| Datum | Meilenstein | Ergebnis | Scope-Drift erkannt? | Aktion |
|---|---|---|---|---|

## Bekannte Risiken / Tech Debt
- IP/Legal: Pokémon-Takedown-Historie -- Fan-Content-Disclaimer, keine
  offiziellen Logos/Assets
- Rate-Limits ohne Key niedriger -- Response-Header beobachten, bei
  wiederholtem Anschlagen Key-Antrag nachziehen (erst wenn Projekt
  public-facing genug für glaubwürdigen Use-Case-Antrag ist)
- Archetyp-Heuristik ungenauer als offizielle Kategorisierung -- bekannter
  MVP-Kompromiss, dokumentiert in getDeckArchetype()
- Impressum/Datenschutz vorerst Platzhalter -- GATE: kein Produktions-Deploy
  vor Ersetzung durch echte Texte

## MCP-Server / externe Tools
- GitHub-Connector -- Repo-Zugriff für Claude Code on the web + Cowork
- TCGdex API -- Kartendaten (Link-only)
- Limitless API -- Meta-/Turnierdaten (nur unauthentifizierte Endpunkte)

## Plugins & Connectors
- GitHub-Connector (Cowork Scheduled Task, read-only + Write auf
  checkpoint-result.json/Report)
- Vercel (git-basiertes Deployment, kein separater Connector nötig)
