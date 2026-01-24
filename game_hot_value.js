// ==================== 热度值系统 ====================

window.HotValueSystem = {
    // 系统状态
    currentHotValue: 1000,  // 初始热度值
    updateInterval: null,
    displayElement: null,
    
    // 配置项
    config: {
        // 热度值随机变化范围（每3秒）
        minChange: -500,
        maxChange: 500,
        
        // 热度值对粉丝增长的影响系数
        fanGrowthFactor: 0.05,  // 热度值 * 此系数 = 粉丝增长基数
        
        // 更新频率（毫秒）
        updateFrequency: 3000,
        
        // 基准热度值（用于计算倍数）
        baseHotValue: 1000,
        
        // 最小倍数（热度值为0时的倍数）
        minMultiplier: 0.1,
        
        // 最大倍数（无上限，但热度值越高倍数越高）
        maxMultiplier: 5.0
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
            this.currentHotValue = gameState.currentHotValue;
        } else {
            // 初始热度值基于当前粉丝数
            this.currentHotValue = Math.max(1000, gameState.fans * 0.1);
            gameState.currentHotValue = this.currentHotValue;
        }
        
        // 开始自动更新
        this.startAutoUpdate();
        
        console.log('✅ 热度值系统已初始化，初始值：' + this.formatHotValue(this.currentHotValue));
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
        // 随机增减热度值
        const change = Math.floor(
            Math.random() * (this.config.maxChange - this.config.minChange + 1)
        ) + this.config.minChange;
        
        this.currentHotValue = Math.max(0, this.currentHotValue + change);
        
        // 保存到游戏状态
        gameState.currentHotValue = this.currentHotValue;
        
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
    
    // 开始自动更新
    startAutoUpdate: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.updateHotValue();
        }, this.config.updateFrequency);
    },
    
    // 停止自动更新
    stopAutoUpdate: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
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

console.log('🔥 热度值系统脚本已加载');
