#!/usr/bin/env node
// ============================================================
// CRITICAL CSS — auto-scans pages, no manual config needed
// ============================================================

import { promises as fs } from 'fs';
import path from 'path';
import { MODE } from './afs.config.mjs';

const DIST = 'dist';

const CRITICAL_PATTERNS = [
  /^:root/, /^\*/, /^html/, /^body/, /^\[data-theme/,
  /^h[1-6]/, /^\.navbar/, /^\.site-header/, /^\.nav-/,
  /^\.container/, /^\.hero/, /^\.row/, /^\.col-/,
];

function extractCritical(css) {
  const critical = [];
  const layerMatch = css.match(/@layer[^;]+;/g);
  if (layerMatch) critical.push(...layerMatch);
  const rootMatch = css.match(/:root\s*\{[^}]+\}/g);
  if (rootMatch) critical.push(...rootMatch);
  const themeMatch = css.match(/\[data-theme[^\{]*\{[^}]+\}/g);
  if (themeMatch) critical.push(...themeMatch);
  const keyframeMatch = css.match(/@keyframes\s+\S+\s*\{[^{}]*(?:\{[^}]*\}[^{}]*)*\}/g);
  if (keyframeMatch) critical.push(...keyframeMatch);
  const ruleRegex = /([.#a-zA-Z][^{}@]*?)\{([^{}]+)\}/g;
  let match;
  while ((match = ruleRegex.exec(css)) !== null) {
    const selector = match[1].trim();
    if (CRITICAL_PATTERNS.some(p => p.test(selector))) {
      critical.push(`${selector}{${match[2]}}`);
    }
  }
  return [...new Set(critical)].join('').replace(/\/\*.*?\*\//gs, '').replace(/\s+/g, ' ').trim();
}

async function processPage(htmlPath, cssPath) {
  let html, css;
  try {
    html = await fs.readFile(htmlPath, 'utf8');
    css  = await fs.readFile(cssPath,  'utf8');
  } catch {
    console.log(`  ⚠  Skipping ${path.basename(htmlPath)} — CSS not found`);
    return;
  }
  const criticalCSS = extractCritical(css);
  const cssFile = path.basename(cssPath);
  const cssDir  = path.dirname(cssPath).replace(`${DIST}/`, '');
  const inlineStyle = `<style data-critical>${criticalCSS}</style>`;
  const asyncLink   = `<link rel="stylesheet" href="${cssDir}/${cssFile}" media="print" onload="this.onload=null;this.removeAttribute('media')">
    <noscript><link rel="stylesheet" href="${cssDir}/${cssFile}"></noscript>`;
  const linkRegex = new RegExp(`<link[^>]+href=["'][^"']*${cssFile}["'][^>]*>`, 'g');
  const updated = html.replace(linkRegex, `${inlineStyle}\n    ${asyncLink}`);
  await fs.writeFile(htmlPath, updated);
  const ckb = (criticalCSS.length / 1024).toFixed(1);
  const tkb = (css.length / 1024).toFixed(1);
  const pct = ((1 - criticalCSS.length / css.length) * 100).toFixed(0);
  console.log(`  ✅ ${path.basename(htmlPath).padEnd(20)} ${ckb}kb inline / ${tkb}kb total  (${pct}% deferred)`);
}

// Auto-scan dist/ for HTML files
async function getHtmlFiles() {
  const entries = await fs.readdir(DIST, { withFileTypes: true }).catch(() => []);
  return entries.filter(e => e.isFile() && e.name.endsWith('.html')).map(e => e.name);
}

console.log('\n⚡ Critical CSS\n');

const htmlFiles = await getHtmlFiles();

if (MODE === 'single') {
  for (const html of htmlFiles) {
    await processPage(`${DIST}/${html}`, `${DIST}/assets/css/app.css`);
  }
} else if (MODE === 'per-page') {
  for (const html of htmlFiles) {
    const page = path.basename(html, '.html');
    await processPage(`${DIST}/${html}`, `${DIST}/assets/css/pages/${page}.css`);
  }
} else if (MODE === 'per-component') {
  for (const html of htmlFiles) {
    await processPage(`${DIST}/${html}`, `${DIST}/assets/css/base.css`);
  }
}

console.log('\n  Above-fold CSS inlined → browser paints immediately');
console.log('  Full CSS loads async   → no render-blocking\n');
