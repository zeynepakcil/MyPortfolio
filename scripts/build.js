#!/usr/bin/env node
// ============================================================
//  scripts/build.js
//  Reads all YAML data files → renders dist/index.html
//
//  npm run build        one-time build
//  npm run watch        rebuild on every data/*.yaml change
// ============================================================

const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ── Load all data/*.yaml files into one flat object ──────────
function loadData() {
  const dataDir = path.join(__dirname, '..', 'data');
  const data    = {};
  for (const file of fs.readdirSync(dataDir).sort()) {
    if (!/\.ya?ml$/.test(file)) continue;
    const raw = fs.readFileSync(path.join(dataDir, file), 'utf8');
    Object.assign(data, yaml.load(raw));
  }
  return data;
}

// ── HTML escape ───────────────────────────────────────────────
const e = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Tag rendering ─────────────────────────────────────────────
function tagClass(style) {
  if (style === 'brown') return 'tag alt';
  if (style === 'green') return 'tag green';
  return 'tag';
}
function renderTag(t) {
  if (typeof t === 'string') return `<span class="tag">${e(t)}</span>`;
  return `<span class="${tagClass(t.style)}">${e(t.label)}</span>`;
}

// ── Section renderers ─────────────────────────────────────────

function renderNav(nav) {
  return nav.map(n =>
    `<li><a href="${e(n.href)}">${e(n.label)}</a></li>`
  ).join('\n    ');
}

function renderHeroButtons(links) {
  const defs = [
    { key: 'email',         label: 'Email Me',     href: l => `mailto:${l}`, primary: true },
    { key: 'cv',            label: '↓ Résumé',  href: l => l },
    { key: 'github',        label: 'GitHub',        href: l => l },
    { key: 'linkedin',      label: 'LinkedIn',     href: l => l },
    { key: 'scholar',       label: 'GoogleScholar',       href: l => l },
    { key: 'twitter',       label: '𝕏',       href: l => l },
    { key: 'personal_blog', label: 'Blog',           href: l => l },
  ];
  return defs
    .filter(d => links[d.key])
    .map(d => {
      const cls = d.primary ? 'btn btn-primary' : 'btn btn-ghost';
      const ext = d.key !== 'email' ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${e(d.href(links[d.key]))}" class="${cls}"${ext}>${d.label}</a>`;
    }).join('\n        ');
}

function renderAvatar(identity) {
  if (identity.photo) {
    return `<img src="${e(identity.photo)}" alt="${e(identity.first_name)} ${e(identity.last_name)}" class="hero-avatar">`;
  }
  return `<div class="hero-avatar">${e(identity.initials)}</div>`;
}

function renderEducation(education) {
  const icons = { phd: '🎓', masters: '📚', ug: '🏛' };
  return education.map(ed => {
    const schoolEl = ed.school_url
      ? `<a href="${e(ed.school_url)}" target="_blank" rel="noopener" class="edu-school">${e(ed.school)}, ${e(ed.location)}</a>`
      : `<p class="edu-school">${e(ed.school)}, ${e(ed.location)}</p>`;

    const meta = [`${e(ed.start)} — ${e(ed.end)}`];
    if (ed.advisor) meta.push(`Advisor: ${e(ed.advisor)}`);
    if (ed.gpa)     meta.push(`GPA: ${e(ed.gpa)}`);
    if (ed.honors)  meta.push(e(ed.honors));

    let note = '';
    if (ed.thesis)          note += `Thesis: <em>${e(ed.thesis)}</em>.<br>`;
    if (ed.note)            note += e(ed.note);
    if (ed.coursework?.length) {
      note += `${note ? '<br>' : ''}Relevant coursework: ${ed.coursework.map(e).join(', ')}.`;
    }

    return `
      <div class="edu-card">
        <div class="edu-dot ${e(ed.type)}">${icons[ed.type] ?? '🏛'}</div>
        <div>
          <p class="edu-degree">${e(ed.degree)}</p>
          ${schoolEl}
          <p class="edu-meta">${meta.join(' &nbsp;·&nbsp; ')}</p>
        </div>
        ${note ? `<div class="edu-note">${note}</div>` : ''}
      </div>`;
  }).join('\n');
}

function renderResearch(interests) {
  return interests.map(r => `
      <div class="interest-card">
        <div class="interest-icon">${e(r.icon)}</div>
        <p class="interest-title">${e(r.title)}</p>
        <p class="interest-desc">${e(r.desc)}</p>
      </div>`).join('\n');
}

function renderExperience(experience) {
  return experience.map(ex => {
    const period = e(ex.period).replace(' ', '<br>');
    const orgEl  = ex.org_url
      ? `<a href="${e(ex.org_url)}" target="_blank" rel="noopener" class="exp-org">${e(ex.org)}${ex.location ? ' &nbsp;·&nbsp; ' + e(ex.location) : ''}</a>`
      : `<p class="exp-org">${e(ex.org)}${ex.location ? ' &nbsp;·&nbsp; ' + e(ex.location) : ''}</p>`;
    const tags = ex.tags?.length
      ? `<div class="exp-tags">${ex.tags.map(renderTag).join(' ')}</div>` : '';

    return `
      <div class="exp-item">
        <p class="exp-period">${period}</p>
        <div class="exp-body">
          <p class="exp-role">${e(ex.role)}</p>
          ${orgEl}
          <p class="exp-desc">${e(ex.desc)}</p>
          ${tags}
        </div>
      </div>`;
  }).join('\n');
}

function renderPrograms(programs) {
  return programs.map(p => {
    const nameEl = p.url
      ? `<a href="${e(p.url)}" target="_blank" rel="noopener" class="program-name">${e(p.name)}</a>`
      : `<p class="program-name">${e(p.name)}</p>`;
    const host = [e(p.host), p.location ? e(p.location) : ''].filter(Boolean).join(' &nbsp;·&nbsp; ');
    const badge = p.note ? `<span class="tag green" style="font-size:10.5px;margin-top:4px;display:inline-block;">${e(p.note)}</span>` : '';

    return `
      <div class="program-item">
        <div>
          ${nameEl}
          <p class="program-host">${host}</p>
          ${badge}
        </div>
        <span class="program-year">${e(p.year)}</span>
      </div>`;
  }).join('\n');
}

function renderSkills(skills) {
  return skills.map(g => `
      <div>
        <p class="skill-group-title">${e(g.group)}</p>
        <div class="skill-tags">
          ${g.items.map(item => `<span class="${tagClass(g.tag_style)}">${e(item)}</span>`).join('\n          ')}
        </div>
      </div>`).join('\n');
}

function renderPublications(publications) {
  if (!publications?.length) return '';

  const items = publications.map(p => {
    const authors = (p.authors ?? []).map(a => {
      const bold = a.startsWith('**') && a.endsWith('**');
      return bold ? `<strong>${e(a.slice(2,-2))}</strong>` : e(a);
    }).join(', ');

    const links = p.links?.length
      ? `<div class="exp-tags">${p.links.map(l =>
          `<a href="${e(l.url)}" class="tag" target="_blank" rel="noopener">${e(l.label)}</a>`
        ).join(' ')}</div>` : '';

    const note = p.note ? `<span class="tag green">${e(p.note)}</span> ` : '';

    return `
      <div class="exp-item">
        <p class="exp-period">${e(p.year)}</p>
        <div class="exp-body">
          <p class="exp-role">${e(p.title)}</p>
          <p class="exp-org">${e(p.venue)}${p.venue_short ? ' &nbsp;·&nbsp; ' + e(p.venue_short) : ''}</p>
          <p class="exp-desc" style="font-size:13px;">${authors}</p>
          ${note}${links}
        </div>
      </div>`;
  }).join('\n');

  return `
  <section id="publications">
    <p class="section-label">Publications</p>
    <div class="exp-list">
      ${items}
    </div>
  </section>`;
}

function renderContactCards(links) {
  const defs = [
    { key: 'email',         icon: '✉',  label: 'Email',          valueOf: l => l,                          href: l => `mailto:${l}` },
    { key: 'github',        icon: '⌥',  label: 'GitHub',         valueOf: l => '@' + l.split('/').pop(),   href: l => l },
    { key: 'linkedin',      icon: 'in', label: 'LinkedIn',       valueOf: l => l.split('/').pop(),         href: l => l, iconStyle: 'font-size:13px;font-weight:700;' },
    { key: 'scholar',       icon: '◈',  label: 'Google Scholar', valueOf: () => 'Profile',                 href: l => l },
    { key: 'twitter',       icon: '𝕏',  label: 'Twitter / X',   valueOf: l => '@' + l.split('/').pop(),   href: l => l },
    { key: 'personal_blog', icon: '✍',  label: 'Blog',           valueOf: l => l.replace(/^https?:\/\//,''), href: l => l },
  ];
  return defs
    .filter(d => links[d.key])
    .map(d => {
      const external = d.key !== 'email' ? ' target="_blank" rel="noopener"' : '';
      const iconStyle = d.iconStyle ? ` style="${d.iconStyle}"` : '';
      return `
      <a href="${e(d.href(links[d.key]))}" class="contact-card"${external}>
        <div class="contact-icon"${iconStyle}>${d.icon}</div>
        <div>
          <p class="contact-label">${e(d.label)}</p>
          <p class="contact-value">${e(d.valueOf(links[d.key]))}</p>
        </div>
      </a>`;
    }).join('\n');
}

// ── Main HTML template ────────────────────────────────────────
function render(data) {
  const { site, identity, links, nav,
          education, research_interests,
          experience, programs, skills, publications } = data;

  const fullName  = `${identity.first_name} ${identity.last_name}`;
  const univEl    = identity.university_url
    ? `<a href="${e(identity.university_url)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">${e(identity.university)}</a>`
    : e(identity.university);

  const pubSection = renderPublications(publications);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${e(site.title)}</title>
  <meta name="description" content="${e(site.description)}">
  ${site.base_url ? `<meta property="og:url" content="${e(site.base_url)}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

<nav>
  <a href="#" class="nav-logo">${e(identity.initials)}.</a>
  <ul class="nav-links">
    ${renderNav(nav)}
  </ul>
</nav>

<main>
<div class="container">

  <div class="hero">
    <div>
      <p class="hero-eyebrow">${e(identity.role)} · ${e(identity.department)} · ${univEl}</p>
      <h1 class="hero-name">${e(identity.first_name)}<br><em>${e(identity.last_name)}</em></h1>
      <p class="hero-tagline">${e(identity.tagline)}</p>
      <div class="hero-links">
        ${renderHeroButtons(links)}
      </div>
    </div>
    ${renderAvatar(identity)}
  </div>

  <section id="education">
    <p class="section-label">Education</p>
    <div class="edu-list">
      ${renderEducation(education)}
    </div>
  </section>

  <section id="research">
    <p class="section-label">Research Interests</p>
    <div class="interests-grid">
      ${renderResearch(research_interests)}
    </div>
  </section>

  <section id="experience">
    <p class="section-label">Research &amp; Industry Experience</p>
    <div class="exp-list">
      ${renderExperience(experience)}
    </div>
  </section>

  <section id="programs">
    <p class="section-label">Programs &amp; Summer Schools</p>
    <div class="programs-list">
      ${renderPrograms(programs)}
    </div>
  </section>

  ${pubSection}

  <section id="skills">
    <p class="section-label">Skills &amp; Tools</p>
    <div class="skills-grid">
      ${renderSkills(skills)}
    </div>
  </section>

  <section id="contact">
    <p class="section-label">Get in Touch</p>
    <p style="color:var(--ink-muted);font-size:14px;max-width:460px;margin-bottom:1.8rem;line-height:1.7;">
      I'm happy to connect with other researchers, discuss ideas, or chat about EECS.
      Feel free to reach out via any channel below.
    </p>
    <div class="contact-grid">
      ${renderContactCards(links)}
    </div>
  </section>

</div>
</main>

<footer>
  <p>Built with care &nbsp;·&nbsp; <span>${new Date().getFullYear()}</span> &nbsp;·&nbsp; ${e(fullName)}</p>
</footer>

<script src="js/main.js"></script>
</body>
</html>`;
}

// ── Write output ──────────────────────────────────────────────
function build() {
  const distDir = path.join(__dirname, '..', 'dist');
  if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

  // Copy static assets into dist/
  const statics = ['css', 'js', 'assets'];
  for (const dir of statics) {
    const src = path.join(__dirname, '..', dir);
    const dst = path.join(distDir, dir);
    if (!fs.existsSync(src)) continue;
    if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) {
      if (f.startsWith('.')) continue;
      fs.copyFileSync(path.join(src, f), path.join(dst, f));
    }
  }

  const data    = loadData();
  const html    = render(data);
  const outPath = path.join(distDir, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`✓  Built → dist/index.html  (${(html.length / 1024).toFixed(1)} KB)  [${new Date().toLocaleTimeString()}]`);
}

// ── Watch mode ────────────────────────────────────────────────
if (process.argv.includes('--watch')) {
  const watchDir = path.join(__dirname, '..', 'data');
  console.log('👁  Watching data/ for changes… (Ctrl+C to stop)\n');
  build();
  fs.watch(watchDir, (event, filename) => {
    if (!filename) return;
    console.log(`  changed: ${filename}`);
    try { build(); } catch (err) { console.error('  ✗ Build error:', err.message); }
  });
} else {
  build();
}
