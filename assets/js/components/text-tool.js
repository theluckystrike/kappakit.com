/* KappaKit — Text Tool Component */
/* Supports: counter, case, diff */

window.KappaKit_text_tool = function(mount, config) {
  var mode = config.mode || 'counter';
  var isDiff = mode === 'diff';
  var isCase = mode === 'case';

  var titles = {
    'counter': 'Word & Character Counter',
    'case': 'Case Converter',
    'diff': 'Text Diff'
  };

  var html = '<h3>' + (titles[mode] || 'Text Tool') + '</h3>';

  if (isDiff) {
    html += '<div class="row">';
    html += '<div><label for="diff-left">Text A (Original)</label><textarea id="diff-left" placeholder="Paste original text..." style="min-height:150px;"></textarea></div>';
    html += '<div><label for="diff-right">Text B (Modified)</label><textarea id="diff-right" placeholder="Paste modified text..." style="min-height:150px;"></textarea></div>';
    html += '</div>';
    html += '<div class="actions" style="margin-bottom:1rem;">';
    html += '<button class="btn" id="text-run">Compare</button>';
    html += '<button class="btn btn-outline" id="text-clear">Clear</button>';
    html += '</div>';
    html += '<label>Differences</label>';
    html += '<div class="output-box" id="text-output" style="min-height:100px;font-size:0.82rem;white-space:pre-wrap;"></div>';
  } else if (isCase) {
    html += '<label for="text-input">Input Text</label>';
    html += '<textarea id="text-input" placeholder="Enter text to convert..." style="min-height:100px;"></textarea>';
    html += '<div class="actions" style="margin:0.75rem 0;flex-wrap:wrap;">';
    html += '<button class="btn btn-sm case-btn" data-case="upper">UPPERCASE</button>';
    html += '<button class="btn btn-sm case-btn" data-case="lower">lowercase</button>';
    html += '<button class="btn btn-sm case-btn" data-case="title">Title Case</button>';
    html += '<button class="btn btn-sm case-btn" data-case="camel">camelCase</button>';
    html += '<button class="btn btn-sm case-btn" data-case="snake">snake_case</button>';
    html += '<button class="btn btn-sm case-btn" data-case="kebab">kebab-case</button>';
    html += '<button class="btn btn-outline btn-sm" id="text-clear">Clear</button>';
    html += '<button class="btn btn-outline btn-sm" id="text-copy">Copy Output</button>';
    html += '</div>';
    html += '<label>Output</label>';
    html += '<div class="output-box" id="text-output" style="min-height:60px;"></div>';
  } else {
    // Counter mode
    html += '<label for="text-input">Input Text</label>';
    html += '<textarea id="text-input" placeholder="Start typing or paste text..." style="min-height:150px;"></textarea>';
    html += '<div id="counter-stats" style="margin-top:1rem;"></div>';
  }

  mount.innerHTML = html;

  if (isDiff) {
    var runBtn = document.getElementById('text-run');
    var clearBtn = document.getElementById('text-clear');

    runBtn.addEventListener('click', function() { doDiff(); });
    clearBtn.addEventListener('click', function() {
      document.getElementById('diff-left').value = '';
      document.getElementById('diff-right').value = '';
      document.getElementById('text-output').innerHTML = '';
    });
  } else if (isCase) {
    var input = document.getElementById('text-input');
    var clearBtn2 = document.getElementById('text-clear');
    var copyBtn = document.getElementById('text-copy');

    mount.querySelectorAll('.case-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var caseType = btn.getAttribute('data-case');
        doCase(caseType);
      });
    });

    clearBtn2.addEventListener('click', function() {
      input.value = '';
      setBox('text-output', '');
    });

    copyBtn.addEventListener('click', function() {
      var el = document.getElementById('text-output');
      navigator.clipboard.writeText(el.textContent).then(function() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy Output'; }, 1200);
      });
    });
  } else {
    // Counter — real-time
    var input2 = document.getElementById('text-input');
    input2.addEventListener('input', function() { doCount(); });
    doCount();
  }

  function doCount() {
    var text = document.getElementById('text-input').value;
    var stats = document.getElementById('counter-stats');

    var chars = text.length;
    var charsNoSpace = text.replace(/\s/g, '').length;
    var words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    var sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(function(s) { return s.trim().length > 0; }).length;
    var paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(function(s) { return s.trim().length > 0; }).length;
    var readingTime = Math.ceil(words / 200);

    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.75rem;">';
    html += statCard('Words', words);
    html += statCard('Characters', chars);
    html += statCard('Characters (no spaces)', charsNoSpace);
    html += statCard('Sentences', sentences);
    html += statCard('Paragraphs', paragraphs);
    html += statCard('Reading Time', readingTime + ' min');
    html += '</div>';

    stats.innerHTML = html;
  }

  function statCard(label, value) {
    return '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem;text-align:center;">' +
      '<div style="font-family:var(--font-display);font-size:1.5rem;color:var(--accent);">' + value + '</div>' +
      '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.25rem;">' + label + '</div>' +
      '</div>';
  }

  function doCase(type) {
    var text = document.getElementById('text-input').value;
    var result = '';

    switch (type) {
      case 'upper':
        result = text.toUpperCase();
        break;
      case 'lower':
        result = text.toLowerCase();
        break;
      case 'title':
        result = text.toLowerCase().replace(/(?:^|\s|[-])\S/g, function(c) { return c.toUpperCase(); });
        break;
      case 'camel':
        result = toCamelCase(text);
        break;
      case 'snake':
        result = toSnakeCase(text);
        break;
      case 'kebab':
        result = toKebabCase(text);
        break;
    }

    setBox('text-output', result);
  }

  function toCamelCase(str) {
    var words = splitWords(str);
    return words.map(function(w, i) {
      w = w.toLowerCase();
      if (i === 0) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join('');
  }

  function toSnakeCase(str) {
    return splitWords(str).map(function(w) { return w.toLowerCase(); }).join('_');
  }

  function toKebabCase(str) {
    return splitWords(str).map(function(w) { return w.toLowerCase(); }).join('-');
  }

  function splitWords(str) {
    // Split on spaces, underscores, hyphens, and camelCase boundaries
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]/g, ' ')
      .split(/\s+/)
      .filter(function(w) { return w.length > 0; });
  }

  function doDiff() {
    var leftText = document.getElementById('diff-left').value;
    var rightText = document.getElementById('diff-right').value;
    var output = document.getElementById('text-output');

    if (!leftText && !rightText) { output.innerHTML = ''; return; }

    var leftLines = leftText.split('\n');
    var rightLines = rightText.split('\n');

    // LCS-based diff
    var lcs = computeLCS(leftLines, rightLines);
    var diffResult = buildDiff(leftLines, rightLines, lcs);

    var html = diffResult.map(function(line) {
      if (line.type === 'same') {
        return '<div style="padding:1px 4px;">&nbsp; ' + escH(line.text) + '</div>';
      } else if (line.type === 'removed') {
        return '<div style="padding:1px 4px;background:rgba(239,68,68,0.15);color:#ef4444;">- ' + escH(line.text) + '</div>';
      } else if (line.type === 'added') {
        return '<div style="padding:1px 4px;background:rgba(34,197,94,0.15);color:#22c55e;">+ ' + escH(line.text) + '</div>';
      }
    }).join('');

    output.innerHTML = html;
  }

  function computeLCS(a, b) {
    var m = a.length, n = b.length;
    var dp = [];
    for (var i = 0; i <= m; i++) {
      dp[i] = [];
      for (var j = 0; j <= n; j++) {
        if (i === 0 || j === 0) dp[i][j] = 0;
        else if (a[i-1] === b[j-1]) dp[i][j] = dp[i-1][j-1] + 1;
        else dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
    return dp;
  }

  function buildDiff(a, b, dp) {
    var result = [];
    var i = a.length, j = b.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
        result.unshift({ type: 'same', text: a[i-1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
        result.unshift({ type: 'added', text: b[j-1] });
        j--;
      } else {
        result.unshift({ type: 'removed', text: a[i-1] });
        i--;
      }
    }
    return result;
  }

  function setBox(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    var btn = el.querySelector('.copy-btn');
    el.textContent = text;
    if (btn) el.appendChild(btn);
  }

  function escH(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
