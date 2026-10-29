// The thing in the field: its brain. Six states, from the design doc:
//
//   asleep    By day. (Here: at dawn it goes back to the stone ring.)
//   prowl     Wanders the field, drawn by noise and light.
//   lure      Stays in one spot, calling in a dead voice, word for word.
//   hunt      The crickets stop. It circles to get behind you.
//   retreat   Lantern in its face drives it off; then it regroups (prowl).
//   caught    It got behind you.
//
// It never attacks from the front. It can't go past its reach line.
const CREATURE = {
  prowlSpeed: 26,          // pixels per second (Michael walks at 38, runs at 70)
  drawnSpeed: 40,          // heading for a noise or a light
  huntSpeed: 50,
  closeInSpeed: 62,        // once it is behind you
  retreatSpeed: 80,
  lanternSightTiles: 14,   // a lit lantern is seen from far away
  darkMovingSightTiles: 3, // lantern off, moving
  darkStillSightTiles: 2,  // lantern off, standing still: it loses you beyond 2 tiles
  breathHearTiles: 3,      // hiding: it hears you breathing this close
  noiseSuspicion: 0.45,    // how much one noise adds (plus more if close)
  suspicionDecay: 0.05,    // per second
  loseSeconds: 4,          // hunting: no sight or sound of you this long -> back to prowling
  beyondReachSeconds: 5,   // hunting you past its reach line this long -> gives up
  faceSeconds: 1.0,        // lantern in its face this long -> retreat
  retreatSeconds: 3.5,
  orbitLitTiles: 5.5,      // how far it keeps from a lit lantern while circling
  orbitDarkTiles: 2.5,
  catchPixels: 13,
  lureCheckSeconds: 12,    // how often it considers luring
  lureCooldownSeconds: 40,
  lureEverySeconds: 6,
  lureIgnoredCalls: 4,     // ignore it this many times and it gives up
  lureFollowTiles: 2,      // walk this much closer to the voice and it hunts you
};

class Creature {
  constructor(scene, x, y) {
    this.s = scene;
    this.x = x; this.y = y;
    this.dx = 1; this.dy = 0;
    this.state = 'prowl';
    this.stateTime = 0;
    this.suspicion = 0;
    this.target = null;
    this.targetIsPlayer = false;
    this.lastKnown = null;
    this.lostTime = 0;
    this.beyondReachTime = 0;
    this.faceTime = 0;
    this.lureTimer = CREATURE.lureCheckSeconds;
    this.lureCooldown = 15;
    this.lure = null;
  }

  setState(st) {
    if (this.state === st) return;
    const prev = this.state;
    this.state = st;
    this.stateTime = 0;
    this.s.onCreatureState(st, prev);
  }

  // ---------- senses ----------

  distToPlayer() { return Phaser.Math.Distance.Between(this.x, this.y, this.s.hx, this.s.hy); }

  sightRange() {
    const s = this.s;
    if (s.hidden) return 0;
    if (s.lanternOn) return CREATURE.lanternSightTiles * T;
    return (s.moving ? CREATURE.darkMovingSightTiles : CREATURE.darkStillSightTiles) * T;
  }

  sees() { return this.distToPlayer() < this.sightRange(); }

  hearsBreathing() {
    return this.s.hidden && !this.s.holdingBreath && this.distToPlayer() < CREATURE.breathHearTiles * T;
  }

  // The player made a noise that carries `radius` pixels.
  hearNoise(radius) {
    const d = this.distToPlayer();
    if (d > radius || this.state === 'asleep' || this.state === 'retreat' || this.state === 'caught') return;
    const strength = 1 - d / radius;
    this.suspicion = Math.min(1.2, this.suspicion + CREATURE.noiseSuspicion + 0.5 * strength);
    this.lastKnown = { x: this.s.hx, y: this.s.hy };
    this.lostTime = 0;
    if (this.state === 'prowl') { this.target = this.lastKnown; this.targetIsPlayer = true; }
  }

  // ---------- movement ----------

  canWalk(px, py) {
    const s = this.s;
    if (px < s.reachX) return false;
    const c = s.map.tileAtPx(px, py);
    return !(c === 'X' || c === '#' || c === 'w' || c === 'K' || c === ' ');
  }

  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x, dy = ty - this.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return true;
    const step = Math.min(len, speed * dt);
    const ux = dx / len, uy = dy / len;
    const nx = this.x + ux * step, ny = this.y + uy * step;
    if (this.canWalk(nx, this.y)) this.x = nx;
    if (this.canWalk(this.x, ny)) this.y = ny;
    this.dx = ux; this.dy = uy;
    return len < 4;
  }

  randomFieldPoint() {
    const F = this.s.map.FIELD;
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(F.x0 + 1, F.x1 - 1) * T + 8;
      const y = Phaser.Math.Between(F.y0 + 1, F.y1 - 1) * T + 8;
      if (Phaser.Math.Distance.Between(x, y, this.x, this.y) < 18 * T && this.canWalk(x, y)) return { x, y };
    }
    return { x: this.s.map.RING.x, y: this.s.map.RING.y };
  }

  // ---------- the brain ----------

  update(dt) {
    this.stateTime += dt;
    this.lureCooldown -= dt;
    switch (this.state) {
      case 'asleep': this.updateAsleep(dt); break;
      case 'prowl': this.updateProwl(dt); break;
      case 'lure': this.updateLure(dt); break;
      case 'hunt': this.updateHunt(dt); break;
      case 'retreat': this.updateRetreat(dt); break;
    }
  }

  updateAsleep(dt) {
    const R = this.s.map.RING;
    this.moveToward(R.x, R.y, CREATURE.prowlSpeed, dt);
  }

  updateProwl(dt) {
    const d = this.distToPlayer();
    const range = this.sightRange();
    if (d < range || this.hearsBreathing()) {
      // Drawn by light: the closer and brighter, the faster it notices.
      this.suspicion += dt * (0.2 + 0.9 * (1 - d / Math.max(range, 1)));
      this.lastKnown = { x: this.s.hx, y: this.s.hy };
      this.target = this.lastKnown;
      this.targetIsPlayer = true;
    }
    this.suspicion = Math.max(0, this.suspicion - CREATURE.suspicionDecay * dt);
    if (this.suspicion >= 1) { this.startHunt(); return; }

    if (!this.target) { this.target = this.randomFieldPoint(); this.targetIsPlayer = false; }
    const arrived = this.moveToward(this.target.x, this.target.y, this.targetIsPlayer ? CREATURE.drawnSpeed : CREATURE.prowlSpeed, dt);
    if (arrived || this.stateTime > 25) { this.target = null; this.stateTime = 0; }

    // Near the field, it may try to lure you in.
    this.lureTimer -= dt;
    if (this.lureTimer <= 0) {
      this.lureTimer = CREATURE.lureCheckSeconds;
      if (this.lureCooldown <= 0 && this.suspicion < 0.4 && this.playerNearField() && Math.random() < 0.6) this.startLure();
    }
  }

  playerNearField() {
    const F = this.s.map.FIELD;
    const fx = Phaser.Math.Clamp(this.s.hx, F.x0 * T, (F.x1 + 1) * T);
    const fy = Phaser.Math.Clamp(this.s.hy, F.y0 * T, (F.y1 + 1) * T);
    return !this.s.hidden && Phaser.Math.Distance.Between(this.s.hx, this.s.hy, fx, fy) < 7 * T;
  }

  startHunt() {
    this.suspicion = 1;
    this.lostTime = 0;
    this.beyondReachTime = 0;
    this.faceTime = 0;
    this.lastKnown = { x: this.s.hx, y: this.s.hy };
    this.setState('hunt');
  }

  // ---------- luring ----------

  startLure() {
    const s = this.s, F = s.map.FIELD, R = s.map.RING;
    // A spot in the corn, about 8 tiles from Michael, towards the ring, on a path.
    let ax = R.x - s.hx, ay = R.y - s.hy;
    const al = Math.hypot(ax, ay) || 1;
    let px = s.hx + ax / al * 8 * T, py = s.hy + ay / al * 8 * T;
    let tx = Math.round((px / T - F.x0 - 2) / 3) * 3 + F.x0 + 2;
    tx = Phaser.Math.Clamp(tx, F.x0 + 2, F.x1 - 1);
    const ty = Phaser.Math.Clamp(Math.floor(py / T), F.y0 + 1, F.y1 - 1);
    const spot = tileCentre(tx, ty);
    if (spot.x < s.reachX) return;
    const voice = Math.random() < 0.5
      ? { text: 'Michael. Come see.', speak: true }
      : { text: '(Spike barking)', sound: 'bark' };
    this.lure = { ...spot, voice, calls: 0, callTimer: 0, startDist: 0, arrived: false };
    this.setState('lure');
  }

  updateLure(dt) {
    const L = this.lure;
    // It goes to its spot quickly, unseen...
    if (!L.arrived) {
      if (this.moveToward(L.x, L.y, 90, dt)) { L.arrived = true; L.callTimer = 0.5; }
      if (this.stateTime > 12) { this.endLure(); }
      return;
    }
    // ...then calls from it, the same words every time. It never moves.
    L.callTimer -= dt;
    if (L.callTimer <= 0) {
      if (L.calls >= CREATURE.lureIgnoredCalls) { this.endLure(); return; }
      L.callTimer = CREATURE.lureEverySeconds;
      L.calls++;
      if (L.calls === 1) L.startDist = this.distToPlayer();
      this.s.lureCall(L);
    }
    const d = this.distToPlayer();
    // You follow the voice: it hunts you.
    if (L.calls > 0 && d < L.startDist - CREATURE.lureFollowTiles * T) { this.startHunt(); return; }
    // Noise and light still give you away.
    if (this.sees() && d < 6 * T) this.suspicion += dt;
    if (this.suspicion >= 1) this.startHunt();
  }

  endLure() {
    this.lure = null;
    this.lureCooldown = CREATURE.lureCooldownSeconds;
    this.target = null;
    this.setState('prowl');
  }

  // ---------- hunting ----------

  updateHunt(dt) {
    const s = this.s;
    const d = this.distToPlayer();
    const perceives = this.sees() || this.hearsBreathing();
    if (perceives) {
      this.lastKnown = { x: s.hx, y: s.hy };
      this.lostTime = 0;
    } else {
      if (this.lostTime === 0) {
        // It only has a rough idea of where you went.
        const a = Math.random() * Math.PI * 2;
        this.lastKnown = { x: this.lastKnown.x + Math.cos(a) * 3 * T, y: this.lastKnown.y + Math.sin(a) * 3 * T };
      }
      this.lostTime += dt;
      if (this.lostTime > CREATURE.loseSeconds) { this.giveUp(0.5); return; }
    }

    // Past its reach line it can only pace the edge.
    if (s.hx < s.reachX) {
      this.beyondReachTime += dt;
      if (this.beyondReachTime > CREATURE.beyondReachSeconds) { this.giveUp(0.3); return; }
    } else {
      this.beyondReachTime = 0;
    }

    // Where is it, compared with where Michael is facing?
    const fl = Math.hypot(s.fx, s.fy) || 1;
    const fx = s.fx / fl, fy = s.fy / fl;
    const ox = (this.x - s.hx) / (d || 1), oy = (this.y - s.hy) / (d || 1);
    const front = ox * fx + oy * fy; // 1 = right in front of him, -1 = right behind him
    const lit = s.lanternOn && !s.hidden && d < FIELD_TUNING.lanternOnRadius + 8;

    // Lantern in its face: it holds back, then is driven off.
    if (lit && front > 0.6) {
      this.faceTime += dt;
      if (this.faceTime > CREATURE.faceSeconds) { this.startRetreat(); return; }
    } else {
      this.faceTime = Math.max(0, this.faceTime - dt * 0.5);
    }

    if (s.hidden) {
      // It searches where it last heard you. If it hears you breathing right
      // next to it, it pulls you out.
      this.moveToward(this.lastKnown.x, this.lastKnown.y, CREATURE.huntSpeed, dt);
      if (this.hearsBreathing() && d < 1.6 * T) s.caught(this);
      return;
    }

    if (!perceives) {
      this.moveToward(this.lastKnown.x, this.lastKnown.y, CREATURE.huntSpeed, dt);
      return;
    }

    if (front > -0.35) {
      // Not behind him yet: circle round, out of the light, towards his back.
      const keep = (lit ? CREATURE.orbitLitTiles : CREATURE.orbitDarkTiles) * T;
      const a = Math.atan2(this.y - s.hy, this.x - s.hx);
      const behind = Math.atan2(-fy, -fx);
      let delta = Phaser.Math.Angle.Wrap(behind - a);
      const stepA = Math.sign(delta) * Math.min(Math.abs(delta), 0.7);
      const tx = s.hx + Math.cos(a + stepA) * keep;
      const ty = s.hy + Math.sin(a + stepA) * keep;
      this.moveToward(tx, ty, CREATURE.huntSpeed, dt);
    } else {
      // Behind him: close in.
      this.moveToward(s.hx, s.hy, CREATURE.closeInSpeed, dt);
      if (d < CREATURE.catchPixels) s.caught(this);
    }
  }

  giveUp(suspicion) {
    this.suspicion = suspicion;
    this.target = this.lastKnown;
    this.targetIsPlayer = true;
    this.setState('prowl');
  }

  // ---------- retreating ----------

  startRetreat() {
    const s = this.s, F = s.map.FIELD;
    let ax = this.x - s.hx, ay = this.y - s.hy;
    const al = Math.hypot(ax, ay) || 1;
    this.target = {
      x: Phaser.Math.Clamp(this.x + ax / al * 10 * T, (F.x0 + 1) * T, F.x1 * T),
      y: Phaser.Math.Clamp(this.y + ay / al * 10 * T, (F.y0 + 1) * T, F.y1 * T),
    };
    this.setState('retreat');
  }

  updateRetreat(dt) {
    this.moveToward(this.target.x, this.target.y, CREATURE.retreatSpeed, dt);
    if (this.stateTime > CREATURE.retreatSeconds) {
      // regroups
      this.suspicion = 0.4;
      this.target = null;
      this.lureCooldown = Math.max(this.lureCooldown, 10);
      this.setState('prowl');
    }
  }

  goToSleep() {
    this.setState('asleep');
  }
}

// Night 1: it is there, but it is not shown, and it does not attack.
// Outside the corn it paces the edge of the field nearest Michael. In the
// corn it keeps pace with him just beyond his lantern light, behind him and
// to one side, rustling as it moves. Now and then it edges in until the
// stalks move at the rim of the light. It backs off if he walks at it. Go too
// deep and it lets him know: everything goes silent and it crashes through
// the corn right behind him. That's all. Not yet.
const STALKER = {
  keepLitTiles: 5.8,      // how far it keeps from a lit lantern (the light reaches 5)
  keepDarkTiles: 3.2,     // lantern off: it comes closer
  leanInTiles: 4.4,       // edging in: the stalks move at the rim of the light
  minTiles: 2.6,          // walk at it and it backs away to at least this
  speed: 48,
  edgeSpeed: 30,
  deepTiles: 10,          // this far into the corn and it warns him off
};

class Stalker {
  constructor(scene, x, y) {
    this.s = scene;
    this.x = x; this.y = y;
    this.state = 'stalk';
    this.invisible = true;
    this.hush = false;        // forces the crickets silent
    this.heartScale = 0.35;   // keeps Michael's heartbeat low unless it edges in
    this.lureCooldown = Infinity;
    this.side = Math.random() < 0.5 ? -1 : 1;
    this.rustleTimer = 3;
    this.leanTimer = 8;
    this.leaning = 0;
    this.warned = false;
    this.lastX = x; this.lastY = y;
  }

  distToPlayer() { return Phaser.Math.Distance.Between(this.x, this.y, this.s.hx, this.s.hy); }
  setState(st) { this.state = st; }
  hearNoise() { this.rustleTimer = Math.min(this.rustleTimer, 0.6); } // it answers your noise

  // Crossing the yard: it comes to the edge of the corn, and the crickets stop for a while.
  yardMoment() {
    const F = this.s.map.FIELD;
    this.x = (F.x0 + 1) * T;
    this.y = Phaser.Math.Clamp(this.s.hy, (F.y0 + 1) * T, F.y1 * T);
    this.hushFor(5);
    this.rustle(1);
  }

  hushFor(seconds) {
    this.hush = true;
    this.s.time.delayedCall(seconds * 1000, () => { this.hush = false; });
  }

  rustle(loud = 0) {
    const d = this.distToPlayer();
    const vol = Math.max(loud, 0.5 * Phaser.Math.Clamp(1 - d / (16 * T), 0, 1));
    if (vol <= 0.02) return;
    SFX.play('rustle', { vol, pan: this.s.panTo(this.x), rate: 0.75 + Math.random() * 0.15 });
    this.s.swayCorn(this.x, this.y);
  }

  update(dt) {
    const s = this.s, F = s.map.FIELD;
    const inField = s.inRoom('field');
    let tx, ty, speed = STALKER.speed;
    this.leaning = Math.max(0, this.leaning - dt);

    if (inField) {
      // Too deep: a warning.
      if (!this.warned && s.hx > (F.x0 + STALKER.deepTiles) * T) {
        this.warned = true;
        const a = Math.atan2(-s.fy, -s.fx);
        this.x = s.hx + Math.cos(a) * 2.2 * T; this.y = s.hy + Math.sin(a) * 2.2 * T;
        this.hushFor(7);
        this.leaning = 4;
        this.rustle(1);
        SFX.vibrate(120);
        s.time.delayedCall(900, () => s.say('Get out of the corn.', 3000));
      }
      this.leanTimer -= dt;
      if (this.leanTimer <= 0) { this.leaning = 1.6; this.leanTimer = 8 + Math.random() * 7; this.side = -this.side; }
      let keep = (s.lanternOn ? STALKER.keepLitTiles : STALKER.keepDarkTiles) * T;
      if (this.leaning > 0) keep = Math.min(keep, STALKER.leanInTiles * T);
      const a = Math.atan2(-s.fy, -s.fx) + this.side * 1.1; // behind him, to one side
      tx = s.hx + Math.cos(a) * keep;
      ty = s.hy + Math.sin(a) * keep;
    } else {
      // Pacing the edge of the corn nearest him.
      tx = (F.x0 + 1) * T;
      ty = Phaser.Math.Clamp(s.hy, (F.y0 + 1) * T, F.y1 * T);
      speed = STALKER.edgeSpeed;
    }
    // It stays in the corn.
    tx = Phaser.Math.Clamp(tx, (F.x0 + 0.5) * T, (F.x1 + 0.5) * T);
    ty = Phaser.Math.Clamp(ty, (F.y0 + 0.5) * T, (F.y1 + 0.5) * T);

    // Walk at it and it backs away.
    const d = this.distToPlayer();
    if (d < STALKER.minTiles * T) {
      const ax = (this.x - s.hx) / (d || 1), ay = (this.y - s.hy) / (d || 1);
      tx = this.x + ax * 2 * T; ty = this.y + ay * 2 * T;
      speed = STALKER.speed * 1.4;
    }
    const dx = tx - this.x, dy = ty - this.y, len = Math.hypot(dx, dy);
    if (len > 1) { const step = Math.min(len, speed * dt); this.x += dx / len * step; this.y += dy / len * step; }

    // It rustles as it moves through the corn.
    const moved = Phaser.Math.Distance.Between(this.x, this.y, this.lastX, this.lastY);
    this.lastX = this.x; this.lastY = this.y;
    this.rustleTimer -= dt;
    if (this.rustleTimer <= 0 && (moved > 0.2 || inField)) {
      this.rustle();
      this.rustleTimer = inField ? 1.8 + Math.random() * 2.5 : 5 + Math.random() * 6;
    }
    this.heartScale = (this.hush || this.leaning > 0) ? 1 : (inField ? 0.45 : 0.2);
  }
}
