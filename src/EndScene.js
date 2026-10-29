// The ending screens. mode:
//   'prologue'    - black, then the title. Tap to start Day 1.
//   'caught'      - test night: caught from behind. Tap to try again.
//   'dawn'        - test night: survived until dawn.
//   'caught-save' - story: caught. Tap to go back to the last save.
//   'chapter'     - story: end of a day or night. Tap for the next one.
class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  init(data) { this.data_ = data || {}; this.mode = this.data_.mode || 'prologue'; }

  create() {
    const { width, height } = this.scale;
    const touch = this.sys.game.device.input.touch;
    const tap = (what) => (touch ? 'Tap to ' : 'Click or press any key to ') + what;
    this.cameras.main.setBackgroundColor(this.mode === 'dawn' ? '#2a2620' : '#000000');
    const big = (y, text, size = 22) => this.add.text(width / 2, y, text, { fontFamily: 'Georgia, serif', fontSize: size + 'px', color: '#d8d2c0', align: 'center', lineSpacing: 4 }).setOrigin(0.5);
    const small = (y, text) => this.add.text(width / 2, y, text, { fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#8a8478', align: 'center', wordWrap: { width: 380 } }).setOrigin(0.5);

    let go, prompt, promptDelay = 2200;
    if (this.mode === 'prologue') {
      this.time.delayedCall(1400, () => {
        SFX.play('thud', { vol: 0.9 });
        big(height / 2 - 10, 'STAY AWAY FROM\nTHE CORNFIELD', 32);
      });
      promptDelay = 4200;
      prompt = tap('begin Day 1');
      go = () => { SaveGame.startNew(); this.scene.start('Chapter'); };
    } else if (this.mode === 'caught' || this.mode === 'dawn') {
      const caught = this.mode === 'caught';
      this.time.delayedCall(caught ? 900 : 300, () => {
        if (caught) SFX.play('thud', { vol: 0.7 });
        big(height / 2 - 12, caught ? 'It got behind you.' : 'Dawn.');
        small(height / 2 + 14, caught ? 'Keep your light on it. Never let it behind you.' : 'The crickets give way to silence. It sleeps.');
      });
      prompt = tap('try again');
      go = () => this.scene.start('TestNight');
    } else if (this.mode === 'caught-save') {
      this.time.delayedCall(900, () => {
        SFX.play('thud', { vol: 0.7 });
        big(height / 2 - 12, 'It got behind you.');
        small(height / 2 + 14, 'Back to the last save.');
      });
      prompt = tap('continue');
      go = () => { SaveGame.load(); this.scene.start('Chapter', { resume: true }); };
    } else {
      const next = this.data_.next;
      big(height / 2 - 30, 'End of ' + (CHAPTER_NAMES[this.data_.finished] || 'the chapter'), 18);
      small(height / 2 - 4, 'Your progress is saved.');
      if (CHAPTERS[next]) {
        big(height / 2 + 26, 'Next: ' + CHAPTER_NAMES[next], 14);
        prompt = tap('continue');
        go = () => this.scene.start('Chapter');
      } else {
        small(height / 2 + 26, (CHAPTER_NAMES[next] || 'The next chapter') + ' comes in the next build.');
        prompt = tap('go back to the start');
        go = () => this.scene.start('Start');
      }
      promptDelay = 1200;
    }

    this.time.delayedCall(promptDelay, () => {
      const t = this.add.text(width / 2, height - 30, prompt, { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#8a8478' }).setOrigin(0.5);
      this.tweens.add({ targets: t, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });
      const handler = () => {
        window.removeEventListener('pointerup', handler);
        window.removeEventListener('keydown', handler);
        SFX.init();
        go();
      };
      window.addEventListener('pointerup', handler);
      window.addEventListener('keydown', handler);
      this.events.once('shutdown', () => {
        window.removeEventListener('pointerup', handler);
        window.removeEventListener('keydown', handler);
      });
    });
  }
}
