// ==================== 游戏启动 ====================
function startGame() {
    const usernameInput = document.getElementById('usernameInput');
    if (!usernameInput) {
        console.error('用户名输入框未找到');
        return;
    }
    
    const username = usernameInput.value.trim();
    if (!username) { 
        showAlert('请输入你的名字', '提示');
        return; 
    }
    
    gameState.username = username;
    gameState.avatar = username.charAt(0).toUpperCase();
    
    const loginPage = document.getElementById('loginPage');
    const mainPage = document.getElementById('mainPage');
    
    if (loginPage) loginPage.style.display = 'none';
    if (mainPage) mainPage.style.display = 'flex';
    
    gameTimer = 0;
    window.gameTimer = gameTimer; // ✅ 修复4：游戏开始时同步
    gameState.gameTimer = 0;
    gameState.lastUpdateTime = 0;
    gameState.lastWorkTime = 0;
    
    // ✅ 关键修复：确保gameStartTime在游戏开始时被正确设置
    gameState.gameStartTime = Date.now(); // 设置为当前时间
    
    realStartTime = Date.now();
    
    // 确保直播历史存在
    if (!gameState.liveHistory) {
        gameState.liveHistory = [];
    }
    
    // ✅ 确保自动清理缓存配置存在
    if (gameState.autoCleanCacheInterval === undefined) gameState.autoCleanCacheInterval = 5;
    if (gameState.autoCleanCacheTimer === undefined) gameState.autoCleanCacheTimer = null;
    
    // ✅ 确保涨掉粉通知列表存在
    if (gameState.fanChangeNotifications === undefined) gameState.fanChangeNotifications = [];
    
    // ✅ 确保今日粉丝统计字段存在
    if (gameState.todayNewFans === undefined) gameState.todayNewFans = 0;
    if (gameState.todayLostFans === undefined) gameState.todayLostFans = 0;
    if (gameState.todayStatsResetDay === undefined) gameState.todayStatsResetDay = 0;

    // ✅ ✅ ✅ 确保全局作品粉丝增长系统存在
    if (gameState.workFanGrowthSystem === undefined) {
        gameState.workFanGrowthSystem = {
            activeWorks: [],
            globalInterval: null,
            totalFanChange: 0,
            isRunning: false
        };
    }
    
    // ✅ 新增：确保基础涨粉增益存在
    if (gameState.baseFanChangeBoost === undefined) gameState.baseFanChangeBoost = 0;
    
    // ✅ 新增：确保消息免打扰状态存在
    if (gameState.doNotDisturb === undefined) gameState.doNotDisturb = false;
    
    for (let i = 0; i < 60; i++) {
        gameState.chartData.fans.push(0);
        gameState.chartData.likes.push(0);
        gameState.chartData.views.push(0);
        gameState.chartData.interactions.push(0);
    }
    gameState.chartData.currentIndex = 0;
    gameState.chartData.currentDay = 0;
    gameState.chartData.lastInteractionTotal = 0;
    
    achievements.forEach(a => a.unlocked = false);
    window.charts = { fans: null, likes: null, views: null, interactions: null };
    
    initGame();
}

// ==================== 游戏重置功能 ====================
function resetGame() {
    stopGameTimer();
    
    // ==================== 修复：全面清理所有定时器 ====================
    // 1. 清理核心状态定时器（8个）
    const intervals = [
        'liveInterval',
        'banInterval', 
        'banDropInterval',
        'hotSearchInterval',
        'publicOpinionInterval', // ✅ 修复：清除舆论风波定时器
        'inactivityDropInterval',
        'highAdCountDropInterval',
        'adOrdersPenaltyInterval'
    ];
    
    intervals.forEach(intervalName => {
        if (gameState[intervalName]) {
            clearInterval(gameState[intervalName]);
            gameState[intervalName] = null;
        }
    });
    
    // 2. 清理全局模块定时器（7个）
    const windowIntervals = [
        'monthlyCheckInterval',
        'exposureCheckInterval',
        'chartRefreshInterval',
        'devCountdownInterval',
        'monthlySummaryInterval',
        'hotSearchCheckInterval',
        'messagesUpdateInterval'
    ];
    
    windowIntervals.forEach(intervalName => {
        if (window[intervalName]) {
            clearInterval(window[intervalName]);
            window[intervalName] = null;
        }
    });
    
    // 3. 清理流量推广定时器（动态数量）
    Object.keys(gameState.trafficWorks).forEach(workIdStr => {
        const trafficData = gameState.trafficWorks[workIdStr];
        if (trafficData && trafficData.interval) {
            clearInterval(trafficData.interval);
        }
    });
    
    // 4. 清理作品级定时器（每个作品可能有多个）
    gameState.worksList.forEach(work => {
        if (work.recommendInterval) clearInterval(work.recommendInterval);
        if (work.controversyInterval) clearInterval(work.controversyInterval);
        if (work.hotInterval) clearInterval(work.hotInterval);
        if (work.hotSearchInterval) clearInterval(work.hotSearchInterval);
        // ✅ 新增：清理作品粉丝增长定时器（旧系统遗留）
        if (work.fanGrowthInterval) clearInterval(work.fanGrowthInterval);
        // ✅ 新增：清理抽奖相关定时器
        if (work.fanGrowthInterval) clearInterval(work.fanGrowthInterval);
        if (work.dataGrowthInterval) clearInterval(work.dataGrowthInterval);
        if (work.fanLossInterval) clearInterval(work.fanLossInterval);
        if (work.manualDrawWarningInterval) clearInterval(work.manualDrawWarningInterval);
        if (work.crazyFanLossInterval) clearInterval(work.crazyFanLossInterval);
    });
    
    // 5. 清理私信生成定时器
    if (typeof stopPrivateMessageGeneration === 'function') {
        stopPrivateMessageGeneration();
    }
    
    // 6. 清理系统消息定时器
    if (typeof stopSystemMessagesTimer === 'function') {
        stopSystemMessagesTimer();
    }
    
    // 7. 清理虚假商单相关定时器
    if (gameState.fakeAdPenaltyInterval) {
        clearInterval(gameState.fakeAdPenaltyInterval);
        gameState.fakeAdPenaltyInterval = null;
    }
    if (window.monthlyCheckInterval) {
        clearInterval(window.monthlyCheckInterval);
        window.monthlyCheckInterval = null;
    }
    if (window.exposureCheckInterval) {
        clearInterval(window.exposureCheckInterval);
        window.exposureCheckInterval = null;
    }
    
    // 8. 清理UI实时更新定时器
    if (window.worksUpdateInterval) {
        clearInterval(window.worksUpdateInterval);
        window.worksUpdateInterval = null;
    }
    if (window.messagesUpdateInterval) {
        clearInterval(window.messagesUpdateInterval);
        window.messagesUpdateInterval = null;
    }

    // ✅ 新增：清理自动清理缓存定时器
    if (gameState.autoCleanCacheTimer) {
        clearInterval(gameState.autoCleanCacheTimer);
        gameState.autoCleanCacheTimer = null;
    }
    if (window.autoCleanCacheInterval) {
        clearInterval(window.autoCleanCacheInterval);
        window.autoCleanCacheInterval = null;
    }

    // ✅ ✅ ✅ 新增：清理全局作品粉丝增长系统
    if (gameState.workFanGrowthSystem) {
        if (gameState.workFanGrowthSystem.globalInterval) {
            clearInterval(gameState.workFanGrowthSystem.globalInterval);
            gameState.workFanGrowthSystem.globalInterval = null;
        }
        gameState.workFanGrowthSystem.activeWorks = [];
        gameState.workFanGrowthSystem.totalFanChange = 0;
        gameState.workFanGrowthSystem.isRunning = false;
    }
    
    // ✅ 新增：清理热度值系统定时器
    if (window.HotValueSystem) {
        window.HotValueSystem.stopAutoUpdate();
    }
    
    // ✅ 新增：清理抽奖系统定时器
    if (typeof window.cleanupRaffleTimers === 'function') {
        window.cleanupRaffleTimers();
    }
    // ==================== 修复结束 ====================
    
    gameState = {
        username: '', 
        userId: '', 
        avatar: '', 
        avatarImage: '', // 重置图片头像
        fans: 0, 
        likes: 0, 
        views: 0, 
        works: 0, 
        money: 0, 
        warnings: 0, 
        isBanned: false, 
        banReason: '', 
        banDaysCount: 0, 
        banStartTime: null,
        isHotSearch: false, 
        hotSearchDaysCount: 0, 
        hotSearchStartTime: null,
        hotSearchInterval: null, 
        hotSearchTitle: '',
        
        // ✅ 修复：确保重置时包含舆论风波状态
        isPublicOpinionCrisis: false,
        publicOpinionDaysCount: 0,
        publicOpinionStartTime: null,
        publicOpinionInterval: null,
        publicOpinionTitle: '',
        
        achievements: [], 
        worksList: [], 
        notifications: [], 
        liveStatus: false, 
        lastUpdateTime: 0,
        lastWorkTime: 0,
        isDroppingFansFromInactivity: false,
        inactivityDropInterval: null,
        inactivityWarningShown: false,
        highAdCountDropInterval: null,
        highAdCountWarningShown: false,
        gameStartTime: 0,
        chartData: { 
            fans: [], 
            likes: [], 
            views: [], 
            interactions: [],
            currentIndex: 0,
            currentDay: 0,
            lastInteractionTotal: 0
        }, 
        liveInterval: null, 
        workUpdateIntervals: [], 
        banInterval: null, 
        banDropInterval: null, 
        trafficWorks: {}, 
        totalInteractions: 0,
        activeFans: 0,
        appealAvailable: true, 
        devMode: false,
        gameTimer: 0,
        realStartTime: 0,
        // 新增虚假商单相关状态
        fakeAdPenalty: null,
        fakeAdPenaltyInterval: null,
        fakeAdBans: 0,
        monthsWithoutFakeAd: 0,
        lastCheckMonth: -1,
        // ✅ 新增功能：重置新状态
        following: [],
        commentLikes: {},
        messages: [],
        privateMessageSystem: {
            conversations: [],
            unreadCount: 0,
            lastCheckTime: 0,
            generationInterval: null
        },
        // ✅ 新增：重置系统消息状态
        systemMessages: {
            unreadCount: 0,
            messages: [],
            hotSearchActiveWorks: []
        },
        
        // ✅ 新增：重置成就相关状态
        commentRepliesCount: 0,
        liveHistory: [],
        unlockedAchievements: [],
        
        // ✅ 新增：重置警告历史
        warningHistory: [],
        
        // ✅ 新增：重置自动清理缓存配置
        autoCleanCacheInterval: 5, // 默认5分钟
        autoCleanCacheTimer: null,
        
        // ✅ 新增：重置涨掉粉通知列表
        fanChangeNotifications: [],
        
        // ✅ 新增：重置今日粉丝统计
        todayNewFans: 0,
        todayLostFans: 0,
        todayStatsResetDay: 0,

        // ✅ ✅ ✅ 新增：重置全局作品粉丝增长系统
        workFanGrowthSystem: {
            activeWorks: [],
            globalInterval: null,
            totalFanChange: 0,
            isRunning: false
        },
        
        // ✅ 新增：重置基础涨粉增益
        baseFanChangeBoost: 0,
        
        // ✅ 新增：重置消息免打扰状态
        doNotDisturb: false,
        
        // ✅ 新增：重置热度值
        currentHotValue: 1000
    };
    
    gameTimer = 0;
    window.gameTimer = gameTimer; // ✅ 修复3：重置时同步
    realStartTime = Date.now();
    
    for (let i = 0; i < 60; i++) {
        gameState.chartData.fans.push(0);
        gameState.chartData.likes.push(0);
        gameState.chartData.views.push(0);
        gameState.chartData.interactions.push(0);
    }
    gameState.chartData.currentIndex = 0;
    gameState.chartData.currentDay = 0;
    gameState.chartData.lastInteractionTotal = 0;
    
    achievements.forEach(a => a.unlocked = false);
    window.charts = { fans: null, likes: null, views: null, interactions: null };
    
    return true;
}

// ==================== 页面加载 ====================
window.onload = function() { 
    try {
        const saved = localStorage.getItem('streamerGameState');
        let hasValidSave = false;
        
        if (saved) {
            try {
                const savedState = JSON.parse(saved);
                if (savedState.username && typeof savedState.username === 'string' && savedState.username.trim() !== '') {
                    hasValidSave = true;
                } else {
                    console.warn('存档无效：用户名缺失或格式错误');
                    localStorage.removeItem('streamerGameState');
                }
            } catch (error) {
                console.error('解析存档失败:', error);
                localStorage.removeItem('streamerGameState');
            }
        }
        
        if (hasValidSave) {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainPage').style.display = 'flex';
            initGame();
        } else {
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('mainPage').style.display = 'none';
        }
        
        const modalElement = document.getElementById('modal');
        if (modalElement) {
            modalElement.onclick = function(e) { 
                if (e.target === this) closeModal(); 
            };
        }
        
    } catch (error) {
        console.error('页面初始化失败:', error);
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainPage').style.display = 'none';
    }
};

// ==================== 窗口关闭前保存 ====================
window.addEventListener('beforeunload', function() {
    // 保存前清理私信
    if (typeof cleanupPrivateMessages === 'function') {
        cleanupPrivateMessages();
    }
    
    // ✅ 新增：停止系统消息定时器
    if (typeof stopSystemMessagesTimer === 'function') {
        stopSystemMessagesTimer();
    }
    
    // ✅ 新增：停止自动清理缓存
    if (typeof stopAutoCleanCache === 'function') {
        stopAutoCleanCache();
    }
    
    // ✅ ✅ ✅ 新增：停止全局作品粉丝增长系统
    if (typeof window.stopGlobalWorkFanGrowth === 'function') {
        window.stopGlobalWorkFanGrowth();
    }
    
    // ✅ 新增：停止热度值系统
    if (window.HotValueSystem) {
        window.HotValueSystem.stopAutoUpdate();
    }
    
    // ✅ 新增：清理抽奖系统定时器
    if (typeof window.cleanupRaffleTimers === 'function') {
        window.cleanupRaffleTimers();
    }
    
    stopGameTimer();
    saveGame();
});

// ==================== 全局函数绑定 ====================
window.gameState = gameState;
window.achievements = achievements;
window.violationKeywords = violationKeywords;
window.startGame = startGame;
window.initGame = initGame;
window.resetGame = resetGame;
window.gameTimer = gameTimer;
window.startGameTimer = startGameTimer;
window.stopGameTimer = stopGameTimer;
window.getVirtualDaysPassed = getVirtualDaysPassed;
window.formatVirtualDate = formatVirtualDate;
window.getVirtualDate = getVirtualDate;
window.saveGame = saveGame;
window.formatNumber = formatNumber;
window.formatTime = formatTime;
window.startDailyStatsResetCheck = startDailyStatsResetCheck; // ✅ 导出函数

console.log('游戏核心已加载，startGame函数:', typeof startGame);
