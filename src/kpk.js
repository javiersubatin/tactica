// Exact KPK tablebase (White pawn). Squares: f + 8*r, r=0 is rank 1.
const fs = require('fs');
const F = s => s & 7, R = s => s >> 3;
const adj = (a, b) => Math.abs(F(a) - F(b)) <= 1 && Math.abs(R(a) - R(b)) <= 1 && a !== b;
const kmoves = s => { const o = []; for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) { if (!df && !dr) continue; const f = F(s) + df, r = R(s) + dr; if (f >= 0 && f < 8 && r >= 0 && r < 8) o.push(f + 8 * r); } return o; };
const pawnAtt = (p, t) => R(t) === R(p) + 1 && Math.abs(F(t) - F(p)) === 1;     // white pawn at p attacks t
const idx = (stm, wk, bk, p) => (((stm * 64 + wk) * 64 + bk) * 64 + p);
const win = new Uint8Array(2 * 64 * 64 * 64);
function legal(stm, wk, bk, p) {
  if (wk === bk || wk === p || bk === p || adj(wk, bk)) return false;
  if (R(p) < 1 || R(p) > 6) return false;
  if (stm === 0 && pawnAtt(p, bk)) return false;  // black in check, white to move: illegal
  return true;
}
function promoWins(wk, bk, p) { // promote to queen at p+8; black to move
  const q = p + 8;
  if (q === wk) return false;
  const protectedQ = adj(wk, q) || false;
  if (adj(bk, q) && !protectedQ) return false;
  // stalemate / mate irrelevant to "win" if queen safe: check black has a legal move or is mated
  const qAtt = (sq) => { // squares attacked by queen at q with blockers wk
    const df = F(sq) - F(q), dr = R(sq) - R(q);
    if (!(df === 0 || dr === 0 || Math.abs(df) === Math.abs(dr)) || (df === 0 && dr === 0)) return false;
    const sf = Math.sign(df), sr = Math.sign(dr);
    let f = F(q) + sf, r = R(q) + sr;
    while (!(f === F(sq) && r === R(sq))) { if (f + 8 * r === wk) return false; f += sf; r += sr; }
    return true;
  };
  const inCheck = qAtt(bk);
  let any = false;
  for (const t of kmoves(bk)) { if (t === wk || adj(t, wk)) continue; if (t === q) { if (!protectedQ) { any = true; } continue; } if (qAtt(t)) continue; any = true; }
  if (!any && !inCheck) return false; // stalemate
  return true;
}
function whiteMoves(wk, bk, p) { // returns [{kind,to,next:[wk,p],promo}] legal white moves
  const o = [];
  for (const t of kmoves(wk)) { if (t === p || adj(t, bk)) continue; o.push({ uci: t, from: wk, kind: 'k', wk: t, p }); }
  const one = p + 8;
  if (one !== wk && one !== bk) {
    if (R(one) === 7) o.push({ from: p, to: one, kind: 'promo', wk, p: one });
    else {
      o.push({ from: p, to: one, kind: 'p', wk, p: one });
      if (R(p) === 1) { const two = p + 16; if (two !== wk && two !== bk) o.push({ from: p, to: two, kind: 'p', wk, p: two }); }
    }
  }
  return o;
}
function blackMoves(wk, bk, p) {
  const o = [];
  for (const t of kmoves(bk)) { if (adj(t, wk) || pawnAtt(p, t)) continue; if (t === wk) continue; o.push({ to: t, cap: t === p }); }
  return o;
}
let changed = true, it = 0;
while (changed) {
  changed = false; it++;
  for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) for (let p = 8; p < 56; p++) {
    // white to move
    if (legal(0, wk, bk, p) && !win[idx(0, wk, bk, p)]) {
      let w = false;
      for (const m of whiteMoves(wk, bk, p)) {
        if (m.kind === 'promo') { if (promoWins(m.wk, bk, p)) { w = true; break; } }
        else if (win[idx(1, m.wk, bk, m.p)]) { w = true; break; }
      }
      if (w) { win[idx(0, wk, bk, p)] = 1; changed = true; }
    }
    // black to move
    if (legal(1, wk, bk, p) && !win[idx(1, wk, bk, p)]) {
      const bm = blackMoves(wk, bk, p);
      let w = bm.length > 0;
      for (const m of bm) { if (m.cap) { w = false; break; } if (!win[idx(0, wk, m.to, p)]) { w = false; break; } }
      if (w) { win[idx(1, wk, bk, p)] = 1; changed = true; }
    }
  }
}
console.error('iterations', it);
const sqn = s => 'abcdefgh'[F(s)] + (R(s) + 1);
const mirror = s => F(s) + 8 * (7 - R(s));
function fenOf(wk, bk, p, mir) {
  const b = Array.from({ length: 8 }, () => Array(8).fill(''));
  const put = (s, ch) => { const t = mir ? mirror(s) : s; b[7 - R(t)][F(t)] = ch; };
  put(wk, mir ? 'k' : 'K'); put(bk, mir ? 'K' : 'k'); put(p, mir ? 'p' : 'P');
  return b.map(r => { let s = '', n = 0; r.forEach(c => { if (!c) n++; else { if (n) s += n; n = 0; s += c; } }); return s + (n || ''); }).join('/') + ' ' + (mir ? 'b' : 'w') + ' - - 0 1';
}
const mv = (a, b, mir) => mir ? sqn(mirror(a)) + sqn(mirror(b)) : sqn(a) + sqn(b);
// puzzle generation
const cand = { kingact: [], promote: [] };
for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) for (let p = 16; p < 48; p++) {
  if (!legal(0, wk, bk, p) || !win[idx(0, wk, bk, p)]) continue;
  const ms = whiteMoves(wk, bk, p), good = [], bad = [];
  ms.forEach(m => {
    const ok = m.kind === 'promo' ? promoWins(m.wk, bk, p) : win[idx(1, m.wk, bk, m.p)];
    const u = { from: m.kind === 'k' ? wk : p, to: m.kind === 'k' ? m.wk : m.to, kind: m.kind };
    (ok ? good : bad).push(u);
  });
  if (!good.length || !bad.length) continue;
  const rel = R(p);
  if (good.every(g => g.kind === 'k') && bad.some(b => b.kind === 'p') && Math.abs(F(p) - 3.5) < 3.2) cand.kingact.push({ wk, bk, p, good, bad });
  if (good.every(g => g.kind === 'p') && bad.some(b => b.kind === 'k') && rel >= 3) cand.promote.push({ wk, bk, p, good, bad });
}
console.error('cand', cand.kingact.length, cand.promote.length);
// deterministic pseudo-random pick, spread over pawn file/rank
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
function pick(arr, n) {
  const buckets = {}; arr.forEach(c => { const k = F(c.p) + ':' + R(c.p); (buckets[k] = buckets[k] || []).push(c); });
  const keys = Object.keys(buckets), out = [];
  keys.forEach(k => buckets[k].sort(() => rnd() - 0.5));
  let r = 0; while (out.length < n && keys.some(k => buckets[k].length > r)) { keys.forEach(k => { if (out.length < n && buckets[k][r]) out.push(buckets[k][r]); }); r++; }
  return out;
}
const out = {};
for (const cid of ['kingact', 'promote']) {
  out[cid] = pick(cand[cid], 56).map((c, i) => {
    const mir = i % 2 === 1;
    return { fen: fenOf(c.wk, c.bk, c.p, mir), win: c.good.map(g => mv(g.from, g.to, mir)), lose: c.bad.map(g => mv(g.from, g.to, mir)), kind: cid === 'kingact' ? 'k' : 'p' };
  });
}
fs.writeFileSync('kpkraw.json', JSON.stringify(out));
console.error(out.kingact.length, out.promote.length, JSON.stringify(out.kingact[0]), JSON.stringify(out.promote[0]));
