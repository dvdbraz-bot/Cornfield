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
    creature: 'stalker', // felt, never seen; it does not attack tonight
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
        c.objective('gen', 'Check the generator in the shed. Out the back door in the kitchen, then across the yard.');
        c.time.delayedCall(2000, () => c.say("Out the back door (the kitchen's right-hand wall, onto the porch), then across the yard to the shed.", 5000));
        c.waitFor(() => c.inRoom('porch') || c.inRoom('yard')).then(() => {
          SFX.play('growl', { vol: 0.45, rate: 1.9 });
          c.say('Spike growls at the corn, low and steady.', 3000);
        });
        // Crossing the yard: something moves at the edge of the corn, and the crickets stop.
        c.waitFor(() => c.inRoom('yard') && c.hy > 27 * T).then(() => c.creature.yardMoment());
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
  // ---------------- Day 2: Spike ----------------
  day2: {
    start: [19, 13],
    setup(c) {
      c.makeCar('red', PARK_RED.x, PARK_RED.y, 90);
      c.makeCar('beetle', PARK_BEETLE.x, PARK_BEETLE.y, 90);
      if (!c.has('spikeDead')) c.cast({ spike: [27, 14] });
      // Things to look at in the Jacobs farmhouse.
      // The taped front door: you can't walk through it. Duck under the tape (ACT),
      // but not while Ruth is watching.
      const tape = async (fromTy, toTy) => {
        if (c.npcs.ruth) { c.say('Not with Mrs Hale watching.', 2500); return; }
        await c.duckUnder(fromTy, toTy, 85);
      };
      c.interactables.push(
        { x: 85 * T + 8, y: 8 * T + 8, r: 20, when: () => c.hy < 9 * T, act: () => tape(8, 10) },
        { x: 85 * T + 8, y: 10 * T + 8, r: 20, when: () => c.hy > 9 * T, act: () => tape(10, 8) },
      );
      c.look(83, 11, 'A clean square in the dust on the counter, where something used to sit.', 22);
      c.look(90, 12, "Henry's armchair, facing the TV.", 22, 2500);
    },
    steps: [
      // Breakfast. Detective Venn arrives.
      async (c) => {
        c.setCutscene(true);
        c.placeMichael(19, 13, 0, -1);
        c.cast({ jenny: [17, 11], jason: [17, 12], jean: [22, 12], walter: [22, 11] });
        await c.wait(800);
        await c.talk([[null, 'Day 2. Breakfast. Nobody slept much.']]);
        const car = c.makeCar('police', -60, 36);
        c.camFollow = car;
        const engine = SFX.loop('engine', 0.3);
        await c.drive(car, [[17 * T, 36], [17 * T, 4.5 * T, 90]], 70);
        engine.stop(0.6);
        SFX.play('door', { vol: 0.5 });
        c.cast({ venn: [16, 5] });
        await c.walkNPC('venn', [[12, 6], [9, 6], [9, 9], [10, 11]], 45);
        c.camFollow = null;
        c.walkNPC('walter', [[20, 13], [14, 12], [8, 11]], 45);
        await c.talk([['PA', "That'll be the police. Michael, come and sit with us."]]);
        c.setCutscene(false);
        c.objective('venn', 'Detective Venn is waiting in the living room.');
      },

      // The interview.
      async (c) => {
        c.cast({ venn: [10, 11], walter: [8, 11], jenny: [17, 11], jason: [17, 12], jean: [22, 12] });
        await c.waitFor(() => c.inRoom('living'));
        const choice = await c.talk([
          ['DETECTIVE VENN', "Anna Venn, Marrowfield police. I'm talking to everyone along the field."],
          ['DETECTIVE VENN', 'Sunday night. Did anyone see anything? Lights in the corn? A car on the road?'],
          ['PA', 'We were in bed by ten.'],
          ['DETECTIVE VENN', 'And you, Mr Cole? You got here yesterday.'],
          ['MICHAEL', 'Just your car, on the road.'],
          [null, 'Her eyes go past him, through to the kitchen, to the open laptop on the table and the first line on its screen.'],
          ['DETECTIVE VENN', 'Mr Jacobs. Already?'],
          ['MICHAEL', '...', ['It helps me think.', "It's just notes."]],
        ]);
        await c.talk(choice === 0
          ? [['DETECTIVE VENN', 'Then think about Sunday night. Anything you remember.']]
          : [['DETECTIVE VENN', 'Notes. Right.']]);
        await c.talk([
          ['DETECTIVE VENN', "Don't leave Marrowfield, Mr Cole."],
          [null, 'She leaves her card on the table and goes.'],
          ['MICHAEL', "I'm going over to the Jacobs place. To pay my respects."],
          ['PA', 'Take the road. Not the field.'],
        ]);
        c.complete('venn');
        c.clue('venn', 'Detective Anna Venn', "Marrowfield police. She saw what I'm writing. \"Don't leave Marrowfield, Mr Cole.\"");
        c.objective('jacobs', 'Walk the long road round to the Jacobs farm, on the far side of the field.');
        c.walkNPC('venn', [[9, 9], [9, 6], [16, 5]], 50).then(() => {
          c.cast({ venn: null });
          const car = c.cars.police;
          if (car) c.drive(car, [[17 * T, 36, 180], [-80, 36]], 90).then(() => car.destroy());
        });
      },

      // Ruth Hale on the Jacobs porch.
      async (c) => {
        c.cast({ ruth: [86, 8], walter: [8, 11], venn: null });
        await c.waitFor(() => c.near(86 * T + 8, 8 * T + 8, 3.5 * T));
        c.setCutscene(true);
        const choice = await c.talk([
          [null, 'An old woman sits on the porch, very straight, hands folded in her lap.'],
          ['RUTH HALE', "You're Walter's boy. The writer."],
          ['MICHAEL', "Mrs Hale. I'm sorry. You were the one who found them."],
          ['RUTH HALE', 'I was.'],
          ['RUTH HALE', 'Stay away from the cornfield, Mr Cole.'],
          ['RUTH HALE', 'Those old men used to go in there at night. Years ago. I saw the lanterns.'],
          ['MICHAEL', '...', ['What old men?', 'What lanterns?']],
        ]);
        await c.talk([
          ['RUTH HALE', 'Ask your father.'],
          [null, 'She stands, takes her bag, and walks off down the track without looking back.'],
        ]);
        await c.walkNPC('ruth', [[86, 6], [86, 3], [90, 2]], 35);
        c.walkNPC('ruth', [[98, 2]], 35).then(() => c.cast({ ruth: null }));
        c.setCutscene(false);
        c.complete('jacobs');
        c.clue('ruth', 'Ruth Hale', "Henry Jacobs' housekeeper. \"Those old men used to go in there at night. Years ago. I saw the lanterns.\" She said to ask Pa.");
        c.objective('inside', 'Look inside the Jacobs farmhouse. (Duck under the tape: ACT at the door.)');
        await c.waitAct(83 * T + 8, 14 * T + 16, 30);
        await c.talk([
          [null, 'The Snakes and Ladders board is still laid out on the kitchen table, the counters where the boys left them.'],
          [null, 'The die shows a three.'],
        ]);
        c.complete('inside');
        c.objective('home', 'Head home, the long road round.');
      },

      // Spike bolts into the corn. Follow him.
      async (c) => {
        c.cast({ ruth: null, walter: [8, 11] });
        await c.waitFor(() => c.hx < 31 * T && c.hy > 3 * T && c.hy < 26 * T);
        c.setCutscene(true);
        c.cast({ spike: [27, 14], jenny: [24, 11] });
        const spike = c.npcs.spike;
        const bark = (x, y) => {
          SFX.play('bark', { vol: 0.7 * Phaser.Math.Clamp(1 - Phaser.Math.Distance.Between(c.hx, c.hy, x, y) / (25 * T), 0.2, 1), pan: c.panTo(x) });
          c.bubble(x, y - 4, '(barking)', 1600, null, true);
        };
        bark(spike.x, spike.y);
        await c.wait(900);
        bark(spike.x, spike.y);
        await c.walkNPC('spike', [[31, 15], [34, 16]], 110);
        await c.talk([['JENNY', 'Spike! Spike, come back!']]);
        c.complete('home');
        c.cornAllowed = true;
        c.setCutscene(false);
        c.objective('spike', 'Follow Spike into the corn.');
        c.say("Pa's rule can wait. Listen for him: he's moving.", 3500);

        // Spike runs on ahead. His barks move as he goes: a real voice moves.
        const path = [[37, 17], [40, 18], [43, 20], [46, 21], [48, 22]];
        let barkTimer = 0;
        for (const [x, y] of path) {
          await c.waitFor(() => {
            barkTimer -= 1 / 30;
            if (barkTimer <= 0) { bark(spike.x, spike.y); barkTimer = 2.5; }
            return c.near(spike.x, spike.y, 6 * T);
          });
          await c.walkNPC('spike', [[x, y]], 70);
          bark(spike.x, spike.y);
        }
        // He reaches the clearing. A yelp. Then nothing.
        await c.walkNPC('spike', [[50, 22]], 70);
        SFX.play('yelp', { vol: 0.8, pan: c.panTo(spike.x) });
        c.cast({ spike: null });
        c.showDeadSpike();
        c.say('A yelp. Then nothing.', 3000);
        c.objective('spike', 'Find Spike.');
      },

      // Spike, at the centre of the field. The ring of stones.
      async (c) => {
        c.cornAllowed = true;
        c.showDeadSpike();
        await c.waitFor(() => c.near(50 * T + 8, 23 * T + 8, 4 * T));
        c.setCutscene(true);
        await c.talk([
          [null, 'Spike lies at the edge of a clearing in the corn.'],
          [null, 'His fur is dark and sticky. Something has been done to him that Michael will not look at twice.'],
          [null, 'Around the clearing, half buried in the earth, is a ring of carved stones.'],
        ]);
        c.cast({ jenny: [46, 22], jason: [46, 23] });
        await Promise.all([c.walkNPC('jenny', [[48, 22]], 70), c.walkNPC('jason', [[48, 23]], 70)]);
        await c.talk([
          ['JENNY', 'Spike?'],
          [null, 'Jenny screams.'],
          ['JENNY', 'Who did this?'],
          [null, 'Nobody answers.'],
        ]);
        c.flag('spikeDead');
        c.complete('spike');
        c.clue('ring', 'The stone ring', 'At the centre of the field: a ring of twelve carved stones, half buried. Spike died beside it. The carving looks like the stone on the Jacobs counter... the one that is gone.');
        await c.wait(800);
        await c.fadeOut(1500);

        // Evening. They bury him by his kennel.
        c.deadSpike && c.deadSpike.destroy();
        c.placeMichael(29, 27, 0, -1);
        c.cast({ walter: [30, 26], jenny: [28, 26], jason: [31, 27], jean: [27, 27] });
        await c.fadeIn(1500);
        await c.talk([
          [null, 'Evening. They bury Spike beside his kennel.'],
          ['PA', 'May he rest in peace.'],
          [null, 'More like rest in pieces, Michael thinks, and hates himself for thinking it.'],
        ]);
        await c.endChapter('night2');
      },
    ],
  },

  // ---------------- Night 2: Jason ----------------
  // A short, doomed scene. Spike barks from one spot that never moves (Spike
  // is dead). Each time Jason reaches the spot it goes quiet, then calls again
  // from further in, drawing him towards the centre. There, he loses his way,
  // and the field never ends.
  night2: {
    night: true,
    player: 'jason',
    reach: 33,
    lures: false,
    creature: 'stalker',
    start: [7, 11],
    setup(c) {
      c.makeCar('red', PARK_RED.x, PARK_RED.y, 90);
      c.makeCar('beetle', PARK_BEETLE.x, PARK_BEETLE.y, 90);
      c.cast({ walter: [21, 21], jenny: [13, 22], michael: [6, 22], jean: [11, 12] });
      c.flag('cornAtNight'); // no "Pa said" reminder: this is Jason
      c.powerOn = false;     // everyone's asleep
      c.creature.warned = true; // no "get out of the corn" warning tonight
    },
    steps: [
      async (c) => {
        c.setCutscene(true);
        c.placeMichael(7, 11, 0, -1);
        await c.wait(800);
        await c.talk([[null, 'Night 2. Jason lies awake on the couch, staring at the ceiling.']]);
        SFX.play('bark', { vol: 0.35, pan: 0.6 });
        c.bubble(34 * T + 8, 12 * T + 4, '(barking)', 2500, null, true);
        await c.wait(1500);
        await c.talk([
          ['JASON', 'Spike?'],
          [null, 'They buried Spike this evening.'],
          ['JASON', '...Spike?'],
        ]);
        c.setCutscene(false);
        c.say('Jason pulls on a shirt and picks up his torch.', 3000);
      },

      // The bark leads him in, one fixed spot at a time.
      async (c) => {
        const spots = [[34, 12], [39, 15], [44, 18]].map(([x, y]) => tileCentre(x, y));
        for (const spot of spots) {
          const call = () => {
            const d = Phaser.Math.Distance.Between(c.hx, c.hy, spot.x, spot.y);
            SFX.play('bark', { vol: 0.6 * Phaser.Math.Clamp(1 - d / (30 * T), 0.25, 1), pan: c.panTo(spot.x) });
            c.bubble(spot.x, spot.y - 4, '(barking)', 2500, null, true);
          };
          call();
          const ev = c.time.addEvent({ delay: 6000, loop: true, callback: call }); // the same bark, the same spot
          await c.waitFor(() => c.near(spot.x, spot.y, 2.5 * T));
          ev.remove();
          await c.wait(2500); // silence... then again, further in
        }
      },

      // Near the centre: everything stops. He's lost.
      async (c) => {
        c.creature.hushFor(9999);
        c.setCutscene(true);
        await c.wait(1500);
        await c.talk([
          ['JASON', 'Spike?'],
          [null, 'The crickets have stopped.'],
          ['JASON', 'Which way was the house?'],
        ]);
        await c.fadeOut(400);
        c.enterEndless();
        await c.fadeIn(600);
        c.setCutscene(false);
        c.say('Get back to the house.', 3000);
      },

      // The endless field. Something keeps pace with him.
      async (c) => {
        if (!c.endless) { c.creature.hushFor(9999); c.enterEndless(); }
        const cr = c.creature;
        // His heartbeat builds the whole way through.
        c.dread = 0.25;
        c.tweens.add({ targets: c, dread: 1, duration: 52000 });
        const beats = [
          [9000, () => c.say('This row should end soon.', 3000)],
          [9000, () => { cr.rustle(0.7); c.say("It's right behind me.", 2500); }],
          [10000, () => c.say("It doesn't end.", 3000)],
          [8000, () => {
            // The bark again, from right behind him. It never moves.
            const bx = c.hx - c.fx * 3 * T, by = c.hy - c.fy * 3 * T;
            SFX.play('bark', { vol: 0.7, pan: c.panTo(bx) });
            c.bubble(bx, by, '(barking)', 2000, null, true);
          }],
          [8000, () => { c.flickerTorch = true; c.say('The torch flickers.', 2500); }],
          [7000, () => { cr.leaning = 999; }], // it closes in, and stays close
        ];
        for (const [ms, fn] of beats) {
          await c.wait(ms);
          fn();
        }
        await c.wait(5000);
        c.state = 'caught';
        c.setCutscene(true);
        c.flickerTorch = false;
        await c.killFromBehind();
        await c.endChapter('day3');
      },
    ],
  },
  // ---------------- Day 3: Jason is missing ----------------
  day3: {
    start: [19, 13],
    setup(c) {
      c.makeCar('red', PARK_RED.x, PARK_RED.y, 90);
      c.makeCar('beetle', PARK_BEETLE.x, PARK_BEETLE.y, 90);
    },
    steps: [
      // Breakfast. "Anyone seen Jason?"
      async (c) => {
        c.setCutscene(true);
        c.placeMichael(19, 13, 0, -1);
        c.cast({ jenny: [17, 11], jean: [22, 12] });
        await c.wait(800);
        await c.talk([
          [null, 'Day 3.'],
          ['JENNY', 'Anyone seen Jason?'],
          ['MICHAEL', 'I thought he was still asleep.'],
          ['JENNY', "He wasn't on the couch when I came down. I think he went for a walk."],
        ]);
        c.cast({ walter: [14, 12] });
        await c.walkNPC('walter', [[20, 13], [22, 11]], 40);
        await c.talk([
          ['PA', 'Morning, everyone.'],
          [null, 'By half past two, Jason still isn\'t back.'],
          ['JENNY', "If he's not back by three, I'm going to look for him."],
          [null, 'Three o\'clock.'],
          ['JENNY', "I'm going into the corn. I don't care about your rule, Pa."],
          ['PA', '...Then Michael goes with you.'],
        ]);
        c.setCutscene(false);
        c.objective('search', 'Search the cornfield for Jason, with Jenny.');
      },

      // The search. His torch. The crow.
      async (c) => {
        c.cornAllowed = true;
        if (!c.npcs.jenny) c.cast({ jenny: [17, 13] });
        c.cast({ walter: [22, 11], jean: [22, 12] });
        c.follow('jenny');
        // Jenny calls for him now and then, once they're in the corn.
        const calling = c.time.addEvent({ delay: 7000, loop: true, callback: () => {
          if (c.inRoom('field') && c.npcs.jenny) c.npcs.jenny.say('Jason!', 1800);
        } });
        const tp = tileCentre(41, 16);
        const torch = c.add.container(tp.x, tp.y).setDepth(12).setAngle(30);
        torch.add([c.add.rectangle(0, 0, 9, 3, 0x6a6a70), c.add.rectangle(5, 0, 2, 4, 0xfff0a0)]);
        await c.waitAct(tp.x, tp.y, 22);
        calling.remove();
        torch.destroy();
        c.setCutscene(true);
        await c.talk([
          [null, "Jason's torch, lying in the dirt between the rows. Still switched on, the batteries nearly dead."],
          ['JENNY', "That's his."],
        ]);
        // Something hits Jenny in the back of the head.
        const j = c.npcs.jenny;
        SFX.play('crow', { vol: 0.8, pan: c.panTo(j.x) });
        c.cameras.main.shake(150, 0.01);
        const crow = c.add.triangle(j.x, j.y - 8, 0, 4, 10, 0, 10, 8, 0x080808).setDepth(25);
        c.tweens.add({ targets: crow, x: j.x + 120, y: j.y - 90, duration: 1400, onComplete: () => crow.destroy() });
        await c.talk([
          ['JENNY', 'Ah!'],
          [null, 'Something hits Jenny in the back of the head. She spins round. A crow flaps away over the corn.'],
          ['JENNY', 'Just a bird.'],
        ]);
        c.unfollow('jenny');
        c.complete('search');
        c.clue('torch', "Jason's torch", 'Found in the corn between the rows, still switched on, the batteries nearly dead. A crow struck Jenny there.');
        await c.fadeOut(1200);
        c.cornAllowed = false;
        c.placeMichael(19, 13, 0, -1);
        c.cast({ jenny: [17, 11], walter: [22, 11], jean: [10, 11] });
        await c.fadeIn(1200);
        await c.talk([
          [null, 'The police search the field all afternoon.'],
          [null, 'They find nothing.'],
          ['JENNY', "They've got him. The people in the corn. I know they have."],
        ]);
        c.setCutscene(false);
        c.objective('jean', 'Jean wants to talk to you. She\'s in the living room.');
      },

      // Jean, and the ring.
      async (c) => {
        c.cast({ jenny: [17, 11], walter: [22, 11], jean: [10, 11] });
        await c.waitFor(() => c.inRoom('living'));
        const choice = await c.talk([
          ['JEAN', 'I found this in Jason\'s bag.'],
          [null, 'A small velvet box. Inside, an engagement ring.'],
          ['JEAN', 'He was going to ask her this week.'],
          ['MICHAEL', "He'll turn up, Jean."],
          ['JEAN', "I'm a nurse, Michael. I've seen people in shock."],
          ['JEAN', "Your father isn't in shock. He's afraid."],
          ['MICHAEL', '...', ['Afraid of what?', "He's an old man. It's been a hard week."]],
        ]);
        await c.talk(choice === 0
          ? [['JEAN', "Ask him what he knows about that field. He won't look at it. Have you noticed?"]]
          : [['JEAN', "Maybe. But he won't look at that field. Have you noticed?"]]);
        await c.talk([[null, 'It is the first real conversation they have had.']]);
        c.complete('jean');
        c.clue('ring', 'The engagement ring', "Jean found it in Jason's bag. He was going to ask Jenny this week.");
        c.clue('jean', 'Jean', "She's a nurse. \"Your father isn't in shock. He's afraid.\" He won't look at the field.");
        c.objective('supper', 'Supper at the kitchen table.');
      },

      // Supper. A stone through the window.
      async (c) => {
        c.cast({ jenny: [17, 11], walter: [22, 11], jean: [22, 12] });
        await c.waitFor(() => c.inRoom('kitchen'));
        c.setCutscene(true);
        await c.fadeOut(500);
        c.placeMichael(19, 13, 0, -1);
        await c.fadeIn(500);
        await c.talk([[null, 'Supper. Nobody eats much. Jason\'s chair is empty.']]);
        await c.wait(1200);
        SFX.play('glass', { vol: 1 });
        SFX.vibrate(200);
        c.cameras.main.shake(300, 0.02);
        c.flag('windowBroken');
        c.drawOpenings();
        const stone = c.add.ellipse(20 * T + 8, 7 * T + 8, 7, 5, 0x7a7a74).setDepth(13);
        c.tweens.add({ targets: stone, y: 10 * T + 6, x: 21 * T, angle: 360, duration: 350 });
        await c.wait(600);
        await c.talk([
          ['JENNY', 'Pa!'],
          [null, 'A stone, on the kitchen floor, among the glass.'],
        ]);
        await c.walkNPC('walter', [[21, 10]], 40);
        stone.destroy();
        await c.talk([
          [null, 'Pa picks it up and turns it over in his hand.'],
          ['PA', "It's nothing."],
          ['JENNY', 'Someone threw a rock through our window!'],
          ['PA', "Kids. It's nothing."],
          [null, 'He puts it in his pocket. But Michael saw the carving on it.'],
        ]);
        c.complete('supper');
        c.clue('stone', 'The stone through the window', "The same carvings as the ring of stones in the field. Pa put it in his pocket: \"It's nothing.\"");
        c.time.delayedCall(4500, () => c.say('Its carvings match the stones in the ring. (Notebook: Clues)', 3500));
        await c.wait(5000);
        await c.endChapter('night3');
      },
    ],
  },

  // ---------------- Night 3: Jenny, come here ----------------
  night3: {
    night: true,
    reach: 33,
    lures: false,
    creature: 'stalker',
    start: [6, 21],
    setup(c) {
      c.makeCar('red', PARK_RED.x, PARK_RED.y, 90);
      c.makeCar('beetle', PARK_BEETLE.x, PARK_BEETLE.y, 90);
      c.cast({ walter: [21, 21], jean: [9, 12] });
      c.powerOn = false; // everyone's in bed
    },
    steps: [
      async (c) => {
        c.setCutscene(true);
        c.placeMichael(6, 21, 0, 1);
        c.cast({ jenny: [13, 21] });
        await c.wait(800);
        await c.talk([[null, "Night 3. Michael can't sleep."]]);
        const spot = tileCentre(34, 34); // in the first row of the corn
        SFX.speakLure('Jenny. Come here.');
        c.bubble(spot.x, spot.y - 4, 'Jenny. Come here.', 3000, null, true);
        await c.wait(2200);
        await c.talk([
          [null, "A voice from outside. Jason's voice."],
          [null, "Jenny's door bangs open. Footsteps in the hall."],
        ]);
        c.cast({ jenny: [29, 15] });
        c.placeMichael(26, 12, 1, 0); // on the porch, just behind her
        c.setCutscene(false);
        c.objective('chase', 'Catch Jenny before she reaches the corn! Run: push the joystick to the edge.');
      },

      // The chase across the lawn. If she gets into the corn, start again.
      async (c) => {
        const spot = tileCentre(34, 34);
        // What she sees: Jason in the first row, holding his own head.
        c.cast({ jason: [34, 34] });
        c.npcs.jason.headless();
        const call = () => {
          SFX.speakLure('Jenny. Come here.');
          c.bubble(spot.x, spot.y - 4, 'Jenny. Come here.', 3000, null, true);
        };
        const voice = c.time.addEvent({ delay: 6500, loop: true, callback: call });
        c.glow = ['jenny']; // her pale nightdress catches the moonlight
        // (her route keeps clear of Spike's kennel at 29,24)
        const path = [[28, 13], [30, 17], [31, 21], [31, 25], [30, 29], [32, 33], [33, 34]].map(([x, y]) => tileCentre(x, y));
        let caught = false;
        while (!caught) {
          c.cast({ jenny: [29, 15] }); // a head start
          await c.wait(800);           // a beat for your thumb, then she runs
          let i = 1;
          const result = await new Promise(res => {
            c.waitFor(() => {
              const j = c.npcs.jenny;
              if (c.near(j.x, j.y, 14)) { res('caught'); return true; }
              if (i >= path.length) { res('escaped'); return true; }
              const p = path[i], dx = p.x - j.x, dy = p.y - j.y, d = Math.hypot(dx, dy);
              const step = 50 * (c.dt || 1 / 30); // faster than Michael walks, a little slower than he runs
              if (d <= step) { j.place(p.x, p.y); i++; } else j.place(j.x + dx / d * step, j.y + dy / d * step);
              return false;
            });
          });
          if (result === 'caught') { caught = true; break; }
          // She's gone into the corn. Try again.
          c.setCutscene(true);
          c.say("She's gone into the corn.", 2000);
          await c.wait(1200);
          await c.fadeOut(600);
          c.placeMichael(26, 12, 1, 0); // on the porch, just behind her
          await c.fadeIn(600);
          c.say('Again. Catch her before she reaches the corn.', 2500);
          c.setCutscene(false);
        }
        voice.remove();
        c.glow = null;
        if (window.speechSynthesis) speechSynthesis.cancel();
        c.setCutscene(true);
        await c.talk([
          ['MICHAEL', 'Jenny?'],
          [null, 'He touches her shoulder. She freezes.'],
          ['JENNY', 'I saw Jason. He was right there, in the first row. He was holding...'],
        ]);
        c.cast({ jason: null });
        await c.talk([
          [null, 'There is nothing in the first row but corn.'],
          ['MICHAEL', 'You were dreaming, Jen. Come inside.'],
        ]);
        c.complete('chase');
        c.walkNPC('jenny', [[27, 13], [25, 11], [21, 17], [13, 21]], 50);
        c.setCutscene(false);
        c.objective('bed', 'Go back to bed.');
      },

      async (c) => {
        c.cast({ jenny: [13, 21] });
        await c.waitAct(5 * T, 21 * T, 30);
        c.setCutscene(true);
        await c.talk([[null, 'He lies awake for a long time, listening to the crickets.']]);
        c.complete('bed');
        await c.endChapter('interlude3');
      },
    ],
  },

  // ---------------- Interlude: Jenny ----------------
  // Later, she slips out alone. Jason stands whole and smiling.
  interlude3: {
    night: true,
    player: 'jenny',
    reach: 33,
    lures: false,
    creature: 'stalker',
    start: [13, 21],
    setup(c) {
      c.makeCar('red', PARK_RED.x, PARK_RED.y, 90);
      c.makeCar('beetle', PARK_BEETLE.x, PARK_BEETLE.y, 90);
      c.cast({ walter: [21, 21], jean: [9, 12], michael: [6, 21] });
      c.powerOn = false;
      c.flag('cornAtNight');
      c.creature.warned = true;
    },
    steps: [
      async (c) => {
        c.setCutscene(true);
        c.placeMichael(13, 21, 0, 1);
        await c.wait(800);
        await c.talk([
          [null, "Later. Jenny can't sleep."],
          ['JENNY', 'He was there. I know he was.'],
        ]);
        const spot = tileCentre(31, 20);
        c.cast({ jason: [31, 20] });
        c.glow = ['jason']; // he stands in the moonlight
        c.speakTimer = c.time.addEvent({ delay: 6000, loop: true, callback: () => {
          SFX.speakLure('Jenny.');
          c.bubble(spot.x, spot.y - 10, 'Jenny.', 2500, 'JASON', true);
        } });
        SFX.speakLure('Jenny.');
        c.bubble(spot.x, spot.y - 10, 'Jenny.', 2500, 'JASON', true);
        c.setCutscene(false);
        c.say('Go to him.', 2500);
      },

      async (c) => {
        c.cast({ jason: [31, 20] });
        c.glow = ['jason'];
        const j = c.npcs.jason;
        await c.waitFor(() => c.near(j.x, j.y, 2.2 * T));
        if (c.speakTimer) c.speakTimer.remove();
        c.setCutscene(true);
        await c.talk([
          ['JASON', 'Jenny.'],
          ['JENNY', "Jason! I was sure they had you. I was so scared."],
          [null, 'She runs to him and holds him.'],
          [null, 'He pulls away, and smiles at her.'],
        ]);
        j.redEyes();
        SFX.play('thud', { vol: 0.6 });
        await c.talk([
          [null, 'His eyes turn red.'],
          ['JENNY', '...Jason?'],
          [null, "He turns her round, gently. She can't move."],
        ]);
        // She faces away from him.
        const dx = c.hx - j.x, dy = c.hy - j.y, l = Math.hypot(dx, dy) || 1;
        c.fx = dx / l; c.fy = dy / l;
        c.state = 'caught';
        await c.killFromBehind();
        await c.endChapter('day4');
      },
    ],
  },
  // ---------------- Day 4: On the lawn ----------------
  day4: {
    start: [6, 21],
    setup(c) {
      c.makeCar('red', PARK_RED.x, PARK_RED.y, 90);
      c.makeCar('beetle', PARK_BEETLE.x, PARK_BEETLE.y, 90);
    },
    steps: [
      // Dawn. Jean screams.
      async (c) => {
        c.setCutscene(true);
        c.placeMichael(6, 21, 0, 1);
        await c.wait(800);
        await c.talk([[null, 'Day 4. Dawn.']]);
        SFX.play('scream', { vol: 0.7, rate: 1.45 });
        SFX.vibrate(150);
        await c.wait(1600);
        await c.talk([[null, 'A scream, from outside. Jean.']]);
        c.setCutscene(false);
        c.objective('scream', 'Go outside. Out the back, onto the lawn.');
      },

      // Jason and Jenny, on the lawn. Outside the corn.
      async (c) => {
        c.lyingDead('jason', 30, 14, 80);
        c.lyingDead('jenny', 31, 16, 100);
        c.cast({ jean: [29, 15], walter: [28, 13] });
        await c.waitFor(() => c.near(30 * T, 15 * T, 4 * T));
        c.setCutscene(true);
        await c.talk([
          [null, 'Jason and Jenny lie on the grass by the porch.'],
          [null, 'Michael looks once, and does not look again.'],
          ['PA', 'No. No, no, no.'],
          [null, 'Jean is kneeling between them. She does not make a sound now.'],
          [null, 'They are not in the corn. They are on the lawn.'],
        ]);
        c.complete('scream');
        c.clue('lawn', 'On the lawn', "Jason and Jenny, on the lawn by the porch. Not in the corn. Whatever it is, it isn't staying in the field any more.");
        // The police come for Michael.
        const car = c.makeCar('police', -60, 36);
        const engine = SFX.loop('engine', 0.25);
        await c.drive(car, [[17 * T, 36], [17 * T, 4.5 * T, 90]], 90);
        engine.stop(0.6);
        c.cast({ venn: [26, 12] });
        await c.talk([
          ['DETECTIVE VENN', 'Michael Cole. I need you to come with me.'],
          ['PA', "He's done nothing. He was in his bed!"],
          ['DETECTIVE VENN', "Then he'll be home by dark."],
        ]);
        await c.fadeOut(1500);
        c.cast({ jason: null, jenny: null, jean: null, walter: null });
        car.destroy();
      },

      // The interview room. Venn reads his notebook aloud.
      async (c) => {
        c.setCutscene(true);
        c.placeMichael(30, 51, 0, -1);
        c.cast({ venn: [30, 48] });
        await c.fadeIn(1200);
        const clues = SaveGame.state.clues;
        const quote = (id, fallback) => (clues.find(k => k.id === id) || { text: fallback }).text;
        let trust = 0;
        await c.talk([
          [null, 'Marrowfield police station. An interview room with a mirror for a wall.'],
          [null, 'Detective Venn has his notebook open on the table.'],
          ['DETECTIVE VENN', '"' + quote('novel', "I started writing today. It's about the murders.") + '"'],
          ['DETECTIVE VENN', '"' + quote('jacobs', 'Henry Jacobs and both his grandsons were killed.') + '"'],
          ['DETECTIVE VENN', 'Your handwriting, Mr Cole.'],
        ]);
        let ch = await c.talk([['DETECTIVE VENN', 'You write about murders, and then they happen.', ["I write about what scares me. I didn't do this.", "It's a novel. It isn't evidence."]]]);
        await c.talk([['DETECTIVE VENN', ch === 0 ? 'Mm. Everybody says that.' : "That's for me to decide."]]);
        if (ch === 0) trust++;

        ch = await c.talk([['DETECTIVE VENN', 'Last night. Between midnight and dawn. Where were you?', ['In bed. Earlier I was on the lawn with Jenny. She was sleepwalking.', 'In bed. All night.']]]);
        if (ch === 0) { trust++; await c.talk([['DETECTIVE VENN', 'Jean says the same. Thank you for not lying to me.']]); }
        else { trust--; await c.talk([['DETECTIVE VENN', "Jean says she heard you go out. Try that one again, Mr Cole."], ['MICHAEL', '...I brought Jenny back in. She was dreaming. That was all.']]); }

        ch = await c.talk([['DETECTIVE VENN', "Ruth Hale says your father and Henry Jacobs used to go into that field at night. Years ago. With lanterns.", ['Ask my father.', "I don't know anything about that."]]]);
        await c.talk([['DETECTIVE VENN', ch === 0 ? "I did. He says Ruth Hale is an old woman with a long memory." : "No. Nobody in your family seems to."]]);

        ch = await c.talk([['DETECTIVE VENN', 'What do you think is out there, Mr Cole?', ["Something that isn't a man.", "I don't know."]]]);
        if (ch === 0) { trust++; await c.talk([[null, 'She looks at him for a long time. She does not laugh.'], ['DETECTIVE VENN', 'Write that down too.']]); }
        else await c.talk([['DETECTIVE VENN', "Neither do I. That's what bothers me."]]);

        c.flag('vennTrust', trust);
        await c.talk([
          ['DETECTIVE VENN', "You can go. Don't leave Marrowfield."],
          [null, 'They release him at dusk.'],
        ]);
        c.clue('questioned', 'Questioned', "Detective Venn read my notebook aloud. She asked about Pa and Henry Jacobs going into the field at night with lanterns. \"Don't leave Marrowfield.\"");
        await c.fadeOut(1200);
      },

      // Pa drives him home. Neither of them says a word.
      async (c) => {
        c.setCutscene(true);
        c.cast({ venn: null });
        c.dusk = true;
        c.player.setVisible(false);
        const truck = c.makeCar('truck', -60, 36);
        c.camFollow = truck;
        await c.fadeIn(1200);
        const engine = SFX.loop('engine', 0.3);
        c.say('Pa drives him home. Neither of them says a word.', 5000);
        await c.drive(truck, [[13 * T, 36], [13 * T, 5.5 * T, 90]], 55);
        engine.stop(1);
        c.camFollow = null;
        c.placeMichael(12, 6, 0, 1);
        c.player.setVisible(true);
        await c.wait(1500);
        await c.endChapter('night4');
      },
    ],
  },

  // ---------------- Night 4: The dead grass ----------------
  // The first real stealth night. The power fails; the generator is across
  // the yard. Tonight its reach comes out of the corn to the line of dead
  // grass in the yard. The shed is just past it.
  night4: {
    night: true,
    reach: 19,       // the line of withered grass (tile column)
    lures: true,
    oil: 0.45,       // running low
    start: [19, 13],
    setup(c) {
      c.makeCar('red', PARK_RED.x, PARK_RED.y, 90);
      c.makeCar('beetle', PARK_BEETLE.x, PARK_BEETLE.y, 90);
      c.makeCar('truck', 13 * T, 5.5 * T, 90);
      c.lureVoices = [{ text: '(Spike barking)', sound: 'bark' }]; // it only has its dead
      c.powerOn = c.has('generator4');
      c.drawWitheredLine();
      c.oilFlask(15, 30, 0.35); // a can of lamp oil in the shed (in the corner, away from the generator)
    },
    steps: [
      async (c) => {
        c.setCutscene(true);
        c.placeMichael(19, 13, 0, -1);
        c.cast({ walter: [22, 11], jean: [17, 12] });
        c.powerOn = true;
        await c.wait(800);
        await c.talk([[null, 'Night 4. Nobody eats. Nobody talks.']]);
        SFX.play('thud', { vol: 0.5 });
        c.powerOn = false;
        const choice = await c.talk([
          [null, 'The lights flicker, and die.'],
          ['JEAN', 'Not tonight. Please. Not tonight.'],
          ['PA', 'The generator. I\'ll go.'],
          ['MICHAEL', '...', ["No. I'll go.", 'You go, then.']],
        ]);
        if (choice === 1) await c.talk([['PA', '...'], [null, 'Pa does not move from his chair.'], ['PA', "You're younger. Go."]]);
        await c.talk([
          ['PA', "Michael. Whatever you do, don't cross the dead grass."],
          ['MICHAEL', 'What dead grass?'],
          ['PA', "You'll see it."],
          ['JEAN', "Take the lantern. There isn't much oil left."],
        ]);
        c.setCutscene(false);
        c.objective('gen4', "Get the generator running. Out the back door, across the yard to the shed. Don't let it get behind you.");
      },

      // Across the yard. Spike's bark from the corn.
      async (c) => {
        c.cast({ walter: [22, 11], jean: [17, 12] });
        c.waitFor(() => c.inRoom('porch') || c.inRoom('yard')).then(() => {
          if (!c.has('withered')) { c.flag('withered'); c.say('A line of dead grass runs across the yard, brown and brittle.', 4000); }
          c.time.delayedCall(5000, () => { if (c.creature && c.creature.state === 'prowl') { c.creature.lureCooldown = 0; c.creature.startLure(); } });
        });
        await c.waitAct(17 * T + 8, 31 * T + 8, 24);
        SFX.play('generator', { vol: 0.7 });
        c.powerOn = true;
        c.flag('generator4');
        c.say('It catches. The house lights come back on.', 3000);
        c.complete('gen4');
        c.objective('back4', 'Get back inside the house.');
      },

      async (c) => {
        c.powerOn = true;
        c.cast({ walter: [22, 11], jean: [17, 12] });
        await c.waitFor(() => c.inRoom('house'));
        c.complete('back4');
        c.saveNow();
        c.say('Inside. (Saved.)', 2000);
        c.objective('lock4', 'Lock the back door, and go to bed.');
        await c.waitAct(24 * T + 8, 11 * T + 8, 14);
        c.lock('backDoor');
        await c.waitAct(5 * T, 21 * T, 30);
        c.setCutscene(true);
        await c.talk([
          [null, 'He lies awake, listening.'],
          [null, 'Out on the porch, something stands for a long time, and then goes away.'],
        ]);
        c.complete('lock4');
        await c.endChapter('day5');
      },
    ],
  },
};
