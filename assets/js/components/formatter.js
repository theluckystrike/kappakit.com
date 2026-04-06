/* KappaKit — Formatter Component */
/* Supports: sql, css, html, javascript, json-to-yaml */

window.KappaKit_formatter = function(mount, config) {
  var language = config.language || 'sql';
  var isYaml = language === 'json-to-yaml';

  var titles = {
    'sql': 'SQL Formatter',
    'css': 'CSS Formatter & Minifier',
    'html': 'HTML Formatter',
    'javascript': 'JavaScript Formatter',
    'json-to-yaml': 'JSON to YAML Converter'
  };

  var html = '<h3>' + (titles[language] || 'Code Formatter') + '</h3>';
  html += '<label for="fmt-input">' + (isYaml ? 'JSON Input' : 'Input') + '</label>';
  html += '<textarea id="fmt-input" placeholder="' + getPlaceholder() + '" style="min-height:150px;"></textarea>';
  html += '<div class="actions" style="margin:0.75rem 0;">';

  if (isYaml) {
    html += '<button class="btn" id="fmt-format">Convert to YAML</button>';
  } else {
    html += '<button class="btn" id="fmt-format">Format</button>';
    html += '<button class="btn btn-outline" id="fmt-minify">Minify</button>';
  }
  html += '<button class="btn btn-outline" id="fmt-clear">Clear</button>';
  html += '<button class="btn btn-outline" id="fmt-copy">Copy Output</button>';
  html += '</div>';
  html += '<label>' + (isYaml ? 'YAML Output' : 'Output') + '</label>';
  html += '<div class="output-box" id="fmt-output" style="min-height:120px;white-space:pre-wrap;font-size:0.82rem;"></div>';

  mount.innerHTML = html;

  var input = document.getElementById('fmt-input');
  var formatBtn = document.getElementById('fmt-format');
  var minifyBtn = document.getElementById('fmt-minify');
  var clearBtn = document.getElementById('fmt-clear');
  var copyBtn = document.getElementById('fmt-copy');

  formatBtn.addEventListener('click', function() { doFormat(); });
  if (minifyBtn) minifyBtn.addEventListener('click', function() { doMinify(); });
  clearBtn.addEventListener('click', function() {
    input.value = '';
    document.getElementById('fmt-output').textContent = '';
  });
  copyBtn.addEventListener('click', function() {
    var text = document.getElementById('fmt-output').textContent;
    navigator.clipboard.writeText(text).then(function() {
      copyBtn.textContent = 'Copied!';
      setTimeout(function() { copyBtn.textContent = 'Copy Output'; }, 1200);
    });
  });

  function getPlaceholder() {
    if (language === 'sql') return 'SELECT id, name FROM users WHERE active = 1 ORDER BY name';
    if (language === 'css') return '.container { display: flex; gap: 1rem; padding: 2rem; }';
    if (language === 'html') return '<div><p>Hello</p></div>';
    if (language === 'javascript') return 'function hello() { const x = 1; if (x) { return true; } }';
    if (isYaml) return '{"name": "John", "age": 30, "skills": ["JS", "Python"]}';
    return 'Paste code here...';
  }

  function doFormat() {
    var code = input.value;
    if (!code.trim()) return;

    var output = document.getElementById('fmt-output');
    try {
      var result;
      if (language === 'sql') result = formatSQL(code);
      else if (language === 'css') result = formatCSS(code);
      else if (language === 'html') result = formatHTML(code);
      else if (language === 'javascript') result = formatJS(code);
      else if (isYaml) result = jsonToYaml(code);
      else result = code;

      output.textContent = result;
    } catch (e) {
      output.textContent = 'Error: ' + e.message;
    }
  }

  function doMinify() {
    var code = input.value;
    if (!code.trim()) return;

    var output = document.getElementById('fmt-output');
    try {
      var result;
      if (language === 'sql') result = minifySQL(code);
      else if (language === 'css') result = minifyCSS(code);
      else if (language === 'html') result = minifyHTML(code);
      else if (language === 'javascript') result = minifyJS(code);
      else result = code.replace(/\s+/g, ' ').trim();

      output.textContent = result;
    } catch (e) {
      output.textContent = 'Error: ' + e.message;
    }
  }

  // SQL Formatter
  function formatSQL(sql) {
    var keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY',
      'HAVING', 'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
      'DELETE FROM', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
      'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN',
      'ON', 'UNION ALL', 'UNION', 'WITH', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'];

    // Uppercase keywords
    var result = sql;
    keywords.forEach(function(kw) {
      var re = new RegExp('\\b' + kw.replace(/ /g, '\\s+') + '\\b', 'gi');
      result = result.replace(re, kw);
    });

    // Add newlines before major clauses
    var majorClauses = ['SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
      'LIMIT', 'OFFSET', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
      'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN',
      'UNION ALL', 'UNION', 'WITH'];

    majorClauses.forEach(function(clause) {
      var re = new RegExp('\\s+(' + clause.replace(/ /g, '\\s+') + ')\\b', 'g');
      result = result.replace(re, '\n$1');
    });

    // Indent AND/OR
    result = result.replace(/\n(AND|OR)\b/g, '\n  $1');

    // Indent column lists after SELECT
    result = result.replace(/SELECT\s+/g, 'SELECT\n  ');

    // Clean up
    result = result.replace(/\n{3,}/g, '\n\n').trim();

    return result;
  }

  function minifySQL(sql) {
    return sql.replace(/\s+/g, ' ').replace(/\s*([,()])\s*/g, '$1').trim();
  }

  // CSS Formatter
  function formatCSS(css) {
    var result = css;
    // Remove existing formatting
    result = result.replace(/\s+/g, ' ').trim();
    // Add newline after {
    result = result.replace(/\{/g, ' {\n  ');
    // Add newline after ;
    result = result.replace(/;\s*/g, ';\n  ');
    // Add newline before }
    result = result.replace(/\s*\}/g, '\n}\n');
    // Clean up double spaces in properties
    result = result.replace(/:\s*/g, ': ');
    // Clean trailing whitespace on lines
    result = result.replace(/[ \t]+\n/g, '\n');
    // Remove empty lines at start/end
    result = result.replace(/\n{3,}/g, '\n\n').trim();
    return result;
  }

  function minifyCSS(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove comments
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;}/g, '}')
      .trim();
  }

  // HTML Formatter
  function formatHTML(html) {
    var result = '';
    var indent = 0;
    var pad = function() { return '  '.repeat(indent); };

    // Split into tokens (tags and text)
    var tokens = html.match(/<[^>]+>|[^<]+/g) || [];

    tokens.forEach(function(token) {
      token = token.trim();
      if (!token) return;

      if (token.match(/^<\//)) {
        // Closing tag
        indent = Math.max(0, indent - 1);
        result += pad() + token + '\n';
      } else if (token.match(/^<[^/].*\/>$/)) {
        // Self-closing tag
        result += pad() + token + '\n';
      } else if (token.match(/^</)) {
        // Opening tag
        result += pad() + token + '\n';
        // Don't indent for void elements
        if (!token.match(/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i)) {
          indent++;
        }
      } else {
        // Text content
        result += pad() + token + '\n';
      }
    });

    return result.trim();
  }

  function minifyHTML(html) {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  // JavaScript Formatter
  function formatJS(code) {
    var result = '';
    var indent = 0;
    var pad = function() { return '  '.repeat(indent); };
    var inString = false;
    var stringChar = '';

    for (var i = 0; i < code.length; i++) {
      var c = code[i];
      var next = code[i + 1] || '';

      // Handle strings
      if ((c === '"' || c === "'" || c === '`') && (i === 0 || code[i-1] !== '\\')) {
        if (!inString) { inString = true; stringChar = c; }
        else if (c === stringChar) { inString = false; }
        result += c;
        continue;
      }

      if (inString) { result += c; continue; }

      if (c === '{') {
        result += ' {\n';
        indent++;
        result += pad();
      } else if (c === '}') {
        indent = Math.max(0, indent - 1);
        result += '\n' + pad() + '}';
        if (next === ';' || next === ',' || next === ')') {
          // let next char handle itself
        } else if (next && next !== '\n' && next !== '}') {
          result += '\n' + pad();
        }
      } else if (c === ';') {
        result += ';\n' + pad();
      } else if (c === '\n' || c === '\r') {
        // Skip existing newlines (we manage our own)
      } else {
        result += c;
      }
    }

    // Clean up
    result = result.replace(/\n\s*\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim();
    return result;
  }

  function minifyJS(code) {
    // Very basic: remove multi-line whitespace, preserve strings
    return code
      .replace(/\/\/.*$/gm, '')  // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove multi-line comments
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, '$1')
      .trim();
  }

  // JSON to YAML
  function jsonToYaml(jsonStr) {
    var obj = JSON.parse(jsonStr);
    return toYaml(obj, 0);
  }

  function toYaml(val, indent) {
    var pad = '  '.repeat(indent);

    if (val === null) return 'null';
    if (val === undefined) return 'null';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'string') {
      // Quote strings that could be ambiguous
      if (val === '' || val === 'true' || val === 'false' || val === 'null' ||
          /^[\d]/.test(val) || /[:#{}[\],&*?|>!%@`]/.test(val) || /^\s|\s$/.test(val)) {
        return '"' + val.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
      }
      return val;
    }

    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      var lines = val.map(function(item) {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          var objYaml = toYamlObject(item, indent + 1);
          return pad + '- ' + objYaml;
        }
        return pad + '- ' + toYaml(item, indent + 1);
      });
      return '\n' + lines.join('\n');
    }

    if (typeof val === 'object') {
      var keys = Object.keys(val);
      if (keys.length === 0) return '{}';
      var lines2 = keys.map(function(key) {
        var v = val[key];
        if (typeof v === 'object' && v !== null) {
          return pad + key + ':' + toYaml(v, indent + 1);
        }
        return pad + key + ': ' + toYaml(v, indent + 1);
      });
      return '\n' + lines2.join('\n');
    }

    return String(val);
  }

  function toYamlObject(obj, indent) {
    var pad = '  '.repeat(indent);
    var keys = Object.keys(obj);
    var first = true;
    var lines = keys.map(function(key) {
      var v = obj[key];
      var prefix = first ? '' : pad;
      first = false;
      if (typeof v === 'object' && v !== null) {
        return prefix + key + ':' + toYaml(v, indent + 1);
      }
      return prefix + key + ': ' + toYaml(v, indent + 1);
    });
    return lines.join('\n');
  }
};
