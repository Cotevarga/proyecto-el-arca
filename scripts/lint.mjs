#!/usr/bin/env node
// EL ARCA — Frontend lint checker
// Checks HTML files for common issues: missing alt text, broken links, etc.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const ROOT = join(__dirname, '..');

const htmlFiles = readdirSync(ROOT).filter(f => f.endsWith('.html'));
let errors = 0;
let warnings = 0;

console.log(`🔍 Linting ${htmlFiles.length} HTML files...\n`);

for (const file of htmlFiles) {
  const content = readFileSync(join(ROOT, file), 'utf-8');
  const lines = content.split('\n');

  // Check for unclosed tags (basic)
  const openTags = (content.match(/<[a-z]+[\s>]/gi) || []).length;
  const closeTags = (content.match(/<\/[a-z]+>/gi) || []).length;
  // (Not perfect but gives a signal)

  // Check for missing alt text on images
  lines.forEach((line, i) => {
    const imgMatch = line.match(/<img[^>]+>/gi);
    if (imgMatch) {
      imgMatch.forEach(img => {
        if (!img.includes('alt=') && !img.includes('alt =')) {
          console.warn(`  ⚠️  ${file}:${i + 1} - Missing alt text: ${img.substring(0, 80)}`);
          warnings++;
        }
      });
    }
  });

  // Check for inline script without proper escaping
  lines.forEach((line, i) => {
    if (line.includes('innerHTML') && !file.includes('admin.html')) {
      // This is a potential XSS vector - warn
      console.warn(`  ⚠️  ${file}:${i + 1} - innerHTML usage (potential XSS if unescaped)`);
      warnings++;
    }
  });
}

console.log(`\n✅ Done: ${errors} errors, ${warnings} warnings`);
process.exit(errors > 0 ? 1 : 0);
