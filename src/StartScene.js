// "Play with headphones." Then Continue (if there's a save), New game, or the Milestone 2 test night.
class StartScene extends Phaser.Scene {
  constructor() { super('Start'); }

  create() {
    const { width, height } = this.scale;
    const touch = this.sys.game.device.input.touch;
    this.cameras.main.setBackgroundColor('#000000');
    this.add.text(width / 2, 70, 'Play with headphones.', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#d8d2c0',
    }).setOrigin(0.5);

    const option = (y, label, sub) => {
      const box = this.add.rectangle(width / 2, y, 220, 34, 0xffffff, 0.04).setStrokeStyle(1, 0x8a8478, 0.6);
      this.add.text(width / 2, y - 6, label, { fontFamily: 'Georgia, serif', fontSize: '12px', color: '#d8d2c0' }).setOrigin(0.5);
      this.add.text(width / 2, y + 9, sub, { fontFamily: 'Arial, sans-serif', fontSize: '7px', color: '#8a8478' }).setOrigin(0.5);
      return { y, box };
    };
    const saved = SaveGame.exists() && SaveGame.load();
    const canContinue = saved && CHAPTERS[saved.chapter];
    const hint = (n) => touch ? 'tap to play' : 'click, or press ' + n;
    const opts = [];
    let y = canContinue ? 118 : 130;
    if (canContinue) { opts.push({ ...option(y, 'Continue', (CHAPTER_NAMES[saved.chapter] || '') + '  -  ' + hint(0)), go: 'continue' }); y += 42; }
    opts.push({ ...option(y, 'New game', 'starts with the prologue  -  ' + hint(1)), go: 'new' }); y += 42;
    opts.push({ ...option(y, 'Test night: the thing in the field', 'Milestone 2  -  ' + hint(2)), go: 'test' });

    if (!touch) {
      this.add.text(width / 2, height - 18, 'WASD / arrows: move, Shift: run, E: act (hold: hold your breath), F: lantern, N: notebook, G: debug (test night)', {
        fontFamily: 'Arial, sans-serif', fontSize: '7px', color: '#5a564c',
      }).setOrigin(0.5);
    }

    // Use real browser events so fullscreen, sound and vibration are allowed.
    let started = false;
    const begin = (choice) => {
      if (started) return;
      started = true;
      SFX.init();
      if (touch) {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) {
          Promise.resolve(req.call(el, { navigationUI: 'hide' }))
            .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
            .catch(() => {});
        }
      }
      window.removeEventListener('pointerup', onPointer);
      window.removeEventListener('keydown', onKey);
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (choice === 'continue') this.scene.start('Chapter', { resume: true });
        else if (choice === 'new') this.scene.start('Prologue');
        else this.scene.start('TestNight');
      });
    };
    const onPointer = (e) => {
      const rect = this.game.canvas.getBoundingClientRect();
      const gy = (e.clientY - rect.top) / rect.height * height;
      const hit = opts.find(o => Math.abs(gy - o.y) < 22);
      if (hit) begin(hit.go);
    };
    const onKey = (e) => {
      if (e.key === '0' && canContinue) begin('continue');
      if (e.key === '1') begin('new');
      if (e.key === '2') begin('test');
    };
    window.addEventListener('pointerup', onPointer);
    window.addEventListener('keydown', onKey);
    this.events.once('shutdown', () => {
      window.removeEventListener('pointerup', onPointer);
      window.removeEventListener('keydown', onKey);
    });
  }
}
