// Builds ./www: the app with every CDN dependency replaced by a local file (works offline).
const fs = require('fs'), path = require('path');
const nm = (p) => path.join(__dirname, 'node_modules', p);
const out = path.join(__dirname, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'lib'), { recursive: true });
fs.mkdirSync(path.join(out, 'pieces'), { recursive: true });

const first = (...c) => { const f = c.find((x) => fs.existsSync(x)); if (!f) throw new Error('Missing file: ' + c[0]); return f; };
fs.copyFileSync(first(nm('chess.js/chess.min.js'), nm('chess.js/chess.js')), path.join(out, 'lib/chess.min.js'));
fs.copyFileSync(first(nm('stockfish.js/stockfish.js')), path.join(out, 'lib/stockfish.js'));
fs.cpSync(nm('@fortawesome/fontawesome-free/css'), path.join(out, 'lib/fa/css'), { recursive: true });
fs.cpSync(nm('@fortawesome/fontawesome-free/webfonts'), path.join(out, 'lib/fa/webfonts'), { recursive: true });
const pdir = path.join(__dirname, 'pieces');
if (!fs.existsSync(pdir) || fs.readdirSync(pdir).length < 12) throw new Error('Run ./setup.sh first (it downloads the piece images).');
fs.cpSync(pdir, path.join(out, 'pieces'), { recursive: true });

let h = fs.readFileSync(path.join(__dirname, 'Tactica.html'), 'utf8');
const rep = (re, to) => { if (!re.test(h)) throw new Error('Pattern not found: ' + re); h = h.replace(re, () => to); };
rep(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/chess\.js\/0\.10\.3\/chess\.min\.js/, 'lib/chess.min.js');
rep(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/6\.4\.0\/css\/all\.min\.css/, 'lib/fa/css/all.min.css');
rep(/const PIECE_CDN = [^\n]*\n/, "const PIECE_CDN = (k) => 'pieces/' + k + '.svg';\n");
rep(/const ENGINE_URLS = \[[\s\S]*?\];/, "const ENGINE_URLS = [new URL('lib/stockfish.js', location.href).href];");
if (/https:\/\/(cdn|cdnjs)\./.test(h)) throw new Error('A CDN link is still in the page');
fs.writeFileSync(path.join(out, 'index.html'), h);
console.log('www/ ready (' + Math.round(h.length / 1024) + ' KB page)');
