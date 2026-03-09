// ==================== 核心UI框架与弹窗系统 ====================

// ==================== 主界面更新 ====================
function updateDisplay() {
    document.getElementById('usernameDisplay').textContent = gameState.username;
    
    // 头像显示逻辑（支持图片和文字）
    const avatarEl = document.getElementById('userAvatar');
    if (gameState.avatarImage) {
        // 显示图片头像
        avatarEl.innerHTML = `<img src="${gameState.avatarImage}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
        // 显示文字头像
        avatarEl.textContent = gameState.avatar;
    }
    
    const dateDisplay = document.getElementById('virtualDateDisplay');
    if (dateDisplay) {
        dateDisplay.textContent = formatVirtualDate(true);
        dateDisplay.classList.add('updating');
        setTimeout(() => dateDisplay.classList.remove('updating'), 300);
    }
    
    // ==================== 修改：涨掉粉直接显示在粉丝数上方 ====================
    const fansCountEl = document.getElementById('fansCount');
    if (fansCountEl) {
        const notifications = gameState.fanChangeNotifications || [];
        let fanChangeText = '';
        
        if (notifications.length > 0) {
            const latest = notifications[notifications.length - 1];
            const changeNum = latest.changeType === 'gain' ? `+${latest.fanCount}` : `-${latest.fanCount}`;
            const color = latest.changeType === 'gain' ? '#00f2ea' : '#ff0050';
            fanChangeText = `<div style="font-size: 12px; color: ${color}; position: absolute; top: -16px; left: 50%; transform: translateX(-50%); line-height: 1;">${changeNum}</div>`;
        }
        
        fansCountEl.innerHTML = `${fanChangeText}${formatNumber(gameState.fans)}`;
        fansCountEl.style.position = 'relative';
    }
    // ============================================================
    
    document.getElementById('likesCount').textContent = formatNumber(gameState.likes);
    document.getElementById('viewsCount').textContent = formatNumber(gameState.views);
    document.getElementById('worksCount').textContent = formatNumber(gameState.works);
    document.getElementById('moneyCount').textContent = formatNumber(Math.floor(gameState.money));
    
    // ✅ 修改：添加警告入口点击事件
    const warningCountEl = document.getElementById('warningCount');
    warningCountEl.textContent = `${gameState.warnings}/20`;
    warningCountEl.style.cursor = 'pointer';
    warningCountEl.title = '点击查看警告详情';
    warningCountEl.onclick = function() {
        if (typeof showWarningListFullscreen === 'function') {
            showWarningListFullscreen();
        } else {
            showAlert('警告系统未加载，请刷新页面重试', '错误');
        }
    };
    
    // ✅ 新增功能：更新关注数显示
    document.getElementById('followingCount').textContent = formatNumber(gameState.following ? gameState.following.length : 0);
    
    // ==================== 核心修改：替换为热度值显示 ====================
    const hotValueStat = document.getElementById('virtualTimeStat');
    if (hotValueStat) {
        // 移除虚拟时间显示逻辑，直接由热度值系统控制
        if (window.HotValueSystem && window.HotValueSystem.currentHotValue !== undefined) {
            const change = window.HotValueSystem.getHotValueChange();
            const hotValue = window.HotValueSystem.getCurrentHotValue();
            const formattedValue = window.HotValueSystem.formatHotValue(hotValue);
            
            hotValueStat.textContent = formattedValue;
            
            // 根据变化设置颜色
            if (change > 0) {
                hotValueStat.style.color = '#00f2ea'; // 上涨 - 青色
            } else if (change < 0) {
                hotValueStat.style.color = '#ff0050'; // 下降 - 红色
            } else {
                hotValueStat.style.color = '#ccc'; // 持平 - 灰色
            }
        } else {
            // 如果热度值系统未加载，显示默认值
            hotValueStat.textContent = '0';
            hotValueStat.style.color = '#ccc';
        }
        hotValueStat.parentElement.title = '您的综合热度值，反映所有数据的实时变化';
    }
    // ============================================================
    
    // ==================== 移除原有的虚拟时间显示逻辑 ====================
    // const virtualDate = getVirtualDate();
    // const timeStat = document.getElementById('virtualTimeStat');
    // if (timeStat) {
    //     timeStat.textContent = `${virtualDate.totalDays}天`;
    //     timeStat.parentElement.title = `${virtualDate.year}年${virtualDate.month}月${virtualDate.day}日 ${virtualDate.formattedTime}`;
    // }
    // ====================================================================
    
    const liveBtn = document.getElementById('liveControlBtn');
    if (liveBtn) {
        liveBtn.style.display = 'block';
        liveBtn.classList.toggle('active', gameState.liveStatus);
    }
    
    const hotSearchNotice = document.getElementById('hotSearchNotice');
    const banNotice = document.getElementById('banNotice');
    const publicOpinionNotice = document.getElementById('publicOpinionNotice');
    
    // ✅ 修复：使用明确的add/remove替代toggle(undefined)防止反复切换
    if (hotSearchNotice) {
        if (gameState.isHotSearch) {
            hotSearchNotice.classList.add('show');
        } else {
            hotSearchNotice.classList.remove('show');
        }
    }
    if (banNotice) {
        if (gameState.isBanned) {
            banNotice.classList.add('show');
        } else {
            banNotice.classList.remove('show');
        }
    }
    if (publicOpinionNotice) {
        if (gameState.isPublicOpinionCrisis) {
            publicOpinionNotice.classList.add('show');
        } else {
            publicOpinionNotice.classList.remove('show');
        }
    }
    
    if (typeof showHotSearchNotice === 'function') showHotSearchNotice();
    if (typeof showBanNotice === 'function') showBanNotice();
    if (typeof showPublicOpinionNotice === 'function') showPublicOpinionNotice();
    
    updateWorksList();
    if (typeof checkAchievements === 'function') checkAchievements();
    saveGame();
    
    if (gameState.devMode) {
        document.getElementById('devFloatButton').style.display = 'block';
        if (typeof devUpdateCountdowns === 'function') devUpdateCountdowns();
    } else {
        document.getElementById('devFloatButton').style.display = 'none';
    }
    
    const activeTab = document.querySelector('.nav-item.active');
    if (activeTab && activeTab.textContent.includes('作品')) {
        const worksContent = document.getElementById('worksContent');
        if (worksContent && worksContent.style.display !== 'none') {
            if (typeof renderWorksPage === 'function') {
                renderWorksPage();
            }
        }
    }
    
    // ✅ 新增：更新导航栏消息小红点
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    // ✅ 更新热度值显示（如果系统已初始化）
    if (window.HotValueSystem) {
        window.HotValueSystem.updateDisplay();
    }
}

// ==================== 数字动画 ====================
function animateNumberUpdate(element) { 
    element.classList.add('updating'); 
    setTimeout(() => element.classList.remove('updating'), 300); 
}

// ==================== 标签页切换 ====================
function switchTab(tab) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if (event && event.target) {
        event.target.closest('.nav-item').classList.add('active');
    }
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    switch (tab) {
        case 'home':
            document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
            break;
        case 'works':
            document.querySelectorAll('.main-content-section').forEach(el => el.style.display = 'none');
            document.getElementById('worksContent').style.display = 'block';
            if (typeof showWorksFullscreen === 'function') showWorksFullscreen();
            break;
        case 'messages':
            document.querySelectorAll('.main-content-section').forEach(el => el.style.display = 'none');
            document.getElementById('messagesContent').style.display = 'block';
            // ✅ 使用新的消息中心函数
            if (typeof showMessagesFullscreen === 'function') showMessagesFullscreen();
            // 启动实时更新
            if (typeof startMessagesRealtimeUpdate === 'function') startMessagesRealtimeUpdate();
            break;
        case 'achievements':
            document.querySelectorAll('.main-content-section').forEach(el => el.style.display = 'none');
            document.getElementById('achievementsContent').style.display = 'block';
            if (typeof showAchievementsFullscreen === 'function') showAchievementsFullscreen();
            break;
    }
}

// ==================== 全屏页面关闭（修复版 - 只在关闭作品页时清除缓存） ====================
function closeFullscreenPage(pageName) {
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    // 只在关闭作品页时清除用户数据缓存
    if (pageName === 'workDetail') {
        currentDetailWork = null;
        window.cachedUserProfile = null; // 清除用户主页缓存
    } else if (pageName === 'userProfile') {
        // 关闭用户主页时不清除缓存，保留数据
        // 注释掉清除缓存的代码
        // window.cachedUserProfile = null;
    }
    
    document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
}

// ==================== 模态框基础 ====================
function showModal(content) { 
    document.getElementById('modalContent').innerHTML = content; 
    document.getElementById('modal').style.display = 'block'; 
}

function closeModal() { 
    document.getElementById('modal').style.display = 'none'; 
    // ✅ 停止通知中心实时更新（如果有）
    stopNotificationsRealtimeUpdate();
}

// ==================== 通知系统（增强版：自动清理 + 实时更新） ====================

// 通知中心实时更新相关变量
let notificationsUpdateInterval = null;
window.isNotificationCenterOpen = false;

// ✅ 修改：showNotification现在直接调用showEventPopup，不再存储通知
function showNotification(title, content) {
    // 直接显示弹窗通知，不再存储到通知中心
    showEventPopup(title, content);
}

// ✅ 修改：updateNotificationBadge不再显示任何徽章
function updateNotificationBadge() {
    // 隐藏通知徽章
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.style.display = 'none';
    }
}

// ✅ 增强版：显示通知中心（带实时动态更新）
function showNotifications() {
    // 标记所有通知为已读
    if (gameState.notifications) {
        gameState.notifications.forEach(n => n.read = true);
    }
    updateNotificationBadge();
    
    // 设置标志位
    window.isNotificationCenterOpen = true;
    
    // 渲染函数
    function renderNotifications() {
        const notificationHtml = gameState.notifications && gameState.notifications.length > 0 
            ? gameState.notifications.slice(-20).reverse().map(notification => 
                `<div class="comment-item">
                    <div class="comment-header">
                        <span class="comment-user">${notification.title}</span>
                        <span class="comment-time">${formatTime(notification.time)}</span>
                    </div>
                    <div class="comment-content">${notification.content}</div>
                </div>`
            ).join('')
            : '<div style="text-align:center;color:#999;padding:20px;">通知中心已停用，所有通知将以弹窗形式显示</div>';
        
        // 检查模态框是否仍然存在且是通知中心
        const modal = document.getElementById('modal');
        const content = document.getElementById('modalContent');
        if (modal && modal.style.display === 'block' && content && content.innerHTML.includes('通知中心')) {
            const listContainer = content.querySelector('div[style*="max-height"]');
            if (listContainer) {
                listContainer.innerHTML = notificationHtml;
            }
        } else {
            // 如果模态框已关闭，停止更新
            stopNotificationsRealtimeUpdate();
        }
    }
    
    // 初始渲染
    const initialHtml = gameState.notifications && gameState.notifications.length > 0
        ? gameState.notifications.slice(-20).reverse().map(notification => 
            `<div class="comment-item">
                <div class="comment-header">
                    <span class="comment-user">${notification.title}</span>
                    <span class="comment-time">${formatTime(notification.time)}</span>
                </div>
                <div class="comment-content">${notification.content}</div>
            </div>`
        ).join('')
        : '<div style="text-align:center;color:#999;padding:20px;">通知中心已停用，所有通知将以弹窗形式显示</div>';
    
    // 使用自定义关闭函数
    const closeBtnHtml = `<div class="close-btn" onclick="closeNotificationsModal()">✕</div>`;
    
    showModal(`<div class="modal-header"><div class="modal-title">通知中心（已停用）</div>${closeBtnHtml}</div><div style="max-height:60vh;overflow-y:auto">${initialHtml}</div>`);
    
    // 启动实时更新
    startNotificationsRealtimeUpdate(renderNotifications);
}

// ✅ 独立关闭通知中心模态框
function closeNotificationsModal() {
    closeModal();
    stopNotificationsRealtimeUpdate();
}

// ✅ 启动通知中心实时更新
function startNotificationsRealtimeUpdate(renderFunc) {
    // 停止之前的更新
    if (notificationsUpdateInterval) {
        clearInterval(notificationsUpdateInterval);
    }
    
    // 每秒更新一次
    notificationsUpdateInterval = setInterval(() => {
        if (window.isNotificationCenterOpen) {
            renderFunc();
        } else {
            stopNotificationsRealtimeUpdate();
        }
    }, 1000);
}

// ✅ 停止通知中心实时更新
function stopNotificationsRealtimeUpdate() {
    if (notificationsUpdateInterval) {
        clearInterval(notificationsUpdateInterval);
        notificationsUpdateInterval = null;
    }
    window.isNotificationCenterOpen = false;
}

// ==================== 游戏内弹窗系统 ====================
function showAlert(message, title = '提示') {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">${title}</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 20px; font-size: 14px; line-height: 1.5;">${message}</div>
            <button class="btn" onclick="closeModal()">确定</button>
        </div>
    `;
    showModal(modalContent);
}

function showConfirm(message, onConfirm, title = '请确认') {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">${title}</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 20px; font-size: 14px; line-height: 1.5;">${message}</div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" onclick="closeModal()">取消</button>
                <button class="btn" onclick="handleConfirmCallback()">确定</button>
            </div>
        </div>
    `;
    showModal(modalContent);
    window._confirmCallback = onConfirm;
}

function handleConfirmCallback() {
    closeModal();
    if (window._confirmCallback) {
        window._confirmCallback(true);
        window._confirmCallback = null;
    }
}

function showPrompt(message, defaultValue, onSubmit, title = '请输入') {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">${title}</div>
        </div>
        <div style="padding: 20px;">
            <div style="margin-bottom: 15px; font-size: 14px;">${message}</div>
            <input type="text" class="text-input" id="promptInput" placeholder="" value="${defaultValue}" maxlength="50">
            <div style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="btn btn-secondary" onclick="closeModal(); window._promptCallback = null;">取消</button>
                <button class="btn" onclick="handlePromptCallback()">确定</button>
            </div>
        </div>
    `;
    showModal(modalContent);
    window._promptCallback = onSubmit;
    
    setTimeout(() => {
        const input = document.getElementById('promptInput');
        if (input) input.focus();
    }, 100);
}

function handlePromptCallback() {
    const input = document.getElementById('promptInput');
    const value = input ? input.value : null;
    closeModal();
    if (window._promptCallback) {
        window._promptCallback(value);
        window._promptCallback = null;
    }
}

// ==================== 成就弹窗控制 ====================
let achievementPopupTimeout = null;

function showAchievementPopup(achievement) {
    const popup = document.getElementById('achievementPopup');
    const icon = document.getElementById('achievementPopupIcon');
    const name = document.getElementById('achievementPopupName');
    
    if (!popup || !icon || !name) {
        console.error('成就弹窗元素未找到');
        return;
    }
    
    if (achievementPopupTimeout) {
        clearTimeout(achievementPopupTimeout);
    }
    
    icon.textContent = achievement.icon || '🏆';
    name.textContent = achievement.name || '未知成就';
    
    popup.classList.add('show');
    
    achievementPopupTimeout = setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

// ==================== 警告显示 ====================
function showWarning(message) {
    const toast = document.getElementById('warningToast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

// ==================== 随机事件弹窗通知 ====================
function showEventPopup(title, content) {
    // 创建弹窗元素
    const popup = document.createElement('div');
    popup.className = 'event-popup';
    popup.innerHTML = `
        <div class="event-popup-header">${title}</div>
        <div class="event-popup-content">${content}</div>
    `;
    document.body.appendChild(popup);
    
    // 触发动画（滑入）
    setTimeout(() => {
        popup.classList.add('show');
    }, 100);
    
    // 3.5秒后自动消失
    setTimeout(() => {
        popup.classList.remove('show');
        // 动画结束后移除元素
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 400);
    }, 3500);
}

// ==================== 全局函数绑定 ====================
window.updateDisplay = updateDisplay;
window.showModal = showModal;
window.closeModal = closeModal;
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.handleConfirmCallback = handleConfirmCallback;
window.showPrompt = showPrompt;
window.handlePromptCallback = handlePromptCallback;
window.showNotification = showNotification;
window.updateNotificationBadge = updateNotificationBadge;
window.showNotifications = showNotifications;
window.closeNotificationsModal = closeNotificationsModal;
window.startNotificationsRealtimeUpdate = startNotificationsRealtimeUpdate;
window.stopNotificationsRealtimeUpdate = stopNotificationsRealtimeUpdate;
window.showAchievementPopup = showAchievementPopup;
window.showWarning = showWarning;
window.showEventPopup = showEventPopup;
window.switchTab = switchTab;
window.closeFullscreenPage = closeFullscreenPage;
window.animateNumberUpdate = animateNumberUpdate;
window.updateNavMessageBadge = updateNavMessageBadge;

console.log('UI核心系统已加载');
