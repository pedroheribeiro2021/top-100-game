# Prompt 07 — Visual retrô do protótipo

## Objetivo
Aplicar o design system do protótipo Figma em todas as telas: onboarding, home, criar/entrar sala, lobby, jogo, revelação e fim. **Sem mudar comportamento.**

## Contexto
Leia **primeiro** `docs/DESIGN.md` — identidade visual completa e fluxo tela a tela (dispensa abrir o protótipo). Pré-requisitos: prompts 01–06 (as telas finais dependem das features).

## Arquivos a analisar
- `web/app/globals.css` — tokens: gradiente de fundo, fonte mono, cores (pink #ff2e7e, cyan #22d3ee, amarelo #fbbf24), sombra dura
- `web/app/page.tsx` — home + onboarding (onboarding pode ser overlay na primeira visita, localStorage)
- `web/app/game/[code]/page.tsx` — lobby, jogo (timer, placar, itens usados), morte súbita
- `web/components/RoundResultView.tsx` — revelação e fim
- `web/components/` — criar componentes reutilizáveis: `RetroCard`, `RetroButton`, `Chip` (borda grossa + sombra dura)

## Arquivos que NÃO precisa analisar
- `functions/` inteiro. Nada de backend.

## Diretrizes (de docs/DESIGN.md)
- Fundo gradiente azul→roxo→magenta na tela toda; tipografia monoespaçada em tudo.
- Cards brancos com borda 3–4px colorida + sombra dura deslocada (sem blur).
- Botão primário pink maiúsculo; secundário amarelo; desabilitado esmaecido.
- Placar com posições coloridas (#1 pink, #2 amarelo, #3 cyan); banner de resultado em gradiente amarelo→laranja.
- Rodapé do jogo com a dica: "Quanto mais baixo no ranking, mais pontos! Cada item só pode ser usado uma vez."

## Critérios de aceite
- [ ] Todas as telas seguem docs/DESIGN.md (conferir lado a lado com as descrições)
- [ ] Nenhuma mudança de comportamento (mesmos fluxos e chamadas de API)
- [ ] Responsivo básico (mobile-first — jogadores usam celular)
- [ ] `npm run build` + `npm run lint` limpos em `web/`

## Restrições
- Tailwind 4 apenas; tokens/utilities em `globals.css`. Sem libs novas de UI.

## Checklist final
- [ ] `docs/DESIGN.md`: seção "Gap atual" removida/atualizada
- [ ] Commit `feat(web): retro arcade design system from Figma prototype`
