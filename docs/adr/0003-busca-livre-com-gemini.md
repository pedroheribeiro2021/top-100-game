# ADR-0003 — Tema livre gerado pelo Gemini (free tier)

**Status:** aceito
**Data:** 2026-10-12
**Supersedes:** — (complementa ADR-0001)

## Contexto
Com só o banco local, qualquer tema digitado fora dele dava "Tema não encontrado" — o jogador percebia como erro. O produto quer que o campo de tema livre aceite qualquer assunto, gerado por IA, mantendo **custo zero** (ADR-0001).

## Decisão
- Fluxo de `POST /games` com `theme` (texto livre): o banco é consultado primeiro; se houver casamento **forte** (score ≥ 0,85, sem ambiguidade), usa o banco. Caso contrário, gera o ranking por IA.
- Provedor principal: **Gemini** (Google AI Studio, free tier) via endpoint compatível com OpenAI, modelo `GEMINI_MODEL` (default `gemini-flash-latest`). Groq e OpenRouter continuam como reserva, nessa ordem.
- Continua atrás de `ENABLE_AI_FALLBACK=true`; sem a flag/chave, o comportamento é o do ADR-0001 (banco + sugestões).
- Matching do banco passa a ser por palavras (stopwords ignoradas, qualificadores como "melhores"/"famosos" com peso baixo); busca ambígua ("filmes") devolve sugestões em vez de escolher um tema arbitrário.

## Consequências
+ Qualquer tema digitado vira partida; o banco (67+ temas curados) continua servindo os temas comuns sem latência nem cota.
− Depende da cota gratuita do Gemini; estourada, cai para Groq/OpenRouter e, por fim, 503. Nunca usar chave com billing ativo.
− Rankings gerados não têm `aliases` e a ordem é a do modelo — qualidade menor que a do banco.
