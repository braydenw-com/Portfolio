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

  /* ── Mobile menu ──────────────────────────────────────────────────────
     The panel only exists below 40rem; above that the links live in the bar
     and this does nothing. Escape closes it, so does tapping a link or
     anywhere outside, and focus goes back to the toggle on the way out. */
  var burger = document.getElementById('burger');
  var navBar = document.getElementById('nav');
  var panel  = document.getElementById('nav-links');

  if (burger && navBar && panel) {
    var narrow = matchMedia('(max-width: 40rem)');

    var setMenu = function (open) {
      navBar.dataset.open = open ? 'true' : 'false';
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      /* stop the page scrolling behind the panel */
      document.body.style.overflow = open ? 'hidden' : '';
    };

    var close = function (returnFocus) {
      if (navBar.dataset.open !== 'true') return;
      setMenu(false);
      if (returnFocus) burger.focus();
    };

    burger.addEventListener('click', function () {
      var open = navBar.dataset.open !== 'true';
      setMenu(open);
      if (!open) return;

      /* The panel animates out of visibility:hidden, and a hidden element
         can't take focus — so wait for the transition before moving it. */
      var first = panel.querySelector('a');
      if (!first) return;

      if (calm) { first.focus(); return; }
      var done = function () { first.focus(); panel.removeEventListener('transitionend', done); };
      panel.addEventListener('transitionend', done);
      setTimeout(done, 400);            /* in case transitionend never fires */
    });

    /* a link either navigates or jumps down the page — either way, close */
    panel.addEventListener('click', function (e) {
      if (e.target.closest('a')) close(false);
    });

    addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close(true);
    });

    document.addEventListener('click', function (e) {
      if (navBar.dataset.open !== 'true') return;
      if (!navBar.contains(e.target)) close(false);
    });

    /* if the window grows past the breakpoint while it's open, the panel
       stops existing — make sure the scroll lock goes with it */
    var onWidth = function () { if (!narrow.matches) close(false); };
    if (narrow.addEventListener) narrow.addEventListener('change', onWidth);
    else narrow.addListener(onWidth);
  }

  /* ── The email copies itself ──────────────────────────────────────── */
  var mail = document.getElementById('mail');
  var note = document.getElementById('mail-note');

  if (mail && note) {
    var resetAt;

    mail.addEventListener('click', function () {
      var address = mail.dataset.mail;

      var done = function (ok) {
        note.textContent = ok ? 'copied — now go say something' : address;
        mail.dataset.copied = 'true';
        clearTimeout(resetAt);
        resetAt = setTimeout(function () {
          note.textContent = 'click to copy';
          mail.dataset.copied = 'false';
        }, 2600);
      };

      if (navigator.clipboard && isSecureContext) {
        navigator.clipboard.writeText(address).then(
          function () { done(true); },
          function () { done(false); }
        );
      } else {
        /* older browsers, or an insecure origin */
        var t = document.createElement('textarea');
        t.value = address;
        t.setAttribute('readonly', '');
        t.style.cssText = 'position:absolute;left:-9999px';
        document.body.appendChild(t);
        t.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(t);
        done(ok);
      }
    });
  }

  /* ── Mark the nav link for the page you're on ─────────────────────────
     The nav is one shared partial, so nothing in the markup knows which
     page it is. Links that point at a section (anything with a #) are
     skipped — only whole-page links can be "current". */
  /* URLs are directories now (/about, not /about.html), so compare the
     path with the slashes stripped off both sides. */
  var trim = function (s) { return (s || '').split('#')[0].replace(/^\/+|\/+$/g, ''); };
  var thisPage = trim(location.pathname);

  document.querySelectorAll('.nav__links a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.indexOf('#') > -1) return;          /* section links can't be "current" */
    var target = trim(href);
    if (target && target === thisPage) a.setAttribute('aria-current', 'page');
  });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  console.log(
    '%cHey.%c You opened the console, so we should probably talk.\nbrayden@braydenw.com',
    'font:700 20px "Bricolage Grotesque",sans-serif;color:#1b4dff',
    'font:14px/1.6 "Open Sans",system-ui;color:#1c1c1c'
  );
})();
