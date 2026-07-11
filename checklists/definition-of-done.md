# Checklist — Definition of Done (DoD)

Uma tarefa só está **pronta** quando **todos** os itens abaixo passam.

## Código
- [ ] Faz o que o objetivo pedia (critérios de aceite ✔)
- [ ] `npm run build` sem erros (no app tocado: `web/` e/ou `functions/`)
- [ ] `npm run lint` sem erros
- [ ] Diff mínimo, sem reescrita desnecessária
- [ ] Testado no fluxo real (emulador + web) quando a mudança é de jogo

## Regras e decisões
- [ ] Nenhuma regra de jogo nova fora de `docs/DOMAIN.md`
- [ ] ADR criado se mudou invariante / segurança / schema
- [ ] ADR-0001 (custo zero) e ADR-0002 (ranking privado) respeitados

## Documentação (fonte de verdade)
- [ ] `docs/ARCHITECTURE.md` atualizado se arquivos/rotas mudaram
- [ ] `docs/DOMAIN.md` atualizado se regra mudou
- [ ] `docs/db/SCHEMA.md` atualizado se documento `games` ou schema de tema mudou
- [ ] `docs/DESIGN.md` atualizado se tela/fluxo mudou
- [ ] `docs/GLOSSARY.md` atualizado se termo novo

## Entrega
- [ ] Commits no padrão Conventional Commits (`docs/CONVENTIONS.md`)
- [ ] CI verde
