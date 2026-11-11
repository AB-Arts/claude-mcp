# davinci-resolve

Serveur MCP (stdio) qui permet a Claude Code de piloter **DaVinci Resolve Studio**
via l'API de scripting officielle de Blackmagic (`DaVinciResolveScript`).

- Un seul fichier : `server.py`.
- Aucune dependance externe : Python standard + module officiel livre avec Resolve.
  Le protocole MCP (JSON-RPC 2.0 sur stdin/stdout) est implemente a la main.
- Ecrit le 11 novembre 2026 pour le montage des videos avatar (surimpressions Text+).

## Prerequis

1. **DaVinci Resolve Studio** (version payante). La documentation officielle
   (`README.txt` du dossier `Developer\Scripting`) decrit l'API comme celle de
   Resolve Studio ; en version gratuite, une partie des appels renvoie `False`/`None`.
   Teste avec Resolve Studio 21.0.3.7.
2. Dans Resolve : *Preferences > System > General > External scripting using* = **Local**.
3. Python 3 64 bits (teste avec 3.12). Pas de `pip install`.
4. Resolve doit etre ouvert (ou demarre par l'outil `resolve_launch`).

Chemins par defaut (Windows), surchargeables par variables d'environnement :

| Variable | Valeur par defaut |
|---|---|
| `RESOLVE_SCRIPT_API` | `C:\ProgramData\Blackmagic Design\DaVinci Resolve\Support\Developer\Scripting` |
| `RESOLVE_SCRIPT_LIB` | `C:\Program Files\Blackmagic Design\DaVinci Resolve\fusionscript.dll` |

## Installation sur le poste

Copier `server.py` dans `D:\_CLAUDE\.MCP\DaVinciResolve\`, puis :

```bash
claude mcp add --scope user davinci-resolve -- "C:\Users\<user>\AppData\Local\Programs\Python\Python312\python.exe" "D:\_CLAUDE\.MCP\DaVinciResolve\server.py"
```

Bloc equivalent dans `~/.claude.json` :

```json
"davinci-resolve": {
  "type": "stdio",
  "command": "C:\\Users\\<user>\\AppData\\Local\\Programs\\Python\\Python312\\python.exe",
  "args": ["D:\\_CLAUDE\\.MCP\\DaVinciResolve\\server.py"]
}
```

## Outils

| Outil | Role |
|---|---|
| `resolve_status` | Edition, version, projet ouvert, timelines, rendu en cours |
| `resolve_launch` | Demarre Resolve si besoin et attend que l'API reponde (`headless` = `-nogui`) |
| `project_open` | Ouvre ou cree un projet ; regle largeur / hauteur / fps |
| `project_save` | Sauvegarde le projet |
| `media_import` / `media_list` | Import dans le media pool (bin optionnel) / liste des clips |
| `timeline_create` | Cree ou ouvre une timeline, avec clips optionnels |
| `timeline_append` | Ajoute des clips (piste, position, plage source) |
| `timeline_info` | Pistes et elements (piste/index/id, debut, duree, comps Fusion) |
| `timeline_delete_items` | Supprime des elements |
| `title_add` | Pose un titre Fusion (`Text+` ou tout template Fusion Title) : texte, style, piste, debut, duree, keyframes |
| `title_update` | Modifie texte / style / animation d'un titre existant |
| `fusion_inspect` / `fusion_set` | Lit / ecrit les entrees (et keyframes) de n'importe quel noeud Fusion |
| `render` / `render_status` | Rendu (MP4 H.264 par defaut), attend la fin, renvoie le fichier |
| `resolve_exec_python` | Echappatoire : execute du Python avec `resolve`, `project`, `timeline`... |

Les temps sont relatifs au debut de la timeline (secondes ou images).
Les titres restent modifiables dans Resolve (Inspector ou page Fusion).
