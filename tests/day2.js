const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.addEventListener('unhandledrejection', e => console.error('REJECTION ' + (e.reason && e.reason.stack || e.reason))); });
  const S = (f, a) => p.evaluate(f, a);
  const C = () => S(() => `${SaveGame.state.chapter} step=${SaveGame.state.step} dlg=${Controls.dialogueOpen} cutscene=${game.scene.getScene('Chapter').cutscene}`);
  const tp = (tx, ty) => S(([x, y]) => { const c = game.scene.getScene('Chapter'); c.hx = x * 16 + 8; c.hy = y * 16 + 8; }, [tx, ty]);
  const act = async () => { await p.keyboard.down('e'); await p.waitForTimeout(80); await p.keyboard.up('e'); await p.waitForTimeout(300); };
  const talkThrough = async (pick = 0) => {
    for (let i = 0; i < 60; i++) {
      const st = await S(() => ({ open: Controls.dialogueOpen, opts: !!(game.scene.getScene('UI').dlg && game.scene.getScene('UI').dlg.options) }));
      if (!st.open) { await p.waitForTimeout(400); if (!(await S(() => Controls.dialogueOpen))) return; continue; }
      await p.keyboard.press(st.opts ? String(pick + 1) : 'Enter'); await p.waitForTimeout(120);
    }
  };
  const waitStep = async (ch, n, max = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await S(([c, k]) => SaveGame.state.chapter === c && SaveGame.state.step >= k && game.scene.getScene('Chapter').sys.isActive(), [ch, n])) return; await talkThrough(); await p.waitForTimeout(300); } console.log('TIMEOUT', ch, n, await C()); };
  const until = async (fn, max = 60000) => { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await S(fn)) return true; await talkThrough(); await p.waitForTimeout(300); } console.log('TIMEOUT until', fn.toString()); return false; };

  await p.goto('http://localhost:8123/'); await p.waitForTimeout(800);
  await S(() => { SFX.init(); SaveGame.startNew(); SaveGame.state.chapter = 'day2'; SaveGame.save(); });
  await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('0');
  await p.waitForTimeout(6000); await p.screenshot({ path: out + '/01-police.png' });
  await waitStep('day2', 1); console.log('venn arrived:', await C());
  await tp(9, 10); await waitStep('day2', 2, 30000);
  await p.screenshot({ path: out + '/02-after-interview.png' });
  console.log('after interview:', await C());
  // the long road round (walk the last stretch)
  await tp(84, 4); await p.keyboard.down('s'); await p.waitForTimeout(1200); await p.keyboard.up('s');
  await p.waitForTimeout(500); await p.screenshot({ path: out + '/03-ruth.png' });
  await talkThrough(1);
  console.log('after ruth:', await C());
  // under the tape, to the board
  await tp(85, 7); await p.keyboard.down('s'); await p.waitForTimeout(2200); await p.keyboard.up('s');
  console.log('inside the Jacobs house:', await S(() => { const c = game.scene.getScene('Chapter'); return [Math.round(c.hx / 16), Math.round(c.hy / 16)]; }));
  await until(() => SaveGame.state.notes.some(n => n.id === 'inside') && !game.scene.getScene('Chapter').cutscene, 30000);
  await tp(83, 16); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/04-board.png' });
  await act(); await talkThrough();
  await waitStep('day2', 3);
  console.log('board seen:', await C());
  // home: Spike bolts
  await tp(20, 6); await p.waitForTimeout(1500);
  await until(() => game.scene.getScene('Chapter').cornAllowed && !game.scene.getScene('Chapter').cutscene);
  console.log('chase on:', await C());
  // follow Spike through the corn
  for (let i = 0; i < 40; i++) {
    const done = await S(() => SaveGame.state.step >= 4);
    if (done) break;
    await S(() => { const c = game.scene.getScene('Chapter'); const sp = c.npcs.spike; if (sp) { c.hx = sp.x - 3 * 16; c.hy = sp.y; } });
    if (i === 6) await p.screenshot({ path: out + '/05-chase.png' });
    await p.waitForTimeout(700);
  }
  console.log('spike chase done:', await C());
  await tp(48, 23); await p.waitForTimeout(800);
  await p.screenshot({ path: out + '/06-ring.png' });
  await until(() => SaveGame.state.chapter === 'night2', 60000);
  console.log('day 2 over, now:', await C(), 'clues:', await S(() => SaveGame.state.clues.map(c => c.id).join(',')));
  await p.waitForTimeout(2000); await p.screenshot({ path: out + '/07-end-day2.png' });
  await p.keyboard.press('Enter');
  await waitStep('night2', 1, 30000);
  console.log('night 2:', await C(), 'player look jason?', await S(() => game.scene.getScene('Chapter').playerBody.fillColor.toString(16)), 'notebook shown:', await S(() => Controls.notebook));
  await p.screenshot({ path: out + '/08-jason.png' });
  // out the back door and into the corn, towards the bark
  await tp(30, 12); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/09-bark-spot.png' });
  await tp(37, 13); await p.waitForTimeout(4000);
  await p.screenshot({ path: out + '/10-lost.png' });
  await until(() => game.scene.getScene('End') && game.scene.getScene('End').sys.isActive(), 40000);
  console.log('night 2 ended:', await S(() => SaveGame.state.chapter));
  await p.waitForTimeout(1500); await p.screenshot({ path: out + '/11-end-night2.png' });
  console.log('ERRORS', errs);
  await b.close();
})();
