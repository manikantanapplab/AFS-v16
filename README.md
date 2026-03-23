# AFS — Agency Frontend System

**Bootstrap 5 · Pug · SCSS · Alpine.js · Swiper · Vite**

A production-ready frontend delivery system built for agency and team projects.
One config file, three CSS modes, auto-detection, design tokens, fluid typography,
Alpine.js interactivity — everything you need from day one.

---

## Stack

| Tool        | Version | Purpose                          |
|-------------|---------|----------------------------------|
| Bootstrap   | 5.3     | UI framework, grid, utilities    |
| Pug         | Latest  | HTML templating with mixins      |
| SCSS        | Latest  | Styles with layers + tokens      |
| Alpine.js   | 3.14    | Lightweight JS interactivity     |
| Swiper      | 12      | Touch carousels and sliders      |
| Vite        | 6       | Dev server + HMR                 |

---

## Quick Start

**Option A — degit (recommended)**

Pulls the latest template files with zero git history. Clean slate, instant setup.

```bash
npx degit your-github-username/agency-frontend-system my-project
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

**The only file you configure per project:** `afs.config.mjs`

```js
export const MODE     = 'single';  // CSS delivery mode — see below
export const CRITICAL = false;     // set true before final delivery
```

---

## Commands

| Command               | What it does                                        |
|-----------------------|-----------------------------------------------------|
| `npm run dev`         | Dev server + watch Pug, SCSS, JS, assets            |
| `npm run build`       | Compile all — sourcemaps ON                         |
| `npm run build:prod`  | Full build + PurgeCSS + Critical CSS                |
| `npm run build:be`    | Pug + SCSS + JS only (no PostCSS)                   |
| `npm run new <name>`  | Scaffold new component                              |
| `npm run page <name>` | Scaffold new page                                   |
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

src/
  assets/
    images/               ← drop images here — auto-copied to dist/ on save
    fonts/

  components/name/
    _name.pug             ← Pug mixin
    name.scss             ← component styles
    name.preview.html     ← standalone browser preview

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
  --color-primary:          #2563EB;   // ← your brand color
  --color-secondary:        #F59E0B;   // ← accent color

  // Gray scale
  --color-gray-100: #F5F5F5;
  --color-gray-300: #EDEDED;
  --color-gray-600: #6B7280;
  --color-gray-900: #212121;

  // Semantic tokens — use these in components, not raw grays
  --color-text-primary:     var(--color-gray-900);
  --color-text-secondary:   var(--color-gray-600);
  --color-text-muted:       var(--color-gray-400);
  --color-bg-body:          var(--color-white);
  --color-bg-subtle:        var(--color-gray-100);
  --color-border:           var(--color-gray-300);
  --color-border-soft:      #EDEDED80;  // 50% opacity
}
```

Dark mode tokens auto-switch when `data-theme="dark"` is on `<html>`.

### Typography (`_typography.scss`)

Fluid type scale — sizes scale smoothly between mobile and desktop:

```scss
--text-xs:   0.75rem;    // 12px
--text-sm:   0.875rem;   // 14px
--text-base: 1rem;       // 16px
--text-lg:   1.125rem;   // 18px
--text-xl:   1.25rem;    // 20px
--text-2xl:  1.5rem;     // 24px
--text-3xl:  1.875rem;   // 30px
--text-4xl:  2.25rem;    // 36px

--font-light:   300;
--font-regular: 400;
--font-semi:    600;
--font-bold:    700;
```

### Spacing (`_spacing.scss`)

```scss
--space-4:   0.25rem;   //  4px
--space-8:   0.5rem;    //  8px
--space-16:  1rem;      // 16px
--space-24:  1.5rem;    // 24px
--space-32:  2rem;      // 32px
--space-48:  3rem;      // 48px
--space-64:  4rem;      // 64px

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
// Font size scales from 32px (mobile) to 72px (desktop)
@include fluid-steps(font-size, (32px, 72px));

// Padding at 3 breakpoints
@include fluid-steps(padding-block, (24px, 48px, 80px));
```

### Dynamic utility classes (use directly in Pug)

```pug
//- Font sizes — class number = px value
h2.fs-32     //→ font-size: 2rem
p.fs-14      //→ font-size: 0.875rem

//- Gaps — class number = px value
.d-flex.g-16   //→ gap: 1rem
.d-flex.g-24   //→ gap: 1.5rem

//- Fixed square size
a.btn.size-48  //→ width: 3rem; height: 3rem
```

### `@layer components` — always wrap component styles

This ensures your styles always override Bootstrap without `!important`:

```scss
@use '../../sass/utilities/mixins' as *;

@layer components {
  .my-component {
    padding: rem(24);
    color: var(--color-text-primary);
  }
}
```

---

## Built-in Components

| Component     | Mixin call         | Key props                                                |
|---------------|--------------------|----------------------------------------------------------|
| `hero`        | `+hero(data)`      | `title`, `text`, `eyebrow`, `dark`, `bg`, `primaryBtn`, `secondaryBtn` |
| `card`        | `+card(data)`      | `title`, `text`, `tag`, `image`, `link`, `featured`     |
| `section`     | CSS classes        | `.section`, `.section-muted`, `.section-dark`            |
| `swiper`      | `+swiper(data)`    | `slides`, `effect`, `perView`, `perViewMd`, `perViewLg`, `gap`, `autoplay` |
| `carousel`    | `+carousel(data)`  | `slides`, `autoplay`, `loop`, `arrows`, `dots`           |
| `testimonial` | `+testimonial(data)` | `quote`, `author`, `role`, `company`, `avatar`         |
| `breadcrumb`  | `+breadcrumb(data)` | `items` — array of `{ label, link }`                   |
| `app-head`    | `+app-head(data)`  | `title`, `text`, `icon`, `titleClass`, `textClass`       |
| `page-aside`  | `+page-aside(data)` | sidebar nav layout                                      |
| `apicard`     | `+apiCard(data)`   | `title`, `category`, `version`, `text`, `author`, `date` |
| `nav`         | mixins             | `+navLinks(items)`, `+navDropdown(item)`                 |

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

**If PurgeCSS removes a class you need:**
```js
// postcss.config.js
safelist: ['show', 'active', 'my-class', /^swiper-/]
```

---

## New Project Checklist

```
□ npx degit your-github-username/agency-frontend-system my-project
□ cd my-project && npm install
□ afs.config.mjs        → set MODE
□ tokens/_colors.scss   → brand colors
□ tokens/_typography.scss → font family + update Google Fonts URL in _header.pug
□ _header.pug           → logo, nav links
□ _footer.pug           → company name, footer links
□ npm run page <name>   → create all pages needed
□ npm run new <name>    → create all components needed
□ npm run dev           → start building
□ npm run build:prod    → before BE handoff
□ CRITICAL = true       → before final delivery
```

---

## Troubleshooting

| Problem                          | Fix                                                        |
|----------------------------------|------------------------------------------------------------|
| Component CSS not loading        | Restart `npm run dev` — detection runs on startup          |
| New component not detected       | Check folder name matches `.pug` and `.scss` filenames     |
| Bootstrap overrides your styles  | Wrap SCSS in `@layer components {}`                        |
| `rem() not found`                | Add `@use '../../sass/utilities/mixins' as *;` at top      |
| `var(--token)` not working       | Check for missing semicolons in token files                |
| Images not showing               | Run `npm run copy:assets` or restart dev                   |
| JS changes not reflecting        | Run `npm run copy:js` or restart dev                       |
| PurgeCSS removed a class         | Add to `safelist` in `postcss.config.js`                   |
| Mode switch not working          | `Ctrl+C` → change MODE → `npm run dev`                     |
| `pug: command not found`         | `npm install -g pug-cli`                                   |
| `sass: command not found`        | `npm install -g sass`                                      |
| Port 3000 in use                 | Change port in `vite.config.js`                            |
