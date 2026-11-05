# Stay Away from the Cornfield

A 2D top-down pixel-art survival horror game for Android phones (played in the browser).
Based on David Braz's 2002 short story. The full plan is in the game design document
("Stay Away from the Cornfield — Game Design").

**Play it:** https://dvdbraz-bot.github.io/Cornfield/ (open in Chrome on an Android phone, landscape, with headphones).
The start screen offers **Continue** (if there's a save), **New game** (the prologue, then Day 1), **Chapters**, and the **Test night** (Milestone 2).

**Chapters:**
- **Unlocking:** each chapter unlocks the first time you reach it. A save from before Chapters existed counts too.
- **Playing:** tap an unlocked chapter to play it from its beginning. This replaces your saved game.
- **Storage:** unlocks are stored separately from the save, so a new game doesn't lock them again.
- **Testing shortcut:** tap "Play with headphones." five times to unlock every chapter that's built.

Coloured shapes stand in for the art (grey-box), until David's drawings replace them one by one (see **Milestone 3** below). All sounds are generated in code as placeholders.

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

## Milestone 3: placeholder art and real sound (started)
**Art slots** (`src/art.js`). Every map tile, person (and Spike) and object that's drawn in code has a PNG file in `assets/`, in three folders: `tiles/`, `people/` and `objects/`. There are 77 slots.
- **The full list,** in the order to draw them (what's on screen most first), with each file's size, what it is and where it appears, is in [`assets/ART-LIST.md`](assets/ART-LIST.md).
- **The colours to use:** [`assets/palette.png`](assets/palette.png) has 24 dark, muted colours for night-time horror. Their codes are in ART-LIST.md.
- **Sizes:** tiles are 16 x 16. People are a 64 x 16 strip of four 16 x 16 frames: facing down, up, left, right. Objects are their own sizes (in the list). Cars are drawn facing right.
- **Two pictures for one thing:** the corn has a second, see-through picture for the leaves drawn over people (`tiles/corn-tops.png`). The creature's red eyes are separate from its body, because they shine through the dark. Windows and doors have overlays for locked, boarded and smashed.
- **Placeholders:** each file starts as the grey-box drawing, exported at the exact size, so it can be opened in Piskel.
- **How the game chooses:** when the game starts, it loads every PNG. While a file is still exactly the placeholder, the game keeps drawing that thing in code (which varies a little from tile to tile). As soon as the file is different (a real drawing), the game uses the picture. A missing, broken or wrong-sized file never breaks the game: missing or broken ones fall back to the code, and a wrong-sized one is stretched to fit (with a warning in the browser console).
- **Updates show quickly:** the pictures are re-fetched every minute, so a new drawing appears soon after GitHub Pages republishes.
- **Still drawn in code:** effects that move or change colour (the lantern, TV flicker, police lights, fire, splashes, noise rings, puddles, the kill), and the on-screen controls and notebook.
- **Re-exporting:** `node tools/export-art.js` writes any missing placeholders, `palette.png` and `ART-LIST.md` from the slot list. It never overwrites an existing PNG (it might be David's drawing) unless given `--force`.
- **The Jacobs' taped-off front door** now draws its yellow tape in whole pixels (crisper), so its placeholder is identical on every phone.

Real sound is next.

## Milestone 4: the farm and its systems ✅ (with Day 1 and Night 1 to run them)

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
3. Crossing the yard, the crickets stop and something moves at the edge of the corn. Then the crickets start again.
   - **Tonight it's felt, never seen,** and it can't hurt you (`Stalker` in `src/Creature.js`, with its numbers in `STALKER`).
   - **In the corn,** it keeps pace with Michael just beyond his lantern light, behind him and to one side. It rustles from that side, the crickets around him stay silent, and now and then it edges in until stalks move at the rim of the light and his heartbeat quickens.
   - **With the lantern off,** it comes closer. Walk at it and it backs away.
   - **Too deep** (10 tiles in): everything goes silent, it crashes through the corn right behind him, and he thinks "Get out of the corn." 
4. The generator brings the power back, then lock the back door and go to bed. The next chapter would be Day 2.

## Milestone 5: Days 1-3 ✅
Day 1 and Night 1 are above. Added in this build:

**The Jacobs farm**, on the far side of the field, reached by the long road round (Pa's rule keeps Michael out of the corn by day). Ruth Hale sits on the porch and leaves after talking to Michael. The front door is crossed with police tape: Michael can't walk through it, but once Ruth has gone he can duck under it (ACT). Inside, the Snakes and Ladders board is still laid out.

**Day 2: Spike**
1. Breakfast. Detective Anna Venn arrives in a police car and interviews the family in the living room. She sees the first line on Michael's laptop: "Mr Jacobs. Already?" (with a choice). "Don't leave Marrowfield, Mr Cole."
2. The long road round to the Jacobs farm. Ruth: "Stay away from the cornfield, Mr Cole. Those old men used to go in there at night. Years ago. I saw the lanterns." Then look inside: the board, a three on the die, and a clean square in the dust where the carved stone used to sit.
3. Home: Spike barks at the field and bolts. Chase him through the corn in daylight, where the stalks hide anything more than a few tiles away.
   - His barks **move** as he runs (a real voice moves).
   - A yelp, then nothing.
   - He's dead at the edge of the clearing, beside the ring of twelve carved stones.
   - Jenny: "Who did this?"
4. Evening: they bury him by his kennel. "May he rest in peace." *More like rest in pieces, Michael thinks, and hates himself for thinking it.*

**Night 2: Jason** (played as Jason; the notebook is Michael's, so it's hidden). About 2-3 minutes.
1. Spike barks from one spot at the edge of the corn, the same bark every 6 seconds. Spike was buried this evening.
2. When Jason reaches the spot it goes quiet, then calls again from a new spot further in. It does this three times, drawing him towards the centre. Each call comes from one spot that never moves.
3. Near the centre: silence, the crickets stop. "Which way was the house?"
4. **The endless cornfield:** the field changes to corn that never ends (`ENDLESS_MAP`).
   - It repeats seamlessly. When Jason strays from the middle, the game quietly moves him, and anything near him, back by one repeat.
   - A faint house light glows at the edge of the screen and never gets closer.
   - Something keeps pace just beyond his torch, rustling, and his heartbeat builds the whole time.
   - His thoughts: "This row should end soon." / "It's right behind me." / "It doesn't end."
   - Spike's bark comes once more from right behind him, and his torch starts to fail.
5. About a minute in, it closes in, and then the hand.

**Day 3: Jason is missing**
1. Breakfast: "Anyone seen Jason?" By three o'clock he still isn't back, and Jenny goes into the corn whatever Pa says. Pa: "Then Michael goes with you."
2. **The search:** Jenny follows Michael through the field, calling for Jason. They find **Jason's torch** between the rows, still on. A crow strikes Jenny's head: "Just a bird." The police search all afternoon and find nothing. Jenny: "They've got him."
3. **Jean**, in the living room: the engagement ring from Jason's bag. She's a nurse: "Your father isn't in shock. He's afraid." (with a choice)
4. **Supper:** a carved stone smashes through the kitchen window. Pa pockets it: "It's nothing." Its carvings match the ring in the field (a clue in the notebook).

**Night 3: Jenny, come here**
- Jason's voice calls from the first row of the corn: "Jenny. Come here." It's the same words from the same spot every time. Jenny runs out.
- **The chase:** Jenny runs down the lawn towards Jason, who stands in the first row holding his own head.
  - Catch her before she reaches the corn. She's faster than Michael walks, so you have to run.
  - If she gets in, the chase starts again.
  - She catches the moonlight, so you can see her in the dark.
- Michael: "You were dreaming, Jen. Come inside."

**Interlude: Jenny** (played as Jenny)
- Later, she slips out alone. Jason stands on the lawn, whole and smiling, calling her name.
- She holds him. His eyes turn red. He turns her round, and she can't move. Then the hand.

## Milestone 6: Days 4-7, the finale and the endings ✅

**Day 4: On the lawn**
1. Dawn: Jean screams. Jason and Jenny lie on the lawn by the porch, not in the corn, so its reach has grown.
2. The police take Michael in. **The interview room** at Marrowfield police station is a new room on the map.
   - Detective Venn reads his notebook aloud, quoting the clues he actually wrote.
   - Four questions with dialogue choices. How honest you are is remembered (`vennTrust`) for later.
3. Released at dusk. Pa drives him home in his old pickup. Neither of them says a word.

**Night 4: The dead grass** (the first real stealth night)
- The power fails. Pa: "Whatever you do, don't cross the dead grass."
- **Its reach** now comes out of the corn to a line of withered grass in the yard (`reach: 19`), and the shed with the generator is just past it. The full hunting creature from the test night appears here for the first time in the story.
- **Spike's bark** calls from the corn. It only has its dead (`lureVoices`).
- **Lamp oil is low** (about a minute of light), with a can of oil in the shed.
- **Indoors is safe:** the creature never goes indoors, and it can't see you through walls.
- **If it catches you,** you go back to the last save. Reaching the house saves.

**Day 5: The cupboard**
1. **The funeral** in Marrowfield's cemetery, a new place on the map: two graves, Jason and Jenny. Venn watches from the back.
2. **Ruth hands Michael Henry's parcel:** a black book, and a letter: "If I die, burn it. Walter knows how."
3. Pa drives Jean to the bus. Alone, Michael finds the old iron key under Pa's mattress and opens the garage cupboard: the black robe, more carved stones, and the photograph of Pa, Henry and other robed men around a goat's head on a pole.
4. **The confrontation** (with choices): Pa admits the Circle, the scroll in the field, calling it up, losing control of it, the stones and the books. Then he lies about Ma: "A farm accident." He won't look at you.

**Night 5: Holy water** (its reach now covers the whole yard, shed and all)
1. Jean comes back: she couldn't get on the bus. "Is there anything of hers left in this house?"
2. **The attic, with Jean.** She follows Michael up the ladder. Ma's diary explains the stones, the books, and holy water and fire. The barrel is hers.
3. **Michael dunks Henry's book** in the holy water, and the whole field screams. It takes its revenge: three stones are torn out of the ring (12 → 9). This shows in the notebook, and as raw holes in the ring itself.
4. **Detective Venn** arrives alone.
   - Flash the lantern at her from a front window. She doesn't understand, and she comes round the back.
   - She dies at the edge of the yard.
   - What she calls out depends on how honest you were in the Day 4 interview: "Michael! I see it. I believe y-"
   - Her torch lies in the grass, still shining.

**Day 6: The whole truth** (a storm: rain, thunder, the road flooded, the power and phone lines down)
1. **Pa tells the whole truth.** The Circle's victims were farmhands and drifters nobody came looking for, and Ruth's brother was one of them. It killed Ma in the corn when she found out. **You choose whether Michael forgives him** (remembered as `forgave`).
2. **Prepare for the siege**, in any order:
   - Fetch planks from the garage and board up the four windows.
   - Gather three cans of lamp oil (garage, shed, kitchen).
   - Fill three vials from the holy water barrel in the attic.

**Night 6: Faces at the window** (the siege; Michael stays indoors)
- **Three oil lamps** (living room, hall, kitchen) burn down. ACT at a lamp to refill it from the oil you gathered. If they all go out, it gets in.
- **Faces at the window:** Jenny's face with red eyes at the kitchen window, then the living room ("Michael. Let me in."), then Ma at Michael's window ("Michael. Come see.").
  - The voice moves from window to window now, but it repeats itself word for word.
  - **Jean is drawn to the windows.** Walk up to her and press ACT to pull her back. If she stands at the boards too long, they burst inward.
- **It tries the doors:** hide in your old wardrobe or under Jenny's bed.
  - It walks through the house. Hold ACT to hold your breath when it's near: if it hears you breathing, it finds you.
  - **Holy water:** if it's within 3 tiles, ACT throws a vial and drives it back (3 vials).
- **Near dawn,** Pa walks out to the edge of the field with his shotgun. If you forgave him, he says "Look after Jean, son." first. Then "Time to join the master." One shot. His book can now be destroyed without anyone else dying.

**Day 7: The last day**
- Gather what Ma's diary says it takes, in any order:
  - refill the holy water vials (attic)
  - petrol (shed)
  - matches (kitchen)
  - Ma's crucifix (Pa's cupboard)
  - Ma's rosary (the drawer in Michael's old room)
- Dunk Pa's book, and the field screams again.
- **(Optional) The names of the Circle's victims**, for the true ending, hidden in what they left behind:
  - the back of the photograph in the garage cupboard (3)
  - Ma's diary in the attic (3)
  - Pa's ledger under his mattress (3, plus Ruth's brother)
  - the back of Henry's letter on the kitchen counter (2)
  - Pa names Ruth's brother, Samuel, on Day 6.

  The notebook's Clues tab counts them: "The forgotten (n of 12)".

**Finale: Come and get me**
1. **Into the corn with Jean** at nightfall, to the stone ring. It hunts you:
   - It wears Pa ("Son. Come home, son."), then Jenny ("Michael. I'm scared.") as you get closer, then its own face.
   - Keep your lantern on it, and throw holy water (ACT) when it's close.
   - **Jean** is safe while she's close to you and in your light. Run and she falls behind, and it can take her.
2. **At the ring** (ACT at the centre): pour the petrol over Pa's book, light it, and set down Ma's crucifix. The book bleeds.
3. **The prayer:** hold ACT through each line of the Our Father (seven lines).
   - While you pray you can't turn, and it circles round towards your back.
   - Let go to turn and face it with the lantern, which pushes it back.
   - If it stays right behind you, it's over (back to the last save).
4. After "Amen", the book crumbles, its skin peels away, and the ground opens. The crickets begin again.

**The endings** (cards, using the story's closing lines):
- **Dawn** (Jean lives): they walk out of the corn at sunrise. A year later, an interviewer asks what inspired the novel. "Just a visit to my father's farm." *If only they knew.*
- **Alone** (Jean was taken): the same, with an empty chair beside him.
- **Remembered** (all 12 names found): after the interview, Ruth Hale reads the twelve names aloud, her brother's last.
- Every ending closes on the same sting: years later, a new farmer ploughs the field and turns up a carved stone.

**The victims** (`VICTIMS` and `VICTIM_NOTES` at the top of `src/chapters.js`). These are farmhands and drifters nobody came looking for. Ruth reads each one out with who he was:

| Name | Who he was | Found |
|---|---|---|
| Walt Ainsley | harvest hand | the back of the photograph |
| Eddie Morrow | played the harmonica | the back of the photograph |
| Joseph Kell | Pa's hired man | the back of the photograph |
| Abel Ruiz | came for the picking | Ma's diary |
| Ned Calloway | stayed one summer | Ma's diary |
| Thomas Rook | slept in the Jacobs barn | Ma's diary |
| Harlan Pike | mended fences | Pa's ledger |
| Micah Dunn | sixteen years old | Pa's ledger |
| Owen Lacey | walked in from the railway | Pa's ledger |
| Luca Benedetti | sent his wages home | Henry's letter |
| Frank Toller | the Jacobs' cattle hand | Henry's letter |
| Samuel Hale | Ruth's brother | Day 6 (Pa) and Pa's ledger |

## Controls
- **Phone:** touch the left half of the screen to make a joystick appear under your thumb. Push it to the edge to run. On the right are a big **ACT** button (it glows when something can be used) and a smaller **LANTERN** button above it (at night). **NOTEBOOK** is at the top right. In dialogue, tap anywhere to continue, or tap a choice. To face a direction without walking far, nudge the joystick that way.
- **Computer:** WASD or arrow keys to move, Shift to run, E or Space = act (hold it to hold your breath), F = lantern, N = notebook, G = debug view (test night). In dialogue: E / Enter to continue, 1-3 to choose. On the start screen: 0 = Continue, 1 = New game, 2 = Chapters (then a number to pick one, Esc to go back), 3 = Test night.

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
| `src/art.js` | The art slots: every picture's file name and size, its grey-box placeholder, the palette, and loading David's drawings from `assets/` |
| `assets/` | The pictures (`tiles/`, `people/`, `objects/`), `palette.png` and `ART-LIST.md` |
| `tools/export-art.js` | Writes the placeholder PNGs, the palette and ART-LIST.md from `src/art.js` |
| `src/controls.js` | Shared state between the controls, the game and the on-screen displays |
| `manifest.webmanifest`, `icon-*.png` | Lets you add the game to your home screen as a fullscreen landscape app |

## How to run it
- **On your phone:** open https://dvdbraz-bot.github.io/Cornfield/ in Chrome. Use a capital C, because the link is case-sensitive. New builds appear there a minute or two after they're pushed. Optional: tap ⋮ → **Add to Home screen** to open it fullscreen, like an app.
- **On a computer:** double-click `index.html`.

## Next (from the design doc)
**The whole story is playable in grey-box**, from the prologue to all three endings.

What's left:
1. **Polish the concept:** playtest notes, difficulty tuning, and the real victims' names.
2. **Milestone 3 / 7: art and audio.** The art slots are in: David draws the pictures in Piskel, one at a time (`assets/ART-LIST.md`). Next: real sound effects, walking animation, then the final art and audio.
3. **Milestone 8: the Android app.** Wrap it with Capacitor, add the icon and splash screen, and test on a cheap phone and a good one for 30 minutes to check it stays cool.
4. **Milestone 9: Google Play.** Developer account, the 12-tester closed test for 14 days, and the age rating.

Before release: remove the five-tap "unlock all chapters" testing shortcut, or keep it as a hidden extra.

## For future sessions
- `docs/story.md` is the original 2002 short story. `docs/design.md` is the game design document, with its diagrams in `docs/media/`. David's original Word files are in `docs/` too.
- `CLAUDE.md` holds the working notes for Claude: how David likes to work, the workflow, lessons learned, and what's next.
- `tests/` holds the automated playthroughs. Run them all with `bash tests/run-all.sh` (needs Playwright, which Claude's cloud sessions already have).
