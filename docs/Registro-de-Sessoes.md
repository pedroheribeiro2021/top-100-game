# Registro de sessões

## 2026-10-12 — Busca livre com IA (Gemini) + 57 temas novos
- **Objetivo:** corrigir o "erro" ao pesquisar tema livre; ampliar o banco (≥ 50 temas, novas categorias); busca livre via Gemini.
- **Causa do erro:** tema fora do banco (só 10 temas) → 404 exibido como `alert`; matching por string inteira falhava em "séries", "melhores X" e casava "a" com qualquer tema.
- **Alterações:** matching por palavras + sugestões em caso ambíguo (`themes.service.ts`); Gemini como provedor principal (`ranking.service.ts`); banco forte (≥ 0,85) antes da IA (`games.service.ts`); sugestões inline e filtro sem acento (`web/app/page.tsx`); 57 temas novos, 10 categorias novas (`data/themes/`).
- **Decisões:** ADR-0003 (tema livre pelo Gemini free tier, Groq/OpenRouter de reserva, atrás de `ENABLE_AI_FALLBACK`).
- **Pendências / próximos passos:** ver `Pendencias.md`.
