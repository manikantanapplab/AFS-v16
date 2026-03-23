#!/usr/bin/env node
// Watches src/js/ and copies to dist/assets/js/ on every change
import { watch } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

const SRC  = 'src/js';
const DEST = 'dist/assets/js';

async function copyAll(src, dest) {
  src  = src  || SRC;
  dest = dest || DEST;
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += await copyAll(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
      count++;
    }
  }
  return count;
}

// Initial copy
const n = await copyAll();
console.log(`[${new Date().toLocaleTimeString()}] ✅ JS copied (${n} files)`);

// Watch for changes
watch(SRC, { recursive: true }, async (event, filename) => {
  if (!filename) return;
  const srcPath  = path.join(SRC, filename);
  const destPath = path.join(DEST, filename);
  try {
    const stat = await fs.stat(srcPath);
    if (stat.isFile()) {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(srcPath, destPath);
      console.log(`[${new Date().toLocaleTimeString()}] ✅ JS updated → ${filename}`);
    }
  } catch {
    // file deleted or inaccessible — ignore
  }
});

console.log(`👀 Watching src/js/ for changes...`);
