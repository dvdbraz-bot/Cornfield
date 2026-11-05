# Stay Away from the Cornfield: notes for Claude

Read README.md first: it records everything that's built, chapter by chapter, and where every tuning number lives.

## Who you're working with
- David Braz, the author. The game is adapted from his 2002 short story and his design document ("Stay Away from the Cornfield — Game Design"). He doesn't code.
- Explain anything he must do himself in plain, numbered steps.
- **Always end answers with sources** (his story, his design doc, GitHub, web pages), or say none were used.
- He plays every build on his Android phone in Chrome, at https://dvdbraz-bot.github.io/Cornfield/ (capital C: the link is case-sensitive).

## How we work
1. Build one section at a time, in grey-box (coloured shapes, sounds generated in code).
2. Test it in headless Chrome (Playwright is pre-installed) shaped like a phone in landscape. Check screenshots. Run the existing tests in `tests/` to catch regressions: `bash tests/run-all.sh`.
3. Commit to `main` and push; GitHub Pages republishes in about a minute. Confirm with
   `curl -sS "https://api.github.com/repos/dvdbraz-bot/Cornfield/actions/runs?per_page=1"` (look for the new commit and "conclusion": "success").
4. Update README.md with what changed.
5. Tell David what's new, what you tested, which lines/details you invented (so he can check them against his story), and what's next.

## The code in one minute
- Plain JavaScript + Phaser 4.2.1 (in `lib/`), no build step. 480x270, pixelArt, 30 fps.
- `src/chapters.js` is the story: each chapter is a list of async steps using helpers in `src/ChapterScene.js` (talk, objective, clue, waitAct, waitFor, cast, walkNPC, setCutscene, lock, endChapter...). The game saves the step number, so **each step must set up who/what it needs at its start** (so a saved game can resume there).
- `src/Creature.js`: the creature's brain (6 states) and `Stalker` (felt, never seen). `src/FieldScene.js`: shared movement, noise, lantern/darkness, bubbles, the kill. `src/UIScene.js`: touch controls, dialogue, notebook. `src/map.js`: all maps.
- Chapter order and names: `Unlocks.ORDER` and `CHAPTER_NAMES` in `src/save.js`.

## Lessons learned (bugs David hit on his phone)
- Test with **touch**, not just the keyboard: a bug once left the joystick hidden after every dialogue. `tests/touch-controls.js` covers it.
- Test the awkward cases a real player hits: standing in doorways (a door once locked Michael inside itself), objects too close together (ACT picks the nearest), things placed out of the lantern's light, people the player can't see in the dark (give them `c.glow`).
- Make objectives say exactly where and what ("the kitchen's right-hand wall").
- The UI scene starts one frame after a chapter: wait for it (`runSteps` already does).
- In Playwright, the start screen needs real clicks (`page.mouse.click`), not fake touches.

## What's next (David's call on the order)
- His full playthrough on the phone, then fixes and difficulty tuning.
- Placeholder pixel art and real sound, then final art (asset packs or an artist).
- The Android app (Capacitor), then Google Play (12-tester closed test for 14 days, IARC age rating).
- Before release: remove the five-tap "unlock all chapters" testing shortcut on the start screen (or keep it as a hidden extra).
