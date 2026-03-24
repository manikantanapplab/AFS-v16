#!/usr/bin/env node
// Watches src/assets/ and copies to dist/assets/ on every change
import { watch } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';

const SRC  = 'src/assets';
const DEST = 'dist/assets';
const POLL_INTERVAL_MS = 1000;
let isPolling = false;

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

async function listFiles(dir, base = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(fullPath, base));
    } else if (entry.isFile()) {
      files.push(path.relative(base, fullPath));
    }
  }
  return files;
}

async function syncChangedFiles(snapshot) {
  const files = await listFiles(SRC);
  let count = 0;

  for (const relativePath of files) {
    const srcPath = path.join(SRC, relativePath);
    const destPath = path.join(DEST, relativePath);
    const stat = await fs.stat(srcPath);
    const signature = `${stat.mtimeMs}:${stat.size}`;

    if (snapshot.get(relativePath) === signature) continue;

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.copyFile(srcPath, destPath);
    snapshot.set(relativePath, signature);
    count++;
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Asset updated → ${relativePath}`);
  }

  for (const relativePath of snapshot.keys()) {
    if (!files.includes(relativePath)) snapshot.delete(relativePath);
  }

  return count;
}

function startPolling(snapshot, reason) {
  if (isPolling) return;
  isPolling = true;
  const suffix = reason ? ` (${reason})` : '';
  console.warn(`⚠️ Native asset watching unavailable${suffix}; polling every ${POLL_INTERVAL_MS}ms instead.`);
  setInterval(async () => {
    try {
      await syncChangedFiles(snapshot);
    } catch (error) {
      console.error(`Asset polling failed: ${error.message}`);
    }
  }, POLL_INTERVAL_MS);
  console.log(`👀 Polling ${SRC}/ for changes...`);
}

// Ensure the source directory exists so fresh projects do not crash.
await fs.mkdir(SRC, { recursive: true });

// Initial copy
const n = await copyAll();
console.log(`[${new Date().toLocaleTimeString()}] ✅ Assets copied (${n} files)`);

const snapshot = new Map();
for (const relativePath of await listFiles(SRC)) {
  const stat = await fs.stat(path.join(SRC, relativePath));
  snapshot.set(relativePath, `${stat.mtimeMs}:${stat.size}`);
}

// Watch for changes
try {
  const watcher = watch(SRC, { recursive: true }, async (event, filename) => {
    if (!filename) return;
    const srcPath  = path.join(SRC, filename);
    const destPath = path.join(DEST, filename);
    try {
      const stat = await fs.stat(srcPath);
      if (stat.isFile()) {
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.copyFile(srcPath, destPath);
        snapshot.set(filename, `${stat.mtimeMs}:${stat.size}`);
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Asset updated → ${filename}`);
      }
    } catch {
      snapshot.delete(filename);
    }
  });

  watcher.on('error', (error) => {
    watcher.close();
    startPolling(snapshot, error.code || error.message);
  });
  console.log(`👀 Watching ${SRC}/ for changes...`);
} catch (error) {
  startPolling(snapshot, error.code || error.message);
}
