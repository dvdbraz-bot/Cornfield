# Stay Away from the Cornfield

A 2D top-down pixel-art survival horror game for Android phones (played in the browser).
Based on David Braz's 2002 short story. The full plan is in the game design document
("Stay Away from the Cornfield — Game Design").

**Play it:** https://dvdbraz-bot.github.io/Cornfield/ (open in Chrome on an Android phone, landscape, with headphones).
The start screen offers **Continue** (if there's a save), **New game** (the prologue, then Day 1), and the **Test night** (Milestone 2).

Coloured shapes stand in for the art (grey-box). All sounds are generated in code as placeholders.

## Milestone 1: grey-box prologue ("Come see") ✅
About 6 minutes. Play as Henry Jacobs. It teaches movement, the lantern, and the two rules.

| Part | Notes |
|---|---|
| Start screen | "Play with headphones." On phones it goes fullscreen and locks to landscape. |
| Farmhouse | Three days of rain have only just stopped (dripping gutters, puddles). Kitchen and lounge. Justin (blue) and Phillip (green) argue over Snakes and Ladders in speech bubbles. A clock ticks. The TV murmurs and flickers. |
| Carved stone | On the kitchen counter. ACT: "Someone carved this a long time ago." |
| Armchair | In front of the TV. ACT after the boys' argument: Henry dozes and the screen fades to black. He wakes to silence (the TV and clock are off). The boys are gone and the back door is open. |
| Cornfield | 40 x 30 tiles. Two-tile rows of corn running north-south, with one-tile paths between them. Paths are quiet. Corn is slow and noisy and flashes a noise ring. Running flashes a smaller ring. |
| Night and lantern | The lantern lights about 5 tiles when on and 1.5 tiles when off. |
| Sound | Crickets and drips fade in near the open door. The boys' laughter (with a "(laughter)" bubble) comes from deeper in the field and moves on as Henry follows. |
| The lure | Near the centre the crickets stop. "Grandpa. Come see." comes from one fixed spot, the same words every 6.5 seconds, with the phone's text-to-speech voice. |
| The strike (from the story) | Walk within 3 tiles of the voice, try to leave for 3 seconds, or wait through 6 repeats. Something hits Henry in the back and a dark round shape rolls into his light. Henry: "Now they're throwing rocks at me." He walks to it, picks it up, and screams. |
| The kill | While he's in shock, a black arm comes through his back from behind, holding his heart out in front of him. The heartbeat slows and stops, and the phone vibrates with each beat. Cut to black: STAY AWAY FROM THE CORNFIELD. |

## Milestone 2: the creature's brain (test night) ✅
Play as Michael Cole, alone on the Cole farm's lawn at the edge of the field. Survive 4 minutes until dawn.
The thing in the field follows the six states from the design doc:

| State | What it does | The cue you learn |
|---|---|---|
| Prowling | Wanders the field. Noise and lantern light draw it towards you and build its suspicion. | Crickets are still singing |
| Luring | Goes to a fixed spot in the corn about 8 tiles away and calls in a dead voice ("Michael. Come see." or Spike barking), word for word, every 6 seconds. It gives up after 4 calls. | A voice that never moves |
| Hunting | Starts when its suspicion fills, or when you walk towards the lure. It circles to get behind you, keeping out of your lantern light. | Crickets stop, Michael's heartbeat rises, the phone vibrates |
| Retreating | Your lantern in its face for about 1 second drives it off with a growl. Then it regroups and prowls. | A growl in the corn |
| Caught | It gets right behind you. Kill from behind, then "Tap to try again". | |
| Asleep | At dawn it goes back to the stone ring. | Silence |

**What it senses**
- **A lit lantern** is seen from 14 tiles away. With the lantern off, it sees you within 3 tiles if you move, or 2 tiles if you stand still.
- **Noise:** pushing through corn carries 6 tiles and running carries 4. The ring shows exactly how far. Walking is silent.
- **When it loses you,** it only knows roughly where you went: it searches about 3 tiles off, then gives up after 4 seconds.
- **The reach line:** it can't go past this line, which is marked by withered grass. The default is Night 4 (the edge of the lawn). The debug button moves the line to Nights 5 and 6 and to the field only.

**Michael's tools**
- **Lamp oil:** a full lantern lasts 2½ minutes. Three oil flasks are hidden around the map.
- **The old pickup truck:** ACT next to it to hide. While hiding, hold ACT to hold your breath (6 seconds, shown by a meter) and tap ACT to get out. If it comes within 3 tiles while you're breathing, it hears you. If you run out of breath, you gasp and it hears you from 5 tiles.

**For players who can't hear well:** a cricket icon (top left) fades with the crickets, voices show as speech bubbles, and an arrow at the screen edge points to voices that are off screen.

**Debug view** (the DEBUG button at top right, or G on a keyboard): shows the creature, its state, its suspicion, its distance, how far it can see you, and where it's heading. Each further press moves the reach line to the next night. After the last one, the debug view hides again.

## Milestone 4: the farm and its systems ✅ (with Day 1 and Night 1 to run them)
Milestone 3 (placeholder art and sound) is on hold. The plan is to get the whole game playable in grey-box first and polish afterwards.

**The Cole farm** (`FARM_MAP`), laid out from the sketch in the design doc:
- The dirt road to Marrowfield and the cracked concrete driveway.
- The house: living room (the old Phillips TV, the navy lounge suite, Ma's photo), kitchen (the table with Jenny's Snakes and Ladders board), hallway with the attic ladder, Michael's dark green room (a drawer with Ma's rosary), Jenny's room and Pa's room.
- The porch facing the field, Spike's kennel, the garage (the locked cupboard), the shed (the generator), the attic (a dusty barrel), and the 40 x 30 cornfield with the stone ring.

**Systems**
- **Dialogue:** a box at the bottom of the screen with the speaker's name. Tap anywhere (or E / Enter) to continue. **Choices** appear as buttons (or press 1, 2, 3); the game remembers them as flags.
- **Michael's notebook** (top right, or N): **Notes** (objectives, with done ones ticked), **Clues** (scraps he's found), **Map** (a sketch showing where he is) and **Stones** (the ring of 12, with lost ones crossed out). The game pauses while it's open.
- **Saving** (on the phone, in the browser's storage): at the start of every day and night, when Michael sits at the Snakes and Ladders board, at the end of each chapter, and the moment the game goes into the background (a call, an app switch). **Continue** picks up from the saved step, with Michael where he was.
- **Chapters:** each day or night is a script of steps in `src/chapters.js`. Steps can use cutscenes, people walking, cars driving, dialogue, objectives, clues, items, locking doors and windows, and waiting for Michael to reach a place or use a thing.
- **People:** Jenny, Pa, Jason, Jean and Spike, as coloured shapes with their colours from the story.
- **Days and nights:** daylight has no darkness and no lantern. Nights have the lantern, the creature (its reach set per night), the crickets, the heartbeat, and the cricket icon. The house is dark until the power's back; then its windows glow from outside. Being caught takes you **back to the last save**.
- **Pa's rule:** by day, Michael won't go into the corn.

**Day 1: Homecoming**
1. The red car on the dirt road as a police car speeds past.
2. Jenny runs out ("It's been so long."), then Pa.
3. The news in the living room: Mr Jacobs and both his grandsons were killed last night.
4. Fetch the bags and take them to your old room.
5. Optional: Ma's photo ("A farm accident," Pa said) and her rosary in the drawer.
6. Start the novel at the kitchen table, feeling guilty that it's about Mr Jacobs.
7. A car horn: Jason and Jean arrive in the white Beetle.
8. Dinner, and Pa's rule: "Nobody goes into the corn. Not until the police are done." (with a choice).

**Night 1: Lock up**
1. Pa asks Michael to lock every window and the front door (0/5), then check the generator in the shed (with a choice).
2. Spike growls at the corn.
3. Crossing the yard, once, briefly, the crickets stop: it comes to the edge of the corn and can come no further tonight.
4. The generator brings the power back, then lock the back door and go to bed. The next chapter would be Day 2.

## Controls
- **Phone:** touch the left half of the screen to make a joystick appear under your thumb. Push it to the edge to run. On the right are a big **ACT** button (it glows when something can be used) and a smaller **LANTERN** button above it (at night). **NOTEBOOK** is at the top right. In dialogue, tap anywhere to continue, or tap a choice. To face a direction without walking far, nudge the joystick that way.
- **Computer:** WASD or arrow keys to move, Shift to run, E or Space = act (hold it to hold your breath), F = lantern, N = notebook, G = debug view (test night). In dialogue: E / Enter to continue, 1-3 to choose. On the start screen: 0 = Continue, 1 = New game, 2 = Test night.

## Tech
- Phaser 4.2.1, plain JavaScript, no build step. Phaser is included in `lib/`, so nothing loads from the internet.
- Renders at 480x270 with crisp pixels (`pixelArt: true`), scaled to fit the screen, capped at 30 frames per second (measured: 30.0 in the prologue, the test night, and the farm at night).
- Each map is painted once into a single image. The darkness is one small 480x270 canvas redrawn each frame. This keeps the phone cool.

## Files
| File | What it is |
|---|---|
| `index.html` | The page that loads everything |
| `src/main.js` | Game settings (size, 30 fps, scaling) |
| `src/map.js` | The prologue map (`MAP`), the test night map (`TEST_MAP`) and the Cole farm (`FARM_MAP`), and how they're drawn |
| `src/FieldScene.js` | Shared by both: movement, noise rings, lantern and darkness, speech bubbles and edge arrows, the kill from behind. Movement and noise numbers are in `FIELD_TUNING`. |
| `src/PrologueScene.js` | The prologue story. Its numbers are in `TUNING`. |
| `src/Creature.js` | The creature's brain (its six states). All its numbers are in `CREATURE` at the top. |
| `src/TestNightScene.js` | The Milestone 2 test night: oil, hiding, crickets, heartbeat, reach line, dawn. Its numbers are in `NIGHT` and `REACH`. |
| `src/UIScene.js` | Joystick, ACT and LANTERN buttons, caption box, cricket icon, oil gauge, DEBUG button, the dialogue box and choices, and the notebook |
| `src/ChapterScene.js` | The story's days and nights on the farm: the helpers chapters use, locks, lighting, the save point, saving, and being caught |
| `src/chapters.js` | **The story script**, one chapter at a time (Day 1 and Night 1 so far). Easy to read and edit. |
| `src/NPC.js` | The people (and Spike): their colours and how they walk |
| `src/save.js` | The save game, and the chapter names |
| `src/StartScene.js`, `src/EndScene.js` | Start menu, and the title / caught / dawn / end-of-chapter screens |
| `src/sfx.js` | All sound effects, generated in code |
| `src/controls.js` | Shared state between the controls, the game and the on-screen displays |
| `manifest.webmanifest`, `icon-*.png` | Lets you add the game to your home screen as a fullscreen landscape app |

## How to run it
- **On your phone:** open https://dvdbraz-bot.github.io/Cornfield/ in Chrome. Use a capital C, because the link is case-sensitive. New builds appear there a minute or two after they're pushed. Optional: tap ⋮ → **Add to Home screen** to open it fullscreen, like an app.
- **On a computer:** double-click `index.html`.

## Next (from the design doc)
Milestone 5: the rest of Days 1-3. That's Day 2 (Detective Venn, the Jacobs farm and Ruth, chasing Spike through the corn, the stone ring, and Jason's doomed night), then Day 3 (searching for Jason, the stone through the window, Jason's voice calling Jenny, the chase across the lawn, and Jenny's interlude).
Then Milestone 6 (Days 4-7, the finale and the endings), and after that the art and audio, the Android app, and Google Play.
