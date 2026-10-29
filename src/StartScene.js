// "Play with headphones." Then Continue (if there's a save), New game,
// Chapters (any chapter you've reached), or the Milestone 2 test night.
// Testing shortcut: tap "Play with headphones." five times to unlock every
// chapter that's built.
class StartScene extends Phaser.Scene {
  constructor() { super('Start'); }

  create() {
    const { width, height } = this.scale;
    this.touch = this.sys.game.device.input.touch;
    this.cameras.main.setBackgroundColor('#000000');
    this.add.text(width / 2, 40, 'Play with headphones.', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#d8d2c0',
    }).setOrigin(0.5);
    if (!this.touch) {
      this.add.text(width / 2, height - 10, 'WASD / arrows: move, Shift: run, E: act (hold: hold your breath), F: lantern, N: notebook, G: debug (test night)', {
        fontFamily: 'Arial, sans-serif', fontSize: '7px', color: '#5a564c',
      }).setOrigin(0.5);
    }
    this.toast = this.add.text(width / 2, 62, '', { fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#e0b060' }).setOrigin(0.5);
    this.page = this.add.container(0, 0);
    this.titleTaps = 0;
    this.showMain();

    // Use real browser events so fullscreen, sound and vibration are allowed.
    this.started = false;
    const onPointer = (e) => {
      const rect = this.game.canvas.getBoundingClientRect();
      const gx = (e.clientX - rect.left) / rect.width * width;
      const gy = (e.clientY - rect.top) / rect.height * height;
      if (gy > 26 && gy < 54) { this.tapTitle(); return; }
      const hit = this.opts.find(o => o.go && Math.abs(gy - o.y) < o.h / 2 + 2 && Math.abs(gx - width / 2) < o.w / 2 + 10);
      if (hit) this.choose(hit.go);
    };
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Backspace') { if (this.pageName === 'chapters') this.showMain(); return; }
      const hit = this.opts.find(o => o.key === e.key);
      if (hit && hit.go) this.choose(hit.go);
    };
    window.addEventListener('pointerup', onPointer);
    window.addEventListener('keydown', onKey);
    this.events.once('shutdown', () => {
      window.removeEventListener('pointerup', onPointer);
      window.removeEventListener('keydown', onKey);
    });
  }

  // One row of the menu. go: what tapping it does (null = can't be chosen).
  option(y, label, sub, go, key, h = 30, w = 230, dim = false) {
    const { width } = this.scale;
    const box = this.add.rectangle(width / 2, y, w, h, 0xffffff, dim ? 0.01 : 0.04).setStrokeStyle(1, 0x8a8478, dim ? 0.25 : 0.6);
    const big = this.add.text(width / 2, sub ? y - 5 : y, label, { fontFamily: 'Georgia, serif', fontSize: '11px', color: dim ? '#5a564c' : '#d8d2c0' }).setOrigin(0.5);
    this.page.add([box, big]);
    if (sub) this.page.add(this.add.text(width / 2, y + 8, sub, { fontFamily: 'Arial, sans-serif', fontSize: '7px', color: dim ? '#4a463e' : '#8a8478' }).setOrigin(0.5));
    this.opts.push({ y, h, w, go, key });
  }

  hint(key) { return this.touch ? 'tap to play' : 'click, or press ' + key; }

  showMain() {
    this.pageName = 'main';
    this.page.removeAll(true);
    this.opts = [];
    const saved = SaveGame.exists() && SaveGame.load();
    if (saved) Unlocks.unlock(saved.chapter); // progress from before Chapters existed counts
    const canContinue = saved && CHAPTERS[saved.chapter];
    let y = 92;
    if (canContinue) { this.option(y, 'Continue', (CHAPTER_NAMES[saved.chapter] || '') + '  -  ' + this.hint('0'), 'continue', '0'); y += 38; }
    this.option(y, 'New game', 'starts with the prologue  -  ' + this.hint('1'), 'new', '1'); y += 38;
    this.option(y, 'Chapters', 'play any chapter you have reached  -  ' + (this.touch ? 'tap to choose' : 'click, or press 2'), 'chapters', '2'); y += 38;
    this.option(y, 'Test night: the thing in the field', 'Milestone 2  -  ' + this.hint('3'), 'test', '3');
  }

  showChapters() {
    this.pageName = 'chapters';
    this.page.removeAll(true);
    this.opts = [];
    const { width } = this.scale;
    const unlocked = Unlocks.get();
    const built = Unlocks.ORDER.filter(id => id === 'prologue' || CHAPTERS[id]);
    this.page.add(this.add.text(width / 2, 76, 'Starting a chapter replaces your saved game.', { fontFamily: 'Arial, sans-serif', fontSize: '7px', color: '#8a8478' }).setOrigin(0.5));
    let y = 96, n = 1;
    for (const id of built) {
      const open = unlocked.has(id);
      const key = String(n++);
      this.option(y, CHAPTER_NAMES[id] + (open ? '' : '  (locked)'), null, open ? 'chapter:' + id : null, open ? key : null, 20, 230, !open);
      y += 24;
    }
    this.option(y + 6, 'Back', null, 'back', 'Escape', 20, 120);
  }

  tapTitle() {
    this.titleTaps++;
    if (this.titleTaps < 5) return;
    this.titleTaps = 0;
    Unlocks.unlockAll();
    this.toast.setText('All chapters unlocked (for testing).');
    if (this.pageName === 'chapters') this.showChapters();
  }

  choose(go) {
    if (go === 'chapters') { this.showChapters(); return; }
    if (go === 'back') { this.showMain(); return; }
    if (this.started) return;
    this.started = true;
    SFX.init();
    if (this.touch) {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) {
        Promise.resolve(req.call(el, { navigationUI: 'hide' }))
          .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
          .catch(() => {});
      }
    }
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (go === 'continue') this.scene.start('Chapter', { resume: true });
      else if (go === 'new' || go === 'chapter:prologue') this.scene.start('Prologue');
      else if (go === 'test') this.scene.start('TestNight');
      else if (go.startsWith('chapter:')) {
        // Start that chapter from its beginning.
        SaveGame.startNew();
        SaveGame.state.chapter = go.slice(8);
        SaveGame.save();
        this.scene.start('Chapter');
      }
    });
  }
}
