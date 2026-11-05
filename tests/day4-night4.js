const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.addEventListener('unhandledrejection', e => console.error('REJECTION ' + (e.reason && e.reason.stack || e.reason))); });
  const S = (f, a) => p.evaluate(f, a);
  const C = () => S(() => { const c = game.scene.getScene('Chapter'); return `${SaveGame.state.chapter} step=${SaveGame.state.step} cutscene=${c.cutscene} note="${(SaveGame.state.notes.filter(n => !n.done).pop() || {}).text || ''}"`; });
  const talkThrough = async (pick = 0) => { for (let i = 0; i < 80; i++) { const st = await S(() => ({ open: Controls.dialogueOpen, opts: !!(game.scene.getScene('UI').dlg && game.scene.getScene('UI').dlg.options) })); if (!st.open) { await p.waitForTimeout(350); if (!(await S(() => Controls.dialogueOpen))) return; continue; } if (st.opts) await p.screenshot({ path: out + '/choice-' + Date.now() + '.png' }); await p.keyboard.press(st.opts ? String(pick + 1) : 'Enter'); await p.waitForTimeout(120); } };
  const until = async (fn, max = 40000, pick = 0) => { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await S(fn)) return true; await talkThrough(pick); await p.waitForTimeout(250); } console.log('TIMEOUT', fn.toString(), await C()); return false; };
  const tp = (x, y) => S(([x, y]) => { const c = game.scene.getScene('Chapter'); c.hx = x * 16 + 8; c.hy = y * 16 + 8; }, [x, y]);
  const act = async () => { await p.keyboard.down('e'); await p.waitForTimeout(80); await p.keyboard.up('e'); await p.waitForTimeout(300); };
  const start = async (ch) => { await p.goto('http://localhost:8123/'); await p.waitForTimeout(700); await S((ch) => { SFX.init(); SaveGame.startNew(); SaveGame.state.chapter = ch; SaveGame.state.clues = [{ id: 'novel', title: 'The new novel', text: "I started writing today. It's about the murders. Nobody needs to know that." }]; SaveGame.save(); }, ch); await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('0'); await p.waitForTimeout(2000); };

  // ---- Day 4 ----
  await start('day4');
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene);
  console.log('dawn:', await C());
  await tp(27, 15); await p.waitForTimeout(800);
  await p.screenshot({ path: out + '/01-lawn.png' });
  await until(() => SaveGame.state.step >= 2, 40000);
  await p.waitForTimeout(1600);
  await p.screenshot({ path: out + '/02-station.png' });
  await until(() => SaveGame.state.step >= 3, 60000);
  console.log('after interview: vennTrust =', await S(() => SaveGame.state.flags.vennTrust));
  await p.waitForTimeout(3500); await p.screenshot({ path: out + '/03-drive.png' });
  await until(() => SaveGame.state.chapter === 'night4', 40000);
  console.log('day 4 done ->', await S(() => SaveGame.state.chapter));

  // ---- Night 4 ----
  await start('night4');
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene);
  console.log('night 4:', await C(), 'oil', await S(() => Controls.oil), 'power', await S(() => game.scene.getScene('Chapter').powerOn));
  // keep the creature far away for this part: walk out to the shed
  await S(() => { const cr = game.scene.getScene('Chapter').creature; cr.x = 60 * 16; cr.y = 30 * 16; cr.lureCooldown = 999; });
  await tp(26, 26); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/04-dead-grass.png' });
  await tp(16, 31); await p.waitForTimeout(400); await act();
  console.log('after generator:', await C(), 'power', await S(() => game.scene.getScene('Chapter').powerOn));
  // take the oil in the shed
  await tp(15, 31); await p.waitForTimeout(300); await act();
  console.log('oil after flask:', await S(() => Controls.oil.toFixed(2)));
  // can it get into the house? put it on the porch, hunting, with Michael in the kitchen
  await tp(23, 12);
  await S(() => { const c = game.scene.getScene('Chapter'); const cr = c.creature; cr.x = 26 * 16 + 8; cr.y = 12 * 16 + 8; cr.startHunt(); });
  await p.waitForTimeout(4000);
  console.log('creature by the back door, Michael in the kitchen:', await S(() => { const c = game.scene.getScene('Chapter'); const cr = c.creature; return `creature at ${(cr.x/16).toFixed(1)},${(cr.y/16).toFixed(1)} state=${cr.state} sees=${cr.sees()} michael state=${c.state}`; }));
  await until(() => SaveGame.state.step >= 2, 15000);
  // caught in the yard -> back to the last save
  await tp(24, 30);
  await S(() => { const c = game.scene.getScene('Chapter'); c.lanternOn = false; c.fx = 0; c.fy = -1; const cr = c.creature; cr.x = 24 * 16 + 8; cr.y = 32 * 16; cr.startHunt(); });
  await until(() => game.scene.getScene('End').sys.isActive(), 20000);
  console.log('caught ->', await S(() => game.scene.getScene('End').mode));
  await p.waitForTimeout(2500); await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
  console.log('back to the last save:', await C());
  console.log('ERRORS', errs);
  await b.close();
})();
