<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

Este projeto usa Next.js 16 — APIs, convenções e estrutura podem divergir do seu treinamento. Leia o guia relevante em `web/node_modules/next/dist/docs/` antes de escrever código de framework. Respeite avisos de deprecação.
<!-- END:nextjs-agent-rules -->

# TOP 100 GAME — índice para agentes

Party game multiplayer de rankings ocultos (Next.js 16 + Firebase Functions/Express + Firestore). **Antes de abrir código, leia o doc certo** — economiza contexto e evita varrer o projeto.

## Documentação (fonte de verdade)
- **`docs/ARCHITECTURE.md`** — mapa de arquivos, o que cada módulo faz e *onde mexer por tipo de tarefa*. **Leia primeiro.**
- **`docs/DOMAIN.md`** — regras do jogo (sala, rodadas, pontuação, matching, empate).
- **`docs/DESIGN.md`** — fluxo de telas e design system do protótipo Figma.
- **`docs/adr/`** — decisões. ADR-0001: temas vêm de JSON no repo (custo zero de IA). ADR-0002: o ranking **nunca** é enviado ao cliente durante a partida.

Regra: a documentação é a fonte de verdade; o código a implementa. Divergência = sinalizar, não assumir que o código está certo.

## Regras de trabalho (mínimo contexto)
- Abra só os arquivos que a tarefa exige (tabela "onde mexer" em ARCHITECTURE).
- Regra de negócio vive em `functions/src/services/` — a maioria das tarefas de regra não precisa abrir o front.
- Pontuação e matching são críticos: pontos = posição no ranking; item vale uma vez por partida.
- O ranking completo só pode aparecer na resposta da API quando `status = FINISHED`.
- Toda mudança permanente deve atualizar o doc correspondente.

## Comandos
- Web: `cd web && npm run dev` · `npm run build` · `npm run lint`
- API: `cd functions && npm run dev` · `npm run build` · `npm run lint` · `npm run serve`
