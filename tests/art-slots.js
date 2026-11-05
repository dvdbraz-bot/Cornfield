// Art slots (src/art.js): the placeholders in assets/ are recognised (so the
// game still draws in code), a real drawing replaces the coded one, and a
// missing or wrong-sized file never breaks anything.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const out = process.argv[2] || '.';

// A fake "drawing": a solid colour PNG of the given size, made in the browser.
async function fakePng(page, w, h, col) {
  const b64 = await page.evaluate(([w, h, col]) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, w, h);
    x.fillStyle = '#000'; x.fillRect(0, 0, 1, 1);
    return c.toDataURL('image/png').split(',')[1];
  }, [w, h, col]);
  return Buffer.from(b64, 'base64');
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 915, height: 412 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 12).map(l => l.trim().replace('http://localhost:8123/', '')).join(' | ')));
  const missing = [];
  p.on('response', r => { if (r.status() === 404) missing.push(r.url()); });
  const S = (f, a) => p.evaluate(f, a);
  await p.goto('http://localhost:8123/'); await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForFunction(() => game && Art.ready);

  // 1. Every slot has its placeholder file, and every one is recognised as a placeholder.
  const slots = await S(() => ART_SLOTS.map(s => s.id));
  const onDisk = slots.filter(id => fs.existsSync(path.join(__dirname, '..', 'assets', id + '.png')));
  console.log('slots:', slots.length, 'placeholder files on disk:', onDisk.length, '404s:', missing.length);
  console.log('placeholders mistaken for drawings:', await S(() => Art.loaded));
  console.log('ART-LIST.md lists every slot:', slots.every(id => fs.readFileSync(path.join(__dirname, '..', 'assets', 'ART-LIST.md'), 'utf8').includes(id + '.png')));
  await S(() => { SFX.init(); SaveGame.startNew(); SaveGame.state.chapter = 'day1'; game.scene.getScene('Start').scene.start('Chapter'); });
  await p.waitForTimeout(1500);
  console.log('day 1 with placeholders: player drawn in code:', await S(() => !game.scene.getScene('Chapter').playerSprite));

  // 2. David's drawings: fake ones for a few slots, one missing, one the wrong size.
  const pngs = {
    'tiles/corn.png': await fakePng(p, 16, 16, '#ff00ff'),
    'tiles/corn-tops.png': await fakePng(p, 16, 16, 'rgba(0,0,0,0)'),
    'tiles/path.png': await fakePng(p, 32, 32, '#00ffff'),       // wrong size: stretched to 16x16
    'people/michael.png': await fakePng(p, 64, 16, '#ffff00'),
    'people/jenny.png': await fakePng(p, 64, 16, '#ff8800'),
    'objects/red-car.png': await fakePng(p, 32, 16, '#00ff00'),
    'objects/creature.png': await fakePng(p, 24, 40, '#ff0000'),
  };
  await p.route('**/assets/**', route => {
    const u = new URL(route.request().url()).pathname.replace(/^\/assets\//, '');
    if (u === 'tiles/lawn.png') return route.fulfill({ status: 404, body: '' }); // a missing file
    if (pngs[u]) return route.fulfill({ status: 200, contentType: 'image/png', body: pngs[u] });
    return route.continue();
  });
  await p.reload(); await p.waitForFunction(() => game && Art.ready);
  console.log('drawings found:', (await S(() => Art.loaded)).sort().join(', '));
  await S(() => { SFX.init(); SaveGame.startNew(); SaveGame.state.chapter = 'day1'; game.scene.getScene('Start').scene.start('Chapter'); });
  await p.waitForTimeout(2500);
  const px = (tx, ty, layer = 'mapBase-farm') => S(([tx, ty, layer]) => {
    const src = game.textures.get(layer).getSourceImage();
    return Array.from(src.getContext('2d').getImageData(tx * 16 + 8, ty * 16 + 8, 1, 1).data.slice(0, 3));
  }, [tx, ty, layer]);
  console.log('corn tile (34,10) from the drawing (255,0,255):', await px(34, 10));
  console.log('path tile (35,10) from the stretched drawing (0,255,255):', await px(35, 10));
  console.log('lawn tile (28,30), missing file, still coded (47,74,38 or a blade):', await px(28, 30));
  console.log('wall tile (3,7), placeholder, still coded (74,64,56):', await px(3, 7));
  const pl = await S(() => { const c = game.scene.getScene('Chapter'); return { sprite: !!c.playerSprite, frame: c.playerSprite && c.playerSprite.frame.name }; });
  console.log('Michael from his drawing:', pl);
  // walk left: the left-facing frame (2)
  await S(() => { const c = game.scene.getScene('Chapter'); c.fx = -1; c.fy = 0; c.drawPlayer(); });
  console.log('facing left, frame (2):', await S(() => game.scene.getScene('Chapter').playerSprite.frame.name));
  console.log('Jenny from her drawing:', await S(() => { const n = game.scene.getScene('Chapter').npcs.jenny; return n ? !!n.sprite : 'not on stage'; }));
  console.log('red car is a picture:', await S(() => { const c = game.scene.getScene('Chapter').cars.red; return c ? c.list[0].type : 'no car'; }));
  await p.screenshot({ path: out + '/01-fake-drawings-day1.png' });

  // 3. A night with the creature, drawn from its picture; Jenny wearing red eyes.
  await S(() => { SaveGame.startNew(); SaveGame.state.chapter = 'night4'; game.scene.getScene('Chapter').scene.restart(); });
  await p.waitForTimeout(2500);
  console.log('night 4: creature body is a picture:', await S(() => { const c = game.scene.getScene('Chapter'); return [SaveGame.state.chapter, !!c.creature, c.cBody && c.cBody.list.map(o => o.type)]; }));
  await S(() => { const c = game.scene.getScene('Chapter'); c.faceAt('jenny', 20, 6); c.setCreatureSkin('jenny'); });
  console.log('red eyes over Jenny\'s drawing:', await S(() => !!game.scene.getScene('Chapter').npcs.jenny.eyes));
  await p.waitForTimeout(500);
  await p.screenshot({ path: out + '/02-fake-drawings-night4.png' });

  // 4. The prologue and the test night still start with drawings swapped in.
  for (const key of ['Prologue', 'TestNight']) {
    await S(k => { const cur = game.scene.getScenes(true).find(s => s.sys.settings.key !== 'UI'); cur.scene.start(k); }, key);
    await p.waitForTimeout(2000);
    console.log(key, 'running:', await S(k => game.scene.isActive(k), key));
  }
  await p.screenshot({ path: out + '/03-fake-drawings-testnight.png' });
  console.log('ERRORS', errs);
  await b.close();
})();
