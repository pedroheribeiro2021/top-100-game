# Prompt 08 — Higiene do repositório

## Objetivo
Remover riscos e restos: credencial commitada, código morto, dependências e docs desatualizados.

## Contexto
Leia: `docs/ARCHITECTURE.md` (avisos ⚠️). Itens conhecidos listados abaixo — é uma tarefa mecânica, não exploratória.

## Arquivos a analisar / tocar
- `functions/src/config/service-account.json` — **credencial commitada**: remover do repo, adicionar ao `.gitignore`, carregar via env (`GOOGLE_APPLICATION_CREDENTIALS`); avisar no PR que a chave deve ser **revogada/rotacionada** no console do Google
- `functions/src/services/generateRanking.ts` — mock morto, não importado: deletar
- `package.json` (raiz) — dependências órfãs (`@google/generative-ai`, `firebase-functions` na raiz): remover se nada importa
- `functions/package.json` — `@google/generative-ai` e `fastify` não usados: confirmar e remover
- `README.md` — menciona `GEMINI_API_KEY` (não existe mais): atualizar para o setup real (banco de temas, flag `ENABLE_AI_FALLBACK` opcional)
- `firestore-debug.log` — remover e ignorar no git

## Arquivos que NÃO precisa analisar
- Lógica de jogo, front, temas.

## Critérios de aceite
- [ ] Nenhum segredo no repositório (`git grep -i "private_key"` vazio)
- [ ] `npm run build` + `npm run lint` limpos em `functions/` e `web/`
- [ ] Emulador local continua subindo (instruções do README funcionam)

## Restrições
- Não mexer em comportamento de jogo. Um commit por assunto (`chore:`/`docs:`).

## Checklist final
- [ ] `docs/ARCHITECTURE.md`: remover os ⚠️ resolvidos
- [ ] Commits `chore(repo): …` / `docs(readme): …`
