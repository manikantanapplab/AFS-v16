# AFS Changelog

All notable changes to the Agency Frontend System are documented here.
Format: `## [version] — YYYY-MM-DD` → what changed → migration notes if needed.

When you update the template, check this file to see if any changes need to be
manually applied to existing projects (marked ).

---

## [16.2.0] — 2026-03-28

### Critical CSS — Smart extraction (all modes)

Rewrote `critical.mjs` with a smarter above-fold extraction approach.
Replaces the previous pattern-matching implementation which over-inlined
unneeded CSS and caused duplicate downloads.

### What changed

| File | Action |
|---|---|
| `critical.mjs` |  Replace in project root |

### What's new

- Extracts only what is guaranteed above the fold: `:root` tokens, `body`, `html`, `.site-header`, `.navbar`
- Full CSS loads async via `media="print"` flip — zero render blocking
- No duplicate downloads — each rule is loaded exactly once
- Correct `<noscript>` fallback
- Works correctly across all three CSS modes:
  - `single` → extracts from `app.css`
  - `per-page` → extracts from each `pages/*.css`
  - `per-component` → extracts from `base.css` only (component files already async)
- No new dependencies — zero `npm install` needed

### Migration

 Replace `critical.mjs` in your project root with the new version.
No other files need to change. `afs.config.mjs` and `system/run-critical.mjs` stay the same.

---

## [16.1.0] — 2026-03-28

### Showcase — Real Pug compilation with sample data

Rewrote `system/build-showcase.mjs` to compile actual Pug mixins with
real sample data instead of relying on static `.preview.html` files
that were out of sync with the real component output.

### What changed

| File | Action |
|---|---|
| `system/build-showcase.mjs` |  Replace in `system/` |
| `src/components/apicard/apicard.data.preview.js` | Add to component folder |
| `src/components/hero/hero.data.preview.js` | Add to component folder |
| `src/components/card/card.data.preview.js` | Add to component folder |
| `src/components/testimonial/testimonial.data.preview.js` | Add to component folder |
| `src/components/breadcrumb/breadcrumb.data.preview.js` | Add to component folder |
| `src/components/carousel/carousel.data.preview.js` | Add to component folder |
| `src/components/app-head/app-head.data.preview.js` | Add to component folder |

### What's new

- `build-showcase.mjs` now deep-scans each component's Pug mixin and compiles it with real sample data
- New `*.data.preview.js` pattern — one file per component with sample data
- Sidebar status indicators: 🟢 Pug compiled / 🟡 fallback HTML / ⬜ no data yet
- Active nav highlight on scroll in showcase page
- Light / dark toggle in showcase
- Any new component auto-renders in showcase when a `data.preview.js` is added — no other changes needed

### Migration

 Replace `system/build-showcase.mjs` with the new version.

For each component you want a real preview, add a `<name>.data.preview.js`
file inside `src/components/<name>/` and export a default object with sample data:

```js
// src/components/hero/hero.data.preview.js
export default {
  eyebrow: 'Agency Frontend System',
  title: 'Build Faster. Deliver Cleaner.',
  text: 'Supporting description text here.',
  primaryBtn: { label: 'Get Started', link: '#' }
};
```

Without a `data.preview.js`, the showcase falls back to `.preview.html`.
Without either, it shows a placeholder with instructions.

---

## [16.0.0] — 2026-03-23

Initial public release of AFS v16.

### What's included

**Stack**
- Bootstrap 5.3
- Pug (HTML templating with mixins)
- SCSS with `@layer` cascade control
- Alpine.js 3.14 (8 registered components)
- Swiper 12
- Vite 6 (dev server + HMR)

**CSS modes**
- `single` — one `app.css` for all pages
- `per-page` — separate CSS per page
- `per-component` — `base.css` + per-component CSS, auto-detected

**Built-in components**
- `hero` — full-width hero with eyebrow, title, text, buttons, dark mode, bg image
- `card` + `cardGrid` — content cards with image, tag, link
- `section` — section wrapper with `.section-muted` and `.section-dark` variants
- `testimonial` — quote block with author, role, company, avatar
- `breadcrumb` — accessible breadcrumb nav
- `swiper` — Swiper 12 carousel with full options
- `carousel` — lightweight Alpine.js slider (no Swiper dependency)
- `app-head` — page header with icon, title, text, user actions
- `page-aside` — sidebar nav layout
- `apicard` — structured API listing card
- `nav` — nav mixin helpers (`+navLinks`, `+navDropdown`)
- `modal` — Alpine.js modal with body scroll lock

**Alpine.js components (globally registered)**
- `navbar` — scroll detection
- `themeToggle` — dark/light with localStorage persistence
- `modal` — show/hide with scroll lock
- `tabs(n)` — active tab state
- `accordion` — open/close panels
- `counter(target, duration)` — animated number on scroll
- `carousel({...})` — lightweight slider
- `form` — fetch submit with loading/success/error states

**Build system**
- `npm run dev` — parallel watch: Pug, SCSS, JS, assets + Vite HMR
- `npm run build` — full compile with sourcemaps
- `npm run build:prod` — PurgeCSS + Critical CSS
- `npm run new <n>` — scaffold new component
- `npm run page <n>` — scaffold new page
- `npm run showcase` — build component showcase page
- `npm run doctor` — diagnose setup issues
- `npm run format` — Prettier all source files

**Design tokens**
- Colors — semantic + raw gray scale, dark mode auto-switch
- Typography — fluid type scale (`--text-xs` through `--text-4xl`)
- Spacing — `--space-4` through `--space-64` + fluid `--section-padding-y`
- Utility classes — `fs-*` font sizes, `g-*` gaps, `size-*` fixed squares

**Documentation**
- `README.md` — full technical reference
- `AFS-TEAM-GUIDE.md` — step-by-step guide for all team members
- `WORKFLOW.md` — project workflow, multi-dev setup, CSS modes deep dive
- `INTEGRATION.md` — BE team handoff guide (Drupal, WP, Laravel, .NET)
- `CHANGELOG.md` — this file

**GitHub**
- `.gitignore`
- Issue templates: bug report, component request
- PR template with checklist
- GitHub Actions CI: build check on push/PR to `main` and `dev`
- Template repository enabled

---

## How to update an existing project

When a new AFS version is released, existing projects are **not automatically updated** —
each project repo is independent. Check the changelog entry for the new version and look
for items marked  — those need manual attention.

For non-breaking additions (new components, new docs), you can manually copy the relevant
files from the new template into your project if you want them.

---

## Versioning

`MAJOR.MINOR.PATCH`

| Change type | Version bump |
|---|---|
| Breaking change to build system, tokens, or component API | MAJOR |
| New component, new command, new doc, non-breaking feature | MINOR |
| Bug fix, typo, small correction | PATCH |
