const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  const S = (f, a) => p.evaluate(f, a);
  // game y -> screen y (game is 480x270 scaled into 915x412: scale 1.526, x offset 91.5)
  const tapGame = async (gx, gy) => { await p.mouse.click(91.5 + gx * 1.526, gy * 1.526); await p.waitForTimeout(300); };
  const rows = () => S(() => game.scene.getScene('Start').opts.map(o => `${o.go || 'LOCKED'}@${o.y}`).join(' '));

  // 1. A brand-new phone: nothing unlocked yet
  await p.goto('http://localhost:8123/'); await S(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1000);
  await p.screenshot({ path: out + '/01-menu.png' });
  console.log('main menu:', await rows());
  await tapGame(240, 130); // Chapters (2nd row without Continue: 92 New, 130 Chapters)
  console.log('chapters, fresh:', await rows());
  await p.screenshot({ path: out + '/02-chapters-locked.png' });

  // 2. Five taps on the title unlock everything
  for (let i = 0; i < 5; i++) await tapGame(240, 40);
  console.log('after 5 title taps:', await rows(), '| toast:', await S(() => game.scene.getScene('Start').toast.text));
  await p.screenshot({ path: out + '/03-chapters-unlocked.png' });

  // 3. Start Night 2 from the list
  const y = await S(() => game.scene.getScene('Start').opts.find(o => o.go === 'chapter:night2').y);
  await tapGame(240, y); await p.waitForTimeout(2500);
  console.log('started:', await S(() => SaveGame.state.chapter + ' step ' + SaveGame.state.step + ' scenes ' + game.scene.getScenes(true).map(s => s.sys.settings.key).join(',')));

  // 4. An older save from before Chapters existed (at Day 2) counts as progress
  await S(() => { localStorage.clear(); SaveGame.startNew(); SaveGame.state.chapter = 'day2'; SaveGame.save(); });
  await p.reload(); await p.waitForTimeout(1000);
  await tapGame(240, 168); // with Continue: 92 Continue, 130 New, 168 Chapters
  console.log('chapters with an old Day 2 save:', await rows());
  // 5. Back
  const by = await S(() => game.scene.getScene('Start').opts.find(o => o.go === 'back').y);
  await tapGame(240, by);
  console.log('back to main:', await S(() => game.scene.getScene('Start').pageName));
  console.log('errors', errs);
  await b.close();
})();
