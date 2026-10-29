// Maps are built from a grid of tiles (16x16 pixels each).
//
// Tile letters:
//   ' ' darkness (blocked)   '#' wall           '.' wooden floor   'k' kitchen floor
//   'c' counter              't' table          'b' boy's chair    'h' Henry's armchair
//   's' sofa                 'v' TV             'r' rug            'd' back doorway
//   'g' lawn                 'p' dirt path      'C' corn           'T' trampled corn
//   'R' bare earth (the stone ring)             'w' shed wall      'K' old pickup truck
//   'P' porch boards         'X' trees / field edge (blocked)
//   'W' window (in a wall)   'D' front door     'B' back door      'L' attic ladder
//   'm' green carpet         'j' rose carpet    'e' bed            'a' cupboard / wardrobe
//   'Q' concrete             'G' generator      'n' dog kennel     'x' boxes
const TILE = 16;
const BLOCKED_TILES = new Set([' ', '#', 'c', 't', 'b', 'h', 's', 'v', 'X', 'w', 'K', 'W', 'e', 'a', 'G', 'n', 'x']);

function buildMap({ key, W, H, build, wet }) {
  const grid = [];
  for (let y = 0; y < H; y++) grid.push(new Array(W).fill(' '));
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = c; };
  const fill = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  let seed = 1234;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  // A cornfield: two-tile-wide rows of corn running north-south with a
  // one-tile path between each row.
  const cornfield = (x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const isPath = (x - x0) % 3 === 2;
        set(x, y, isPath ? 'p' : (rnd() < 0.04 ? 'T' : 'C'));
      }
    }
  };
  const extra = build({ set, fill, cornfield, W, H }) || {};

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
    return BLOCKED_TILES.has(c);
  }

  // Paints the whole map onto a canvas once, so the game draws it as one image.
  // Also paints a second "corn tops" canvas that is drawn over the player, so
  // he looks like he is inside the corn.
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
          case 'w': rect(g, x, y, TILE, TILE, '#5a4a3a'); rect(g, x, y + 3, TILE, 1, '#3e3328'); rect(g, x, y + 9, TILE, 1, '#3e3328'); break;
          case 'P': rect(g, x, y, TILE, TILE, '#6a5238'); rect(g, x, y + 7, TILE, 1, '#4e3c28'); rect(g, x, y + 15, TILE, 1, '#4e3c28'); break;
          case '.': case 'r': case 'h': case 's': case 'v':
            rect(g, x, y, TILE, TILE, '#6b4f35');
            rect(g, x, y + ((tx % 2) ? 5 : 11), TILE, 1, '#5a422c');
            if (c === 'r') rect(g, x, y, TILE, TILE, '#6d2f2f');
            if (c === 'h') { rect(g, x, y, TILE, TILE, '#6d2f2f'); rect(g, x + 1, y + 1, 14, 14, '#5c2a2a'); rect(g, x + 3, y + 4, 10, 9, '#7a3a3a'); }
            if (c === 's') { rect(g, x, y + 2, TILE, 13, '#3d4a5c'); rect(g, x, y + 2, TILE, 4, '#2c3644'); }
            if (c === 'v') { rect(g, x, y, TILE, 12, '#3a3632'); rect(g, x, y + 12, TILE, 4, '#5a422c'); }
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
          case 'K':
            rect(g, x, y, TILE, TILE, '#2f4a26');
            break;
          case 'p': case 'R':
            rect(g, x, y, TILE, TILE, c === 'R' ? '#544530' : '#4a3b26');
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
          case 'W': rect(g, x, y, TILE, TILE, '#4a4038'); rect(g, x + 2, y + 3, 12, 8, '#1c2430'); rect(g, x, y + 12, TILE, 4, '#2e2823'); break;
          case 'D': case 'B': rect(g, x, y, TILE, TILE, '#3a3530'); break;
          case 'L':
            rect(g, x, y, TILE, TILE, '#6b4f35');
            rect(g, x + 3, y, 2, TILE, '#a08060'); rect(g, x + 11, y, 2, TILE, '#a08060');
            for (let i = 1; i < 16; i += 4) rect(g, x + 3, y + i, 10, 1, '#a08060');
            break;
          case 'm': case 'j':
            rect(g, x, y, TILE, TILE, c === 'm' ? '#2f4a36' : '#7a4a52');
            if ((tx + ty) % 3 === 0) rect(g, x + 5, y + 6, 1, 1, c === 'm' ? '#3a5a42' : '#8a5a62');
            break;
          case 'e':
            rect(g, x, y, TILE, TILE, '#5a422c');
            rect(g, x + 1, y + 1, 14, 14, '#c8c0b0');
            rect(g, x + 1, y + 1, 14, 4, '#e8e0d0');
            break;
          case 'a': rect(g, x, y, TILE, TILE, '#5a3e26'); rect(g, x + 7, y + 1, 1, 14, '#3a2816'); rect(g, x + 5, y + 7, 1, 2, '#c8b060'); rect(g, x + 9, y + 7, 1, 2, '#c8b060'); break;
          case 'Q':
            rect(g, x, y, TILE, TILE, '#6e6c66');
            if ((tx * 7 + ty * 3) % 5 === 0) rect(g, x + 2, y + 5, 9, 1, '#55534e');
            break;
          case 'G': rect(g, x, y, TILE, TILE, '#6e6c66'); rect(g, x + 1, y + 3, 14, 11, '#3a5a3a'); rect(g, x + 3, y + 5, 4, 4, '#222'); break;
          case 'n': rect(g, x, y, TILE, TILE, '#2f4a26'); rect(g, x + 1, y + 2, 14, 13, '#7a5a3a'); rect(g, x + 5, y + 9, 6, 6, '#1a120a'); break;
          case 'x': rect(g, x, y, TILE, TILE, '#6e6c66'); rect(g, x + 1, y + 2, 13, 12, '#8a6a42'); rect(g, x + 1, y + 7, 13, 1, '#6a4a2a'); break;
          case 'X':
            rect(g, x, y, TILE, TILE, '#0b120b');
            rect(g, x + Math.floor(r() * 8), y + Math.floor(r() * 8), 8, 8, '#132013');
            break;
        }
        // After the rain: puddles on the lawn and the paths.
        if (wet && (c === 'g' || c === 'p') && r() < 0.035) {
          g.fillStyle = 'rgba(70,82,100,0.55)';
          g.beginPath();
          g.ellipse(x + 8, y + 8, 4 + r() * 5, 2 + r() * 3, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    if (extra.paintExtras) extra.paintExtras(g, rect);
    return { base, top };
  }

  return { key, TILE, W, H, grid, tileAt, tileAtPx, isBlockedPx, paint, ...extra };
}

// ---------- The prologue: the Jacobs farmhouse and its cornfield ----------
const MAP = buildMap({
  key: 'prologue', W: 44, H: 52, wet: true,
  build({ set, fill, cornfield, W, H }) {
    // House: kitchen on the left, lounge on the right.
    fill(10, 1, 33, 11, '#');
    fill(11, 2, 21, 10, 'k');
    fill(23, 2, 32, 10, '.');
    fill(22, 5, 22, 7, '.');         // doorway between the rooms
    fill(11, 2, 20, 2, 'c');         // kitchen counter along the top wall
    fill(14, 5, 17, 6, 't');         // kitchen table
    set(13, 5, 'b'); set(18, 5, 'b'); // the boys' chairs
    fill(26, 2, 28, 2, 'v');         // the TV
    fill(25, 5, 29, 7, 'r');         // rug
    set(27, 6, 'h');                 // Henry's armchair, facing the TV
    fill(24, 9, 27, 9, 's');         // sofa
    set(16, 11, 'd');                // back door

    // Lawn behind the house, trees down each side.
    fill(0, 12, W - 1, 19, 'g');
    fill(0, 12, 0, H - 1, 'X');
    fill(W - 1, 12, W - 1, H - 1, 'X');
    fill(0, 50, W - 1, H - 1, 'X');

    // Cornfield: 40 x 30 tiles.
    fill(1, 20, 1, 49, 'g');
    fill(42, 20, 42, 49, 'g');
    cornfield(2, 20, 41, 49);
    return {
      FIELD: { x0: 2, y0: 20, x1: 41, y1: 49 },
      paintExtras(g, rect) {
        // Snakes and ladders board on the table.
        rect(g, 15 * TILE + 2, 5 * TILE + 4, 20, 20, '#d8cfa0');
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) rect(g, 15 * TILE + 2 + i * 4, 5 * TILE + 4 + j * 4, 4, 4, '#b0a070');
        rect(g, 15 * TILE + 5, 5 * TILE + 8, 13, 2, '#3a7a3a');
      },
    };
  },
});

// ---------- Milestone 2 test night: the Cole farm's lawn and cornfield ----------
// The house and porch are on the left (west), the field on the right (east),
// with the stone ring at its centre.
const TEST_MAP = buildMap({
  key: 'test', W: 60, H: 36, wet: false,
  build({ set, fill, cornfield, W, H }) {
    fill(0, 0, W - 1, H - 1, 'g');
    fill(0, 0, W - 1, 0, 'X');
    fill(0, H - 1, W - 1, H - 1, 'X');
    fill(0, 0, 0, H - 1, 'X');
    fill(W - 1, 0, W - 1, H - 1, 'X');
    fill(1, 8, 2, 27, '#');      // back wall of the Cole house
    fill(3, 10, 4, 25, 'P');     // the porch
    fill(6, 3, 9, 6, 'w');       // the shed
    fill(13, 19, 14, 21, 'K');   // the old pickup truck (a hiding place)
    cornfield(16, 3, 55, 32);
    // The stone ring: a clearing at the centre of the field.
    const cx = 36, cy = 18;
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) {
      if (Math.hypot(x - cx, y - cy) <= 3.6) set(x, y, 'R');
    }
    return {
      FIELD: { x0: 16, y0: 3, x1: 55, y1: 32 },
      RING: { x: cx * TILE + 8, y: cy * TILE + 8 },
      paintExtras(g, rect) {
        // twelve carved stones, half buried
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2;
          const sx = cx * TILE + 8 + Math.cos(a) * 34, sy = cy * TILE + 8 + Math.sin(a) * 34;
          rect(g, Math.round(sx) - 3, Math.round(sy) - 2, 6, 5, '#7a7a74');
          rect(g, Math.round(sx) - 3, Math.round(sy) + 2, 6, 1, '#45453f');
        }
        // the pickup truck: rusted red, cab at the top
        rect(g, 13 * TILE + 2, 19 * TILE + 1, 28, 46, '#6a2a1e');
        rect(g, 13 * TILE + 4, 19 * TILE + 4, 24, 12, '#2a3036');
        rect(g, 13 * TILE + 4, 19 * TILE + 20, 24, 24, '#4e2016');
      },
    };
  },
});

// ---------- Milestone 4: the Cole farm ----------
// From the sketch in the design doc: the dirt road along the top, the house
// with its porch facing the field, the garage and shed below the house, the
// cornfield (40 x 30) with the stone ring at its centre. The attic is a room
// on its own at the bottom of the map, reached by the ladder in the hall.
const FARM_MAP = buildMap({
  key: 'farm', W: 78, H: 58, wet: false,
  build({ set, fill, cornfield, W, H }) {
    fill(0, 0, W - 1, H - 1, 'g');
    fill(0, 0, W - 1, 0, 'X');
    fill(0, 0, 0, H - 1, 'X');
    fill(W - 1, 0, W - 1, H - 1, 'X');
    fill(0, 38, W - 1, H - 1, 'X');
    fill(1, 1, W - 2, 2, 'p');          // the dirt road to Marrowfield
    fill(9, 3, 15, 6, 'Q');             // the cracked concrete driveway

    // The house.
    fill(3, 7, 25, 25, '#');
    fill(4, 8, 13, 14, '.');            // living room
    fill(15, 8, 24, 14, 'k');           // kitchen
    fill(14, 11, 14, 12, '.');          // living room <-> kitchen
    fill(4, 16, 24, 17, '.');           // hallway
    set(8, 15, '.'); set(19, 15, '.');  // into the hallway
    fill(4, 19, 9, 24, 'm');            // Michael's old room (dark green)
    fill(11, 19, 16, 24, 'j');          // Jenny's room
    fill(18, 19, 24, 24, '.');          // Pa's room
    set(7, 18, 'm'); set(14, 18, 'j'); set(21, 18, '.');
    set(9, 7, 'D');                     // front door
    set(25, 11, 'B');                   // back door, out onto the porch
    set(6, 7, 'W'); set(20, 7, 'W'); set(3, 21, 'W'); set(21, 25, 'W'); // windows
    set(5, 16, 'L');                    // ladder up to the attic
    // furniture
    fill(4, 10, 4, 11, 'v');            // the old TV on its wall unit
    fill(11, 10, 11, 12, 's');          // navy leather lounge suite
    fill(7, 13, 9, 13, 's');
    fill(12, 8, 13, 8, 'c');            // sideboard (Ma's photo)
    fill(15, 8, 17, 8, 'c'); fill(22, 8, 24, 8, 'c'); // kitchen counters
    fill(18, 11, 21, 12, 't');          // the kitchen table
    set(17, 11, 'b'); set(17, 12, 'b'); set(22, 11, 'b'); set(22, 12, 'b');
    fill(4, 20, 5, 21, 'e'); set(8, 19, 'c'); set(9, 24, 'a');   // Michael's bed, drawer, wardrobe
    fill(15, 20, 16, 21, 'e');                                    // Jenny's bed
    fill(23, 20, 24, 21, 'e'); set(18, 19, 'a');                  // Pa's bed and cupboard

    fill(26, 9, 27, 23, 'P');           // the porch, facing the field
    set(29, 24, 'n');                   // Spike's kennel

    // Garage (with the locked cupboard) and shed (with the generator).
    fill(3, 29, 11, 35, 'w');
    fill(4, 30, 10, 34, 'Q');
    fill(6, 29, 8, 29, 'Q');
    set(4, 30, 'a');
    set(8, 31, 'x'); set(9, 33, 'x'); set(5, 33, 'x'); set(10, 30, 'x');
    fill(14, 29, 19, 33, 'w');
    fill(15, 30, 18, 32, 'Q');
    set(16, 29, 'Q');
    set(17, 31, 'G');

    cornfield(33, 8, 72, 37);
    const cx = 52, cy = 22;
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) {
      if (Math.hypot(x - cx, y - cy) <= 3.6) set(x, y, 'R');
    }

    // The attic: a room on its own (no way to walk there; the ladder takes you).
    fill(1, 46, 20, 56, ' ');
    fill(3, 48, 16, 55, '#');
    fill(4, 49, 15, 54, '.');
    set(5, 52, 'L');
    set(14, 50, 'x'); set(13, 54, 'x'); set(9, 49, 'x');

    return {
      FIELD: { x0: 33, y0: 8, x1: 72, y1: 37 },
      RING: { x: cx * TILE + 8, y: cy * TILE + 8 },
      paintExtras(g, rect) {
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2;
          const sx = cx * TILE + 8 + Math.cos(a) * 34, sy = cy * TILE + 8 + Math.sin(a) * 34;
          rect(g, Math.round(sx) - 3, Math.round(sy) - 2, 6, 5, '#7a7a74');
          rect(g, Math.round(sx) - 3, Math.round(sy) + 2, 6, 1, '#45453f');
        }
        // Snakes and Ladders board on the kitchen table.
        rect(g, 19 * TILE + 6, 11 * TILE + 6, 20, 20, '#d8cfa0');
        for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) rect(g, 19 * TILE + 6 + i * 4, 11 * TILE + 6 + j * 4, 4, 4, '#b0a070');
        // Ma's photo on the sideboard.
        rect(g, 12 * TILE + 10, 8 * TILE + 3, 8, 10, '#c8b890');
        rect(g, 12 * TILE + 11, 8 * TILE + 4, 6, 7, '#6a6a7a');
        // the barrel in the attic
        g.fillStyle = '#5a4028'; g.beginPath(); g.arc(11 * TILE + 8, 52 * TILE + 8, 9, 0, Math.PI * 2); g.fill();
        rect(g, 11 * TILE + 1, 52 * TILE + 6, 14, 2, '#3a2a18');
      },
    };
  },
});
