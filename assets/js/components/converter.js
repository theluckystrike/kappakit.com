/* KappaKit — Converter Component */
/* Supports: hex-rgb, number-base, ascii */

window.KappaKit_converter = function(mount, config) {
  var type = config.type || 'hex-rgb';

  if (type === 'hex-rgb') {
    buildHexRgb();
  } else if (type === 'number-base') {
    buildNumberBase();
  } else if (type === 'ascii') {
    buildAscii();
  }

  function buildHexRgb() {
    var html = '<h3>Hex / RGB Color Converter</h3>';
    html += '<div class="row">';
    html += '<div>';
    html += '<label for="conv-hex">HEX</label>';
    html += '<input type="text" id="conv-hex" placeholder="#14B8A6">';
    html += '</div>';
    html += '<div>';
    html += '<label for="conv-rgb">RGB</label>';
    html += '<input type="text" id="conv-rgb" placeholder="20, 184, 166">';
    html += '</div>';
    html += '<div>';
    html += '<label for="conv-hsl">HSL</label>';
    html += '<input type="text" id="conv-hsl" placeholder="174, 80%, 40%">';
    html += '</div>';
    html += '</div>';
    html += '<div style="display:flex;gap:1rem;align-items:center;margin-top:0.75rem;">';
    html += '<div class="color-swatch" id="conv-swatch" style="width:80px;height:80px;border-radius:var(--radius);border:1px solid var(--border);"></div>';
    html += '<div>';
    html += '<label for="conv-picker" style="margin-bottom:0.25rem;">Color Picker</label>';
    html += '<input type="color" id="conv-picker" value="#14B8A6" style="width:60px;height:40px;border:none;background:none;cursor:pointer;">';
    html += '</div>';
    html += '<div id="conv-css" style="font-size:0.82rem;color:var(--text-muted);"></div>';
    html += '</div>';

    mount.innerHTML = html;

    var hexIn = document.getElementById('conv-hex');
    var rgbIn = document.getElementById('conv-rgb');
    var hslIn = document.getElementById('conv-hsl');
    var swatch = document.getElementById('conv-swatch');
    var picker = document.getElementById('conv-picker');
    var cssOut = document.getElementById('conv-css');

    hexIn.addEventListener('input', function() { fromHex(); });
    rgbIn.addEventListener('input', function() { fromRgb(); });
    hslIn.addEventListener('input', function() { fromHsl(); });
    picker.addEventListener('input', function() {
      hexIn.value = picker.value;
      fromHex();
    });

    function fromHex() {
      var hex = hexIn.value.trim().replace('#', '');
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      if (!/^[0-9a-fA-F]{6}$/.test(hex)) return;
      var r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
      rgbIn.value = r + ', ' + g + ', ' + b;
      var hsl = rgbToHsl(r, g, b);
      hslIn.value = hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%';
      swatch.style.background = '#' + hex;
      picker.value = '#' + hex.toLowerCase();
      cssOut.innerHTML = 'CSS: <code>rgb(' + r + ',' + g + ',' + b + ')</code>';
    }

    function fromRgb() {
      var parts = rgbIn.value.split(',').map(function(s) { return parseInt(s.trim(), 10); });
      if (parts.length !== 3 || parts.some(isNaN)) return;
      var r = clamp(parts[0],0,255), g = clamp(parts[1],0,255), b = clamp(parts[2],0,255);
      var hex = '#' + [r,g,b].map(function(v) { return v.toString(16).padStart(2,'0'); }).join('');
      hexIn.value = hex;
      var hsl = rgbToHsl(r, g, b);
      hslIn.value = hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%';
      swatch.style.background = hex;
      picker.value = hex;
      cssOut.innerHTML = 'CSS: <code>rgb(' + r + ',' + g + ',' + b + ')</code>';
    }

    function fromHsl() {
      var raw = hslIn.value.replace(/%/g, '');
      var parts = raw.split(',').map(function(s) { return parseFloat(s.trim()); });
      if (parts.length !== 3 || parts.some(isNaN)) return;
      var h = ((parts[0] % 360) + 360) % 360;
      var s = clamp(parts[1], 0, 100) / 100;
      var l = clamp(parts[2], 0, 100) / 100;
      var rgb = hslToRgb(h, s, l);
      rgbIn.value = rgb[0] + ', ' + rgb[1] + ', ' + rgb[2];
      var hex = '#' + rgb.map(function(v) { return v.toString(16).padStart(2,'0'); }).join('');
      hexIn.value = hex;
      swatch.style.background = hex;
      picker.value = hex;
      cssOut.innerHTML = 'CSS: <code>hsl(' + Math.round(h) + ',' + Math.round(s*100) + '%,' + Math.round(l*100) + '%)</code>';
    }
  }

  function buildNumberBase() {
    var html = '<h3>Number Base Converter</h3>';
    html += '<p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem;">Enter a value in any field and the others will update automatically.</p>';
    html += '<div class="row">';
    html += '<div><label for="conv-dec">Decimal (Base 10)</label><input type="text" id="conv-dec" placeholder="255"></div>';
    html += '<div><label for="conv-hexn">Hexadecimal (Base 16)</label><input type="text" id="conv-hexn" placeholder="FF"></div>';
    html += '</div>';
    html += '<div class="row">';
    html += '<div><label for="conv-bin">Binary (Base 2)</label><input type="text" id="conv-bin" placeholder="11111111"></div>';
    html += '<div><label for="conv-oct">Octal (Base 8)</label><input type="text" id="conv-oct" placeholder="377"></div>';
    html += '</div>';
    html += '<div class="actions"><button class="btn btn-outline" id="conv-clear">Clear All</button></div>';
    html += '<div id="conv-info" style="margin-top:0.75rem;font-size:0.82rem;color:var(--text-muted);"></div>';

    mount.innerHTML = html;

    var dec = document.getElementById('conv-dec');
    var hex = document.getElementById('conv-hexn');
    var bin = document.getElementById('conv-bin');
    var oct = document.getElementById('conv-oct');
    var info = document.getElementById('conv-info');
    var clearBtn = document.getElementById('conv-clear');

    dec.addEventListener('input', function() {
      var v = parseInt(dec.value.trim(), 10);
      if (isNaN(v)) { hex.value = ''; bin.value = ''; oct.value = ''; info.textContent = ''; return; }
      hex.value = v.toString(16).toUpperCase();
      bin.value = v.toString(2);
      oct.value = v.toString(8);
      info.textContent = 'Decimal: ' + v + ' | Bits: ' + v.toString(2).length;
    });

    hex.addEventListener('input', function() {
      var v = parseInt(hex.value.trim(), 16);
      if (isNaN(v)) { dec.value = ''; bin.value = ''; oct.value = ''; info.textContent = ''; return; }
      dec.value = v.toString(10);
      bin.value = v.toString(2);
      oct.value = v.toString(8);
      info.textContent = 'Decimal: ' + v + ' | Bits: ' + v.toString(2).length;
    });

    bin.addEventListener('input', function() {
      var v = parseInt(bin.value.trim(), 2);
      if (isNaN(v)) { dec.value = ''; hex.value = ''; oct.value = ''; info.textContent = ''; return; }
      dec.value = v.toString(10);
      hex.value = v.toString(16).toUpperCase();
      oct.value = v.toString(8);
      info.textContent = 'Decimal: ' + v + ' | Bits: ' + v.toString(2).length;
    });

    oct.addEventListener('input', function() {
      var v = parseInt(oct.value.trim(), 8);
      if (isNaN(v)) { dec.value = ''; hex.value = ''; bin.value = ''; info.textContent = ''; return; }
      dec.value = v.toString(10);
      hex.value = v.toString(16).toUpperCase();
      bin.value = v.toString(2);
      info.textContent = 'Decimal: ' + v + ' | Bits: ' + v.toString(2).length;
    });

    clearBtn.addEventListener('click', function() {
      dec.value = ''; hex.value = ''; bin.value = ''; oct.value = '';
      info.textContent = '';
    });
  }

  function buildAscii() {
    var html = '<h3>ASCII / Hex Converter</h3>';
    html += '<div class="row">';
    html += '<div><label for="conv-text">Text</label><textarea id="conv-text" placeholder="Hello World"></textarea></div>';
    html += '<div><label for="conv-hexstr">Hex</label><textarea id="conv-hexstr" placeholder="48 65 6C 6C 6F"></textarea></div>';
    html += '</div>';
    html += '<div class="actions">';
    html += '<button class="btn" id="conv-to-hex">Text to Hex</button>';
    html += '<button class="btn btn-outline" id="conv-to-text">Hex to Text</button>';
    html += '<button class="btn btn-outline" id="conv-clear">Clear</button>';
    html += '</div>';

    mount.innerHTML = html;

    var textIn = document.getElementById('conv-text');
    var hexIn = document.getElementById('conv-hexstr');

    document.getElementById('conv-to-hex').addEventListener('click', function() {
      hexIn.value = Array.from(textIn.value).map(function(c) {
        return c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
      }).join(' ');
    });

    document.getElementById('conv-to-text').addEventListener('click', function() {
      var hex = hexIn.value.trim().replace(/\s+/g, '');
      var text = '';
      for (var i = 0; i < hex.length; i += 2) {
        text += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
      }
      textIn.value = text;
    });

    document.getElementById('conv-clear').addEventListener('click', function() {
      textIn.value = ''; hexIn.value = '';
    });
  }

  // Color helpers
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r,g,b), min = Math.min(r,g,b);
    var h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  function hslToRgb(h, s, l) {
    h /= 360;
    var r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r*255), Math.round(g*255), Math.round(b*255)];
  }

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q-p)*6*t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q-p)*(2/3-t)*6;
    return p;
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
};
