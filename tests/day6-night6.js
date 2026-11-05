const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.addEventListener('unhandledrejection', e => console.error('REJECTION ' + (e.reason && e.reason.stack || e.reason))); });
  const S = (f, a) => p.evaluate(f, a);
  const C = () => S(() => { const c = game.scene.getScene('Chapter'); return c && c.sys.isActive() ? `${SaveGame.state.chapter} step=${SaveGame.state.step} cutscene=${c.cutscene} notes="${SaveGame.state.notes.filter(n => !n.done).map(n => n.text).join(' | ')}"` : 'chapter not active'; });
  const talkThrough = async (pick = 0) => { for (let i = 0; i < 80; i++) { const st = await S(() => ({ open: Controls.dialogueOpen, opts: !!(game.scene.getScene('UI').dlg && game.scene.getScene('UI').dlg.options) })); if (!st.open) { await p.waitForTimeout(350); if (!(await S(() => Controls.dialogueOpen))) return; continue; } await p.keyboard.press(st.opts ? String(pick + 1) : 'Enter'); await p.waitForTimeout(110); } };
  const until = async (fn, max = 40000, pick = 0) => { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await S(fn)) return true; await talkThrough(pick); await p.waitForTimeout(250); } console.log('TIMEOUT', fn.toString().slice(0, 90), await C()); return false; };
  const tp = (x, y) => S(([x, y]) => { const c = game.scene.getScene('Chapter'); c.hx = x * 16 + 8; c.hy = y * 16 + 8; }, [x, y]);
  const act = async () => { await p.keyboard.down('e'); await p.waitForTimeout(80); await p.keyboard.up('e'); await p.waitForTimeout(400); };
  const start = async (ch, flags = {}) => { await p.goto('http://localhost:8123/'); await p.waitForTimeout(700); await S(([ch, flags]) => { SFX.init(); SaveGame.startNew(); SaveGame.state.chapter = ch; Object.assign(SaveGame.state.flags, flags); SaveGame.save(); }, [ch, flags]); await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('0'); await p.waitForTimeout(2000); };

  // ---- Day 6 ----
  await start('day6');
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene, 60000);
  console.log('prepare:', await C(), 'forgave:', await S(() => SaveGame.state.flags.forgave));
  await p.screenshot({ path: out + '/01-storm.png' });
  await tp(8, 32); await act();                                   // planks (box at 8,31)
  for (const [x, y] of [[6, 8], [20, 8], [4, 22], [21, 24]]) { await tp(x, y); await p.waitForTimeout(250); await act(); }
  for (const [x, y] of [[6, 31], [15, 31], [16, 10]]) { await tp(x, y); await p.waitForTimeout(250); await act(); }
  await tp(10, 53); await p.waitForTimeout(250); await act();
  console.log('prepared:', await C(), 'oilCans', await S(() => SaveGame.state.flags.oilCans), 'vials', await S(() => SaveGame.state.flags.vials));
  await p.screenshot({ path: out + '/02-boarded.png' });
  await until(() => SaveGame.state.chapter === 'night6', 30000);
  console.log('day 6 done ->', await S(() => SaveGame.state.chapter));

  // ---- Night 6: survive it properly ----
  await start('night6', { forgave: true });
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene, 30000);
  console.log('siege on:', await C());
  // a loop that plays like a careful player: pull Jean back, refill dying lamps
  const t0 = Date.now(); let shot = false;
  while (Date.now() - t0 < 140000) {
    const s = await S(() => { const c = game.scene.getScene('Chapter'); if (!c.sys.isActive()) return { gone: true }; return { step: SaveGame.state.step, drawn: !!c.jeanDrawn, jean: c.npcs.jean && [c.npcs.jean.x, c.npcs.jean.y], lamps: c.lamps.map(l => [l.id, l.fuel, l.x, l.y]), dlg: Controls.dialogueOpen }; });
    if (s.gone || s.step >= 2) break;
    if (s.dlg) { await talkThrough(); continue; }
    if (s.drawn && s.jean) { await S(([x, y]) => { const c = game.scene.getScene('Chapter'); c.hx = x; c.hy = y + 10; }, s.jean); await p.waitForTimeout(100); await act(); if (!shot) { await p.screenshot({ path: out + '/03-face.png' }); shot = true; } }
    const low = s.lamps.find(l => l[1] < 0.3);
    if (low) { const st = { living: [12, 10], kitchen: [23, 9], hall: [14, 17] }[low[0]]; await tp(st[0], st[1]); await p.waitForTimeout(150); await act(); }
    await p.waitForTimeout(500);
  }
  console.log('faces survived:', await C(), 'oil left', await S(() => SaveGame.state.flags.oilCans));
  // the doors: hide under Jenny's bed and hold breath when it comes near
  await until(() => SaveGame.state.notes.some(n => n.id === 'hide' && !n.done), 30000);
  await tp(14, 20); await p.waitForTimeout(250); await act();
  console.log('hidden:', await S(() => game.scene.getScene('Chapter').hidden));
  await p.waitForTimeout(500);
  const t1 = Date.now(); let held = false;
  while (Date.now() - t1 < 60000) {
    const s = await S(() => { const c = game.scene.getScene('Chapter'); if (!c.sys.isActive()) return { gone: true }; const it = c.splashTarget; return { step: SaveGame.state.step, d: it ? Math.hypot(it.x - c.hx, it.y - c.hy) / 16 : 99 }; });
    if (s.gone || s.step >= 3) break;
    if (s.d < 4.5 && !held) { await p.keyboard.down('e'); held = true; await p.screenshot({ path: out + '/04-intruder.png' }); }
    if (s.d >= 4.5 && held) { await p.keyboard.up('e'); held = false; }
    await p.waitForTimeout(150);
  }
  if (held) await p.keyboard.up('e');
  console.log('doors survived:', await C());
  await until(() => SaveGame.state.chapter === 'day7' || !game.scene.getScene('Chapter').sys.isActive(), 60000);
  await p.waitForTimeout(500);
  console.log('night 6 done ->', await S(() => SaveGame.state.chapter + ' ' + game.scene.getScenes(true).map(s => s.sys.settings.key).join() + ' items: ' + SaveGame.state.items.join(', ')));

  // ---- Night 6: let Jean reach a window ----
  await start('night6');
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene, 30000);
  await until(() => game.scene.getScene('End').sys.isActive(), 90000);
  console.log('ignoring Jean ->', await S(() => game.scene.getScene('End').mode));
  console.log('ERRORS', errs);
  await b.close();
})();
