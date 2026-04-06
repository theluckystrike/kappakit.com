/* KappaKit — Encoder/Decoder Component */
/* Supports: base64, url, html, base64-image */

window.KappaKit_encoder_decoder = function(mount, config) {
  var type = config.type || 'base64';
  var isImage = type === 'base64-image';

  var titles = {
    'base64': 'Base64 Encode / Decode',
    'url': 'URL Encode / Decode',
    'html': 'HTML Entity Encode / Decode',
    'base64-image': 'Base64 Image Encoder / Decoder'
  };

  var html = '<h3>' + (titles[type] || 'Encoder / Decoder') + '</h3>';

  if (isImage) {
    html += '<div style="margin-bottom:1rem;">';
    html += '<label for="img-file">Upload Image</label>';
    html += '<input type="file" id="img-file" accept="image/*" style="margin-bottom:0.5rem;">';
    html += '</div>';
    html += '<label for="enc-input">Or paste Base64 data URI</label>';
    html += '<textarea id="enc-input" placeholder="data:image/png;base64,iVBOR..."></textarea>';
    html += '<div class="actions" style="margin:0.75rem 0;">';
    html += '<button class="btn" id="enc-encode">Encode Image</button>';
    html += '<button class="btn btn-outline" id="enc-decode">Decode to Image</button>';
    html += '<button class="btn btn-outline" id="enc-clear">Clear</button>';
    html += '</div>';
    html += '<label>Output</label>';
    html += '<div class="output-box" id="enc-output" style="min-height:60px;overflow:auto;"><button class="copy-btn" id="copy-out">Copy</button></div>';
    html += '<div id="img-preview" style="margin-top:1rem;"></div>';
  } else {
    html += '<div class="row">';
    html += '<div>';
    html += '<label for="enc-input">Input</label>';
    html += '<textarea id="enc-input" placeholder="Enter text..."></textarea>';
    html += '</div>';
    html += '<div>';
    html += '<label>Output</label>';
    html += '<div class="output-box" id="enc-output" style="min-height:80px;"><button class="copy-btn" id="copy-out">Copy</button></div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="actions">';
    html += '<button class="btn" id="enc-encode">Encode</button>';
    html += '<button class="btn btn-outline" id="enc-decode">Decode</button>';
    html += '<button class="btn btn-outline" id="enc-clear">Clear</button>';
    html += '</div>';
  }

  mount.innerHTML = html;

  var input = document.getElementById('enc-input');
  var encodeBtn = document.getElementById('enc-encode');
  var decodeBtn = document.getElementById('enc-decode');
  var clearBtn = document.getElementById('enc-clear');
  var copyBtn = document.getElementById('copy-out');

  encodeBtn.addEventListener('click', function() { doEncode(); });
  decodeBtn.addEventListener('click', function() { doDecode(); });
  clearBtn.addEventListener('click', function() {
    input.value = '';
    setBox('enc-output', '');
    var preview = document.getElementById('img-preview');
    if (preview) preview.innerHTML = '';
  });

  copyBtn.addEventListener('click', function() {
    var el = document.getElementById('enc-output');
    var text = el.textContent.replace('Copy', '').trim();
    navigator.clipboard.writeText(text).then(function() {
      copyBtn.textContent = 'Copied!';
      setTimeout(function() { copyBtn.textContent = 'Copy'; }, 1200);
    });
  });

  // Image file upload
  if (isImage) {
    var fileInput = document.getElementById('img-file');
    fileInput.addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        var dataUri = ev.target.result;
        input.value = dataUri;
        setBox('enc-output', dataUri);
        showPreview(dataUri);
      };
      reader.readAsDataURL(file);
    });
  }

  function doEncode() {
    var text = input.value;
    if (!text) return;

    try {
      var result = '';
      switch (type) {
        case 'base64':
          result = btoa(unescape(encodeURIComponent(text)));
          break;
        case 'url':
          result = encodeURIComponent(text);
          break;
        case 'html':
          result = htmlEntityEncode(text);
          break;
        case 'base64-image':
          // If already a data URI, just show it
          if (text.indexOf('data:') === 0) {
            result = text;
          } else {
            result = 'data:text/plain;base64,' + btoa(unescape(encodeURIComponent(text)));
          }
          showPreview(result);
          break;
      }
      setBox('enc-output', result);
    } catch (e) {
      setBox('enc-output', 'Error: ' + e.message);
    }
  }

  function doDecode() {
    var text = input.value.trim();
    if (!text) return;

    try {
      var result = '';
      switch (type) {
        case 'base64':
          result = decodeURIComponent(escape(atob(text)));
          break;
        case 'url':
          result = decodeURIComponent(text);
          break;
        case 'html':
          result = htmlEntityDecode(text);
          break;
        case 'base64-image':
          // Show image preview from base64
          if (text.indexOf('data:') === 0) {
            showPreview(text);
            result = '[Image preview shown below]';
          } else {
            // Try to decode as raw base64
            result = decodeURIComponent(escape(atob(text)));
          }
          break;
      }
      setBox('enc-output', result);
    } catch (e) {
      setBox('enc-output', 'Error: Invalid input — ' + e.message);
    }
  }

  function htmlEntityEncode(str) {
    var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, function(ch) { return map[ch]; });
  }

  function htmlEntityDecode(str) {
    var el = document.createElement('textarea');
    el.innerHTML = str;
    return el.value;
  }

  function showPreview(dataUri) {
    var preview = document.getElementById('img-preview');
    if (!preview) return;
    if (dataUri && dataUri.indexOf('data:image') === 0) {
      preview.innerHTML = '<img src="' + dataUri + '" style="max-width:100%;max-height:300px;border:1px solid var(--border);border-radius:var(--radius);" alt="Preview">';
    } else {
      preview.innerHTML = '';
    }
  }

  function setBox(id, text) {
    var el = document.getElementById(id);
    if (!el) return;
    var btn = el.querySelector('.copy-btn');
    el.textContent = text;
    if (btn) el.appendChild(btn);
  }
};
