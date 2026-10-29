# Stay Away from the Cornfield

A 2D top-down pixel-art survival horror game for Android phones (played in the browser).
Based on David Braz's 2002 short story. The full plan is in the game design document
("Stay Away from the Cornfield — Game Design").

**Play it:** https://dvdbraz-bot.github.io/Cornfield/ (open in Chrome on an Android phone, landscape, with headphones).
The start screen lets you choose the **Prologue** or the **Test night** (Milestone 2).

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

## Controls
- **Phone:** touch the left half of the screen to make a joystick appear under your thumb. Push it to the edge to run. On the right are a big **ACT** button (it glows when something can be used) and a smaller **LANTERN** button above it. To face a direction without walking far, nudge the joystick that way.
- **Computer:** WASD or arrow keys to move, Shift to run, E or Space = act (hold it to hold your breath), F = lantern, G = debug view. On the start screen, press 1 for the prologue and 2 for the test night.

## Tech
- Phaser 4.2.1, plain JavaScript, no build step. Phaser is included in `lib/`, so nothing loads from the internet.
- Renders at 480x270 with crisp pixels (`pixelArt: true`), scaled to fit the screen, capped at 30 frames per second (measured: 30.0 in both the prologue and the test night).
- Each map is painted once into a single image. The darkness is one small 480x270 canvas redrawn each frame. This keeps the phone cool.

## Files
| File | What it is |
|---|---|
| `index.html` | The page that loads everything |
| `src/main.js` | Game settings (size, 30 fps, scaling) |
| `src/map.js` | The prologue map (`MAP`) and the test night map (`TEST_MAP`), and how they're drawn |
| `src/FieldScene.js` | Shared by both: movement, noise rings, lantern and darkness, speech bubbles and edge arrows, the kill from behind. Movement and noise numbers are in `FIELD_TUNING`. |
| `src/PrologueScene.js` | The prologue story. Its numbers are in `TUNING`. |
| `src/Creature.js` | The creature's brain (its six states). All its numbers are in `CREATURE` at the top. |
| `src/TestNightScene.js` | The Milestone 2 test night: oil, hiding, crickets, heartbeat, reach line, dawn. Its numbers are in `NIGHT` and `REACH`. |
| `src/UIScene.js` | Joystick, ACT and LANTERN buttons, caption box, cricket icon, oil gauge, DEBUG button |
| `src/StartScene.js`, `src/EndScene.js` | Start menu, and the title / caught / dawn screens |
| `src/sfx.js` | All sound effects, generated in code |
| `src/controls.js` | Shared state between the controls, the game and the on-screen displays |
| `manifest.webmanifest`, `icon-*.png` | Lets you add the game to your home screen as a fullscreen landscape app |

## How to run it
- **On your phone:** open https://dvdbraz-bot.github.io/Cornfield/ in Chrome. Use a capital C, because the link is case-sensitive. New builds appear there a minute or two after they're pushed. Optional: tap ⋮ → **Add to Home screen** to open it fullscreen, like an app.
- **On a computer:** double-click `index.html`.

## Next (from the design doc)
Milestone 3: placeholder art and sound (16 x 16 tiles, simple sprites, wind, crickets, heartbeat). After that, Milestone 4: the farm and its systems (house, shed, garage, attic, dialogue, notebook, saving).
