/*!
 * toy-sdk.js — 「点个心解锁」迷你 SDK  v1.0.0
 * ------------------------------------------------------------------
 * 形状照着 B 站互动玩具的 toy-sdk 抄（getAuthorRelation / getCloudStorage /
 * setCloudStorage / getUserProfile / navigate），但门槛换成了「给项目点个心」：
 *
 *   await toy.getAuthorRelation()   ->  { followed: true|false, hearted, source }
 *   await toy.requestHeart()        ->  打开仓库页并开始校验，resolve 是否通过
 *   toy.isHearted()                 ->  同步读本地缓存（渲染列表用）
 *   toy.on('heart:verified', fn)    ->  解锁成功时通知界面
 *
 * 纯静态、零后端，直接丢 GitHub Pages 就能跑。
 * 校验模式见 config.js：auto / count / soft。
 */
(function (global) {
  'use strict';

  var CFG     = global.TOY_CONFIG || {};
  var PROJECT = CFG.project || {};
  var HEART   = CFG.heart || {};
  var NS      = CFG.storageKey || 'toy-heart-gate:v1';

  var HEART_URL = 'https://github.com/' + (PROJECT.owner || '') + '/' + (PROJECT.repo || '');

  /* ------------------------------ 事件总线 ------------------------------ */
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
      try { fn(payload); } catch (e) { /* 监听器自己的锅，不连累 SDK */ }
    });
  }

  /* ------------------------------ 本地存档 ------------------------------ */
  function lsGet(k) { try { return global.localStorage.getItem(NS + ':' + k); } catch (e) { return null; } }
  function lsSet(k, v) { try { global.localStorage.setItem(NS + ':' + k, String(v)); } catch (e) {} }
  function lsDel(k) { try { global.localStorage.removeItem(NS + ':' + k); } catch (e) {} }

  /* ------------------------------ 心 / 星 ------------------------------ */
  var heart = {
    state: 'idle',        // idle | pending | verified | failed
    cache: null,          // 本地缓存：点过心没有
    baseline: null,       // 打开仓库页之前的星数基线
    timer: null,

    /** 同步读本地缓存 */
    isHearted: function () {
      if (heart.cache === null) heart.cache = lsGet('hearted') === '1';
      return heart.cache;
    },

    relation: function (source) {
      var ok = heart.isHearted();
      return {
        followed: ok,      // 游戏只认这个字段（沿用 B 站 SDK 的命名）
        hearted: ok,
        source: source || (ok ? 'local' : 'none')
      };
    },

    /** 读一次仓库星数（静态站没有登录态，只能看总数） */
    fetchStars: function () {
      if (!PROJECT.owner || !PROJECT.repo) return Promise.resolve(null);
      var url = 'https://api.github.com/repos/' + PROJECT.owner + '/' + PROJECT.repo;
      return global.fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('api ' + r.status)); })
        .then(function (j) { return typeof j.stargazers_count === 'number' ? j.stargazers_count : null; })
        .catch(function () { return null; });
    },

    /* 模拟 B 站 SDK：getAuthorRelation() */
    getRelation: function () {
      if (heart.isHearted()) return Promise.resolve(heart.relation('local'));
      var mode = HEART.mode || 'auto';
      if (mode === 'soft') return Promise.resolve(heart.relation('none'));
      // 顺便把基线拿上，用户点完星回来就能比对
      return heart.fetchStars().then(function (n) {
        if (typeof n === 'number' && heart.baseline === null) heart.baseline = n;
        return heart.relation('none');
      });
    },

    /* 用户点了「去点个心」 */
    request: function () {
      if (heart.isHearted()) { emit('heart:verified', { reason: 'cached' }); return Promise.resolve(true); }

      var mode = HEART.mode || 'auto';

      if (mode === 'soft') { return Promise.resolve(heart.mark('soft')); }

      heart.state = 'pending';
      emit('heart:pending', { url: HEART_URL });

      // 开仓库页去点星（保持 noopener，别把 opener 交出去）
      try { global.open(HEART_URL, '_blank', 'noopener,noreferrer'); } catch (e) {}

      var base     = (typeof heart.baseline === 'number') ? heart.baseline : null;
      var deadline = Date.now() + (HEART.timeoutMs || 120000);
      var pollMs   = HEART.pollMs || 4000;

      return new Promise(function (resolve) {
        function finish(ok, reason) {
          if (heart.timer) { clearInterval(heart.timer); heart.timer = null; }
          if (ok) resolve(heart.mark(reason));
          else { heart.state = 'failed'; emit('heart:failed', { reason: reason }); resolve(false); }
        }

        heart.timer = setInterval(function () {
          if (Date.now() > deadline) {
            // auto：超时放行（别为了一个玩具把玩家卡死）；count：认输
            if (mode === 'auto') finish(true, 'timeout-allow');
            else finish(false, 'timeout');
            return;
          }
          heart.fetchStars().then(function (n) {
            if (typeof n !== 'number') return;          // 网络/限流，下轮再试
            if (base === null) { base = n; return; }    // 第一次没拿到基线，补上
            if (n > base) finish(true, 'star+');
          });
        }, pollMs);
      });
    },

    mark: function (reason) {
      heart.cache = true;
      heart.state = 'verified';
      lsSet('hearted', '1');
      emit('heart:verified', { reason: reason || '' });
      return true;
    },

    /** 调试用：把解锁状态清掉 */
    reset: function () {
      lsDel('hearted');
      heart.cache = false;
      heart.state = 'idle';
      emit('heart:reset', {});
    }
  };

  /* ------------------------------ 对外接口 ------------------------------ */
  var toy = {
    version: '1.0.0',
    project: PROJECT,
    heartUrl: HEART_URL,
    heartLabel: HEART.label || '♥ 去点个心',

    on: on,
    off: off,

    /* ===== 以下形状对齐 B 站 toy-sdk，换宿主时游戏代码不用动 ===== */

    /** 拿用户信息；静态站没有登录态，返回游客 */
    getUserProfile: function () {
      return Promise.resolve({ id: null, name: '游客', anonymous: true });
    },

    /** 云存档：这里落在 localStorage，形状和 B 站 SDK 一致 */
    getCloudStorage: function (keys) {
      var out = {};
      (keys || []).forEach(function (k) {
        var v = lsGet('cloud:' + k);
        if (v !== null) out[k] = v;
      });
      return Promise.resolve(out);
    },
    setCloudStorage: function (obj) {
      Object.keys(obj || {}).forEach(function (k) { lsSet('cloud:' + k, obj[k]); });
      return Promise.resolve(true);
    },
    removeCloudStorage: function (keys) {
      (keys || []).forEach(function (k) { lsDel('cloud:' + k); });
      return Promise.resolve(true);
    },

    /** 跳转 */
    navigate: function (opt) {
      var url = (typeof opt === 'string') ? opt : (opt && opt.url);
      if (!url) return Promise.resolve(false);
      try { global.open(url, (opt && opt.target) || '_blank', 'noopener,noreferrer'); } catch (e) {}
      return Promise.resolve(true);
    },

    /* ===== 本 SDK 的核心：作者关系 = 那道门槛 ===== */

    /** 异步查关系（游戏里解锁判断就写这一句） */
    getAuthorRelation: function () { return heart.getRelation(); },

    /** 同步查（渲染关卡列表用） */
    isHearted: function () { return heart.isHearted(); },

    /** 弹出去点个心 */
    requestHeart: function () { return heart.request(); },

    heartState: function () { return heart.state; },

    /** 调试：toy.resetHeart() 清掉本地解锁 */
    resetHeart: function () { return heart.reset(); }
  };

  /* 就把这一个东西挂出去，跟真 SDK 一样 */
  global.toy = toy;

  /* 打开页面时预热一下基线星数（不阻塞） */
  try {
    if ((HEART.mode || 'auto') !== 'soft' && !heart.isHearted()) {
      heart.getRelation();
    }
  } catch (e) {}

})(window);
