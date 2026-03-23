#!/usr/bin/env node
// ============================================================
// BUILD SASS — auto-generates app.scss then compiles everything
// Scans src/components/ and src/sass/layers/ automatically
// No manual lists needed — just add files and restart
// ============================================================

import { promises as fs } from 'fs';
import { execSync, spawn } from 'child_process';
import path from 'path';

const SRC_DIR = 'src';
const COMPONENT_ENTRY_SUFFIX = '.utilities.generated.scss';
const PAGE_UTILITY_SUFFIX = '.utilities.generated.scss';
const PAGE_ENTRY_SUFFIX = '.entry.generated.scss';
const UTILITY_SOURCE_FILE_PATTERN = /\.(pug|html|js|ts|jsx|tsx)$/i;
const GAP_PATTERN = /\bg-(\d{1,3})\b/g;
const FIXED_FONT_SIZE_PATTERN = /\bfs-([1-9]\d{1,2})\b/g;
const FLUID_FONT_SIZE_PATTERN = /\bfs-(\d+(?:f\d+){1,3})\b/g;
const SPACING_PATTERN = /\b((?:m|p)[tbsexy])(?:-(sm|md|lg|xl|xxl))?-(\d{1,3})\b/g;
const FLUID_SPACING_PATTERN = /\b((?:m|p)[tbsexy])(?:-(sm|md|lg|xl|xxl))?-(\d+(?:f\d+){1,3})\b/g;
const SPACING_PREFIX_ORDER = ['mb', 'mt', 'ms', 'me', 'mx', 'my', 'pb', 'pt', 'ps', 'pe', 'px', 'py'];
const BREAKPOINT_ORDER = ['', 'sm', 'md', 'lg', 'xl', 'xxl'];

// ── Auto-scan components ─────────────────────────────────────
async function getValidComponents() {
  const comps = [];
  try {
    const entries = await fs.readdir('src/components', { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      try {
        await fs.access(`src/components/${e.name}/${e.name}.scss`);
        comps.push(e.name);
      } catch {}
    }
  } catch {}
  return comps;
}

async function getLayerFiles() {
  const layers = [];
  try {
    const entries = await fs.readdir('src/sass/layers', { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.startsWith('_') && e.name.endsWith('.scss')) {
        layers.push(path.basename(e.name, '.scss').replace(/^_/, ''));
      }
    }
  } catch {}
  return layers;
}

async function getPages() {
  const pages = [];
  try {
    const entries = await fs.readdir('src/pages', { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.pug')) {
        pages.push(path.basename(e.name, '.pug'));
      }
    }
  } catch {}
  return pages;
}

function sortNumbers(values) {
  return [...values].map(Number).sort((a, b) => a - b);
}

function sortFluidUtilities(values) {
  return [...values].sort((a, b) => {
    const aParts = a.split('f').map(Number);
    const bParts = b.split('f').map(Number);
    const maxLength = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < maxLength; i += 1) {
      const delta = (aParts[i] ?? -1) - (bParts[i] ?? -1);
      if (delta !== 0) return delta;
    }

    return 0;
  });
}

function sortSpacingUtilities(entries) {
  return [...entries].sort(([tokenA], [tokenB]) => {
    const [prefixA, breakpointA = ''] = tokenA.split('-');
    const [prefixB, breakpointB = ''] = tokenB.split('-');
    const prefixDelta = SPACING_PREFIX_ORDER.indexOf(prefixA) - SPACING_PREFIX_ORDER.indexOf(prefixB);

    if (prefixDelta !== 0) return prefixDelta;
    return BREAKPOINT_ORDER.indexOf(breakpointA) - BREAKPOINT_ORDER.indexOf(breakpointB);
  });
}

function sortFluidSpacingUtilities(entries) {
  return sortSpacingUtilities(entries).flatMap(([token, values]) =>
    sortFluidUtilities(values).map((value) => ({
      token,
      className: value,
      values: value.split('f').map(Number),
    }))
  );
}

function collectMatches(content, pattern) {
  return [...content.matchAll(new RegExp(pattern.source, 'g'))];
}

function detectComponents(content, availableComponents) {
  const used = new Set();

  for (const comp of availableComponents) {
    if (content.includes(`/components/${comp}/`)) { used.add(comp); continue; }
    if (new RegExp(`\\+${comp}[\\s\\(]`, 'i').test(content)) { used.add(comp); continue; }
    if (comp === 'button' && /\.btn[-\w]|class=["'][^"']*btn/.test(content)) { used.add(comp); continue; }
    if (new RegExp(`\\.${comp}[\\s\\n{(]`).test(content)) { used.add(comp); continue; }
  }

  return [...used].sort();
}

async function getSourceFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getSourceFiles(fullPath));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

async function collectGeneratedUtilitiesForFiles(files) {
  const utilities = {
    gaps: new Set(),
    fixedFontSizes: new Set(),
    fluidFontSizes: new Set(),
    spacing: new Map(),
    fluidSpacing: new Map(),
  };

  for (const file of files) {
    if (!UTILITY_SOURCE_FILE_PATTERN.test(file)) continue;

    const content = await fs.readFile(file, 'utf8').catch(() => '');

    for (const match of collectMatches(content, GAP_PATTERN)) {
      utilities.gaps.add(match[1]);
    }

    for (const match of collectMatches(content, FIXED_FONT_SIZE_PATTERN)) {
      utilities.fixedFontSizes.add(match[1]);
    }

    for (const match of collectMatches(content, FLUID_FONT_SIZE_PATTERN)) {
      utilities.fluidFontSizes.add(match[1]);
    }

    for (const [, prefix, breakpoint = '', value] of collectMatches(content, FLUID_SPACING_PATTERN)) {
      const token = breakpoint ? `${prefix}-${breakpoint}` : prefix;

      if (!utilities.fluidSpacing.has(token)) {
        utilities.fluidSpacing.set(token, new Set());
      }

      utilities.fluidSpacing.get(token).add(value);
    }

    for (const [, prefix, breakpoint = '', size] of collectMatches(content, SPACING_PATTERN)) {
      const token = breakpoint ? `${prefix}-${breakpoint}` : prefix;

      if (!utilities.spacing.has(token)) {
        utilities.spacing.set(token, new Set());
      }

      utilities.spacing.get(token).add(size);
    }
  }

  return {
    gaps: sortNumbers(utilities.gaps),
    fixedFontSizes: sortNumbers(utilities.fixedFontSizes),
    fluidFontSizes: sortFluidUtilities(utilities.fluidFontSizes),
    spacing: sortSpacingUtilities(utilities.spacing).map(([token, values]) => ({
      token,
      values: sortNumbers(values),
    })),
    fluidSpacing: sortFluidSpacingUtilities(utilities.fluidSpacing),
  };
}

function renderNumberList(values) {
  return values.length ? `(${values.join(', ')})` : '()';
}

function renderFluidFontSizeUtilities(values) {
  if (!values.length) return '()';

  return `(
${values.map((utility) => {
    const numbers = utility.split('f').join(', ');
    return `  (\n    values: (${numbers}),\n  ),`;
  }).join('\n')}
)`;
}

function renderSpacingUtilities(entries) {
  if (!entries.length) return '()';

  return `(
${entries.map(({ token, values }) => `  "${token}": ${renderNumberList(values)},`).join('\n')}
)`;
}

function renderFluidSpacingUtilities(entries) {
  if (!entries.length) return '()';

  return `(
${entries.map(({ token, className, values }) => `  (\n    token: "${token}",\n    class: "${className}",\n    values: (${values.join(', ')}),\n  ),`).join('\n')}
)`;
}

function getComponentEntryPath(component) {
  return `src/components/${component}/${component}${COMPONENT_ENTRY_SUFFIX}`;
}

function getPagePugPath(page) {
  return `src/pages/${page}.pug`;
}

function getPageUtilityPath(page) {
  return `src/sass/pages/${page}${PAGE_UTILITY_SUFFIX}`;
}

function getPageEntryPath(page) {
  return `src/sass/pages/${page}${PAGE_ENTRY_SUFFIX}`;
}

async function collectPageSourceFiles(page) {
  const pagesRoot = path.resolve('src/pages');
  const entryFile = path.resolve(getPagePugPath(page));
  const files = new Set();
  const queue = [entryFile];

  while (queue.length) {
    const file = queue.pop();
    if (files.has(file)) continue;

    files.add(file);

    const content = await fs.readFile(file, 'utf8').catch(() => '');
    const matches = [
      ...content.matchAll(/(?:include|extends)\s+([^\n]+\.pug)/g),
    ];

    for (const [, relativeRef] of matches) {
      const resolved = path.resolve(path.dirname(file), relativeRef.trim());

      if (!resolved.startsWith(pagesRoot)) continue;
      if (files.has(resolved)) continue;

      try {
        await fs.access(resolved);
        queue.push(resolved);
      } catch {}
    }
  }

  return [...files].map((file) => path.relative(process.cwd(), file));
}

async function detectPageComponents(page, availableComponents) {
  const files = await collectPageSourceFiles(page);
  let content = '';

  for (const file of files) {
    content += '\n' + await fs.readFile(file, 'utf8').catch(() => '');
  }

  return detectComponents(content, availableComponents);
}

function renderComponentUtilityEntry(component, utilities) {
  return `// AUTO-GENERATED — do not edit manually
// Regenerated by system/build-sass.mjs

@use './${component}';
@use '../../sass/utilities/generated' as generated;

@include generated.emit-generated-utilities(
  ${renderNumberList(utilities.gaps)},
  ${renderNumberList(utilities.fixedFontSizes)},
  ${renderFluidFontSizeUtilities(utilities.fluidFontSizes)},
  ${renderSpacingUtilities(utilities.spacing)},
  ${renderFluidSpacingUtilities(utilities.fluidSpacing)}
);
`;
}

async function writeGeneratedComponentEntries(components) {
  for (const component of components) {
    const componentDir = `src/components/${component}`;
    const files = await getSourceFiles(componentDir);
    const utilities = await collectGeneratedUtilitiesForFiles(files);
    const entryPath = getComponentEntryPath(component);
    const entry = renderComponentUtilityEntry(component, utilities);
    await fs.writeFile(entryPath, entry);
  }
}

function renderPageUtilityEntry(page, utilities) {
  return `// AUTO-GENERATED — do not edit manually
// Regenerated by system/build-sass.mjs

@use '../utilities/generated' as generated;

@include generated.emit-generated-utilities(
  ${renderNumberList(utilities.gaps)},
  ${renderNumberList(utilities.fixedFontSizes)},
  ${renderFluidFontSizeUtilities(utilities.fluidFontSizes)},
  ${renderSpacingUtilities(utilities.spacing)},
  ${renderFluidSpacingUtilities(utilities.fluidSpacing)}
);
`;
}

function renderPageEntry(page, components) {
  return `// AUTO-GENERATED — do not edit manually
// Regenerated by system/build-sass.mjs

@use './${page}';
@use './${page}${PAGE_UTILITY_SUFFIX.replace('.scss', '')}' as page_utilities;
${components.map((component) => `@use '../../components/${component}/${component}${COMPONENT_ENTRY_SUFFIX.replace('.scss', '')}' as ${component.replace(/-/g, '_')}_utilities;`).join('\n')}
`;
}

async function writeGeneratedPageEntries(pages, components) {
  for (const page of pages) {
    const pageFiles = await collectPageSourceFiles(page);
    const pageUtilities = await collectGeneratedUtilitiesForFiles(pageFiles);
    const usedComponents = await detectPageComponents(page, components);
    await fs.writeFile(getPageUtilityPath(page), renderPageUtilityEntry(page, pageUtilities));
    await fs.writeFile(getPageEntryPath(page), renderPageEntry(page, usedComponents));
  }
}

// ── Generate app.scss ────────────────────────────────────────
async function writeAppScss() {
  const components = await getValidComponents();
  const layers = await getLayerFiles();
  const pages = await getPages();

  const app = `// AUTO-GENERATED — do not edit manually
// Edit files in src/components/, src/sass/layers/
// Regenerated every time you run dev or build

@use 'base/layers';
@use 'base/bootstrap';
@use 'tokens/colors';
@use 'tokens/spacing';
@use 'tokens/typography';
@use 'base/reset';
@use 'base/base';
@use '../layouts/header';
@use 'base/footer';

// Components (${components.length} found)
${components.map(c => `@use '../components/${c}/${c}${COMPONENT_ENTRY_SUFFIX.replace('.scss', '')}';`).join('\n')}

// Page utilities (${pages.length} found)
${pages.length ? pages.map(p => `@use 'pages/${p}${PAGE_UTILITY_SUFFIX.replace('.scss', '')}';`).join('\n') : '// none yet'}

// Page styles (${layers.length} found)
${layers.length ? layers.map(l => `@use 'layers/${l}';`).join('\n') : '// none yet — run: npm run page <name>'}

@use 'utilities/functions';
@use 'utilities/mixins';
`;

  await fs.writeFile('src/sass/app.scss', app);
  console.log(`✅ app.scss — ${components.length} components, ${layers.length} page layers`);
}

const components = await getValidComponents();
const pages = await getPages();

await writeGeneratedComponentEntries(components);
await writeGeneratedPageEntries(pages, components);
await writeAppScss();

// ── Sass flags ────────────────────────────────────────────────
const DEPRECATION_FLAGS = '--silence-deprecation=import,global-builtin,color-functions,if-function';

const isWatch      = process.argv.includes('--watch');
const isCompressed = process.argv.includes('--compressed');
const noSourceMap  = process.argv.includes('--no-source-map');

// ── Build targets ─────────────────────────────────────────────
const targets = [
  'src/sass/app.scss:dist/assets/css/app.css',
  'src/sass/base/base-only.scss:dist/assets/css/base.css',
];

const pageScssEntries = await fs.readdir('src/sass/pages').catch(() => []);
for (const f of pageScssEntries) {
  if (
    f.startsWith('_') ||
    !f.endsWith('.scss') ||
    f.endsWith(PAGE_UTILITY_SUFFIX) ||
    f.endsWith(PAGE_ENTRY_SUFFIX)
  ) continue;
  const page = path.basename(f, '.scss');
  targets.push(`${getPageEntryPath(page)}:dist/assets/css/pages/${page}.css`);
}

for (const c of components) {
  targets.push(`${getComponentEntryPath(c)}:dist/assets/css/components/${c}.css`);
}

await fs.mkdir('dist/assets/css/pages',      { recursive: true });
await fs.mkdir('dist/assets/css/components', { recursive: true });

// ── Sourcemap logic ───────────────────────────────────────────
// Dev  (--watch):      sourcemaps ON  by default, full source paths
// Build (--compressed): sourcemaps ON  by default (aids BE debugging)
// Prod  (--no-source-map): sourcemaps OFF (use for final client delivery)
const sourceMapFlag = noSourceMap ? '--no-source-map' : '--source-map';

const sassArgs = [
  isWatch      ? '--watch'            : '',
  isCompressed ? '--style=compressed' : '',
  sourceMapFlag,
  DEPRECATION_FLAGS,
  ...targets,
].filter(Boolean);

if (isWatch) {
  console.log(`🗺  Sourcemaps: ON  (dev mode)`);
  const child = spawn('sass', sassArgs, { stdio: 'inherit', shell: true });
  child.on('error', err => { console.error(err.message); process.exit(1); });

  let refreshTimer;
  fs.watch(SRC_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename || !UTILITY_SOURCE_FILE_PATTERN.test(filename)) return;
    if (filename.includes('_utilities.generated.scss')) return;

    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      await writeGeneratedComponentEntries(components);
      await writeGeneratedPageEntries(pages, components);
      console.log(`↻ component and page utility entries regenerated`);
    }, 80);
  });
} else {
  console.log(`🗺  Sourcemaps: ${noSourceMap ? 'OFF' : 'ON'}`);
  execSync(`sass ${sassArgs.join(' ')}`, { stdio: 'inherit' });
  console.log(`✅ CSS compiled (${targets.length} targets)`);
}
