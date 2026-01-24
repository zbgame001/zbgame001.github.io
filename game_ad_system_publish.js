// ==================== 商单发布与处理模块 =======================
// 本模块包含商单内容发布、违规检查、报酬结算等功能
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS, violationKeywords)
// 依赖: game_ui.js (showAlert, showWarning, showEventPopup, updateDisplay, closeFullscreenPage)
// 依赖: game_ad_system_core.js (selectedAdOrder, selectedMethod)
// 依赖: game_global_fan_growth.js (addWorkToGlobalFanGrowth)

// ==================== 发布商单内容（重构版：从零开始 + 全局粉丝增长） ====================
window.publishAd = function() {
    const content = document.getElementById('adContent').value.trim();
    const ad = window.selectedAdOrder;
    
    if (!content) { 
        if (typeof window.showAlert === 'function') {
            window.showAlert('请输入内容', '提示');
        }
        return; 
    }
    
    // 检查违规（修改后）
    const hasViolationKeyword = window.violationKeywords && window.violationKeywords.some(k => content.includes(k));
    let hasViolation = hasViolationKeyword; // ✅ 移除了 Math.random() < ad.risk
    if (ad.keyword && content.includes(ad.keyword)) hasViolation = true; // ✅ 保留关键词违规检查
    
    if (hasViolation) {
        window.gameState.warnings = Math.min(20, window.gameState.warnings + Math.floor(Math.random() * 2) + 1);
        
        // ✅ 修改：添加警告历史记录
        if (typeof addWarningToHistory === 'function') {
            addWarningToHistory('AD_VIOLATION', 
                `商单内容违规${ad.keyword ? `（包含关键词"${ad.keyword}"）` : ''}`, 
                content.substring(0, 50) + (content.length > 50 ? '...' : ''));
        }
        
        if (typeof window.showWarning === 'function') {
            window.showWarning(`商单内容违规，警告${window.gameState.warnings}/20次`);
        }
        
        if (window.gameState.warnings >= 20) {
            if (typeof window.banAccount === 'function') {
                window.banAccount('商单违规');
            }
        }
        
        window.gameState.rejectedAdOrders++;
        
        closeFullscreenPage('adOrders');
        updateDisplay();
        saveGame();
        return;
    }
    
    // 成功发布（修改：从零开始）
    const views = 0; // ✅ 从0开始
    const likes = 0; // ✅ 从0开始
    const comments = 0; // ✅ 从0开始
    const shares = 0; // ✅ 从0开始
    const work = { 
        id: Date.now(), 
        type: window.selectedMethod, 
        content: content, 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: window.gameTimer, 
        isAd: true, 
        adOrder: ad, // 保存商单信息
        revenue: Math.floor((Math.random() * 15000 + 5000) / 1000), // ✅ 收益保留，但初始播放量为0
        isPrivate: false,
        hasNegativeComments: false,  // 是否有负面评论
        // ✅ 移除：不再需要单独的粉丝增长定时器
        // growthEndTime: null,
        // fanGrowthInterval: null
    };
    
    window.gameState.worksList.push(work);
    window.gameState.works++;
    
    // 只统计视频和直播的播放量（初始为0）
    if (work.type === 'video' || work.type === 'live') {
        // window.gameState.views += work.views; // ✅ 从0开始，不增加
    }
    
    // window.gameState.likes += work.likes; // ✅ 从0开始，不增加
    window.gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5)); // ✅ 收益影响粉丝（但views初始为0，所以基本不增加）
    window.gameState.money += ad.actualReward;
    window.gameState.adOrdersCount++;
    
    // 统计互动
    if (typeof window.gameState.totalInteractions === 'number') {
        window.gameState.totalInteractions += comments + likes + shares;
    }
    
    // 粉丝疲劳检查
    if (window.gameState.adOrdersCount % 10 === 0) {
        const fanLoss = Math.floor(Math.random() * 1000) + 500;
        window.gameState.fans = Math.max(0, window.gameState.fans - fanLoss);
        // ✅ 修改：使用涨掉粉通知系统
        addFanChangeNotification('⬇️', `长期接商单导致粉丝流失：${fanLoss.toLocaleString()}`, '粉丝疲劳', 'loss', fanLoss);
    }
    
    // ✅ 修改：只显示小弹窗通知，移除通知中心通知
    showEventPopup('🎉 商单完成', `成功完成 "${ad.title}" 商单，获得 ${ad.actualReward.toLocaleString()} 元报酬！`);
    
    // 检查成就
    checkAdAchievements();
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
    
    // 检查高商单数惩罚
    if (typeof window.checkHighAdCountPenalty === 'function') {
        window.checkHighAdCountPenalty();
    }
    
    // ✅ 修复：重置不更新状态（关键修复）
    if (typeof window.resetInactivityDropState === 'function') {
        window.resetInactivityDropState();
    }
    
    // ✅ ✅ ✅ 关键修改：将作品加入全局粉丝增长系统，而不是启动单独定时器
    if (typeof window.addWorkToGlobalFanGrowth === 'function') {
        window.addWorkToGlobalFanGrowth(work.id, true); // isNewWork = true
    }
    
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay();
    }
    
    saveGame();
};

// ==================== 发布品牌合作内容（修复版：从零开始 + 粉丝增长） ====================
window.publishBrandAd = function() {
    const content = document.getElementById('brandAdContent').value.trim();
    const brandDeal = window.gameState.pendingBrandDeal;
    
    if (!content) { 
        if (typeof window.showAlert === 'function') {
            window.showAlert('请输入合作内容', '提示');
        }
        return; 
    }
    
    // 检查违规
    if (typeof window.checkViolation === 'function' && window.checkViolation(content)) return;
    
    // 成功发布（修改：从零开始）
    const views = 0; // ✅ 从0开始
    const likes = 0; // ✅ 从0开始
    const comments = 0; // ✅ 从0开始
    const shares = 0; // ✅ 从0开始
    const work = { 
        id: Date.now(), 
        type: window.selectedBrandMethod || 'video', 
        content: content, 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: window.gameTimer, 
        isAd: true, 
        revenue: Math.floor(views / 1000), // ✅ 收益从0开始计算
        isPrivate: false,
        // ✅ 移除：不再需要单独的粉丝增长定时器
        // growthEndTime: null,
        // fanGrowthInterval: null
    };
    
    window.gameState.worksList.push(work);
    window.gameState.works++;
    
    // 只统计视频和直播的播放量（初始为0）
    if (work.type === 'video' || work.type === 'live') {
        // window.gameState.views += work.views; // ✅ 从0开始，不增加
    }
    
    // window.gameState.likes += work.likes; // ✅ 从0开始，不增加
    window.gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5)); // ✅ 基本不增加粉丝
    window.gameState.money += brandDeal.actualReward;
    window.gameState.adOrdersCount++;
    
    // 统计互动
    if (typeof window.gameState.totalInteractions === 'number') {
        window.gameState.totalInteractions += comments + likes + shares;
    }
    
    // 清空pending状态
    window.gameState.pendingBrandDeal = null;
    
    // ✅ 修改：只显示小弹窗通知，移除通知中心通知
    showEventPopup('🎉 品牌合作完成', `品牌合作 "${brandDeal.title}" 已完成，获得 ${brandDeal.actualReward.toLocaleString()} 元报酬！`);
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
    
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay();
    }
    
    // 检查成就
    checkAdAchievements();
    
    // ✅ 修复：重置不更新状态（关键修复）
    if (typeof window.resetInactivityDropState === 'function') {
        window.resetInactivityDropState();
    }
    
    // ✅ ✅ ✅ 关键修改：将作品加入全局粉丝增长系统，而不是启动单独定时器
    if (typeof window.addWorkToGlobalFanGrowth === 'function') {
        window.addWorkToGlobalFanGrowth(work.id, true); // isNewWork = true
    }
};

// ==================== 月底商单检查（修复版：支持所有月份）=======================
window.checkMonthlyAdOrders = function() {
    if (!window.gameState || window.gameState.isBanned) return;
    
    const currentDate = getVirtualDate();
    
    // ✅ 修复：根据月份动态获取最后一天
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const daysInMonth = monthDays[currentDate.month - 1]; // month是1-12，数组索引是0-11
    
    if (currentDate.day !== daysInMonth) return; // 只在每月最后一天检查
    
    console.log(`执行月底商单检查，当前虚拟时间: ${formatVirtualDate(true)}`);
    
    // 检查过去30天接的商单
    const thirtyDaysAgo = window.gameTimer - (30 * VIRTUAL_DAY_MS);
    const recentAdWorks = window.gameState.worksList.filter(work => 
        work.isAd && work.time >= thirtyDaysAgo && !work.isPrivate
    );
    
    let totalFine = 0;
    let hasFakeAd = false;
    let exposedWorks = [];
    
    recentAdWorks.forEach(work => {
        if (!work.adOrder || work.adOrder.real) return; // 真实商单不检查
        
        // 虚假商单检查概率：checkRisk决定
        if (Math.random() < work.adOrder.checkRisk) {
            hasFakeAd = true;
            exposedWorks.push(work);
            
            // 罚款：奖励的1-3倍
            const fine = Math.floor(work.adOrder.actualReward * (1 + Math.random() * 2));
            totalFine += fine;
            
            // 标记为已检查和曝光
            work.adOrder.isChecked = true;
            work.adOrder.isExposed = true;
            work.hasNegativeComments = true;
            
            // ✅ 修复：如果作品有粉丝增长定时器，清理它
            if (work.fanGrowthInterval) {
                clearInterval(work.fanGrowthInterval);
                work.fanGrowthInterval = null;
                work.growthEndTime = null;
                console.log(`[商单查处] 作品 ${work.id} 的粉丝增长定时器已清理`);
            }
        }
    });
    
    if (hasFakeAd) {
        // ✅ 减少热度值（虚假商单被平台查处）
        if (window.HotValueSystem) {
            const hotValueDecrease = Math.floor(Math.random() * 2001) + 1500; // 1500-3500
            window.HotValueSystem.currentHotValue = Math.max(0, window.HotValueSystem.currentHotValue - hotValueDecrease);
            gameState.currentHotValue = window.HotValueSystem.currentHotValue;
        }
        
        // 1. 罚款
        window.gameState.money = Math.max(0, window.gameState.money - totalFine);
        
        // 2. 警告
        window.gameState.warnings = Math.min(20, window.gameState.warnings + 5);
        
        // 3. 平台惩罚：封号7-30天
        const banDays = Math.floor(Math.random() * 24) + 7;
        window.gameState.isBanned = true;
        window.gameState.banReason = '发布虚假商单内容';
        window.gameState.banDaysCount = banDays;
        window.gameState.banStartTime = window.gameTimer;
        window.gameState.appealAvailable = true;
        
        // 4. 强制结束直播
        if (gameState.liveStatus && typeof endLiveStream === 'function') {
            endLiveStream();
            if (typeof window.showEventPopup === 'function') {
                showEventPopup('🚫 直播中断', '虚假商单曝光，直播已强制结束');
            }
        }
        
        // 5. 停止所有推广
        Object.keys(gameState.trafficWorks).forEach(workId => {
            if (typeof stopTrafficForWork === 'function') {
                stopTrafficForWork(workId);
            }
        });
        
        // 6. 开始持续掉粉惩罚（修复版：不会重置已有惩罚）
        startFakeAdFanLoss(exposedWorks, true);
        
        // ✅ 添加警告历史记录（虚假商单查处）
        if (typeof addWarningToHistory === 'function') {
            exposedWorks.forEach(work => {
                addWarningToHistory('FAKE_AD', 
                    `虚假商单"${work.adOrder.title}"被平台查处`, 
                    work.content.substring(0, 50) + (work.content.length > 50 ? '...' : ''));
            });
        }
        
        // 7. 负面新闻
        if (typeof window.startPublicOpinionCrisis === 'function') {
            window.startPublicOpinionCrisis('⚠️ 虚假商单丑闻');
        }
        
        // ✅ 新增：删除被检测到的虚假商单视频
        exposedWorks.forEach(work => {
            // 找到作品索引
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
                
                console.log(`[商单查处] 作品 ${work.id} 已被删除`);
            }
        });
        
        // ✅ 修改：使用小弹窗通知
        showEventPopup('🚨 虚假商单被查处！', `罚款${totalFine.toLocaleString()}元，封号${banDays}天，粉丝将持续流失！`);
        
        if (typeof window.showWarning === 'function') {
            window.showWarning(`发布虚假商单！警告${window.gameState.warnings}/20次`);
        }
    }
};

// 绑定全局函数
window.publishAd = window.publishAd;
window.checkMonthlyAdOrders = window.checkMonthlyAdOrders;
