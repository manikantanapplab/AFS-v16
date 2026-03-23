// ============================================================
// Agency Frontend System (AFS) v16 — PROJECT CONFIG
// Only 2 settings to change per project. That's it.
// ============================================================


// ── 1. CSS MODE ──────────────────────────────────────────────
// 'single'        → one app.css for all pages
//                   best for: small/medium sites, quick deadlines
//
// 'per-page'      → separate CSS per page (index.css, about.css...)
//                   best for: large sites, pages differ a lot
//
// 'per-component' → base.css + each component loads its own CSS
//                   best for: Drupal/WP/Laravel/.NET

export const MODE = 'single'; // most projects start here — change if needed

// ── 2. CRITICAL CSS ──────────────────────────────────────────
// true  → inlines above-fold CSS, defers rest (Lighthouse friendly)
// false → skip (fine for intranets, admin tools, non-public sites)

export const CRITICAL = false; // ← change this

// ── PAGES & COMPONENTS are AUTO-DETECTED ─────────────────────
// No need to list them manually.
// Pages     → auto-scanned from src/pages/*.pug
// Components → auto-scanned from src/components/*/
// Layers    → auto-scanned from src/sass/layers/_*.scss
//
// Just run: npm run page <n>    → new page
//           npm run new <n>     → new component
// Everything else is automatic.