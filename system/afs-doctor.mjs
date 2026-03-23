#!/usr/bin/env node
// ============================================================
// AFS DOCTOR — project health check
// Usage: npm run doctor
// Checks that the project is correctly configured before build.
// ============================================================

import { promises as fs } from 'fs';
import path from 'path';
import { MODE, CRITICAL } from '../afs.config.mjs';

let warnings = 0;
let errors   = 0;

function pass(msg)  { console.log(`  ✅ ${msg}`); }
function warn(msg)  { console.warn(`  ⚠️  ${msg}`); warnings++; }
function fail(msg)  { console.error(`  ❌ ${msg}`); errors++; }
function section(title) { console.log(`\n── ${title}`); }

// ── 1. Config ─────────────────────────────────────────────────
section('Config (afs.config.mjs)');

const validModes = ['single', 'per-page', 'per-component'];
if (validModes.includes(MODE)) {
  pass(`MODE = '${MODE}'`);
} else {
  fail(`MODE = '${MODE}' — must be one of: ${validModes.join(', ')}`);
}

if (CRITICAL === false) {
  pass(`CRITICAL = false (dev mode)`);
} else if (CRITICAL === true) {
  warn(`CRITICAL = true — make sure this is intentional (production delivery only)`);
} else {
  fail(`CRITICAL must be true or false, got: ${JSON.stringify(CRITICAL)}`);
}

// ── 2. Swiper version consistency ─────────────────────────────
section('Swiper version');

let pkgSwiperVersion = 'unknown';
try {
  const pkg = JSON.parse(await fs.readFile('package.json', 'utf8'));
  const raw = pkg.dependencies?.swiper || pkg.devDependencies?.swiper || '';
  pkgSwiperVersion = raw.replace(/[\^~>=<]/g, '').split('.')[0]; // major only
} catch { fail('Could not read package.json'); }

const buildPug = await fs.readFile('system/build-pug.mjs', 'utf8').catch(() => '');
const cdnMatch = buildPug.match(/swiper@(\d+)/);
const cdnVersion = cdnMatch ? cdnMatch[1] : 'unknown';

if (pkgSwiperVersion === cdnVersion) {
  pass(`npm swiper@${pkgSwiperVersion} matches CDN swiper@${cdnVersion}`);
} else {
  fail(`Version mismatch — npm: swiper@${pkgSwiperVersion}, CDN: swiper@${cdnVersion}`);
  console.error(`     Fix: update swiper@${cdnVersion} in system/build-pug.mjs to match npm swiper@${pkgSwiperVersion}`);
}

// ── 3. Stale strings ──────────────────────────────────────────
section('Stale strings');

const stalePattern = /BS Package v\d+/;
const checkFiles = [
  'system/build-pug.mjs',
  'system/new-page.mjs',
  'system/new-component.mjs',
  'src/layouts/_footer.pug',
  'src/js/swiper-init.js',
  'WORKFLOW.md',
];
let staleFound = false;
for (const f of checkFiles) {
  try {
    const content = await fs.readFile(f, 'utf8');
    if (stalePattern.test(content)) {
      fail(`Stale string found in ${f}`);
      staleFound = true;
    }
  } catch { /* file may not exist, skip */ }
}
if (!staleFound) pass('No stale "BS Package" strings found');

// ── 4. Components — @use and @layer ───────────────────────────
section('Component SCSS structure');

let compProblems = 0;
try {
  const compDirs = (await fs.readdir('src/components', { withFileTypes: true }))
    .filter(e => e.isDirectory())
    .map(e => e.name);

  for (const comp of compDirs) {
    const scssPath = `src/components/${comp}/${comp}.scss`;
    try {
      const scss = await fs.readFile(scssPath, 'utf8');
      const hasUse   = scss.includes("@use '../../sass/utilities/mixins'");
      const hasLayer = scss.includes('@layer components');
      if (!hasUse) {
        warn(`${comp}.scss missing: @use '../../sass/utilities/mixins' as *;`);
        compProblems++;
      }
      if (!hasLayer) {
        warn(`${comp}.scss missing: @layer components { ... }`);
        compProblems++;
      }
    } catch { /* no scss file — ok, some components might not have one */ }
  }
} catch { fail('Could not scan src/components/'); }

if (compProblems === 0) pass('All component SCSS files have @use and @layer components');

// ── 5. Stray src/src/ folder ──────────────────────────────────
section('Project structure');

try {
  await fs.access('src/src');
  warn(`src/src/ folder exists — looks like misplaced example content. Move to examples/ and delete.`);
} catch {
  pass('No stray src/src/ folder');
}

// ── 6. Required source folders ────────────────────────────────
const requiredDirs = [
  'src/components',
  'src/layouts',
  'src/pages',
  'src/sass/tokens',
  'src/sass/base',
  'src/js',
  'system',
];
let missingDirs = 0;
for (const dir of requiredDirs) {
  try {
    await fs.access(dir);
  } catch {
    fail(`Missing required folder: ${dir}`);
    missingDirs++;
  }
}
if (missingDirs === 0) pass('All required source folders present');

// ── 7. CRITICAL warning in dev ────────────────────────────────
section('Production flags');
if (CRITICAL) {
  warn(`CRITICAL = true — inlining critical CSS. Only use this for final delivery.`);
} else {
  pass(`CRITICAL = false — correct for development`);
}

// ── Summary ───────────────────────────────────────────────────
console.log(`\n${'─'.repeat(48)}`);
if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed — project looks healthy.\n');
} else {
  if (errors > 0)   console.error(`❌ ${errors} error${errors > 1 ? 's' : ''} found — fix before building.`);
  if (warnings > 0) console.warn( `⚠️  ${warnings} warning${warnings > 1 ? 's' : ''} — review before delivery.`);
  console.log('');
  if (errors > 0) process.exit(1);
}
