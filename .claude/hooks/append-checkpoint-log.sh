#!/usr/bin/env bash
# Haengt bei Session-Ende einen Eintrag an die "Checkpoint-Log"-Tabelle in
# CLAUDE.md an. Erwartet optional eine checkpoint-result.json im Repo-Root
# (siehe CLAUDE.md, Abschnitt "Plugins & Connectors": GitHub-Connector
# schreibt checkpoint-result.json/Report). Ohne diese Datei ist der Hook ein
# No-op, damit ein Stop-Event ohne Checkpoint-Ergebnis nichts kaputt macht.
#
# Erwartetes JSON-Schema von checkpoint-result.json:
#   { "date": "YYYY-MM-DD", "milestone": "...", "result": "...",
#     "scope_drift": true|false, "action": "..." }
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CLAUDE_MD="$REPO_ROOT/CLAUDE.md"
RESULT_FILE="$REPO_ROOT/checkpoint-result.json"
PROCESSED_FILE="$REPO_ROOT/checkpoint-result.processed.json"

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
scope_drift=$(jq -r '
  if has("scope_drift") | not then "TODO"
  elif (.scope_drift | type) == "boolean" then (if .scope_drift then "ja" else "nein" end)
  else (.scope_drift | tostring)
  end
' "$RESULT_FILE")
aktion=$(jq -r 'if (.action // "") == "" then "-" else .action end' "$RESULT_FILE")

row="| ${datum} | ${meilenstein} | ${ergebnis} | ${scope_drift} | ${aktion} |"

if grep -qF "$row" "$CLAUDE_MD"; then
  mv -f "$RESULT_FILE" "$PROCESSED_FILE"
  exit 0
fi

awk -v row="$row" '
  { print }
  /^\| Datum \| Meilenstein \| Ergebnis \| Scope-Drift erkannt\? \| Aktion \|$/ { header_seen=1 }
  header_seen==1 && /^\|---/ && !inserted { print row; inserted=1; header_seen=0 }
' "$CLAUDE_MD" > "$CLAUDE_MD.tmp"

mv "$CLAUDE_MD.tmp" "$CLAUDE_MD"
mv -f "$RESULT_FILE" "$PROCESSED_FILE"
