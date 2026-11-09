/* "sofia": fits its container and, on the home page, reacts to the cursor like a magnet:
   letters near the pointer lean away from it and follow its movement, then settle back home.
   options.maxSize returns the largest allowed font size in px.
   options.interactive: false keeps the name still. */
function scatterName(name, options = {}) {
  name.style.whiteSpace = 'nowrap';

  function fit() {
    const box = name.parentElement, cs = getComputedStyle(box);
    const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    // Scale from the current size: jumping to a big test size can stretch the page on phones
    let size = parseFloat(getComputedStyle(name).fontSize) * room / name.offsetWidth;
    if (options.maxSize) size = Math.min(size, options.maxSize());
    name.style.fontSize = size + 'px';
  }
  fit();
  document.fonts?.load('500 100px Sono').then(fit);
  document.fonts?.ready.then(fit);
  addEventListener('resize', fit);

  if (options.interactive === false || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  name.classList.add('can-scatter');

  const letters = [...name.children].map(el => ({ el, x: 0, y: 0, r: 0, s: 1, vx: 0, vy: 0, vr: 0, vs: 0, tx: 0, ty: 0, tr: 0, ts: 1, home: null }));
  const pointer = { x: -9999, y: -9999 };
  let running = false, last = 0;

  // each letter's resting centre, in page coordinates, measured once rather than every frame
  function measure() {
    letters.forEach(l => {
      const b = l.el.getBoundingClientRect();
      l.home = { x: b.left + b.width / 2 - l.x + scrollX, y: b.top + b.height / 2 - l.y + scrollY, h: b.height };
    });
  }
  const remeasure = () => requestAnimationFrame(measure);
  document.fonts?.ready.then(remeasure);
  addEventListener('resize', remeasure);
  addEventListener('load', remeasure);

  // a critically damped spring: it follows smoothly and never overshoots or wobbles
  function spring(l, stiff, dt) {
    const damp = 2 * Math.sqrt(stiff);
    for (const [p, v, t] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty'], ['r', 'vr', 'tr'], ['s', 'vs', 'ts']]) {
      l[v] += ((l[t] - l[p]) * stiff - l[v] * damp) * dt;
      l[p] += l[v] * dt;
    }
  }

  function step(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    if (!letters[0].home) measure();
    let busy = false;
    for (const l of letters) {
      const dx = l.home.x - scrollX - pointer.x, dy = l.home.y - scrollY - pointer.y;
      const d = Math.hypot(dx, dy) || 1, reach = Math.max(220, l.home.h * 2.2);
      const push = d < reach ? (1 - d / reach) ** 1.5 : 0;           // stronger the closer the cursor is
      l.tx = dx / d * push * reach * .55;
      l.ty = dy / d * push * reach * .55;
      l.tr = dx / d * push * 18;
      l.ts = 1 - push * .12;
      spring(l, 90, dt);
      l.el.style.transform = `translate3d(${l.x}px, ${l.y}px, 0) rotate(${l.r}deg) scale(${l.s})`;
      if (push > 0 || Math.abs(l.x) + Math.abs(l.y) + Math.abs(l.vx) + Math.abs(l.vy) > .2) busy = true;
    }
    name.classList.toggle('is-active', busy);
    // only keep animating while the cursor is near or a letter is still settling
    if (busy) requestAnimationFrame(step);
    else {
      running = false;
      letters.forEach(l => { Object.assign(l, { x: 0, y: 0, r: 0, s: 1, vx: 0, vy: 0, vr: 0, vs: 0 }); l.el.style.transform = ''; });
    }
  }

  function wake() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(step);
  }

  function near(x, y) {
    const b = name.getBoundingClientRect(), pad = 260;
    return x > b.left - pad && x < b.right + pad && y > b.top - pad && y < b.bottom + pad;
  }

  addEventListener('pointermove', e => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (near(e.clientX, e.clientY)) wake();
  }, { passive: true });
  addEventListener('pointerdown', e => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (near(e.clientX, e.clientY)) wake();
  }, { passive: true });
  // a finger lifting, or the cursor leaving the window, lets the letters settle back
  const release = e => { if (!e || e.pointerType !== 'mouse') { pointer.x = pointer.y = -9999; wake(); } };
  addEventListener('pointerup', release, { passive: true });
  addEventListener('pointercancel', release, { passive: true });
  document.addEventListener('mouseleave', () => { pointer.x = pointer.y = -9999; wake(); });
  addEventListener('scroll', () => { if (running) wake(); }, { passive: true });
}
