// game_events.js 完整代码

// ==================== 热搜系统 ====================
function startHotSearch(title) {
    // ✅ 关键修复：如果账号已被封禁，无法上热搜
    if (gameState.isBanned) {
        console.log('账号被封禁，无法上热搜');
        return;
    }
    
    if (gameState.isHotSearch) return;
    gameState.isHotSearch = true;
    gameState.hotSearchDaysCount = Math.floor(Math.random() * 3) + 1;
    gameState.hotSearchStartTime = gameTimer; // 使用游戏计时器
    gameState.hotSearchTitle = title || '🔥 话题热议中';
    
    // ✅ 正面热搜不产生负面热度
    startHotValueBoost(gameState.hotSearchDaysCount, false);
    
    if (!gameState.hotSearchInterval) gameState.hotSearchInterval = setInterval(() => {
        if (gameState.isHotSearch) {
            let fanGrowth = Math.floor(Math.random() * 100) + 50;
            
            // ==================== 应用热度值倍数（只影响涨粉） ====================
            const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
                ? window.getHotValueMultiplier() 
                : 1.0;
            fanGrowth = Math.floor(fanGrowth * hotMultiplier);
            // ==================================================================
            
            gameState.fans += fanGrowth;
            // ✅ 修复：使用涨掉粉通知系统，并更新今日新增粉丝
            gameState.todayNewFans += fanGrowth; // ✅ 新增：累计今日新增粉丝
            addFanChangeNotification('⬆️', `获得了${fanGrowth.toLocaleString()}个新粉丝`, '热搜效应', 'gain', fanGrowth);
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        }
    }, 1000);
    // ✅ 修改：只显示小弹窗通知
    showEventPopup('🎉 热搜上榜', `恭喜！${title}，将持续${gameState.hotSearchDaysCount}天！`);
    updateDisplay();
}

function showHotSearchNotice() {
    if (!gameState.isHotSearch) return;
    const hotSearchNotice = document.getElementById('hotSearchNotice');
    if (!hotSearchNotice) return;
    
    // 修改：基于游戏计时器计算剩余时间
    const timePassed = gameTimer - gameState.hotSearchStartTime;
    const daysPassed = timePassed / VIRTUAL_DAY_MS;
    const timeLeft = Math.max(0, gameState.hotSearchDaysCount - daysPassed);
    
    hotSearchNotice.innerHTML = `<div style="font-size:14px;font-weight:bold">${gameState.hotSearchTitle}</div><div style="font-size:12px;">热搜剩余：${Math.ceil(timeLeft)}天</div>`;
    if (timeLeft <= 0) endHotSearch();
}

function endHotSearch() {
    // ✅ 正面热搜结束后开始掉热度（非负面）
    if (gameState.isHotSearch) {
        endHotValueBoostAndStartDrop(gameState.hotSearchDaysCount, false);
    }
    
    gameState.isHotSearch = false;
    gameState.hotSearchTitle = '';
    if (gameState.hotSearchInterval) {
        clearInterval(gameState.hotSearchInterval);
        gameState.hotSearchInterval = null;
    }
    // ✅ 修改：只显示小弹窗通知
    showEventPopup('📉 热搜结束', '热搜期已结束，期待下次上榜！');
    updateDisplay();
}

// ==================== 负面热度值追踪系统（新增）====================
function initNegativeHotValueSystem() {
    // 确保负面热度追踪存在
    if (!gameState.negativeHotValue) {
        gameState.negativeHotValue = 0;
    }
    if (!gameState.totalHotValueGained) {
        gameState.totalHotValueGained = 0;
    }
    if (!gameState.currentNegativeBoostEndTime) {
        gameState.currentNegativeBoostEndTime = 0;
    }
    if (!gameState.currentNegativeDropEndTime) {
        gameState.currentNegativeDropEndTime = 0;
    }
}

// ✅ 获取负面热度比例（0-1之间）
function getNegativeHotValueRatio() {
    if (!gameState.totalHotValueGained || gameState.totalHotValueGained <= 0) return 0;
    return (gameState.negativeHotValue || 0) / gameState.totalHotValueGained;
}

// ✅ 增加负面热度值记录
function addNegativeHotValue(amount) {
    initNegativeHotValueSystem();
    gameState.negativeHotValue = (gameState.negativeHotValue || 0) + amount;
    gameState.totalHotValueGained = (gameState.totalHotValueGained || 0) + amount;
    console.log(`[负面热度] 增加${amount}，当前负面热度：${gameState.negativeHotValue}，总热度：${gameState.totalHotValueGained}`);
}

// ✅ 增加正面热度值记录
function addPositiveHotValue(amount) {
    initNegativeHotValueSystem();
    gameState.totalHotValueGained = (gameState.totalHotValueGained || 0) + amount;
    console.log(`[正面热度] 增加${amount}，总热度：${gameState.totalHotValueGained}`);
}

// ==================== 账号封禁（新增四种封号类型 + 负面热度机制）====================
function banAccount(reason) {
    if (gameState.isBanned) return;
    
    // ✅ 关键修复：如果正在热搜，立即停止结束
    if (gameState.isHotSearch) {
        endHotSearch();
        // ✅ 显示热搜被中断的通知
        showEventPopup('🚫 热搜中断', '账号被封禁，热搜状态已立即结束');
    }
    
    // ✅ 随机选择封号类型（0-3）
    const banType = Math.floor(Math.random() * 4);
    gameState.banType = banType;
    gameState.isBanned = true;
    gameState.banReason = reason;
    gameState.banDaysCount = Math.floor(Math.random() * 30) + 1;
    gameState.banStartTime = gameTimer;
    gameState.appealAvailable = true;
    
    // ✅ 保存封禁前的原始数据
    gameState.originalUsername = gameState.username;
    gameState.originalAvatar = gameState.avatar;
    gameState.originalAvatarImage = gameState.avatarImage;
    
    // ✅ 根据封号类型执行相应处理
    switch(banType) {
        case 0:
            // 类型0：原有普通封号
            console.log('封号类型0：普通封号');
            break;
            
        case 1:
            // 类型1：所有作品私密 + 头像变空白 + 名字变UID
            console.log('封号类型1：作品私密+头像空白+名字UID');
            // 保存当前公开的作品ID列表
            gameState.preBanPublicWorks = gameState.worksList
                .filter(w => !w.isPrivate)
                .map(w => w.id);
            // 将所有作品设为私密
            gameState.worksList.forEach(work => {
                work.isPrivate = true;
            });
            // ✅ 作品数改为总作品数（私密作品也计入）
            gameState.works = gameState.worksList.length;
            // 头像变空白字符
            gameState.avatar = '';
            gameState.avatarImage = '';
            // 名字变UID
            gameState.username = gameState.userId;
            break;
            
        case 2:
            // 类型2：名字变UID + 头像变空白
            console.log('封号类型2：名字UID+头像空白');
            // 头像变空白字符
            gameState.avatar = '';
            gameState.avatarImage = '';
            // 名字变UID
            gameState.username = gameState.userId;
            break;
            
        case 3:
            // 类型3：所有作品私密
            console.log('封号类型3：所有作品私密');
            // 保存当前公开的作品ID列表
            gameState.preBanPublicWorks = gameState.worksList
                .filter(w => !w.isPrivate)
                .map(w => w.id);
            // 将所有作品设为私密
            gameState.worksList.forEach(work => {
                work.isPrivate = true;
            });
            // ✅ 作品数改为总作品数
            gameState.works = gameState.worksList.length;
            break;
    }
    
    // ==================== 修改：封禁触发负面热度机制（7天增加期）====================
    // 封号属于负面事件，启动7天增加热度值阶段
    initNegativeHotValueSystem();
    startNegativeHotValueBoost(7);
    // ============================================================
    
    if (gameState.liveStatus) {
        endLiveStream();
        // ✅ 修改：使用小弹窗通知
        showEventPopup('🚫 直播中断', '账号被封禁，直播已强制结束');
    }
    Object.keys(gameState.trafficWorks).forEach(workId => {
        if (typeof stopTrafficForWork === 'function') stopTrafficForWork(workId);
    });
    saveGame();
    if (typeof showBanNotice === 'function') showBanNotice();
    updateDisplay();
}

function showBanNotice() {
    if (!gameState.isBanned) return;
    const banDays = document.getElementById('banDays');
    const banNotice = document.getElementById('banNotice');
    const appealBtn = document.getElementById('appealBtn');
    if (!banDays || !banNotice) return;
    
    // 修改：基于游戏计时器计算剩余时间
    const timePassed = gameTimer - gameState.banStartTime;
    const daysPassed = timePassed / VIRTUAL_DAY_MS;
    const timeLeft = Math.max(0, gameState.banDaysCount - daysPassed);
    
    banDays.textContent = Math.ceil(timeLeft);
    
    if (timeLeft > 0 && gameState.appealAvailable) {
        appealBtn.style.display = 'block';
    } else {
        appealBtn.style.display = 'none';
    }
    
    if (timeLeft <= 0) {
        endBan();
    }
    if (!gameState.banInterval) gameState.banInterval = setInterval(() => showBanNotice(), VIRTUAL_DAY_MS);
    if (!gameState.banDropInterval) gameState.banDropInterval = setInterval(() => {
        if (gameState.isBanned && gameState.fans > 0) {
            // ✅ 修复：将 const 改为 let，允许修改 fanLoss
            let fanLoss = Math.floor(Math.random() * 90) + 10;
            
            // ✅ 应用负面热度掉粉加成
            const negativeRatio = getNegativeHotValueRatio();
            if (negativeRatio > 0) {
                const bonusLoss = Math.floor(fanLoss * negativeRatio * 0.5); // 最多额外增加50%掉粉
                fanLoss += bonusLoss;
            }
            
            gameState.fans = Math.max(0, gameState.fans - fanLoss);
            gameState.todayLostFans += fanLoss; // ✅ 新增：累计今日取关数
            // ✅ 修改：使用涨掉粉通知系统
            addFanChangeNotification('⬇️', `失去了${fanLoss.toLocaleString()}个粉丝`, '封禁期间', 'loss', fanLoss);
            updateDisplay();
        }
    }, 1000);
}

// ✅ 新增：解封处理函数（统一处理所有封号类型的恢复）
function endBan() {
    console.log('账号解封，恢复原始数据...');
    
    // 恢复基本状态
    gameState.isBanned = false;
    gameState.warnings = 0;
    // ✅ 关键修复：解封时清空警告历史记录
    if (gameState.warningHistory) {
        gameState.warningHistory = [];
    }
    gameState.appealAvailable = true;
    
    if (gameState.banInterval) {
        clearInterval(gameState.banInterval);
        gameState.banInterval = null;
    }
    if (gameState.banDropInterval) {
        clearInterval(gameState.banDropInterval);
        gameState.banDropInterval = null;
    }
    
    // ✅ 根据封号类型恢复数据
    switch(gameState.banType) {
        case 0:
            // 类型0：无需恢复特殊数据
            break;
            
        case 1:
            // 类型1：恢复名字、头像，恢复作品公开状态
            gameState.username = gameState.originalUsername;
            gameState.avatar = gameState.originalAvatar;
            gameState.avatarImage = gameState.originalAvatarImage;
            // 恢复之前公开的作品
            if (gameState.preBanPublicWorks && gameState.preBanPublicWorks.length > 0) {
                gameState.worksList.forEach(work => {
                    if (gameState.preBanPublicWorks.includes(work.id)) {
                        work.isPrivate = false;
                    }
                });
            }
            break;
            
        case 2:
            // 类型2：恢复名字和头像
            gameState.username = gameState.originalUsername;
            gameState.avatar = gameState.originalAvatar;
            gameState.avatarImage = gameState.originalAvatarImage;
            break;
            
        case 3:
            // 类型3：恢复作品公开状态
            if (gameState.preBanPublicWorks && gameState.preBanPublicWorks.length > 0) {
                gameState.worksList.forEach(work => {
                    if (gameState.preBanPublicWorks.includes(work.id)) {
                        work.isPrivate = false;
                    }
                });
            }
            break;
    }
    
    // ✅ 作品数改为总作品数（不按公开过滤）
    gameState.works = gameState.worksList.length;
    
    // ✅ 播放量、点赞数、总互动数改为基于所有作品（不按公开过滤）
    gameState.views = gameState.worksList
        .filter(w => w.type === 'video' || w.type === 'live')
        .reduce((sum, w) => sum + w.views, 0);
    gameState.likes = gameState.worksList.reduce((sum, w) => sum + w.likes, 0);
    gameState.totalInteractions = gameState.worksList.reduce((sum, w) => {
        return sum + w.comments + w.likes + w.shares;
    }, 0);
    
    // 清空临时数据
    gameState.banType = 0;
    gameState.originalUsername = '';
    gameState.originalAvatar = '';
    gameState.originalAvatarImage = '';
    gameState.preBanPublicWorks = [];
    
    // ==================== 修改：解封后启动负面热度7天下降期 ====================
    // 如果之前有负面热度积累，开始7天热度下降期
    if (gameState.negativeHotValue > 0) {
        endNegativeHotValueBoostAndStartDrop(7);
    }
    // ============================================================
    
    // ✅ 修改：只显示小弹窗通知
    showEventPopup('🔓 账号已解封', '封禁结束！警告次数已清空，所有设置已恢复正常');
    
    updateDisplay();
    
    // ✅ 修复：解封后立即检查不更新掉粉状态
    if (typeof checkInactivityPenalty === 'function') {
        checkInactivityPenalty();
    }
}

// ==================== 舆论风波系统（新增负面热度机制）====================
function startPublicOpinionCrisis(title) {
    if (gameState.isPublicOpinionCrisis) return;
    gameState.isPublicOpinionCrisis = true;
    gameState.publicOpinionDaysCount = Math.floor(Math.random() * 3) + 1;
    gameState.publicOpinionStartTime = gameTimer; // 使用游戏计时器
    gameState.publicOpinionTitle = title || '⚠️ 舆论风波中';
    
    // ==================== 修改：舆论风波属于负面事件，启动7天增加热度期 ====================
    initNegativeHotValueSystem();
    startNegativeHotValueBoost(7);
    // ============================================================
    
    if (!gameState.publicOpinionInterval) {
        gameState.publicOpinionInterval = setInterval(() => {
            if (gameState.isPublicOpinionCrisis && gameState.fans > 0) {
                // ✅ 修复：将 const 改为 let，允许修改 fanLoss
                let fanLoss = Math.floor(Math.random() * 50) + 10;
                
                // ✅ 应用负面热度掉粉加成
                const negativeRatio = getNegativeHotValueRatio();
                if (negativeRatio > 0) {
                    const bonusLoss = Math.floor(fanLoss * negativeRatio * 0.5);
                    fanLoss += bonusLoss;
                }
                
                gameState.fans = Math.max(0, gameState.fans - fanLoss);
                gameState.todayLostFans += fanLoss; // ✅ 新增：累计今日取关数
                // ✅ 修复：使用 addFanChangeNotification 替代 showNotification
                if (typeof addFanChangeNotification === 'function') {
                    addFanChangeNotification('⬇️', `失去了${fanLoss.toLocaleString()}个粉丝`, '舆论风波', 'loss', fanLoss);
                }
                if (typeof updateDisplay === 'function') updateDisplay();
            }
        }, 1000);
    }
    // ✅ 修复：只显示小弹窗通知
    showEventPopup('⚠️ 舆论风波', `你被卷入舆论风波，将持续${gameState.publicOpinionDaysCount}天！`);
    updateDisplay();
}

function showPublicOpinionNotice() {
    if (!gameState.isPublicOpinionCrisis) return;
    const publicOpinionNotice = document.getElementById('publicOpinionNotice');
    if (!publicOpinionNotice) return;
    
    // 修改：基于游戏计时器计算剩余时间
    const timePassed = gameTimer - gameState.publicOpinionStartTime;
    const daysPassed = timePassed / VIRTUAL_DAY_MS;
    
    // ✅ 修复：防止NaN导致显示异常
    if (isNaN(daysPassed) || gameState.publicOpinionDaysCount === undefined || gameState.publicOpinionDaysCount <= 0) {
        console.error('舆论风波状态异常，立即结束:', {
            gameTimer,
            publicOpinionStartTime: gameState.publicOpinionStartTime,
            publicOpinionDaysCount: gameState.publicOpinionDaysCount
        });
        endPublicOpinionCrisis();
        return;
    }
    
    const timeLeft = Math.max(0, gameState.publicOpinionDaysCount - daysPassed);
    
    publicOpinionNotice.innerHTML = `<div style="font-size:14px;font-weight:bold">${gameState.publicOpinionTitle}</div><div style="font-size:12px;">剩余：${Math.ceil(timeLeft)}天</div>`;
    if (timeLeft <= 0) endPublicOpinionCrisis();
}

function endPublicOpinionCrisis() {
    // ==================== 修改：舆论风波结束启动负面热度7天下降期 ====================
    if (gameState.isPublicOpinionCrisis) {
        endNegativeHotValueBoostAndStartDrop(7);
    }
    // ============================================================
    
    gameState.isPublicOpinionCrisis = false;
    gameState.publicOpinionTitle = '';
    if (gameState.publicOpinionInterval) {
        clearInterval(gameState.publicOpinionInterval);
        gameState.publicOpinionInterval = null;
    }
    // ✅ 修复：只显示小弹窗通知
    showEventPopup('📉 舆论风波结束', '舆论风波已平息');
    updateDisplay();
}

// ==================== 负面热度值增长/下降系统（新增核心机制）====================

// ✅ 启动负面热度值增加（持续7天，每秒1-50）
function startNegativeHotValueBoost(durationDays = 7) {
    // 确保清理之前的定时器
    if (gameState.negativeBoostInterval) {
        clearInterval(gameState.negativeBoostInterval);
        gameState.negativeBoostInterval = null;
    }
    
    gameState.isNegativeBoostActive = true;
    gameState.negativeBoostEndTime = gameTimer + (durationDays * VIRTUAL_DAY_MS);
    
    console.log(`[负面热度] 启动7天增长期，每秒增加1-50热度值`);
    
    // ✅ 显示通知
    showEventPopup('🔥 负面热度上升', `因负面事件，热度值将进入7天快速增长期！`);
    
    gameState.negativeBoostInterval = setInterval(() => {
        // 检查是否到达结束时间
        if (gameTimer >= gameState.negativeBoostEndTime) {
            endNegativeHotValueBoostAndStartDrop(7);
            return;
        }
        
        // 每秒随机增加1-50点热度值（负面热度）
        const increase = Math.floor(Math.random() * 50) + 1;
        if (window.HotValueSystem) {
            const oldValue = window.HotValueSystem.currentHotValue;
            window.HotValueSystem.currentHotValue += increase;
            gameState.currentHotValue = window.HotValueSystem.currentHotValue;
            
            // ✅ 记录为负面热度
            addNegativeHotValue(increase);
            
            console.log(`[负面热度+] +${increase}，当前：${window.HotValueSystem.currentHotValue}，总负面热度：${gameState.negativeHotValue}`);
        }
    }, 1000);
}

// ✅ 结束增长期，开始下降期（持续7天，每秒掉1-40）
function endNegativeHotValueBoostAndStartDrop(durationDays = 7) {
    // 停止增长期
    if (gameState.negativeBoostInterval) {
        clearInterval(gameState.negativeBoostInterval);
        gameState.negativeBoostInterval = null;
    }
    gameState.isNegativeBoostActive = false;
    
    // 确保清理之前的下降定时器
    if (gameState.negativeDropInterval) {
        clearInterval(gameState.negativeDropInterval);
        gameState.negativeDropInterval = null;
    }
    
    gameState.isNegativeDropActive = true;
    gameState.negativeDropEndTime = gameTimer + (durationDays * VIRTUAL_DAY_MS);
    
    console.log(`[负面热度] 增长期结束，启动7天下降期，每秒减少1-40热度值`);
    
    // ✅ 显示通知
    showEventPopup('📉 负面热度消退', `负面热度影响开始消退，热度值将进入7天下降期！`);
    
    gameState.negativeDropInterval = setInterval(() => {
        // 检查是否到达结束时间
        if (gameTimer >= gameState.negativeDropEndTime) {
            endNegativeHotValueDrop();
            return;
        }
        
        // 每秒随机减少1-40点热度值
        const decrease = Math.floor(Math.random() * 40) + 1;
        if (window.HotValueSystem) {
            const oldValue = window.HotValueSystem.currentHotValue;
            window.HotValueSystem.currentHotValue = Math.max(0, window.HotValueSystem.currentHotValue - decrease);
            gameState.currentHotValue = window.HotValueSystem.currentHotValue;
            
            // ✅ 减少负面热度记录（但不减少总热度记录）
            if (gameState.negativeHotValue > 0) {
                gameState.negativeHotValue = Math.max(0, gameState.negativeHotValue - decrease);
            }
            
            console.log(`[负面热度-] -${decrease}，当前：${window.HotValueSystem.currentHotValue}，剩余负面热度：${gameState.negativeHotValue}`);
        }
    }, 1000);
}

// ✅ 结束下降期
function endNegativeHotValueDrop() {
    if (gameState.negativeDropInterval) {
        clearInterval(gameState.negativeDropInterval);
        gameState.negativeDropInterval = null;
    }
    gameState.isNegativeDropActive = false;
    console.log(`[负面热度] 下降期结束`);
    
    // ✅ 显示通知
    showEventPopup('✅ 负面热度结束', `负面热度影响已完全消退！`);
}

// ==================== 原版热度值系统（用于非负面事件）====================

// ✅ 启动热度值增加（持续指定天数）【用于正面事件】
function startHotValueBoost(durationDays, isNegative = false) {
    // 确保清理之前的增加定时器
    if (gameState.hotValueBoostInterval) {
        clearInterval(gameState.hotValueBoostInterval);
        gameState.hotValueBoostInterval = null;
    }
    
    gameState.hotValueBoostActive = true;
    gameState.hotValueBoostEndTime = gameTimer + (durationDays * VIRTUAL_DAY_MS);
    gameState.hotValueOriginalDuration = durationDays;
    
    console.log(`[热度值] 开始增加，持续${durationDays}天，${isNegative ? '负面' : '正面'}事件`);
    
    gameState.hotValueBoostInterval = setInterval(() => {
        // 检查是否到达结束时间
        if (gameTimer >= gameState.hotValueBoostEndTime) {
            stopHotValueBoost();
            return;
        }
        
        // 每秒随机增加1-50点热度值
        const increase = Math.floor(Math.random() * 50) + 1;
        if (window.HotValueSystem) {
            window.HotValueSystem.currentHotValue += increase;
            gameState.currentHotValue = window.HotValueSystem.currentHotValue;
            
            // ✅ 记录热度来源
            if (isNegative) {
                addNegativeHotValue(increase);
            } else {
                addPositiveHotValue(increase);
            }
        }
    }, 1000);
}

// ✅ 停止热度值增加
function stopHotValueBoost() {
    if (gameState.hotValueBoostInterval) {
        clearInterval(gameState.hotValueBoostInterval);
        gameState.hotValueBoostInterval = null;
    }
    gameState.hotValueBoostActive = false;
    console.log(`[热度值] 增加阶段结束`);
}

// ✅ 启动热度值减少（持续指定天数）
function startHotValueDrop(durationDays, isNegativeAftermath = false) {
    // 确保清理之前的减少定时器
    if (gameState.hotValueDropInterval) {
        clearInterval(gameState.hotValueDropInterval);
        gameState.hotValueDropInterval = null;
    }
    
    // 停止任何进行中的增加
    stopHotValueBoost();
    
    gameState.hotValueDropActive = true;
    gameState.hotValueDropEndTime = gameTimer + (durationDays * VIRTUAL_DAY_MS);
    
    console.log(`[热度值] 开始减少，持续${durationDays}天`);
    
    gameState.hotValueDropInterval = setInterval(() => {
        // 检查是否到达结束时间
        if (gameTimer >= gameState.hotValueDropEndTime) {
            stopHotValueDrop();
            return;
        }
        
        // 每秒随机减少1-40点热度值
        const decrease = Math.floor(Math.random() * 40) + 1;
        if (window.HotValueSystem) {
            window.HotValueSystem.currentHotValue = Math.max(0, window.HotValueSystem.currentHotValue - decrease);
            gameState.currentHotValue = window.HotValueSystem.currentHotValue;
        }
    }, 1000);
}

// ✅ 停止热度值减少
function stopHotValueDrop() {
    if (gameState.hotValueDropInterval) {
        clearInterval(gameState.hotValueDropInterval);
        gameState.hotValueDropInterval = null;
    }
    gameState.hotValueDropActive = false;
    console.log(`[热度值] 减少阶段结束`);
}

// ✅ 结束增加并开始减少（用于正面热搜等场景）
function endHotValueBoostAndStartDrop(durationDays, isNegative = false) {
    stopHotValueBoost();
    startHotValueDrop(durationDays, isNegative);
}

// ==================== 图表更新（核心修复版）====================
function updateChartData() {
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const dayIndex = virtualDays % 60;
    
    // 记录当前写入位置（用于图表对齐）
    gameState.chartData.currentIndex = dayIndex;
    gameState.chartData.currentDay = virtualDays;
    
    // ==================== 核心修复：粉丝数据真实记录（移除Math.max）====================
    // 只保留点赞和播放量的累积最大值逻辑，粉丝数改为真实记录
    const prevLikes = gameState.chartData.likes[dayIndex] || 0;
    const prevViews = gameState.chartData.views[dayIndex] || 0;
    
    // 粉丝数直接记录当前值（可能上升也可能下降）
    gameState.chartData.fans[dayIndex] = gameState.fans;
    
    // 点赞和播放量使用Math.max确保累积值不下降
    gameState.chartData.likes[dayIndex] = Math.max(prevLikes, gameState.likes);
    gameState.chartData.views[dayIndex] = Math.max(prevViews, gameState.views);
    // ============================================================================
    
    // ==================== 核心修改：互动改为每日增量====================
    // 计算今日新增互动数 = 当前累积值 - 昨日记录基准
    const todayInteractionIncrement = Math.max(0, gameState.totalInteractions - gameState.chartData.lastInteractionTotal);
    gameState.chartData.interactions[dayIndex] = todayInteractionIncrement;
    
    // 保存当前累积值供下次计算使用
    gameState.chartData.lastInteractionTotal = gameState.totalInteractions;
    // ============================================================
    
    // 实时更新已打开的图表
    updateChartsRealtime();
    updateChartStatsRealtime();
    
    // ✅ 修复：每月检查商单（在月底）
    const currentDate = getVirtualDate();
    // 获取当月的天数
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const daysInMonth = monthDays[currentDate.month - 1];
    
    if (currentDate.day === daysInMonth && typeof window.checkMonthlyAdOrders === 'function') {
        window.checkMonthlyAdOrders();
    }
}

// 新增：实时更新图表右上角的统计数字
function updateChartStatsRealtime() {
    const chartsPage = document.getElementById('chartsPage');
    if (!chartsPage || !chartsPage.classList.contains('active')) return;
    
    const statElements = {
        fans: document.getElementById('fansStatValue'),
        likes: document.getElementById('likesStatValue'),
        views: document.getElementById('viewsStatValue'),
        interactions: document.getElementById('interactionsStatValue')
    };
    
    if (statElements.fans) statElements.fans.textContent = gameState.fans.toLocaleString();
    if (statElements.likes) statElements.likes.textContent = gameState.likes.toLocaleString();
    if (statElements.views) statElements.views.textContent = gameState.views.toLocaleString();
    
    // ==================== 修改：互动统计显示今日增量====================
    if (statElements.interactions) {
        const todayInteractions = gameState.chartData.interactions[gameState.chartData.currentIndex] || 0;
        statElements.interactions.textContent = '+' + todayInteractions.toLocaleString();
    }
}

// 修改：实时刷新图表数据
function updateChartsRealtime() {
    if (!window.charts) return;
    
    const chartsPage = document.getElementById('chartsPage');
    if (chartsPage && chartsPage.classList.contains('active')) {
        Object.keys(window.charts).forEach(key => {
            const chart = window.charts[key];
            if (chart && typeof chart.update === 'function') {
                chart.update('none');
            }
        });
    }
    
    // ✅ 新增：实时更新点赞全屏界面的图表
    const likesPage = document.getElementById('likesPage');
    if (likesPage && likesPage.classList.contains('active')) {
        if (window.charts && window.charts.likesDetail) {
            window.charts.likesDetail.update('none');
        }
    }
}

// ==================== 不更新掉粉检测（核心修改 - 增加负面热度掉粉加成）====================
function checkInactivityPenalty() {
    // ❌ 原始代码：if (!gameState || gameState.isBanned) return;
    // ✅ 修复：移除gameState.isBanned检查，让该机制在封禁期间也能运行
    if (!gameState) return;
    
    // 使用虚拟时间计算天数差
    const daysSinceLastWork = (gameTimer - gameState.lastWorkTime) / VIRTUAL_DAY_MS;
    
    // 如果7天内，确保不掉粉
    if (daysSinceLastWork < 7) {
        if (gameState.isDroppingFansFromInactivity) {
            gameState.isDroppingFansFromInactivity = false;
            // ✅ 修复：修正变量名 game.state -> gameState
            if (gameState.inactivityDropInterval) {
                clearInterval(gameState.inactivityDropInterval);
                gameState.inactivityDropInterval = null;
            }
        }
        if (gameState.inactivityWarningShown) {
            gameState.inactivityWarningShown = false;
        }
        return;
    }
    
    // 达到7天，开始掉粉
    if (daysSinceLastWork >= 7 && !gameState.isDroppingFansFromInactivity) {
        gameState.isDroppingFansFromInactivity = true;
        
        // 启动每秒掉粉
        gameState.inactivityDropInterval = setInterval(() => {
            if (!gameState.isDroppingFansFromInactivity) { 
                // ✅ 修复：修正变量名 game.state -> gameState
                if (gameState.inactivityDropInterval) {
                    clearInterval(gameState.inactivityDropInterval);
                    gameState.inactivityDropInterval = null;
                }
                return;
            }
            
            // 重新计算当前天数差（因为gameTimer在持续增加）
            const currentDaysSinceLastWork = (gameTimer - gameState.lastWorkTime) / VIRTUAL_DAY_MS;
            
            // 大幅提升掉粉数量
            const extraDays = Math.floor(currentDaysSinceLastWork - 7);
            const baseDrop = Math.floor(Math.random() * 31) + 20; // 20-50基础掉粉
            const extraDrop = extraDays * (Math.floor(Math.random() * 11) + 5); // 每多1天额外掉5-15粉
            let dropAmount = baseDrop + extraDrop;
            
            // ✅ 应用负面热度掉粉加成
            const negativeRatio = getNegativeHotValueRatio();
            if (negativeRatio > 0) {
                const bonusLoss = Math.floor(dropAmount * negativeRatio * 0.5);
                dropAmount += bonusLoss;
            }
            
            gameState.fans = Math.max(0, gameState.fans - dropAmount);
            gameState.todayLostFans += dropAmount; // ✅ 新增：累计今日取关数
            
            // ✅ 修改：使用涨掉粉通知系统
            addFanChangeNotification('⬇️', `失去了${dropAmount.toLocaleString()}个粉丝（已${Math.floor(currentDaysSinceLastWork)}天未更新）`, '不活跃惩罚', 'loss', dropAmount);
            
            updateDisplay();
        }, 1000);
    }
}

// ==================== 游戏主循环（核心修改：加权随机事件 + 热度值影响自然涨粉 + 负面热度掉粉加成）====================
function startGameLoop() {
    // 每虚拟天（1分钟）精确更新一次图表
    setInterval(() => {
        updateChartData();
    }, VIRTUAL_DAY_MS);
    
    // 每30秒触发随机事件（修改为加权随机选择）
    setInterval(() => {
        // 计算总权重
        const totalWeight = randomEvents.reduce((sum, event) => sum + (event.weight || 1), 0);
        let random = Math.random() * totalWeight;
        let selectedEvent = randomEvents[0];
        
        // 根据权重选择事件
        for (const event of randomEvents) {
            random -= (event.weight || 1);
            if (random <= 0) {
                selectedEvent = event;
                break;
            }
        }
        
        handleRandomEvent(selectedEvent);
    }, 30000);
    
    // 每秒检查不更新惩罚
    setInterval(() => {
        // 检查不更新惩罚（每秒）
        checkInactivityPenalty();
    }, 1000);
    
    // 保留原有的每分钟检查（用于其他逻辑）
    setInterval(() => {
        // 更新最后更新时间
        gameState.lastUpdateTime = gameTimer;
    }, VIRTUAL_DAY_MS);
    
    // 每秒检查状态（流量推广、舆论风波等）
    setInterval(() => {
        Object.keys(gameState.trafficWorks).forEach(workId => {
            const trafficData = gameState.trafficWorks[workId];
            if (trafficData && trafficData.isActive) {
                const timePassed = gameTimer - trafficData.startTime;
                const daysPassed = timePassed / VIRTUAL_DAY_MS;
                const timeLeft = Math.max(0, trafficData.days - daysPassed);
                if (timeLeft <= 0 && typeof stopTrafficForWork === 'function') {
                    stopTrafficForWork(workId);
                }
            }
        });
        if (gameState.isPublicOpinionCrisis && typeof showPublicOpinionNotice === 'function') {
            showPublicOpinionNotice();
        }
    }, 1000);
    
    // ==================== 自然涨粉/掉粉（核心修改：每3秒触发1次，带热度值增益 + 负面热度掉粉加成）====================
    setInterval(() => {
        // 每3秒固定触发1次，数量受作品增益和热度值影响
        const baseChange = Math.floor(Math.random() * 100) - 50;
        let boostedChange = baseChange + gameState.baseFanChangeBoost; // 应用作品增益
        
        // ==================== 核心修改：应用热度值倍数（只影响涨粉）====================
        if (boostedChange > 0) {
            const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
                ? window.getHotValueMultiplier() 
                : 1.0;
            boostedChange = Math.floor(boostedChange * hotMultiplier);
            console.log(`[自然涨粉] 热度值倍数: ${hotMultiplier.toFixed(2)}x, 调整后: ${boostedChange}`);
        }
        // 注意：掉粉（boostedChange <= 0）暂时不受影响，后续添加负面热度影响
        // ==============================================================================
        
        // ✅ 如果是掉粉，应用负面热度加成
        if (boostedChange < 0) {
            const negativeRatio = getNegativeHotValueRatio();
            if (negativeRatio > 0) {
                const bonusLoss = Math.floor(Math.abs(boostedChange) * negativeRatio * 0.5);
                boostedChange -= bonusLoss; // 减少更多（因为是负数）
                console.log(`[自然掉粉] 负面热度加成: ${negativeRatio.toFixed(2)}, 额外掉粉: ${bonusLoss}`);
            }
        }
        
        const change = boostedChange;
        
        gameState.fans = Math.max(0, gameState.fans + change);
        
        if (change > 0) {
            gameState.todayNewFans += change;
            addFanChangeNotification('⬆️', `获得了${change.toLocaleString()}个新粉丝`, '自然增长', 'gain', change);
        } else if (change < 0) {
            gameState.todayLostFans += Math.abs(change);
            addFanChangeNotification('⬇️', `失去了${Math.abs(change).toLocaleString()}个粉丝`, '自然流失', 'loss', Math.abs(change));
        }
        
        updateChartData();
        updateDisplay();
    }, 3000); // 每3秒触发一次
    
    // 自动互动生成（保持不变）
    setInterval(() => {
        if (gameState.fans <= 0) return;
        
        const baseChance = Math.min(gameState.fans / 1000, 0.3);
        if (Math.random() < baseChance) {
            const interactionTypes = ['观看', '点赞', '评论', '转发', '访问主页'];
            const interactionWeights = [0.4, 0.25, 0.15, 0.1, 0.1];
            
            let random = Math.random();
            let selectedType = '';
            let accumulatedWeight = 0;
            
            for (let i = 0; i < interactionTypes.length; i++) {
                accumulatedWeight += interactionWeights[i];
                if (random < accumulatedWeight) {
                    selectedType = interactionTypes[i];
                    break;
                }
            }
            
            const interactionAmount = Math.floor(Math.random() * 50) + 1;
            gameState.totalInteractions += interactionAmount;
        }
        
        if (Math.random() < 0.05) {
            const activeChange = Math.floor(Math.random() * 20) - 10;
            gameState.activeFans = Math.max(0, gameState.activeFans + activeChange);
        }
    }, 5000);
    
    // 每5秒检查商单数状态（保持不变）
    setInterval(() => {
        checkHighAdCountPenalty();
    }, 5000);
    
    // 启动月度检查
    if (typeof window.startMonthlyCheck === 'function') {
        window.startMonthlyCheck();
    }
    
    // 启动曝光检查
    if (typeof window.startExposureCheck === 'function') {
        window.startExposureCheck();
    }
    
    // ✅ 新增：初始化负面热度系统
    initNegativeHotValueSystem();
}

// ==================== 成就检查（已删除，使用 game_achievements.js 中的全局版本）====================
// 注意：为了避免重复定义，此处不再包含 checkAchievements 函数。
// 游戏中的成就检查统一由 game_achievements.js 中的 checkAchievements 处理。

// ==================== 新增：将天数转换为月日格式的函数====================
function convertDaysToMD(dayNumber) {
    if (dayNumber < 0) return '';
    
    // 每月天数（不考虑闰年，2月固定28天）
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const monthNames = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    
    // 计算年内第几天（对365取模）
    let dayInYear = dayNumber % 365;
    
    // 处理负数情况
    if (dayInYear < 0) {
        dayInYear = (dayInYear + 365) % 365;
    }
    
    // 遍历月份，找到对应的月和日
    let remainingDays = dayInYear;
    for (let i = 0; i < monthDays.length; i++) {
        if (remainingDays < monthDays[i]) {
            // 返回 "月.日" 格式
            return `${monthNames[i]}.${remainingDays + 1}`;
        }
        remainingDays -= monthDays[i];
    }
    
    // 默认为12月31日
    return '12.31';
}

// ==================== Chart.js图表系统（修复版：显示月日日期）====================
function drawChart(canvasId, data, color, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const currentIndex = gameState.chartData.currentIndex || 0;
    const currentDay = gameState.chartData.currentDay || 0;
    
    // 生成正确对齐的标签和数据（从第X-59天到第X天）
    const labels = [];
    const displayData = [];
    
    for (let i = 0; i < 60; i++) {
        // 计算数据索引：从旧到新排列
        const dataIndex = (currentIndex - 59 + i + 60) % 60;
        // 计算天数标签
        const dayNumber = currentDay - (59 - i);
        
        // ==================== 修复：未来天数显示为null，不画线====================
        // 如果是未来的天数（dayNumber < 0），标签为空，数据设为null
        if (dayNumber < 0) {
            labels.push('');
            displayData.push(null); // 未来天数设为null，不画线
        } else {
            // ==================== 修改：将天数转换为月日格式====================
            labels.push(convertDaysToMD(dayNumber));
            // =========================================================================
            
            // 如果数据为0，也设为null，避免画直线
            const value = data[dataIndex] || 0;
            displayData.push(value > 0 ? value : null);
        }
        // =========================================================================
    }
    
    // 销毁旧图表
    if (window.charts && window.charts[canvasId]) {
        window.charts[canvasId].destroy();
    }
    
    // 创建新图表（优化性能）
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: displayData,
                borderColor: color,
                // ==================== 修复：使用RGBA格式确保APK兼容====================
                backgroundColor: color.startsWith('#') ? 
                    `rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, 0.125)` : 
                    color + '20',
                // =========================================================================
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                // ==================== 修复：断开null值，不连接====================
                spanGaps: false, // 关键：null值处断开，不画线
                // =========================================================================
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: color,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return label + ': ' + context.parsed.y.toLocaleString();
                        },
                        // ==================== 修改：tooltip显示完整日期====================
                        title: function(context) {
                            const label = context[0].label;
                            if (label) {
                                return `日期: ${label}`;
                            }
                            return '';
                        }
                        // =========================================================================
                    }
                }
            },
            scales: {
                x: {
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.05)', 
                        borderColor: 'rgba(255, 255, 255, 0.1)' 
                    },
                    ticks: { 
                        color: '#999', 
                        maxTicksLimit: 10,
                        callback: function(value, index) {
                            // 只显示非空标签
                            const label = this.getLabelForValue(value);
                            return label || '';
                        }
                    }
                },
                y: {
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.05)', 
                        borderColor: 'rgba(255, 255, 255, 0.1)' 
                    },
                    ticks: { 
                        color: '#999', 
                        callback: function(value) { 
                            return value.toLocaleString(); 
                        } 
                    }
                }
            },
            interaction: { 
                intersect: false, 
                mode: 'index' 
            }
        }
    });
    
    // 保存图表实例
    if (!window.charts) window.charts = {};
    window.charts[canvasId] = chart;
}

// ==================== 数据分析界面（修改版 - 移除粉丝和互动图表）====================
function showCharts() {
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    document.getElementById('chartsPage').classList.add('active');
    
    if (!gameState.chartData.currentIndex && gameState.chartData.likes.length > 0) {
        const virtualDays = Math.floor(getVirtualDaysPassed());
        gameState.chartData.currentIndex = (virtualDays - 1) % 60;
        gameState.chartData.currentDay = virtualDays - 1;
    }
    
    const content = document.getElementById('chartsPageContent');
    content.innerHTML = `
        <div class="chart-container">
            <!-- ✅ 移除：点赞图表已移动到独立界面 -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 10px; padding: 25px; border-radius: 15px; text-align: center; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin-bottom: 10px;">图表已独立</div>
                <div style="font-size: 16px; font-weight: bold; color: #fff; margin-bottom: 10px;">点赞图表已移动到独立界面</div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">
                    点击主界面"点赞"统计数字查看详细图表
                </div>
            </div>
            
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin: 10px; border: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #667aea;">
                    📊 图表功能调整说明
                </div>
                <div style="font-size: 12px; color: #999; line-height: 1.6;">
                    <div style="margin-bottom: 8px;">• 点赞图表已独立到全屏界面</div>
                    <div style="margin-bottom: 8px;">• 播放量图表也已独立</div>
                    <div style="margin-bottom: 8px;">• 点击对应统计数字查看详细图表</div>
                    <div>• 查看更多数据请使用统计数字入口</div>
                </div>
            </div>
        </div>
    `;
    
    if (window.chartRefreshInterval) {
        clearInterval(window.chartRefreshInterval);
    }
    
    // 更新点赞图表的实时刷新
    window.chartRefreshInterval = setInterval(() => {
        const likesPage = document.getElementById('likesPage');
        if (likesPage && likesPage.classList.contains('active')) {
            // 点赞界面图表实时更新
            if (window.charts && window.charts.likesDetail) {
                window.charts.likesDetail.update('none');
            }
        }
    }, 1000);
}

// ==================== 新增：涨掉粉通知管理函数====================
function addFanChangeNotification(icon, title, content, changeType, fanCount) {
    // ✅ 关键修复：如果被封号且是涨粉，不添加通知
    if (gameState.isBanned && changeType === 'gain') {
        return;
    }
    
    // 确保初始化数组存在
    if (!gameState.fanChangeNotifications) {
        gameState.fanChangeNotifications = [];
    }
    
    // 创建通知对象
    const notification = {
        id: Date.now(),
        icon: icon,
        title: title,
        content: content,
        time: gameTimer,
        changeType: changeType, // 'gain' 或 'loss'
        fanCount: fanCount
    };
    
    // 添加到列表末尾
    gameState.fanChangeNotifications.push(notification);
    
    // 自动清理：如果超过10条，移除最旧的一条
    if (gameState.fanChangeNotifications.length > 10) {
        gameState.fanChangeNotifications.shift(); // 移除第一条（最旧的）
    }
}

// ==================== 全局函数绑定====================
window.startHotSearch = startHotSearch;
window.showHotSearchNotice = showHotSearchNotice;
window.endHotSearch = endHotSearch;
window.banAccount = banAccount;
window.showBanNotice = showBanNotice;
window.endBan = endBan;
window.startPublicOpinionCrisis = startPublicOpinionCrisis;
window.showPublicOpinionNotice = showPublicOpinionNotice;
window.endPublicOpinionCrisis = endPublicOpinionCrisis;
window.updateChartData = updateChartData;
window.startGameLoop = startGameLoop;
window.drawChart = drawChart;
window.updateChartsRealtime = updateChartsRealtime;
window.updateChartStatsRealtime = updateChartStatsRealtime;
window.checkInactivityPenalty = checkInactivityPenalty;
// 注意：不再绑定 checkAchievements 到 window，使用 game_achievements.js 中的版本
window.convertDaysToMD = convertDaysToMD;
window.addFanChangeNotification = addFanChangeNotification;

// ✅ 新增：导出负面热度系统函数
window.initNegativeHotValueSystem = initNegativeHotValueSystem;
window.getNegativeHotValueRatio = getNegativeHotValueRatio;
window.addNegativeHotValue = addNegativeHotValue;
window.addPositiveHotValue = addPositiveHotValue;
window.startNegativeHotValueBoost = startNegativeHotValueBoost;
window.endNegativeHotValueBoostAndStartDrop = endNegativeHotValueBoostAndStartDrop;
window.endNegativeHotValueDrop = endNegativeHotValueDrop;
window.startHotValueBoost = startHotValueBoost;
window.stopHotValueBoost = stopHotValueBoost;
window.startHotValueDrop = startHotValueDrop;
window.stopHotValueDrop = stopHotValueDrop;
window.endHotValueBoostAndStartDrop = endHotValueBoostAndStartDrop;