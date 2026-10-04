# Devcontainer

Eine reproduzierbare Linux-Umgebung für dieses Repo: auf dem Gaming-PC in WSL2 mit
Docker Desktop, später auf dem Heimserver in der `dev`-VM. Hintergrund und gemeinsame
Bausteine: Repo `homeserver-projects`, Ordner `infra/devcontainer/` und
`docs/claude-code-und-projekte.md`.

## Was drin ist

- Ubuntu 24.04 (`mcr.microsoft.com/devcontainers/base`, per Digest gepinnt), Benutzer
  `vscode` (UID 1000)
- Node 24 (die CI nutzt Node 22; `engines` verlangt `>=22.22.2`) und die GitHub-CLI `gh`
- Claude Code (Feature `ghcr.io/anthropics/devcontainer-features/claude-code`)

`Dockerfile` ist byte-gleich mit der Vorlage
`homeserver-projects/infra/devcontainer/general/Dockerfile`; Unterschiede je Projekt
stehen nur in `build.args` von `devcontainer.json`. Ob alle Kopien gleich sind, prüft
`infra/devcontainer/check-copies.sh` im Repo `homeserver-projects`.
`devcontainer-lock.json` pinnt die Version des Claude-Code-Features.

## Volumes und Geheimnisse

- `claude-code-config` → `/home/vscode/.claude` (mit `CLAUDE_CONFIG_DIR`): Die
  Claude-Anmeldung übersteht ein Neubauen. Das Volume teilen sich die eigenen Repos des
  Owners; fremde Repos bekommen es nicht.
- Kein `~/.ssh`, keine Vercel-Tokens im Container. `git push` läuft außerhalb, in WSL.

## Benutzen

Repo im WSL-Dateisystem klonen (`~/projects/…`, nicht unter `/mnt/c` oder `/mnt/f`),
Docker Desktop starten, dann:

```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . bash -c 'npm ci && npm run lint && npm run typecheck && npm run test && npm run build'
devcontainer exec --workspace-folder . bash -c 'npm run dev -- --host 0.0.0.0'
```

Der Dev-Server lauscht auf Port 5173. Mit VS Code („WSL“ und „Dev Containers“,
„Reopen in Container“) wird der Port automatisch weitergeleitet; mit der CLI allein
ist er nur im Container erreichbar.
