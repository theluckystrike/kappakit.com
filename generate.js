#!/usr/bin/env node
/**
 * generate.js — Reads data/_tools.json + templates/_template.html
 * Generates one HTML per tool into tools/
 * Updates sitemap.xml
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DOMAIN = 'kappakit.com';
const DATE = '2026-04-06';

// Read inputs
const tools = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', '_tools.json'), 'utf8'));
const template = fs.readFileSync(path.join(ROOT, 'templates', '_template.html'), 'utf8');

// Ensure tools/ directory exists
const toolsDir = path.join(ROOT, 'tools');
if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir);

// Build FAQ HTML from FAQ array
function buildFaqHtml(faqs) {
  return faqs.map(f =>
    `    <details>\n      <summary>${escHtml(f.q)}</summary>\n      <p>${escHtml(f.a)}</p>\n    </details>`
  ).join('\n\n');
}

// Build FAQ JSON-LD schema
function buildFaqSchema(faqs) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.a
      }
    }))
  };
  return JSON.stringify(schema, null, 2);
}

// Build related links HTML
function buildRelatedLinks(relatedSlugs) {
  return relatedSlugs.map(slug => {
    const tool = tools.find(t => t.slug === slug);
    if (!tool) return '';
    return `      <a href="/tools/${tool.slug}.html" class="related-card">${escHtml(tool.h1)}</a>`;
  }).filter(Boolean).join('\n');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Generate each tool page
let generated = 0;
for (const tool of tools) {
  const canonical = `https://${DOMAIN}/tools/${tool.slug}.html`;
  const configJson = JSON.stringify(tool.config).replace(/'/g, '&#39;');

  let html = template
    .replace(/\{\{TITLE\}\}/g, tool.title)
    .replace(/\{\{H1\}\}/g, tool.h1)
    .replace(/\{\{DESCRIPTION\}\}/g, tool.description)
    .replace(/\{\{KEYWORD\}\}/g, tool.keyword)
    .replace(/\{\{SLUG\}\}/g, tool.slug)
    .replace(/\{\{DOMAIN\}\}/g, DOMAIN)
    .replace(/\{\{DATE\}\}/g, DATE)
    .replace(/\{\{FAQ_HTML\}\}/g, buildFaqHtml(tool.faq))
    .replace(/\{\{FAQ_SCHEMA\}\}/g, buildFaqSchema(tool.faq))
    .replace(/\{\{RELATED_LINKS\}\}/g, buildRelatedLinks(tool.related))
    .replace(/\{\{COMPONENT\}\}/g, tool.component)
    .replace(/\{\{CONFIG\}\}/g, configJson)
    .replace(/\{\{CANONICAL\}\}/g, canonical);

  fs.writeFileSync(path.join(toolsDir, `${tool.slug}.html`), html, 'utf8');
  generated++;
}

console.log(`Generated ${generated} tool pages in tools/`);

// Update sitemap.xml
const existingSitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');

// Remove closing </urlset> tag
let sitemapContent = existingSitemap.replace('</urlset>', '').trim();

// Add tools hub page
sitemapContent += `\n  <url>\n    <loc>https://${DOMAIN}/tools/</loc>\n    <lastmod>${DATE}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>`;

// Add each tool page
for (const tool of tools) {
  sitemapContent += `\n  <url>\n    <loc>https://${DOMAIN}/tools/${tool.slug}.html</loc>\n    <lastmod>${DATE}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
}

sitemapContent += '\n</urlset>\n';

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapContent, 'utf8');
console.log('Updated sitemap.xml with tool pages');
