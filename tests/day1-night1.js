const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + e.stack)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const S = (f, a) => p.evaluate(f, a);
  const C = () => S(() => { const c = game.scene.getScene('Chapter'); return `${SaveGame.state.chapter} step=${SaveGame.state.step} dlg=${Controls.dialogueOpen} frozen=${c.frozen}`; });
  const tp = (tx, ty) => S(([x, y]) => { const c = game.scene.getScene('Chapter'); c.hx = x * 16 + 8; c.hy = y * 16 + 8; }, [tx, ty]);
  const waitStep = async (ch, n, max = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < max) { const ok = await S(([c, k]) => SaveGame.state.chapter === c && SaveGame.state.step >= k && !!game.scene.getScene('Chapter').sys.isActive(), [ch, n]); if (ok) return; await p.waitForTimeout(250); } console.log('TIMEOUT waiting for', ch, n); };
  const act = async () => { await p.keyboard.down('e'); await p.waitForTimeout(80); await p.keyboard.up('e'); await p.waitForTimeout(250); };
  // advance all dialogue, choosing option `pick` when asked
  const talkThrough = async (pick = 0, max = 30) => {
    for (let i = 0; i < max; i++) {
      const st = await S(() => ({ open: Controls.dialogueOpen, opts: !!(game.scene.getScene('UI').dlg && game.scene.getScene('UI').dlg.options) }));
      if (!st.open) { await p.waitForTimeout(300); if (!(await S(() => Controls.dialogueOpen))) return; continue; }
      if (st.opts) await p.keyboard.press(String(pick + 1)); else await p.keyboard.press('Enter');
      await p.waitForTimeout(150);
    }
  };
  await p.goto('http://localhost:8123/'); await p.waitForTimeout(800);
  await S(() => { localStorage.clear(); });
  await p.reload(); await p.waitForTimeout(800);
  await p.screenshot({ path: out + '/00-menu.png' });
  // start Day 1 directly (as if the prologue had ended)
  await S(() => { SFX.init(); SaveGame.startNew(); game.scene.getScene('Start').scene.start('Chapter'); });
  await p.waitForTimeout(3500);
  await p.screenshot({ path: out + '/01-road.png' });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: out + '/02-arrive.png' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out + '/03-jenny.png' });
  await talkThrough(); await p.waitForTimeout(1500); await talkThrough(); await p.waitForTimeout(3000);
  console.log('after arrival:', await C());
  await waitStep('day1', 1); await tp(9, 9); await p.waitForTimeout(400);
  await p.screenshot({ path: out + '/04-living.png' });
  await talkThrough();
  console.log('after news:', await C());
  await tp(11, 4); await p.waitForTimeout(200); await act(); await p.waitForTimeout(300);
  console.log('after bags:', await C());
  await tp(6, 21); await p.waitForTimeout(200); await act(); await waitStep('day1', 4);
  console.log('after room:', await C());
  // rosary + photo (optional)
  await tp(8, 20); await p.waitForTimeout(200); await act();
  await tp(12, 9); await p.waitForTimeout(200); await act();
  console.log('items', await S(() => SaveGame.state.items.join(','), ), 'clues', await S(() => SaveGame.state.clues.map(c => c.id).join(',')));
  // save at the board? (the step uses the table now) - write
  await tp(19, 13); await p.waitForTimeout(200); await act(); await talkThrough();
  await p.waitForTimeout(6000);
  await p.screenshot({ path: out + '/05-beetle.png' });
  await waitStep('day1', 5);
  console.log('after write:', await C());
  await tp(13, 7); await p.waitForTimeout(500); await talkThrough(); await waitStep('day1', 6);
  console.log('after visitors:', await C());
  // notebook
  await p.keyboard.press('n'); await p.waitForTimeout(400);
  await p.screenshot({ path: out + '/06-notebook-notes.png' });
  await p.mouse.click(91 + (34 + 70 + 31) * 1.526, 25 * 1.526); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/07-notebook-clues.png' });
  await p.mouse.click(91 + (34 + 140 + 31) * 1.526, 25 * 1.526); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/08-notebook-map.png' });
  await p.keyboard.press('n'); await p.waitForTimeout(300);
  // dinner
  await tp(19, 13); await p.waitForTimeout(1800);
  await p.screenshot({ path: out + '/09-dinner.png' });
  await talkThrough(1);
  await p.waitForTimeout(4000);
  console.log('after dinner:', await S(() => game.scene.getScenes(true).map(s => s.sys.settings.key).join(',') + ' save=' + SaveGame.state.chapter));
  await p.screenshot({ path: out + '/10-end-day1.png' });
  await p.keyboard.press('Enter'); await waitStep('night1', 0); await p.waitForTimeout(2500);
  console.log('night1:', await C());
  await talkThrough(1); await p.waitForTimeout(400); await talkThrough(); await p.waitForTimeout(4000);
  await p.screenshot({ path: out + '/11-night-kitchen.png' });
  for (const [x, y] of [[9, 8], [6, 8], [20, 8], [4, 22], [21, 24]]) { await tp(x, y); await p.waitForTimeout(250); await act(); }
  await waitStep('night1', 1);
  console.log('locked:', await S(() => [...game.scene.getScene('Chapter').locks].join(',')), await C());
  await p.waitForTimeout(500);
  // background save, then reload and continue
  await tp(26, 14); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/12-porch.png' });
  await tp(20, 28); await p.waitForTimeout(1200);
  console.log('creature:', await S(() => game.scene.getScene('Chapter').creature.state), 'crickets', await S(() => Controls.crickets.toFixed(2)));
  await p.screenshot({ path: out + '/13-yard-crickets-stop.png' });
  await S(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  console.log('saved on background:', await S(() => { const s = JSON.parse(localStorage.getItem('cornfield-save-v1')); return s.chapter + ' step ' + s.step + ' at ' + Math.round(s.x/16) + ',' + Math.round(s.y/16); }));
  await p.reload(); await p.waitForTimeout(1000);
  await p.screenshot({ path: out + '/14-menu-continue.png' });
  await p.keyboard.press('0'); await p.waitForTimeout(2500);
  console.log('resumed:', await C(), 'pos', await S(() => { const c = game.scene.getScene('Chapter'); return Math.round(c.hx/16) + ',' + Math.round(c.hy/16); }), 'locks', await S(() => [...game.scene.getScene('Chapter').locks].join(',')));
  await tp(16, 31); await p.waitForTimeout(300); await act(); await p.waitForTimeout(500);
  console.log('after generator:', await C(), 'power', await S(() => game.scene.getScene('Chapter').powerOn));
  await tp(24, 11); await p.waitForTimeout(300); await act();
  await tp(6, 21); await p.waitForTimeout(300); await act(); await talkThrough(); await p.waitForTimeout(3000);
  await p.screenshot({ path: out + '/15-end-night1.png' });
  console.log('end:', await S(() => game.scene.getScenes(true).map(s => s.sys.settings.key).join(',') + ' save=' + SaveGame.state.chapter));
  console.log('ERRORS', errs);
  await b.close();
})();
