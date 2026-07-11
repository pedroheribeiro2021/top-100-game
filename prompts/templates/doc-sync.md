# Prompt — Sincronizar documentação

> Use depois de uma mudança de código que afeta comportamento/estrutura.

## Mudança realizada
<resumo do que mudou no código> (commit/branch: <ref>)

## Docs candidatos a atualizar
- [ ] `docs/ARCHITECTURE.md` — se arquivos/rotas/módulos mudaram
- [ ] `docs/DOMAIN.md` — se uma regra do jogo mudou
- [ ] `docs/DESIGN.md` — se tela/fluxo mudou
- [ ] `docs/adr/` — novo ADR se mudou invariante/segurança/schema
- [ ] `docs/db/SCHEMA.md` — se documento `games` ou schema de tema mudou
- [ ] `docs/GLOSSARY.md` — se surgiu termo novo

## Arquivos a analisar
- <o diff da mudança> + os docs listados. Nada além.

## Critérios de aceite
- [ ] Doc reflete o código atual (sem divergência)
- [ ] Edições mínimas (trechos, não reescrita)
- [ ] Commit `docs(escopo): …`
