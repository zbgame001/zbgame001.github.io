/* 日间 / 夜间切换：提前设置主题，再在标题栏插入按钮 */
(function () {
  var KEY = 'zbg-theme';
  var root = document.documentElement;
  var saved = null;

  try { saved = localStorage.getItem(KEY); } catch (e) {}

  var theme = saved;
  try {
    var qp = new URLSearchParams(location.search).get('theme');
    if (qp === 'dark' || qp === 'light') theme = qp;
  } catch (e) {}

  if (!theme) {
    theme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';
  }

  root.setAttribute('data-theme', theme);

  function applyMeta(t) {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#0f1115' : '#ffffff');
  }
  applyMeta(theme);

  var SUN = '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.7"/>' +
    '<path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>' +
    '</svg>';

  var MOON = '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
    '</svg>';

  function addButton() {
    var actions = document.querySelector('.header-actions');
    if (!actions || actions.querySelector('.theme-btn')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-btn';
    btn.setAttribute('aria-label', theme === 'dark' ? '切换到日间模式' : '切换到夜间模式');
    btn.innerHTML = SUN + MOON;
    actions.insertBefore(btn, actions.firstChild);

    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) {}
      applyMeta(next);
      btn.setAttribute('aria-label', next === 'dark' ? '切换到日间模式' : '切换到夜间模式');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
  } else {
    addButton();
  }
})();
