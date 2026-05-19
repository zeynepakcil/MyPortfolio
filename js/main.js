/* ============================================================
   js/main.js
   - Scroll-reveal sections
   - Active nav link on scroll
   - Light/Dark theme toggle (persisted in localStorage)
   - Canvas background: Light A (warm drifting blobs)
                        Dark A  (navy aurora sweeps)
   ============================================================ */

(function () {

  // ── Theme toggle ─────────────────────────────────────────
  const html       = document.documentElement;
  const toggleBtn  = document.getElementById('theme-toggle');
  const themeIcon  = toggleBtn?.querySelector('.theme-icon');

  function getTheme() {
    return localStorage.getItem('theme') || 'light';
  }
  function setTheme(t) {
    html.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    if (themeIcon) themeIcon.textContent = t === 'dark' ? '☀' : '🌙';
    updateCanvas(t);
  }

  setTheme(getTheme());

  toggleBtn?.addEventListener('click', () => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  });

  // ── Scroll reveal ─────────────────────────────────────────
  // Use threshold:0 so sections reveal even when mostly off-screen (fixes file:// local preview)
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('section').forEach(s => revealObserver.observe(s));

  // Fallback: if sections still not visible after 300ms, force them all visible
  setTimeout(() => {
    document.querySelectorAll('section').forEach(s => s.classList.add('visible'));
  }, 300);

  // ── Active nav link ───────────────────────────────────────
  const navLinks = document.querySelectorAll('.nav-links a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('section[id]').forEach(s => navObserver.observe(s));

  // ── Canvas background ─────────────────────────────────────
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, raf, currentTheme;
  let blobs = [], auroraBands = [];
  let t = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initBlobs();
    initAurora();
  }

  function initBlobs() {
    blobs = [
      { x:W*0.06, y:H*0.20, rx:170, ry:105, vx:0.12,  vy:0.06,  phase:0.0 },
      { x:W*0.36, y:H*0.55, rx:200, ry:120, vx:-0.09, vy:0.08,  phase:1.2 },
      { x:W*0.68, y:H*0.28, rx:140, ry:88,  vx:0.08,  vy:-0.06, phase:2.4 },
      { x:W*0.88, y:H*0.70, rx:180, ry:110, vx:-0.10, vy:0.07,  phase:0.8 },
      { x:W*0.50, y:H*0.85, rx:125, ry:78,  vx:0.09,  vy:-0.05, phase:3.0 },
      { x:W*0.20, y:H*0.80, rx:150, ry:95,  vx:0.06,  vy:0.09,  phase:1.8 },
      { x:W*0.78, y:H*0.48, rx:115, ry:72,  vx:-0.07, vy:-0.05, phase:4.2 },
    ];
  }

  function initAurora() {
    auroraBands = [
      { phaseMod:0.0,  speedX:0.18,  speedY:0.12,  offX:0.25, offY:0.35, color:[60,30,160],   alpha:0.18, rx:0.55, ry:0.38 },
      { phaseMod:1.6,  speedX:-0.14, speedY:0.10,  offX:0.65, offY:0.55, color:[90,45,200],   alpha:0.14, rx:0.50, ry:0.32 },
      { phaseMod:3.2,  speedX:0.10,  speedY:-0.08, offX:0.45, offY:0.20, color:[40,20,130],   alpha:0.10, rx:0.42, ry:0.28 },
      { phaseMod:0.9,  speedX:-0.12, speedY:0.09,  offX:0.82, offY:0.75, color:[110,50,210],  alpha:0.13, rx:0.38, ry:0.30 },
    ];
  }

  // Light A: warm drifting blobs
  const BLOB_COLS = [
    'rgba(155,112,65,0.075)', 'rgba(175,132,82,0.070)', 'rgba(138,98,55,0.080)',
    'rgba(195,152,95,0.065)', 'rgba(165,122,72,0.085)', 'rgba(148,108,62,0.075)',
    'rgba(182,140,88,0.070)',
  ];

  function drawLight() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#F8F5EF';
    ctx.fillRect(0, 0, W, H);

    blobs.forEach((b, i) => {
      b.x += b.vx + 0.07 * Math.sin(t * 0.22 + b.phase);
      b.y += b.vy + 0.05 * Math.cos(t * 0.17 + b.phase);
      if (b.x < -b.rx * 2) b.x = W + b.rx;
      if (b.x >  W + b.rx * 2) b.x = -b.rx;
      if (b.y < -b.ry * 2) b.y = H + b.ry;
      if (b.y >  H + b.ry * 2) b.y = -b.ry;

      const pulse = 1 + 0.07 * Math.sin(t * 0.32 + b.phase);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(t * 0.035 + b.phase * 0.25);
      ctx.scale(pulse, pulse * 0.72);
      ctx.beginPath();
      ctx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = BLOB_COLS[i % BLOB_COLS.length];
      ctx.fill();
      ctx.restore();
    });
  }

  // Dark A: navy aurora sweeps
  function drawDark() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#080A14';
    ctx.fillRect(0, 0, W, H);

    auroraBands.forEach(b => {
      const cx = W * (b.offX + 0.13 * Math.sin(t * b.speedX + b.phaseMod));
      const cy = H * (b.offY + 0.10 * Math.cos(t * b.speedY + b.phaseMod));
      const rx = W * b.rx;
      const ry = H * b.ry;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0,   `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${b.alpha})`);
      g.addColorStop(0.5, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${b.alpha * 0.5})`);
      g.addColorStop(1,   `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // shimmer streaks
    for (let i = 0; i < 3; i++) {
      const y = H * (0.2 + i * 0.28 + 0.05 * Math.sin(t * 0.15 + i * 1.1));
      const g = ctx.createLinearGradient(0, y - 14, 0, y + 14);
      g.addColorStop(0,   'rgba(120,80,220,0)');
      g.addColorStop(0.5, 'rgba(120,80,220,0.055)');
      g.addColorStop(1,   'rgba(120,80,220,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y - 14, W, 28);
    }
  }

  function loop() {
    if (currentTheme === 'dark') drawDark();
    else drawLight();
    t += 0.006;
    raf = requestAnimationFrame(loop);
  }

  function updateCanvas(theme) {
    currentTheme = theme;
    t = 0; // smooth restart on switch
  }

  window.addEventListener('resize', resize);
  resize();
  loop();

})();