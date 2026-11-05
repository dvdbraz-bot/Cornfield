const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 915, height: 412 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const S = (f, a) => p.evaluate(f, a);
  const talkThrough = async () => { for (let i = 0; i < 30; i++) { if (!(await S(() => Controls.dialogueOpen))) { await p.waitForTimeout(300); if (!(await S(() => Controls.dialogueOpen))) return; continue; } await p.keyboard.press('Enter'); await p.waitForTimeout(120); } };
  for (const mode of ['run', 'run', 'walk']) {
    await p.goto('http://localhost:8123/'); await p.waitForTimeout(700);
    await S(() => { SFX.init(); SaveGame.startNew(); SaveGame.state.chapter = 'night3'; SaveGame.save(); });
    await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('0'); await p.waitForTimeout(2000);
    for (let i = 0; i < 40 && !(await S(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene)); i++) { await talkThrough(); await p.waitForTimeout(250); }
    // steer straight at her every frame from inside the page (like a player's thumb would)
    const result = await S((mode) => new Promise(res => {
      const c = game.scene.getScene('Chapter'); const t0 = performance.now();
      const tick = () => {
        if (Controls.dialogueOpen) { Controls.moveX = Controls.moveY = 0; res('caught after ' + ((performance.now() - t0) / 1000).toFixed(1) + 's'); return; }
        if (c.cutscene) { Controls.moveX = Controls.moveY = 0; res('she got into the corn; michael at ' + (c.hx/16).toFixed(1) + ',' + (c.hy/16).toFixed(1)); return; }
        const j = c.npcs.jenny; const dx = j.x - c.hx, dy = j.y - c.hy, d = Math.hypot(dx, dy) || 1;
        Controls.moveX = dx / d; Controls.moveY = dy / d; Controls.run = mode === 'run';
        requestAnimationFrame(tick);
      };
      tick();
    }), mode);
    console.log(mode + ':', result);
  }
  console.log('errors', errs);
  await b.close();
})();
