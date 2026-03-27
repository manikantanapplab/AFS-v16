#!/usr/bin/env node
// ============================================================
// BUILD SHOWCASE — AFS v16
// Compiles real Pug components with sample data from
// each component's *.data.preview.js file.
//
// Usage:  npm run showcase
// Output: dist/showcase.html
//
// HOW IT WORKS:
//   1. Scans src/components/ for all component folders
//   2. Looks for a <n>.data.preview.js — real sample data
//   3. Compiles the Pug mixin with that data → real HTML preview
//   4. Falls back to .preview.html if no data file exists
//   5. Assembles everything into dist/showcase.html
//
// TO ADD PREVIEW DATA FOR A COMPONENT:
//   Create: src/components/<n>/<n>.data.preview.js
//   Export: export default { ...your sample data }
// ============================================================

import { promises as fs } from 'fs';
import path               from 'path';
import { execSync }       from 'child_process';
import { pathToFileURL }  from 'url';

const COMPONENTS_DIR = 'src/components';
const OUTPUT         = 'dist/showcase.html';
const TMP_DIR        = '.afs-showcase-tmp';

// ── Helpers ───────────────────────────────────────────────────
const pascal = name =>
  name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

const escapeHtml = str =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── Scan components ───────────────────────────────────────────
const entries    = await fs.readdir(COMPONENTS_DIR, { withFileTypes: true });
const components = entries.filter(e => e.isDirectory()).map(e => e.name);

await fs.mkdir(TMP_DIR, { recursive: true });

// ── Compile one component preview ─────────────────────────────
async function buildComponentPreview(name) {
  const compDir      = path.join(COMPONENTS_DIR, name);
  const pugFile      = path.join(compDir, `_${name}.pug`);
  const dataFile     = path.join(compDir, `${name}.data.preview.js`);
  const fallbackFile = path.join(compDir, `${name}.preview.html`);

  // ── Try: compile Pug with real data ──────────────────────────
  let pugSource;
  try { pugSource = await fs.readFile(pugFile, 'utf8'); } catch { pugSource = null; }

  let data = null;
  try {
    const mod = await import(pathToFileURL(path.resolve(dataFile)).href);
    data = mod.default;
  } catch { data = null; }

  if (pugSource && data) {
    // Detect mixin name — could be camelCase (apiCard) or kebab (app-head)
    const mixinMatch = pugSource.match(/^mixin\s+([\w-]+)/m);
    if (mixinMatch) {
      const mixinName = mixinMatch[1];

      // Build a temporary Pug file that includes the mixin and calls it
      const dataJson  = JSON.stringify(data);
      const tmpPug    = path.join(TMP_DIR, `${name}.pug`);
      const tmpHtml   = path.join(TMP_DIR, `${name}.html`);

      const pugContent = [
        `include ../${compDir}/_${name}.pug`,
        `-`,
        `  var data = ${dataJson}`,
        `+${mixinName}(data)`,
      ].join('\n');

      await fs.writeFile(tmpPug, pugContent);

      try {
        execSync(`pug ${tmpPug} -o ${TMP_DIR} --pretty`, { stdio: 'pipe' });
        const compiled = await fs.readFile(tmpHtml, 'utf8');
        console.log(`  ✅ ${name} — compiled from Pug + data`);
        return { html: compiled, source: 'pug' };
      } catch (err) {
        console.warn(`  ⚠️  ${name} — Pug compile failed, trying fallback`);
      }
    }
  }

  // ── Fallback: use .preview.html ───────────────────────────────
  try {
    const html = await fs.readFile(fallbackFile, 'utf8');
    const hasMeaningfulContent = html.trim().length > 50;
    if (hasMeaningfulContent) {
      console.log(`  📄 ${name} — using preview.html`);
      return { html, source: 'html' };
    }
  } catch { /* no fallback file */ }

  // ── Last resort: placeholder ──────────────────────────────────
  console.log(`  ⬜ ${name} — no preview data yet`);
  return {
    source: 'none',
    html: `
      <div class="sc-no-preview">
        <div class="sc-no-preview-icon">📦</div>
        <p class="sc-no-preview-title">${pascal(name)}</p>
        <p class="sc-no-preview-hint">
          Add preview data:<br>
          <code>src/components/${name}/${name}.data.preview.js</code>
        </p>
      </div>`
  };
}

// ── Build all component sections ──────────────────────────────
console.log(`\n🔨 Building showcase — ${components.length} components\n`);

const results = [];
for (const name of components) {
  const result = await buildComponentPreview(name);
  results.push({ name, ...result });
}

// ── Sidebar nav ───────────────────────────────────────────────
const pugCount  = results.filter(r => r.source === 'pug').length;
const htmlCount = results.filter(r => r.source === 'html').length;
const noneCount = results.filter(r => r.source === 'none').length;

const navItems = results.map(({ name, source }) => {
  const icon   = source === 'pug'  ? '🟢'
               : source === 'html' ? '🟡'
               : '⬜';
  return `<li><a href="#sc-${name}" class="sc-nav-link">${icon} ${pascal(name)}</a></li>`;
}).join('\n        ');

// ── Component sections ────────────────────────────────────────
const sections = results.map(({ name, html, source }) => {
  const label = source === 'pug'  ? '<span class="sc-badge sc-badge-pug">Pug compiled</span>'
              : source === 'html' ? '<span class="sc-badge sc-badge-html">preview.html</span>'
              : '<span class="sc-badge sc-badge-none">No preview</span>';

  return `
  <section class="sc-component" id="sc-${name}">
    <div class="sc-component-header">
      <div class="sc-component-title-row">
        <h2 class="sc-component-name">${pascal(name)}</h2>
        ${label}
      </div>
      <div class="sc-component-meta">
        <code class="sc-code-ref">+${name}(data)</code>
        <a href="#sc-${name}" class="sc-anchor" title="Link to this component">#</a>
      </div>
    </div>
    <div class="sc-preview-wrap">
      <div class="sc-preview">
        ${html}
      </div>
    </div>
    <details class="sc-source">
      <summary class="sc-source-toggle">
        <span>View rendered HTML</span>
        <i class="sc-chevron">▾</i>
      </summary>
      <pre class="sc-source-code"><code>${escapeHtml(html.trim())}</code></pre>
    </details>
    <div class="sc-data-hint">
      📁 Preview data: <code>src/components/${name}/${name}.data.preview.js</code>
    </div>
  </section>`;
}).join('\n');

// ── Final HTML ────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en" dir="ltr" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AFS Showcase — Component Library</title>
  <link rel="stylesheet" href="assets/css/app.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    /* ── Showcase shell — not part of any component ── */
    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --sc-bg:          #f8fafc;
      --sc-sidebar-bg:  #0f172a;
      --sc-sidebar-w:   240px;
      --sc-border:      #e2e8f0;
      --sc-text:        #0f172a;
      --sc-muted:       #64748b;
      --sc-accent:      #6366f1;
      --sc-radius:      0.75rem;
      --sc-mono:        'JetBrains Mono', 'Fira Code', monospace;
    }
    [data-theme="dark"] {
      --sc-bg:     #0f172a;
      --sc-border: #1e293b;
      --sc-text:   #f1f5f9;
      --sc-muted:  #94a3b8;
    }

    body { margin: 0; background: var(--sc-bg); font-family: system-ui, sans-serif; color: var(--sc-text); }

    /* ── Layout ── */
    .sc-layout { display: grid; grid-template-columns: var(--sc-sidebar-w) 1fr; min-height: 100vh; }

    /* ── Sidebar ── */
    .sc-sidebar {
      position: sticky; top: 0; height: 100vh; overflow-y: auto;
      background: var(--sc-sidebar-bg); padding: 1.5rem 1rem;
      border-right: 1px solid #1e293b;
    }
    .sc-logo {
      color: #fff; font-size: 0.95rem; font-weight: 700;
      margin-bottom: 0.25rem; letter-spacing: -0.01em;
    }
    .sc-logo span { color: #818cf8; }
    .sc-sidebar-sub {
      color: #475569; font-size: 0.72rem; margin-bottom: 1.5rem;
    }
    .sc-sidebar-label {
      color: #475569; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      margin: 1rem 0 0.5rem; padding: 0 0.5rem;
    }
    .sc-nav { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
    .sc-nav-link {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.45rem 0.75rem; color: #94a3b8; font-size: 0.82rem;
      text-decoration: none; border-radius: 0.375rem;
      transition: background 120ms, color 120ms;
    }
    .sc-nav-link:hover,
    .sc-nav-link.is-active { background: #1e293b; color: #fff; }

    /* ── Stats strip ── */
    .sc-stats {
      display: flex; gap: 0.5rem; margin: 0.75rem 0.5rem 0;
      flex-wrap: wrap;
    }
    .sc-stat {
      font-size: 0.68rem; padding: 0.2em 0.55em;
      border-radius: 9999px; font-weight: 600;
    }
    .sc-stat-pug  { background: #dcfce7; color: #166534; }
    .sc-stat-html { background: #fef9c3; color: #854d0e; }
    .sc-stat-none { background: #f1f5f9; color: #64748b; }

    /* ── Main area ── */
    .sc-main { padding: 2rem 2.5rem; max-width: 1100px; }

    /* ── Top bar ── */
    .sc-topbar {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem;
      margin-bottom: 2.5rem; padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--sc-border);
    }
    .sc-topbar-title { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; }
    .sc-topbar-meta  { color: var(--sc-muted); font-size: 0.8rem; margin-top: 0.2rem; }
    .sc-controls { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .sc-btn {
      padding: 0.4rem 0.9rem; border: 1px solid var(--sc-border);
      background: transparent; border-radius: 0.4rem;
      cursor: pointer; font-size: 0.8rem; color: var(--sc-text);
      transition: all 120ms;
    }
    .sc-btn:hover { background: var(--sc-accent); color: #fff; border-color: var(--sc-accent); }

    /* ── Component card ── */
    .sc-component { margin-bottom: 3rem; scroll-margin-top: 1.5rem; }
    .sc-component-header {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;
    }
    .sc-component-title-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
    .sc-component-name { font-size: 1rem; font-weight: 700; margin: 0; }
    .sc-component-meta { display: flex; align-items: center; gap: 0.75rem; }
    .sc-code-ref {
      font-family: var(--sc-mono); font-size: 0.72rem;
      background: #f1f5f9; color: var(--sc-accent);
      padding: 0.2em 0.6em; border-radius: 0.3rem;
    }
    [data-theme="dark"] .sc-code-ref { background: #1e293b; }
    .sc-anchor { color: var(--sc-muted); text-decoration: none; font-size: 0.85rem; }
    .sc-anchor:hover { color: var(--sc-accent); }

    /* ── Badges ── */
    .sc-badge {
      font-size: 0.65rem; font-weight: 700; padding: 0.2em 0.6em;
      border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .sc-badge-pug  { background: #dcfce7; color: #166534; }
    .sc-badge-html { background: #fef9c3; color: #854d0e; }
    .sc-badge-none { background: #f1f5f9; color: #94a3b8; }

    /* ── Preview frame ── */
    .sc-preview-wrap {
      border: 1px solid var(--sc-border); border-radius: var(--sc-radius);
      overflow: hidden; background: #fff;
    }
    [data-theme="dark"] .sc-preview-wrap { background: #1e293b; border-color: #334155; }
    .sc-preview { padding: 0; }

    /* ── Source code block ── */
    .sc-source { margin-top: 0.5rem; }
    .sc-source-toggle {
      display: flex; align-items: center; justify-content: space-between;
      list-style: none; cursor: pointer;
      font-size: 0.78rem; color: var(--sc-muted);
      padding: 0.5rem 0.25rem; user-select: none;
    }
    .sc-source-toggle::-webkit-details-marker { display: none; }
    .sc-source[open] .sc-chevron { transform: rotate(180deg); }
    .sc-chevron { transition: transform 150ms; display: inline-block; }
    .sc-source-code {
      background: #0f172a; color: #e2e8f0; border-radius: 0.5rem;
      padding: 1.25rem; overflow-x: auto;
      font-family: var(--sc-mono); font-size: 0.75rem;
      line-height: 1.7; margin: 0.25rem 0 0;
    }

    /* ── Data hint ── */
    .sc-data-hint {
      font-size: 0.72rem; color: var(--sc-muted);
      margin-top: 0.5rem; padding: 0 0.25rem;
    }
    .sc-data-hint code {
      font-family: var(--sc-mono); font-size: 0.7rem;
      background: #f1f5f9; padding: 0.1em 0.4em; border-radius: 0.25rem;
      color: var(--sc-accent);
    }
    [data-theme="dark"] .sc-data-hint code { background: #1e293b; }

    /* ── No preview placeholder ── */
    .sc-no-preview {
      padding: 3rem 2rem; text-align: center; color: var(--sc-muted);
    }
    .sc-no-preview-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .sc-no-preview-title { font-weight: 600; margin: 0 0 0.5rem; }
    .sc-no-preview-hint { font-size: 0.8rem; line-height: 1.6; }
    .sc-no-preview-hint code {
      font-family: var(--sc-mono); font-size: 0.75rem;
      background: #f1f5f9; padding: 0.15em 0.5em; border-radius: 0.3rem;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .sc-layout { grid-template-columns: 1fr; }
      .sc-sidebar { position: static; height: auto; }
      .sc-main { padding: 1.25rem; }
    }
  </style>
</head>
<body>
  <div class="sc-layout">

    <!-- Sidebar -->
    <aside class="sc-sidebar">
      <div class="sc-logo">AFS <span>v16</span></div>
      <div class="sc-sidebar-sub">Component Showcase</div>
      <div class="sc-stats">
        <span class="sc-stat sc-stat-pug">🟢 ${pugCount} Pug</span>
        <span class="sc-stat sc-stat-html">🟡 ${htmlCount} HTML</span>
        ${noneCount > 0 ? `<span class="sc-stat sc-stat-none">⬜ ${noneCount} empty</span>` : ''}
      </div>
      <div class="sc-sidebar-label">Components</div>
      <ul class="sc-nav">
        ${navItems}
      </ul>
    </aside>

    <!-- Main -->
    <main class="sc-main">
      <div class="sc-topbar">
        <div>
          <div class="sc-topbar-title">Component Showcase</div>
          <div class="sc-topbar-meta">
            Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            &nbsp;·&nbsp; ${components.length} components
            &nbsp;·&nbsp; AFS v16
          </div>
        </div>
        <div class="sc-controls">
          <button class="sc-btn" onclick="document.documentElement.dataset.theme='light'">☀ Light</button>
          <button class="sc-btn" onclick="document.documentElement.dataset.theme='dark'">☾ Dark</button>
        </div>
      </div>

      ${sections}

    </main>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="assets/js/components.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
  <script>
    // Highlight active nav link on scroll
    const links   = document.querySelectorAll('.sc-nav-link');
    const sections = document.querySelectorAll('.sc-component');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach(l => {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
        });
      });
    }, { threshold: 0.3 });
    sections.forEach(s => observer.observe(s));
  </script>
</body>
</html>`;

await fs.writeFile(OUTPUT, html);

// ── Cleanup tmp ───────────────────────────────────────────────
await fs.rm(TMP_DIR, { recursive: true, force: true });

console.log(`\n✅ Showcase built → dist/showcase.html`);
console.log(`   ${pugCount} Pug-compiled  |  ${htmlCount} preview.html  |  ${noneCount} empty`);
console.log(`\n   🟢 Add <n>.data.preview.js to any component for live Pug rendering`);
console.log(`   📤 Share dist/showcase.html with your backend team\n`);
