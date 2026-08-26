# ab-arts-studio

Serveur MCP **distant**, en HTTP. Il tourne comme Edge Function Supabase dans le
projet `tegxnwrdhgwvnbpukpar`, sous le nom `mcp-server`.

Le code source est desormais sauvegarde ici, dans
[`supabase/functions/mcp-server/`](supabase/functions/mcp-server) :

| Fichier | Role |
|---|---|
| `index.ts` | le serveur complet (441 lignes) : authentification, outils MCP, transport HTTP |
| `deno.json` | la carte d'imports Deno (hono, mcp-lite, zod, supabase-js) |

La fonction ne depend d'aucun fichier voisin : elle n'importe que des paquets
distants, pas de `_shared/`. Ces deux fichiers suffisent a la redeployer.

## Ce que le serveur expose

Serveur `ab-arts-studio`, version `1.1.0`, sept outils :

| Outil | Role |
|---|---|
| `list_models` | catalogue des modeles disponibles |
| `get_token_balance` | solde de jetons du compte |
| `list_recent_assets` | derniers assets generes |
| `get_asset` | un asset par identifiant |
| `wait_for_asset` | attente bloquante de fin de generation |
| `generate_image` | generation d'image |
| `generate_video` | generation de video |

## Authentification

L'endpoint **exige une cle d'API AB-Arts**. Sans cle, il repond
`-32001 Unauthorized`. Le serveur accepte la cle de trois facons, par ordre de
preference :

1. l'en-tete `X-API-Key` — **a privilegier**, car la passerelle Supabase
   interprete `Authorization` comme un JWT et peut le consommer avant la fonction ;
2. l'en-tete `Authorization: Bearer <cle>` ;
3. le parametre d'URL `?api_key=<cle>`, pour les clients incapables de poser un
   en-tete.

La cle est verifiee cote base via la fonction `verify_api_key`, et chaque usage
est trace dans `api_key_audit_log`.

## Configuration Claude Code

Le bloc ci-dessous remplace celui de l'ancienne version de ce README, qui
n'indiquait que l'URL : **sans cle, cette configuration ne fonctionne pas.**

```json
{
  "mcpServers": {
    "ab-arts-studio": {
      "type": "http",
      "url": "https://tegxnwrdhgwvnbpukpar.supabase.co/functions/v1/mcp-server",
      "headers": {
        "X-API-Key": "<ta cle ab_arts_...>"
      }
    }
  }
}
```

Pour un client qui ne gere pas les en-tetes personnalises, passer par
`mcp-remote` avec `--header Authorization:Bearer <cle>`.

**Ne jamais commiter de cle dans ce depot.** Aucune cle n'est presente dans les
fichiers sauvegardes ici.

## Variables d'environnement attendues cote Supabase

| Variable | Fournie par |
|---|---|
| `SUPABASE_URL` | injectee automatiquement par la plateforme |
| `SUPABASE_SERVICE_ROLE_KEY` | injectee automatiquement par la plateforme |
| `APP_URL` | a definir dans les secrets du projet |

## Configuration de deploiement

Dans le `config.toml` du projet source, la fonction est declaree sans
verification de JWT — l'authentification est faite par la fonction elle-meme :

```toml
[functions.mcp-server]
  verify_jwt = false
```

## Redeployer

```bash
supabase functions deploy mcp-server --project-ref tegxnwrdhgwvnbpukpar
```

## Provenance de cette sauvegarde

Le code n'a **pas** ete recupere avec
`supabase functions download mcp-server --project-ref tegxnwrdhgwvnbpukpar` :
cette commande renvoie `403 — Your account does not have the necessary
privileges`, le compte Supabase connecte sur le poste n'ayant pas acces au
projet `tegxnwrdhgwvnbpukpar`.

Les fichiers proviennent donc du depot applicatif
`AB-Arts/abartsstudio-claude`, chemin `supabase/functions/mcp-server/`, qui est
la source de verite d'ou la fonction est deployee.

**Consequence a connaitre :** cette copie n'a pas pu etre comparee a la version
reellement en ligne. Si un correctif a un jour ete pousse directement depuis le
tableau de bord Supabase sans repasser par le depot, il n'est pas ici. Pour
lever ce doute, se connecter avec le compte proprietaire du projet
(`supabase login`) puis relancer la commande `download` et comparer.

Second point de vigilance : dans `abartsstudio-claude`, `supabase/config.toml`
et `supabase/.temp/project-ref` pointent vers le projet
`lzffavvwaffkvwljuxyz`, alors que le `.env` de l'application et l'URL du MCP
pointent vers `tegxnwrdhgwvnbpukpar`. Un `supabase functions deploy` lance sans
`--project-ref` explicite depuis ce depot deploierait donc **sur le mauvais
projet**. Toujours passer `--project-ref tegxnwrdhgwvnbpukpar`.
