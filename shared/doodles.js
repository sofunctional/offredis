/* the book in "academic work": on hover a page lifts off the right-hand side, curls up as it
   crosses the spine, and settles on the left. Moving away turns it back from wherever it is. */
window.BOOK_TURN = [
  { transform: 'translateY(0) scaleX(1) skewY(0deg)' },
  { transform: 'translateY(-2px) scaleX(.62) skewY(-9deg)', offset: .3 },
  { transform: 'translateY(-5px) scaleX(.02) skewY(-15deg)', offset: .5 },
  { transform: 'translateY(-2px) scaleX(-.62) skewY(-9deg)', offset: .7 },
  { transform: 'translateY(0) scaleX(-1) skewY(0deg)' }
];
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.doodle.book').forEach(book => {
    const page = book.querySelector('.page');
    if (!page) return;
    let turn = null;
    book.addEventListener('pointerenter', () => {
      if (!turn) turn = page.animate(window.BOOK_TURN, { duration: 900, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' });
      else { turn.updatePlaybackRate(1); turn.play(); }
    });
    book.addEventListener('pointerleave', () => {
      if (turn) { turn.updatePlaybackRate(-1); turn.play(); }
    });
  });
})();

/* the "ciao" hands: hovering the hand, or the word beside it, makes it wave from the wrist.
   It keeps waving while the cursor stays, and on leaving it completes the swing it is in,
   so it always comes to rest smoothly instead of snapping back. */
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const swings = [
    { transform: 'rotate(0deg)' },
    { transform: 'rotate(16deg)', offset: .2 },
    { transform: 'rotate(-8deg)', offset: .45 },
    { transform: 'rotate(13deg)', offset: .7 },
    { transform: 'rotate(0deg)' }
  ];
  document.querySelectorAll('.hand').forEach(hand => {
    const palm = hand.querySelector('.palm');
    const trigger = hand.closest('.ciao, .title') || hand;
    let wave = null;
    trigger.addEventListener('pointerenter', () => {
      if (wave && wave.playState === 'running') { wave.effect.updateTiming({ iterations: Infinity }); return; }
      wave = palm.animate(swings, { duration: 1300, easing: 'ease-in-out', iterations: Infinity });
    });
    trigger.addEventListener('pointerleave', () => {
      if (!wave) return;
      const done = wave.effect.getComputedTiming().currentIteration || 0;
      wave.effect.updateTiming({ iterations: done + 1 });   // finish this swing, then rest
    });
  });
})();
