/* KappaKit — Developer Toolkit */

// ===== Tab System =====
(function initTabs() {
  var btns = document.querySelectorAll('.tab-btn');
  var panels = document.querySelectorAll('.tab-panel');

  function activate(tabId) {
    btns.forEach(function(b) { b.classList.toggle('active', b.dataset.tab === tabId); });
    panels.forEach(function(p) { p.classList.toggle('active', p.id === 'panel-' + tabId); });
    history.replaceState(null, '', '#' + tabId);
  }

  btns.forEach(function(b) {
    b.addEventListener('click', function() { activate(b.dataset.tab); });
  });

  // Restore from hash
  var hash = location.hash.replace('#', '');
  var valid = ['base64','jwt','hash','uuid','regex','url','color'];
  if (valid.indexOf(hash) !== -1) { activate(hash); }
})();

// ===== Clipboard =====
function copyText(id) {
  var el = document.getElementById(id);
  var text = el.textContent || el.innerText;
  navigator.clipboard.writeText(text.replace('Copy', '').trim()).then(function() {
    var btn = el.querySelector('.copy-btn');
    if (btn) { btn.textContent = 'Copied!'; setTimeout(function() { btn.textContent = 'Copy'; }, 1200); }
  });
}

// ===== Base64 =====
function b64Encode() {
  var input = document.getElementById('b64-input').value;
  try {
    var result = btoa(unescape(encodeURIComponent(input)));
    setOutput('b64-output', result);
  } catch (e) { setOutput('b64-output', 'Error: ' + e.message); }
}

function b64Decode() {
  var input = document.getElementById('b64-input').value;
  try {
    var result = decodeURIComponent(escape(atob(input.trim())));
    setOutput('b64-output', result);
  } catch (e) { setOutput('b64-output', 'Error: Invalid base64 string'); }
}

// ===== JWT Decoder =====
function decodeJWT() {
  var token = document.getElementById('jwt-input').value.trim();
  var parts = token.split('.');
  if (parts.length !== 3) {
    document.getElementById('jwt-result').innerHTML = '<p style="color:#ef4444">Invalid JWT: expected 3 parts separated by dots.</p>';
    return;
  }
  try {
    var header = JSON.parse(b64UrlDecode(parts[0]));
    var payload = JSON.parse(b64UrlDecode(parts[1]));
    var html = '<div class="jwt-section"><h4>Header</h4><div class="output-box">' + syntaxHL(header) + '</div></div>';
    html += '<div class="jwt-section"><h4>Payload</h4><div class="output-box">' + syntaxHL(payload) + '</div></div>';

    if (payload.exp) {
      var expDate = new Date(payload.exp * 1000);
      var now = new Date();
      var expired = expDate < now;
      html += '<p>Expires: ' + expDate.toISOString() + ' — <span class="' + (expired ? 'jwt-expired' : 'jwt-valid') + '">' + (expired ? 'EXPIRED' : 'VALID') + '</span></p>';
    }
    if (payload.iat) {
      html += '<p style="color:var(--text-muted);font-size:0.85rem;">Issued: ' + new Date(payload.iat * 1000).toISOString() + '</p>';
    }
    document.getElementById('jwt-result').innerHTML = html;
  } catch (e) {
    document.getElementById('jwt-result').innerHTML = '<p style="color:#ef4444">Error decoding JWT: ' + e.message + '</p>';
  }
}

function b64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) { str += '='; }
  return decodeURIComponent(escape(atob(str)));
}

function syntaxHL(obj) {
  var s = JSON.stringify(obj, null, 2);
  return s.replace(/(".*?")(\s*:\s*)/g, '<span style="color:#14B8A6">$1</span>$2')
           .replace(/:\s*(".*?")/g, ': <span style="color:#eab308">$1</span>')
           .replace(/:\s*(\d+)/g, ': <span style="color:#ec4899">$1</span>')
           .replace(/:\s*(true|false|null)/g, ': <span style="color:#a78bfa">$1</span>');
}

// ===== Hash Generator =====
async function generateHashes() {
  var input = document.getElementById('hash-input').value;
  var encoder = new TextEncoder();
  var data = encoder.encode(input);

  var md5 = md5Hash(input);
  var sha1 = await cryptoHash('SHA-1', data);
  var sha256 = await cryptoHash('SHA-256', data);

  var html = '';
  html += hashRow('MD5', md5);
  html += hashRow('SHA-1', sha1);
  html += hashRow('SHA-256', sha256);
  document.getElementById('hash-results').innerHTML = html;
}

async function cryptoHash(algo, data) {
  var buf = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function hashRow(label, value) {
  return '<div class="hash-row"><span class="hash-label">' + label + '</span><span class="hash-value">' + value + '</span></div>';
}

// MD5 implementation (RFC 1321)
function md5Hash(string) {
  function md5cycle(x, k) {
    var a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a,b,c,d,k[0],7,-680876936);d = ff(d,a,b,c,k[1],12,-389564586);c = ff(c,d,a,b,k[2],17,606105819);b = ff(b,c,d,a,k[3],22,-1044525330);
    a = ff(a,b,c,d,k[4],7,-176418897);d = ff(d,a,b,c,k[5],12,1200080426);c = ff(c,d,a,b,k[6],17,-1473231341);b = ff(b,c,d,a,k[7],22,-45705983);
    a = ff(a,b,c,d,k[8],7,1770035416);d = ff(d,a,b,c,k[9],12,-1958414417);c = ff(c,d,a,b,k[10],17,-42063);b = ff(b,c,d,a,k[11],22,-1990404162);
    a = ff(a,b,c,d,k[12],7,1804603682);d = ff(d,a,b,c,k[13],12,-40341101);c = ff(c,d,a,b,k[14],17,-1502002290);b = ff(b,c,d,a,k[15],22,1236535329);
    a = gg(a,b,c,d,k[1],5,-165796510);d = gg(d,a,b,c,k[6],9,-1069501632);c = gg(c,d,a,b,k[11],14,643717713);b = gg(b,c,d,a,k[0],20,-373897302);
    a = gg(a,b,c,d,k[5],5,-701558691);d = gg(d,a,b,c,k[10],9,38016083);c = gg(c,d,a,b,k[15],14,-660478335);b = gg(b,c,d,a,k[4],20,-405537848);
    a = gg(a,b,c,d,k[9],5,568446438);d = gg(d,a,b,c,k[14],9,-1019803690);c = gg(c,d,a,b,k[3],14,-187363961);b = gg(b,c,d,a,k[8],20,1163531501);
    a = gg(a,b,c,d,k[13],5,-1444681467);d = gg(d,a,b,c,k[2],9,-51403784);c = gg(c,d,a,b,k[7],14,1735328473);b = gg(b,c,d,a,k[12],20,-1926607734);
    a = hh(a,b,c,d,k[5],4,-378558);d = hh(d,a,b,c,k[8],11,-2022574463);c = hh(c,d,a,b,k[11],16,1839030562);b = hh(b,c,d,a,k[14],23,-35309556);
    a = hh(a,b,c,d,k[1],4,-1530992060);d = hh(d,a,b,c,k[4],11,1272893353);c = hh(c,d,a,b,k[7],16,-155497632);b = hh(b,c,d,a,k[10],23,-1094730640);
    a = hh(a,b,c,d,k[13],4,681279174);d = hh(d,a,b,c,k[0],11,-358537222);c = hh(c,d,a,b,k[3],16,-722521979);b = hh(b,c,d,a,k[6],23,76029189);
    a = hh(a,b,c,d,k[9],4,-640364487);d = hh(d,a,b,c,k[12],11,-421815835);c = hh(c,d,a,b,k[15],16,530742520);b = hh(b,c,d,a,k[2],23,-995338651);
    a = ii(a,b,c,d,k[0],6,-198630844);d = ii(d,a,b,c,k[7],10,1126891415);c = ii(c,d,a,b,k[14],15,-1416354905);b = ii(b,c,d,a,k[5],21,-57434055);
    a = ii(a,b,c,d,k[12],6,1700485571);d = ii(d,a,b,c,k[3],10,-1894986606);c = ii(c,d,a,b,k[10],15,-1051523);b = ii(b,c,d,a,k[1],21,-2054922799);
    a = ii(a,b,c,d,k[8],6,1873313359);d = ii(d,a,b,c,k[15],10,-30611744);c = ii(c,d,a,b,k[6],15,-1560198380);b = ii(b,c,d,a,k[13],21,1309151649);
    a = ii(a,b,c,d,k[4],6,-145523070);d = ii(d,a,b,c,k[11],10,-1120210379);c = ii(c,d,a,b,k[2],15,718787259);b = ii(b,c,d,a,k[9],21,-343485551);
    x[0] = add32(a,x[0]);x[1] = add32(b,x[1]);x[2] = add32(c,x[2]);x[3] = add32(d,x[3]);
  }
  function cmn(q,a,b,x,s,t){ a = add32(add32(a,q),add32(x,t)); return add32((a<<s)|(a>>>(32-s)),b); }
  function ff(a,b,c,d,x,s,t){ return cmn((b&c)|((~b)&d),a,b,x,s,t); }
  function gg(a,b,c,d,x,s,t){ return cmn((b&d)|(c&(~d)),a,b,x,s,t); }
  function hh(a,b,c,d,x,s,t){ return cmn(b^c^d,a,b,x,s,t); }
  function ii(a,b,c,d,x,s,t){ return cmn(c^(b|(~d)),a,b,x,s,t); }
  function md5blk(s){
    var md5blks=[],i;
    for(i=0;i<64;i+=4){ md5blks[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24); }
    return md5blks;
  }
  function add32(a,b){ return (a+b)&0xFFFFFFFF; }

  var s = unescape(encodeURIComponent(string));
  var n = s.length, state = [1732584193,-271733879,-1732584194,271733878], i;
  for(i=64;i<=n;i+=64){ md5cycle(state,md5blk(s.substring(i-64,i))); }
  s = s.substring(i-64);
  var tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  for(i=0;i<s.length;i++){ tail[i>>2]|=s.charCodeAt(i)<<((i%4)<<3); }
  tail[i>>2]|=0x80<<((i%4)<<3);
  if(i>55){ md5cycle(state,tail); tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; }
  tail[14]=n*8;
  md5cycle(state,tail);

  var hex='';
  for(i=0;i<4;i++){
    for(var j=0;j<4;j++){ hex+=('0'+((state[i]>>(j*8))&255).toString(16)).slice(-2); }
  }
  return hex;
}

// ===== UUID Generator =====
function generateUUIDs() {
  var count = parseInt(document.getElementById('uuid-count').value, 10);
  if (isNaN(count) || count < 1) count = 1;
  if (count > 100) count = 100;
  var uuids = [];
  for (var i = 0; i < count; i++) { uuids.push(uuidv4()); }
  setOutput('uuid-output', uuids.join('\n'));
}

function uuidv4() {
  var bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  var hex = Array.from(bytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}

// ===== Regex Tester =====
function testRegex() {
  var pattern = document.getElementById('regex-pattern').value;
  var testStr = document.getElementById('regex-test').value;
  var flags = '';
  if (document.getElementById('flag-g').checked) flags += 'g';
  if (document.getElementById('flag-i').checked) flags += 'i';
  if (document.getElementById('flag-m').checked) flags += 'm';

  try {
    var re = new RegExp(pattern, flags);
    var matches = [];
    var match;
    if (flags.indexOf('g') !== -1) {
      while ((match = re.exec(testStr)) !== null) {
        matches.push({ index: match.index, length: match[0].length, value: match[0] });
        if (match[0].length === 0) { re.lastIndex++; }
      }
    } else {
      match = re.exec(testStr);
      if (match) { matches.push({ index: match.index, length: match[0].length, value: match[0] }); }
    }

    // Build highlighted string
    var result = '';
    var lastIdx = 0;
    for (var i = 0; i < matches.length; i++) {
      var m = matches[i];
      result += escapeHtml(testStr.slice(lastIdx, m.index));
      result += '<span class="match-highlight">' + escapeHtml(m.value) + '</span>';
      lastIdx = m.index + m.length;
    }
    result += escapeHtml(testStr.slice(lastIdx));

    document.getElementById('regex-output').innerHTML = result || '<span style="color:var(--text-muted)">No matches</span>';
    document.getElementById('regex-match-count').textContent = matches.length + ' match' + (matches.length !== 1 ? 'es' : '') + ' found';
  } catch (e) {
    document.getElementById('regex-output').innerHTML = '<span style="color:#ef4444">' + e.message + '</span>';
    document.getElementById('regex-match-count').textContent = '';
  }
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ===== URL Encoder / Decoder =====
function urlEncode() {
  var input = document.getElementById('url-input').value;
  setOutput('url-output', encodeURIComponent(input));
}

function urlDecode() {
  var input = document.getElementById('url-input').value;
  try { setOutput('url-output', decodeURIComponent(input)); }
  catch (e) { setOutput('url-output', 'Error: Invalid encoded string'); }
}

// ===== Color Converter =====
function colorFromHex() {
  var hex = document.getElementById('color-hex').value.trim().replace('#', '');
  if (hex.length === 3) { hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]; }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return;
  var r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
  document.getElementById('color-rgb').value = r + ', ' + g + ', ' + b;
  var hsl = rgbToHsl(r, g, b);
  document.getElementById('color-hsl').value = hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%';
  document.getElementById('color-swatch').style.background = '#' + hex;
}

function colorFromRGB() {
  var parts = document.getElementById('color-rgb').value.split(',').map(function(s) { return parseInt(s.trim(), 10); });
  if (parts.length !== 3 || parts.some(isNaN)) return;
  var r = clamp(parts[0],0,255), g = clamp(parts[1],0,255), b = clamp(parts[2],0,255);
  var hex = '#' + [r,g,b].map(function(v) { return v.toString(16).padStart(2,'0'); }).join('');
  document.getElementById('color-hex').value = hex;
  var hsl = rgbToHsl(r, g, b);
  document.getElementById('color-hsl').value = hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%';
  document.getElementById('color-swatch').style.background = hex;
}

function colorFromHSL() {
  var raw = document.getElementById('color-hsl').value.replace(/%/g, '');
  var parts = raw.split(',').map(function(s) { return parseFloat(s.trim()); });
  if (parts.length !== 3 || parts.some(isNaN)) return;
  var h = ((parts[0] % 360) + 360) % 360;
  var s = clamp(parts[1], 0, 100) / 100;
  var l = clamp(parts[2], 0, 100) / 100;
  var rgb = hslToRgb(h, s, l);
  document.getElementById('color-rgb').value = rgb[0] + ', ' + rgb[1] + ', ' + rgb[2];
  var hex = '#' + rgb.map(function(v) { return v.toString(16).padStart(2,'0'); }).join('');
  document.getElementById('color-hex').value = hex;
  document.getElementById('color-swatch').style.background = hex;
}

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

// ===== Helpers =====
function setOutput(id, text) {
  var el = document.getElementById(id);
  var copyBtn = el.querySelector('.copy-btn');
  el.textContent = text;
  if (copyBtn) { el.appendChild(copyBtn); }
}
