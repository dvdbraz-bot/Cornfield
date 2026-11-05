# The art list

Every picture in the game, in the order to draw them: what's on screen most comes first.
Each file in `assets/` starts as my grey-box placeholder, at the exact size the game needs. Open it in Piskel, draw over it, and export a PNG with the **same name** into the **same folder**.

**How the game uses them:** while a file is still exactly my placeholder, the game keeps drawing that thing in code. The moment it's different (your drawing), the game uses the picture. If a file is missing or broken, it goes back to the code, so the game always works.

## Rules for every picture

- **Keep the size exactly** (it's in the table). A picture of the wrong size gets stretched to fit, and will look blurry or squashed.
- **Tiles are 16 x 16** and fill the whole square, unless the table says "see-through".
- **Furniture tiles** (a chair, a bed, the TV...) are drawn over the floor: any see-through pixels show the floor tile underneath, so you can leave the background see-through or paint the floor in, as you like.
- **People are a 64 x 16 strip of four 16 x 16 frames, left to right: facing down (towards you), up (away), left, right.** See-through background. Keep their feet at the bottom and their heads at the top. Walking animation can come later.
- **Put everyone's eyes in the same place** as the placeholders. The easiest way is to draw over the placeholder and keep its eye pixels where they are. (Counting pixels from 0 at the top-left of each frame, the eyes are at x 6 and 9, y 4 facing down; x 5 facing left; x 10 facing right.) The red eyes in `people/red-eyes.png` are laid over people in exactly those spots.
- **Objects** (`objects/`) have see-through backgrounds and are drawn centred on their spot.
- **Cars are drawn facing right** (bonnet on the right). The game turns them.
- **Use the palette** (`assets/palette.png`, and the colours below). Night darkens everything a lot, so keep strong light-dark contrast inside each picture.
- **File names are lowercase**, with a hyphen between words (`corn-tops.png`). The name must match exactly, or the game won't find it.

## The pictures, in drawing order

| # | File | Size (pixels) | What it is | Where it appears |
|---|---|---|---|---|
| 1 | `tiles/corn.png` | 16 x 16 | Corn: the ground between the stalks, and the stalks (seen from above). Opaque. | Every cornfield, every night. Most of the game. |
| 2 | `tiles/corn-tops.png` | 16 x 16 | The corn leaves drawn OVER people, so they look as if they're inside the corn. Draw leaves only and leave the rest see-through (Piskel's eraser). Keep the gaps: too many leaves and you can't see Michael. | On top of every corn tile. |
| 3 | `tiles/path.png` | 16 x 16 | Dirt path (the one-tile paths between the rows of corn, and the dirt road). | Between every row of corn; the road to Marrowfield. |
| 4 | `tiles/trampled-corn.png` | 16 x 16 | Corn that's been trampled flat. | Scattered through the cornfields. |
| 5 | `tiles/bare-earth.png` | 16 x 16 | Bare earth in the clearing at the centre of the field. | The stone ring. |
| 6 | `objects/ring-stone.png` | 8 x 8 | One of the twelve carved stones, half buried. Leave the background see-through. | Round the stone ring in the clearing (12 of them). |
| 7 | `objects/stone-hole.png` | 8 x 8 | A raw hole in the earth where a stone was torn out. See-through background. | The stone ring, after Night 5. |
| 8 | `people/michael.png` | 64 x 16 (4 frames) | Michael Cole: white t-shirt, dark hair. Four frames: facing down, up, left, right. See-through background. Don't draw the lantern: the game adds it (it glows and dims). | You play him in almost every chapter. |
| 9 | `objects/creature.png` | 24 x 40 | The thing in the field: a tall black silhouette with curling horns and long arms (bigger than a person). Its feet at the bottom edge. See-through background. No eyes: they are the next file. | Every night it hunts, the siege, the finale. |
| 10 | `objects/creature-eyes.png` | 8 x 2 | Its two slanted red eyes. They shine through the darkness, so they're drawn separately. See-through background. | Over the creature's head. |
| 11 | `tiles/lawn.png` | 16 x 16 | Grass (the lawn and yard). | The Cole farm, the Jacobs farm, the test night, the cemetery. |
| 12 | `tiles/dead-grass.png` | 16 x 16 | Withered grass: the line it can't cross. Drawn on top of the lawn, so draw only the dead blades and leave the rest see-through. | A line across the yard on Nights 4-6 and the test night. |
| 13 | `tiles/porch.png` | 16 x 16 | Porch boards. | The Cole porch facing the field; the Jacobs porch. |
| 14 | `tiles/wall.png` | 16 x 16 | House wall (seen from above: the top of the wall, with its shadow at the bottom). | Every building. |
| 15 | `tiles/window.png` | 16 x 16 | A window in the wall, glass dark at night. | The house windows; the mirror in the interview room. |
| 16 | `tiles/front-door.png` | 16 x 16 | The front doorway, open, with its door frame (the door runs across the top). | The Cole front door. |
| 17 | `tiles/back-door.png` | 16 x 16 | The back doorway, open, with its frame (sideways: the door runs down the right-hand side). | The Cole back door, onto the porch. |
| 18 | `tiles/concrete.png` | 16 x 16 | Cracked concrete. | The driveway, the garage and shed floors, the police station. |
| 19 | `tiles/shed-wall.png` | 16 x 16 | Wooden plank wall. | The shed and the garage. |
| 20 | `tiles/trees.png` | 16 x 16 | Trees: the dark edge of the world. | Round the edge of every map. |
| 21 | `tiles/kennel.png` | 16 x 16 | Spike's kennel, on grass. | Beside the Cole porch. |
| 22 | `tiles/generator.png` | 16 x 16 | The generator, on concrete. | The shed. |
| 23 | `tiles/boxes.png` | 16 x 16 | Cardboard boxes, on concrete. | The garage and the attic. |
| 24 | `people/jenny.png` | 64 x 16 (4 frames) | Jenny: red skirt, blonde hair. | Days 1-3, Night 3, the Interlude (you play her). |
| 25 | `people/pa.png` | 64 x 16 (4 frames) | Pa (Walter Cole): blue checked shirt, grey hair. | Every day chapter until Night 6. |
| 26 | `people/jason.png` | 64 x 16 (4 frames) | Jason: copper curls. | Day 1, Day 2, Night 2 (you play him), Night 3. |
| 27 | `people/jean.png` | 64 x 16 (4 frames) | Jean: thick brown hair, a pale top. | Day 1 to the finale. |
| 28 | `people/spike.png` | 64 x 16 (4 frames) | Spike, the old Labrador. Same four frames (down, up, left, right). | Days 1-2. |
| 29 | `people/red-eyes.png` | 64 x 16 (4 frames) | Red eyes, laid over a person when it's wearing them. Only the red eye pixels; everything else see-through. Put them where you drew the eyes on the people (the same spot on everyone). The "up" frame has none. | Faces at the windows (Night 6); the dead it wears in the finale. |
| 30 | `tiles/floor.png` | 16 x 16 | Wooden floorboards. | The living room, hall, Pa's room, the attic, the Jacobs lounge. |
| 31 | `tiles/kitchen-floor.png` | 16 x 16 | Kitchen floor tiles (lino). | The Cole and Jacobs kitchens. |
| 32 | `tiles/green-carpet.png` | 16 x 16 | Dark green carpet. | Michael's old room. |
| 33 | `tiles/rose-carpet.png` | 16 x 16 | Rose-pink carpet. | Jenny's room. |
| 34 | `tiles/counter.png` | 16 x 16 | Kitchen counter / sideboard (top view). | Kitchens, the living room sideboard, Michael's drawer. |
| 35 | `tiles/table.png` | 16 x 16 | Table top (one tile of it: tables are several tiles). | The kitchen tables, the interview table. |
| 36 | `tiles/chair.png` | 16 x 16 | A kitchen chair, on the kitchen floor. | Round the kitchen tables. |
| 37 | `tiles/sofa.png` | 16 x 16 | Sofa (one tile of it; sofas are 2-5 tiles long). | The navy lounge suite; the Jacobs sofa. |
| 38 | `tiles/tv.png` | 16 x 16 | The old TV (one tile of it; it's 2-3 tiles wide). | The Cole living room, the Jacobs lounge, the prologue. |
| 39 | `tiles/bed.png` | 16 x 16 | Bed (one tile; beds are 2x2 tiles). | Michael's, Jenny's and Pa's rooms. |
| 40 | `tiles/cupboard.png` | 16 x 16 | Cupboard / wardrobe doors (top view). | Michael's wardrobe, Pa's cupboard, the garage cupboard, the filing cabinet. |
| 41 | `tiles/ladder.png` | 16 x 16 | The attic ladder, on the floorboards. | The hall, and the attic. |
| 42 | `tiles/rug.png` | 16 x 16 | Rug. | The prologue lounge. |
| 43 | `tiles/armchair.png` | 16 x 16 | Henry's armchair (one tile), on the rug. | The prologue; the Jacobs lounge. |
| 44 | `objects/board.png` | 20 x 20 | The Snakes and Ladders board. | On the kitchen tables (Cole, Jacobs, prologue). Michael's save point. |
| 45 | `objects/photo.png` | 8 x 10 | Ma's photo in its frame. | On the living room sideboard. |
| 46 | `objects/window-curtains.png` | 16 x 16 | A locked window: curtains drawn. Laid over the window tile, so only draw the curtains (see-through elsewhere). | Windows Michael has locked (Nights 1, 4...). |
| 47 | `objects/window-boards.png` | 16 x 16 | Planks nailed across a window. Laid over the window tile; see-through elsewhere. | Boarded windows, Days 6-7 and the siege. |
| 48 | `objects/window-broken.png` | 16 x 16 | The smashed kitchen window: a jagged hole in the glass. Laid over the window tile. | From supper on Day 3. |
| 49 | `objects/door-closed.png` | 16 x 16 | A closed (locked) wooden door, top view, with its knob. | The Cole doors when locked; the prologue back door. |
| 50 | `objects/door-open.png` | 3 x 14 | The door itself, swung open (a thin plank seen edge-on from above). | Beside open doorways. |
| 51 | `objects/oil-can.png` | 8 x 10 | A flask / can of lamp oil. | To pick up on Night 4, Day 6 and the test night. |
| 52 | `objects/oil-lamp.png` | 8 x 10 | An oil lamp's base and glass. The game draws the flame on top (it dims as the oil runs out), so leave the top 3 rows empty. | The three lamps in the house on Night 6. |
| 53 | `objects/barrel.png` | 20 x 20 | Ma's holy water barrel, from above. | The attic. |
| 54 | `objects/torch.png` | 12 x 6 | A torch (flashlight) lying on the ground, pointing right. | Jason's torch (Day 3), Venn's torch (Night 5). |
| 55 | `objects/carved-stone.png` | 12 x 12 | A carved stone (fist-sized), with its carving. | The prologue kitchen counter; through the kitchen window on Day 3. |
| 56 | `objects/petrol-can.png` | 8 x 10 | A red can of petrol. | The shed, Day 7. |
| 57 | `objects/bloodstain.png` | 24 x 12 | A dark stain on the ground under someone lying dead. | Day 4 (Jason and Jenny on the lawn), Night 5. |
| 58 | `objects/dead-spike.png` | 24 x 12 | Spike, dead, lying on his side in a dark stain. Mostly left to the imagination. | The edge of the clearing, Day 2. |
| 59 | `objects/crow.png` | 12 x 8 | A crow, flying (it swoops away to the top right). | The search, Day 3. |
| 60 | `objects/shotgun.png` | 4 x 14 | Pa's shotgun, held upright. | Night 6, near dawn. |
| 61 | `objects/red-car.png` | 32 x 16 | Michael's red car, from above, facing right (bonnet on the right). | Parked in the driveway every day; the opening drive. |
| 62 | `objects/beetle.png` | 32 x 16 | Jason and Jean's white Beetle, from above, facing right. | Parked in the driveway from Day 1. |
| 63 | `objects/pickup.png` | 32 x 16 | Pa's old pickup truck, rusted red, from above, facing right. | In the driveway from Day 4; the drive home from the station. |
| 64 | `objects/police-car.png` | 32 x 16 | The police car, from above, facing right. The game adds the flashing red and blue lights on top. | Day 1, Day 2, Day 4, Night 5. |
| 65 | `people/venn.png` | 64 x 16 (4 frames) | Detective Anna Venn: dark coat. | Day 2, Day 4, Day 5, Night 5. |
| 66 | `people/ruth.png` | 64 x 16 (4 frames) | Ruth Hale: black dress, white hair in a bun. | Day 2, Day 5, the endings. |
| 67 | `people/ma.png` | 64 x 16 (4 frames) | Ma, as in her photo. | Her face at Michael's window (Night 6). |
| 68 | `people/jason-headless.png` | 16 x 16 | Jason holding his own head in his hand (facing down). | Night 3, in the first row of the corn. |
| 69 | `tiles/taped-door.png` | 16 x 16 | A doorway crossed with yellow police tape. | The Jacobs front door. |
| 70 | `tiles/gravestone.png` | 16 x 16 | A gravestone, on grass. | Marrowfield cemetery (Day 5). |
| 71 | `tiles/open-grave.png` | 16 x 16 | An open grave. | Marrowfield cemetery (Day 5). |
| 72 | `people/henry.png` | 64 x 16 (4 frames) | Henry Jacobs, the grandfather. | The prologue (you play him). |
| 73 | `people/justin.png` | 64 x 16 (4 frames) | Justin, Henry's grandson (a boy: draw him smaller, his feet still at the bottom). | The prologue, at the kitchen table. |
| 74 | `people/phillip.png` | 64 x 16 (4 frames) | Phillip, Henry's other grandson (a boy). | The prologue, at the kitchen table. |
| 75 | `tiles/doorway.png` | 16 x 16 | The prologue's back doorway (dark), on the kitchen floor. | The prologue. |
| 76 | `objects/rolling-head.png` | 12 x 12 | The dark round shape that rolls into Henry's light. Leave it to the imagination. | The prologue. |
| 77 | `objects/old-truck.png` | 32 x 48 | The old pickup truck on the lawn, from above, cab at the TOP. Michael hides in it. | The test night only. |

## Things that need more than one picture

- **Corn** is two pictures. `tiles/corn.png` is the ground and stalks, drawn under everyone. `tiles/corn-tops.png` is leaves only (the rest see-through), drawn over everyone, so people look as if they're inside the corn. Keep the leaves sparse enough to see Michael through them.
- **The creature** is two pictures: `objects/creature.png` (its black body) and `objects/creature-eyes.png` (the red eyes). The eyes are separate because they shine through the darkness when its body can't be seen.
- **Windows** are the tile `tiles/window.png` plus three overlays laid on top when needed: `objects/window-curtains.png` (locked), `objects/window-boards.png` (boarded up) and `objects/window-broken.png` (smashed). Doors are the doorway tiles plus `objects/door-closed.png` (locked) and `objects/door-open.png` (the door swung open).
- **People the creature wears** (faces at the windows, the finale) are the person's own strip with `people/red-eyes.png` laid over it.
- **Jason holding his own head** (Night 3) is `people/jason-headless.png`, a single 16 x 16 frame facing down.
- **The oil lamp** is `objects/oil-lamp.png` for the base and glass; the game draws the flame, which dims as the oil runs out.

## Still drawn in code (not slots yet)

Effects that move or change colour: the lantern Michael carries, the flickering TV screen, the police lights, fire, holy water splashes, noise rings, puddles, the house light in the endless field, the kill (the hand and the heart), and the on-screen controls and notebook.

## The palette

`assets/palette.png` has one square of each colour, 8 to a row, in this order. In Piskel: open the palette panel and import the PNG, or type the codes in.

| # | Colour | Use it for |
|---|---|---|
| 1 | `#0b0d12` | night black |
| 2 | `#1a2030` | deep night blue |
| 3 | `#2c3a4e` | slate blue |
| 4 | `#4e5f74` | moonlit blue-grey |
| 5 | `#8a96a0` | cold grey |
| 6 | `#d8d2c0` | bone (highlights) |
| 7 | `#3a3a40` | dark grey |
| 8 | `#6a6a64` | stone grey |
| 9 | `#1f2a1a` | dark green |
| 10 | `#34482a` | lawn green |
| 11 | `#5a6b32` | corn green |
| 12 | `#8a8a3e` | dry corn |
| 13 | `#b89a4e` | ochre dust |
| 14 | `#2a1e14` | dark earth |
| 15 | `#4a3624` | dirt brown |
| 16 | `#6e5034` | wood |
| 17 | `#9a7a52` | pale wood |
| 18 | `#c89a78` | skin |
| 19 | `#8a5a48` | skin shadow |
| 20 | `#5a1e1a` | dried blood |
| 21 | `#8a3a26` | rusted tin |
| 22 | `#ffb04a` | lamplight amber |
| 23 | `#ff2a1a` | its eyes |
| 24 | `#3a4a6a` | faded denim |
