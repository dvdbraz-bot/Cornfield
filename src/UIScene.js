// On-screen controls, captions, dialogue and Michael's notebook. Runs on top
// of the game and is not affected by screen shake.
//   Left half: floating joystick under the thumb (push to the edge to run).
//   Right side: big ACT button, smaller LANTERN button above it.
//   Top right: NOTEBOOK (in the story chapters).
class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    const { width, height } = this.scale;
    this.touch = this.sys.game.device.input.touch;
    this.input.addPointer(3);
    // (the game scene resets Controls before it launches this scene)

    this.JOY_R = 30;
    this.joy = { id: null, bx: 0, by: 0 };
    this.joyBase = this.add.circle(0, 0, this.JOY_R, 0xffffff, 0.08).setStrokeStyle(1, 0xffffff, 0.35).setVisible(false);
    this.joyKnob = this.add.circle(0, 0, 12, 0xffffff, 0.3).setVisible(false);

    this.actBtn = { x: width - 50, y: height - 52, r: 32, id: null };
    this.lampBtn = { x: width - 44, y: height - 132, r: 20, id: null };
    this.actGfx = this.add.circle(this.actBtn.x, this.actBtn.y, this.actBtn.r, 0xffffff, 0.1).setStrokeStyle(1, 0xffffff, 0.4);
    this.actLabel = this.add.text(this.actBtn.x, this.actBtn.y, 'ACT', { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.6);
    this.lampGfx = this.add.circle(this.lampBtn.x, this.lampBtn.y, this.lampBtn.r, 0xffd27a, 0.1).setStrokeStyle(1, 0xffd27a, 0.4);
    this.lampLabel = this.add.text(this.lampBtn.x, this.lampBtn.y, 'LANTERN', { fontFamily: 'Arial, sans-serif', fontSize: '7px', color: '#ffe0a0' }).setOrigin(0.5).setAlpha(0.6);
    this.controlsShown = true;

    // Cricket icon (top left): fades with the crickets, for players who
    // can't hear them. Lamp oil gauge next to it.
    this.cricket = this.add.graphics({ x: 16, y: 14 });
    this.cricket.lineStyle(1, 0xd8d2c0, 1);
    this.cricket.fillStyle(0xd8d2c0, 1).fillEllipse(0, 0, 12, 5).fillCircle(7, -1, 2);
    this.cricket.lineBetween(-2, 2, -6, 7).lineBetween(2, 2, 0, 7).lineBetween(-4, -1, -9, -6).lineBetween(-9, -6, -10, 1);
    this.cricket.lineBetween(8, -2, 13, -8).lineBetween(8, -2, 14, -4);
    this.cricket.setVisible(false);
    this.oilLabel = this.add.text(30, 14, 'OIL', { fontFamily: 'Arial, sans-serif', fontSize: '7px', color: '#ffe0a0' }).setOrigin(0, 0.5).setVisible(false);
    this.oilBack = this.add.rectangle(46, 14, 40, 4, 0x000000, 0.6).setOrigin(0, 0.5).setStrokeStyle(1, 0xffd27a, 0.5).setVisible(false);
    this.oilBar = this.add.rectangle(46, 14, 40, 4, 0xffd27a, 0.9).setOrigin(0, 0.5).setVisible(false);
    this.debugBtn = this.add.text(width - 6, 8, 'DEBUG', { fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#ff8080' })
      .setOrigin(1, 0).setAlpha(0.6).setVisible(false);

    // Notebook button (top right).
    this.nbBtn = this.add.container(width - 22, 16).setVisible(false);
    const nbg = this.add.graphics();
    nbg.fillStyle(0x6a4a2a, 1).fillRect(-7, -9, 14, 18);
    nbg.fillStyle(0xe8dfc8, 1).fillRect(-5, -7, 10, 14);
    nbg.lineStyle(1, 0x8a7a5a, 1).lineBetween(-3, -3, 3, -3).lineBetween(-3, 0, 3, 0).lineBetween(-3, 3, 2, 3);
    this.nbBtn.add([nbg, this.add.text(0, 12, 'NOTEBOOK', { fontFamily: 'Arial, sans-serif', fontSize: '6px', color: '#d8d2c0' }).setOrigin(0.5, 0)]);
    this.nbBtn.setAlpha(0.8);

    // Caption box for thoughts and hints.
    this.captionBg = this.add.rectangle(width / 2, 22, 300, 26, 0x000000, 0.75).setStrokeStyle(1, 0x8a8478, 0.6).setVisible(false);
    this.captionText = this.add.text(width / 2, 22, '', {
      fontFamily: 'Georgia, serif', fontSize: '10px', color: '#e8e2d0', align: 'center', wordWrap: { width: 280 },
    }).setOrigin(0.5).setVisible(false);
    this.captionTimer = null;

    this.makeDialogue();
    this.nb = null;

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
    const kb = this.input.keyboard;
    ['keydown-E', 'keydown-SPACE', 'keydown-ENTER'].forEach(k => kb.on(k, () => { if (this.dlg) this.advance(); }));
    ['ONE', 'TWO', 'THREE'].forEach((k, i) => kb.on('keydown-' + k, () => { if (this.dlg) this.choose(i); }));
    kb.on('keydown-N', () => { if (Controls.notebook && !this.dlg) this.toggleNotebook(); });
    kb.on('keydown-ESC', () => { if (this.nb) this.toggleNotebook(); });
  }

  setVisibleControls(v) {
    this.controlsShown = v;
    if (!v) { this.joy.id = null; this.joyBase.setVisible(false); this.joyKnob.setVisible(false); Controls.moveX = Controls.moveY = 0; Controls.run = false; }
  }

  caption(text, ms = 3500) {
    this.captionText.setText(text).setVisible(true);
    this.captionBg.setSize(Math.max(120, this.captionText.width + 20), this.captionText.height + 12).setVisible(true);
    this.captionBg.setAlpha(1); this.captionText.setAlpha(1);
    if (this.captionTimer) this.captionTimer.remove();
    this.captionTimer = this.time.delayedCall(ms, () => {
      this.tweens.add({ targets: [this.captionBg, this.captionText], alpha: 0, duration: 400 });
    });
  }

  // ---------- dialogue ----------

  makeDialogue() {
    const { height } = this.scale;
    this.dlgBox = this.add.container(0, 0).setDepth(50).setVisible(false);
    const bg = this.add.rectangle(8, height - 58, 372, 52, 0x0a0a0c, 0.9).setOrigin(0).setStrokeStyle(1, 0x8a8478, 0.8);
    this.dlgName = this.add.text(16, height - 54, '', { fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#e0b060' });
    this.dlgText = this.add.text(16, height - 43, '', { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#e8e2d0', wordWrap: { width: 352 }, lineSpacing: 1 });
    this.dlgMore = this.add.text(372, height - 12, '▸', { fontFamily: 'Arial', fontSize: '9px', color: '#8a8478' }).setOrigin(1, 1);
    this.tweens.add({ targets: this.dlgMore, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
    this.dlgBox.add([bg, this.dlgName, this.dlgText, this.dlgMore]);
    this.choiceBox = this.add.container(0, 0).setDepth(51);
    this.dlg = null;
  }

  // lines: [{ who, text, choices }]. Resolves with the index of the last
  // choice made (or null).
  talk(lines) {
    return new Promise(resolve => {
      // remember whether the controls were showing, to put them back after
      this.dlg = { lines, i: 0, resolve, choice: null, controlsWere: this.controlsShown };
      Controls.dialogueOpen = true;
      this.setVisibleControls(false);
      this.dlgBox.setVisible(true);
      this.showLine();
    });
  }

  showLine() {
    const line = this.dlg.lines[this.dlg.i];
    this.dlgName.setText(line.who || '');
    this.dlgText.setText(line.text);
    this.dlgText.setY(this.scale.height - (line.who ? 43 : 50));
    this.choiceBox.removeAll(true);
    this.dlg.options = null;
    this.dlgMore.setVisible(!line.choices);
    if (line.choices) {
      const { height } = this.scale;
      this.dlg.options = line.choices.map((c, i) => {
        const y = height - 64 - (line.choices.length - i) * 22;
        const r = this.add.rectangle(16, y, 300, 19, 0x1a1a20, 0.95).setOrigin(0).setStrokeStyle(1, 0xe0b060, 0.7);
        const t = this.add.text(24, y + 4, `${i + 1}.  ${c}`, { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#f0e0b0' });
        this.choiceBox.add([r, t]);
        return { x: 16, y, w: 300, h: 19 };
      });
    }
  }

  advance() {
    if (!this.dlg || this.dlg.options) return;
    this.next();
  }

  choose(i) {
    if (!this.dlg || !this.dlg.options || i >= this.dlg.options.length) return;
    this.dlg.choice = i;
    this.next();
  }

  next() {
    this.dlg.i++;
    if (this.dlg.i < this.dlg.lines.length) { this.showLine(); return; }
    const { resolve, choice, controlsWere } = this.dlg;
    this.dlg = null;
    this.setVisibleControls(controlsWere);
    this.choiceBox.removeAll(true);
    this.dlgBox.setVisible(false);
    Controls.dialogueOpen = false;
    Controls.blockActUntil = performance.now() + 300;
    Controls.actPressed = false;
    resolve(choice);
  }

  // ---------- the notebook ----------

  toggleNotebook() {
    const game = Controls.gameScene && this.scene.get(Controls.gameScene);
    if (this.nb) {
      this.nb.destroy();
      this.nb = null;
      this.setVisibleControls(this.controlsBeforeNotebook);
      if (game) this.scene.resume(Controls.gameScene);
      return;
    }
    if (game) this.scene.pause(Controls.gameScene);
    this.controlsBeforeNotebook = this.controlsShown;
    this.setVisibleControls(false);
    const { width, height } = this.scale;
    this.nb = this.add.container(0, 0).setDepth(100);
    this.nb.add(this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0));
    this.nb.add(this.add.rectangle(20, 10, width - 40, height - 20, 0xe8dfc8).setOrigin(0).setStrokeStyle(2, 0x6a4a2a));
    for (let y = 46; y < height - 14; y += 14) this.nb.add(this.add.rectangle(30, y, width - 60, 1, 0xb8c8d8, 0.5).setOrigin(0));
    this.nbTabs = ['Notes', 'Clues', 'Map', 'Stones'].map((name, i) => {
      const x = 34 + i * 70;
      const r = this.add.rectangle(x, 16, 62, 18, 0xd8cdb0).setOrigin(0).setStrokeStyle(1, 0x8a7a5a);
      const t = this.add.text(x + 31, 25, name, { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#3a2a1a' }).setOrigin(0.5);
      this.nb.add([r, t]);
      return { x, y: 16, w: 62, h: 18, name, r };
    });
    const close = this.add.text(width - 30, 16, '✕ close', { fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#6a4a2a' }).setOrigin(1, 0);
    this.nb.add(close);
    this.nbClose = { x: width - 80, y: 10, w: 60, h: 24 };
    this.nbPage = this.add.container(0, 0);
    this.nb.add(this.nbPage);
    this.showTab(this.nbTab || 'Notes');
  }

  showTab(name) {
    this.nbTab = name;
    this.nbTabs.forEach(t => t.r.setFillStyle(t.name === name ? 0xf4ecd8 : 0xd8cdb0));
    const p = this.nbPage;
    p.removeAll(true);
    const S = SaveGame.state;
    const { width } = this.scale;
    const ink = { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#2a2a40', wordWrap: { width: width - 80 } };
    const faint = { ...ink, color: '#8a8478' };
    if (name === 'Notes') {
      let y = 42;
      p.add(this.add.text(36, y, CHAPTER_NAMES[S.chapter] || '', { ...ink, fontSize: '11px', color: '#6a2a1a' }));
      y += 18;
      const todo = S.notes.filter(n => !n.done), done = S.notes.filter(n => n.done);
      for (const n of todo) { const t = this.add.text(36, y, '•  ' + n.text, ink); p.add(t); y += t.height + 3; }
      for (const n of done.slice(-6).reverse()) { const t = this.add.text(36, y, '✓  ' + n.text, faint); p.add(t); y += t.height + 3; }
      if (S.items.length) p.add(this.add.text(36, 230, 'Carrying: ' + S.items.join(', '), faint));
    } else if (name === 'Clues') {
      let y = 42;
      if (!S.clues.length) p.add(this.add.text(36, y, 'Nothing yet.', faint));
      for (const c of S.clues) {
        const t1 = this.add.text(36, y, c.title, { ...ink, fontSize: '10px', color: '#6a2a1a' });
        const t2 = this.add.text(36, y + t1.height, c.text, ink);
        p.add([t1, t2]);
        y += t1.height + t2.height + 6;
      }
    } else if (name === 'Map') {
      this.drawMapSketch(p);
    } else {
      const g = this.add.graphics();
      const cx = width / 2, cy = 140;
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * 56, y = cy + Math.sin(a) * 56;
        g.lineStyle(1.5, 0x2a2a40, 1).strokeCircle(x, y, 8);
        if (i >= S.stones) g.lineStyle(2, 0xa02020, 1).lineBetween(x - 9, y - 9, x + 9, y + 9).lineBetween(x - 9, y + 9, x + 9, y - 9);
      }
      p.add(g);
      p.add(this.add.text(cx, cy, `${S.stones} of 12`, { ...ink, fontSize: '12px' }).setOrigin(0.5));
      p.add(this.add.text(cx, 222, 'The ring of carved stones at the centre of the field.', faint).setOrigin(0.5));
    }
  }

  drawMapSketch(p) {
    const m = FARM_MAP, s = 3.6, ox = 40, oy = 44;
    const g = this.add.graphics();
    const R = (x0, y0, x1, y1, col, a = 1) => g.fillStyle(col, a).fillRect(ox + x0 * s, oy + y0 * s, (x1 - x0 + 1) * s, (y1 - y0 + 1) * s);
    g.lineStyle(1, 0x2a2a40, 1);
    R(1, 1, 76, 2, 0x8a7a5a, 0.6);                   // road
    R(3, 7, 25, 25, 0x2a2a40, 0.15); g.strokeRect(ox + 3 * s, oy + 7 * s, 23 * s, 19 * s);
    R(26, 9, 27, 23, 0x8a7a5a, 0.4);                 // porch
    g.strokeRect(ox + 3 * s, oy + 29 * s, 9 * s, 7 * s);   // garage
    g.strokeRect(ox + 14 * s, oy + 29 * s, 6 * s, 5 * s);  // shed
    const F = m.FIELD;
    g.lineStyle(1, 0x4a6a2a, 0.7);
    for (let x = F.x0; x <= F.x1; x += 3) g.lineBetween(ox + x * s, oy + F.y0 * s, ox + x * s, oy + (F.y1 + 1) * s);
    g.lineStyle(1, 0x2a2a40, 1).strokeRect(ox + F.x0 * s, oy + F.y0 * s, (F.x1 - F.x0 + 1) * s, (F.y1 - F.y0 + 1) * s);
    g.fillStyle(0xe8dfc8, 1).fillCircle(ox + 52.5 * s, oy + 22.5 * s, 4 * s);
    g.lineStyle(1, 0x2a2a40, 1).strokeCircle(ox + 52.5 * s, oy + 22.5 * s, 4 * s);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      g.fillStyle(i < SaveGame.state.stones ? 0x2a2a40 : 0xa02020, 1).fillCircle(ox + 52.5 * s + Math.cos(a) * 2.6 * s, oy + 22.5 * s + Math.sin(a) * 2.6 * s, 1.5);
    }
    p.add(g);
    const lab = (x, y, t) => p.add(this.add.text(ox + x * s, oy + y * s, t, { fontFamily: 'Georgia, serif', fontSize: '8px', color: '#2a2a40' }).setOrigin(0.5));
    lab(30, 0.2, 'road to Marrowfield');
    lab(14, 16, 'house'); lab(7, 37, 'garage'); lab(17, 35, 'shed'); lab(52.5, 31, 'stone ring'); lab(53, 6.3, 'the cornfield');
    if (Controls.playerTile) {
      const { x, y } = Controls.playerTile;
      if (y < 38) {
        const dot = this.add.circle(ox + x * s, oy + y * s, 3, 0xc02020);
        p.add(dot);
        p.add(this.add.text(ox + x * s + 5, oy + y * s, 'you', { fontFamily: 'Georgia, serif', fontSize: '7px', color: '#c02020' }).setOrigin(0, 0.5));
      }
    }
  }

  notebookTap(p) {
    const hit = (b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    if (hit(this.nbClose)) { this.toggleNotebook(); return; }
    const t = this.nbTabs.find(hit);
    if (t) this.showTab(t.name);
  }

  // ---------- touch ----------

  onDown(p) {
    const { width } = this.scale;
    if (this.nb) { this.notebookTap(p); return; }
    if (this.dlg) {
      if (this.dlg.options) {
        const i = this.dlg.options.findIndex(o => p.x >= o.x && p.x <= o.x + o.w && p.y >= o.y - 2 && p.y <= o.y + o.h + 2);
        if (i >= 0) this.choose(i);
      } else {
        this.advance();
      }
      return;
    }
    if (Controls.notebook && p.x > width - 44 && p.y < 34) { this.toggleNotebook(); return; }
    if (Controls.showDebugButton && p.x > width - 60 && p.y < 26) {
      Controls.debugPressed = true;
      return;
    }
    if (!this.controlsShown) return;
    if (p.x < width / 2) {
      if (this.joy.id === null) {
        this.joy = { id: p.id, bx: p.x, by: p.y };
        this.joyBase.setPosition(p.x, p.y).setVisible(true);
        this.joyKnob.setPosition(p.x, p.y).setVisible(true);
      }
      return;
    }
    const near = (b, slack) => Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) < b.r + slack;
    if (Controls.lanternAvailable && near(this.lampBtn, 6)) {
      Controls.lanternPressed = true;
      this.lampBtn.id = p.id;
      this.lampGfx.setFillStyle(0xffd27a, 0.35);
    } else if (near(this.actBtn, 16) || p.y > this.lampBtn.y + this.lampBtn.r) {
      // generous: any press in the lower right counts as ACT
      Controls.actPressed = true;
      Controls.actHeld = true;
      this.actBtn.id = p.id;
      this.actGfx.setFillStyle(0xffffff, 0.35);
    }
  }

  onMove(p) {
    if (p.id !== this.joy.id) return;
    let dx = p.x - this.joy.bx, dy = p.y - this.joy.by;
    let len = Math.hypot(dx, dy);
    const maxDrag = this.JOY_R * 1.25;
    if (len > maxDrag) {
      // the joystick follows the thumb if it slides too far
      this.joy.bx = p.x - dx / len * maxDrag;
      this.joy.by = p.y - dy / len * maxDrag;
      this.joyBase.setPosition(this.joy.bx, this.joy.by);
      dx = p.x - this.joy.bx; dy = p.y - this.joy.by; len = maxDrag;
    }
    const mag = Math.min(1, len / this.JOY_R);
    this.joyKnob.setPosition(this.joy.bx + dx / len * Math.min(len, this.JOY_R) || this.joy.bx, this.joy.by + dy / len * Math.min(len, this.JOY_R) || this.joy.by);
    if (mag < 0.18) { Controls.moveX = Controls.moveY = 0; Controls.run = false; return; }
    Controls.moveX = dx / len;
    Controls.moveY = dy / len;
    Controls.run = mag > 0.92;
  }

  onUp(p) {
    if (p.id === this.joy.id) {
      this.joy.id = null;
      this.joyBase.setVisible(false);
      this.joyKnob.setVisible(false);
      Controls.moveX = Controls.moveY = 0;
      Controls.run = false;
    }
    if (p.id === this.actBtn.id) { this.actBtn.id = null; Controls.actHeld = false; this.actGfx.setFillStyle(0xffffff, 0.1); }
    if (p.id === this.lampBtn.id) { this.lampBtn.id = null; this.lampGfx.setFillStyle(0xffd27a, 0.1); }
  }

  update(time) {
    const show = this.touch && this.controlsShown && !this.nb;
    this.actGfx.setVisible(show); this.actLabel.setVisible(show);
    this.lampGfx.setVisible(show && Controls.lanternAvailable); this.lampLabel.setVisible(show && Controls.lanternAvailable);
    this.nbBtn.setVisible(Controls.notebook && !this.nb);

    const c = Controls.crickets;
    this.cricket.setVisible(c !== null);
    if (c !== null) this.cricket.setAlpha(0.12 + 0.75 * Phaser.Math.Clamp(c, 0, 1));
    const oil = Controls.oil;
    [this.oilLabel, this.oilBack, this.oilBar].forEach(o => o.setVisible(oil !== null));
    if (oil !== null) {
      this.oilBar.width = 40 * Phaser.Math.Clamp(oil, 0, 1);
      this.oilBar.setFillStyle(oil < 0.2 ? 0xd05030 : 0xffd27a, 0.9);
    }
    this.debugBtn.setVisible(Controls.showDebugButton);

    // ACT glows when there is something to use.
    if (show) {
      const a = Controls.actAvailable ? 0.6 + 0.35 * Math.sin(time / 180) : 0.4;
      this.actGfx.setStrokeStyle(Controls.actAvailable ? 2 : 1, 0xffffff, a);
      this.actLabel.setAlpha(Controls.actAvailable ? 1 : 0.6);
    }
  }
}
