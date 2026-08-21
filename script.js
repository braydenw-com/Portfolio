/* ═══════════════════════════════════════════════════════════════════════════
   braydenw.com — no libraries.

   The one interaction lives in warp(): run a cursor across the word
   "enjoyable." and each letter responds in proportion to how close you are.
   Everything else here is housekeeping.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine)').matches;

  /* ── "enjoyable." — one span per letter ──────────────────────────────── */
  var joy = document.getElementById('joy');
  var chars = [];

  /* Split an element into per-letter spans. Words stay whole — only the
     spaces between them are break points, otherwise a line could snap in
     the middle of a word. */
  function split(el) {
    var out = [];
    var phrase = el.dataset.word || el.textContent;

    el.textContent = '';
    el.setAttribute('aria-label', phrase);

    phrase.split(' ').forEach(function (w, wi) {
      if (wi) el.appendChild(document.createTextNode(' '));

      var grp = document.createElement('span');
      grp.className = 'word';

      w.split('').forEach(function (c) {
        var sp = document.createElement('span');
        sp.className = 'ch';
        sp.textContent = c;
        sp.setAttribute('aria-hidden', 'true');
        grp.appendChild(sp);
        out.push(sp);
      });

      el.appendChild(grp);
    });

    return out;
  }

  if (joy) chars = split(joy);

  var queued = false, mx = 0;

  function warp() {
    queued = false;
    for (var i = 0; i < chars.length; i++) {
      var b = chars[i].getBoundingClientRect();
      var d = Math.abs((b.left + b.width / 2) - mx);
      /* falls off over ~8rem, so two or three letters move at a time */
      var n = Math.max(0, 1 - d / 130);
      chars[i].style.setProperty('--n', n.toFixed(3));
      chars[i].style.setProperty('--w', (96 - n * 14).toFixed(1));
      chars[i].style.setProperty('--g', (600 - n * 240).toFixed(0));
    }
  }

  function settle() {
    chars.forEach(function (c) {
      c.style.setProperty('--n', 0);
      c.style.setProperty('--w', 96);
      c.style.setProperty('--g', 600);
    });
  }

  function pulse(c, on) {
    c.style.setProperty('--n', on ? 1 : 0);
    c.style.setProperty('--w', on ? 82 : 96);
    c.style.setProperty('--g', on ? 360 : 600);
  }

  if (joy && chars.length && !calm) {
    if (fine) {
      /* Listen on the whole hero so the word reacts as you approach it. */
      var field = document.querySelector('.hero') || document;
      field.addEventListener('pointermove', function (e) {
        mx = e.clientX;
        if (!queued) { queued = true; requestAnimationFrame(warp); }
      });
      field.addEventListener('pointerleave', settle);
    }

    /* Tap or click it and it waves once, left to right. */
    joy.addEventListener('click', function () {
      chars.forEach(function (c, i) {
        setTimeout(function () {
          pulse(c, true);
          setTimeout(function () { pulse(c, false); }, 260);
        }, i * 45);
      });
    });
  }

  /* ── Mark the nav link for the page you're on ─────────────────────────
     The nav is one shared partial, so nothing in the markup knows which
     page it is. Links that point at a section (anything with a #) are
     skipped — only whole-page links can be "current". */
  var thisPage = location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav__links a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.indexOf('#') > -1) return;
    if (href === thisPage) a.setAttribute('aria-current', 'page');
  });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  console.log(
    '%cHey.%c You opened the console, so we should probably talk.\nbrayden@braydenw.com',
    'font:700 20px "Bricolage Grotesque",sans-serif;color:#1b4dff',
    'font:14px/1.6 "Open Sans",system-ui;color:#1c1c1c'
  );
})();
