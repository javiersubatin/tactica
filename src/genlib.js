global.Chess = require('./minichess.js').Chess || require('./minichess.js');
const { CONCEPTS, classifyPrinciple } = require('./principles.js');
const fs = require('fs');
const lines = fs.readFileSync('lines.txt', 'utf8').split('\n').filter(Boolean);
const seen = new Set(), out = {}; CONCEPTS.forEach(c => out[c.id] = []);
let bad = 0;
lines.forEach((ln, li) => {
  const c = new Chess(), toks = ln.split(/\s+/);
  for (let k = 0; k < toks.length; k++) {
    const fen = c.fen(), m = c.move(toks[k]);
    if (!m) { bad++; console.error('line', li + 1, 'bad token', toks[k], 'at', k); break; }
    const uci = m.from + m.to + (m.promotion || '');
    if (k < 4) continue;                       // skip the very first, memorised moves
    const key = fen.split(' ').slice(0, 4).join(' ');
    if (seen.has(key)) continue; seen.add(key);
    const cid = classifyPrinciple(fen, uci);
    if (cid && out[cid]) out[cid].push({ fen, uci, san: m.san, li, k });
  }
});
console.error('bad lines', bad);
CONCEPTS.forEach(c => console.error(c.id, out[c.id].length));
fs.writeFileSync('libraw.json', JSON.stringify(out));
