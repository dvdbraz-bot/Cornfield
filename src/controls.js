// Shared control state. The on-screen joystick/buttons (UIScene) and the
// keyboard (PrologueScene) both write here; the game reads it each frame.
const Controls = {
  moveX: 0,          // -1 .. 1
  moveY: 0,          // -1 .. 1
  run: false,
  actPressed: false, // true for one frame after ACT is pressed
  lanternPressed: false,
  actAvailable: false, // the game sets this when something can be used
  reset() {
    this.moveX = 0; this.moveY = 0; this.run = false;
    this.actPressed = false; this.lanternPressed = false; this.actAvailable = false;
  },
};
