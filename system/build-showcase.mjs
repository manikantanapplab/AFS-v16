#!/usr/bin/env node
// ============================================================
// BUILD SHOWCASE — generates dist/showcase.html
// Shows all components in one page for backend teams
// Usage: npm run showcase
// ============================================================

import { promises as fs } from 'fs';
import path from 'path';

const COMPONENTS_DIR = 'src/components';
const OUTPUT = 'dist/showcase.html';

const entries = await fs.readdir(COMPONENTS_DIR, { withFileTypes: true });
const components = entries.filter(e => e.isDirectory()).map(e => e.name);

let sections = '';
for (const name of components) {
  const previewPath = path.join(COMPONENTS_DIR, name, `${name}.preview.html`);
  let preview = '';
  try {
    preview = await fs.readFile(previewPath, 'utf8');
  } catch {
    preview = `<div style="padding:2rem;color:#888;font-style:italic">No preview file yet — create src/components/${name}/${name}.preview.html</div>`;
  }

  sections += `
  <section class="sc-component" id="${name}">
    <div class="sc-component-header">
      <h2 class="sc-component-title">${name.charAt(0).toUpperCase() + name.slice(1)}</h2>
      <div class="sc-component-meta">
        <span class="sc-tag">CSS: app.css</span>
        <a href="#${name}" class="sc-link">#${name}</a>
      </div>
    </div>
    <div class="sc-preview">
      ${preview}
    </div>
    <details class="sc-code">
      <summary>View HTML</summary>
      <pre><code>${preview.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></pre>
    </details>
  </section>`;
}

const html = `<!DOCTYPE html>
<html lang="en" dir="ltr" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Component Showcase — ${new Date().getFullYear()}</title>
  <link rel="stylesheet" href="assets/css/app.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    /* Showcase UI styles — not part of the components */
    .sc-layout { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
    .sc-sidebar { position: sticky; top: 0; height: 100vh; overflow-y: auto; background: #0f172a; padding: 1.5rem; border-right: 1px solid #1e293b; }
    .sc-sidebar-title { color: #fff; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1rem; opacity: 0.5; }
    .sc-nav { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.25rem; }
    .sc-nav a { display: block; padding: 0.5rem 0.75rem; color: #94a3b8; font-size: 0.875rem; text-decoration: none; border-radius: 0.375rem; transition: all 150ms; text-transform: capitalize; }
    .sc-nav a:hover { background: #1e293b; color: #fff; }
    .sc-main { padding: 2rem; }
    .sc-header { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
    .sc-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .sc-subtitle { color: #64748b; font-size: 0.875rem; margin-top: 0.25rem; }
    .sc-theme-toggle { display: flex; gap: 0.5rem; }
    .sc-theme-btn { padding: 0.375rem 0.75rem; border: 1px solid #e5e7eb; background: white; border-radius: 0.375rem; cursor: pointer; font-size: 0.8rem; transition: all 150ms; }
    .sc-theme-btn:hover { background: #f8fafc; }
    .sc-component { margin-bottom: 3rem; scroll-margin-top: 1.5rem; }
    .sc-component-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap; }
    .sc-component-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .sc-component-meta { display: flex; align-items: center; gap: 0.75rem; }
    .sc-tag { font-size: 0.7rem; font-family: monospace; background: #f0f4ff; color: #4f46e5; padding: 0.2em 0.6em; border-radius: 9999px; }
    .sc-link { font-size: 0.8rem; color: #94a3b8; text-decoration: none; }
    .sc-preview { border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; background: white; }
    .sc-code { margin-top: 0.75rem; }
    .sc-code summary { font-size: 0.8rem; color: #64748b; cursor: pointer; padding: 0.5rem; }
    .sc-code pre { background: #0f172a; color: #e2e8f0; padding: 1.25rem; border-radius: 0.5rem; overflow-x: auto; font-size: 0.78rem; line-height: 1.6; margin-top: 0.5rem; }
    @media (max-width: 768px) { .sc-layout { grid-template-columns: 1fr; } .sc-sidebar { position: static; height: auto; } }
    [data-theme="dark"] .sc-preview { background: #1e293b; border-color: #334155; }
    [data-theme="dark"] .sc-component-title { color: #f1f5f9; }
    [data-theme="dark"] .sc-header { border-color: #334155; }
    [data-theme="dark"] .sc-title { color: #f1f5f9; }
  </style>
</head>
<body>
  <div class="sc-layout">
    <aside class="sc-sidebar">
      <div class="sc-sidebar-title">Components</div>
      <ul class="sc-nav">
        ${components.map(n => `<li><a href="#${n}"><i class="bi bi-puzzle"></i> ${n}</a></li>`).join('\n        ')}
      </ul>
    </aside>
    <main class="sc-main">
      <div class="sc-header">
        <div>
          <h1 class="sc-title">Component Showcase</h1>
          <p class="sc-subtitle">Generated ${new Date().toLocaleDateString()} · ${components.length} components · Share with backend team</p>
        </div>
        <div class="sc-theme-toggle">
          <button class="sc-theme-btn" onclick="document.documentElement.dataset.theme='light'">☀ Light</button>
          <button class="sc-theme-btn" onclick="document.documentElement.dataset.theme='dark'">☾ Dark</button>
        </div>
      </div>
      ${sections}
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="assets/js/components.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
</body>
</html>`;

await fs.writeFile(OUTPUT, html);
console.log(`\n✅ Showcase built → dist/showcase.html`);
console.log(`   ${components.length} components: ${components.join(', ')}\n`);
console.log(`   Share dist/showcase.html with your backend team.\n`);
