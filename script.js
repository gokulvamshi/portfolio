/* ==========================================================================
   GOKUL VAMSHI — PORTFOLIO BEHAVIOUR
   "NEON NOIR · CINEMATIC BRUTALISM"
   --------------------------------------------------------------------------
   Vanilla JS only. Everything is wrapped in DOMContentLoaded and split into
   clearly-labelled FEATURE blocks. Ctrl+F "FEATURE:" to jump.

   FEATURE INDEX
     FEATURE: Utilities & Environment Flags
     FEATURE: Preloader
     FEATURE: Custom Cursor
     FEATURE: Mouse Spotlight (global lamp)
     FEATURE: Magnetic Button Effect
     FEATURE: 3D Card Tilt Effect (+ cursor glare)
     FEATURE: Scroll Engine (progress, navbar, parallax, DOF, back-to-top)
     FEATURE: Navbar Hide/Show on Scroll
     FEATURE: Active Nav Link Highlighting
     FEATURE: Mobile Menu Toggle
     FEATURE: Smooth Scroll
     FEATURE: Scroll-triggered Animations (IntersectionObserver)
     FEATURE: Split Text Reveal
     FEATURE: Typing Animation
     FEATURE: Glitch Text Effect
     FEATURE: Number Counter Animation
     FEATURE: Skill Meters
     FEATURE: Skills Filter Tabs
     FEATURE: Timeline Spine Fill
     FEATURE: Testimonials Carousel
     FEATURE: Contact Form Validation
     FEATURE: Live Clock
     FEATURE: Dynamic Copyright Year
     FEATURE: Reduce-Glow Accessibility Toggle
     FEATURE: Easter Eggs (Konami code + 5× logo click + confetti)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ==========================================================================
     FEATURE: Utilities & Environment Flags
     Small helpers used by everything below.
     ========================================================================== */

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Does this device have a real pointer? (drives cursor + tilt + magnetism)
  const HAS_HOVER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Does the visitor want less motion? We respect this everywhere.
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Linear interpolation — the backbone of every smooth follow effect.
  const lerp = (a, b, t) => a + (b - a) * t;

  // Clamp a number into a range.
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  // Debounce: run fn only after `wait` ms of silence (used for resize).
  function debounce(fn, wait = 150) {
    let id;
    return (...args) => { clearTimeout(id); id = setTimeout(() => fn(...args), wait); };
  }

  // rAF throttle: guarantees at most one call per animation frame (scroll).
  function rafThrottle(fn) {
    let queued = false;
    return (...args) => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { queued = false; fn(...args); });
    };
  }


  /* ==========================================================================
     FEATURE: Preloader
     Fake-but-believable loading progress, then a cinematic clip-path exit.
     EDIT: change PRELOAD_MIN_MS to make the intro longer or shorter.
     ========================================================================== */
  const PRELOAD_MIN_MS = 2200;   // EDIT: minimum time the intro stays on screen
  const PRELOAD_MAX_MS = 3200;   // EDIT: hard ceiling — the intro NEVER outlasts this

  (function initPreloader() {
    const el = $('#preloader');
    const fill = $('#preloader-fill');
    const pct = $('#preloader-pct');
    const msg = $('#preloader-msg');
    if (!el) return;

    document.body.classList.add('is-locked');        // no scrolling behind the intro

    // Status lines that cycle while loading — pure flavour.
    const MESSAGES = [
      'INITIALISING RENDER PIPELINE',
      'COMPOSITING AURORA LAYERS',
      'CALIBRATING NEON SPECTRUM',
      'LOADING 3D GEOMETRY',
      'READY'
    ];

    const started = performance.now();
    let finished = false;

    // Progress is driven by ELAPSED TIME, not by frame count. On a slow device
    // (or a throttled background tab) a frame-counted bar would crawl; this one
    // always completes on schedule.
    const easeOut = t => 1 - Math.pow(1 - t, 2.2);

    const tick = () => {
      if (finished) return;
      const elapsed = performance.now() - started;
      const progress = Math.min(100, easeOut(elapsed / PRELOAD_MIN_MS) * 100);

      fill.style.width = progress + '%';
      pct.innerHTML = String(Math.floor(progress)).padStart(3, '0') + '<span>%</span>';
      msg.textContent = MESSAGES[Math.min(MESSAGES.length - 1, Math.floor(progress / 25))];

      if (elapsed >= PRELOAD_MIN_MS) finish();
      else requestAnimationFrame(tick);
    };

    function finish() {
      if (finished) return;
      finished = true;
      fill.style.width = '100%';
      pct.innerHTML = '100<span>%</span>';
      msg.textContent = MESSAGES[MESSAGES.length - 1];

      el.classList.add('is-done');
      document.body.classList.remove('is-locked');
      document.body.classList.add('is-loaded');
      // Kick off the hero reveals only after the curtain lifts.
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('site:ready'));
        el.setAttribute('hidden', '');
      }, 1100);
    }

    requestAnimationFrame(tick);
    // Failsafe: guarantee the site is reachable even if rAF is throttled/blocked.
    setTimeout(finish, PRELOAD_MAX_MS);
  })();


  /* ==========================================================================
     FEATURE: Custom Cursor
     Dot = instant. Ring = lerped (lags behind for a weighty, premium feel).
     Completely skipped on touch devices.
     ========================================================================== */
  (function initCursor() {
    if (!HAS_HOVER || REDUCED_MOTION) return;

    const dot = $('#cursor-dot');
    const ring = $('#cursor-ring');
    const label = $('.cursor-ring__label', ring);
    if (!dot || !ring) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;   // target
    let rx = mx, ry = my;                                          // ring position

    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (!document.body.classList.contains('cursor-ready')) {
        document.body.classList.add('cursor-ready');
      }
    }, { passive: true });

    // Ring follows with easing — the signature "lag".
    (function follow() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(follow);
    })();

    // Grow + label the ring over anything interactive.
    const HOVER_SELECTOR = 'a, button, .tilt, .filter, input, textarea, [data-cursor]';
    document.addEventListener('mouseover', e => {
      const target = e.target.closest(HOVER_SELECTOR);
      if (!target) return;
      document.body.classList.add('cursor-hover');
      label.textContent = target.dataset.cursor || '';
    });
    document.addEventListener('mouseout', e => {
      if (!e.target.closest(HOVER_SELECTOR)) return;
      document.body.classList.remove('cursor-hover');
      label.textContent = '';
    });

    // Click pulse
    document.addEventListener('mousedown', () => document.body.classList.add('cursor-down'));
    document.addEventListener('mouseup', () => document.body.classList.remove('cursor-down'));
    // Hide when the pointer leaves the window
    document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-ready'));
  })();


  /* ==========================================================================
     FEATURE: Mouse Spotlight (global lamp)
     A giant radial gradient that trails the cursor and lights up whatever
     it passes over. Lerped so it feels like a physical lamp with mass.
     ========================================================================== */
  (function initSpotlight() {
    if (!HAS_HOVER || REDUCED_MOTION) return;
    const root = document.documentElement;

    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;

    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });

    (function move() {
      cx = lerp(cx, tx, 0.07);
      cy = lerp(cy, ty, 0.07);
      root.style.setProperty('--mx', cx + 'px');
      root.style.setProperty('--my', cy + 'px');
      requestAnimationFrame(move);
    })();
  })();


  /* ==========================================================================
     FEATURE: Magnetic Button Effect
     Elements with .magnetic pull toward the cursor within a radius.
     ========================================================================== */
  (function initMagnetic() {
    if (!HAS_HOVER || REDUCED_MOTION) return;

    const RADIUS = 110;   // EDIT: how close the cursor must be (px)
    const STRENGTH = 0.32;  // EDIT: 0 = no pull, 1 = element sticks to cursor

    $$('.magnetic').forEach(el => {
      let raf = null, curX = 0, curY = 0, tgtX = 0, tgtY = 0;

      const animate = () => {
        curX = lerp(curX, tgtX, 0.18);
        curY = lerp(curY, tgtY, 0.18);
        el.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
        if (Math.abs(curX - tgtX) > 0.1 || Math.abs(curY - tgtY) > 0.1) {
          raf = requestAnimationFrame(animate);
        } else { raf = null; }
      };

      const onMove = e => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS + Math.max(r.width, r.height) / 2) {
          tgtX = dx * STRENGTH;
          tgtY = dy * STRENGTH;
        } else { tgtX = 0; tgtY = 0; }
        if (!raf) raf = requestAnimationFrame(animate);
      };

      window.addEventListener('mousemove', onMove, { passive: true });
      el.addEventListener('mouseleave', () => {
        tgtX = 0; tgtY = 0;
        if (!raf) raf = requestAnimationFrame(animate);
      });
    });
  })();


  /* ==========================================================================
     FEATURE: 3D Card Tilt Effect (+ cursor glare)
     Any element with [data-tilt] rotates toward the pointer. The glare
     (.tilt__glare) follows the cursor via --gx / --gy CSS variables.
     Degrades to a flat card on touch — no JS runs at all there.
     ========================================================================== */
  (function initTilt() {
    if (!HAS_HOVER || REDUCED_MOTION) return;

    $$('[data-tilt]').forEach(card => {
      const MAX = parseFloat(card.dataset.tiltMax || 12);   // EDIT: max degrees
      const glare = $('.tilt__glare', card);
      let raf = null, tRX = 0, tRY = 0, cRX = 0, cRY = 0, lift = 0, tLift = 0;

      const render = () => {
        cRX = lerp(cRX, tRX, 0.14);
        cRY = lerp(cRY, tRY, 0.14);
        lift = lerp(lift, tLift, 0.14);
        card.style.transform =
          `perspective(1000px) rotateX(${cRX}deg) rotateY(${cRY}deg) translate3d(0,${-lift}px,${lift}px) scale(${1 + lift * 0.0016})`;
        if (Math.abs(cRX - tRX) > 0.01 || Math.abs(cRY - tRY) > 0.01 || Math.abs(lift - tLift) > 0.01) {
          raf = requestAnimationFrame(render);
        } else { raf = null; }
      };

      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;     // 0 → 1 across the card
        const py = (e.clientY - r.top) / r.height;
        tRY = (px - 0.5) * 2 * MAX;                   // left/right → rotateY
        tRX = -(py - 0.5) * 2 * MAX;                   // up/down    → rotateX
        tLift = 6;
        if (glare) {
          glare.style.setProperty('--gx', (px * 100) + '%');
          glare.style.setProperty('--gy', (py * 100) + '%');
        }
        if (!raf) raf = requestAnimationFrame(render);
      });

      card.addEventListener('mouseleave', () => {
        tRX = 0; tRY = 0; tLift = 0;
        if (!raf) raf = requestAnimationFrame(render);
      });
    });
  })();


  /* ==========================================================================
     FEATURE: Scroll Engine
     ONE scroll listener drives: progress bar, navbar state, parallax layers,
     depth-of-field, timeline fill and the back-to-top button. Batching these
     into a single rAF-throttled handler is what keeps this page at 60fps.
     ========================================================================== */
  (function initScrollEngine() {
    const root = document.documentElement;
    const progressBar = $('#scroll-progress-bar');
    const navbar = $('#navbar');
    const toTop = $('#to-top');
    const toTopProg = $('#to-top-prog');
    const parallaxEls = $$('[data-parallax]').filter(el => !el.classList.contains('watermark'));
    const watermarks = $$('.watermark');
    const sections = $$('.section');
    const tlFill = $('#tl-fill');
    const timeline = $('.tl');

    let lastY = window.scrollY;   // for the hide/show navbar
    let ticking = false;

    // Flag: true while a programmatic nav-click scroll is in progress.
    // Shared with the Smooth Scroll feature so the navbar stays visible.
    window.__navScrolling = false;

    const onScroll = rafThrottle(() => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight - vh;
      const ratio = docH > 0 ? clamp(y / docH, 0, 1) : 0;

      /* ---- Scroll progress bar (top hairline) ---- */
      if (progressBar) progressBar.style.width = (ratio * 100) + '%';

      /* ---- Expose scroll ratio to CSS (drives aurora hue rotation) ---- */
      root.style.setProperty('--scroll', ratio.toFixed(4));

      /* ---- FEATURE: Navbar Hide/Show on Scroll ---- */
      if (navbar) {
        navbar.classList.toggle('is-solid', y > 80);
        const goingDown = y > lastY && y > 320;
        // Never hide the navbar while the mobile menu is open or during a
        // programmatic nav-click scroll.
        const menuOpen = document.body.classList.contains('menu-open');
        const navScrolling = window.__navScrolling;
        navbar.classList.toggle('is-hidden', goingDown && !menuOpen && !navScrolling);
      }
      lastY = y;

      /* ---- Back-to-top visibility + circular progress ring ---- */
      if (toTop) {
        toTop.classList.toggle('is-visible', y > vh * 0.6);
        if (toTopProg) toTopProg.style.strokeDashoffset = String(126 - 126 * ratio);
      }

      /* ---- Parallax layers (orbs, geometry, watermarks) ---- */
      if (!REDUCED_MOTION) {
        parallaxEls.forEach(el => {
          const speed = parseFloat(el.dataset.parallax) || 0.2;
          const rect = el.getBoundingClientRect();
          // Only move elements that are near the viewport (cheap culling).
          if (rect.bottom < -vh || rect.top > vh * 2) return;
          const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
          // `translate` (not `transform`) so CSS keyframe rotations survive.
          el.style.translate = `0 ${offset.toFixed(2)}px`;
        });

        // Watermarks drift horizontally as well for extra parallax richness.
        watermarks.forEach((wm, i) => {
          const rect = wm.getBoundingClientRect();
          if (rect.bottom < -vh || rect.top > vh * 2) return;
          const p = (rect.top - vh / 2) / vh;
          const dir = i % 2 === 0 ? 1 : -1;
          wm.style.translate = `calc(-50% + ${(p * 60 * dir).toFixed(1)}px) ${(p * -30).toFixed(1)}px`;
        });

        /* ---- Depth-of-field: sections far from the viewport centre blur ---- */
        sections.forEach(sec => {
          const r = sec.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) { sec.classList.remove('is-dof'); return; }
          const secCenter = r.top + r.height / 2;
          const dist = Math.abs(secCenter - vh / 2) / vh;       // 0 = centred
          const dof = clamp((dist - 0.7) * 1.4, 0, 1);
          sec.classList.toggle('is-dof', dof > 0.01);
          sec.style.setProperty('--dof', dof.toFixed(3));
        });
      }

      /* ---- FEATURE: Timeline Spine Fill ---- */
      if (tlFill && timeline) {
        const r = timeline.getBoundingClientRect();
        const filled = clamp((vh * 0.7 - r.top) / r.height, 0, 1);
        tlFill.style.height = (filled * 100).toFixed(1) + '%';
      }
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', debounce(onScroll, 120));
    onScroll();
  })();


  /* ==========================================================================
     FEATURE: Active Nav Link Highlighting
     Watches every [data-section] and lights the matching nav link.
     ========================================================================== */
  (function initActiveNav() {
    const links = $$('.nav__link');
    const map = new Map(links.map(l => [l.dataset.nav, l]));
    const watched = $$('[data-section]');
    if (!watched.length) return;

    const io = new IntersectionObserver(entries => {
      // Pick the most-visible section currently intersecting.
      let best = null;
      entries.forEach(en => {
        if (en.isIntersecting && (!best || en.intersectionRatio > best.intersectionRatio)) best = en;
      });
      if (!best) return;
      const id = best.target.dataset.section;
      links.forEach(l => l.classList.remove('is-active'));
      map.get(id)?.classList.add('is-active');
    }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] });

    watched.forEach(s => io.observe(s));
  })();


  /* ==========================================================================
     FEATURE: Mobile Menu Toggle
     Hamburger morphs to X, full-screen overlay slides in, body scroll locks.
     ========================================================================== */
  (function initMobileMenu() {
    const burger = $('#burger');
    const menu = $('#mobile-menu');
    if (!burger || !menu) return;

    const setOpen = open => {
      burger.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
      document.body.classList.toggle('menu-open', open);
    };

    burger.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    // Any link inside the overlay closes it.
    $$('.mobile-menu__link, .mobile-menu__socials a', menu).forEach(a =>
      a.addEventListener('click', () => setOpen(false)));
    // Escape closes it.
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
    });
    // Closing the menu on resize prevents a stuck overlay on rotation.
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 900 && menu.classList.contains('is-open')) setOpen(false);
    }, 150));
  })();


  /* ==========================================================================
     FEATURE: Smooth Scroll
     CSS handles scroll-behavior:smooth; this adds nav-height offsetting and
     a JS eased fallback for browsers/settings where CSS smoothing is off.
     ========================================================================== */
  (function initSmoothScroll() {
    const NAV_OFFSET = 84;   // EDIT: match the navbar height
    const htmlEl = document.documentElement;

    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function scrollToY(targetY, duration = 900, isNavClick = false) {
      // Temporarily disable CSS scroll-behavior:smooth so that the
      // per-frame window.scrollTo() calls jump instantly instead of each
      // starting their own browser-native smooth-scroll animation.
      htmlEl.style.scrollBehavior = 'auto';

      // Tell the navbar-hide logic to stay visible during nav-click scrolls.
      if (isNavClick) window.__navScrolling = true;

      if (REDUCED_MOTION) {
        window.scrollTo(0, targetY);
        htmlEl.style.scrollBehavior = '';
        window.__navScrolling = false;
        return;
      }

      const startY = window.scrollY;
      const delta = targetY - startY;
      if (Math.abs(delta) < 2) {
        htmlEl.style.scrollBehavior = '';
        window.__navScrolling = false;
        return;
      }
      const start = performance.now();
      (function step(now) {
        const t = clamp((now - start) / duration, 0, 1);
        window.scrollTo(0, startY + delta * easeInOutCubic(t));
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          // Restore CSS scroll-behavior and clear the nav-scrolling flag.
          htmlEl.style.scrollBehavior = '';
          window.__navScrolling = false;
        }
      })(start);
    }

    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
        scrollToY(Math.max(0, y), 900, true);
        history.replaceState(null, '', id);
      });
    });

    // Back-to-top button
    $('#to-top')?.addEventListener('click', () => scrollToY(0, 1000, true));
  })();


  /* ==========================================================================
     FEATURE: Scroll-triggered Animations (IntersectionObserver)
     Adds .is-visible to any .reveal element, honouring [data-delay] for
     stagger cascades. Elements only animate once.
     ========================================================================== */
  (function initReveals() {
    const items = $$('.reveal, .tl__item');
    if (!items.length) return;

    if (REDUCED_MOTION) { items.forEach(el => el.classList.add('is-visible')); return; }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const delay = parseInt(el.dataset.delay || 0, 10);
        el.style.setProperty('--reveal-delay', delay + 'ms');
        el.classList.add('is-visible');
        obs.unobserve(el);                                  // one-shot
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    items.forEach(el => io.observe(el));

    /* --- Stagger cascade: auto-delay siblings inside these containers --- */
    const STAGGER_PARENTS = ['.projects__grid', '.skills__grid', '.about__blocks', '.exp__col'];
    STAGGER_PARENTS.forEach(sel => {
      $$(sel).forEach(parent => {
        $$('.reveal', parent).forEach((child, i) => {
          if (!child.dataset.delay) child.dataset.delay = String(i * 90);
        });
      });
    });
  })();


  /* ==========================================================================
     FEATURE: Split Text Reveal
     Splits every .split-text heading into words, each wrapped so it can slide
     up from behind a mask with a per-word stagger.
     ========================================================================== */
  (function initSplitText() {
    $$('.split-text').forEach(el => {
      const words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach((w, i) => {
        const span = document.createElement('span');
        span.className = 'word';
        span.style.setProperty('--w', i);
        const inner = document.createElement('i');
        inner.textContent = w;
        span.appendChild(inner);
        el.appendChild(span);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
    });
  })();


  /* ==========================================================================
     FEATURE: Typing Animation
     Types → pauses → deletes → moves to the next phrase, forever.
     EDIT: add or remove phrases in the ROLES array below.
     ========================================================================== */
  (function initTyping() {
    const out = $('#typed-text');
    if (!out) return;

    const ROLES = [                       // EDIT: your rotating titles
      'Web Developer',
      'Creative Coder',
      'UI/UX Enthusiast',
      'Problem Solver',
      'Student & Lifelong Learner'
    ];

    const TYPE_MS = 65;    // EDIT: typing speed per character
    const DELETE_MS = 32;    // EDIT: deleting speed per character
    const HOLD_MS = 1500;  // EDIT: pause once a phrase is fully typed

    if (REDUCED_MOTION) { out.textContent = ROLES[0]; return; }

    let idx = 0, char = 0, deleting = false;

    (function loop() {
      const word = ROLES[idx];
      char += deleting ? -1 : 1;
      out.textContent = word.slice(0, char);

      let delay = deleting ? DELETE_MS : TYPE_MS;
      if (!deleting && char === word.length) { deleting = true; delay = HOLD_MS; }
      else if (deleting && char === 0) { deleting = false; idx = (idx + 1) % ROLES.length; delay = 320; }

      setTimeout(loop, delay);
    })();
  })();


  /* ==========================================================================
     FEATURE: Glitch Text Effect
     Periodically flickers the hero name with RGB channel separation.
     ========================================================================== */
  (function initGlitch() {
    const lines = $$('.glitch');
    if (!lines.length || REDUCED_MOTION) return;

    const fire = () => {
      lines.forEach((l, i) => {
        setTimeout(() => {
          l.classList.add('is-glitching');
          setTimeout(() => l.classList.remove('is-glitching'), 380);
        }, i * 70);
      });
      // Random interval so it never feels mechanical.
      setTimeout(fire, 3600 + Math.random() * 5200);
    };
    setTimeout(fire, 2600);

    // Also glitch on hover — instant feedback.
    lines.forEach(l => l.addEventListener('mouseenter', () => {
      l.classList.add('is-glitching');
      setTimeout(() => l.classList.remove('is-glitching'), 380);
    }));
  })();


  /* ==========================================================================
     FEATURE: Number Counter Animation
     Counts 0 → data-count when the stats row scrolls into view.
     EDIT: change data-count / data-suffix in index.html.
     ========================================================================== */
  (function initCounters() {
    const nums = $$('.stat__num');
    if (!nums.length) return;

    const run = el => {
      const target = parseFloat(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      const DURATION = 1900;
      if (REDUCED_MOTION) { el.textContent = target + suffix; return; }

      const start = performance.now();
      const easeOut = t => 1 - Math.pow(1 - t, 3);
      (function step(now) {
        const t = clamp((now - start) / DURATION, 0, 1);
        const val = Math.floor(target * easeOut(t));
        el.textContent = val.toLocaleString('en-US') + (t === 1 ? suffix : '');
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target.toLocaleString('en-US') + suffix;
      })(start);
    };

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { run(en.target); obs.unobserve(en.target); } });
    }, { threshold: 0.5 });

    nums.forEach(n => io.observe(n));
  })();


  /* ==========================================================================
     FEATURE: Skill Meters
     Fills each card's level bar from its data-level attribute on reveal.
     ========================================================================== */
  (function initMeters() {
    const cards = $$('.skill-card');
    if (!cards.length) return;

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const card = en.target;
        const fill = $('.meter__fill', card);
        const lvl = card.dataset.level || 0;
        if (fill) setTimeout(() => { fill.style.width = lvl + '%'; }, 120);
        obs.unobserve(card);
      });
    }, { threshold: 0.3 });

    cards.forEach(c => io.observe(c));

    // Show the % readout on hover (tooltip-ish, follows the card).
    cards.forEach(c => {
      const lvl = $('.skill-card__lvl', c);
      if (!lvl) return;
      c.addEventListener('mouseenter', () => lvl.style.opacity = '1');
      c.addEventListener('mouseleave', () => lvl.style.opacity = '0');
    });
  })();


  /* ==========================================================================
     FEATURE: Skills Filter Tabs
     Filters cards by tier with a smooth fade/scale reflow, and slides the
     active pill behind whichever tab is selected.
     ========================================================================== */
  (function initSkillFilters() {
    const bar = $('.filters');
    const pill = $('#filters-pill');
    const tabs = $$('.filter');
    const cards = $$('#skills-grid .skill-card');
    if (!bar || !tabs.length) return;

    // Move the gradient pill under the active tab.
    const movePill = tab => {
      if (!pill) return;
      pill.style.width = tab.offsetWidth + 'px';
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    };

    const applyFilter = value => {
      cards.forEach((card, i) => {
        const match = value === 'all' || card.dataset.tier === value;
        if (match) {
          card.classList.remove('is-filtered-out');
          card.style.transitionDelay = (i % 8) * 35 + 'ms';
        } else {
          card.classList.add('is-filtered-out');
          card.style.transitionDelay = '0ms';
        }
      });
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        movePill(tab);
        applyFilter(tab.dataset.filter);
      });
    });

    // Initial pill placement (and again after fonts load / on resize).
    const place = () => movePill($('.filter.is-active') || tabs[0]);
    place();
    window.addEventListener('resize', debounce(place, 120));
    window.addEventListener('load', place);
    if (document.fonts?.ready) document.fonts.ready.then(place);
  })();


  /* ==========================================================================
     FEATURE: Testimonials Carousel
     Auto-advances, supports arrows, dots, keyboard and touch swipe.
     ========================================================================== */
  (function initCarousel() {
    const track = $('#tst-track');
    const dots = $('#tst-dots');
    const prev = $('#tst-prev');
    const next = $('#tst-next');
    if (!track) return;

    const cards = $$('.tst__card', track);
    if (!cards.length) return;

    let index = 0;
    let timer = null;
    const AUTOPLAY_MS = 5200;   // EDIT: 0 to disable autoplay

    // Build the dot navigation.
    cards.forEach((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'tst__dot' + (i === 0 ? ' is-active' : '');
      d.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      d.addEventListener('click', () => go(i));
      dots?.appendChild(d);
    });

    function go(i) {
      index = (i + cards.length) % cards.length;
      // Translate the track so card[index] sits at the left edge of the viewport.
      const first = cards[0].getBoundingClientRect();
      const cur = cards[index].getBoundingClientRect();
      const shift = cur.left - first.left;
      track.style.transform = `translate3d(${-shift}px, 0, 0)`;
      $$('.tst__dot', dots).forEach((d, di) => d.classList.toggle('is-active', di === index));
      restart();
    }

    function restart() {
      if (!AUTOPLAY_MS || REDUCED_MOTION) return;
      clearInterval(timer);
      timer = setInterval(() => go(index + 1), AUTOPLAY_MS);
    }

    next?.addEventListener('click', () => go(index + 1));
    prev?.addEventListener('click', () => go(index - 1));

    // Pause autoplay while hovering the carousel.
    track.addEventListener('mouseenter', () => clearInterval(timer));
    track.addEventListener('mouseleave', restart);

    // Touch swipe support.
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1)); else restart();
    }, { passive: true });

    // Recalculate on resize so the offset stays correct.
    window.addEventListener('resize', debounce(() => go(index), 150));
    restart();
  })();


  /* ==========================================================================
     FEATURE: Contact Form — Mail / WhatsApp Toggle
     Two modes controlled by a segmented toggle.
       • MAIL   → Submits to Formspree via native form POST (hidden iframe).
       • WHATSAPP → Builds a wa.me link and opens it in a new tab.
     ========================================================================== */
  (function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    // ── CONFIG ────────────────────────────────────────────────────────────
    const WA_NUMBER = '917671929578';   // EDIT: your WhatsApp number with country code, digits only (e.g. '919876543210')
    // ──────────────────────────────────────────────────────────────────────

    const btn = $('#form-submit');
    const btnLabel = $('#btn-label');
    const btnIcon = $('#btn-icon');
    const status = $('#form-status');
    const formTitle = $('#form-title');
    const toggle = $('#form-mode-toggle');
    const iframe = $('#formspree-frame');
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    let mode = 'mail';   // 'mail' | 'whatsapp'

    // ── Field definitions per mode ───────────────────────────────────────
    const mailFields = [
      { input: $('#f-name'), err: $('#err-name'), test: v => v.trim().length >= 2, msg: 'Please enter your name (2+ characters).' },
      { input: $('#f-email'), err: $('#err-email'), test: v => EMAIL_RE.test(v.trim()), msg: 'Please enter a valid email address.' },
      { input: $('#f-subject'), err: $('#err-subject'), test: v => v.trim().length >= 3, msg: 'Subject needs at least 3 characters.' },
      { input: $('#f-message'), err: $('#err-message'), test: v => v.trim().length >= 10, msg: 'Tell me a bit more — 10 characters minimum.' }
    ];

    const waFields = [
      { input: $('#f-name'), err: $('#err-name'), test: v => v.trim().length >= 2, msg: 'Please enter your name (2+ characters).' },
      { input: $('#f-who'), err: $('#err-who'), test: v => v.trim().length >= 2, msg: 'Please tell me who you are (2+ characters).' },
      { input: $('#f-message'), err: $('#err-message'), test: v => v.trim().length >= 10, msg: 'Tell me a bit more — 10 characters minimum.' }
    ];

    const getActiveFields = () => mode === 'mail' ? mailFields : waFields;

    // ── Error helpers ────────────────────────────────────────────────────
    const setError = (f, message) => {
      const wrap = f.input?.closest('.field');
      if (!wrap) return;
      if (message) { wrap.classList.add('has-error'); f.err.textContent = message; f.input.setAttribute('aria-invalid', 'true'); }
      else { wrap.classList.remove('has-error'); f.err.textContent = ''; f.input.removeAttribute('aria-invalid'); }
    };

    // Live-clear errors as user types / blurs.
    [...mailFields, ...waFields].forEach(f => {
      f.input?.addEventListener('input', () => { if (f.test(f.input.value)) setError(f, ''); });
      f.input?.addEventListener('blur', () => { if (f.input.value && !f.test(f.input.value)) setError(f, f.msg); });
    });

    // ── Toggle logic ─────────────────────────────────────────────────────
    const mailOnlyEls = $$('.mail-only');
    const waOnlyEls = $$('.wa-only');

    function setMode(newMode) {
      mode = newMode;

      // Toggle button active states
      $('#mode-mail').classList.toggle('is-active', mode === 'mail');
      $('#mode-mail').setAttribute('aria-pressed', mode === 'mail');
      $('#mode-whatsapp').classList.toggle('is-active', mode === 'whatsapp');
      $('#mode-whatsapp').setAttribute('aria-pressed', mode === 'whatsapp');

      // Slider highlight
      toggle.classList.toggle('wa-active', mode === 'whatsapp');

      // Show/hide fields
      mailOnlyEls.forEach(el => {
        el.classList.toggle('is-hidden', mode !== 'mail');
        if (mode !== 'mail') el.style.display = '';
        else el.style.display = '';
      });
      waOnlyEls.forEach(el => {
        el.classList.toggle('is-hidden', mode !== 'whatsapp');
        el.style.display = mode === 'whatsapp' ? '' : 'none';
      });

      // Update button label + icon + title
      if (mode === 'mail') {
        btnLabel.textContent = 'Send Message';
        btnIcon.className = 'fa-solid fa-paper-plane';
        formTitle.textContent = '// SEND A MESSAGE';
      } else {
        btnLabel.textContent = 'Open WhatsApp';
        btnIcon.className = 'fa-brands fa-whatsapp';
        formTitle.textContent = '// SEND VIA WHATSAPP';
      }

      // Clear previous errors & status
      [...mailFields, ...waFields].forEach(f => setError(f, ''));
      status.textContent = '';
      status.className = 'form__status mono';
    }

    // Bind toggle buttons
    $('#mode-mail').addEventListener('click', () => setMode('mail'));
    $('#mode-whatsapp').addEventListener('click', () => setMode('whatsapp'));

    // Initial state: WhatsApp fields hidden
    waOnlyEls.forEach(el => { el.style.display = 'none'; el.classList.add('is-hidden'); });

    // ── Formspree success detection via iframe load ──────────────────────
    let expectingIframeLoad = false;

    iframe.addEventListener('load', () => {
      if (!expectingIframeLoad) return;
      expectingIframeLoad = false;

      btn.classList.remove('is-loading');
      status.textContent = '// MESSAGE SENT — THANK YOU, I\'LL REPLY SOON';
      status.className = 'form__status mono is-ok';
      form.reset();
      setTimeout(() => { status.textContent = ''; }, 6000);
    });

    // ── Form submit handler ──────────────────────────────────────────────
    form.addEventListener('submit', e => {
      e.preventDefault();

      // Validate active fields
      let valid = true, firstBad = null;
      getActiveFields().forEach(f => {
        if (!f.input) return;
        if (!f.test(f.input.value)) { setError(f, f.msg); valid = false; firstBad = firstBad || f.input; }
        else setError(f, '');
      });

      if (!valid) {
        status.textContent = '// VALIDATION FAILED — CHECK HIGHLIGHTED FIELDS';
        status.className = 'form__status mono is-bad';
        firstBad?.focus();
        return;
      }

      if (mode === 'mail') {
        // ── MAIL: Native form POST to Formspree via hidden iframe ──────
        btn.classList.add('is-loading');
        status.textContent = '// TRANSMITTING…';
        status.className = 'form__status mono';
        expectingIframeLoad = true;

        // Let the browser do the native POST — the form already has
        // action, method="POST", and target="formspree-frame".
        form.submit();

        // Safety timeout in case the iframe doesn't fire 'load'
        setTimeout(() => {
          if (expectingIframeLoad) {
            expectingIframeLoad = false;
            btn.classList.remove('is-loading');
            status.textContent = '// MESSAGE SENT — THANK YOU!';
            status.className = 'form__status mono is-ok';
            form.reset();
            setTimeout(() => { status.textContent = ''; }, 6000);
          }
        }, 5000);

      } else {
        // ── WHATSAPP: Build wa.me link and open ────────────────────────
        const name = $('#f-name').value.trim();
        const who = ($('#f-who')?.value || '').trim();
        const message = $('#f-message').value.trim();

        const text = `Hi, I'm *${name}*${who ? ` (${who})` : ''}.\n\n${message}`;
        const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

        window.open(url, '_blank');

        status.textContent = '// WHATSAPP OPENED — SEE YOU THERE!';
        status.className = 'form__status mono is-ok';
        form.reset();
        setTimeout(() => { status.textContent = ''; }, 6000);
      }
    });
  })();


  /* ==========================================================================
     FEATURE: Live Clock (hero status bar)
     Shows the owner's local time so the page feels alive.
     ========================================================================== */
  (function initClock() {
    const el = $('#hero-clock');
    if (!el) return;
    const tick = () => {
      const now = new Date();
      el.textContent = now.toLocaleTimeString('en-GB', { hour12: false });
    };
    tick();
    setInterval(tick, 1000);
  })();


  /* ==========================================================================
     FEATURE: Dynamic Copyright Year
     ========================================================================== */
  (function initYear() {
    const y = new Date().getFullYear();
    const el = $('#year');
    if (el) el.textContent = y;
    const heroYear = $('.hero__year');
    if (heroYear) heroYear.textContent = y;
  })();


  /* ==========================================================================
     FEATURE: Reduce-Glow Accessibility Toggle
     Dials the neon down (CSS --glow-strength) for light-sensitive visitors.
     Choice is remembered in localStorage.
     ========================================================================== */
  (function initGlowToggle() {
    const btn = $('#glow-toggle');
    if (!btn) return;

    const KEY = 'gv-reduce-glow';
    const apply = on => {
      document.body.classList.toggle('reduce-glow', on);
      btn.setAttribute('aria-pressed', String(on));
    };

    let saved = false;
    try { saved = localStorage.getItem(KEY) === '1'; } catch (_) { }
    apply(saved);

    btn.addEventListener('click', () => {
      const on = !document.body.classList.contains('reduce-glow');
      apply(on);
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (_) { }
    });
  })();


  /* ==========================================================================
     FEATURE: Easter Eggs
     1) Konami code (↑↑↓↓←→←→BA) → confetti burst + rave hue-rotate.
     2) Clicking the logo 5× quickly → confetti + a secret toast.
     ========================================================================== */
  (function initEasterEggs() {
    const canvas = $('#confetti-canvas');
    const toast = $('#egg-toast');
    const ctx = canvas?.getContext('2d');

    /* ---- Tiny confetti engine (canvas, ~60 lines, no library) ---- */
    let pieces = [], running = false;

    function sizeCanvas() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeCanvas();
    window.addEventListener('resize', debounce(sizeCanvas, 200));

    const COLORS = ['#00f0ff', '#ff2d75', '#f5a623', '#a78bfa', '#4d7cff', '#ffffff'];

    function burst(count = 160) {
      if (!ctx || REDUCED_MOTION) return;
      canvas.classList.add('is-live');
      const cx = window.innerWidth / 2, cy = window.innerHeight * 0.45;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 11;
        pieces.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          w: 5 + Math.random() * 7,
          h: 3 + Math.random() * 5,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.32,
          color: COLORS[(Math.random() * COLORS.length) | 0],
          life: 1
        });
      }
      if (!running) { running = true; requestAnimationFrame(drawConfetti); }
    }

    function drawConfetti() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      pieces.forEach(p => {
        p.vy += 0.22;                 // gravity
        p.vx *= 0.995;                // drag
        p.x += p.vx; p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.006;
        ctx.save();
        ctx.globalAlpha = clamp(p.life, 0, 1);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      pieces = pieces.filter(p => p.life > 0 && p.y < window.innerHeight + 60);
      if (pieces.length) requestAnimationFrame(drawConfetti);
      else { running = false; canvas.classList.remove('is-live'); ctx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
    }

    /* ---- Toast helper ---- */
    let toastTimer;
    function showToast(text) {
      if (!toast) return;
      toast.textContent = text;
      toast.classList.add('is-shown');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 4200);
    }

    /* ---- Easter egg 1: Konami code ---- */
    const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let pos = 0;
    document.addEventListener('keydown', e => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = (key === KONAMI[pos]) ? pos + 1 : (key === KONAMI[0] ? 1 : 0);
      if (pos === KONAMI.length) {
        pos = 0;
        burst(220);
        showToast('⚡ KONAMI UNLOCKED — 30 EXTRA LIVES GRANTED');
        if (!REDUCED_MOTION) {
          document.body.classList.add('rave-mode');
          setTimeout(() => document.body.classList.remove('rave-mode'), 4800);
        }
      }
    });

    /* ---- Easter egg 2: click the logo 5× ---- */
    const logo = $('#logo');
    let clicks = 0, clickTimer;
    logo?.addEventListener('click', () => {
      clicks++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clicks = 0; }, 1200);
      if (clicks === 5) {
        clicks = 0;
        burst(140);
        showToast('👾 YOU FOUND THE SECRET — BUILT WITH 0 FRAMEWORKS');
      }
    });

    /* ---- Console signature (developers always look) ---- */
    console.log(
      '%c GOKUL VAMSHI %c Neon Noir Portfolio ',
      'background:#00f0ff;color:#030303;font-weight:700;padding:4px 8px;border-radius:4px 0 0 4px',
      'background:#ff2d75;color:#fff;font-weight:700;padding:4px 8px;border-radius:0 4px 4px 0'
    );
    console.log('%cHand-coded in vanilla HTML, CSS & JS. Try the Konami code ↑↑↓↓←→←→BA', 'color:#f5a623');
  })();


  /* ==========================================================================
     FEATURE: Hero entrance after the preloader
     Reveal elements that sit above the fold get their class once the curtain
     lifts, so the intro animation isn't wasted behind the overlay.
     ========================================================================== */
  document.addEventListener('site:ready', () => {
    $$('.hero .reveal').forEach((el, i) => {
      const delay = parseInt(el.dataset.delay || 0, 10) || i * 70;
      el.style.setProperty('--reveal-delay', delay + 'ms');
      el.classList.add('is-visible');
    });
  });

  // Safety net: if the 'site:ready' event never fires (e.g. preloader removed),
  // make sure nothing stays invisible.
  setTimeout(() => {
    $$('.reveal:not(.is-visible)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('is-visible');
    });
  }, 5000);

}); /* end DOMContentLoaded */
