const fs=require('fs');
let t=fs.readFileSync('app.template.html','utf8');
const bench=JSON.parse(fs.readFileSync('bench.json','utf8')).map(p=>({id:p.id,fen:p.fen,moves:p.moves,turn:p.turn,theme:p.theme,guidance:p.guidance,evalBest:p.evalBest}));
t=t.replace('/*__PRINCIPLES__*/',fs.readFileSync('principles.js','utf8')).replace('/*__LIB__*/{}',fs.readFileSync('lib.json','utf8')).replace('/*__BENCH__*/[]',JSON.stringify(bench)).replace('/*__FALLBACK__*/{}',fs.readFileSync('fallback_svg.json','utf8'));
fs.writeFileSync('Chess.com-Tactical-Trainer.html',t);
const m=t.match(/<script>([\s\S]*)<\/script>\s*<\/body>/)[1];
fs.writeFileSync('/tmp/app_script.js',m);
console.log('built',t.length);
