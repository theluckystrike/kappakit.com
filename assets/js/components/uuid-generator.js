/* KappaKit — UUID/ULID Generator Component */
/* Supports: v4, v7, ulid */

window.KappaKit_uuid_generator = function(mount, config) {
  var type = config.type || 'v4';

  var titles = {
    'v4': 'UUID v4 Generator (Random)',
    'v7': 'UUID v7 Generator (Timestamp)',
    'ulid': 'ULID Generator (Sortable)'
  };

  var html = '<h3>' + (titles[type] || 'UUID Generator') + '</h3>';
  html += '<div class="row" style="align-items:flex-end;">';
  html += '<div style="flex:0 0 auto;">';
  html += '<label for="uuid-count">Count</label>';
  html += '<select id="uuid-count" style="width:100px;">';
  html += '<option value="1">1</option>';
  html += '<option value="5">5</option>';
  html += '<option value="10">10</option>';
  html += '<option value="50">50</option>';
  html += '</select>';
  html += '</div>';

  if (type === 'v4') {
    // v4 only mode — simple
  } else if (type === 'v7') {
    // v7 mode — nothing extra needed
  } else if (type === 'ulid') {
    // ULID mode
  }

  html += '<div style="flex:0 0 auto;display:flex;gap:0.5rem;">';
  html += '<button class="btn" id="uuid-gen">Generate</button>';
  html += '<button class="btn btn-outline" id="uuid-copy-all">Copy All</button>';
  html += '</div>';
  html += '</div>';

  html += '<div id="uuid-results" style="margin-top:1rem;"></div>';

  mount.innerHTML = html;

  var genBtn = document.getElementById('uuid-gen');
  var copyAllBtn = document.getElementById('uuid-copy-all');
  var countSel = document.getElementById('uuid-count');

  genBtn.addEventListener('click', function() { generate(); });
  copyAllBtn.addEventListener('click', function() {
    var items = document.querySelectorAll('.uuid-value');
    var text = Array.from(items).map(function(el) { return el.textContent; }).join('\n');
    navigator.clipboard.writeText(text).then(function() {
      copyAllBtn.textContent = 'Copied!';
      setTimeout(function() { copyAllBtn.textContent = 'Copy All'; }, 1200);
    });
  });

  // Generate on load
  generate();

  function generate() {
    var count = parseInt(countSel.value, 10) || 1;
    var results = document.getElementById('uuid-results');
    var items = [];

    for (var i = 0; i < count; i++) {
      var id, meta;
      if (type === 'v4') {
        id = uuidV4();
        meta = 'Version 4 (random) | Variant 1';
      } else if (type === 'v7') {
        id = uuidV7();
        var ts = extractV7Timestamp(id);
        meta = 'Version 7 (timestamp) | Created: ' + new Date(ts).toISOString();
      } else if (type === 'ulid') {
        id = generateULID();
        var ulidTs = decodeULIDTimestamp(id);
        meta = 'ULID | Created: ' + new Date(ulidTs).toISOString();
      }
      items.push({ id: id, meta: meta });
    }

    var html = items.map(function(item, idx) {
      return '<div class="uuid-item" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;padding:0.5rem;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);">' +
        '<span class="uuid-value" style="font-family:var(--font-display);font-size:0.85rem;flex:1;word-break:break-all;">' + escH(item.id) + '</span>' +
        '<button class="btn btn-outline btn-sm uuid-copy-one" data-idx="' + idx + '">Copy</button>' +
        '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.75rem;margin-left:0.5rem;">' + escH(item.meta) + '</div>';
    }).join('');

    results.innerHTML = html;

    // Individual copy buttons
    results.querySelectorAll('.uuid-copy-one').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var item = btn.closest('.uuid-item');
        var val = item.querySelector('.uuid-value').textContent;
        navigator.clipboard.writeText(val).then(function() {
          btn.textContent = 'Copied!';
          setTimeout(function() { btn.textContent = 'Copy'; }, 1200);
        });
      });
    });
  }

  function uuidV4() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
    return formatUUID(bytes);
  }

  function uuidV7() {
    var bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Embed timestamp in first 48 bits (6 bytes)
    var now = Date.now();
    bytes[0] = (now / 0x10000000000) & 0xff;
    bytes[1] = (now / 0x100000000) & 0xff;
    bytes[2] = (now / 0x1000000) & 0xff;
    bytes[3] = (now / 0x10000) & 0xff;
    bytes[4] = (now / 0x100) & 0xff;
    bytes[5] = now & 0xff;

    bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1

    return formatUUID(bytes);
  }

  function extractV7Timestamp(uuid) {
    var hex = uuid.replace(/-/g, '');
    var tsHex = hex.substring(0, 12);
    return parseInt(tsHex, 16);
  }

  function formatUUID(bytes) {
    var hex = Array.from(bytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    return hex.slice(0,8) + '-' + hex.slice(8,12) + '-' + hex.slice(12,16) + '-' + hex.slice(16,20) + '-' + hex.slice(20);
  }

  // ULID implementation (Crockford Base32)
  var CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  function generateULID() {
    var now = Date.now();
    var result = '';

    // Timestamp part (10 chars = 48 bits)
    var ts = now;
    for (var i = 9; i >= 0; i--) {
      result = CROCKFORD[ts & 31] + result;
      ts = Math.floor(ts / 32);
    }

    // Random part (16 chars = 80 bits)
    var rand = new Uint8Array(10);
    crypto.getRandomValues(rand);
    for (var j = 0; j < 10; j++) {
      // Map each byte to Crockford base32 characters
      result += CROCKFORD[rand[j] & 31];
    }

    // Ensure exactly 26 characters
    return result.substring(0, 26);
  }

  function decodeULIDTimestamp(ulid) {
    var ts = 0;
    for (var i = 0; i < 10; i++) {
      var c = ulid.charAt(i);
      var idx = CROCKFORD.indexOf(c.toUpperCase());
      if (idx === -1) idx = 0;
      ts = ts * 32 + idx;
    }
    return ts;
  }

  function escH(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
