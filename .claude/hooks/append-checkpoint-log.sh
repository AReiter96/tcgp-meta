#!/usr/bin/env bash
# Haengt bei Session-Ende einen Eintrag an die "Checkpoint-Log"-Tabelle in
# CLAUDE.md an. Erwartet optional eine checkpoint-result.json im Repo-Root
# (siehe CLAUDE.md, Abschnitt "Plugins & Connectors": GitHub-Connector
# schreibt checkpoint-result.json/Report). Ohne diese Datei ist der Hook ein
# No-op, damit ein Stop-Event ohne Checkpoint-Ergebnis nichts kaputt macht.
# Erwartete Keys in checkpoint-result.json (englisch): date, milestone,
# result, scope_drift, action.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CLAUDE_MD="$REPO_ROOT/CLAUDE.md"
RESULT_FILE="$REPO_ROOT/checkpoint-result.json"

if [[ ! -f "$RESULT_FILE" ]]; then
  exit 0
fi

if [[ ! -f "$CLAUDE_MD" ]]; then
  echo "append-checkpoint-log.sh: CLAUDE.md nicht gefunden, breche ab." >&2
  exit 1
fi

datum=$(jq -r '.date // empty' "$RESULT_FILE")
if [[ -z "$datum" ]]; then
  datum=$(date +%Y-%m-%d)
fi
meilenstein=$(jq -r '.milestone // "TODO"' "$RESULT_FILE")
ergebnis=$(jq -r '.result // "TODO"' "$RESULT_FILE")
scope_drift=$(jq -r '.scope_drift // "TODO"' "$RESULT_FILE")
aktion=$(jq -r '.action // "TODO"' "$RESULT_FILE")

row="| ${datum} | ${meilenstein} | ${ergebnis} | ${scope_drift} | ${aktion} |"

if grep -qF "$row" "$CLAUDE_MD"; then
  exit 0
fi

awk -v row="$row" '
  { print }
  /^\| Datum \| Meilenstein \| Ergebnis \| Scope-Drift erkannt\? \| Aktion \|$/ { header_seen=1 }
  header_seen==1 && /^\|---/ && !inserted { print row; inserted=1; header_seen=0 }
' "$CLAUDE_MD" > "$CLAUDE_MD.tmp"

mv "$CLAUDE_MD.tmp" "$CLAUDE_MD"

rm -f "$RESULT_FILE"
