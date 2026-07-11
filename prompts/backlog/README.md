# Backlog de prompts — do estado atual até "pronto pra se divertir"

Prompts fechados para o Claude Code, um por arquivo, **sequenciados por dependência e severidade**. Execute na ordem. Cada prompt inclui atualização de doc no seu Definition of Done.

## Ordem de execução

### Sprint 0 — Segurança e fundação (sem isso o jogo não funciona de verdade)
| # | Prompt | Tipo | Problema coberto |
|---|---|---|---|
| 01 | [Sanitizar API: ranking oculto](./01-sanitizar-api-ranking.md) | fix | GET /games/:id entrega as respostas (trapaça) |
| 02 | [Banco de temas JSON](./02-banco-de-temas.md) | feat | custo zero de IA; tema escolhido/sorteado do banco (ADR-0001) |
| 03 | [Matching normalizado + item único](./03-matching-e-item-unico.md) | feat | acentos/aliases; item só pontua uma vez (DOMAIN §4) |

### Sprint 1 — Regras completas da partida
| # | Prompt | Tipo | Problema coberto |
|---|---|---|---|
| 04 | [Configuração da sala + host + limite](./04-config-sala-host.md) | feat | rodadas 3/5/7/10, tempo 15/30/45/60s, 2–5 jogadores, só host inicia |
| 05 | [Timer com expiração de rodada](./05-timer-expiracao.md) | feat | rodada fecha sozinha; ausente marca 0 |
| 06 | [Morte súbita + tela final completa](./06-morte-subita-fim.md) | feat | desempate; Top 100 revelado; jogar novamente |

### Sprint 2 — Experiência
| # | Prompt | Tipo | Problema coberto |
|---|---|---|---|
| 07 | [Visual retrô do protótipo](./07-visual-prototipo.md) | feat | design system + onboarding + telas (docs/DESIGN.md) |
| 08 | [Higiene do repositório](./08-higiene-repo.md) | chore | credencial commitada, código morto, README desatualizado |

## Como usar
Abra o prompt, revise (pré-voo: `checklists/pre-flight.md`), cole no Claude Code. Ao terminar: `checklists/definition-of-done.md` e siga para o próximo.
