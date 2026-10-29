// The prologue: farmhouse at night -> Henry dozes -> the boys are gone ->
// the cornfield -> the voice that doesn't move -> the end.
//
// States: 'intro' (house, boys playing) -> 'doze' -> 'search' (boys gone,
// field) -> 'lure' (crickets stop, the voice) -> 'strike' -> 'kill'.
const T = MAP.TILE;
const tileCentre = (tx, ty) => ({ x: tx * T + T / 2, y: ty * T + T / 2 });
let RUN_ID = 0;

const TUNING = {
  walkSpeed: 38,         // pixels per second
  runSpeed: 70,
  cornWalkSpeed: 14,     // pushing through corn is slow
  cornRunSpeed: 20,
  lanternOnRadius: 5 * T,
  lanternOffRadius: 1.5 * T,
  houseLitDarkness: 0.35, // before Henry dozes
  houseDarkness: 0.86,    // after he wakes
  outsideDarkness: 0.95,
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

class PrologueScene extends Phaser.Scene {
  constructor() { super('Prologue'); }

  create() {
    this.runId = ++RUN_ID;
    Controls.reset();
    SFX.stopAll();

    if (!this.textures.exists('mapBase')) {
      const { base, top } = MAP.paint();
      this.textures.addCanvas('mapBase', base);
      this.textures.addCanvas('mapTop', top);
    }
    this.add.image(0, 0, 'mapBase').setOrigin(0).setDepth(0);
    this.add.image(0, 0, 'mapTop').setOrigin(0).setDepth(20);

    this.makeProps();
    this.makeHenry();
    this.makeDarkness();

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,F,SHIFT,SPACE');

    this.scene.launch('UI');
    this.ui = this.scene.get('UI');
    this.events.once('shutdown', () => { this.scene.stop('UI'); SFX.stopAll(); });

    this.state = 'intro';
    this.frozen = false;
    this.doorOpen = false;
    this.dialogueDone = false;
    this.boysPresent = true;
    this.lanternOn = true;
    this.ambient = TUNING.houseLitDarkness;
    this.lightRadius = TUNING.lanternOnRadius;
    this.minLight = 0;
    this.noiseTimer = 0;
    this.laughStarted = false;
    this.laughIdx = 0;
    this.laughTimer = 0;
    this.firstLaughHeard = false;
    this.cricketVol = 0.05;
    this.lure = null;

    this.crickets = SFX.loop('crickets', this.cricketVol);
    this.clock = SFX.loop('clock', 0.25);

    this.interactables = [
      { x: 19 * T + 8, y: 2 * T + 8, r: 26, when: () => true,
        act: () => this.say('Someone carved this a long time ago.') },
      { x: 30 * T + 8, y: 4 * T + 8, r: 24, when: () => this.state === 'intro',
        act: () => this.dialogueDone ? this.doze() : this.say('Let them finish their game first.', 2500) },
      { x: 16 * T, y: 5 * T + 12, r: 40, when: () => this.state === 'intro' && this.boysPresent && this.dialogueDone,
        act: () => this.say('"Play nicely, you two. I\'m having a rest."', 3000) },
      { x: 16 * T, y: 5 * T + 12, r: 40, when: () => this.state === 'search' && !this.boysPresent,
        act: () => this.say('Their game is still out. The chairs are pushed back.', 3500) },
      { x: 30 * T + 8, y: 4 * T + 8, r: 24, when: () => this.state === 'search',
        act: () => this.say('Not now. Where are the boys?', 2500) },
    ];

    this.cameras.main.fadeIn(1500, 0, 0, 0);
    this.intro();
  }

  // ---------- building things ----------

  makeProps() {
    // The carved stone on the counter.
    const stone = this.add.graphics().setDepth(5);
    stone.fillStyle(0x6f6f6a, 1).fillEllipse(19 * T + 8, 2 * T + 8, 11, 8);
    stone.lineStyle(1, 0x3a3a36, 1).strokeCircle(19 * T + 8, 2 * T + 8, 2);
    stone.lineBetween(19 * T + 5, 2 * T + 6, 19 * T + 11, 2 * T + 10);

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

    this.marker = this.add.graphics().setDepth(1100).setVisible(false);
    this.marker.fillStyle(0xffffff, 0.9).fillTriangle(-3, 0, 3, 0, 0, 4);
  }

  makeHenry() {
    const start = tileCentre(27, 7);
    this.hx = start.x;
    this.hy = start.y;
    this.fx = 0; this.fy = 1; // facing
    this.henry = this.add.container(this.hx, this.hy).setDepth(15);
    this.henryBody = this.add.rectangle(0, 1, 10, 11, 0x8a7a62);
    this.henryHead = this.add.circle(0, -5, 3.5, 0xd9b99b);
    this.henryNose = this.add.rectangle(0, -3, 2, 2, 0x5a4a3a);
    this.henryLamp = this.add.rectangle(6, 3, 3, 4, 0xffd27a);
    this.henry.add([this.henryBody, this.henryHead, this.henryNose, this.henryLamp]);
  }

  makeDarkness() {
    const { width, height } = this.scale;
    if (!this.textures.exists('dark')) this.textures.createCanvas('dark', width, height);
    this.darkTex = this.textures.get('dark');
    this.darkCtx = this.darkTex.getContext();
    this.add.image(0, 0, 'dark').setOrigin(0).setScrollFactor(0).setDepth(1000);
  }

  // ---------- helpers ----------

  wait(ms) {
    const id = this.runId;
    return new Promise(res => this.time.delayedCall(ms, () => { if (id === this.runId && this.scene.isActive()) res(); }));
  }

  say(text, ms = 3500) {
    if (this.ui && this.ui.captionText) this.ui.caption(text, ms);
  }

  // A speech bubble in the world, above (x, y). Returns it; it removes itself.
  bubble(x, y, text, ms, name) {
    const c = this.add.container(Math.round(x), Math.round(y)).setDepth(1100);
    const t = this.add.text(0, 0, text, {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#111111', align: 'center', wordWrap: { width: 150 },
    }).setOrigin(0.5, 1);
    const pad = 4;
    let h = t.height + pad * 2;
    let w = t.width + pad * 2;
    let label = null;
    if (name) {
      label = this.add.text(0, 0, name, { fontFamily: 'Arial, sans-serif', fontSize: '7px', color: '#6a6458' }).setOrigin(0.5, 1);
      h += label.height;
      w = Math.max(w, label.width + pad * 2);
    }
    const g = this.add.graphics();
    g.fillStyle(0xf2efe6, 1).fillRoundedRect(-w / 2, -h - 5, w, h, 3);
    g.fillTriangle(-4, -6, 4, -6, 0, 0);
    t.setPosition(0, -5 - pad);
    c.add([g, t]);
    if (label) { label.setPosition(0, -5 - pad - t.height); c.add(label); }
    // keep the bubble on screen horizontally (the world is wider than the bubble)
    c.x = Phaser.Math.Clamp(c.x, w / 2 + 2, MAP.W * T - w / 2 - 2);
    c.setScale(0.8);
    this.tweens.add({ targets: c, scale: 1, duration: 120 });
    this.time.delayedCall(ms, () => { if (c.active) c.destroy(); });
    return c;
  }

  async speak(who, name, text, ms) {
    this.bubble(who.x, who.y - 10, text, ms, name);
    await this.wait(ms + 350);
  }

  ring(radius, alpha) {
    const r = this.add.circle(Math.round(this.hx), Math.round(this.hy + 2), radius).setStrokeStyle(1, 0xe8e0c8, alpha).setDepth(1050);
    r.setScale(0.3);
    this.tweens.add({ targets: r, scale: 1, alpha: 0, duration: 650, ease: 'Quad.easeOut', onComplete: () => r.destroy() });
  }

  setControlsVisible(v) {
    if (this.ui && this.ui.setVisibleControls) this.ui.setVisibleControls(v);
  }

  // ---------- story beats ----------

  async intro() {
    await this.wait(1800);
    SFX.play('dice', { vol: 0.5 });
    await this.wait(900);
    await this.speak(this.phillip, 'PHILLIP', 'You moved four. You threw a three.', 2800);
    await this.speak(this.justin, 'JUSTIN', 'I threw a four.', 2200);
    await this.speak(this.phillip, 'PHILLIP', "Grandpa! Justin's cheating.", 3000);
    this.dialogueDone = true;
    await this.wait(700);
    if (this.state === 'intro') this.say('Henry is too tired to referee. His armchair is in the lounge.', 5000);
  }

  async doze() {
    this.state = 'doze';
    this.frozen = true;
    this.setControlsVisible(false);
    const chair = tileCentre(30, 4);
    this.hx = chair.x; this.hy = chair.y;
    this.fx = 0; this.fy = 1;
    for (let i = 0; i < 3; i++) {
      const z = this.add.text(this.hx + 4, this.hy - 10, 'z', { fontFamily: 'Arial', fontSize: '8px', color: '#e8e2d0' }).setDepth(1100);
      this.tweens.add({ targets: z, y: z.y - 14, x: z.x + 4, alpha: 0, delay: i * 700, duration: 1400, onComplete: () => z.destroy() });
    }
    await this.wait(1600);
    this.cameras.main.fadeOut(3000, 0, 0, 0);
    await this.wait(3300);

    // In the dark: everything stops.
    this.clock.stop(2);
    this.crickets.setVolume(0, 1.5);
    this.cricketVol = 0;
    await this.wait(3000);

    this.justin.destroy();
    this.phillip.destroy();
    this.boysPresent = false;
    this.doorOpen = true;
    // the door now hangs open, swung out onto the lawn
    this.door.destroy();
    this.doorKnob.destroy();
    this.add.rectangle(DOOR.x - T / 2, DOOR.y + T / 2, 3, T - 2, 0x6a4628).setOrigin(0, 0).setDepth(5);
    const wake = tileCentre(30, 5);
    this.hx = wake.x; this.hy = wake.y;
    this.state = 'search';

    this.cameras.main.fadeIn(2500, 0, 0, 0);
    await this.wait(1500);
    this.say('Henry wakes. The house is silent.', 3200);
    await this.wait(3600);
    this.frozen = false;
    this.setControlsVisible(true);
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
    if (!this.firstLaughHeard) {
      this.firstLaughHeard = true;
      this.time.delayedCall(1200, () => this.say('Laughter. Out in the corn.', 3000));
    }
  }

  startLure() {
    this.state = 'lure';
    // The crickets stop. All of them, at once.
    this.crickets.stop(0.3);
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
      this.lure.bubble = this.bubble(this.lure.x, this.lure.y - 4, 'Grandpa. Come see.', 3000);
      SFX.speakLure();
      this.lure.count++;
      await this.wait(TUNING.lureEverySeconds * 1000);
      if (this.state === 'lure' && this.lure.count >= TUNING.lureRepeats) this.strike();
    }
  }

  async strike() {
    if (this.state === 'strike' || this.state === 'kill') return;
    this.state = 'strike';
    this.frozen = true;
    this.setControlsVisible(false);
    if (window.speechSynthesis) speechSynthesis.cancel();
    if (this.lure && this.lure.bubble && this.lure.bubble.active) this.lure.bubble.destroy();

    // Hit from behind.
    SFX.play('strike', { vol: 1 });
    SFX.vibrate(250);
    const cam = this.cameras.main;
    cam.shake(450, 0.035);
    cam.flash(80, 255, 255, 255);
    this.henry.setAngle(this.fx >= 0 ? 90 : -90);
    this.minLight = 4.5 * T; // the lantern hits the ground and flares

    await this.wait(800);
    // Something dark and round rolls past his feet.
    const px = -this.fy, py = this.fx; // perpendicular
    const from = { x: this.hx - this.fx * 50 + px * 7, y: this.hy - this.fy * 50 + py * 7 };
    const to = { x: this.hx + this.fx * 75 + px * 7, y: this.hy + this.fy * 75 + py * 7 };
    const ball = this.add.container(from.x, from.y).setDepth(18);
    const g = this.add.graphics();
    g.fillStyle(0x15100e, 1).fillCircle(0, 0, 5);
    g.fillStyle(0x2a201c, 1).fillCircle(-2, -1, 1.5);
    ball.add(g);
    SFX.play(to.x >= from.x ? 'rollLR' : 'rollRL', { vol: 0.8 });
    this.tweens.add({ targets: ball, x: to.x, y: to.y, angle: 900, duration: 1300, ease: 'Quad.easeOut' });

    await this.wait(2600);
    this.kill();
  }

  async kill() {
    this.state = 'kill';
    SFX.play('grab', { vol: 1 });
    SFX.vibrate(400);
    this.cameras.main.shake(380, 0.06);
    this.minLight = 5 * T;

    // A large black hand, holding something small and red, in front of Henry.
    const pos = { x: this.hx + this.fx * 36, y: this.hy + this.fy * 36 };
    const hand = this.add.container(pos.x, pos.y).setDepth(500);
    hand.rotation = Math.atan2(this.fx, -this.fy); // fingers point at Henry, arm stretches away
    const h = this.add.graphics();
    h.fillStyle(0x000000, 1);
    h.fillRect(-9, -220, 18, 212);         // the arm, reaching out of the dark
    h.fillEllipse(0, -2, 40, 30);         // palm
    h.fillEllipse(-21, -6, 10, 22);       // thumb
    const heart = this.add.graphics();
    heart.fillStyle(0xb01818, 1);
    heart.fillCircle(-3, -2, 4).fillCircle(3, -2, 4).fillTriangle(-7, -1, 7, -1, 0, 7);
    heart.setPosition(0, 8);
    const f = this.add.graphics();
    f.fillStyle(0x000000, 1);
    [[-15, 22], [-6, 26], [6, 26], [15, 22]].forEach(([x, len], i) => {
      f.fillRect(x - 2.5, 4, 5, len);                       // long fingers
      f.fillRect(x + (i < 2 ? 0 : -4), 4 + len - 4, 6.5, 4); // curling in at the tips
    });
    hand.add([h, heart, f]);
    hand.setScale(0.5);
    this.tweens.add({ targets: hand, scale: 1.15, duration: 140, ease: 'Back.easeOut' });

    // The heartbeat slows... and stops. The phone shakes with each beat.
    await this.wait(700);
    const gaps = [620, 680, 760, 860, 990, 1150, 1380, 1700, 2150, 2800];
    for (let i = 0; i < gaps.length; i++) {
      if (this.state !== 'kill') return;
      const k = i / gaps.length;
      SFX.play('heartbeat', { vol: 1 - k * 0.55 });
      SFX.vibrate([Math.round(70 - k * 45), 110, Math.round(45 - k * 30)]);
      heart.setScale(1.45 - k * 0.3);
      this.tweens.add({ targets: heart, scale: 1, duration: 260, ease: 'Quad.easeOut' });
      if (i >= gaps.length - 3) heart.setAlpha(0.85 - (i - (gaps.length - 3)) * 0.2);
      await this.wait(gaps[i]);
    }
    await this.wait(1500);

    // Cut to black.
    SFX.stopAll();
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(5000);
    await this.wait(300);
    this.scene.start('End');
  }

  // ---------- every frame ----------

  update(time, delta) {
    const dt = Math.min(delta, 100) / 1000;
    this.handleInput(dt);
    this.updateCamera();
    this.updateInteract();
    this.updateStory(dt);
    this.drawDarkness(time);
    Controls.actPressed = false;
    Controls.lanternPressed = false;
  }

  handleInput(dt) {
    const k = this.keys;
    const JD = Phaser.Input.Keyboard.JustDown;
    if (JD(k.E) || JD(k.SPACE)) Controls.actPressed = true;
    if (JD(k.F)) Controls.lanternPressed = true;

    if (Controls.lanternPressed && (this.state === 'intro' || this.state === 'search' || this.state === 'lure')) {
      this.lanternOn = !this.lanternOn;
      SFX.play('click', { vol: 0.5 });
    }
    this.henryLamp.setFillStyle(this.lanternOn ? 0xffd27a : 0x5a4a30);

    let mx = Controls.moveX, my = Controls.moveY, run = Controls.run;
    const kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (kx || ky) {
      const l = Math.hypot(kx, ky);
      mx = kx / l; my = ky / l; run = k.SHIFT.isDown;
    }
    if (this.frozen) { mx = 0; my = 0; }

    const moving = mx !== 0 || my !== 0;
    const ground = MAP.tileAtPx(this.hx, this.hy + 3);
    const inCorn = ground === 'C';
    let speed = inCorn ? (run ? TUNING.cornRunSpeed : TUNING.cornWalkSpeed) : (run ? TUNING.runSpeed : TUNING.walkSpeed);

    if (moving) {
      this.fx = mx; this.fy = my;
      this.tryMove(mx * speed * dt, 0);
      this.tryMove(0, my * speed * dt);

      // Noise: corn is loud, running is a bit loud, walking is quiet.
      this.noiseTimer -= dt;
      if (this.noiseTimer <= 0) {
        if (inCorn) {
          SFX.play('rustle', { vol: 0.5, rate: 0.9 + Math.random() * 0.2 });
          this.ring(26, 0.45);
          this.noiseTimer = 0.5;
        } else if (run) {
          SFX.play('step', { vol: 0.3 });
          this.ring(14, 0.22);
          this.noiseTimer = 0.3;
        } else {
          SFX.play('step', { vol: 0.06 });
          this.noiseTimer = 0.45;
        }
      }
    } else {
      this.noiseTimer = 0;
    }

    // Draw Henry (rounded to whole pixels so he stays crisp).
    this.henry.setPosition(Math.round(this.hx), Math.round(this.hy));
    if (this.state !== 'strike' && this.state !== 'kill') {
      const ax = Math.round(this.fx * 1.5), ay = Math.round(this.fy * 1.5);
      this.henryHead.setPosition(ax, -5 + ay * 0.5);
      this.henryNose.setPosition(ax * 2, -5 + ay * 2);
      this.henryLamp.setPosition(this.fx < -0.3 ? -6 : 6, 3);
    }
  }

  tryMove(dx, dy) {
    const nx = this.hx + dx, ny = this.hy + dy;
    const blocked = (x, y) => MAP.isBlockedPx(x, y, this.doorOpen);
    // Henry's feet: a small box below his centre.
    if (blocked(nx - 4, ny) || blocked(nx + 4, ny) || blocked(nx - 4, ny + 5) || blocked(nx + 4, ny + 5)) return;
    this.hx = nx; this.hy = ny;
  }

  updateCamera() {
    const cam = this.cameras.main;
    const { width, height } = this.scale;
    cam.scrollX = Phaser.Math.Clamp(Math.round(this.hx - width / 2), 0, MAP.W * T - width);
    cam.scrollY = Phaser.Math.Clamp(Math.round(this.hy - height / 2), 0, MAP.H * T - height);
  }

  updateInteract() {
    let best = null, bestD = Infinity;
    if (!this.frozen) {
      for (const it of this.interactables) {
        if (!it.when()) continue;
        const d = Phaser.Math.Distance.Between(this.hx, this.hy, it.x, it.y);
        if (d < it.r && d < bestD) { best = it; bestD = d; }
      }
    }
    Controls.actAvailable = !!best;
    if (best) {
      this.marker.setVisible(true).setPosition(Math.round(best.x), Math.round(best.y - 12 + Math.sin(this.time.now / 200) * 1.5));
      if (Controls.actPressed) best.act();
    } else {
      this.marker.setVisible(false);
    }
  }

  updateStory(dt) {
    const outside = this.hy > 12 * T;

    if (this.state === 'search') {
      // Crickets come back as Henry nears the open door.
      const doorD = Phaser.Math.Distance.Between(this.hx, this.hy, DOOR.x, DOOR.y);
      const target = outside ? 0.32 : Phaser.Math.Clamp(0.32 * (1 - doorD / (9 * T)), 0, 0.32);
      if (Math.abs(target - this.cricketVol) > 0.01) {
        this.cricketVol = target;
        this.crickets.setVolume(target, 0.4);
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
      if (this.hy > MAP.FIELD.y0 * T && (centreD < 6 * T || this.hy > 37 * T)) this.startLure();
    }

    if (this.state === 'lure' && this.lure.placed) {
      const d = Phaser.Math.Distance.Between(this.hx, this.hy, this.lure.x, this.lure.y);
      if (d < TUNING.lureKillTiles * T) { this.strike(); return; }
      const leaving = d > this.lure.startDist + 1.5 * T || this.hy < MAP.FIELD.y0 * T;
      this.lure.leaveTime = leaving ? this.lure.leaveTime + dt : Math.max(0, this.lure.leaveTime - dt * 0.5);
      if (this.lure.leaveTime > TUNING.leaveSeconds) this.strike();
    }
  }

  drawDarkness(time) {
    const inside = this.hy < 12 * T;
    let target;
    if (this.state === 'intro' || this.state === 'doze') target = TUNING.houseLitDarkness;
    else target = inside ? TUNING.houseDarkness : TUNING.outsideDarkness;
    this.ambient += (target - this.ambient) * 0.08;

    const wantR = Math.max(this.minLight, this.lanternOn ? TUNING.lanternOnRadius : TUNING.lanternOffRadius);
    this.lightRadius += (wantR - this.lightRadius) * 0.25;
    const flicker = 1 + 0.025 * Math.sin(time / 90) + 0.015 * Math.sin(time / 37);
    const r = this.lightRadius * flicker;

    const cam = this.cameras.main;
    const sx = this.hx - cam.scrollX, sy = this.hy - cam.scrollY;
    const ctx = this.darkCtx;
    const { width, height } = this.scale;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = (this.state === 'intro' || this.state === 'doze')
      ? `rgba(30,16,4,${this.ambient})` : `rgba(3,5,14,${this.ambient})`;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'destination-out';
    const grd = ctx.createRadialGradient(sx, sy, r * 0.35, sx, sy, r);
    grd.addColorStop(0, 'rgba(0,0,0,1)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    if (this.lanternOn && this.ambient > 0.5) {
      // a little warm lantern colour
      ctx.globalCompositeOperation = 'source-over';
      const warm = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      warm.addColorStop(0, 'rgba(255,170,80,0.10)');
      warm.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = warm;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    this.darkTex.refresh();
  }
}
