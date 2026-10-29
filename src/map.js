// The prologue map, built from a grid of tiles (16x16 pixels each).
//
// Tile letters:
//   ' ' darkness (blocked)   '#' wall           '.' wooden floor   'k' kitchen floor
//   'c' counter              't' table          'b' boy's chair    'h' Henry's armchair
//   's' sofa                 'f' fireplace      'r' rug            'd' back doorway
//   'g' lawn                 'p' dirt path      'C' corn           'T' trampled corn
//   'X' trees / field edge (blocked)
const MAP = (() => {
  const TILE = 16;
  const W = 44;
  const H = 52;
  const grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill(' '));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = c; };
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };

  // House: kitchen on the left, lounge on the right.
  fill(10, 1, 33, 11, '#');
  fill(11, 2, 21, 10, 'k');
  fill(23, 2, 32, 10, '.');
  fill(22, 5, 22, 7, '.');         // doorway between the rooms
  fill(11, 2, 20, 2, 'c');         // kitchen counter along the top wall
  fill(14, 5, 17, 6, 't');         // kitchen table
  set(13, 5, 'b'); set(18, 5, 'b'); // the boys' chairs
  fill(26, 2, 28, 2, 'f');         // fireplace
  fill(25, 5, 29, 7, 'r');         // rug
  set(30, 4, 'h');                 // Henry's armchair
  fill(24, 9, 27, 9, 's');         // sofa
  set(16, 11, 'd');                // back door

  // Lawn behind the house, trees down each side.
  fill(0, 12, W - 1, 19, 'g');
  fill(0, 12, 0, H - 1, 'X');
  fill(W - 1, 12, W - 1, H - 1, 'X');
  fill(0, 50, W - 1, H - 1, 'X');

  // Cornfield: 40 x 30 tiles. Two-tile-wide rows of corn running north-south
  // with a one-tile path between each row.
  const FIELD = { x0: 2, y0: 20, x1: 41, y1: 49 };
  fill(1, 20, 1, 49, 'g');
  fill(42, 20, 42, 49, 'g');
  let seed = 1234;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let y = FIELD.y0; y <= FIELD.y1; y++) {
    for (let x = FIELD.x0; x <= FIELD.x1; x++) {
      const isPath = (x - FIELD.x0) % 3 === 2;
      set(x, y, isPath ? 'p' : (rnd() < 0.04 ? 'T' : 'C'));
    }
  }

  const BLOCKED = new Set([' ', '#', 'c', 't', 'b', 'h', 's', 'f', 'X']);

  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return ' ';
    return grid[ty][tx];
  }
  function tileAtPx(px, py) {
    return tileAt(Math.floor(px / TILE), Math.floor(py / TILE));
  }
  function isBlockedPx(px, py, doorOpen) {
    const c = tileAtPx(px, py);
    if (c === 'd') return !doorOpen;
    return BLOCKED.has(c);
  }

  // Paints the whole map onto a canvas once, so the game draws it as one image.
  // Also paints a second "corn tops" canvas that is drawn over Henry, so he
  // looks like he is inside the corn.
  function paint() {
    const base = document.createElement('canvas');
    base.width = W * TILE; base.height = H * TILE;
    const top = document.createElement('canvas');
    top.width = W * TILE; top.height = H * TILE;
    const g = base.getContext('2d');
    const o = top.getContext('2d');
    let s = 99;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const rect = (ctx, x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };

    for (let ty = 0; ty < H; ty++) {
      for (let tx = 0; tx < W; tx++) {
        const c = grid[ty][tx];
        const x = tx * TILE, y = ty * TILE;
        switch (c) {
          case ' ': rect(g, x, y, TILE, TILE, '#050608'); break;
          case '#': rect(g, x, y, TILE, TILE, '#4a4038'); rect(g, x, y + 12, TILE, 4, '#2e2823'); break;
          case '.': case 'r': case 'h': case 's': case 'f':
            rect(g, x, y, TILE, TILE, '#6b4f35');
            rect(g, x, y + ((tx % 2) ? 5 : 11), TILE, 1, '#5a422c');
            if (c === 'r') rect(g, x, y, TILE, TILE, '#6d2f2f');
            if (c === 'h') { rect(g, x + 1, y + 1, 14, 14, '#5c2a2a'); rect(g, x + 3, y + 4, 10, 9, '#7a3a3a'); }
            if (c === 's') { rect(g, x, y + 2, TILE, 13, '#3d4a5c'); rect(g, x, y + 2, TILE, 4, '#2c3644'); }
            if (c === 'f') { rect(g, x, y, TILE, TILE, '#2a2222'); rect(g, x + 2, y + 8, 12, 6, '#8a3a12'); rect(g, x + 5, y + 10, 6, 3, '#d9822b'); }
            break;
          case 'k': case 'b': case 'c': case 't': case 'd':
            rect(g, x, y, TILE, TILE, ((tx + ty) % 2) ? '#8a8a80' : '#77776f');
            if (c === 'c') { rect(g, x, y, TILE, TILE, '#9c9488'); rect(g, x, y + 13, TILE, 3, '#6f685e'); }
            if (c === 't') rect(g, x, y, TILE, TILE, '#7a5230');
            if (c === 'b') { rect(g, x + 3, y + 3, 10, 10, '#5a3a20'); }
            if (c === 'd') rect(g, x, y, TILE, TILE, '#3a3530');
            break;
          case 'g':
            rect(g, x, y, TILE, TILE, '#2f4a26');
            for (let i = 0; i < 4; i++) rect(g, x + Math.floor(r() * 15), y + Math.floor(r() * 15), 1, 2, '#3d5c31');
            break;
          case 'p':
            rect(g, x, y, TILE, TILE, '#4a3b26');
            for (let i = 0; i < 3; i++) rect(g, x + Math.floor(r() * 15), y + Math.floor(r() * 15), 2, 1, '#3b2f1e');
            break;
          case 'T':
            rect(g, x, y, TILE, TILE, '#4d4128');
            for (let i = 0; i < 3; i++) rect(g, x + Math.floor(r() * 10), y + Math.floor(r() * 14), 6, 1, '#7a7a33');
            break;
          case 'C':
            rect(g, x, y, TILE, TILE, '#33331a');
            for (let i = 0; i < 3; i++) {
              const sx = x + 2 + i * 5 + Math.floor(r() * 2);
              rect(g, sx, y, 1, TILE, '#6b6b2a');
              // leaves drawn on the top layer
              o.fillStyle = r() < 0.5 ? 'rgba(122,138,53,0.9)' : 'rgba(95,110,40,0.9)';
              o.fillRect(sx - 3, y + Math.floor(r() * 12), 4, 2);
              o.fillRect(sx + 1, y + Math.floor(r() * 12), 4, 2);
              o.fillStyle = 'rgba(80,92,34,0.85)';
              o.fillRect(sx - 1, y + Math.floor(r() * 10), 3, 5);
            }
            break;
          case 'X':
            rect(g, x, y, TILE, TILE, '#0b120b');
            rect(g, x + Math.floor(r() * 8), y + Math.floor(r() * 8), 8, 8, '#132013');
            break;
        }
      }
    }
    // Snakes and ladders board on the table.
    rect(g, 15 * TILE + 2, 5 * TILE + 4, 20, 20, '#d8cfa0');
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) rect(g, 15 * TILE + 2 + i * 4, 5 * TILE + 4 + j * 4, 4, 4, '#b0a070');
    rect(g, 15 * TILE + 5, 5 * TILE + 8, 13, 2, '#3a7a3a');
    return { base, top };
  }

  return { TILE, W, H, FIELD, grid, tileAt, tileAtPx, isBlockedPx, paint };
})();
