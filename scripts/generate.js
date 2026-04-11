#!/usr/bin/env node
/**
 * KappaKit Programmatic Answer Page Generator
 * Generates hash, regex, and encoding reference pages from seed data + templates.
 * No npm dependencies -- uses only Node.js built-in modules.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ANSWERS_DIR = path.join(__dirname, '..', 'answers');
const SITEMAP_PATH = path.join(__dirname, '..', 'sitemap.xml');
const TODAY = '2026-04-11';

// ── Existing pages to skip ──────────────────────────────────────────────────
const existingFiles = new Set(fs.readdirSync(ANSWERS_DIR).map(f => f.replace('.html', '')));

// ── Shared HTML fragments ───────────────────────────────────────────────────
const HEADER = `<header class="site-header">
  <a href="/" class="site-logo">KappaKit</a>
  <nav class="site-nav">
    <a href="/">Home</a>
    <a href="/tools/">Tools</a>
    <a href="/blog/">Blog</a>
    <a href="/about.html">About</a>
    <div class="nav-right">
      <a href="https://zovo.one/pricing?utm_source=kappakit.com&amp;utm_medium=satellite&amp;utm_campaign=nav-link" class="nav-pro" target="_blank">Go Pro &#10022;</a>
      <a href="https://zovo.one/tools" class="nav-zovo">Zovo Tools</a>
    </div>
  </nav>
</header>`;

const FOOTER = `<footer class="site-footer">
    <div class="footer-inner">
        <div class="footer-brand">Zovo Tools</div>
        <div class="footer-tagline">Free developer tools by a solo dev. No tracking.</div>
        <a href="https://zovo.one/pricing?utm_source=kappakit.com&utm_medium=satellite&utm_campaign=footer-link" class="footer-cta">Zovo Lifetime — $99 once, free forever &#8594;</a>
        <div class="footer-copy">&copy; 2026 <a href="https://zovo.one">Zovo</a></div>
    </div>
</footer>

<nav class="zovo-network" aria-label="Zovo Tools Network">
    <div class="zovo-network-inner">
        <h3 class="zovo-network-title">Explore More Tools</h3>
        <div class="zovo-network-links">
            <a href="https://abwex.com">ABWex — A/B Testing</a>
            <a href="https://claudflow.com">ClaudFlow — Workflows</a>
            <a href="https://claudhq.com">ClaudHQ — Prompts</a>
            <a href="https://claudkit.com">ClaudKit — API</a>
            <a href="https://enhio.com">Enhio — Text Tools</a>
            <a href="https://epochpilot.com">EpochPilot — Timestamps</a>
            <a href="https://gen8x.com">Gen8X — Color Tools</a>
            <a href="https://gpt0x.com">GPT0X — AI Models</a>
            <a href="https://heytensor.com">HeyTensor — ML Tools</a>
            <a href="https://invokebot.com">InvokeBot — Webhooks</a>
            <a href="https://kappafy.com">Kappafy — JSON</a>
            <a href="https://kickllm.com">KickLLM — LLM Costs</a>
            <a href="https://krzen.com">Krzen — Image Tools</a>
            <a href="https://lochbot.com">LochBot — Security</a>
            <a href="https://lockml.com">LockML — ML Compare</a>
            <a href="https://ml3x.com">ML3X — Matrix Math</a>
        </div>
    </div>
</nav>`;

// ── Algorithm metadata ──────────────────────────────────────────────────────
const ALGO_META = {
  md5:    { bits: 128, hexLen: 32, name: 'MD5',     bashCmd: 'md5sum',    toolPage: '/tools/md5-hash.html',    broken: true },
  sha1:   { bits: 160, hexLen: 40, name: 'SHA-1',   bashCmd: 'sha1sum',   toolPage: '/tools/sha1-hash.html',   broken: true },
  sha256: { bits: 256, hexLen: 64, name: 'SHA-256', bashCmd: 'sha256sum', toolPage: '/tools/sha256-hash.html', broken: false },
  sha512: { bits: 512, hexLen: 128, name: 'SHA-512', bashCmd: 'sha512sum', toolPage: '/tools/sha512-hash.html', broken: false },
};

// Common password list strings (for security note)
const COMMON_PASSWORDS = new Set([
  'password', 'admin', 'root', 'test', '123456', 'qwerty', 'letmein',
  'abc', 'abc123', 'welcome', 'monkey', 'foobar', 'foo', 'bar'
]);

// ── Hash computation ────────────────────────────────────────────────────────
function computeHash(algo, input) {
  return crypto.createHash(algo).update(input, 'utf8').digest('hex');
}

// ── Escape HTML entities for safe embedding ─────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Escape for JSON-LD ──────────────────────────────────────────────────────
function escapeJsonLd(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// ── Slug from string ────────────────────────────────────────────────────────
function slugify(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Algorithm description paragraphs ────────────────────────────────────────
function algoDescription(algo) {
  const m = ALGO_META[algo];
  const descs = {
    md5: `MD5 (Message-Digest Algorithm 5) produces a ${m.bits}-bit (${m.hexLen}-character hex) hash. Designed by Ronald Rivest in 1991, MD5 was widely used for checksums and data integrity. However, MD5 is now considered cryptographically broken -- collision attacks can be performed in seconds. Never use MD5 for security purposes like password hashing or digital signatures. For checksums on trusted data, it remains fast and convenient.`,
    sha1: `SHA-1 (Secure Hash Algorithm 1) produces a ${m.bits}-bit (${m.hexLen}-character hex) hash. Developed by the NSA and published by NIST in 1995, SHA-1 was the standard for TLS certificates, Git commits, and file integrity. In 2017, Google demonstrated the first practical SHA-1 collision (SHAttered). SHA-1 is deprecated for security uses -- modern applications should use SHA-256 or SHA-3.`,
    sha256: `SHA-256 is part of the SHA-2 family, producing a ${m.bits}-bit (${m.hexLen}-character hex) hash. It is widely used in TLS/SSL, Bitcoin mining, code signing, and data integrity verification. SHA-256 has no known practical attacks and remains the recommended general-purpose hash function. Each bit change in the input causes roughly 50% of the output bits to flip (the avalanche effect).`,
    sha512: `SHA-512 is the largest member of the SHA-2 family, producing a ${m.bits}-bit (${m.hexLen}-character hex) hash. It is actually faster than SHA-256 on 64-bit processors because it operates on 64-bit words. SHA-512 is used in high-security applications, SSH key fingerprints, and some cryptocurrency protocols. Like SHA-256, it has no known practical vulnerabilities.`,
  };
  return descs[algo];
}

// ── Step-by-step explanation ─────────────────────────────────────────────────
function algoSteps(algo) {
  const steps = {
    md5: [
      'Pad the message to a multiple of 512 bits (append 1 bit, zeros, then 64-bit length)',
      'Initialize four 32-bit state variables (A, B, C, D) to fixed constants',
      'Process each 512-bit block through 4 rounds of 16 operations (64 total)',
      'Each operation uses a nonlinear function (F, G, H, I), addition, and left rotation',
      'After all blocks, concatenate A, B, C, D to produce the 128-bit digest',
    ],
    sha1: [
      'Pad the message to a multiple of 512 bits (append 1 bit, zeros, then 64-bit length)',
      'Initialize five 32-bit state variables (h0-h4) to fixed constants',
      'Expand each 512-bit block into 80 32-bit words using XOR and left rotation',
      'Process through 80 rounds using nonlinear functions (Ch, Parity, Maj)',
      'After all blocks, concatenate h0-h4 to produce the 160-bit digest',
    ],
    sha256: [
      'Pad the message to a multiple of 512 bits (append 1 bit, zeros, then 64-bit length)',
      'Initialize eight 32-bit state variables (h0-h7) from the fractional parts of the square roots of the first 8 primes',
      'Expand each 512-bit block into 64 32-bit words using sigma functions',
      'Process through 64 rounds using Ch, Maj, and two sigma functions with round constants derived from cube roots of the first 64 primes',
      'After all blocks, concatenate h0-h7 to produce the 256-bit digest',
    ],
    sha512: [
      'Pad the message to a multiple of 1024 bits (append 1 bit, zeros, then 128-bit length)',
      'Initialize eight 64-bit state variables (h0-h7) from the fractional parts of the square roots of the first 8 primes',
      'Expand each 1024-bit block into 80 64-bit words using sigma functions',
      'Process through 80 rounds using Ch, Maj, and two sigma functions with round constants derived from cube roots of the first 80 primes',
      'After all blocks, concatenate h0-h7 to produce the 512-bit digest',
    ],
  };
  return steps[algo];
}

// ── Pick related hash pages ─────────────────────────────────────────────────
function getRelatedHashPages(currentSlug, algo, inputStr, allSlugs) {
  const related = [];
  // Same string, different algo
  for (const a of Object.keys(ALGO_META)) {
    if (a === algo) continue;
    const s = `${a}-hash-of-${slugify(inputStr)}`;
    if (s !== currentSlug) related.push({ slug: s, label: `${ALGO_META[a].name} hash of "${inputStr}"` });
    if (related.length >= 2) break;
  }
  // Same algo, different string
  for (const s of allSlugs) {
    if (s === currentSlug) continue;
    if (s.startsWith(`${algo}-hash-of-`) && !related.some(r => r.slug === s)) {
      const str = s.replace(`${algo}-hash-of-`, '').replace(/-/g, ' ');
      related.push({ slug: s, label: `${ALGO_META[algo].name} hash of "${str}"` });
    }
    if (related.length >= 4) break;
  }
  // Bcrypt recommendation
  related.push({ slug: 'bcrypt-rounds-recommendation', label: 'How many bcrypt rounds should I use?' });
  return related.slice(0, 5);
}

// ── Generate a single hash page ─────────────────────────────────────────────
function generateHashPage(algo, inputStr, allSlugs) {
  const m = ALGO_META[algo];
  const hash = computeHash(algo, inputStr);
  const slug = `${algo}-hash-of-${slugify(inputStr)}`;
  const displayInput = escapeHtml(inputStr);
  const isCommonPwd = COMMON_PASSWORDS.has(inputStr);

  const securityWarning = m.broken
    ? `<p><strong>Security warning:</strong> ${m.name} is cryptographically broken. Do not use it for passwords, digital signatures, or any security-critical purpose. Use bcrypt, Argon2, or scrypt for password hashing, and SHA-256+ for data integrity.</p>`
    : `<p><strong>Security note:</strong> While ${m.name} is secure for data integrity and checksums, never use plain ${m.name} for password hashing. Passwords should be hashed with bcrypt, Argon2, or scrypt, which include salting and key stretching.</p>`;

  const passwordNote = isCommonPwd
    ? `<p><strong>Common password alert:</strong> "${displayInput}" appears in virtually every common password list and breach database. If this hash appears in your system, the associated account is trivially compromised via rainbow table lookup.</p>`
    : '';

  const steps = algoSteps(algo);
  const related = getRelatedHashPages(slug, algo, inputStr, allSlugs);

  const title = `What Is the ${m.name} Hash of "${displayInput}"? | KappaKit`;
  const shortTitle = `${m.name} of "${displayInput}"`;
  const description = `The ${m.name} hash of '${inputStr}' is ${hash}. Learn how ${m.name} works and verify it yourself.`;
  const shortDesc = `${m.name} of '${inputStr}' is ${hash}.`;

  const faqQ1 = `What is the ${m.name} hash of '${escapeJsonLd(inputStr)}'?`;
  const faqA1 = `The ${m.name} hash of '${escapeJsonLd(inputStr)}' is ${hash}. This is a ${m.hexLen}-character hexadecimal string representing ${m.bits} bits.`;
  const faqQ2 = `Is ${m.name} safe to use in ${new Date().getFullYear()}?`;
  const faqA2 = m.broken
    ? `${m.name} is cryptographically broken and should not be used for security purposes. It is still acceptable for non-security checksums and cache keys.`
    : `${m.name} remains cryptographically secure with no known practical attacks. It is safe for data integrity, digital signatures, and checksums. For password hashing, use bcrypt or Argon2 instead.`;
  const faqQ3 = `Can I reverse a ${m.name} hash?`;
  const faqA3 = `No. ${m.name} is a one-way function. However, common inputs like '${escapeJsonLd(inputStr)}' can be found via precomputed rainbow tables. This is why salting and using password-specific hash functions (bcrypt, Argon2) are essential.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="https://kappakit.com/answers/${slug}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${escapeHtml(shortDesc)}">
<meta property="og:url" content="https://kappakit.com/answers/${slug}.html">
<meta property="og:site_name" content="KappaKit">
<meta property="og:image" content="https://kappakit.com/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${escapeHtml(shortDesc)}">
<meta name="twitter:image" content="https://kappakit.com/assets/og-image.png">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "${faqQ1}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${faqA1}"
      }
    },
    {
      "@type": "Question",
      "name": "${faqQ2}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${faqA2}"
      }
    },
    {
      "@type": "Question",
      "name": "${faqQ3}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${faqA3}"
      }
    }
  ]
}
</script>
</head>
<body>
${HEADER}

<main>
  <div class="tool-page-hero">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> <span>/</span> <a href="/answers/">Answers</a> <span>/</span> <span>${shortTitle}</span>
    </nav>
    <h1>What Is the ${m.name} Hash of "${displayInput}"?</h1>
    <p><strong>The ${m.name} hash of "${displayInput}" is <code>${hash}</code>.</strong> This is a ${m.hexLen}-character hexadecimal string representing ${m.bits} bits. Even a single-character change to the input produces a completely different hash due to the avalanche effect.</p>
  </div>

  <section style="max-width:720px;margin:2rem auto;">
    <h2>About ${m.name}</h2>
    <p>${algoDescription(algo)}</p>

    <h2>How ${m.name} Computes This Hash</h2>
    <ol>
${steps.map(s => `      <li>${s}</li>`).join('\n')}
    </ol>

    <h2>Hash Details</h2>
    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
      <tbody>
        <tr style="border-bottom:1px solid var(--border-color,#333);"><td style="padding:0.5rem;"><strong>Input</strong></td><td style="padding:0.5rem;"><code>${displayInput}</code></td></tr>
        <tr style="border-bottom:1px solid var(--border-color,#333);"><td style="padding:0.5rem;"><strong>Algorithm</strong></td><td style="padding:0.5rem;">${m.name}</td></tr>
        <tr style="border-bottom:1px solid var(--border-color,#333);"><td style="padding:0.5rem;"><strong>Hash (hex)</strong></td><td style="padding:0.5rem;word-break:break-all;"><code>${hash}</code></td></tr>
        <tr style="border-bottom:1px solid var(--border-color,#333);"><td style="padding:0.5rem;"><strong>Character count</strong></td><td style="padding:0.5rem;">${m.hexLen} hex characters</td></tr>
        <tr><td style="padding:0.5rem;"><strong>Bit length</strong></td><td style="padding:0.5rem;">${m.bits} bits</td></tr>
      </tbody>
    </table>

    ${securityWarning}
    ${passwordNote}

    <h2>Verify It Yourself</h2>
    <h3>JavaScript (Node.js)</h3>
    <pre><code>require('crypto').createHash('${algo}').update('${inputStr.replace(/'/g, "\\'")}').digest('hex');
// "${hash}"</code></pre>

    <h3>Python</h3>
    <pre><code>import hashlib
hashlib.${algo === 'sha256' ? 'sha256' : algo === 'sha512' ? 'sha512' : algo === 'sha1' ? 'sha1' : 'md5'}(b'${inputStr.replace(/'/g, "\\'")}').hexdigest()
# '${hash}'</code></pre>

    <h3>Bash</h3>
    <pre><code>echo -n '${inputStr.replace(/'/g, "'\\''")}' | ${m.bashCmd}
# ${hash}  -</code></pre>

    <h2>Try It Yourself</h2>
    <p>Use our <a href="${m.toolPage}">${m.name} Hash Generator</a> to hash any string instantly.</p>
  </section>

  <section class="faq-section" style="max-width:720px;margin:2rem auto;">
    <h2>Frequently Asked Questions</h2>
    <details>
      <summary>${faqQ2.replace(/'/g, '&#39;')}</summary>
      <p>${faqA2}</p>
    </details>
    <details>
      <summary>Can I reverse a ${m.name} hash?</summary>
      <p>No. ${m.name} is a one-way function. Common inputs like "${displayInput}" can be found via rainbow tables, which is why you should never use plain ${m.name} for passwords -- use bcrypt or Argon2 instead.</p>
    </details>
    <details>
      <summary>What is the avalanche effect?</summary>
      <p>The avalanche effect means that a tiny change in the input (even one bit) causes roughly 50% of the output bits to change. This makes it impossible to predict the hash of a similar input from a known hash.</p>
    </details>
  </section>

  <section class="related-section" style="max-width:720px;margin:2rem auto;">
    <h2>Related Questions</h2>
    <div class="related-grid">
${related.map(r => `      <a href="/answers/${r.slug}.html" class="related-card">${escapeHtml(r.label)}</a>`).join('\n')}
    </div>
  </section>

  <section class="author-section" style="max-width:720px;margin:2rem auto;">
    <p style="font-size:0.85rem;color:var(--text-muted);">Built by <a href="/about.html">Michael Lip</a>. 100% client-side — no data leaves your browser.</p>
  </section>
</main>

${FOOTER}
</body>
</html>`;

  return { slug, html, hash, algo, inputStr };
}

// ── Regex data ──────────────────────────────────────────────────────────────
const REGEX_PAGES = [
  {
    slug: 'regex-uuid-validation',
    title: 'Regex for UUID (v4) Validation',
    breadcrumb: 'UUID Regex',
    h1: 'What Is a Good Regex for UUID v4 Validation?',
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    patternDisplay: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    breakdown: [
      { part: '^', meaning: 'Start of string' },
      { part: '[0-9a-f]{8}', meaning: 'First group: 8 hex characters' },
      { part: '-', meaning: 'Literal hyphen separator' },
      { part: '[0-9a-f]{4}', meaning: 'Second group: 4 hex characters' },
      { part: '4[0-9a-f]{3}', meaning: 'Third group: starts with 4 (version), then 3 hex chars' },
      { part: '[89ab][0-9a-f]{3}', meaning: 'Fourth group: starts with 8, 9, a, or b (variant), then 3 hex chars' },
      { part: '[0-9a-f]{12}$', meaning: 'Fifth group: 12 hex characters, end of string' },
    ],
    testCases: [
      { input: '550e8400-e29b-41d4-a716-446655440000', matches: true },
      { input: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', matches: true },
      { input: '6ba7b810-9dad-41d4-80b4-00c04fd430c8', matches: true },
      { input: '550e8400-e29b-51d4-a716-446655440000', matches: false, reason: 'Version 5, not 4' },
      { input: 'not-a-uuid', matches: false, reason: 'Wrong format entirely' },
    ],
    pitfalls: [
      'This pattern only matches UUID v4. Other versions (v1, v5, v7) have different version nibbles.',
      'UUIDs can be uppercase -- add the `i` flag or use `[0-9a-fA-F]` to match both cases.',
      'Some systems omit hyphens -- you may need a variant without separators.',
    ],
    description: 'UUID v4 (Universally Unique Identifier version 4) is a randomly generated 128-bit identifier formatted as 32 hex digits in 5 groups separated by hyphens. The version nibble (position 13) is always 4, and the variant nibble (position 17) is 8, 9, a, or b.',
    faq: [
      { q: 'What makes a UUID "version 4"?', a: 'UUID v4 uses random or pseudo-random numbers for all fields except the version (4) and variant (8/9/a/b) nibbles. This gives 122 bits of randomness, making collisions astronomically unlikely.' },
      { q: 'Should I validate UUIDs with regex?', a: 'For format validation, regex works well. For checking if a UUID actually exists in your system, you need a database lookup. Regex only confirms the string follows the UUID format.' },
      { q: 'Are UUIDs case-sensitive?', a: 'RFC 4122 specifies lowercase, but most implementations accept both. Add the case-insensitive flag (i) to your regex for maximum compatibility.' },
    ],
    related: ['regex-email-validation', 'what-is-a-uuid', 'uuid-v4-vs-v7-difference', 'regex-alphanumeric-only'],
  },
  {
    slug: 'regex-ip-address-v4',
    title: 'Regex for IPv4 Address Validation',
    breadcrumb: 'IPv4 Regex',
    h1: 'What Is a Good Regex for IPv4 Address Validation?',
    pattern: '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$',
    patternDisplay: '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$',
    breakdown: [
      { part: '^', meaning: 'Start of string' },
      { part: '(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)', meaning: 'Match a number from 0 to 255' },
      { part: '\\.', meaning: 'Literal dot separator' },
      { part: '{3}', meaning: 'Repeat the octet+dot group 3 times' },
      { part: '(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$', meaning: 'Final octet (0-255), end of string' },
    ],
    testCases: [
      { input: '192.168.1.1', matches: true },
      { input: '10.0.0.255', matches: true },
      { input: '0.0.0.0', matches: true },
      { input: '256.1.1.1', matches: false, reason: '256 exceeds the 0-255 range' },
      { input: '192.168.1', matches: false, reason: 'Only 3 octets instead of 4' },
    ],
    pitfalls: [
      'A simple \\d{1,3} pattern accepts 999.999.999.999 -- always validate the 0-255 range.',
      'This pattern does not distinguish between public and private IP ranges.',
      'Leading zeros (e.g., 192.168.01.001) may or may not be accepted depending on your use case.',
    ],
    description: 'An IPv4 address consists of four octets (0-255) separated by dots. The correct regex must validate that each octet is within the valid range, not just that the format looks right. A naive approach using \\d{1,3} would accept invalid addresses like 999.999.999.999.',
    faq: [
      { q: 'What is the range of valid IPv4 addresses?', a: 'Each octet ranges from 0 to 255, giving addresses from 0.0.0.0 to 255.255.255.255. Special ranges include 127.0.0.0/8 (loopback), 10.0.0.0/8 (private), and 192.168.0.0/16 (private).' },
      { q: 'Should I use regex or a library to validate IPs?', a: 'For simple format checking, regex works. For production use, prefer language-specific libraries (e.g., Python ipaddress module, Node.js net.isIP()) that also handle edge cases like CIDR notation.' },
      { q: 'Does this regex match IPv6 addresses?', a: 'No. IPv6 addresses use a completely different format with hex groups separated by colons. Use a separate pattern for IPv6.' },
    ],
    related: ['regex-ip-address-v6', 'regex-url-validation', 'regex-match-digits-only', 'regex-email-validation'],
  },
  {
    slug: 'regex-ip-address-v6',
    title: 'Regex for IPv6 Address Validation',
    breadcrumb: 'IPv6 Regex',
    h1: 'What Is a Good Regex for IPv6 Address Validation?',
    pattern: '^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$',
    patternDisplay: '^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$',
    breakdown: [
      { part: '^', meaning: 'Start of string' },
      { part: '[0-9a-fA-F]{1,4}', meaning: 'Match 1-4 hex characters (one group)' },
      { part: ':', meaning: 'Literal colon separator' },
      { part: '{7}', meaning: 'Repeat group:colon 7 times' },
      { part: '[0-9a-fA-F]{1,4}$', meaning: 'Final group (1-4 hex chars), end of string' },
    ],
    testCases: [
      { input: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', matches: true },
      { input: 'fe80:0000:0000:0000:0000:0000:0000:0001', matches: true },
      { input: '0000:0000:0000:0000:0000:0000:0000:0001', matches: true },
      { input: '2001:db8::1', matches: false, reason: 'Uses :: shorthand (not matched by this basic pattern)' },
      { input: '192.168.1.1', matches: false, reason: 'IPv4, not IPv6' },
    ],
    pitfalls: [
      'This basic pattern does not handle :: (zero compression) shorthand. A full IPv6 regex is extremely complex.',
      'IPv6 addresses are case-insensitive -- the pattern already handles this with a-fA-F.',
      'Some IPv6 addresses embed IPv4 (e.g., ::ffff:192.168.1.1) which requires additional patterns.',
      'For production, use a library (Python ipaddress, Node.js net.isIPv6) instead of regex.',
    ],
    description: 'An IPv6 address consists of eight groups of four hexadecimal digits separated by colons. The full form is 128 bits written as 8 groups. This basic regex validates the full expanded form; the :: shorthand notation requires a significantly more complex pattern or a dedicated library.',
    faq: [
      { q: 'Why is IPv6 regex so complex?', a: 'IPv6 allows zero compression (::) which can appear once in an address to replace consecutive groups of zeros. Handling all valid combinations of where :: can appear makes the regex extremely long.' },
      { q: 'What does :: mean in IPv6?', a: 'The :: notation replaces one or more consecutive groups of zeros. For example, 2001:db8::1 is shorthand for 2001:0db8:0000:0000:0000:0000:0000:0001.' },
      { q: 'Should I use regex to validate IPv6 in production?', a: 'No. Use a dedicated library. Python has ipaddress.ip_address(), Node.js has net.isIPv6(), and most languages have built-in or standard library support for IP validation.' },
    ],
    related: ['regex-ip-address-v4', 'regex-url-validation', 'regex-hex-color', 'regex-match-digits-only'],
  },
  {
    slug: 'regex-date-yyyy-mm-dd',
    title: 'Regex for Date Validation (YYYY-MM-DD)',
    breadcrumb: 'Date Regex',
    h1: 'What Is a Good Regex for YYYY-MM-DD Date Validation?',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
    patternDisplay: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$',
    breakdown: [
      { part: '^', meaning: 'Start of string' },
      { part: '\\d{4}', meaning: 'Four-digit year (0000-9999)' },
      { part: '-', meaning: 'Literal hyphen separator' },
      { part: '(0[1-9]|1[0-2])', meaning: 'Month: 01-12' },
      { part: '-', meaning: 'Literal hyphen separator' },
      { part: '(0[1-9]|[12]\\d|3[01])$', meaning: 'Day: 01-31, end of string' },
    ],
    testCases: [
      { input: '2026-04-11', matches: true },
      { input: '2000-01-01', matches: true },
      { input: '1999-12-31', matches: true },
      { input: '2026-13-01', matches: false, reason: 'Month 13 does not exist' },
      { input: '2026-04-32', matches: false, reason: 'Day 32 does not exist' },
    ],
    pitfalls: [
      'This regex accepts Feb 30 or Feb 31. True date validation requires calendar logic, not just regex.',
      'It does not validate leap years -- Feb 29 is accepted for all years.',
      'Use regex for format validation, then parse with Date or a library for semantic validation.',
    ],
    description: 'The ISO 8601 date format YYYY-MM-DD is the international standard. This regex validates the format and constrains months to 01-12 and days to 01-31, but cannot catch semantically invalid dates like February 30. Always combine regex format checks with date parsing.',
    faq: [
      { q: 'Can regex validate leap years?', a: 'Technically yes, but the regex becomes extremely long and unmaintainable. It is far better to validate the format with regex and then use a date library to check if the date actually exists.' },
      { q: 'Why use YYYY-MM-DD format?', a: 'ISO 8601 (YYYY-MM-DD) is unambiguous, sorts lexicographically, and is the standard in databases, APIs, and international communication. Unlike MM/DD/YYYY or DD/MM/YYYY, it cannot be misinterpreted.' },
      { q: 'Does this regex handle time zones?', a: 'No. This pattern only validates the date portion. For datetime with timezone (e.g., 2026-04-11T10:30:00Z), you need an extended pattern.' },
    ],
    related: ['regex-match-digits-only', 'regex-alphanumeric-only', 'regex-email-validation', 'regex-slug-validation'],
  },
  {
    slug: 'regex-hex-color',
    title: 'Regex for Hex Color Code Validation',
    breadcrumb: 'Hex Color Regex',
    h1: 'What Is a Good Regex for Hex Color Code Validation?',
    pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
    patternDisplay: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
    breakdown: [
      { part: '^#', meaning: 'Must start with a hash symbol' },
      { part: '[0-9a-fA-F]{3}', meaning: 'Short form: 3 hex characters (e.g., #FFF)' },
      { part: '|', meaning: 'OR' },
      { part: '[0-9a-fA-F]{6}', meaning: 'Long form: 6 hex characters (e.g., #FFFFFF)' },
      { part: '$', meaning: 'End of string' },
    ],
    testCases: [
      { input: '#FF5733', matches: true },
      { input: '#fff', matches: true },
      { input: '#1a2b3c', matches: true },
      { input: '#GGGGGG', matches: false, reason: 'G is not a valid hex character' },
      { input: 'FF5733', matches: false, reason: 'Missing the leading # symbol' },
    ],
    pitfalls: [
      'This does not match 8-digit hex colors with alpha channel (#FF573380). Add |[0-9a-fA-F]{8} if needed.',
      'Some CSS contexts accept colors without # (e.g., in certain properties). Adjust the pattern if # is optional.',
      'Short form #RGB expands to #RRGGBB (e.g., #F00 = #FF0000), not #R0G0B0.',
    ],
    description: 'Hex color codes in CSS and web development use a # followed by 3 or 6 hexadecimal digits. The 3-digit shorthand (#RGB) expands each digit (e.g., #F0A becomes #FF00AA). Modern CSS also supports 4 and 8-digit hex for alpha transparency.',
    faq: [
      { q: 'What is the difference between 3-digit and 6-digit hex colors?', a: 'A 3-digit hex color is a shorthand where each digit is doubled. #F0A is equivalent to #FF00AA. The 6-digit form provides the full 16.7 million color range.' },
      { q: 'Can hex colors have transparency?', a: 'Yes. CSS supports 4-digit (#RGBA) and 8-digit (#RRGGBBAA) hex colors. For example, #FF573380 is #FF5733 at 50% opacity.' },
      { q: 'Should I use hex or RGB in CSS?', a: 'Both are equivalent. Hex is more compact (#FF5733 vs rgb(255, 87, 51)), while RGB is easier to read. Modern CSS also supports hsl() which is more intuitive for color manipulation.' },
    ],
    related: ['color-hex-to-rgb', 'regex-alphanumeric-only', 'regex-match-digits-only', 'regex-slug-validation'],
  },
  {
    slug: 'regex-alphanumeric-only',
    title: 'Regex for Alphanumeric-Only Validation',
    breadcrumb: 'Alphanumeric Regex',
    h1: 'What Is a Good Regex to Match Only Letters and Numbers?',
    pattern: '^[a-zA-Z0-9]+$',
    patternDisplay: '^[a-zA-Z0-9]+$',
    breakdown: [
      { part: '^', meaning: 'Start of string' },
      { part: '[a-zA-Z0-9]', meaning: 'One letter (upper or lower) or digit' },
      { part: '+', meaning: 'One or more characters' },
      { part: '$', meaning: 'End of string' },
    ],
    testCases: [
      { input: 'Hello123', matches: true },
      { input: 'ABC', matches: true },
      { input: '42', matches: true },
      { input: 'hello world', matches: false, reason: 'Contains a space' },
      { input: 'test@123', matches: false, reason: 'Contains @ symbol' },
    ],
    pitfalls: [
      'This only matches ASCII letters. For Unicode letters (accents, CJK, etc.), use \\p{L} with the Unicode flag.',
      'Use * instead of + if you want to allow empty strings.',
      'Consider whether underscores should be included. \\w matches [a-zA-Z0-9_].',
    ],
    description: 'The alphanumeric regex ^[a-zA-Z0-9]+$ matches strings containing only ASCII letters and digits with no spaces, punctuation, or special characters allowed. It is commonly used for username validation, ID formats, API key formats, and input sanitization. For international characters including accented letters, CJK characters, and other scripts, consider Unicode-aware patterns using the \\p{L} property escape.',
    faq: [
      { q: 'How do I include underscores?', a: 'Add underscore to the character class: ^[a-zA-Z0-9_]+$. Alternatively, use \\w which is equivalent to [a-zA-Z0-9_] in most regex engines. This is a common pattern for usernames and identifiers that allow underscores as word separators.' },
      { q: 'How do I match Unicode letters?', a: 'Use the Unicode property escape \\p{L} (supported in JavaScript with the /u flag, Python, and Java). Example: /^[\\p{L}0-9]+$/u matches letters from any language including accented characters, Cyrillic, CJK, Arabic, and more.' },
      { q: 'What is the difference between + and *?', a: '+ requires one or more matches (non-empty string), while * allows zero or more matches (including empty string). For validation, + is usually correct because you want to reject empty inputs.' },
    ],
    related: ['regex-slug-validation', 'regex-strong-password', 'regex-match-digits-only', 'regex-email-validation'],
  },
  {
    slug: 'regex-strong-password',
    title: 'Regex for Strong Password Validation',
    breadcrumb: 'Password Regex',
    h1: 'What Is a Good Regex for Strong Password Validation?',
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    patternDisplay: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    breakdown: [
      { part: '^', meaning: 'Start of string' },
      { part: '(?=.*[a-z])', meaning: 'Lookahead: at least one lowercase letter' },
      { part: '(?=.*[A-Z])', meaning: 'Lookahead: at least one uppercase letter' },
      { part: '(?=.*\\d)', meaning: 'Lookahead: at least one digit' },
      { part: '(?=.*[@$!%*?&])', meaning: 'Lookahead: at least one special character' },
      { part: '[A-Za-z\\d@$!%*?&]{8,}$', meaning: 'At least 8 characters from the allowed set' },
    ],
    testCases: [
      { input: 'MyP@ssw0rd', matches: true },
      { input: 'Str0ng!Pass', matches: true },
      { input: 'C0mpl3x&Pw', matches: true },
      { input: 'weakpassword', matches: false, reason: 'No uppercase, digit, or special character' },
      { input: 'Short1!', matches: false, reason: 'Only 7 characters (minimum is 8)' },
    ],
    pitfalls: [
      'Overly strict password rules can reduce security by making passwords harder to remember, leading to reuse.',
      'NIST SP 800-63B recommends focusing on length (12+ chars) over complexity rules.',
      'Never rely on client-side regex alone -- always validate on the server.',
      'Consider allowing passphrases: "correct horse battery staple" is stronger than "P@ssw0rd!".',
    ],
    description: 'This regex enforces a minimum password strength by requiring at least one lowercase letter, one uppercase letter, one digit, one special character, and a minimum length of 8 characters. While widely used, modern security guidance (NIST SP 800-63B) recommends prioritizing password length over complexity rules.',
    faq: [
      { q: 'Are complex password rules actually more secure?', a: 'Not necessarily. NIST research shows that complexity rules (uppercase, special chars, etc.) often lead users to create predictable patterns like "Password1!" or write passwords down. Length is a stronger factor -- a 16-character passphrase is more secure than an 8-character complex password.' },
      { q: 'What minimum password length should I enforce?', a: 'NIST recommends a minimum of 8 characters, with 12-16 being ideal. The maximum should be at least 64 characters to allow passphrases. Never truncate passwords silently.' },
      { q: 'Should I check passwords against breach databases?', a: 'Yes. Services like Have I Been Pwned offer an API to check if a password has appeared in known data breaches. This is more effective than complexity rules.' },
    ],
    related: ['generate-random-password', 'bcrypt-rounds-recommendation', 'regex-alphanumeric-only', 'regex-email-validation'],
  },
  {
    slug: 'regex-credit-card-number',
    title: 'Regex for Credit Card Number Validation',
    breadcrumb: 'Credit Card Regex',
    h1: 'What Is a Good Regex for Credit Card Number Validation?',
    pattern: '^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$',
    patternDisplay: '^(?:4\\d{12}(?:\\d{3})?|5[1-5]\\d{14}|3[47]\\d{13}|6(?:011|5\\d{2})\\d{12})$',
    breakdown: [
      { part: '4[0-9]{12}(?:[0-9]{3})?', meaning: 'Visa: starts with 4, 13 or 16 digits' },
      { part: '5[1-5][0-9]{14}', meaning: 'Mastercard: starts with 51-55, 16 digits' },
      { part: '3[47][0-9]{13}', meaning: 'Amex: starts with 34 or 37, 15 digits' },
      { part: '6(?:011|5[0-9]{2})[0-9]{12}', meaning: 'Discover: starts with 6011 or 65, 16 digits' },
    ],
    testCases: [
      { input: '4111111111111111', matches: true },
      { input: '5500000000000004', matches: true },
      { input: '371449635398431', matches: true },
      { input: '1234567890123456', matches: false, reason: 'Does not start with a valid card prefix' },
      { input: '411111111111', matches: false, reason: 'Only 12 digits (Visa requires 13 or 16)' },
    ],
    pitfalls: [
      'Regex only validates the format. Always use the Luhn algorithm to verify the check digit.',
      'Never store or log credit card numbers in plain text -- this violates PCI DSS.',
      'Modern Mastercard numbers also start with 2221-2720, which this basic pattern does not cover.',
      'Always strip spaces and hyphens before validation (users often enter "4111 1111 1111 1111").',
    ],
    description: 'Credit card numbers follow specific formats based on the card network. Visa starts with 4, Mastercard with 51-55, Amex with 34/37, and Discover with 6011/65. This regex validates the basic format but does not perform the Luhn checksum. Always combine format validation with the Luhn algorithm.',
    faq: [
      { q: 'What is the Luhn algorithm?', a: 'The Luhn algorithm (mod 10) is a checksum formula used to validate credit card numbers. It catches most single-digit errors and transposition errors. Every valid credit card number passes the Luhn check.' },
      { q: 'Is it safe to validate credit cards with client-side regex?', a: 'For format hints (showing a Visa/Mastercard icon), yes. For actual payment processing, always validate server-side and use a PCI-compliant payment processor like Stripe. Never handle raw card numbers yourself.' },
      { q: 'Why do test card numbers like 4111111111111111 work?', a: 'Payment processors provide specific test numbers that pass the Luhn check but are reserved for testing. They are never charged. 4111111111111111 is the standard Visa test number.' },
    ],
    related: ['regex-match-digits-only', 'regex-strong-password', 'regex-alphanumeric-only', 'regex-email-validation'],
  },
  {
    slug: 'regex-us-zip-code',
    title: 'Regex for US ZIP Code Validation',
    breadcrumb: 'ZIP Code Regex',
    h1: 'What Is a Good Regex for US ZIP Code Validation?',
    pattern: '^\\d{5}(-\\d{4})?$',
    patternDisplay: '^\\d{5}(-\\d{4})?$',
    breakdown: [
      { part: '^', meaning: 'Start of string' },
      { part: '\\d{5}', meaning: 'Five digits (basic ZIP code)' },
      { part: '(-\\d{4})?', meaning: 'Optional: hyphen followed by 4 digits (ZIP+4)' },
      { part: '$', meaning: 'End of string' },
    ],
    testCases: [
      { input: '90210', matches: true },
      { input: '10001', matches: true },
      { input: '94105-1234', matches: true },
      { input: '1234', matches: false, reason: 'Only 4 digits (need exactly 5)' },
      { input: '123456', matches: false, reason: '6 digits without the +4 format' },
    ],
    pitfalls: [
      'This validates the format but not whether the ZIP code actually exists. ZIP 00000 passes but is invalid.',
      'Some ZIP codes start with 0 (e.g., 01001 in Massachusetts) -- never store them as numbers.',
      'US territories (PR, GU, VI) have valid ZIP codes that follow the same format.',
    ],
    description: 'US ZIP codes are either 5 digits (ZIP) or 9 digits in ZIP+4 format (12345-6789). The first digit indicates the region (0 = Northeast, 9 = West Coast). While this regex validates the format, only the USPS database can confirm a ZIP code actually exists.',
    faq: [
      { q: 'What is ZIP+4?', a: 'ZIP+4 adds a hyphen and 4 more digits to the basic ZIP code, identifying a specific delivery segment (block, building, or PO box). It is optional for addressing but improves mail sorting.' },
      { q: 'Do ZIP codes ever start with zero?', a: 'Yes. ZIP codes in the northeastern US (CT, MA, ME, NH, NJ, NY, PR, RI, VT, VI) start with 0. Always store ZIP codes as strings, never as integers.' },
      { q: 'Is this regex valid for international postal codes?', a: 'No. Other countries use completely different formats. UK postcodes have letters, Canadian codes alternate letters and digits, and many countries have 4 or 6-digit codes.' },
    ],
    related: ['regex-match-digits-only', 'regex-us-zip-code', 'regex-alphanumeric-only', 'regex-phone-number-us'],
  },
  {
    slug: 'regex-slug-validation',
    title: 'Regex for URL Slug Validation',
    breadcrumb: 'Slug Regex',
    h1: 'What Is a Good Regex for URL Slug Validation?',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    patternDisplay: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    breakdown: [
      { part: '^', meaning: 'Start of string' },
      { part: '[a-z0-9]+', meaning: 'One or more lowercase letters or digits' },
      { part: '(?:-[a-z0-9]+)*', meaning: 'Optionally: hyphen followed by one or more lowercase letters/digits, repeated' },
      { part: '$', meaning: 'End of string' },
    ],
    testCases: [
      { input: 'hello-world', matches: true },
      { input: 'my-blog-post-2026', matches: true },
      { input: 'singleword', matches: true },
      { input: 'Hello-World', matches: false, reason: 'Contains uppercase letters' },
      { input: '-leading-hyphen', matches: false, reason: 'Starts with a hyphen' },
    ],
    pitfalls: [
      'This pattern disallows consecutive hyphens (my--slug). Decide if that is desired behavior.',
      'Trailing hyphens (slug-) are also rejected, which is usually correct.',
      'Maximum length is not enforced by regex -- add a separate length check (typically 60-80 chars).',
    ],
    description: 'A URL slug is the human-readable portion of a URL path, typically created from a page title. Good slugs use only lowercase letters, digits, and hyphens. They should not start or end with a hyphen, and should not contain consecutive hyphens.',
    faq: [
      { q: 'How do I generate a slug from a title?', a: 'Convert to lowercase, replace spaces with hyphens, remove special characters, collapse consecutive hyphens, and trim leading/trailing hyphens. Most web frameworks have a built-in slugify function.' },
      { q: 'Should slugs include stop words?', a: 'It depends. Removing stop words (the, a, is, of) makes slugs shorter but can reduce readability. "best-practices-for-seo" vs "best-practices-seo" -- both are acceptable.' },
      { q: 'What is the ideal slug length?', a: 'Keep slugs under 60 characters. Shorter slugs are easier to read, share, and remember. Google does not penalize long URLs but truncates them in search results.' },
    ],
    related: ['regex-url-validation', 'regex-alphanumeric-only', 'regex-email-validation', 'url-encode-space'],
  },
];

// ── Encoding data ───────────────────────────────────────────────────────────
const ENCODING_PAGES = [
  {
    slug: 'url-encode-question-mark',
    title: 'URL Encode Question Mark (?) to %3F',
    breadcrumb: 'URL Encode ?',
    h1: 'How Do You URL Encode a Question Mark (?)?',
    char: '?',
    encoded: '%3F',
    encodingType: 'URL',
    description: 'The question mark (?) is URL encoded as <code>%3F</code>. In URLs, the question mark has a special meaning -- it separates the path from the query string. When you need a literal question mark inside a query parameter value, you must encode it as %3F to prevent the URL parser from treating it as a query separator.',
    whyEncode: 'The ? character delimits the query string in a URL (e.g., /search?q=hello). If your data contains a literal question mark (e.g., a quiz question "What is 2+2?"), encoding it prevents the URL parser from misinterpreting it as a second query separator.',
    codeJs: `encodeURIComponent('What is 2+2?');
// "What%20is%202%2B2%3F"`,
    codePy: `from urllib.parse import quote
quote('What is 2+2?')
# 'What%20is%202%2B2%3F'`,
    faq: [
      { q: 'When should I NOT encode a question mark in a URL?', a: 'Do not encode the question mark that separates the URL path from the query string. Only encode question marks that appear inside parameter values. For example, in /search?q=What%3F, the first ? is structural and the second is encoded data.' },
      { q: 'What is the difference between encodeURI and encodeURIComponent?', a: 'encodeURI preserves URL structure characters (?, &, =, /, #) while encodeURIComponent encodes everything except unreserved characters. Use encodeURIComponent for parameter values and encodeURI for complete URLs.' },
      { q: 'Is %3F case-sensitive?', a: 'No. Both %3F and %3f are valid. However, RFC 3986 recommends uppercase hex digits for consistency.' },
    ],
    related: ['url-encode-space', 'url-encode-ampersand', 'url-encode-hash', 'url-encode-at-sign'],
  },
  {
    slug: 'url-encode-hash',
    title: 'URL Encode Hash (#) to %23',
    breadcrumb: 'URL Encode #',
    h1: 'How Do You URL Encode a Hash Symbol (#)?',
    char: '#',
    encoded: '%23',
    encodingType: 'URL',
    description: 'The hash symbol (#) is URL encoded as <code>%23</code>. In URLs, the hash (also called the fragment identifier) separates the main URL from the fragment. When you need a literal # inside a query parameter or path, you must encode it as %23.',
    whyEncode: 'The # character introduces the fragment identifier in a URL (e.g., /page#section). If your data contains a literal hash (e.g., a color code "#FF5733" or a channel name "#general"), encoding it prevents the browser from treating everything after it as a fragment reference.',
    codeJs: `encodeURIComponent('#FF5733');
// "%23FF5733"`,
    codePy: `from urllib.parse import quote
quote('#FF5733')
# '%23FF5733'`,
    faq: [
      { q: 'What is a URL fragment?', a: 'The fragment (everything after #) identifies a section within a page. For example, /docs#install scrolls to the "install" section. Fragments are NOT sent to the server -- they are handled entirely by the browser.' },
      { q: 'Does the server see the # part of a URL?', a: 'No. The fragment identifier is never sent in HTTP requests. If you need to send a # to the server, it must be encoded as %23 in the query string.' },
      { q: 'How do I include a hashtag in a URL parameter?', a: 'Encode it as %23. For example: /search?q=%23javascript sends the value "#javascript" to the server. Without encoding, /search?q=#javascript would send q= (empty) and treat "javascript" as a fragment.' },
    ],
    related: ['url-encode-space', 'url-encode-ampersand', 'url-encode-question-mark', 'url-encode-at-sign'],
  },
  {
    slug: 'url-encode-at-sign',
    title: 'URL Encode At Sign (@) to %40',
    breadcrumb: 'URL Encode @',
    h1: 'How Do You URL Encode an At Sign (@)?',
    char: '@',
    encoded: '%40',
    encodingType: 'URL',
    description: 'The at sign (@) is URL encoded as <code>%40</code>. In URLs, the @ symbol has a special role in the authority component (user@host). When you need a literal @ in a query parameter or path segment, encode it as %40 to avoid ambiguity.',
    whyEncode: 'The @ character separates user information from the host in a URL authority component (e.g., user:pass@example.com). If your data contains an email address or social media handle with @, encoding it as %40 prevents the URL parser from misinterpreting the host. This is especially important in REST APIs where email addresses are passed as path parameters or query values, and in OAuth redirect URLs that embed user identifiers.',
    codeJs: `encodeURIComponent('user@example.com');
// "user%40example.com"`,
    codePy: `from urllib.parse import quote
quote('user@example.com')
# 'user%40example.com'`,
    faq: [
      { q: 'Is @ always unsafe in URLs?', a: 'The @ is only special in the authority component (between // and the first /). In path segments and query strings, it is technically allowed unencoded by RFC 3986, but encoding it is safer for maximum compatibility across browsers, servers, and HTTP client libraries.' },
      { q: 'How do I pass an email address in a URL?', a: 'Encode the entire email as a query parameter value: /invite?email=user%40example.com. Most URL-building functions in JavaScript (encodeURIComponent), Python (urllib.parse.quote), and other languages handle this encoding automatically.' },
      { q: 'Do APIs require @ to be encoded?', a: 'Most APIs accept @ unencoded in query strings, but encoding it as %40 is the safest approach for cross-platform compatibility. Always use your language\'s URL encoding function rather than doing string replacement manually, as it handles all special characters consistently.' },
    ],
    related: ['url-encode-space', 'url-encode-ampersand', 'url-encode-question-mark', 'url-encode-hash'],
  },
  {
    slug: 'html-encode-greater-than',
    title: 'HTML Encode Greater Than (>) to &amp;gt;',
    breadcrumb: 'HTML Encode >',
    h1: 'How Do You HTML Encode the Greater Than Sign (>)?',
    char: '>',
    encoded: '&gt;',
    encodingType: 'HTML',
    description: 'The greater-than sign (>) is HTML encoded as <code>&amp;gt;</code>. While browsers can often render an unescaped > correctly (unlike <), encoding it is required inside attribute values and is best practice everywhere to prevent XSS vulnerabilities and ensure valid HTML.',
    whyEncode: 'The > character closes HTML tags. While a bare > in text content is usually rendered correctly by browsers, encoding it as &amp;gt; ensures valid markup, passes HTML validation, and prevents potential injection vulnerabilities when combined with other characters in user-generated content. Always encode both < and > together for consistency. In XHTML (which follows stricter XML rules), unescaped > in text content can cause parsing errors.',
    codeJs: `// Using built-in text content (auto-escapes)
element.textContent = '5 > 3';

// Manual encoding
'5 > 3'.replace(/>/g, '&gt;');
// "5 &gt; 3"`,
    codePy: `import html
html.escape('5 > 3')
# '5 &gt; 3'`,
    faq: [
      { q: 'Is it really necessary to encode >?', a: 'Technically, the HTML5 spec allows unescaped > in text content nodes. However, best practice is to always encode it. Attribute values, XHTML documents, and XML contexts require proper encoding, and consistent escaping prevents XSS vulnerabilities and HTML validation errors.' },
      { q: 'What is the numeric code for >?', a: 'The greater-than sign can also be encoded as &amp;#62; (decimal) or &amp;#x3E; (hexadecimal). The named entity &amp;gt; is more readable and widely preferred. All three forms are semantically identical and supported by every browser.' },
      { q: 'How do I display HTML code in a web page?', a: 'Encode both < as &amp;lt; and > as &amp;gt;. For example, to show a div element, write &amp;lt;div&amp;gt; in your HTML source. Alternatively, use the pre and code elements with proper encoding for displaying code blocks with syntax highlighting.' },
    ],
    related: ['html-encode-less-than', 'html-encode-ampersand', 'url-encode-space', 'url-encode-ampersand'],
  },
  {
    slug: 'html-encode-ampersand',
    title: 'HTML Encode Ampersand (&) to &amp;amp;',
    breadcrumb: 'HTML Encode &',
    h1: 'How Do You HTML Encode an Ampersand (&)?',
    char: '&',
    encoded: '&amp;',
    encodingType: 'HTML',
    description: 'The ampersand (&) is HTML encoded as <code>&amp;amp;</code>. The ampersand is the most important character to encode because it introduces all HTML entities. An unescaped & can cause parsing errors, broken entities, and XSS vulnerabilities.',
    whyEncode: 'The & character starts HTML entities (like &amp;, &lt;, &copy;). If you write "Tom & Jerry" in HTML without encoding, the browser tries to parse "& Jerry" as an entity reference. Encoding it as &amp;amp; ensures the literal ampersand is displayed correctly.',
    codeJs: `// Using built-in text content (auto-escapes)
element.textContent = 'Tom & Jerry';

// Manual encoding
'Tom & Jerry'.replace(/&/g, '&amp;');
// "Tom &amp; Jerry"`,
    codePy: `import html
html.escape('Tom & Jerry')
# 'Tom &amp; Jerry'`,
    faq: [
      { q: 'Why is & the most important character to encode?', a: 'Because & is the escape character itself. Every HTML entity starts with &. If & is not encoded, the parser may interpret the following text as an entity, leading to garbled output or security vulnerabilities.' },
      { q: 'Do I need to encode & in URLs inside HTML?', a: 'Yes. URL query separators (e.g., ?a=1&b=2) must be encoded as ?a=1&amp;b=2 when placed in HTML attributes like href. This is one of the most common HTML validation errors.' },
      { q: 'What happens if I do not encode &?', a: 'If followed by text that resembles an entity name (e.g., &copy), the browser may render a copyright symbol instead of "&copy". If followed by unknown text, modern browsers display it as-is but the HTML is technically invalid.' },
    ],
    related: ['html-encode-less-than', 'html-encode-greater-than', 'url-encode-ampersand', 'url-encode-space'],
  },
];

// ── Generate regex page HTML ────────────────────────────────────────────────
function generateRegexPage(data) {
  const patternHtml = escapeHtml(data.patternDisplay);

  const title = `${data.title} | KappaKit`;
  const descText = `${data.title}: ${data.patternDisplay}. Learn how it works, see test cases, and copy the pattern.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${escapeHtml(descText)}">
<link rel="canonical" href="https://kappakit.com/answers/${data.slug}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${escapeHtml(descText)}">
<meta property="og:url" content="https://kappakit.com/answers/${data.slug}.html">
<meta property="og:site_name" content="KappaKit">
<meta property="og:image" content="https://kappakit.com/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${escapeHtml(descText)}">
<meta name="twitter:image" content="https://kappakit.com/assets/og-image.png">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
${data.faq.map((f, i) => `    {
      "@type": "Question",
      "name": "${escapeJsonLd(f.q)}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${escapeJsonLd(f.a)}"
      }
    }${i < data.faq.length - 1 ? ',' : ''}`).join('\n')}
  ]
}
</script>
</head>
<body>
${HEADER}

<main>
  <div class="tool-page-hero">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> <span>/</span> <a href="/answers/">Answers</a> <span>/</span> <span>${data.breadcrumb}</span>
    </nav>
    <h1>${data.h1}</h1>
    <p><strong>Pattern: <code>${patternHtml}</code></strong>. ${data.description}</p>
  </div>

  <section style="max-width:720px;margin:2rem auto;">
    <h2>Breaking Down the Pattern</h2>
    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
      <thead><tr style="border-bottom:2px solid var(--border-color,#333);text-align:left;">
        <th style="padding:0.5rem;">Part</th><th style="padding:0.5rem;">Meaning</th>
      </tr></thead>
      <tbody>
${data.breakdown.map(b => `        <tr style="border-bottom:1px solid var(--border-color,#333);"><td style="padding:0.5rem;"><code>${escapeHtml(b.part)}</code></td><td style="padding:0.5rem;">${b.meaning}</td></tr>`).join('\n')}
      </tbody>
    </table>

    <h2>Test Cases</h2>
    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
      <thead><tr style="border-bottom:2px solid var(--border-color,#333);text-align:left;">
        <th style="padding:0.5rem;">Input</th><th style="padding:0.5rem;">Match?</th><th style="padding:0.5rem;">Note</th>
      </tr></thead>
      <tbody>
${data.testCases.map(tc => `        <tr style="border-bottom:1px solid var(--border-color,#333);"><td style="padding:0.5rem;"><code>${escapeHtml(tc.input)}</code></td><td style="padding:0.5rem;">${tc.matches ? 'Yes' : 'No'}</td><td style="padding:0.5rem;">${tc.reason || (tc.matches ? 'Valid format' : '')}</td></tr>`).join('\n')}
      </tbody>
    </table>

    <h2>Usage Examples</h2>
    <h3>JavaScript</h3>
    <pre><code>const pattern = /${data.pattern.replace(/\\/g, '\\')}/${data.pattern.includes('[a-fA-F]') || data.pattern.includes('[a-zA-Z') ? '' : ''};
pattern.test('${escapeHtml(data.testCases[0].input)}');   // true
pattern.test('${escapeHtml(data.testCases[3].input)}');   // false</code></pre>

    <h3>Python</h3>
    <pre><code>import re
pattern = r'${data.pattern}'
bool(re.match(pattern, '${data.testCases[0].input}'))  # True
bool(re.match(pattern, '${data.testCases[3].input}'))  # False</code></pre>

    <h2>Common Pitfalls</h2>
    <ul>
${data.pitfalls.map(p => `      <li>${p}</li>`).join('\n')}
    </ul>

    <h2>Try It Yourself</h2>
    <p>Test this regex with our <a href="/tools/regex-tester.html">Regex Tester</a>.</p>
  </section>

  <section class="faq-section" style="max-width:720px;margin:2rem auto;">
    <h2>Frequently Asked Questions</h2>
${data.faq.map(f => `    <details>
      <summary>${f.q}</summary>
      <p>${f.a}</p>
    </details>`).join('\n')}
  </section>

  <section class="related-section" style="max-width:720px;margin:2rem auto;">
    <h2>Related Questions</h2>
    <div class="related-grid">
${data.related.map(r => `      <a href="/answers/${r}.html" class="related-card">${r.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</a>`).join('\n')}
    </div>
  </section>

  <section class="author-section" style="max-width:720px;margin:2rem auto;">
    <p style="font-size:0.85rem;color:var(--text-muted);">Built by <a href="/about.html">Michael Lip</a>. 100% client-side — no data leaves your browser.</p>
  </section>
</main>

${FOOTER}
</body>
</html>`;

  return { slug: data.slug, html };
}

// ── Generate encoding page HTML ─────────────────────────────────────────────
function generateEncodingPage(data) {
  const title = `${data.title} | KappaKit`;
  const descText = `${data.encodingType} encode ${data.char} as ${data.encoded}. Learn when and why to encode this character.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${escapeHtml(descText)}">
<link rel="canonical" href="https://kappakit.com/answers/${data.slug}.html">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${escapeHtml(descText)}">
<meta property="og:url" content="https://kappakit.com/answers/${data.slug}.html">
<meta property="og:site_name" content="KappaKit">
<meta property="og:image" content="https://kappakit.com/assets/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${escapeHtml(descText)}">
<meta name="twitter:image" content="https://kappakit.com/assets/og-image.png">
<link rel="stylesheet" href="/assets/style.css">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
${data.faq.map((f, i) => `    {
      "@type": "Question",
      "name": "${escapeJsonLd(f.q)}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${escapeJsonLd(f.a)}"
      }
    }${i < data.faq.length - 1 ? ',' : ''}`).join('\n')}
  ]
}
</script>
</head>
<body>
${HEADER}

<main>
  <div class="tool-page-hero">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Home</a> <span>/</span> <a href="/answers/">Answers</a> <span>/</span> <span>${data.breadcrumb}</span>
    </nav>
    <h1>${data.h1}</h1>
    <p><strong>The ${data.encodingType.toLowerCase()} encoding of "${escapeHtml(data.char)}" is <code>${escapeHtml(data.encoded)}</code>.</strong> ${data.description}</p>
  </div>

  <section style="max-width:720px;margin:2rem auto;">
    <h2>Why Encode "${escapeHtml(data.char)}"?</h2>
    <p>${data.whyEncode}</p>

    <h2>Encoding Details</h2>
    <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
      <tbody>
        <tr style="border-bottom:1px solid var(--border-color,#333);"><td style="padding:0.5rem;"><strong>Character</strong></td><td style="padding:0.5rem;"><code>${escapeHtml(data.char)}</code></td></tr>
        <tr style="border-bottom:1px solid var(--border-color,#333);"><td style="padding:0.5rem;"><strong>Encoded form</strong></td><td style="padding:0.5rem;"><code>${escapeHtml(data.encoded)}</code></td></tr>
        <tr style="border-bottom:1px solid var(--border-color,#333);"><td style="padding:0.5rem;"><strong>Encoding type</strong></td><td style="padding:0.5rem;">${data.encodingType} encoding</td></tr>
        <tr><td style="padding:0.5rem;"><strong>Unicode code point</strong></td><td style="padding:0.5rem;">U+${data.char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}</td></tr>
      </tbody>
    </table>

    <h2>Code Examples</h2>
    <h3>JavaScript</h3>
    <pre><code>${data.codeJs}</code></pre>

    <h3>Python</h3>
    <pre><code>${data.codePy}</code></pre>

    <h2>Try It Yourself</h2>
    <p>Use our <a href="/tools/${data.encodingType === 'URL' ? 'url-encode' : 'html-encode'}.html">${data.encodingType} Encoder</a> to encode any character instantly.</p>
  </section>

  <section class="faq-section" style="max-width:720px;margin:2rem auto;">
    <h2>Frequently Asked Questions</h2>
${data.faq.map(f => `    <details>
      <summary>${f.q}</summary>
      <p>${f.a}</p>
    </details>`).join('\n')}
  </section>

  <section class="related-section" style="max-width:720px;margin:2rem auto;">
    <h2>Related Questions</h2>
    <div class="related-grid">
${data.related.map(r => `      <a href="/answers/${r}.html" class="related-card">${r.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</a>`).join('\n')}
    </div>
  </section>

  <section class="author-section" style="max-width:720px;margin:2rem auto;">
    <p style="font-size:0.85rem;color:var(--text-muted);">Built by <a href="/about.html">Michael Lip</a>. 100% client-side — no data leaves your browser.</p>
  </section>
</main>

${FOOTER}
</body>
</html>`;

  return { slug: data.slug, html };
}

// ── Main generation logic ───────────────────────────────────────────────────
function main() {
  const generated = [];
  const skippedExisting = [];

  // ── Pattern A: Hash pages ──
  const hashStrings = [
    'test', 'admin', 'root', 'example', 'foo', 'bar', 'foobar',
    '123456', 'qwerty', 'letmein', 'abc', 'abc123', 'welcome', 'monkey',
    'The quick brown fox jumps over the lazy dog',
  ];
  const hashAlgos = ['md5', 'sha1', 'sha256', 'sha512'];

  // Build all potential hash slugs first for cross-referencing
  const allHashSlugs = [];
  for (const algo of hashAlgos) {
    for (const str of hashStrings) {
      allHashSlugs.push(`${algo}-hash-of-${slugify(str)}`);
    }
  }

  let hashCount = 0;
  const HASH_CAP = 35;

  for (const algo of hashAlgos) {
    for (const str of hashStrings) {
      if (hashCount >= HASH_CAP) break;
      const slug = `${algo}-hash-of-${slugify(str)}`;
      if (existingFiles.has(slug)) {
        skippedExisting.push(slug);
        continue;
      }
      const result = generateHashPage(algo, str, allHashSlugs);
      const filePath = path.join(ANSWERS_DIR, `${slug}.html`);
      fs.writeFileSync(filePath, result.html, 'utf8');
      generated.push({ slug, type: 'hash', hash: result.hash, algo, input: str });
      hashCount++;
    }
    if (hashCount >= HASH_CAP) break;
  }

  // ── Pattern B: Regex pages ──
  for (const data of REGEX_PAGES) {
    if (existingFiles.has(data.slug)) {
      skippedExisting.push(data.slug);
      continue;
    }
    const result = generateRegexPage(data);
    const filePath = path.join(ANSWERS_DIR, `${result.slug}.html`);
    fs.writeFileSync(filePath, result.html, 'utf8');
    generated.push({ slug: result.slug, type: 'regex' });
  }

  // ── Pattern C: Encoding pages ──
  for (const data of ENCODING_PAGES) {
    if (existingFiles.has(data.slug)) {
      skippedExisting.push(data.slug);
      continue;
    }
    const result = generateEncodingPage(data);
    const filePath = path.join(ANSWERS_DIR, `${result.slug}.html`);
    fs.writeFileSync(filePath, result.html, 'utf8');
    generated.push({ slug: result.slug, type: 'encoding' });
  }

  // ── Update sitemap ──
  let sitemap = fs.readFileSync(SITEMAP_PATH, 'utf8');
  const newEntries = generated.map(g => `  <url>
    <loc>https://kappakit.com/answers/${g.slug}.html</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n');

  sitemap = sitemap.replace('</urlset>', newEntries + '\n</urlset>');
  fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf8');

  // ── Summary ──
  console.log(`\n=== KappaKit Answer Generator ===`);
  console.log(`Generated: ${generated.length} pages`);
  console.log(`  - Hash pages: ${generated.filter(g => g.type === 'hash').length}`);
  console.log(`  - Regex pages: ${generated.filter(g => g.type === 'regex').length}`);
  console.log(`  - Encoding pages: ${generated.filter(g => g.type === 'encoding').length}`);
  console.log(`Skipped (already exist): ${skippedExisting.length}`);
  if (skippedExisting.length > 0) {
    console.log(`  Skipped: ${skippedExisting.join(', ')}`);
  }
  console.log(`Sitemap updated: ${SITEMAP_PATH}`);

  // Print hash verification table
  const hashPages = generated.filter(g => g.type === 'hash');
  if (hashPages.length > 0) {
    console.log(`\n=== Hash Verification ===`);
    for (const h of hashPages) {
      const verify = computeHash(h.algo, h.input);
      const ok = verify === h.hash;
      console.log(`${ok ? 'OK' : 'FAIL'} | ${h.algo}("${h.input}") = ${h.hash}`);
    }
  }

  return generated;
}

main();
