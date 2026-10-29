// Milestone 2: a test night on the Cole farm. Michael is alone at the edge of
// the field with the thing in it. Survive until dawn.
//
// What to try: walk the paths quietly; push through the corn (loud); run
// (loud); turn the lantern off and stand still; hide in the old pickup truck
// and hold your breath; turn and face it with the lantern.
// Debug view (DEBUG button or G): shows it and what it's thinking, and each
// press moves its reach line (nights 4, 5, 6, then the field only).
// Its numbers (NIGHT) are in FieldScene.js, shared with the story's nights.

// How far its reach goes (tile x of the line; it can't go further west).
const REACH = [
  { name: 'Night 4: the lawn', x: 12 },
  { name: 'Night 5: the yard', x: 9 },
  { name: 'Night 6: the porch', x: 5 },
  { name: 'Nights 1-3: the field only', x: 16 },
];

class TestNightScene extends FieldScene {
  constructor() { super('TestNight'); }

  create() {
    this.setupField(TEST_MAP, tileCentre(7, 17), { body: 0xd8d8d0, head: 0xc89a78, hair: 0x2a1a10 });
    this.fx = 1; this.fy = 0;
    this.state = 'night';
    this.timeLeft = NIGHT.seconds;
    this.oil = 1;
    this.hidden = false;
    this.holdingBreath = false;
    this.breath = 1;
    this.breathLock = 0;
    this.holdTime = 0;
    this.ignoreHold = false;
    this.debug = false;
    this.reachIdx = 0;
    this.reachX = REACH[0].x * T;
    this.cricketVol = NIGHT.cricketVolume;
    this.beatTimer = 0;
    this.taught = {};
    this.wasDebugPressed = false;

    this.crickets = SFX.loop('crickets', this.cricketVol);
    this.creature = new Creature(this, this.map.RING.x, this.map.RING.y);
    this.makeCreatureLook();
    this.reachGfx = this.add.graphics().setDepth(2);
    this.drawReach();

    // Lamp oil flasks.
    this.flasks = [tileCentre(8, 30), tileCentre(24, 8), tileCentre(45, 27)].map(p => {
      const g = this.add.container(p.x, p.y).setDepth(14);
      g.add(this.add.rectangle(0, 1, 5, 7, 0x8a6a2a));
      g.add(this.add.rectangle(0, -4, 3, 2, 0x4a3a20));
      return { ...p, g, taken: false };
    });
    this.interactables = [
      ...this.flasks.map(f => ({ x: f.x, y: f.y, r: 16, when: () => !f.taken, act: () => this.takeFlask(f) })),
      { x: 13 * T - 4, y: 19 * T + 10, r: 18, when: () => !this.hidden, act: () => this.hide() },
    ];

    // HUD: dawn timer and the breath meter.
    this.timerText = this.add.text(this.scale.width - 6, 22, '', { fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#8a8478' })
      .setOrigin(1, 0).setScrollFactor(0).setDepth(2000);
    this.breathBack = this.add.rectangle(0, 0, 30, 4, 0x000000, 0.7).setStrokeStyle(1, 0xbfd8ff, 0.6).setDepth(1100).setVisible(false);
    this.breathBar = this.add.rectangle(0, 0, 30, 4, 0xbfd8ff, 0.9).setDepth(1101).setVisible(false);
    this.debugGfx = this.add.graphics().setDepth(1200);
    this.debugText = this.add.text(6, 30, '', { fontFamily: 'monospace', fontSize: '8px', color: '#ff9090', backgroundColor: '#000000aa' })
      .setScrollFactor(0).setDepth(2000).setVisible(false);
    Controls.showDebugButton = true;

    this.cameras.main.fadeIn(1500, 0, 0, 0);
    this.time.delayedCall(800, () => this.say('Night. Something is in the corn. Survive until dawn.', 4500));
  }

  drawReach() {
    // Withered grass along the edge of its reach.
    const g = this.reachGfx;
    g.clear();
    const x = this.reachX;
    for (let ty = 1; ty < this.map.H - 1; ty++) {
      for (let i = 0; i < 5; i++) {
        const yy = ty * T + ((i * 7 + ty * 3) % 16);
        g.fillStyle(i % 2 ? 0x6b5a2a : 0x7a6a34, 1).fillRect(x - 4 + ((i * 5 + ty) % 8), yy, 2, 2);
      }
    }
  }

  onNoise(radius) {
    this.creature.hearNoise(radius);
  }

  async caught(cr) {
    if (this.state !== 'night') return;
    this.state = 'caught';
    cr.setState('caught');
    if (this.hidden) this.leaveHiding(true);
    // Michael ends up facing away from it: it always takes you from behind.
    const dx = this.hx - cr.x, dy = this.hy - cr.y;
    const l = Math.hypot(dx, dy) || 1;
    this.fx = dx / l; this.fy = dy / l;
    this.drawPlayer();
    this.crickets.stop(0.2);
    await this.killFromBehind();
    this.scene.start('End', { mode: 'caught' });
  }

  // ---------- Michael's actions ----------

  takeFlask(f) {
    f.taken = true;
    f.g.destroy();
    this.oil = Math.min(1, this.oil + NIGHT.oilPerFlask);
    SFX.play('click', { vol: 0.4 });
    this.say('Lamp oil.', 1500);
  }

  hide() {
    this.hidden = true;
    this.frozen = true;
    this.ignoreHold = true;
    this.wasLanternOn = this.lanternOn;
    this.lanternOn = false;
    this.player.setVisible(false);
    this.hidePos = { x: this.hx, y: this.hy };
    this.hx = 13 * T + 8; this.hy = 19 * T + 10; // in the cab
    SFX.play('click', { vol: 0.5, rate: 0.6 });
    if (!this.taught.hide) {
      this.taught.hide = true;
      this.say('Hiding in the truck. Hold ACT to hold your breath. Tap ACT to get out.', 5000);
    }
  }

  leaveHiding(silent) {
    this.hidden = false;
    this.frozen = false;
    this.holdingBreath = false;
    this.player.setVisible(true);
    this.hx = this.hidePos.x; this.hy = this.hidePos.y;
    if (!silent) {
      this.lanternOn = this.wasLanternOn && this.oil > 0;
      SFX.play('click', { vol: 0.5, rate: 0.6 });
    }
  }

  updateHiding(dt) {
    // Tap ACT to get out; hold ACT to hold your breath.
    const held = this.actHeld;
    if (this.ignoreHold) { if (!held) this.ignoreHold = false; return; }
    if (held) this.holdTime += dt;
    else {
      if (this.holdTime > 0 && this.holdTime < 0.25) { this.holdTime = 0; this.leaveHiding(false); return; }
      this.holdTime = 0;
    }
    this.breathLock = Math.max(0, this.breathLock - dt);
    this.holdingBreath = held && this.holdTime >= 0.25 && this.breathLock <= 0;
    if (this.holdingBreath) {
      this.breath -= dt / NIGHT.breathSeconds;
      if (this.breath <= 0) {
        // Out of breath: a gasp it can hear.
        this.breath = 0;
        this.holdingBreath = false;
        this.breathLock = 2;
        SFX.play('gasp', { vol: 0.8 });
        this.ring(5 * T, 0.4);
        this.creature.hearNoise(5 * T);
      }
    } else {
      this.breath = Math.min(1, this.breath + dt / 3);
    }
  }

  // ---------- every frame ----------

  update(time, delta) {
    const dt = Math.min(delta, 100) / 1000;
    this.readKeys();

    if (Controls.debugPressed) this.cycleDebug();
    if (this.state === 'night') {
      if (Controls.lanternPressed && !this.hidden) {
        if (this.oil > 0) this.toggleLantern();
        else this.say('The lantern is out of oil.', 2000);
      }
      if (this.lanternOn) {
        this.oil = Math.max(0, this.oil - dt / NIGHT.oilSeconds);
        if (this.oil <= 0) { this.lanternOn = false; this.say('The lantern sputters out. No oil left.', 3000); }
      }
      if (this.hidden) this.updateHiding(dt);
      this.movePlayer(dt);
      this.creature.update(dt);

      this.timeLeft -= dt;
      if (this.timeLeft <= 0) this.dawn();
    } else if (this.state === 'dawn') {
      this.creature.update(dt);
    }

    this.updateCamera();
    this.updateInteract();
    this.updateMarkers();
    this.updateSound(dt);
    this.drawCreature(time);
    this.drawHud();

    // Dawn creeps in over the last 30 seconds.
    const dawnK = Phaser.Math.Clamp(1 - this.timeLeft / 30, 0, 1);
    this.drawDarkness(time, NIGHT.darkness - 0.45 * dawnK, [3 + 40 * dawnK, 5 + 35 * dawnK, 14 + 30 * dawnK]);
    Controls.oil = this.oil;
    Controls.crickets = this.cricketVol / NIGHT.cricketVolume;
    this.endFrame();
  }

  drawHud() {
    const s = Math.max(0, Math.ceil(this.timeLeft));
    this.timerText.setText(this.state === 'night' ? `dawn in ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '');
    const showBreath = this.hidden;
    this.breathBack.setVisible(showBreath).setPosition(this.hx, this.hy - 22);
    this.breathBar.setVisible(showBreath).setPosition(this.hx - 15 + 15 * this.breath, this.hy - 22);
    this.breathBar.width = 30 * this.breath;
    this.breathBar.setFillStyle(this.holdingBreath ? 0xbfd8ff : 0x7a8aa0, 0.9);

    const g = this.debugGfx;
    g.clear();
    this.debugText.setVisible(this.debug);
    if (!this.debug) return;
    const cr = this.creature;
    g.lineStyle(1, 0xff4040, 0.9).strokeCircle(cr.x, cr.y, 7);
    g.fillStyle(0xff4040, 0.5).fillCircle(cr.x, cr.y, 4);
    g.lineStyle(1, 0xff4040, 0.25).strokeCircle(this.hx, this.hy, cr.sightRange());
    if (cr.target) g.lineStyle(1, 0xffa040, 0.5).lineBetween(cr.x, cr.y, cr.target.x, cr.target.y);
    if (cr.lure) g.lineStyle(1, 0x80c0ff, 0.8).strokeCircle(cr.lure.x, cr.lure.y, 6);
    g.lineStyle(1, 0xff4040, 0.6).lineBetween(this.reachX, 0, this.reachX, this.map.H * T);
    this.debugText.setText([
      `state: ${cr.state}`,
      `suspicion: ${cr.suspicion.toFixed(2)}`,
      `distance: ${(cr.distToPlayer() / T).toFixed(1)} tiles`,
      `it sees you within: ${(cr.sightRange() / T).toFixed(0)} tiles`,
      `reach: ${REACH[this.reachIdx].name}`,
    ].join('\n'));
  }

  // DEBUG / G: first press shows the debug view; each later press moves the
  // reach line to the next night; after the last one, the view hides again.
  cycleDebug() {
    if (!this.debug) { this.debug = true; return; }
    this.reachIdx++;
    if (this.reachIdx >= REACH.length) { this.reachIdx = 0; this.debug = false; }
    this.reachX = REACH[this.reachIdx].x * T;
    this.drawReach();
  }

  async dawn() {
    this.state = 'dawn';
    this.creature.goToSleep();
    if (this.hidden) this.leaveHiding(true);
    this.frozen = true;
    this.setControlsVisible(false);
    this.crickets.stop(3);
    this.say('Dawn. The crickets fall silent. So does everything else.', 4000);
    await this.wait(4500);
    this.cameras.main.fadeOut(1500, 40, 36, 30);
    await this.wait(1600);
    this.scene.start('End', { mode: 'dawn' });
  }
}
