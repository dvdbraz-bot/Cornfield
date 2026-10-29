// On-screen controls and the caption box. Runs on top of the game and is not
// affected by screen shake.
//   Left half: floating joystick under the thumb (push to the edge to run).
//   Right side: big ACT button, smaller LANTERN button above it.
class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    const { width, height } = this.scale;
    this.touch = this.sys.game.device.input.touch;
    this.input.addPointer(3);
    Controls.reset();

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
    this.buttons = [this.actGfx, this.actLabel, this.lampGfx, this.lampLabel];
    if (!this.touch) this.buttons.forEach(b => b.setVisible(false));

    // Caption box for Henry's thoughts.
    this.captionBg = this.add.rectangle(width / 2, 22, 300, 26, 0x000000, 0.75).setStrokeStyle(1, 0x8a8478, 0.6).setVisible(false);
    this.captionText = this.add.text(width / 2, 22, '', {
      fontFamily: 'Georgia, serif', fontSize: '10px', color: '#e8e2d0', align: 'center', wordWrap: { width: 280 },
    }).setOrigin(0.5).setVisible(false);
    this.captionTimer = null;

    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    this.input.on('pointerupoutside', this.onUp, this);
  }

  setVisibleControls(v) {
    if (this.touch) this.buttons.forEach(b => b.setVisible(v));
    if (!v) { this.joy.id = null; this.joyBase.setVisible(false); this.joyKnob.setVisible(false); Controls.moveX = Controls.moveY = 0; }
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

  onDown(p) {
    const { width } = this.scale;
    if (p.x < width / 2) {
      if (this.joy.id === null) {
        this.joy = { id: p.id, bx: p.x, by: p.y };
        this.joyBase.setPosition(p.x, p.y).setVisible(true);
        this.joyKnob.setPosition(p.x, p.y).setVisible(true);
      }
      return;
    }
    const near = (b, slack) => Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) < b.r + slack;
    if (near(this.lampBtn, 6)) {
      Controls.lanternPressed = true;
      this.lampBtn.id = p.id;
      this.lampGfx.setFillStyle(0xffd27a, 0.35);
    } else if (near(this.actBtn, 16) || p.y > this.lampBtn.y + this.lampBtn.r) {
      // generous: any press in the lower right counts as ACT
      Controls.actPressed = true;
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
    if (p.id === this.actBtn.id) { this.actBtn.id = null; this.actGfx.setFillStyle(0xffffff, 0.1); }
    if (p.id === this.lampBtn.id) { this.lampBtn.id = null; this.lampGfx.setFillStyle(0xffd27a, 0.1); }
  }

  update(time) {
    // ACT glows when there is something to use.
    if (this.touch && this.actGfx.visible) {
      const a = Controls.actAvailable ? 0.6 + 0.35 * Math.sin(time / 180) : 0.4;
      this.actGfx.setStrokeStyle(Controls.actAvailable ? 2 : 1, 0xffffff, a);
      this.actLabel.setAlpha(Controls.actAvailable ? 1 : 0.6);
    }
  }
}
