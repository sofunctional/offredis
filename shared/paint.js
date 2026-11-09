/* painted titles are static: this only sizes each word once Sono has loaded */
(() => {
  function fitWords() {
    document.querySelectorAll('.paint').forEach(svg => {
      // a title may be painted on more than one line; each extra line adds 100 units
      const lines = [...svg.querySelectorAll('text')];
      const width = Math.ceil(Math.max(...lines.map(t => t.getComputedTextLength()))) + 4;
      const height = 112 + 100 * (lines.length - 1);
      if (lines.length > 1) lines.forEach(t => t.setAttribute('x', width / 2));
      svg.setAttribute('viewBox', `0 16 ${width} ${height}`);
      const swipe = svg.querySelector('.swipe');
      swipe.setAttribute('d', `M-20 ${16 + height / 2}H${width + 20}`);
      if (lines.length > 1) swipe.style.strokeWidth = height + 40;
    });
  }
  fitWords();
  document.fonts?.load('600 100px Sono').then(fitWords);
  document.fonts?.ready.then(fitWords);
})();
