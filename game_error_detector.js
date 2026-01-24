/**
 * 主播模拟器 - 独立错误检测系统
 * 版本：1.0.0
 * 特性：完全独立、自我容错、自动诊断、覆盖层报错
 */

(function() {
    'use strict';
    
    // ==================== 配置区域 ====================
    const CONFIG = {
        checkInterval: 3000,           // 每3秒检查一次
        maxSafeArrayLength: 5000,      // 数组最大安全长度
        maxSafeTimerCount: 100,        // 定时器最大安全数量（估算）
        maxFanGrowthRate: 200000000,   // 单次涨粉超过此值视为异常（2亿）
        maxMoneyGrowthRate: 10000000,  // 单次收益超过此值视为异常
        staleTimeThreshold: 60000,     // 游戏时间停滞超过60秒视为异常
        errorCooldown: 30000,          // 相同错误30秒内不重复报告
        debugMode: false               // 设为true可在控制台查看检测日志
    };
    
    // ==================== 状态记录 ====================
    const state = {
        lastCheckTime: Date.now(),
        lastGameTimer: 0,
        lastFans: 0,
        lastMoney: 0,
        lastWorksCount: 0,
        errorHistory: new Map(),       // 错误记录，用于去重
        checkCount: 0,                 // 检查次数
        startTime: Date.now(),         // 检测系统启动时间
        hasShownError: false           // 是否已显示错误（防止重复弹窗）
    };
    
    // ==================== 安全工具函数 ====================
    const safeGet = (obj, path, defaultValue = undefined) => {
        try {
            return path.split('.').reduce((o, p) => o && o[p], obj) || defaultValue;
        } catch (e) {
            return defaultValue;
        }
    };
    
    const isValidNumber = (val) => {
        return typeof val === 'number' && !isNaN(val) && isFinite(val);
    };
    
    const isValidString = (val) => {
        return typeof val === 'string' && val !== undefined && val !== null;
    };
    
    // ==================== 错误收集器 ====================
    class ErrorCollector {
        constructor() {
            this.errors = [];
            this.warnings = [];
        }
        
        addError(code, message, details = {}) {
            const error = {
                code,
                message,
                details,
                timestamp: new Date().toLocaleString(),
                gameTime: safeGet(window, 'gameTimer', 0),
                severity: 'ERROR'
            };
            this.errors.push(error);
            if (CONFIG.debugMode) console.error('[ErrorDetector]', error);
        }
        
        addWarning(code, message, details = {}) {
            const warning = {
                code,
                message,
                details,
                timestamp: new Date().toLocaleString(),
                gameTime: safeGet(window, 'gameTimer', 0),
                severity: 'WARNING'
            };
            this.warnings.push(warning);
            if (CONFIG.debugMode) console.warn('[ErrorDetector]', warning);
        }
        
        hasErrors() {
            return this.errors.length > 0;
        }
        
        getReport() {
            return {
                errors: this.errors,
                warnings: this.warnings,
                systemInfo: this.getSystemInfo(),
                checkTime: new Date().toLocaleString()
            };
        }
        
        getSystemInfo() {
            try {
                return {
                    userAgent: navigator.userAgent,
                    screenSize: `${window.innerWidth}x${window.innerHeight}`,
                    gameStateExists: !!window.gameState,
                    gameTimer: safeGet(window, 'gameTimer', 'N/A'),
                    checkCount: state.checkCount,
                    detectorUptime: Date.now() - state.startTime
                };
            } catch (e) {
                return { error: '无法获取系统信息' };
            }
        }
    }
    
    // ==================== 核心检测逻辑 ====================
    const checks = {
        // 1. 检查基本游戏对象
        checkGameObjects: (collector) => {
            if (typeof window.gameState === 'undefined') {
                collector.addError('E001', 'gameState 未定义', { 
                    suggestion: '游戏核心状态丢失，可能需要重新加载' 
                });
                return false;
            }
            
            if (typeof window.gameTimer === 'undefined') {
                collector.addError('E002', 'gameTimer 未定义', {
                    suggestion: '游戏计时器丢失，时间系统已停止'
                });
            }
            
            return true;
        },
        
        // 2. 检查数值有效性
        checkNumericValues: (collector) => {
            const gs = window.gameState;
            if (!gs) return;
            
            const numericFields = [
                { key: 'fans', name: '粉丝数', min: 0 },
                { key: 'likes', name: '点赞数', min: 0 },
                { key: 'views', name: '播放量', min: 0 },
                { key: 'works', name: '作品数', min: 0 },
                { key: 'money', name: '零钱', min: 0 },
                { key: 'warnings', name: '警告数', min: 0 }
            ];
            
            numericFields.forEach(field => {
                const val = gs[field.key];
                
                if (typeof val === 'undefined') {
                    collector.addError('E003', `${field.name}字段缺失`, { field: field.key });
                    return;
                }
                
                if (!isValidNumber(val)) {
                    collector.addError('E004', `${field.name}数值异常`, { 
                        field: field.key, 
                        value: val, 
                        type: typeof val 
                    });
                    return;
                }
                
                if (val < field.min) {
                    collector.addError('E005', `${field.name}为负数`, { 
                        field: field.key, 
                        value: val 
                    });
                }
                
                if (val > Number.MAX_SAFE_INTEGER) {
                    collector.addWarning('W001', `${field.name}数值过大，可能溢出`, { 
                        field: field.key, 
                        value: val 
                    });
                }
            });
        },
        
        // 3. 检查数组长度（防止内存泄漏）
        checkArrayLengths: (collector) => {
            const gs = window.gameState;
            if (!gs) return;
            
            const arrays = [
                { key: 'worksList', name: '作品列表' },
                { key: 'achievements', name: '成就列表' },
                { key: 'notifications', name: '通知列表' },
                { key: 'messages', name: '消息列表' },
                { key: 'following', name: '关注列表' },
                { key: 'warningHistory', name: '警告历史' }
            ];
            
            arrays.forEach(arr => {
                const val = gs[arr.key];
                if (Array.isArray(val) && val.length > CONFIG.maxSafeArrayLength) {
                    collector.addWarning('W002', `${arr.name}过长，可能存在内存泄漏`, {
                        field: arr.key,
                        length: val.length,
                        limit: CONFIG.maxSafeArrayLength
                    });
                }
            });
            
            // 检查私信系统
            const pms = safeGet(gs, 'privateMessageSystem.conversations');
            if (Array.isArray(pms) && pms.length > 100) {
                collector.addWarning('W003', '私信会话过多', { length: pms.length });
            }
        },
        
        // 4. 检查时间系统
        checkTimeSystem: (collector) => {
            const currentTimer = safeGet(window, 'gameTimer', 0);
            const now = Date.now();
            
            // 检查时间倒流
            if (currentTimer < state.lastGameTimer) {
                collector.addError('E006', '游戏时间倒流', {
                    current: currentTimer,
                    last: state.lastGameTimer,
                    diff: state.lastGameTimer - currentTimer
                });
            }
            
            // 检查时间停滞（超过阈值未变化）
            if (currentTimer === state.lastGameTimer) {
                if (now - state.lastCheckTime > CONFIG.staleTimeThreshold) {
                    collector.addWarning('W004', '游戏时间停滞，可能卡死', {
                        stuckDuration: now - state.lastCheckTime,
                        gameTimer: currentTimer
                    });
                }
            } else {
                // 时间正常流动，重置检查时间
                state.lastCheckTime = now;
                state.lastGameTimer = currentTimer;
            }
            
            // 检查虚拟日期计算
            try {
                if (typeof getVirtualDate === 'function') {
                    const vDate = getVirtualDate();
                    if (!vDate || typeof vDate.year !== 'number') {
                        collector.addError('E007', '虚拟日期计算异常');
                    }
                }
            } catch (e) {
                collector.addError('E008', '虚拟日期函数崩溃', { error: e.message });
            }
        },
        
        // 5. 检查异常增长（作弊或死循环）
        checkAbnormalGrowth: (collector) => {
            const gs = window.gameState;
            if (!gs) return;
            
            const currentFans = gs.fans || 0;
            const currentMoney = gs.money || 0;
            const currentWorks = gs.works || 0;
            
            // 检查粉丝暴涨
            const fanDiff = currentFans - state.lastFans;
            if (fanDiff > CONFIG.maxFanGrowthRate) {
                collector.addError('E009', '粉丝数异常增长', {
                    growth: fanDiff,
                    from: state.lastFans,
                    to: currentFans,
                    suggestion: '可能存在死循环或数值溢出'
                });
            }
            
            // 检查收益暴涨
            const moneyDiff = currentMoney - state.lastMoney;
            if (moneyDiff > CONFIG.maxMoneyGrowthRate) {
                collector.addError('E010', '收益异常增长', {
                    growth: moneyDiff,
                    from: state.lastMoney,
                    to: currentMoney
                });
            }
            
            // 更新状态
            state.lastFans = currentFans;
            state.lastMoney = currentMoney;
            state.lastWorksCount = currentWorks;
        },
        
        // 6. 检查DOM状态
        checkDOMHealth: (collector) => {
            const criticalElements = [
                { id: 'mainPage', name: '主页面' },
                { id: 'loginPage', name: '登录页' },
                { id: 'modal', name: '模态框' },
                { id: 'virtualDateDisplay', name: '时间显示' },
                { id: 'fansCount', name: '粉丝数显示' }
            ];
            
            criticalElements.forEach(el => {
                if (!document.getElementById(el.id)) {
                    collector.addError('E011', `关键DOM元素缺失: ${el.name}`, { id: el.id });
                }
            });
            
            // 检查内存泄漏迹象（body子元素过多）
            if (document.body && document.body.children.length > 500) {
                collector.addWarning('W005', 'DOM元素过多，可能存在内存泄漏', {
                    count: document.body.children.length
                });
            }
        },
        
        // 7. 检查定时器泄漏
        checkTimerLeak: (collector) => {
            // 通过检查特定已知定时器状态来估算
            const gs = window.gameState;
            if (!gs) return;
            
            let activeTimerCount = 0;
            const timerFields = [
                'liveInterval', 'banInterval', 'banDropInterval', 
                'hotSearchInterval', 'publicOpinionInterval',
                'inactivityDropInterval', 'highAdCountDropInterval'
            ];
            
            timerFields.forEach(field => {
                if (gs[field]) activeTimerCount++;
            });
            
            if (activeTimerCount > 20) {
                collector.addWarning('W006', '活动定时器过多', { 
                    count: activeTimerCount,
                    suggestion: '可能存在定时器未清理'
                });
            }
        },
        
        // 8. 检查循环引用（简单检测）
        checkCircularReference: (collector) => {
            try {
                JSON.stringify(window.gameState);
            } catch (e) {
                if (e.message.includes('circular')) {
                    collector.addError('E012', '游戏状态存在循环引用', {
                        error: e.message
                    });
                }
            }
        }
    };
    
    // ==================== 错误报告UI ====================
    const createErrorReport = (report) => {
        // 防止重复创建
        if (document.getElementById('error-detector-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'error-detector-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            color: #fff;
            overflow-y: auto;
        `;
        
        const container = document.createElement('div');
        container.style.cssText = `
            background: #1a1a1a;
            border: 2px solid #ff0050;
            border-radius: 12px;
            padding: 24px;
            max-width: 90%;
            max-height: 90%;
            overflow-y: auto;
            box-shadow: 0 0 50px rgba(255, 0, 80, 0.5);
            position: relative;
        `;
        
        // 标题
        const title = document.createElement('h2');
        title.textContent = '⚠️ 游戏错误检测报告';
        title.style.cssText = `
            color: #ff0050;
            margin: 0 0 16px 0;
            font-size: 20px;
            border-bottom: 1px solid #333;
            padding-bottom: 12px;
        `;
        
        // 错误列表
        let content = `<div style="margin-bottom: 20px; font-size: 14px; line-height: 1.6;">`;
        content += `<p style="color: #999; margin-bottom: 16px;">检测时间: ${report.checkTime}</p>`;
        
        if (report.errors.length > 0) {
            content += `<div style="margin-bottom: 16px;"><strong style="color: #ff0050; font-size: 16px;">严重错误 (${report.errors.length}):</strong><ul style="margin: 8px 0; padding-left: 20px;">`;
            report.errors.forEach(err => {
                content += `
                    <li style="margin-bottom: 12px; color: #ff6b6b;">
                        <strong>[${err.code}]</strong> ${err.message}<br>
                        <span style="color: #666; font-size: 12px;">时间: ${err.timestamp}</span>
                        ${err.details.suggestion ? `<br><span style="color: #ffaa00; font-size: 12px;">建议: ${err.details.suggestion}</span>` : ''}
                    </li>
                `;
            });
            content += `</ul></div>`;
        }
        
        if (report.warnings.length > 0) {
            content += `<div style="margin-bottom: 16px;"><strong style="color: #ffaa00; font-size: 16px;">警告 (${report.warnings.length}):</strong><ul style="margin: 8px 0; padding-left: 20px;">`;
            report.warnings.forEach(warn => {
                content += `
                    <li style="margin-bottom: 8px; color: #ffdd99;">
                        <strong>[${warn.code}]</strong> ${warn.message}
                    </li>
                `;
            });
            content += `</ul></div>`;
        }
        
        content += `</div>`;
        
        // 系统信息
        content += `
            <div style="background: #222; padding: 12px; border-radius: 8px; font-size: 12px; color: #666; margin-bottom: 20px;">
                <div>游戏时间: ${report.systemInfo.gameTimer}</div>
                <div>检测次数: ${report.systemInfo.checkCount}</div>
                <div>屏幕: ${report.systemInfo.screenSize}</div>
            </div>
        `;
        
        container.innerHTML = content;
        
        // 按钮区域
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
        `;
        
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = '刷新页面（推荐）';
        refreshBtn.style.cssText = `
            background: #ff0050;
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        `;
        refreshBtn.onclick = () => location.reload();
        
        const ignoreBtn = document.createElement('button');
        ignoreBtn.textContent = '忽略并继续';
        ignoreBtn.style.cssText = `
            background: #333;
            color: #999;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        `;
        ignoreBtn.onclick = () => {
            overlay.remove();
            state.hasShownError = false;
            // 1小时内不再报告相同错误
            setTimeout(() => state.errorHistory.clear(), 3600000);
        };
        
        const exportBtn = document.createElement('button');
        exportBtn.textContent = '导出报告';
        exportBtn.style.cssText = `
            background: #667eea;
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        `;
        exportBtn.onclick = () => {
            const dataStr = JSON.stringify(report, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `error-report-${Date.now()}.json`;
            link.click();
        };
        
        btnContainer.appendChild(refreshBtn);
        btnContainer.appendChild(ignoreBtn);
        btnContainer.appendChild(exportBtn);
        
        container.appendChild(title);
        container.innerHTML += content;
        container.appendChild(btnContainer);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        state.hasShownError = true;
    };
    
    // ==================== 主检测循环 ====================
    const checkErrors = () => {
        try {
            state.checkCount++;
            const collector = new ErrorCollector();
            
            // 执行所有检查
            if (checks.checkGameObjects(collector)) {
                checks.checkNumericValues(collector);
                checks.checkArrayLengths(collector);
                checks.checkTimeSystem(collector);
                checks.checkAbnormalGrowth(collector);
                checks.checkDOMHealth(collector);
                checks.checkTimerLeak(collector);
                checks.checkCircularReference(collector);
            }
            
            // 如果有错误，显示报告
            if (collector.hasErrors() && !state.hasShownError) {
                const report = collector.getReport();
                
                // 生成错误指纹，防止重复报告
                const fingerprint = report.errors.map(e => e.code).join(',');
                const lastReportTime = state.errorHistory.get(fingerprint) || 0;
                const now = Date.now();
                
                if (now - lastReportTime > CONFIG.errorCooldown) {
                    state.errorHistory.set(fingerprint, now);
                    createErrorReport(report);
                }
            }
            
        } catch (e) {
            // 检测系统自身出错，静默处理，避免干扰游戏
            if (CONFIG.debugMode) {
                console.error('[ErrorDetector] 检测系统异常:', e);
            }
        }
    };
    
    // ==================== 启动检测 ====================
    // 延迟启动，确保游戏初始化完成
    setTimeout(() => {
        checkErrors(); // 立即执行一次
        setInterval(checkErrors, CONFIG.checkInterval);
        if (CONFIG.debugMode) console.log('[ErrorDetector] 错误检测系统已启动');
    }, 5000);
    
    // 暴露全局接口（调试用）
    window.ErrorDetector = {
        checkNow: checkErrors,
        getState: () => ({...state}),
        config: CONFIG
    };
    
})();
