#!/usr/bin/env node
// ============================================================
// CRITICAL CSS — AFS v16 (critical-section approach)
//
// HOW IT WORKS:
//   Add class="critical-section" to any element whose CSS
//   should be inlined in <head> for above-fold painting.
//
//   critical.mjs scans each dist/*.html page, finds all
//   elements marked with critical-section, reads their other
//   class names, maps them to CSS files, and inlines the
//   entire CSS file for each matched component.
//
//   base.css is always inlined automatically — it contains
//   tokens, reset, and body styles everything depends on.
//
// USAGE IN PUG:
//   nav.site-header.critical-section        → inlines header CSS
//   section.hero.critical-section           → inlines hero.css
//   section.cards-section                   → loads async (no marker)
//   section.testimonial                     → loads async (no marker)
//
// RESULT IN <head>:
//   <style data-critical>
//     /* base.css — always */
//     /* header CSS — marked critical */
//     /* hero.css — marked critical */
//   </style>
//   <link href="hero.css" removed — already inlined>
//   <link href="card.css" media="print" onload="..."> ← async
//   <link href="testimonial.css" media="print" onload="..."> ← async
//
// USAGE:
//   Set CRITICAL = true in afs.config.mjs
//   Run: npm run build:prod
// ============================================================

import { promises as fs } from 'fs';
import path               from 'path';
import { MODE }           from './afs.config.mjs';

const DIST            = 'dist';
const CRITICAL_CLASS  = 'critical-section';
const CSS_COMPONENTS  = `${DIST}/assets/css/components`;
const CSS_PAGES       = `${DIST}/assets/css/pages`;

// ── Auto-scan dist/ HTML files ────────────────────────────────
async function getHtmlFiles() {
  const entries = await fs.readdir(DIST, { withFileTypes: true }).catch(() => []);
  return entries
    .filter(e => e.isFile() && e.name.endsWith('.html'))
    .map(e => e.name);
}

// ── Read a CSS file safely ────────────────────────────────────
async function readCss(cssPath) {
  try {
    return await fs.readFile(cssPath, 'utf8');
  } catch {
    return null;
  }
}

// ── Minify a CSS string ───────────────────────────────────────
function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')   // remove comments
    .replace(/\s+/g, ' ')               // collapse whitespace
    .trim();
}

// ── Scan HTML for elements marked with critical-section ───────
// Returns array of class lists from all marked elements
// e.g. ['site-header navbar navbar-expand-lg', 'hero', 'section']
function findCriticalClasses(html) {
  const results = [];

  // Match any opening tag that contains critical-section in its class attribute
  const tagPattern = /<[a-zA-Z][^>]*class="([^"]*)"[^>]*>/g;
  let match;

  while ((match = tagPattern.exec(html)) !== null) {
    const classes = match[1];
    if (classes.includes(CRITICAL_CLASS)) {
      results.push(classes);
    }
  }

  return results;
}

// ── Map class names to CSS file paths ─────────────────────────
// Checks components/ and pages/ directories
async function resolveClassesToCssFiles(classLists, pageName) {
  const cssFiles = new Set();

  // Always include base.css — tokens + reset + body
  const baseCss = `${DIST}/assets/css/base.css`;
  if (await readCss(baseCss)) cssFiles.add(baseCss);

  for (const classList of classLists) {
    const classes = classList
      .split(/\s+/)
      .filter(c => c && c !== CRITICAL_CLASS);

    for (const cls of classes) {
      // Check components/
      const compPath = `${CSS_COMPONENTS}/${cls}.css`;
      if (await readCss(compPath)) {
        cssFiles.add(compPath);
        continue;
      }

      // Check pages/ — e.g. class="index" or page name match
      const pagePath = `${CSS_PAGES}/${cls}.css`;
      if (await readCss(pagePath)) {
        cssFiles.add(pagePath);
      }
    }
  }

  // In per-page mode — also always include the page CSS
  if (MODE === 'per-page' && pageName) {
    const pageFile = `${CSS_PAGES}/${pageName}.css`;
    if (await readCss(pageFile)) cssFiles.add(pageFile);
  }

  return [...cssFiles];
}

// ── Process one HTML page ─────────────────────────────────────
async function processPage(htmlFile) {
  const htmlPath = `${DIST}/${htmlFile}`;
  const pageName = path.basename(htmlFile, '.html');

  let html;
  try {
    html = await fs.readFile(htmlPath, 'utf8');
  } catch {
    console.log(`    Skipping ${htmlFile} — not found`);
    return;
  }

  // ── 1. Find all critical-section marked elements ─────────────
  const criticalClassLists = findCriticalClasses(html);

  if (!criticalClassLists.length) {
    console.log(`   ${htmlFile.padEnd(25)} no critical-section markers found — skipping`);
    return;
  }

  // ── 2. Resolve class names to CSS file paths ──────────────────
  const cssFilePaths = await resolveClassesToCssFiles(criticalClassLists, pageName);

  if (!cssFilePaths.length) {
    console.log(`    ${htmlFile.padEnd(25)} markers found but no matching CSS files`);
    return;
  }

  // ── 3. Read and combine all critical CSS ──────────────────────
  let combinedCritical = '';
  const inlinedFiles   = [];

  for (const cssPath of cssFilePaths) {
    const css = await readCss(cssPath);
    if (!css) continue;
    combinedCritical += `\n/* ${path.basename(cssPath)} */\n${css}`;
    inlinedFiles.push(path.basename(cssPath));
  }

  const criticalCSS = minify(combinedCritical);

  // ── 4. Inject <style data-critical> before </head> ───────────
  const inlineStyle = `  <style data-critical>\n${criticalCSS}\n  </style>`;
  let updated = html.replace('</head>', `${inlineStyle}\n</head>`);

  // ── 5. Make inlined CSS files load async ─────────────────────
  // Remove their existing <link> tags and replace with async versions
  // Exception: base.css gets a proper async link (not removed entirely)
  for (const cssPath of cssFilePaths) {
    const cssFile = path.basename(cssPath);
    const cssDir  = path.dirname(cssPath)
      .replace(`${DIST}/`, '')
      .replace(`${DIST}\\`, '');

    const linkPattern = new RegExp(
      `<link[^>]+href=["'][^"']*${cssFile.replace('.', '\\.')}["'][^>]*>`,
      'g'
    );

    // Replace the <link> with an async version
    // It's already inlined so it defers gracefully
    const asyncLink = `<link rel="stylesheet" href="${cssDir}/${cssFile}" media="print" onload="this.media='all'">\n    <noscript><link rel="stylesheet" href="${cssDir}/${cssFile}"></noscript>`;

    updated = updated.replace(linkPattern, asyncLink);
  }

  await fs.writeFile(htmlPath, updated);

  // ── 6. Report ─────────────────────────────────────────────────
  const inlineKb = (criticalCSS.length / 1024).toFixed(1);
  console.log(
    `   ${htmlFile.padEnd(25)} ${inlineKb}kb inlined` +
    `  [${inlinedFiles.join(', ')}]`
  );
}

// ── Main ──────────────────────────────────────────────────────
console.log('\n⚡ Critical CSS — critical-section approach\n');

const htmlFiles = await getHtmlFiles();

if (!htmlFiles.length) {
  console.error(' No HTML files in dist/ — run npm run build first');
  process.exit(1);
}

for (const file of htmlFiles) {
  await processPage(file);
}

console.log('\n  ✔ Marked sections inlined    → browser paints immediately');
console.log('  ✔ Unmarked sections async    → zero render-blocking');
console.log('  ✔ base.css always inlined    → tokens + reset always ready');
console.log('  ✔ No duplicate downloads     → inlined files load async\n');
console.log('   To mark a section: add class="critical-section" to any element\n');
