document.documentElement.classList.add('js');

const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointer = { x: -9999, y: -9999 };
addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

scatterName(document.querySelector('.name'), { maxSize: () => innerWidth * (innerWidth < 760 ? .22 : .11) });

/* ---------- the speech waveform behind the hero ---------- */
const wave = document.querySelector('.wave');
// IPA symbols, from the lightest ink to the densest; each step holds a few so the wave reads as speech
const ramp = [' ', 'ˈˌː', 'ɪʊɾ', 'ʃʒʔ', 'əɛɔ', 'ŋθð', 'æɑɒ', 'ɡɲʁ', 'ɮɸβ', 'ʘɶœ'];
// Drawn on a canvas, one symbol per fixed cell, so Sono's slightly different IPA widths can't break the grid
const CELL_W = 9, CELL_H = 18;
const pen = wave.getContext('2d');
let cols = 0, lines = 0, waveOn = true, lastFrame = 0, lastT = 4;

function sizeWave() {
  const ratio = devicePixelRatio || 1;
  wave.width = Math.round(wave.clientWidth * ratio);
  wave.height = Math.round(wave.clientHeight * ratio);
  pen.setTransform(ratio, 0, 0, ratio, 0, 0);
  cols = Math.ceil(wave.clientWidth / CELL_W);
  lines = Math.ceil(wave.clientHeight / CELL_H);
}

// Syllable-sized bursts inside word-sized bursts, with real silences between
function loudness(u) {
  const phrase = Math.max(0, Math.sin(u * 2.1) + Math.sin(u * 0.83 + 1) * .7 + .25);
  const syllable = .55 + .45 * Math.sin(u * 13 + Math.sin(u * 3) * 2);
  return Math.min(1, phrase * syllable);
}

function drawWave(t) {
  const mid = lines * .46;
  const mx = pointer.x / innerWidth;
  const amps = [];
  for (let c = 0; c < cols; c++) {
    const x = c / cols;
    const near = pointer.y < innerHeight ? Math.exp(-(((x - mx) / .09) ** 2)) : 0;
    amps.push((.05 + loudness(x * 6 - t * .35)) * lines * .42 * (1 + near * .55));
  }
  lastT = t;
  pen.clearRect(0, 0, wave.clientWidth, wave.clientHeight);
  pen.font = '400 15px Sono';
  pen.fillStyle = getComputedStyle(wave).color;
  pen.textAlign = 'center';
  pen.textBaseline = 'middle';
  for (let r = 0; r < lines; r++) {
    const dist = Math.abs(r - mid);
    for (let c = 0; c < cols; c++) {
      const d = dist / amps[c];
      if (d >= 1) continue;
      const grain = Math.sin(c * 12.9898 + r * 78.233) * .5 + .5;
      const step = ramp[Math.min(9, Math.floor(((1 - d) * .75 + grain * .35) * 10))];
      pen.fillText(step[(c * 7 + r * 13) % step.length], c * CELL_W + CELL_W / 2, r * CELL_H + CELL_H / 2);
    }
  }
}

function loop(now) {
  if (waveOn && now - lastFrame > 70) { lastFrame = now; drawWave(now / 1000); }
  requestAnimationFrame(loop);
}

sizeWave();
addEventListener('resize', () => { sizeWave(); drawWave(lastT); });
document.fonts?.load('400 15px Sono', ramp.join('')).then(() => drawWave(lastT));
if (calm) drawWave(4);
else {
  new IntersectionObserver(([e]) => { waveOn = e.isIntersecting; }).observe(wave);
  requestAnimationFrame(loop);
}

/* ---------- the transcript plays when it reaches the screen ---------- */
const transcript = document.querySelector('.transcript');
new IntersectionObserver(([e], io) => {
  if (e.isIntersecting) { transcript.classList.add('is-in'); io.disconnect(); }
}, { threshold: .4 }).observe(transcript);

/* ---------- personal projects: the tiles drift gently away from the cursor, each at its own depth ---------- */
const stage = document.querySelector('.stage');
if (stage && !calm && matchMedia('(hover: hover)').matches) {
  stage.addEventListener('pointermove', e => {
    const b = stage.getBoundingClientRect();
    stage.style.setProperty('--px', (((e.clientX - b.left) / b.width - .5) * -18).toFixed(2));
    stage.style.setProperty('--py', (((e.clientY - b.top) / b.height - .5) * -18).toFixed(2));
  });
  stage.addEventListener('pointerleave', () => {
    stage.style.setProperty('--px', 0);
    stage.style.setProperty('--py', 0);
  });
}

/* ---------- photography: the tile opens the gallery; "close" or Esc shuts it ---------- */
document.querySelectorAll('[data-open]').forEach(btn => {
  const dialog = document.getElementById(btn.dataset.open);
  if (!dialog) return;
  btn.addEventListener('click', () => { dialog.showModal(); dialog.scrollTop = 0; });
  dialog.querySelector('.close')?.addEventListener('click', () => dialog.close());
});

/* ---------- on narrow screens the header grows to fit the menu; the page starts right below it ---------- */
const header = document.querySelector('.top');
function fitHeader() {
  const root = document.documentElement, was = root.style.getPropertyValue('--top');
  if (innerWidth <= 900) root.style.setProperty('--top', header.offsetHeight + 'px');
  else root.style.removeProperty('--top');
  if (root.style.getPropertyValue('--top') !== was) dispatchEvent(new Event('resize'));
}
fitHeader();   // before the first paint, so the page never jumps
new ResizeObserver(fitHeader).observe(header);
addEventListener('resize', fitHeader);
