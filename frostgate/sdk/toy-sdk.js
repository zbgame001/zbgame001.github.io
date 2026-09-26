/*!
 * toy-sdk.js — 「点个心解锁」迷你 SDK  v1.1.0
 * ------------------------------------------------------------------
 * 一道纯静态的解锁门槛：访客给仓库点个星（点个心）才放行某一关。
 *
 * 校验方式（v1.1 改掉的做法）：**不轮询**。
 *   只在两个时刻各查一次：
 *     ① 用户点「去点个心」——记下当时的星数基线，然后开仓库页；
 *     ② 用户回到这个页面（visibilitychange / focus / pageshow）——查一次，星数涨了就开。
 *   外加一个手动入口 toy.checkUnlock()，给界面上「我已点过心，再查一次」用。
 *   v1.0 那种 setInterval 轮询在后台标签页会被浏览器节流到 1 次/分钟，等于不刷新，
 *   所以点完星回来看不到解锁 —— 不是「随时刷新」，而是根本不刷。
 *
 * 对外接口（v1.1 起不再沿用 B 站 toy-sdk 的命名）：
 *   toy.isUnlocked()      同步，读本地缓存（渲染关卡列表用）
 *   toy.checkUnlock()     按需查一次 -> Promise<{unlocked, reason}>
 *   toy.requestUnlock()   引导去点心 + 开始校验 -> Promise<bool>
 *   toy.lockState()       'locked' | 'checking' | 'unlocked' | 'failed'
 *   toy.on('checking' | 'unlocked' | 'failed' | 'reset', fn)
 *   toy.actionLabel       按钮上那句文案
 *   toy.heartUrl          要去点心的地址
 *   toy.saveState(obj) / toy.loadState(keys) / toy.clearState(keys)   本地存档
 *   toy.getViewer()       访客信息（静态站没有登录态）
 *   toy.openLink(url)     跳转
 *   toy.resetUnlock()     调试用：清掉本地解锁状态
 */
(function (global) {
  'use strict';

  var CFG     = global.TOY_CONFIG || {};
  var PROJECT = CFG.project || {};
  var HEART   = CFG.heart || {};
  var NS      = CFG.storageKey || 'toy-heart-gate:v1';

  var HEART_URL = 'https://github.com/' + (PROJECT.owner || '') + '/' + (PROJECT.repo || '');

  /* ------------------------------ 事件 ------------------------------ */
  var listeners = {};
  function on(evt, fn) {
    (listeners[evt] = listeners[evt] || []).push(fn);
    return function () { off(evt, fn); };
  }
  function off(evt, fn) {
    var a = listeners[evt]; if (!a) return;
    var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1);
  }
  function emit(evt, payload) {
    (listeners[evt] || []).slice().forEach(function (fn) {
      try { fn(payload); } catch (e) { /* 监听器自己抛的错不连累 SDK */ }
    });
  }

  /* ------------------------------ 存档 ------------------------------ */
  function lsGet(k) { try { return global.localStorage.getItem(NS + ':' + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { global.localStorage.setItem(NS + ':' + k, String(v)); } catch (e) {} }
  function lsDel(k) { try { global.localStorage.removeItem(NS + ':' + k); } catch (e) {} }

  /* ------------------------------ 门槛 ------------------------------ */
  var gate = {
    state: 'locked',
    cache: null,          // 本地解锁缓存
    baseline: null,       // 点亮「去点个心」那一刻的星数
    armed: false,         // 「回到页面就查一次」的监听挂没挂
    timeoutTimer: null,
    settleTimer: null,
    waiters: [],          // 等 requestUnlock() 结果的 resolvers

    isUnlocked: function () {
      if (gate.cache === null) gate.cache = lsGet('unlocked') === '1';
      return gate.cache;
    },

    /* 查一次仓库星数；静态站没有登录态，只能看总数 */
    stars: function () {
      if (!PROJECT.owner || !PROJECT.repo) return Promise.resolve(null);
      var url = 'https://api.github.com/repos/' + PROJECT.owner + '/' + PROJECT.repo;
      return global.fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('api ' + r.status)); })
        .then(function (j) { return typeof j.stargazers_count === 'number' ? j.stargazers_count : null; })
        .catch(function () { return null; });
    },

    /* 按需查一次 —— 不是轮询 */
    check: function () {
      if (gate.isUnlocked()) return Promise.resolve({ unlocked: true, reason: 'cached' });
      if ((HEART.mode || 'star') === 'soft') return Promise.resolve(gate.mark('soft'));

      if (gate.baseline === null) {
        /* 还没记过基线（用户没点过按钮），先记一次，别急着判死 */
        return gate.stars().then(function (n) {
          if (typeof n === 'number') gate.baseline = n;
          return { unlocked: false, reason: 'no-baseline' };
        });
      }

      return gate.stars().then(function (n) {
        if (typeof n !== 'number') {
          gate.state = 'locked';
          return { unlocked: false, reason: 'api-unreachable' };
        }
        if (n > gate.baseline) return gate.mark('star+');
        gate.state = 'locked';
        return { unlocked: false, reason: 'not-starred', stars: n, baseline: gate.baseline };
      });
    },

    /* 用户点「去点个心」 */
    request: function () {
      if (gate.isUnlocked()) { emit('unlocked', { reason: 'cached' }); return Promise.resolve(true); }
      if ((HEART.mode || 'star') === 'soft') return Promise.resolve(!!gate.mark('soft').unlocked);

      gate.state = 'checking';
      emit('checking', { url: HEART_URL });

      return gate.stars().then(function (n) {
        if (typeof n === 'number') gate.baseline = n;   // 记基线：这一刻还没算他点的星
        try { global.open(HEART_URL, '_blank', 'noopener,noreferrer'); } catch (e) {}
        gate.arm();

        var timeoutMs = HEART.timeoutMs || 120000;
        gate.timeoutTimer = setTimeout(function () { gate.fail('timeout'); }, timeoutMs);

        return new Promise(function (resolve) { gate.waiters.push(resolve); });
      });
    },

    /* 挂了「回到页面就查一次」。幂等，只挂一次。 */
    arm: function () {
      if (gate.armed) return;
      gate.armed = true;

      function onReturn() {
        if (gate.state !== 'checking') return;
        if (global.document && global.document.visibilityState === 'hidden') return;
        /* 给 GitHub 一点结算时间，再查这一次 */
        clearTimeout(gate.settleTimer);
        gate.settleTimer = setTimeout(function () { gate.check(); }, 2500);
      }
      global.addEventListener('visibilitychange', onReturn, false);
      global.addEventListener('focus', onReturn, false);
      global.addEventListener('pageshow', onReturn, false);
    },

    /* 通过校验 */
    mark: function (reason) {
      gate.cache = true;
      gate.state = 'unlocked';
      lsSet('unlocked', '1');
      clearTimeout(gate.timeoutTimer); gate.timeoutTimer = null;
      clearTimeout(gate.settleTimer);  gate.settleTimer = null;
      gate.waiters.splice(0).forEach(function (r) { r(true); });
      emit('unlocked', { reason: reason || '' });
      return { unlocked: true, reason: reason || '' };
    },

    /* 这一轮没成（超时/星数没涨），退回 locked，界面可以再让用户点一次 */
    fail: function (reason) {
      if (gate.isUnlocked()) return;
      gate.state = 'locked';
      clearTimeout(gate.timeoutTimer); gate.timeoutTimer = null;
      clearTimeout(gate.settleTimer);  gate.settleTimer = null;
      gate.waiters.splice(0).forEach(function (r) { r(false); });
      emit('failed', { reason: reason || '' });
    },

    reset: function () {
      lsDel('unlocked');
      gate.cache = false;
      gate.state = 'locked';
      gate.baseline = null;
      emit('reset', {});
    }
  };

  /* ------------------------------ 对外 ------------------------------ */
  var toy = {
    version: '1.1.0',
    project: PROJECT,
    heartUrl: HEART_URL,
    actionLabel: HEART.label || '♥ 去点个心',

    on: on,
    off: off,

    /* ===== 门槛 ===== */
    isUnlocked: function () { return gate.isUnlocked(); },
    checkUnlock: function () { return gate.check(); },
    requestUnlock: function () { return gate.request(); },
    lockState: function () { return gate.state; },
    resetUnlock: function () { gate.reset(); },

    /* ===== 存档 / 跳转 / 访客 ===== */
    loadState: function (keys) {
      var out = {};
      (keys || []).forEach(function (k) {
        var v = lsGet('state:' + k);
        if (v !== null) out[k] = v;
      });
      return Promise.resolve(out);
    },
    saveState: function (obj) {
      Object.keys(obj || {}).forEach(function (k) { lsSet('state:' + k, obj[k]); });
      return Promise.resolve(true);
    },
    clearState: function (keys) {
      (keys || []).forEach(function (k) { lsDel('state:' + k); });
      return Promise.resolve(true);
    },
    getViewer: function () {
      return Promise.resolve({ id: null, name: '游客', anonymous: true });
    },
    openLink: function (opt) {
      var url = (typeof opt === 'string') ? opt : (opt && opt.url);
      if (!url) return Promise.resolve(false);
      try { global.open(url, (opt && opt.target) || '_blank', 'noopener,noreferrer'); } catch (e) {}
      return Promise.resolve(true);
    }
  };

  global.toy = toy;

  /* 回到页面时如果还在等校验，SDK 自己也要能反应过来（不轮询，只挂监听） */
  if ((HEART.mode || 'star') !== 'soft') gate.arm();

})(window);
