/* KappaKit — JSON Tool Component */
/* Supports: format, validate, minify, convert (JSON->TS), diff */

window.KappaKit_json_tool = function(mount, config) {
  var mode = config.mode || 'format';
  var isDiff = mode === 'diff';
  var isConvert = mode === 'convert';

  var titles = {
    'format': 'JSON Formatter & Prettifier',
    'validate': 'JSON Validator',
    'minify': 'JSON Minifier',
    'convert': 'JSON to TypeScript Interface',
    'diff': 'JSON Diff'
  };

  var html = '<h3>' + (titles[mode] || 'JSON Tool') + '</h3>';

  if (isDiff) {
    html += '<div class="row">';
    html += '<div><label for="json-left">JSON A</label><textarea id="json-left" placeholder="Paste first JSON..." style="min-height:120px;"></textarea></div>';
    html += '<div><label for="json-right">JSON B</label><textarea id="json-right" placeholder="Paste second JSON..." style="min-height:120px;"></textarea></div>';
    html += '</div>';
    html += '<div class="actions" style="margin-bottom:1rem;">';
    html += '<button class="btn" id="json-run">Compare</button>';
    html += '<button class="btn btn-outline" id="json-clear">Clear</button>';
    html += '</div>';
    html += '<label>Differences</label>';
    html += '<div class="output-box" id="json-output" style="min-height:100px;font-size:0.82rem;"></div>';
  } else {
    html += '<label for="json-input">JSON Input</label>';
    html += '<textarea id="json-input" placeholder="Paste JSON here..." style="min-height:150px;"></textarea>';
    html += '<div class="actions" style="margin-bottom:1rem;">';

    if (mode === 'format') {
      html += '<button class="btn" id="json-run">Format</button>';
    } else if (mode === 'validate') {
      html += '<button class="btn" id="json-run">Validate</button>';
    } else if (mode === 'minify') {
      html += '<button class="btn" id="json-run">Minify</button>';
    } else if (isConvert) {
      html += '<button class="btn" id="json-run">Convert to TypeScript</button>';
    }
    html += '<button class="btn btn-outline" id="json-clear">Clear</button>';
    html += '<button class="btn btn-outline" id="json-copy">Copy Output</button>';
    html += '</div>';
    html += '<label>Output</label>';
    html += '<div class="output-box" id="json-output" style="min-height:100px;font-size:0.82rem;white-space:pre-wrap;"></div>';
  }

  mount.innerHTML = html;

  var runBtn = document.getElementById('json-run');
  var clearBtn = document.getElementById('json-clear');
  var copyBtn = document.getElementById('json-copy');

  runBtn.addEventListener('click', function() { doAction(); });
  clearBtn.addEventListener('click', function() {
    if (isDiff) {
      document.getElementById('json-left').value = '';
      document.getElementById('json-right').value = '';
    } else {
      document.getElementById('json-input').value = '';
    }
    document.getElementById('json-output').innerHTML = '';
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      var el = document.getElementById('json-output');
      var text = el.textContent || el.innerText;
      navigator.clipboard.writeText(text).then(function() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy Output'; }, 1200);
      });
    });
  }

  // Real-time for format/validate/minify
  if (!isDiff) {
    var input = document.getElementById('json-input');
    var debounce = null;
    input.addEventListener('input', function() {
      clearTimeout(debounce);
      debounce = setTimeout(function() { doAction(); }, 300);
    });
  }

  function doAction() {
    var output = document.getElementById('json-output');

    if (isDiff) {
      var leftStr = document.getElementById('json-left').value.trim();
      var rightStr = document.getElementById('json-right').value.trim();
      if (!leftStr || !rightStr) { output.innerHTML = '<span style="color:var(--text-muted);">Paste JSON in both fields.</span>'; return; }
      try {
        var leftObj = JSON.parse(leftStr);
        var rightObj = JSON.parse(rightStr);
        var diffs = diffObjects(leftObj, rightObj, '');
        if (diffs.length === 0) {
          output.innerHTML = '<span style="color:#22c55e;font-weight:600;">No differences. JSON objects are identical.</span>';
        } else {
          output.innerHTML = diffs.map(function(d) {
            var color = d.type === 'added' ? '#22c55e' : d.type === 'removed' ? '#ef4444' : '#eab308';
            var prefix = d.type === 'added' ? '+' : d.type === 'removed' ? '-' : '~';
            return '<div style="color:' + color + ';margin-bottom:0.25rem;">' + prefix + ' <strong>' + escH(d.path) + '</strong>: ' + escH(d.detail) + '</div>';
          }).join('');
        }
      } catch (e) {
        output.innerHTML = '<span style="color:#ef4444;">JSON Parse Error: ' + escH(e.message) + '</span>';
      }
      return;
    }

    var inputVal = document.getElementById('json-input').value.trim();
    if (!inputVal) { output.innerHTML = ''; return; }

    if (mode === 'format') {
      try {
        var obj = JSON.parse(inputVal);
        var formatted = JSON.stringify(obj, null, 2);
        output.innerHTML = syntaxHighlight(formatted);
      } catch (e) {
        output.innerHTML = '<span style="color:#ef4444;">Invalid JSON: ' + escH(e.message) + '</span>';
      }
    } else if (mode === 'validate') {
      try {
        var parsed = JSON.parse(inputVal);
        var keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
        var isArr = Array.isArray(parsed);
        output.innerHTML = '<span style="color:#22c55e;font-weight:600;">Valid JSON</span>';
        output.innerHTML += '<div style="margin-top:0.5rem;color:var(--text-muted);font-size:0.82rem;">Type: ' + (isArr ? 'Array (' + parsed.length + ' elements)' : 'Object (' + keys + ' keys)') + '</div>';
        output.innerHTML += '<div style="margin-top:0.25rem;color:var(--text-muted);font-size:0.82rem;">Size: ' + inputVal.length + ' characters</div>';
      } catch (e) {
        var msg = e.message;
        var posMatch = msg.match(/position\s+(\d+)/i);
        var detail = '<span style="color:#ef4444;font-weight:600;">Invalid JSON</span>';
        detail += '<div style="margin-top:0.5rem;color:#ef4444;">' + escH(msg) + '</div>';
        if (posMatch) {
          var pos = parseInt(posMatch[1], 10);
          var line = inputVal.substring(0, pos).split('\n').length;
          detail += '<div style="margin-top:0.25rem;color:var(--text-muted);font-size:0.82rem;">Approximate line: ' + line + '</div>';
        }
        output.innerHTML = detail;
      }
    } else if (mode === 'minify') {
      try {
        var obj2 = JSON.parse(inputVal);
        var minified = JSON.stringify(obj2);
        output.textContent = minified;
        var saved = inputVal.length - minified.length;
        var pct = ((saved / inputVal.length) * 100).toFixed(1);
        output.innerHTML += '<div style="margin-top:0.75rem;font-size:0.82rem;color:var(--text-muted);">Original: ' + inputVal.length + ' chars | Minified: ' + minified.length + ' chars | Saved: ' + saved + ' chars (' + pct + '%)</div>';
      } catch (e) {
        output.innerHTML = '<span style="color:#ef4444;">Invalid JSON: ' + escH(e.message) + '</span>';
      }
    } else if (isConvert) {
      try {
        var obj3 = JSON.parse(inputVal);
        var ts = jsonToTypeScript(obj3, 'Root');
        output.innerHTML = syntaxHighlightTS(ts);
      } catch (e) {
        output.innerHTML = '<span style="color:#ef4444;">Invalid JSON: ' + escH(e.message) + '</span>';
      }
    }
  }

  function diffObjects(a, b, path) {
    var diffs = [];
    if (typeof a !== typeof b) {
      diffs.push({ type: 'changed', path: path || '(root)', detail: JSON.stringify(a) + ' -> ' + JSON.stringify(b) });
      return diffs;
    }
    if (a === null || b === null || typeof a !== 'object') {
      if (a !== b) {
        diffs.push({ type: 'changed', path: path || '(root)', detail: JSON.stringify(a) + ' -> ' + JSON.stringify(b) });
      }
      return diffs;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      var maxLen = Math.max(a.length, b.length);
      for (var i = 0; i < maxLen; i++) {
        var p = path + '[' + i + ']';
        if (i >= a.length) { diffs.push({ type: 'added', path: p, detail: JSON.stringify(b[i]) }); }
        else if (i >= b.length) { diffs.push({ type: 'removed', path: p, detail: JSON.stringify(a[i]) }); }
        else { diffs = diffs.concat(diffObjects(a[i], b[i], p)); }
      }
      return diffs;
    }
    var allKeys = {};
    Object.keys(a).forEach(function(k) { allKeys[k] = true; });
    Object.keys(b).forEach(function(k) { allKeys[k] = true; });
    Object.keys(allKeys).forEach(function(key) {
      var p = path ? path + '.' + key : key;
      if (!(key in a)) { diffs.push({ type: 'added', path: p, detail: JSON.stringify(b[key]) }); }
      else if (!(key in b)) { diffs.push({ type: 'removed', path: p, detail: JSON.stringify(a[key]) }); }
      else { diffs = diffs.concat(diffObjects(a[key], b[key], p)); }
    });
    return diffs;
  }

  function jsonToTypeScript(obj, name) {
    var interfaces = [];
    function getType(val, propName) {
      if (val === null) return 'null';
      if (typeof val === 'string') return 'string';
      if (typeof val === 'number') return 'number';
      if (typeof val === 'boolean') return 'boolean';
      if (Array.isArray(val)) {
        if (val.length === 0) return 'any[]';
        var elemType = getType(val[0], propName + 'Item');
        return elemType + '[]';
      }
      if (typeof val === 'object') {
        var iName = capitalize(propName);
        buildInterface(val, iName);
        return iName;
      }
      return 'any';
    }
    function buildInterface(obj, name) {
      var lines = ['interface ' + name + ' {'];
      Object.keys(obj).forEach(function(key) {
        var type = getType(obj[key], key);
        var nullable = obj[key] === null ? ' | null' : '';
        lines.push('  ' + key + ': ' + type + nullable + ';');
      });
      lines.push('}');
      interfaces.push(lines.join('\n'));
    }
    function capitalize(s) {
      return s.charAt(0).toUpperCase() + s.slice(1).replace(/[^a-zA-Z0-9]/g, '');
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
        buildInterface(obj[0], name);
        return interfaces.reverse().join('\n\n') + '\n\ntype ' + name + 'Array = ' + name + '[];';
      }
      return 'type ' + name + ' = ' + getType(obj, name) + ';';
    }
    buildInterface(obj, name);
    return interfaces.reverse().join('\n\n');
  }

  function syntaxHighlight(json) {
    var s = escH(json);
    s = s.replace(/(".*?")(\s*:\s*)/g, '<span style="color:#14B8A6">$1</span>$2');
    s = s.replace(/:\s*(".*?")/g, ': <span style="color:#eab308">$1</span>');
    s = s.replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#ec4899">$1</span>');
    s = s.replace(/:\s*(true|false|null)/g, ': <span style="color:#a78bfa">$1</span>');
    return s;
  }

  function syntaxHighlightTS(code) {
    var s = escH(code);
    s = s.replace(/\b(interface|type)\b/g, '<span style="color:#a78bfa">$1</span>');
    s = s.replace(/:\s*(string|number|boolean|null|any)/g, ': <span style="color:#14B8A6">$1</span>');
    s = s.replace(/(\w+)(\s*:)/g, '<span style="color:#eab308">$1</span>$2');
    return s;
  }

  function escH(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
};
