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
− A ordem é a do modelo — qualidade menor que a do banco.

## Atualização 2026-10-16
- O modelo devolve JSON `{items: [{value, aliases}]}`: aliases ambíguos (em mais de um item) ou iguais a outro item são descartados; detalhes entre parênteses são removidos do nome.
- Temas com menos de 100 itens reais são aceitos com **≥ 30 itens** (continuação que não traz item novo encerra a geração).
- Rankings gerados ficam em cache na coleção `generatedRankings` (id = sha1 do tema normalizado): mesmo tema = mesmo ranking, sem gastar cota. Nunca exposta ao cliente (ADR-0002).
- Falha de todos os provedores → 503 com temas parecidos do banco (`suggestions`), exibidos na Home.
- `GEMINI_MODEL` deve ficar vazio (default `gemini-flash-latest`, alias que acompanha o modelo atual): fixar versão (`gemini-2.0-flash-lite`) quebrou staging com 404 quando o modelo saiu do ar.
