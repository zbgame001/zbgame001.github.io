// ==================== 商单惩罚与监管模块 =======================
// 本模块包含虚假商单惩罚、举报曝光、负面评论生成和成就检查
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS)
// 依赖: game_ui.js (showWarning, showEventPopup, updateDisplay, closeFullscreenPage)
// 依赖: game_ad_system_core.js (selectedAdOrder)
// 依赖: game_global_fan_growth.js (addWorkToGlobalFanGrowth)

// ==================== 虚假商单持续掉粉惩罚（终极修复版 - 支持惩罚叠加）=======================
window.startFakeAdFanLoss = function(exposedWorks, isFromMonthlyCheck = false) {
    if (!exposedWorks || exposedWorks.length === 0) return;
    
    // ✅ 减少热度值（虚假商单惩罚）
    if (window.HotValueSystem) {
        const hotValueDecrease = Math.floor(Math.random() * 1501) + 1500; // 1500-3000
        window.HotValueSystem.currentHotValue = Math.max(0, window.HotValueSystem.currentHotValue - hotValueDecrease);
        gameState.currentHotValue = window.HotValueSystem.currentHotValue;
    }
    
    // 计算新的惩罚天数（30-180天）
    const newPenaltyDays = Math.floor(Math.random() * 151) + 30;
    const newDailyFanLoss = Math.floor(Math.random() * 500) + 1; // 每秒1-500粉
    
    // 检查是否已存在活跃的惩罚
    if (window.gameState.fakeAdPenalty && window.gameState.fakeAdPenalty.isActive) {
        // 已存在活跃惩罚，将新的惩罚天数追加到剩余时间上
        const now = window.gameTimer;
        const currentEndTime = window.gameState.fakeAdPenalty.endTime;
        const remainingDays = Math.max(0, (currentEndTime - now) / VIRTUAL_DAY_MS);
        
        // 合并惩罚：剩余天数 + 新天数
        const totalDays = remainingDays + newPenaltyDays;
        const mergedEndTime = now + (totalDays * VIRTUAL_DAY_MS);
        const maxDailyLoss = Math.max(window.gameState.fakeAdPenalty.dailyFanLoss, newDailyFanLoss);
        
        console.log(`[惩罚合并] 剩余${remainingDays.toFixed(1)}天 + 新增${newPenaltyDays}天 = 总${totalDays.toFixed(1)}天，使用掉粉速率${maxDailyLoss}`);
        
        // 更新惩罚状态（合并）
        window.gameState.fakeAdPenalty.endTime = mergedEndTime;
        window.gameState.fakeAdPenalty.dailyFanLoss = maxDailyLoss;
        
        // 合并暴露的作品ID（去重）
        const existingIds = window.gameState.fakeAdPenalty.exposedWorkIds || [];
        const newIds = exposedWorks.map(w => w.id);
        window.gameState.fakeAdPenalty.exposedWorkIds = [...new Set([...existingIds, ...newIds])];
        
        // ✅ 修改：使用小弹窗通知
        if (typeof showEventPopup === 'function') {
            const daysLeft = Math.ceil(totalDays);
            showEventPopup('⚠️ 惩罚加重', `虚假商单丑闻恶化，惩罚延长至${daysLeft}天！`);
        }
        
        return; // 不启动新的定时器，让现有的继续运行
    }
    
    // 不存在活跃惩罚，清除现有定时器（如果有的话）并创建新的惩罚
    if (window.gameState.fakeAdPenaltyInterval) {
        clearInterval(window.gameState.fakeAdPenaltyInterval);
    }
    
    // 创建新的惩罚状态
    const penaltyEndTime = window.gameTimer + (newPenaltyDays * VIRTUAL_DAY_MS);
    
    window.gameState.fakeAdPenalty = {
        isActive: true,
        endTime: penaltyEndTime,
        exposedWorkIds: exposedWorks.map(w => w.id),
        dailyFanLoss: newDailyFanLoss,
        lastNotifyTime: 0
    };
    
    console.log(`[惩罚启动] 持续${newPenaltyDays}天，每秒掉${newDailyFanLoss}粉`);
    
    // 启动掉粉定时器
    window.gameState.fakeAdPenaltyInterval = setInterval(() => {
        if (!window.gameState.fakeAdPenalty || !window.gameState.fakeAdPenalty.isActive) {
            console.log('[惩罚结束] 定时器清理');
            clearInterval(window.gameState.fakeAdPenaltyInterval);
            window.gameState.fakeAdPenaltyInterval = null;
            return;
        }
        
        // 检查是否到期
        if (window.gameTimer >= window.gameState.fakeAdPenalty.endTime) {
            console.log('[惩罚到期] 自动结束');
            window.gameState.fakeAdPenalty.isActive = false;
            clearInterval(window.gameState.fakeAdPenaltyInterval);
            window.gameState.fakeAdPenaltyInterval = null;
            
            // ✅ 修改：使用小弹窗通知
            if (typeof window.showEventPopup === 'function') {
                showEventPopup('✅ 虚假商单影响结束', '粉丝的愤怒逐渐平息');
            }
            return;
        }
        
        // ✅ 修复：每秒从1-500之间随机掉粉
        const lossAmount = Math.floor(Math.random() * 500) + 1; // 1-500之间的随机数
        
        window.gameState.fans = Math.max(0, window.gameState.fans - lossAmount);
        
        // ✅ 修改为每秒显示一次通知（使用涨掉粉通知系统）
        const now = Date.now();
        const lastNotify = window.gameState.fakeAdPenalty.lastNotifyTime || 0;
        if (now - lastNotify > 1000) { // 从5000改为1000，实现每秒通知
            window.gameState.fakeAdPenalty.lastNotifyTime = now;
            const daysLeft = Math.ceil((window.gameState.fakeAdPenalty.endTime - window.gameTimer) / VIRTUAL_DAY_MS);
            
            // ✅ 修改：使用涨掉粉通知系统
            addFanChangeNotification('⬇️', `虚假商单丑闻持续发酵，粉丝流失-${lossAmount}（剩余${daysLeft}天）`, '虚假商单惩罚', 'loss', lossAmount);
        }
        
        if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
        }
    }, 1000);
};

// ✅ 终极修复：游戏加载时恢复惩罚
window.resumeFakeAdPenalty = function() {
    if (!window.gameState || !window.gameState.fakeAdPenalty) {
        console.log('没有未完成的虚假商单惩罚');
        return;
    }
    
    const penalty = window.gameState.fakeAdPenalty;
    const timeLeft = Math.max(0, penalty.endTime - window.gameTimer);
    
    if (timeLeft <= 0) {
        console.log('虚假商单惩罚已过期，清理状态');
        window.gameState.fakeAdPenalty.isActive = false;
        window.gameState.fakeAdPenalty = null;
        if (penalty.interval) {
            clearInterval(penalty.interval);
        }
        return;
    }
    
    console.log(`[恢复惩罚] 剩余${timeLeft / VIRTUAL_DAY_MS}天，每秒掉${penalty.dailyFanLoss}粉`);
    
    // 防止重复启动
    if (window.gameState.fakeAdPenaltyInterval) {
        clearInterval(window.gameState.fakeAdPenaltyInterval);
    }
    
    // 重置为活跃状态
    window.gameState.fakeAdPenalty.isActive = true;
    
    // 重新启动定时器
    window.gameState.fakeAdPenaltyInterval = setInterval(() => {
        if (!window.gameState.fakeAdPenalty || !window.gameState.fakeAdPenalty.isActive) {
            clearInterval(window.gameState.fakeAdPenaltyInterval);
            window.gameState.fakeAdPenaltyInterval = null;
            return;
        }
        
        if (window.gameTimer >= window.gameState.fakeAdPenalty.endTime) {
            window.gameState.fakeAdPenalty.isActive = false;
            clearInterval(window.gameState.fakeAdPenaltyInterval);
            window.gameState.fakeAdPenaltyInterval = null;
            
            // ✅ 修改：使用小弹窗通知
            if (typeof window.showEventPopup === 'function') {
                showEventPopup('✅ 虚假商单影响结束', '粉丝的愤怒逐渐平息');
            }
            return;
        }
        
        // ✅ 修复：每秒从1-500之间随机掉粉
        const lossAmount = Math.floor(Math.random() * 500) + 1; // 1-500之间的随机数
        
        window.gameState.fans = Math.max(0, window.gameState.fans - lossAmount);
        
        // ✅ 修改为每秒显示一次通知（使用涨掉粉通知系统）
        const now = Date.now();
        const lastNotify = window.gameState.fakeAdPenalty.lastNotifyTime || 0;
        if (now - lastNotify > 1000) { // 从5000改为1000，实现每秒通知
            window.gameState.fakeAdPenalty.lastNotifyTime = now;
            const daysLeft = Math.ceil((window.gameState.fakeAdPenalty.endTime - window.gameTimer) / VIRTUAL_DAY_MS);
            
            // ✅ 修改：使用涨掉粉通知系统
            addFanChangeNotification('⬇️', `虚假商单丑闻持续发酵，粉丝流失-${lossAmount}（剩余${daysLeft}天）`, '虚假商单惩罚', 'loss', lossAmount);
        }
        
        if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
        }
    }, 1000);
    
    // 立即显示恢复提示
    // ✅ 修改：使用小弹窗通知
    if (typeof window.showEventPopup === 'function') {
        const daysLeft = Math.ceil(timeLeft / VIRTUAL_DAY_MS);
        showEventPopup('⚠️ 惩罚恢复', `检测到未完成的虚假商单惩罚，持续掉粉中（剩余${daysLeft}天）`);
    }
};

// ==================== 举报曝光机制 ====================
window.checkAdOrderExposure = function() {
    if (!window.gameState || window.gameState.isBanned) return;
    
    // 获取所有未曝光的虚假商单作品
    const fakeAdWorks = window.gameState.worksList.filter(work => 
        work.isAd && work.adOrder && !work.adOrder.real && 
        !work.adOrder.isExposed && !work.isPrivate
    );
    
    if (fakeAdWorks.length === 0) return;
    
    // ✅ 修改：每个虚假商单有0.3%概率被举报（原1%），降低举报频率
    fakeAdWorks.forEach(work => {
        if (Math.random() < 0.003) {  // 从0.01改为0.003
            // 被曝光
            work.adOrder.isExposed = true;
            work.hasNegativeComments = true;
            
            // ✅ 减少热度值（虚假商单被举报曝光）
            if (window.HotValueSystem) {
                const hotValueDecrease = Math.floor(Math.random() * 1001) + 1000; // 1000-2000
                window.HotValueSystem.currentHotValue = Math.max(0, window.HotValueSystem.currentHotValue - hotValueDecrease);
                gameState.currentHotValue = window.HotValueSystem.currentHotValue;
            }
            
            // ✅ 新增：删除被检测到的虚假商单视频
            const workIndex = window.gameState.worksList.findIndex(w => w.id === work.id);
            if (workIndex !== -1) {
                // 从统计数据中减去该视频的贡献
                if (work.type === 'video' || work.type === 'live') {
                    window.gameState.views = Math.max(0, window.gameState.views - work.views);
                }
                window.gameState.likes = Math.max(0, window.gameState.likes - work.likes);
                
                // 更新作品计数器
                window.gameState.works = Math.max(0, window.gameState.works - 1);
                
                // 更新总互动数
                const interactionCount = work.comments + work.likes + work.shares;
                window.gameState.totalInteractions = Math.max(0, window.gameState.totalInteractions - interactionCount);
                
                // 清理推荐定时器
                if (work.recommendInterval) {
                    clearInterval(work.recommendInterval);
                    work.recommendInterval = null;
                }
                
                // 清理争议定时器
                if (work.controversyInterval) {
                    clearInterval(work.controversyInterval);
                    work.controversyInterval = null;
                }
                
                // 清理热搜定时器
                if (work.hotInterval) {
                    clearInterval(work.hotInterval);
                    work.hotInterval = null;
                }
                
                // 清理抽奖相关定时器
                if (work.isRaffle) {
                    if (work.fanGrowthInterval) clearInterval(work.fanGrowthInterval);
                    if (work.dataGrowthInterval) clearInterval(work.dataGrowthInterval);
                    if (work.fanLossInterval) clearInterval(work.fanLossInterval);
                    if (work.manualDrawWarningInterval) clearInterval(work.manualDrawWarningInterval);
                    if (work.crazyFanLossInterval) clearInterval(work.crazyFanLossInterval);
                }
                
                // 清理流量推广
                if (window.gameState.trafficWorks[work.id]) {
                    if (typeof stopTrafficForWork === 'function') {
                        stopTrafficForWork(work.id);
                    }
                    delete window.gameState.trafficWorks[work.id];
                }
                
                // 从列表中删除
                window.gameState.worksList.splice(workIndex, 1);
                
                // 显示删除通知
                if (typeof window.showEventPopup === 'function') {
                    showEventPopup('🗑️ 视频已删除', `虚假商单视频已被平台删除`);
                }
                
                console.log(`[举报曝光] 作品 ${work.id} 已被删除`);
            }
            
            // 罚款
            const fine = Math.floor(work.adOrder.actualReward * 1.5);
            window.gameState.money = Math.max(0, window.gameState.money - fine);
            window.gameState.warnings = Math.min(20, window.gameState.warnings + 3);
            
            // ✅ 不中断直播（修复：移除了强制结束直播的代码）
            // ✅ 修改：虚假商单被曝光不再强制结束直播
            
            // ✅ 不停止所有推广（修复：移除了停止所有推广的代码）
            // ✅ 修改：虚假商单被曝光不再停止所有流量推广
            
            // 开始掉粉惩罚（修复版：不会重置已有惩罚）
            startFakeAdFanLoss([work]);
            
            // 舆论风波
            if (typeof window.startPublicOpinionCrisis === 'function') {
                window.startPublicOpinionCrisis('⚠️ 虚假商单被曝光');
            }
            
            // ✅ 添加警告历史记录（虚假商单被举报）
            if (typeof addWarningToHistory === 'function') {
                addWarningToHistory('FAKE_AD', 
                    `虚假商单"${work.adOrder.title}"被网友举报`, 
                    work.content.substring(0, 50) + (work.content.length > 50 ? '...' : ''));
            }
            
            // ✅ 修复：如果作品有粉丝增长定时器，清理它
            if (work.fanGrowthInterval) {
                clearInterval(work.fanGrowthInterval);
                work.fanGrowthInterval = null;
                work.growthEndTime = null;
                console.log(`[举报曝光] 作品 ${work.id} 的粉丝增长定时器已清理`);
            }
            
            // ✅ 修改：使用涨掉粉通知系统（罚款通知仍在通知中心）
            showEventPopup('🚨 虚假商单被曝光！', `罚款${fine.toLocaleString()}元，警告+3，粉丝开始流失！`);
            
            if (typeof window.showWarning === 'function') {
                window.showWarning(`虚假商单被曝光！警告${window.gameState.warnings}/20次`);
            }
        }
    });
};

// ==================== 生成负面评论 ====================
window.generateNegativeComments = function(count) {
    const comments = [];
    const users = ['正义使者', '曝光侠', '打假专家', '愤怒的粉丝', '受害者', '维权人士', '监管员', '诚信卫士'];
    const contents = [
        '假广告！退钱！',
        '这种虚假商单也接？取关了！',
        '举报了，欺骗粉丝',
        '难怪最近内容质量下降',
        '失望，居然接假商单',
        '平台应该封禁这种主播',
        '虚假广告害人不浅',
        '再也不相信你了',
        '为了钱什么都干',
        '可耻的虚假宣传'
    ];
    
    for (let i = 0; i < count; i++) {
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const avatarChar = baseUser.charAt(0);
        
        comments.push({
            user: username,
            avatar: avatarChar,
            content: contents[Math.floor(Math.random() * contents.length)],
            likes: Math.floor(Math.random() * 50) + 10,
            time: window.gameTimer,
            isNegative: true
        });
    }
    
    return comments;
};

// ==================== 修改评论生成函数以包含负面评论 ====================
window.generateCommentsWithNegative = function(work, count, workTime) {
    const comments = [];
    const normalUsers = ['小可爱', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子'];
    const normalContents = ['太棒了！', '支持主播！', '666', '拍得真好', '来了来了', '前排围观', '主播辛苦了', '加油加油'];
    
    const negativeUsers = ['正义使者', '曝光侠', '打假专家', '愤怒的粉丝', '受害者', '维权人士', '监管员', '诚信卫士'];
    const negativeContents = ['假广告！退钱！', '这种虚假商单也接？取关了！', '举报了，欺骗粉丝', '难怪最近内容质量下降', '失望，居然接假商单', '平台应该封禁这种主播', '虚假广告害人不浅', '再也不相信你了', '为了钱什么都干', '可耻的虚假宣传'];
    
    const commentCount = Math.min(count, 20);
    const now = window.gameTimer;
    
    // 如果有负面评论，混合生成
    const negativeRatio = work.hasNegativeComments ? 0.4 : 0; // 40%负面评论
    
    for (let i = 0; i < commentCount; i++) {
        const isNegative = Math.random() < negativeRatio;
        const users = isNegative ? negativeUsers : normalUsers;
        const contents = isNegative ? negativeContents : normalContents;
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const avatarChar = baseUser.charAt(0);
        
        const maxOffset = Math.max(0, now - workTime);
        const randomFactor = Math.random() * Math.random();
        const offset = Math.floor(randomFactor * maxOffset);
        const commentTime = Math.min(workTime + offset, now);
        
        comments.push({ 
            user: username,
            avatar: avatarChar,
            content: contents[Math.floor(Math.random() * contents.length)], 
            likes: Math.floor(Math.random() * (isNegative ? 50 : 100)), 
            time: commentTime,
            isNegative: isNegative
        });
    }
    
    return comments;
};

// ==================== 高商单数惩罚机制 ====================
window.checkHighAdCountPenalty = function() {
    if (!window.gameState || window.gameState.isBanned) return;
    
    // 检查是否达到触发阈值（>=30单且不在惩罚期）
    if (window.gameState.adOrdersCount >= 30 && !window.gameState.adOrdersPenaltyActive) {
        console.log(`商单数达到${window.gameState.adOrdersCount}，触发粉丝疲劳惩罚`);
        
        // ✅ 减少热度值（高商单数惩罚）
        if (window.HotValueSystem) {
            const hotValueDecrease = Math.floor(Math.random() * 701) + 800; // 800-1500
            window.HotValueSystem.currentHotValue = Math.max(0, window.HotValueSystem.currentHotValue - hotValueDecrease);
            gameState.currentHotValue = window.HotValueSystem.currentHotValue;
        }
        
        // 1. 记录惩罚强度
        window.gameState.adOrdersPenaltyIntensity = window.gameState.adOrdersCount;
        
        // 2. 随机设置惩罚期（1-5虚拟天）
        const penaltyDays = Math.floor(Math.random() * 5) + 1;
        window.gameState.adOrdersPenaltyEndTime = window.gameTimer + (penaltyDays * VIRTUAL_DAY_MS);
        window.gameState.adOrdersPenaltyActive = true;
        
        // 3. 清空商单计数
        window.gameState.adOrdersCount = 0;
        
        // 4. 显示通知
        // ✅ 修改：使用小弹窗通知
        if (typeof window.showEventPopup === 'function') {
            showEventPopup('⚠️ 粉丝疲劳爆发', `长期接商单引发粉丝不满！惩罚持续${penaltyDays}虚拟天`);
        }
        
        // 5. 启动惩罚期专用定时器
        if (window.gameState.adOrdersPenaltyInterval) {
            clearInterval(window.gameState.adOrdersPenaltyInterval);
        }
        
        window.gameState.adOrdersPenaltyInterval = setInterval(() => {
            // 检查惩罚是否结束
            if (window.gameTimer >= window.gameState.adOrdersPenaltyEndTime) {
                // 惩罚结束
                clearInterval(window.gameState.adOrdersPenaltyInterval);
                window.gameState.adOrdersPenaltyInterval = null;
                window.gameState.adOrdersPenaltyActive = false;
                window.gameState.adOrdersPenaltyIntensity = 0;
                
                // ✅ 修改：使用小弹窗通知
                if (typeof window.showEventPopup === 'function') {
                    showEventPopup('✅ 粉丝疲劳缓解', '经过休息，粉丝对你的印象有所好转');
                }
                
                if (typeof window.updateDisplay === 'function') {
                    window.updateDisplay();
                }
                return;
            }
            
            // 惩罚期：高概率掉粉
            const baseProbability = 0.30;
            const intensityBonus = Math.floor(window.gameState.adOrdersPenaltyIntensity / 10) * 0.05;
            const dropProbability = Math.min(0.80, baseProbability + intensityBonus);
            
            if (Math.random() < dropProbability) {
                const baseDrop = Math.floor(Math.random() * 11) + 5;
                const intensityDrop = Math.floor(window.gameState.adOrdersPenaltyIntensity / 5) * 2;
                const dropAmount = baseDrop + intensityDrop;
                
                window.gameState.fans = Math.max(0, window.gameState.fans - dropAmount);
                
                // 20%概率显示通知
                if (Math.random() < 0.20) {
                    // ✅ 修改：使用涨掉粉通知系统
                    addFanChangeNotification('⬇️', '因长期接商单失去粉丝', '粉丝疲劳', 'loss', dropAmount);
                }
                
                if (typeof window.updateDisplay === 'function') {
                    window.updateDisplay();
                }
            }
        }, 1000);
        
        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }
    }
};

// ==================== 检查商单成就 ====================
function checkAdAchievements() {
    if (!window.achievements || !window.gameState) return;
    
    // 商单相关成就定义
    const adAchievements = [
        { id: 21, name: '商单新人', desc: '完成首个商单', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 1 },
        { id: 22, name: '广告达人', desc: '完成10个商单', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 10 },
        { id: 23, name: '百万单王', desc: '单次商单收入超50万', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).some(w => (w.revenue || 0) >= 50000) },
        { id: 25, name: '商单大师', desc: '完成50个商单且未违规', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 50 && window.gameState.warnings < 5 },
        { id: 26, name: '赌徒', desc: '完成10个虚假商单', target: () => window.gameState.worksList.filter(w => w.isAd && w.adOrder && !w.adOrder.real && !w.isPrivate && !w.adOrder.isExposed).length >= 10 },
        { id: 27, name: '身败名裂', desc: '因虚假商单被封号3次', target: () => window.gameState.fakeAdBans >= 3 },
        { id: 28, name: '诚信经营', desc: '连续3个月无虚假商单', target: () => window.gameState.monthsWithoutFakeAd >= 3 }
    ];
    
    adAchievements.forEach(achievementDef => {
        const achievement = window.achievements.find(a => a.id === achievementDef.id);
        if (achievement && !achievement.unlocked && achievementDef.target()) {
            achievement.unlocked = true;
            window.gameState.achievements.push(achievement.id);
            
            // 显示成就弹窗
            if (typeof window.showAchievementPopup === 'function') {
                window.showAchievementPopup(achievement);
            }
            
            console.log(`✅ 成就解锁: ${achievement.name} (ID: ${achievement.id})`);
        }
    });
}

// ==================== 初始化商单相关状态（已修复：恢复惩罚定时器） ====================
function initAdSystem() {
    // 确保商单相关状态存在
    if (window.gameState) {
        if (window.gameState.adOrders === undefined) window.gameState.adOrders = [];
        if (window.gameState.currentAdOrders === undefined) window.gameState.currentAdOrders = [];
        if (window.gameState.rejectedAdOrders === undefined) window.gameState.rejectedAdOrders = 0;
        if (window.gameState.adOrdersCount === undefined) window.gameState.adOrdersCount = 0;
        if (window.gameState.pendingBrandDeal === undefined) window.gameState.pendingBrandDeal = null;
        
        // 惩罚机制状态
        if (window.gameState.adOrdersPenaltyActive === undefined) window.gameState.adOrdersPenaltyActive = false;
        if (window.gameState.adOrdersPenaltyEndTime === undefined) window.gameState.adOrdersPenaltyEndTime = 0;
        if (window.gameState.adOrdersPenaltyIntensity === undefined) window.gameState.adOrdersPenaltyIntensity = 0;
        if (window.gameState.adOrdersPenaltyInterval === undefined) window.gameState.adOrdersPenaltyInterval = null;
        
        // 新增虚假商单惩罚状态
        if (window.gameState.fakeAdPenalty === undefined) window.gameState.fakeAdPenalty = null;
        if (window.gameState.fakeAdPenaltyInterval === undefined) window.gameState.fakeAdPenaltyInterval = null;
        if (window.gameState.fakeAdBans === undefined) window.gameState.fakeAdBans = 0;
        if (window.gameState.monthsWithoutFakeAd === undefined) window.gameState.monthsWithoutFakeAd = 0;
        if (window.gameState.lastCheckMonth === undefined) window.gameState.lastCheckMonth = -1;
        
        // ✅ 关键修复：游戏加载时恢复未完成的惩罚
        // 延迟恢复，确保gameTimer已同步
        setTimeout(() => {
            if (window.gameState.fakeAdPenalty && window.gameState.fakeAdPenalty.isActive) {
                console.log('[初始化] 检测到未完成的虚假商单惩罚，5秒后恢复...');
                window.resumeFakeAdPenalty();
            }
        }, 5000);
    }
}

// ==================== 月度检查定时器 ====================
window.startMonthlyCheck = function() {
    if (window.monthlyCheckInterval) {
        clearInterval(window.monthlyCheckInterval);
    }
    
    window.monthlyCheckInterval = setInterval(() => {
        const currentDate = getVirtualDate();
        
        // 每月只检查一次
        if (currentDate.month !== window.gameState.lastCheckMonth) {
            window.gameState.lastCheckMonth = currentDate.month;
            window.checkMonthlyAdOrders();
            
            // 更新无虚假商单月数
            const lastMonthFakeAds = window.gameState.worksList.filter(work => 
                work.isAd && work.adOrder && !work.adOrder.real &&
                work.time >= (window.gameTimer - (30 * VIRTUAL_DAY_MS))
            ).length;
            
            if (lastMonthFakeAds === 0) {
                window.gameState.monthsWithoutFakeAd++;
            } else {
                window.gameState.monthsWithoutFakeAd = 0;
            }
        }
    }, VIRTUAL_DAY_MS); // 每天检查一次
};

// ==================== 举报检查定时器 ====================
window.startExposureCheck = function() {
    if (window.exposureCheckInterval) {
        clearInterval(window.exposureCheckInterval);
    }
    
    // 每天检查一次举报
    window.exposureCheckInterval = setInterval(() => {
        window.checkAdOrderExposure();
    }, VIRTUAL_DAY_MS);
};

// 绑定全局函数
window.startFakeAdFanLoss = window.startFakeAdFanLoss;
window.resumeFakeAdPenalty = window.resumeFakeAdPenalty;
window.checkAdOrderExposure = window.checkAdOrderExposure;
window.generateNegativeComments = window.generateNegativeComments;
window.generateCommentsWithNegative = window.generateCommentsWithNegative;
window.checkHighAdCountPenalty = window.checkHighAdCountPenalty;
window.checkAdAchievements = checkAdAchievements;
window.initAdSystem = initAdSystem;
window.startMonthlyCheck = window.startMonthlyCheck;
window.startExposureCheck = window.startExposureCheck;
