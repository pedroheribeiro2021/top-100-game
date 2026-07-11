# Documentação TOP 100 GAME — índice

Ponto único de navegação. **Leia daqui antes de abrir código.** Abra esta pasta (ou a raiz do projeto) como vault do Obsidian.

## Comece por aqui
| Preciso de… | Vá para |
|---|---|
| Entender o projeto e achar arquivos | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Entender as regras do jogo | [`DOMAIN.md`](./DOMAIN.md) |
| Fluxo de telas e visual (protótipo) | [`DESIGN.md`](./DESIGN.md) |
| Saber como trabalhamos (fluxo IA) | [`WORKFLOW.md`](./WORKFLOW.md) |
| Padrões de código / naming / commits | [`CONVENTIONS.md`](./CONVENTIONS.md) |
| Termos do domínio | [`GLOSSARY.md`](./GLOSSARY.md) |
| Decisões arquiteturais | [`adr/`](./adr/README.md) |
| Dados: Firestore + banco de temas | [`db/SCHEMA.md`](./db/SCHEMA.md) |

## Recursos de trabalho (fora de docs/)
| O quê | Onde |
|---|---|
| Modelo operacional / papéis | [`../CLAUDE.md`](../CLAUDE.md), [`../AGENTS.md`](../AGENTS.md) |
| Prompts prontos p/ Claude Code | [`../prompts/`](../prompts/README.md) |
| Template de tarefa | [`../templates/TASK.md`](../templates/TASK.md) |
| Checklists (DoD, review, pré-voo) | [`../checklists/`](../checklists/README.md) |
| Banco de temas (JSON) | [`../data/themes/`](../data/themes/README.md) |

## Princípios
1. Doc é fonte de verdade; código implementa.
2. Mínimo contexto: abra só o necessário.
3. Toda mudança permanente atualiza a doc.
4. Decisão importante vira ADR.
5. **Custo zero de IA em runtime** (ADR-0001) e **ranking oculto até o fim** (ADR-0002) são invariantes do produto.
