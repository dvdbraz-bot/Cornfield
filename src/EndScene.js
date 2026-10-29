// The ending screens. mode:
//   'prologue' - black, then the title. Tap to go back to the start.
//   'caught'   - the test night: caught from behind. Tap to try again.
//   'dawn'     - the test night: survived until dawn. Tap to play again.
class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  init(data) { this.mode = (data && data.mode) || 'prologue'; }

  create() {
    const { width, height } = this.scale;
    const touch = this.sys.game.device.input.touch;
    this.cameras.main.setBackgroundColor(this.mode === 'dawn' ? '#2a2620' : '#000000');
    let next = 'Start', prompt = touch ? 'Tap to continue' : 'Click or press any key to continue';

    if (this.mode === 'prologue') {
      this.time.delayedCall(1400, () => {
        SFX.play('thud', { vol: 0.9 });
        this.add.text(width / 2, height / 2 - 10, 'STAY AWAY FROM\nTHE CORNFIELD', {
          fontFamily: 'Georgia, serif', fontSize: '32px', color: '#d8d2c0', align: 'center', lineSpacing: 4,
        }).setOrigin(0.5);
      });
    } else {
      const caught = this.mode === 'caught';
      next = 'TestNight';
      prompt = touch ? 'Tap to try again' : 'Click or press any key to try again';
      this.time.delayedCall(caught ? 900 : 300, () => {
        if (caught) SFX.play('thud', { vol: 0.7 });
        this.add.text(width / 2, height / 2 - 12, caught ? 'It got behind you.' : 'Dawn.', {
          fontFamily: 'Georgia, serif', fontSize: '22px', color: '#d8d2c0',
        }).setOrigin(0.5);
        this.add.text(width / 2, height / 2 + 14, caught ? 'Keep your light on it. Never let it behind you.' : 'The crickets give way to silence. It sleeps.', {
          fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#8a8478',
        }).setOrigin(0.5);
      });
    }

    this.time.delayedCall(this.mode === 'prologue' ? 4200 : 2200, () => {
      const t = this.add.text(width / 2, height - 30, prompt, {
        fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#8a8478',
      }).setOrigin(0.5);
      this.tweens.add({ targets: t, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });
      const go = () => {
        window.removeEventListener('pointerup', go);
        window.removeEventListener('keydown', go);
        SFX.init();
        this.scene.start(next);
      };
      window.addEventListener('pointerup', go);
      window.addEventListener('keydown', go);
    });
  }
}
