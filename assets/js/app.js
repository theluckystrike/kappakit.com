/* KappaKit — Component Loader for Tool Pages */
(function() {
  'use strict';

  var container = document.querySelector('.tool-container');
  if (!container) return;

  var component = container.getAttribute('data-component');
  var configRaw = container.getAttribute('data-config');
  var config = {};

  try {
    config = JSON.parse(configRaw);
  } catch (e) {
    console.warn('Invalid data-config JSON:', configRaw);
  }

  var mount = document.getElementById('tool-mount');
  if (!mount) return;

  // Dynamic import of the component
  var scriptPath = '/assets/js/components/' + component + '.js';

  var script = document.createElement('script');
  script.src = scriptPath;
  script.onload = function() {
    // Each component exposes a global init function: KappaKit_<component-name-camel>
    var fnName = 'KappaKit_' + component.replace(/-/g, '_');
    if (typeof window[fnName] === 'function') {
      window[fnName](mount, config);
    } else {
      console.error('Component init function not found:', fnName);
      mount.innerHTML = '<p style="color:#ef4444;">Error loading tool component.</p>';
    }
  };
  script.onerror = function() {
    mount.innerHTML = '<p style="color:#ef4444;">Failed to load tool. Please refresh the page.</p>';
  };
  document.body.appendChild(script);
})();
