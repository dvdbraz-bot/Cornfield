// The story's days and nights on the Cole farm (Milestone 4 onwards).
// Each chapter (see chapters.js) is a list of steps. The game saves which step
// you're on, so it can carry on from there.
const MICHAEL_LOOK = { body: 0xe8e8e0, head: 0xc89a78, hair: 0x2a1a10 }; // white t-shirt, dark hair

// Rooms and areas, in tiles: [x0, y0, x1, y1].
const ROOMS = {
  living: [4, 8, 13, 14], kitchen: [15, 8, 24, 14], hall: [4, 16, 24, 17],
  michael: [4, 19, 9, 24], jenny: [11, 19, 16, 24], pa: [18, 19, 24, 24],
  house: [3, 7, 25, 25], porch: [26, 9, 27, 23], yard: [1, 26, 32, 37],
  shed: [15, 30, 18, 32], garage: [4, 30, 10, 34], attic: [3, 48, 16, 55],
  field: [33, 8, 72, 37],
};

// Windows and doors that can be locked: the tile, and where to stand to use it.
const OPENINGS = {
  frontDoor:     { tile: [9, 7],   stand: [9, 8],   door: true, name: 'the front door' },
  backDoor:      { tile: [25, 11], stand: [24, 11], door: true, name: 'the back door' },
  livingWindow:  { tile: [6, 7],   stand: [6, 8],   name: 'the living room window' },
  kitchenWindow: { tile: [20, 7],  stand: [20, 8],  name: 'the kitchen window' },
  michaelWindow: { tile: [3, 21],  stand: [4, 22],  name: 'your bedroom window' },
  paWindow:      { tile: [21, 25], stand: [21, 24], name: "Pa's window" },
};

const BOARD = { x: 19 * T + 16, y: 11 * T + 16 };       // Snakes and Ladders: the save point
const PARK_RED = { x: 10.5 * T, y: 4.5 * T };           // where Michael's car parks
const PARK_BEETLE = { x: 13.5 * T, y: 4.5 * T };

class ChapterScene extends FieldScene {
  constructor() { super('Chapter'); }

  init(data) { this.resuming = !!(data && data.resume); }

  create() {
    const S = SaveGame.state;
    this.chapterId = S.chapter;
    this.ch = CHAPTERS[S.chapter];
    this.night = !!this.ch.night;
    const start = (this.resuming && S.x != null) ? { x: S.x, y: S.y } : tileCentre(...this.ch.start);
    // Most chapters are Michael's; a few doomed scenes are someone else's.
    this.setupField(FARM_MAP, start, this.ch.player ? CAST[this.ch.player] : MICHAEL_LOOK);
    this.cornAllowed = false;
    Controls.notebook = !this.ch.player; // the notebook is Michael's
    Controls.gameScene = 'Chapter';
    Controls.lanternAvailable = this.night;

    this.lanternOn = this.night;
    this.npcs = {};
    this.cars = {};
    this.waiters = [];
    this.cutscene = false;
    this.powerOn = !this.night;
    this.locks = new Set((S.flags.locks && S.flags.locks[this.chapterId]) || []);
    this.ambient = this.night ? NIGHT.darkness : 0;
    this.hidden = false;
    this.holdingBreath = false;

    this.openingGfx = this.add.graphics().setDepth(4);
    this.drawOpenings();
    this.makeCommonInteractables();

    if (this.night) {
      this.state = 'night';
      this.reachX = this.ch.reach * T;
      this.cricketVol = NIGHT.cricketVolume;
      this.crickets = SFX.loop('crickets', this.cricketVol);
      this.beatTimer = 0;
      this.taught = {};
      this.creature = this.ch.creature === 'stalker'
        ? new Stalker(this, FARM_MAP.RING.x, FARM_MAP.RING.y)
        : new Creature(this, FARM_MAP.RING.x, FARM_MAP.RING.y);
      if (!this.ch.lures) this.creature.lureCooldown = Infinity;
      this.makeCreatureLook();
    } else {
      this.state = 'day';
    }
    if (this.ch.setup) this.ch.setup(this);

    this.cameras.main.fadeIn(1200, 0, 0, 0);
    if (!this.resuming && S.step === 0) SaveGame.save(); // a save at the start of every day and night
    this.runSteps(S.step);
  }

  async runSteps(from) {
    const id = this.runId;
    await this.waitFor(() => this.ui && this.ui.joy); // the controls layer is ready
    for (let i = from; i < this.ch.steps.length; i++) {
      if (id !== this.runId) return;
      SaveGame.state.step = i;
      await this.ch.steps[i](this);
      this.resuming = false;
    }
  }

  // ---------- helpers for the chapter scripts ----------

  // Resolves once fn() is true (checked every frame).
  waitFor(fn) { return new Promise(res => this.waiters.push({ fn, res })); }

  inRoom(name) {
    const [x0, y0, x1, y1] = ROOMS[name];
    const tx = this.hx / T, ty = this.hy / T;
    return tx >= x0 && tx < x1 + 1 && ty >= y0 && ty < y1 + 1;
  }

  near(x, y, r) { return Phaser.Math.Distance.Between(this.hx, this.hy, x, y) < r; }

  // A one-off thing to use. Resolves when Michael uses it.
  waitAct(x, y, r = 24) {
    return new Promise(res => {
      const it = { x, y, r, step: true, when: () => true, act: () => { this.interactables = this.interactables.filter(o => o !== it); res(); } };
      this.interactables.push(it);
    });
  }

  // Several things that all do the same job (e.g. the bed or the wardrobe).
  // Resolves with the index of the one used, and removes the rest.
  waitActAny(points, r = 24) {
    return new Promise(res => {
      const items = points.map(([x, y], i) => ({
        x, y, r, step: true, when: () => true,
        act: () => { this.interactables = this.interactables.filter(o => !items.includes(o)); res(i); },
      }));
      this.interactables.push(...items);
    });
  }

  // lines: [[who, text], [who, text, [choice, choice]], ...]. Resolves with the choice.
  async talk(lines) {
    this.frozen = true;
    const choice = await this.ui.talk(lines.map(l => Array.isArray(l) ? { who: l[0], text: l[1], choices: l[2] } : l));
    this.frozen = this.cutscene;
    return choice;
  }

  setCutscene(on) {
    this.cutscene = on;
    this.frozen = on;
    this.setControlsVisible(!on);
  }

  objective(id, text) {
    const notes = SaveGame.state.notes;
    const n = notes.find(o => o.id === id);
    if (n) { n.text = text; return; }
    notes.push({ id, text, done: false });
    this.say('Notebook: ' + text, 3500);
  }

  complete(id) {
    const n = SaveGame.state.notes.find(o => o.id === id);
    if (n) n.done = true;
  }

  clue(id, title, text) {
    const clues = SaveGame.state.clues;
    if (clues.some(c => c.id === id)) return;
    clues.push({ id, title, text });
    this.time.delayedCall(1500, () => this.say('A new clue in the notebook: ' + title, 3000));
  }

  addItem(id) { if (!SaveGame.state.items.includes(id)) SaveGame.state.items.push(id); }
  hasItem(id) { return SaveGame.state.items.includes(id); }
  flag(k, v = true) { SaveGame.state.flags[k] = v; }
  has(k) { return !!SaveGame.state.flags[k]; }

  // Spike, at the edge of the clearing. Mostly left to the imagination.
  showDeadSpike() {
    if (this.deadSpike) return;
    const d = this.add.container(50 * T + 8, 23 * T + 8).setDepth(13);
    d.add(this.add.ellipse(1, 2, 24, 11, 0x4a0a0a, 0.85));
    d.add(this.add.rectangle(0, 0, 12, 6, 0xc8a060));
    d.add(this.add.rectangle(-7, 0, 3, 2, 0xc8a060));
    this.deadSpike = d;
  }

  // Something to look at: ACT shows a line.
  look(tx, ty, text, r = 24, ms = 3500) {
    this.interactables.push({ x: tx * T + 8, y: ty * T + 8, r, when: () => true, act: () => this.say(text, ms) });
  }

  // Who's where: { jenny: [tx, ty], walter: null (gone) }.
  cast(spec) {
    for (const [id, pos] of Object.entries(spec)) {
      if (pos === null) { if (this.npcs[id]) { this.npcs[id].destroy(); delete this.npcs[id]; } continue; }
      const p = tileCentre(pos[0], pos[1]);
      if (!this.npcs[id]) this.npcs[id] = new NPC(this, id, p.x, p.y);
      else this.npcs[id].place(p.x, p.y);
    }
  }

  // Walk an NPC through tile points.
  walkNPC(id, tiles, speed) {
    return this.npcs[id].walk(tiles.map(([x, y]) => [x * T + 8, y * T + 8]), speed);
  }

  placeMichael(tx, ty, fx = 0, fy = 1) {
    const p = tileCentre(tx, ty);
    this.hx = p.x; this.hy = p.y; this.fx = fx; this.fy = fy;
  }

  // Cars: 'red' (Michael's), 'police', 'beetle' (Jason and Jean's).
  makeCar(kind, x, y, angle = 0) {
    const c = this.add.container(x, y).setDepth(13).setAngle(angle);
    if (kind === 'beetle') {
      c.add(this.add.ellipse(0, 0, 26, 15, 0xe8e8e0));
      c.add(this.add.ellipse(1, 0, 12, 11, 0x9ab0c0));
    } else {
      c.add(this.add.rectangle(0, 0, 28, 13, kind === 'police' ? 0xe8e8f0 : 0xb02020));
      c.add(this.add.rectangle(2, 0, 12, 11, 0x2a3440));
      if (kind === 'police') {
        c.lightA = this.add.rectangle(2, -3, 4, 3, 0xff3030);
        c.lightB = this.add.rectangle(2, 3, 4, 3, 0x3060ff);
        c.add([c.lightA, c.lightB]);
        this.tweens.add({ targets: [c.lightA, c.lightB], alpha: 0.2, duration: 150, yoyo: true, repeat: -1 });
      }
    }
    this.cars[kind] = c;
    return c;
  }

  drive(car, points, speed) {
    return new Promise(res => {
      const next = (i) => {
        if (i >= points.length) { res(); return; }
        const [x, y, angle] = points[i];
        const d = Phaser.Math.Distance.Between(car.x, car.y, x, y);
        const tw = { targets: car, x, y, duration: Math.max(1, d / speed * 1000), onComplete: () => next(i + 1) };
        if (angle !== undefined) tw.angle = angle;
        this.tweens.add(tw);
      };
      next(0);
    });
  }

  async fadeOut(ms = 1200) { this.cameras.main.fadeOut(ms, 0, 0, 0); await this.wait(ms + 50); }
  async fadeIn(ms = 1200) { this.cameras.main.fadeIn(ms, 0, 0, 0); await this.wait(ms); }

  // ---------- windows and doors ----------

  isBlocked(x, y) {
    const tx = Math.floor(x / T), ty = Math.floor(y / T);
    for (const id of this.locks) {
      const o = OPENINGS[id];
      if (o.door && o.tile[0] === tx && o.tile[1] === ty) return true;
    }
    return this.map.isBlockedPx(x, y, true);
  }

  lock(id) {
    const o = OPENINGS[id];
    // Don't shut Michael inside the door: if he's in the doorway, step him inside.
    if (o.door && Math.floor(this.hx / T) === o.tile[0] && Math.floor((this.hy + 5) / T) === o.tile[1]) {
      this.placeMichael(o.stand[0], o.stand[1], this.fx, this.fy);
    }
    this.locks.add(id);
    const S = SaveGame.state;
    S.flags.locks = S.flags.locks || {};
    S.flags.locks[this.chapterId] = [...this.locks];
    SFX.play('door', { vol: 0.6 });
    this.drawOpenings();
  }

  drawOpenings() {
    const g = this.openingGfx;
    g.clear();
    for (const [id, o] of Object.entries(OPENINGS)) {
      const x = o.tile[0] * T, y = o.tile[1] * T;
      const locked = this.locks.has(id);
      if (o.door) {
        if (locked) { g.fillStyle(0x6a4628, 1).fillRect(x, y, T, T); g.fillStyle(0xc8b060, 1).fillRect(x + 7, y + 6, 2, 4); }
        else if (o.tile[1] === 7) { g.fillStyle(0x8a5a30, 1).fillRect(x - 1, y - 13, 3, 13); } // front door, swung open onto the step
        else { g.fillStyle(0x8a5a30, 1).fillRect(x + T, y - 1, 13, 3); }                     // back door, swung open onto the porch
      } else {
        // open windows show the night through them; locked ones have their latch down and curtains drawn
        g.fillStyle(locked ? 0x5a3030 : 0x0a1018, 1).fillRect(x + 2, y + 3, 12, 8);
        if (locked) g.fillStyle(0x7a4040, 1).fillRect(x + 7, y + 3, 2, 8);
      }
    }
  }

  // ---------- things you can always look at ----------

  makeCommonInteractables() {
    const at = (tx, ty, dx = 8, dy = 8) => ({ x: tx * T + dx, y: ty * T + dy });
    const stepNear = (p) => this.interactables.some(o => o.step && Phaser.Math.Distance.Between(o.x, o.y, p.x, p.y) < 40);
    const add = (p, r, act, when = () => true) => this.interactables.push({ ...p, r, when, act });

    // The kitchen table with Jenny's old Snakes and Ladders board: a save point.
    add(BOARD, 30, async () => {
      const c = await this.talk([[null, "Jenny's old Snakes and Ladders board. Sit for a while?", ['Sit and rest (save the game)', 'Not now']]]);
      if (c === 0) { this.saveNow(); this.say('Saved.', 1500); }
    }, () => !stepNear(BOARD) && !this.cutscene);

    add(at(12, 8, 14, 8), 24, () => {
      this.say('Ma. "A farm accident," Pa said. He never said more.', 4000);
      this.clue('mother', 'Ma', 'Her photo on the sideboard. "A farm accident," Pa said. He never said more.');
    });
    add(at(8, 19), 22, () => {
      if (this.hasItem('rosary')) { this.say('The drawer is empty now.', 2000); return; }
      this.addItem('rosary');
      this.say("Ma's rosary, in the back of the drawer. He puts it in his pocket.", 4000);
      this.clue('rosary', "Ma's rosary", 'Hidden at the back of the drawer in my old room. I have it now.');
    });
    add(at(4, 10, 8, 16), 22, () => this.say('The old Phillips TV on its white wall unit.', 3000));
    add(at(9, 24), 22, () => this.say('His old clothes. Too small now.', 2500), () => !stepNear(at(9, 24)));
    add(at(15, 20, 16, 16), 26, () => this.say("Jenny's bed. Same pink cover since she was twelve.", 3000));
    add(at(18, 19), 22, () => this.say("Pa's cupboard. Shut tight.", 2500));
    add(at(4, 30), 24, () => this.say('The old cupboard. Locked. It was always locked. He and Jenny were never allowed near it.', 4500));
    add(at(17, 31), 24, () => this.say('The generator. Pa keeps it for when storms take the power out.', 3000), () => !stepNear(at(17, 31)));
    add(at(29, 24), 22, () => this.say("Spike's kennel.", 2000));
    add(PARK_RED, 26, () => this.say('His red car. Too clean for this road.', 2500), () => !!this.cars.red && !stepNear(PARK_RED));
    // The attic ladder in the hall, and back down.
    add(at(5, 16), 20, () => this.climb(true));
    add(at(5, 52), 20, () => this.climb(false));
    add(at(11, 52), 26, () => this.say('A barrel under the dust and cobwebs. The label is too faded to read in this light.', 4000));
    add(at(14, 50), 20, () => this.say('Old boxes. Christmas things.', 2500));
    // Spike, when he's around.
    const scene = this;
    this.interactables.push({
      get x() { return scene.npcs.spike ? scene.npcs.spike.x : -999; },
      get y() { return scene.npcs.spike ? scene.npcs.spike.y : -999; },
      r: 22, when: () => !!this.npcs.spike,
      act: () => this.say(this.night ? "Spike won't take his eyes off the corn." : 'Spike. Good old boy.', 2500),
    });
  }

  async climb(up) {
    this.frozen = true;
    await this.fadeOut(400);
    this.placeMichael(up ? 6 : 6, up ? 52 : 16, 0, 1);
    await this.fadeIn(400);
    this.frozen = this.cutscene;
    if (up && !this.has('atticSeen')) { this.flag('atticSeen'); this.say('The attic. It smells of dust and old rain.', 3000); }
  }

  // ---------- saving ----------

  saveNow() {
    const S = SaveGame.state;
    S.chapter = this.chapterId;
    const inScene = this.cutscene || Controls.dialogueOpen;
    S.x = inScene ? null : this.hx;
    S.y = inScene ? null : this.hy;
    SaveGame.save();
  }

  async endChapter(next) {
    this.setCutscene(true);
    const S = SaveGame.state;
    const finished = this.chapterId;
    S.chapter = next; S.step = 0; S.x = null; S.y = null;
    SaveGame.save();
    await this.fadeOut(1500);
    this.scene.start('End', { mode: 'chapter', finished, next });
  }

  // ---------- the night ----------

  async caught(cr) {
    if (this.state !== 'night') return;
    this.state = 'caught';
    cr.setState('caught');
    const dx = this.hx - cr.x, dy = this.hy - cr.y;
    const l = Math.hypot(dx, dy) || 1;
    this.fx = dx / l; this.fy = dy / l;
    this.drawPlayer();
    this.crickets.stop(0.2);
    await this.killFromBehind();
    this.scene.start('End', { mode: 'caught-save' });
  }

  onNoise(radius) { if (this.creature) this.creature.hearNoise(radius); }

  lighting() {
    const lights = [];
    if (this.inRoom('attic')) return { ambient: 0.85, tint: [3, 5, 14], lights };
    // By day the corn hides anything more than a few tiles away.
    if (!this.night && this.inRoom('field')) return { ambient: 0.72, tint: [40, 42, 16], lights, radius: 3.5 * T };
    if (!this.night) return { ambient: 0, tint: [0, 0, 0], lights };
    if (this.inRoom('house')) {
      if (this.powerOn) return { ambient: 0.3, tint: [30, 16, 4], lights };
      // moonlight through the open back door, so you can find it in the dark
      if (!this.locks.has('backDoor')) lights.push({ x: 25 * T + 4, y: 11 * T + 8, r: 22 });
      return { ambient: 0.82, tint: [3, 5, 14], lights };
    }
    // From outside, the lit windows glow.
    if (this.powerOn) {
      for (const o of Object.values(OPENINGS)) if (!o.door) lights.push({ x: o.tile[0] * T + 8, y: o.tile[1] * T + 8, r: 26 });
      lights.push({ x: 25 * T + 8, y: 11 * T + 8, r: 22 });
    }
    return { ambient: NIGHT.darkness, tint: [3, 5, 14], lights };
  }

  // ---------- every frame ----------

  update(time, delta) {
    const dt = Math.min(delta, 100) / 1000;
    this.readKeys();
    if (this.night && Controls.lanternPressed && !this.frozen) this.toggleLantern();
    this.movePlayer(dt);

    // By day, Pa's rule holds: nobody goes into the corn.
    if (!this.night && this.inRoom('field') && !this.cornAllowed) {
      this.hx -= 6;
      if (!this.ruleTold || time > this.ruleTold) { this.ruleTold = time + 4000; this.say('Pa said nobody goes into the corn.', 2500); }
    }

    if (this.night && this.inRoom('field') && !this.has('cornAtNight')) {
      this.flag('cornAtNight');
      this.say('Pa said stay out of the corn.', 2500);
    }

    if (this.night && this.state === 'night') {
      this.creature.update(dt);
      this.updateSound(dt);
    }
    if (this.creature) this.drawCreature(time);

    this.waiters = this.waiters.filter(w => { if (w.fn()) { w.res(); return false; } return true; });
    this.updateCamera();
    this.updateInteract();
    this.updateMarkers();
    const L = this.lighting();
    this.extraLight = L.radius || 0;
    this.ambient += (L.ambient - this.ambient) * 0.1;
    this.drawDarkness(time, this.ambient, L.tint, L.lights);
    Controls.playerTile = { x: this.hx / T, y: this.hy / T };
    Controls.crickets = this.night ? this.cricketVol / NIGHT.cricketVolume : null;
    this.endFrame();
  }
}
