# AFS — Project Workflow Guide

For projects with multiple pages and multiple developers.
This covers everything from starting a new project to handing off to the BE team.

---

## Part 1 — Starting a New Project

### Step 1 — Start from the template

**Via degit (recommended):**
```bash
npx degit your-github-username/agency-frontend-system my-client-project
cd my-client-project
npm install
```

degit downloads the latest template files with no git history attached —
clean slate, ready to initialise as the project's own repo.

**Via GitHub UI:**
Go to the template repo → "Use this template" → "Create a new repository"
→ clone your new repo → `npm install`

**Via pinned release (when you need a specific version):**
```bash
npx degit your-github-username/agency-frontend-system#v16.0.0 my-client-project
cd my-client-project
npm install
```

Then initialise git:
```bash
git init
git add .
git commit -m "init: afs v16.0.0"
```

### Step 2 — Configure (5 minutes)

Open `afs.config.mjs` — the only file you need to change:

```js
export const MODE     = 'single';  // start here — switch anytime
export const CRITICAL = false;     // set true only before final delivery
```

**Which MODE to pick:**

| Project type | MODE |
|---|---|
| Landing page, campaign, microsite | `single` |
| Brochure site, 5–15 pages | `single` |
| Large site, pages have very different layouts | `per-page` |
| Drupal / WordPress / Laravel / .NET integration | `per-component` |

Start with `single` if unsure — you can switch any time with one line change and a restart.

### Step 3 — Brand tokens (10 minutes)

**Colors** — `src/sass/tokens/_colors.scss`:
```scss
:root {
  --color-primary:   #2563EB;  // ← your brand color
  --color-secondary: #F59E0B;  // ← accent color
}
```

**Font** — `src/sass/tokens/_typography.scss`:
```scss
--font-primary: 'Your Font', system-ui, sans-serif;
```

Update the Google Fonts `<link>` in `src/layouts/_header.pug` to match.

### Step 4 — Header and footer

Edit `src/layouts/_header.pug`:
- Replace logo text or `<img>` with actual logo
- Update nav link labels and hrefs
- Update `href="#contact"` on the CTA button

Edit `src/layouts/_footer.pug`:
- Replace company name and tagline
- Update footer link labels and hrefs

### Step 5 — Scaffold all pages

```bash
npm run page about
npm run page services
npm run page contact
npm run page blog
# etc — one command per page
```

### Step 6 — Start building

```bash
npm run dev
# → http://localhost:3000
```

Pages live at `http://localhost:3000/about.html` etc.

---

## Part 2 — Multi-Developer Setup

### Git branching strategy

```
main          ← protected — only lead dev merges here
dev           ← integration branch — merge features here first
feature/*     ← one branch per component or page
fix/*         ← bug fixes
page/*        ← full page builds
```

### Splitting work across the team

**Lead dev sets up first:**
1. Brand tokens (`src/sass/tokens/`)
2. Header + footer (`src/layouts/`)
3. Global base styles
4. Push to `main`

**Other devs then:**
```bash
git pull
git checkout -b feature/card-component
# build component
git push -u origin feature/card-component
# open pull request → merge to dev
```

### File ownership rules

To avoid merge conflicts, assign ownership clearly:

| Files | Who edits |
|---|---|
| `src/sass/tokens/` | Lead dev only |
| `src/layouts/_header.pug` | Lead dev only |
| `src/layouts/_footer.pug` | Lead dev only |
| `src/components/name/` | One dev per component |
| `src/pages/name.pug` | One dev per page |
| `src/sass/pages/name.scss` | Same dev as the page |
| `_base.pug`, `app.scss` | Nobody — auto-generated |
| `system/` | Nobody — do not edit |

### `.gitignore` — make sure these are excluded

```
dist/
node_modules/
.DS_Store
*.log
```

---

## Part 3 — CSS Modes Deep Dive

### SINGLE mode

One `app.css` for the entire site. Simplest setup, fastest to get started.

```
dist/
  assets/
    css/
      app.css   ← everything in one file
```

Best for: landing pages, campaign sites, small brochure sites.
Not ideal for: large sites where most pages share nothing in common.

### PER-PAGE mode

Each page compiles its own CSS. Only the styles used on that page are included.

```
dist/
  assets/
    css/
      pages/
        index.css
        about.css
        services.css
```

Best for: large marketing sites, 20+ pages, pages with very different layouts.

### PER-COMPONENT mode

`base.css` is loaded on every page. Each component also has its own CSS file,
which is only loaded when that component appears on the page.

```
dist/
  assets/
    css/
      base.css             ← always loaded
      components/
        hero.css           ← loaded only on pages that use hero
        card.css           ← loaded only on pages that use card
        testimonial.css    ← etc
```

Best for: Drupal, WordPress, Laravel, .NET — where the BE controls which
components are rendered on each page and can conditionally load their CSS.

**How auto-detection works in per-component mode:**

When you run `npm run dev` or `npm run build`, `build-pug.mjs`:
1. Reads every `src/pages/*.pug` file
2. Deep-scans all included component files recursively
3. Detects which components are used (by include path, mixin call, or class name)
4. Writes the correct `<link>` tags into `block componentcss` automatically

You never manually manage `block componentcss`. Just add your `include` at the top
of the page and restart dev — the CSS link appears automatically.

---

## Part 4 — Sourcemaps

Sourcemaps let you see the original SCSS file and line number in browser DevTools
instead of the compiled CSS.

```
Without sourcemaps:   app.css:1 → .hero { ... }
With sourcemaps:      hero.scss:12 → .hero-title { ... }
```

**Sourcemap behaviour by command:**

| Command | Sourcemaps | Use when |
|---|---|---|
| `npm run dev` | ✅ Full | Daily development |
| `npm run build` | ✅ Compressed | BE integration |
| `npm run build:prod` | ✅ Compressed | Pre-launch testing |
| `--no-source-map` flag | ❌ Off | Final delivery (rare) |

**To build without sourcemaps (if client requires it):**
```bash
node system/build-sass.mjs --compressed --no-source-map
```

**In DevTools:**
Open Sources → localhost:3000 → find `.scss` files directly.
Click any CSS rule in Elements panel → jumps to the exact SCSS line.

---

## Part 5 — Production Build & Handoff

### Before you build

1. Set `CRITICAL = true` in `afs.config.mjs`
2. Check `safelist` in `postcss.config.js` — add any dynamically-set classes that PurgeCSS might remove

```js
// postcss.config.js
safelist: [
  'show',
  'active',
  'is-open',
  'is-scrolled',
  /^swiper-/,
  /^modal-/
]
```

### Run the build

```bash
npm run build:prod
```

**Pipeline:**
1. `build-pug.mjs` — rewrites CSS blocks per mode, compiles Pug → HTML
2. `build-sass.mjs` — compiles SCSS → compressed CSS with sourcemaps
3. `copy:js` + `copy:assets` — copies JS and images to `dist/`
4. `postcss-build.mjs` — PurgeCSS removes unused classes, autoprefixer adds vendor prefixes
5. `run-critical.mjs` — inlines above-fold CSS in `<head>`, defers rest (only if `CRITICAL = true`)

### What to hand to the BE team

The entire `dist/` folder — nothing else.

```bash
# Zip it
zip -r handoff-v1.zip dist/
```

For integration instructions (how to load the CSS and JS in their framework),
give them `INTEGRATION.md`.

---

## Part 6 — Switching CSS Modes

You can switch modes at any time — even mid-project.

```js
// afs.config.mjs
export const MODE = 'per-component';  // ← change this
```

```bash
# Restart dev — new mode takes effect immediately
npm run dev
```

The build system rewrites all `block pagecss` and `block componentcss` blocks
in your page files automatically on restart. You don't need to manually update anything.

**When to switch modes:**

- Started with `single`, project grew → switch to `per-page`
- BE team uses Drupal/WP → switch to `per-component`
- Client wants Lighthouse score improvement → switch to `per-component`

---

## Part 7 — Typical 3-Week Project Timeline

### Week 1 — Foundation

| Day | Task |
|---|---|
| Day 1 | Setup: copy package, configure tokens, header, footer |
| Day 2 | Scaffold all pages, assign components to devs |
| Day 2–5 | Build shared components: hero, card, section, nav |

### Week 2 — Pages

| Day | Task |
|---|---|
| Day 6–8 | Build all pages using components |
| Day 8–9 | Cross-browser testing, mobile QA |
| Day 10 | Token adjustments, spacing polish |

### Week 3 — Handoff

| Day | Task |
|---|---|
| Day 11–12 | Content review — replace all placeholder text/images |
| Day 13 | Production build, PurgeCSS safelist review |
| Day 14 | Set `CRITICAL = true`, final build, lighthouse check |
| Day 15 | Hand `dist/` to BE team with `INTEGRATION.md` |


---

## Part 8 — Releases & Versioning

This covers how to publish new versions of the AFS template itself —
not client projects, but the template repo your team pulls from.

### Versioning rules

AFS follows semantic versioning: `MAJOR.MINOR.PATCH`

| Change | Bump | Example |
|---|---|---|
| Breaking change — build system, token names, component API | MAJOR | 16 → 17 |
| New component, new command, new doc, non-breaking feature | MINOR | 16.0 → 16.1 |
| Bug fix, typo, small correction | PATCH | 16.0.0 → 16.0.1 |

### Before publishing a release

**1. Update `package.json` version:**
```json
{
  "version": "16.1.0"
}
```

**2. Update `CHANGELOG.md` — add a new entry at the top:**
```markdown
## [16.1.0] — 2026-04-15

### Added
- `pricing-table` component — `+pricingTable({ plans: [...] })`
- `faq` component — `+faq({ items: [...] })`

### Fixed
- per-component detection missed hyphenated component names in some edge cases

### Migration
No breaking changes. Existing projects are not affected.
```

**3. Make sure the build passes:**
```bash
npm install -g pug-cli sass   # if not already installed
npm run build
```

**4. Commit everything:**
```bash
git add .
git commit -m "release: v16.1.0"
git push
```

### Publishing the release on GitHub

```
GitHub repo
→ Releases
→ Draft a new release
→ Tag: v16.1.0          (create new tag on publish)
→ Target: main
→ Title: AFS v16.1.0
→ Description: paste the CHANGELOG entry for this version
→ Attach binaries: drag in AFS-V16-clean.zip
→ ✅ Set as the latest release
→ Publish release
```

### How team members get the update

They **don't** automatically get it — each project repo is independent.

**For a new project:** always gets the latest because degit/template pulls from `main`.

```bash
npx degit your-github-username/agency-frontend-system my-new-project
```

**For an existing project:** team member checks the CHANGELOG, decides which
changes are worth pulling across manually. There's no automatic update — this is intentional.
You don't want a build system change silently affecting a client project mid-delivery.

**Manually applying a PATCH fix to an existing project:**
```bash
# Example: bug fix in system/build-pug.mjs
# 1. Open the new version on GitHub
# 2. Copy the changed file
# 3. Paste into the project repo
# 4. Test with npm run build
# 5. Commit
git commit -m "chore: apply AFS v16.0.1 build-pug fix"
```

### Release history at a glance

```
Releases tab on GitHub shows:
  v17.0.0  ← latest major (breaking)
  v16.2.0  ← latest v16 stable
  v16.1.0
  v16.0.1  ← patch
  v16.0.0  ← initial
```

Attach the ZIP to every release so any version can be downloaded directly
without needing git.

### Using degit to pull a specific release version

```bash
# Latest (default)
npx degit your-github-username/agency-frontend-system my-project

# Specific tag
npx degit your-github-username/agency-frontend-system#v16.0.0 my-project

# Specific branch
npx degit your-github-username/agency-frontend-system#dev my-project
```

This is the main advantage of degit over "Use this template" — you can pin
to a specific version when a project needs to stay on a known-good baseline.
