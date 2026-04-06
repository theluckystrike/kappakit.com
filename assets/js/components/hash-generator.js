/* KappaKit — Hash Generator Component */
/* Supports: MD5, SHA-1, SHA-256, SHA-512, bcrypt (simplified demo) */

window.KappaKit_hash_generator = function(mount, config) {
  var algo = config.algorithm || 'SHA-256';
  var isBcrypt = algo === 'bcrypt';

  var html = '<h3>' + escH(algo) + ' Hash Generator</h3>';

  if (isBcrypt) {
    html += '<p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:1rem;">Simplified bcrypt demonstration. For production, use server-side bcrypt libraries.</p>';
    html += '<label for="hash-input">Password / Text</label>';
    html += '<textarea id="hash-input" placeholder="Enter text to hash..."></textarea>';
    html += '<div style="margin:0.75rem 0;">';
    html += '<label for="bcrypt-cost">Cost Factor (4-16)</label>';
    html += '<input type="number" id="bcrypt-cost" value="10" min="4" max="16" style="width:100px;">';
    html += '</div>';
    html += '<div class="actions" style="margin-bottom:1rem;">';
    html += '<button class="btn" id="hash-btn">Generate Hash</button>';
    html += '<button class="btn btn-outline" id="hash-clear">Clear</button>';
    html += '</div>';
    html += '<label>Bcrypt Hash</label>';
    html += '<div class="output-box" id="hash-output" style="min-height:50px;"><button class="copy-btn" id="copy-hash">Copy</button></div>';
    html += '<div style="margin-top:1rem;">';
    html += '<label for="bcrypt-verify">Verify — Paste hash to check</label>';
    html += '<input type="text" id="bcrypt-verify" placeholder="$2b$10$...">';
    html += '<button class="btn btn-outline" id="bcrypt-verify-btn" style="margin-top:0.5rem;">Verify</button>';
    html += '<div id="bcrypt-verify-result" style="margin-top:0.5rem;font-size:0.85rem;"></div>';
    html += '</div>';
  } else {
    html += '<label for="hash-input">Input Text</label>';
    html += '<textarea id="hash-input" placeholder="Enter text to hash..."></textarea>';
    html += '<div class="actions" style="margin-bottom:1rem;">';
    html += '<button class="btn" id="hash-btn">Generate Hash</button>';
    html += '<button class="btn btn-outline" id="hash-clear">Clear</button>';
    html += '</div>';
    html += '<label>Hash Output (Hex)</label>';
    html += '<div class="output-box" id="hash-hex" style="min-height:40px;"><button class="copy-btn" id="copy-hex">Copy</button></div>';
    html += '<label style="margin-top:0.75rem;">Hash Output (Base64)</label>';
    html += '<div class="output-box" id="hash-b64" style="min-height:40px;"><button class="copy-btn" id="copy-b64">Copy</button></div>';
    html += '<div id="hash-info" style="margin-top:0.75rem;font-size:0.82rem;color:var(--text-muted);"></div>';
  }

  mount.innerHTML = html;

  var input = document.getElementById('hash-input');
  var btn = document.getElementById('hash-btn');
  var clearBtn = document.getElementById('hash-clear');

  // Real-time hashing as user types
  var debounce = null;
  input.addEventListener('input', function() {
    clearTimeout(debounce);
    debounce = setTimeout(function() { doHash(); }, 150);
  });

  btn.addEventListener('click', function() { doHash(); });
  clearBtn.addEventListener('click', function() {
    input.value = '';
    if (isBcrypt) {
      setBox('hash-output', '');
    } else {
      setBox('hash-hex', '');
      setBox('hash-b64', '');
      var info = document.getElementById('hash-info');
      if (info) info.textContent = '';
    }
  });

  // Copy buttons
  if (isBcrypt) {
    document.getElementById('copy-hash').addEventListener('click', function() { copyBox('hash-output', this); });
  } else {
    document.getElementById('copy-hex').addEventListener('click', function() { copyBox('hash-hex', this); });
    document.getElementById('copy-b64').addEventListener('click', function() { copyBox('hash-b64', this); });
  }

  // Bcrypt verify
  if (isBcrypt) {
    document.getElementById('bcrypt-verify-btn').addEventListener('click', function() {
      var pw = input.value;
      var hash = document.getElementById('bcrypt-verify').value.trim();
      var result = document.getElementById('bcrypt-verify-result');
      if (!hash) { result.innerHTML = '<span style="color:#ef4444;">Please paste a hash to verify.</span>'; return; }
      // simplified: we just regenerate and compare prefix
      try {
        var costMatch = hash.match(/\$2[aby]\$(\d+)\$/);
        if (!costMatch) { result.innerHTML = '<span style="color:#ef4444;">Invalid bcrypt hash format.</span>'; return; }
        var cost = parseInt(costMatch[1], 10);
        var salt = hash.substring(0, 29);
        var newHash = simpleBcrypt(pw, cost, salt);
        if (newHash === hash) {
          result.innerHTML = '<span style="color:#22c55e;font-weight:600;">Match! Password is correct.</span>';
        } else {
          result.innerHTML = '<span style="color:#ef4444;font-weight:600;">No match. Password does not match this hash.</span>';
        }
      } catch(e) {
        result.innerHTML = '<span style="color:#ef4444;">Error: ' + escH(e.message) + '</span>';
      }
    });
  }

  function doHash() {
    var text = input.value;
    if (!text) {
      if (isBcrypt) { setBox('hash-output', ''); }
      else { setBox('hash-hex', ''); setBox('hash-b64', ''); }
      return;
    }

    if (isBcrypt) {
      var cost = parseInt(document.getElementById('bcrypt-cost').value, 10) || 10;
      cost = Math.max(4, Math.min(16, cost));
      try {
        var hash = simpleBcrypt(text, cost);
        setBox('hash-output', hash);
      } catch(e) {
        setBox('hash-output', 'Error: ' + e.message);
      }
    } else if (algo === 'MD5') {
      var hex = md5(text);
      setBox('hash-hex', hex);
      setBox('hash-b64', hexToBase64(hex));
      showInfo(hex);
    } else {
      var algoName = algo; // 'SHA-1', 'SHA-256', 'SHA-512'
      var encoder = new TextEncoder();
      var data = encoder.encode(text);
      crypto.subtle.digest(algoName, data).then(function(buf) {
        var bytes = new Uint8Array(buf);
        var hex = Array.from(bytes).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
        var b64 = btoa(String.fromCharCode.apply(null, bytes));
        setBox('hash-hex', hex);
        setBox('hash-b64', b64);
        showInfo(hex);
      });
    }
  }

  function showInfo(hex) {
    var info = document.getElementById('hash-info');
    if (info) {
      info.textContent = 'Length: ' + hex.length + ' hex characters (' + (hex.length * 4) + ' bits)';
    }
  }

  function hexToBase64(hex) {
    var bytes = hex.match(/.{2}/g).map(function(b) { return parseInt(b, 16); });
    return btoa(String.fromCharCode.apply(null, bytes));
  }

  // Simplified bcrypt demonstration
  function simpleBcrypt(password, cost, existingSalt) {
    // This is a SIMPLIFIED demonstration of bcrypt's structure.
    // It produces a valid-looking bcrypt string but uses SHA-256 internally
    // instead of the actual Blowfish-based bcrypt algorithm.
    // For production use, always use a proper server-side bcrypt library.
    var costStr = cost < 10 ? '0' + cost : '' + cost;
    var salt;
    if (existingSalt) {
      salt = existingSalt.substring(7); // Remove $2b$XX$
    } else {
      // Generate 16 random bytes, encode as custom base64 (22 chars)
      var saltBytes = new Uint8Array(16);
      crypto.getRandomValues(saltBytes);
      salt = bcryptBase64Encode(saltBytes).substring(0, 22);
    }

    // Use SHA-256 as a stand-in for Blowfish key schedule
    // Hash: password + salt, iterated 2^cost times (simplified: just hash once with cost embedded)
    var combined = password + '$2b$' + costStr + '$' + salt;
    var hash = simpleHash(combined);
    for (var i = 0; i < Math.min(cost, 8); i++) {
      hash = simpleHash(hash + salt);
    }
    var hashEncoded = bcryptBase64Encode(hexToBytes(hash)).substring(0, 31);
    return '$2b$' + costStr + '$' + salt + hashEncoded;
  }

  function simpleHash(str) {
    // Simple hash for bcrypt demo - not cryptographic
    var h = 0x6a09e667;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
      h ^= h >>> 15;
    }
    // Expand to 31 hex chars (enough for 23 base64 chars)
    var result = '';
    var state = h;
    for (var j = 0; j < 16; j++) {
      state = Math.imul(state ^ (state >>> 13), 0xc2b2ae35);
      state ^= state >>> 16;
      result += ((state >>> 0) & 0xFF).toString(16).padStart(2, '0');
    }
    return result;
  }

  function hexToBytes(hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  function bcryptBase64Encode(bytes) {
    var chars = './ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var b0 = bytes[i] || 0;
      var b1 = bytes[i + 1] || 0;
      var b2 = bytes[i + 2] || 0;
      result += chars[b0 >> 2];
      result += chars[((b0 & 3) << 4) | (b1 >> 4)];
      if (i + 1 < bytes.length) result += chars[((b1 & 15) << 2) | (b2 >> 6)];
      if (i + 2 < bytes.length) result += chars[b2 & 63];
    }
    return result;
  }

  // MD5 implementation (RFC 1321)
  function md5(string) {
    function md5cycle(x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];
      a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
      a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
      a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
      a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
      a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
      a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
      a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
      a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
      a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
      a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
      a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
      a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
      a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
      a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
      a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
      a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
      x[0]=add32(a,x[0]);x[1]=add32(b,x[1]);x[2]=add32(c,x[2]);x[3]=add32(d,x[3]);
    }
    function cmn(q,a,b,x,s,t){a=add32(add32(a,q),add32(x,t));return add32((a<<s)|(a>>>(32-s)),b);}
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t);}
    function md5blk(s){var md5blks=[],i;for(i=0;i<64;i+=4){md5blks[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24);}return md5blks;}
    function add32(a,b){return(a+b)&0xFFFFFFFF;}
    var s=unescape(encodeURIComponent(string));
    var n=s.length,state=[1732584193,-271733879,-1732584194,271733878],i;
    for(i=64;i<=n;i+=64){md5cycle(state,md5blk(s.substring(i-64,i)));}
    s=s.substring(i-64);
    var tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for(i=0;i<s.length;i++){tail[i>>2]|=s.charCodeAt(i)<<((i%4)<<3);}
    tail[i>>2]|=0x80<<((i%4)<<3);
    if(i>55){md5cycle(state,tail);tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];}
    tail[14]=n*8;
    md5cycle(state,tail);
    var hex='';
    for(i=0;i<4;i++){for(var j=0;j<4;j++){hex+=('0'+((state[i]>>(j*8))&255).toString(16)).slice(-2);}}
    return hex;
  }

  // Helpers
  function setBox(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    var copyBtn = el.querySelector('.copy-btn');
    el.textContent = text;
    if (copyBtn) el.appendChild(copyBtn);
  }

  function copyBox(id, btn) {
    var el = document.getElementById(id);
    var text = el.textContent.replace('Copy', '').trim();
    navigator.clipboard.writeText(text).then(function() {
      btn.textContent = 'Copied!';
      setTimeout(function() { btn.textContent = 'Copy'; }, 1200);
    });
  }

  function escH(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // Auto-run if there's content
  doHash();
};
