# top-100-game

## Configuração de ambiente

1. Copie os arquivos de exemplo:

```bash
cp functions/.env.example functions/.env
cp web/.env.example web/.env.local
```

2. Preencha as variáveis obrigatórias:
- `GEMINI_API_KEY` em `functions/.env`
- Variáveis `NEXT_PUBLIC_*` em `web/.env.local`

> Observação: o Firebase Emulator busca variáveis no escopo de `functions/.env` para Functions locais.
