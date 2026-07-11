# ADR-0001 — Banco de temas em JSON no repositório (custo zero de IA)

**Status:** aceito
**Data:** 2026-07-09
**Supersedes:** —

## Contexto
Gerar rankings com LLM em runtime cria custo, latência (100 itens por partida), dependência de chaves e qualidade instável (o histórico do projeto tem Gemini → Groq → OpenRouter → fallback fake). Requisito do produto: **nenhum custo de IA**, mas jogadores escolhem temas livremente.

## Decisão
Rankings vêm de um banco local versionado: `data/themes/*.json` + `index.json` (schema em `docs/db/SCHEMA.md`). Tema digitado é casado por normalização/similaridade; sem match, o app oferece temas próximos ou sorteio. Provedores gratuitos (Groq/OpenRouter) ficam apenas como fallback opcional atrás de flag, e o fallback simulado (itens fake) morre. A expansão do banco é feita fora do runtime (Cowork/Claude geram e curam novos JSONs).

## Consequências
+ Custo zero, latência zero, offline, qualidade curável, aliases controlados (melhora o matching).
+ Temas versionados: revisão via PR, sem deploy de backend para adicionar tema (basta redeploy de assets).
− Tema totalmente inédito não funciona na hora — mitigado por banco amplo + sorteio + fallback opcional.
− Ordem dos itens é aproximada; aceito por DOMAIN §5 (diversão > precisão).
