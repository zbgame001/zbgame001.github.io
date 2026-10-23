// 发布视频零钱自动增加90万 Mod
// 版本: 2.1.0 (修复发布冲突 + 通知显示)
// 作者: Mod开发者 (由 AI 适配)
// 描述: 每次发布作品自动增加90万零钱，支持长按拖动面板
// 适用游戏版本: 6.5-1 及以上

const AutoMoneyMod = {
  name: "发布作品赚90万",
  version: "2.1.0",
  description: "每次发布视频/动态/直播自动增加90万零钱，支持长按拖动面板",
  author: "Mod开发者 (适配版)",
  enabled: true,
  
  config: {
    moneyAmount: 900000,
    showNotifications: true,
    playSound: false,
    multipleVideosBoost: true,
    boostMultiplier: 1.1,
  },
  
  stats: {
    totalMoneyAdded: 0,
    videosPublished: 0,
    lastPublishTime: null,
    consecutivePublishes: 0,
  },
  
  dragState: {
    panelX: 20,
    panelY: 20,
    isDragging: false,
    isLongPress: false,
    hasMoved: false,
    longPressTimer: null,
    touchStartTime: 0,
    touchStartX: 0,
    touchStartY: 0,
    panelStartX: 0,
    panelStartY: 0,
    dragThreshold: 300,
    moveThreshold: 5,
    _moveHandler: null,
    _endHandler: null,
    isTouchDevice: false
  },
  
  _originalAddWork: null,
  _initDone: false,
  
  // 初始化
  init: function() {
    if (this._initDone) return true;
    console.log(`[${this.name}] Mod加载中，版本 ${this.version}`);
    
    this.loadStats();
    this.loadPanelPosition();
    this.loadConfig();
    
    // 等待 addWork 就绪
    this.hookAddWork();
    this.addControlPanel();
    this.setupRefreshListener();
    
    this._initDone = true;
    console.log(`[${this.name}] Mod已就绪`);
    return true;
  },
  
  // 钩子 addWork（安全版）
  hookAddWork: function() {
    if (typeof window.addWork !== 'function') {
      console.warn(`[${this.name}] addWork 未就绪，等待...`);
      const checkInterval = setInterval(() => {
        if (typeof window.addWork === 'function') {
          clearInterval(checkInterval);
          this._doHook();
        }
      }, 300);
      // 超时保护
      setTimeout(() => {
        clearInterval(checkInterval);
        if (typeof window.addWork === 'function') this._doHook();
      }, 5000);
      return;
    }
    this._doHook();
  },
  
  _doHook: function() {
    if (this._originalAddWork) return;
    this._originalAddWork = window.addWork;
    window.addWork = this.wrappedAddWork.bind(this);
    console.log(`[${this.name}] 已钩子 addWork`);
  },
  
  // 包装 addWork（必须返回原函数结果）
  wrappedAddWork: function(work) {
    // 调用原始函数
    let result;
    try {
      result = this._originalAddWork(work);
    } catch (e) {
      console.error(`[${this.name}] 原始 addWork 异常:`, e);
      throw e;
    }
    
    // 判断作品类型并触发加钱
    if (work && (work.type === 'video' || work.type === 'post' || work.type === 'live')) {
      // 延迟执行，确保作品已完全保存
      setTimeout(() => {
        try {
          this.addMoneyAfterPublish(work.type);
        } catch (e) {
          console.error(`[${this.name}] 加钱失败:`, e);
        }
      }, 300);
    }
    
    return result;
  },
  
  // 监听刷新
  setupRefreshListener: function() {
    const origRefresh = window.refreshHomeDisplay;
    if (typeof origRefresh === 'function') {
      window.refreshHomeDisplay = function() {
        origRefresh();
        AutoMoneyMod.updateControlPanel();
      };
    }
  },
  
  // ========== 数据持久化 ==========
  loadStats: function() {
    try {
      const s = localStorage.getItem('AutoMoneyMod_stats');
      if (s) this.stats = { ...this.stats, ...JSON.parse(s) };
    } catch (e) {}
  },
  saveStats: function() {
    try { localStorage.setItem('AutoMoneyMod_stats', JSON.stringify(this.stats)); } catch (e) {}
  },
  loadConfig: function() {
    try {
      const s = localStorage.getItem('AutoMoneyMod_config');
      if (s) this.config = { ...this.config, ...JSON.parse(s) };
    } catch (e) {}
  },
  saveConfig: function() {
    try { localStorage.setItem('AutoMoneyMod_config', JSON.stringify(this.config)); } catch (e) {}
  },
  loadPanelPosition: function() {
    try {
      const s = localStorage.getItem('AutoMoneyMod_position');
      if (s) { const p = JSON.parse(s); this.dragState.panelX = p.x || 20; this.dragState.panelY = p.y || 20; }
    } catch (e) {}
  },
  savePanelPosition: function() {
    try {
      localStorage.setItem('AutoMoneyMod_position', JSON.stringify({ x: this.dragState.panelX, y: this.dragState.panelY }));
    } catch (e) {}
  },
  
  // ========== 核心加钱逻辑 ==========
  addMoneyAfterPublish: function(contentType) {
    // 封禁检查
    if (typeof window._banData !== 'undefined' && window._banData.isBanned) {
      if (this.config.showNotifications) {
        this.showSimpleNotification('⛔ 账号封禁中，无法获取收益');
      }
      return false;
    }
    
    if (typeof window._homeData === 'undefined' || window._homeData === null) {
      console.error(`[${this.name}] _homeData 未初始化`);
      return false;
    }
    
    let moneyToAdd = this.config.moneyAmount;
    const now = Date.now();
    
    // 连续发布加成
    if (this.config.multipleVideosBoost && this.stats.lastPublishTime) {
      const diff = now - this.stats.lastPublishTime;
      if (diff < 5 * 60 * 1000) {
        this.stats.consecutivePublishes++;
        if (this.stats.consecutivePublishes > 1) {
          const bonus = Math.pow(this.config.boostMultiplier, Math.min(this.stats.consecutivePublishes, 10));
          moneyToAdd = Math.round(moneyToAdd * bonus);
        }
      } else {
        this.stats.consecutivePublishes = 1;
      }
    } else {
      this.stats.consecutivePublishes = 1;
    }
    this.stats.lastPublishTime = now;
    
    // 执行加钱
    const original = window._homeData.coins || 0;
    window._homeData.coins = original + moneyToAdd;
    
    // 保存
    try {
      localStorage.setItem('zbgame_home_data', JSON.stringify(window._homeData));
    } catch (e) {}
    
    // 刷新UI
    if (typeof window.refreshHomeDisplay === 'function') {
      window.refreshHomeDisplay();
    }
    
    // 更新统计
    this.stats.totalMoneyAdded += moneyToAdd;
    this.stats.videosPublished++;
    this.saveStats();
    this.updateControlPanel();
    
    // 通知
    if (this.config.showNotifications) {
      const typeMap = { 'video': '视频', 'post': '动态', 'live': '直播' };
      const typeLabel = typeMap[contentType] || '内容';
      const bonusText = this.stats.consecutivePublishes > 2 ? 
        ` (连续${this.stats.consecutivePublishes}次，+${Math.round((Math.pow(this.config.boostMultiplier, Math.min(this.stats.consecutivePublishes, 10)) - 1) * 100)}%加成)` : '';
      this.showSimpleNotification(`💰 发布${typeLabel} +${moneyToAdd.toLocaleString()} 零钱${bonusText}`);
    }
    
    if (this.config.playSound) {
      this.playMoneySound();
    }
    
    return true;
  },
  
  // 简单通知（使用游戏内 Toast，避免 HTML 渲染问题）
  showSimpleNotification: function(message) {
    if (typeof window.showGameToast === 'function') {
      window.showGameToast(message);
    } else {
      // 降级方案：创建 DOM 通知
      const el = document.createElement('div');
      el.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.85); color: #4CAF50; padding: 14px 28px;
        border-radius: 12px; z-index: 9999; font-size: 16px; font-weight: bold;
        font-family: Arial, sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: fadeInDown 0.3s ease-out; max-width: 90vw; text-align: center;
      `;
      el.textContent = message;
      document.body.appendChild(el);
      setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.3s';
        setTimeout(() => { if (el.parentNode) el.remove(); }, 400);
      }, 3000);
      // 添加动画（如果不存在）
      if (!document.getElementById('money-toast-style')) {
        const style = document.createElement('style');
        style.id = 'money-toast-style';
        style.textContent = `@keyframes fadeInDown { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`;
        document.head.appendChild(style);
      }
    }
  },
  
  // 声音
  playMoneySound: function() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  },
  
  // 更新面板
  updateControlPanel: function() {
    const el = (id) => document.getElementById(id);
    const vc = el('money-mod-videos-count');
    const tm = el('money-mod-total-money');
    const cc = el('money-mod-consecutive');
    const btn = el('money-mod-add-now');
    if (vc) vc.textContent = this.stats.videosPublished;
    if (tm) tm.textContent = this.stats.totalMoneyAdded.toLocaleString();
    if (cc) {
      cc.textContent = this.stats.consecutivePublishes + '次';
      cc.style.color = this.stats.consecutivePublishes > 1 ? '#FF9800' : '#666';
    }
    if (btn) {
      btn.textContent = `💰 立即增加 ${this.config.moneyAmount.toLocaleString()} 零钱`;
    }
  },
  
  // ========== 控制面板 ==========
  addControlPanel: function() {
    const old = document.getElementById('money-mod-control-panel');
    if (old) old.remove();
    
    const panel = document.createElement('div');
    panel.id = 'money-mod-control-panel';
    panel.style.cssText = `
      position: fixed;
      top: ${this.dragState.panelY}px;
      right: ${this.dragState.panelX}px;
      width: 280px;
      background: rgba(255,255,255,0.95);
      border: 2px solid #4CAF50;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 9998;
      font-family: Arial, sans-serif;
      overflow: hidden;
      backdrop-filter: blur(5px);
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
      transition: box-shadow 0.3s, border-color 0.3s;
    `;
    
    // 拖动样式
    if (!document.getElementById('money-mod-drag-style')) {
      const style = document.createElement('style');
      style.id = 'money-mod-drag-style';
      style.textContent = `
        #money-mod-control-panel.money-mod-dragging {
          opacity: 0.9;
          border-color: #00f2ea !important;
          box-shadow: 0 6px 25px rgba(0,242,234,0.5) !important;
          transition: none !important;
        }
        #money-mod-control-panel.money-mod-dragging #money-mod-panel-header {
          cursor: grabbing !important;
          background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%) !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    // 标题栏
    const header = document.createElement('div');
    header.id = 'money-mod-panel-header';
    header.style.cssText = `
      background: linear-gradient(135deg, #4CAF50, #8BC34A);
      color: white;
      padding: 12px 15px;
      font-weight: bold;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: grab;
    `;
    header.innerHTML = `
      <span>💰 自动赚零钱 Mod</span>
      <button id="money-mod-toggle" style="background:rgba(255,255,255,0.2);border:none;color:white;border-radius:4px;padding:2px 8px;cursor:pointer;pointer-events:auto;">−</button>
    `;
    
    // 拖动事件
    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      this.handlePointerDown(e);
    });
    header.addEventListener('touchstart', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      this.handlePointerDown(e);
    }, { passive: true });
    
    // 内容
    const content = document.createElement('div');
    content.id = 'money-mod-panel-content';
    content.style.cssText = `padding: 15px; max-height: 400px; overflow-y: auto;`;
    
    content.innerHTML = `
      <div style="margin-bottom:15px;">
        <div style="font-weight:bold;margin-bottom:8px;color:#333;display:flex;align-items:center;gap:5px;">
          <span>📊 收益统计</span>
          <span style="font-size:12px;background:#4CAF50;color:white;padding:2px 6px;border-radius:10px;">v${this.version}</span>
        </div>
        <div style="background:#f5f5f5;border-radius:6px;padding:10px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>发布次数:</span>
            <span id="money-mod-videos-count" style="font-weight:bold;">${this.stats.videosPublished}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span>总收益:</span>
            <span id="money-mod-total-money" style="font-weight:bold;color:#4CAF50;">${this.stats.totalMoneyAdded.toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <span>连续发布:</span>
            <span id="money-mod-consecutive" style="font-weight:bold;color:${this.stats.consecutivePublishes > 1 ? '#FF9800' : '#666'}">
              ${this.stats.consecutivePublishes}次
            </span>
          </div>
        </div>
        <div style="font-size:12px;color:#666;margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
          每次发布增加: ${this.config.moneyAmount.toLocaleString()} 零钱
        </div>
      </div>
      
      <div style="margin-bottom:15px;">
        <div style="font-weight:bold;margin-bottom:8px;color:#333;">⚙️ 配置</div>
        <label style="display:flex;align-items:center;cursor:pointer;margin-bottom:5px;">
          <input type="checkbox" id="money-mod-show-notifications" ${this.config.showNotifications ? 'checked' : ''} style="margin-right:8px;"> 显示通知
        </label>
        <label style="display:flex;align-items:center;cursor:pointer;margin-bottom:5px;">
          <input type="checkbox" id="money-mod-play-sound" ${this.config.playSound ? 'checked' : ''} style="margin-right:8px;"> 播放音效
        </label>
        <label style="display:flex;align-items:center;cursor:pointer;">
          <input type="checkbox" id="money-mod-boost" ${this.config.multipleVideosBoost ? 'checked' : ''} style="margin-right:8px;"> 连续发布加成
        </label>
        <div style="margin-top:12px;">
          <div style="font-size:12px;color:#666;margin-bottom:4px;">每次收益:</div>
          <div style="display:flex;align-items:center;">
            <input type="range" id="money-mod-amount-slider" min="10000" max="1000000" step="10000" value="${this.config.moneyAmount}" style="flex:1;margin-right:10px;">
            <span id="money-mod-amount-display" style="font-weight:bold;min-width:100px;color:#4CAF50;">${this.config.moneyAmount.toLocaleString()}</span>
          </div>
        </div>
        ${this.config.multipleVideosBoost ? `
        <div style="margin-top:10px;">
          <div style="font-size:12px;color:#666;margin-bottom:4px;">加成倍数:</div>
          <div style="display:flex;align-items:center;">
            <input type="range" id="money-mod-multiplier-slider" min="1.0" max="2.0" step="0.1" value="${this.config.boostMultiplier}" style="flex:1;margin-right:10px;">
            <span id="money-mod-multiplier-display" style="font-weight:bold;min-width:50px;color:#FF9800;">${this.config.boostMultiplier.toFixed(1)}x</span>
          </div>
        </div>
        ` : ''}
      </div>
      
      <div style="display:flex;gap:10px;margin-top:10px;">
        <button id="money-mod-test" style="flex:1;padding:8px;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">测试 (+10万)</button>
        <button id="money-mod-reset" style="flex:1;padding:8px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;font-size:14px;">重置统计</button>
      </div>
      <button id="money-mod-add-now" style="width:100%;margin-top:10px;padding:10px;background:linear-gradient(135deg,#4CAF50,#8BC34A);color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;font-size:14px;">
        💰 立即增加 ${this.config.moneyAmount.toLocaleString()} 零钱
      </button>
      <div style="margin-top:8px;font-size:10px;color:#999;text-align:center;">💡 长按标题栏拖动面板</div>
    `;
    
    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(panel);
    this.addPanelEvents(panel);
  },
  
  addPanelEvents: function(panel) {
    const toggle = panel.querySelector('#money-mod-toggle');
    const content = panel.querySelector('#money-mod-panel-content');
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
      toggle.textContent = content.style.display === 'none' ? '+' : '−';
    });
    
    // 配置事件
    const bind = (id, fn) => {
      const el = panel.querySelector(id);
      if (el) el.addEventListener('change', fn);
    };
    bind('#money-mod-show-notifications', (e) => { this.config.showNotifications = e.target.checked; this.saveConfig(); });
    bind('#money-mod-play-sound', (e) => { this.config.playSound = e.target.checked; this.saveConfig(); });
    bind('#money-mod-boost', (e) => { this.config.multipleVideosBoost = e.target.checked; this.saveConfig(); this.reloadPanel(); });
    
    const amountSlider = panel.querySelector('#money-mod-amount-slider');
    const amountDisplay = panel.querySelector('#money-mod-amount-display');
    if (amountSlider && amountDisplay) {
      amountSlider.addEventListener('input', (e) => {
        const v = parseInt(e.target.value);
        amountDisplay.textContent = v.toLocaleString();
        this.config.moneyAmount = v;
      });
      amountSlider.addEventListener('change', () => this.saveConfig());
    }
    
    const multSlider = panel.querySelector('#money-mod-multiplier-slider');
    const multDisplay = panel.querySelector('#money-mod-multiplier-display');
    if (multSlider && multDisplay) {
      multSlider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        multDisplay.textContent = v.toFixed(1) + 'x';
        this.config.boostMultiplier = v;
      });
      multSlider.addEventListener('change', () => this.saveConfig());
    }
    
    // 测试按钮
    const testBtn = panel.querySelector('#money-mod-test');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        if (typeof window._banData !== 'undefined' && window._banData.isBanned) {
          this.showSimpleNotification('⛔ 封禁中，无法操作');
          return;
        }
        const original = window._homeData?.coins || 0;
        window._homeData.coins = original + 100000;
        localStorage.setItem('zbgame_home_data', JSON.stringify(window._homeData));
        if (typeof window.refreshHomeDisplay === 'function') window.refreshHomeDisplay();
        this.showSimpleNotification(`💰 测试 +100,000 零钱`);
      });
    }
    
    // 重置按钮
    const resetBtn = panel.querySelector('#money-mod-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('重置统计信息？')) {
          this.stats = { totalMoneyAdded: 0, videosPublished: 0, lastPublishTime: null, consecutivePublishes: 0 };
          this.saveStats();
          this.updateControlPanel();
          this.showSimpleNotification('📊 统计已重置');
        }
      });
    }
    
    // 立即加钱按钮
    const addBtn = panel.querySelector('#money-mod-add-now');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (typeof window._banData !== 'undefined' && window._banData.isBanned) {
          this.showSimpleNotification('⛔ 封禁中，无法操作');
          return;
        }
        const original = window._homeData?.coins || 0;
        window._homeData.coins = original + this.config.moneyAmount;
        localStorage.setItem('zbgame_home_data', JSON.stringify(window._homeData));
        if (typeof window.refreshHomeDisplay === 'function') window.refreshHomeDisplay();
        this.stats.totalMoneyAdded += this.config.moneyAmount;
        this.stats.videosPublished++;
        this.saveStats();
        this.updateControlPanel();
        this.showSimpleNotification(`💰 +${this.config.moneyAmount.toLocaleString()} 零钱`);
        addBtn.textContent = `✅ 已增加 ${this.config.moneyAmount.toLocaleString()}`;
        addBtn.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
        setTimeout(() => {
          addBtn.textContent = `💰 立即增加 ${this.config.moneyAmount.toLocaleString()} 零钱`;
          addBtn.style.background = 'linear-gradient(135deg, #4CAF50, #8BC34A)';
        }, 2000);
      });
    }
  },
  
  reloadPanel: function() {
    const old = document.getElementById('money-mod-control-panel');
    if (old) old.remove();
    this.addControlPanel();
  },
  
  // ========== 拖动处理 ==========
  handlePointerDown: function(e) {
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' ||
        target.closest('button') || target.closest('input')) return;
    
    const state = this.dragState;
    const panel = document.getElementById('money-mod-control-panel');
    if (!panel) return;
    
    const cx = e.clientX || (e.touches && e.touches[0].clientX);
    const cy = e.clientY || (e.touches && e.touches[0].clientY);
    if (!cx || !cy) return;
    
    state.touchStartX = cx;
    state.touchStartY = cy;
    state.isLongPress = false;
    state.hasMoved = false;
    
    state.longPressTimer = setTimeout(() => {
      state.isLongPress = true;
      panel.classList.add('money-mod-dragging');
      const rect = panel.getBoundingClientRect();
      state.panelStartX = window.innerWidth - rect.right;
      state.panelStartY = rect.top;
      this.bindGlobalMoveEvents();
    }, state.dragThreshold);
  },
  
  bindGlobalMoveEvents: function() {
    const state = this.dragState;
    const moveHandler = (e) => {
      if (!state.isLongPress) return;
      if (e.cancelable) e.preventDefault();
      const cx = e.clientX || (e.touches && e.touches[0].clientX);
      const cy = e.clientY || (e.touches && e.touches[0].clientY);
      if (!cx || !cy) return;
      const dx = cx - state.touchStartX;
      const dy = cy - state.touchStartY;
      if (Math.abs(dx) > state.moveThreshold || Math.abs(dy) > state.moveThreshold) {
        state.hasMoved = true;
        clearTimeout(state.longPressTimer);
        const panel = document.getElementById('money-mod-control-panel');
        if (!panel) return;
        const nr = Math.max(10, Math.min(window.innerWidth - panel.offsetWidth - 10, state.panelStartX - dx));
        const nt = Math.max(10, Math.min(window.innerHeight - panel.offsetHeight - 10, state.panelStartY + dy));
        panel.style.right = nr + 'px';
        panel.style.top = nt + 'px';
        panel.style.left = 'auto';
        state.panelX = nr;
        state.panelY = nt;
      }
    };
    const endHandler = () => {
      this.unbindGlobalMoveEvents();
      this.handlePointerEnd();
    };
    state._moveHandler = moveHandler;
    state._endHandler = endHandler;
    document.addEventListener('mousemove', moveHandler, { capture: true });
    document.addEventListener('touchmove', moveHandler, { capture: true, passive: false });
    document.addEventListener('mouseup', endHandler, { capture: true });
    document.addEventListener('touchend', endHandler, { capture: true });
  },
  
  unbindGlobalMoveEvents: function() {
    const state = this.dragState;
    if (state._moveHandler) {
      document.removeEventListener('mousemove', state._moveHandler, { capture: true });
      document.removeEventListener('touchmove', state._moveHandler, { capture: true });
    }
    if (state._endHandler) {
      document.removeEventListener('mouseup', state._endHandler, { capture: true });
      document.removeEventListener('touchend', state._endHandler, { capture: true });
    }
    state._moveHandler = null;
    state._endHandler = null;
  },
  
  handlePointerEnd: function() {
    const state = this.dragState;
    const panel = document.getElementById('money-mod-control-panel');
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }
    if (state.isLongPress && state.hasMoved) {
      this.savePanelPosition();
      if (panel) panel.classList.remove('money-mod-dragging');
    }
    setTimeout(() => { state.isLongPress = false; state.hasMoved = false; }, 50);
  }
};

// 自动初始化
if (typeof window !== 'undefined') {
  const start = function() {
    AutoMoneyMod.loadConfig();
    AutoMoneyMod.init();
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    const check = setInterval(() => {
      if (typeof window.addWork === 'function' && typeof window._homeData !== 'undefined') {
        clearInterval(check);
        start();
      }
    }, 300);
    setTimeout(() => { clearInterval(check); start(); }, 8000);
  }
  window.AutoMoneyMod = AutoMoneyMod;
}

const AutoMoneyModConfig = {
  name: AutoMoneyMod.name,
  version: AutoMoneyMod.version,
  description: AutoMoneyMod.description,
  author: AutoMoneyMod.author,
  enabled: true,
  initialize: AutoMoneyMod.init.bind(AutoMoneyMod)
};