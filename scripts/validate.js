#!/usr/bin/env node
/**
 * KappaKit Answer Page Validator
 * Quality gate: verifies generated pages meet standards.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ANSWERS_DIR = path.join(__dirname, '..', 'answers');

function computeHash(algo, input) {
  return crypto.createHash(algo).update(input, 'utf8').digest('hex');
}

function countWords(html) {
  // Strip HTML tags and count words
  const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                   .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                   .replace(/<[^>]+>/g, ' ')
                   .replace(/&[a-zA-Z]+;/g, ' ')
                   .replace(/&#?\w+;/g, ' ')
                   .replace(/\s+/g, ' ')
                   .trim();
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function validate() {
  const files = fs.readdirSync(ANSWERS_DIR).filter(f => f.endsWith('.html'));
  const titles = new Set();
  let errors = 0;
  let warnings = 0;
  let passed = 0;

  console.log(`\n=== KappaKit Answer Validator ===`);
  console.log(`Scanning ${files.length} answer pages...\n`);

  for (const file of files) {
    const filePath = path.join(ANSWERS_DIR, file);
    const html = fs.readFileSync(filePath, 'utf8');
    const slug = file.replace('.html', '');
    const pageErrors = [];
    const pageWarnings = [];

    // 1. Word count >= 400
    const wordCount = countWords(html);
    if (wordCount < 400) {
      pageErrors.push(`Word count ${wordCount} < 400 minimum`);
    }

    // 2. Unique title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    if (!titleMatch) {
      pageErrors.push('Missing <title> tag');
    } else {
      const title = titleMatch[1];
      if (titles.has(title)) {
        pageErrors.push(`Duplicate title: "${title}"`);
      }
      titles.add(title);
    }

    // 3. Required elements
    if (!html.includes('class="site-logo"')) pageErrors.push('Missing site-logo header');
    if (!html.includes('class="breadcrumb"')) pageErrors.push('Missing breadcrumb');
    if (!html.includes('<h1>')) pageErrors.push('Missing H1');
    if (!html.includes('tool-page-hero')) pageErrors.push('Missing tool-page-hero section');
    if (!html.includes('application/ld+json')) pageErrors.push('Missing JSON-LD');
    if (!html.includes('FAQPage')) pageErrors.push('Missing FAQPage schema');
    if (!html.includes('class="site-footer"')) pageErrors.push('Missing footer');
    if (!html.includes('zovo-network')) pageErrors.push('Missing Zovo network');
    if (!html.includes('rel="canonical"')) pageErrors.push('Missing canonical URL');
    if (!html.includes('og:title')) pageErrors.push('Missing og:title');
    if (!html.includes('twitter:card')) pageErrors.push('Missing twitter:card');
    if (!html.includes('<details>')) pageWarnings.push('Missing FAQ details/summary');
    if (!html.includes('related-grid')) pageWarnings.push('Missing related questions');

    // 4. No template artifacts
    if (html.includes('{{') || html.includes('}}')) pageErrors.push('Template artifact: {{ or }}');
    if (html.includes('undefined') && !html.includes('is undefined')) pageErrors.push('Contains "undefined"');
    if (html.includes('TODO') || html.includes('FIXME')) pageErrors.push('Contains TODO/FIXME');

    // 5. Hash verification (for hash pages)
    const hashMatch = slug.match(/^(md5|sha1|sha256|sha512)-hash-of-(.+)$/);
    if (hashMatch) {
      const algo = hashMatch[1];
      const slugPart = hashMatch[2];

      // Reconstruct input from slug -- try to match against known strings
      const knownStrings = [
        'test', 'admin', 'root', 'example', 'foo', 'bar', 'foobar',
        '123456', 'qwerty', 'letmein', 'abc', 'abc123', 'welcome', 'monkey',
        'hello', 'password', '',
        'The quick brown fox jumps over the lazy dog',
      ];

      const slugToStr = {};
      for (const s of knownStrings) {
        const sl = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        slugToStr[sl] = s;
      }

      const inputStr = slugToStr[slugPart];
      if (inputStr !== undefined) {
        const expectedHash = computeHash(algo, inputStr);
        if (!html.includes(expectedHash)) {
          pageErrors.push(`HASH MISMATCH: ${algo}("${inputStr}") should be ${expectedHash}`);
        }
      }
    }

    // Report
    if (pageErrors.length > 0) {
      console.log(`FAIL  ${file}`);
      pageErrors.forEach(e => console.log(`  ERROR: ${e}`));
      pageWarnings.forEach(w => console.log(`  WARN:  ${w}`));
      errors += pageErrors.length;
    } else if (pageWarnings.length > 0) {
      console.log(`WARN  ${file} (${wordCount} words)`);
      pageWarnings.forEach(w => console.log(`  WARN:  ${w}`));
      warnings += pageWarnings.length;
      passed++;
    } else {
      console.log(`OK    ${file} (${wordCount} words)`);
      passed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total pages: ${files.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);

  if (errors > 0) {
    console.log(`\nVALIDATION FAILED`);
    process.exit(1);
  } else {
    console.log(`\nVALIDATION PASSED`);
  }
}

validate();
