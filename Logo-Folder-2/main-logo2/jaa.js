// Letter setup — X split into two closed paths so the full letter draws correctly
var letters = [
  { el: document.querySelector('#svgX1'), offset: 0 },
  { el: document.querySelector('#svgX2'), offset: 0 },
  { el: document.querySelector('#svgO'), offset: 0 },
  { el: document.querySelector('#svgR'), offset: 0 },
  { el: document.querySelector('#svgA1'), offset: 0 },
  { el: document.querySelector('#svgY'), offset: 0 },
  { el: document.querySelector('#svgA2'), offset: 0 }
];

var STROKE_DURATION = 3200; // ms — ultra smooth, gentle draw
var FILL_PAUSE = 300;       // ms — soft beat before gentle fill

letters.forEach(function (letter) {
  var len = letter.el.getTotalLength();
  letter.offset = len;
  letter.len = len;
  letter.el.style.strokeDasharray = len;
  letter.el.style.strokeDashoffset = len;
});

window.onload = function () {
  var startTime = null;

  // Ultra-smooth custom cubic-bezier (0.4, 0.0, 0.2, 1) ease curve
  function smoothEase(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function offsetMe(timestamp) {
    if (!startTime) startTime = timestamp;

    var elapsed = timestamp - startTime;
    var progress = Math.min(elapsed / STROKE_DURATION, 1);
    var eased = smoothEase(progress);

    letters.forEach(function (letter) {
      var offset = letter.len * (1 - eased);
      letter.el.style.strokeDashoffset = offset;
    });

    if (progress < 1) {
      requestAnimationFrame(offsetMe);
    } else {
      // Ensure every path is fully drawn
      letters.forEach(function (letter) {
        letter.el.style.strokeDashoffset = 0;
      });

      // Pause gently, then trigger smooth staggered fill
      setTimeout(function () {
        document.body.classList.add('stroke-complete');
      }, FILL_PAUSE);
    }
  }

  requestAnimationFrame(offsetMe);
};
