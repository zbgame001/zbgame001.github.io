// ==================== 开发者模式功能（最终完整版） ====================

// 全局倒计时追踪器（已修复：同步实际游戏间隔）
window.devCountdowns = {
    randomEvent: { nextTime: 0, interval: 30000, triggerCount: 0 },      // 30秒匹配实际
    fanFluctuation: { nextTime: 0, interval: 3000, triggerCount: 0 },    // 修复：3秒匹配实际自然涨粉
    inactivityCheck: { nextTime: 0, interval: VIRTUAL_DAY_MS },
    chartUpdate: { nextTime: 0, interval: VIRTUAL_DAY_MS },
    interactionGen: { nextTime: 0, interval: 5000 }
};

// 启用开发者模式
function enableDevMode() {
    gameState.devMode = true;
    document.getElementById('devFloatButton').style.display = 'block';
    showNotification('开发者模式', '开发者模式已启用，悬浮按钮已显示');
    
    // 启动倒计时追踪
    devStartCountdownTracker();
    saveGame();
}

// 启动倒计时追踪器
function devStartCountdownTracker() {
    if (window.devCountdownInterval) {
        clearInterval(window.devCountdownInterval);
    }
    
    // 初始化下次触发时间（使用当前游戏时间）
    const now = Date.now();
    devCountdowns.randomEvent.nextTime = now + devCountdowns.randomEvent.interval;
    devCountdowns.fanFluctuation.nextTime = now + devCountdowns.fanFluctuation.interval;
    devCountdowns.inactivityCheck.nextTime = now + devCountdowns.inactivityCheck.interval;
    devCountdowns.chartUpdate.nextTime = now + devCountdowns.chartUpdate.interval;
    devCountdowns.interactionGen.nextTime = now + devCountdowns.interactionGen.interval;
    
    // 每秒更新倒计时显示
    window.devCountdownInterval = setInterval(() => {
        if (gameState.devMode) {
            devUpdateCountdowns();
        } else {
            clearInterval(window.devCountdownInterval);
        }
    }, 100);
}

// 更新倒计时显示（已修复：准确显示剩余时间和触发次数）
function devUpdateCountdowns() {
    const now = Date.now();
    
    // 更新随机事件倒计时（30秒）
    const randomEventTimeLeft = Math.max(0, devCountdowns.randomEvent.nextTime - now);
    if (randomEventTimeLeft === 0) {
        // 时间到，增加计数并重置
        devCountdowns.randomEvent.triggerCount++;
        devCountdowns.randomEvent.nextTime = now + devCountdowns.randomEvent.interval;
    }
    
    // 更新粉丝波动倒计时（3秒）
    const fanFluctuationTimeLeft = Math.max(0, devCountdowns.fanFluctuation.nextTime - now);
    if (fanFluctuationTimeLeft === 0) {
        // 时间到，增加计数并重置
        devCountdowns.fanFluctuation.triggerCount++;
        devCountdowns.fanFluctuation.nextTime = now + devCountdowns.fanFluctuation.interval;
    }
    
    // 更新不更新检测倒计时（基于虚拟时间）
    const daysSinceLastWork = (gameTimer - gameState.lastWorkTime) / VIRTUAL_DAY_MS;
    const inactivityTimeLeft = Math.max(0, (7 - daysSinceLastWork) * VIRTUAL_DAY_MS);
    
    // 更新虚拟天数
    const virtualDays = Math.floor(getVirtualDaysPassed());
    
    // 获取UI元素并更新（显示倒计时和触发次数）
    const randomEventEl = document.getElementById('devRandomEventCountdown');
    const fanFluctuationEl = document.getElementById('devFanFluctuationCountdown');
    const inactivityEl = document.getElementById('devInactivityCountdown');
    const virtualDaysEl = document.getElementById('devVirtualDays');
    const gameTimerEl = document.getElementById('devGameTimer');
    
    if (randomEventEl) {
        randomEventEl.textContent = `[随机事件] ${(randomEventTimeLeft / 1000).toFixed(1)}秒 | 已触发:${devCountdowns.randomEvent.triggerCount}次`;
    }
    if (fanFluctuationEl) {
        fanFluctuationEl.textContent = `[粉丝波动] ${(fanFluctuationTimeLeft / 1000).toFixed(1)}秒 | 已触发:${devCountdowns.fanFluctuation.triggerCount}次`;
    }
    if (inactivityEl) {
        if (daysSinceLastWork < 7) {
            inactivityEl.textContent = `[不更新检测] ${Math.floor(inactivityTimeLeft / 60000)}分${Math.floor((inactivityTimeLeft % 60000) / 1000)}秒`;
        } else {
            inactivityEl.textContent = `[掉粉中] 已超时${Math.floor(daysSinceLastWork - 7)}天`;
        }
    }
    if (virtualDaysEl) {
        virtualDaysEl.textContent = virtualDays;
    }
    if (gameTimerEl) {
        gameTimerEl.textContent = `${(gameTimer / 1000).toFixed(1)}秒`;
    }
    
    // 更新特殊状态倒计时
    devUpdateSpecialStatusCountdowns();
    
    // 更新商单系统状态
    devUpdateAdSystemStatus();
    
    // 更新惩罚系统状态
    devUpdatePenaltyStatus();
    
    // 更新负面热度状态
    devUpdateNegativeHotStatus();
    
    // ==================== 新增：热度值系统监控 ====================
    devUpdateHotValueStatus();
    
    // ==================== 新增：直播状态监控 ====================
    devUpdateLiveStatus();
    
    // ==================== 新增：抽奖系统监控 ====================
    devUpdateRaffleStatus();
    
    // ==================== 新增：私信系统监控 ====================
    devUpdatePrivateMessageStatus();
    
    // ==================== 新增：系统消息监控 ====================
    devUpdateSystemMessageStatus();
    
    // ==================== 新增：全局作品粉丝增长监控 ====================
    devUpdateWorkFanGrowthStatus();
    
    // ==================== 新增：自动清理缓存监控 ====================
    devUpdateAutoCleanCacheStatus();
    
    // ==================== 新增：封号类型与申诉状态 ====================
    devUpdateBanTypeStatus();
    
    // ==================== 新增：基础增益与特殊计数 ====================
    devUpdateBaseBoostStatus();
}

// 更新特殊状态倒计时
function devUpdateSpecialStatusCountdowns() {
    // 热搜倒计时
    const hotSearchEl = document.getElementById('devHotSearchCountdown');
    if (hotSearchEl) {
        if (gameState.isHotSearch && gameState.hotSearchStartTime !== null) {
            const timePassed = gameTimer - gameState.hotSearchStartTime;
            const daysLeft = Math.max(0, gameState.hotSearchDaysCount - (timePassed / VIRTUAL_DAY_MS));
            hotSearchEl.textContent = `[热搜] ${daysLeft.toFixed(2)}天`;
        } else {
            hotSearchEl.textContent = '[热搜] 未激活';
        }
    }
    
    // 舆论危机倒计时
    const publicOpinionEl = document.getElementById('devPublicOpinionCountdown');
    if (publicOpinionEl) {
        if (gameState.isPublicOpinionCrisis && gameState.publicOpinionStartTime !== null) {
            const timePassed = gameTimer - gameState.publicOpinionStartTime;
            const daysLeft = Math.max(0, gameState.publicOpinionDaysCount - (timePassed / VIRTUAL_DAY_MS));
            publicOpinionEl.textContent = `[舆论] ${daysLeft.toFixed(2)}天`;
        } else {
            publicOpinionEl.textContent = '[舆论] 未激活';
        }
    }
    
    // 封禁倒计时
    const banEl = document.getElementById('devBanCountdown');
    if (banEl) {
        if (gameState.isBanned && gameState.banStartTime !== null) {
            const timePassed = gameTimer - gameState.banStartTime;
            const daysLeft = Math.max(0, gameState.banDaysCount - (timePassed / VIRTUAL_DAY_MS));
            banEl.textContent = `[封禁] ${daysLeft.toFixed(2)}天`;
        } else {
            banEl.textContent = '[封禁] 未激活';
        }
    }
    
    // 流量推广倒计时
    const trafficEl = document.getElementById('devTrafficCountdown');
    if (trafficEl) {
        const activeTraffics = [];
        Object.keys(gameState.trafficWorks).forEach(workIdStr => {
            const trafficData = gameState.trafficWorks[workIdStr];
            if (trafficData && trafficData.isActive) {
                const timePassed = gameTimer - trafficData.startTime;
                const daysLeft = Math.max(0, trafficData.days - (timePassed / VIRTUAL_DAY_MS));
                activeTraffics.push(`${daysLeft.toFixed(1)}天`);
            }
        });
        
        if (activeTraffics.length > 0) {
            trafficEl.textContent = `[流量] ${activeTraffics.join(', ')}`;
        } else {
            trafficEl.textContent = '[流量] 未激活';
        }
    }
}

// ==================== 新增：热度值系统状态监控 ====================
function devUpdateHotValueStatus() {
    const hotValueEl = document.getElementById('devHotValueCountdown');
    if (hotValueEl) {
        const currentHot = gameState.currentHotValue || 1000;
        
        if (gameState.hotValueBoostActive) {
            const boostEnd = gameState.hotValueBoostEndTime || 0;
            const boostLeft = Math.max(0, boostEnd - gameTimer);
            const boostDays = (boostLeft / VIRTUAL_DAY_MS).toFixed(1);
            hotValueEl.textContent = `[热度值] ${(currentHot/1000).toFixed(1)}K 增长期剩${boostDays}天`;
        } else if (gameState.hotValueDropActive) {
            const dropEnd = gameState.hotValueDropEndTime || 0;
            const dropLeft = Math.max(0, dropEnd - gameTimer);
            const dropDays = (dropLeft / VIRTUAL_DAY_MS).toFixed(1);
            hotValueEl.textContent = `[热度值] ${(currentHot/1000).toFixed(1)}K 下降期剩${dropDays}天`;
        } else {
            const multiplier = typeof getHotValueMultiplier === 'function' ? getHotValueMultiplier() : 1.0;
            hotValueEl.textContent = `[热度值] ${(currentHot/1000).toFixed(1)}K (倍数:${multiplier.toFixed(1)}x)`;
        }
    }
}

// ==================== 新增：直播状态监控 ====================
function devUpdateLiveStatus() {
    const liveEl = document.getElementById('devLiveCountdown');
    if (liveEl) {
        if (gameState.liveStatus) {
            const liveDuration = gameState.liveStartTime ? ((gameTimer - gameState.liveStartTime) / VIRTUAL_MINUTE_MS).toFixed(0) : 0;
            liveEl.textContent = `[直播中] 时长:${liveDuration}分钟 | 历史:${gameState.liveHistory ? gameState.liveHistory.length : 0}场`;
        } else {
            liveEl.textContent = `[直播] 未开播 | 历史:${gameState.liveHistory ? gameState.liveHistory.length : 0}场`;
        }
    }
}

// ==================== 新增：抽奖系统状态监控 ====================
function devUpdateRaffleStatus() {
    const raffleEl = document.getElementById('devRaffleCountdown');
    if (raffleEl) {
        const raffleWorks = gameState.worksList ? gameState.worksList.filter(w => w.isRaffle) : [];
        const activeRaffles = raffleWorks.filter(w => w.raffleStatus === 'active');
        const pendingDraw = raffleWorks.filter(w => w.raffleStatus === 'pending_draw');
        
        if (activeRaffles.length > 0 || pendingDraw.length > 0) {
            raffleEl.textContent = `[抽奖] 进行中:${activeRaffles.length} 待开奖:${pendingDraw.length}`;
        } else {
            raffleEl.textContent = '[抽奖] 无活动';
        }
    }
}

// ==================== 新增：私信系统状态监控 ====================
function devUpdatePrivateMessageStatus() {
    const pmEl = document.getElementById('devPrivateMessageCountdown');
    if (pmEl) {
        const pmSystem = gameState.privateMessageSystem || {};
        const convCount = pmSystem.conversations ? pmSystem.conversations.length : 0;
        const unreadCount = pmSystem.unreadCount || 0;
        const isRunning = pmSystem.generationInterval ? '运行中' : '已停止';
        pmEl.textContent = `[私信] 对话:${convCount} 未读:${unreadCount} [${isRunning}]`;
    }
}

// ==================== 新增：系统消息状态监控 ====================
function devUpdateSystemMessageStatus() {
    const sysMsgEl = document.getElementById('devSystemMessageCountdown');
    if (sysMsgEl) {
        const sysSystem = gameState.systemMessages || {};
        const msgCount = sysSystem.messages ? sysSystem.messages.length : 0;
        const unreadCount = sysSystem.unreadCount || 0;
        const hotSearchActive = sysSystem.hotSearchActiveWorks ? sysSystem.hotSearchActiveWorks.length : 0;
        sysMsgEl.textContent = `[系统消息] 总计:${msgCount} 未读:${unreadCount} 热搜作品:${hotSearchActive}`;
    }
}

// ==================== 新增：全局作品粉丝增长监控 ====================
function devUpdateWorkFanGrowthStatus() {
    const growthEl = document.getElementById('devWorkFanGrowthCountdown');
    if (growthEl) {
        const growthSystem = gameState.workFanGrowthSystem || {};
        const activeWorks = growthSystem.activeWorks ? growthSystem.activeWorks.length : 0;
        const isRunning = growthSystem.isRunning ? '运行中' : '已停止';
        const totalChange = growthSystem.totalFanChange || 0;
        const sign = totalChange >= 0 ? '+' : '';
        growthEl.textContent = `[全局涨粉] 活跃作品:${activeWorks} 总变化:${sign}${totalChange} [${isRunning}]`;
    }
}

// ==================== 新增：自动清理缓存监控 ====================
function devUpdateAutoCleanCacheStatus() {
    const cacheEl = document.getElementById('devAutoCleanCacheCountdown');
    if (cacheEl) {
        const interval = gameState.autoCleanCacheInterval || 5;
        const isActive = gameState.autoCleanCacheTimer ? '开启' : '关闭';
        cacheEl.textContent = `[自动清理] 间隔:${interval}分钟 [${isActive}]`;
    }
}

// ==================== 新增：封号类型与申诉状态 ====================
function devUpdateBanTypeStatus() {
    const banTypeEl = document.getElementById('devBanTypeCountdown');
    if (banTypeEl) {
        if (gameState.isBanned) {
            const typeNames = ['普通封号', '私密+空白头像', '空白头像', '仅私密作品'];
            const banType = gameState.banType || 0;
            const appealAvailable = gameState.appealAvailable ? '可申诉' : '已申诉';
            banTypeEl.textContent = `[封号类型] ${typeNames[banType] || '未知'} | ${appealAvailable}`;
        } else {
            banTypeEl.textContent = '[封号类型] 未封禁';
        }
    }
}

// ==================== 新增：基础增益与特殊计数 ====================
function devUpdateBaseBoostStatus() {
    const boostEl = document.getElementById('devBaseBoostCountdown');
    if (boostEl) {
        const boost = gameState.baseFanChangeBoost || 0;
        const replies = gameState.commentRepliesCount || 0;
        const following = gameState.following ? gameState.following.length : 0;
        const doNotDisturb = gameState.doNotDisturb ? '免打扰:开' : '免打扰:关';
        boostEl.textContent = `[增益] 基础+${boost}/作品 | 回复:${replies} | 关注:${following} | ${doNotDisturb}`;
    }
}

// ==================== 新增：商单系统状态监控 ====================
function devUpdateAdSystemStatus() {
    // 商单统计
    const adOrdersEl = document.getElementById('devAdOrdersCountdown');
    if (adOrdersEl && gameState) {
        const totalAds = gameState.worksList ? gameState.worksList.filter(w => w.isAd && !w.isPrivate).length : 0;
        const fakeAds = gameState.worksList ? gameState.worksList.filter(w => w.isAd && w.adOrder && !w.adOrder.real && !w.isPrivate).length : 0;
        const pendingBrand = gameState.pendingBrandDeal && gameState.pendingBrandDeal.status === 'pending' ? 1 : 0;
        
        adOrdersEl.textContent = `[商单] 总计:${totalAds} 虚假:${fakeAds} 待处理:${pendingBrand}`;
    }
    
    // 商单惩罚累计
    const adPenaltyEl = document.getElementById('devAdPenaltyCountdown');
    if (adPenaltyEl) {
        if (gameState.adOrdersPenaltyActive) {
            const daysLeft = Math.ceil((gameState.adOrdersPenaltyEndTime - gameTimer) / VIRTUAL_DAY_MS);
            adPenaltyEl.textContent = `[商单惩罚] 粉丝疲劳中，剩${daysLeft}天`;
        } else {
            const count = gameState.adOrdersCount || 0;
            const threshold = 30;
            adPenaltyEl.textContent = `[商单] 本月:${count}/${threshold}单`;
        }
    }
}

// ==================== 新增：惩罚系统状态监控 ====================
function devUpdatePenaltyStatus() {
    // 虚假商单掉粉惩罚
    const fakeAdPenaltyEl = document.getElementById('devFakeAdPenaltyCountdown');
    if (fakeAdPenaltyEl) {
        if (gameState.fakeAdPenalty && gameState.fakeAdPenalty.isActive) {
            const daysLeft = Math.ceil((gameState.fakeAdPenalty.endTime - gameTimer) / VIRTUAL_DAY_MS);
            const lossRate = gameState.fakeAdPenalty.dailyFanLoss || 1;
            fakeAdPenaltyEl.textContent = `[虚假商单] 掉粉惩罚剩${daysLeft}天，速率:${lossRate}/秒`;
        } else {
            fakeAdPenaltyEl.textContent = '[虚假商单] 惩罚未激活';
        }
    }
    
    // 月度检查倒计时
    const monthlyCheckEl = document.getElementById('devMonthlyCheckCountdown');
    if (monthlyCheckEl) {
        const currentDate = getVirtualDate();
        const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const daysInMonth = monthDays[currentDate.month - 1];
        const daysLeft = daysInMonth - currentDate.day;
        
        // 检查是否有即将被查处的虚假商单
        const recentFakeAds = gameState.worksList ? gameState.worksList.filter(w => 
            w.isAd && w.adOrder && !w.adOrder.real && 
            w.time >= (gameTimer - (30 * VIRTUAL_DAY_MS)) &&
            !w.adOrder.isExposed && !w.isPrivate
        ).length : 0;
        
        if (recentFakeAds > 0) {
            monthlyCheckEl.textContent = `[月底检查] ${daysLeft}天后，风险:${recentFakeAds}假单`;
        } else {
            monthlyCheckEl.textContent = `[月底检查] ${daysLeft}天后`;
        }
    }
}

// ==================== 新增：负面热度状态监控 ====================
function devUpdateNegativeHotStatus() {
    const negativeHotEl = document.getElementById('devNegativeHotCountdown');
    if (negativeHotEl) {
        let statusText = '[负面热度] ';
        
        if (gameState.isNegativeBoostActive) {
            // 处于负面热度增长期
            const boostEnd = gameState.currentNegativeBoostEndTime || 0;
            const boostLeft = Math.max(0, boostEnd - gameTimer);
            const boostDays = (boostLeft / VIRTUAL_DAY_MS).toFixed(1);
            const negativeRatio = typeof getNegativeHotValueRatio === 'function' ? getNegativeHotValueRatio() : 0;
            statusText += `增长期剩${boostDays}天，加成${(negativeRatio * 100).toFixed(0)}%`;
        } else if (gameState.isNegativeDropActive) {
            // 处于负面热度下降期
            const dropEnd = gameState.currentNegativeDropEndTime || 0;
            const dropLeft = Math.max(0, dropEnd - gameTimer);
            const dropDays = (dropLeft / VIRTUAL_DAY_MS).toFixed(1);
            const negativeRatio = typeof getNegativeHotValueRatio === 'function' ? getNegativeHotValueRatio() : 0;
            statusText += `下降期剩${dropDays}天，剩余${(negativeRatio * 100).toFixed(0)}%`;
        } else {
            statusText += '未激活';
        }
        
        negativeHotEl.textContent = statusText;
    }
}

// 密码验证（静默验证）
function devVerifyPassword() {
    const input = document.getElementById('devPasswordInput').value;
    if (btoa(input) === 'emJnYW1lZGV2') {
        enableDevMode();
        closeModal();
    } else {
        showAlert('输入错误！', '提示');
        closeModal();
    }
}

// 显示密码输入框
function showDevPasswordModal() {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">开发者模式</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="margin-bottom: 15px; font-size: 14px; color: #999;">
                请输入访问密钥
            </div>
            <input type="password" class="text-input" id="devPasswordInput" placeholder="输入密钥" maxlength="20" 
                   style="margin-bottom: 15px; background: #222; border: 1px solid #333; color: #fff;">
            <button class="btn" onclick="devVerifyPassword()" style="width: 100%;">确定</button>
        </div>
    `;
    showModal(modalContent);
    
    setTimeout(() => {
        const input = document.getElementById('devPasswordInput');
        if (input) input.focus();
    }, 100);
    
    setTimeout(() => {
        const input = document.getElementById('devPasswordInput');
        if (input) {
            input.onkeydown = function(e) {
                if (e.key === 'Enter') {
                    devVerifyPassword();
                }
            };
        }
    }, 150);
}

// 显示开发者选项
function showDevOptions() {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">开发者控制台</div>
            <div class="close-btn" onclick="closeDevOptions()">✕</div>
        </div>
        
        <div style="margin: 15px 20px 20px;">
            <div class="dev-stats-grid">
                <div class="dev-stat-card">
                    <div class="dev-stat-value">${formatNumber(gameState.fans)}</div>
                    <div class="dev-stat-label">粉丝数</div>
                </div>
                <div class="dev-stat-card">
                    <div class="dev-stat-value">${formatNumber(gameState.money)}</div>
                    <div class="dev-stat-label">零钱</div>
                </div>
                <div class="dev-stat-card">
                    <div class="dev-stat-value">${gameState.warnings}/20</div>
                    <div class="dev-stat-label">警告</div>
                </div>
            </div>
        </div>

        <div style="margin: 0 20px 20px; background: #0a0a0a; border: 1px solid #333; border-radius: 12px; padding: 15px;">
            <div class="dev-section-title">📡 实时状态监控（已修复）</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px; color: #ccc; margin-top: 10px;">
                <div style="background: #111; padding: 8px; border-radius: 6px; border: 1px solid #222;">
                    <div style="color: #667aea; margin-bottom: 4px;">虚拟时间</div>
                    <div id="devVirtualDays" style="font-weight: bold; font-size: 12px;">0天</div>
                    <div id="devGameTimer" style="font-size: 10px; color: #999;">0秒</div>
                </div>
                <div style="background: #111; padding: 8px; border-radius: 6px; border: 1px solid #222;">
                    <div style="color: #ff6b00; margin-bottom: 4px;">商单统计</div>
                    <div id="devAdQuickStats" style="font-weight: bold; font-size: 12px;">总计:0/虚假:0</div>
                </div>
            </div>
            <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
                <div id="devRandomEventCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #00f2ea;">[随机事件] 30.0秒 | 已触发:0次</div>
                <div id="devFanFluctuationCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #667aea;">[粉丝波动] 3.0秒 | 已触发:0次</div>
                <div id="devInactivityCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff6b00;">[不更新检测] 0分0秒</div>
                <div id="devTrafficCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff0050;">[流量] 未激活</div>
                <div id="devHotSearchCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #FFD700;">[热搜] 未激活</div>
                <div id="devPublicOpinionCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #8B0000;">[舆论] 未激活</div>
                <div id="devBanCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff0050;">[封禁] 未激活</div>
                
                <!-- 商单系统监控 -->
                <div id="devAdOrdersCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #00f2ea;">[商单] 总计:0 虚假:0 待处理:0</div>
                <div id="devAdPenaltyCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff6b00;">[商单] 本月:0/30单</div>
                <div id="devFakeAdPenaltyCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #8B0000;">[虚假商单] 惩罚未激活</div>
                <div id="devMonthlyCheckCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #667aea;">[月底检查] --</div>
                
                <!-- 负面热度监控 -->
                <div id="devNegativeHotCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff0050;">[负面热度] 未激活</div>
                
                <!-- ==================== 新增：更多机制状态监控 ==================== -->
                <div id="devHotValueCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #00f2ea;">[热度值] 1.0K</div>
                <div id="devLiveCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff0050;">[直播] 未开播</div>
                <div id="devRaffleCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #FFD700;">[抽奖] 无活动</div>
                <div id="devPrivateMessageCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #667aea;">[私信] 对话:0 未读:0</div>
                <div id="devSystemMessageCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #00f2ea;">[系统消息] 总计:0 未读:0</div>
                <div id="devWorkFanGrowthCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #00ff00;">[全局涨粉] 活跃作品:0</div>
                <div id="devAutoCleanCacheCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #999;">[自动清理] 间隔:5分钟 [关闭]</div>
                <div id="devBanTypeCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff0000;">[封号类型] 未封禁</div>
                <div id="devBaseBoostCountdown" style="background: #111; padding: 6px 8px; border-radius: 4px; border-left: 3px solid #ff6b00;">[增益] 基础+0/作品 | 回复:0 | 关注:0</div>
            </div>
            <div style="margin-top: 10px; font-size: 10px; color: #666; text-align: center;">
                💡 点击数值卡片可快速复制数据
            </div>
        </div>

        <div style="padding: 0 20px 20px; display: grid; gap: 20px;">
            <div class="dev-section">
                <div class="dev-section-title">🧪 测试工具</div>
                <div class="dev-grid">
                    <button class="dev-btn dev-btn-test" onclick="devTriggerRandomEvent()">
                        <span class="dev-btn-icon">🎲</span>
                        <span class="dev-btn-text">触发事件</span>
                    </button>
                    <button class="dev-btn dev-btn-test" onclick="devTestHotSearch()">
                        <span class="dev-btn-icon">🔥</span>
                        <span class="dev-btn-text">触发热搜</span>
                    </button>
                    <button class="dev-btn dev-btn-test" onclick="devTestPublicOpinion()">
                        <span class="dev-btn-icon">⚠️</span>
                        <span class="dev-btn-text">触发舆论</span>
                    </button>
                    <button class="dev-btn dev-btn-test" onclick="devTestBan()">
                        <span class="dev-btn-icon">🚫</span>
                        <span class="dev-btn-text">测试封禁</span>
                    </button>
                </div>
            </div>

            <div class="dev-section">
                <div class="dev-section-title">✏️ 数据修改</div>
                <div class="dev-grid">
                    <button class="dev-btn dev-btn-edit" onclick="devAddFans()">
                        <span class="dev-btn-icon">👥</span>
                        <span class="dev-btn-text">增加粉丝</span>
                    </button>
                    <button class="dev-btn dev-btn-edit" onclick="devAddMoney()">
                        <span class="dev-btn-icon">💵</span>
                        <span class="dev-btn-text">增加零钱</span>
                    </button>
                    <button class="dev-btn dev-btn-edit" onclick="devResetWarnings()">
                        <span class="dev-btn-icon">🔄</span>
                        <span class="dev-btn-text">重置警告</span>
                    </button>
                    <button class="dev-btn dev-btn-edit" onclick="devChangeGameTime()">
                        <span class="dev-btn-icon">📅</span>
                        <span class="dev-btn-text">修改时间</span>
                    </button>
                </div>
            </div>

            <div class="dev-section">
                <div class="dev-section-title">🔧 账号管理</div>
                <div class="dev-grid">
                    <button class="dev-btn dev-btn-manage" onclick="devClearBans()">
                        <span class="dev-btn-icon">✅</span>
                        <span class="dev-btn-text">解除封禁</span>
                    </button>
                    <button class="dev-btn dev-btn-manage" onclick="devUnlockAllAchievements()">
                        <span class="dev-btn-icon">🏆</span>
                        <span class="dev-btn-text">解锁成就</span>
                    </button>
                    <button class="dev-btn dev-btn-manage" onclick="devAddRandomWork()">
                        <span class="dev-btn-icon">📹</span>
                        <span class="dev-btn-text">添加作品</span>
                    </button>
                    <button class="dev-btn dev-btn-manage" onclick="devClearEvents()">
                        <span class="dev-btn-icon">🧹</span>
                        <span class="dev-btn-text">清除事件</span>
                    </button>
                </div>
            </div>

            <div class="dev-section">
                <div class="dev-section-title" style="color: #ff0050;">⚠️ 危险操作</div>
                <div style="display: grid; gap: 10px;">
                    <button class="dev-btn dev-btn-danger" onclick="devClearDevMode(); devResetAllCountdowns();">
                        <span class="dev-btn-icon">🗑️</span>
                        <span class="dev-btn-text">清除开发者模式</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalContent);
    
    // 立即执行一次倒计时更新
    devUpdateCountdowns();
    
    // 添加ESC关闭支持
    document.addEventListener('keydown', handleDevModalEscape);
}

// 关闭开发者选项
function closeDevOptions() {
    closeModal();
    document.removeEventListener('keydown', handleDevModalEscape);
}

// ESC键关闭处理
function handleDevModalEscape(e) {
    if (e.key === 'Escape') {
        closeDevOptions();
    }
}

// ==================== 新增：重置所有计数器（用于清除开发者模式时）====================
function devResetAllCountdowns() {
    window.devCountdowns.randomEvent.triggerCount = 0;
    window.devCountdowns.fanFluctuation.triggerCount = 0;
    console.log('[开发者] 所有倒计时计数器已重置');
}

// ✅ 新增：触发随机事件选择界面
function devTriggerRandomEvent() {
    const eventListHtml = randomEvents.map((event, index) => {
        const typeColor = event.type === 'good' ? '#00f2ea' : event.type === 'bad' ? '#ff0050' : '#667aea';
        const typeLabel = event.type === 'good' ? '好' : event.type === 'bad' ? '坏' : '中';
        const weight = event.weight || 1;
        
        return `
            <div class="event-select-item" onclick="devSelectEventToTrigger(${index})" style="background: #161823; border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.3s;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <div style="font-size: 14px; font-weight: bold; color: ${typeColor};">
                        ${event.title}
                    </div>
                    <div style="background: ${typeColor}; color: #000; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                        ${typeLabel}
                    </div>
                </div>
                <div style="font-size: 12px; color: #ccc; margin-bottom: 6px;">
                    ${event.desc}
                </div>
                <div style="font-size: 11px; color: #999;">
                    权重: ${weight} | 索引: ${index}
                </div>
            </div>
        `;
    }).join('');
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">选择要触发的随机事件</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="max-height: 70vh; overflow-y: auto; padding: 0 20px 20px;">
            <div style="margin-bottom: 15px; font-size: 12px; color: #999;">
                点击事件卡片即可立即触发该事件。事件效果将立即生效。
            </div>
            ${eventListHtml}
        </div>
    `;
    
    showModal(modalContent);
}

// ✅ 新增：执行选中的随机事件
function devSelectEventToTrigger(eventIndex) {
    if (eventIndex < 0 || eventIndex >= randomEvents.length) {
        showAlert('事件索引无效', '错误');
        return;
    }
    
    const selectedEvent = randomEvents[eventIndex];
    
    // 执行事件
    handleRandomEvent(selectedEvent);
    
    // 关闭事件选择界面
    closeModal();
    
    // 显示成功提示
    showNotification('事件已触发', `成功触发事件: ${selectedEvent.title}`);
}

// 测试功能
function devTestHotSearch() {
    startHotSearch('🔥 开发者测试热搜');
    showNotification('测试功能', '已触发测试热搜');
}

function devTestPublicOpinion() {
    startPublicOpinionCrisis('⚠️ 开发者测试舆论风波');
    showNotification('测试功能', '已触发测试舆论风波');
}

function devTestBan() {
    banAccount('开发者测试封禁');
    showNotification('测试功能', '已触发测试封禁');
}

function devAddFans() {
    showPrompt('请输入要增加的粉丝数量', '1000', function(amount) {
        if (!isNaN(amount) && amount > 0) {
            gameState.fans += parseInt(amount);
            updateDisplay();
            showNotification('修改数据', `已增加${amount}个粉丝`);
        }
    });
}

function devAddMoney() {
    showPrompt('请输入要增加的零钱金额', '100000', function(amount) {
        if (!isNaN(amount) && amount > 0) {
            gameState.money += parseInt(amount);
            updateDisplay();
            showNotification('修改数据', `已增加${amount}元`);
        }
    });
}

function devResetWarnings() {
    gameState.warnings = 0;
    updateDisplay();
    showNotification('修改数据', '警告次数已清零');
}

function devClearBans() {
    gameState.isBanned = false;
    gameState.banReason = '';
    gameState.banDaysCount = 0;
    gameState.banType = 0;
    gameState.warnings = 0;
    if (gameState.banInterval) {
        clearInterval(gameState.banInterval);
        gameState.banInterval = null;
    }
    if (gameState.banDropInterval) {
        clearInterval(gameState.banDropInterval);
        gameState.banDropInterval = null;
    }
    updateDisplay();
    showNotification('修改数据', '封禁状态已清除');
}

function devUnlockAllAchievements() {
    let unlockedCount = 0;
    achievements.forEach(achievement => {
        if (!achievement.unlocked) {
            achievement.unlocked = true;
            gameState.achievements.push(achievement.id);
            unlockedCount++;
        }
    });
    updateDisplay();
    showNotification('修改数据', `已解锁${unlockedCount}个成就`);
}

function devAddRandomWork() {
    const types = ['video', 'post', 'live'];
    const type = types[Math.floor(Math.random() * types.length)];
    const views = Math.floor(Math.random() * 50000) + 1000;
    const likes = Math.floor(views * (Math.random() * 0.1 + 0.01));
    const comments = Math.floor(likes * (Math.random() * 0.3 + 0.1));
    const shares = Math.floor(likes * (Math.random() * 0.2 + 0.05));
    
    const work = {
        id: Date.now(), 
        type: type, 
        title: '开发者测试作品', 
        content: '这是由开发者模式生成的测试作品', 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: gameTimer, 
        revenue: Math.floor(views / 1000), 
        isPrivate: false,
        isAd: Math.random() < 0.3
    };
    
    gameState.worksList.push(work);
    gameState.works++;
    gameState.views += views;
    gameState.likes += likes;
    gameState.money += work.revenue;
    const newFans = Math.floor(views / 1000 * (Math.random() * 2 + 0.5));
    gameState.fans += newFans;
    
    const interactionBoost = comments + likes + shares;
    gameState.totalInteractions += interactionBoost;
    gameState.activeFans += Math.floor(newFans * 0.5);
    
    updateDisplay();
    showNotification('添加作品', `已添加${type}类型测试作品`);
}

function devClearEvents() {
    // 清除热搜
    if (gameState.isHotSearch) {
        if (typeof endHotSearch === 'function') {
            endHotSearch();
        } else {
            gameState.isHotSearch = false;
            gameState.hotSearchDaysCount = 0;
            gameState.hotSearchStartTime = null;
            gameState.hotSearchTitle = '';
        }
    }
    
    // 清除舆论危机
    if (gameState.isPublicOpinionCrisis) {
        if (typeof endPublicOpinionCrisis === 'function') {
            endPublicOpinionCrisis();
        } else {
            gameState.isPublicOpinionCrisis = false;
            gameState.publicOpinionDaysCount = 0;
            gameState.publicOpinionStartTime = null;
            gameState.publicOpinionTitle = '';
        }
    }
    
    // 清除相关定时器
    if (gameState.hotSearchInterval) {
        clearInterval(gameState.hotSearchInterval);
        gameState.hotSearchInterval = null;
    }
    
    if (gameState.publicOpinionInterval) {
        clearInterval(gameState.publicOpinionInterval);
        gameState.publicOpinionInterval = null;
    }
    
    // 隐藏相关通知元素
    const hotSearchNotice = document.getElementById('hotSearchNotice');
    const publicOpinionNotice = document.getElementById('publicOpinionNotice');
    if (hotSearchNotice) hotSearchNotice.classList.remove('show');
    if (publicOpinionNotice) publicOpinionNotice.classList.remove('show');
}

function devChangeGameTime() {
    const currentDate = getVirtualDate();
    showPrompt(`请输入目标日期 (格式: YYYY-MM-DD)\n注意: 游戏使用虚拟时间系统\n当前时间: ${currentDate.year}年${currentDate.month}月${currentDate.day}日`, 
        `${currentDate.year}-${currentDate.month}-${currentDate.day}`, 
        function(dateStr) {
            if (!dateStr || !dateStr.trim()) return;
            
            const parts = dateStr.trim().split('-');
            if (parts.length !== 3) {
                showAlert('日期格式错误！请使用 YYYY-MM-DD 格式', '错误');
                return;
            }
            
            const year = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[2]);
            
            if (isNaN(year) || isNaN(month) || isNaN(day)) {
                showAlert('日期格式错误！请输入有效的数字', '错误');
                return;
            }
            
            if (month < 1 || month > 12) {
                showAlert('月份无效！请输入1-12之间的月份', '错误');
                return;
            }
            
            const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            const daysInMonth = monthDays[month - 1];
            
            if (day < 1 || day > daysInMonth) {
                showAlert(`日期无效！${month}月只有${daysInMonth}天`, '错误');
                return;
            }
            
            // 计算从虚拟起始日期到目标日期的天数差
            let targetDays = 0;
            const startDate = gameState.virtualStartDate;
            
            if (startDate) {
                let yearDiff = year - startDate.year;
                targetDays += yearDiff * 365;
                
                for (let i = 0; i < month - 1; i++) {
                    targetDays += monthDays[i];
                }
                for (let i = 0; i < startDate.month - 1; i++) {
                    targetDays -= monthDays[i];
                }
                targetDays += (day - startDate.day);
            } else {
                let yearDiff = year - 2025;
                targetDays += yearDiff * 365;
                for (let i = 0; i < month - 1; i++) {
                    targetDays += monthDays[i];
                }
                targetDays += (day - 1);
            }
            
            gameTimer = targetDays * VIRTUAL_DAY_MS;
            window.gameTimer = gameTimer;
            gameState.gameTimer = gameTimer;
            
            gameState.lastWorkTime = gameTimer;
            gameState.lastUpdateTime = gameTimer;
            
            updateDisplay();
            showNotification('修改成功', `游戏时间已跳转到 ${year}年${month}月${day}日`);
            saveGame();
        }
    );
}

function devClearDevMode() {
    showConfirm('确定要清除开发者模式吗？这将隐藏开发者选项且不可恢复。', function(confirmed) {
        if (confirmed) {
            gameState.devMode = false;
            document.getElementById('devFloatButton').style.display = 'none';
            closeModal();
            
            if (window.devCountdownInterval) {
                clearInterval(window.devCountdownInterval);
                window.devCountdownInterval = null;
            }
            
            saveGame();
            showNotification('开发者模式', '开发者模式已清除');
        }
    });
}

// 关闭密码输入框
function closeDevPasswordModal() {
    closeModal();
}

// ==================== 全局函数绑定 ====================
window.devVerifyPassword = devVerifyPassword;
window.showDevOptions = showDevOptions;
window.closeDevOptions = closeDevOptions;
window.devTestHotSearch = devTestHotSearch;
window.devTestPublicOpinion = devTestPublicOpinion;
window.devTestBan = devTestBan;
window.devAddFans = devAddFans;
window.devAddMoney = devAddMoney;
window.devResetWarnings = devResetWarnings;
window.devClearBans = devClearBans;
window.devUnlockAllAchievements = devUnlockAllAchievements;
window.devAddRandomWork = devAddRandomWork;
window.devClearDevMode = devClearDevMode;
window.devClearEvents = devClearEvents;
window.devStartCountdownTracker = devStartCountdownTracker;
window.devUpdateCountdowns = devUpdateCountdowns;
window.devUpdateSpecialStatusCountdowns = devUpdateSpecialStatusCountdowns;
window.devChangeGameTime = devChangeGameTime;
window.devTriggerRandomEvent = devTriggerRandomEvent;
window.devSelectEventToTrigger = devSelectEventToTrigger;
window.closeDevPasswordModal = closeDevPasswordModal;
window.devResetAllCountdowns = devResetAllCountdowns;  // 新增绑定

// 新增的全局函数绑定
window.devUpdateAdSystemStatus = devUpdateAdSystemStatus;
window.devUpdatePenaltyStatus = devUpdatePenaltyStatus;
window.devUpdateNegativeHotStatus = devUpdateNegativeHotStatus;

// ==================== 新增：所有新监控函数的全局绑定 ====================
window.devUpdateHotValueStatus = devUpdateHotValueStatus;
window.devUpdateLiveStatus = devUpdateLiveStatus;
window.devUpdateRaffleStatus = devUpdateRaffleStatus;
window.devUpdatePrivateMessageStatus = devUpdatePrivateMessageStatus;
window.devUpdateSystemMessageStatus = devUpdateSystemMessageStatus;
window.devUpdateWorkFanGrowthStatus = devUpdateWorkFanGrowthStatus;
window.devUpdateAutoCleanCacheStatus = devUpdateAutoCleanCacheStatus;
window.devUpdateBanTypeStatus = devUpdateBanTypeStatus;
window.devUpdateBaseBoostStatus = devUpdateBaseBoostStatus;
