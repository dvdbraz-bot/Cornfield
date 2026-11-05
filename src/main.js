// Game setup: 480x270, crisp pixels, scaled to fit the screen, 30 fps.
// The game starts once David's drawings in assets/ have loaded (see art.js).
let game = null;
const startGame = () => { game = new Phaser.Game({
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
  scene: [StartScene, PrologueScene, TestNightScene, ChapterScene, UIScene, EndScene],
}); };
Art.load().then(startGame);

// Save the moment the game goes into the background (a phone call, an app switch).
document.addEventListener('visibilitychange', () => {
  if (!document.hidden || !game) return;
  const ch = game.scene.getScene('Chapter');
  if (ch && ch.sys.isActive()) ch.saveNow();
});
