# data/themes/ — banco de temas (ADR-0001)

Fonte única dos rankings do jogo. Cada arquivo = um tema com **exatamente 100 itens**. Schema completo em `docs/db/SCHEMA.md`.

## Regras de curadoria
1. Posições 1–100 sem furo nem repetição; `value` único no tema (após normalização).
2. Posição 1 = mais óbvio/conhecido/grande; 100 = mais obscuro. Ordem aproximada é aceitável (`accuracy: "aproximado"`) ou assumidamente subjetiva (`"subjetivo"`).
3. `aliases` para grafias realmente diferentes ("Tokyo" → "Tóquio", "EUA"). Acentos/caixa NÃO precisam de alias — a normalização resolve (DOMAIN §4).
4. Itens curtos, sem parênteses explicativos desnecessários — o jogador vai digitar isso.
5. Novo tema: criar `<slug>.json` + adicionar entrada no `index.json`.

## Validação rápida (rodar após editar)
```bash
node -e "const fs=require('fs');for(const t of JSON.parse(fs.readFileSync('data/themes/index.json'))){const d=JSON.parse(fs.readFileSync('data/themes/'+t.file));const vs=d.items.map(i=>i.value.toLowerCase());if(d.items.length!==100)console.log(t.id,'itens:',d.items.length);if(new Set(vs).size!==vs.length)console.log(t.id,'valor duplicado');d.items.forEach((it,ix)=>{if(it.position!==ix+1)console.log(t.id,'posição errada em',ix+1)})};console.log('ok')"
```

## Como expandir o banco (sem custo)
Pedir ao Cowork/Claude: "gere o tema X no schema de docs/db/SCHEMA.md" → revisar manualmente os 100 itens → validar → PR. Nunca gerar em runtime.
