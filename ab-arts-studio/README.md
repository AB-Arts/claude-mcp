# ab-arts-studio

Serveur MCP **distant**, en HTTP. Il tourne comme Edge Function Supabase sous le
nom `mcp-server`, dans le projet **`lzffavvwaffkvwljuxyz`** (AB-Arts Studio).

URL publique : **`https://ab-arts.studio/mcp`**, servie par un rewrite Vercel
declare dans le `vercel.json` du depot principal.

## Ou vit la source

> **La source de verite est `D:\_GIT\abartsstudio-claude`**, pas ce dossier.
>
> Ce qui est ici est une **copie de sauvegarde** de ce qui est deploye. Modifier
> ces fichiers ne change rien en production, et la copie ne se met pas a jour
> toute seule. Toute modification passe par `abartsstudio-claude`, est deployee
> depuis la-bas, puis recopiee ici.

| Fichier | Role |
|---|---|
| `supabase/functions/mcp-server/index.ts` | le serveur : authentification, outils MCP, transport HTTP |
| `supabase/functions/mcp-server/deno.json` | carte d'imports Deno (hono, mcp-lite, zod, supabase-js) |
| `supabase/functions/_shared/model-catalog.generated.ts` | le catalogue des 47 modeles — **fichier genere, ne pas editer** |

Depuis la version 1.2.0, la fonction **depend de `_shared/`** : le catalogue y
est bundle au deploiement. Les deux fichiers de `mcp-server/` ne suffisent donc
plus a la redeployer, contrairement a ce que disait la version precedente de ce
README.

Le catalogue n'est pas ecrit a la main : `scripts/generate-model-catalog.mjs` le
produit depuis les JSON de `src/config/models/`. On le regenere avec
`npm run build:model-catalogue`, et `src/config/models/catalog.test.ts` echoue
s'il n'est plus a jour.

## Ce que le serveur expose (v1.2.0, huit outils)

| Outil | Role |
|---|---|
| `list_models` | les modeles, avec leurs parametres et leur nombre max d'images de reference |
| `describe_model` | schema d'entree complet d'un modele : types, defauts, valeurs autorisees, bornes |
| `get_token_balance` | solde de jetons du compte |
| `list_recent_assets` | derniers assets generes |
| `get_asset` | un asset par identifiant |
| `wait_for_asset` | attente bloquante de fin de generation (120 s max) |
| `generate_image` | image — `reference_image_urls` (tableau) + `parameters` |
| `generate_video` | video — slots start/last/video/audio + `parameters` |

Les images de reference doivent etre des **URL HTTPS publiques** : une garde
anti-SSRF refuse les IP privees, `localhost`, `.local` et `.internal`. Le nombre
d'images accepte est plafonne par modele (14 pour nano-banana, 10 pour
gpt-image-2, 0 pour seedream-v4-5 qui ne fait que du texte vers image).

## Authentification

L'endpoint **exige une cle d'API AB-Arts**. Sans cle, il repond
`-32001 Unauthorized`. Trois canaux acceptes, par ordre de preference :

1. l'en-tete `X-API-Key` — **a privilegier**, la passerelle Supabase interprete
   `Authorization` comme un JWT et peut le consommer avant la fonction ;
2. l'en-tete `Authorization: Bearer <cle>` ;
3. le parametre d'URL `?api_key=<cle>`, pour les clients incapables de poser un
   en-tete.

La cle est verifiee en base par `verify_api_key` et chaque usage est trace dans
`api_key_audit_log`.

**Piege connu** : une cle **revoquee** renvoie exactement le meme 401 qu'une cle
absente ou invalide. Si l'authentification echoue sans raison apparente, verifier
`revoked_at` dans `user_api_keys` avant de soupconner l'URL ou le canal.

## Configuration cote client

```json
{
  "mcpServers": {
    "ab-arts-studio": {
      "type": "http",
      "url": "https://ab-arts.studio/mcp",
      "headers": { "X-API-Key": "<ta cle ab_arts_...>" }
    }
  }
}
```

Pour un client qui ne gere pas les en-tetes personnalises, passer par
`mcp-remote` avec `--header Authorization:Bearer <cle>`.

**L'ancien sous-domaine `mcp.ab-arts.studio` est mort** : son DNS resout encore,
mais plus rien n'ecoute derriere. Une configuration qui le vise echoue sans
message clair.

**Ne jamais commiter de cle dans ce depot.** Aucune n'est presente ici.

## Variables d'environnement cote Supabase

| Variable | Fournie par |
|---|---|
| `SUPABASE_URL` | injectee par la plateforme |
| `SUPABASE_SERVICE_ROLE_KEY` | injectee par la plateforme |
| `APP_URL` | a definir dans les secrets du projet |

La fonction est declaree sans verification de JWT — elle authentifie elle-meme :

```toml
[functions.mcp-server]
  verify_jwt = false
```

## Redeployer

Manuel : il n'y a **aucune CI** pour les edge functions, un `git push` ne deploie
rien.

```bash
# depuis D:\_GIT\abartsstudio-claude, pas depuis ce dossier
supabase functions deploy mcp-server --project-ref lzffavvwaffkvwljuxyz
```

Lancer la commande depuis le depot principal est obligatoire : le deploiement
embarque `_shared/model-catalog.generated.ts`, resolu relativement a ce depot.

## Note sur le projet Supabase

La version precedente de ce README annonçait le projet `tegxnwrdhgwvnbpukpar`.
**C'est faux.** Verifie le 2026-09-07 : ce projet ne repond plus du tout, tandis
que `lzffavvwaffkvwljuxyz` sert bien la fonction. Le `config.toml`, le
`.temp/project-ref`, le `.env.local` et le rewrite Vercel du depot principal
pointent tous vers `lzffavvwaffkvwljuxyz`.

Seul le fichier `.env` du depot principal contient encore l'ancienne URL. Il
n'est pas suivi par git et Vite donne la priorite a `.env.local`, donc
l'application utilise bien le bon projet — mais c'est un vestige a nettoyer.
