# claude-mcp

Sauvegarde des serveurs MCP utilises avec Claude Code sur le poste AB-Arts.
Un dossier par MCP.

| Dossier | Serveur MCP | Transport | Source sauvegardee |
|---|---|---|---|
| [`after-effects/`](after-effects) | `AfterEffectsMCP` | stdio (node local) | oui, integrale |
| [`ab-arts-studio/`](ab-arts-studio) | `ab-arts-studio` | http (Supabase Edge Function) | non, code heberge |

`node_modules/` n'est jamais sauvegarde : un `npm install` le reconstruit depuis
le `package-lock.json` present dans chaque dossier.

## Restaurer un MCP

```bash
git clone https://github.com/AB-Arts/claude-mcp.git
cd claude-mcp/<dossier>
npm install
```

Puis declarer le serveur dans la configuration Claude Code — voir le README du
dossier concerne pour le bloc `mcpServers` exact.

## Inventaire au 26 aout 2026

Les deux serveurs ci-dessus sont les seuls declares dans `~/.claude.json`.
`AfterEffectsMCP` est global, `ab-arts-studio` n'est actif que dans le projet
`D:\_GIT\ab-arts`.
