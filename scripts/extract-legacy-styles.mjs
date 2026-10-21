import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'web', 'src', 'styles', 'legacy');
const sourceDirectories = ['', 'relatos'];
const pagePaths = sourceDirectories.flatMap((directory) => {
  const absoluteDirectory = join(root, directory);
  return readdirSync(absoluteDirectory)
    .map((entry) => join(directory, entry))
    .filter((path) => path.toLowerCase().endsWith('.html'))
    .filter((path) => statSync(join(root, path)).isFile());
});

let extractedCount = 0;

for (const pagePath of pagePaths) {
  const absolutePagePath = join(root, pagePath);
  const source = readFileSync(absolutePagePath, 'utf8');
  const styleBlocks = [...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)];
  if (styleBlocks.length === 0) continue;

  const cssPath = pagePath.replace(/\.html$/i, '.css');
  const absoluteCssPath = join(output, cssPath);
  const linkPath = `/css/legacy/${cssPath.replaceAll(sep, '/')}`;
  const css = styleBlocks.map((match) => match[1].trim()).filter(Boolean).join('\n\n');
  let nextSource = source.replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');

  if (!nextSource.includes(linkPath)) {
    nextSource = nextSource.replace(
      /<\/head\s*>/i,
      `  <link rel="stylesheet" href="${linkPath}">\n</head>`,
    );
  }

  mkdirSync(dirname(absoluteCssPath), { recursive: true });
  writeFileSync(absoluteCssPath, `${css}\n`, 'utf8');
  writeFileSync(absolutePagePath, nextSource, 'utf8');
  extractedCount++;
}

console.log(`Extracted embedded styles from ${extractedCount} HTML pages.`);
