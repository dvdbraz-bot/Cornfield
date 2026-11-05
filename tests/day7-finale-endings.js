const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.addEventListener('unhandledrejection', e => console.error('REJECTION ' + (e.reason && e.reason.stack || e.reason))); });
  const S = (f, a) => p.evaluate(f, a);
  const C = () => S(() => { const c = game.scene.getScene('Chapter'); return c && c.sys.isActive() ? `${SaveGame.state.chapter} step=${SaveGame.state.step} cutscene=${c.cutscene} notes="${SaveGame.state.notes.filter(n => !n.done).map(n => n.text.slice(0, 40)).join(' | ')}"` : 'chapter not active: ' + game.scene.getScenes(true).map(s => s.sys.settings.key).join(); });
  const talkThrough = async (pick = 0) => { for (let i = 0; i < 80; i++) { const st = await S(() => ({ open: Controls.dialogueOpen, opts: !!(game.scene.getScene('UI').dlg && game.scene.getScene('UI').dlg.options) })); if (!st.open) { await p.waitForTimeout(350); if (!(await S(() => Controls.dialogueOpen))) return; continue; } await p.keyboard.press(st.opts ? String(pick + 1) : 'Enter'); await p.waitForTimeout(110); } };
  const until = async (fn, max = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await S(fn)) return true; await talkThrough(); await p.waitForTimeout(250); } console.log('TIMEOUT', fn.toString().slice(0, 100), await C()); return false; };
  const tp = (x, y) => S(([x, y]) => { const c = game.scene.getScene('Chapter'); c.hx = x * 16 + 8; c.hy = y * 16 + 8; }, [x, y]);
  const act = async () => { await p.keyboard.down('e'); await p.waitForTimeout(80); await p.keyboard.up('e'); await p.waitForTimeout(400); await talkThrough(); };
  const start = async (ch, setup) => { await p.goto('http://localhost:8123/'); await p.waitForTimeout(700); await S(([ch, setup]) => { SFX.init(); SaveGame.startNew(); SaveGame.state.chapter = ch; Object.assign(SaveGame.state, setup || {}); SaveGame.save(); }, [ch, setup]); await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('0'); await p.waitForTimeout(2000); };

  // ---- Day 7: gather everything, and all the names ----
  await start('day7', { names: ['Samuel Hale'] });
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene, 30000);
  console.log('gather:', await C());
  for (const [x, y] of [[5, 31], [13, 50], [23, 22], [22, 9]]) { await tp(x, y); await p.waitForTimeout(250); await act(); } // names
  console.log('names:', await S(() => SaveGame.state.names.length));
  for (const [x, y] of [[10, 53], [17, 32], [15, 9], [19, 19], [8, 20]]) { await tp(x, y); await p.waitForTimeout(250); await act(); }
  await tp(10, 53); await p.waitForTimeout(250); await act(); // dunk
  await until(() => SaveGame.state.chapter === 'finale', 40000);
  console.log('day 7 done ->', await S(() => SaveGame.state.chapter + ' items: ' + SaveGame.state.items.join(', ') + ' vials ' + SaveGame.state.flags.vials));
  await p.keyboard.press('n'); await p.waitForTimeout(300);
  await p.mouse.click(91.5 + (34 + 70 + 31) * 1.526, 25 * 1.526); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/01-names.png' });

  // ---- Finale: run ahead and lose Jean ----
  await start('finale');
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene, 30000);
  await p.waitForTimeout(800);
  await p.screenshot({ path: out + '/02-wearing-pa.png' });
  // put it right next to Jean while she's far behind Michael
  await S(() => { const c = game.scene.getScene('Chapter'); c.unfollow('jean'); const j = c.npcs.jean; j.place(30 * 16, 20 * 16); c.hx = 40 * 16; c.hy = 20 * 16; const cr = c.creature; cr.x = j.x + 8; cr.y = j.y; cr.startHunt(); });
  await p.waitForTimeout(600);
  console.log('Jean left behind ->', await S(() => SaveGame.state.flags.jeanDead));

  // ---- Finale: the ring, the ritual, and a careless prayer (just hold ACT) ----
  await start('finale');
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene, 30000);
  await S(() => { const c = game.scene.getScene('Chapter'); c.creature.x = 70 * 16; c.creature.y = 10 * 16; const R = c.map.RING; c.hx = R.x - 20; c.hy = R.y; });
  await until(() => SaveGame.state.step >= 2 && !game.scene.getScene('Chapter').cutscene, 20000);
  for (let i = 0; i < 3; i++) { await S(() => { const c = game.scene.getScene('Chapter'); const R = c.map.RING; c.hx = R.x - 20; c.hy = R.y; }); await p.waitForTimeout(400); await act(); await p.waitForTimeout(400); }
  await until(() => SaveGame.state.step >= 3, 20000);
  await p.waitForTimeout(800);
  await p.screenshot({ path: out + '/03-fire.png' });
  await p.keyboard.down('e');
  await until(() => !game.scene.getScene('Chapter').sys.isActive() || game.scene.getScene('Chapter').state !== 'night', 60000);
  await p.keyboard.up('e');
  await p.waitForTimeout(500);
  console.log('careless prayer (never turning) ->', await S(() => game.scene.getScene('Chapter').state + ' line ' + (game.scene.getScene('Chapter').prayer || {}).line));

  // ---- Finale: a careful prayer ----
  for (const [label, setup] of [['Dawn (Jean alive)', {}], ['Alone (Jean taken)', { flags: { jeanDead: true } }], ['Remembered (all names)', { names: null }]]) {
    const st = Object.assign({ step: 3 }, setup);
    if (label.startsWith('Remembered')) st.names = ['Samuel Hale', 'Walt Ainsley', 'Eddie Morrow', 'Joseph Kell', 'Abel Ruiz', 'Ned Calloway', 'Thomas Rook', 'Harlan Pike', 'Micah Dunn', 'Owen Lacey', 'Luca Benedetti', 'Frank Toller', 'Tom Avery'];
    await start('finale', st);
    await p.waitForTimeout(1500);
    // play like a person: pray, but when it gets round behind, let go and turn to face it
    const result = await S(() => new Promise(res => {
      const c = game.scene.getScene('Chapter'); const t0 = performance.now();
      const tick = () => {
        if (c.state !== 'night') { Controls.actHeld = false; res('caught at line ' + c.prayer.line); return; }
        if (!c.prayer) { requestAnimationFrame(tick); return; }
        if (c.prayer.line >= 7 || c.cutscene) { Controls.actHeld = false; Controls.moveX = Controls.moveY = 0; res('finished the prayer in ' + ((performance.now() - t0) / 1000).toFixed(0) + 's'); return; }
        const cr = c.creature, dx = cr.x - c.hx, dy = cr.y - c.hy, d = Math.hypot(dx, dy);
        const front = (dx * c.fx + dy * c.fy) / d;
        if (front < 0.2) { Controls.actHeld = false; Controls.moveX = dx / d; Controls.moveY = dy / d; }   // turn to it
        else { Controls.moveX = Controls.moveY = 0; Controls.actHeld = true; }                             // pray
        requestAnimationFrame(tick);
      };
      tick();
    }));
    console.log(label + ': prayer ->', result);
    await until(() => game.scene.getScene('End').sys.isActive(), 60000);
    await p.waitForTimeout(1500);
    const cards = [];
    for (let i = 0; i < 14; i++) {
      const txt = await S(() => { const all = []; const walk = (l) => l.forEach(o => { if (o.list) walk(o.list); else if (o.text) all.push(o.text.replace(/\n/g, ' ')); }); walk(game.scene.getScene('End').children.list); return all.join(' / '); });
      cards.push(txt.slice(0, 230));
      if (txt.includes('Ending:')) break;
      await p.waitForTimeout(5200); await p.mouse.click(400, 200);
    }
    console.log('  cards:\n   ' + cards.join('\n   '));
    if (label.startsWith('Remembered')) await p.screenshot({ path: out + '/04-ending.png' });
  }
  console.log('ERRORS', errs);
  await b.close();
})();
