/* Shared by the app and the library generator. Needs the global `Chess`. */
const CONCEPTS = [
  { id: 'develop', name: 'Development', icon: '♞', tip: 'Bring your minor pieces into play before attacking or moving the same piece twice. Knights usually come out before bishops, towards the centre.' },
  { id: 'center', name: 'Centre control', icon: '◎', tip: 'Occupy or influence e4, d4, e5 and d5 with pawns and pieces. A strong centre gives your pieces room and cramps the opponent.' },
  { id: 'king', name: 'King safety', icon: '♚', tip: 'Castle early and keep the pawns in front of your king. A king in the middle of an open board is the first thing the opponent attacks.' },
  { id: 'improve', name: 'Piece improvement', icon: '↗', tip: 'When nothing is forcing, improve your worst-placed piece: reroute a knight to a strong square, give a bishop an open diagonal, connect your pieces.' },
  { id: 'pawns', name: 'Pawn play', icon: '♟', tip: 'Pawn moves are permanent. Use pawn breaks to challenge the centre, gain space or open lines for your pieces, and avoid weakening your own structure.' },
  { id: 'rook', name: 'Rook activity', icon: '♜', tip: 'Rooks belong on open and half-open files and on the central files. Put them opposite the enemy king or behind passed pawns.' },
  { id: 'exchange', name: 'Piece exchanges', icon: '⇄', tip: 'Trade the pieces that matter: your bad piece for their good one, or a defender of the king. An exchange that damages the pawn structure or removes a key defender helps your plan.' },
  { id: 'kingact', name: 'King activity (endgame)', icon: '♔', tip: 'In the endgame the king is a strong piece. Use opposition and walk it towards the pawns. A hasty pawn push can throw the win away.' },
  { id: 'promote', name: 'Passed pawns', icon: '⇈', tip: 'Push a passed pawn when the opposing king cannot catch it, and count the race. Without the king as support, a pawn on the edge can be stopped.' }
];
function classifyPrinciple(fenBefore, uci) {
  let c, m;
  try { c = new Chess(fenBefore); m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined }); } catch (e) { return null; }
  if (!m) return null;
  const parts = fenBefore.split(' '), turn = parts[1], full = parseInt(parts[5] || '1', 10), ply = (full - 1) * 2 + (turn === 'b' ? 1 : 0);
  const home = turn === 'w' ? ['b1', 'g1', 'c1', 'f1'] : ['b8', 'g8', 'c8', 'f8'];
  const cap = !!m.captured;
  if (m.flags && /[kq]/.test(m.flags)) return 'king';
  if (m.piece === 'k') return 'king';
  if (m.piece === 'p') {
    if (m.promotion) return 'promote';
    if (cap && m.captured !== 'p') return 'exchange';
    if (ply <= 11 && (['d4', 'e4', 'd5', 'e5'].indexOf(m.to) > -1 || (cap && 'de'.indexOf(m.to[0]) > -1))) return 'center';
    return 'pawns';
  }
  if (cap && m.captured !== 'p') return 'exchange';
  if ((m.piece === 'n' || m.piece === 'b') && home.indexOf(m.from) > -1 && !cap) return 'develop';
  if (m.piece === 'r' && !cap) return 'rook';
  if (cap) return null;
  return 'improve';
}
if (typeof module !== 'undefined') module.exports = { CONCEPTS, classifyPrinciple };
