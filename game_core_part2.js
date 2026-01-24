// ==================== 成就列表 ====================
const achievements = [
    { id: 1, name: '初入江湖', desc: '获得第一个粉丝', icon: '🌱', unlocked: false },
    { id: 2, name: '小有名气', desc: '粉丝达到1000', icon: '🌟', unlocked: false },
    { id: 3, name: '网红达人', desc: '粉丝达到10万', icon: '⭐', unlocked: false },
    { id: 4, name: '顶级流量', desc: '粉丝达到1000万', icon: '⭐', unlocked: false },
    { id: 5, name: '爆款制造机', desc: '单条视频播放量破百万', icon: '🔥', unlocked: false },
    { id: 6, name: '点赞狂魔', desc: '累计获得10万个赞', icon: '👍', unlocked: false },
    { id: 7, name: '高产创作者', desc: '发布100个作品', icon: '📹', unlocked: false },
    { id: 8, name: '直播新星', desc: '首次直播获得1000观看', icon: '📱', unlocked: false },
    { id: 9, name: '收益第一桶金', desc: '获得首次收益', icon: '💰', unlocked: false },
    { id: 10, name: '百万富翁', desc: '累计收益达到100万', icon: '💎', unlocked: false },
    { id: 11, name: '话题之王', desc: '单条动态获得1万转发', icon: '🔁', unlocked: false },
    { id: 12, name: '评论互动达人', desc: '单条作品获得5000评论', icon: '💬', unlocked: false },
    // ✅ 已移除: { id: 13, name: '全勤主播', desc: '连续30天更新', icon: '📅', unlocked: false },
    { id: 14, name: '逆风翻盘', desc: '从封号中申诉成功', icon: '🔄', unlocked: false },
    { id: 15, name: '幸运儿', desc: '触发50次随机事件', icon: '🍀', unlocked: false },
    { id: 16, name: '社交达人', desc: '关注1000个用户', icon: '👥', unlocked: false },
    // ✅ 已移除: { id: 17, name: '夜猫子', desc: '凌晨3点还在直播', icon: '🦉', unlocked: false },
    // ✅ 已移除: { id: 18, name: '早起鸟儿', desc: '早上6点开始直播', icon: '🐦', unlocked: false },
    { id: 19, name: '宠粉狂魔', desc: '回复1000条评论', icon: '💖', unlocked: false },
    { id: 20, name: '传奇主播', desc: '解锁所有成就', icon: '👑', unlocked: false },
    
    // ✅ 添加负面成就到主成就列表
    { id: 21, name: '商单新人', desc: '完成首个商单', icon: '💼', unlocked: false },
    { id: 22, name: '广告达人', desc: '完成10个商单', icon: '📢', unlocked: false },
    { id: 23, name: '百万单王', desc: '单次商单收入超50万', icon: '💵', unlocked: false },
    // ✅ 已移除: { id: 24, name: '火眼金睛', desc: '识别并拒绝5个违规商单', icon: '👀', unlocked: false },
    { id: 25, name: '商单大师', desc: '完成50个商单且未违规', icon: '🏆', unlocked: false },
    { id: 26, name: '赌徒', desc: '完成10个虚假商单', icon: '🎰', unlocked: false },
    { id: 27, name: '身败名裂', desc: '因虚假商单被封号3次', icon: '💀', unlocked: false },
    { id: 28, name: '诚信经营', desc: '连续3个月无虚假商单', icon: '✅', unlocked: false }
];

// ==================== 违规关键词 ====================
const violationKeywords = ['暴力', '色情', '政治', '谣言', '诈骗', '盗版', '侵权', '辱骂', '歧视', '毒品'];

// ==================== 基础工具函数 ====================
function formatNumber(num) {
    if (num >= 100000000) return (num / 100000000).toFixed(1) + '亿';
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return num.toString();
}

// ==================== 修改后的formatTime函数 ====================
function formatTime(timestamp) {
    const diff = gameTimer - timestamp;
    if (diff < 0) return '未来';
    
    const virtualMinutes = Math.floor(diff / VIRTUAL_MINUTE_MS);
    const virtualHours = Math.floor(diff / VIRTUAL_HOUR_MS);
    const virtualDays = Math.floor(diff / VIRTUAL_DAY_MS);
    
    // 小于1分钟：显示"刚刚"
    if (virtualMinutes < 1) return '刚刚';
    
    // 1分钟到60分钟：显示"x分钟前"
    if (virtualMinutes < 60) return `${virtualMinutes}分钟前`;
    
    // 1小时到24小时：显示"x小时前"
    if (virtualHours < 24) return `${virtualHours}小时前`;
    
    // 1天到3天：显示"x天前"
    if (virtualDays < 3) return `${virtualDays}天前`;
    
    // 超过3天：显示日期
    const targetVirtualDays = Math.floor(timestamp / VIRTUAL_DAY_MS);
    const targetDate = getDateFromVirtualDays(targetVirtualDays);
    
    const currentDate = getVirtualDate();
    const yearsDiff = currentDate.year - targetDate.year;
    
    // 超过1年：显示"xxxx年xx月xx日"
    if (yearsDiff >= 1) {
        return `${targetDate.year}年${String(targetDate.month).padStart(2, '0')}月${String(targetDate.day).padStart(2, '0')}日`;
    }
    
    // 3天到1年：显示"xx月xx日"
    return `${String(targetDate.month).padStart(2, '0')}月${String(targetDate.day).padStart(2, '0')}日`;
}

// ==================== 辅助函数：根据虚拟天数计算日期 ====================
function getDateFromVirtualDays(virtualDays) {
    const currentYear = GAME_START_VIRTUAL_DATE.year + Math.floor(virtualDays / 365);
    const dayOfYear = virtualDays % 365;
    
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let remainingDays = dayOfYear;
    let month = 0;
    
    for (let i = 0; i < monthDays.length; i++) {
        if (remainingDays < monthDays[i]) {
            month = i;
            break;
        }
        remainingDays -= monthDays[i];
    }
    
    return {
        year: currentYear,
        month: month + 1,
        day: remainingDays + 1
    };
}

function saveGame() {
    // 保存前清理私信
    if (typeof cleanupPrivateMessages === 'function') {
        cleanupPrivateMessages();
    }
    
    gameState.gameTimer = gameTimer;
    gameState.realStartTime = realStartTime;
    localStorage.setItem('streamerGameState', JSON.stringify(gameState));
}

// ==================== 游戏初始化 ====================
function initGame() {
    // ✅ 修复：确保所有舆论风波属性存在（防止undefined导致toggle异常）
    if (gameState.isPublicOpinionCrisis === undefined) gameState.isPublicOpinionCrisis = false;
    if (gameState.publicOpinionDaysCount === undefined) gameState.publicOpinionDaysCount = 0;
    if (gameState.publicOpinionStartTime === undefined) gameState.publicOpinionStartTime = null;
    if (gameState.publicOpinionInterval === undefined) gameState.publicOpinionInterval = null;
    if (gameState.publicOpinionTitle === undefined) gameState.publicOpinionTitle = '';
    
    // 初始化头像图片状态
    if (gameState.avatarImage === undefined) gameState.avatarImage = '';
    
    // ✅ 新增功能：确保新状态存在
    if (gameState.following === undefined) gameState.following = [];
    if (gameState.commentLikes === undefined) gameState.commentLikes = {};
    
    // ✅ 新增：确保消息列表存在
    if (gameState.messages === undefined) gameState.messages = [];
    
    // ✅ 新增：确保私信系统存在
    if (gameState.privateMessageSystem === undefined) {
        gameState.privateMessageSystem = {
            conversations: [],
            unreadCount: 0,
            lastCheckTime: 0,
            generationInterval: null
        };
    } else {
        // 确保旧存档也能正确初始化
        if (gameState.privateMessageSystem.activeWorks === undefined) {
            gameState.privateMessageSystem.activeWorks = [];
        }
        if (gameState.privateMessageSystem.globalInterval === undefined) {
            gameState.privateMessageSystem.globalInterval = null;
        }
        if (gameState.privateMessageSystem.totalFanChange === undefined) {
            gameState.privateMessageSystem.totalFanChange = 0;
        }
        if (gameState.privateMessageSystem.isRunning === undefined) {
            gameState.privateMessageSystem.isRunning = false;
        }
    }
    
    // ✅ 新增：确保系统消息状态存在
    if (gameState.systemMessages === undefined) {
        gameState.systemMessages = {
            unreadCount: 0,
            messages: [],
            hotSearchActiveWorks: []
        };
    }
    
    // ✅ 新增：确保成就相关状态存在
    if (gameState.commentRepliesCount === undefined) gameState.commentRepliesCount = 0;
    if (gameState.liveHistory === undefined) gameState.liveHistory = [];
    if (gameState.unlockedAchievements === undefined) gameState.unlockedAchievements = [];
    
    // ✅ 新增：确保警告历史存在
    if (gameState.warningHistory === undefined) gameState.warningHistory = [];
    
    // ✅ 新增：确保自动清理缓存配置存在
    if (gameState.autoCleanCacheInterval === undefined) gameState.autoCleanCacheInterval = 5;
    if (gameState.autoCleanCacheTimer === undefined) gameState.autoCleanCacheTimer = null;
    
    // ✅ 新增：确保涨掉粉通知列表存在
    if (gameState.fanChangeNotifications === undefined) gameState.fanChangeNotifications = [];
    
    // ✅ 新增：确保今日粉丝统计字段存在
    if (gameState.todayNewFans === undefined) gameState.todayNewFans = 0;
    if (gameState.todayLostFans === undefined) gameState.todayLostFans = 0;
    if (gameState.todayStatsResetDay === undefined) gameState.todayStatsResetDay = 0;

    // ✅ ✅ ✅ 新增：确保全局作品粉丝增长系统存在（读取存档时）
    if (gameState.workFanGrowthSystem === undefined) {
        gameState.workFanGrowthSystem = {
            activeWorks: [],
            globalInterval: null,
            totalFanChange: 0,
            isRunning: false
        };
    } else {
        // 确保旧存档也能正确初始化
        if (gameState.privateMessageSystem.activeWorks === undefined) {
            gameState.privateMessageSystem.activeWorks = [];
        }
        if (gameState.privateMessageSystem.globalInterval === undefined) {
            gameState.privateMessageSystem.globalInterval = null;
        }
        if (gameState.privateMessageSystem.totalFanChange === undefined) {
            gameState.privateMessageSystem.totalFanChange = 0;
        }
        if (gameState.privateMessageSystem.isRunning === undefined) {
            gameState.privateMessageSystem.isRunning = false;
        }
    }
    
    // ✅ 新增：确保基础涨粉增益存在
    if (gameState.baseFanChangeBoost === undefined) gameState.baseFanChangeBoost = 0;
    
    // ✅ 新增：确保消息免打扰状态存在
    if (gameState.doNotDisturb === undefined) gameState.doNotDisturb = false;
    
    const saved = localStorage.getItem('streamerGameState');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
            
            if (!gameState.username || typeof gameState.username !== 'string' || gameState.username.trim() === '') {
                console.warn('存档无效：用户名缺失或格式错误');
                localStorage.removeItem('streamerGameState');
                showAlert('存档无效，数据已清除', '错误');
                document.getElementById('loginPage').style.display = 'flex';
                document.getElementById('mainPage').style.display = 'none';
                return;
            }
            
            if (gameState.gameTimer === undefined) {
                console.log('检测到旧存档，正在转换时间格式...');
                const now = Date.now();
                const realTimePassed = now - (gameState.realStartTime || now);
                gameTimer = (gameState.lastUpdateTime || 0) + realTimePassed;
                gameState.gameTimer = gameTimer;
                gameState.lastUpdateTime = gameState.lastUpdateTime || 0;
                gameState.lastWorkTime = gameState.lastWorkTime || gameState.gameStartTime || 0;
                
                // ✅ 修复：只在存档有时间数据时才设置，否则设为当前时间
                if (!gameState.gameStartTime || gameState.gameStartTime <= 0) {
                    gameState.gameStartTime = now; // 修复：设置为当前时间
                } else {
                    gameState.gameStartTime = gameState.gameStartTime;
                }
                
                gameState.isDroppingFansFromInactivity = gameState.isDroppingFansFromInactivity || false;
                gameState.inactivityDropInterval = gameState.inactivityDropInterval || null;
                gameState.inactivityWarningShown = gameState.inactivityWarningShown || false;
                gameState.highAdCountDropInterval = gameState.highAdCountDropInterval || null;
                gameState.highAdCountWarningShown = gameState.highAdCountWarningShown || false;
                console.log(`存档转换完成：游戏计时器已恢复为 ${Math.floor(gameTimer / 1000)} 秒`);
            } else {
                gameTimer = gameState.gameTimer || 0;
                window.gameTimer = gameTimer; // ✅ 修复1：加载存档时同步
                
                // ✅ 修复：加载存档时确保gameStartTime有效
                if (!gameState.gameStartTime || gameState.gameStartTime <= 0) {
                    gameState.gameStartTime = Date.now(); // 修复：设置为当前时间
                } else {
                    gameState.gameStartTime = gameState.gameStartTime;
                }
            }
            
            // ✅ 修复：确保自动清理缓存配置存在
            if (gameState.autoCleanCacheInterval === undefined) gameState.autoCleanCacheInterval = 5;
            if (gameState.autoCleanCacheTimer === undefined) gameState.autoCleanCacheTimer = null;
            
            // ✅ 新增：确保涨掉粉通知列表存在
            if (gameState.fanChangeNotifications === undefined) gameState.fanChangeNotifications = [];
            
            // ✅ 新增：确保今日粉丝统计字段存在
            if (gameState.todayNewFans === undefined) gameState.todayNewFans = 0;
            if (gameState.todayLostFans === undefined) gameState.todayLostFans = 0;
            if (gameState.todayStatsResetDay === undefined) gameState.todayStatsResetDay = 0;

            // ✅ ✅ ✅ 新增：确保全局作品粉丝增长系统存在（读取存档时）
            if (gameState.privateMessageSystem === undefined) {
                gameState.privateMessageSystem = {
                    activeWorks: [],
                    globalInterval: null,
                    totalFanChange: 0,
                    isRunning: false
                };
            } else {
                // 确保旧存档也能正确初始化
                if (gameState.privateMessageSystem.activeWorks === undefined) {
                    gameState.privateMessageSystem.activeWorks = [];
                }
                if (gameState.privateMessageSystem.globalInterval === undefined) {
                    gameState.privateMessageSystem.globalInterval = null;
                }
                if (gameState.privateMessageSystem.totalFanChange === undefined) {
                    gameState.privateMessageSystem.totalFanChange = 0;
                }
                if (gameState.privateMessageSystem.isRunning === undefined) {
                    gameState.privateMessageSystem.isRunning = false;
                }
            }
            
            // ✅ 新增：确保基础涨粉增益存在
            if (gameState.baseFanChangeBoost === undefined) gameState.baseFanChangeBoost = 0;
            
            // ✅ 新增：确保消息免打扰状态存在
            if (gameState.doNotDisturb === undefined) gameState.doNotDisturb = false;
            
            realStartTime = Date.now();
            gameState.liveInterval = null; 
            gameState.workUpdateIntervals = []; 
            gameState.banInterval = null; 
            gameState.banDropInterval = null; 
            gameState.hotSearchInterval = null;
            gameState.publicOpinionInterval = null; // ✅ 修复：重置定时器引用
            
            // ✅ 新增功能：确保新状态存在
            if (gameState.following === undefined) gameState.following = [];
            if (gameState.commentLikes === undefined) gameState.commentLikes = {};
            
            // ✅ 新增：确保消息列表存在
            if (gameState.messages === undefined) gameState.messages = [];
            
            // ✅ 新增：确保私信系统存在
            if (gameState.privateMessageSystem === undefined) {
                gameState.privateMessageSystem = {
                    conversations: [],
                    unreadCount: 0,
                    lastCheckTime: 0,
                    generationInterval: null
                };
            }
            
            // ✅ 新增：确保系统消息状态存在
            if (gameState.systemMessages === undefined) {
                gameState.systemMessages = {
                    unreadCount: 0,
                    messages: [],
                    hotSearchActiveWorks: []
                };
            }
            
            // ✅ 新增：确保成就相关状态存在
            if (gameState.commentRepliesCount === undefined) gameState.commentRepliesCount = 0;
            if (gameState.liveHistory === undefined) gameState.liveHistory = [];
            if (gameState.unlockedAchievements === undefined) gameState.unlockedAchievements = [];
            
            // ✅ 新增：确保警告历史存在
            if (gameState.warningHistory === undefined) gameState.warningHistory = [];
            
            if (gameState.chartData) {
                if (gameState.chartData.fans.length === 0) {
                    for (let i = 0; i < 60; i++) {
                        gameState.chartData.fans.push(0);
                        gameState.chartData.likes.push(0);
                        gameState.chartData.views.push(0);
                        gameState.chartData.interactions.push(0);
                    }
                    gameState.chartData.currentIndex = 0;
                    gameState.chartData.currentDay = 0;
                    gameState.chartData.lastInteractionTotal = 0;
                } else {
                    if (gameState.chartData.fans.length < 60) {
                        const oldLength = gameState.chartData.fans.length;
                        for (let i = oldLength; i < 60; i++) {
                            gameState.chartData.fans.unshift(0);
                            gameState.chartData.likes.unshift(0);
                            gameState.chartData.views.unshift(0);
                            gameState.chartData.interactions.unshift(0);
                        }
                    }
                    if (!gameState.chartData.interactions || gameState.chartData.interactions.length < 60) {
                        gameState.chartData.interactions = [];
                        for (let i = 0; i < 60; i++) {
                            gameState.chartData.interactions.push(0);
                        }
                    }
                    if (gameState.chartData.currentIndex === undefined) {
                        const virtualDays = Math.floor(getVirtualDaysPassed());
                        gameState.chartData.currentIndex = (virtualDays - 1) % 60;
                        gameState.chartData.currentDay = virtualDays - 1;
                    }
                    if (gameState.chartData.lastInteractionTotal === undefined) {
                        gameState.chartData.lastInteractionTotal = gameState.totalInteractions || 0;
                    }
                }
            }
            
            window.charts = { fans: null, likes: null, views: null, interactions: null };
            
            if (gameState.achievements && gameState.achievements.length > 0) {
                console.log(`恢复${gameState.achievements.length}个已解锁成就`);
                gameState.achievements.forEach(achievementId => {
                    const achievement = achievements.find(a => a.id === achievementId);
                    if (achievement) {
                        achievement.unlocked = true;
                    }
                });
            } else {
                console.log('无成就需要恢复');
            }
            
            if (gameState.isBanned && gameState.banStartTime !== null) {
                const banStartTimer = gameState.banStartTime;
                const timePassed = gameTimer - banStartTimer;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                
                if (typeof showBanNotice === 'function') {
                    const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                    getVirtualDaysPassed = () => daysPassed;
                    showBanNotice();
                    getVirtualDaysPassed = originalGetVirtualDaysPassed;
                }
                
                if (!gameState.banInterval) {
                    gameState.banInterval = setInterval(() => {
                        if (gameState.isBanned && gameState.fans > 0) {
                            const fanLoss = Math.floor(Math.random() * 90) + 10;
                            gameState.fans = Math.max(0, gameState.fans - fanLoss);
                            // ✅ 修改：使用涨掉粉通知系统
                            addFanChangeNotification('⬇️', `失去了${fanLoss.toLocaleString()}个粉丝`, '封禁期间', 'loss', fanLoss);
                            updateDisplay();
                        }
                    }, 1000);
                }
            }
            
            if (gameState.isHotSearch && gameState.hotSearchStartTime !== null) {
                const hotSearchStartTimer = gameState.hotSearchStartTime;
                const timePassed = gameTimer - hotSearchStartTimer;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                
                if (typeof showHotSearchNotice === 'function') {
                    const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                    getVirtualDaysPassed = () => daysPassed;
                    showHotSearchNotice();
                    getVirtualDaysPassed = originalGetVirtualDaysPassed;
                }
                
                if (!gameState.hotSearchInterval) {
                    gameState.hotSearchInterval = setInterval(() => {
                        if (gameState.isHotSearch) {
                            let fanGrowth = Math.floor(Math.random() * 100) + 50;
                            
                            // ✅ 新增：应用热度值倍数（只影响涨粉）
                            if (fanGrowth > 0) {
                                const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
                                    ? window.getHotValueMultiplier() 
                                    : 1.0;
                                fanGrowth = Math.floor(fanGrowth * hotMultiplier);
                            }
                            
                            gameState.fans += fanGrowth;
                            // ✅ 修复：使用 addFanChangeNotification 替代 showNotification
                            if (typeof addFanChangeNotification === 'function') {
                                addFanChangeNotification('⬆️', `获得了${fanGrowth.toLocaleString()}个新粉丝`, '热搜效应', 'gain', fanGrowth);
                            }
                            if (typeof updateDisplay === 'function') updateDisplay();
                        }
                    }, 1000);
                }
            }
            
            // ✅ 修复：正确恢复舆论风波状态
            if (gameState.isPublicOpinionCrisis && gameState.publicOpinionStartTime !== null) {
                const timePassed = gameTimer - gameState.publicOpinionStartTime;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                
                if (typeof showPublicOpinionNotice === 'function') {
                    const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                    getVirtualDaysPassed = () => daysPassed;
                    showPublicOpinionNotice();
                    getVirtualDaysPassed = originalGetVirtualDaysPassed;
                }
                
                if (!gameState.publicOpinionInterval) {
                    gameState.publicOpinionInterval = setInterval(() => {
                        if (gameState.isPublicOpinionCrisis && gameState.fans > 0) {
                            const fanLoss = Math.floor(Math.random() * 50) + 10;
                            gameState.fans = Math.max(0, gameState.fans - fanLoss);
                            // ✅ 修复：使用 addFanChangeNotification 替代 showNotification
                            if (typeof addFanChangeNotification === 'function') {
                                addFanChangeNotification('⬇️', `失去了${fanLoss.toLocaleString()}个粉丝`, '舆论风波', 'loss', fanLoss);
                            }
                            if (typeof updateDisplay === 'function') updateDisplay();
                        }
                    }, 1000);
                }
            }
            
            Object.keys(gameState.trafficWorks).forEach(workIdStr => {
                const workId = Number(workIdStr);
                const trafficData = gameState.trafficWorks[workIdStr];
                if (trafficData && trafficData.isActive) {
                    const trafficStartTimer = trafficData.startTime;
                    const timePassed = gameTimer - trafficStartTimer;
                    const daysPassed = timePassed / VIRTUAL_DAY_MS;
                    
                    if (typeof startTrafficProcess === 'function') {
                        const originalGetVirtualDaysPassed = getVirtualDaysPassed;
                        getVirtualDaysPassed = () => daysPassed;
                        startTrafficProcess(workId);
                        getVirtualDaysPassed = originalGetVirtualDaysPassed;
                    }
                }
            });
            
            // ✅ ✅ ✅ 关键新增：恢复抽奖活动状态
            console.log('开始恢复抽奖活动状态...');
            let raffleCount = 0;
            gameState.worksList.forEach(work => {
                if (work.isRaffle) {
                    raffleCount++;
                    console.log(`[恢复抽奖] 作品 ${work.id} 状态: ${work.raffleStatus}`);
                    if (typeof window.resumeRaffleState === 'function') {
                        window.resumeRaffleState(work.id);
                    }
                }
            });
            if (raffleCount > 0) {
                console.log(`✅ 共恢复 ${raffleCount} 个抽奖活动`);
            } else {
                console.log('没有需要恢复的抽奖活动');
            }
            
            if (gameState.devMode) {
                const devBtn = document.getElementById('devFloatButton');
                if (devBtn) devBtn.style.display = 'block';
            }
            
            console.log('开始恢复作品状态...');
            gameState.worksList.forEach(work => {
                // ✅ 修复：恢复推荐状态
                if (work.isRecommended && work.recommendEndTime !== null) {
                    const timePassed = gameTimer - work.recommendEndTime;
                    const daysLeft = -timePassed / VIRTUAL_DAY_MS;
                    
                    if (daysLeft <= 0) {
                        console.log(`作品${work.id}的推荐状态已过期，清理状态`);
                        work.isRecommended = false;
                        work.recommendEndTime = null;
                        if (work.recommendInterval) {
                            clearInterval(work.recommendInterval);
                            work.recommendInterval = null;
                        }
                    } else {
                        console.log(`作品${work.id}的推荐状态恢复，剩余${daysLeft.toFixed(1)}天`);
                        if (typeof startRecommendEffect === 'function') {
                            startRecommendEffect(work.id, daysLeft, true);
                        }
                    }
                }
                
                // ✅ 修复：恢复争议状态
                if (work.isControversial && work.controversyEndTime !== null) {
                    const timePassed = gameTimer - work.controversyEndTime;
                    const daysLeft = -timePassed / VIRTUAL_DAY_MS;
                    
                    if (daysLeft <= 0) {
                        console.log(`作品${work.id}的争议状态已过期，清理状态`);
                        work.isControversial = false;
                        work.controversyEndTime = null;
                        if (work.controversyInterval) {
                            clearInterval(work.controversyInterval);
                            work.controversyInterval = null;
                        }
                    } else {
                        console.log(`作品${work.id}的争议状态恢复，剩余${daysLeft.toFixed(1)}天`);
                        if (typeof startControversyEffect === 'function') {
                            startControversyEffect(work.id, daysLeft, true);
                        }
                    }
                }
                
                // ✅ 修复：恢复热搜状态
                if (work.isHot && work.hotEndTime !== null) {
                    const timePassed = gameTimer - work.hotEndTime;
                    const daysLeft = -timePassed / VIRTUAL_DAY_MS;
                    
                    if (daysLeft <= 0) {
                        console.log(`作品${work.id}的热搜状态已过期，清理状态`);
                        work.isHot = false;
                        work.hotEndTime = null;
                        if (work.hotInterval) {
                            clearInterval(work.hotInterval);
                            work.hotInterval = null;
                        }
                    } else {
                        console.log(`作品${work.id}的热搜状态恢复，剩余${daysLeft.toFixed(1)}天`);
                        if (typeof startPostHotEffect === 'function') {
                            startPostHotEffect(work.id, daysLeft, true);
                        }
                    }
                }
                
                // ✅ ✅ ✅ 关键修复：恢复作品到全局粉丝增长系统
                if (work.growthEndTime && work.growthEndTime > gameTimer) {
                    const timeLeft = (work.growthEndTime - gameTimer) / VIRTUAL_DAY_MS;
                    console.log(`[作品恢复] 作品 ${work.id} 的粉丝增长期未结束，剩余 ${timeLeft.toFixed(1)} 天，加入全局系统`);
                    
                    // ✅ 新增：调用全局添加函数
                    if (typeof window.addWorkToGlobalFanGrowth === 'function') {
                        window.addWorkToGlobalFanGrowth(work.id, false);
                    }
                } else if (work.growthEndTime && work.fanGrowthInterval) {
                    // 如果增长期已过但定时器还在，清理它（旧系统遗留问题）
                    if (work.fanGrowthInterval) {
                        clearInterval(work.fanGrowthInterval);
                        work.fanGrowthInterval = null;
                        console.log(`[作品清理] 作品 ${work.id} 的增长期已过，清理遗留定时器`);
                    }
                }
            });
            console.log('作品状态恢复完成');
            
            // ==================== 关键修复：游戏加载时恢复虚假商单惩罚 ====================
            if (typeof window.resumeFakeAdPenalty === 'function') {
                console.log('正在恢复虚假商单惩罚定时器...');
                setTimeout(() => {
                    window.resumeFakeAdPenalty();
                }, 1000); // 延迟1秒确保所有状态同步
            }
            
            // ✅ 新增：恢复热搜效果
            if (typeof window.resumeHotSearchEffects === 'function') {
                console.log('正在恢复热搜效果...');
                setTimeout(() => {
                    window.resumeHotSearchEffects();
                }, 1500);
            }
            
            // ✅ 新增：恢复自动清理缓存设置
            if (typeof startAutoCleanCache === 'function') {
                console.log('正在恢复自动清理缓存设置...');
                setTimeout(() => {
                    startAutoCleanCache();
                }, 2000);
            }
            
            // ✅ ✅ ✅ 新增：游戏加载时启动全局作品粉丝增长系统
            if (typeof window.startGlobalWorkFanGrowth === 'function') {
                setTimeout(() => {
                    window.startGlobalWorkFanGrowth();
                }, 3000);
            }
            
        } catch (error) {
            console.error('加载存档失败:', error);
            localStorage.removeItem('streamerGameState');
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('mainPage').style.display = 'none';
            return;
        }
    } else {
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
    }
    
    if (!gameState.userId) {
        gameState.userId = 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    
    // ✅ 新增：启动每日数据重置检查
    startDailyStatsResetCheck();
    
    // ✅ ✅ ✅ 关键新增：启动抽奖状态检查
    if (typeof startRaffleStatusCheck === 'function') {
        console.log('启动抽奖状态检查循环...');
        startRaffleStatusCheck();
    } else {
        console.warn('警告：startRaffleStatusCheck 函数未定义，抽奖系统可能未正确加载');
    }
    
    startGameTimer();
    
    const liveBtn = document.getElementById('liveControlBtn');
    if (liveBtn) {
        liveBtn.style.display = 'block';
        liveBtn.classList.toggle('active', gameState.liveStatus);
    }
    
    if (typeof updateDisplay === 'function') updateDisplay();
    if (typeof startWorkUpdates === 'function') startWorkUpdates();
    if (typeof startGameLoop === 'function') startGameLoop();
    
    // ✅ 初始化私信系统
    if (typeof initPrivateMessageOnGameLoad === 'function') {
        initPrivateMessageOnGameLoad();
    }
    
    // ✅ 新增：初始化系统消息系统
    if (typeof initSystemMessages === 'function') {
        initSystemMessages();
    }
    
    // ✅ 新增：启动自动清理缓存
    if (typeof startAutoCleanCache === 'function') {
        startAutoCleanCache();
    }
    
    saveGame();
    
    // 关键修复：确保 window.gameState 与局部变量同步
    window.gameState = gameState;
}

// ✅ 新增：每日数据重置检查函数
function startDailyStatsResetCheck() {
    // 每秒检查一次是否需要重置今日数据
    setInterval(() => {
        const currentVirtualDays = Math.floor(getVirtualDaysPassed());
        
        // 如果记录的resetDay不等于当前天数，说明是新的一天
        if (gameState.todayStatsResetDay !== currentVirtualDays) {
            // 重置今日数据
            gameState.todayNewFans = 0;
            gameState.todayLostFans = 0;
            gameState.todayStatsResetDay = currentVirtualDays;
            
            console.log(`新的一天开始，重置今日粉丝统计数据 (虚拟天数: ${currentVirtualDays})`);
            
            // 如果粉丝页面打开，立即更新显示
            const fansPage = document.getElementById('fansPage');
            if (fansPage && fansPage.classList.contains('active')) {
                if (typeof renderFansPage === 'function') {
                    renderFansPage();
                }
            }
        }
    }, 1000);
}
