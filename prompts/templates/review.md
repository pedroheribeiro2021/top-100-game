# Prompt — Revisão de código

> Para pedir ao Claude Code uma revisão focada e barata.

## Alvo da revisão
<arquivo(s) ou diff/branch>

## Foco
- [ ] Corretude vs. `docs/DOMAIN.md` (pontuação = posição, item único, fases da rodada)
- [ ] Segurança: API sanitizada, ranking oculto? (ADR-0002)
- [ ] Custo zero: sem IA em runtime fora do fallback com flag? (ADR-0001)
- [ ] Convenções (`docs/CONVENTIONS.md`)
- [ ] Tratamento de erro e casos de borda (timeout, jogador saiu, palpite duplicado)

## Arquivos a analisar
- <apenas o alvo> — não expandir para o projeto todo.

## Saída esperada
Lista priorizada (bloqueante / recomendável / opcional), cada item com arquivo:linha e sugestão concreta. Sem reescrever o arquivo.
