# Prompt — Refatoração (sem mudar comportamento)

> Preencha e entregue ao Claude Code. Remova estas instruções antes de enviar.

## Objetivo
<o que melhorar: legibilidade, duplicação, performance>. **Comportamento não muda.**

## Invariantes a preservar
- <comportamento observável que deve continuar idêntico>  (fonte: docs/DOMAIN.md)

## Arquivos a analisar
- <caminho> — <por quê>

## Arquivos que NÃO precisa analisar
- Todo o resto.

## Restrições
- Zero mudança de comportamento externo (mesmas entradas → mesmas saídas).
- Não alterar assinaturas públicas sem listar aqui.
- Editar trechos; não reescrever arquivo inteiro sem necessidade.

## Critérios de aceite
- [ ] Comportamento idêntico (verificar contra DOMAIN.md)
- [ ] `npm run build` e `npm run lint` limpos
- [ ] Diff enxuto e justificado

## Checklist final
- [ ] Nenhuma regra de jogo alterada
- [ ] Doc atualizada só se a estrutura de arquivos mudou (ARCHITECTURE.md)
- [ ] Commit `refactor(escopo): …`
