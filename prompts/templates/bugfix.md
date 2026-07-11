# Prompt — Correção de bug

> Preencha e entregue ao Claude Code. Remova estas instruções antes de enviar.

## Sintoma
<o que acontece de errado, passos para reproduzir>

## Comportamento esperado
<o que deveria acontecer>  (fonte: docs/DOMAIN.md §X, se aplicável)

## Hipótese / local provável
<arquivo e função suspeitos — use a tabela "onde mexer" de ARCHITECTURE.md>

## Arquivos a analisar
- <caminho> — <por quê>

## Arquivos que NÃO precisa analisar
- Todo o resto. Foque no local suspeito.

## Correção proposta (se houver)
<direção da fix — deixe o Claude Code confirmar antes de mudar muito>

## Critérios de aceite
- [ ] Bug não reproduz mais
- [ ] Não quebra invariantes do DOMAIN.md (nem ADR-0001/0002)
- [ ] `npm run build` e `npm run lint` limpos

## Checklist final
- [ ] Fix mínima (editar trecho, não reescrever)
- [ ] Doc/ADR atualizados se a regra mudou
- [ ] Commit `fix(escopo): …`
