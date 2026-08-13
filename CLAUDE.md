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
  nächster Punkt). Bis M3 kein Dexie-Cache für diese Domäne, nur TanStack
  Query -- seit M4 korrigiert: ein persistenter Dexie-TTL-Cache ergänzt
  TanStack Query zusätzlich (siehe eigener Architektur-Punkt
  "Rate-Limit-Caching" weiter unten); TanStack Query bleibt weiterhin die
  In-Memory-Schicht fürs UI, Dexie übernimmt jetzt die
  Rate-Limit-Schonung über Seitenbesuche/Reloads hinweg (seit M2)
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
- Matchup-Aggregation/Counter-Meta-Score (src/lib/matchups/aggregate.ts,
  seit M3): zusätzlich zu Standings wird GET /tournaments/{id}/pairings pro
  Turnier geladen (src/lib/limitless/client.ts: fetchPairings()) und zu einer
  gepoolten Archetyp-vs-Archetyp-Matrix aggregiert. Counter-Meta-Score =
  gepoolte Winrate (dieselbe wins/(wins+losses+ties)-Formel wie die
  Tierlist-Winrate) über alle Spiele gegen die aktuellen Top-5-Nutzungsrate-
  Archetypen kombiniert, NICHT der Durchschnitt der 5 Einzelprozentsätze --
  die geforderte Gewichtung nach tatsächlicher Gegner-Häufigkeit in der
  Stichprobe ergibt sich dadurch automatisch aus derselben Pooling-
  Philosophie wie M2, ohne separate Gewichtungsberechnung. "Unbekannt" ist
  sowohl als Gegner als auch als eigene Zeile ausgeschlossen, nur die
  Top-15-Nutzungsrate-Archetypen bekommen eine eigene Zeile (Long Tail hat
  zu wenig Turnierdaten). Schwellenwert 5 Spiele gilt unabhängig pro
  Einzel-Matchup UND für den Gesamt-Score ("zu wenig Daten" statt
  Prozentzahl). Spiegel-Matchups (eigener Archetyp im eigenen Top-5-
  Gegnerfeld, moeglich fuer Rang 1-5) werden weiterhin gepoolt und in der
  Detailaufschlüsselung angezeigt (MatchupBreakdown.isMirrorMatchup),
  aber seit der Session vom 2026-08-09 aus dem Counter-Meta-Score UND
  dessen 5-Spiele-Schwellenwert der jeweiligen Zeile ausgeschlossen (Score
  zählt nur die verbleibenden bis zu 4 Nicht-Spiegel-Gegner) -- ohne
  Ausschluss haette die tautologisch 50%ige Spiegel-Zelle Rang 1-5
  strukturell gegenüber Rang 6-15 (die nie eigener Top-5-Gegner sind)
  bevorteilt, in genau der Kennzahl, nach der sortiert wird. Der ältere
  Stand ("bewusst nicht ausgeschlossen") war ein dokumentierter
  Zwischenstand aus M3, kein Endzustand. UI unter /matchups zeigt den
  ausgeschlossenen Spiegel-Matchup in der Detailansicht mit Hinweis-Badge
  "nicht im Score" statt ihn stillschweigend weniger relevant erscheinen
  zu lassen. Route bleibt eigenständig statt Erweiterung von /tierlist
  (Begründung: kein Regressionsrisiko für die getestete Tierlist-Seite,
  verdoppeltes Request-Volumen nur bei tatsächlichem Seitenbesuch).
  Pairings-Rohform (seit Live-Fund 2026-08-12, siehe GATE-Historie an
  LimitlessPairing in src/lib/limitless/types.ts): player1/player2 sind
  Username-Strings ohne eingebettetes Deck, kein `outcome`-Feld sondern
  `winner` (Username des Gewinners, 0 = Unentschieden, -1 = Freilos/kein
  Ergebnis). src/lib/matchups/resolvePairings.ts loest das PRO TURNIER
  gegen die zugehoerigen Standings auf (Join ueber LimitlessStanding.player)
  und liefert archetyp-fertige ResolvedPairing[] an aggregate.ts --
  aggregate.ts kennt die Limitless-Rohform seither gar nicht mehr, reine
  Aggregationslogik auf bereits aufgeloesten Daten.
- Rate-Limit-Caching (seit M4): vier kombinierte Maßnahmen gegen das seit M2/
  M3 bekannte 429-Risiko (siehe "Bekannte Risiken" fürs Live-Ergebnis).
  (1) Persistenter Dexie-TTL-Cache (neue Tabelle `limitlessCache`, Dexie-
  Version 2, src/lib/db/db.ts) für Tournaments/Standings/Pairings-Antworten
  in src/lib/limitless/cache.ts -- TTL 1h (angelehnt an die bestehende
  TanStack-`staleTime`-Konvention), Cache-Key ist endpunkt-/
  turnierspezifisch (`tournaments:{game}:{limit}`, `standings:{id}`,
  `pairings:{id}`), keine pauschale Alles-oder-nichts-Invalidierung.
  (2) Geteilter Ladepfad: loadTierlistData() und loadMatchupData() bleiben
  strukturell getrennt (Aggregationslogik unangetastet), importieren aber
  beide dieselben gecachten Fetcher aus src/lib/limitless/cachedClient.ts --
  ein Seitenbesuch (z.B. /tierlist) füllt den Cache für Tournaments/
  Standings, ein nachfolgender Besuch der jeweils anderen Seite bekommt
  dafür Cache-Hits statt erneuter Netzwerk-Calls (Option "geteilte
  Cache-Schicht" statt eines gemeinsamen Hooks -- kleinerer Diff, im Chat
  mit dem Nutzer so entschieden; dedupliziert nicht bei echt
  gleichzeitigem Erstladen beider Seiten, das war ein bewusst akzeptierter
  Kompromiss). (3) Gestaffeltes statt volles Promise.all-Laden bei kaltem
  Cache: src/lib/limitless/batch.ts (`runInBatches`, Default 4er-Batches
  mit 300ms Pause dazwischen) ersetzt den bisherigen Promise.all-Burst über
  alle 15/30 Requests in loadTierlist.ts/loadMatchups.ts, bleibt aber pro
  Batch fail-fast. (4) 429-Backoff auf Einzelrequest-Ebene:
  src/lib/limitless/retry.ts (`fetchWithRetry`) nutzt den `Retry-After`-
  Header (über getLimitlessRateLimitInfo() aus client.ts) falls vorhanden,
  sonst steigenden Default-Backoff, und retried nur den einzelnen
  fehlgeschlagenen Request (nicht den ganzen Batch) bei 429/5xx/
  Netzwerkfehlern (client.ts wirft dafür jetzt `LimitlessApiError` mit
  `status`-Feld statt eines generischen Error). Nach Ausschöpfen der
  Retries wird der Originalfehler weitergeworfen -- der bestehende
  sichtbare Fehlerzustand (kein stiller Teildatensatz) bleibt erhalten.
  Der globale QueryClient-Default `retry: 1` wurde für useTierlist/
  useMatchups auf `retry: 0` überschrieben, um die bisherige Verdopplung
  (Einzelrequest-Retry UND Batch-Retry übereinander) zu vermeiden.
- Offline: Dexie.js für Kartentext/-daten, Workbox für App-Shell -- Bilder
  offline NICHT verfügbar (bewusste Einschränkung). Seit M4 explizite
  Workbox-`runtimeCaching`-Konfiguration (vite.config.ts) statt impliziter
  generateSW-Zero-Config-Defaults: App-Shell (JS/CSS/HTML) wird precached,
  `navigateFallback` macht SPA-Routen (/tierlist, /matchups, /karten)
  offline erreichbar. Bewusst KEIN runtimeCaching-Eintrag für
  TCGdex-Kartenbilder (bleibt Nicht-Ziel) und KEIN Eintrag für die
  Limitless-API (das übernimmt der Dexie-TTL-Cache oben, andere Ebene/
  anderer Zweck: Rate-Limit-Schonung während des Betriebs statt
  Offline-Verfügbarkeit -- ein SW-Cache würde hier ungewollt veraltete
  Turnierdaten vorhalten). CardTile.tsx zeigt bei fehlgeschlagenem
  Kartenbild-Laden seit M4 einen erklärenden Platzhalter (Text
  unterscheidet offline/online via neuem useOnlineStatus-Hook) statt eines
  kaputten Bild-Icons.

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
- Merge-Freigabe: Claude Code darf PRs eigenständig nach main mergen, sobald
  alle Required-Checks gruen sind und keine offenen Review-Kommentare
  bestehen (ab M3). AUSNAHME: Merges, die ein bestehendes GATE aufloesen
  oder den M5-Legal-Platzhalter beruehren, werden weiterhin im Chat
  gemeldet, bevor gemergt wird -- dort ist bewusste menschliche Pruefung
  wichtiger als reine gruene Checks.

## Nicht-Ziele / bewusste Einschränkungen
- Kein Empfehlungsalgorithmus (Phase 2, separates Projekt)
- Kein iOS-Store-Release
- Kein eigenes Scraping
- Kein Hosting/Caching von Kartenbildern -> keine Offline-Bilder
- Keine Monetarisierung im MVP (Struktur bleibt erweiterbar)
- Kein Limitless-API-Key im MVP -- Antrag erst sinnvoll, wenn Projekt
  tatsächlich public-facing ist (Formular verlangt begründeten Use-Case)

## Aktueller Stand
- Letztes abgeschlossenes Feature: UI-Redesign "Broadcast Grid" (Session vom
  2026-08-13, vor M5) -- vollstaendige visuelle Neugestaltung nach einem vom
  Nutzer in Claude Design erstellten Mockup (Projekt "Moodboard-Auswahl
  Broadcast Terminal Arena", Datei `TCGP-Meta Redesign.dc.html`, Richtung A
  "Broadcast Grid": dunkles Terminal-/Broadcast-Theme, Cyan/Pink-Akzente,
  hairline 1px-Rahmen statt Schatten/Radius, Space Grotesk + JetBrains Mono).
  Per DesignSync-MCP aus dem Claude-Design-Projekt gelesen (nicht geraten).
  Neues Tailwind-v4-`@theme`-Token-Set in src/index.css (Farben/Fonts 1:1 aus
  dem Mockup-Screen "06 Design-Tokens"), Space Grotesk/JetBrains Mono
  selbst gehostet (via @fontsource/*, nur Latin+Latin-Ext-Subsets) statt
  Google-Fonts-CDN, damit Workbox sie als Teil des App-Shells precacht
  (Konsistenz mit dem bestehenden Offline-Anspruch, siehe
  Architektur-Abschnitt "Offline"). App-Shell (src/App.tsx) komplett neu:
  Desktop-Sticky-Topbar + Mobil-Hamburger-Menue, beide gespeist aus einem
  neuen `HeaderSlot`-Context (src/components/layout/), ueber den
  Tierlist/Matchups/Karten ihre eigene Aktualisieren-Aktion (inkl.
  seiteneigener refetch/refresh-Logik) und optional eine Live-Meta-Zeile
  (Turnier-/Spieleranzahl, letzter Datenstand) in den globalen Topbar-Slot
  registrieren -- Context bewusst in zwei Teil-Contexts (Wert/Setter)
  gesplittet, damit ein Slot-Update nur den App-Shell neu rendert und nicht
  die registrierende Seite selbst (sonst Render-Schleife). Zwei echte
  strukturelle Aenderungen ueber reines Re-Styling hinaus: (1) Tierlist
  gruppiert Archetypen jetzt in S/A/B/C-Tier-Baender (neues
  src/lib/tierlist/tiers.ts, `groupIntoTiers()`, Schwellenwerte aus dem
  Mockup: S >=52 WR & >=2.5 USE, A >=50 WR, B 46-50 WR, C <46 WR) statt
  einer flachen Liste; (2) Matchups von einer Aufklapp-Liste zu einer
  echten Archetyp-vs-Archetyp-Heatmap-Matrix umgebaut (neues
  src/lib/matchups/cellColor.ts fuer die 5-stufige Winrate-Farbskala plus
  Spiegel-/Zu-wenig-Daten-Sonderzellen) -- moeglich ohne Aenderung an
  aggregateMatchupStats(), da row.matchups[] pro Zeile bereits denselben
  global berechneten Top-5-Gegnersatz in identischer Reihenfolge liefert
  (in dieser Session verifiziert, siehe src/lib/matchups/aggregate.ts:165-
  185). Karten-Seite erhaelt Chip-Typfilter statt `<select>`,
  `/`-praefixierte Suche, breiteres Grid und (neu) die
  Fan-Content-Disclaimer, die vorher nur auf Tierlist/Matchups stand.
  Drei Architekturfragen vor Umsetzung per Rueckfrage im Chat geklaert
  (nicht eigenmaechtig entschieden): Meta-Zeile mit echten Daten statt
  Platzhalter (kleine Erweiterung von loadTierlistData()/loadMatchupData()
  um `meta: {tournamentCount, totalPlayers}`), selbst gehostete statt
  CDN-Fonts, echte Context-Integration statt rein visuellem Topbar-Button.
  133 Tests gesamt (vorher 109), davon neu: tiers.test.ts (8),
  cellColor.test.ts (15), Matchups.test.tsx auf die neue Grid-Struktur
  umgeschrieben. Lint/Typecheck/Test/Build lokal gruen. ERSTMALS in diesem
  Log: echter Live-Browser-Check GEGEN DIE PRODUKTIONS-API war in dieser
  Sandbox moeglich (kein Egress-Block wie in allen vorherigen Sessions) --
  /tierlist, /matchups und /karten mit echten Limitless-/TCGdex-Daten bei
  1280px UND 375px verifiziert, inkl. Mobil-Hamburger-Menue-Interaktion und
  Konsolen-Fehlerfreiheit (ein waehrend der Session gefundener React-Key-
  Kollisionswarnung bei Decks mit doppeltem Icon-Fragment wurde noch in
  derselben Session behoben, key jetzt `${icon}-${index}` statt nur
  `icon`). Details siehe Checkpoint-Log-Zeile unten
- Vorheriger Fix: Bugfix Deck-Icon-URLs (Session vom
  2026-08-12, vor M5, dritter Teil derselben Debug-Session) -- Deck-Icons
  auf /tierlist und /matchups zeigten durchgaengig "?"-Platzhalter statt
  echtem Bild. Root Cause: LimitlessDeck.icons liefert nur nackte
  Dateinamen-Fragmente statt vollstaendiger URLs. Live-verifizierte
  korrekte Basis-URL: https://r2.limitlesstcg.net/pokemon/gen9/{icon}.png.
  Fix: neues buildDeckIconUrl() (src/lib/limitless/client.ts), spiegelt das
  bestehende buildCardImageUrl()-Muster aus der TCGdex-Integration. Details
  siehe Checkpoint-Log-Zeile unten
- Vorheriger Fix (selbe Debug-Session, Teil 2): Bugfix Matchup-Pairings-
  Rohform (2026-08-12) -- nach dem
  Crash-Fix (player2-Feld) zeigte eine Live-Verifikation im Browser, dass
  /matchups zwar nicht mehr abstuerzt, aber fuer jeden Archetyp "0 Spiele"
  zeigt. Root Cause: player1/player2 sind Username-Strings ohne
  eingebettetes Deck (nicht {name,deck}-Objekte wie angenommen), und es gibt
  kein outcome-Feld sondern winner (Username/0/-1). Fix: neues
  src/lib/matchups/resolvePairings.ts loest das per Join gegen die
  Standings desselben Turniers auf. Details siehe Checkpoint-Log-Zeile unten
- Vorheriger Fix (selbe Debug-Session, Teil 1): Bugfix Matchup-Pairings-
  Absturz (2026-08-12) -- /matchups stuerzte auf Production ab, weil ein
  Freilos (Bye) player2 als fehlendes Feld (undefined) statt player2:null
  liefert.
- Vorheriges Feature: M4 (Session vom 2026-08-09) -- Deck-Icon-
  Bugfix (DeckIcon.tsx mit onError-Fallback statt kaputter Bild-Box auf
  Tierlist/Matchups), PWA-/Offline-Polish (explizite Workbox-Strategie,
  Offline-Hinweis auf CardTile statt kaputtem Kartenbild, neue generische
  Platzhalter-App-Icons inkl. maskable-Variante) und Rate-Limit-Caching
  (Dexie-TTL-Cache + geteilter Ladepfad Tierlist/Matchups + gestaffeltes
  Laden + 429-Retry/Backoff, siehe Architektur-Abschnitt "Rate-Limit-
  Caching"). Details siehe Checkpoint-Log-Zeile M4 unten
- Nächster Meilenstein: M5
- Offene Entscheidungen: keine

## Checkpoint-Log
<!-- automatisch per Hook, siehe .claude/hooks/append-checkpoint-log.sh -->
| Datum | Meilenstein | Ergebnis | Scope-Drift erkannt? | Aktion |
|---|---|---|---|---|
| 2026-08-13 | UI-Redesign "Broadcast Grid" (vor M5) | Auf Nutzerauftrag ("Implement: TCGP-Meta Redesign.dc.html") ein vom Nutzer in Claude Design erstelltes Mockup (Projekt "Moodboard-Auswahl Broadcast Terminal Arena", Richtung A "Broadcast Grid") per DesignSync-MCP gelesen und vollstaendig umgesetzt -- Plan-Mode genutzt, Explore-Agent hat vorab den bestehenden Code kartiert (keine Design-Tokens, kein Nav-Shell, Matchups als Aufklapp-Liste statt Matrix). Neues Tailwind-v4-`@theme`-Token-Set (src/index.css) 1:1 aus dem Mockup-Tokens-Screen, Space Grotesk/JetBrains Mono selbst gehostet ueber @fontsource (nur Latin+Latin-Ext, damit Workbox sie im App-Shell precacht statt Google-Fonts-CDN). Komplett neue App-Shell (src/App.tsx: Sticky-Topbar + Mobil-Hamburger) gespeist aus neuem `HeaderSlot`-Context (src/components/layout/), ueber den Tierlist/Matchups/Karten ihre Aktualisieren-Aktion + optionale Live-Meta-Zeile (Turnier-/Spieleranzahl, Datenstand) registrieren; Context bewusst in Wert-/Setter-Teil gesplittet, um eine Render-Schleife zwischen Seite und Topbar zu vermeiden. Zwei strukturelle Aenderungen ueber reines Re-Styling hinaus: Tierlist gruppiert jetzt in S/A/B/C-Tier-Baender (neues src/lib/tierlist/tiers.ts, Schwellenwerte aus dem Mockup), Matchups von Aufklapp-Liste zu echter Heatmap-Matrix umgebaut (neues src/lib/matchups/cellColor.ts fuer die 5-stufige Winrate-Farbskala + Spiegel-/Zu-wenig-Daten-Sonderzellen), moeglich ohne aggregateMatchupStats()-Aenderung, da row.matchups[] pro Zeile bereits denselben global berechneten Top-5-Gegnersatz in identischer Reihenfolge liefert (verifiziert gegen aggregate.ts). loadTierlistData()/loadMatchupData() liefern jetzt zusaetzlich `meta: {tournamentCount, totalPlayers}` fuer die Topbar-Meta-Zeile. Karten-Seite: Chip-Typfilter statt `<select>`, `/`-praefixierte Suche, Fan-Content-Disclaimer ergaenzt (vorher nur Tierlist/Matchups). 133 Tests gesamt (vorher 109, neu u.a. tiers.test.ts und cellColor.test.ts), Lint/Typecheck/Test/Build lokal gruen. Erstmals in dieser Session-Historie war echter Live-Browser-Zugriff auf die Produktions-API moeglich (kein Sandbox-Egress-Block wie in allen vorherigen Sessions) -- /tierlist, /matchups, /karten bei 1280px und 375px inkl. Mobil-Menue gegen echte Limitless-/TCGdex-Daten verifiziert; eine dabei gefundene React-Key-Kollision bei Decks mit doppeltem Icon-Fragment wurde noch in derselben Session behoben. | Keine inhaltliche Scope-Drift -- direkte Umsetzung des vom Nutzer explizit erbetenen Mockups. Drei Architekturfragen (Meta-Zeile mit echten vs. Platzhalter-Daten, selbst gehostete vs. CDN-Fonts, echte Context-Integration vs. rein visueller Topbar-Button) vor Implementierung per AskUserQuestion geklaert statt eigenmaechtig entschieden. Kleinere, im Auftrag nicht explizit benannte Implementierungsentscheidungen: HeaderSlot als zwei getrennte Contexts (Wert/Setter) statt einem kombinierten, um die beschriebene Render-Schleife strukturell auszuschliessen; Tierlist-Sortier-Umschalter (Nutzung/Winrate) als kleine zusaetzliche clientseitige Funktion ergaenzt, da im Mockup vorgesehen und ohne neue Daten umsetzbar. | Commit/Push erfolgt in derselben Session direkt auf main statt Feature-Branch+PR (abweichend von der in "Konventionen" dokumentierten Standard-Workflow) -- auf expliziten Nutzerwunsch und weil diese Session lokal-interaktiv mit direktem Nutzerzugriff laeuft, nicht in einem ephemeren Cloud-Container (die dortige PR-Pflicht-Begruendung greift hier nicht). Keine bestehenden GATEs beruehrt oder aufgeloest. Tierlist zeigt jetzt alle 279 echten Archetypen inkl. langem Tail an 1-Spieler-Decks in Tier C (kein Cutoff) -- das Mockup ging von einer kleinen kuratierten Beispielliste aus; als Beobachtung dokumentiert, kein Bug, siehe "Bekannte Risiken". |
| 2026-08-12 | Bugfix Deck-Icon-URLs (vor M5, Teil 3 derselben Debug-Session) | Auf explizite Nachfrage des Nutzers ("kuemmere dich um das Deck Icon Problem", nachdem der Pairings-Fix aus Teil 2 gemergt und live verifiziert war) das seit M4 offene Deck-Icon-GATE vollstaendig geloest. Root Cause: LimitlessDeck.icons liefert nur nackte Dateinamen-Fragmente (z.B. "lucario-mega") statt vollstaendiger Bild-URLs; der Code reichte diesen String unveraendert bis in `<img src>` durch (aufloest relativ zur eigenen App-Domain -> 404). Vor der Implementierung per Live-Browser-Check verifiziert statt geraten: (1) direkter Abruf der bisher in den Test-Fixtures angenommenen Basis-URL (limitlesstcg.nyc3.digitaloceanspaces.com/pocket/...) ergab 403 AccessDenied -- diese Annahme war ebenfalls nie echt geprueft; (2) echte Limitless-Seite (play.limitlesstcg.com/decks?game=POCKET) im Browser geladen und deren tatsaechlich verwendete Icon-URLs ausgelesen: https://r2.limitlesstcg.net/pokemon/gen9/{icon}.png, exakt dieselben Fragment-Namen wie aus der eigenen API; (3) Direktaufruf https://r2.limitlesstcg.net/pokemon/gen9/furfrou.png -> 200, echtes PNG bestaetigt. Fix: neue Konstante LIMITLESS_DECK_ICON_BASE (src/lib/limitless/types.ts) + Funktion buildDeckIconUrl() (src/lib/limitless/client.ts) -- spiegelt bewusst 1:1 das bereits etablierte buildCardImageUrl()-Muster der TCGdex-Integration (reiner String-Builder, an der Render-Stelle aufgerufen, dediziert getestet) statt ein neues Muster zu erfinden. Aufgerufen in Tierlist.tsx/Matchups.tsx an der bestehenden DeckIcon-Renderstelle; DeckIcon.tsx selbst unveraendert. Test-Fixtures (src/test/fixtures/limitless.ts, Tierlist.test.tsx, Matchups.test.tsx) von der widerlegten Fake-Domain auf realistische nackte Fragmente umgestellt, 4 neue Tests (2x buildDeckIconUrl-Unit-Tests, 2x Regressionstest pro Seite dass das gerenderte `<img src>` tatsaechlich ueber buildDeckIconUrl aufgeloest wird -- vorher pruefte keiner der beiden Seiten-Tests das img-Element ueberhaupt). 109 Tests gesamt (vorher 105). Lint/Typecheck/Test/Build lokal gruen. | Keine inhaltliche Scope-Drift -- direkte Umsetzung der vom Nutzer explizit erbetenen Aufgabe. Plan-Mode genutzt: vor Implementierung wurde die Basis-URL-Annahme aktiv per Live-Browser-Check verifiziert statt (wie beim urspruenglichen M4-Fix und den alten Test-Fixtures) nur zu raten -- eine Lehre direkt aus dem vorherigen Pairings-Rohform-Fund derselben Session, wo genau dieses Muster (ungeprueft angenommene Datenform) bereits zweimal zu Bugs fuehrte. | GATE "Deck-Icons" in CLAUDE.md vollstaendig aufgeloest (siehe "Bekannte Risiken"). Live-Verifikation auf Production nach Merge steht zum Zeitpunkt dieses Log-Eintrags noch aus -- wird analog zu den beiden vorherigen Fixes dieser Session nachgetragen. |
| 2026-08-12 | Bugfix Matchup-Pairings-Rohform (vor M5, Teil 2 derselben Debug-Session) | Nach dem Merge des Crash-Fixes (PR #14, Teil 1 dieser Session) wurde /matchups live im Browser verifiziert (IndexedDB-Cache der echten Production-Seite direkt inspiziert, da Netzwerkzugriff auf play.limitlesstcg.com aus der Sandbox weiterhin blockiert ist -- der Production-Cache selbst war aber zugaenglich). Ergebnis: kein Absturz mehr, aber JEDER Archetyp zeigte "0 Spiele/zu wenig Daten", obwohl 15 Turniere mit echten Pairings im Cache lagen. Root Cause: die gesamte urspruengliche LimitlessPairing-Annahme (seit M3) war falsch, nicht nur die Freilos-Kodierung aus Teil 1. Tatsaechliche Form: player1/player2 sind Username-STRINGS ohne eingebettetes Deck (`"username".deck` ist in JS `undefined`, wirft nicht -- deshalb kein zweiter Crash, nur stille Fehlkategorisierung als "Unbekannt" fuer praktisch jedes Match), kein `outcome`-Feld sondern `winner` (Username des Gewinners, 0 = Unentschieden, -1 = Freilos/kein Ergebnis). Fix: LimitlessPairing in src/lib/limitless/types.ts komplett neu typisiert (player1/player2: string, winner: string\|0\|-1, plus phase/table/match), LimitlessStanding um `player`-Feld (Join-Schluessel) ergaenzt. Neues src/lib/matchups/resolvePairings.ts loest Pairings PRO TURNIER (nicht turnierweit gemeinsam, da derselbe Username in unterschiedlichen Turnieren unterschiedliche Decks gespielt haben kann) gegen die zugehoerigen Standings auf und liefert archetyp-fertige ResolvedPairing[]. aggregate.ts kennt die Limitless-Rohform seither gar nicht mehr (buildMatchupMatrix operiert direkt auf ResolvedPairing[], keine Null-Checks mehr noetig -- die gehoeren jetzt zu resolvePairings()). loadMatchups.ts joint pro Turnier vor dem Flatten. Tests: aggregate.test.ts auf ResolvedPairing[] umgestellt (Bye-/outcome-null-Tests dorthin verschoben, wo sie jetzt hingehoeren: neues resolvePairings.test.ts, 8 Tests -- Join, Freilos-Skip, winner-Kodierung player1/player2/draw/unresolvable, Unbekannt-Fallback bei fehlendem Standings-Eintrag oder deck:null, Mehrfach-Pooling). Fixtures (src/test/fixtures/limitless.ts) und tierlist/aggregate.test.ts um das neue `player`-Feld ergaenzt. 105 Tests gesamt (vorher 100), Lint/Typecheck/Build gruen. ZUSAETZLICH zur Test-Suite gegen echte Production-Daten verifiziert: Pairings+Standings eines echten Turniers (140 Pairings) direkt aus dem Production-IndexedDB-Cache extrahiert und durch resolvePairings()+aggregateMatchupStats() laufen lassen (Node-Skript, ausserhalb der Test-Suite) -- 126 von 140 Pairings korrekt aufgeloest (14 Freilose/nicht auswertbare Ergebnisse korrekt uebersprungen), echte Archetyp-Namen (z.B. "Golbat Absol" vs. "Pachirisu") korrekt zugeordnet, keine "0 Spiele"-Zeilen mehr. | Keine inhaltliche Scope-Drift -- direkte Fortsetzung des vom Nutzer erbetenen "pruefen ob noch etwas offen ist" nach dem Merge von Teil 1; der neue Fund wurde vor der Umsetzung im Chat gemeldet und die Umsetzung explizit per Rueckfrage freigegeben (nicht eigenmaechtig entschieden). Eine kleinere, im Auftrag nicht explizit benannte Implementierungsentscheidung: resolvePairings() als eigenes Modul statt die Join-Logik direkt in aggregate.ts oder loadMatchups.ts zu verschachteln -- trennt "rohe API-Form verstehen" von "reine Aggregationsmathematik" (letzteres bleibt dadurch, wie tierlist/aggregate.ts, eine pure Funktion ohne Limitless-Typkenntnis), konsistent mit der bestehenden lib/limitless (I/O) vs. lib/matchups (Aggregation) Trennung. | Der verbleibende vierte GATE-Punkt (ob ein /pairings-Call wirklich ALLE Runden liefert, nicht nur die aktuelle) bleibt unverifiziert -- liess sich aus einem einzelnen gecachten Response nicht pruefen. checkpoint-result.json bewusst am Repo-Root abgelegt. Der bereits gemergte Branch aus Teil 1 (fix/matchups-pairings-missing-player2) wurde nach Nutzer-Bestaetigung remote geloescht (vollstaendig in main gemergt, reine Aufraeumaktion). Da dieser Fix ebenfalls einen GATE-Punkt aufloest (wie Teil 1), greift die CLAUDE.md-Merge-Ausnahme: Merge nach main wird im Chat gemeldet statt eigenstaendig durchgefuehrt, auch bei gruenen Checks. |
| 2026-08-12 | Bugfix Matchup-Pairings-Absturz (vor M5) | Nutzer meldete per Screenshot einen Absturz auf der Production-Seite /matchups: "Matchup-Daten konnten nicht geladen werden: can't access property "deck", t.player2 is undefined". Root Cause in buildMatchupMatrix() (src/lib/matchups/aggregate.ts): der Bye-Check `pairing.player2 === null` erwartete player2:null fuer Freilose (Annahme seit M3, nie gegen echte API verifiziert -- siehe GATE Pairings-Response-Form), die echte Limitless-API laesst das player2-Feld bei einem Freilos aber komplett weg (undefined) statt es auf null zu setzen. `pairing.player2.deck` griff dadurch auf undefined zu und warf. Fix: LimitlessPairing.player2 in src/lib/limitless/types.ts als optional typisiert (player2?: LimitlessPairingPlayer \| null), Check in aggregate.ts auf `pairing.player2 == null` erweitert (lose Gleichheit faengt sowohl null als auch undefined ab, keine Verhaltensaenderung fuer den bereits abgedeckten null-Fall). Testfixture-Helper `pairing()` in aggregate.test.ts um einen dritten Bye-Modus ('bye-missing', player2-Feld komplett weggelassen) erweitert, 1 neuer Regressionstest fuer genau diesen Absturz (100 Tests gesamt, vorher 99). Lint/Typecheck/Test/Build lokal gruen. Live-Verifikation auf Production nach dem Fix stand zum Zeitpunkt dieses Log-Eintrags noch aus (Merge/Deploy noch nicht erfolgt). | Keine inhaltliche Scope-Drift -- reiner Bugfix auf einen vom Nutzer gemeldeten Live-Absturz, kein zusaetzlicher Scope angefasst. Der Fix loest damit einen Teilaspekt (Freilos-Kodierung) des seit M3 offenen GATEs "Limitless-Pairings-Response-Form" auf; die uebrigen drei Punkte des GATEs (Rundenabdeckung pro Call, exakte Feldnamen ausserhalb player2, outcome-Kodierung) bleiben unverifiziert, GATE bleibt daher als teilweise offen bestehen. | GATE-Eintrag "Limitless-Pairings-Response-Form" in "Bekannte Risiken" um den Live-Fund und die Teil-Aufloesung ergaenzt (nicht vollstaendig geschlossen). Da dieser Fix einen bestehenden GATE-Punkt aufloest, greift die CLAUDE.md-Merge-Ausnahme: Merge nach main wird im Chat gemeldet statt eigenstaendig durchgefuehrt, auch bei gruenen Checks. |
| 2026-08-09 | M4 | Drei Teile umgesetzt (PR #12). Teil A (Icon-Bugfix): neue DeckIcon-Komponente (src/components/DeckIcon.tsx) mit onError-Fallback statt kaputter Bild-Box, verdrahtet in Tierlist.tsx/Matchups.tsx; Root Cause ohne Live-Zugriff nicht zweifelsfrei bestimmbar, Fix daher robust statt ursachenspezifisch. Kartentyp-Icon-Teil bewusst NICHT umgesetzt -- im Code existiert dafuer keine Icon-Logik, CLAUDE.md-Doku war hier ungenau (im Chat mit Nutzer geklaert, Doku jetzt korrigiert). Teil B (PWA/Offline): expliziter Workbox-runtimeCaching-Block in vite.config.ts (navigateFallback, explizite globPatterns, bewusst KEIN Caching fuer TCGdex-Bilder/Limitless-API mit Begruendung als Kommentar); neuer useOnlineStatus-Hook + CardTile.tsx zeigt bei fehlgeschlagenem Kartenbild einen erklaerenden Platzhalter statt kaputtem Bild; neue generische Platzhalter-App-Icons (192/512px + maskable-Variante, kein Pokemon-Bezug) ersetzen die alten 412/1495-Byte-Dateien. Teil C (Rate-Limit-Caching, alle vier Massnahmen kombiniert): (1) Dexie-TTL-Cache (neue Tabelle limitlessCache, Dexie v2, TTL 1h) in src/lib/limitless/cache.ts; (2) geteilter Ladepfad -- loadTierlistData()/loadMatchupData() bleiben strukturell getrennt, nutzen aber beide dieselben gecachten Fetcher aus neuem src/lib/limitless/cachedClient.ts (Option 'geteilte Cache-Schicht' statt gemeinsamem Hook, im Chat mit Nutzer entschieden); (3) gestaffeltes Laden in 4er-Batches statt Promise.all-Burst (neues src/lib/limitless/batch.ts); (4) 429/5xx-Backoff auf Einzelrequest-Ebene mit Retry-After-Unterstuetzung (neues src/lib/limitless/retry.ts, client.ts wirft jetzt LimitlessApiError mit status-Feld), globaler QueryClient-Retry fuer useTierlist/useMatchups auf 0 gesetzt um Doppel-Retry zu vermeiden. 36 neue Vitest-Tests (DeckIcon, useOnlineStatus, CardTile, Cache-TTL, Retry/Backoff, Batch, cachedClient, loadTierlist/loadMatchups inkl. dediziertem Integrationstest fuer den geteilten Ladepfad -- 99 Tests gesamt, vorher 63). Lint/Format/Typecheck/Test/Build gruen (CI auf PR #12 gruen). CLAUDE.md aktualisiert: Architektur-Abschnitt um Rate-Limit-Caching-Strategie ergaenzt, Meta/Turnierdaten-Bullet korrigiert (Dexie-Cache existiert jetzt doch), Offline-Bullet um explizite Workbox-Strategie ergaenzt, Rate-Limit-Risikopunkt abgeschwaecht (nicht geloescht), Icon-Bug-Tech-Debt als erledigt markiert inkl. Korrektur des Kartentyp-Icon-Fehleintrags, alle drei bestehenden GATEs mit Datum durchgegangen, naechster Meilenstein M5. Live-Verifikation (Deck-Icon-Rendering, Offline-Kartenbild-Hinweis, PWA-Manifest, Lighthouse, /matchups-429-Verhalten) war in dieser Session nicht moeglich: ueber den Agent-Proxy-Status bestaetigt, dass die Sandbox eine GENERELLE Egress-Sperre hat (403 auf CONNECT fuer jede nicht freigegebene Domain) -- nicht nur play.limitlesstcg.com betroffen, auch die eigene Vercel-Preview-URL war ueber WebFetch/curl nicht erreichbar. Der Vercel-Preview-Build/-Deploy selbst wurde aber erfolgreich verifiziert (PR-Check 'Vercel Preview Comments' gruen, Deployment-Status 'Ready'). | Keine inhaltliche Scope-Drift. Drei Klaerungsfragen wurden vor Implementierung im Chat mit dem Nutzer geklaert statt eigenmaechtig entschieden: (1) Kartentyp-Icon-Diskrepanz -> Scope auf den tatsaechlich existierenden Deck-Icon-Bug beschraenkt statt einen Fix fuer nicht existenten Code zu erfinden, (2) geteilter Ladepfad -> Option 'geteilte Cache-Schicht' statt gemeinsamem Hook gewaehlt (kleinerer Diff, geringeres Regressionsrisiko), (3) PWA-Icons -> generisches Platzhalter-Icon (kein Pokemon-Bezug) statt nur Manifest-Politur. Alle drei folgen den im Auftrag explizit vorgesehenen Rueckfragen bei mehreren sinnvollen Varianten, kein eigenmaechtiger Drift. Kleinere, im Auftrag nicht explizit benannte Implementierungsentscheidungen: client.ts wirft jetzt eine typisierte LimitlessApiError mit status-Feld (statt generischem Error), damit Retry gezielt auf 429/5xx statt z.B. 404 reagieren kann -- Message-Format unveraendert, bestehender Test rejects.toThrow(/429/) bleibt gueltig. QueryClient-retry fuer useTierlist/useMatchups explizit auf 0 gesetzt statt beim globalen Default (1) zu bleiben, um die bisherige Batch-Verdopplung durch Einzelrequest-Retry-obendrauf zu vermeiden -- direkte Konsequenz aus Punkt 4 des Auftrags, keine eigenstaendige Scope-Ausweitung. | Kein API-Key-Antrag bei Limitless (weiterhin Nicht-Ziel). Keine echten Impressum-/Datenschutz-Texte (bleibt M5). checkpoint-result.json bewusst am Repo-Root abgelegt (nicht unter .claude/), wie in M1/M3/Bugfix-Session gelernt. Live-Verifikation (Icon-Rendering auf echter URL, Offline-Verhalten, Lighthouse, /matchups-Rate-Limit-Neubesuch) konnte in dieser Session trotz Versuch nicht durchgefuehrt werden (generelle Sandbox-Egress-Sperre, siehe Ergebnis-Feld) -- bleibt als GATE fuer einen Production-/Browser-Check durch den Nutzer oder eine zukuenftige Session mit Netzwerkzugriff offen, analog zu den bereits bestehenden Limitless-GATEs. Bestehende GATEs (TCGdex, Limitless-Rate-Limit-Header, Pairings-Response-Form) einzeln mit Datum 2026-08-09 durchgegangen, inhaltlich von dieser Session nicht aufgeloest. Merge eigenstaendig bei gruenen Checks vorgesehen (CI auf PR #12 bereits gruen), da diese Session kein bestehendes GATE aufloest (nur ein neues, das Deck-Icon-Live-Verifikations-GATE, ergaenzt) und den M5-Legal-Platzhalter nicht beruehrt -- Ausnahme der Merge-Konvention greift damit nicht. |
| 2026-08-09 | Bugfix Spiegel-Matchup (vor M4) | aggregateMatchupStats() (src/lib/matchups/aggregate.ts) angepasst: Spiegel-Matchup (eigener Archetyp im eigenen Top-5-Gegnerfeld, moeglich fuer Rang 1-5) wird jetzt aus dem Counter-Meta-Score UND dessen 5-Spiele-Schwellenwert der jeweiligen Zeile ausgeschlossen (neues Feld MatchupBreakdown.isMirrorMatchup, Score/gamesPlayed/hasSufficientData zaehlen nur die verbleibenden bis zu 4 Nicht-Spiegel-Gegner), bleibt aber weiterhin gepoolt in der Detailaufschluesselung sichtbar. Behebt einen strukturellen Vorteil fuer Rang 1-5 ggue. Rang 6-15 in genau der Kennzahl, nach der die Rangliste sortiert wird (tautologisch 50%ige Spiegel-Zelle floss vorher automatisch mit ein). Matchups.tsx: Hinweis-Badge "Spiegel / nicht im Score" auf dem Spiegel-Matchup in der Aufklapp-Detailansicht statt stillem Weglassen. 4 neue/angepasste Vitest-Tests in aggregate.test.ts (Score-Differenz mit/ohne Spiegel-Ausschluss, Schwellenwert-Konsistenz bei ausschliesslich Spiegel-Partien, Regressionsschutz fuer Rang 6-15, isMirrorMatchup-Flag auf der Detailaufschluesselung) + 1 neuer Test in Matchups.test.tsx fuer den Hinweis-Badge (63 Tests gesamt, vorher 59). Lint/Format/Typecheck/Test/Build gruen. CLAUDE.md-Architekturbullet zur Matchup-Aggregation korrigiert (alter Text beschrieb den ungefilterten Zwischenstand aus M3 als bewusste Entscheidung). | Keine inhaltliche Scope-Drift. Umsetzung folgt dem im Auftrag vorgegebenen Fix 1:1 (Spiegel-Ausschluss aus Score, Detailansicht bleibt sichtbar mit Hinweis). Eine kleinere, im Auftrag nicht explizit benannte Implementierungsentscheidung: gamesPlayed/hasSufficientData auf Zeilenebene (nicht nur counterMetaScorePercent) beziehen sich konsistent ebenfalls nur auf die Nicht-Spiegel-Gegner, damit die angezeigte Stichprobengroesse zur angezeigten Score-Berechnung passt -- sonst waere ein Archetyp mit ausschliesslich Spiegel-Partien faelschlich als 'ausreichend Daten' markiert worden, obwohl der Score dafuer 0 zaehlbare Spiele haette. Konsistent mit der bestehenden Pooling-Philosophie, keine eigenstaendige Scope-Ausweitung. | Kein Rate-Limit-Retry/Backoff angefasst (bleibt M4), kein Icon-Rendering-Bugfix (separate Session, wie vorgegeben). checkpoint-result.json bewusst am Repo-Root abgelegt (nicht unter .claude/), wie in M3 gelernt (Stop-Hook append-checkpoint-log.sh liest nur diesen Pfad). Kein Live-Smoke-Test noetig/durchgefuehrt, da reine Client-seitige Aggregationslogik ohne Aenderung an API-Calls oder Response-Verarbeitung -- bestehende GATEs (Limitless-Client, Pairings-Response-Form) unveraendert, von dieser Session nicht beruehrt. Merge eigenstaendig bei gruenen Checks vorgesehen, da diese Session kein bestehendes GATE aufloest und den M5-Legal-Platzhalter nicht beruehrt (Ausnahme der Merge-Konvention greift nicht). |
| 2026-08-09 | M3 | Matchup-Filter/Counter-Meta-Score: fetchPairings() in src/lib/limitless/client.ts (GET /tournaments/{id}/pairings, ein Call pro Turnier, reused private limitlessFetch<T>) + neue Typen LimitlessPairing/LimitlessPairingPlayer/LimitlessPairingOutcome. Neues src/lib/matchups/aggregate.ts: gepoolte Archetyp-vs-Archetyp-Matchup-Matrix aus allen Pairings, Counter-Meta-Score = gepoolte Winrate ueber die Top-5-Nutzungsrate-Archetypen (nicht Durchschnitt der 5 Einzelprozentsaetze -- Gewichtung nach tatsaechlicher Gegner-Haeufigkeit ergibt sich automatisch aus der Pooling-Philosophie wie M2), 'Unbekannt' als Gegner UND als eigene Zeile ausgeschlossen, Top-15-Cutoff bei eigenen Decks, 5-Spiele-Schwellenwert unabhaengig pro Einzel-Matchup UND Gesamt-Score, Spiegel-Matchups bewusst nicht ausgeschlossen (dokumentiertes Verhalten: tautologisch 50%). Neues src/lib/matchups/loadMatchups.ts (reused DEFAULT_TOURNAMENT_LIMIT + aggregateArchetypeStats aus M2, fail-fast Promise.all analog loadTierlistData) + src/hooks/useMatchups.ts (TanStack-Query-Wrapper analog useTierlist). Neue Seite /matchups (src/pages/Matchups.tsx, eigene Route statt Tierlist-Erweiterung -- Entscheidung im Chat mit Nutzer getroffen) inkl. Fan-Content-Disclaimer, Aufklapp-Detailansicht pro Archetyp-Zeile, 'zu wenig Daten'-Badge auf Zeilen- und Detailebene. 21 neue Vitest-Tests (aggregate.test.ts: 14, Matchups.test.tsx: 6, client.test.ts-Erweiterung: 1) -- Pooling-Korrektheit, Gewichtungs-Beweis (gepoolt != Durchschnitt der 5 Einzelprozentsaetze), Schwellenwert-Grenzfaelle (4 vs. 5 Spiele, pro Matchup UND aggregiert), Top-5/Top-15-Cutoff, Unbekannt-Ausschluss, Bye/outcome:null-Handling, Spiegel-Matchup-Verhalten, Sortier-Stabilitaet. Lint/Format/Typecheck/Test(59 gesamt)/Build gruen. | Keine inhaltliche Scope-Drift. Route-Entscheidung (eigene Seite /matchups vs. Tierlist-Erweiterung) war im Auftrag explizit als offene Frage markiert und wurde vor Implementierung per Rueckfrage im Chat geklaert (nicht eigenmaechtig entschieden) -- kein Drift, sondern die vorgesehene Klaerung. Kleinere, im Plan bereits dokumentierte Implementierungsentscheidungen: 'Unbekannt' aus Top-5-Gegnern UND Top-15-eigenen-Decks ausgeschlossen (Begruendung im Doc-Comment), Spiegel-Matchups bewusst gepoolt statt ausgeschlossen, separates lib/matchups/ analog lib/tierlist/ (etablierte Konvention seit M1/M2) -- alles konsistent mit bestehenden Konventionen, keine eigenstaendige Scope-Ausweitung. | checkpoint-result.json bewusst am Repo-Root abgelegt statt unter .claude/ (wie in der Session-Vorgabe geschrieben) -- der Stop-Hook .claude/hooks/append-checkpoint-log.sh liest die Datei tatsaechlich nur an $REPO_ROOT/checkpoint-result.json, unter .claude/ waere er ein No-op geblieben und die Checkpoint-Log-Zeile haette gefehlt. Netzwerkzugriff auf play.limitlesstcg.com war in dieser Sandbox erneut blockiert (403 auf CONNECT-Tunnel, wie in M1/M2) -- kein Live-Smoke-Test der neuen /pairings-Response moeglich. Neues GATE in CLAUDE.md ergaenzt: Pairings-Response-Form (Feldnamen, Rundenabdeckung pro Call, Freilos-/outcome-Kodierung) vor Produktions-Deploy von /matchups gegen die echte API pruefen -- kritischster Punkt ist die Annahme 'ein Call liefert alle Runden', die dem ~30-Requests-Budget zugrunde liegt. Bestehende GATEs praezise mit Datum (2026-08-09) durchgegangen statt pauschal aktualisiert: TCGdex-GATE unveraendert erledigt (von M3 nicht beruehrt), Limitless-GATE (M2) weiterhin teilweise offen (Rate-Limit-Header-Namen, erneuter Versuch in M3 ebenfalls durch Netzwerksperre blockiert). Rate-Limit-Risikopunkt um die Verdopplung des Anfragevolumens (~15 auf ~30 parallele Requests bei /matchups-Besuch) ergaenzt, keine Drosselung in dieser Session (auf M4 verschoben). Icon-Rendering-Bug bewusst nicht angefasst, neue Matchups-Seite uebernimmt identisches (fehlerhaftes) Icon-Rendering wie /tierlist. Merge eigenstaendig bei gruenen Checks, da diese Session kein bestehendes GATE aufloest (nur ein neues ergaenzt) und den M5-Legal-Platzhalter nicht beruehrt. |
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
  für glaubwürdigen Use-Case-Antrag ist). ENTSCHÄRFT seit M4 (Session vom
  2026-08-09, siehe Architektur-Abschnitt "Rate-Limit-Caching" für Details):
  bis M3 lud loadTierlistData() bis zu 15 und loadMatchupData() bis zu 30
  Requests in einem einzigen Promise.all-Burst, dazu verstärkte der globale
  QueryClient-Default (retry: 1) einen einzelnen Fehlschlag zu einer
  Wiederholung des GESAMTEN Batches. Seit M4: (1) Dexie-TTL-Cache (1h)
  spart wiederholte Requests über Seitenbesuche/Reloads hinweg komplett
  ein, (2) /tierlist und /matchups teilen sich denselben Cache für
  Tournaments/Standings statt unabhängig doppelt zu laden, (3) Requests
  laufen bei kaltem Cache gestaffelt in 4er-Batches statt als Ein-Burst,
  (4) ein einzelner 429/5xx wird jetzt auf Einzelrequest-Ebene mit
  Retry-After-Backoff wiederholt statt den ganzen Batch scheitern zu
  lassen, UND der globale Batch-Retry wurde für diese beiden Hooks auf 0
  gesetzt (kein Übereinanderstapeln von Einzelrequest- und Batch-Retry
  mehr). Das Risiko ist dadurch kleiner, aber NICHT eliminiert -- weiterhin
  kein API-Key, weiterhin ein Rate-Limit ohne bekannte exakte Grenze (siehe
  GATE unten). Live-Ergebnis nach dem Fix: siehe Checkpoint-Log-Zeile M4 --
  in M4 praezisiert: der Netzwerkblock ist laut Agent-Proxy-Status eine
  generelle Egress-Sperre dieser Sandbox (403 auf CONNECT fuer JEDE nicht
  freigegebene Domain), nicht spezifisch fuer play.limitlesstcg.com --
  selbst die eigene Vercel-Preview-URL war ueber WebFetch/curl nicht
  erreichbar. Ein echter /matchups-Neubesuch nach Abklingen des 429 konnte
  deshalb in dieser Session nicht direkt durchgefuehrt werden -- der
  Vercel-Preview-BUILD/-DEPLOY selbst wurde aber erfolgreich verifiziert
  (PR-Checks gruen, Deployment-Status "Ready").
- Archetyp-Heuristik: erledigt (M2) -- keine eigene Kategorisierung mehr
  nötig, Limitless liefert das `deck`-Feld direkt über /standings (siehe
  Architektur-Abschnitt). getDeckArchetype() reicht es nur noch durch
- Impressum/Datenschutz vorerst Platzhalter -- GATE: kein Produktions-Deploy
  vor Ersetzung durch echte Texte
- Tierlist-Tier-C-Laenge (seit UI-Redesign 2026-08-13): das Broadcast-Grid-
  Mockup ging von einer kleinen kuratierten Beispielliste (~20 Decks) aus;
  live zeigt Tier C mit echten Daten bis zu 150+ Zeilen (jedes 1-Spieler-
  Deck ohne Cutoff, konsistent mit der bestehenden "Unbekannt faellt in
  eine eigene Zeile statt gefiltert zu werden"-Philosophie aus M2/M3).
  Kein Bug, nur eine Beobachtung -- falls ein Cutoff (aehnlich Top-15 bei
  Matchups) gewuenscht ist, waere das eine bewusste neue Produktentscheidung,
  keine automatische Ableitung aus dem Mockup.
- TCGdex-Client (M1): GATE erledigt -- Stand 2026-08-09, /karten live auf
  Production geprüft, Kartendaten laden korrekt. Von M3 nicht berührt
  (keine TCGdex-Änderungen), Status unverändert. Erneut durchgegangen in M4
  (2026-08-09): von dieser Session inhaltlich nicht berührt (kein
  TCGdex-Code angefasst), Status weiterhin unverändert gültig.
- Limitless-Client (M2): GATE teilweise erledigt -- Stand 2026-08-09, live
  auf Production geprüft: (1) POCKET als Game-ID bestätigt korrekt,
  sinnvolle Archetyp-Namen/-Verteilung sichtbar. (3) Turnier-Auswahl wirkt
  sinnvoll, keine Anzeichen für unvollständige/laufende Turniere in den
  Top-Einträgen. WEITERHIN OFFEN, Stand 2026-08-09 (in M3 erneut versucht,
  weiterhin nicht möglich -- Netzwerkzugriff auf play.limitlesstcg.com in
  der Sandbox blockiert, 403 auf CONNECT-Tunnel, wie in M1/M2): (2)
  tatsächliche Rate-Limit-Header-Namen -- lässt sich nur per
  Browser-DevTools/Production-Check prüfen, niedrige Priorität (nur
  Logging, kein hartes Blockverhalten). Erneut durchgegangen in M4
  (2026-08-09): (2) weiterhin offen, gleicher Sandbox-Netzwerkblock wie
  M1-M3, von dieser Session nicht aufgelöst (Rate-Limit-Caching in M4
  arbeitet mit dem Header defensiv/case-insensitiv weiter, unabhängig vom
  exakten Namen -- niedrige Priorität bleibt bestehen).
- Limitless-Pairings-Response-Form (src/lib/limitless/types.ts,
  LimitlessPairing), seit M3 -- Stand 2026-08-09, Netzwerkzugriff auf
  play.limitlesstcg.com in der Sandbox blockiert (403 auf CONNECT-Tunnel,
  identisch zu M1/M2), kein Live-Smoke-Test möglich. Form basiert auf
  typischer TCG-Turniersoftware-Konvention (Swiss-Pairing pro Runde,
  player1/player2 mit deck+name, outcome player1/player2/draw, player2:null
  für Freilos), nicht gegen eine echte /pairings-Response geprüft.
  Kritischster Punkt: die Annahme, dass EIN GET
  /tournaments/{id}/pairings-Call ALLE Runden eines Turniers liefert (worauf
  das ~30-statt-~15-Requests-Budget beruht) statt nur der aktuellen Runde --
  falls falsch, steigt das Anfragevolumen deutlich über die geplante
  Verdopplung. GATE: vor Produktions-Deploy von /matchups einmal gegen die
  echte API prüfen (fetchPairings() aufrufen, Feldnamen/Rundenabdeckung/
  Freilos-Kodierung/outcome-Kodierung gegenchecken). WEITERHIN OFFEN, Stand
  2026-08-09: erster Live-Zugriffsversuch auf Production schlug mit 429
  (Rate-Limit) bereits beim /tournaments-Call fehl, bevor überhaupt ein
  /pairings-Call ausgeführt wurde -- Pairings-Response-Form also weiterhin
  ungeprüft, ein erneuter Versuch nach Abklingen des Rate-Limits steht aus.
  Erneut durchgegangen in M4 (2026-08-09): weiterhin offen, von dieser
  Session inhaltlich nicht aufgelöst (keine Pairings-Verarbeitung
  geändert, nur die I/O-Schicht drumherum gecacht/gestaffelt/retried).
  Live-Check-Versuch im Rahmen der M4-Verifikation: weiterhin durch die
  generelle Sandbox-Egress-Sperre blockiert (siehe Rate-Limit-Risikopunkt
  oben fuer Details), kein Fortschritt möglich -- unverändert offen, wie in
  M2/M3. GROSSTEILS AUFGELÖST seit 2026-08-12 (zwei Debug-Sessions am selben
  Tag, beide durch echte Live-Funde auf Production ausgelöst, nicht durch
  Sandbox-Zugriff): Session 1 -- Nutzer meldete einen Absturz auf /matchups
  ("Matchup-Daten konnten nicht geladen werden: can't access property
  "deck", t.player2 is undefined"). Fix: player2 als optional typisiert,
  Null-Check erweitert. Nach Merge (PR #14) zeigte eine Live-Verifikation im
  Browser (IndexedDB-Cache der Production-Seite direkt inspiziert) zwar
  keinen Absturz mehr, aber "0 Spiele" fuer jeden Archetyp -- Session 2
  deckte auf: die urspruengliche Annahme war noch in drei weiteren Punkten
  falsch, nicht nur player2. Tatsaechliche Form (jetzt gegen echte
  Production-Daten verifiziert, siehe Doc-Comment an LimitlessPairing in
  src/lib/limitless/types.ts): player1/player2 sind Username-STRINGS ohne
  eingebettetes Deck (Deck muss ueber LimitlessStanding.player gejoint
  werden), kein `outcome`-Feld sondern `winner` (Username-String des
  Gewinners, 0 = Unentschieden, -1 = Freilos/kein Ergebnis). Fix: neues
  src/lib/matchups/resolvePairings.ts loest die Rohform pro Turnier gegen
  die Standings auf, aggregate.ts operiert seither nur noch auf bereits
  aufgeloesten ResolvedPairing[]. Gegen echte, aus dem Production-
  IndexedDB-Cache extrahierte Pairings/Standings verifiziert (140 Pairings
  eines echten Turniers, 126 korrekt aufgeloest, 14 Freilose/nicht
  auswertbare Ergebnisse korrekt uebersprungen, echte Archetyp-Namen
  korrekt zugeordnet) -- nicht nur gegen handgeschriebene Test-Fixtures.
  NUR NOCH EIN GATE-PUNKT WEITERHIN UNVERIFIZIERT: ob GET
  /tournaments/{id}/pairings wirklich ALLE Runden eines Turniers in einer
  Response liefert (Annahme, auf der das ~30-Requests-Budget beruht) statt
  nur der aktuellen/letzten Runde -- liess sich aus dem gecachten
  Einzel-Response nicht pruefen, da nicht ersichtlich ist, ob das die volle
  Rundenzahl war. FIX LIVE BESTÄTIGT nach Merge (PR #15, 2026-08-12): nach
  Deploy zeigt /matchups auf Production reale, unterschiedliche
  Counter-Meta-Scores und Stichprobengrößen pro Archetyp (z.B. "Mega
  Sharpedo ex Gyarados 57,9% / 38 Spiele", "Mega Lucario ex Lucario 52,7% /
  207 Spiele") statt durchgängig "0 Spiele". Wichtig fürs Debugging: der
  erste Live-Check direkt nach dem Merge zeigte noch den alten, fehlerhaften
  Stand mit demselben JS-Bundle-Hash wie vor dem Fix -- Ursache war ein
  bereits registrierter PWA-Service-Worker, der die alte
  Workbox-Precache-Version weiter auslieferte, obwohl der Server (per
  Cache-Busting-Fetch auf index.html bestätigt) bereits den neuen Build
  auslieferte. Erst nach `serviceWorkerRegistration.unregister()` +
  `caches.delete(...)` und Neuladen zeigte sich der korrekte neue Stand --
  ein bei PWA-Deploys generell zu erwartendes Verhalten (Workbox
  aktualisiert den SW erst nach einem weiteren Reload im Hintergrund),
  keine Besonderheit dieses Fixes, aber relevant falls zukünftig ein
  Live-Check nach einem Merge fälschlich "nichts hat sich geändert"
  zeigt.
- Deck-Icons (Tierlist/Matchups): ERLEDIGT seit M4 (2026-08-09). Root Cause
  war nicht zweifelsfrei bestimmbar (Sandbox-Egress-Sperre betrifft auch
  play.limitlesstcg.com), Fix ist deshalb robust statt ursachenspezifisch:
  neue DeckIcon-Komponente (src/components/DeckIcon.tsx) fängt
  Bild-Ladefehler per onError ab und zeigt ein sichtbares Platzhalter-Icon
  statt der kaputten Bild-Box des Browsers. Live-Verifikation auf einer
  echten Preview-/Production-URL (nicht nur Sandbox) wie im Auftrag
  gefordert: in dieser Session NICHT möglich, weil das Rendering von
  Turnierdaten (und damit den Icons) überhaupt erst einen erfolgreichen
  Limitless-API-Aufruf voraussetzt -- der ist durch dieselbe generelle
  Egress-Sperre blockiert (403 auf CONNECT, wie in M1-M3), unabhängig vom
  Vercel-Deploy selbst. Vercel-Preview-Build/-Deploy wurde erfolgreich
  verifiziert (PR-Checks grün), das eigentliche Bild-Fallback-Verhalten
  bleibt als GATE offen bis zu einem echten Browser-Check auf Production
  (durch den Nutzer oder eine zukünftige Session mit Netzwerkzugriff).
  WICHTIGE KORREKTUR: der ursprüngliche
  Eintrag behauptete zusätzlich einen Kartentyp-Icon-Bug auf /karten mit
  "vermutlich gemeinsamer Ursache" -- das stimmt nicht. Im Code existiert
  für /karten keine Icon-Rendering-Logik überhaupt (TypeFilter.tsx ist ein
  reines Text-`<select>`, CardTile.tsx zeigt nur Kartenbild+Text, kein
  Icon-Element irgendwo, per Grep bestätigt). Die Doku war hier ungenau;
  diese Session hat sich mit dem Nutzer abgestimmt auf den tatsächlich
  existierenden Deck-Icon-Bug beschränkt statt einen Fix für nicht
  existenten Code zu erfinden. Falls auf einer echten Seite doch einmal
  kaputte Kartentyp-Icons auffallen sollten, ist das ein neuer Befund, kein
  Wiederauftreten dieses Eintrags. LIVE-VERIFIKATION NACHGEHOLT am
  2026-08-12 (im Rahmen der Matchup-Pairings-Debug-Session, siehe
  Checkpoint-Log): /matchups auf echter Production-URL im Browser geprüft.
  Der DeckIcon-Fallback selbst funktioniert wie vorgesehen -- kein kaputtes
  Bild-Icon des Browsers, stattdessen sichtbares "?"-Platzhalter-Icon.
  ABER: der zugrunde liegende Root Cause bestand weiterhin -- alle
  Deck-Icon-URLs (z.B. `/lucario-mega`, `/hoopa`, relative Pfade ohne Host)
  404ten gegen die eigene App-Domain statt gegen eine echte Bild-CDN-URL
  aufzuloesen. VOLLSTAENDIG BEHOBEN in einer Folge-Session am selben Tag
  (2026-08-12): `LimitlessDeck.icons` liefert nur nackte
  Dateinamen-Fragmente (z.B. `"lucario-mega"`), keine vollen URLs -- exakt
  dieselbe Kategorie Fehler wie beim Pairings-GATE (ungeprueft angenommene
  Datenform). Die korrekte Basis-URL wurde per Live-Browser-Check direkt
  gegen `play.limitlesstcg.com/decks?game=POCKET` verifiziert (dortige
  `<img src>`-Werte ausgelesen, exakt dieselben Fragment-Namen wie aus der
  eigenen API) und per Direktaufruf bestaetigt (`GET
  https://r2.limitlesstcg.net/pokemon/gen9/furfrou.png` -> 200, echtes
  PNG). Damit war auch die alte Annahme in den Test-Fixtures
  (`limitlesstcg.nyc3.digitaloceanspaces.com/pocket/...`) als falsch
  entlarvt (liefert 403 auf diesem Pfad) -- nie verifiziert gewesen, nur
  geraten. Fix: neue Konstante `LIMITLESS_DECK_ICON_BASE` (src/lib/
  limitless/types.ts) + `buildDeckIconUrl()` (src/lib/limitless/client.ts,
  reiner String-Builder, spiegelt 1:1 das bereits etablierte
  `buildCardImageUrl()`-Muster aus src/lib/tcgdex/client.ts), aufgerufen an
  den beiden DeckIcon-Renderstellen (Tierlist.tsx, Matchups.tsx).
  DeckIcon.tsx selbst unveraendert (nimmt weiterhin einen fertigen
  src-String entgegen). Test-Fixtures korrigiert (bare Fragmente statt der
  falschen Fake-Domain), 4 neue Tests (buildDeckIconUrl x2, Regressionstest
  pro Seite dass das gerenderte `<img src>` tatsaechlich durch
  buildDeckIconUrl aufgeloest wird -- vorher pruefte keiner dieser Tests
  das img-Element ueberhaupt). 109 Tests gesamt (vorher 105).
  Lint/Typecheck/Test/Build lokal gruen. LIVE AUF PRODUCTION VERIFIZIERT
  nach Merge (PR #17, 2026-08-12): auf /tierlist und /matchups zeigen alle
  Deck-Icons echte Pokemon-Bilder (per `img.complete`/`img.naturalWidth`
  im Browser direkt geprueft, nicht nur visuell) statt des "?"-Platzhalters
  -- GATE damit vollstaendig geschlossen, keine offenen Punkte mehr zu
  diesem Thema.

## MCP-Server / externe Tools
- GitHub-Connector -- Repo-Zugriff für Claude Code on the web + Cowork
- TCGdex API -- Kartendaten (Link-only)
- Limitless API -- Meta-/Turnierdaten (nur unauthentifizierte Endpunkte)

## Plugins & Connectors
- GitHub-Connector (Cowork Scheduled Task, read-only + Write auf
  checkpoint-result.json/Report)
- Vercel (git-basiertes Deployment, kein separater Connector nötig)
