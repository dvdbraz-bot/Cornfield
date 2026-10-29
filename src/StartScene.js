// "Play with headphones." Tap to begin.
class StartScene extends Phaser.Scene {
  constructor() { super('Start'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#000000');
    this.add.text(width / 2, height / 2 - 14, 'Play with headphones.', {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#d8d2c0',
    }).setOrigin(0.5);
    const tap = this.add.text(width / 2, height / 2 + 22, this.sys.game.device.input.touch ? 'Tap to begin' : 'Click or press any key to begin', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#8a8478',
    }).setOrigin(0.5);
    this.tweens.add({ targets: tap, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });

    if (!this.sys.game.device.input.touch) {
      this.add.text(width / 2, height - 18, 'Keyboard: WASD / arrows to move, hold Shift to run, E = act, F = lantern', {
        fontFamily: 'Arial, sans-serif', fontSize: '8px', color: '#5a564c',
      }).setOrigin(0.5);
    }

    // Use a real browser event so fullscreen, sound and vibration are allowed.
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      SFX.init();
      if (this.sys.game.device.input.touch) {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) {
          Promise.resolve(req.call(el, { navigationUI: 'hide' }))
            .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
            .catch(() => {});
        }
      }
      window.removeEventListener('pointerup', begin);
      window.removeEventListener('keydown', begin);
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Prologue'));
    };
    window.addEventListener('pointerup', begin);
    window.addEventListener('keydown', begin);
  }
}
