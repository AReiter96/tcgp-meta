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
- Meta/Turnierdaten-Client: schlanker eigener `fetch`-Client in
  src/lib/limitless/ (seit M2) -- bewusste Abweichung vom SDK-Pattern der
  TCGdex-Integration, weil fuer die Limitless-API kein offizielles npm-SDK
  existiert (nur ein inoffizieller Python-Wrapper), Typen selbst definiert
  nach dem in der Session verifizierten API-Spec
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
  unauthentifizierte Endpunkte (kein Key, kein Proxy). GET
  /tournaments?game=POCKET liefert die letzten Turniere, GET
  /tournaments/{id}/standings liefert pro Spieler Platzierung, Record UND
  bereits ein fertiges `deck`-Objekt (id, name, icons) -- keine eigene
  Kategorisierung nötig (Korrektur ggü. ursprünglicher Planung, siehe
  nächster Punkt). Kein Dexie-Cache für diese Domäne, nur TanStack Query
  (Turnierdaten ändern sich anders als Kartendaten laufend leicht, Dexies
  Clear-and-Replace-Modell passt hier nicht) (seit M2)
- Archetyp-Gruppierung: getDeckArchetype() (src/lib/archetype.ts) reicht das
  von Limitless bereits kategorisierte `deck`-Feld nur noch durch (Fallback
  "Unbekannt" bei fehlendem/leerem Feld) -- KEINE eigene Kartenlisten-
  Heuristik mehr. Ursprünglich war dafür eine client-seitige Heuristik
  geplant, weil angenommen wurde, Limitless liefere ohne API-Key keine
  Kategorisierung; das stimmt nicht, /standings liefert sie direkt (seit M2
  korrigiert)
- Tierlist-Aggregation (src/lib/tierlist/aggregate.ts): gepoolt über alle
  eingesammelten Turniere (Summe Spieler/Siege/Niederlagen pro Archetyp),
  nicht als Durchschnitt der Einzel-Turnier-Prozentsätze -- vermeidet
  Verzerrung durch unterschiedlich große Turniere (seit M2)
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
- Letztes abgeschlossenes Feature: M2 Meta/Tierlist (Limitless-Client via
  eigenem `fetch`-Client, getDeckArchetype() liest Limitless' `deck`-Feld
  durch statt eigener Heuristik, gepoolte Nutzungsrate-/Winrate-Aggregation
  über die letzten 15 POCKET-Turniere, Tierlist-UI unter /tierlist inkl.
  Fan-Content-Disclaimer)
- Nächster Meilenstein: M3
- Offene Entscheidungen: keine

## Checkpoint-Log
<!-- automatisch per Hook, siehe .claude/hooks/append-checkpoint-log.sh -->
| Datum | Meilenstein | Ergebnis | Scope-Drift erkannt? | Aktion |
|---|---|---|---|---|
| 2026-08-08 | M2 | Limitless-TCG-Client (src/lib/limitless/, eigener fetch-Client statt SDK, da keins existiert) + getDeckArchetype() umgebaut (reicht Limitless' deck-Feld durch statt eigener Kartenlisten-Heuristik, Fallback 'Unbekannt') + gepoolte Aggregation (src/lib/tierlist/aggregate.ts: Nutzungsrate/Winrate/Stichprobengroesse pro Archetyp ueber die letzten 15 abgeschlossenen POCKET-Turniere) + Tierlist-UI unter /tierlist inkl. Fan-Content-Disclaimer. Rate-Limit-Header werden geloggt (nicht hart geblockt). 38 neue/angepasste Vitest-Tests (Client, Archetyp-Fallback, Aggregations-Mathematik inkl. Pooling-vs-Durchschnitt-Test, Page-States). Lint/Typecheck/Test/Build gruen. | Keine inhaltliche Scope-Drift. Eine Korrektur wurde bereits vom Nutzer vor Sessionbeginn vorgegeben (getDeckArchetype() reicht Limitless-Feld durch statt eigener Heuristik) und ist kein eigenstaendiger Drift. Kleinere, dokumentierte Implementierungsentscheidung: separates lib/tierlist/ fuer reine Aggregationslogik zusaetzlich zu lib/limitless/ fuer den I/O-Client (analog zu M1s cards/filter.ts vs. tcgdex/client.ts), war im urspruenglichen Scope-Text nicht explizit benannt aber konsistent mit bestehender Konvention. | Netzwerk zu play.limitlesstcg.com/docs.limitlesstcg.com war in dieser Sandbox blockiert (403 auf CONNECT-Tunnel, wie tcgdex.dev in M1) -- Client gegen den in der Session verifizierten/dokumentierten API-Spec gebaut, kein Live-Smoke-Test moeglich. Neues GATE in CLAUDE.md ergaenzt: vor Produktions-Deploy POCKET-Game-ID, Rate-Limit-Header-Namen und 'abgeschlossenes Turnier'-Semantik gegen echte Responses pruefen. M1s TCGdex-GATE bleibt unveraendert offen (durch M2 nicht beruehrt, keine TCGdex-Aenderungen). Fan-Content-Disclaimer-Risikopunkt: fuer /tierlist erledigt, fuer andere Seiten weiterhin offen. |
| 2026-08-08 | M1 | TCGdex-Client (ueber @tcgdex/sdk) + Dexie-Sync (Serie tcgp -> Sets -> volle Karten) + TanStack Query + Browse/Such-UI unter /karten (Namenssuche + Typfilter, beides clientseitig auf Dexie-Daten) umgesetzt. GitHub-Fallback-DB bewusst nicht implementiert, da keine Evidenz fuer Luecken in der tcgp-Serie bei TCGdex; Client-Funktionen bleiben dafuer austauschbar. Vitest erstmals produktiv genutzt (16 Tests: Mapping/Sync/Filter/Bild-URL/UI-Ladezustaende), CI um Test-Stufe erweitert. | Zwei dokumentierte, mit dem Nutzer abgestimmte Abweichungen: (1) @tcgdex/sdk als neue Dependency statt eigenem REST-Client, um Typen/Endpunkte statt aus Doku-Suchtreffern aus dem echten npm-Package zu verifizieren. (2) Bugfix an .claude/hooks/append-checkpoint-log.sh (las noch deutsche Keys statt der laut Vorgabe bereits korrigierten englischen). Kernscope (Karten-Feature) unveraendert. | Beide Punkte in CLAUDE.md (Stack/Architektur) nachgetragen. Kein Live-Smoke-Test gegen die echte TCGdex-API moeglich (Sandbox-Egress-Sperre auf api.tcgdex.net) -- als Tech-Debt/Deploy-Gate dokumentiert. |

## Bekannte Risiken / Tech Debt
- IP/Legal: Pokémon-Takedown-Historie -- Fan-Content-Disclaimer, keine
  offiziellen Logos/Assets. Seit M2 als `FanContentNotice` auf /tierlist
  umgesetzt; für andere Seiten (z.B. /karten, Startseite) weiterhin offen,
  falls dort ebenfalls gewünscht
- Rate-Limits ohne Key niedriger -- Response-Header beobachten (seit M2:
  src/lib/limitless/client.ts loggt erkannte Rate-Limit-Header via
  console.info/warn, hart parsen/blocken bewusst nicht), bei wiederholtem
  Anschlagen Key-Antrag nachziehen (erst wenn Projekt public-facing genug
  für glaubwürdigen Use-Case-Antrag ist). Seit M2 zusätzlich zu beachten:
  loadTierlistData() lädt Standings für bis zu 15 Turniere parallel
  (Promise.all, fail-fast) und der globale QueryClient-Default (retry: 1)
  wiederholt bei einem einzigen fehlgeschlagenen Aufruf den gesamten Batch
  -- erhöht das Anfragevolumen pro Fehlversuch stärker als M1s einmaliger,
  manueller Karten-Sync
- Archetyp-Heuristik: erledigt (M2) -- keine eigene Kategorisierung mehr
  nötig, Limitless liefert das `deck`-Feld direkt über /standings (siehe
  Architektur-Abschnitt). getDeckArchetype() reicht es nur noch durch
- Impressum/Datenschutz vorerst Platzhalter -- GATE: kein Produktions-Deploy
  vor Ersetzung durch echte Texte
- TCGdex-Client (M1) wurde in einer Sandbox mit Netzwerk-Egress-Sperre auf
  api.tcgdex.net gebaut -- Typen/Endpunkte sind ueber das offizielle
  `@tcgdex/sdk`-Package (npm) verifiziert, ein echter Live-Smoke-Test gegen
  die API war in der Session aber nicht moeglich. GATE: vor Produktions-Deploy
  /karten einmal gegen die echte API pruefen (z.B. lokal oder im
  Vercel-Preview)
- Limitless-Client (M2) wurde ebenfalls in einer Sandbox mit Netzwerk-
  Egress-Sperre gebaut (play.limitlesstcg.com/docs.limitlesstcg.com: 403 auf
  CONNECT-Tunnel) -- gegen den in der Session dokumentierten/verifizierten
  API-Spec entwickelt, aber drei Annahmen daraus sind NICHT gegen eine echte
  Response geprüft: (1) `POCKET` als Game-ID für TCG Pocket (aus der
  URL-Konvention abgeleitet, siehe src/lib/limitless/types.ts), (2) die
  tatsächlichen Namen der Rate-Limit-Response-Header (deshalb case-
  insensitive/mehrere Kandidaten statt eines hart angenommenen Namens), (3)
  ob/wie /tournaments "abgeschlossene" Turniere signalisiert -- die
  dokumentierten Felder (id, game, format, name, date, players) enthalten
  kein `status`-Feld; die App nimmt aktuell einfach die letzten N Turniere
  in Standard-Reihenfolge. GATE: vor Produktions-Deploy einmal gegen die
  echte API prüfen -- fetchGames() aufrufen und `POCKET`/`metagame:true`
  gegenchecken, eine echte /tournaments- und /standings-Response auf
  Status-/Datums-Semantik und tatsächliche Header-Namen sichten

## MCP-Server / externe Tools
- GitHub-Connector -- Repo-Zugriff für Claude Code on the web + Cowork
- TCGdex API -- Kartendaten (Link-only)
- Limitless API -- Meta-/Turnierdaten (nur unauthentifizierte Endpunkte)

## Plugins & Connectors
- GitHub-Connector (Cowork Scheduled Task, read-only + Write auf
  checkpoint-result.json/Report)
- Vercel (git-basiertes Deployment, kein separater Connector nötig)
