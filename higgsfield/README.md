# higgsfield

Generation d'images et de videos Higgsfield. Deux acces distincts, qui ne
partagent **pas** la meme authentification :

| Acces | Nature | Endpoint / paquet | Auth |
|---|---|---|---|
| Connecteur MCP | serveur **distant**, HTTP | `https://mcp.higgsfield.ai/mcp` | OAuth, cote claude.ai |
| CLI | binaire local | `@higgsfield/cli` (npm) | OAuth 2.0 PKCE, fichier local |

Aucun code source n'est sauvegarde ici : le serveur MCP est heberge par
Higgsfield et le CLI est un binaire precompile telecharge depuis les GitHub
releases. Ce dossier ne contient que la procedure de remise en route.

## Connecteur MCP

Serveur HTTP distant, declare comme connecteur **personnalise** de type Web
dans les reglages de connecteurs claude.ai, pas dans `~/.claude.json`. Il
n'apparait donc pas dans `claude mcp list`.

Sans jeton, l'endpoint repond `401`.

Pour le declarer plutot cote Claude Code :

```bash
claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp -s user
```

L'autorisation OAuth se fait ensuite avec `/mcp`, dans une session `claude`
**interactive**. Une session non interactive ne peut pas derouler le flux.

**Attention au compte.** Le connecteur est attache au compte claude.ai qui l'a
autorise. Connecte sur un autre compte, il n'est pas disponible.

## CLI

```bash
npm install -g @higgsfield/cli
```

Le postinstall recupere le binaire prebuild correspondant a la plateforme
depuis <https://github.com/higgsfield-ai/cli/releases>. Trois alias sont
poses : `higgsfield`, `higgs`, `hf`.

Version installee sur le poste AB-Arts : `1.1.23` (build du 8 aout 2026).

### Authentification

```bash
higgsfield auth login
```

Flux OAuth 2.0 PKCE via le navigateur, donc **interactif**. Le jeton part dans
un fichier de credentials local.

Le fichier `~/.higgsfield-auth-aeft.json` present sur le poste appartient a
l'integration After Effects : ce n'est **pas** le magasin du CLI, et il ne le
remplace pas.

### Workspace

Apres connexion, un workspace doit etre selectionne, sinon toute commande
echoue sur `No workspace selected` :

```bash
higgsfield workspace list
```

```bash
higgsfield workspace set <workspace_id>
```

### Commandes principales

| Commande | Role |
|---|---|
| `account status` | email, plan, credits disponibles |
| `model list` | catalogue des modeles (`--video` pour la video) |
| `generate create <model> --prompt "..."` | lancer une generation |
| `generate cost` | cout estime avant lancement |
| `generate wait` | attente bloquante de fin de job |
| `upload` | envoyer une image ou un document en entree |
| `soul-id` | entrainer et gerer les references Soul |
| `preset`, `workflow` | presets et workflows disponibles |
| `product-photoshoot`, `marketing-studio` | generations a prompt enrichi |

Exemple d'appel texte vers image :

```bash
higgsfield generate create text2image_soul_v2 --prompt "une banane sur fond bleu uni, photo studio"
```

Le drapeau global `--json` renvoie la reponse brute de l'API, pratique pour
scripter.

## Diagnostic

| Symptome | Cause probable |
|---|---|
| `request failed (no response received)` + `Hint: hf auth login` | pas de jeton CLI valide — le reseau, lui, repond (405 sur `platform.higgsfield.ai`) |
| `No workspace selected` | jeton valide, mais aucun workspace choisi |
| `401` sur `mcp.higgsfield.ai/mcp` | appel sans jeton OAuth, comportement normal |
