// Deploy do Firebase Functions só empacota functions/ (ver firebase.json).
// O banco de temas vive em data/themes/ na raiz do repo, então precisa ser
// copiado para dentro de lib/ no build para existir em runtime.
const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '../../data/themes');
const destination = path.resolve(__dirname, '../lib/data/themes');

fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(source, destination, { recursive: true });

console.log(`Copied theme bank from ${source} to ${destination}`);
