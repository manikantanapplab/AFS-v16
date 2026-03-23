# AFS Changelog

All notable changes to the Agency Frontend System are documented here.
Format: `## [version] — YYYY-MM-DD` → what changed → migration notes if needed.

When you update the template, check this file to see if any changes need to be
manually applied to existing projects (marked ⚠️).

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
for items marked ⚠️ — those need manual attention.

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
