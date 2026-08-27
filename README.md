# claude-mcp

Sauvegarde des serveurs MCP utilises avec Claude Code sur le poste AB-Arts.
Un dossier par MCP.

| Dossier | Serveur MCP | Transport | Source sauvegardee |
|---|---|---|---|
| [`after-effects/`](after-effects) | `AfterEffectsMCP` | stdio (node local) | oui, integrale |
| [`ab-arts-studio/`](ab-arts-studio) | `ab-arts-studio` | http (Supabase Edge Function) | oui, `index.ts` + `deno.json` |
| [`higgsfield/`](higgsfield) | `higgsfield` | http (heberge par Higgsfield) + CLI npm | non, rien a sauvegarder |

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

Pour `higgsfield/`, il n'y a ni source ni deploiement : le serveur est heberge
par Higgsfield et le CLI est un binaire prebuild. Voir le README du dossier
pour l'installation du CLI et les deux authentifications.

Puis declarer le serveur dans la configuration Claude Code — voir le README du
dossier concerne pour le bloc `mcpServers` exact. Celui de `ab-arts-studio`
exige une cle d'API : l'URL seule ne suffit pas.

## Inventaire au 27 aout 2026

`AfterEffectsMCP` et `ab-arts-studio` sont les seuls serveurs declares dans
`~/.claude.json`. `AfterEffectsMCP` est global, `ab-arts-studio` n'est actif que
dans le projet `D:\_GIT\ab-arts`.

`higgsfield` est a part : il est branche comme connecteur personnalise cote
claude.ai, pas dans `~/.claude.json`, et n'apparait donc pas dans
`claude mcp list`. Le CLI `@higgsfield/cli` est installe en global sur le poste
(`1.1.23`) mais n'est pas encore authentifie : `higgsfield auth login` reste a
faire dans un terminal interactif.
