#!/usr/bin/env node
import { CRITICAL } from '../afs.config.mjs';

if (CRITICAL) {
  const { execSync } = await import('child_process');
  execSync('node critical.mjs', { stdio: 'inherit' });
} else {
  console.log('\n⏭  Critical CSS skipped (CRITICAL = false in afs.config.mjs)\n');
}
