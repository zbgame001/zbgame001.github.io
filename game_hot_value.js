// ==================== 热度值系统 ====================

window.HotValueSystem = {
    // 系统状态
    currentHotValue: 0,
    previousHotValue: 0,
    lastUpdateTime: 0,
    updateInterval: null,
    displayElement: null,
    
    // 配置项
    config: {
        // 数据变化权重配置
        weights: {
            fanChangeSpeed: 10,      // 粉丝变化速度权重
            viewGrowthSpeed: 20,     // 播放量增长速度权重
            likeGrowthSpeed: 15,     // 点赞增长速度权重
            commentGrowthSpeed: 10,  // 评论增长速度权重
            totalViews: 0.01,        // 总播放量权重
            totalLikes: 0.005,       // 总点赞数权重
            eventBonus: 100          // 事件加成基数
        },
        
        // 特殊状态加成
        statusBonus: {
            hotSearch: 5000,         // 热搜状态加成
            ban: -10000,             // 封禁状态减成
            publicOpinion: -3000,    // 舆论风波减成
            traffic: 2000            // 流量推广加成
        },
        
        // 更新频率（毫秒）
        updateFrequency: 3000
    },
    
    // 历史数据用于计算变化率
    history: {
        fans: [],
        views: [],
        likes: [],
        comments: [],
        timestamp: []
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
        
        // 初始化当前热度值
        this.calculateCurrentHotValue();
        this.previousHotValue = this.currentHotValue;
        
        // 开始自动更新
        this.startAutoUpdate();
        
        console.log('✅ 热度值系统已初始化，初始值：' + this.formatHotValue(this.currentHotValue));
    },
    
    // 计算当前热度值
    calculateCurrentHotValue: function() {
        try {
            let hotValue = 0;
            
            // 1. 基础数据权重计算
            hotValue += gameState.fans * this.config.weights.totalViews;
            hotValue += gameState.views * this.config.weights.totalViews;
            hotValue += gameState.likes * this.config.weights.totalLikes;
            
            // 2. 计算变化速度
            const now = gameTimer || 0;
            const timeDiff = Math.max(1, now - this.lastUpdateTime) / VIRTUAL_DAY_MS; // 转换为虚拟天
            
            // 计算各项数据变化率
            const fanChange = (gameState.fans - (this.history.fans[0] || gameState.fans)) / timeDiff;
            const viewChange = (gameState.views - (this.history.views[0] || gameState.views)) / timeDiff;
            const likeChange = (gameState.likes - (this.history.likes[0] || gameState.likes)) / timeDiff;
            const totalComments = gameState.worksList.reduce((sum, work) => sum + (work.comments || 0), 0);
            const commentChange = (totalComments - (this.history.comments[0] || totalComments)) / timeDiff;
            
            // 变化率占比计算
            const maxChange = 1000; // 最大变化量限制
            const normalizedFanChange = Math.max(-1, Math.min(1, fanChange / maxChange));
            const normalizedViewChange = Math.max(-1, Math.min(1, viewChange / maxChange));
            const normalizedLikeChange = Math.max(-1, Math.min(1, likeChange / maxChange));
            const normalizedCommentChange = Math.max(-1, Math.min(1, commentChange / (maxChange * 0.5)));
            
            hotValue += normalizedFanChange * this.config.weights.fanChangeSpeed * 1000;
            hotValue += normalizedViewChange * this.config.weights.viewGrowthSpeed * 1000;
            hotValue += normalizedLikeChange * this.config.weights.likeGrowthSpeed * 1000;
            hotValue += normalizedCommentChange * this.config.weights.commentGrowthSpeed * 1000;
            
            // 3. 特殊状态加成
            if (gameState.isHotSearch) hotValue += this.config.statusBonus.hotSearch;
            if (gameState.isBanned) hotValue += this.config.statusBonus.ban;
            if (gameState.isPublicOpinionCrisis) hotValue += this.config.statusBonus.publicOpinion;
            
            // 4. 流量推广加成
            const activeTraffic = Object.keys(gameState.trafficWorks).filter(id => gameState.trafficWorks[id].isActive);
            hotValue += activeTraffic.length * this.config.statusBonus.traffic;
            
            // 5. 活跃度加成
            const worksThisDay = gameState.worksList.filter(work => 
                (now - work.time) < VIRTUAL_DAY_MS
            ).length;
            hotValue += worksThisDay * 500;
            
            // 6. 直播状态加成
            if (gameState.liveStatus) hotValue += 2000;
            
            // 确保热度值不为负
            this.currentHotValue = Math.max(0, Math.floor(hotValue));
            
            return this.currentHotValue;
            
        } catch (error) {
            console.error('计算热度值失败:', error);
            return this.currentHotValue || 0;
        }
    },
    
    // 更新历史数据
    updateHistory: function() {
        const now = gameTimer || 0;
        
        // 添加当前数据到历史记录
        this.history.fans.push(gameState.fans);
        this.history.views.push(gameState.views);
        this.history.likes.push(gameState.likes);
        this.history.comments.push(
            gameState.worksList.reduce((sum, work) => sum + (work.comments || 0), 0)
        );
        this.history.timestamp.push(now);
        
        // 只保留最近10个记录（约30秒）
        const maxRecords = 10;
        if (this.history.fans.length > maxRecords) {
            this.history.fans.shift();
            this.history.views.shift();
            this.history.likes.shift();
            this.history.comments.shift();
            this.history.timestamp.shift();
        }
    },
    
    // 开始自动更新
    startAutoUpdate: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.update();
        }, this.config.updateFrequency);
    },
    
    // 停止自动更新
    stopAutoUpdate: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },
    
    // 更新热度值
    update: function() {
        this.previousHotValue = this.currentHotValue;
        this.calculateCurrentHotValue();
        this.updateHistory();
        this.lastUpdateTime = gameTimer || 0;
        
        // 更新显示
        this.updateDisplay();
        
        // 输出调试信息
        if (window.debugMode || gameState.devMode) {
            const change = this.currentHotValue - this.previousHotValue;
            const changePercent = ((change / (this.previousHotValue || 1)) * 100).toFixed(1);
            console.log(`🔥 热度值更新: ${this.formatHotValue(this.previousHotValue)} → ${this.formatHotValue(this.currentHotValue)} (${change >= 0 ? '+' : ''}${changePercent}%)`);
        }
    },
    
    // 更新显示
    updateDisplay: function() {
        if (!this.displayElement) return;
        
        const change = this.currentHotValue - this.previousHotValue;
        const hotValueFormatted = this.formatHotValue(this.currentHotValue);
        
        // 设置文本
        this.displayElement.textContent = hotValueFormatted;
        
        // 根据变化设置颜色（只改颜色，不弹通知）
        if (change > 0) {
            this.displayElement.style.color = '#00f2ea'; // 绿色上涨
        } else if (change < 0) {
            this.displayElement.style.color = '#ff0050'; // 红色下降
        } else {
            this.displayElement.style.color = '#ccc'; // 灰色持平
        }
        
        // 添加动画效果
        this.displayElement.classList.add('updating');
        setTimeout(() => {
            this.displayElement.classList.remove('updating');
        }, 300);
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
    
    // 获取热度值变化
    getHotValueChange: function() {
        return this.currentHotValue - this.previousHotValue;
    },
    
    // 清理系统
    cleanup: function() {
        this.stopAutoUpdate();
        this.history = {
            fans: [],
            views: [],
            likes: [],
            comments: [],
            timestamp: []
        };
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
        window.HotValueSystem.update();
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

console.log('🔥 热度值系统脚本已加载');
