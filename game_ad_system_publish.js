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
    let hasViolation = hasViolationKeyword;
    if (ad.keyword && content.includes(ad.keyword)) hasViolation = true;
    
    if (hasViolation) {
        window.gameState.warnings = Math.min(20, window.gameState.warnings + Math.floor(Math.random() * 2) + 1);
        
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
    const views = 0;
    const likes = 0;
    const comments = 0;
    const shares = 0;
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
        adOrder: ad,
        revenue: Math.floor((Math.random() * 15000 + 5000) / 1000),
        isPrivate: false,
        hasNegativeComments: false,
    };
    
    window.gameState.worksList.push(work);
    window.gameState.works++;
    
    window.gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5));
    window.gameState.money += ad.actualReward;
    window.gameState.adOrdersCount++;
    
    if (typeof window.gameState.totalInteractions === 'number') {
        window.gameState.totalInteractions += comments + likes + shares;
    }
    
    if (window.gameState.adOrdersCount % 10 === 0) {
        const fanLoss = Math.floor(Math.random() * 1000) + 500;
        window.gameState.fans = Math.max(0, window.gameState.fans - fanLoss);
        addFanChangeNotification('⬇️', `长期接商单导致粉丝流失：${fanLoss.toLocaleString()}`, '粉丝疲劳', 'loss', fanLoss);
    }
    
    showEventPopup('🎉 商单完成', `成功完成 "${ad.title}" 商单，获得 ${ad.actualReward.toLocaleString()} 元报酬！`);
    
    checkAdAchievements();
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
    
    if (typeof window.checkHighAdCountPenalty === 'function') {
        window.checkHighAdCountPenalty();
    }
    
    if (typeof window.resetInactivityDropState === 'function') {
        window.resetInactivityDropState();
    }
    
    if (typeof window.addWorkToGlobalFanGrowth === 'function') {
        window.addWorkToGlobalFanGrowth(work.id, true);
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
    
    if (typeof window.checkViolation === 'function' && window.checkViolation(content)) return;
    
    const views = 0;
    const likes = 0;
    const comments = 0;
    const shares = 0;
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
        revenue: Math.floor(views / 1000),
        isPrivate: false,
    };
    
    window.gameState.worksList.push(work);
    window.gameState.works++;
    
    window.gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5));
    window.gameState.money += brandDeal.actualReward;
    window.gameState.adOrdersCount++;
    
    if (typeof window.gameState.totalInteractions === 'number') {
        window.gameState.totalInteractions += comments + likes + shares;
    }
    
    window.gameState.pendingBrandDeal = null;
    
    showEventPopup('🎉 品牌合作完成', `品牌合作 "${brandDeal.title}" 已完成，获得 ${brandDeal.actualReward.toLocaleString()} 元报酬！`);
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
    
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay();
    }
    
    checkAdAchievements();
    
    if (typeof window.resetInactivityDropState === 'function') {
        window.resetInactivityDropState();
    }
    
    if (typeof window.addWorkToGlobalFanGrowth === 'function') {
        window.addWorkToGlobalFanGrowth(work.id, true);
    }
};

// ==================== 月底商单检查（修复版：支持所有月份）=======================
window.checkMonthlyAdOrders = function() {
    if (!window.gameState || window.gameState.isBanned) return;
    
    const currentDate = getVirtualDate();
    
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const daysInMonth = monthDays[currentDate.month - 1];
    
    if (currentDate.day !== daysInMonth) return;
    
    console.log(`执行月底商单检查，当前虚拟时间: ${formatVirtualDate(true)}`);
    
    const thirtyDaysAgo = window.gameTimer - (30 * VIRTUAL_DAY_MS);
    const recentAdWorks = window.gameState.worksList.filter(work => 
        work.isAd && work.time >= thirtyDaysAgo && !work.isPrivate
    );
    
    let totalFine = 0;
    let hasFakeAd = false;
    let exposedWorks = [];
    
    recentAdWorks.forEach(work => {
        if (!work.adOrder || work.adOrder.real) return;
        
        if (Math.random() < work.adOrder.checkRisk) {
            hasFakeAd = true;
            exposedWorks.push(work);
            
            const fine = Math.floor(work.adOrder.actualReward * (1 + Math.random() * 2));
            totalFine += fine;
            
            work.adOrder.isChecked = true;
            work.adOrder.isExposed = true;
            work.hasNegativeComments = true;
            
            if (typeof window.startNegativeHotValueBoost === 'function') {
                window.startNegativeHotValueBoost(7);
            }
            
            const workIndex = window.gameState.worksList.findIndex(w => w.id === work.id);
            if (workIndex !== -1) {
                if (work.type === 'video' || work.type === 'live') {
                    window.gameState.views = Math.max(0, window.gameState.views - work.views);
                }
                window.gameState.likes = Math.max(0, window.gameState.likes - work.likes);
                
                window.gameState.works = Math.max(0, window.gameState.works - 1);
                
                const interactionCount = work.comments + work.likes + work.shares;
                window.gameState.totalInteractions = Math.max(0, window.gameState.totalInteractions - interactionCount);
                
                if (work.recommendInterval) {
                    clearInterval(work.recommendInterval);
                    work.recommendInterval = null;
                }
                
                if (work.controversyInterval) {
                    clearInterval(work.controversyInterval);
                    work.controversyInterval = null;
                }
                
                if (work.hotInterval) {
                    clearInterval(work.hotInterval);
                    work.hotInterval = null;
                }
                
                if (work.isRaffle) {
                    if (work.fanGrowthInterval) clearInterval(work.fanGrowthInterval);
                    if (work.dataGrowthInterval) clearInterval(work.dataGrowthInterval);
                    if (work.fanLossInterval) clearInterval(work.fanLossInterval);
                    if (work.manualDrawWarningInterval) clearInterval(work.manualDrawWarningInterval);
                    if (work.crazyFanLossInterval) clearInterval(work.crazyFanLossInterval);
                }
                
                if (window.gameState.trafficWorks[work.id]) {
                    if (typeof stopTrafficForWork === 'function') {
                        stopTrafficForWork(work.id);
                    }
                    delete window.gameState.trafficWorks[work.id];
                }
                
                window.gameState.worksList.splice(workIndex, 1);
                
                if (typeof window.showEventPopup === 'function') {
                    showEventPopup('🗑️ 视频已删除', `虚假商单视频已被平台删除`);
                }
                
                console.log(`[商单查处] 作品 ${work.id} 已被删除`);
            }
            
            window.gameState.money = Math.max(0, window.gameState.money - totalFine);
            window.gameState.warnings = Math.min(20, window.gameState.warnings + 5);
            
            window.gameState.isBanned = true;
            window.gameState.banReason = '发布虚假商单内容';
            window.gameState.banDaysCount = Math.floor(Math.random() * 24) + 7;
            window.gameState.banStartTime = window.gameTimer;
            window.gameState.appealAvailable = true;
            
            window.gameState.banType = 1;
            window.gameState.originalUsername = window.gameState.username;
            window.gameState.originalAvatar = window.gameState.avatar;
            window.gameState.originalAvatarImage = window.gameState.avatarImage;
            
            window.gameState.preBanPublicWorks = window.gameState.worksList
                .filter(w => !w.isPrivate)
                .map(w => w.id);
            
            window.gameState.worksList.forEach(work => {
                work.isPrivate = true;
            });
            
            window.gameState.works = 0;
            
            window.gameState.avatar = '';
            window.gameState.avatarImage = '';
            
            window.gameState.username = window.gameState.userId;
            
            if (gameState.liveStatus && typeof endLiveStream === 'function') {
                endLiveStream();
                if (typeof window.showEventPopup === 'function') {
                    showEventPopup('🚫 直播中断', '虚假商单曝光，直播已强制结束');
                }
            }
            
            Object.keys(gameState.trafficWorks).forEach(workId => {
                if (typeof stopTrafficForWork === 'function') {
                    stopTrafficForWork(workId);
                }
            });
            
            startFakeAdFanLoss(exposedWorks, true);
            
            if (typeof addWarningToHistory === 'function') {
                exposedWorks.forEach(work => {
                    addWarningToHistory('FAKE_AD', 
                        `虚假商单"${work.adOrder.title}"被平台查处`, 
                        work.content.substring(0, 50) + (work.content.length > 50 ? '...' : ''));
                });
            }
            
            if (typeof window.startPublicOpinionCrisis === 'function') {
                window.startPublicOpinionCrisis('⚠️ 虚假商单丑闻');
            }
            
            exposedWorks.forEach(work => {
                const workIndex = window.gameState.worksList.findIndex(w => w.id === work.id);
                if (workIndex !== -1) {
                    if (work.type === 'video' || work.type === 'live') {
                        window.gameState.views = Math.max(0, window.gameState.views - work.views);
                    }
                    window.gameState.likes = Math.max(0, window.gameState.likes - work.likes);
                    
                    window.gameState.works = Math.max(0, window.gameState.works - 1);
                    
                    const interactionCount = work.comments + work.likes + work.shares;
                    window.gameState.totalInteractions = Math.max(0, window.gameState.totalInteractions - interactionCount);
                    
                    if (work.recommendInterval) {
                        clearInterval(work.recommendInterval);
                        work.recommendInterval = null;
                    }
                    
                    if (work.controversyInterval) {
                        clearInterval(work.controversyInterval);
                        work.controversyInterval = null;
                    }
                    
                    if (work.hotInterval) {
                        clearInterval(work.hotInterval);
                        work.hotInterval = null;
                    }
                    
                    if (work.isRaffle) {
                        if (work.fanGrowthInterval) clearInterval(work.fanGrowthInterval);
                        if (work.dataGrowthInterval) clearInterval(work.dataGrowthInterval);
                        if (work.fanLossInterval) clearInterval(work.fanLossInterval);
                        if (work.manualDrawWarningInterval) clearInterval(work.manualDrawWarningInterval);
                        if (work.crazyFanLossInterval) clearInterval(work.crazyFanLossInterval);
                    }
                    
                    if (window.gameState.trafficWorks[work.id]) {
                        if (typeof stopTrafficForWork === 'function') {
                            stopTrafficForWork(work.id);
                        }
                        delete window.gameState.trafficWorks[work.id];
                    }
                    
                    window.gameState.worksList.splice(workIndex, 1);
                    
                    if (typeof window.showEventPopup === 'function') {
                        showEventPopup('🗑️ 视频已删除', `虚假商单视频已被平台删除`);
                    }
                    
                    console.log(`[商单查处] 作品 ${work.id} 已被删除`);
                }
            });
            
            showEventPopup('🚨 虚假商单被查处！', `罚款${totalFine.toLocaleString()}元，封号${window.gameState.banDaysCount}天，粉丝将持续流失！`);
            
            if (typeof window.showWarning === 'function') {
                window.showWarning(`发布虚假商单！警告${window.gameState.warnings}/20次`);
            }
        }
    });
};

// ==================== 新增：商单发布统计导出（供开发者监控）====================
window.getAdPublishStats = function() {
    if (!window.gameState || !window.gameState.worksList) {
        return {
            totalPublished: 0,
            brandDealsCompleted: 0,
            brandDealsRejected: 0,
            monthlyRevenue: 0,
            totalRevenue: 0,
            recentPublishHistory: []
        };
    }
    
    const allAds = window.gameState.worksList.filter(w => w.isAd && !w.isPrivate);
    const thirtyDaysAgo = window.gameTimer - (30 * VIRTUAL_DAY_MS);
    const recentAds = allAds.filter(w => w.time >= thirtyDaysAgo);
    
    // 计算本月收益（最近30天）
    const monthlyRevenue = recentAds.reduce((sum, w) => sum + (w.adOrder ? w.adOrder.actualReward : 0), 0);
    
    // 计算总收益
    const totalRevenue = allAds.reduce((sum, w) => sum + (w.adOrder ? w.adOrder.actualReward : 0), 0);
    
    // 最近发布历史（最近5条）
    const recentPublishHistory = allAds
        .sort((a, b) => b.time - a.time)
        .slice(0, 5)
        .map(w => ({
            type: w.type,
            title: w.adOrder ? w.adOrder.title : '未知商单',
            reward: w.adOrder ? w.adOrder.actualReward : 0,
            isReal: w.adOrder ? w.adOrder.real : true,
            isExposed: w.adOrder ? w.adOrder.isExposed : false,
            timeAgo: Math.floor((window.gameTimer - w.time) / VIRTUAL_DAY_MS)
        }));
    
    return {
        totalPublished: allAds.length,
        brandDealsCompleted: (window.gameState.worksList || []).filter(w => 
            w.isAd && !w.isPrivate && w.adOrder && w.adOrder.id === 'brand'
        ).length,
        brandDealsRejected: window.gameState.rejectedAdOrders || 0,
        monthlyRevenue: monthlyRevenue,
        totalRevenue: totalRevenue,
        recentPublishHistory: recentPublishHistory,
        avgRevenuePerAd: allAds.length > 0 ? Math.floor(totalRevenue / allAds.length) : 0
    };
};

// ==================== 新增：月度检查状态导出（供开发者监控）====================
window.getMonthlyCheckStatus = function() {
    if (!window.gameState) {
        return {
            lastCheckMonth: -1,
            daysUntilNextCheck: 0,
            recentFakeAdsCount: 0,
            checkRiskLevel: 'low'
        };
    }
    
    const currentDate = getVirtualDate();
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const daysInMonth = monthDays[currentDate.month - 1];
    const daysUntilNextCheck = daysInMonth - currentDate.day;
    
    // 计算最近30天内的虚假商单数量（未曝光的）
    const thirtyDaysAgo = window.gameTimer - (30 * VIRTUAL_DAY_MS);
    const recentFakeAds = (window.gameState.worksList || []).filter(w => 
        w.isAd && w.adOrder && !w.adOrder.real && 
        w.time >= thirtyDaysAgo &&
        !w.adOrder.isExposed && !w.isPrivate
    );
    
    const recentFakeAdsCount = recentFakeAds.length;
    
    // 风险等级评估
    let checkRiskLevel = 'low';
    if (recentFakeAdsCount >= 5) {
        checkRiskLevel = 'extreme';
    } else if (recentFakeAdsCount >= 3) {
        checkRiskLevel = 'high';
    } else if (recentFakeAdsCount >= 1) {
        checkRiskLevel = 'medium';
    }
    
    // 预估查处概率（基于checkRisk总和）
    const totalCheckRisk = recentFakeAds.reduce((sum, w) => sum + (w.adOrder.checkRisk || 0), 0);
    
    return {
        lastCheckMonth: window.gameState.lastCheckMonth || -1,
        currentMonth: currentDate.month,
        currentDay: currentDate.day,
        daysUntilNextCheck: daysUntilNextCheck,
        recentFakeAdsCount: recentFakeAdsCount,
        checkRiskLevel: checkRiskLevel,
        estimatedExposeProbability: Math.min(100, Math.floor(totalCheckRisk * 100)),
        nextCheckDate: `${currentDate.month}月${daysInMonth}日`
    };
};

// 绑定全局函数
window.publishAd = window.publishAd;
window.publishBrandAd = window.publishBrandAd;
window.checkMonthlyAdOrders = window.checkMonthlyAdOrders;
window.getAdPublishStats = window.getAdPublishStats;
window.getMonthlyCheckStatus = window.getMonthlyCheckStatus;
