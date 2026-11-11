# davinci-resolve

Depuis **DaVinci Resolve Studio 21.2**, Blackmagic livre un serveur MCP officiel :
`ResolveMCP.exe` (stdio), dans le dossier d'installation de Resolve. C'est lui qu'on
utilise. Rien a sauvegarder : il est reinstalle avec Resolve.

## Prerequis

- **DaVinci Resolve Studio** (version payante), 21.2 ou plus. La version gratuite ne
  convient pas (API de scripting = fonction Studio).
- Preferences > System > General > *External scripting using* = **Local**.
- Teste le 11 novembre 2026 avec Resolve Studio 21.2.0.6.

## Declaration dans Claude Code

```bash
claude mcp add --scope user davinci-resolve -- "C:\Program Files\Blackmagic Design\DaVinci Resolve\ResolveMCP.exe"
```

(Pour Claude Desktop, Blackmagic fournit aussi `DaVinciResolve.mcpb` dans le meme
dossier, ou *Fichier > Configurer l'assistant IA* dans Resolve.)

## Outils officiels

`launch_resolve`, `get_resolve_status`, `run_script` (Python bac a sable : `resolve` et
`project` pre-injectes, `result` = valeur renvoyee, timeout 10 s par defaut, **60 s max**,
passer `timeout: 60`), `run_script_unsafe` (acces fichiers/reseau), `get_scripting_api`,
`search_scripting_api`, `get_scripting_docs`, `get_whats_new` (argument `since`, ex. "21.0"),
`get_image` / `get_thumbnails` (voir une image de la timeline), outils LUT/DCTL/etalonnage.

## Recette : titre Text+ modifiable, place au bon endroit

`InsertFusionTitleIntoTimeline` pose le titre sur V1 et **ecrase la video** si on vise
le milieu du clip ; verrouiller V1 fait echouer l'insertion. Methode qui marche :

```python
tl.AddTrack("video")                                   # V2
end = tl.GetEndFrame(); s0 = tl.GetStartFrame()
tl.SetMarkInOut(end + 50, end + 50 + dur - 1)          # zone vide apres le clip = duree voulue
item = tl.InsertFusionTitleIntoTimeline("Text+")
tl.ClearMarkInOut()
tl.MoveItems([item], {"trackIndex": 2, "startFrame": s0 + debut})   # API 21.2
comp = item.GetFusionCompByIndex(1)
tp = list(comp.GetToolList(False, "TextPlus").values())[0]
comp.Lock()
tp.SetInput("StyledText", "Spasticiteit na een beroerte")
tp.SetInput("Font", "Open Sans"); tp.SetInput("Style", "Bold")
tp.SetInput("Center", {1: 0.5, 2: 0.15})               # x, y en 0..1, origine en bas a gauche
tp.SetInput("Red1", 1.0); tp.SetInput("Green1", 0.85); tp.SetInput("Blue1", 0.2)
tp.AddModifier("Size", "BezierSpline")                 # animation
tp.SetInput("Size", 0.0, 0); tp.SetInput("Size", 0.07, 12)   # images relatives au debut du titre
comp.Unlock()
```

Rendu MP4 : `SetCurrentRenderFormatAndCodec("mp4", "H264")` (ou `H264_NVIDIA`),
`SetCurrentRenderMode(1)`, `SetRenderSettings({TargetDir, CustomName, SelectAllFrames...})`,
`AddRenderJob()`, `StartRendering([job])`, attendre `IsRenderingInProgress()`.

`get_image` attend un timecode **relatif** au debut de la timeline (`00:00:02:00`),
pas le timecode affiche (`01:00:02:00`).

## Archive

`archive-serveur-maison/server.py` : serveur ecrit le 11/11/2026 avant l'arrivee du MCP
officiel (Python standard + API officielle). Plus utilise. Son `title_add` (verrouillage
de pistes) ne fonctionne pas : la recette ci-dessus le remplace.
