const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  const S = (f, a) => p.evaluate(f, a);
  const st = () => S(() => { const s = game.scene.getScene('TestNight'); return s.creature.state + ' susp=' + s.creature.suspicion.toFixed(2) + ' d=' + (s.creature.distToPlayer()/16).toFixed(1); });
  const fresh = async () => { await S(() => game.scene.getScene('TestNight').scene.restart()); await p.waitForTimeout(800); };
  await p.goto('http://localhost:8123/'); await p.waitForTimeout(1000);
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800); await p.keyboard.press('3'); await p.waitForTimeout(2500);
  console.log('1 start:', await st());
  await p.screenshot({ path: out + '/01-start.png' });

  // 2. quiet walking on a path, lantern off, far away: should stay prowling
  await S(() => { const s = game.scene.getScene('TestNight'); s.lanternOn = false; s.hx = 18*16+8; s.hy = 28*16+8; const c = s.creature; c.x = 45*16; c.y = 8*16; c.target = {x: 50*16, y: 6*16}; });
  await p.keyboard.down('w'); await p.waitForTimeout(2500); await p.keyboard.up('w');
  console.log('2 quiet path walk, lantern off:', await st());

  // 3. pushing through corn near it: should hunt
  await fresh();
  await S(() => { const s = game.scene.getScene('TestNight'); s.hx = 30*16+8; s.hy = 18*16+8; const c = s.creature; c.x = 36*16; c.y = 12*16; c.suspicion = 0; c.lureCooldown = 99; });
  await p.keyboard.down('d'); await p.waitForTimeout(1600); await p.keyboard.up('d');
  console.log('3 corn noise:', await st());
  await p.waitForTimeout(800);
  console.log('   crickets level:', await S(() => Controls.crickets.toFixed(2)));
  await p.screenshot({ path: out + '/03-hunt.png' });

  // 4. lantern in its face: should retreat
  await fresh();
  await S(() => { const s = game.scene.getScene('TestNight'); s.hx = 24*16+8; s.hy = 18*16+8; s.fx = 1; s.fy = 0; const c = s.creature; c.x = 28*16; c.y = 18*16+8; c.lureCooldown = 99; c.startHunt(); });
  await p.waitForTimeout(150);
  console.log('4 hunting, faced:', await st());
  // keep facing it
  for (let i = 0; i < 12; i++) { await S(() => { const s = game.scene.getScene('TestNight'); const c = s.creature; const dx = c.x - s.hx, dy = c.y - s.hy, l = Math.hypot(dx, dy); s.fx = dx/l; s.fy = dy/l; }); await p.waitForTimeout(150); }
  console.log('   after facing it ~1.8s:', await st());

  // 5. lantern off and still, it more than 2 tiles away and hunting: should lose you
  await fresh();
  await S(() => { const s = game.scene.getScene('TestNight'); s.lanternOn = false; s.hx = 24*16+8; s.hy = 18*16+8; const c = s.creature; c.x = 30*16; c.y = 18*16; c.lureCooldown = 99; c.startHunt(); c.lastKnown = {x: 40*16, y: 25*16}; });
  await p.waitForTimeout(5500);
  console.log('5 lantern off, still, out of reach of its senses:', await st());

  // 6. caught from behind
  await fresh();
  await S(() => { const s = game.scene.getScene('TestNight'); s.lanternOn = false; s.hx = 24*16+8; s.hy = 18*16+8; s.fx = 1; s.fy = 0; const c = s.creature; c.x = 22*16+8; c.y = 18*16+8; c.lureCooldown = 99; c.startHunt(); });
  await p.waitForTimeout(1500);
  console.log('6 behind him, lantern off:', await S(() => game.scene.getScene('TestNight').state));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out + '/06-caught.png' });
  await p.waitForTimeout(16000);
  console.log('   scenes:', await S(() => game.scene.getScenes(true).map(s => s.sys.settings.key).join(',')));
  await p.screenshot({ path: out + '/06b-caught-end.png' });
  await p.keyboard.press('x'); await p.waitForTimeout(1500);

  // 7. hiding in the truck, holding breath
  await fresh();
  await S(() => { const s = game.scene.getScene('TestNight'); s.hx = 12*16+8; s.hy = 19*16+10; s.creature.lureCooldown = 99; });
  await p.waitForTimeout(200); await p.keyboard.down('e'); await p.waitForTimeout(100); await p.keyboard.up('e'); await p.waitForTimeout(300);
  console.log('7 hidden:', await S(() => game.scene.getScene('TestNight').hidden));
  await S(() => { const s = game.scene.getScene('TestNight'); const c = s.creature; c.x = 18*16; c.y = 20*16; c.startHunt(); c.lastKnown = {x: 15*16, y: 20*16}; });
  await p.keyboard.down('e');
  await p.waitForTimeout(400);
  console.log('   holding breath:', await S(() => game.scene.getScene('TestNight').holdingBreath));
  await p.screenshot({ path: out + '/07-hiding.png' });
  await p.waitForTimeout(4600);
  console.log('   after 5s holding breath:', await st(), 'breath', await S(() => game.scene.getScene('TestNight').breath.toFixed(2)));
  await p.keyboard.up('e'); await p.waitForTimeout(300);
  console.log('   let go (exited?):', await S(() => game.scene.getScene('TestNight').hidden));

  // 8. the lure
  await fresh();
  await S(() => { const s = game.scene.getScene('TestNight'); s.hx = 14*16+8; s.hy = 10*16+8; s.lanternOn = false; const c = s.creature; c.x = 22*16; c.y = 12*16; c.lureCooldown = 0; c.suspicion = 0; c.startLure(); });
  await p.waitForTimeout(4000);
  console.log('8 lure:', await st(), await S(() => { const L = game.scene.getScene('TestNight').creature.lure; return L ? JSON.stringify({x: L.x/16|0, y: L.y/16|0, calls: L.calls, text: L.voice.text}) : 'none'; }));
  await p.screenshot({ path: out + '/08-lure.png' });
  const lx = await S(() => game.scene.getScene('TestNight').creature.lure.x);
  await S(() => { const s = game.scene.getScene('TestNight'); }); 
  await p.keyboard.down('d'); await p.waitForTimeout(2500); await p.keyboard.up('d');
  console.log('   followed the voice:', await st());

  // 9. debug view and reach line
  await fresh();
  await p.keyboard.press('g'); await p.waitForTimeout(300);
  await p.screenshot({ path: out + '/09-debug.png' });
  await p.keyboard.press('g'); await p.waitForTimeout(200);
  console.log('9 reach after one more press:', await S(() => game.scene.getScene('TestNight').reachX / 16));

  // 10. dawn
  await S(() => { game.scene.getScene('TestNight').timeLeft = 1; });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: out + '/10-dawn.png' });
  await p.waitForTimeout(5000);
  console.log('10 dawn ->', await S(() => game.scene.getScenes(true).map(s => s.sys.settings.key).join(',')));
  console.log('ERRORS', errs);
  await b.close();
})();
