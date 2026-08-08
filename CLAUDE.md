# TCGP-Meta (Arbeitstitel)

## Zweck
PWA zur Anzeige von Meta-/Tierlist-/Winrate-Daten für Pokemon TCG Pocket
Ranked-PVP. Reine Anzeige, keine eigene Berechnung.

## Stack
- Sprache/Runtime: TypeScript, React 18, Vite -- Node >=22.22.2 (siehe
  package.json engines; seit M1 durch jsdom/undici-Testdependencies
  erzwungen, CI-Workflow entsprechend auf Node 22 gesetzt)
- Framework: Tailwind CSS, vite-plugin-pwa (Workbox), Dexie.js, TanStack Query
- Kartendaten-Client: `@tcgdex/sdk` (offizielles TypeScript-SDK, seit M1) --
  liefert echte, aus der API generierte Typen, spart eigene REST-Query-Logik
- Backend: KEINS im MVP (reiner Client, kein Server/Proxy)
- Build/Test: Vite build, Vitest (seit M1 aktiv genutzt, inkl.
  @testing-library/react + fake-indexeddb fuer Dexie-Tests), GitHub Actions
  (Lint/Typecheck/Test/Build-Gate)
- Deployment-Ziel: Vercel (Free Tier), automatische PR-Preview-Deployments

## Architektur (Kurzfassung)
- Kartendaten: TCGdex API (tcgp-Serie) primär via `@tcgdex/sdk`
  (src/lib/tcgdex/), GitHub-Kartendatenbank als Fallback vorgesehen aber in M1
  NICHT implementiert (keine Evidenz für Lücken in der tcgp-Serie; Client-
  Funktionen sind bewusst austauschbar gehalten, falls später doch nötig).
  Bilder nur verlinkt (kein Hosting/Caching)
- Sync: TCGdex -> Dexie (src/lib/db/sync.ts) beim ersten Laden (leerer Cache)
  bzw. manuell per "Aktualisieren"-Button (Cache-Invalidierung); Browse/Such-UI
  unter /karten filtert clientseitig auf den Dexie-Daten (TanStack Query
  cached/orchestriert nur den Ladevorgang, kein Re-Fetch pro Tastenanschlag)
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
- Commit/Push vs. Merge: Claude committet und pusht seinen Arbeitsstand
  grundsätzlich auf den Feature-Branch, auch wenn eine Session-Vorgabe
  "kein Commit durch dich" sagt -- gemeint ist damit "kein Merge ohne
  Freigabe", nicht "kein Commit". Grund: Claude Code on the web läuft in
  einem ephemeren Container ohne lokalen Zugriff für den Nutzer; ohne
  Commit+Push gibt es keinen PR zum Review und die Arbeit geht beim
  Container-Recycling verloren (das hat der Stop-Hook
  `~/.claude/stop-hook-git-check.sh` in M1 zurecht angemahnt). Merge nach
  main bleibt ein separater Schritt und erfolgt nur nach expliziter
  Freigabe durch den Nutzer im Chat.

## Nicht-Ziele / bewusste Einschränkungen
- Kein Empfehlungsalgorithmus (Phase 2, separates Projekt)
- Kein iOS-Store-Release
- Kein eigenes Scraping
- Kein Hosting/Caching von Kartenbildern -> keine Offline-Bilder
- Keine Monetarisierung im MVP (Struktur bleibt erweiterbar)
- Kein Limitless-API-Key im MVP -- Antrag erst sinnvoll, wenn Projekt
  tatsächlich public-facing ist (Formular verlangt begründeten Use-Case)

## Aktueller Stand
- Letztes abgeschlossenes Feature: M1 Kartendatenbank (TCGdex-Client via
  `@tcgdex/sdk`, Dexie-Sync, TanStack Query, Browse/Such-UI unter /karten)
- Nächster Meilenstein: M2
- Offene Entscheidungen: keine

## Checkpoint-Log
<!-- automatisch per Hook, siehe .claude/hooks/append-checkpoint-log.sh -->
| Datum | Meilenstein | Ergebnis | Scope-Drift erkannt? | Aktion |
|---|---|---|---|---|
| 2026-08-08 | M1 | TCGdex-Client (ueber @tcgdex/sdk) + Dexie-Sync (Serie tcgp -> Sets -> volle Karten) + TanStack Query + Browse/Such-UI unter /karten (Namenssuche + Typfilter, beides clientseitig auf Dexie-Daten) umgesetzt. GitHub-Fallback-DB bewusst nicht implementiert, da keine Evidenz fuer Luecken in der tcgp-Serie bei TCGdex; Client-Funktionen bleiben dafuer austauschbar. Vitest erstmals produktiv genutzt (16 Tests: Mapping/Sync/Filter/Bild-URL/UI-Ladezustaende), CI um Test-Stufe erweitert. | Zwei dokumentierte, mit dem Nutzer abgestimmte Abweichungen: (1) @tcgdex/sdk als neue Dependency statt eigenem REST-Client, um Typen/Endpunkte statt aus Doku-Suchtreffern aus dem echten npm-Package zu verifizieren. (2) Bugfix an .claude/hooks/append-checkpoint-log.sh (las noch deutsche Keys statt der laut Vorgabe bereits korrigierten englischen). Kernscope (Karten-Feature) unveraendert. | Beide Punkte in CLAUDE.md (Stack/Architektur) nachgetragen. Kein Live-Smoke-Test gegen die echte TCGdex-API moeglich (Sandbox-Egress-Sperre auf api.tcgdex.net) -- als Tech-Debt/Deploy-Gate dokumentiert. |

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
- TCGdex-Client (M1) wurde in einer Sandbox mit Netzwerk-Egress-Sperre auf
  api.tcgdex.net gebaut -- Typen/Endpunkte sind ueber das offizielle
  `@tcgdex/sdk`-Package (npm) verifiziert, ein echter Live-Smoke-Test gegen
  die API war in der Session aber nicht moeglich. GATE: vor Produktions-Deploy
  /karten einmal gegen die echte API pruefen (z.B. lokal oder im
  Vercel-Preview)

## MCP-Server / externe Tools
- GitHub-Connector -- Repo-Zugriff für Claude Code on the web + Cowork
- TCGdex API -- Kartendaten (Link-only)
- Limitless API -- Meta-/Turnierdaten (nur unauthentifizierte Endpunkte)

## Plugins & Connectors
- GitHub-Connector (Cowork Scheduled Task, read-only + Write auf
  checkpoint-result.json/Report)
- Vercel (git-basiertes Deployment, kein separater Connector nötig)
