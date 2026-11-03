// The ending screens. mode:
//   'prologue'    - black, then the title. Tap to start Day 1.
//   'caught'      - test night: caught from behind. Tap to try again.
//   'dawn'        - test night: survived until dawn.
//   'caught-save' - story: caught. Tap to go back to the last save.
//   'chapter'     - story: end of a day or night. Tap for the next one.
//   'ending'      - the end of the game: Dawn, Alone or Remembered.
class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  init(data) { this.data_ = data || {}; this.mode = this.data_.mode || 'prologue'; }

  create() {
    const { width, height } = this.scale;
    const touch = this.sys.game.device.input.touch;
    const tap = (what) => (touch ? 'Tap to ' : 'Click or press any key to ') + what;
    this.cameras.main.setBackgroundColor(this.mode === 'dawn' ? '#2a2620' : '#000000');
    const big = (y, text, size = 22) => this.add.text(width / 2, y, text, { fontFamily: 'Georgia, serif', fontSize: size + 'px', color: '#d8d2c0', align: 'center', lineSpacing: 4 }).setOrigin(0.5);
    const small = (y, text) => this.add.text(width / 2, y, text, { fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#8a8478', align: 'center', wordWrap: { width: 380 } }).setOrigin(0.5);

    let go, prompt, promptDelay = 2200;
    if (this.mode === 'prologue') {
      this.time.delayedCall(1400, () => {
        SFX.play('thud', { vol: 0.9 });
        big(height / 2 - 10, 'STAY AWAY FROM\nTHE CORNFIELD', 32);
      });
      promptDelay = 4200;
      prompt = tap('begin Day 1');
      go = () => { SaveGame.startNew(); this.scene.start('Chapter'); };
    } else if (this.mode === 'caught' || this.mode === 'dawn') {
      const caught = this.mode === 'caught';
      this.time.delayedCall(caught ? 900 : 300, () => {
        if (caught) SFX.play('thud', { vol: 0.7 });
        big(height / 2 - 12, caught ? 'It got behind you.' : 'Dawn.');
        small(height / 2 + 14, caught ? 'Keep your light on it. Never let it behind you.' : 'The crickets give way to silence. It sleeps.');
      });
      prompt = tap('try again');
      go = () => this.scene.start('TestNight');
    } else if (this.mode === 'caught-save') {
      this.time.delayedCall(900, () => {
        SFX.play('thud', { vol: 0.7 });
        big(height / 2 - 12, 'It got behind you.');
        small(height / 2 + 14, 'Back to the last save.');
      });
      prompt = tap('continue');
      go = () => { SaveGame.load(); this.scene.start('Chapter', { resume: true }); };
    } else if (this.mode === 'ending') {
      this.playEnding();
      return;
    } else {
      const next = this.data_.next;
      big(height / 2 - 30, 'End of ' + (CHAPTER_NAMES[this.data_.finished] || 'the chapter'), 18);
      small(height / 2 - 4, 'Your progress is saved.');
      if (CHAPTERS[next]) {
        big(height / 2 + 26, 'Next: ' + CHAPTER_NAMES[next], 14);
        prompt = tap('continue');
        go = () => this.scene.start('Chapter');
      } else {
        small(height / 2 + 26, (CHAPTER_NAMES[next] || 'The next chapter') + ' comes in the next build.');
        prompt = tap('go back to the start');
        go = () => this.scene.start('Start');
      }
      promptDelay = 1200;
    }

    this.time.delayedCall(promptDelay, () => {
      const t = this.add.text(width / 2, height - 30, prompt, { fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#8a8478' }).setOrigin(0.5);
      this.tweens.add({ targets: t, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });
      const handler = () => {
        window.removeEventListener('pointerup', handler);
        window.removeEventListener('keydown', handler);
        SFX.init();
        go();
      };
      window.addEventListener('pointerup', handler);
      window.addEventListener('keydown', handler);
      this.events.once('shutdown', () => {
        window.removeEventListener('pointerup', handler);
        window.removeEventListener('keydown', handler);
      });
    });
  }

  // The endings. Dawn: Jean lives. Alone: Jean was taken. Remembered (the
  // true ending): all twelve names were found. Every ending closes on the
  // same sting: a new farmer ploughs up a carved stone.
  playEnding() {
    const { width, height } = this.scale;
    const S = SaveGame.state;
    const jean = !S.flags.jeanDead;
    const names = [...(S.names || [])].sort((a, b) => VICTIMS.indexOf(a) - VICTIMS.indexOf(b)); // Ruth's brother last
    const remembered = names.length >= 12;
    const ending = remembered ? 'Remembered' : (jean ? 'Dawn' : 'Alone');
    const cards = [
      { bg: '#3a3020', lines: ['Dawn.', jean ? 'Michael and Jean walk out of the corn as the sun comes up.' : 'Michael walks out of the corn alone, as the sun comes up.'] },
      { lines: ['A year later.'] },
      { lines: ['"Mr Cole, what inspired your new novel, Stay Away from the Cornfield?"', '"Just a visit to my father\'s farm."', jean ? 'Under the table, Jean holds his hand.' : 'Beside him, an empty chair.'] },
      { lines: ['If only they knew, he thinks.', 'If only they knew.'] },
    ];
    if (remembered) cards.push({ lines: ['Afterwards, Ruth Hale stands and reads twelve names aloud.', names.join(', ') + '.', "Her brother's name is last.", 'They are not forgotten any more.'] });
    cards.push({ bg: '#20180c', lines: ['Years later, a new farmer ploughs the field.', 'The plough turns up a carved stone.'] });
    cards.push({ title: true, lines: ['STAY AWAY FROM\nTHE CORNFIELD', 'The End', 'Ending: ' + ending + (remembered ? ' (the true ending)' : '')] });

    const page = this.add.container(0, 0);
    let i = -1, ready = false;
    const show = () => {
      i++;
      page.removeAll(true);
      const card = cards[i];
      this.cameras.main.setBackgroundColor(card.bg || '#000000');
      let y = height / 2 - card.lines.length * 14;
      card.lines.forEach((line, k) => {
        const big = card.title && k === 0;
        const t = this.add.text(width / 2, y, line, {
          fontFamily: big ? 'Georgia, serif' : 'Georgia, serif', fontSize: big ? '30px' : (card.title ? '11px' : '12px'),
          color: k === 0 || big ? '#e8e2d0' : '#bdb6a4', align: 'center', wordWrap: { width: 400 }, lineSpacing: 3,
        }).setOrigin(0.5, 0).setAlpha(0);
        this.tweens.add({ targets: t, alpha: 1, duration: 900, delay: k * 900 });
        page.add(t);
        y += t.height + 12;
      });
      if (card.title) SFX.play('thud', { vol: 0.8 });
      ready = false;
      this.time.delayedCall(900 * card.lines.length + 600, () => { ready = true; });
      if (card.title) this.time.delayedCall(4000, () => page.add(this.add.text(width / 2, height - 24, this.sys.game.device.input.touch ? 'Tap to return to the start' : 'Click or press any key to return to the start', { fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#8a8478' }).setOrigin(0.5)));
    };
    const next = () => {
      if (!ready) return;
      if (i >= cards.length - 1) { cleanup(); this.scene.start('Start'); return; }
      show();
    };
    const cleanup = () => { window.removeEventListener('pointerup', next); window.removeEventListener('keydown', next); };
    window.addEventListener('pointerup', next);
    window.addEventListener('keydown', next);
    this.events.once('shutdown', cleanup);
    show();
  }
}
