# GLOSSARY — termos do domínio

| Termo | Significado |
|---|---|
| **Tema** | Assunto do ranking da partida ("Top 100 maiores cidades do mundo"). Vem do banco de temas. |
| **Ranking (oculto)** | Lista secreta de 100 itens do tema, posição 1 (mais óbvio) → 100 (mais obscuro). |
| **Palpite** | Resposta de um jogador numa rodada. |
| **Posição** | Lugar do item no ranking; é também a pontuação do acerto. |
| **Item usado** | Item que já pontuou na partida; não pontua de novo (DOMAIN §4). |
| **Alias** | Grafia alternativa aceita para um item ("Tokyo" → "Tóquio"). |
| **Normalização** | Transformação do texto para matching: minúsculas, sem acento, trim, espaços colapsados. |
| **Sala / gameCode** | Instância de partida; código de 6 caracteres para entrar. |
| **Host** | Criador da sala; único que inicia a partida. |
| **Rodada** | Ciclo palpite → revelação. Fases: ANSWERING, RESULT. |
| **Revelação** | Tela de resultado da rodada (palpites, acertos, pontos). |
| **Morte súbita** | Rodada extra de desempate entre líderes empatados. |
| **Banco de temas** | `data/themes/*.json` — temas pré-gerados e curados; fonte única de rankings (ADR-0001). |
| **Tema aleatório** | Sorteio de um tema do banco na criação da sala. |
| **Fallback de IA** | Provedores gratuitos (Groq/OpenRouter) usados só se o tema não existe no banco; nunca com custo. |
