# DESIGN — visual e fluxo de telas

Fonte: protótipo Figma <https://dodge-sorbet-20715481.figma.site> (navegado em 09/07/2026). Este doc substitui a necessidade de abrir o protótipo.

## Identidade visual (retrô arcade)
- **Fundo**: gradiente diagonal azul-marinho → roxo → magenta escuro (`#1e3a8a → #7c3aed → #9d174d`, aprox.), cobre a tela inteira.
- **Tipografia**: monoespaçada (estilo terminal/fliperama) em TODO o app, inclusive títulos. Títulos com espaçamento largo (`letter-spacing`).
- **Cores de destaque**: pink `#ff2e7e` (ações primárias), cyan `#22d3ee`, amarelo `#fbbf24`, laranja em gradiente amarelo→laranja (banners de resultado).
- **Cards**: fundo branco/off-white, borda grossa (3–4px) em cor de destaque + **sombra dura deslocada** (offset ~6px, sem blur) na mesma cor escurecida. Nada de sombras suaves.
- **Botões**: retangulares, texto mono maiúsculo, mesma linguagem de borda+sombra dura. Primário pink, secundário amarelo, desabilitado esmaecido.
- **Chips/ícones**: quadrados coloridos (cyan/amarelo/pink) com ícone dentro.
- **Feedback**: acerto em verde, erro em vermelho "Não está no Top 100"; pontos em amarelo.
- Título "TOP 100" em amarelo com leve sombra; subtítulo "O jogo de rankings ocultos".

## Fluxo de telas (todas as ações, do protótipo)
1. **ONBOARDING** — 3 cartões: como funciona / quanto mais baixo melhor (pos 1 = 1pt, pos 98 = 98pts) / vença a partida. Ação: COMEÇAR.
2. **HOME** — CRIAR SALA · ENTRAR NA SALA.
3A. **CRIAR SALA** — tema (manual ou "TEMA ALEATÓRIO"), rodadas (3/5/7/10), tempo (atalhos 15/30/45/60s ou "Personalizado" com input em segundos/minutos), CRIAR (desabilitado sem tema).
3B. **ENTRAR NA SALA** — código (6 chars) + nome, ENTRAR.
4. **LOBBY** — código da sala grande + botão copiar; card do tema com rodadas/tempo; lista de jogadores (2–5) com coroa no host; status "AGUARDANDO"; INICIAR PARTIDA (só host).
5. **JOGANDO** — card do tema com "Rodada N de M" e pontos; barra de TEMPO regressiva; campo "SEU PALPITE" + CONFIRMAR PALPITE; PLACAR ao vivo (#1/#2/#3 com cores pink/amarelo/cyan); rodapé com a dica das regras; lista de itens já usados.
6. **REVELAÇÃO** — banner "RESULTADO DA RODADA N" (gradiente amarelo→laranja); card por jogador: palpite, ✓/✗, posição e pontos; PRÓXIMA RODADA (ou resultado final).
7. **VERIFICAÇÃO** — sistema calcula líder e detecta empate (sem tela própria).
8A. **MORTE SÚBITA** — mesma mecânica, até desempatar.
8B. **FIM DE JOGO** — ranking final, vencedor, VER TOP 100 COMPLETO, JOGAR NOVAMENTE, NOVA SALA, SAIR.

## Loops e saídas
- Rodadas: JOGANDO → REVELAÇÃO → JOGANDO (até a última) → VERIFICAÇÃO → MORTE SÚBITA ou FIM.
- Replay: FIM → JOGAR NOVAMENTE → JOGANDO.
- Voltar para HOME a partir de criar/entrar/lobby/fim.

## Estado da implementação
O front (`web/`) segue este design system (backlog 07): tokens retrô em `globals.css`, componentes reutilizáveis `RetroCard`/`RetroButton`/`Chip`/`OnboardingOverlay`, e todas as telas (onboarding, home/criar sala, lobby, jogo, revelação, morte súbita, fim) migradas.
