const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const tap = async (x, y) => { await touch('touchStart', [{ x, y, id: 9 }]); await p.waitForTimeout(60); await touch('touchEnd', []); await p.waitForTimeout(150); };
  const S = (f, a) => p.evaluate(f, a);
  const pos = () => S(() => { const c = game.scene.getScene('Chapter'); return [Math.round(c.hx), Math.round(c.hy)]; });
  // drag the joystick left-half for ms, direction dx,dy
  const stick = async (dx, dy, ms) => {
    await touch('touchStart', [{ x: 200, y: 250, id: 1 }]);
    await touch('touchMove', [{ x: 200 + dx, y: 250 + dy, id: 1 }]);
    await p.waitForTimeout(ms);
    await touch('touchEnd', []); await p.waitForTimeout(100);
  };
  const tapThroughDialogue = async () => { for (let i = 0; i < 40 && await S(() => Controls.dialogueOpen); i++) await tap(450, 380); };
  await p.goto('http://localhost:8123/'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
  await S(() => { SFX.init(); SaveGame.startNew(); game.scene.getScene('Start').scene.start('Chapter'); });
  // the arrival cutscene with its two dialogues
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(250); await tapThroughDialogue(); if (await S(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene)) break; }
  let a = await pos(); await stick(-40, 0, 800); let b2 = await pos();
  console.log('after arrival, joystick moves Michael:', a, '->', b2);
  // into the living room, the news dialogue
  await S(() => { const c = game.scene.getScene('Chapter'); c.hx = 9 * 16 + 8; c.hy = 9 * 16 + 8; });
  await p.waitForTimeout(500); await tapThroughDialogue(); await p.waitForTimeout(300);
  console.log('step', await S(() => SaveGame.state.step), 'controls shown:', await S(() => game.scene.getScene('UI').controlsShown));
  a = await pos(); await stick(0, -40, 800); b2 = await pos();
  console.log('after the news, joystick moves Michael:', a, '->', b2);
  // notebook open and close by touch
  await tap(800, 25); await p.waitForTimeout(300);
  console.log('notebook open:', await S(() => !!game.scene.getScene('UI').nb));
  await tap(780, 40); await p.waitForTimeout(300);
  console.log('notebook closed:', await S(() => !game.scene.getScene('UI').nb));
  a = await pos(); await stick(0, 40, 800); b2 = await pos();
  console.log('after the notebook, joystick moves Michael:', a, '->', b2);
  // ACT button by touch: Ma's photo
  await S(() => { const c = game.scene.getScene('Chapter'); c.hx = 12 * 16 + 14; c.hy = 9 * 16 + 8; });
  await p.waitForTimeout(300); await tap(747, 333); await p.waitForTimeout(300);
  console.log('ACT by touch (photo clue):', await S(() => SaveGame.state.clues.map(c => c.id).join(',')));
  console.log('errors', errs);
  await b.close();
})();
