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
  Gegnerfeld) werden bewusst NICHT ausgeschlossen, sondern normal gepoolt --
  siehe Doc-Comment in aggregate.ts zur (tautologisch 50%igen)
  Zählweise. UI unter /matchups, eigene Route statt Erweiterung von
  /tierlist (Begründung: kein Regressionsrisiko für die getestete
  Tierlist-Seite, verdoppeltes Request-Volumen nur bei tatsächlichem
  Seitenbesuch)
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
- Letztes abgeschlossenes Feature: M3 Matchup-Filter/Counter-Meta-Score
  (fetchPairings() in src/lib/limitless/client.ts, gepoolte Archetyp-vs-
  Archetyp-Matchup-Aggregation in src/lib/matchups/aggregate.ts, Counter-
  Meta-Score nach tatsächlicher Gegner-Häufigkeit gewichtet über die
  Top-5-Meta-Decks, Top-15-Cutoff, 5-Spiele-Schwellenwert, UI unter
  /matchups inkl. Aufklapp-Detailansicht pro Archetyp und
  Fan-Content-Disclaimer)
- Nächster Meilenstein: M4
- Offene Entscheidungen: keine

## Checkpoint-Log
<!-- automatisch per Hook, siehe .claude/hooks/append-checkpoint-log.sh -->
| Datum | Meilenstein | Ergebnis | Scope-Drift erkannt? | Aktion |
|---|---|---|---|---|
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
  für glaubwürdigen Use-Case-Antrag ist). Seit M2 zusätzlich zu beachten:
  loadTierlistData() lädt Standings für bis zu 15 Turniere parallel
  (Promise.all, fail-fast) und der globale QueryClient-Default (retry: 1)
  wiederholt bei einem einzigen fehlgeschlagenen Aufruf den gesamten Batch
  -- erhöht das Anfragevolumen pro Fehlversuch stärker als M1s einmaliger,
  manueller Karten-Sync. Seit M3: loadMatchupData() (/matchups-Seite) lädt
  pro Turnier zusätzlich Pairings, verdoppelt das Anfragevolumen auf ~30
  statt ~15 parallele Requests pro Ladevorgang (15x Standings + 15x
  Pairings, beide weiterhin fail-fast via Promise.all, derselbe
  retry:1-Verstärkungseffekt gilt jetzt für beide) -- als bekanntes,
  akzeptiertes Risiko für M3 dokumentiert, fällt aber nur an, wenn /matchups
  tatsächlich besucht wird (nicht auf /tierlist). Keine Drosselung in dieser
  Session, mögliche Gegenmaßnahme (Staffelung/Caching) auf M4 verschoben
- Archetyp-Heuristik: erledigt (M2) -- keine eigene Kategorisierung mehr
  nötig, Limitless liefert das `deck`-Feld direkt über /standings (siehe
  Architektur-Abschnitt). getDeckArchetype() reicht es nur noch durch
- Impressum/Datenschutz vorerst Platzhalter -- GATE: kein Produktions-Deploy
  vor Ersetzung durch echte Texte
- TCGdex-Client (M1): GATE erledigt -- Stand 2026-08-09, /karten live auf
  Production geprüft, Kartendaten laden korrekt. Von M3 nicht berührt
  (keine TCGdex-Änderungen), Status unverändert.
- Limitless-Client (M2): GATE teilweise erledigt -- Stand 2026-08-09, live
  auf Production geprüft: (1) POCKET als Game-ID bestätigt korrekt,
  sinnvolle Archetyp-Namen/-Verteilung sichtbar. (3) Turnier-Auswahl wirkt
  sinnvoll, keine Anzeichen für unvollständige/laufende Turniere in den
  Top-Einträgen. WEITERHIN OFFEN, Stand 2026-08-09 (in M3 erneut versucht,
  weiterhin nicht möglich -- Netzwerkzugriff auf play.limitlesstcg.com in
  der Sandbox blockiert, 403 auf CONNECT-Tunnel, wie in M1/M2): (2)
  tatsächliche Rate-Limit-Header-Namen -- lässt sich nur per
  Browser-DevTools/Production-Check prüfen, niedrige Priorität (nur
  Logging, kein hartes Blockverhalten).
- NEU (M3): Limitless-Pairings-Response-Form (src/lib/limitless/types.ts,
  LimitlessPairing) unverifiziert -- Stand 2026-08-09, Netzwerkzugriff auf
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
  Freilos-Kodierung/outcome-Kodierung gegenchecken).
- Deck-Icons (Tierlist) und Kartentyp-Icons (/karten) rendern als leere
  Platzhalter-Kästchen statt echter Symbole -- betrifft zwei unabhängige
  Features, vermutlich gemeinsame Ursache (Icon-Font/Sprite fehlt oder
  falsch eingebunden). Gefunden am 2026-08-09 via Live-Check. In M3 bewusst
  NICHT angefasst (nicht Teil des Scopes), neue Matchups-Seite übernimmt
  dasselbe Icon-Rendering wie /tierlist inkl. Bug. Weiterhin offen, zu fixen
  vor M4 oder als erster Punkt der nächsten Session.

## MCP-Server / externe Tools
- GitHub-Connector -- Repo-Zugriff für Claude Code on the web + Cowork
- TCGdex API -- Kartendaten (Link-only)
- Limitless API -- Meta-/Turnierdaten (nur unauthentifizierte Endpunkte)

## Plugins & Connectors
- GitHub-Connector (Cowork Scheduled Task, read-only + Write auf
  checkpoint-result.json/Report)
- Vercel (git-basiertes Deployment, kein separater Connector nötig)
