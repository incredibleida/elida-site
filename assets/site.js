/* © 2026 Österman & Næss (Elida). All rights reserved. See /LICENSE. */
/* Elida — shared behaviour */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia && matchMedia('(hover: hover)').matches;
  var nav = document.querySelector('[data-nav]');
  var themed = Array.prototype.slice.call(document.querySelectorAll('[data-theme]'));

  // Nav: cream over dark sections, ink over cream ones.
  function navTheme() {
    if (!nav) return;
    var y = 40, t = 'dark';
    for (var i = 0; i < themed.length; i++) { var r = themed[i].getBoundingClientRect(); if (r.top <= y && r.bottom > y) { t = themed[i].getAttribute('data-theme'); break; } }
    nav.classList.toggle('light', t === 'light');
    nav.classList.toggle('scrolled', scrollY > 10);
  }

  // Mobile menu
  var burger = document.querySelector('[data-burger]'), menu = document.querySelector('[data-menu]');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open); nav.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('lock', open);
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) burger.click(); });
  }

  // Reveal on scroll
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  Array.prototype.forEach.call(document.querySelectorAll('[data-reveal],[data-lines],[data-clip],[data-in]'), function (el) { io.observe(el); });
  var heroLines = document.querySelector('[data-hero-lines]');
  if (heroLines) { var go = function () { heroLines.classList.add('in'); }; if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); setTimeout(go, 900); }

  // Manifesto: words fill in as the statement scrolls into view.
  var fill = document.querySelector('[data-fill]'), words = [];
  if (fill) {
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) wrap(n);
      });
    })(fill);
  }
  function fillStep() {
    if (!words.length) return;
    var r = fill.getBoundingClientRect(), vh = innerHeight;
    var p = (vh * 0.9 - r.top) / (vh * 0.45 + r.height); p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * words.length);
    for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
  }

  // Gentle parallax on figures
  var pars = Array.prototype.slice.call(document.querySelectorAll('[data-par]'));
  function parStep() {
    if (reduce) return;
    var vh = innerHeight;
    pars.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (-c * parseFloat(el.getAttribute('data-par')) * vh).toFixed(1) + 'px,0)';
    });
  }

  // Hero: the covers orbit Socrates on a tilted ring — smaller and behind him at the back, larger in front.
  // Hovering a cover eases the ring to a stop; the whole ring drifts with the cursor and lifts away on scroll.
  var hero = document.querySelector('[data-hero]'), cards = Array.prototype.slice.call(document.querySelectorAll('.fc')), statueBox = document.querySelector('[data-statue-box]');
  var heroGrid = false, mx = 0, my = 0, tmx = 0, tmy = 0, theta = -Math.PI / 2 + 0.4, omega = 2 * Math.PI / 44000, speed = 1, tSpeed = 1, lastHero = 0;
  if (hero && canHover) addEventListener('mousemove', function (e) { tmx = e.clientX / innerWidth * 2 - 1; tmy = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  cards.forEach(function (c) { c.addEventListener('mouseenter', function () { tSpeed = 0; }); c.addEventListener('mouseleave', function () { tSpeed = 1; }); });
  function heroStep(now) {
    if (!hero) return;
    var y = scrollY, H = hero.offsetHeight, W = hero.offsetWidth; if (y > H) return;
    var dt = lastHero ? Math.min(100, now - lastHero) : 16; lastHero = now;
    speed += (tSpeed - speed) * 0.06;
    if (!reduce) theta += omega * dt * speed;
    mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
    var narrow = W < 900, m = reduce ? 0 : 1;
    // On phones the covers are a static grid at the foot of the hero, so the ring is skipped and any inline transform cleared.
    if (narrow) {
      if (!heroGrid) { heroGrid = true; cards.forEach(function (c) { c.style.transform = ''; c.style.zIndex = ''; }); }
      if (statueBox) statueBox.style.transform = '';
      return;
    }
    heroGrid = false;
    var cx = W / 2 + mx * 18 * m, cy = H * (narrow ? 0.64 : 0.62) + my * 12 * m;
    var a = narrow ? Math.min(W * 0.36, W / 2 - 40 - parseFloat(getComputedStyle(cards[0]).width) * 0.6) : Math.min(W * 0.4, H * 0.8), b = H * (narrow ? 0.2 : 0.21), n = cards.length;
    for (var i = 0; i < n; i++) {
      var t = theta + i * 2 * Math.PI / n, s = Math.sin(t), d = (s + 1) / 2, sc = 0.7 + 0.5 * d;
      cards[i].style.transform = 'translate3d(' + (cx + a * Math.cos(t)).toFixed(1) + 'px,' + (cy + b * s - y * 0.3 * m).toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ') translate(-50%,-50%)';
      cards[i].style.zIndex = d < 0.5 ? 1 : 3;
    }
    if (statueBox) statueBox.style.transform = 'translate3d(0,' + (y * 0.12 * m).toFixed(1) + 'px,0)';
  }

  // Phone layout moves two blocks out of their desktop slots: the hero's "Selected work" pill drops below the statue, and a case page's project overview goes above "Next project".
  var phone = matchMedia('(max-width: 900px)');
  function placeForWidth() {
    var small = phone.matches;
    var cta = document.querySelector('[data-hero-cta]'), sub = document.querySelector('.hero-sub'), ring = document.querySelector('[data-ring]');
    if (cta && ring && sub) { if (small) { if (cta.parentNode !== hero) hero.insertBefore(cta, ring); } else if (cta.parentNode !== sub) sub.appendChild(cta); }
    var th = document.querySelector('.case-thumbs'), next = document.querySelector('.case-next'), head = document.querySelector('.case-head .wrap'), main = next && next.parentNode;
    if (th && next && head) { if (small) { if (th.parentNode !== main) main.insertBefore(th, next); } else if (th.parentNode !== head) head.appendChild(th); }
  }
  placeForWidth();
  if (phone.addEventListener) phone.addEventListener('change', placeForWidth);

  // Selected work: hovering a title's letters floats that project's cover beside the cursor; it follows the cursor and leaves with it.
  var wk = document.querySelector('[data-wk]'), prev = document.querySelector('[data-prev]');
  var prevStep = function () {};
  if (wk && prev && canHover) {
    var imgs = {}; Array.prototype.forEach.call(prev.querySelectorAll('img'), function (i) { imgs[i.getAttribute('data-key')] = i; });
    var px = 0, py = 0, tx = 0, ty = 0, lx = 0, vis = false, cur = null;
    function local(e) { var r = wk.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; }
    wk.addEventListener('mousemove', local, { passive: true });
    Array.prototype.forEach.call(wk.querySelectorAll('.wk-t'), function (t) {
      var row = t.closest('.wk-row');
      t.addEventListener('mouseenter', function (e) {
        local(e);
        if (!vis) { px = tx; py = ty; lx = px; }
        var k = row.getAttribute('data-key');
        if (cur) cur.classList.remove('on');
        cur = imgs[k]; if (cur) { cur.classList.add('on'); prev.firstElementChild.appendChild(cur); }
        prev.classList.add('show'); vis = true;
      });
      t.addEventListener('mouseleave', function () { prev.classList.remove('show'); vis = false; });
    });
    prevStep = function () {
      if (!vis && Math.abs(px - tx) < 0.5 && Math.abs(py - ty) < 0.5) return;
      px += (tx - px) * 0.14; py += (ty - py) * 0.14;
      var v = px - lx; lx = px;
      prev.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) rotate(' + Math.max(-8, Math.min(8, v * 0.35)).toFixed(2) + 'deg)';
    };
  }

  // Turning words: each [data-rot] cycles through its data-words list.
  Array.prototype.forEach.call(document.querySelectorAll('[data-rot]'), function (rot, ri) {
    var list = rot.getAttribute('data-words').split(','), idx = 0, w = rot.querySelector('.rot-w');
    var meas = document.createElement('span'); meas.className = 'rot-meas'; rot.appendChild(meas);
    function widthOf(t) { meas.textContent = t; return meas.offsetWidth; }
    function setW() { rot.style.width = widthOf(list[idx]) + 'px'; }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setW); else setW();
    addEventListener('resize', setW);
    if (reduce) return;
    setTimeout(function () {
      setInterval(function () {
        var next = (idx + 1) % list.length, out = w, inn = document.createElement('span');
        inn.className = 'rot-w enter'; inn.textContent = list[next]; rot.insertBefore(inn, meas);
        out.classList.add('leave'); idx = next; w = inn; setW();
        void inn.offsetWidth; inn.classList.remove('enter');
        setTimeout(function () { if (out.parentNode) out.parentNode.removeChild(out); }, 700);
      }, 2600);
    }, ri * 900);
  });

  // Buttons lean toward the cursor.
  if (canHover && !reduce) Array.prototype.forEach.call(document.querySelectorAll('[data-magnet]'), function (b) {
    b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; b.style.transform = 'translate(' + (x * 0.22).toFixed(1) + 'px,' + (y * 0.32).toFixed(1) + 'px)'; });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });

  // Wedding collage: a sideways scroller. Cards and drawings come in as they enter the frame (the drawings' hatching lives in each SVG and starts when its src is set).
  var wed = document.querySelector('[data-wed]'), wedPending = [], wedArmed = false;
  function wedStep() {
    if (!wed || !wedPending.length) return;
    var f = wed.getBoundingClientRect();
    if (!wedArmed) { if (f.top < innerHeight * 0.8 && f.bottom > innerHeight * 0.1) wedArmed = true; else return; }
    wedPending = wedPending.filter(function (el) {
      var b = el.getBoundingClientRect(), seen = Math.min(b.right, f.right) - Math.max(b.left, f.left);
      if (seen < Math.min(b.width, f.width) * 0.15) return true;
      el.classList.add('in');
      var img = el.querySelector('img[data-src]'); if (img) { img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); }
      return false;
    });
  }
  if (wed) {
    wedPending = Array.prototype.slice.call(wed.querySelectorAll('[data-wed-item]'));
    var wsx = 0, wsl = 0, wdrag = false;
    wed.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; wdrag = true; wsx = e.clientX; wsl = wed.scrollLeft; wed.classList.add('dragging'); e.preventDefault(); });
    addEventListener('pointermove', function (e) { if (wdrag) wed.scrollLeft = wsl - (e.clientX - wsx); });
    addEventListener('pointerup', function () { if (!wdrag) return; wdrag = false; wed.classList.remove('dragging'); });
    wed.addEventListener('scroll', wedStep, { passive: true });
    // Mouse wheel over the collage moves it sideways; at either end the page scrolls as usual.
    wed.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; var max = wed.scrollWidth - wed.clientWidth, at = wed.scrollLeft; if ((e.deltaY > 0 && at >= max - 1) || (e.deltaY < 0 && at <= 1)) return; e.preventDefault(); wed.scrollLeft = at + e.deltaY; }, { passive: false });
  }

  // Case films: play while on screen, rest when scrolled past.
  if ('IntersectionObserver' in window) Array.prototype.forEach.call(document.querySelectorAll('video[autoplay]'), function (v) {
    var vo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () { }); } else v.pause(); }); }, { threshold: 0.05 });
    vo.observe(v);
  });

  // Anything on screen is revealed, observer or not.
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal],[data-lines],[data-clip],[data-in]'));
  function revealCheck() {
    var vh = innerHeight;
    revealEls = revealEls.filter(function (el) { var r = el.getBoundingClientRect(); if (r.top < vh * 0.92 && r.bottom > 0) { el.classList.add('in'); return false; } return true; });
  }
  function frame() { navTheme(); fillStep(); parStep(); revealCheck(); wedStep(); }
  var ticking = false;
  function onScroll() { if (manual) { frame(); heroStep(performance.now()); return; } if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; frame(); }); }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
  (function loop(now) { requestAnimationFrame(loop); heroStep(now || performance.now()); prevStep(); })(performance.now());
  if (canHover) addEventListener('mousemove', function () { if (manual) { heroStep(performance.now()); prevStep(); } }, { passive: true });

  // Some embedded previews report the page as hidden while it is in plain view: animation frames stop and the document
  // timeline stands still. If the timeline has not moved after half a second, drive animations and transitions from a timer.
  var manual = false, timer = null, worker = null, t0 = document.timeline ? document.timeline.currentTime : null;
  setTimeout(function () { var t1 = document.timeline ? document.timeline.currentTime : null; if (t1 === t0 && (document.hidden || t0 !== null)) startManual(); }, 500);
  function startManual() {
    if (manual) return; manual = true;
    document.documentElement.style.scrollBehavior = 'auto';
    var last = Date.now();
    function tick() {
      var now = Date.now(), dt = Math.min(200, now - last); last = now;
      document.getAnimations().forEach(function (a) { if (a.playState === 'running' || a.playState === 'pending') { try { a.currentTime = (a.currentTime || 0) + dt; } catch (e) { } } });
      frame(); heroStep(performance.now()); prevStep();
      if (window.elidaDraw) window.elidaDraw();
    }
    // Window timers are slowed to one tick a second on a hidden page; a worker's are not.
    try { worker = new Worker(URL.createObjectURL(new Blob(['setInterval(function(){postMessage(0)},16)'], { type: 'text/javascript' }))); worker.onmessage = tick; }
    catch (e) { timer = setInterval(tick, 16); }
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden || !manual) return; document.documentElement.style.scrollBehavior = ''; if (worker) worker.terminate(); if (timer) clearInterval(timer); worker = timer = null; manual = false; });

  // Statue: cursor gaze, read by the 3D scene in the page.
  var st = document.querySelector('[data-statue]');
  if (st) {
    var gaze = window.elidaGaze = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    var lastAim = 0;
    function aim(px, py) {
      var r = st.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height * 0.21;
      var dx = px - cx, dy = py - cy;
      var spanX = dx < 0 ? Math.max(cx, 80) : Math.max(innerWidth - cx, 80);
      var spanY = dy < 0 ? Math.max(cy, 80) : Math.max(innerHeight - cy, 80);
      target.x = Math.max(-1, Math.min(1, dx / spanX));
      target.y = Math.max(-1, Math.min(1, dy / spanY));
      lastAim = performance.now();
    }
    addEventListener('mousemove', function (e) { aim(e.clientX, e.clientY); });
    document.addEventListener('mouseleave', function () { target.x = 0; target.y = 0; });
    // Touch: he follows the finger — while you drag, tap or scroll over him.
    function touchAim(e) { var t = e.touches && e.touches[0]; if (t) aim(t.clientX, t.clientY); }
    addEventListener('touchstart', touchAim, { passive: true });
    addEventListener('touchmove', touchAim, { passive: true });
    var lastT = performance.now();
    function step(now) {
      var k = 1 - Math.pow(0.94, Math.min(64, now - lastT) / 16.7); lastT = now;
      var on = window.ELIDA && ELIDA.tracking && !reduce && window.elidaReady;
      // With no pointer to follow (touch screens), he looks slowly around instead of freezing.
      if (on && !canHover && now - lastAim > 2200) { target.x = Math.sin(now / 3100) * 0.55; target.y = Math.sin(now / 4700) * 0.3; }
      var tx2 = on ? target.x : 0, ty2 = on ? target.y : 0;
      gaze.x += (tx2 - gaze.x) * k; gaze.y += (ty2 - gaze.y) * k;
      if (window.elidaDraw) window.elidaDraw();
    }
    (function tick(now) { requestAnimationFrame(tick); step(now); })(performance.now());
    addEventListener('mousemove', function () { var now = performance.now(); if (now - lastT > 12) step(now); });
  }
})();

// What we do: expandable services (unchanged from the Wix section)
(function () {
      var items = Array.prototype.slice.call(document.querySelectorAll('[data-item]')); if (!items.length) return;
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      function parts(item) { return { tr: item.querySelector('.tr'), panels: [item.querySelector('.body'), item.querySelector('.more')] }; }
      function isOpen(item) { return parts(item).tr.getAttribute('aria-expanded') === 'true'; }
      function setOpen(item, open, instant) {
        var p = parts(item); if (isOpen(item) === open) return;
        p.tr.setAttribute('aria-expanded', open ? 'true' : 'false');
        item.classList.toggle('open', open);
        p.panels.forEach(function (el) {
          el.setAttribute('aria-hidden', open ? 'false' : 'true');
          clearTimeout(el._t);
          if (instant || reduce) { el.style.height = open ? 'auto' : '0px'; return; }
          // Pin the current height, force a layout, then set the target: the browser animates between them without needing an animation frame.
          var from = el.offsetHeight, to = open ? el.scrollHeight : 0;
          el.style.transition = 'none'; el.style.height = from + 'px'; void el.offsetHeight;
          el.style.transition = ''; el.style.height = to + 'px';
          el._t = setTimeout(function () { if (isOpen(item) === open) el.style.height = open ? 'auto' : '0px'; }, 560);
        });
      }
      // One item open at a time keeps the section's tallest state predictable, which the fixed-height Wix embed needs.
      function toggle(item) { var open = !isOpen(item); items.forEach(function (o) { if (o !== item) setOpen(o, false); }); setOpen(item, open); }
      items.forEach(function (item) {
        item.addEventListener('click', function (e) { if (e.target.closest && (e.target.closest('.body') || e.target.closest('.more'))) return; toggle(item); });
        item.querySelector('.tr').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); toggle(item); } });
      });
      // Wrapping. A title that wraps is narrowed to its longest line, so the + sits right after the words.
      function lines(el) {
        var seen = {}, n = 0, r = document.createRange(); r.selectNodeContents(el);
        var rects = r.getClientRects();
        for (var i = 0; i < rects.length; i++) { if (!rects[i].width) continue; var t = Math.round(rects[i].top); if (!seen[t]) { seen[t] = 1; n++; } }
        return n;
      }
      function balance(el) {
        el.style.maxWidth = '';
        var full = el.getBoundingClientRect().width, n = lines(el);
        if (n < 2) return;
        var lo = 0, hi = full;
        for (var i = 0; i < 10; i++) { var mid = (lo + hi) / 2; el.style.maxWidth = mid + 'px'; if (lines(el) > n) lo = mid; else hi = mid; }
        // Never narrower than the longest word, which a two-word title would otherwise overflow.
        el.style.maxWidth = hi + 'px';
        var r = document.createRange(); r.selectNodeContents(el); var rects = r.getClientRects(), w = 0;
        for (var j = 0; j < rects.length; j++) w = Math.max(w, rects[j].width);
        el.style.maxWidth = Math.ceil(Math.max(hi, w) + 0.5) + 'px';
      }
      // Pills: no row with a single pill if it can be helped, above all not the last row. A pill from a row above is sent down (an
      // invisible right margin on the pill before it ends that row early), the rows below reflow, and the change is kept only when
      // it leaves fewer lone pills. A pill too long to share a row with its neighbours stays alone.
      function rowsOf(el) {
        var out = [], last = null, lastTop = null;
        Array.prototype.forEach.call(el.children, function (c) { var r = c.getBoundingClientRect(); if (!r.width) return; if (!last || Math.abs(r.top - lastTop) > 1) { last = []; lastTop = r.top; out.push(last); } last.push(c); });
        return out;
      }
      function unorphan(el) {
        var kids = Array.prototype.slice.call(el.children), breaks = [];
        function apply() {
          kids.forEach(function (k) { k.style.marginRight = ''; });
          var right = el.getBoundingClientRect().right;
          breaks.slice().sort(function (a, b) { return a - b; }).forEach(function (k) { kids[k].style.marginRight = Math.max(0, right - kids[k].getBoundingClientRect().right - 0.5) + 'px'; });
        }
        function badness() { var rs = rowsOf(el), s = rs.length; for (var i = 0; i < rs.length; i++) if (rs[i].length === 1) s += i === rs.length - 1 ? 30 : 10; return s; }
        apply();
        if (kids.length < 3) return;
        var cur = badness();
        for (var guard = 0; guard < 12; guard++) {
          var rows = rowsOf(el), t = -1, improved = false;
          for (var i = rows.length - 1; i >= 0; i--) if (rows[i].length === 1) { t = i; break; }
          if (t < 1) return;
          for (var d = t - 1; d >= 0 && !improved; d--) {
            if (rows[d].length < 2) continue;
            var k = kids.indexOf(rows[d][rows[d].length - 2]);
            if (breaks.indexOf(k) >= 0) continue;
            breaks.push(k); apply();
            var b = badness();
            if (b < cur) { cur = b; improved = true; } else { breaks.pop(); apply(); }
          }
          if (!improved) return;
        }
      }
      var titles = Array.prototype.slice.call(document.querySelectorAll('.title')), tagSets = Array.prototype.slice.call(document.querySelectorAll('.tags'));
      function balanceAll() { titles.forEach(balance); tagSets.forEach(unorphan); }
      balanceAll();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(balanceAll);
      var raf; addEventListener('resize', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(balanceAll); });
      window.elidaBalance = balanceAll;
    })();
