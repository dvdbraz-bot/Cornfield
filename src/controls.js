// Shared control state. The on-screen joystick/buttons (UIScene) and the
// keyboard (the game scenes) both write here; the game reads it each frame.
// The game also writes a few values here for the UI to show.
const Controls = {
  moveX: 0,          // -1 .. 1
  moveY: 0,          // -1 .. 1
  run: false,
  actPressed: false, // true for one frame after ACT is pressed
  actHeld: false,    // true while ACT is held down (hold your breath)
  lanternPressed: false,
  debugPressed: false,
  actAvailable: false, // the game sets this when something can be used
  crickets: null,      // 0..1 how loud the crickets are (cricket icon); null hides it
  oil: null,           // 0..1 lamp oil left; null hides the oil bar
  showDebugButton: false,
  notebook: false,        // show the NOTEBOOK button (story chapters)
  lanternAvailable: true, // show the LANTERN button (not by day)
  dialogueOpen: false,
  blockActUntil: 0,       // ignore ACT briefly after a dialogue closes
  gameScene: null,        // the scene the notebook pauses
  playerTile: null,       // where Michael is, for the notebook map
  reset() {
    this.moveX = 0; this.moveY = 0; this.run = false;
    this.actPressed = false; this.actHeld = false; this.lanternPressed = false; this.debugPressed = false;
    this.actAvailable = false; this.crickets = null; this.oil = null; this.showDebugButton = false;
    this.notebook = false; this.lanternAvailable = true; this.dialogueOpen = false; this.blockActUntil = 0;
    this.gameScene = null; this.playerTile = null;
  },
};
