#!/usr/bin/env node
// Usage: npm run new <name>
// Example: npm run new testimonial

import { promises as fs } from 'fs';
import path from 'path';

const name = process.argv[2];
if (!name) { console.error('❌ Usage: npm run new <name>'); process.exit(1); }

const kebab  = name.toLowerCase().replace(/\s+/g, '-');
const pascal = kebab.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
const dir    = `src/components/${kebab}`;

await fs.mkdir(dir, { recursive: true });

await fs.writeFile(`${dir}/_${kebab}.pug`,
`//- ${pascal} component — usage: +${kebab}({ title: '', text: '' })
mixin ${kebab}(data)
  section.${kebab}
    .container
      if data.title
        h2.${kebab}-title= data.title
      if data.text
        p.${kebab}-text= data.text
      block
`);

await fs.writeFile(`${dir}/${kebab}.scss`,
`@use '../../sass/utilities/mixins' as *;

@layer components {
  .${kebab} {
    padding-block: var(--space-section);

    &-title {
      font-size: var(--text-3xl);
      font-weight: var(--font-bold);
      color: var(--color-text-primary);
      margin-bottom: var(--space-4);
    }

    &-text {
      font-size: var(--text-lg);
      color: var(--color-text-secondary);
      max-width: 65ch;
    }
  }
}
`);

await fs.writeFile(`${dir}/${kebab}.preview.html`,
`<section class="${kebab}">
  <div class="container">
    <h2 class="${kebab}-title">${pascal} Title</h2>
    <p class="${kebab}-text">${pascal} description text.</p>
  </div>
</section>`);

console.log(`
✅ ${pascal} component created

   src/components/${kebab}/
     _${kebab}.pug       ← pug mixin
     ${kebab}.scss        ← styles (auto-imported on next build)
     ${kebab}.preview.html

   In single mode    → auto-added to app.css on next dev restart
   In per-page mode  → add @use to each page SCSS that needs it
   In per-component  → add to dist/assets/css/components/${kebab}.css watch target
`);
