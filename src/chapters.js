// The story, chapter by chapter. Each chapter is a list of steps; the game
// saves which step you're on. Each step sets up who is where first, so a
// saved game can carry on from the start of any step.
//
// start: where Michael begins (tile). night: true for nights (lantern, the
// creature). reach: the tile column it can't go past. lures: whether it may
// try to lure you.
const CHAPTERS = {

  // ---------------- Day 1: Homecoming ----------------
  day1: {
    start: [12, 5],
    setup(c) {
      if (c.has('arrived')) c.makeCar('red', PARK_RED.x, PARK_RED.y, 90);
      if (c.has('beetle')) c.makeCar('beetle', PARK_BEETLE.x, PARK_BEETLE.y, 90);
      c.cast({ spike: [27, 14] });
    },
    steps: [
      // The red car on the dirt road, as a police car speeds past.
      async (c) => {
        c.setCutscene(true);
        c.player.setVisible(false);
        const car = c.makeCar('red', -60, 36);
        const police = c.makeCar('police', 64 * T, 22, 180);
        c.camFollow = car;
        const engine = SFX.loop('engine', 0.35);
        const siren = SFX.play('engine', { loop: true, vol: 0.25, rate: 1.5 });
        c.say('Day 1. The dirt road to Pa\'s farm, outside Marrowfield.', 4000);
        c.drive(police, [[-80, 22]], 200).then(() => { siren.stop(0.5); police.destroy(); });
        await c.drive(car, [[PARK_RED.x, 36], [PARK_RED.x, PARK_RED.y, 90]], 60);
        engine.stop(0.8);
        c.flag('arrived');
        await c.wait(600);
        c.placeMichael(12, 5, -1, 0);
        c.player.setVisible(true);
        c.camFollow = null;
        SFX.play('door', { vol: 0.5 });
        await c.wait(500);

        c.cast({ jenny: [9, 8] });
        await c.walkNPC('jenny', [[9, 6], [11, 5]], 80);
        await c.talk([
          ['JENNY', 'Michael!'],
          [null, 'She runs to him and throws her thin arms around him.'],
          ['JENNY', "It's been so long."],
          ['MICHAEL', 'Two years, Jen. Too long.'],
        ]);
        c.cast({ walter: [9, 8] });
        await c.walkNPC('walter', [[9, 6]], 30);
        await c.talk([
          ['PA', 'Son.'],
          [null, 'Pa hugs him. He feels thinner than last time.'],
          ['PA', 'Come inside. Jenny\'s made coffee.'],
        ]);
        await Promise.all([
          c.walkNPC('jenny', [[9, 6], [9, 9], [10, 11]], 60),
          c.walkNPC('walter', [[9, 9], [8, 11]], 40),
        ]);
        c.setCutscene(false);
        c.objective('catchup', 'Catch up with Pa and Jenny in the living room.');
      },

      // The news about Mr Jacobs.
      async (c) => {
        c.cast({ jenny: [10, 11], walter: [8, 11] });
        await c.waitFor(() => c.inRoom('living'));
        await c.talk([
          ['MICHAEL', 'I passed a police car on the road. What were they doing out here?'],
          [null, 'Jenny looks at Pa, then back at Michael.'],
          ['JENNY', 'Remember Mr Jacobs?'],
          ['MICHAEL', 'Of course.'],
          ['JENNY', 'He and both his grandsons were killed last night.'],
          ['MICHAEL', 'Killed? How?'],
          ['PA', "The police won't say. Ruth Hale found them this morning, poor woman."],
          ['JENNY', "They think someone's been hiding out in our corn."],
          ['PA', 'Bring your bags in, son. Your room\'s just how you left it.'],
        ]);
        c.complete('catchup');
        c.clue('jacobs', 'Mr Jacobs', 'Henry Jacobs and both his grandsons were killed last night. Ruth Hale, the housekeeper, found them. The police think someone is hiding in the corn. He was one of Pa\'s oldest friends.');
        c.objective('bags', 'Fetch your bags from the car.');
      },

      async (c) => {
        c.cast({ jenny: [10, 11], walter: [8, 11] });
        await c.waitAct(PARK_RED.x, PARK_RED.y, 28);
        c.say('Two suitcases and a briefcase with his laptop.', 2500);
        c.complete('bags');
        c.objective('room', 'Take your bags to your old room (the green one) and unpack: the bed or the wardrobe.');
      },

      async (c) => {
        c.cast({ jenny: [10, 11], walter: [8, 11] });
        // (repeat the note's wording here so older saves get the clearer version)
        c.objective('room', 'Take your bags to your old room (the green one) and unpack: the bed or the wardrobe.');
        const used = await c.waitActAny([[5 * T, 21 * T], [9 * T + 8, 24 * T + 8]], 30);
        c.say(used === 0
          ? 'He drops the bags on the bed. Same dark green walls. Same bed, not slept in for two years.'
          : 'He hangs his things beside his old clothes, too small now. Same dark green walls.', 4000);
        c.complete('room');
        await c.wait(3800);
        c.objective('write', 'Set up your laptop at the kitchen table.');
        c.time.delayedCall(4000, () => c.say('(Have a look around the house first, if you like.)', 3000));
      },

      // He starts writing. Then a car horn.
      async (c) => {
        c.cast({ jenny: [10, 11], walter: [8, 11] });
        await c.waitAct(BOARD.x, BOARD.y, 30);
        await c.talk([
          [null, 'He opens the laptop at the kitchen table. The first chapter comes easily.'],
          [null, "He feels guilty. It's about Mr Jacobs. But who has to know?"],
        ]);
        c.complete('write');
        c.clue('novel', 'The new novel', "I started writing today. It's about the murders. Nobody needs to know that.");
        SFX.play('horn', { vol: 0.6 });
        c.say('A car horn, out front.', 2500);
        const beetle = c.makeCar('beetle', 80 * T, 36, 180);
        c.objective('visitors', 'See who has arrived.');
        c.walkNPC('jenny', [[9, 9], [9, 6], [12, 6]], 80);
        const engine = SFX.loop('engine', 0.2);
        engine.src.playbackRate.value = 1.3;
        await c.drive(beetle, [[PARK_BEETLE.x, 36, 180], [PARK_BEETLE.x, PARK_BEETLE.y, 90]], 70);
        engine.stop(0.6);
        c.flag('beetle');
        SFX.play('horn', { vol: 0.5 });
      },

      // Jason and Jean.
      async (c) => {
        c.cast({ jenny: [12, 6], jason: [15, 5], jean: [15, 6], walter: [8, 11] });
        await c.waitFor(() => c.near(PARK_BEETLE.x, PARK_BEETLE.y + 16, 5 * T));
        await c.talk([
          ['JENNY', 'Michael, this is Jason. Jason Dannon. And his sister, Jean.'],
          ['JASON', "Man. Jenny said you were big. I didn't expect Arnold Schwarzenegger."],
          ['MICHAEL', 'I work out a bit.'],
          [null, 'Jean gives him a shy smile, then looks away.'],
          ['JEAN', 'Hi.'],
          ['JENNY', "Come inside, both of you. Pa's dying to meet you."],
        ]);
        c.complete('visitors');
        c.clue('guests', 'Jason and Jean', "Jenny's boyfriend Jason Dannon and his sister Jean, staying for a week. Jean barely said a word.");
        c.objective('dinner', 'Dinner at the kitchen table.');
        await Promise.all([
          c.walkNPC('jenny', [[9, 6], [9, 9], [17, 11]], 60),
          c.walkNPC('jason', [[9, 5], [9, 9], [17, 12]], 60),
          c.walkNPC('jean', [[9, 6], [9, 9], [22, 12]], 60),
          c.walkNPC('walter', [[14, 11], [22, 11]], 40),
        ]);
      },

      // Dinner, and Pa's rule.
      async (c) => {
        c.cast({ jenny: [17, 11], jason: [17, 12], jean: [22, 12], walter: [22, 11] });
        await c.waitFor(() => c.inRoom('kitchen'));
        c.setCutscene(true);
        await c.fadeOut(600);
        c.placeMichael(19, 13, 0, -1);
        await c.fadeIn(600);
        const choice = await c.talk([
          [null, 'Dinner. Scrambled eggs, and nobody says much.'],
          ['PA', "While you're all here, there's one rule."],
          ['PA', 'Nobody goes into the corn. Not until the police are done.'],
          ['JASON', 'Yes, sir.'],
          ['JENNY', 'Pa...'],
          ['PA', 'Nobody, Jen.'],
          ['MICHAEL', '...', ['All right, Pa.', "Why? What's in the corn?"]],
        ]);
        if (choice === 1) {
          c.flag('askedAboutCorn');
          await c.talk([
            ['PA', 'Police tape and mud. Eat your dinner.'],
            [null, 'He does not look up from his plate.'],
          ]);
        }
        c.complete('dinner');
        c.clue('rule', "Pa's rule", 'Nobody goes into the corn. Not until the police are done.');
        await c.wait(1500);
        await c.endChapter('night1');
      },
    ],
  },

  // ---------------- Night 1: Lock up ----------------
  night1: {
    night: true,
    reach: 33,      // tonight it stays in the corn
    lures: false,
    start: [19, 13],
    setup(c) {
      c.makeCar('red', PARK_RED.x, PARK_RED.y, 90);
      c.makeCar('beetle', PARK_BEETLE.x, PARK_BEETLE.y, 90);
      c.cast({ spike: [27, 15], jenny: [13, 22], jason: [6, 12], jean: [9, 12] });
      c.powerOn = c.has('generator');
    },
    steps: [
      async (c) => {
        c.setCutscene(true);
        c.cast({ walter: [22, 11] });
        c.placeMichael(19, 13, 0, -1);
        await c.wait(800);
        const choice = await c.talk([
          [null, 'Night 1.'],
          ['PA', "Power's gone again. The storm did something to the lines."],
          ['PA', 'Lock up for me, son. Every window, and the front door.'],
          ['PA', 'Then check the generator in the shed.'],
          ['MICHAEL', '...', ['Sure, Pa.', 'In the dark? You always did that yourself.']],
        ]);
        if (choice === 1) {
          c.flag('pressedPa');
          await c.talk([['PA', "I'm old, Michael. Just... take the lantern."]]);
        }
        await c.talk([['PA', 'And stay out of the corn.']]);
        await c.walkNPC('walter', [[20, 13], [19, 15], [19, 17], [21, 17], [21, 20]], 40);
        c.setCutscene(false);

        const toLock = ['frontDoor', 'livingWindow', 'kitchenWindow', 'michaelWindow', 'paWindow'];
        const count = () => toLock.filter(id => c.locks.has(id)).length;
        c.objective('lock', `Lock the windows and the front door (${count()}/5).`);
        for (const id of toLock) {
          if (c.locks.has(id)) continue;
          const o = OPENINGS[id];
          // doors lock from the inside (stand there); windows from the window itself
          const at = o.door ? [o.stand[0] * T + 8, o.stand[1] * T + 8, 14] : [o.tile[0] * T + 8, o.tile[1] * T + 8, 26];
          c.waitAct(...at).then(() => {
            c.lock(id);
            c.objective('lock', `Lock the windows and the front door (${count()}/5).`);
            c.say(`Locked ${o.name}.`, 1500);
          });
        }
        await c.waitFor(() => count() === toLock.length);
        c.complete('lock');
      },

      // The generator. Spike growls at the corn. Once, briefly, the crickets stop.
      async (c) => {
        c.cast({ walter: [21, 20] });
        c.objective('gen', 'Check the generator in the shed.');
        c.time.delayedCall(2000, () => c.say('Out the back door. Take the lantern.', 3000));
        c.waitFor(() => c.inRoom('porch') || c.inRoom('yard')).then(() => {
          SFX.play('growl', { vol: 0.45, rate: 1.9 });
          c.say('Spike growls at the corn, low and steady.', 3000);
        });
        c.waitFor(() => c.inRoom('yard') && c.hy > 27 * T).then(() => {
          const cr = c.creature;
          cr.x = 34 * T + 8;
          cr.y = Phaser.Math.Clamp(c.hy, 10 * T, 35 * T);
          cr.startHunt();   // it comes to the edge of the corn... and can come no further tonight
        });
        await c.waitAct(17 * T + 8, 31 * T + 8, 24);
        SFX.play('generator', { vol: 0.7 });
        c.powerOn = true;
        c.flag('generator');
        c.say('It coughs, then catches. The house lights come back on.', 3500);
        c.complete('gen');
        c.objective('back', 'Go back inside and lock the back door.');
      },

      async (c) => {
        c.cast({ walter: [21, 20] });
        c.powerOn = true;
        await c.waitAct(24 * T + 8, 11 * T + 8, 14);
        c.lock('backDoor');
        c.say('Locked the back door.', 1500);
        c.complete('back');
        c.objective('bed', 'Go to bed.');
      },

      async (c) => {
        c.cast({ walter: [21, 20] });
        await c.waitAct(5 * T, 21 * T, 30);
        c.setCutscene(true);
        await c.talk([
          [null, 'The house ticks and settles.'],
          [null, 'Out in the field, the crickets stop. Then, after a long moment, they start again.'],
        ]);
        c.complete('bed');
        await c.endChapter('day2');
      },
    ],
  },
};
