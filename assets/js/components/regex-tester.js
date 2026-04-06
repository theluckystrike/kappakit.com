/* KappaKit — Regex Tester Component */
/* Supports: tester, generator (common patterns) */

window.KappaKit_regex_tester = function(mount, config) {
  var mode = config.mode || 'tester';
  var isGenerator = mode === 'generator';

  var presets = [
    { name: 'Email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'gi', sample: 'test@example.com hello user@mail.co.uk world' },
    { name: 'URL', pattern: 'https?:\\/\\/[\\w\\-._~:/?#\\[\\]@!$&\'()*+,;=%]+', flags: 'gi', sample: 'Visit https://kappakit.com and http://example.org/path?q=1' },
    { name: 'IPv4', pattern: '\\b(?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b', flags: 'g', sample: 'Server at 192.168.1.1 and 10.0.0.255 but not 999.999.999.999' },
    { name: 'Phone (US)', pattern: '(?:\\+?1[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', flags: 'g', sample: 'Call (555) 123-4567 or +1-800-555-0199 today' },
    { name: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', flags: 'g', sample: 'Published on 2026-04-06, updated 2026-12-31' },
    { name: 'Hex Color', pattern: '#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\\b', flags: 'gi', sample: 'Colors: #14B8A6 #fff #aabbcc #123' },
    { name: 'HTML Tag', pattern: '<\\/?[a-z][a-z0-9]*(?:\\s[^>]*)?\\/?>',  flags: 'gi', sample: '<div class="test"><p>Hello</p></div>' },
    { name: 'Credit Card', pattern: '\\b(?:4\\d{3}|5[1-5]\\d{2}|3[47]\\d{2}|6011)[-.\\s]?\\d{4}[-.\\s]?\\d{4}[-.\\s]?\\d{4}\\b', flags: 'g', sample: '4111-1111-1111-1111 and 5500 0000 0000 0004' },
    { name: 'MAC Address', pattern: '(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}', flags: 'gi', sample: 'Device MAC: 00:1A:2B:3C:4D:5E and AA-BB-CC-DD-EE-FF' },
    { name: 'UUID', pattern: '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', flags: 'gi', sample: 'ID: 550e8400-e29b-41d4-a716-446655440000' }
  ];

  var html = '<h3>' + (isGenerator ? 'Common Regex Patterns' : 'Regex Tester') + '</h3>';

  if (isGenerator) {
    html += '<div style="margin-bottom:1rem;">';
    html += '<label>Choose a preset pattern</label>';
    html += '<div class="preset-grid" style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-top:0.5rem;">';
    presets.forEach(function(p, i) {
      html += '<button class="btn btn-outline btn-sm preset-btn" data-preset="' + i + '">' + p.name + '</button>';
    });
    html += '</div>';
    html += '</div>';
  }

  html += '<label for="regex-pattern">Pattern</label>';
  html += '<input type="text" id="regex-pattern" placeholder="e.g. \\d+">';
  html += '<div class="flag-group" style="margin-top:0.5rem;">';
  html += '<label class="flag-toggle"><input type="checkbox" id="flag-g" checked> g (global)</label>';
  html += '<label class="flag-toggle"><input type="checkbox" id="flag-i"> i (case-insensitive)</label>';
  html += '<label class="flag-toggle"><input type="checkbox" id="flag-m"> m (multiline)</label>';
  html += '<label class="flag-toggle"><input type="checkbox" id="flag-s"> s (dotAll)</label>';
  html += '</div>';
  html += '<label for="regex-test" style="margin-top:0.75rem;">Test String</label>';
  html += '<textarea id="regex-test" placeholder="Enter test string..." style="min-height:100px;"></textarea>';
  html += '<div class="actions" style="margin-bottom:1rem;">';
  html += '<button class="btn" id="regex-run">Test</button>';
  html += '<button class="btn btn-outline" id="regex-clear">Clear</button>';
  html += '</div>';
  html += '<label>Matches</label>';
  html += '<div class="output-box" id="regex-output" style="white-space:pre-wrap;min-height:60px;"></div>';
  html += '<div id="regex-info" style="margin-top:0.5rem;font-size:0.82rem;color:var(--text-muted);"></div>';
  html += '<div id="regex-groups" style="margin-top:0.75rem;"></div>';

  mount.innerHTML = html;

  var patternInput = document.getElementById('regex-pattern');
  var testInput = document.getElementById('regex-test');
  var runBtn = document.getElementById('regex-run');
  var clearBtn = document.getElementById('regex-clear');

  // Preset buttons
  if (isGenerator) {
    mount.querySelectorAll('.preset-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-preset'), 10);
        var preset = presets[idx];
        patternInput.value = preset.pattern;
        testInput.value = preset.sample;
        // Set flags
        document.getElementById('flag-g').checked = preset.flags.indexOf('g') >= 0;
        document.getElementById('flag-i').checked = preset.flags.indexOf('i') >= 0;
        document.getElementById('flag-m').checked = preset.flags.indexOf('m') >= 0;
        document.getElementById('flag-s').checked = preset.flags.indexOf('s') >= 0;
        doTest();
      });
    });
  }

  runBtn.addEventListener('click', function() { doTest(); });
  clearBtn.addEventListener('click', function() {
    patternInput.value = '';
    testInput.value = '';
    document.getElementById('regex-output').innerHTML = '';
    document.getElementById('regex-info').textContent = '';
    document.getElementById('regex-groups').innerHTML = '';
  });

  // Real-time matching
  var debounce = null;
  function onChange() {
    clearTimeout(debounce);
    debounce = setTimeout(function() { doTest(); }, 200);
  }
  patternInput.addEventListener('input', onChange);
  testInput.addEventListener('input', onChange);
  ['flag-g', 'flag-i', 'flag-m', 'flag-s'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', onChange);
  });

  function doTest() {
    var pattern = patternInput.value;
    var testStr = testInput.value;
    var output = document.getElementById('regex-output');
    var info = document.getElementById('regex-info');
    var groups = document.getElementById('regex-groups');

    if (!pattern) { output.innerHTML = ''; info.textContent = ''; groups.innerHTML = ''; return; }

    var flags = '';
    if (document.getElementById('flag-g').checked) flags += 'g';
    if (document.getElementById('flag-i').checked) flags += 'i';
    if (document.getElementById('flag-m').checked) flags += 'm';
    if (document.getElementById('flag-s').checked) flags += 's';

    try {
      var re = new RegExp(pattern, flags);
      var matches = [];
      var allGroups = [];
      var match;

      if (flags.indexOf('g') !== -1) {
        while ((match = re.exec(testStr)) !== null) {
          matches.push({ index: match.index, length: match[0].length, value: match[0] });
          if (match.length > 1) {
            var grp = { match: match[0], groups: [] };
            for (var g = 1; g < match.length; g++) {
              grp.groups.push({ index: g, value: match[g] || '' });
            }
            allGroups.push(grp);
          }
          if (match[0].length === 0) { re.lastIndex++; }
        }
      } else {
        match = re.exec(testStr);
        if (match) {
          matches.push({ index: match.index, length: match[0].length, value: match[0] });
          if (match.length > 1) {
            var grp2 = { match: match[0], groups: [] };
            for (var g2 = 1; g2 < match.length; g2++) {
              grp2.groups.push({ index: g2, value: match[g2] || '' });
            }
            allGroups.push(grp2);
          }
        }
      }

      // Highlight matches
      var result = '';
      var lastIdx = 0;
      for (var i = 0; i < matches.length; i++) {
        var m = matches[i];
        result += escH(testStr.slice(lastIdx, m.index));
        result += '<span class="match-highlight">' + escH(m.value) + '</span>';
        lastIdx = m.index + m.length;
      }
      result += escH(testStr.slice(lastIdx));

      output.innerHTML = result || '<span style="color:var(--text-muted);">No matches</span>';
      info.textContent = matches.length + ' match' + (matches.length !== 1 ? 'es' : '') + ' found';

      // Show groups
      if (allGroups.length > 0) {
        var gHtml = '<label style="margin-bottom:0.35rem;">Capture Groups</label>';
        allGroups.forEach(function(grp, idx) {
          gHtml += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:0.5rem;margin-bottom:0.5rem;font-size:0.82rem;">';
          gHtml += '<strong>Match ' + (idx + 1) + ':</strong> ' + escH(grp.match) + '<br>';
          grp.groups.forEach(function(g) {
            gHtml += 'Group ' + g.index + ': <span style="color:#eab308;">' + escH(g.value) + '</span><br>';
          });
          gHtml += '</div>';
        });
        groups.innerHTML = gHtml;
      } else {
        groups.innerHTML = '';
      }
    } catch (e) {
      output.innerHTML = '<span style="color:#ef4444;">' + escH(e.message) + '</span>';
      info.textContent = '';
      groups.innerHTML = '';
    }
  }

  function escH(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
