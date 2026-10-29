// Shared pieces for every scene played on a map: the player, movement and
// noise, the lantern and darkness, speech bubbles (with direction markers),
// interaction, and the kill from behind.
const T = TILE;
const tileCentre = (tx, ty) => ({ x: tx * T + T / 2, y: ty * T + T / 2 });
let RUN_ID = 0;

const FIELD_TUNING = {
  walkSpeed: 38,          // pixels per second
  runSpeed: 70,
  cornWalkSpeed: 14,      // pushing through corn is slow
  cornRunSpeed: 20,
  cornNoiseTiles: 6,      // how far the noise carries (the size of the ring)
  runNoiseTiles: 4,
  lanternOnRadius: 5 * T,
  lanternOffRadius: 1.5 * T,
};

// Nights with the creature in them (the test night and the story's nights).
const NIGHT = {
  seconds: 240,             // how long until dawn
  darkness: 0.95,
  cricketVolume: 0.32,
  cricketsSilentTiles: 6,   // the crickets are silent when it is this close...
  cricketsFullTiles: 13,    // ...and full volume when it is this far away
  heartbeatTiles: 12,       // Michael's heartbeat starts when it is this close
  oilSeconds: 150,          // a full lantern lasts this long
  oilPerFlask: 0.35,
  breathSeconds: 6,         // how long Michael can hold his breath
};

class FieldScene extends Phaser.Scene {
  // look: colours for the player. start: {x, y} in pixels.
  setupField(map, start, look) {
    this.runId = ++RUN_ID;
    this.map = map;
    Controls.reset();
    SFX.stopAll();

    const baseKey = 'mapBase-' + map.key, topKey = 'mapTop-' + map.key;
    if (!this.textures.exists(baseKey)) {
      const { base, top } = map.paint();
      this.textures.addCanvas(baseKey, base);
      this.textures.addCanvas(topKey, top);
    }
    this.add.image(0, 0, baseKey).setOrigin(0).setDepth(0);
    this.add.image(0, 0, topKey).setOrigin(0).setDepth(20);

    this.hx = start.x; this.hy = start.y;
    this.fx = 0; this.fy = 1; // facing
    this.player = this.add.container(this.hx, this.hy).setDepth(15);
    this.playerBody = this.add.rectangle(0, 1, 10, 11, look.body);
    this.playerHead = this.add.circle(0, -5, 3.5, look.head);
    this.playerNose = this.add.rectangle(0, -3, 2, 2, look.hair);
    this.playerLamp = this.add.rectangle(6, 3, 3, 4, 0xffd27a);
    this.player.add([this.playerBody, this.playerHead, this.playerNose, this.playerLamp]);

    const { width, height } = this.scale;
    if (!this.textures.exists('dark')) this.textures.createCanvas('dark', width, height);
    this.darkTex = this.textures.get('dark');
    this.darkCtx = this.darkTex.getContext();
    this.add.image(0, 0, 'dark').setOrigin(0).setScrollFactor(0).setDepth(1000);

    this.markerGfx = this.add.graphics().setScrollFactor(0).setDepth(1150);
    this.markers = [];
    this.actMarker = this.add.graphics().setDepth(1100).setVisible(false);
    this.actMarker.fillStyle(0xffffff, 0.9).fillTriangle(-3, 0, 3, 0, 0, 4);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,F,G,SHIFT,SPACE');
    // Key presses are caught the moment they happen, so even a very quick tap
    // between two frames still counts.
    const kb = this.input.keyboard;
    kb.on('keydown-E', () => { if (!Controls.dialogueOpen) Controls.actPressed = true; });
    kb.on('keydown-SPACE', () => { if (!Controls.dialogueOpen) Controls.actPressed = true; });
    kb.on('keydown-F', () => { if (!Controls.dialogueOpen) Controls.lanternPressed = true; });
    kb.on('keydown-G', () => { Controls.debugPressed = true; });
    this.scene.launch('UI');
    this.ui = this.scene.get('UI');
    this.events.once('shutdown', () => { this.scene.stop('UI'); SFX.stopAll(); });

    this.frozen = false;
    this.doorOpen = true;
    this.lanternOn = true;
    this.lightRadius = FIELD_TUNING.lanternOnRadius;
    this.minLight = 0;
    this.noiseTimer = 0;
    this.moving = false;
    this.interactables = [];
  }

  // ---------- helpers ----------

  wait(ms) {
    const id = this.runId;
    return new Promise(res => this.time.delayedCall(ms, () => { if (id === this.runId && this.scene.isActive()) res(); }));
  }

  say(text, ms = 3500) {
    if (this.ui && this.ui.captionText) this.ui.caption(text, ms);
  }

  setControlsVisible(v) {
    if (this.ui && this.ui.joy) this.ui.setVisibleControls(v);
  }

  // A speech bubble in the world, above (x, y). It removes itself after ms.
  // With marker: true, an arrow at the screen edge points to it while it is
  // off screen.
  bubble(x, y, text, ms, name, marker) {
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
    c.x = Phaser.Math.Clamp(c.x, w / 2 + 2, this.map.W * T - w / 2 - 2);
    c.setScale(0.8);
    this.tweens.add({ targets: c, scale: 1, duration: 120 });
    this.time.delayedCall(ms, () => { if (c.active) c.destroy(); });
    if (marker) this.markers.push({ x, y: y - 12, until: this.time.now + ms });
    return c;
  }

  // A faint ring showing how far a noise carries.
  ring(radius, alpha) {
    const r = this.add.circle(Math.round(this.hx), Math.round(this.hy + 2), radius).setStrokeStyle(1, 0xe8e0c8, alpha).setDepth(1050);
    r.setScale(0.25);
    this.tweens.add({ targets: r, scale: 1, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => r.destroy() });
  }

  // Called whenever the player makes a noise. radius is in pixels.
  onNoise(radius) {}

  // ---------- every frame ----------

  readKeys() {
    const k = this.keys;
    this.actHeld = Controls.actHeld || k.E.isDown || k.SPACE.isDown;
  }

  movePlayer(dt) {
    const k = this.keys;
    let mx = Controls.moveX, my = Controls.moveY, run = Controls.run;
    const kx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    const ky = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (kx || ky) {
      const l = Math.hypot(kx, ky);
      mx = kx / l; my = ky / l; run = k.SHIFT.isDown;
    }
    if (this.frozen) { mx = 0; my = 0; }

    this.moving = mx !== 0 || my !== 0;
    this.running = this.moving && run;
    const inCorn = this.map.tileAtPx(this.hx, this.hy + 3) === 'C';
    const F = FIELD_TUNING;
    const speed = inCorn ? (run ? F.cornRunSpeed : F.cornWalkSpeed) : (run ? F.runSpeed : F.walkSpeed);

    if (this.moving) {
      this.fx = mx; this.fy = my;
      this.tryMove(mx * speed * dt, 0);
      this.tryMove(0, my * speed * dt);

      // Noise: corn is loud, running is loud, walking is quiet.
      this.noiseTimer -= dt;
      if (this.noiseTimer <= 0) {
        if (inCorn) {
          SFX.play('rustle', { vol: 0.5, rate: 0.9 + Math.random() * 0.2 });
          this.ring(F.cornNoiseTiles * T, 0.35);
          this.onNoise(F.cornNoiseTiles * T);
          this.noiseTimer = 0.5;
        } else if (run) {
          SFX.play('step', { vol: 0.3 });
          this.ring(F.runNoiseTiles * T, 0.25);
          this.onNoise(F.runNoiseTiles * T);
          this.noiseTimer = 0.3;
        } else {
          SFX.play('step', { vol: 0.06 });
          this.noiseTimer = 0.45;
        }
      }
    } else {
      this.noiseTimer = 0;
    }
    this.drawPlayer();
  }

  drawPlayer() {
    this.player.setPosition(Math.round(this.hx), Math.round(this.hy));
    this.playerLamp.setFillStyle(this.lanternOn ? 0xffd27a : 0x5a4a30);
    if (!this.playerDown) {
      const ax = Math.round(this.fx * 1.5), ay = Math.round(this.fy * 1.5);
      this.playerHead.setPosition(ax, -5 + ay * 0.5);
      this.playerNose.setPosition(ax * 2, -5 + ay * 2);
      this.playerLamp.setPosition(this.fx < -0.3 ? -6 : 6, 3);
    }
  }

  tryMove(dx, dy) {
    const nx = this.hx + dx, ny = this.hy + dy;
    const blocked = (x, y) => this.isBlocked(x, y);
    // the player's feet: a small box below his centre
    if (blocked(nx - 4, ny) || blocked(nx + 4, ny) || blocked(nx - 4, ny + 5) || blocked(nx + 4, ny + 5)) return;
    this.hx = nx; this.hy = ny;
  }

  isBlocked(x, y) { return this.map.isBlockedPx(x, y, this.doorOpen); }

  // The camera follows the player, or this.camFollow (e.g. a car) in cutscenes.
  updateCamera() {
    const cam = this.cameras.main;
    const { width, height } = this.scale;
    const f = this.camFollow || { x: this.hx, y: this.hy };
    cam.scrollX = Phaser.Math.Clamp(Math.round(f.x - width / 2), 0, this.map.W * T - width);
    cam.scrollY = Phaser.Math.Clamp(Math.round(f.y - height / 2), 0, this.map.H * T - height);
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
      this.actMarker.setVisible(true).setPosition(Math.round(best.x), Math.round(best.y - 12 + Math.sin(this.time.now / 200) * 1.5));
      if (Controls.actPressed && performance.now() > Controls.blockActUntil) best.act();
    } else {
      this.actMarker.setVisible(false);
    }
  }

  // Arrows at the screen edge pointing at voices that are off screen.
  updateMarkers() {
    const g = this.markerGfx;
    g.clear();
    const now = this.time.now;
    this.markers = this.markers.filter(m => m.until > now);
    const cam = this.cameras.main;
    const { width, height } = this.scale;
    for (const m of this.markers) {
      const sx = m.x - cam.scrollX, sy = m.y - cam.scrollY;
      if (sx > 6 && sx < width - 6 && sy > 6 && sy < height - 6) continue;
      const cx = width / 2, cy = height / 2;
      const a = Math.atan2(sy - cy, sx - cx);
      const ex = Phaser.Math.Clamp(sx, 12, width - 12), ey = Phaser.Math.Clamp(sy, 12, height - 12);
      const tip = { x: ex + Math.cos(a) * 6, y: ey + Math.sin(a) * 6 };
      const l = { x: ex + Math.cos(a + 2.4) * 6, y: ey + Math.sin(a + 2.4) * 6 };
      const r = { x: ex + Math.cos(a - 2.4) * 6, y: ey + Math.sin(a - 2.4) * 6 };
      g.fillStyle(0xf2efe6, 0.85).fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
    }
  }

  // Lantern on/off.
  toggleLantern() {
    this.lanternOn = !this.lanternOn;
    SFX.play('click', { vol: 0.5 });
  }

  // ambient: 0..1 darkness. tint: [r,g,b] of the dark. lights: extra
  // [{x, y, r}] holes in world pixels (lamps, a TV).
  drawDarkness(time, ambient, tint, lights = []) {
    const wantR = Math.max(this.minLight, this.lanternOn ? FIELD_TUNING.lanternOnRadius : FIELD_TUNING.lanternOffRadius);
    this.lightRadius += (wantR - this.lightRadius) * 0.25;
    const flicker = 1 + 0.025 * Math.sin(time / 90) + 0.015 * Math.sin(time / 37);
    const r = this.lightRadius * flicker;

    const cam = this.cameras.main;
    const sx = this.hx - cam.scrollX, sy = this.hy - cam.scrollY;
    const ctx = this.darkCtx;
    const { width, height } = this.scale;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    if (ambient <= 0.01) { this.darkTex.refresh(); return; } // daylight
    ctx.fillStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},${ambient})`;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'destination-out';
    const hole = (x, y, rad, inner) => {
      const grd = ctx.createRadialGradient(x, y, rad * inner, x, y, rad);
      grd.addColorStop(0, 'rgba(0,0,0,1)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    };
    hole(sx, sy, r, 0.35);
    for (const l of lights) hole(l.x - cam.scrollX, l.y - cam.scrollY, l.r, 0.1);

    if (this.lanternOn && ambient > 0.5) {
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

  endFrame() {
    Controls.actPressed = false;
    Controls.lanternPressed = false;
    Controls.debugPressed = false;
  }

  // ---------- nights: the creature, crickets and heartbeat ----------

  onCreatureState(st) {
    if (st === 'hunt' && !this.taught.hunt) {
      this.taught.hunt = true;
      this.time.delayedCall(600, () => this.say('The crickets have stopped.', 3000));
    }
    if (st === 'retreat') {
      const d = this.creature.distToPlayer();
      SFX.play('growl', { vol: Phaser.Math.Clamp(1 - d / (12 * T), 0.2, 1), pan: this.panTo(this.creature.x) });
      if (!this.taught.retreat) { this.taught.retreat = true; this.say('It backs away from the light.', 3000); }
    }
  }

  panTo(x) { return Phaser.Math.Clamp((x - this.hx) / (10 * T), -0.85, 0.85); }

  // The lure calls: the same words from the same spot, every time.
  lureCall(L) {
    this.bubble(L.x, L.y - 4, L.voice.text, 3000, null, true);
    const d = Phaser.Math.Distance.Between(this.hx, this.hy, L.x, L.y);
    if (L.voice.speak) SFX.speakLure(L.voice.text);
    else SFX.play(L.voice.sound, { vol: 0.7 * Phaser.Math.Clamp(1 - d / (25 * T), 0.2, 1), pan: this.panTo(L.x) });
  }

  updateSound(dt) {
    const cr = this.creature;
    const d = cr.distToPlayer();
    // Rule one: when the crickets stop, it is close.
    let target = NIGHT.cricketVolume * Phaser.Math.Clamp((d - NIGHT.cricketsSilentTiles * T) / ((NIGHT.cricketsFullTiles - NIGHT.cricketsSilentTiles) * T), 0, 1);
    if (cr.state === 'hunt' || this.state !== 'night') target = 0;
    if (Math.abs(target - this.cricketVol) > 0.01 || (target === 0 && this.cricketVol !== 0)) {
      this.crickets.setVolume(target, target < this.cricketVol ? 0.3 : 1.2);
      this.cricketVol = target;
    }

    // Michael's heartbeat rises as it gets close; the phone shakes with it.
    if (this.state !== 'night') return;
    const close = Phaser.Math.Clamp(1 - d / (NIGHT.heartbeatTiles * T), 0, 1);
    if (close > 0 && cr.state !== 'asleep') {
      this.beatTimer -= dt;
      if (this.beatTimer <= 0) {
        this.beatTimer = 1.1 - 0.72 * close;
        SFX.play('heartbeat', { vol: 0.2 + 0.6 * close });
        if (close > 0.3) SFX.vibrate([Math.round(20 + 50 * close), 90, Math.round(15 + 30 * close)]);
      }
    } else {
      this.beatTimer = 0;
    }
  }

  // ---------- the creature's look ----------

  makeCreatureLook() {
    // Body: only seen in lantern light (it is drawn under the darkness).
    const c = this.add.container(0, 0).setDepth(16);
    const g = this.add.graphics();
    g.fillStyle(0x0a0806, 1);
    g.fillRect(-7, -22, 14, 22);          // body
    g.fillRect(-6, -2, 4, 6).fillRect(2, -2, 4, 6); // legs
    g.fillCircle(0, -25, 6);              // head
    g.fillTriangle(-6, -27, -3, -29, -9, -36); // horns, curling up
    g.fillTriangle(6, -27, 3, -29, 9, -36);
    g.fillRect(-11, -20, 4, 14).fillRect(7, -20, 4, 14); // long arms
    c.add(g);
    this.cBody = c;
    // Eyes: two slanted red slits, drawn above the darkness.
    const e = this.add.graphics().setDepth(1060);
    e.fillStyle(0xff2a1a, 1);
    e.fillRect(-4, 0, 3, 1).fillRect(1, 0, 3, 1);
    e.fillRect(-4, -1, 1, 1).fillRect(3, -1, 1, 1);
    this.cEyes = e;
  }

  drawCreature(time) {
    const cr = this.creature;
    this.cBody.setPosition(Math.round(cr.x), Math.round(cr.y + 6));
    this.cEyes.setPosition(Math.round(cr.x), Math.round(cr.y - 13));
    const d = cr.distToPlayer();
    const blink = Math.sin(time / 1700 + cr.x) > 0.97;
    let a = 0;
    if (cr.state !== 'asleep' && d < 11 * T && !blink) a = Phaser.Math.Clamp(1.15 - d / (11 * T), 0.15, 1);
    if (cr.state === 'lure') a = 0; // it is a voice now, nothing more
    this.cEyes.setAlpha(a);
  }

  // ---------- the kill ----------

  // It reaches into the player's back. A large black hand comes through him,
  // holding his heart out in front of him. The heartbeat slows and stops,
  // the phone shakes with each beat, and the screen cuts to black.
  async killFromBehind() {
    this.frozen = true;
    this.setControlsVisible(false);
    if (window.speechSynthesis) speechSynthesis.cancel();
    SFX.play('grab', { vol: 1 });
    SFX.vibrate(400);
    this.cameras.main.shake(380, 0.06);
    this.minLight = 5 * T;
    this.lanternOn = true;

    const pos = { x: this.hx + this.fx * 18, y: this.hy + this.fy * 18 };
    const hand = this.add.container(pos.x, pos.y).setDepth(500);
    // local +y points back through the player and away behind him
    hand.rotation = Math.atan2(this.fx, -this.fy);
    const h = this.add.graphics();
    h.fillStyle(0x000000, 1);
    h.fillRect(-8, 6, 16, 240);          // the arm, through his back, out of the dark behind
    h.fillEllipse(0, 4, 34, 24);         // palm
    h.fillEllipse(-19, -2, 9, 18);       // thumb
    const heart = this.add.graphics();
    heart.fillStyle(0xb01818, 1);
    heart.fillCircle(-3, -2, 4).fillCircle(3, -2, 4).fillTriangle(-7, -1, 7, -1, 0, 7);
    heart.setPosition(0, -6);
    const f = this.add.graphics();
    f.fillStyle(0x000000, 1);
    [[-14, 18], [-6, 22], [6, 22], [14, 18]].forEach(([x, len], i) => {
      f.fillRect(x - 2.5, -len, 5, len);                    // long fingers, reaching forward
      f.fillRect(x + (i < 2 ? 0 : -4), -len, 6.5, 4);      // curling in at the tips
    });
    hand.add([h, heart, f]);
    hand.setScale(0.5);
    this.tweens.add({ targets: hand, scale: 1.15, duration: 140, ease: 'Back.easeOut' });

    await this.wait(700);
    const gaps = [620, 680, 760, 860, 990, 1150, 1380, 1700, 2150, 2800];
    for (let i = 0; i < gaps.length; i++) {
      const k = i / gaps.length;
      SFX.play('heartbeat', { vol: 1 - k * 0.55 });
      SFX.vibrate([Math.round(70 - k * 45), 110, Math.round(45 - k * 30)]);
      heart.setScale(1.45 - k * 0.3);
      this.tweens.add({ targets: heart, scale: 1, duration: 260, ease: 'Quad.easeOut' });
      if (i >= gaps.length - 3) heart.setAlpha(0.85 - (i - (gaps.length - 3)) * 0.2);
      await this.wait(gaps[i]);
    }
    await this.wait(1500);

    SFX.stopAll();
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(5000);
    await this.wait(300);
  }
}
