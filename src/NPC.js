// People (and Spike) in the grey-box: coloured shapes with a name.
const CAST = {
  jenny:  { name: 'JENNY',  body: 0xb03030, head: 0xe8c8a8, hair: 0xe8d070 }, // red skirt, blonde
  walter: { name: 'PA',     body: 0x4a6aa0, head: 0xd8b898, hair: 0xc8c8c8 }, // blue checked shirt, grey
  jason:  { name: 'JASON',  body: 0x3a8a8a, head: 0xe0c0a0, hair: 0xc06a30 }, // copper curls
  jean:   { name: 'JEAN',   body: 0xd0d0e0, head: 0xe8d0c0, hair: 0x5a3a20 }, // thick brown hair
  spike:  { name: 'SPIKE',  dog: true, body: 0xc8a060 },                      // old Labrador
  venn:   { name: 'DETECTIVE VENN', body: 0x3a3a46, head: 0xd8b898, hair: 0x2a2018 }, // dark coat
  ruth:   { name: 'RUTH HALE', body: 0x262626, head: 0xd8c0a8, hair: 0xd8d8d8 },   // black dress, white bun
  michael: { name: 'MICHAEL', body: 0xe8e8e0, head: 0xc89a78, hair: 0x2a1a10 },
};

class NPC {
  constructor(scene, id, x, y) {
    this.s = scene;
    this.id = id;
    this.look = CAST[id];
    this.name = this.look.name;
    const c = scene.add.container(x, y).setDepth(14);
    if (this.look.dog) {
      c.add(scene.add.rectangle(0, 2, 12, 6, this.look.body));
      this.head = scene.add.rectangle(6, 0, 5, 5, this.look.body);
      c.add(this.head);
      c.add(scene.add.rectangle(-7, 0, 3, 2, this.look.body)); // tail
    } else {
      c.add(scene.add.rectangle(0, 1, 9, 10, this.look.body));
      c.add(scene.add.circle(0, -5, 3.5, this.look.head));
      this.hair = scene.add.rectangle(0, -8, 7, 3, this.look.hair);
      c.add(this.hair);
    }
    this.c = c;
  }

  get x() { return this.c.x; }
  get y() { return this.c.y; }

  place(x, y) { this.c.setPosition(x, y); return this; }

  // Walk through a list of points: [[x, y], ...] in pixels. Resolves on arrival.
  walk(points, speed = 40) {
    return new Promise(res => {
      const next = (i) => {
        if (i >= points.length || !this.c.active) { res(); return; }
        const [x, y] = points[i];
        const d = Phaser.Math.Distance.Between(this.c.x, this.c.y, x, y);
        if (this.look.dog) this.c.scaleX = x < this.c.x ? -1 : 1;
        this.s.tweens.add({ targets: this.c, x, y, duration: Math.max(1, d / speed * 1000), onComplete: () => next(i + 1) });
      };
      next(0);
    });
  }

  say(text, ms = 3000) {
    return this.s.bubble(this.c.x, this.c.y - 10, text, ms, this.name, true);
  }

  setVisible(v) { this.c.setVisible(v); return this; }
  destroy() { this.c.destroy(); }
}
