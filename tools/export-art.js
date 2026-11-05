// Writes the grey-box placeholders into assets/ as PNGs (so David can open
// them in Piskel and see each picture's exact size), assets/palette.png, and
// assets/ART-LIST.md. All of it comes from the slot list in src/art.js.
//
// It never overwrites a PNG that's already there (it might be David's
// drawing), unless you pass --force.
// Usage: node tools/export-art.js [--force]   (needs Playwright)
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const force = process.argv.includes('--force');

// A tiny web server for the game folder (the page must not be file://).
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png' };
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    res.end(data);
  });
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(`http://localhost:${server.address().port}/index.html`);
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.waitForFunction(() => typeof Art !== 'undefined' && Art.ready);
  const out = await p.evaluate(() => {
    const files = ART_SLOTS.map(s => ({ id: s.id, data: Art.placeholder(s.id).toDataURL('image/png') }));
    // the palette: one 16x16 square of each colour, 8 to a row
    const cv = document.createElement('canvas');
    const n = ART_PALETTE.length, cols = 8;
    cv.width = cols * 16; cv.height = Math.ceil(n / cols) * 16;
    const ctx = cv.getContext('2d');
    ART_PALETTE.forEach(([col], i) => { ctx.fillStyle = col; ctx.fillRect((i % cols) * 16, Math.floor(i / cols) * 16, 16, 16); });
    const slots = ART_SLOTS.map(({ id, w, h, what, where, strip, group, under, layer }) => ({ id, w, h, what, where, strip, group, under, layer }));
    return { files, palette: cv.toDataURL('image/png'), slots, colours: ART_PALETTE };
  });
  await b.close();
  server.close();

  let wrote = 0, kept = 0;
  for (const f of out.files) {
    const file = path.join(ROOT, 'assets', f.id + '.png');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file) && !force) { kept++; continue; }
    fs.writeFileSync(file, Buffer.from(f.data.split(',')[1], 'base64'));
    wrote++;
  }
  fs.writeFileSync(path.join(ROOT, 'assets', 'palette.png'), Buffer.from(out.palette.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(ROOT, 'assets', 'ART-LIST.md'), artList(out.slots, out.colours));
  console.log(`placeholders written: ${wrote}, already there (kept): ${kept}, slots: ${out.slots.length}`);
})();

function artList(slots, colours) {
  const L = [];
  L.push('# The art list', '');
  L.push('Every picture in the game, in the order to draw them: what\'s on screen most comes first.');
  L.push('Each file in `assets/` starts as my grey-box placeholder, at the exact size the game needs. Open it in Piskel, draw over it, and export a PNG with the **same name** into the **same folder**.', '');
  L.push('**How the game uses them:** while a file is still exactly my placeholder, the game keeps drawing that thing in code. The moment it\'s different (your drawing), the game uses the picture. If a file is missing or broken, it goes back to the code, so the game always works.', '');
  L.push('## Rules for every picture', '');
  L.push('- **Keep the size exactly** (it\'s in the table). A picture of the wrong size gets stretched to fit, and will look blurry or squashed.');
  L.push('- **Tiles are 16 x 16** and fill the whole square, unless the table says "see-through".');
  L.push('- **Furniture tiles** (a chair, a bed, the TV...) are drawn over the floor: any see-through pixels show the floor tile underneath, so you can leave the background see-through or paint the floor in, as you like.');
  L.push('- **People are a 64 x 16 strip of four 16 x 16 frames, left to right: facing down (towards you), up (away), left, right.** See-through background. Keep their feet at the bottom and their heads at the top. Walking animation can come later.');
  L.push('- **Put everyone\'s eyes in the same place** as the placeholders. The easiest way is to draw over the placeholder and keep its eye pixels where they are. (Counting pixels from 0 at the top-left of each frame, the eyes are at x 6 and 9, y 4 facing down; x 5 facing left; x 10 facing right.) The red eyes in `people/red-eyes.png` are laid over people in exactly those spots.');
  L.push('- **Objects** (`objects/`) have see-through backgrounds and are drawn centred on their spot.');
  L.push('- **Cars are drawn facing right** (bonnet on the right). The game turns them.');
  L.push('- **Use the palette** (`assets/palette.png`, and the colours below). Night darkens everything a lot, so keep strong light-dark contrast inside each picture.');
  L.push('- **File names are lowercase**, with a hyphen between words (`corn-tops.png`). The name must match exactly, or the game won\'t find it.', '');
  L.push('## The pictures, in drawing order', '');
  L.push('| # | File | Size (pixels) | What it is | Where it appears |', '|---|---|---|---|---|');
  slots.forEach((s, i) => {
    const size = s.strip ? `${s.w} x ${s.h} (4 frames)` : `${s.w} x ${s.h}`;
    L.push(`| ${i + 1} | \`${s.id}.png\` | ${size} | ${s.what.replace(/\|/g, '/')} | ${s.where.replace(/\|/g, '/')} |`);
  });
  L.push('', '## Things that need more than one picture', '');
  L.push('- **Corn** is two pictures. `tiles/corn.png` is the ground and stalks, drawn under everyone. `tiles/corn-tops.png` is leaves only (the rest see-through), drawn over everyone, so people look as if they\'re inside the corn. Keep the leaves sparse enough to see Michael through them.');
  L.push('- **The creature** is two pictures: `objects/creature.png` (its black body) and `objects/creature-eyes.png` (the red eyes). The eyes are separate because they shine through the darkness when its body can\'t be seen.');
  L.push('- **Windows** are the tile `tiles/window.png` plus three overlays laid on top when needed: `objects/window-curtains.png` (locked), `objects/window-boards.png` (boarded up) and `objects/window-broken.png` (smashed). Doors are the doorway tiles plus `objects/door-closed.png` (locked) and `objects/door-open.png` (the door swung open).');
  L.push('- **People the creature wears** (faces at the windows, the finale) are the person\'s own strip with `people/red-eyes.png` laid over it.');
  L.push('- **Jason holding his own head** (Night 3) is `people/jason-headless.png`, a single 16 x 16 frame facing down.');
  L.push('- **The oil lamp** is `objects/oil-lamp.png` for the base and glass; the game draws the flame, which dims as the oil runs out.', '');
  L.push('## Still drawn in code (not slots yet)', '');
  L.push('Effects that move or change colour: the lantern Michael carries, the flickering TV screen, the police lights, fire, holy water splashes, noise rings, puddles, the house light in the endless field, the kill (the hand and the heart), and the on-screen controls and notebook.', '');
  L.push('## The palette', '');
  L.push('`assets/palette.png` has one square of each colour, 8 to a row, in this order. In Piskel: open the palette panel and import the PNG, or type the codes in.', '');
  L.push('| # | Colour | Use it for |', '|---|---|---|');
  colours.forEach(([hex, name], i) => L.push(`| ${i + 1} | \`${hex}\` | ${name} |`));
  L.push('');
  return L.join('\n');
}
