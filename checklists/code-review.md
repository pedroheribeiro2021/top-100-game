# Checklist — Revisão de código

## Corretude
- [ ] Bate com as regras de `docs/DOMAIN.md` (pontuação = posição; item único por partida; fases da rodada)
- [ ] Matching usa normalização + aliases (DOMAIN §4), nunca igualdade crua
- [ ] Estados/transições respeitam DOMAIN §8

## Segurança (ADR-0002)
- [ ] Nenhuma resposta da API expõe `ranking` (ou derivado) antes de FINISHED
- [ ] Conferência de palpite só no servidor
- [ ] Nenhuma credencial nova no repo; env via `.env`

## Custo zero (ADR-0001)
- [ ] Nenhuma chamada de IA em runtime fora do fallback opcional com flag
- [ ] Temas lidos de `data/themes/`, não hardcoded

## Qualidade
- [ ] Convenções seguidas (`docs/CONVENTIONS.md`): naming, erros SCREAMING_SNAKE no service, UI em português
- [ ] Regra de negócio no service, não no controller/página
- [ ] Tipos `web/types/game.ts` espelham a visão sanitizada da API
- [ ] Erros tratados no lugar certo

## Escopo e custo
- [ ] Diff mínimo (editou trecho, não reescreveu)
- [ ] Nada fora do escopo da tarefa

## Documentação
- [ ] Doc atualizada se comportamento/estrutura mudou
- [ ] ADR criado se mudou invariante/segurança/schema
