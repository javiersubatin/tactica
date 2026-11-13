global.Chess = require('./minichess.js').Chess || (require('./minichess.js'), global.Chess);
const fs = require('fs'); const { CONCEPTS } = require('./principles.js');
const raw = JSON.parse(fs.readFileSync('libraw.json')), kpk = JSON.parse(fs.readFileSync('kpkraw.json'));
let seed = 777; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const N = 60, lib = {};
for (const c of CONCEPTS) {
  if (kpk[c.id]) {
    lib[c.id] = kpk[c.id].slice(0, N).map(p => { const ch = new Chess(p.fen); const ok = p.win.every(u => ch.moves({ verbose: true }).some(m => m.from + m.to + (m.promotion || '') === u)); if (!ok) throw new Error('bad kpk ' + p.fen); return [p.fen, p.win[0], p.win.join(',')]; });
    continue;
  }
  const byLine = {}; raw[c.id].forEach(x => (byLine[x.li] = byLine[x.li] || []).push(x));
  const lists = Object.keys(byLine).map(k => byLine[k].sort(() => rnd() - 0.5));
  lists.sort(() => rnd() - 0.5);
  const out = []; let r = 0;
  while (out.length < N && lists.some(l => l.length > r)) { lists.forEach(l => { if (out.length < N && l[r]) out.push(l[r]); }); r++; }
  lib[c.id] = out.map(x => [x.fen, x.uci]);
}
Object.keys(lib).forEach(k => console.error(k, lib[k].length));
fs.writeFileSync('lib.json', JSON.stringify(lib));
console.error('bytes', fs.statSync('lib.json').size);
