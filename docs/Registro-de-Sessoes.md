# Registro de sessões

## 2026-10-16 — Ajustes de partida (matching, repetição, categorias, pausa)
- **Objetivo:** aceitar "he man" para "He-Man"; mesmo item na mesma rodada pontuar para todos; categorias no estilo do app; pausar o cronômetro.
- **Alterações:** `matching.ts` (pontuação interna vira espaço; comparação sem espaços); `games.service.ts` (item repetido na mesma rodada pontua; `setRoundPaused` + campo `roundPausedRemainingMs`; expiração lazy ignora rodada pausada; `ROUND_PAUSED`); rotas `POST /games/:id/pause|resume`; `web/app/page.tsx` (blocos de categoria retrô com ícones, linhas de tema); `web/app/game/[code]/page.tsx` (botão PAUSAR/RETOMAR do host, faixa de pausado); textos de regra no rodapé e onboarding.
- **Decisões:** pausa só pelo host e bloqueia palpites; repetição global continua valendo entre rodadas (DOMAIN §3/§4).
- **Bug da revanche:** "Jogar novamente" sorteava um tema novo sem avisar; os jogadores respondiam pelo Top 100 da partida anterior e erravam tudo. Reproduzido ponta a ponta (API local com Firestore em memória). Correção: host escolhe "Repetir o tema" (`sameTheme`, reaproveita o ranking) ou "Tema aleatório". Corrigida também a faixa "gerado por IA via bank" que aparecia em todo tema do banco.
- **Testes:** build/lint de web e functions; matching com casos reais; categorias no navegador; partida completa + pausa + revanche (aleatória e mesmo tema) ponta a ponta na API local com Firestore em memória.

## 2026-10-12 — Busca livre com IA (Gemini) + 57 temas novos
- **Objetivo:** corrigir o "erro" ao pesquisar tema livre; ampliar o banco (≥ 50 temas, novas categorias); busca livre via Gemini.
- **Causa do erro:** tema fora do banco (só 10 temas) → 404 exibido como `alert`; matching por string inteira falhava em "séries", "melhores X" e casava "a" com qualquer tema.
- **Alterações:** matching por palavras + sugestões em caso ambíguo (`themes.service.ts`); Gemini como provedor principal (`ranking.service.ts`); banco forte (≥ 0,85) antes da IA (`games.service.ts`); sugestões inline e filtro sem acento (`web/app/page.tsx`); 57 temas novos, 10 categorias novas (`data/themes/`).
- **Decisões:** ADR-0003 (tema livre pelo Gemini free tier, Groq/OpenRouter de reserva, atrás de `ENABLE_AI_FALLBACK`).
- **Pendências / próximos passos:** ver `Pendencias.md`.
