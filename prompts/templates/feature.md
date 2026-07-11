# Prompt — Nova funcionalidade

> Preencha e entregue ao Claude Code. Remova estas instruções antes de enviar.

## Objetivo
<uma frase: o que deve existir ao final>

## Contexto
Leia antes de codar: `docs/ARCHITECTURE.md` (seção relevante) e `docs/DOMAIN.md`.
Regra do jogo afetada: <linke a seção de DOMAIN.md / ADR>

## Arquivos a analisar
- <caminho> — <por quê>

## Arquivos que NÃO precisa analisar
- Todo o resto do projeto. Não varra `web/` nem `functions/` inteiros.

## Regras do jogo
- <regra concreta>  (fonte: docs/DOMAIN.md §X)
- Expõe dado novo na API? Sanitizar (ADR-0002). IA em runtime? Proibido (ADR-0001).

## Plano de implementação
1. <passo>
2. <passo>

## Critérios de aceite
- [ ] <comportamento verificável>
- [ ] `npm run build` e `npm run lint` sem erros (app tocado)
- [ ] Sem regra de jogo nova fora de DOMAIN.md/ADR

## Restrições
- Editar trechos, não reescrever arquivos.
- Regra de negócio no service; controller só HTTP; página só UI.
- Textos de UI em português.

## Checklist final (obrigatório)
- [ ] Código compila e lint limpo
- [ ] Doc atualizada (`docs/…`) se mudou comportamento
- [ ] ADR criado se mudou invariante/segurança/schema
- [ ] Commit no padrão `feat(escopo): …`
