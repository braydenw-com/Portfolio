/* ═══════════════════════════════════════════════════════════════════════════
   braydenw.com — no libraries.

   The one interaction lives in warp(): run a cursor across the word
   "enjoyable." and each letter responds in proportion to how close you are.
   Everything else here is housekeeping.
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* A new page always opens at the top, never at a remembered scroll spot. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) scrollTo(0, 0);
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

  /* Footer: the time in Savannah and what Brayden is probably doing. */
  var fTime = document.getElementById('foot-time');
  var fDoing = document.getElementById('foot-doing');
  if (fTime && fDoing) {
    var tick = function () {
      var now = new Date();
      fTime.textContent = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });
      var h = Number(now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }));
      var day = now.toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short' });
      var weekend = day === 'Sat' || day === 'Sun';
      fDoing.textContent = weekend ? (
        h < 9  ? 'probably sleeping in' :
        h < 12 ? 'probably out on a bagel run' :
        h < 17 ? 'probably touching grass, professionally' :
                 'probably still pushing pixels'
      ) :
        h < 6  ? 'probably asleep, or doom-scrolling LinkedIn' :
        h < 9  ? 'probably hunting down an everything bagel' :
        h < 12 ? 'probably on my first iced coffee' :
        h < 14 ? 'probably working in the studio' :
        h < 17 ? 'probably taking an idea stroll' :
        h < 20 ? 'probably covered in clay at the wheel' :
                 'probably still pushing pixels';
    };
    tick();
    setInterval(tick, 30000);
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ── Home: the name, edge to edge, and the light behind it ─────────── */
  /* Home: the pinned pill nav shows only once the top bar has scrolled away. */
  var hBar = document.getElementById('h-bar');
  var hPill = document.getElementById('h-pill-nav');
  if (hBar && hPill && 'IntersectionObserver' in window) {
    hPill.hidden = false;
    var dock = matchMedia('(max-width: 760px)');
    new IntersectionObserver(function (es) {
      var on = dock.matches || !es[0].isIntersecting;
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
      /* When the name breaks onto two lines (phones), fit the longer line. */
      var parts = hName.querySelectorAll('span');
      var stacked = parts.length > 1 && getComputedStyle(parts[0]).display === 'block';
      var textW = 0;
      (stacked ? Array.prototype.slice.call(parts) : [hName]).forEach(function (el) {
        var range = document.createRange();
        range.selectNodeContents(el);
        textW = Math.max(textW, range.getBoundingClientRect().width);
      });
      if (!textW) return;
      var size = (hHero.clientWidth / 10) * (hName.clientWidth - pad) / textW;
      hHero.style.setProperty('--name-size', (size * .999) + 'px');
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(fit);
    addEventListener('load', fit);
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', fit);
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
    var renderNotif = function () {
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
        renderNotif();
        toast(notif, 'Alerts updated for #' + ch);
      });
    });
    renderNotif();
  }

  /* ── About: the Asking line cycles through questions ─────────────────── */
  var ask = document.querySelector('[data-ask]');
  if (ask && !calm) {
    var qs = JSON.parse(ask.dataset.ask), qi = 0, paused = false;
    ask.addEventListener('mouseenter', function () { paused = true; });
    ask.addEventListener('mouseleave', function () { paused = false; });
    setInterval(function () {
      if (paused) return;
      ask.classList.add('is-out');
      setTimeout(function () {
        qi = (qi + 1) % qs.length;
        ask.textContent = qs[qi];
        ask.classList.remove('is-out');
      }, 350);
    }, 3200);
  }

  /* ── Copy-email buttons ───────────────────────────────────────────────── */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    var label = b.textContent;
    b.addEventListener('click', function () {
      var done = function (ok) {
        b.textContent = ok ? 'Copied' : b.dataset.copy;
        setTimeout(function () { b.textContent = label; }, 2200);
      };
      if (navigator.clipboard && isSecureContext) {
        navigator.clipboard.writeText(b.dataset.copy).then(function () { done(true); }, function () { done(false); });
      } else { done(false); }
    });
  });

  /* Rotating photos. The About lead drifts slowly on its own; the homepage
     tiles (data-rotate="hover") hold still until you hover them, or tap
     them on a phone, so the page isn't all moving at once. */
  document.querySelectorAll('[data-rotate]').forEach(function (rot) {
    var shots = rot.querySelectorAll('img'), cap = rot.querySelector('figcaption'), at = 0, timer = null;
    var onHover = rot.dataset.rotate === 'hover';
    shots.forEach(function (im) { im.loading = 'eager'; });
    var step = function () {
      if (document.hidden) return;
      shots[at].classList.remove('is-on');
      at = (at + 1) % shots.length;
      shots[at].classList.add('is-on');
      if (cap && cap.textContent !== shots[at].dataset.cap) {
        cap.classList.add('is-out');
        setTimeout(function () { cap.textContent = shots[at].dataset.cap; cap.classList.remove('is-out'); }, 400);
      }
    };
    if (onHover) {
      rot.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { step(); timer = setInterval(step, 1600); } });
      rot.addEventListener('pointerleave', function () { clearInterval(timer); });
      rot.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') step(); });
    } else {
      var held = false;
      rot.addEventListener('mouseenter', function () { held = true; });
      rot.addEventListener('mouseleave', function () { held = false; });
      setInterval(function () { if (!held) step(); }, 6000);
    }
  });

  /* Back to top: glide up instead of jumping (unless reduced motion). */
  document.querySelectorAll('.foot__top').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
      history.replaceState(null, '', location.pathname + location.search);
    });
  });

  /* Hero videos: covers play while on screen; homepage cards play while
     hovered (or while on screen on touch). Reduced motion keeps the poster. */
  var heroVids = document.querySelectorAll('video[data-hero]');
  if (heroVids.length) {
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hover = window.matchMedia('(hover: hover)').matches;
    var play = function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) play(e.target); else e.target.pause(); });
    }, { threshold: 0.35 }) : null;
    heroVids.forEach(function (v) {
      if (still) { v.pause(); return; }
      if (v.dataset.hero === 'hover' && hover) {
        var card = v.closest('a') || v;
        card.addEventListener('mouseenter', function () { play(v); });
        card.addEventListener('mouseleave', function () { v.pause(); });
      } else if (io) { io.observe(v); }
    });
  }

  console.log(
    '%cHey.%c You opened the console, so we should probably talk.\nbrayden@braydenw.com',
    'font:700 20px "Bricolage Grotesque",sans-serif;color:#1b4dff',
    'font:14px/1.6 "Open Sans",system-ui;color:#1c1c1c'
  );
})();

// Click a case-study feature image to view it larger
(function(){
  var imgs=document.querySelectorAll('.c-feat img[src*="opal-feat"], [data-page="presents"] .c-shot img, .g-ex img');
  if(!imgs.length||!window.HTMLDialogElement)return;
  var d=document.createElement('dialog');d.className='c-zoom';
  var big=document.createElement('img');big.alt='';d.appendChild(big);document.body.appendChild(d);
  d.addEventListener('click',function(){d.close()});
  imgs.forEach(function(im){
    im.tabIndex=0;im.setAttribute('role','button');
    function open(){big.src=im.src;big.alt=im.alt;d.showModal()}
    im.addEventListener('click',open);
    im.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}});
  });
})();

// Design system page: the example components are just for clicking, they don't navigate
(function(){
  document.querySelectorAll('.ds-comp a').forEach(function(a){
    a.addEventListener('click',function(e){e.preventDefault()});
  });
  var nav=document.querySelector('.ds-static');
  if(!nav)return;
  nav.addEventListener('click',function(e){
    var a=e.target.closest('a');if(!a)return;
    if(a.classList.contains('h-pill-nav__hi'))return;
    nav.querySelectorAll('a').forEach(function(x){x.removeAttribute('aria-current')});
    a.setAttribute('aria-current','page');
  });
})();

// Cookie banner: only for visitors whose time zone is in Europe, until they choose
(function(){
  function get(){try{return localStorage.getItem('bw-consent')}catch(e){return null}}
  function set(v){try{localStorage.setItem('bw-consent',v)}catch(e){}
    if(window.gtag)gtag('consent','update',{analytics_storage:v});}
  var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}
  var inEurope=/^Europe\//.test(tz)||/^Atlantic\/(Canary|Madeira|Azores|Reykjavik|Faroe)$/.test(tz);
  function show(){
    if(document.querySelector('.bw-consent'))return;
    var d=document.createElement('div');d.className='bw-consent';d.setAttribute('role','region');d.setAttribute('aria-label','Cookie choice');
    d.innerHTML='<p>This site uses Google Analytics cookies to count visits. <a href="/privacy">Privacy</a></p>'+
      '<div class="bw-consent__btns"><button type="button" data-v="denied">No thanks</button><button type="button" data-v="granted" class="bw-consent__yes">That&rsquo;s fine</button></div>';
    d.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;set(b.getAttribute('data-v'));d.remove()});
    document.body.appendChild(d);
  }
  if(inEurope&&!get())show();
  document.querySelectorAll('.bw-consent-reset').forEach(function(b){
    b.addEventListener('click',function(){try{localStorage.removeItem('bw-consent')}catch(e){}show()});
  });
})();


// Easter egg: a hello for people who open the browser console.
(function(){
  try{
    console.log('%cHey, you inspect things. We\u2019d get along.','font:600 16px/1.4 sans-serif;color:#1b4dff');
    console.log('%cI\u2019m Brayden, a product designer. Say hi: brayden@braydenw.com','font:14px/1.4 sans-serif');
  }catch(e){}
})();


// Bagel Catch: the game strip on the 404 page, drawn as pixel art in the site's
// colors. Catch bagels on the plate; everything bagels are
// worth 3, a burnt one ends the run, and so do three misses.
(function(){
  var cv=document.getElementById('bc-canvas');
  if(!cv||!cv.getContext)return;
  var cx=cv.getContext('2d'),scoreEl=document.getElementById('bc-score'),bestEl=document.getElementById('bc-best');
  var BLUE='#1b4dff',INK='#0b0d1a',SOFT='#5b5e70',LINE='rgba(11,13,26,.18)',SHINE='#a9bcff',P=3; // P = size of one pixel; colors are the site tokens
  // 9x9 bagel: 1 crust, 2 shine, 0 empty
  var BAGEL=['001111100','011111110','112111111','111000111','111000111','111000111','111111111','011111110','001111100'];
  var W=0,H=0,dpr=1,state='idle',score=0,best=0,misses=0,plate={x:0,w:60},keys={},target=null,items=[],spawnT=0,last=0,specks=[];
  try{best=+localStorage.getItem('bw-bagels')||0}catch(e){}
  function pad(n){return ('00000'+n).slice(-5)}
  bestEl.textContent=pad(best);scoreEl.textContent=pad(0);cv.tabIndex=0;
  function size(){var r=cv.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cx.setTransform(dpr,0,0,dpr,0,0);cx.imageSmoothingEnabled=false;
    plate.w=Math.round(Math.max(48,Math.min(72,W*.1))/P)*P;if(!plate.x)plate.x=W/2;
    specks=[];for(var x=0;x<W;x+=6+Math.random()*26)specks.push([x,Math.random()<.5?4:8,Math.random()<.4?P*2:P]);draw()}
  function snap(v){return Math.round(v/P)*P}
  function start(){state='play';score=0;misses=0;items=[];spawnT=0;plate.x=W/2;scoreEl.textContent=pad(0);last=performance.now();requestAnimationFrame(loop)}
  function over(){state='over';if(score>best){best=score;bestEl.textContent=pad(best);try{localStorage.setItem('bw-bagels',best)}catch(e){}}draw()}
  function spawn(){var roll=Math.random(),lvl=Math.min(1,score/40);
    var kind=roll<.14+lvl*.08?'burnt':roll<.32?'everything':'plain';
    items.push({x:14+Math.random()*(W-28),y:-30,vy:(70+score*3)*(0.85+Math.random()*.3),kind:kind})}
  function loop(now){if(state!=='play')return;var dt=Math.min(.05,(now-last)/1000);last=now;
    var sp=W*1.2;if(keys.l)plate.x-=sp*dt;if(keys.r)plate.x+=sp*dt;if(target!==null)plate.x+=(target-plate.x)*Math.min(1,dt*18);
    plate.x=Math.max(plate.w/2,Math.min(W-plate.w/2,plate.x));
    spawnT-=dt;if(spawnT<=0){spawn();spawnT=Math.max(.45,1.2-score*.015)*(0.7+Math.random()*.6)}
    var py=H-22,half=4.5*P;
    for(var i=items.length-1;i>=0;i--){var b=items[i];b.y+=b.vy*dt;
      if(b.y+half>=py-2&&b.y<=py+4&&Math.abs(b.x-plate.x)<plate.w/2+half*.5){items.splice(i,1);
        if(b.kind==='burnt'){draw();return over()}score+=b.kind==='everything'?3:1;scoreEl.textContent=pad(score);continue}
      if(b.y-half>H){items.splice(i,1);if(b.kind!=='burnt'&&++misses>=3){draw();return over()}}}
    draw();requestAnimationFrame(loop)}
  function bagel(b){var x0=snap(b.x)-4*P,y0=snap(b.y)-4*P,burnt=b.kind==='burnt';
    for(var r=0;r<9;r++)for(var c=0;c<9;c++){var v=BAGEL[r][c];if(v==='0')continue;
      cx.fillStyle=burnt?INK:(v==='2'?SHINE:BLUE);cx.fillRect(x0+c*P,y0+r*P,P,P)}
    if(b.kind==='everything'){cx.fillStyle='#fff';[[2,1],[5,1],[1,4],[7,4],[3,7],[6,7]].forEach(function(d){cx.fillRect(x0+d[0]*P,y0+d[1]*P,P,P)})}}
  function text(t,y,size){cx.fillStyle=SOFT;cx.font='500 '+size+'px ui-monospace,Menlo,monospace';cx.textAlign='center';cx.fillText(t,W/2,y)}
  function draw(){cx.clearRect(0,0,W,H);var py=H-22;
    cx.fillStyle=LINE;cx.fillRect(0,py+8,W,1);
    for(var i=0;i<specks.length;i++){cx.fillRect(Math.round(specks[i][0]),py+8+specks[i][1],specks[i][2],1)}
    for(i=0;i<items.length;i++)bagel(items[i]);
    var x=snap(plate.x-plate.w/2);cx.fillStyle=INK;cx.fillRect(x,py,plate.w,P);cx.fillRect(x+P,py+P,plate.w-2*P,P);cx.fillRect(x+3*P,py+2*P,plate.w-6*P,P);
    for(i=0;i<3;i++){cx.fillStyle=i<3-misses?BLUE:LINE;cx.fillRect(4+i*12,4,P*2,P*2)}
    if(state==='idle')text('PRESS SPACE OR TAP TO CATCH BAGELS',H/2,13);
    if(state==='over'){text('G A M E   O V E R',H/2-10,17);text(score===1?'1 BAGEL':score+' BAGELS',H/2+14,12)}}
  function go(){if(state!=='play')start()}
  document.addEventListener('keydown',function(e){var t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
    if(e.key==='ArrowLeft'||e.key==='a'){keys.l=1;target=null;if(state==='play')e.preventDefault()}
    else if(e.key==='ArrowRight'||e.key==='d'){keys.r=1;target=null;if(state==='play')e.preventDefault()}
    else if((e.key===' '||e.key==='ArrowUp')&&(!t||t===document.body||t===cv)){e.preventDefault();go()}});
  document.addEventListener('keyup',function(e){if(e.key==='ArrowLeft'||e.key==='a')keys.l=0;if(e.key==='ArrowRight'||e.key==='d')keys.r=0});
  function px(e){return e.clientX-cv.getBoundingClientRect().left}
  cv.addEventListener('pointerdown',function(e){target=px(e);go()});
  cv.addEventListener('pointermove',function(e){if(state==='play'&&(e.pointerType==='mouse'||e.buttons))target=px(e)});
  document.addEventListener('visibilitychange',function(){if(document.hidden&&state==='play'){state='idle';draw()}});
  window.addEventListener('resize',size);size();
})();
