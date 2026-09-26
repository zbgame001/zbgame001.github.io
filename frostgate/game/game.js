/*! game.js — 霜降 主逻辑（无依赖） */
(function () {
  'use strict';

  var LEVELS = window.TOY_LEVELS || [];
  var $ = function (id) { return document.getElementById(id); };

  var els = {
    levels: $('levels'), stage: $('stage'), grid: $('grid'),
    hudLevel: $('hudLevel'), hudScore: $('hudScore'), hudTarget: $('hudTarget'),
    hudCombo: $('hudCombo'), hudLife: $('hudLife'),
    btnQuit: $('btnQuit'), btnRestart: $('btnRestart'),
    overlay: $('overlay'), ovIcon: $('ovIcon'), ovTitle: $('ovTitle'),
    ovText: $('ovText'), ovAction: $('ovAction'), ovClose: $('ovClose')
  };

  var G = {
    level: null, score: 0, combo: 0, life: 0,
    running: false, spawnTimer: null, cells: [], won: []
  };
  window.__game = G;             // 自动化测试用的抓手

  /* ---------------------------- 小工具 ---------------------------- */
  function hearted() { return !!(window.toy && window.toy.isUnlocked && window.toy.isUnlocked()); }
  function byId(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i]; return null; }
  function rnd(n) { return Math.floor(Math.random() * n); }

  /* ---------------------------- 关卡列表 ---------------------------- */
  function renderLevels() {
    els.levels.innerHTML = '';
    LEVELS.forEach(function (lv) {
      var unlocked = !lv.gated || hearted();
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lv-card' + (unlocked ? '' : ' locked') + (G.won.indexOf(lv.id) >= 0 ? ' done' : '');
      btn.dataset.level = String(lv.id);
      btn.dataset.locked = unlocked ? '0' : '1';
      btn.innerHTML =
        '<span class="lv-no"></span>' +
        '<span class="lv-name"></span>' +
        '<span class="lv-desc"></span>' +
        '<span class="lv-lock">' + (unlocked ? '▸ 开打' : '♥ 未解锁') + '</span>';
      btn.querySelector('.lv-no').textContent  = (lv.id < 10 ? '0' + lv.id : String(lv.id));
      btn.querySelector('.lv-name').textContent = lv.name;
      btn.querySelector('.lv-desc').textContent = lv.desc;
      btn.addEventListener('click', function () {
        if (!unlocked) { showGate(); return; }
        start(lv);
      });
      els.levels.appendChild(btn);
    });
  }

  /* ---------------------------- 弹层 ---------------------------- */
  var ovAction = null;
  var gateVisible = false;

  function showOverlay(o) {
    els.ovIcon.textContent  = o.icon || '';
    els.ovTitle.textContent = o.title || '';
    els.ovText.textContent  = o.text || '';

    els.ovAction.hidden   = !o.actionLabel;
    els.ovAction.disabled = false;
    els.ovAction.textContent = o.actionLabel || '';
    els.ovClose.hidden    = !o.closeLabel;
    els.ovClose.textContent = o.closeLabel || '';

    ovAction = o.onAction || null;
    els.overlay.hidden = false;
  }
  function hideOverlay() { els.overlay.hidden = true; ovAction = null; gateVisible = false; }

  /* 「点个心」那道门槛 —— SDK 校验 + 界面提示 */
  var gateWaiting = false;   // 引导过一次后，主按钮变成「手动再查一次」

  function unlockLevel2() {
    hideOverlay();
    renderLevels();
    /* 不管当时在不在玩第一关，都要真的切过去 */
    start(byId(2) || LEVELS[LEVELS.length - 1]);
  }

  function showGate() {
    gateVisible = true;
    gateWaiting = false;
    showOverlay({
      icon: '🔒',
      title: '第二关还没解锁',
      text: '给这个项目点个心（GitHub 的 star），就能开「极寒」。点完回到这里会自动检查。',
      actionLabel: window.toy ? window.toy.actionLabel : '♥ 去点个心',
      closeLabel: '先玩第一关',
      onAction: function () {
        /* 再点一次 = 手动再查一次。什么时候查由用户决定，SDK 不轮询。 */
        if (gateWaiting) {
          els.ovText.textContent = '正在检查…';
          gateway();
          return;
        }
        gateWaiting = true;
        els.ovText.textContent = '已打开仓库页 · 点完心回到这里会自动检查，也可以直接点下面按钮手动查。';
        els.ovAction.textContent = '✓ 我已点过心，再查一次';
        if (window.toy) window.toy.requestUnlock();   // 成功了会发 unlocked 事件
      }
    });
  }

  function gateway() {
    window.toy.checkUnlock().then(function (r) {
      if (r.unlocked) { unlockLevel2(); return; }
      els.ovText.textContent = (r.reason === 'api-unreachable')
        ? '查不到星数（网络或接口限流），过一会儿再点一次。'
        : '还没看到星数变化。确认点过心后稍等几秒，再点一次。';
    });
  }

  /* ---------------------------- 生命周期 ---------------------------- */
  function start(lv) {
    stop();
    hideOverlay();
    G.level = lv; G.score = 0; G.combo = 0; G.life = lv.life || 3; G.running = true;
    els.stage.hidden = false;
    els.levels.hidden = true;
    els.hudLevel.textContent = lv.id;
    els.hudTarget.textContent = lv.target;
    buildGrid(lv);
    updateHud();
    G.spawnTimer = setInterval(function () { spawn(lv); }, lv.spawnMs);
    spawn(lv);
  }

  function stop() {
    if (G.spawnTimer) { clearInterval(G.spawnTimer); G.spawnTimer = null; }
    G.running = false;
    G.cells.forEach(function (s) { if (s.timer) { clearTimeout(s.timer); s.timer = null; } });
  }

  function quit() {
    stop();
    hideOverlay();
    els.stage.hidden = true;
    els.levels.hidden = false;
    renderLevels();
  }

  /* ---------------------------- 棋盘 ---------------------------- */
  function buildGrid(lv) {
    els.grid.style.gridTemplateColumns = 'repeat(' + lv.grid + ',1fr)';
    els.grid.innerHTML = '';
    G.cells = [];
    for (var i = 0; i < lv.grid * lv.grid; i++) {
      let c = document.createElement('div');
      c.className = 'cell';
      c.dataset.idx = String(i);
      /* 必须 let：var 是函数作用域，所有回调会共用同一个绑定，
         点任何格子都会落到最后一格上 */
      let st = { idx: i, el: c, kind: null, timer: null };
      c.addEventListener('click', function () { hit(st); });
      els.grid.appendChild(c);
      G.cells.push(st);
    }
  }

  function liveHot() {
    var n = 0;
    G.cells.forEach(function (s) { if (s.kind === 'hot') n++; });
    return n;
  }

  function spawn(lv) {
    if (!G.running) return;
    var free = G.cells.filter(function (s) { return !s.kind; });
    if (!free.length) return;
    var s = free[rnd(free.length)];
    var wantHot = (lv.hazards || 0) > 0 && liveHot() < lv.hazards && Math.random() < 0.3;
    plant(s, wantHot ? 'hot' : 'ice', lv.lifeMs);
  }

  function plant(s, kind, lifeMs) {
    s.kind = kind;
    s.el.className = 'cell on' + (kind === 'hot' ? ' hot' : '');
    s.el.innerHTML = '<i>' + (kind === 'hot' ? '🔥' : '❄') + '</i>';
    s.timer = setTimeout(function () { expire(s); }, lifeMs);
  }

  function clearCell(s) {
    if (s.timer) { clearTimeout(s.timer); s.timer = null; }
    s.kind = null;
  }

  function hit(s) {
    if (!G.running || !s.kind) return;
    var kind = s.kind;
    clearCell(s);

    if (kind === 'hot') {                       // 踩到火苗：扣命
      G.combo = 0; G.life--;
      s.el.className = 'cell bad';
      setTimeout(function () { s.el.className = 'cell'; s.el.innerHTML = ''; }, 300);
      updateHud();
      if (G.life <= 0) lose();
      return;
    }

    G.score++; G.combo++;                        // 冰晶：加分
    s.el.classList.add('pop');
    setTimeout(function () {
      s.el.className = 'cell';
      s.el.innerHTML = '';
    }, 150);
    updateHud();
    if (G.score >= G.level.target) win();
  }

  function expire(s) {                            // 冰晶自己化了：扣命
    if (!s.kind) return;
    var kind = s.kind;
    clearCell(s);
    s.el.className = 'cell';
    s.el.innerHTML = '';
    if (kind === 'ice') {
      G.combo = 0; G.life--;
      updateHud();
      if (G.life <= 0) lose();
    }
  }

  /* ---------------------------- HUD ---------------------------- */
  function updateHud() {
    G.score = Math.max(0, G.score);
    els.hudScore.textContent = G.score;
    els.hudCombo.textContent = G.combo;
    els.hudLife.textContent  = Math.max(0, G.life);
    els.hudCombo.parentNode.classList.toggle('flash', G.combo > 0 && G.combo % 5 === 0);
  }

  /* ---------------------------- 结算 ---------------------------- */
  function win() {
    var lv = G.level;
    stop();
    if (G.won.indexOf(lv.id) < 0) G.won.push(lv.id);
    var last = (lv.id === LEVELS[LEVELS.length - 1].id);
    showOverlay({
      icon: last ? '🏆' : '✨',
      title: last ? '两关都过了' : '「' + lv.name + '」过了',
      text: last
        ? '得分 ' + G.score + '。后面的关卡写在 game/levels.js 里，想加就加。'
        : '得分 ' + G.score + '。下一关在等着。',
      actionLabel: '再来一次',
      closeLabel: '返回关卡',
      onAction: function () { start(lv); }
    });
    renderLevels();
  }

  function lose() {
    stop();
    showOverlay({
      icon: '🧊',
      title: '被冻住了',
      text: '得分 ' + G.score + ' / ' + G.level.target + '。再来一把？',
      actionLabel: '重新开始',
      closeLabel: '返回关卡',
      onAction: function () { start(G.level); }
    });
  }

  /* ---------------------------- 绑定 ---------------------------- */
  els.ovAction.addEventListener('click', function () { if (ovAction) ovAction(); });
  els.ovClose.addEventListener('click', function () {
    var wasGate = gateVisible;
    hideOverlay();
    if (wasGate) { els.stage.hidden = true; els.levels.hidden = false; renderLevels(); }
  });
  els.btnQuit.addEventListener('click', quit);
  els.btnRestart.addEventListener('click', function () { if (G.level) start(G.level); });

  if (window.toy && window.toy.on) {
    window.toy.on('unlocked', function () {
      renderLevels();
      if (gateVisible) unlockLevel2();
    });
    window.toy.on('failed', function () {
      if (gateVisible && !els.overlay.hidden) {
        els.ovText.textContent = '还没看到星数变化。点完心后稍等几秒，再点一次「我已点过心」。';
      }
    });
  }

  renderLevels();
})();
