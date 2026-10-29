// Black screen and the title. Tap to restart.
class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#000000');
    this.time.delayedCall(1400, () => {
      SFX.play('thud', { vol: 0.9 });
      this.add.text(width / 2, height / 2 - 10, 'STAY AWAY FROM\nTHE CORNFIELD', {
        fontFamily: 'Georgia, serif', fontSize: '32px', color: '#d8d2c0', align: 'center', lineSpacing: 4,
      }).setOrigin(0.5);
    });
    this.time.delayedCall(4200, () => {
      const t = this.add.text(width / 2, height - 30, this.sys.game.device.input.touch ? 'Tap to restart' : 'Click or press any key to restart', {
        fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#8a8478',
      }).setOrigin(0.5);
      this.tweens.add({ targets: t, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });
      const restart = () => {
        window.removeEventListener('pointerup', restart);
        window.removeEventListener('keydown', restart);
        SFX.init();
        this.scene.start('Prologue');
      };
      window.addEventListener('pointerup', restart);
      window.addEventListener('keydown', restart);
    });
  }
}
