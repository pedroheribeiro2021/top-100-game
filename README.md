# top-100-game

## Configuração de ambiente

1. Copie os arquivos de exemplo:

```bash
cp functions/.env.example functions/.env
cp web/.env.example web/.env.local
```

2. Preencha as variáveis obrigatórias:
- `GEMINI_API_KEY` em `functions/.env`
- `CORS_ORIGINS` em `functions/.env` (lista separada por vírgula)
- Variáveis `NEXT_PUBLIC_*` em `web/.env.local`

> Observação: o Firebase Emulator busca variáveis no escopo de `functions/.env` para Functions locais.

## CI/CD (GitHub Actions)

O workflow de CI está em `.github/workflows/ci.yml` e roda automaticamente em `push` e `pull_request` para as branches `develop` e `main`.

### Jobs
- `quality (functions)`
- `quality (web)`
- `status-checks` (agregador final para branch protection)

Para configurar status checks obrigatórios no GitHub, marque pelo menos:
- `status-checks`
