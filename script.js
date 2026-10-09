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

  /* ── Home: the name, edge to edge, and the light behind it ─────────── */
  /* Home: the pinned pill nav shows only once the top bar has scrolled away. */
  var hBar = document.getElementById('h-bar');
  var hPill = document.getElementById('h-pill-nav');
  if (hBar && hPill && 'IntersectionObserver' in window) {
    hPill.hidden = false;
    new IntersectionObserver(function (es) {
      var on = !es[0].isIntersecting;
      hPill.classList.toggle('is-on', on);
      hPill.setAttribute('aria-hidden', on ? 'false' : 'true');
      hPill.querySelectorAll('a').forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    }).observe(hBar);
  }

  var hHero = document.getElementById('h-hero');
  var hName = document.getElementById('h-name');

  if (hHero && hName) {
    /* Size the name so it spans the hero exactly, whatever the font. */
    var fit = function () {
      hHero.style.setProperty('--name-size', '10vw');
      var pad = parseFloat(getComputedStyle(hName).paddingLeft) * 2;
      var range = document.createRange();
      range.selectNodeContents(hName);
      var textW = range.getBoundingClientRect().width;
      if (!textW) return;
      var size = (hHero.clientWidth / 10) * (hHero.clientWidth - pad) / textW;
      hHero.style.setProperty('--name-size', (size * .995) + 'px');
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fit);
    addEventListener('resize', fit);

    /* The light: a horizon rim rising behind the name, drifting toward the
       cursor. Without WebGL the CSS gradient on .h-hero stands in. */
    var cv = document.getElementById('h-light');
    var gl = cv && cv.getContext('webgl', { antialias: false });
    if (cv && !gl) cv.remove();

    if (gl) {
      var fsrc = [
        'precision highp float;',
        'uniform vec2 res;uniform float t;uniform float mx;',
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
        ' return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
        'void main(){',
        ' vec2 uv=gl_FragCoord.xy;',
        ' vec2 q=(uv-vec2(res.x*.5+mx*res.x*.08,-res.y*.62))/res.y;',
        ' float r=length(q),a=atan(q.x,q.y);',
        ' float e=r-(1.06+.012*sin(t*.35));',
        ' float halo=exp(-max(e,0.)*1.9),rim=exp(-abs(e)*34.);',
        ' float rays=pow(n(vec2(a*11.+mx*.4,t*.05)),3.)*exp(-max(e,0.)*.8)*step(0.,e);',
        ' float beams=n(vec2(a*7.+mx*.6,t*.07))*.6+n(vec2(a*19.,t*.11))*.4;',
        ' float focus=exp(-abs(a-mx*.35)*2.2);',
        ' vec3 ink=vec3(.016,.024,.102),deep=vec3(.039,.078,.25);',
        ' vec3 blue=vec3(.106,.302,1.),coral=vec3(1.,.416,.302);',
        ' vec3 col=ink+blue*halo*(.5+.5*beams)*.9;',
        ' col+=coral*pow(halo,9.)*focus*.45;',
        ' col+=mix(vec3(.75,.85,1.),vec3(1.),focus)*rim*(.5+.55*focus);',
        ' col+=blue*(.5+.5*sin(r*120.-t*.5))*halo*.05;',
        ' col+=mix(blue,vec3(.82,.88,1.),.4)*rays*.7;',
        ' col=mix(col,mix(deep,ink,smoothstep(-.02,-.6,e)),smoothstep(0.,-.18,e)*.94);',
        ' col+=(h(uv+t)-.5)*.035;',
        ' gl_FragColor=vec4(col,1.);',
        '}'
      ].join('\n');
      var shader = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      var prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fsrc));
      gl.linkProgram(prog);

      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        cv.remove();
      } else {
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        var uRes = gl.getUniformLocation(prog, 'res'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'mx');

        var dpr = Math.min(devicePixelRatio || 1, 1.5), lx = 0, tx = 0, onScreen = true;
        var draw = function (ms) {
          lx += (tx - lx) * .04;
          gl.uniform2f(uRes, cv.width, cv.height);
          gl.uniform1f(uT, ms / 1000);
          gl.uniform1f(uM, lx);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
        var resize = function () {
          cv.width = hHero.clientWidth * dpr;
          cv.height = hHero.clientHeight * dpr;
          gl.viewport(0, 0, cv.width, cv.height);
          if (calm) draw(0);
        };
        resize();
        addEventListener('resize', resize);

        if (!calm) {
          hHero.addEventListener('pointermove', function (e) {
            var r = hHero.getBoundingClientRect();
            tx = ((e.clientX - r.left) / r.width - .5) * 2;
          });
          hHero.addEventListener('pointerleave', function () { tx = 0; });
          new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }).observe(hHero);
          (function loop(ms) { if (onScreen) draw(ms); requestAnimationFrame(loop); })(0);
        }
      }
    }
  }

  /* ── Slack case study: the live demos ─────────────────────────────────── */
  var toastAt = {};
  var toast = function (demo, text) {
    var t = demo.querySelector('[data-toast]');
    t.textContent = text;
    t.classList.add('is-on');
    clearTimeout(toastAt[demo.dataset.demo]);
    toastAt[demo.dataset.demo] = setTimeout(function () { t.classList.remove('is-on'); }, 2600);
  };

  var save = document.querySelector('[data-demo="save"]');
  if (save) {
    var state = { save: false, pin: false }, tab = 'save';
    var msg = save.querySelector('[data-msg]');
    var item = save.querySelector('[data-item]');
    var empty = save.querySelector('[data-empty]');
    var renderSave = function () {
      msg.classList.toggle('is-pin', state.pin);
      msg.classList.toggle('is-save', state.save && !state.pin);
      save.querySelectorAll('[data-act]').forEach(function (b) {
        var on = state[b.dataset.act];
        b.setAttribute('aria-pressed', String(on));
        b.dataset.tip = b.dataset.act === 'save'
          ? (on ? 'Remove from Saved for Me' : 'Save for Me')
          : (on ? 'Unpin from channel' : 'Pin for All');
      });
      save.querySelectorAll('[data-tab]').forEach(function (b) {
        b.setAttribute('aria-selected', String(b.dataset.tab === tab));
      });
      item.hidden = !state[tab];
      item.classList.toggle('is-pin', tab === 'pin');
      empty.hidden = state[tab];
      empty.firstChild.textContent = tab === 'save' ? 'No Saved for Me messages yet' : 'No Pinned for All messages yet';
      empty.querySelector('small').textContent = 'Click the ' + (tab === 'save' ? 'bookmark' : 'pin') + ' on the message to add it here';
    };
    save.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.act;
        state[k] = !state[k];
        tab = k;
        toast(save, k === 'save'
          ? (state.save ? 'This message was saved for you' : 'Message removed from Saved for Me')
          : (state.pin ? 'This message was pinned for everyone' : 'Message unpinned from channel'));
        renderSave();
      });
    });
    save.querySelectorAll('[data-tab]').forEach(function (b) {
      b.addEventListener('click', function () { tab = b.dataset.tab; renderSave(); });
    });
    renderSave();
  }

  var notif = document.querySelector('[data-demo="notif"]');
  if (notif) {
    var levels = JSON.parse(notif.dataset.init);
    var words = { all: 'All', mentions: 'Mentions', muted: 'Muted' };
    var notes = {
      all: 'You\u2019ll hear about every message in #design.',
      mentions: 'You\u2019ll only hear from #design when someone mentions you.',
      muted: 'You won\u2019t hear from #design at all until you unmute it.'
    };
    var pill = notif.querySelector('[data-pill]');
    var pillIcon = pill.querySelector('use');
    var renderNotif = function (changed) {
      var counts = { all: 0, mentions: 0, muted: 0 };
      notif.querySelectorAll('[data-ch]').forEach(function (row) {
        var lv = levels[row.dataset.ch];
        counts[lv]++;
        row.dataset.lv = lv;
        row.querySelectorAll('[data-lv]').forEach(function (b) {
          b.setAttribute('aria-checked', String(b.dataset.lv === lv));
        });
      });
      Object.keys(counts).forEach(function (k) {
        var n = notif.querySelector('[data-n="' + k + '"]');
        if (n.textContent !== String(counts[k]) && changed) {
          n.classList.remove('is-bump'); void n.offsetWidth; n.classList.add('is-bump');
        }
        n.textContent = counts[k];
      });
      var d = levels.design;
      pill.dataset.lv = d;
      pill.lastElementChild.textContent = words[d];
      pillIcon.setAttribute('href', d === 'all' ? '#i-vol' : d === 'muted' ? '#i-belloff' : '#i-bell');
      notif.querySelector('[data-note]').textContent = notes[d];
    };
    notif.querySelectorAll('.sn-seg button').forEach(function (b) {
      b.addEventListener('click', function () {
        var ch = b.closest('[data-ch]').dataset.ch;
        if (levels[ch] === b.dataset.lv) return;
        levels[ch] = b.dataset.lv;
        renderNotif(true);
        toast(notif, 'Alerts updated for #' + ch);
      });
    });
    renderNotif(false);
  }

  console.log(
    '%cHey.%c You opened the console, so we should probably talk.\nbrayden@braydenw.com',
    'font:700 20px "Bricolage Grotesque",sans-serif;color:#1b4dff',
    'font:14px/1.6 "Open Sans",system-ui;color:#1c1c1c'
  );
})();
