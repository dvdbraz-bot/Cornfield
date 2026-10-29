# Stay Away from the Cornfield

A 2D top-down pixel-art survival horror game for Android phones (played in the browser).

## Status: Milestone 1, grey-box prologue

Coloured shapes stand in for the art. All sounds are generated in code as placeholders.
The prologue takes about 6 minutes to play.

### What's built
| Part | Notes |
|---|---|
| Start screen | "Play with headphones." Tap to begin. On phones it goes fullscreen and locks to landscape. |
| Farmhouse | Kitchen and lounge. Justin (blue) and Phillip (green) play Snakes and Ladders and argue in speech bubbles. A clock ticks. |
| Carved stone | On the kitchen counter. ACT: "Someone carved this a long time ago." |
| Henry's armchair | In the lounge. ACT after the boys' argument: Henry dozes and the screen fades to black. He wakes to silence. The boys are gone and the back door is open. |
| Lawn and cornfield | The cornfield is 40 x 30 tiles. Corn grows in two-tile-wide vertical rows with one-tile paths between them. Paths are quiet and normal speed. Going through corn is slow, rustles, and flashes a noise ring. Running also makes a smaller ring. |
| Night and lantern | Dark overlay. The lantern lights a circle of about 5 tiles when on and 1.5 tiles when off. |
| Sound | Looping crickets that fade in near the open door. The boys' laughter is panned left and right and comes from deeper in the field, moving on as Henry follows. |
| The lure | Near the centre of the field the crickets stop. After about 3 seconds of silence, a bubble at one fixed spot about 6 tiles ahead says "Grandpa. Come see." It repeats every 6.5 seconds with the same words from the same spot. The phone's text-to-speech voice says it too; if the phone has no voice, a synthesised tone plays instead. |
| The strike | Henry is struck if he walks within 3 tiles of the voice, tries to leave for more than 3 seconds, or waits through 6 repeats. The screen shakes and flashes, there's a loud hit, and a dark round shape rolls past his feet. |
| The kill | A hard shake, then a large black hand holding a pulsing red shape. A heartbeat slows and stops, and the phone vibrates with each beat. Cut to black. Title: STAY AWAY FROM THE CORNFIELD. Tap to restart. |

### Controls
- **Phone:** touch the left half of the screen to make a joystick appear under your thumb. Push it to the edge to run. On the right are a big **ACT** button and a smaller **LANTERN** button above it. ACT glows when something can be used, and a small white arrow appears over that thing.
- **Computer:** WASD or arrow keys to move, hold Shift to run, E (or Space) = act, F = lantern.

### Tech
- Phaser 4.2.1, plain JavaScript, no build step. Phaser is included in `lib/`, so nothing loads from the internet.
- Renders at 480x270 with crisp pixels (`pixelArt: true`), scaled to fit the screen, capped at 30 frames per second.
- The whole map is painted once into a single image. The darkness is one small 480x270 canvas redrawn each frame. This keeps the phone cool.

### Files
| File | What it is |
|---|---|
| `index.html` | The page that loads everything |
| `src/main.js` | Game settings (size, 30 fps, scaling) |
| `src/map.js` | Layout of the house, lawn and cornfield, and how they're drawn |
| `src/PrologueScene.js` | The story, movement, light, noise, lure and ending. Easy-to-tweak numbers are in `TUNING` at the top. |
| `src/UIScene.js` | Joystick, ACT and LANTERN buttons, caption box |
| `src/StartScene.js`, `src/EndScene.js` | Start screen and title or restart screen |
| `src/sfx.js` | All sound effects, generated in code |
| `src/controls.js` | Shared state used by the touch and keyboard controls |
| `manifest.webmanifest`, `icon-*.png` | Lets you add the game to your home screen as a fullscreen landscape app |

## How to run it

### On your phone (GitHub Pages)
Once the files are in a GitHub repository with Pages turned on, the game is at
`https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`. Open that in Chrome on your phone.
Every time new files are pushed, the same link shows the new build within a minute or two.
If you still see the old build, close the tab and open the link again.

Optional: in Chrome, tap ⋮ → **Add to Home screen**. The game then opens fullscreen and in landscape, like an app.

### On a computer
Double-click `index.html`. It works straight from the folder. Click to start.
