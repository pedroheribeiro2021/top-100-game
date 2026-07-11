# Checklist — Pré-voo (antes de gerar o prompt / implementar)

Rodar mentalmente antes de acionar o Claude Code. Evita retrabalho e gasto de token.

- [ ] Entendi a demanda em 1 frase? (se não, pergunte antes)
- [ ] Li **só** o doc relevante (não o projeto todo)?
- [ ] Identifiquei os arquivos exatos via tabela "onde mexer" (`docs/ARCHITECTURE.md`)?
- [ ] A tarefa está pequena e fechada? (se grande, quebrar com `templates/TASK.md`)
- [ ] A mudança afeta uma **invariante** do `docs/DOMAIN.md` (pontuação, item único, segredo do ranking, custo zero de IA)? → precisa ADR antes.
- [ ] A mudança expõe algo novo na API? → conferir sanitização (ADR-0002).
- [ ] Mexe em tema/ranking? → seguir schema de `docs/db/SCHEMA.md`, nunca hardcodar.
- [ ] O prompt lista o que **não** abrir?
- [ ] Defini critérios de aceite verificáveis?
