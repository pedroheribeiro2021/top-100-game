# WORKFLOW — desenvolvimento assistido por IA

Como uma demanda vira código com **mínimo consumo de token** e **máxima qualidade**.

## Papéis
- **Tech Lead (IA de arquitetura):** planeja, quebra em tarefas, seleciona arquivos, escreve o prompt, revisa. Mantém a doc.
- **Claude Code (executor):** implementa a partir de um prompt fechado. Só abre os arquivos indicados.
- **Humano (você):** define a demanda, aprova plano e prompt, faz merge.

## O ciclo (7 passos)
```
1. DEMANDA        → você descreve o que quer (1–3 frases bastam)
2. ENTENDIMENTO   → Tech Lead lê o doc relevante (NÃO o projeto todo)
3. TAREFA         → quebra em tarefas pequenas (templates/TASK.md)
4. PROMPT         → gera prompt fechado (prompts/templates/*)
5. IMPLEMENTAÇÃO  → Claude Code executa
6. REVISÃO+DoD    → checklists/code-review + definition-of-done
7. DOC/ADR        → atualiza doc; decisão relevante vira ADR
```

## Regra de ouro do token
- **Passo 2:** usar a tabela "onde mexer" de `ARCHITECTURE.md` em vez de explorar.
- **Passo 4:** o prompt lista *exatamente* os arquivos a abrir e os que **não** devem ser abertos.
- **Passo 5:** editar trechos, nunca reescrever arquivos inteiros.

## Anatomia de um bom prompt (ver `prompts/templates/`)
Objetivo · Contexto (com link pro doc, não colar código) · Arquivos a analisar · Arquivos a **não** analisar · Regras do jogo (linkar `DOMAIN.md`) · Plano · Critérios de aceite · Restrições · Checklist final.

## Quando parar e virar ADR
Se a decisão: muda uma invariante do `DOMAIN.md` (pontuação, item único, segredo do ranking, custo zero de IA), altera o schema (`db/SCHEMA.md`), afeta segurança, ou define padrão novo → **escreva um ADR** antes de implementar.

## Definição de "pronto"
Uma tarefa só fecha quando passa em `checklists/definition-of-done.md` (código + lint + doc atualizada).

## Anti-padrões (evitar)
- Pedir ao Claude Code para "entender o projeto" sem apontar arquivos.
- Colar código no prompt em vez de linkar o arquivo/doc.
- Implementar regra de jogo nova sem registrar em `DOMAIN.md`/ADR.
- Reintroduzir chamada de IA em runtime "porque é rápido" — fere ADR-0001.
