// "Play with headphones." Then choose the prologue or the Milestone 2 test night.
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
    const opts = [
      { ...option(130, 'Prologue: Come see', touch ? 'tap to play' : 'click, or press 1'), scene: 'Prologue' },
      { ...option(178, 'Test night: the thing in the field', touch ? 'Milestone 2 - tap to play' : 'Milestone 2 - click, or press 2'), scene: 'TestNight' },
    ];

    if (!touch) {
      this.add.text(width / 2, height - 18, 'Keyboard: WASD / arrows to move, hold Shift to run, E = act (hold to hold your breath), F = lantern, G = debug view', {
        fontFamily: 'Arial, sans-serif', fontSize: '7px', color: '#5a564c',
      }).setOrigin(0.5);
    }

    // Use real browser events so fullscreen, sound and vibration are allowed.
    let started = false;
    const begin = (sceneKey) => {
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
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(sceneKey));
    };
    const onPointer = (e) => {
      const rect = this.game.canvas.getBoundingClientRect();
      const gy = (e.clientY - rect.top) / rect.height * height;
      const hit = opts.find(o => Math.abs(gy - o.y) < 22);
      if (hit) begin(hit.scene);
    };
    const onKey = (e) => {
      if (e.key === '1' || e.key === 'Enter') begin('Prologue');
      if (e.key === '2') begin('TestNight');
    };
    window.addEventListener('pointerup', onPointer);
    window.addEventListener('keydown', onKey);
  }
}
