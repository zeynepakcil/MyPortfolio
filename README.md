# Academic Portfolio — Parametrized

A clean, professional academic portfolio site for an incoming PhD student.
All content lives in YAML files. A Node.js build script reads them and
renders `dist/index.html`. No frontend framework, no runtime server needed.

---

## Repo Structure

```
portfolio/
├── data/                  ← ✏️  EDIT THESE — all your content
│   ├── about.yaml         hero, name, links, nav
│   ├── education.yaml     degrees, thesis, coursework
│   ├── research.yaml      interest cards
│   ├── experience.yaml    internships, research positions
│   ├── programs.yaml      summer schools, workshops
│   ├── skills.yaml        skill groups and tags
│   └── publications.yaml  papers (empty by default — add when ready)
│
├── css/style.css          all styling; edit :root vars to retheme
├── js/main.js             scroll-reveal + active nav
├── assets/                drop cv.pdf and photo.jpg here
│   └── .gitkeep
│
├── scripts/
│   └── build.js           reads data/ → renders dist/index.html
│
├── dist/                  ← generated output (don't edit by hand)
│   └── index.html
│
├── package.json
└── README.md
```

---

## Setup

```bash
npm install        # installs js-yaml (only dependency)
npm run build      # generates dist/index.html
```

Open `dist/index.html` in your browser to preview.

---

## Editing Content

**Every piece of content is in `data/`.** You never need to touch HTML or JS.

### `data/about.yaml` — Identity & Hero

```yaml
identity:
  first_name: "Zeynep"
  last_name:  "Nur"
  initials:   "ZN"
  photo:      "assets/photo.jpg"   # set to "" to use initials avatar
  tagline: >
    Incoming doctoral researcher in EECS...
```

### `data/education.yaml` — Degrees

Add as many entries as you like under `education:`.
Each entry supports: `degree`, `school`, `location`, `start`, `end`,
`gpa`, `honors`, `advisor`, `thesis`, `coursework`, `note`, `type` (phd/masters/ug).

### `data/experience.yaml` — Internships & Research Roles

Each entry: `period`, `role`, `org`, `location`, `desc`, `tags`.
Tags can be simple strings or objects with a `style` field:

```yaml
tags:
  - label: "SystemVerilog"
    style: "blue"      # blue | brown | green
  - label: "C++"
    style: "brown"
```

### `data/publications.yaml` — Papers

Empty by default. Uncomment the example entry when you have a preprint:

```yaml
publications:
  - year: 2025
    title: "Your Paper Title"
    venue: "ISCA"
    venue_short: "ISCA '25"
    authors:
      - "**Your Name**"     # bold YOUR name with **
      - "Co-author One"
    links:
      - label: "arXiv"
        url: "https://arxiv.org/abs/XXXX"
```

When `publications` is an empty list `[]`, the section is hidden entirely.

### `data/skills.yaml` — Skill Groups

Add/remove groups freely. Three tag styles: `blue`, `brown`, `green`.

---

## Adding a Profile Photo

1. Drop your photo as `assets/photo.jpg` (square crop recommended, ≥300×300px).
2. In `data/about.yaml`, make sure `photo: "assets/photo.jpg"` is set (not empty).
3. `npm run build` — done.

---

## Watch Mode

```bash
npm run watch
```

Rebuilds `dist/index.html` automatically whenever you save a YAML file.
Refresh your browser to see changes.

---

## Deploying

### GitHub Pages (recommended — free, ~60 seconds)

1. Create a repo named **`yourusername.github.io`** on GitHub.

2. Run a build, then push:
   ```bash
   npm run build
   git init
   git add .
   git commit -m "initial portfolio"
   git remote add origin https://github.com/yourusername/yourusername.github.io.git
   git push -u origin main
   ```

3. Go to **Settings → Pages → Source: GitHub Actions**, then add this file:

   `.github/workflows/deploy.yml`
   ```yaml
   name: Deploy
   on:
     push:
       branches: [main]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20 }
         - run: npm ci && npm run build
         - uses: actions/upload-pages-artifact@v3
           with: { path: dist }
         - uses: actions/deploy-pages@v4
   ```

   Now every `git push` auto-rebuilds and redeploys. ✓

> **Alternative (simpler, no workflow needed):** Set Source to
> "Deploy from branch → main / root", and commit the `dist/` folder.
> Edit `dist/` out of `.gitignore` first.

### Netlify (drag-and-drop, 30 seconds)

1. `npm run build`
2. Go to [netlify.com](https://netlify.com) → **Add new site → Deploy manually**
3. Drag the `dist/` folder onto the upload area.
4. Done — you get a `*.netlify.app` URL immediately.

For auto-deploy on push, connect the GitHub repo and set:
- Build command: `npm run build`
- Publish directory: `dist`

### University Server

```bash
npm run build
scp -r dist/* yourusername@sftp.university.edu:~/public_html/
ssh yourusername@sftp.university.edu "chmod -R 755 ~/public_html"
```

---

## Retheme

Open `css/style.css` and edit the `:root` CSS variables at the top.
Key variables:
- `--accent` — primary blue color (nav links, school names, buttons)
- `--accent2` — italic name color in hero
- `--bg` — page background (currently warm off-white `#F8F6F1`)
- `--surface` — card background

---

## Roadmap / Adding More Sections

To add a new section (e.g. "Teaching", "Awards", "Projects"):

1. Create `data/awards.yaml` with your data schema.
2. Add a render function in `scripts/build.js` (follow the pattern of existing ones).
3. Insert the section call in the `render()` function's template string.
4. Add a nav entry in `data/about.yaml`.
