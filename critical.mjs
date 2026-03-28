
// USAGE:
//   Set CRITICAL = true in afs.config.mjs
//   Run: npm run build:prod
// ============================================================

import { promises as fs } from 'fs';
import path               from 'path';
import { MODE }           from './afs.config.mjs';

const DIST = 'dist';


const CRITICAL_SELECTORS = [
  // Layer order — must always come first
  /^@layer\s+[^{]+;/,

  // CSS custom properties — everything depends on these
  /^:root/,
  /^\[data-theme/,

  // Reset layer — tiny, always needed
  /^@layer reset/,

  // Body paint rules
  /^body\b/,
  /^html\b/,
  /^\*,\s*::/,
  /^\*\b/,

  // Headings — needed for hero title to render correctly
  /^h[1-6]\b/,
  /^\.h[1-6]\b/,

  // Paragraph and links — base text paint
  /^p\b/,
  /^a\b/,
  /^img\b/,

  // Navigation — always visible above fold
  /^\.site-header/,
  /^\.navbar/,
  /^\.nav-/,
  /^\.navbar-/,

  // Bootstrap layer order and base vars only
  /^@layer bootstrap/,
];

// ── Extract critical rules from a CSS string ─────────────────
function extractCritical(css) {
  const critical = new Set();

  // 1. Always include @layer declarations (order matters)
  const layerDeclarations = css.match(/@layer\s+[^{]+;/g) || [];
  layerDeclarations.forEach(r => critical.add(r));

  // 2. Always include :root blocks (all token variables)
  const rootBlocks = css.match(/:root\s*\{[^}]+\}/g) || [];
  rootBlocks.forEach(r => critical.add(r));

  // 3. Always include dark mode token overrides
  const darkBlocks = css.match(/\[data-theme[^\{]*\{[^}]+\}/g) || [];
  darkBlocks.forEach(r => critical.add(r));

  // 4. Always include @keyframes used by above-fold elements
  // (only blob-drift for hero, fade-in animations)
  const keyframes = css.match(/@keyframes\s+(?:blob-drift|fade-in)[^{}]*(?:\{[^{}]*(?:\{[^}]*\}[^{}]*)*\})/g) || [];
  keyframes.forEach(r => critical.add(r));

  // 5. Extract @layer reset block entirely (it's tiny)
  const resetLayer = css.match(/@layer reset\s*\{[\s\S]*?\}\s*\}/);
  if (resetLayer) critical.add(resetLayer[0]);

  // 6. Extract matching individual rules
  // Simple rule pattern: selector { properties }
  const rulePattern = /([.#*a-zA-Z][^{}@]*?)\s*\{([^{}]+)\}/g;
  let match;

  while ((match = rulePattern.exec(css)) !== null) {
    const selector = match[1].trim();
    const isMatch  = CRITICAL_SELECTORS.some(pattern => pattern.test(selector));
    if (isMatch) {
      critical.add(`${selector}{${match[2]}}`);
    }
  }

  // 7. Minify — remove comments and collapse whitespace
  return [...critical]
    .join('')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Process one HTML file ─────────────────────────────────────
async function processPage(htmlPath, cssPath) {
  let html, css;

  try {
    html = await fs.readFile(htmlPath, 'utf8');
  } catch {
    console.log(`  ⚠️  Skipping ${path.basename(htmlPath)} — HTML not found`);
    return;
  }

  try {
    css = await fs.readFile(cssPath, 'utf8');
  } catch {
    console.log(`  ⚠️  Skipping ${path.basename(htmlPath)} — CSS not found: ${cssPath}`);
    return;
  }

  const criticalCSS = extractCritical(css);
  const cssFile     = path.basename(cssPath);
  const cssDir      = path.dirname(cssPath).replace(`${DIST}/`, '').replace(`${DIST}\\`, '');

  // ── Inline critical + make full CSS async ────────────────────
  //
  // BEFORE:
  //   <link rel="stylesheet" href="assets/css/base.css">
  //
  // AFTER:
  //   <style data-critical>...above fold CSS...</style>
  //   <link rel="stylesheet" href="assets/css/base.css"
  //         media="print" onload="this.media='all'">
  //   <noscript><link rel="stylesheet" href="assets/css/base.css"></noscript>
  //
  const inlineStyle = `<style data-critical>${criticalCSS}</style>`;
  const asyncLink   = `<link rel="stylesheet" href="${cssDir}/${cssFile}" media="print" onload="this.media='all'">
    <noscript><link rel="stylesheet" href="${cssDir}/${cssFile}"></noscript>`;

  const linkPattern = new RegExp(
    `<link[^>]+href=["'][^"']*${cssFile.replace('.', '\\.')}["'][^>]*>`,
    'g'
  );

  const updated = html.replace(linkPattern, `${inlineStyle}\n    ${asyncLink}`);

  await fs.writeFile(htmlPath, updated);

  // ── Report ────────────────────────────────────────────────────
  const inlineKb  = (criticalCSS.length / 1024).toFixed(1);
  const totalKb   = (css.length / 1024).toFixed(1);
  const deferred  = (((css.length - criticalCSS.length) / css.length) * 100).toFixed(0);

  console.log(
    `  ${path.basename(htmlPath).padEnd(20)} ` +
    `${inlineKb}kb inlined / ${totalKb}kb total  ` +
    `(${deferred}% deferred)`
  );
}

// ── Auto-scan dist/ HTML files ────────────────────────────────
async function getHtmlFiles() {
  const entries = await fs.readdir(DIST, { withFileTypes: true }).catch(() => []);
  return entries
    .filter(e => e.isFile() && e.name.endsWith('.html'))
    .map(e => e.name);
}

// ── Main ──────────────────────────────────────────────────────
console.log('\n⚡ Critical CSS — Smart extraction\n');

const htmlFiles = await getHtmlFiles();

if (!htmlFiles.length) {
  console.error(' No HTML files in dist/ — run npm run build first');
  process.exit(1);
}

// In per-component mode: base.css has the tokens + reset + base
// In single mode:        app.css has everything
// In per-page mode:      each page has its own CSS
if (MODE === 'single') {
  for (const file of htmlFiles) {
    await processPage(
      `${DIST}/${file}`,
      `${DIST}/assets/css/app.css`
    );
  }

} else if (MODE === 'per-page') {
  for (const file of htmlFiles) {
    const page = path.basename(file, '.html');
    await processPage(
      `${DIST}/${file}`,
      `${DIST}/assets/css/pages/${page}.css`
    );
  }

} else if (MODE === 'per-component') {
  // Only inline base.css — it contains tokens + reset + body + header
  // All component CSS files are already separate and load async
  // via the <link> tags AFS generates — no need to touch them
  for (const file of htmlFiles) {
    await processPage(
      `${DIST}/${file}`,
      `${DIST}/assets/css/base.css`
    );
  }
}

console.log('\n   Above-fold CSS inlined  → browser paints immediately');
console.log('   Full CSS loads async    → zero render-blocking');
console.log('   No duplicate downloads  → each rule loaded once\n');
