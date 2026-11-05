// Art slots: pictures in assets/ that replace the grey-box drawings.
//
// Every map tile, person and object drawn in code has a slot here, with the
// name of its PNG file. When the game starts it loads every PNG it can find.
// A slot uses its picture only when it's a real drawing: while the file is
// still exactly the grey-box placeholder that tools/export-art.js wrote, the
// game keeps drawing it in code (which varies a little from tile to tile).
// A missing or broken file also falls back to the code. So the game always works.
//
// Slots are listed in the order David should draw them (most on screen first);
// tools/export-art.js writes assets/ART-LIST.md from this list.

const ART_SIZE = { tile: [16, 16], person: [64, 16] };
const ART_DIRS = ['down', 'up', 'left', 'right']; // the four frames of a person's strip

// ---------- drawing the grey-box placeholders (pixels only, no smoothing) ----------
const artHex = n => typeof n === 'number' ? '#' + n.toString(16).padStart(6, '0') : n;
function artRect(ctx, x, y, w, h, col) { ctx.fillStyle = artHex(col); ctx.fillRect(x, y, w, h); }
function artEllipse(ctx, cx, cy, rx, ry, col) {
  ctx.fillStyle = artHex(col);
  for (let y = Math.floor(cy - ry); y < cy + ry; y++) for (let x = Math.floor(cx - rx); x < cx + rx; x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    if (dx * dx + dy * dy <= 1) ctx.fillRect(x, y, 1, 1);
  }
}

// A person, 16x16, facing dir. small: a child (the Jacobs boys).
function artPerson(ctx, ox, look, dir, small) {
  const R = (x, y, w, h, c) => artRect(ctx, ox + x, y + (small ? 2 : 0), w, h, c);
  const legs = 0x2a2620, eye = 0x1a1410;
  const bodyH = small ? 5 : 7;
  R(3, 7, 10, bodyH, look.body);                       // body
  R(3, 7 + bodyH - 1, 1, 1, look.head); R(12, 7 + bodyH - 1, 1, 1, look.head); // hands
  R(5, 7 + bodyH, 2, small ? 2 : 2, legs); R(9, 7 + bodyH, 2, 2, legs);       // legs
  const hx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  R(5 + hx, 1, 6, 6, look.head);                       // head
  R(5 + hx, 0, 6, 2, look.hair);                       // hair
  if (dir === 'down') { R(6, 4, 1, 1, eye); R(9, 4, 1, 1, eye); }
  if (dir === 'up') R(5, 0, 6, 6, look.hair);
  if (dir === 'left') { R(8, 2, 2, 4, look.hair); R(5, 4, 1, 1, eye); }
  if (dir === 'right') { R(6, 2, 2, 4, look.hair); R(10, 4, 1, 1, eye); }
}
// Where the eyes are in each frame (the red-eyes overlay uses the same spots).
const ART_EYES = { down: [[6, 4], [9, 4]], up: [], left: [[5, 4]], right: [[10, 4]] };

// Spike, 16x16, facing dir.
function artDog(ctx, ox, col, dir) {
  const dark = 0x3a2a18;
  if (dir === 'left' || dir === 'right') {
    const m = dir === 'left';
    const R = (x, y, w, h, c) => artRect(ctx, ox + (m ? 16 - x - w : x), y, w, h, c);
    R(2, 8, 10, 5, col); R(11, 5, 5, 5, col);   // body, head
    R(0, 8, 2, 1, col);                          // tail
    R(3, 13, 2, 2, col); R(9, 13, 2, 2, col);   // legs
    R(12, 5, 1, 2, dark); R(14, 6, 1, 1, dark); R(15, 8, 1, 1, dark); // ear, eye, nose
  } else {
    const down = dir === 'down';
    const R = (x, y, w, h, c) => artRect(ctx, ox + x, down ? y : 16 - y - h, w, h, c);
    R(5, 2, 6, 9, col); R(5, 10, 6, 5, col); R(7, 0, 2, 2, col); // body, head, tail
    R(4, 4, 1, 2, col); R(11, 4, 1, 2, col); R(4, 9, 1, 2, col); R(11, 9, 1, 2, col); // legs
    if (down) { R(6, 12, 1, 1, dark); R(9, 12, 1, 1, dark); R(7, 14, 2, 1, dark); }
  }
}

function artCar(kind) {
  return ctx => {
    if (kind === 'truck') { artRect(ctx, 0, 1, 32, 14, 0x7a2a1e); artRect(ctx, 17, 2, 10, 12, 0x2a3036); artRect(ctx, 1, 3, 14, 10, 0x5a2016); }
    else if (kind === 'beetle') { artEllipse(ctx, 16, 8, 13, 7.5, 0xe8e8e0); artEllipse(ctx, 17, 8, 6, 5.5, 0x9ab0c0); }
    else { artRect(ctx, 2, 2, 28, 12, kind === 'police' ? 0xe8e8f0 : 0xb02020); artRect(ctx, 12, 3, 12, 10, 0x2a3440); }
  };
}

// A map tile exactly as the code draws it (at the top-left of the map).
function artTileRef(c, layer) {
  return ctx => {
    let s = 99;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const scratch = document.createElement('canvas').getContext('2d');
    if (layer === 'top') paintTile(scratch, ctx, c, 0, 0, 0, 0, r);
    else paintTile(ctx, scratch, c, 0, 0, 0, 0, r);
  };
}

const CREATURE_COL = 0x0a0806;
function artCreature(ctx) {
  const k = CREATURE_COL;
  artRect(ctx, 5, 14, 14, 22, k);                         // body
  artRect(ctx, 6, 34, 4, 6, k); artRect(ctx, 14, 34, 4, 6, k); // legs
  artEllipse(ctx, 12, 11, 6, 6, k);                       // head
  artRect(ctx, 1, 16, 4, 14, k); artRect(ctx, 19, 16, 4, 14, k); // long arms
  for (const m of [false, true]) {                        // horns, curling up
    const R = (x, y, w, h) => artRect(ctx, m ? 24 - x - w : x, y, w, h, k);
    R(3, 0, 1, 2); R(4, 2, 1, 2); R(5, 4, 2, 2); R(6, 6, 3, 3);
  }
}

// ---------- the slots ----------
// id: the file (assets/<id>.png). w, h: its size. what / where: for ART-LIST.md.
// strip: a person's 64x16 strip of four frames. ph: draws the placeholder.
// group: the heading it's listed under.
const ART_SLOTS = [];
const slot = (id, w, h, what, where, ph, extra = {}) => ART_SLOTS.push({ id, w, h, what, where, ph, ...extra });
const tile = (id, c, what, where, extra = {}) => slot('tiles/' + id, 16, 16, what, where, artTileRef(c, extra.layer), { tile: c, ...extra });
const person = (id, look, what, where, extra = {}) => slot('people/' + id, 64, 16, what, where, ctx => {
  ART_DIRS.forEach((d, i) => look.dog ? artDog(ctx, i * 16, look.body, d) : artPerson(ctx, i * 16, look, d, extra.small));
}, { strip: true, ...extra });

const ART_LOOKS = {
  michael: { body: 0xe8e8e0, head: 0xc89a78, hair: 0x2a1a10 },
  henry:   { body: 0x8a7a62, head: 0xd9b99b, hair: 0x5a4a3a },
  jenny:   { body: 0xb03030, head: 0xe8c8a8, hair: 0xe8d070 },
  pa:      { body: 0x4a6aa0, head: 0xd8b898, hair: 0xc8c8c8 },
  jason:   { body: 0x3a8a8a, head: 0xe0c0a0, hair: 0xc06a30 },
  jean:    { body: 0xd0d0e0, head: 0xe8d0c0, hair: 0x5a3a20 },
  spike:   { dog: true, body: 0xc8a060 },
  venn:    { body: 0x3a3a46, head: 0xd8b898, hair: 0x2a2018 },
  ruth:    { body: 0x262626, head: 0xd8c0a8, hair: 0xd8d8d8 },
  ma:      { body: 0x5a5a8a, head: 0xe0c8b0, hair: 0x4a3020 },
  justin:  { body: 0x3a5ea8, head: 0xe0c0a0, hair: 0x6a4a2a },
  phillip: { body: 0x4a8a4a, head: 0xe0c0a0, hair: 0x4a3420 },
};

// 1. What's on screen most: the field.
tile('corn', 'C', 'Corn: the ground between the stalks, and the stalks (seen from above). Opaque.', 'Every cornfield, every night. Most of the game.', { group: 'The cornfield' });
tile('corn-tops', 'C', 'The corn leaves drawn OVER people, so they look as if they\'re inside the corn. Draw leaves only and leave the rest see-through (Piskel\'s eraser). Keep the gaps: too many leaves and you can\'t see Michael.', 'On top of every corn tile.', { layer: 'top', group: 'The cornfield' });
tile('path', 'p', 'Dirt path (the one-tile paths between the rows of corn, and the dirt road).', 'Between every row of corn; the road to Marrowfield.', { group: 'The cornfield' });
tile('trampled-corn', 'T', 'Corn that\'s been trampled flat.', 'Scattered through the cornfields.', { group: 'The cornfield' });
tile('bare-earth', 'R', 'Bare earth in the clearing at the centre of the field.', 'The stone ring.', { group: 'The cornfield' });
slot('objects/ring-stone', 8, 8, 'One of the twelve carved stones, half buried. Leave the background see-through.', 'Round the stone ring in the clearing (12 of them).', ctx => { artRect(ctx, 1, 2, 6, 5, 0x7a7a74); artRect(ctx, 1, 6, 6, 1, 0x45453f); }, { group: 'The cornfield' });
slot('objects/stone-hole', 8, 8, 'A raw hole in the earth where a stone was torn out. See-through background.', 'The stone ring, after Night 5.', ctx => artRect(ctx, 0, 1, 8, 7, 0x2a1e10), { group: 'The cornfield' });

// 2. Michael, and the thing in the field.
person('michael', ART_LOOKS.michael, 'Michael Cole: white t-shirt, dark hair. Four frames: facing down, up, left, right. See-through background. Don\'t draw the lantern: the game adds it (it glows and dims).', 'You play him in almost every chapter.', { group: 'People' });
slot('objects/creature', 24, 40, 'The thing in the field: a tall black silhouette with curling horns and long arms (bigger than a person). Its feet at the bottom edge. See-through background. No eyes: they are the next file.', 'Every night it hunts, the siege, the finale.', artCreature, { group: 'People' });
slot('objects/creature-eyes', 8, 2, 'Its two slanted red eyes. They shine through the darkness, so they\'re drawn separately. See-through background.', 'Over the creature\'s head.', ctx => { artRect(ctx, 0, 1, 3, 1, 0xff2a1a); artRect(ctx, 5, 1, 3, 1, 0xff2a1a); artRect(ctx, 0, 0, 1, 1, 0xff2a1a); artRect(ctx, 7, 0, 1, 1, 0xff2a1a); }, { group: 'People' });

// 3. The farm outside.
tile('lawn', 'g', 'Grass (the lawn and yard).', 'The Cole farm, the Jacobs farm, the test night, the cemetery.', { group: 'The farm' });
tile('dead-grass', null, 'Withered grass: the line it can\'t cross. Drawn on top of the lawn, so draw only the dead blades and leave the rest see-through.', 'A line across the yard on Nights 4-6 and the test night.', { ph: ctx => { for (let i = 0; i < 6; i++) artRect(ctx, 2 + ((i * 5) % 12), (i * 7) % 16, 2, 3, i % 2 ? 0x6b5a2a : 0x8a7a40); }, group: 'The farm' });
tile('porch', 'P', 'Porch boards.', 'The Cole porch facing the field; the Jacobs porch.', { group: 'The farm' });
tile('wall', '#', 'House wall (seen from above: the top of the wall, with its shadow at the bottom).', 'Every building.', { group: 'The farm' });
tile('window', 'W', 'A window in the wall, glass dark at night.', 'The house windows; the mirror in the interview room.', { group: 'The farm' });
tile('front-door', 'D', 'The front doorway, open, with its door frame (the door runs across the top).', 'The Cole front door.', { group: 'The farm' });
tile('back-door', 'B', 'The back doorway, open, with its frame (sideways: the door runs down the right-hand side).', 'The Cole back door, onto the porch.', { group: 'The farm' });
tile('concrete', 'Q', 'Cracked concrete.', 'The driveway, the garage and shed floors, the police station.', { group: 'The farm' });
tile('shed-wall', 'w', 'Wooden plank wall.', 'The shed and the garage.', { group: 'The farm' });
tile('trees', 'X', 'Trees: the dark edge of the world.', 'Round the edge of every map.', { group: 'The farm' });
tile('kennel', 'n', 'Spike\'s kennel, on grass.', 'Beside the Cole porch.', { group: 'The farm' });
tile('generator', 'G', 'The generator, on concrete.', 'The shed.', { group: 'The farm' });
tile('boxes', 'x', 'Cardboard boxes, on concrete.', 'The garage and the attic.', { group: 'The farm' });

// 4. The rest of the family, and Spike.
person('jenny', ART_LOOKS.jenny, 'Jenny: red skirt, blonde hair.', 'Days 1-3, Night 3, the Interlude (you play her).', { group: 'People' });
person('pa', ART_LOOKS.pa, 'Pa (Walter Cole): blue checked shirt, grey hair.', 'Every day chapter until Night 6.', { group: 'People' });
person('jason', ART_LOOKS.jason, 'Jason: copper curls.', 'Day 1, Day 2, Night 2 (you play him), Night 3.', { group: 'People' });
person('jean', ART_LOOKS.jean, 'Jean: thick brown hair, a pale top.', 'Day 1 to the finale.', { group: 'People' });
person('spike', ART_LOOKS.spike, 'Spike, the old Labrador. Same four frames (down, up, left, right).', 'Days 1-2.', { group: 'People' });
slot('people/red-eyes', 64, 16, 'Red eyes, laid over a person when it\'s wearing them. Only the red eye pixels; everything else see-through. Put them where you drew the eyes on the people (the same spot on everyone). The "up" frame has none.', 'Faces at the windows (Night 6); the dead it wears in the finale.', ctx => ART_DIRS.forEach((d, i) => ART_EYES[d].forEach(([x, y]) => artRect(ctx, i * 16 + x, y, 1, 1, 0xff2010))), { strip: true, group: 'People' });

// 5. Inside the Cole house.
tile('floor', '.', 'Wooden floorboards.', 'The living room, hall, Pa\'s room, the attic, the Jacobs lounge.', { group: 'Inside' });
tile('kitchen-floor', 'k', 'Kitchen floor tiles (lino).', 'The Cole and Jacobs kitchens.', { group: 'Inside' });
tile('green-carpet', 'm', 'Dark green carpet.', 'Michael\'s old room.', { group: 'Inside' });
tile('rose-carpet', 'j', 'Rose-pink carpet.', 'Jenny\'s room.', { group: 'Inside' });
tile('counter', 'c', 'Kitchen counter / sideboard (top view).', 'Kitchens, the living room sideboard, Michael\'s drawer.', { under: 'k', group: 'Inside' });
tile('table', 't', 'Table top (one tile of it: tables are several tiles).', 'The kitchen tables, the interview table.', { under: 'k', group: 'Inside' });
tile('chair', 'b', 'A kitchen chair, on the kitchen floor.', 'Round the kitchen tables.', { under: 'k', group: 'Inside' });
tile('sofa', 's', 'Sofa (one tile of it; sofas are 2-5 tiles long).', 'The navy lounge suite; the Jacobs sofa.', { under: '.', group: 'Inside' });
tile('tv', 'v', 'The old TV (one tile of it; it\'s 2-3 tiles wide).', 'The Cole living room, the Jacobs lounge, the prologue.', { under: '.', group: 'Inside' });
tile('bed', 'e', 'Bed (one tile; beds are 2x2 tiles).', 'Michael\'s, Jenny\'s and Pa\'s rooms.', { under: '.', group: 'Inside' });
tile('cupboard', 'a', 'Cupboard / wardrobe doors (top view).', 'Michael\'s wardrobe, Pa\'s cupboard, the garage cupboard, the filing cabinet.', { under: '.', group: 'Inside' });
tile('ladder', 'L', 'The attic ladder, on the floorboards.', 'The hall, and the attic.', { under: '.', group: 'Inside' });
tile('rug', 'r', 'Rug.', 'The prologue lounge.', { under: '.', group: 'Inside' });
tile('armchair', 'h', 'Henry\'s armchair (one tile), on the rug.', 'The prologue; the Jacobs lounge.', { under: 'r', group: 'Inside' });
slot('objects/board', 20, 20, 'The Snakes and Ladders board.', 'On the kitchen tables (Cole, Jacobs, prologue). Michael\'s save point.', ctx => { artRect(ctx, 0, 0, 20, 20, 0xd8cfa0); for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2) artRect(ctx, i * 4, j * 4, 4, 4, 0xb0a070); }, { group: 'Things' });
slot('objects/photo', 8, 10, 'Ma\'s photo in its frame.', 'On the living room sideboard.', ctx => { artRect(ctx, 0, 0, 8, 10, 0xc8b890); artRect(ctx, 1, 1, 6, 7, 0x6a6a7a); }, { group: 'Things' });
slot('objects/window-curtains', 16, 16, 'A locked window: curtains drawn. Laid over the window tile, so only draw the curtains (see-through elsewhere).', 'Windows Michael has locked (Nights 1, 4...).', ctx => { artRect(ctx, 2, 3, 12, 8, 0x5a3030); artRect(ctx, 7, 3, 2, 8, 0x7a4040); }, { group: 'Things' });
slot('objects/window-boards', 16, 16, 'Planks nailed across a window. Laid over the window tile; see-through elsewhere.', 'Boarded windows, Days 6-7 and the siege.', ctx => { artRect(ctx, 0, 3, 16, 3, 0x7a5a34); artRect(ctx, 0, 8, 16, 3, 0x7a5a34); artRect(ctx, 3, 4, 1, 1, 0x3a2a18); artRect(ctx, 12, 9, 1, 1, 0x3a2a18); }, { group: 'Things' });
slot('objects/window-broken', 16, 16, 'The smashed kitchen window: a jagged hole in the glass. Laid over the window tile.', 'From supper on Day 3.', ctx => { artRect(ctx, 4, 4, 8, 6, 0x000000); for (let i = 0; i < 5; i++) { artRect(ctx, 2 + i, 3 + Math.round(i * 0.8), 1, 1, 0xc8d0d8); artRect(ctx, 13 - i, 4 + Math.round(i * 0.8), 1, 1, 0xc8d0d8); } }, { group: 'Things' });
slot('objects/door-closed', 16, 16, 'A closed (locked) wooden door, top view, with its knob.', 'The Cole doors when locked; the prologue back door.', ctx => { artRect(ctx, 0, 0, 16, 16, 0x6a4628); artRect(ctx, 13, 7, 2, 2, 0xc8b060); }, { group: 'Things' });
slot('objects/door-open', 3, 14, 'The door itself, swung open (a thin plank seen edge-on from above).', 'Beside open doorways.', ctx => artRect(ctx, 0, 0, 3, 14, 0x8a5a30), { group: 'Things' });
slot('objects/oil-can', 8, 10, 'A flask / can of lamp oil.', 'To pick up on Night 4, Day 6 and the test night.', ctx => { artRect(ctx, 2, 3, 5, 7, 0x8a6a2a); artRect(ctx, 3, 1, 3, 2, 0x4a3a20); }, { group: 'Things' });
slot('objects/oil-lamp', 8, 10, 'An oil lamp\'s base and glass. The game draws the flame on top (it dims as the oil runs out), so leave the top 3 rows empty.', 'The three lamps in the house on Night 6.', ctx => artRect(ctx, 2, 4, 5, 6, 0x8a6a2a), { group: 'Things' });
slot('objects/barrel', 20, 20, 'Ma\'s holy water barrel, from above.', 'The attic.', ctx => { artEllipse(ctx, 10, 10, 9, 9, 0x5a4028); artRect(ctx, 3, 8, 14, 2, 0x3a2a18); }, { group: 'Things' });
slot('objects/torch', 12, 6, 'A torch (flashlight) lying on the ground, pointing right.', 'Jason\'s torch (Day 3), Venn\'s torch (Night 5).', ctx => { artRect(ctx, 1, 2, 9, 3, 0x6a6a70); artRect(ctx, 10, 1, 2, 4, 0xfff0a0); }, { group: 'Things' });
slot('objects/carved-stone', 12, 12, 'A carved stone (fist-sized), with its carving.', 'The prologue kitchen counter; through the kitchen window on Day 3.', ctx => { artEllipse(ctx, 6, 6, 5.5, 4, 0x6f6f6a); artRect(ctx, 5, 4, 2, 1, 0x3a3a36); artRect(ctx, 4, 5, 1, 2, 0x3a3a36); artRect(ctx, 7, 5, 1, 2, 0x3a3a36); artRect(ctx, 5, 7, 2, 1, 0x3a3a36); }, { group: 'Things' });
slot('objects/petrol-can', 8, 10, 'A red can of petrol.', 'The shed, Day 7.', ctx => { artRect(ctx, 0, 1, 7, 9, 0xb02a1a); artRect(ctx, 2, 0, 3, 1, 0x3a2a18); }, { group: 'Things' });
slot('objects/bloodstain', 24, 12, 'A dark stain on the ground under someone lying dead.', 'Day 4 (Jason and Jenny on the lawn), Night 5.', ctx => artEllipse(ctx, 12, 6, 11, 6, 0x4a0a0a), { group: 'Things' });
slot('objects/dead-spike', 24, 12, 'Spike, dead, lying on his side in a dark stain. Mostly left to the imagination.', 'The edge of the clearing, Day 2.', ctx => { artEllipse(ctx, 13, 7, 12, 5.5, 0x4a0a0a); artRect(ctx, 6, 3, 12, 6, 0xc8a060); artRect(ctx, 3, 4, 3, 2, 0xc8a060); }, { group: 'Things' });
slot('objects/crow', 12, 8, 'A crow, flying (it swoops away to the top right).', 'The search, Day 3.', ctx => { for (let x = 0; x < 11; x++) { const h = Math.round(1 + x * 0.7); artRect(ctx, x, 4 - Math.floor(h / 2), 1, h, 0x080808); } }, { group: 'Things' });
slot('objects/shotgun', 4, 14, 'Pa\'s shotgun, held upright.', 'Night 6, near dawn.', ctx => artRect(ctx, 1, 1, 2, 12, 0x3a2a1a), { group: 'Things' });

// 6. Cars (all drawn facing RIGHT; the game turns them).
slot('objects/red-car', 32, 16, 'Michael\'s red car, from above, facing right (bonnet on the right).', 'Parked in the driveway every day; the opening drive.', artCar('red'), { group: 'Cars' });
slot('objects/beetle', 32, 16, 'Jason and Jean\'s white Beetle, from above, facing right.', 'Parked in the driveway from Day 1.', artCar('beetle'), { group: 'Cars' });
slot('objects/pickup', 32, 16, 'Pa\'s old pickup truck, rusted red, from above, facing right.', 'In the driveway from Day 4; the drive home from the station.', artCar('truck'), { group: 'Cars' });
slot('objects/police-car', 32, 16, 'The police car, from above, facing right. The game adds the flashing red and blue lights on top.', 'Day 1, Day 2, Day 4, Night 5.', artCar('police'), { group: 'Cars' });

// 7. Other places and people.
person('venn', ART_LOOKS.venn, 'Detective Anna Venn: dark coat.', 'Day 2, Day 4, Day 5, Night 5.', { group: 'People' });
person('ruth', ART_LOOKS.ruth, 'Ruth Hale: black dress, white hair in a bun.', 'Day 2, Day 5, the endings.', { group: 'People' });
person('ma', ART_LOOKS.ma, 'Ma, as in her photo.', 'Her face at Michael\'s window (Night 6).', { group: 'People' });
slot('people/jason-headless', 16, 16, 'Jason holding his own head in his hand (facing down).', 'Night 3, in the first row of the corn.', ctx => { artPerson(ctx, 0, ART_LOOKS.jason, 'down'); ctx.clearRect(4, 0, 8, 7); artRect(ctx, 11, 9, 5, 5, ART_LOOKS.jason.head); artRect(ctx, 11, 9, 5, 2, ART_LOOKS.jason.hair); }, { group: 'People' });
tile('taped-door', 'J', 'A doorway crossed with yellow police tape.', 'The Jacobs front door.', { under: '.', group: 'Other places' });
tile('gravestone', 'S', 'A gravestone, on grass.', 'Marrowfield cemetery (Day 5).', { under: 'g', group: 'Other places' });
tile('open-grave', 'O', 'An open grave.', 'Marrowfield cemetery (Day 5).', { under: 'p', group: 'Other places' });

// 8. The prologue and the test night (seen once).
person('henry', ART_LOOKS.henry, 'Henry Jacobs, the grandfather.', 'The prologue (you play him).', { group: 'Prologue and test night' });
person('justin', ART_LOOKS.justin, 'Justin, Henry\'s grandson (a boy: draw him smaller, his feet still at the bottom).', 'The prologue, at the kitchen table.', { small: true, group: 'Prologue and test night' });
person('phillip', ART_LOOKS.phillip, 'Phillip, Henry\'s other grandson (a boy).', 'The prologue, at the kitchen table.', { small: true, group: 'Prologue and test night' });
tile('doorway', 'd', 'The prologue\'s back doorway (dark), on the kitchen floor.', 'The prologue.', { under: 'k', group: 'Prologue and test night' });
slot('objects/rolling-head', 12, 12, 'The dark round shape that rolls into Henry\'s light. Leave it to the imagination.', 'The prologue.', ctx => { artEllipse(ctx, 6, 6, 5, 5, 0x15100e); artRect(ctx, 3, 4, 2, 2, 0x2a201c); }, { group: 'Prologue and test night' });
slot('objects/old-truck', 32, 48, 'The old pickup truck on the lawn, from above, cab at the TOP. Michael hides in it.', 'The test night only.', ctx => { artRect(ctx, 2, 1, 28, 46, 0x6a2a1e); artRect(ctx, 4, 4, 24, 12, 0x2a3036); artRect(ctx, 4, 20, 24, 24, 0x4e2016); }, { group: 'Prologue and test night' });

// Tile letters (see map.js) -> slot. 'K' (under the test-night truck) is lawn.
const TILE_ART = {};
for (const s of ART_SLOTS) if (s.tile && !s.layer) TILE_ART[s.tile] = s;
TILE_ART.K = TILE_ART.g;

// The colours David should draw with: dark and muted, for night-time horror.
const ART_PALETTE = [
  ['#0b0d12', 'night black'], ['#1a2030', 'deep night blue'], ['#2c3a4e', 'slate blue'], ['#4e5f74', 'moonlit blue-grey'],
  ['#8a96a0', 'cold grey'], ['#d8d2c0', 'bone (highlights)'], ['#3a3a40', 'dark grey'], ['#6a6a64', 'stone grey'],
  ['#1f2a1a', 'dark green'], ['#34482a', 'lawn green'], ['#5a6b32', 'corn green'], ['#8a8a3e', 'dry corn'],
  ['#b89a4e', 'ochre dust'], ['#2a1e14', 'dark earth'], ['#4a3624', 'dirt brown'], ['#6e5034', 'wood'],
  ['#9a7a52', 'pale wood'], ['#c89a78', 'skin'], ['#8a5a48', 'skin shadow'], ['#5a1e1a', 'dried blood'],
  ['#8a3a26', 'rusted tin'], ['#ffb04a', 'lamplight amber'], ['#ff2a1a', 'its eyes'], ['#3a4a6a', 'faded denim'],
];

// ---------- loading ----------
const Art = {
  slots: Object.fromEntries(ART_SLOTS.map(s => [s.id, s])),
  pics: {},     // id -> canvas, for real drawings only
  loaded: [],   // ids of real drawings
  ready: false,

  placeholder(id) {
    const s = this.slots[id];
    const cv = document.createElement('canvas');
    cv.width = s.w; cv.height = s.h;
    s.ph(cv.getContext('2d'));
    return cv;
  },

  // Is this picture still exactly the grey-box placeholder?
  isPlaceholder(id, cv) {
    const s = this.slots[id];
    const a = cv.getContext('2d').getImageData(0, 0, s.w, s.h).data;
    const b = this.placeholder(id).getContext('2d').getImageData(0, 0, s.w, s.h).data;
    for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - b[i]) > 6) return false;
    return true;
  },

  // Load every PNG in assets/. Resolves when they've all loaded or failed
  // (or after a few seconds, so a slow connection never stops the game).
  load(timeoutMs = 6000) {
    if (location.protocol === 'file:') { this.ready = true; return Promise.resolve(); } // (pictures can't be read from a file:// page)
    const stamp = Math.floor(Date.now() / 60000); // a new drawing shows up within a minute of GitHub publishing it
    const one = s => new Promise(res => {
      const img = new Image();
      img.onload = () => {
        try {
          const cv = document.createElement('canvas');
          cv.width = s.w; cv.height = s.h;
          const ctx = cv.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          if (img.width !== s.w || img.height !== s.h) console.warn(`assets/${s.id}.png is ${img.width}x${img.height}; it should be ${s.w}x${s.h}. Stretching it to fit.`);
          ctx.drawImage(img, 0, 0, s.w, s.h);
          if (!this.isPlaceholder(s.id, cv)) { this.pics[s.id] = cv; this.loaded.push(s.id); }
        } catch (e) { console.warn('Could not use assets/' + s.id + '.png', e); }
        res();
      };
      img.onerror = () => res();
      img.src = `assets/${s.id}.png?v=${stamp}`;
    });
    const all = Promise.all(ART_SLOTS.map(one));
    const late = new Promise(res => setTimeout(res, timeoutMs));
    return Promise.race([all, late]).then(() => { this.ready = true; });
  },

  has(id) { return !!this.pics[id]; },

  // Paint a drawing onto a canvas (the map). Returns false if there isn't one.
  draw(ctx, id, x, y) {
    const p = this.pics[id];
    if (!p) return false;
    ctx.drawImage(p, Math.round(x), Math.round(y));
    return true;
  },

  // The Phaser texture key for a slot (added the first time it's asked for),
  // or null. orPlaceholder: use the placeholder if there's no drawing yet.
  key(scene, id, orPlaceholder) {
    const s = this.slots[id];
    const real = this.pics[id];
    if (!s || (!real && !orPlaceholder)) return null;
    const key = 'art:' + id + (real ? '' : ':ph');
    if (!scene.textures.exists(key)) {
      const tex = scene.textures.addCanvas(key, real || this.placeholder(id));
      if (s.strip) for (let i = 0; i < 4; i++) tex.add(i, 0, i * 16, 0, 16, 16);
    }
    return key;
  },

  // A person's slot, by their id in CAST ('walter' is Pa).
  personId(castId) { return 'people/' + (castId === 'walter' ? 'pa' : castId); },
};

// Which frame of a person's strip faces (fx, fy).
function artFrame(fx, fy) {
  if (Math.abs(fx) > Math.abs(fy)) return fx < 0 ? 2 : 3;
  return fy < 0 ? 1 : 0;
}
