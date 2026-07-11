# prompts/ — biblioteca de prompts para o Claude Code

Prompts prontos e otimizados para **mínimo consumo de token**. O Tech Lead preenche um template e entrega ao Claude Code.

## Templates
| Situação | Template |
|---|---|
| Nova funcionalidade | [`templates/feature.md`](./templates/feature.md) |
| Corrigir bug | [`templates/bugfix.md`](./templates/bugfix.md) |
| Refatorar sem mudar comportamento | [`templates/refactor.md`](./templates/refactor.md) |
| Revisar código existente | [`templates/review.md`](./templates/review.md) |
| Sincronizar doc após mudança | [`templates/doc-sync.md`](./templates/doc-sync.md) |

## Backlog pronto
[`backlog/`](./backlog/README.md) tem os prompts sequenciados para levar o jogo até "pronto pra se divertir". Execute na ordem.

## Como usar
1. Escolha o template pela situação (ou pegue o próximo do backlog).
2. Preencha **todos** os campos — principalmente "Arquivos a analisar" e "Arquivos a NÃO analisar".
3. Linke docs (`docs/DOMAIN.md`, ADRs) em vez de colar código.
4. Entregue ao Claude Code. Ele deve abrir só o listado.

## Princípios de um bom prompt
- **Fechado:** objetivo único e verificável.
- **Escopo mínimo:** lista exata de arquivos; diz o que NÃO abrir.
- **Sem colar código:** aponta o arquivo/linha.
- **Critérios de aceite** testáveis.
- **Checklist final** obrigatório (inclui atualizar doc).
