// The prologue: the Jacobs farmhouse after the rain -> Henry dozes in front
// of the TV -> the boys are gone -> the cornfield -> the voice that doesn't
// move -> "Now they're throwing rocks at me." -> the kill.
//
// States: 'intro' (house, boys playing) -> 'doze' -> 'search' (boys gone,
// field) -> 'lure' (crickets stop, the voice) -> 'strike' -> 'kill'.
const TUNING = {
  houseLitDarkness: 0.35, // before Henry dozes
  houseDarkness: 0.86,    // after he wakes
  outsideDarkness: 0.95,
  cricketVolume: 0.32,
  lureDistanceTiles: 6,   // how far ahead the voice appears
  lureKillTiles: 3,       // walk this close to the voice and you die
  leaveSeconds: 3,        // try to leave this long and you die
  lureRepeats: 6,         // standing still forever doesn't work either
  lureEverySeconds: 6.5,
};

// Where the boys' laughter comes from as Henry follows it (tile coordinates).
const LAUGH_PATH = [[17, 23], [19, 26], [22, 28], [21, 31], [24, 33], [22, 35]].map(([x, y]) => tileCentre(x, y));
const FIELD_CENTRE = tileCentre(22, 34);
const DOOR = tileCentre(16, 11);
const TV = { x: 27 * T + 8, y: 2 * T + 6 };
const CHAIR = tileCentre(27, 6);

class PrologueScene extends FieldScene {
  constructor() { super('Prologue'); }

  create() {
    this.setupField(MAP, tileCentre(29, 8), { body: 0x8a7a62, head: 0xd9b99b, hair: 0x5a4a3a });
    Unlocks.unlock('prologue');
    this.makeProps();

    this.state = 'intro';
    this.doorOpen = false;
    this.dialogueDone = false;
    this.boysPresent = true;
    this.tvOn = true;
    this.ambient = TUNING.houseLitDarkness;
    this.laughStarted = false;
    this.laughIdx = 0;
    this.laughTimer = 0;
    this.firstLaughHeard = false;
    this.cricketVol = 0.05;
    this.lure = null;

    this.crickets = SFX.loop('crickets', this.cricketVol);
    this.clock = SFX.loop('clock', 0.22);
    this.tvSound = SFX.loop('tv', 0.12);
    this.drips = SFX.loop('drips', 0.12);

    this.interactables = [
      { x: 19 * T + 8, y: 2 * T + 8, r: 26, when: () => true,
        act: () => this.say('Someone carved this a long time ago.') },
      { x: CHAIR.x, y: CHAIR.y, r: 24, when: () => this.state === 'intro',
        act: () => this.dialogueDone ? this.doze() : this.say('Let them finish their game first.', 2500) },
      { x: TV.x, y: TV.y + 8, r: 22, when: () => this.state === 'intro',
        act: () => this.say('The weather again. More rain on the way.', 3000) },
      { x: 16 * T, y: 5 * T + 12, r: 40, when: () => this.state === 'intro' && this.boysPresent && this.dialogueDone,
        act: () => this.say('"Play nicely, you two. I\'m having a rest."', 3000) },
      { x: 16 * T, y: 5 * T + 12, r: 40, when: () => this.state === 'search' && !this.boysPresent,
        act: () => this.say('Their game is still out. The chairs are pushed back.', 3500) },
      { x: CHAIR.x, y: CHAIR.y, r: 24, when: () => this.state === 'search',
        act: () => this.say('Not now. Where are the boys?', 2500) },
    ];

    this.cameras.main.fadeIn(1500, 0, 0, 0);
    this.intro();
  }

  makeProps() {
    // The carved stone on the counter.
    const stone = this.add.graphics().setDepth(5);
    stone.fillStyle(0x6f6f6a, 1).fillEllipse(19 * T + 8, 2 * T + 8, 11, 8);
    stone.lineStyle(1, 0x3a3a36, 1).strokeCircle(19 * T + 8, 2 * T + 8, 2);
    stone.lineBetween(19 * T + 5, 2 * T + 6, 19 * T + 11, 2 * T + 10);

    // The TV screen, flickering.
    this.tvScreen = this.add.rectangle(TV.x, TV.y, 30, 8, 0x8fb0d8).setDepth(5);

    // The back door (closed until Henry wakes).
    this.door = this.add.rectangle(DOOR.x, DOOR.y, T, T, 0x6a4628).setDepth(5);
    this.doorKnob = this.add.rectangle(DOOR.x + 5, DOOR.y, 2, 2, 0xc8b060).setDepth(6);

    // Justin (blue) and Phillip (green) at the table.
    const boy = (tx, ty, col) => {
      const p = tileCentre(tx, ty);
      const c = this.add.container(p.x, p.y).setDepth(10);
      c.add(this.add.rectangle(0, 2, 9, 9, col));
      c.add(this.add.circle(0, -4, 3.5, 0xe0c0a0));
      this.tweens.add({ targets: c, y: p.y - 1, duration: 400 + Math.random() * 300, yoyo: true, repeat: -1, repeatDelay: 1500 + Math.random() * 2000 });
      return c;
    };
    this.justin = boy(13, 5, 0x3a5ea8);
    this.phillip = boy(18, 5, 0x4a8a4a);
  }

  async speak(who, name, text, ms) {
    this.bubble(who.x, who.y - 10, text, ms, name);
    await this.wait(ms + 350);
  }

  // ---------- story beats ----------

  async intro() {
    await this.wait(1200);
    this.say('Three days of rain. It has only just stopped.', 3500);
    await this.wait(3000);
    SFX.play('dice', { vol: 0.5 });
    await this.wait(900);
    await this.speak(this.phillip, 'PHILLIP', 'You moved four. You threw a three.', 2800);
    await this.speak(this.justin, 'JUSTIN', 'I threw a four.', 2200);
    await this.speak(this.phillip, 'PHILLIP', "Grandpa! Justin's cheating.", 3000);
    this.dialogueDone = true;
    await this.wait(700);
    if (this.state === 'intro') this.say('Henry is too tired to referee. His armchair is in front of the TV.', 5000);
  }

  async doze() {
    this.state = 'doze';
    this.frozen = true;
    this.setControlsVisible(false);
    this.hx = CHAIR.x; this.hy = CHAIR.y;
    this.fx = 0; this.fy = -1; // facing the TV
    for (let i = 0; i < 3; i++) {
      const z = this.add.text(this.hx + 4, this.hy - 10, 'z', { fontFamily: 'Arial', fontSize: '8px', color: '#e8e2d0' }).setDepth(1100);
      this.tweens.add({ targets: z, y: z.y - 14, x: z.x + 4, alpha: 0, delay: i * 700, duration: 1400, onComplete: () => z.destroy() });
    }
    await this.wait(1600);
    this.cameras.main.fadeOut(3000, 0, 0, 0);
    await this.wait(3300);

    // In the dark: everything stops. Even the TV.
    this.clock.stop(2);
    this.tvSound.stop(2);
    this.drips.stop(2);
    this.crickets.setVolume(0, 1.5);
    this.cricketVol = 0;
    await this.wait(3000);

    this.tvOn = false;
    this.tvScreen.setFillStyle(0x1a1c20);
    this.justin.destroy();
    this.phillip.destroy();
    this.boysPresent = false;
    this.doorOpen = true;
    // the door now hangs open, swung out onto the lawn
    this.door.destroy();
    this.doorKnob.destroy();
    this.add.rectangle(DOOR.x - T / 2, DOOR.y + T / 2, 3, T - 2, 0x6a4628).setOrigin(0, 0).setDepth(5);
    const wake = tileCentre(27, 7);
    this.hx = wake.x; this.hy = wake.y;
    this.state = 'search';

    this.cameras.main.fadeIn(2500, 0, 0, 0);
    await this.wait(1500);
    this.say('Henry wakes. The house is silent.', 3200);
    await this.wait(3600);
    this.frozen = false;
    this.setControlsVisible(true);
    this.drips = SFX.loop('drips', 0.0);
    this.say('"Justin? Phillip?"', 2500);
    await this.wait(4000);
    if (this.state === 'search' && this.hy < 11 * T) this.say('The back door is open.', 3000);
  }

  playLaugh() {
    const src = LAUGH_PATH[this.laughIdx];
    const d = Phaser.Math.Distance.Between(this.hx, this.hy, src.x, src.y);
    const vol = 0.55 * Phaser.Math.Clamp(1 - d / (28 * T), 0.12, 1);
    const pan = Phaser.Math.Clamp((src.x - this.hx) / (10 * T), -0.85, 0.85);
    SFX.play('laugh', { vol, pan });
    if (Math.random() < 0.4) {
      this.time.delayedCall(220 + Math.random() * 200, () => SFX.play('laugh', { vol: vol * 0.8, pan: Phaser.Math.Clamp(pan + 0.15, -1, 1), rate: 1.08 }));
    }
    this.bubble(src.x, src.y, '(laughter)', 1800, null, true);
    if (!this.firstLaughHeard) {
      this.firstLaughHeard = true;
      this.time.delayedCall(1200, () => this.say('Laughter. Out in the corn.', 3000));
    }
  }

  startLure() {
    this.state = 'lure';
    // The crickets stop. All of them, at once.
    this.crickets.stop(0.3);
    this.cricketVol = 0;
    this.lure = { x: 0, y: 0, placed: false, count: 0, leaveTime: 0, startDist: 0 };
    this.lureLoop();
  }

  async lureLoop() {
    await this.wait(3000);
    while (this.state === 'lure') {
      if (!this.lure.placed) {
        // Fix the voice at one spot ahead of Henry, deeper in the field, on a
        // path. It never moves after this.
        const tx = Phaser.Math.Clamp(Math.round((this.hx / T - 4) / 3) * 3 + 4, 4, 40);
        const hty = Math.floor(this.hy / T);
        const ty = hty + TUNING.lureDistanceTiles <= 48 ? hty + TUNING.lureDistanceTiles : hty - TUNING.lureDistanceTiles;
        const p = tileCentre(tx, ty);
        Object.assign(this.lure, { x: p.x, y: p.y, placed: true });
        this.lure.startDist = Phaser.Math.Distance.Between(this.hx, this.hy, p.x, p.y);
      }
      this.lure.bubble = this.bubble(this.lure.x, this.lure.y - 4, 'Grandpa. Come see.', 3000, null, true);
      SFX.speakLure('Grandpa. Come see.');
      this.lure.count++;
      await this.wait(TUNING.lureEverySeconds * 1000);
      if (this.state === 'lure' && this.lure.count >= TUNING.lureRepeats) this.strike();
    }
  }

  // Something hits Henry in the back. He thinks the boys are throwing rocks.
  async strike() {
    if (this.state === 'strike' || this.state === 'kill') return;
    this.state = 'strike';
    this.frozen = true;
    this.setControlsVisible(false);
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (this.lure && this.lure.bubble && this.lure.bubble.active) this.lure.bubble.destroy();
    this.markers = [];

    SFX.play('strike', { vol: 1 });
    SFX.vibrate(250);
    const cam = this.cameras.main;
    cam.shake(450, 0.035);
    cam.flash(80, 255, 255, 255);
    this.minLight = 4.5 * T;
    // he stumbles forward
    this.tweens.add({ targets: this, hx: this.hx + this.fx * 5, hy: this.hy + this.fy * 5, duration: 150 });

    await this.wait(500);
    // Something dark and round rolls past his feet and stops in the light.
    const px = -this.fy, py = this.fx; // perpendicular
    const from = { x: this.hx - this.fx * 40 + px * 6, y: this.hy - this.fy * 40 + py * 6 };
    const to = { x: this.hx + this.fx * 30 + px * 6, y: this.hy + this.fy * 30 + py * 6 };
    const ball = this.add.container(from.x, from.y).setDepth(18);
    const g = this.add.graphics();
    g.fillStyle(0x15100e, 1).fillCircle(0, 0, 5);
    g.fillStyle(0x2a201c, 1).fillCircle(-2, -1, 1.5);
    ball.add(g);
    SFX.play(to.x >= from.x ? 'rollLR' : 'rollRL', { vol: 0.7 });
    this.tweens.add({ targets: ball, x: to.x, y: to.y, angle: 720, duration: 1200, ease: 'Quad.easeOut' });

    await this.wait(1700);
    this.bubble(this.hx, this.hy - 10, 'Now they\'re throwing rocks at me.', 2600, 'HENRY');
    await this.wait(2900);

    // He walks to it and picks it up.
    this.tweens.add({ targets: this, hx: to.x - this.fx * 8, hy: to.y - this.fy * 8, duration: 700 });
    await this.wait(800);
    this.tweens.add({ targets: this.playerBody, scaleY: 0.75, duration: 200, yoyo: true, hold: 300 });
    await this.wait(400);
    this.tweens.add({ targets: ball, x: this.hx + this.fx * 6, y: this.hy - 4, duration: 300 });
    await this.wait(900);

    // He screams.
    SFX.play('scream', { vol: 0.9 });
    SFX.vibrate(200);
    cam.shake(600, 0.012);
    await this.wait(1100);
    this.tweens.add({ targets: ball, x: ball.x + this.fx * 3, y: ball.y + 7, duration: 200 }); // he drops it
    await this.wait(1200);

    // In his shock he never hears it come up behind him.
    this.state = 'kill';
    await this.killFromBehind();
    this.scene.start('End', { mode: 'prologue' });
  }

  // ---------- every frame ----------

  update(time, delta) {
    const dt = Math.min(delta, 100) / 1000;
    this.readKeys();
    if (Controls.lanternPressed && (this.state === 'intro' || this.state === 'search' || this.state === 'lure')) this.toggleLantern();
    this.movePlayer(dt);
    this.updateCamera();
    this.updateInteract();
    this.updateStory(dt);
    this.updateMarkers();

    const inside = this.hy < 12 * T;
    const lit = this.state === 'intro' || this.state === 'doze';
    const target = lit ? TUNING.houseLitDarkness : (inside ? TUNING.houseDarkness : TUNING.outsideDarkness);
    this.ambient += (target - this.ambient) * 0.08;
    const lights = [];
    if (this.tvOn) {
      const fl = 0.75 + 0.25 * Math.sin(time / 130) * Math.sin(time / 47);
      this.tvScreen.setFillStyle(Phaser.Display.Color.GetColor(110 + 60 * fl, 140 + 60 * fl, 200 + 40 * fl));
      lights.push({ x: TV.x, y: TV.y + 20, r: 50 * fl });
    }
    this.drawDarkness(time, this.ambient, lit ? [30, 16, 4] : [3, 5, 14], lights);
    Controls.crickets = this.cricketVol / TUNING.cricketVolume;
    this.endFrame();
  }

  updateStory(dt) {
    const outside = this.hy > 12 * T;

    if (this.state === 'search') {
      // Crickets and dripping come back as Henry nears the open door.
      const doorD = Phaser.Math.Distance.Between(this.hx, this.hy, DOOR.x, DOOR.y);
      const target = outside ? TUNING.cricketVolume : Phaser.Math.Clamp(TUNING.cricketVolume * (1 - doorD / (9 * T)), 0, TUNING.cricketVolume);
      if (Math.abs(target - this.cricketVol) > 0.01) {
        this.cricketVol = target;
        this.crickets.setVolume(target, 0.4);
        this.drips.setVolume(target * 0.4, 0.4);
      }

      // The boys' laughter, deeper in the field, moving away as Henry follows.
      if (!this.laughStarted && (outside || doorD < 6 * T)) { this.laughStarted = true; this.laughTimer = 0.8; }
      if (this.laughStarted) {
        while (this.laughIdx < LAUGH_PATH.length - 1 &&
          Phaser.Math.Distance.Between(this.hx, this.hy, LAUGH_PATH[this.laughIdx].x, LAUGH_PATH[this.laughIdx].y) < 6 * T) {
          this.laughIdx++;
        }
        this.laughTimer -= dt;
        if (this.laughTimer <= 0) { this.playLaugh(); this.laughTimer = 4 + Math.random() * 3; }
      }

      // Near the middle of the field, everything goes quiet.
      const centreD = Phaser.Math.Distance.Between(this.hx, this.hy, FIELD_CENTRE.x, FIELD_CENTRE.y);
      if (this.hy > this.map.FIELD.y0 * T && (centreD < 6 * T || this.hy > 37 * T)) {
        this.drips.stop(0.3);
        this.startLure();
      }
    }

    if (this.state === 'lure' && this.lure.placed) {
      const d = Phaser.Math.Distance.Between(this.hx, this.hy, this.lure.x, this.lure.y);
      if (d < TUNING.lureKillTiles * T) { this.strike(); return; }
      const leaving = d > this.lure.startDist + 1.5 * T || this.hy < this.map.FIELD.y0 * T;
      this.lure.leaveTime = leaving ? this.lure.leaveTime + dt : Math.max(0, this.lure.leaveTime - dt * 0.5);
      if (this.lure.leaveTime > TUNING.leaveSeconds) this.strike();
    }
  }
}
