// Sound for the grey-box build. Every sound is synthesised in code at startup,
// so there are no audio files to load. Swap these for real recordings later.
const SFX = (() => {
  let ctx = null;
  let master = null;
  let SR = 44100;
  const buffers = {};
  const live = new Set();

  // Small seeded random generator so "identical" sounds really are identical.
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function makeBuffer(seconds, fill) {
    const n = Math.floor(seconds * SR);
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    fill(L, R, n);
    const b = ctx.createBuffer(2, n, SR);
    b.copyToChannel(L, 0);
    b.copyToChannel(R, 1);
    return b;
  }

  function normalize(L, R, peak) {
    let m = 0;
    for (let i = 0; i < L.length; i++) m = Math.max(m, Math.abs(L[i]), Math.abs(R[i]));
    if (m > 0) {
      const k = peak / m;
      for (let i = 0; i < L.length; i++) { L[i] *= k; R[i] *= k; }
    }
  }

  function panGains(pan) {
    const a = (pan + 1) * Math.PI / 4;
    return [Math.cos(a), Math.sin(a)];
  }

  // A crude singing-voice: harmonics shaped by vowel formants.
  const VOWELS = {
    a: [[1000, 1.0], [1600, 0.6], [3000, 0.25]],
    u: [[650, 1.0], [1200, 0.5], [2900, 0.15]],
    i: [[380, 1.0], [2800, 0.5], [3500, 0.3]],
  };
  function voiced(out, start, dur, f0, vowel, amp, rand, shape) {
    const formants = VOWELS[vowel];
    const n = Math.floor(dur * SR);
    const s0 = Math.floor(start * SR);
    let phase = 0;
    const maxK = Math.max(1, Math.floor(4500 / f0));
    const ak = [];
    for (let k = 1; k <= maxK; k++) {
      let a = 0.12 / k;
      for (const [F, g] of formants) a += g * Math.exp(-Math.pow((k * f0 - F) / 260, 2));
      ak.push(a);
    }
    for (let j = 0; j < n && s0 + j < out.length; j++) {
      const t = j / n;
      const env = shape === 'flat'
        ? Math.min(1, j / (0.02 * SR)) * Math.min(1, (n - j) / (0.05 * SR))
        : Math.pow(Math.sin(Math.PI * t), 0.6);
      const pitch = shape === 'flat' ? f0 * (1 - 0.04 * t) : f0 * (1 + 0.1 * Math.sin(Math.PI * t));
      phase += 2 * Math.PI * pitch / SR;
      let v = 0;
      for (let k = 0; k < ak.length; k++) v += ak[k] * Math.sin((k + 1) * phase);
      v += (rand() * 2 - 1) * 0.08;
      out[s0 + j] += v * env * amp;
    }
  }

  function noiseBurst(out, start, dur, amp, rand, hp) {
    const s0 = Math.floor(start * SR);
    const n = Math.floor(dur * SR);
    let prev = 0;
    for (let j = 0; j < n && s0 + j < out.length; j++) {
      const x = rand() * 2 - 1;
      const v = hp ? x - prev : x;
      prev = x;
      out[s0 + j] += v * amp * Math.sin(Math.PI * j / n);
    }
  }

  function echo(L, R, taps) {
    for (const [delay, gain] of taps) {
      const d = Math.floor(delay * SR);
      for (let i = L.length - 1; i >= d; i--) { L[i] += L[i - d] * gain; R[i] += R[i - d] * gain * 0.9; }
    }
  }

  function lowpass(arr, a) {
    let y = 0;
    for (let i = 0; i < arr.length; i++) { y += a * (arr[i] - y); arr[i] = y; }
  }

  // ---------- the sounds ----------

  function buildCrickets() {
    const dur = 8;
    return makeBuffer(dur, (L, R, n) => {
      const crickets = [
        { f: 4400, period: 0.8, pulses: 3, pan: -0.7, amp: 0.25, off: 0.10 },
        { f: 4750, period: 1.0, pulses: 2, pan: 0.55, amp: 0.20, off: 0.37 },
        { f: 5100, period: 0.5, pulses: 4, pan: 0.10, amp: 0.10, off: 0.21 },
        { f: 4200, period: 2 / 3, pulses: 3, pan: 0.85, amp: 0.09, off: 0.05 },
        { f: 4600, period: 8 / 9, pulses: 3, pan: -0.25, amp: 0.13, off: 0.62 },
      ];
      for (const c of crickets) {
        const [gl, gr] = panGains(c.pan);
        for (let start = c.off; start < dur; start += c.period) {
          for (let p = 0; p < c.pulses; p++) {
            const ps = start + p * 0.028;
            const len = Math.floor(0.018 * SR);
            const s0 = Math.floor(ps * SR);
            for (let j = 0; j < len; j++) {
              const s = (s0 + j) % n;
              const v = c.amp * Math.sin(Math.PI * j / len) * Math.sin(2 * Math.PI * c.f * (s0 + j) / SR);
              L[s] += v * gl;
              R[s] += v * gr;
            }
          }
        }
      }
      // distant chorus of crickets, seamless over the 8 second loop
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const v = 0.025 * Math.sin(2 * Math.PI * 3900 * t) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 28 * t)) *
          (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.25 * t));
        L[i] += v;
        R[i] += v * 0.8;
      }
    });
  }

  function buildRustle(seed) {
    const rand = rng(seed);
    return makeBuffer(0.45, (L, R, n) => {
      let prev = 0, lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const x = rand() * 2 - 1;
        const hp = x - prev; prev = x;
        lp += 0.3 * (hp - lp);
        const v = lp * 0.35 * Math.sin(Math.PI * t);
        L[i] += v; R[i] += v;
      }
      for (let g = 0; g < 28; g++) {
        const st = rand() * 0.38, len = 0.004 + rand() * 0.025, a = 0.3 + rand() * 0.7;
        noiseBurst(rand() < 0.5 ? L : R, st, len, a, rand, true);
      }
      normalize(L, R, 0.9);
    });
  }

  function buildStep(seed) {
    const rand = rng(seed);
    return makeBuffer(0.12, (L, R, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        lp += 0.12 * ((rand() * 2 - 1) - lp);
        const v = (lp * 1.5 + 0.5 * Math.sin(2 * Math.PI * 90 * t)) * Math.exp(-t * 45);
        L[i] = v; R[i] = v;
      }
      normalize(L, R, 0.8);
    });
  }

  function buildLaugh(seed, f0, count) {
    const rand = rng(seed);
    let t = 0.03;
    const syl = [];
    for (let i = 0; i < count; i++) {
      const dur = 0.075 + rand() * 0.045;
      syl.push({ t, dur, f: f0 * (1 - i * 0.03) * (1 + (rand() - 0.5) * 0.08) });
      t += dur + 0.04 + rand() * 0.035;
    }
    return makeBuffer(t + 0.8, (L, R) => {
      for (const s of syl) {
        noiseBurst(L, s.t - 0.02, 0.03, 0.15, rand, false); // the "h"
        voiced(L, s.t, s.dur, s.f, 'a', 0.6, rand);
      }
      lowpass(L, 0.35); // heard from a distance
      R.set(L);
      echo(L, R, [[0.13, 0.35], [0.29, 0.22]]);
      normalize(L, R, 0.8);
    });
  }

  // "Grandpa. Come see." as flat, identical, voice-like tones (used if the
  // phone has no text-to-speech voice).
  function buildVoiceSynth() {
    const rand = rng(777);
    return makeBuffer(2.6, (L, R) => {
      const f = 330;
      noiseBurst(L, 0.00, 0.03, 0.2, rand, false);
      voiced(L, 0.03, 0.28, f, 'a', 0.6, rand, 'flat');
      noiseBurst(L, 0.33, 0.02, 0.3, rand, true);
      voiced(L, 0.36, 0.30, f * 0.93, 'a', 0.6, rand, 'flat');
      noiseBurst(L, 1.05, 0.03, 0.3, rand, true);
      voiced(L, 1.09, 0.30, f, 'u', 0.6, rand, 'flat');
      noiseBurst(L, 1.45, 0.14, 0.25, rand, true); // "s"
      voiced(L, 1.60, 0.55, f * 0.96, 'i', 0.6, rand, 'flat');
      lowpass(L, 0.5);
      R.set(L);
      echo(L, R, [[0.17, 0.25]]);
      normalize(L, R, 0.7);
    });
  }

  function buildHeartbeat() {
    return makeBuffer(0.55, (L, R, n) => {
      const thump = (st, amp) => {
        const s0 = Math.floor(st * SR);
        for (let j = 0; s0 + j < n; j++) {
          const t = j / SR;
          const f = 45 + 30 * Math.exp(-t * 20);
          const v = amp * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 16) * Math.min(1, j / (0.004 * SR));
          L[s0 + j] += v; R[s0 + j] += v;
        }
      };
      thump(0, 1);
      thump(0.17, 0.65);
      normalize(L, R, 0.95);
    });
  }

  // The jump scare: a heavy hit from behind with a dissonant sting.
  function buildStrike() {
    const rand = rng(4242);
    return makeBuffer(2.6, (L, R, n) => {
      const stingF = [233, 247, 311, 349, 466, 494, 698, 740];
      const ph = stingF.map(() => 0);
      let lpL = 0, lpR = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const attack = Math.min(1, i / (0.002 * SR));
        const boomF = 32 + 80 * Math.exp(-t * 10);
        const boom = Math.sin(2 * Math.PI * boomF * t) * Math.exp(-t * 2.4) * 1.1;
        const nl = rand() * 2 - 1, nr = rand() * 2 - 1;
        lpL += 0.25 * (nl - lpL); lpR += 0.25 * (nr - lpR);
        const crack = Math.exp(-t * 28) * 0.9;
        let sting = 0;
        for (let k = 0; k < stingF.length; k++) {
          ph[k] += 2 * Math.PI * stingF[k] * (1 + 0.004 * Math.sin(2 * Math.PI * 6 * t + k)) / SR;
          sting += Math.sin(ph[k]) + 0.5 * Math.sin(2 * ph[k]) + 0.33 * Math.sin(3 * ph[k]);
        }
        sting *= 0.06 * Math.min(1, t / 0.015) * Math.exp(-t * 1.3);
        const screech = 0.1 * Math.exp(-t * 2.5) * (Math.sin(2 * Math.PI * 2350 * t) + Math.sin(2 * Math.PI * 2510 * t));
        L[i] = attack * (boom + (nl * 0.5 + lpL) * crack + sting + screech);
        R[i] = attack * (boom + (nr * 0.5 + lpR) * crack + sting * 0.95 + screech);
      }
      for (let g = 0; g < 40; g++) noiseBurst(rand() < 0.5 ? L : R, rand() * 0.3, 0.003 + rand() * 0.02, 0.8, rand, false);
      normalize(L, R, 0.98);
    });
  }

  function buildGrab() {
    const rand = rng(99);
    return makeBuffer(1.4, (L, R, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const boom = Math.sin(2 * Math.PI * (28 + 60 * Math.exp(-t * 14)) * t) * Math.exp(-t * 3);
        lp += 0.08 * ((rand() * 2 - 1) - lp);
        const wet = lp * 3 * Math.exp(-t * 6) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 23 * t));
        const v = Math.min(1, i / (0.002 * SR)) * (boom + wet);
        L[i] = v; R[i] = v;
      }
      for (let g = 0; g < 30; g++) noiseBurst(rand() < 0.5 ? L : R, rand() * 0.25, 0.003 + rand() * 0.015, 0.7, rand, false);
      normalize(L, R, 0.95);
    });
  }

  function buildRoll(leftToRight) {
    const rand = rng(31);
    return makeBuffer(1.4, (L, R, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        lp += 0.04 * ((rand() * 2 - 1) - lp);
        const bump = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 7.5 * t)), 8);
        const env = Math.sin(Math.PI * Math.min(1, t / 1.3));
        const v = (lp * 4 + bump * 0.5 * Math.sin(2 * Math.PI * 70 * t)) * env;
        const pan = leftToRight ? -0.9 + 1.8 * t / 1.4 : 0.9 - 1.8 * t / 1.4;
        const [gl, gr] = panGains(pan);
        L[i] = v * gl; R[i] = v * gr;
      }
      for (let g = 0; g < 50; g++) {
        const st = rand() * 1.25;
        const pan = leftToRight ? -0.9 + 1.8 * st / 1.4 : 0.9 - 1.8 * st / 1.4;
        noiseBurst(pan < 0 ? L : R, st, 0.003 + rand() * 0.012, 0.25, rand, true);
      }
      normalize(L, R, 0.8);
    });
  }

  function buildClick() {
    const rand = rng(5);
    return makeBuffer(0.05, (L, R, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const v = ((rand() * 2 - 1) * 0.6 + Math.sin(2 * Math.PI * 1800 * t)) * Math.exp(-t * 180);
        L[i] = v; R[i] = v;
      }
      normalize(L, R, 0.6);
    });
  }

  function buildDice() {
    const rand = rng(12);
    return makeBuffer(0.7, (L, R, n) => {
      let t = 0.02;
      for (let k = 0; k < 7; k++) {
        const f = 1800 + rand() * 1400;
        const s0 = Math.floor(t * SR);
        const amp = 0.8 - k * 0.08;
        for (let j = 0; j < 0.03 * SR && s0 + j < n; j++) {
          const tt = j / SR;
          const v = amp * (Math.sin(2 * Math.PI * f * tt) * 0.6 + (rand() * 2 - 1) * 0.4) * Math.exp(-tt * 150);
          L[s0 + j] += v; R[s0 + j] += v;
        }
        t += 0.04 + k * 0.012 + rand() * 0.03;
      }
      normalize(L, R, 0.6);
    });
  }

  function buildClock() {
    return makeBuffer(2, (L, R, n) => {
      const tick = (st, f) => {
        const s0 = Math.floor(st * SR);
        for (let j = 0; j < 0.04 * SR; j++) {
          const t = j / SR;
          const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 120);
          L[s0 + j] += v; R[s0 + j] += v;
        }
      };
      tick(0, 2600);
      tick(1, 2200);
      normalize(L, R, 0.5);
    });
  }

  function buildThud() {
    return makeBuffer(2.5, (L, R, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const v = Math.sin(2 * Math.PI * (30 + 25 * Math.exp(-t * 6)) * t) * Math.exp(-t * 1.6) * Math.min(1, i / (0.003 * SR));
        L[i] = v; R[i] = v;
      }
      normalize(L, R, 0.9);
    });
  }

  // An old man's scream: a rising, harsh vowel that cracks.
  function buildScream() {
    const rand = rng(66);
    return makeBuffer(1.8, (L, R, n) => {
      voiced(L, 0.0, 0.25, 200, 'a', 0.5, rand);
      let phase = 0;
      const s0 = Math.floor(0.2 * SR);
      for (let j = 0; s0 + j < n; j++) {
        const t = j / SR;
        const env = Math.min(1, t / 0.08) * Math.exp(-Math.max(0, t - 0.7) * 3);
        const f0 = 230 + 140 * Math.min(1, t / 0.4) + 12 * Math.sin(2 * Math.PI * 7 * t) + (rand() - 0.5) * 30;
        phase += 2 * Math.PI * f0 / SR;
        let v = 0;
        for (let k = 1; k <= 14; k++) {
          const F = k * f0;
          const a = Math.exp(-Math.pow((F - 900) / 300, 2)) + 0.7 * Math.exp(-Math.pow((F - 1500) / 350, 2)) + 0.4 * Math.exp(-Math.pow((F - 2700) / 400, 2)) + 0.08 / k;
          v += a * Math.sin(k * phase);
        }
        v += (rand() * 2 - 1) * 0.35; // rasp
        L[s0 + j] += v * env * 0.6;
      }
      R.set(L);
      echo(L, R, [[0.09, 0.3], [0.21, 0.18]]);
      normalize(L, R, 0.9);
    });
  }

  // Spike: two barks, used by the lure.
  function buildBark() {
    const rand = rng(808);
    return makeBuffer(1.2, (L, R) => {
      [0.02, 0.32].forEach((st, i) => {
        noiseBurst(L, st, 0.03, 0.4, rand, false);
        voiced(L, st + 0.01, 0.16, 420 - i * 30, 'a', 0.9, rand);
      });
      lowpass(L, 0.4);
      R.set(L);
      echo(L, R, [[0.15, 0.3], [0.33, 0.15]]);
      normalize(L, R, 0.8);
    });
  }

  // A low growl in the corn (heard when it is driven off).
  function buildGrowl() {
    const rand = rng(13);
    return makeBuffer(1.6, (L, R, n) => {
      let lp = 0, ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        lp += 0.03 * ((rand() * 2 - 1) - lp);
        ph += 2 * Math.PI * (55 + 6 * Math.sin(2 * Math.PI * 3 * t)) / SR;
        const env = Math.sin(Math.PI * t / 1.6);
        const v = (lp * 5 + 0.5 * Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 23 * t)) * env;
        L[i] = v; R[i] = v * 0.9;
      }
      normalize(L, R, 0.9);
    });
  }

  function buildGasp() {
    const rand = rng(41);
    return makeBuffer(0.6, (L, R, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n;
        lp += 0.25 * ((rand() * 2 - 1) - lp);
        const v = lp * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.3)), 0.5) * (1 - t);
        L[i] = v; R[i] = v;
      }
      normalize(L, R, 0.8);
    });
  }

  // Water dripping from the gutters after the rain (6 second loop).
  function buildDrips() {
    const rand = rng(303);
    return makeBuffer(6, (L, R, n) => {
      for (let k = 0; k < 22; k++) {
        const st = rand() * 5.9;
        const f = 900 + rand() * 900;
        const pan = rand() * 2 - 1;
        const [gl, gr] = panGains(pan);
        const amp = 0.3 + rand() * 0.7;
        const s0 = Math.floor(st * SR);
        for (let j = 0; j < 0.06 * SR && s0 + j < n; j++) {
          const t = j / SR;
          const v = amp * Math.sin(2 * Math.PI * f * (1 + 2.5 * t) * t) * Math.exp(-t * 70);
          L[s0 + j] += v * gl; R[s0 + j] += v * gr;
        }
      }
      normalize(L, R, 0.6);
    });
  }

  // A television murmuring in the next room (8 second loop).
  function buildTV() {
    const rand = rng(515);
    return makeBuffer(8, (L, R, n) => {
      let t = 0.1;
      while (t < 7.6) {
        const dur = 0.08 + rand() * 0.14;
        const vowel = ['a', 'u', 'i'][Math.floor(rand() * 3)];
        voiced(L, t, dur, 120 + rand() * 40, vowel, 0.5, rand);
        t += dur + (rand() < 0.2 ? 0.35 : 0.04);
      }
      lowpass(L, 0.12); // heard through a wall
      R.set(L);
      normalize(L, R, 0.5);
    });
  }

  // A car engine (2 second loop). Play faster for a smaller car.
  function buildEngine() {
    const rand = rng(77);
    return makeBuffer(2, (L, R, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        lp += 0.05 * ((rand() * 2 - 1) - lp);
        const v = 0.5 * Math.sin(2 * Math.PI * 40 * t) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 20 * t)) + lp * 2 + 0.2 * Math.sin(2 * Math.PI * 80 * t);
        L[i] = v; R[i] = v;
      }
      normalize(L, R, 0.6);
    });
  }

  function buildHorn() {
    return makeBuffer(0.9, (L, R, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const on = (t < 0.3) || (t > 0.45 && t < 0.85);
        const v = on ? (Math.sign(Math.sin(2 * Math.PI * 420 * t)) * 0.3 + Math.sign(Math.sin(2 * Math.PI * 525 * t)) * 0.3) : 0;
        L[i] = v; R[i] = v;
      }
      lowpass(L, 0.3); lowpass(R, 0.3);
      normalize(L, R, 0.5);
    });
  }

  // The generator coughing into life, then running (use as a loop after).
  function buildGenerator() {
    const rand = rng(9);
    return makeBuffer(2, (L, R, n) => {
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        lp += 0.1 * ((rand() * 2 - 1) - lp);
        const putt = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 14 * t)), 6);
        const v = putt * (0.8 * Math.sin(2 * Math.PI * 60 * t) + lp * 2);
        L[i] = v; R[i] = v;
      }
      normalize(L, R, 0.6);
    });
  }

  function buildDoor() {
    const rand = rng(17);
    return makeBuffer(0.4, (L, R, n) => {
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const v = (Math.sin(2 * Math.PI * (90 + 40 * Math.exp(-t * 30)) * t) + (rand() * 2 - 1) * 0.4 * Math.exp(-t * 60)) * Math.exp(-t * 14);
        L[i] = v; R[i] = v;
      }
      // the latch
      noiseBurst(L, 0.12, 0.015, 0.5, rand, true); noiseBurst(R, 0.12, 0.015, 0.5, rand, true);
      normalize(L, R, 0.7);
    });
  }

  // A dog's yelp, far off in the corn.
  function buildYelp() {
    const rand = rng(404);
    return makeBuffer(0.9, (L, R) => {
      voiced(L, 0.01, 0.22, 900, 'i', 0.9, rand);
      voiced(L, 0.2, 0.16, 650, 'a', 0.5, rand);
      lowpass(L, 0.35);
      R.set(L);
      echo(L, R, [[0.16, 0.3], [0.34, 0.15]]);
      normalize(L, R, 0.8);
    });
  }

  // A crow: two harsh caws and wingbeats.
  function buildCrow() {
    const rand = rng(611);
    return makeBuffer(1.1, (L, R) => {
      [0.0, 0.32].forEach(st => {
        voiced(L, st, 0.22, 330, 'a', 0.8, rand);
        noiseBurst(L, st, 0.22, 0.35, rand, true); // the rasp
      });
      for (let i = 0; i < 6; i++) noiseBurst(L, 0.6 + i * 0.07, 0.05, 0.4, rand, false); // wings
      lowpass(L, 0.6);
      R.set(L);
      normalize(L, R, 0.8);
    });
  }

  // A window smashing.
  function buildGlass() {
    const rand = rng(919);
    return makeBuffer(1.4, (L, R, n) => {
      let prev = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const x = rand() * 2 - 1;
        const v = (x - prev) * Math.exp(-t * 9) * 0.9 + Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t * 20) * 0.6;
        prev = x;
        L[i] = v; R[i] = v * 0.9;
      }
      for (let k = 0; k < 18; k++) {          // shards tinkling
        const st = 0.05 + rand() * 1.1, f = 2500 + rand() * 4000, a = 0.25 * (1 - st);
        const s0 = Math.floor(st * SR);
        for (let j = 0; j < 0.05 * SR && s0 + j < n; j++) {
          const v = a * Math.sin(2 * Math.PI * f * j / SR) * Math.exp(-j / SR * 80);
          L[s0 + j] += v; R[s0 + j] += v;
        }
      }
      normalize(L, R, 0.95);
    });
  }

  function build() {
    buffers.crow = buildCrow();
    buffers.glass = buildGlass();
    buffers.yelp = buildYelp();
    buffers.engine = buildEngine();
    buffers.horn = buildHorn();
    buffers.generator = buildGenerator();
    buffers.door = buildDoor();
    buffers.scream = buildScream();
    buffers.bark = buildBark();
    buffers.growl = buildGrowl();
    buffers.gasp = buildGasp();
    buffers.drips = buildDrips();
    buffers.tv = buildTV();
    buffers.crickets = buildCrickets();
    buffers.rustle = [buildRustle(1), buildRustle(2), buildRustle(3)];
    buffers.step = [buildStep(7), buildStep(8)];
    buffers.laugh = [buildLaugh(21, 560, 6), buildLaugh(22, 640, 5), buildLaugh(23, 600, 8), buildLaugh(24, 700, 4)];
    buffers.voice = buildVoiceSynth();
    buffers.heartbeat = buildHeartbeat();
    buffers.strike = buildStrike();
    buffers.grab = buildGrab();
    buffers.rollLR = buildRoll(true);
    buffers.rollRL = buildRoll(false);
    buffers.click = buildClick();
    buffers.dice = buildDice();
    buffers.clock = buildClock();
    buffers.thud = buildThud();
  }

  // ---------- playback ----------

  function init() {
    if (ctx) {
      if (ctx.state !== 'running') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    SR = ctx.sampleRate;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.2;
    master = ctx.createGain();
    master.connect(limiter);
    limiter.connect(ctx.destination);
    build();
    ctx.resume();
    if (window.speechSynthesis) speechSynthesis.getVoices(); // start loading voices early
  }

  function pick(b) {
    return Array.isArray(b) ? b[Math.floor(Math.random() * b.length)] : b;
  }

  // Plays a sound once. opts: vol (0-1), pan (-1 left .. 1 right), rate, loop.
  function play(name, opts = {}) {
    if (!ctx || !buffers[name]) return null;
    const src = ctx.createBufferSource();
    src.buffer = pick(buffers[name]);
    src.loop = !!opts.loop;
    src.playbackRate.value = opts.rate || 1;
    const gain = ctx.createGain();
    gain.gain.value = opts.vol === undefined ? 1 : opts.vol;
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, opts.pan || 0));
      src.connect(gain).connect(panner).connect(master);
    } else {
      src.connect(gain).connect(master);
    }
    const handle = {
      src,
      setVolume(v, seconds = 0.1) {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setTargetAtTime(Math.max(0, v), ctx.currentTime, seconds / 3);
      },
      stop(fadeSeconds = 0) {
        try {
          if (fadeSeconds > 0) {
            gain.gain.cancelScheduledValues(ctx.currentTime);
            gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeSeconds);
            src.stop(ctx.currentTime + fadeSeconds + 0.05);
          } else {
            src.stop();
          }
        } catch (e) { /* already stopped */ }
        live.delete(handle);
      },
    };
    src.onended = () => live.delete(handle);
    live.add(handle);
    src.start();
    return handle;
  }

  function loop(name, vol) {
    return play(name, { vol, loop: true });
  }

  // The lure's voice. Uses the phone's text-to-speech if it has a voice,
  // otherwise the synthesised tones. Same words, same way, every time.
  function speakLure(text) {
    const synth = window.speechSynthesis;
    if (!synth || !window.SpeechSynthesisUtterance) {
      play('voice', { vol: 0.8 });
      return;
    }
    let started = false;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.pitch = 1.5;
    u.rate = 0.8;
    u.volume = 1;
    const voices = synth.getVoices().filter(v => /^en/i.test(v.lang));
    if (voices.length) u.voice = voices.find(v => /en-US/i.test(v.lang)) || voices[0];
    u.onstart = () => { started = true; };
    u.onerror = () => { if (!started) { started = true; play('voice', { vol: 0.8 }); } };
    synth.cancel();
    synth.speak(u);
    setTimeout(() => {
      if (!started) { started = true; synth.cancel(); play('voice', { vol: 0.8 }); }
    }, 900);
  }

  function stopAll() {
    for (const h of Array.from(live)) h.stop();
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  function vibrate(pattern) {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) { /* not allowed */ }
    }
  }

  return { init, play, loop, speakLure, stopAll, vibrate };
})();
