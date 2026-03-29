# AFS — Agency Frontend System

**Bootstrap 5 · Pug · SCSS · Alpine.js · Swiper · Vite**

A production-ready frontend delivery system built for agency and team projects.
One config file, three CSS modes, auto-detection, design tokens, fluid typography,
Alpine.js interactivity — everything you need from day one.

---

## Stack

| Tool        | Version | Purpose                          | Load method     |
|-------------|---------|----------------------------------|-----------------|
| Bootstrap   | 5.3     | UI framework, grid, utilities    | npm + CDN JS    |
| Pug         | Latest  | HTML templating with mixins      | npm (pug-cli)   |
| SCSS        | Latest  | Styles with layers + tokens      | npm (sass)      |
| Alpine.js   | 3.14    | Lightweight JS interactivity     | CDN (defer)     |
| Swiper      | 12      | Touch carousels and sliders      | CDN + npm CSS   |
| Vite        | 6       | Dev server + HMR                 | npm             |

---

## Quick Start

**Option A — degit (recommended)**

```bash
npx degit manikantanapplab/AFS-v16 my-project
cd my-project
npm install
npm run dev
# → http://localhost:3000
```

**Option B — GitHub UI**

Go to the repo → click **"Use this template"** → **"Create a new repository"**
→ clone your new repo → `npm install` → `npm run dev`

**Option C — Download a release**

Go to Releases → download the ZIP for the version you want → extract → `npm install` → `npm run dev`

> Use Option C when you need a specific pinned version, not the latest.

---

## The only file you configure per project: `afs.config.mjs`

```js
export const MODE     = 'per-component';  // CSS delivery mode — see below
export const CRITICAL = false;            // set true before final delivery
```

---

## Commands

| Command               | What it does                                        |
|-----------------------|-----------------------------------------------------|
| `npm run dev`         | Dev server + watch Pug, SCSS, JS, assets            |
| `npm run build`       | Compile all — sourcemaps ON                         |
| `npm run build:prod`  | Full build + PurgeCSS + Critical CSS                |
| `npm run build:be`    | Pug + SCSS + JS only (no PostCSS)                   |
| `npm run new <n>`     | Scaffold new component                              |
| `npm run page <n>`    | Scaffold new page                                   |
| `npm run copy:assets` | Copy `src/assets/` → `dist/assets/`                 |
| `npm run format`      | Prettier all source files                           |
| `npm run showcase`    | Build component showcase page                       |
| `npm run doctor`      | Diagnose common setup issues                        |

---

## CSS Modes

Change `MODE` in `afs.config.mjs` then restart `npm run dev`.

| Mode            | Best for                            | CSS output                              |
|-----------------|-------------------------------------|-----------------------------------------|
| `single`        | Landing pages, small sites          | One `app.css` for all pages             |
| `per-page`      | Multi-page sites, pages differ      | `pages/name.css` per page               |
| `per-component` | Drupal / WP / Laravel / .NET        | `base.css` + one CSS file per component |

### How per-component auto-detection works

`build-pug.mjs` deep-scans every page and all its included component files,
then writes the correct `<link>` tags into `block componentcss` automatically.

```
include ../components/hero/_hero.pug   →  hero.css auto-linked
+card(data)                            →  card.css auto-linked
.btn.btn-primary                       →  button.css auto-linked
```

No manual CSS linking. Runs on every `npm run dev` and `npm run build`.
**Restart dev after adding a new component** — detection runs on startup.

---

## Project Structure

```
afs.config.mjs            ← YOUR CONTROL PANEL — only file you change per project
critical.mjs              ← Critical CSS system — do not edit

src/
  assets/
    images/               ← drop images here — auto-copied to dist/ on save
    fonts/

  components/name/
    _name.pug             ← Pug mixin
    name.scss             ← component styles
    name.preview.html     ← standalone browser preview (fallback)
    name.data.preview.js  ← sample data for showcase compilation

  layouts/
    _base.pug             ← AUTO-GENERATED — never edit directly
    _header.pug           ← EDIT: logo, nav links, nav items
    _footer.pug           ← EDIT: copyright text, footer links
    header.scss           ← header styles

  pages/
    index.pug             ← one .pug file per page
    about.pug

  sass/
    base/
      _layers.scss        ← @layer order (never edit)
      _bootstrap.scss     ← Bootstrap wrapped in @layer
      _reset.scss         ← CSS reset
      _base.scss          ← global base styles
      base-only.scss      ← per-component mode entry point

    tokens/
      _colors.scss        ← EDIT: brand colors → CSS custom properties
      _typography.scss    ← EDIT: font family, fluid type scale
      _spacing.scss       ← spacing scale

    pages/
      _shared.scss        ← shared base for per-page mode
      about.scss          ← page-specific styles

    utilities/
      _mixins.scss        ← rem(), fluid-steps(), flex helpers
      _functions.scss     ← fs-* font-size, g-* gap utility loops

    app.scss              ← AUTO-GENERATED — never edit

  js/
    components.js         ← Alpine.js component registrations
    swiper-init.js        ← Swiper auto-initializer

system/                   ← build automation scripts — do not edit
dist/                     ← compiled output — hand this to BE team
```

---

## Design Tokens

All tokens live in `src/sass/tokens/`. Change once — updates everywhere.

### Colors (`_colors.scss`)

```scss
:root {
  --color-primary:        #0A0A0A;
  --color-accent:         #E8FF47;       // electric lime — signature punch
  --color-accent-dark:    #C8E030;

  // Neutrals
  --color-white: #FFFFFF;
  --color-black: #0A0A0A;

  // Semantic
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error:   #DC2626;

  // Gray scale — warm undertone
  --color-gray-50:  #FAFAF9;
  --color-gray-100: #F5F4F2;
  --color-gray-200: #ECEAE7;
  --color-gray-300: #D9D6D1;
  --color-gray-400: #B8B4AE;
  --color-gray-500: #918D87;
  --color-gray-600: #6B6760;
  --color-gray-700: #4A4742;
  --color-gray-800: #2E2C29;
  --color-gray-900: #1A1917;

  // Text
  --color-text-primary:   var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-text-muted:     var(--color-gray-400);

  // Backgrounds
  --color-bg-body:   var(--color-white);
  --color-bg-subtle: var(--color-gray-50);
  --color-bg-muted:  var(--color-gray-100);
  --color-bg-dark:   var(--color-gray-900);

  // Borders
  --color-border:        var(--color-gray-200);
  --color-border-strong: var(--color-gray-300);
}
```

Dark mode tokens auto-switch when `data-theme="dark"` is on `<html>`.

### Typography (`_typography.scss`)

```scss
--font-display:  'Syne', system-ui, sans-serif;
--font-primary:  'DM Sans', system-ui, sans-serif;
--font-mono:     'DM Mono', 'Courier New', monospace;

--text-xs:   clamp(0.6875rem, 0.66rem + 0.14vw, 0.75rem);   // 11→12px
--text-sm:   clamp(0.8125rem, 0.78rem + 0.16vw, 0.875rem);  // 13→14px
--text-base: clamp(0.9375rem, 0.90rem + 0.19vw, 1rem);      // 15→16px
--text-md:   clamp(1rem, 0.96rem + 0.20vw, 1.125rem);       // 16→18px
--text-lg:   clamp(1.125rem, 1.08rem + 0.23vw, 1.25rem);    // 18→20px
--text-xl:   clamp(1.25rem, 1.18rem + 0.35vw, 1.5rem);      // 20→24px
--text-2xl:  clamp(1.5rem, 1.38rem + 0.60vw, 2rem);         // 24→32px
--text-3xl:  clamp(1.875rem, 1.68rem + 0.98vw, 2.625rem);   // 30→42px
--text-4xl:  clamp(2.25rem, 1.96rem + 1.45vw, 3.25rem);     // 36→52px
--text-5xl:  clamp(3rem, 2.5rem + 2.50vw, 5rem);            // 48→80px

--font-light:   300;
--font-regular: 400;
--font-medium:  500;
--font-semi:    600;
--font-bold:    700;
--font-black:   800;
```

### Spacing (`_spacing.scss`)

```scss
--space-1:  0.25rem;   //  4px
--space-2:  0.5rem;    //  8px
--space-3:  0.75rem;   // 12px
--space-4:  1rem;      // 16px
--space-5:  1.25rem;   // 20px
--space-6:  1.5rem;    // 24px
--space-8:  2rem;      // 32px
--space-10: 2.5rem;    // 40px
--space-12: 3rem;      // 48px
--space-16: 4rem;      // 64px

--section-padding-y: clamp(2rem, 5vw, 5rem);  // fluid section spacing
```

---

## SCSS Utilities

### `rem()` — px to rem

```scss
@use '../../sass/utilities/mixins' as *;

padding:       rem(24);   // 24px → 1.5rem
font-size:     rem(14);   // 14px → 0.875rem
border-radius: rem(8);    // 8px  → 0.5rem
```

### `fluid-steps()` — fluid scaling between breakpoints

```scss
@include fluid-steps(font-size, (32px, 72px));
@include fluid-steps(padding-block, (24px, 48px, 80px));
```

### Dynamic utility classes

```pug
h2.fs-32       //→ font-size: 2rem
h1.fs-32f48f80 //→ clamp(32px, ..., 80px) fluid
.d-flex.g-24   //→ gap: 1.5rem
a.btn.size-48  //→ width: 3rem; height: 3rem
```

### `@layer components` — always wrap component styles

```scss
@use '../../sass/utilities/mixins' as *;

@layer components {
  .my-component {
    padding: rem(24);
    color: var(--color-text-primary);
  }
}
```

### PurgeCSS — protecting dynamic state classes

PurgeCSS scans your source files for class names. Classes added at runtime by Alpine.js
or Bootstrap JS are never in the source — wrap them with ignore comments **outside** the
nesting so the comments compile correctly into the CSS output:

```scss
@layer components {
  .my-component {
    // static styles
  }

  /* purgecss start ignore */
  // dynamic class — added by Alpine.js at runtime
  .my-component.is-active {
    background: var(--color-accent);
  }
  /* purgecss end ignore */
}
```

> ⚑ Always place ignore comments at `@layer` level — never inside a nested selector.
> Comments inside nesting compile into empty rules and PurgeCSS ignores them.

---

## Built-in Components

| Component     | Mixin call           | Key props                                                              |
|---------------|----------------------|------------------------------------------------------------------------|
| `hero`        | `+hero(data)`        | `title`, `text`, `eyebrow`, `dark`, `bg`, `primaryBtn`, `secondaryBtn`, `critical` |
| `card`        | `+card(data)`        | `title`, `text`, `tag`, `image`, `link`, `featured`                   |
| `section`     | CSS classes          | `.section`, `.section-muted`, `.section-dark`                         |
| `swiper`      | `+swiper(data)`      | `slides`, `effect`, `perView`, `perViewMd`, `perViewLg`, `gap`, `autoplay` |
| `carousel`    | `+carousel(data)`    | `slides`, `autoplay`, `loop`, `arrows`, `dots`                        |
| `testimonial` | `+testimonial(data)` | `quote`, `author`, `role`, `company`, `avatar`                        |
| `breadcrumb`  | `+breadcrumb(data)`  | `items` — array of `{ label, link }`                                  |
| `app-head`    | `+app-head(data)`    | `title`, `text`, `icon`, `titleClass`, `textClass`                    |
| `page-aside`  | `+page-aside(data)`  | sidebar nav layout                                                    |
| `apicard`     | `+apiCard(data)`     | `title`, `category`, `version`, `text`, `author`, `date`              |
| `nav`         | mixins               | `+navLinks(items)`, `+navDropdown(item)`                              |

---

## Alpine.js Components

All registered globally in `src/js/components.js` — available on every page.

| `x-data` value       | What it does                                     |
|----------------------|--------------------------------------------------|
| `navbar`             | Adds `.is-scrolled` to header on scroll          |
| `themeToggle`        | Dark/light toggle — persists in localStorage     |
| `modal`              | Show/hide with body scroll lock                  |
| `tabs(0)`            | Active tab tracking — pass default index         |
| `accordion`          | Toggle open/close panels                         |
| `counter(500, 2000)` | Animates number 0→500 over 2000ms on scroll      |
| `carousel({...})`    | Lightweight slider — no Swiper dependency        |
| `form`               | Fetch form submit with loading/success/error     |

---

## Component Showcase

```bash
npm run showcase
# → open http://localhost:3000/showcase.html
```

The showcase compiles each component's real Pug mixin with sample data from
`*.data.preview.js` files — so what you see is the actual component output,
not a static placeholder.

### Adding preview data for a component

```js
// src/components/hero/hero.data.preview.js
export default {
  eyebrow: 'Agency Frontend System',
  title: 'Build Faster. Deliver Cleaner.',
  text: 'Supporting description.',
  primaryBtn: { label: 'Get Started', link: '#' }
};
```

Showcase status indicators:
- 🟢 **Pug compiled** — real component output from data file
- 🟡 **preview.html** — fallback static file
- ⬜ **No preview** — add a `data.preview.js` to enable

---

## Pages — Blocks Reference

| Block             | Purpose                          | Managed by       |
|-------------------|----------------------------------|------------------|
| `block title`     | `<title>` tag content            | You              |
| `block head`      | Extra `<head>` tags              | You              |
| `block pagecss`   | Page-level CSS link              | Auto (build-pug) |
| `block componentcss` | Component CSS links           | Auto (build-pug) |
| `block content`   | Page body                        | You              |
| `block scripts`   | Extra `<script>` before `</body>`| You              |

---

## Dark Mode & RTL

```pug
//- Dark mode
html(lang="en" dir="ltr" data-theme="dark")

//- RTL
html(lang="ar" dir="rtl" data-theme="light")
```

All color tokens and Bootstrap layout flip automatically — no extra work needed.

---

## Production Build

```bash
# 1. Set CRITICAL = true in afs.config.mjs
# 2. Run
npm run build:prod
# 3. Hand dist/ to BE team
```

Pipeline: Pug → HTML → SCSS → compressed CSS → PurgeCSS → Critical CSS inlined.

### How Critical CSS works — critical-section approach

AFS uses a developer-controlled critical CSS system. Instead of pattern-matching
or guessing what's above the fold, **you explicitly mark** which elements need
their CSS inlined for the first paint.

**Step 1 — Mark above-fold elements in Pug**

Add `critical-section` class to any element whose CSS should be inlined:

```pug
//- _header.pug — navbar is always above fold
nav.navbar.navbar-expand-lg.site-header.critical-section(x-data="navbar" ...)

//- index.pug — hero is the first thing the user sees
+hero({
  title: 'Your headline goes here.',
  critical: true   ← adds critical-section class to compiled HTML
})

//- Direct class on a plain section
section.hero.critical-section
  ...

//- Not marked — loads async, user sees after scroll
section.cards-section
section.testimonial
footer.site-footer
```

**Step 2 — Run production build**

```bash
npm run build:prod
```

**What critical.mjs does:**

```
1. Scans each dist/*.html page
2. Finds all elements with class="critical-section"
3. Reads their other class names — e.g. "site-header", "hero"
4. Maps class names to CSS files — header CSS, hero.css
5. base.css is always inlined automatically (tokens + reset + body)
6. Inlines all matched CSS files into <style data-critical> in <head>
7. Converts those <link> tags to async loading (media="print" flip)
8. Unmarked components load async — zero render blocking
```

**Result in `<head>`:**

```html
<style data-critical>
  /* base.css — always inlined */
  :root { --color-accent: #E8FF47; ... }
  body { font-family: var(--font-primary); ... }

  /* hero.css — marked critical */
  .hero { min-height: clamp(520px, 72vh, 900px); ... }
  .hero .hero-title { font-size: var(--text-5xl); ... }
</style>

<!-- Inlined files now load async — no duplicate download -->
<link rel="stylesheet" href="assets/css/components/hero.css"
      media="print" onload="this.media='all'">

<!-- Unmarked components — always async -->
<link rel="stylesheet" href="assets/css/components/card.css"
      media="print" onload="this.media='all'">
<link rel="stylesheet" href="assets/css/components/testimonial.css"
      media="print" onload="this.media='all'">
```

**Supported components with `critical` prop:**

```pug
+hero({ critical: true })
```

For all other components or plain sections, add the class directly:

```pug
section.my-section.critical-section
nav.site-header.critical-section
```

**If PurgeCSS removes a class you need:**

```js
// postcss.config.js
safelist: ['show', 'active', 'my-class', /^swiper-/]
```

---

## New Project Checklist

```
□ npx degit manikantanapplab/AFS-v16 my-project
□ cd my-project && npm install
□ afs.config.mjs           → set MODE
□ tokens/_colors.scss      → brand colors + accent
□ tokens/_typography.scss  → font family + update Google Fonts URL in _header.pug
□ _header.pug              → logo, nav links (critical-section already on nav)
□ _footer.pug              → company name, footer links
□ npm run page <n>         → create all pages needed
□ npm run new <n>          → create all components needed
□ npm run dev              → start building
□ npm run showcase         → verify component previews
□ npm run doctor           → check project health before handoff
□ Mark above-fold sections → add critical-section or critical: true
□ CRITICAL = true          → before final delivery
□ npm run build:prod       → final production build
```

---

## Troubleshooting

| Problem                                   | Fix                                                                  |
|-------------------------------------------|----------------------------------------------------------------------|
| Component CSS not loading                 | Restart `npm run dev` — detection runs on startup                    |
| New component not detected               | Check folder name matches `.pug` and `.scss` filenames               |
| Bootstrap overrides your styles           | Wrap SCSS in `@layer components {}`                                  |
| `rem() not found`                         | Add `@use '../../sass/utilities/mixins' as *;` at top                |
| `var(--token)` not working               | Check for missing semicolons in token files                          |
| Images not showing                        | Run `npm run copy:assets` or restart dev                             |
| JS changes not reflecting                 | Run `npm run copy:js` or restart dev                                 |
| PurgeCSS removed a class                  | Add to `safelist` in `postcss.config.js`                             |
| Dynamic class missing in prod             | Wrap with `/* purgecss start ignore */` at `@layer` level in SCSS   |
| Mode switch not working                   | `Ctrl+C` → change MODE → `npm run dev`                               |
| `pug: command not found`                  | `npm install -g pug-cli`                                             |
| `sass: command not found`                 | `npm install -g sass`                                                |
| Port 3000 in use                          | Change port in `vite.config.js`                                      |
| Showcase shows placeholder               | Add `<n>.data.preview.js` to component folder                        |
| Critical CSS not injecting               | Check `CRITICAL = true` in config and `critical-section` class is in compiled HTML |
| Critical CSS injecting wrong styles      | Ensure ignore comments are at `@layer` level, not inside nesting     |

---

## Versioning & Updates

AFS follows semantic versioning: `MAJOR.MINOR.PATCH`

When a new version is released, existing projects are **not automatically updated**.
Check `CHANGELOG.md` for what changed and which files need manual replacement (marked ⚠️).

For new projects — always gets the latest via `degit`.
