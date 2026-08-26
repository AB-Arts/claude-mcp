# ab-arts-studio

Serveur MCP **distant**, en HTTP. Il n'y a pas de code a sauvegarder ici : le
serveur est une Edge Function Supabase deployee, son source n'est pas present
sur ce poste.

## Configuration

Declare uniquement pour le projet `D:\_GIT\ab-arts` :

```json
{
  "mcpServers": {
    "ab-arts-studio": {
      "type": "http",
      "url": "https://tegxnwrdhgwvnbpukpar.supabase.co/functions/v1/mcp-server"
    }
  }
}
```

## Ce qui manque a cette sauvegarde

Le code de l'Edge Function `mcp-server` vit dans le projet Supabase
`tegxnwrdhgwvnbpukpar`, pas dans le depot `ab-arts` ni sur ce disque. Pour le
rapatrier et le versionner ici :

```bash
supabase functions download mcp-server --project-ref tegxnwrdhgwvnbpukpar
```

Tant que ce n'est pas fait, ce MCP n'est pas restaurable depuis cette
sauvegarde — seule sa configuration l'est.
