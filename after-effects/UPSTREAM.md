# after-effects — origine et correctifs locaux

Serveur MCP `AfterEffectsMCP`, pilote After Effects depuis Claude Code via un
panneau ScriptUI qui fait le pont entre un fichier de commandes JSON et
ExtendScript.

## Origine

Fork de <https://github.com/Dakkshin/after-effects-mcp>, commit
`88d5fbf08b7ae9f015ee98e5f8c4904095cf8202` (1er avril 2026).

Emplacement sur le poste : `D:\_CLAUDE\.MCP\AE`

## Configuration Claude Code

```json
{
  "mcpServers": {
    "AfterEffectsMCP": {
      "type": "stdio",
      "command": "node",
      "args": ["D:/_CLAUDE/.MCP/AE/build/index.js"]
    }
  }
}
```

## Installation

```bash
npm install
npm run build
node install-bridge.js   # copie mcp-bridge-auto.jsx dans After Effects (demande l'elevation)
```

Puis, dans After Effects : **Fenetre > mcp-bridge-auto.jsx**, case *Auto-run
commands* cochee. Sur After Effects 2025 et plus le panneau ne peut etre
qu'une fenetre flottante, pas un panneau ancre.

## Correctifs locaux (26 aout 2026)

Ces deux correctifs ne sont pas en amont. Ils sont deja appliques aux fichiers
de ce dossier, et rejoues par `local-patches.diff` si besoin.

### 1. L'auto-run ne se declenchait jamais

`src/scripts/mcp-bridge-auto.jsx` — `app.scheduleTask("checkForCommands()", ...)`
evalue sa chaine dans `$.global`, pas dans la portee du panneau. La fonction
n'y etant pas publiee, la tache planifiee levait une ReferenceError silencieuse
toutes les 2 secondes : seul le bouton *Check for Commands Now* fonctionnait, et
chaque commande MCP exigeait un clic manuel.

```js
$.global.checkForCommands = checkForCommands;   // ajoute avant le scheduleTask
```

### 2. `Date().toISOString n'est pas definie`

Meme fichier — ExtendScript est en ES3 et n'a pas `Date.prototype.toISOString`.
L'horodatage du fichier de resultat echouait, ce qui faisait passer chaque
reponse pour perimee cote MCP. Remplace par `toUTCString()`.

## Note sur `build/`

Le `.gitignore` herite de l'amont ignore `build/`. Ce dossier est malgre tout
versionne ici (ajout force) : c'est lui que pointe la configuration MCP, sa
presence rend la sauvegarde restaurable sans etape de compilation.
