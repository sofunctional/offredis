/* soft arrows. On hover, an arrow leaves its link and goes soft:
   data-arrow="drop"  is kicked off the button and falls to the bottom of the screen, spinning and melting,
                      settles gently, and climbs back the same way, firming up again;
   data-arrow="shoot" is shot the way it points, glides to a stop at the screen edge, and comes back.
   Every trip follows a new random path, flying in the palette's light green. Clicking a link just opens it. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const between = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // slow away, quick in the middle, slowing again as it reaches the edge: no bounce
  const glide = t => t < .5 ? 2 * t * t : 1 - 2 * (1 - t) ** 2;

  /* kicked off the button: a small hop sideways, then a curving fall to the bottom of the screen,
     spinning on itself and going soft like it is melting. It eases onto the floor without bouncing. */
  function dropPath(box) {
    const floor = innerHeight - box.height - 12 - box.top;
    const roomLeft = box.left - 12, roomRight = innerWidth - box.right - 12;
    // kicked mostly towards the side with more room, a different distance every time
    const dir = roomLeft > roomRight ? -1 : 1;
    const reach = clamp(between(.35, .75) * (dir < 0 ? roomLeft : roomRight), 40, Math.max(40, dir < 0 ? roomLeft : roomRight));
    const hop = between(26, 40);
    const turns = dir * between(380, 640);                      // one to two spins
    const wobble = between(2.5, 4), phase = between(0, Math.PI);
    const smooth = t => t * t * (3 - 2 * t);                    // slow out of the kick, fast mid-air, gentle landing
    const frames = [], steps = 32;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = dir * reach * (1 - (1 - t) ** 2);                // flung sideways, losing speed
      // the kick lifts it first; gravity takes over a moment later
      const y = floor * smooth(clamp((t - .1) / .9, 0, 1)) - hop * Math.sin(Math.PI * Math.min(t / .32, 1));
      const spin = turns * (1 - (1 - t) ** 1.6) + Math.sin(t * Math.PI * wobble + phase) * 10 * Math.sin(Math.PI * t);
      // jelly: it ripples in flight and slowly slumps, landing a little melted
      const ripple = Math.sin(t * Math.PI * 5 + phase) * .22 * Math.sin(Math.PI * t);
      const sx = (1 + .25 * t) * (1 + ripple), sy = (1 - .3 * t) * (1 - ripple);
      const skew = Math.sin(t * Math.PI * 3 + phase) * 14 * Math.sin(Math.PI * t);
      frames.push({ transform: `translate(${x}px, ${y}px) rotate(${spin}deg) skewX(${skew}deg) scale(${sx}, ${sy})`, offset: t });
    }
    return { frames, origin: '50% 50%', duration: 1700 };
  }

  function shootPath(box) {
    // ↗ points up and to the right; it flies until it meets the top or right edge of the screen
    const angle = -45, ux = Math.SQRT1_2, uy = -Math.SQRT1_2;
    const reach = Math.min(innerWidth - box.right - 12, box.top - 12) * Math.SQRT2;
    const at = (d, side, along, across) =>
      `translate(${d * ux - side * uy}px, ${d * uy + side * ux}px) rotate(${angle}deg) scale(${along}, ${across}) rotate(${-angle}deg)`;
    const amp = between(6, 14) * (Math.random() < .5 ? -1 : 1), waves = between(1, 2);
    const frames = [{ transform: at(0, 0, 1, 1), offset: 0 }];
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const d = reach * (1 - (1 - t) ** 3);                         // shot fast, gliding to a stop at the edge
      const along = 1 + Math.sin(t * Math.PI) * .6;                  // stretched in flight, back to shape on arrival
      // the sway fades out early, so it settles onto the edge without drifting back
      frames.push({ transform: at(d, Math.sin(t * Math.PI * waves) * amp * (1 - t) ** 3, along, 1 / Math.sqrt(along)), offset: t });
    }
    return { frames, origin: '50% 50%', duration: 1000 };
  }

  document.querySelectorAll('[data-arrow]').forEach(link => {
    const arrow = link.querySelector('.arrow');
    if (!arrow) return;
    let busy = false;

    link.addEventListener('pointerenter', e => {
      if (e.pointerType !== 'mouse' || busy) return;
      busy = true;

      const box = arrow.getBoundingClientRect();
      const look = getComputedStyle(arrow);
      const path = (link.dataset.arrow === 'shoot' ? shootPath : dropPath)(box);

      const flyer = document.createElement('span');
      flyer.textContent = arrow.textContent;
      flyer.setAttribute('aria-hidden', 'true');
      Object.assign(flyer.style, {
        position: 'fixed', left: box.left + 'px', top: box.top + 'px', zIndex: 95,
        fontFamily: look.fontFamily, fontSize: look.fontSize,
        fontVariationSettings: look.fontVariationSettings, fontWeight: 700,
        lineHeight: box.height + 'px', transformOrigin: path.origin,
        color: '#8DF688', pointerEvents: 'none'
      });
      document.body.append(flyer);
      arrow.style.visibility = 'hidden';

      const trip = flyer.animate(path.frames, { duration: path.duration, easing: 'linear', fill: 'forwards' });
      trip.finished.then(() => new Promise(done => setTimeout(done, 700))).then(() => {
        trip.reverse();                       // back exactly the way it came
        return trip.finished;
      }).then(() => {
        flyer.remove();
        arrow.style.visibility = '';
        busy = false;
      });
    });
  });
})();
