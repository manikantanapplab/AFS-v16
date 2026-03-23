import fs from 'fs';
import path from 'path';
import autoprefixer from 'autoprefixer';

const isProd = process.env.NODE_ENV === 'production';
const projectRoot = process.cwd();

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function resolveFromRoot(...segments) {
  return path.resolve(projectRoot, ...segments);
}

function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function collectFiles(dirPath, extensions, found = []) {
  if (!exists(dirPath)) return found;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, extensions, found);
      continue;
    }

    if (extensions.has(path.extname(entry.name))) {
      found.push(fullPath);
    }
  }

  return found;
}

function collectPugDependencies(entryFile, seen = new Set()) {
  const resolved = path.resolve(entryFile);
  if (!exists(resolved) || seen.has(resolved)) return [];

  seen.add(resolved);

  const content = readText(resolved);
  const results = [resolved];
  const dependencyRegex = /^\s*(?:include|extends)\s+([^\s]+\.pug)\s*$/gm;

  let match;
  while ((match = dependencyRegex.exec(content)) !== null) {
    const nextPath = path.resolve(path.dirname(resolved), match[1]);
    results.push(...collectPugDependencies(nextPath, seen));
  }

  return results;
}

function uniqueFiles(files) {
  return [...new Set(files.filter(Boolean).map(file => path.resolve(file)))];
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function componentMentioned(content, componentName) {
  const escaped = escapeRegex(componentName);

  return (
    content.includes(`/components/${componentName}/`) ||
    new RegExp(`\\+${escaped}[\\s\\(]`, 'i').test(content) ||
    new RegExp(`\\.${escaped}(?=[\\s\\n.#:{(]|$)`).test(content)
  );
}

function collectPagesUsingComponent(componentName) {
  const pagesDir = resolveFromRoot('src/pages');
  const pages = collectFiles(pagesDir, new Set(['.pug']));
  const matches = [];

  for (const pageFile of pages) {
    if (componentMentioned(readText(pageFile), componentName)) {
      matches.push(pageFile);
    }
  }

  return matches;
}

function buildPageContent(pageName) {
  const pageEntry = resolveFromRoot('src/pages', `${pageName}.pug`);
  const globalFrames = [
    resolveFromRoot('src/layouts/_base.pug'),
    resolveFromRoot('src/layouts/_header.pug'),
    resolveFromRoot('src/layouts/_footer.pug'),
  ];

  return uniqueFiles([
    ...collectPugDependencies(pageEntry),
    ...globalFrames,
  ]);
}

function buildComponentContent(componentName) {
  const componentDir = resolveFromRoot('src/components', componentName);
  const relatedPages = collectPagesUsingComponent(componentName);

  return uniqueFiles([
    ...collectFiles(componentDir, new Set(['.pug', '.html'])),
    ...relatedPages,
  ]);
}

function buildGlobalContent() {
  return uniqueFiles([
    ...collectFiles(resolveFromRoot('src'), new Set(['.pug'])),
  ]);
}

function getPurgeContent(targetFile) {
  if (!targetFile) return buildGlobalContent();

  const normalized = normalizePath(targetFile);
  const pageMatch = normalized.match(/dist\/assets\/css\/pages\/([^/]+)\.css$/);
  if (pageMatch) return buildPageContent(pageMatch[1]);

  const componentMatch = normalized.match(/dist\/assets\/css\/components\/([^/]+)\.css$/);
  if (componentMatch) return buildComponentContent(componentMatch[1]);

  return buildGlobalContent();
}

const plugins = [autoprefixer];

if (isProd) {
  const { default: purgecss } = await import('@fullhuman/postcss-purgecss');
  const { default: cssnano }   = await import('cssnano');
  const purgeContent = getPurgeContent(process.env.PURGECSS_TARGET);

  plugins.push(
    purgecss({
      content: purgeContent,
      safelist: {
        standard: [
          'show', 'showing', 'hide', 'hiding',
          'active', 'disabled', 'collapsed', 'collapsing',
          'fade', 'open', 'is-scrolled',
        ],
      },
      keyframes: true,
      variables: true,
      fontFace: true,
    })
  );

  plugins.push(
    cssnano({
      preset: ['default', {
        discardComments: { removeAll: true },
        reduceIdents: false,
      }],
    })
  );
}

export default { plugins };
