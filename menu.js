/* 全屏下拉菜单：绑定页面右上角 .menu-btn */
(function () {
  var btn = document.querySelector('.menu-btn');
  if (!btn) return;

  var ICON_MENU = btn.innerHTML;
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  var QUN_PRO = 'https://pd.qq.com/qqweb/qunpro/share?_wv=3&_wwv=128&appChannel=share&attaContentID=6de15c0e97984a3dbe9ff23ade5494b9&biz=ka&businessType=9&from=246610&inviteCode=2OiO9WfJf8o&mainSourceId=share&subSourceId=others&b=9';
  var QUN_BUG = QUN_PRO + '&subc=743238259&type=7';
  var QUN_SUG = QUN_PRO + '&subc=743250110&type=7';
  var QUN_GROUP = 'https://qun.qq.com/universal-share/share?ac=1&authKey=%2B7AABKnShfTBWOBonBym6D%2BCqnpGqFVQ%2F9AaOKe%2BJmp%2F2RMv5PxV4gkCUAZI4OIY&busi_data=eyJncm91cENvZGUiOiI4MTYwNjgwNDMiLCJ0b2tlbiI6InNMb0wyOGQyL1FHdnhEaXZ0Qk5IaHFTWUN0YWhGd3R0djZTSHExMU1sR0JlTDlySllnZXBSQ09sU3Vvb3lUOW4iLCJ1aW4iOiIxODIwNzIxMjUzIn0%3D&data=sy6ZKQZO4KDnPTTYBb2nv_Xy3J9GVMpUM0L9NVsRcAuiwxvD6519glSflTZbxVxIbIZ95JL56T0ZByEbh7mOVQ&svctype=4&tempid=h5_group_info';

  var items = [
    { text: '主播模拟器', href: './' },
    { text: '主播模拟器历史版本', href: './history.html' },
    { text: '主播mod制作', href: './mod.html' },
    { text: '主播mod制作历史版本', href: './mod-history.html' },
    { text: '教程', href: './tutorial.html' },
    { text: 'QQ频道', href: QUN_PRO, external: true },
    { text: 'bug反馈', href: QUN_BUG, external: true },
    { text: '建议', href: QUN_SUG, external: true },
    { text: '加入QQ群', href: QUN_GROUP, external: true }
  ];

  var overlay = document.createElement('div');
  overlay.className = 'menu-overlay';
  overlay.id = 'siteMenu';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', '全屏菜单');

  var nav = document.createElement('nav');
  nav.className = 'menu-list';

  items.forEach(function (it) {
    var a = document.createElement('a');
    a.className = 'menu-item';
    a.href = it.href;
    if (it.external) {
      a.target = '_blank';
      a.rel = 'noopener';
    }

    var label = document.createElement('span');
    label.textContent = it.text;
    a.appendChild(label);

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'chev');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M9 6l6 6-6 6');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
    a.appendChild(svg);

    nav.appendChild(a);
  });

  overlay.appendChild(nav);
  document.body.appendChild(overlay);

  var isOpen = false;

  function setOpen(next) {
    if (next === isOpen) return;
    isOpen = next;

    overlay.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
    btn.classList.toggle('is-open', isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    btn.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
    btn.innerHTML = isOpen ? ICON_CLOSE : ICON_MENU;

    if (isOpen) {
      /* 不自动抢占焦点，避免出现整行焦点框；键盘用户可 Tab 进入 */
    } else {
      btn.focus({ preventScroll: true });
    }
  }

  btn.removeAttribute('aria-disabled');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', '打开菜单');
  btn.setAttribute('aria-controls', 'siteMenu');

  btn.addEventListener('click', function (e) {
    e.preventDefault();
    setOpen(!isOpen);
  });

  overlay.addEventListener('click', function (e) {
    if (e.target.closest('.menu-item')) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) setOpen(false);
  });

  /* 支持 #menu 直接打开，便于分享与验收 */
  if (location.hash === '#menu') setOpen(true);
})();
