// Hover the hero mark and it grows hyphae: branching threads that seek the
// cursor, fuse where two colonies meet, and carry violet pulses back home.
(() => {
  const wrap = document.querySelector('.hero-mark-wrap');
  if (!wrap || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const img = wrap.querySelector('img');
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');

  // Node centres in the source image (621 x 441), found from the logo itself.
  const SRC_W = 621;
  const NODES = [
    { x: 499, y: 61, sage: true },
    { x: 137, y: 72 },
    { x: 346, y: 196 },
    { x: 547, y: 242 },
    { x: 68, y: 329, sage: true },
    { x: 300, y: 352 },
    { x: 537, y: 381 },
  ];
  const DARK = '33, 45, 40';
  const SAGE = '125, 147, 106';
  const SPORE = '179, 162, 255';
  const MAX_TIPS = 90;
  const CELL = 7;

  let W, H, dpr, ox, oy, scale;
  let tips = [], pulses = [], knots = [], grid = new Map();
  let trail;             // offscreen canvas holding everything grown so far
  let tctx;
  let mouse = null;
  let active = false, alpha = 0, raf = 0, grown = 0;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = trail.width = W * dpr;
    canvas.height = trail.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ir = img.getBoundingClientRect();
    ox = ir.left - r.left; oy = ir.top - r.top;
    scale = ir.width / SRC_W;
    reset();
  }

  function reset() {
    tips = []; pulses = []; knots = []; grid = new Map(); grown = 0;
    tctx.clearRect(0, 0, W, H);
  }

  function seed() {
    NODES.forEach((n, root) => {
      const x = ox + n.x * scale, y = oy + n.y * scale;
      const count = root === 2 ? 2 : 3;
      for (let i = 0; i < count; i++) {
        spawn(x, y, Math.random() * Math.PI * 2, root, n.sage ? SAGE : DARK, 0);
      }
    });
  }

  function spawn(x, y, angle, root, color, gen) {
    if (tips.length >= MAX_TIPS) return;
    tips.push({ x, y, angle, root, color, gen, age: 0, path: [[x, y]],
      speed: 0.9 + Math.random() * 0.7, life: 140 + Math.random() * 160 - gen * 25 });
  }

  function claim(t) {
    const key = ((t.x / CELL) | 0) + ',' + ((t.y / CELL) | 0);
    const owner = grid.get(key);
    if (owner === undefined) { grid.set(key, t.root); return false; }
    return owner !== t.root && t.age > 45 && knots.length < 14;   // another colony already lives here
  }

  // Carry a pulse from the tip back home, staggered so they don't travel in a clump.
  function sendHome(t) {
    if (pulses.length < 26) pulses.push({ path: t.path.slice().reverse(), i: -Math.random() * 30 });
  }

  function step() {
    const next = [];
    for (const t of tips) {
      // Wander, then lean toward the cursor like hyphae following nutrients.
      t.angle += (Math.random() - 0.5) * 0.45;
      if (mouse) {
        // A tip that reaches the cursor has found food: it stops and sends a pulse home.
        if (Math.hypot(mouse.x - t.x, mouse.y - t.y) < 18) {
          if (t.path.length > 6) sendHome(t);
          continue;
        }
        const want = Math.atan2(mouse.y - t.y, mouse.x - t.x);
        let d = want - t.angle;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        t.angle += d * 0.045;
      }
      const px = t.x, py = t.y;
      t.x += Math.cos(t.angle) * t.speed;
      t.y += Math.sin(t.angle) * t.speed;
      t.age++;

      const width = Math.max(0.5, 1.7 - t.gen * 0.35 - t.age / 400);
      tctx.strokeStyle = `rgba(${t.color}, ${0.62 - t.gen * 0.08})`;
      tctx.lineWidth = width;
      tctx.lineCap = 'round';
      tctx.beginPath(); tctx.moveTo(px, py); tctx.lineTo(t.x, t.y); tctx.stroke();
      grown++;
      if (t.age % 4 === 0) t.path.push([t.x, t.y]);

      const out = t.x < 2 || t.y < 2 || t.x > W - 2 || t.y > H - 2;
      if (claim(t)) {                       // anastomosis: two colonies fuse
        knots.push({ x: t.x, y: t.y, r: 0 });
        sendHome(t);
        continue;
      }
      if (out || t.age > t.life) {
        if (t.path.length > 8 && Math.random() < 0.5) sendHome(t);
        continue;
      }
      if (Math.random() < 0.022 && t.gen < 4) {
        const side = Math.random() < 0.5 ? -1 : 1;
        spawn(t.x, t.y, t.angle + side * (0.45 + Math.random() * 0.5), t.root, t.color, t.gen + 1);
      }
      next.push(t);
    }
    tips = next;   // branches spawned mid-loop were iterated too, so they're in next
    // Keep the colony alive while hovered: occasionally sprout from a node.
    if (active && tips.length < 12 && grown < 9000) {
      const n = NODES[(Math.random() * NODES.length) | 0];
      spawn(ox + n.x * scale, oy + n.y * scale, Math.random() * Math.PI * 2,
        NODES.indexOf(n), n.sage ? SAGE : DARK, 0);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = alpha;
    ctx.drawImage(trail, 0, 0, W, H);

    // Growing tips glow faintly.
    ctx.fillStyle = `rgba(${SPORE}, 0.9)`;
    for (const t of tips) { ctx.beginPath(); ctx.arc(t.x, t.y, 1.3, 0, 7); ctx.fill(); }

    // Fusion knots swell into small nodes.
    for (const k of knots) {
      k.r = Math.min(3, k.r + 0.2);
      ctx.fillStyle = `rgba(${SPORE}, 0.9)`;
      ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, 7); ctx.fill();
    }

    // Pulses travel back along the threads toward the logo.
    pulses = pulses.filter((p) => {
      p.i += 0.9;
      if (p.i < 0) return true;
      const j = Math.floor(p.i);
      if (j >= p.path.length - 1) return false;
      const [ax, ay] = p.path[j], [bx, by] = p.path[j + 1], f = p.i - j;
      const x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
      g.addColorStop(0, 'rgba(90, 63, 207, 1)');
      g.addColorStop(0.35, `rgba(${SPORE}, 0.75)`);
      g.addColorStop(1, `rgba(${SPORE}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;
  }

  function frame() {
    if (active) {
      alpha = Math.min(1, alpha + 0.08);
      step(); step();
    } else {
      alpha = Math.max(0, alpha - 0.025);   // the network sinks back into the soil
      if (tips.length) tips = [];
    }
    draw();
    if (active || alpha > 0) raf = requestAnimationFrame(frame);
    else { raf = 0; reset(); ctx.clearRect(0, 0, W, H); }
  }

  function start() {
    if (active) return;
    if (!alpha) { resize(); seed(); }
    active = true;
    wrap.classList.add('alive');
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function stop() {
    active = false;
    mouse = null;
    wrap.classList.remove('alive');
  }

  trail = document.createElement('canvas');
  tctx = trail.getContext('2d');

  img.addEventListener('pointerenter', start);
  img.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { start(); setTimeout(stop, 3500); } });
  addEventListener('pointermove', (e) => {
    if (!active || e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) return stop();
    mouse = { x, y };
  });
  addEventListener('resize', () => { if (alpha) { stop(); alpha = 0; } });
})();
