// ==================== 热度值系统 ====================

window.HotValueSystem = {
    // 系统状态
    currentHotValue: 1000,  // 初始热度值
    updateInterval: null,
    displayElement: null,
    
    // ✅ 新增：不更新惩罚检测定时器
    inactivityCheckInterval: null,
    
    // 配置项
    config: {
        // 热度值随机变化范围（每3秒）
        minChange: -50,
        maxChange: 50,
        
        // 热度值上限（10万）
        maxHotValue: 100000,
        
        // 热度值对粉丝增长的影响系数
        fanGrowthFactor: 0.05,  // 热度值 * 此系数 = 粉丝增长基数
        
        // 更新频率（毫秒）
        updateFrequency: 3000,
        
        // 基准热度值（用于计算倍数）
        baseHotValue: 1000,
        
        // 最小倍数（热度值为0时的倍数）
        minMultiplier: 0.1,
        
        // 最大倍数（无上限，但热度值越高倍数越高）
        maxMultiplier: 5.0,
        
        // ✅ 新增：不更新惩罚配置
        inactivityThresholdDays: 3,  // 3天开始惩罚
        inactivityBaseMinDrop: 1,    // 基础最小扣除
        inactivityBaseMaxDrop: 100,  // 基础最大扣除
        inactivityRangeIncrement: 10, // 每天增加的范围
        inactivityMaxDrop: 200       // 扣除上限
    },
    
    // 初始化系统
    init: function() {
        if (!gameState) {
            console.error('游戏状态未加载，无法初始化热度值系统');
            return;
        }
        
        // 获取显示元素
        this.displayElement = document.getElementById('virtualTimeStat');
        if (!this.displayElement) {
            console.warn('热度值显示元素未找到');
        }
        
        // 从存档恢复热度值（如果有）
        if (gameState.currentHotValue !== undefined) {
            // 限制不超过上限（防止旧存档超过上限）
            this.currentHotValue = Math.min(this.config.maxHotValue, gameState.currentHotValue);
        } else {
            // 初始热度值基于当前粉丝数
            this.currentHotValue = Math.max(1000, gameState.fans * 0.1);
            // 限制不超过上限
            this.currentHotValue = Math.min(this.config.maxHotValue, this.currentHotValue);
            gameState.currentHotValue = this.currentHotValue;
        }
        
        // 初始化历史记录数组（如果不存在）
        if (!gameState.hotValueHistory) {
            gameState.hotValueHistory = [];
        }
        
        // 开始自动更新
        this.startAutoUpdate();
        
        console.log('✅ 热度值系统已初始化，初始值：' + this.formatHotValue(this.currentHotValue));
    },
    
    // ✅ 新增：执行不更新惩罚检测
    performInactivityCheck: function() {
        if (!gameState || !gameState.lastWorkTime) return;
        
        // 计算距离上次更新的天数
        const daysSinceLastWork = (gameTimer - gameState.lastWorkTime) / VIRTUAL_DAY_MS;
        
        // 如果超过3天未更新
        if (daysSinceLastWork >= this.config.inactivityThresholdDays) {
            // 计算额外天数（超过3天的部分）
            const extraDays = Math.floor(daysSinceLastWork - this.config.inactivityThresholdDays);
            
            // 计算扣除范围：基础1-100，每多一天范围+10
            let minDrop = this.config.inactivityBaseMinDrop + (extraDays * this.config.inactivityRangeIncrement);
            let maxDrop = this.config.inactivityBaseMaxDrop + (extraDays * this.config.inactivityRangeIncrement);
            
            // 确保上限为200
            if (maxDrop > this.config.inactivityMaxDrop) {
                maxDrop = this.config.inactivityMaxDrop;
            }
            
            // 确保最小值不超过最大值
            if (minDrop > maxDrop) {
                minDrop = maxDrop;
            }
            
            // 随机生成扣除值
            const dropAmount = Math.floor(Math.random() * (maxDrop - minDrop + 1)) + minDrop;
            
            // 扣除热度值（不低于0）
            this.currentHotValue = Math.max(0, this.currentHotValue - dropAmount);
            gameState.currentHotValue = this.currentHotValue;
            
            // 更新显示
            this.updateDisplay();
            
            console.log(`[热度值惩罚] -${dropAmount} (已${Math.floor(daysSinceLastWork)}天未更新，范围${minDrop}-${maxDrop})`);
        }
    },
    
    // 获取热度值影响倍数（核心方法：供其他模块调用）
    getHotValueMultiplier: function() {
        // 以1000热度值为基准（1.0倍）
        // 热度值越高，倍数越高；热度值越低，倍数越低
        // 公式：倍数 = (当前热度值 / 基准热度值) ^ 0.5 （平方根曲线，避免增长过快）
        let multiplier = Math.sqrt(this.currentHotValue / this.config.baseHotValue);
        
        // 限制最小倍数（避免热度值为0时完全无法涨粉）
        multiplier = Math.max(this.config.minMultiplier, multiplier);
        
        // 限制最大倍数（可选，避免过高热度值导致涨粉失控）
        // multiplier = Math.min(this.config.maxMultiplier, multiplier);
        
        return multiplier;
    },
    
    // 计算热度值变化对粉丝的影响（热度值系统自身的粉丝增长）
    calculateFanGrowth: function() {
        // 基础增长 = 热度值 * 系数
        let growth = this.currentHotValue * this.config.fanGrowthFactor;
        
        // 添加随机波动
        growth += (Math.random() - 0.5) * growth * 0.2;
        
        // 确保最少也有少量波动（避免完全停滞）
        if (Math.abs(growth) < 1) {
            growth = (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3);
        }
        
        // 应用热度值倍数（热度值系统自身的增长也受热度值影响）
        const multiplier = this.getHotValueMultiplier();
        growth = growth * multiplier;
        
        return Math.floor(growth);
    },
    
    // 随机更新热度值
    updateHotValue: function() {
        const oldValue = this.currentHotValue;
        
        // 随机增减热度值
        const change = Math.floor(
            Math.random() * (this.config.maxChange - this.config.minChange + 1)
        ) + this.config.minChange;
        
        // 更新热度值并限制范围（0 到 maxHotValue）
        this.currentHotValue = Math.min(
            this.config.maxHotValue, 
            Math.max(0, this.currentHotValue + change)
        );
        
        // 保存到游戏状态
        gameState.currentHotValue = this.currentHotValue;
        
        // ==================== 记录热度值变化（无论大小） ====================
        const actualChange = this.currentHotValue - oldValue;
        if (actualChange !== 0) {
            this.recordHotValueChange(actualChange);
        }
        // ==================================================================
        
        // 根据热度值计算粉丝变化
        const fanChange = this.calculateFanGrowth();
        
        if (fanChange !== 0) {
            gameState.fans = Math.max(0, gameState.fans + fanChange);
            
            // 更新今日统计
            if (fanChange > 0) {
                gameState.todayNewFans += fanChange;
            } else {
                gameState.todayLostFans += Math.abs(fanChange);
            }
            
            // 更新显示（但不通知热度值变化）
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        }
        
        // 更新热度值显示
        this.updateDisplay();
    },
    
    // ✅ 新增：记录热度值变化到历史（统一由核心模块管理）
    recordHotValueChange: function(changeAmount) {
        if (!gameState.hotValueHistory) {
            gameState.hotValueHistory = [];
        }
        
        // 构建原因
        let reason = '系统波动';
        if (changeAmount > 0) {
            reason = '热度上涨';
        } else {
            reason = '热度下降';
        }
        
        const record = {
            time: gameTimer,
            value: this.currentHotValue,
            change: changeAmount,
            reason: reason,
            formattedTime: formatVirtualDate(true)
        };
        
        // 添加到开头
        gameState.hotValueHistory.unshift(record);
        
        // 只保留8条
        if (gameState.hotValueHistory.length > 8) {
            gameState.hotValueHistory = gameState.hotValueHistory.slice(0, 8);
        }
        
        saveGame();
        
        // 如果全屏界面已打开，通知它刷新
        if (window.HotValueFullscreen && typeof window.HotValueFullscreen.renderHistoryList === 'function') {
            const page = document.getElementById('hotValuePage');
            if (page && page.classList.contains('active')) {
                window.HotValueFullscreen.renderHistoryList();
            }
        }
    },
    
    // 开始自动更新
    startAutoUpdate: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // 原有热度值随机更新（每3秒）
        this.updateInterval = setInterval(() => {
            this.updateHotValue();
        }, this.config.updateFrequency);
        
        // ✅ 新增：启动不更新惩罚检测（每秒）
        if (this.inactivityCheckInterval) {
            clearInterval(this.inactivityCheckInterval);
        }
        this.inactivityCheckInterval = setInterval(() => {
            this.performInactivityCheck();
        }, 1000);
    },
    
    // 停止自动更新
    stopAutoUpdate: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // ✅ 新增：清理不更新惩罚检测
        if (this.inactivityCheckInterval) {
            clearInterval(this.inactivityCheckInterval);
            this.inactivityCheckInterval = null;
        }
    },
    
    // 更新热度值显示
    updateDisplay: function() {
        if (!this.displayElement) return;
        
        this.displayElement.textContent = this.formatHotValue(this.currentHotValue);
        
        // 根据热度值高低设置颜色
        if (this.currentHotValue >= 5000) {
            this.displayElement.style.color = '#ff0050'; // 高热度 - 红色
        } else if (this.currentHotValue >= 2000) {
            this.displayElement.style.color = '#ff6b00'; // 中热度 - 橙色
        } else if (this.currentHotValue >= 1000) {
            this.displayElement.style.color = '#00f2ea'; // 正常 - 青色
        } else {
            this.displayElement.style.color = '#999'; // 低热度 - 灰色
        }
    },
    
    // 格式化热度值显示
    formatHotValue: function(value) {
        if (value >= 100000000) {
            return (value / 100000000).toFixed(1) + 'M';
        } else if (value >= 10000) {
            return (value / 10000).toFixed(1) + 'W';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return Math.floor(value).toString();
    },
    
    // 获取当前热度值
    getCurrentHotValue: function() {
        return this.currentHotValue;
    },
    
    // 获取热度值变化（兼容旧代码）
    getHotValueChange: function() {
        return 0; // 返回0，因为不需要显示变化
    },
    
    // 清理系统
    cleanup: function() {
        this.stopAutoUpdate();
        console.log('🔥 热度值系统已清理');
    }
};

// ==================== 全局函数 ====================

// 初始化热度值系统
window.initHotValueSystem = function() {
    if (window.HotValueSystem) {
        window.HotValueSystem.init();
    }
};

// 启动热度值系统
window.startHotValueSystem = function() {
    if (window.HotValueSystem) {
        window.HotValueSystem.startAutoUpdate();
        console.log('🔥 热度值系统已启动');
    }
};

// 停止热度值系统
window.stopHotValueSystem = function() {
    if (window.HotValueSystem) {
        window.HotValueSystem.stopAutoUpdate();
        console.log('🔥 热度值系统已停止');
    }
};

// 手动更新热度值
window.updateHotValue = function() {
    if (window.HotValueSystem) {
        window.HotValueSystem.updateHotValue();
    }
};

// 获取热度值影响倍数（供其他模块调用）
window.getHotValueMultiplier = function() {
    if (window.HotValueSystem) {
        return window.HotValueSystem.getHotValueMultiplier();
    }
    return 1.0; // 默认返回1.0倍（无影响）
};

// ✅ 新增：手动触发不更新惩罚检查（供调试使用）
window.checkInactivityHotValueDrop = function() {
    if (window.HotValueSystem) {
        window.HotValueSystem.performInactivityCheck();
    }
};

// 清理热度值系统
window.cleanupHotValueSystem = function() {
    if (window.HotValueSystem) {
        window.HotValueSystem.cleanup();
    }
};

// ==================== 绑定到游戏核心事件 ====================

// 在游戏核心中绑定热度值系统
document.addEventListener('DOMContentLoaded', function() {
    // 确保游戏核心已加载
    const checkGameReady = setInterval(() => {
        if (typeof gameState !== 'undefined') {
            clearInterval(checkGameReady);
            
            // 初始化热度值系统
            setTimeout(() => {
                window.initHotValueSystem();
            }, 500);
        }
    }, 100);
});

console.log('🔥 热度值系统脚本已加载（已添加3天不更新惩罚机制 + 全局记录）');