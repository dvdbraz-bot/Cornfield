const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.addEventListener('unhandledrejection', e => console.error('REJECTION ' + (e.reason && e.reason.stack || e.reason))); });
  const S = (f, a) => p.evaluate(f, a);
  const C = () => S(() => { const c = game.scene.getScene('Chapter'); return `${SaveGame.state.chapter} step=${SaveGame.state.step} cutscene=${c.cutscene} note="${(SaveGame.state.notes.filter(n => !n.done).pop() || {}).text || ''}"`; });
  const talkThrough = async (pick = 0) => { for (let i = 0; i < 60; i++) { const st = await S(() => ({ open: Controls.dialogueOpen, opts: !!(game.scene.getScene('UI').dlg && game.scene.getScene('UI').dlg.options) })); if (!st.open) { await p.waitForTimeout(350); if (!(await S(() => Controls.dialogueOpen))) return; continue; } await p.keyboard.press(st.opts ? String(pick + 1) : 'Enter'); await p.waitForTimeout(120); } };
  const until = async (fn, max = 40000, pick = 0) => { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await S(fn)) return true; await talkThrough(pick); await p.waitForTimeout(250); } console.log('TIMEOUT', fn.toString(), await C()); return false; };
  const tp = (x, y) => S(([x, y]) => { const c = game.scene.getScene('Chapter'); c.hx = x * 16 + 8; c.hy = y * 16 + 8; }, [x, y]);
  const act = async () => { await p.keyboard.down('e'); await p.waitForTimeout(80); await p.keyboard.up('e'); await p.waitForTimeout(300); };
  const start = async (ch) => { await p.goto('http://localhost:8123/'); await p.waitForTimeout(700); await S((ch) => { SFX.init(); SaveGame.startNew(); SaveGame.state.chapter = ch; SaveGame.save(); }, ch); await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('0'); await p.waitForTimeout(2000); };

  // ---- Day 3 ----
  await start('day3');
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene);
  console.log('search:', await C());
  await tp(36, 16); await p.waitForTimeout(2500);
  console.log('jenny follows into the corn:', await S(() => { const c = game.scene.getScene('Chapter'); const j = c.npcs.jenny; return (Math.hypot(j.x - c.hx, j.y - c.hy) / 16).toFixed(1) + ' tiles behind'; }));
  await tp(40, 16); await p.waitForTimeout(300); await act();
  await p.waitForTimeout(400); await talkThrough(); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/01-crow.png' });
  await until(() => SaveGame.state.step >= 2 && !game.scene.getScene('Chapter').cutscene);
  console.log('after search:', await C(), 'clues', await S(() => SaveGame.state.clues.map(c => c.id).join()));
  await tp(9, 11); await until(() => SaveGame.state.step >= 3, 20000, 0);
  console.log('after jean:', await C());
  await tp(19, 13); await p.waitForTimeout(3500);
  await p.screenshot({ path: out + '/02-window.png' });
  await until(() => SaveGame.state.chapter === 'night3', 40000);
  console.log('day 3 done ->', await S(() => SaveGame.state.chapter), 'clues', await S(() => SaveGame.state.clues.map(c => c.id).join()));

  // ---- Night 3: the chase. First let her escape, then catch her. ----
  await start('night3');
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene);
  console.log('chase on:', await C());
  await p.waitForTimeout(3000);
  await p.screenshot({ path: out + '/03-chase.png' });
  await until(() => game.scene.getScene('Chapter').ui.captionText.text.startsWith('Again'), 20000);
  console.log('she escaped; chase restarted:', await C());
  await until(() => !game.scene.getScene('Chapter').cutscene, 10000);
  // run after her this time, steering at her every frame like a thumb would
  await S(() => new Promise(res => { const c = game.scene.getScene('Chapter'); const tick = () => {
    if (Controls.dialogueOpen || c.cutscene) { Controls.moveX = Controls.moveY = 0; res(); return; }
    const j = c.npcs.jenny; const dx = j.x - c.hx, dy = j.y - c.hy, d = Math.hypot(dx, dy) || 1;
    Controls.moveX = dx / d; Controls.moveY = dy / d; Controls.run = true; requestAnimationFrame(tick); }; tick(); }));
  for (const k of ['w', 'a', 's', 'd', 'Shift']) await p.keyboard.up(k);
  console.log('caught her by running?', await S(() => Controls.dialogueOpen), await C());
  await p.screenshot({ path: out + '/04-caught.png' });
  await until(() => SaveGame.state.step >= 2 && !game.scene.getScene('Chapter').cutscene, 20000);
  await tp(6, 21); await p.waitForTimeout(300); await act();
  await until(() => SaveGame.state.chapter === 'interlude3', 20000);
  console.log('night 3 done ->', await S(() => SaveGame.state.chapter));

  // ---- Interlude: Jenny ----
  await start('interlude3');
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene);
  console.log('interlude:', await C(), 'player is jenny:', await S(() => game.scene.getScene('Chapter').playerBody.fillColor.toString(16)));
  await tp(29, 20); await p.waitForTimeout(800); await talkThrough();
  await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/05-red-eyes.png' });
  await until(() => SaveGame.state.chapter === 'day4', 40000);
  await p.waitForTimeout(2000);
  await p.screenshot({ path: out + '/06-end.png' });
  console.log('interlude done ->', await S(() => SaveGame.state.chapter), await S(() => game.scene.getScenes(true).map(s => s.sys.settings.key).join()));
  console.log('ERRORS', errs);
  await b.close();
})();
