#!/usr/bin/env node
// Usage: npm run page <page-name>
// Example: npm run page services

import { promises as fs } from 'fs';

const name = process.argv[2];
if (!name) { console.error('❌ Usage: npm run page <page-name>'); process.exit(1); }

const kebab = name.toLowerCase().replace(/\s+/g, '-');
const title = kebab.charAt(0).toUpperCase() + kebab.slice(1);

// 1. Create page pug file
const pugPath = `src/pages/${kebab}.pug`;
try {
  await fs.access(pugPath);
  console.error(`❌ Page "${kebab}.pug" already exists`);
  process.exit(1);
} catch {}

await fs.writeFile(pugPath,
`extends ../layouts/_base.pug

block pagecss
  link(rel="stylesheet" href="assets/css/pages/${kebab}.css")

block componentcss

block title
  | ${title} | AFS v16

block content
  section.section
    .container
      .section-header
        span.section-tag ${title}
        h1.section-title ${title} Page
        p.section-text Add your content here.
`);

// 2. Create page SCSS (for per-page mode)
await fs.writeFile(`src/sass/pages/${kebab}.scss`,
`// ${title.toUpperCase()} PAGE
// Add components this page uses below
@use 'shared';

// @use '../../components/section/section';
// @use '../../components/card/card';
// @use '../../components/hero/hero';
`);

// 3. Create page layer scss (for single mode — auto-scanned)
await fs.writeFile(`src/sass/layers/_${kebab}.scss`,
`// ${title.toUpperCase()} PAGE — page-specific styles
// These are auto-imported into app.scss in single mode
// .${kebab}-title { }
`);

console.log(`
✅ Page "${title}" created

   src/pages/${kebab}.pug              ← page content
   src/sass/pages/${kebab}.scss        ← per-page mode SCSS
   src/sass/layers/_${kebab}.scss      ← single mode styles (auto-imported)

   Single mode    → styles in src/sass/layers/_${kebab}.scss auto-load
   Per-page mode  → add sass target to package.json watch:sass + build:sass
                    src/sass/pages/${kebab}.scss:dist/assets/css/pages/${kebab}.css
`);
