// ==================== 系统消息模块 ====================
// 本模块包含热搜话题邀请、月度总结等系统推送功能
// 依赖: game_core.js, game_ui_core.js

// ==================== 热搜话题库 ====================
const hotSearchTopics = [
    '#春节特别策划#',
    '#美食探店挑战#',
    '#日常Vlog打卡#',
    '#游戏技巧分享#',
    '#美妆教程大赛#',
    '#健身打卡挑战#',
    '#旅行日记分享#',
    '#萌宠日常记录#',
    '#夏季穿搭指南#',
    '#读书分享会#',
    '#手工DIY教程#',
    '#音乐翻唱挑战#'
];

// ==================== 系统消息实时更新定时器 ====================
let systemMessagesUpdateInterval = null;
window.isSystemMessageListOpen = false;

// ==================== 启动系统消息列表实时更新 ====================
function startSystemMessagesRealtimeUpdate() {
    if (systemMessagesUpdateInterval) {
        clearInterval(systemMessagesUpdateInterval);
    }
    
    systemMessagesUpdateInterval = setInterval(() => {
        if (window.isSystemMessageListOpen) {
            const hasNewMessages = checkForNewSystemMessages();
            
            if (hasNewMessages) {
                if (typeof renderSystemMessagesList === 'function') {
                    renderSystemMessagesList();
                }
                
                if (typeof updateNavMessageBadge === 'function') {
                    updateNavMessageBadge();
                }
                
                if (typeof showMessagesFullscreen === 'function') {
                    showMessagesFullscreen();
                }
            }
        }
    }, 5000);
    
    console.log('系统消息列表实时更新已启动');
}

// ==================== 停止系统消息列表实时更新 ====================
function stopSystemMessagesRealtimeUpdate() {
    if (systemMessagesUpdateInterval) {
        clearInterval(systemMessagesUpdateInterval);
        systemMessagesUpdateInterval = null;
        console.log('系统消息列表实时更新已停止');
    }
}

// ==================== 检查是否有新的系统消息 ====================
function checkForNewSystemMessages() {
    if (!gameState.systemMessages || !gameState.systemMessages.messages) {
        return false;
    }
    
    const now = gameTimer;
    const timeDiff = now - (gameState.systemMessages.lastCheckTime || 0);
    
    if (timeDiff < VIRTUAL_MINUTE_MS * 30) {
        return false;
    }
    
    gameState.systemMessages.lastCheckTime = now;
    
    return gameState.systemMessages.unreadCount > 0;
}

// ==================== 生成热搜话题邀请（带时间限制） ====================
function generateHotSearchInvite() {
    if (!gameState.systemMessages) {
        initSystemMessages();
    }
    
    const existingInvite = gameState.systemMessages.messages.find(msg => 
        msg.type === 'hotSearchInvite' && !msg.data?.accepted && !msg.data?.expired
    );
    
    if (existingInvite) {
        console.log('已存在未处理的热搜邀请，跳过生成');
        return;
    }
    
    const topic = hotSearchTopics[Math.floor(Math.random() * hotSearchTopics.length)];
    const duration = Math.floor(Math.random() * 3) + 2; // 2-4虚拟天
    const deadlineTime = gameTimer + (24 * VIRTUAL_HOUR_MS); // 24虚拟小时内未接受则过期
    
    const inviteMessage = {
        id: Date.now(),
        type: 'hotSearchInvite',
        title: '🚀 热搜话题邀请',
        content: `平台邀请你参与热门话题：${topic}，活动时长${duration}天。请在${formatVirtualTime(deadlineTime)}前接受邀请！`,
        time: gameTimer,
        read: false,
        data: {
            topic: topic,
            duration: duration,
            startTime: null,
            endTime: null,
            deadlineTime: deadlineTime, // 接受截止时间
            accepted: false,
            expired: false,
            expiredReason: null
        }
    };
    
    gameState.systemMessages.messages.push(inviteMessage);
    gameState.systemMessages.unreadCount++;
    
    showNotification('系统消息', `你收到了一个热搜话题邀请：${topic}（剩余${Math.ceil((deadlineTime - gameTimer) / VIRTUAL_HOUR_MS)}小时）`);
    
    // 触发更新消息中心预览
    if (typeof showMessagesFullscreen === 'function') {
        const content = document.getElementById('messagesListTab');
        if (content && document.getElementById('messagesContent').style.display !== 'none') {
            showMessagesFullscreen();
        }
    }
    
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    saveGame();
}

// ==================== 生成月度收入总结 ====================
function generateMonthlySummary() {
    if (!gameState.systemMessages) {
        initSystemMessages();
    }
    
    const currentDate = getVirtualDate();
    const currentMonth = `${currentDate.year}-${currentDate.month}`;
    
    const hasSummaryThisMonth = gameState.systemMessages.messages.some(msg => 
        msg.type === 'monthlySummary' && msg.data?.month === currentMonth
    );
    
    if (hasSummaryThisMonth) {
        console.log(`本月(${currentMonth})已生成过收入总结，跳过`);
        return;
    }
    
    const thirtyDaysAgo = gameTimer - (30 * VIRTUAL_DAY_MS);
    const monthlyWorks = gameState.worksList.filter(work => 
        work.time >= thirtyDaysAgo && !work.isPrivate
    );
    
    const videoWorks = monthlyWorks.filter(work => work.type === 'video');
    const postWorks = monthlyWorks.filter(work => work.type === 'post');
    const liveWorks = monthlyWorks.filter(work => work.type === 'live');
    
    const videoRevenue = videoWorks.reduce((sum, work) => sum + (work.revenue || 0), 0);
    const postRevenue = postWorks.reduce((sum, work) => sum + (work.revenue || 0), 0);
    const liveRevenue = liveWorks.reduce((sum, work) => sum + (work.revenue || 0), 0);
    const totalRevenue = videoRevenue + postRevenue + liveRevenue;
    
    const adWorks = monthlyWorks.filter(work => work.isAd);
    const adRevenue = adWorks.reduce((sum, work) => sum + (work.revenue || 0), 0);
    
    const summaryMessage = {
        id: Date.now(),
        type: 'monthlySummary',
        title: `${currentDate.month}月收入总结`,
        content: `你在${currentDate.month}月份共发布${monthlyWorks.length}个作品，总收入${totalRevenue.toLocaleString()}元`,
        time: gameTimer,
        read: false,
        data: {
            month: currentMonth,
            monthName: currentDate.month,
            workCount: monthlyWorks.length,
            videoCount: videoWorks.length,
            postCount: postWorks.length,
            liveCount: liveWorks.length,
            totalRevenue: totalRevenue,
            videoRevenue: videoRevenue,
            postRevenue: postRevenue,
            liveRevenue: liveRevenue,
            adRevenue: adRevenue,
            adCount: adWorks.length
        }
    };
    
    gameState.systemMessages.messages.push(summaryMessage);
    gameState.systemMessages.unreadCount++;
    
    showNotification('系统消息', '你的月度收入总结已生成');
    
    // 触发更新消息中心预览
    if (typeof showMessagesFullscreen === 'function') {
        const content = document.getElementById('messagesListTab');
        if (content && document.getElementById('messagesContent').style.display !== 'none') {
            showMessagesFullscreen();
        }
    }
    
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    saveGame();
}

// ==================== 接受热搜邀请 ====================
function acceptHotSearchInvite(messageId, contentType) {
    // ✅ 新增：账号被封禁时无法接受热搜邀请
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法参与热搜话题'); 
        return; 
    }
    
    const message = gameState.systemMessages.messages.find(m => m.id == messageId);
    if (!message || message.data?.accepted || message.data?.expired) {
        console.log('热搜邀请无效或已过期');
        return;
    }
    
    // 检查是否过期
    if (gameTimer > message.data.deadlineTime) {
        message.data.expired = true;
        message.data.expiredReason = '超时未接受';
        showNotification('邀请已过期', '热搜邀请已超过接受时间');
        saveGame();
        return;
    }
    
    // 标记为已接受
    message.data.accepted = true;
    message.data.acceptedAt = gameTimer;
    message.data.contentType = contentType;
    message.data.startTime = gameTimer;
    message.data.endTime = gameTimer + (message.data.duration * VIRTUAL_DAY_MS);
    
    // 标记为已读
    if (!message.read) {
        message.read = true;
        gameState.systemMessages.unreadCount = Math.max(0, gameState.systemMessages.unreadCount - 1);
    }
    
    // 创建热搜作品
    const topic = message.data.topic;
    const workId = Date.now();
    
    const hotWork = {
        id: workId,
        type: contentType,
        title: contentType === 'video' ? `${topic} - 视频创作` : topic,
        content: `参与热搜话题：${topic} ${contentType === 'video' ? '- 我的创作视频' : '- 我的动态分享'}`,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        time: gameTimer,
        isPrivate: false,
        isHotSearchWork: true,
        isRecommended: false,
        isControversial: false,
        isHot: false,
        hotSearchData: {
            topic: topic,
            duration: message.data.duration,
            startTime: gameTimer,
            endTime: gameTimer + (message.data.duration * VIRTUAL_DAY_MS)
        },
        revenue: 0,
        // 移除定时器引用
        fanGrowthInterval: null,
        hotSearchInterval: null,
        // ✅ 新增：热度值相关定时器
        hotValueBoostInterval: null,
        hotValueDropInterval: null
    };
    
    gameState.worksList.push(hotWork);
    gameState.works++;
    
    // 添加到活跃热搜作品列表
    if (!gameState.systemMessages.hotSearchActiveWorks) {
        gameState.systemMessages.hotSearchActiveWorks = [];
    }
    gameState.systemMessages.hotSearchActiveWorks.push(workId);
    
    // 启动热搜效果
    startHotSearchWorkEffect(workId);
    
    showNotification('发布成功', `你已参与热搜话题：${topic}（活动时长${message.data.duration}天）`);
    
    // 更新UI
    if (typeof updateSystemMessagesUI === 'function') {
        updateSystemMessagesUI();
    }
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    // 触发更新消息中心预览
    if (typeof showMessagesFullscreen === 'function') {
        const content = document.getElementById('messagesListTab');
        if (content && document.getElementById('messagesContent').style.display !== 'none') {
            showMessagesFullscreen();
        }
    }
    
    saveGame();
    
    // 关闭系统消息页面
    closeSystemMessagesList();
}

// ==================== 启动热搜作品效果 ====================
function startHotSearchWorkEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isHotSearchWork) {
        console.error('热搜作品无效:', workId);
        return;
    }
    
    if (work.hotSearchInterval) {
        clearInterval(work.hotSearchInterval);
    }
    
    work.hotSearchInterval = setInterval(() => {
        if (gameTimer >= work.hotSearchData.endTime) {
            endHotSearchWorkEffect(workId);
            return;
        }
        
        const timeLeft = (work.hotSearchData.endTime - gameTimer) / VIRTUAL_DAY_MS;
        const intensity = Math.max(0.5, timeLeft / work.hotSearchData.duration); // 随着时间推移效果减弱
        
        const viewsBoost = Math.floor((Math.random() * 4000 + 1000) * intensity);
        const likesBoost = Math.floor((Math.random() * 400 + 100) * intensity);
        const commentsBoost = Math.floor((Math.random() * 50 + 10) * intensity);
        const sharesBoost = Math.floor((Math.random() * 30 + 5) * intensity);
        let fanBoost = Math.floor((Math.random() * 2000 + 1000) * intensity);
        
        // ✅ 新增：应用热度值倍数（只影响涨粉）
        if (fanBoost > 0) {
            const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
                ? window.getHotValueMultiplier() 
                : 1.0;
            fanBoost = Math.floor(fanBoost * hotMultiplier);
        }
        
        work.views += viewsBoost;
        if (work.type === 'video' || work.type === 'live') {
            gameState.views += viewsBoost;
        }
        work.likes += likesBoost;
        gameState.likes += likesBoost;
        work.comments += commentsBoost;
        work.shares += sharesBoost;
        gameState.fans += fanBoost;
        
        gameState.totalInteractions += likesBoost + commentsBoost + sharesBoost;
        
        const oldRevenue = work.revenue || 0;
        const newRevenue = Math.floor(work.views / 1000);
        const revenueBoost = newRevenue - oldRevenue;
        if (revenueBoost > 0) {
            work.revenue = newRevenue;
            gameState.money += revenueBoost;
        }
        
        updateDisplay();
        
        if (Math.random() < 0.05) {
            showEventPopup('🔥 热搜爆发', `${work.hotSearchData.topic} 正在爆火中！剩余${timeLeft.toFixed(1)}天`);
        }
    }, 3000);
    
    // ✅ 新增：每秒增加1-80热度值
    if (work.hotValueBoostInterval) {
        clearInterval(work.hotValueBoostInterval);
    }
    
    work.hotValueBoostInterval = setInterval(() => {
        if (window.HotValueSystem) {
            // 确保热搜还未结束
            if (gameTimer >= work.hotSearchData.endTime) {
                clearInterval(work.hotValueBoostInterval);
                work.hotValueBoostInterval = null;
                return;
            }
            
            const increase = Math.floor(Math.random() * 80) + 1; // 1-80随机整数
            window.HotValueSystem.currentHotValue += increase;
            // 确保不超过最大值（10万）
            window.HotValueSystem.currentHotValue = Math.min(100000, window.HotValueSystem.currentHotValue);
            gameState.currentHotValue = window.HotValueSystem.currentHotValue;
        }
    }, 1000);
    
    showEventPopup('🔥 热搜启动', `${work.hotSearchData.topic} 开始获得爆炸式增长！`);
}

// ==================== 结束热搜效果 ====================
function endHotSearchWorkEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isHotSearchWork) {
        console.error('热搜作品无效:', workId);
        return;
    }
    
    // 停止原有的数据增长定时器
    if (work.hotSearchInterval) {
        clearInterval(work.hotSearchInterval);
        work.hotSearchInterval = null;
    }
    
    // 停止热度值增长定时器
    if (work.hotValueBoostInterval) {
        clearInterval(work.hotValueBoostInterval);
        work.hotValueBoostInterval = null;
    }
    
    work.isHotSearchWork = false;
    
    // 从活跃列表移除
    if (gameState.systemMessages.hotSearchActiveWorks) {
        const index = gameState.systemMessages.hotSearchActiveWorks.indexOf(workId);
        if (index > -1) {
            gameState.systemMessages.hotSearchActiveWorks.splice(index, 1);
        }
    }
    
    // 标记邀请状态为过期
    const inviteMessage = gameState.systemMessages.messages.find(msg => 
        msg.type === 'hotSearchInvite' && msg.data?.topic === work.hotSearchData.topic
    );
    if (inviteMessage && !inviteMessage.data.expired) {
        inviteMessage.data.expired = true;
    }
    
    // ✅ 新增：热搜毕业后开始每秒掉1-70热度值，持续duration天
    const duration = work.hotSearchData ? work.hotSearchData.duration : 2;
    // VIRTUAL_DAY_MS = 60秒，所以duration虚拟天 = duration * 60秒（真实时间）
    const totalDropSeconds = duration * 60;
    let elapsedSeconds = 0;
    
    console.log(`[热度值] 热搜结束，开始下降热度值，持续${duration}虚拟天（${totalDropSeconds}秒）`);
    
    work.hotValueDropInterval = setInterval(() => {
        elapsedSeconds++;
        
        if (window.HotValueSystem && elapsedSeconds <= totalDropSeconds) {
            const decrease = Math.floor(Math.random() * 70) + 1; // 1-70随机整数
            window.HotValueSystem.currentHotValue -= decrease;
            window.HotValueSystem.currentHotValue = Math.max(0, window.HotValueSystem.currentHotValue);
            gameState.currentHotValue = window.HotValueSystem.currentHotValue;
            
            // 更新显示
            if (window.HotValueSystem.updateDisplay) {
                window.HotValueSystem.updateDisplay();
            }
            if (typeof updateDisplay === 'function') {
                updateDisplay();
            }
        } else {
            // 结束或系统不可用
            if (work.hotValueDropInterval) {
                clearInterval(work.hotValueDropInterval);
                work.hotValueDropInterval = null;
            }
            if (elapsedSeconds > totalDropSeconds) {
                console.log(`[热度值] 热搜作品 ${workId} 的热度值下降结束（共${totalDropSeconds}秒）`);
            }
        }
    }, 1000);
    
    showEventPopup('热搜结束', `话题 ${work.hotSearchData.topic} 的热度已下降，开始回落`);
}

// ==================== 检查并清理过期的热搜 ====================
function checkExpiredHotSearchWorks() {
    if (!gameState.systemMessages || !gameState.systemMessages.hotSearchActiveWorks) return;
    
    const expiredWorks = [];
    gameState.systemMessages.hotSearchActiveWorks.forEach(workId => {
        const work = gameState.worksList.find(w => w.id === workId);
        if (work && work.hotSearchData && gameTimer >= work.hotSearchData.endTime) {
            expiredWorks.push(workId);
        }
    });
    
    expiredWorks.forEach(workId => {
        endHotSearchWorkEffect(workId);
    });
    
    // 检查并标记过期的邀请（只标记未接受的）
    gameState.systemMessages.messages.forEach(msg => {
        if (msg.type === 'hotSearchInvite' && !msg.data.accepted && !msg.data.expired) {
            if (gameTimer > msg.data.deadlineTime) {
                msg.data.expired = true;
                msg.data.expiredReason = '超时未接受';
                msg.content = msg.content.replace('请在', '已过期，原需在');
            }
        }
    });
}

// ==================== 初始化系统消息状态 ====================
function initSystemMessages() {
    if (!gameState.systemMessages) {
        gameState.systemMessages = {
            unreadCount: 0,
            messages: [],
            hotSearchActiveWorks: [],
            lastCheckTime: 0
        };
    }
}

// ==================== 更新系统消息UI ====================
function updateSystemMessagesUI() {
    if (!gameState.systemMessages) return;
    
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    const systemMessagesPage = document.getElementById('systemMessagesPage');
    if (systemMessagesPage && systemMessagesPage.classList.contains('active')) {
        renderSystemMessagesList();
    }
}

// ==================== 显示系统消息列表（全屏） ====================
function showSystemMessagesList() {
    window.isSystemMessageListOpen = true;
    startSystemMessagesRealtimeUpdate();
    
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    const page = document.getElementById('systemMessagesPage');
    if (page) {
        page.classList.add('active');
        renderSystemMessagesList();
    }
}

// ==================== 渲染系统消息列表 ====================
function renderSystemMessagesList() {
    const content = document.getElementById('systemMessagesPageContent');
    if (!content) {
        console.error('系统消息内容容器未找到');
        return;
    }
    
    if (!gameState.systemMessages || gameState.systemMessages.messages.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">暂无系统消息</div>';
        return;
    }
    
    const messages = [...gameState.systemMessages.messages]
        .sort((a, b) => b.time - a.time);
    
    const messagesHtml = messages.map(msg => {
        const isUnread = !msg.read;
        const unreadStyle = isUnread ? 
            'border-left: 4px solid #00f2ea; background: #222;' : '';
        const unreadBadge = isUnread ? 
            `<span style="background: #ff0050; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 10px; margin-left: 5px;">
                新
            </span>` : '';
        
        let actionHtml = '';
        if (msg.type === 'hotSearchInvite') {
            if (msg.data?.accepted) {
                // 已参与的热搜邀请
                actionHtml = `
                    <div style="background: #112200; border: 1px solid #00f2ea; border-radius: 5px; padding: 8px; margin-top: 8px; font-size: 11px; color: #00f2ea;">
                        ✅ 你已参与此热搜话题（活动时长${msg.data.duration}天）
                    </div>
                `;
            } else if (msg.data?.expired) {
                // 过期的热搜邀请
                actionHtml = `
                    <div style="background: #2a000a; border: 1px solid #ff0050; border-radius: 5px; padding: 8px; margin-top: 8px; font-size: 11px; color: #ff0050;">
                        ❌ 邀请已过期${msg.data.expiredReason ? `：${msg.data.expiredReason}` : ''}
                    </div>
                `;
            } else {
                // 可接受的热搜邀请
                const hoursLeft = Math.max(0, (msg.data.deadlineTime - gameTimer) / VIRTUAL_HOUR_MS);
                const timeInfo = hoursLeft > 0 ? `剩余${Math.floor(hoursLeft)}小时` : '即将过期';
                
                actionHtml = `
                    <div style="background: #111; border-radius: 5px; padding: 8px; margin-top: 8px; font-size: 11px; color: #ff6b00;">
                        ⏰ 接受截止时间：${formatVirtualTime(msg.data.deadlineTime)}（${timeInfo}）
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn" style="flex: 1; padding: 8px; font-size: 12px; background: #667aea;" 
                                onclick="acceptHotSearchInvite('${msg.id}', 'video')">
                            🎬 用视频发布
                        </button>
                        <button class="btn" style="flex: 1; padding: 8px; font-size: 12px; background: #ff6b00;" 
                                onclick="acceptHotSearchInvite('${msg.id}', 'post')">
                            📝 用动态发布
                        </button>
                    </div>
                `;
            }
        } else if (msg.type === 'monthlySummary') {
            actionHtml = `
                <div style="background: #111; border-radius: 5px; padding: 10px; margin-top: 10px; font-size: 11px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; color: #ccc;">
                        <div>💰 总收入：<span style="color: #00f2ea; font-weight: bold;">${msg.data.totalRevenue.toLocaleString()}元</span></div>
                        <div>📹 视频：<span style="color: #667aea;">${msg.data.videoRevenue.toLocaleString()}元</span></div>
                        <div>📝 动态：<span style="color: #ff6b00;">${msg.data.postRevenue.toLocaleString()}元</span></div>
                        <div>📱 直播：<span style="color: #ff0050;">${msg.data.liveRevenue.toLocaleString()}元</span></div>
                        ${msg.data.adRevenue > 0 ? `<div>💼 商单：<span style="color: #FFD700;">${msg.data.adRevenue.toLocaleString()}元</span></div>` : ''}
                        <div>📊 作品数：<span style="color: #999;">${msg.data.workCount}个</span></div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="system-message-item" style="${unreadStyle}" data-message-id="${msg.id}" 
                 onclick="readSystemMessage('${msg.id}')">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">
                            ${msg.title} ${unreadBadge}
                        </div>
                        <div style="font-size: 12px; color: #999; line-height: 1.5;">
                            ${msg.content}
                        </div>
                        <div style="font-size: 10px; color: #666; margin-top: 5px;">
                            ${formatTime(msg.time)}
                        </div>
                        ${actionHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = `
        <div style="padding: 10px 15px;">
            ${messagesHtml}
        </div>
    `;
}

// ==================== 标记系统消息为已读 ====================
function readSystemMessage(messageId) {
    const message = gameState.systemMessages.messages.find(m => m.id == messageId);
    if (!message || message.read) return;
    
    message.read = true;
    gameState.systemMessages.unreadCount = Math.max(0, gameState.systemMessages.unreadCount - 1);
    
    saveGame();
    
    if (typeof updateSystemMessagesUI === 'function') {
        updateSystemMessagesUI();
    }
    
    // 触发更新消息中心预览
    if (typeof showMessagesFullscreen === 'function') {
        const content = document.getElementById('messagesListTab');
        if (content && document.getElementById('messagesContent').style.display !== 'none') {
            showMessagesFullscreen();
        }
    }
}

// ==================== 关闭系统消息列表（修复版：保持消息导航选中） ====================
function closeSystemMessagesList() {
    window.isSystemMessageListOpen = false;
    stopSystemMessagesRealtimeUpdate();
    
    const page = document.getElementById('systemMessagesPage');
    if (page) {
        page.classList.remove('active');
    }
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    const activeFullscreenPages = document.querySelectorAll('.fullscreen-page.active');
    if (activeFullscreenPages.length === 0) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        // 选中"消息"导航项（第3个，索引为2）
        const messageNavItem = document.querySelectorAll('.nav-item')[2];
        if (messageNavItem) {
            messageNavItem.classList.add('active');
        }
    }
    
    updateDisplay();
}

// ==================== 启动系统消息定时器 ====================
function startSystemMessagesTimer() {
    if (window.monthlySummaryInterval) {
        clearInterval(window.monthlySummaryInterval);
    }
    
    window.monthlySummaryInterval = setInterval(() => {
        const currentDate = getVirtualDate();
        
        // ==================== 修改：获取当月真实天数 ====================
        // 每月天数数组
        const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        
        // 简单处理闰年（虚拟年份也能更真实）
        const isLeapYear = currentDate.year % 4 === 0 && (currentDate.year % 100 !== 0 || currentDate.year % 400 === 0);
        const daysInMonth = currentDate.month === 2 && isLeapYear ? 29 : monthDays[currentDate.month - 1];
        
        // 只有在真正的月底才生成月度总结
        if (currentDate.day === daysInMonth) {
            generateMonthlySummary();
        }
        // =========================================================================
        
        checkExpiredHotSearchWorks();
    }, VIRTUAL_DAY_MS);
    
    if (window.hotSearchCheckInterval) {
        clearInterval(window.hotSearchCheckInterval);
    }
    
    window.hotSearchCheckInterval = setInterval(() => {
        checkExpiredHotSearchWorks();
    }, 5000);
}

// ==================== 停止系统消息定时器 ====================
function stopSystemMessagesTimer() {
    if (window.monthlySummaryInterval) {
        clearInterval(window.monthlySummaryInterval);
        window.monthlySummaryInterval = null;
    }
    if (window.hotSearchCheckInterval) {
        clearInterval(window.hotSearchCheckInterval);
        window.hotSearchCheckInterval = null;
    }
}

// ==================== 游戏加载时恢复热搜效果 ====================
function resumeHotSearchEffects() {
    if (!gameState.systemMessages || !gameState.systemMessages.hotSearchActiveWorks) {
        return;
    }
    
    console.log(`[恢复] 检测到${gameState.systemMessages.hotSearchActiveWorks.length}个活跃热搜作品`);
    
    gameState.systemMessages.hotSearchActiveWorks.forEach(workId => {
        const work = gameState.worksList.find(w => w.id === workId);
        if (work && work.isHotSearchWork && gameTimer < work.hotSearchData.endTime) {
            console.log(`[恢复] 重启热搜效果 - 作品ID: ${workId}, 剩余时间: ${(work.hotSearchData.endTime - gameTimer) / VIRTUAL_DAY_MS}天`);
            startHotSearchWorkEffect(workId);
        } else {
            console.log(`[清理] 移除无效热搜作品ID: ${workId}`);
            const index = gameState.systemMessages.hotSearchActiveWorks.indexOf(workId);
            if (index > -1) {
                gameState.systemMessages.hotSearchActiveWorks.splice(index, 1);
            }
        }
    });
}

// ==================== 辅助：格式化虚拟时间 ====================
function formatVirtualTime(timestamp) {
    const date = getVirtualDate();
    const targetMinutes = Math.floor(timestamp / VIRTUAL_MINUTE_MS);
    const currentMinutes = Math.floor(gameTimer / VIRTUAL_MINUTE_MS);
    const diffMinutes = targetMinutes - currentMinutes;
    
    if (diffMinutes <= 0) return '已过期';
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (hours > 0) {
        return `${date.year}年${date.month}月${date.day}日 ${String(date.hours).padStart(2, '0')}:${String(date.minutes).padStart(2, '0')}`;
    }
    
    return `${minutes}分钟后`;
}

// ==================== 全局函数绑定 ====================
window.gameSystemMessages = {
    initSystemMessages,
    generateHotSearchInvite,
    generateMonthlySummary,
    acceptHotSearchInvite,
    startHotSearchWorkEffect,
    endHotSearchWorkEffect,
    checkExpiredHotSearchWorks,
    showSystemMessagesList,
    renderSystemMessagesList,
    readSystemMessage,
    closeSystemMessagesList,
    updateSystemMessagesUI,
    startSystemMessagesTimer,
    stopSystemMessagesTimer,
    resumeHotSearchEffects,
    startSystemMessagesRealtimeUpdate,
    stopSystemMessagesRealtimeUpdate,
    checkForNewSystemMessages,
    formatVirtualTime
};

window.initSystemMessages = initSystemMessages;
window.generateHotSearchInvite = generateHotSearchInvite;
window.generateMonthlySummary = generateMonthlySummary;
window.acceptHotSearchInvite = acceptHotSearchInvite;
window.startHotSearchWorkEffect = startHotSearchWorkEffect;
window.endHotSearchWorkEffect = endHotSearchWorkEffect;
window.checkExpiredHotSearchWorks = checkExpiredHotSearchWorks;
window.showSystemMessagesList = showSystemMessagesList;
window.renderSystemMessagesList = renderSystemMessagesList;
window.readSystemMessage = readSystemMessage;
window.closeSystemMessagesList = closeSystemMessagesList;
window.updateSystemMessagesUI = updateSystemMessagesUI;
window.startSystemMessagesTimer = startSystemMessagesTimer;
window.stopSystemMessagesTimer = stopSystemMessagesTimer;
window.resumeHotSearchEffects = resumeHotSearchEffects;
window.startSystemMessagesRealtimeUpdate = startSystemMessagesRealtimeUpdate;
window.stopSystemMessagesRealtimeUpdate = stopSystemMessagesRealtimeUpdate;
window.checkForNewSystemMessages = checkForNewSystemMessages;
window.formatVirtualTime = formatVirtualTime;

console.log('系统消息模块已加载');
