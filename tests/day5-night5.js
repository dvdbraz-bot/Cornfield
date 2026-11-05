const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(() => { window.addEventListener('unhandledrejection', e => console.error('REJECTION ' + (e.reason && e.reason.stack || e.reason))); });
  const S = (f, a) => p.evaluate(f, a);
  const C = () => S(() => { const c = game.scene.getScene('Chapter'); return `${SaveGame.state.chapter} step=${SaveGame.state.step} cutscene=${c.cutscene} note="${(SaveGame.state.notes.filter(n => !n.done).pop() || {}).text || ''}"`; });
  const talkThrough = async (pick = 0) => { for (let i = 0; i < 80; i++) { const st = await S(() => ({ open: Controls.dialogueOpen, opts: !!(game.scene.getScene('UI').dlg && game.scene.getScene('UI').dlg.options) })); if (!st.open) { await p.waitForTimeout(350); if (!(await S(() => Controls.dialogueOpen))) return; continue; } await p.keyboard.press(st.opts ? String(pick + 1) : 'Enter'); await p.waitForTimeout(110); } };
  const until = async (fn, max = 40000, pick = 0) => { const t0 = Date.now(); while (Date.now() - t0 < max) { if (await S(fn)) return true; await talkThrough(pick); await p.waitForTimeout(250); } console.log('TIMEOUT', fn.toString(), await C()); return false; };
  const tp = (x, y) => S(([x, y]) => { const c = game.scene.getScene('Chapter'); c.hx = x * 16 + 8; c.hy = y * 16 + 8; }, [x, y]);
  const act = async () => { await p.keyboard.down('e'); await p.waitForTimeout(80); await p.keyboard.up('e'); await p.waitForTimeout(400); };
  const start = async (ch, flags = {}) => { await p.goto('http://localhost:8123/'); await p.waitForTimeout(700); await S(([ch, flags]) => { SFX.init(); SaveGame.startNew(); SaveGame.state.chapter = ch; Object.assign(SaveGame.state.flags, flags); SaveGame.save(); }, [ch, flags]); await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('0'); await p.waitForTimeout(2000); };

  // ---- Day 5 ----
  await start('day5');
  await p.waitForTimeout(1500); await p.screenshot({ path: out + '/01-funeral.png' });
  await until(() => SaveGame.state.step >= 2 && !game.scene.getScene('Chapter').cutscene, 60000);
  console.log('alone at home:', await C(), 'items', await S(() => SaveGame.state.items.join(', ')));
  await tp(22, 21); await p.waitForTimeout(300); await act(); await talkThrough();
  console.log('key:', await C(), 'items', await S(() => SaveGame.state.items.join(', ')));
  await tp(5, 31); await p.waitForTimeout(300); await act(); await p.waitForTimeout(500);
  await p.screenshot({ path: out + '/02-cupboard.png' });
  await until(() => SaveGame.state.step >= 4 && !game.scene.getScene('Chapter').cutscene, 30000);
  await tp(8, 11); await p.waitForTimeout(2500);
  await p.screenshot({ path: out + '/03-confront.png' });
  await until(() => SaveGame.state.chapter === 'night5', 60000, 0);
  console.log('day 5 done:', await S(() => SaveGame.state.chapter + ' flags ' + Object.keys(SaveGame.state.flags).join(',') + ' clues ' + SaveGame.state.clues.map(c => c.id).join(',')));

  // ---- Night 5 ---- (with a high vennTrust from Day 4, and Henry's book)
  await start('night5', { vennTrust: 3 });
  await S(() => { SaveGame.state.items = ["Henry's black book"]; });
  await until(() => SaveGame.state.step >= 1 && !game.scene.getScene('Chapter').cutscene, 30000);
  console.log('jean is back:', await C());
  // up the ladder; Jean should follow
  await tp(5, 17); await p.waitForTimeout(300); await act(); await p.waitForTimeout(1200);
  console.log('in the attic:', await S(() => { const c = game.scene.getScene('Chapter'); const j = c.npcs.jean; return `michael ${(c.hx/16).toFixed(0)},${(c.hy/16).toFixed(0)} jean ${(j.x/16).toFixed(0)},${(j.y/16).toFixed(0)}`; }));
  await tp(13, 50); await p.waitForTimeout(300); await act(); await talkThrough();
  console.log('diary:', await C());
  await tp(10, 52); await p.waitForTimeout(300); await act();
  await p.waitForTimeout(1500); await p.screenshot({ path: out + '/04-scream.png' });
  await until(() => SaveGame.state.step >= 3 && !game.scene.getScene('Chapter').cutscene, 30000);
  console.log('after the scream: stones =', await S(() => SaveGame.state.stones), await C());
  await until(() => SaveGame.state.notes.some(n => n.id === 'warn'), 20000);
  await tp(5, 17); await p.waitForTimeout(300); await act(); await p.waitForTimeout(900); // down the ladder
  await tp(6, 8); await p.waitForTimeout(300); await act();
  await p.waitForTimeout(3000); await talkThrough(); await p.waitForTimeout(9000);
  await p.screenshot({ path: out + '/05-venn.png' });
  await until(() => SaveGame.state.step >= 4 && !game.scene.getScene('Chapter').cutscene, 40000);
  console.log('venn:', await C(), 'flags', await S(() => Object.keys(SaveGame.state.flags).join(',')));
  await tp(6, 21); await p.waitForTimeout(300); await act();
  await until(() => SaveGame.state.chapter === 'day6', 20000);
  console.log('night 5 done ->', await S(() => SaveGame.state.chapter));
  // the ring, in the notebook
  console.log('ERRORS', errs);
  await b.close();
})();
