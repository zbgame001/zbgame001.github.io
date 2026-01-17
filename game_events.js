// ==================== 热搜系统 ====================
function startHotSearch(title) {
    if (gameState.isHotSearch) return;
    gameState.isHotSearch = true;
    gameState.hotSearchDaysCount = Math.floor(Math.random() * 3) + 1;
    gameState.hotSearchStartTime = gameTimer; // 使用游戏计时器
    gameState.hotSearchTitle = title || '🔥 话题热议中';
    if (!gameState.hotSearchInterval) gameState.hotSearchInterval = setInterval(() => {
        if (gameState.isHotSearch) {
            const fanGrowth = Math.floor(Math.random() * 100) + 50;
            gameState.fans += fanGrowth;
            // ✅ 修改：使用涨掉粉通知系统，并更新今日新增粉丝
            gameState.todayNewFans += fanGrowth; // ✅ 新增：累计今日新增粉丝
            addFanChangeNotification('⬆️', `获得了${fanGrowth.toLocaleString()}个新粉丝`, '热搜效应', 'gain', fanGrowth);
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        }
    }, 1000);
    // ✅ 修改：只显示小弹窗通知
    showEventPopup('🎉 热搜上榜', `恭喜！${title}，将持续${gameState.hotSearchDaysCount}虚拟天！`);
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

// ==================== 账号封禁 ====================
function banAccount(reason) {
    if (gameState.isBanned) return;
    gameState.isBanned = true;
    gameState.banReason = reason;
    gameState.banDaysCount = Math.floor(Math.random() * 30) + 1;
    gameState.banStartTime = gameTimer;
    gameState.appealAvailable = true;
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
        gameState.isBanned = false;
        gameState.warnings = 0;
        gameState.appealAvailable = true;
        if (gameState.banInterval) {
            clearInterval(gameState.banInterval);
            gameState.banInterval = null;
        }
        if (gameState.banDropInterval) {
            clearInterval(gameState.banDropInterval);
            gameState.banDropInterval = null;
        }
        
        // ✅ 修改：只显示小弹窗通知
        showEventPopup('🔓 账号已解封', '封禁结束！警告次数已清空，可以继续创作啦');
        
        updateDisplay();
        
        // ✅ 修复：解封后立即检查不更新掉粉状态
        if (typeof checkInactivityPenalty === 'function') {
            checkInactivityPenalty();
        }
    }
    if (!gameState.banInterval) gameState.banInterval = setInterval(() => showBanNotice(), VIRTUAL_DAY_MS);
    if (!gameState.banDropInterval) gameState.banDropInterval = setInterval(() => {
        if (gameState.isBanned && gameState.fans > 0) {
            const fanLoss = Math.floor(Math.random() * 90) + 10;
            gameState.fans = Math.max(0, gameState.fans - fanLoss);
            gameState.todayLostFans += fanLoss; // ✅ 新增：累计今日取关数
            // ✅ 修改：使用涨掉粉通知系统
            addFanChangeNotification('⬇️', `失去了${fanLoss.toLocaleString()}个粉丝`, '封禁期间', 'loss', fanLoss);
            updateDisplay();
        }
    }, 1000);
}

// ==================== 舆论风波系统 ====================
function startPublicOpinionCrisis(title) {
    if (gameState.isPublicOpinionCrisis) return;
    gameState.isPublicOpinionCrisis = true;
    gameState.publicOpinionDaysCount = Math.floor(Math.random() * 3) + 1;
    gameState.publicOpinionStartTime = gameTimer; // 使用游戏计时器
    gameState.publicOpinionTitle = title || '⚠️ 舆论风波中';
    if (!gameState.publicOpinionInterval) {
        gameState.publicOpinionInterval = setInterval(() => {
            if (gameState.isPublicOpinionCrisis && gameState.fans > 0) {
                const fanLoss = Math.floor(Math.random() * 50) + 10;
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
    showEventPopup('⚠️ 舆论风波', `你被卷入舆论风波，将持续${gameState.publicOpinionDaysCount}虚拟天！`);
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

// ==================== 图表更新（核心修复版） ====================
function updateChartData() {
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const dayIndex = virtualDays % 60;
    
    // 记录当前写入位置（用于图表对齐）
    gameState.chartData.currentIndex = dayIndex;
    gameState.chartData.currentDay = virtualDays;
    
    // ==================== 核心修复：粉丝数据真实记录（移除Math.max） ====================
    // 只保留点赞和播放量的累积最大值逻辑，粉丝数改为真实记录
    const prevLikes = gameState.chartData.likes[dayIndex] || 0;
    const prevViews = gameState.chartData.views[dayIndex] || 0;
    
    // 粉丝数直接记录当前值（可能上升也可能下降）
    gameState.chartData.fans[dayIndex] = gameState.fans;
    
    // 点赞和播放量使用Math.max确保累积值不下降
    gameState.chartData.likes[dayIndex] = Math.max(prevLikes, gameState.likes);
    gameState.chartData.views[dayIndex] = Math.max(prevViews, gameState.views);
    // ============================================================================
    
    // ==================== 核心修改：互动改为每日增量 ====================
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
    
    // ==================== 修改：互动统计显示今日增量 ====================
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

// ==================== 不更新掉粉检测（核心修改） ====================
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
        
        // 强制显示警告（首次触发）
        // ✅ 修改：使用小弹窗通知
        if (typeof window.showEventPopup === 'function') {
            showEventPopup('⚠️ 粉丝流失警告', '连续7天未更新，粉丝开始流失！快发布新作品！');
        }
        
        // 启动每秒掉粉
        gameState.inactivityDropInterval = setInterval(() => {
            if (!gameState.isDroppingFansFromInactivity) { 
                clearInterval(game.state.inactivityDropInterval);
                return;
            }
            
            // 重新计算当前天数差（因为gameTimer在持续增加）
            const currentDaysSinceLastWork = (gameTimer - gameState.lastWorkTime) / VIRTUAL_DAY_MS;
            
            // 大幅提升掉粉数量
            const extraDays = Math.floor(currentDaysSinceLastWork - 7);
            const baseDrop = Math.floor(Math.random() * 31) + 20; // 20-50基础掉粉
            const extraDrop = extraDays * (Math.floor(Math.random() * 11) + 5); // 每多1天额外掉5-15粉
            const dropAmount = baseDrop + extraDrop;
            
            gameState.fans = Math.max(0, gameState.fans - dropAmount);
            gameState.todayLostFans += dropAmount; // ✅ 新增：累计今日取关数
            
            // ✅ 修改：使用涨掉粉通知系统
            addFanChangeNotification('⬇️', `失去了${dropAmount.toLocaleString()}个粉丝（已${Math.floor(currentDaysSinceLastWork)}天未更新）`, '不活跃惩罚', 'loss', dropAmount);
            
            updateDisplay();
        }, 1000);
    }
}

// ==================== 游戏主循环（核心修改：加权随机事件） ====================
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
    
    // ==================== 自然涨粉/掉粉（核心修改：每3秒触发1次，带作品增益） ====================
    setInterval(() => {
        // 每3秒固定触发1次，数量受作品增益影响
        const baseChange = Math.floor(Math.random() * 100) - 50;
        const boostedChange = baseChange + gameState.baseFanChangeBoost; // 应用作品增益
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
}

// ==================== 成就检查（核心修复版） ====================
function checkAchievements() {
    // ==================== 核心修复：遍历所有成就并检查 ====================
    achievements.forEach(achievement => {
        if (!achievement.unlocked) {
            let unlocked = false;
            
            // 安全处理：确保gameState数据存在
            if (!gameState) return;
            
            switch (achievement.id) {
                // 基础粉丝类成就
                case 1: 
                    unlocked = (gameState.fans || 0) >= 1; 
                    break;
                    
                case 2: 
                    unlocked = (gameState.fans || 0) >= 1000; 
                    break;
                    
                case 3: 
                    unlocked = (gameState.fans || 0) >= 100000; 
                    break;
                    
                case 4: 
                    unlocked = (gameState.fans || 0) >= 10000000; 
                    break;
                
                // 爆款制造机
                case 5: 
                    const videoWorks = gameState.worksList.filter(w => !w.isPrivate && (w.type === 'video' || w.type === 'live'));
                    unlocked = videoWorks.some(w => (w.views || 0) >= 1000000);
                    break;
                
                // 点赞狂魔
                case 6: 
                    unlocked = (gameState.likes || 0) >= 100000; 
                    break;
                
                // 高产创作者
                case 7: 
                    unlocked = gameState.worksList.filter(w => !w.isPrivate).length >= 100; 
                    break;
                
                // 直播新星
                case 8: 
                    const liveWorks = gameState.worksList.filter(w => !w.isPrivate && w.type === 'live');
                    unlocked = liveWorks.some(w => (w.views || 0) >= 1000);
                    break;
                
                // 收益第一桶金
                case 9: 
                    unlocked = (gameState.money || 0) >= 1; 
                    break;
                
                // 百万富翁
                case 10: 
                    unlocked = (gameState.money || 0) >= 1000000; 
                    break;
                
                // 话题之王
                case 11: 
                    const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
                    unlocked = publicWorks.some(w => (w.shares || 0) >= 10000);
                    break;
                
                // 评论互动达人
                case 12: 
                    const publicWorksForComments = gameState.worksList.filter(w => !w.isPrivate);
                    unlocked = publicWorksForComments.some(w => (w.comments || 0) >= 5000);
                    break;
                
                // ✅ 已移除: case 13: 全勤主播成就
                
                // 逆风翻盘 - 特殊成就
                case 14: 
                    // 由申诉功能触发，无需自动检查
                    break;
                
                // 幸运儿
                case 15: 
                    if (!gameState.eventCount) gameState.eventCount = 0;
                    unlocked = gameState.eventCount >= 50;
                    break;
                
                // 社交达人
                case 16: 
                    if (!gameState.following) gameState.following = [];
                    unlocked = gameState.following.length >= 1000;
                    break;
                
                // ✅ 已移除: case 17: 夜猫子成就
                // ✅ 已移除: case 18: 早起鸟儿成就
                
                // 宠粉狂魔
                case 19: 
                    if (!gameState.commentRepliesCount) gameState.commentRepliesCount = 0;
                    unlocked = gameState.commentRepliesCount >= 1000;
                    break;
                
                // 传奇主播
                case 20: 
                    const otherAchievements = achievements.filter(a => a.id !== 20);
                    unlocked = otherAchievements.every(a => a.unlocked);
                    break;
                
                // 商单新人
                case 21: 
                    unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 1;
                    break;
                
                // 广告达人
                case 22: 
                    unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 10;
                    break;
                
                // 百万单王
                case 23: 
                    const adWorks = gameState.worksList.filter(w => w.isAd && !w.isPrivate);
                    const revenues = adWorks.map(w => w.revenue || 0);
                    unlocked = adWorks.some(w => (w.revenue || 0) >= 50000);
                    break;
                
                // ✅ 已移除: case 24: 火眼金睛成就
                
                // 商单大师 - 需要同时满足两个条件
                case 25: 
                    unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 50 && (gameState.warnings || 0) < 5;
                    break;
                
                // 赌徒
                case 26: 
                    const fakeAdCount = gameState.worksList.filter(w => w.isAd && w.adOrder && !w.adOrder.real && !w.isPrivate).length;
                    unlocked = fakeAdCount >= 10;
                    break;
                
                // 身败名裂（负面成就）
                case 27: 
                    if (!gameState.fakeAdBans) gameState.fakeAdBans = 0;
                    unlocked = gameState.fakeAdBans >= 3;
                    break;
                
                // 诚信经营（负面成就）
                case 28: 
                    unlocked = (gameState.monthsWithoutFakeAd || 0) >= 3;
                    break;
            }
            
            // 解锁成就
            if (unlocked) {
                achievement.unlocked = true;
                
                // 避免重复添加
                if (!gameState.achievements.includes(achievement.id)) {
                    gameState.achievements.push(achievement.id);
                }
                
                // 显示成就弹窗
                if (typeof showAchievementPopup === 'function') {
                    showAchievementPopup(achievement);
                }
                
                // ✅ 修改：只显示小弹窗通知，移除通知中心通知
                if (typeof window.showEventPopup === 'function') {
                    showEventPopup('🏆 成就解锁', `${achievement.name}：${achievement.desc}`);
                }
                
                console.log(`✅ 成就解锁: ${achievement.name} (ID: ${achievement.id})`);
                
                // ✅ 检查传奇主播成就（递归检查）
                if (achievement.id !== 20 && !achievements.find(a => a.id === 20).unlocked) {
                    const legendaryAchievement = achievements.find(a => a.id === 20);
                    const otherAchievements = achievements.filter(a => a.id !== 20);
                    const allUnlocked = otherAchievements.every(a => a.unlocked);
                    
                    if (allUnlocked && !legendaryAchievement.unlocked) {
                        legendaryAchievement.unlocked = true;
                        gameState.achievements.push(20);
                        showAchievementPopup(legendaryAchievement);
                        // ✅ 修改：使用小弹窗通知
                        showEventPopup('🏆 传奇成就', '恭喜解锁所有成就！');
                    }
                }
            }
        }
    });
    // ==================== 修复结束 ====================
}

// ==================== 新增：将天数转换为月日格式的函数 ====================
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

// ==================== Chart.js图表系统（修复版：显示月日日期） ====================
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
        
        // ==================== 修复：未来天数显示为null，不画线 ====================
        // 如果是未来的天数（dayNumber < 0），标签为空，数据设为null
        if (dayNumber < 0) {
            labels.push('');
            displayData.push(null); // 未来天数设为null，不画线
        } else {
            // ==================== 修改：将天数转换为月日格式 ====================
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
                // ==================== 修复：使用RGBA格式确保APK兼容 ====================
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
                // ==================== 修复：断开null值，不连接 ====================
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
                        // ==================== 修改：tooltip显示完整日期 ====================
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

// ==================== 数据分析界面（修改版 - 移除点赞图表） ====================
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

// ==================== 新增：涨掉粉通知管理函数 ====================
function addFanChangeNotification(icon, title, content, changeType, fanCount) {
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

// ==================== 全局函数绑定 ====================
window.startHotSearch = startHotSearch;
window.showHotSearchNotice = showHotSearchNotice;
window.endHotSearch = endHotSearch;
window.banAccount = banAccount;
window.showBanNotice = showBanNotice;
window.startPublicOpinionCrisis = startPublicOpinionCrisis;
window.showPublicOpinionNotice = showPublicOpinionNotice;
window.endPublicOpinionCrisis = endPublicOpinionCrisis;
window.updateChartData = updateChartData;
window.startGameLoop = startGameLoop;
window.drawChart = drawChart;
window.updateChartsRealtime = updateChartsRealtime;
window.updateChartStatsRealtime = updateChartStatsRealtime;
window.checkInactivityPenalty = checkInactivityPenalty;
window.checkAchievements = checkAchievements; // ✅ 导出成就检查函数
// ==================== 导出新增的日期转换函数 ====================
window.convertDaysToMD = convertDaysToMD;
// ✅ 新增：导出涨掉粉通知管理函数
window.addFanChangeNotification = addFanChangeNotification;
