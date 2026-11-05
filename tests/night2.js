const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.addEventListener('unhandledrejection', e => console.error('REJECTION ' + (e.reason && e.reason.stack || e.reason))); });
  const S = (f, a) => p.evaluate(f, a);
  const st = () => S(() => { const c = game.scene.getScene('Chapter'); return `${SaveGame.state.chapter} step=${SaveGame.state.step} pos=${(c.hx/16).toFixed(1)},${(c.hy/16).toFixed(1)} endless=${!!c.endless} crickets=${Controls.crickets && Controls.crickets.toFixed(2)} dread=${c.dread && c.dread.toFixed(2)} d=${c.creature ? (c.creature.distToPlayer()/16).toFixed(1) : "-"} caption="${c.ui.captionText.text}"`; });
  const talkThrough = async () => { for (let i = 0; i < 40; i++) { if (!(await S(() => Controls.dialogueOpen))) { await p.waitForTimeout(300); if (!(await S(() => Controls.dialogueOpen))) return; continue; } await p.keyboard.press('Enter'); await p.keyboard.press('1'); await p.waitForTimeout(120); } };
  const tp = (x, y) => S(([x, y]) => { const c = game.scene.getScene('Chapter'); c.hx = x * 16 + 8; c.hy = y * 16 + 8; }, [x, y]);

  // ---- Day 2: Ruth leaves; duck under the tape ----
  await p.goto('http://localhost:8123/'); await p.waitForTimeout(800);
  await S(() => { SFX.init(); SaveGame.startNew(); const s = SaveGame.state; s.chapter = 'day2'; s.step = 2; SaveGame.save(); });
  await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('0'); await p.waitForTimeout(2500);
  await tp(85, 7); await p.waitForTimeout(300);
  await p.keyboard.down('e'); await p.waitForTimeout(80); await p.keyboard.up('e'); await p.waitForTimeout(300);
  await talkThrough();
  await p.waitForTimeout(500);
  console.log('Ruth talked; ruth still there:', await S(() => !!game.scene.getScene('Chapter').npcs.ruth));
  await p.keyboard.down('s'); await p.waitForTimeout(600); await p.keyboard.up('s');
  console.log('walking into the taped door does nothing:', await st());
  await p.waitForTimeout(9000);
  console.log('after ruth walks off; ruth there:', await S(() => !!game.scene.getScene('Chapter').npcs.ruth));
  await tp(85, 8); await p.waitForTimeout(300);
  await p.keyboard.down('e'); await p.waitForTimeout(80); await p.keyboard.up('e'); await p.waitForTimeout(400);
  await p.screenshot({ path: out + '/01-ducking.png' });
  await p.waitForTimeout(1200);
  console.log('ducked under, now inside:', await st());

  // ---- Night 2 ----
  await p.goto('http://localhost:8123/'); await p.waitForTimeout(800);
  await S(() => { SFX.init(); SaveGame.startNew(); const s = SaveGame.state; s.chapter = 'night2'; s.step = 0; SaveGame.save(); });
  await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('0'); await p.waitForTimeout(2500);
  for (let i = 0; i < 60 && !(await S(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene)); i++) { await talkThrough(); await p.waitForTimeout(300); }
  console.log('Jason is up:', await st());
  for (const [x, y] of [[34, 12], [39, 15], [44, 18]]) {
    await tp(x - 4, y); await p.waitForTimeout(1500);
    console.log('spot', x, y, ':', await st());
    await tp(x, y); await p.waitForTimeout(3200);
  }
  for (let i = 0; i < 60 && !(await S(() => SaveGame.state.step >= 3 && !game.scene.getScene('Chapter').cutscene)); i++) { await talkThrough(); await p.waitForTimeout(300); }
  await p.waitForTimeout(800);
  console.log('lost:', await st());
  await p.screenshot({ path: out + '/02-endless-start.png' });
  // run west towards the house for a long time
  await p.keyboard.down('a'); await p.keyboard.down('Shift');
  const t0 = Date.now(); let shots = 0;
  while (Date.now() - t0 < 70000) {
    await p.waitForTimeout(5000);
    const now = await st();
    console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', now);
    if (shots < 3 && Date.now() - t0 > 15000 * (shots + 1)) { await p.screenshot({ path: out + `/03-endless-${shots}.png` }); shots++; }
    if (await S(() => game.scene.getScene('End').sys.isActive())) break;
  }
  await p.keyboard.up('a'); await p.keyboard.up('Shift');
  console.log('end:', await S(() => SaveGame.state.chapter + ' ' + game.scene.getScenes(true).map(s => s.sys.settings.key).join(',')));
  console.log('errors', errs);
  await b.close();
})();
