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


// Bagel Toss: the game strip on the 404 page. Hold (mouse, finger or space)
// and let go to toss a bagel onto the target: a plate is
// worth 1, a tub of cream cheese is worth 3 (a quiet bonus). Best of three throws.
(function(){
  var cv=document.getElementById('bc-canvas');
  if(!cv||!cv.getContext)return;
  // Words follow the device: a touchscreen says tap and finger, a computer says click and mouse.
  var TOUCH=!!(window.matchMedia&&matchMedia('(hover: none) and (pointer: coarse)').matches);
  var cx=cv.getContext('2d'),scoreEl=document.getElementById('bc-score'),bestEl=document.getElementById('bc-best');
  var BLUE='#1b4dff',INK='#0b0d1a',SOFT='#5b5e70',LINE='rgba(11,13,26,.18)',SHINE='#a9bcff',P=4,G=760,VMAX=860;
  var BODY="'IBM Plex Sans','Helvetica Neue',Arial,sans-serif",HEAD="'Schibsted Grotesk','Helvetica Neue',Arial,sans-serif";
  var BAGEL=['001111100','011111110','112111111','111000111','111000111','111000111','111111111','011111110','001111100'];
  var res=[],shake=0,won=false,W=0,H=0,dpr=1,gy=0,state='idle',score=0,best=0,misses=0,b=null,tgt=null,aim={a:50,p:0,charging:false,t:0},drag=null,pop=null,last=0,raf=0,readyAt=0,hintT=0;
  try{best=+localStorage.getItem('bw-bagel-toss')||0}catch(e){}
  bestEl.textContent=best;cv.tabIndex=0;
  function size(){var r=cv.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;gy=H-14;
    cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cx.setTransform(dpr,0,0,dpr,0,0);cx.imageSmoothingEnabled=false;
    if(!b)reset();if(!tgt)newTarget();draw()}
  function home(){return {x:48,y:gy-18}}
  function reset(){var h=home();b={x:h.x,y:h.y,vx:0,vy:0,fly:false};readyAt=performance.now();clearTimeout(hintT);hintT=setTimeout(function(){if(state==='play')draw()},10050)}
  function newTarget(){var tub=Math.random()<.35+Math.min(.25,score*.01),lo=Math.max(W*.55,190);
    tgt=tub?{kind:'tub',w:48,h:40,pts:3}:{kind:'plate',w:Math.max(64,100-score*2),h:8,pts:1};tgt.x=lo+Math.random()*Math.max(0,W-lo-60)}
  function start(){res=[];won=false;state='play';score=0;misses=0;scoreEl.textContent=0;reset();newTarget();loopStart()}
  function over(){state='over';if(score>best){best=score;bestEl.textContent=best;try{localStorage.setItem('bw-bagel-toss',best)}catch(e){}}draw()}
  function vel(){var a=48*Math.PI/180,v=VMAX*Math.sqrt(.12+.88*aim.p);return {vx:Math.cos(a)*v,vy:-Math.sin(a)*v}}
  function toss(v){if(state!=='play'||b.fly)return;if(Math.hypot(v.vx,v.vy)<60)return;b.vx=v.vx;b.vy=v.vy;b.fly=true;loopStart()}
  function loopStart(){if(!raf){last=performance.now();raf=requestAnimationFrame(loop)}}
  function loop(now){raf=0;var dt=Math.min(.033,(now-last)/1000);last=now;
    if(aim.charging){aim.t+=dt;aim.p=.5-.5*Math.cos(aim.t*2.4)}
    if(pop){pop.t-=dt;if(pop.t<=0)pop=null}if(shake>0)shake=Math.max(0,shake-dt);
    if(state==='play'&&b.fly){if(res.length===2&&b.vy>0&&Math.abs(b.x-tgt.x)<160)dt*=.35;var py=b.y;b.vy+=G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
      var top=gy-tgt.h,half=tgt.w/2,r=18;
      if(b.vy>0&&py+r*.4<=top&&b.y+r*.4>=top&&Math.abs(b.x-tgt.x)<half){score+=tgt.pts;scoreEl.textContent=score;
        pop={x:tgt.x,y:top-26,t:.9,txt:tgt.kind==='tub'?'Schmear!':'Nice'};b.fly=false;b.y=top-r*.4;b.x=tgt.x;
        res.push(1);setTimeout(function(){if(state!=='play')return;if(res.length>=3){over();return}reset();newTarget();draw()},650)}
      else if(tgt.kind==='tub'&&b.y+r*.4>top&&Math.abs(b.x-tgt.x)<half+r*.6&&b.vx>0){b.vx=-b.vx*.35;b.x=tgt.x-half-r*.6}
      if(b.fly&&(b.y+r*.4>=gy||b.x>W+20||b.x<-20)){b.fly=false;b.y=Math.min(b.y,gy-r*.4);misses++;res.push(0);shake=.35;pop=null;
        setTimeout(function(){if(state!=='play')return;if(res.length>=3){over();return}reset();newTarget();draw()},650)}}
    draw();if((b.fly||aim.charging||pop||shake)&&!raf)raf=requestAnimationFrame(loop)}
  function snap(v){return Math.round(v/P)*P}
  function bagel(x,y,alpha,c1,c2){cx.globalAlpha=alpha||1;var x0=snap(x)-4*P,y0=snap(y)-4*P;
    for(var r=0;r<9;r++)for(var c=0;c<9;c++){var v=BAGEL[r][c];if(v==='0')continue;cx.fillStyle=v==='2'?(c2||SHINE):(c1||BLUE);cx.fillRect(x0+c*P,y0+r*P,P,P)}cx.globalAlpha=1}
  function target(){var x=snap(tgt.x-tgt.w/2),w=snap(tgt.w);
    if(tgt.kind==='plate'){cx.fillStyle=INK;cx.fillRect(x,gy-8,w,P);cx.fillRect(x+2*P,gy-4,w-4*P,P)}
    else{var t=gy-tgt.h;cx.fillStyle='#fff';cx.fillRect(x,t,w,tgt.h);cx.fillStyle=INK;cx.fillRect(x,t+P,P,tgt.h-P);cx.fillRect(x+w-P,t+P,P,tgt.h-P);cx.fillRect(x+P,gy-P,w-2*P,P);
      cx.fillStyle=BLUE;cx.fillRect(x-P,t,w+2*P,2*P);cx.fillStyle=SHINE;cx.fillRect(x+2*P,t+4*P,w-4*P,2*P);cx.fillStyle=INK;cx.fillRect(x+3*P,t+7*P,P,P);cx.fillRect(x+5*P,t+7*P,w-10*P,P)}}
  function preview(){var v=vel(),h=home();cx.fillStyle=BLUE;for(var i=1;i<9;i++){var t=i*.06,x=h.x+v.vx*t,y=h.y+v.vy*t+.5*G*t*t;if(y>gy)break;cx.globalAlpha=1-i/10;cx.fillRect(snap(x),snap(y),P,P)}cx.globalAlpha=1}
  function label(t,y,font){cx.fillStyle=SOFT;cx.font=font;cx.textAlign='center';cx.fillText(t,W/2,y)}
  function draw(){if(state==='intro')return;cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);if(shake>0)cx.translate((Math.random()-.5)*14*shake,(Math.random()-.5)*6*shake);
    if(state==='play'&&res.length===2&&tgt){var gr=cx.createRadialGradient(tgt.x,gy-20,30,tgt.x,gy-20,Math.max(W,H)*.7);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(11,13,26,.10)');cx.fillStyle=gr;cx.fillRect(-20,-20,W+40,H+40)}cx.fillStyle=LINE;cx.fillRect(0,gy,W,1);
    if(state==='play'||state==='over')target();
    if(state==='play'||state==='over'){for(var i=0;i<3;i++){var cxp=W/2+(i-1)*44,cyp=26,r0=res[i];
      if(r0===1)bagel(cxp,cyp);else if(r0===0){bagel(cxp,cyp,1,'#d3d6de','#eceef2');cx.fillStyle=SOFT;cx.fillRect(snap(cxp)-6,snap(cyp)-1,12,3)}
      else{var pul=(state==='play'&&i===res.length)?.6+.4*Math.sin(performance.now()/160):.45;bagel(cxp,cyp,pul,'#b9bcc6','#e3e6ec')}}
      if(state==='play'&&!raf&&!b.fly)loopStart()}
    if(state==='play'&&!b.fly&&aim.charging)preview();
    if(state==='play'&&(!res.length||(!b.fly&&!aim.charging&&performance.now()-readyAt>1e4))){cx.fillStyle=SOFT;cx.font='12px '+BODY;cx.textAlign='left';cx.fillText((TOUCH?'Hold your finger down, then let go to throw':'Hold the mouse button down, then let go to throw'),70,gy-34)}
    if(aim.charging){cx.fillStyle=LINE;cx.fillRect(28,gy-56,60,P*2);cx.fillStyle=BLUE;cx.fillRect(28,gy-56,60*aim.p,P*2)}
    if(b&&state!=='idle')bagel(b.x,b.y);
    if(pop){cx.fillStyle=pop.txt==='Miss'?SOFT:BLUE;cx.font='600 14px '+HEAD;cx.textAlign='center';cx.fillText(pop.txt,pop.x,pop.y-(.9-pop.t)*14)}
    if(state==='howto')return;
    if(state!=='play'){if(state==='over'){cx.fillStyle='rgba(255,255,255,.85)';cx.fillRect(0,0,W,gy)}
      if(state==='idle'){var sx=W*(W<520?.68:.72),pw=snap(W<520?120:180),px0=snap(sx-pw/2);cx.fillStyle=INK;cx.fillRect(px0,gy-8,pw,P);cx.fillRect(px0+2*P,gy-4,pw-4*P,P);STACK.forEach(function(o){bagel(sx+o[0],gy-8-18+o[1],1,'#b9bcc6','#e3e6ec')});var o=oPos();cx.fillStyle=INK;cx.textAlign='left';cx.font='800 '+o.fs+'px '+HEAD;cx.fillText('Bagel',0,o.y1);cx.fillText('T',0,o.y2);ring(o.x,o.y,o.r);cx.fillStyle=INK;cx.fillText('ss',o.ss,o.y2);
        cx.font='800 '+o.fs+'px '+HEAD;var ssw=cx.measureText('ss').width;cx.fillStyle=BLUE;cx.font='500 '+(W<520?13:15)+'px '+BODY;cx.fillText((TOUCH?'Tap':'Click')+' to start'+(best?'  \u00b7  best '+best:''),0,o.y1-o.fs*.9)
        if(!raf)loopStart()}
      else{var n=res.reduce(function(a,c){return a+c},0),V=['The bagels win this round.','One for three. We don\u2019t talk about this.','Respectable. The bagel council approves.','Flawless. Legendary.'];cx.fillStyle=INK;cx.font='600 '+(W<520?18:22)+'px '+HEAD;cx.textAlign='center';cx.fillText(V[n],W/2,H/2+4);label(TOUCH?'Tap to go again':'Click to go again',H/2+28,'14px '+BODY)}}}
  var STACK=[[-60,0],[-20,0],[20,0],[60,0],[-40,-32],[0,-32],[40,-32],[-20,-64],[20,-64]],fly=[],introT=0;
  // The "o" in "Toss" is measured from the font so the bagel sits exactly where the letter would.
  function oPos(){var fs=W<520?50:92,y2=gy-8,y1=Math.round(y2-fs*.96);cx.font='800 '+fs+'px '+HEAD;
    var tw=cx.measureText('T').width,m=cx.measureText('o'),ow=m.width,top=m.actualBoundingBoxAscent||fs*.54,bot=m.actualBoundingBoxDescent||0,r=(top+bot)/2;
    return {fs:fs,y1:y1,y2:y2,r:r,x:tw+ow/2,y:y2-(top-bot)/2,ss:tw+ow}}
  function ring(x,y,r){cx.fillStyle=BLUE;cx.beginPath();cx.arc(x,y,r,0,7);cx.fill();
    cx.strokeStyle='rgba(255,255,255,.35)';cx.lineWidth=Math.max(2,r*.12);cx.lineCap='round';cx.beginPath();cx.arc(x,y,r*.68,Math.PI*1.1,Math.PI*1.45);cx.stroke();
    cx.fillStyle='#fff';cx.beginPath();cx.arc(x,y,r*.3,0,7);cx.fill()}
  // Starting: the "o" drops out of the word and lands where you throw from.
  function burst(){fly=oPos();state='intro';introT=0;last=performance.now();requestAnimationFrame(introLoop)}
  function introLoop(now){var dt=Math.min(.033,(now-last)/1000);last=now;introT+=dt;var o=fly,k=Math.min(1,introT/.55),e=k*k,h=home();
    cx.clearRect(0,0,W,H);cx.fillStyle=LINE;cx.fillRect(0,gy,W,1);
    var sx=W*(W<520?.68:.72),pw=snap(W<520?120:180),px0=snap(sx-pw/2);cx.fillStyle=INK;cx.fillRect(px0,gy-8,pw,P);cx.fillRect(px0+2*P,gy-4,pw-4*P,P);STACK.forEach(function(s2){bagel(sx+s2[0],gy-8-18+s2[1],1,'#b9bcc6','#e3e6ec')});
    cx.globalAlpha=Math.max(0,1-introT*2.2);cx.fillStyle=INK;cx.textAlign='left';cx.font='800 '+o.fs+'px '+HEAD;cx.fillText('Bagel',0,o.y1);cx.fillText('T',0,o.y2);cx.fillText('ss',o.ss,o.y2);cx.globalAlpha=1;
    if(k<1)ring(o.x+(h.x-o.x)*k,o.y+(h.y-o.y)*e,o.r+(18-o.r)*k);else bagel(h.x,h.y);
    if(introT<.9)requestAnimationFrame(introLoop);else howto()}
  // "How to play": a short looping demo of hold, let go, land. Any click skips it.
  var demoT=0;
  var demoN=0,ready=0;
  function howto(){state='howto';demoT=0;demoN=0;ready=0;last=performance.now();requestAnimationFrame(demoLoop)}
  function demoLoop(now){if(state!=='howto')return;var dt=Math.min(.033,(now-last)/1000);last=now;
    if(ready){ready+=dt;cx.clearRect(0,0,W,H);cx.fillStyle=LINE;cx.fillRect(0,gy,W,1);bagel(48,gy-18);var k=Math.min(2,Math.floor(ready/.55)),f=(ready%.55)/.55,sc=1+.6*(1-f)*(1-f);cx.save();cx.translate(W/2,H/2-6);cx.scale(sc,sc);cx.fillStyle=BLUE;cx.font='700 '+(W<520?44:56)+'px '+HEAD;cx.textAlign='center';cx.textBaseline='middle';cx.globalAlpha=1-f*.6;cx.fillText(String(3-k),0,0);cx.restore();cx.globalAlpha=1;cx.textBaseline='alphabetic';if(ready>1.65)start();else requestAnimationFrame(demoLoop);return}
    demoT+=dt;if(demoT>=2.6){demoT-=2.6;if(++demoN>=3){ready=.001;requestAnimationFrame(demoLoop);return}}
    var sm=W<520,hx=48,hy=gy-18,tx=W*(sm?.66:.58),pw=snap(90),t=demoT;
    cx.clearRect(0,0,W,H);cx.fillStyle=LINE;cx.fillRect(0,gy,W,1);
    cx.fillStyle=INK;cx.fillRect(snap(tx-pw/2),gy-8,pw,P);cx.fillRect(snap(tx-pw/2)+2*P,gy-4,pw-4*P,P);
    cx.fillStyle=INK;cx.font='600 '+(sm?17:20)+'px '+HEAD;cx.textAlign='center';cx.fillText('How to play',W/2,28);
    cx.fillStyle=SOFT;cx.font='13px '+BODY;cx.textAlign='right';cx.fillText((TOUCH?'Tap':'Click')+' to skip',W-8,20);
    var cap,bx=hx,by=hy;
    if(t<1){var p=Math.min(1,t/0.9);cap=(TOUCH?'Hold your finger down\u2026':'Hold the mouse button down\u2026');cx.fillStyle=LINE;cx.fillRect(28,gy-56,60,P*2);cx.fillStyle=BLUE;cx.fillRect(28,gy-56,60*p,P*2);
      cx.fillStyle=BLUE;for(var k=1;k<9;k++){var q=k/9;cx.globalAlpha=(1-q)*p;cx.fillRect(snap(hx+(tx-hx)*q*p),snap(hy-Math.sin(q*Math.PI)*110*p),P,P)}cx.globalAlpha=1}
    else if(t<1.8){var q=(t-1)/0.8;cap='\u2026then let go!';bx=hx+(tx-hx)*q;by=hy-Math.sin(q*Math.PI)*110+(gy-8-18-hy)*q}
    else{cap='Land it to score.';bx=tx;by=gy-8-18;cx.fillStyle=BLUE;cx.font='600 14px '+HEAD;cx.textAlign='center';cx.fillText('+1',tx,gy-8-18-30-(t-1.8)*12)}
    bagel(bx,by);
    cx.fillStyle=SOFT;cx.font='15px '+BODY;cx.textAlign='center';cx.fillText(cap,W/2,56);
    requestAnimationFrame(demoLoop)}
  function hold(){if(state==='intro')return;if(state==='idle'){if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)howto();else burst();return}if(state==='howto'||state==='over'){ready=0;start();return}if(b.fly||aim.charging)return;aim.charging=true;aim.t=0;aim.p=0;loopStart()}
  function letGo(){if(!aim.charging)return;aim.charging=false;toss(vel());draw()}
  cv.addEventListener('pointerdown',function(e){e.preventDefault();cv.setPointerCapture(e.pointerId);hold()});
  cv.addEventListener('pointerup',letGo);cv.addEventListener('pointercancel',function(){aim.charging=false;draw()});
  document.addEventListener('keydown',function(e){var t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT|A|BUTTON)$/.test(t.tagName))return;
    if(e.key===' '){e.preventDefault();if(!e.repeat)hold()}});
  document.addEventListener('keyup',function(e){if(e.key===' ')letGo()});
  document.addEventListener('visibilitychange',function(){if(document.hidden){aim.charging=false;drag=null}});
  window.addEventListener('resize',size);size();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){size()});
  cv.addEventListener('contextmenu',function(e){e.preventDefault()});
  cv.addEventListener('touchstart',function(e){e.preventDefault()},{passive:false});
})();
