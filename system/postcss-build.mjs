#!/usr/bin/env node
// ============================================================
// POSTCSS BUILD — PurgeCSS + cssnano
// Runs after sass compilation on all CSS files in dist/
// ============================================================

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

async function getCSSFiles(dir) {
  const files = [];
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch { return files; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...await getCSSFiles(full));
    else if (e.name.endsWith('.css') && !e.name.endsWith('.map')) files.push(full);
  }
  return files;
}

console.log('\n🧹 PurgeCSS + minify\n');

const files = await getCSSFiles('dist/assets/css');
if (!files.length) {
  console.error('❌ No CSS found — run npm run build first');
  process.exit(1);
}

let totalBefore = 0, totalAfter = 0;

for (const file of files) {
  const before = (await fs.stat(file)).size;
  try {
    execSync(`npx postcss "${file}" --output "${file}" --config postcss.config.js`, {
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PURGECSS_TARGET: file,
      }
    });
    const after = (await fs.stat(file)).size;
    totalBefore += before;
    totalAfter  += after;
    const saved    = (((before - after) / before) * 100).toFixed(0);
    const beforeKb = (before / 1024).toFixed(1);
    const afterKb  = (after  / 1024).toFixed(1);
    const icon = after < 20000 ? '🟢' : after < 50000 ? '🟡' : '🔴';
    console.log(`  ${icon} ${file.replace('dist/assets/css/', '').padEnd(38)} ${beforeKb}kb → ${afterKb}kb  (-${saved}%)`);
  } catch (e) {
    console.error(`  ❌ Failed: ${file}\n${e.stderr?.toString()}`);
  }
}

const totalSaved = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0);
console.log(`\n  Total: ${(totalBefore/1024).toFixed(0)}kb → ${(totalAfter/1024).toFixed(0)}kb  (-${totalSaved}%)\n`);
