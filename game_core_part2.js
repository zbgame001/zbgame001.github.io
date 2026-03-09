// ==================== 成就列表（已移出到 game_achievements.js） ====================
// 原 achievements 数组已删除，请确保 game_achievements.js 已加载

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
    // 确保有起始日期
    if (!gameState.virtualStartDate) {
        gameState.virtualStartDate = generateRandomVirtualStartDate();
    }
    
    const startDate = gameState.virtualStartDate;
    
    // 从起始日期开始计算
    let currentYear = startDate.year;
    let currentMonth = startDate.month;
    let currentDay = startDate.day + virtualDays;
    
    // 处理日期进位
    while (true) {
        const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
        const dayInCurrentMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][currentMonth - 1];
        
        if (currentDay > dayInCurrentMonth) {
            currentDay -= dayInCurrentMonth;
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        } else {
            break;
        }
    }
    
    return {
        year: currentYear,
        month: currentMonth,
        day: currentDay
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
    // ✅ 修复：确保虚拟起始日期存在（新游戏或旧存档兼容）
    if (!gameState.virtualStartDate) {
        gameState.virtualStartDate = generateRandomVirtualStartDate();
        console.log('生成随机虚拟起始日期:', gameState.virtualStartDate);
    }
    
    // ✅ 修复：确保所有舆论风波属性存在（防止undefined导致toggle异常）
    if (gameState.isPublicOpinionCrisis === undefined) gameState.isPublicOpinionCrisis = false;
    if (gameState.publicOpinionDaysCount === undefined) gameState.publicOpinionDaysCount = 0;
    if (gameState.publicOpinionStartTime === undefined) gameState.publicOpinionStartTime = null;
    if (gameState.publicOpinionInterval === undefined) gameState.publicOpinionInterval = null;
    if (gameState.publicOpinionTitle === undefined) gameState.publicOpinionTitle = '';
    
    // ✅ 新增：确保封号类型相关属性存在
    if (gameState.banType === undefined) gameState.banType = 0;
    if (gameState.originalUsername === undefined) gameState.originalUsername = '';
    if (gameState.originalAvatar === undefined) gameState.originalAvatar = '';
    if (gameState.originalAvatarImage === undefined) gameState.originalAvatarImage = '';
    
    // ==================== 关键修复：确保 preBanPublicWorks 存在且不为 undefined ====================
    if (gameState.preBanPublicWorks === undefined) gameState.preBanPublicWorks = [];
    // 确保它是一个数组（防止存档损坏变成其他类型）
    if (!Array.isArray(gameState.preBanPublicWorks)) {
        console.warn('[封禁恢复] preBanPublicWorks 不是数组，重置为空数组');
        gameState.preBanPublicWorks = [];
    }
    // ===================================================================================
    
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
            
            // ✅ 关键新增：如果是新存档或旧存档没有虚拟起始日期，生成一个
            if (!gameState.virtualStartDate) {
                gameState.virtualStartDate = generateRandomVirtualStartDate();
                console.log('为旧存档生成随机虚拟起始日期:', gameState.virtualStartDate);
            }
            
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
            
            // ==================== 关键修复：再次确保 preBanPublicWorks 从存档中正确恢复 ====================
            if (!gameState.preBanPublicWorks || !Array.isArray(gameState.preBanPublicWorks)) {
                console.warn('[封禁恢复] 存档中的 preBanPublicWorks 无效，重置为空数组');
                gameState.preBanPublicWorks = [];
            }
            // ==========================================================================================
            
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
            
            // ✅ 新增：确保封号类型相关属性存在（读取存档时）
            if (gameState.banType === undefined) gameState.banType = 0;
            if (gameState.originalUsername === undefined) gameState.originalUsername = '';
            if (gameState.originalAvatar === undefined) gameState.originalAvatar = '';
            if (gameState.originalAvatarImage === undefined) gameState.originalAvatarImage = '';
            if (gameState.preBanPublicWorks === undefined) gameState.preBanPublicWorks = [];
            
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
            
            // ✅ 成就恢复逻辑：通过全局 achievements 对象
            if (window.achievements && gameState.achievements && gameState.achievements.length > 0) {
                console.log(`恢复${gameState.achievements.length}个已解锁成就`);
                gameState.achievements.forEach(achievementId => {
                    const achievement = window.achievements.find(a => a.id === achievementId);
                    if (achievement) {
                        achievement.unlocked = true;
                    }
                });
            } else {
                console.log('无成就需要恢复');
            }
            
            // ✅ 关键新增：如果处于封禁状态，根据封号类型恢复显示
            if (gameState.isBanned && gameState.banStartTime !== null) {
                const banStartTimer = gameState.banStartTime;
                const timePassed = gameTimer - banStartTimer;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                
                // 根据封号类型恢复显示状态
                switch(gameState.banType) {
                    case 0:
                        // 类型0：普通封号，无需特殊处理
                        console.log('恢复封号类型0：普通封号');
                        break;
                        
                    case 1:
                        // 类型1：作品私密+头像空白+名字UID
                        console.log('恢复封号类型1：作品私密+头像空白+名字UID');
                        
                        // ==================== 关键修复：确保 preBanPublicWorks 有效 ====================
                        // 如果 preBanPublicWorks 为空（可能是旧存档或数据损坏），需要重新生成
                        if (!gameState.preBanPublicWorks || gameState.preBanPublicWorks.length === 0) {
                            // 在封禁状态下，所有作品都被设为私密，我们需要锁定所有当前私密的作品
                            // 保守策略：将所有当前非私密的作品ID加入列表，然后将所有作品设为私密
                            const currentPublicWorks = gameState.worksList.filter(w => !w.isPrivate);
                            if (currentPublicWorks.length > 0) {
                                gameState.preBanPublicWorks = currentPublicWorks.map(w => w.id);
                                console.log(`[封禁恢复] preBanPublicWorks 为空，已将 ${currentPublicWorks.length} 个当前公开作品加入锁定列表`);
                            } else {
                                // 如果当前所有作品都已经是私密的，我们无法确定哪些是封禁前的公开作品
                                // 安全起见，将所有私密作品也加入列表，确保它们都被锁定
                                gameState.preBanPublicWorks = gameState.worksList.map(w => w.id);
                                console.log(`[封禁恢复] 所有作品已私密，已将所有 ${gameState.preBanPublicWorks.length} 个作品加入锁定列表作为安全策略`);
                            }
                        }
                        // =============================================================================
                        
                        // 确保所有作品都是私密的
                        gameState.worksList.forEach(work => {
                            work.isPrivate = true;
                        });
                        // ✅ 作品数改为总作品数（私密作品也计入）
                        gameState.works = gameState.worksList.length;
                        // 确保头像和名字是封禁状态
                        gameState.avatar = '';
                        gameState.avatarImage = '';
                        gameState.username = gameState.userId;
                        break;
                        
                    case 2:
                        // 类型2：名字UID+头像空白
                        console.log('恢复封号类型2：名字UID+头像空白');
                        gameState.avatar = '';
                        gameState.avatarImage = '';
                        gameState.username = gameState.userId;
                        break;
                        
                    case 3:
                        // 类型3：所有作品私密
                        console.log('恢复封号类型3：所有作品私密');
                        
                        // ==================== 关键修复：确保 preBanPublicWorks 有效（同 case 1）====================
                        // 如果 preBanPublicWorks 为空，需要重新生成
                        if (!gameState.preBanPublicWorks || gameState.preBanPublicWorks.length === 0) {
                            const currentPublicWorks = gameState.worksList.filter(w => !w.isPrivate);
                            if (currentPublicWorks.length > 0) {
                                gameState.preBanPublicWorks = currentPublicWorks.map(w => w.id);
                                console.log(`[封禁恢复] 类型3 preBanPublicWorks 为空，已将 ${currentPublicWorks.length} 个当前公开作品加入锁定列表`);
                            } else {
                                // 安全策略：将所有作品加入列表
                                gameState.preBanPublicWorks = gameState.worksList.map(w => w.id);
                                console.log(`[封禁恢复] 类型3 所有作品已私密，已将所有 ${gameState.preBanPublicWorks.length} 个作品加入锁定列表`);
                            }
                        } else {
                            // 如果 preBanPublicWorks 不为空，但要确保它包含的是封禁前的公开作品
                            // 此时不应该覆盖它，因为存档中的值才是正确的
                            console.log(`[封禁恢复] 类型3 使用存档中的 preBanPublicWorks，包含 ${gameState.preBanPublicWorks.length} 个作品`);
                        }
                        // =================================================================================
                        
                        // 将所有作品设为私密
                        gameState.worksList.forEach(work => {
                            work.isPrivate = true;
                        });
                        // ✅ 作品数改为总作品数
                        gameState.works = gameState.worksList.length;
                        break;
                }
                
                // ✅ 修改：重新统计总播放量、总点赞、总互动（基于所有作品，不按公开过滤）
                gameState.views = gameState.worksList
                    .filter(w => w.type === 'video' || w.type === 'live')
                    .reduce((sum, w) => sum + w.views, 0);
                gameState.likes = gameState.worksList.reduce((sum, w) => sum + w.likes, 0);
                gameState.totalInteractions = gameState.worksList.reduce((sum, w) => {
                    return sum + w.comments + w.likes + w.shares;
                }, 0);
                
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
        
        // ✅ 新增：确保封号类型相关属性存在
        if (gameState.banType === undefined) gameState.banType = 0;
        if (gameState.originalUsername === undefined) gameState.originalUsername = '';
        if (gameState.originalAvatar === undefined) gameState.originalAvatar = '';
        if (gameState.originalAvatarImage === undefined) gameState.originalAvatarImage = '';
        if (gameState.preBanPublicWorks === undefined) gameState.preBanPublicWorks = [];
        
        for (let i = 0; i < 60; i++) {
            gameState.chartData.fans.push(0);
            gameState.chartData.likes.push(0);
            gameState.chartData.views.push(0);
            gameState.chartData.interactions.push(0);
        }
        gameState.chartData.currentIndex = 0;
        gameState.chartData.currentDay = 0;
        gameState.chartData.lastInteractionTotal = 0;
        
        // ✅ 成就初始化：通过全局 achievements 对象重置解锁状态
        if (window.achievements) {
            window.achievements.forEach(a => a.unlocked = false);
        }
        window.charts = { fans: null, likes: null, views: null, interactions: null };
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
    
    // ✅ 关键新增：存档加载/游戏启动后重新设置封号涨粉拦截器
    setupBanInterceptor();
    console.log('[封号拦截] 游戏初始化完成，涨粉拦截器已激活');
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