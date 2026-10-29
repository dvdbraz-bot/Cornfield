// Game setup: 480x270, crisp pixels, scaled to fit the screen, 30 fps.
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  powerPreference: 'low-power',
  fps: { target: 30, limit: 30 },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 270,
  },
  input: { activePointers: 4 },
  scene: [StartScene, PrologueScene, UIScene, EndScene],
});
