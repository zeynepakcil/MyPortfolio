/* ============================================================
   js/main.js
   - Theme toggle (light/dark, persisted)
   - Animated blob background via requestAnimationFrame
   - Scroll-reveal sections
   - Active nav highlight
   ============================================================ */

(function () {

  // ── Theme ─────────────────────────────────────────────────
  const html      = document.documentElement;
  const toggleBtn = document.getElementById('theme-toggle');
  const themeIcon = toggleBtn && toggleBtn.querySelector('.theme-icon');

  function getTheme() {
    return localStorage.getItem('theme') || 'light';
  }

  function setTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    if (themeIcon) themeIcon.textContent = t === 'dark' ? '☀' : '🌙';
    rebuildBlobs(t);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // ── Scroll reveal ─────────────────────────────────────────
  const revealObs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0 }
  );
  document.querySelectorAll('section').forEach(s => revealObs.observe(s));
  setTimeout(() => document.querySelectorAll('section').forEach(s => s.classList.add('visible')), 300);

  // ── Active nav ────────────────────────────────────────────
  const navLinks = document.querySelectorAll('.nav-links a');
  const navObs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        const a = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (a) a.classList.add('active');
      }
    }),
    { rootMargin: '-40% 0px -55% 0px' }
  );
  document.querySelectorAll('section[id]').forEach(s => navObs.observe(s));

  // ── Blob background ───────────────────────────────────────
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas) bgCanvas.style.display = 'none';

  let blobEls = [];
  let blobStates = [];
  let rafId = null;

  const LIGHT_BLOBS = [
    { color: 'rgba(160,118,68,0.32)', size: 580 },
    { color: 'rgba(180,138,80,0.28)', size: 620 },
    { color: 'rgba(140,100,58,0.35)', size: 520 },
    { color: 'rgba(200,158,98,0.26)', size: 600 },
    { color: 'rgba(168,125,72,0.30)', size: 560 },
  ];

  const DARK_BLOBS = [
    { color: 'rgba(65,32,168,0.55)', size: 580 },
    { color: 'rgba(95,48,210,0.50)', size: 620 },
    { color: 'rgba(42,20,140,0.45)', size: 520 },
    { color: 'rgba(115,55,220,0.52)', size: 600 },
    { color: 'rgba(72,36,182,0.48)', size: 560 },
  ];

  function rebuildBlobs(theme) {
    // Cancel existing animation
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    // Remove old blobs
    blobEls.forEach(el => el.remove());
    blobEls = []; blobStates = [];

    const configs = theme === 'dark' ? DARK_BLOBS : LIGHT_BLOBS;
    const W = window.innerWidth;
    const H = window.innerHeight;

    configs.forEach((cfg, i) => {
      const el = document.createElement('div');
      el.style.cssText = [
        'position:fixed',
        'border-radius:50%',
        'pointer-events:none',
        'z-index:0',
        `width:${cfg.size}px`,
        `height:${cfg.size}px`,
        `background:radial-gradient(circle, ${cfg.color} 0%, transparent 70%)`,
        'will-change:transform',
      ].join(';');
      document.body.appendChild(el);
      blobEls.push(el);

      // Spread start positions across the viewport
      const startX = (0.1 + (i / configs.length) * 0.8) * W - cfg.size / 2;
      const startY = (0.15 + ((i * 0.37) % 0.7)) * H - cfg.size / 2;

      blobStates.push({
        x:  startX,
        y:  startY,
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 1.0,
        phase: i * 1.4,
        size: cfg.size,
      });
    });

    let t = 0;
    const W2 = W, H2 = H;

    function tick() {
      blobStates.forEach((b, i) => {
        // Smooth flowing motion using sine offset on top of velocity
        b.x += b.vx + 0.7 * Math.sin(t * 0.010 + b.phase);
        b.y += b.vy + 0.7 * Math.cos(t * 0.008 + b.phase);

        // Wrap around edges
        if (b.x > W2 + b.size)  b.x = -b.size;
        if (b.x < -b.size)       b.x = W2 + b.size;
        if (b.y > H2 + b.size)  b.y = -b.size;
        if (b.y < -b.size)       b.y = H2 + b.size;

        blobEls[i].style.transform = `translate(${b.x}px,${b.y}px)`;
      });
      t++;
      rafId = requestAnimationFrame(tick);
    }

    tick();
  }

  // Init
  setTheme(getTheme());

})();