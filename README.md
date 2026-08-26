# claude-mcp

Sauvegarde des serveurs MCP utilises avec Claude Code sur le poste AB-Arts.
Un dossier par MCP.

| Dossier | Serveur MCP | Transport | Source sauvegardee |
|---|---|---|---|
| [`after-effects/`](after-effects) | `AfterEffectsMCP` | stdio (node local) | oui, integrale |
| [`ab-arts-studio/`](ab-arts-studio) | `ab-arts-studio` | http (Supabase Edge Function) | oui, `index.ts` + `deno.json` |

`node_modules/` n'est jamais sauvegarde : un `npm install` le reconstruit depuis
le `package-lock.json` present dans chaque dossier.

## Restaurer un MCP

Pour un serveur **stdio** (`after-effects/`) :

```bash
git clone https://github.com/AB-Arts/claude-mcp.git
cd claude-mcp/after-effects
npm install
```

Pour le serveur **http** (`ab-arts-studio/`), il n'y a rien a installer en
local : il se redeploie cote Supabase.

```bash
supabase functions deploy mcp-server --project-ref tegxnwrdhgwvnbpukpar
```

Puis declarer le serveur dans la configuration Claude Code — voir le README du
dossier concerne pour le bloc `mcpServers` exact. Celui de `ab-arts-studio`
exige une cle d'API : l'URL seule ne suffit pas.

## Inventaire au 26 aout 2026

Les deux serveurs ci-dessus sont les seuls declares dans `~/.claude.json`.
`AfterEffectsMCP` est global, `ab-arts-studio` n'est actif que dans le projet
`D:\_GIT\ab-arts`.
