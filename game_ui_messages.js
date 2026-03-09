// ==================== 消息中心系统（重构版） ====================

// 全局变量
window.currentInteractionFilter = 'all'; // 当前互动消息筛选类型：all, like, comment, share
window.isInteractionPageOpen = false;

// ==================== 更新导航栏消息徽章 ====================
function updateNavMessageBadge() {
    // 如果开启了消息免打扰，直接隐藏导航栏徽章
    if (gameState.doNotDisturb) {
        const badge = document.querySelector('.nav-item:nth-child(3) .nav-badge');
        if (badge && badge.parentNode) {
            badge.parentNode.removeChild(badge);
        }
        return;
    }
    
    // 计算互动消息未读数
    let interactionUnread = 0;
    if (gameState.messages && gameState.messages.length > 0) {
        interactionUnread = gameState.messages.filter(msg => !msg.read).length;
    }
    
    // 计算私信未读数
    const privateUnread = gameState.privateMessageSystem ? gameState.privateMessageSystem.unreadCount : 0;
    
    // 系统消息未读数
    const systemUnread = gameState.systemMessages ? gameState.systemMessages.unreadCount : 0;
    
    // 总未读数
    const totalUnread = interactionUnread + privateUnread + systemUnread;
    
    const navItem = document.querySelector('.nav-item:nth-child(3)');
    if (!navItem) return;
    
    let badge = navItem.querySelector('.nav-badge');
    
    if (totalUnread > 0) {
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'nav-badge';
            badge.style.cssText = `
                position: absolute;
                top: 2px;
                right: 8px;
                background: #ff0050;
                color: #fff;
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 10px;
                min-width: 16px;
                text-align: center;
                z-index: 10;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(255, 0, 80, 0.3);
            `;
            navItem.style.position = 'relative';
            navItem.appendChild(badge);
        }
        badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
        badge.style.display = 'block';
    } else if (badge) {
        badge.style.display = 'none';
    }
}

// ==================== 全屏消息页（消息中心入口） ====================
function showMessagesFullscreen() {
    const content = document.getElementById('messagesListTab');
    if (!content) return;
    
    // 计算各类型未读数
    const interactionUnread = gameState.messages ? gameState.messages.filter(msg => !msg.read).length : 0;
    const privateUnreadCount = gameState.privateMessageSystem ? gameState.privateMessageSystem.unreadCount : 0;
    const systemUnreadCount = gameState.systemMessages ? gameState.systemMessages.unreadCount : 0;
    
    // 图3样式：互动消息入口
    const interactionEntryHtml = `
        <div id="interactionMessageBar" style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 8px; cursor: pointer; border: 1px solid #333; transition: all 0.3s; display: flex; align-items: center; gap: 12px;" 
             onclick="showInteractionMessagesPage()"
             onmouseover="this.style.borderColor='#667eea';"
             onmouseout="this.style.borderColor='#333';">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                💬
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: bold; font-size: 15px; color: #fff;">互动消息</div>
                    ${interactionUnread > 0 ? `<span style="background: #ff0050; color: #fff; border-radius: 10px; padding: 2px 8px; font-size: 10px; font-weight: bold;">${interactionUnread > 99 ? '99+' : interactionUnread}</span>` : ''}
                </div>
                <div style="font-size: 12px; color: ${interactionUnread > 0 ? '#ccc' : '#666'}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${getLatestInteractionPreview()}
                </div>
            </div>
            <div style="color: #999; font-size: 18px; flex-shrink: 0;">›</div>
        </div>
    `;
    
    // 图3样式：私信入口（修复预览）
    const privateEntryHtml = `
        <div id="privateMessageBar" style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 8px; cursor: pointer; border: 1px solid #333; transition: all 0.3s; display: flex; align-items: center; gap: 12px;" 
             onclick="showPrivateMessageList()"
             onmouseover="this.style.borderColor='#667eea';"
             onmouseout="this.style.borderColor='#333';">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                📨
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: bold; font-size: 15px; color: #fff;">来自陌生人的私信</div>
                    ${privateUnreadCount > 0 ? `<span style="background: #ff0050; color: #fff; border-radius: 10px; padding: 2px 8px; font-size: 10px; font-weight: bold;">${privateUnreadCount > 99 ? '99+' : privateUnreadCount}</span>` : ''}
                </div>
                <div style="font-size: 12px; color: ${privateUnreadCount > 0 ? '#ccc' : '#666'}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${getLatestPrivatePreview()}
                </div>
            </div>
            <div style="color: #999; font-size: 18px; flex-shrink: 0;">›</div>
        </div>
    `;
    
    // 图3样式：系统消息入口
    const systemEntryHtml = `
        <div id="systemMessageBar" style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 15px; cursor: pointer; border: 1px solid #333; transition: all 0.3s; display: flex; align-items: center; gap: 12px;" 
             onclick="showSystemMessagesList()"
             onmouseover="this.style.borderColor='#00f2ea';"
             onmouseout="this.style.borderColor='#333';">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #ff6b00 0%, #ff0050 100%); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;">
                📢
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-weight: bold; font-size: 15px; color: #fff;">平台系统消息</div>
                    ${systemUnreadCount > 0 ? `<span style="background: #00f2ea; color: #000; border-radius: 10px; padding: 2px 8px; font-size: 10px; font-weight: bold;">${systemUnreadCount > 99 ? '99+' : systemUnreadCount}</span>` : ''}
                </div>
                <div style="font-size: 12px; color: ${systemUnreadCount > 0 ? '#ccc' : '#666'}; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${getLatestSystemPreview()}
                </div>
            </div>
            <div style="color: #999; font-size: 18px; flex-shrink: 0;">›</div>
        </div>
    `;
    
    content.innerHTML = interactionEntryHtml + privateEntryHtml + systemEntryHtml;
    
    // 更新导航栏徽章
    updateNavMessageBadge();
}

// ==================== 获取最新互动消息预览 ====================
function getLatestInteractionPreview() {
    if (!gameState.messages || gameState.messages.length === 0) {
        return '赞、评论、转发等互动通知';
    }
    const latest = gameState.messages[gameState.messages.length - 1];
    const typeNames = {
        like: '赞了你的作品',
        comment: '评论了你的作品',
        share: '转发了你的作品'
    };
    return `${latest.user || '匿名用户'}${typeNames[latest.type] || '互动了你的作品'}`;
}

// ==================== 获取最新私信预览（修复版） ====================
function getLatestPrivatePreview() {
    if (!gameState.privateMessageSystem || !gameState.privateMessageSystem.conversations || gameState.privateMessageSystem.conversations.length === 0) {
        return '粉丝和观众的私信消息';
    }
    
    // 找到有未读消息的对话，或最新的对话
    const conversations = gameState.privateMessageSystem.conversations;
    const unreadConv = conversations.find(conv => conv.unreadCount > 0);
    const targetConv = unreadConv || conversations[conversations.length - 1];
    
    if (targetConv && targetConv.messages && targetConv.messages.length > 0) {
        const latestMsg = targetConv.messages[targetConv.messages.length - 1];
        return latestMsg.content || '暂无消息';
    }
    
    return targetConv.latestMessage || '粉丝和观众的私信消息';
}

// ==================== 获取最新系统消息预览 ====================
function getLatestSystemPreview() {
    if (!gameState.systemMessages || !gameState.systemMessages.messages || gameState.systemMessages.messages.length === 0) {
        return '热搜邀请、月度总结等重要通知';
    }
    
    const unreadMsg = gameState.systemMessages.messages.find(msg => !msg.read);
    const targetMsg = unreadMsg || gameState.systemMessages.messages[gameState.systemMessages.messages.length - 1];
    
    if (targetMsg.type === 'hotSearchInvite') {
        return `热搜邀请：${targetMsg.data?.topic || '新话题'}`;
    } else if (targetMsg.type === 'monthlySummary') {
        return `${targetMsg.data?.monthName || '本月'}收入总结`;
    }
    
    return targetMsg.title || '平台系统消息';
}

// ==================== 显示互动消息页面（图1、图2样式） ====================
function showInteractionMessagesPage() {
    window.isInteractionPageOpen = true;
    window.currentInteractionFilter = 'all';
    
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    const page = document.getElementById('messagesAllPage');
    if (page) {
        page.classList.add('active');
        renderInteractionMessagesPage();
    }
    
    // 标记所有互动消息为已读
    markAllInteractionRead();
}

// ==================== 渲染互动消息页面 ====================
function renderInteractionMessagesPage() {
    const content = document.getElementById('messagesAllPageContent');
    const headerTitle = document.querySelector('#messagesAllPage .fullscreen-title');
    if (!content) return;
    
    // 更新标题为下拉菜单样式
    if (headerTitle) {
        headerTitle.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <div id="interactionFilterDropdown" style="cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 5px 10px;" onclick="toggleInteractionFilterDropdown(event)">
                    <span id="currentFilterText">${getFilterText(window.currentInteractionFilter)}</span>
                    <span style="font-size: 12px;">▼</span>
                </div>
                <div id="filterDropdownMenu" style="display: none; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); background: #fff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); min-width: 150px; z-index: 1000; margin-top: 5px; overflow: hidden;">
                    <div style="background: #fff; color: #333;">
                        <div style="padding: 12px 16px; cursor: pointer; ${window.currentInteractionFilter === 'all' ? 'background: #f0f0f0; color: #ff0050;' : ''}" onclick="changeInteractionFilter('all', event)">
                            <span style="margin-right: 8px;">💬</span>全部消息
                            ${window.currentInteractionFilter === 'all' ? '<span style="float: right; color: #ff0050;">✓</span>' : ''}
                        </div>
                        <div style="padding: 12px 16px; cursor: pointer; ${window.currentInteractionFilter === 'like' ? 'background: #f0f0f0; color: #ff0050;' : ''}" onclick="changeInteractionFilter('like', event)">
                            <span style="margin-right: 8px;">❤️</span>赞
                            ${window.currentInteractionFilter === 'like' ? '<span style="float: right; color: #ff0050;">✓</span>' : ''}
                        </div>
                        <div style="padding: 12px 16px; cursor: pointer; ${window.currentInteractionFilter === 'comment' ? 'background: #f0f0f0; color: #ff0050;' : ''}" onclick="changeInteractionFilter('comment', event)">
                            <span style="margin-right: 8px;">💭</span>收到的评论
                            ${window.currentInteractionFilter === 'comment' ? '<span style="float: right; color: #ff0050;">✓</span>' : ''}
                        </div>
                        <div style="padding: 12px 16px; cursor: pointer; ${window.currentInteractionFilter === 'share' ? 'background: #f0f0f0; color: #ff0050;' : ''}" onclick="changeInteractionFilter('share', event)">
                            <span style="margin-right: 8px;">🔄</span>转发
                            ${window.currentInteractionFilter === 'share' ? '<span style="float: right; color: #ff0050;">✓</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // 筛选消息
    let messages = gameState.messages || [];
    if (window.currentInteractionFilter !== 'all') {
        messages = messages.filter(msg => msg.type === window.currentInteractionFilter);
    }
    
    // 限制100条，超出删除（保留最新的100条）
    if (messages.length > 100) {
        messages = messages.slice(-100);
        gameState.messages = messages;
        saveGame();
    }
    
    // 倒序显示（最新的在前面）
    messages = [...messages].reverse();
    
    if (messages.length === 0) {
        // 图1样式：空状态
        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 100px; color: #999;">
                <div style="font-size: 16px; margin-bottom: 10px;">你还没有收到互动消息</div>
                <div style="font-size: 14px; color: #666;">赶快去和朋友互动起来吧</div>
            </div>
        `;
        return;
    }
    
    // 渲染消息列表
    const messagesHtml = messages.map(msg => {
        const typeIcons = {
            like: '❤️',
            comment: '💬',
            share: '🔄'
        };
        const typeTexts = {
            like: '赞了你的作品',
            comment: '评论了你的作品',
            share: '转发了你的作品'
        };
        
        const work = gameState.worksList.find(w => w.id === msg.workId);
        const workTypeIcon = work ? (work.type === 'video' ? '🎬' : work.type === 'live' ? '📱' : '📝') : '📹';
        
        return `
            <div class="comment-item ${!msg.read ? 'new-message' : ''}" style="${!msg.read ? 'border-left: 3px solid #667aea; background: linear-gradient(90deg, rgba(102,126,234,0.1) 0%, transparent 100%);' : ''}; margin-bottom: 10px; padding: 12px; border-radius: 8px; background: #161823;">
                <div class="comment-header" style="margin-bottom: 8px;">
                    <div class="comment-user-avatar" style="width: 36px; height: 36px; font-size: 14px;">${msg.user ? msg.user.charAt(0) : '👤'}</div>
                    <div style="flex: 1; margin-left: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="comment-user" onclick="openUserProfileFromInteraction('${msg.user || '匿名用户'}', '${msg.user ? msg.user.charAt(0) : '👤'}')" style="font-weight: bold; color: #fff; font-size: 14px;">${msg.user || '匿名用户'}</span>
                            <span style="font-size: 11px; color: #666;">${formatTime(msg.time)}</span>
                        </div>
                        <div style="font-size: 13px; color: #ccc; margin-top: 2px;">${typeIcons[msg.type] || '🔔'} ${typeTexts[msg.type] || '互动了你的作品'}</div>
                    </div>
                </div>
                <div style="font-size: 12px; color: #999; padding: 8px; background: #1a1a1a; border-radius: 5px; display: flex; align-items: center; gap: 5px; margin-left: 46px;">
                    <span>${workTypeIcon}</span>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${msg.workContent || '未知作品'}</span>
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = `<div style="padding: 10px;">${messagesHtml}</div>`;
}

// ==================== 切换筛选下拉菜单 ====================
function toggleInteractionFilterDropdown(event) {
    event.stopPropagation();
    const menu = document.getElementById('filterDropdownMenu');
    if (menu) {
        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';
        
        // 点击外部关闭
        if (!isVisible) {
            setTimeout(() => {
                document.addEventListener('click', function closeDropdown(e) {
                    if (!e.target.closest('#interactionFilterDropdown')) {
                        menu.style.display = 'none';
                        document.removeEventListener('click', closeDropdown);
                    }
                });
            }, 0);
        }
    }
}

// ==================== 更改互动消息筛选 ====================
function changeInteractionFilter(filter, event) {
    event.stopPropagation();
    window.currentInteractionFilter = filter;
    
    const menu = document.getElementById('filterDropdownMenu');
    if (menu) menu.style.display = 'none';
    
    renderInteractionMessagesPage();
}

// ==================== 获取筛选文本 ====================
function getFilterText(filter) {
    const texts = {
        all: '全部消息',
        like: '赞',
        comment: '收到的评论',
        share: '转发'
    };
    return texts[filter] || '全部消息';
}

// ==================== 关闭互动消息页面（修复版：保持消息导航选中） ====================
function closeMessagesFullscreenPage(pageName) {
    window.isInteractionPageOpen = false;
    
    const page = document.getElementById(pageName + 'Page');
    if (page) {
        page.classList.remove('active');
    }
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    // 如果没有其他全屏页面打开，恢复消息导航选中（而不是默认首页）
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

// ==================== 标记所有互动消息为已读 ====================
function markAllInteractionRead() {
    if (!gameState.messages || gameState.messages.length === 0) return;
    
    let updated = false;
    gameState.messages.forEach(msg => {
        if (!msg.read) {
            msg.read = true;
            updated = true;
        }
    });
    
    if (updated) {
        saveGame();
        updateNavMessageBadge();
        // 更新消息中心入口预览
        const content = document.getElementById('messagesListTab');
        if (content) showMessagesFullscreen();
    }
}

// ==================== 从互动消息打开用户主页 ====================
function openUserProfileFromInteraction(username, avatar) {
    closeMessagesFullscreenPage('messagesAll');
    setTimeout(() => {
        if (typeof window.showUserProfile === 'function') {
            window.showUserProfile(username, avatar);
        }
    }, 100);
}

// ==================== 清空互动消息 ====================
function clearMessagesByType(type) {
    if (!gameState.messages || gameState.messages.length === 0) return;
    
    showConfirm(`确定要清空全部互动消息吗？此操作不可恢复！`, function(confirmed) {
        if (confirmed) {
            const beforeCount = gameState.messages.length;
            gameState.messages = [];
            saveGame();
            
            showNotification('清空成功', `已清空${beforeCount}条消息`);
            renderInteractionMessagesPage();
            updateNavMessageBadge();
            
            // 更新消息中心入口
            const content = document.getElementById('messagesListTab');
            if (content) showMessagesFullscreen();
        }
    }, '清空确认');
}

// ==================== 全部已读（包括所有类型消息） ====================
function markAllRead() {
    // 标记互动消息已读
    if (gameState.messages) {
        gameState.messages.forEach(msg => msg.read = true);
    }
    
    // 标记所有私信为已读
    if (gameState.privateMessageSystem && gameState.privateMessageSystem.conversations) {
        gameState.privateMessageSystem.conversations.forEach(conv => {
            conv.unreadCount = 0;
        });
        gameState.privateMessageSystem.unreadCount = 0;
    }
    
    // 标记系统消息已读
    if (gameState.systemMessages && gameState.systemMessages.messages) {
        gameState.systemMessages.messages.forEach(msg => {
            msg.read = true;
        });
        gameState.systemMessages.unreadCount = 0;
    }
    
    // 更新所有UI
    updateNavMessageBadge();
    if (typeof updatePrivateMessageUI === 'function') {
        updatePrivateMessageUI();
    }
    if (typeof updateSystemMessagesUI === 'function') {
        updateSystemMessagesUI();
    }
    
    // 关键修复：重新渲染消息中心页面
    const content = document.getElementById('messagesListTab');
    if (content) showMessagesFullscreen();
    
    saveGame();
    showNotification('操作成功', '所有消息已标记为已读');
}

// ==================== 消息实时更新系统 ====================
function startMessagesRealtimeUpdate() {
    if (window.messagesUpdateInterval) {
        clearInterval(window.messagesUpdateInterval);
    }
    
    window.messagesUpdateInterval = setInterval(() => {
        // 如果互动消息页面打开，刷新显示
        if (window.isInteractionPageOpen) {
            renderInteractionMessagesPage();
        }
        
        // 更新消息中心入口
        const content = document.getElementById('messagesListTab');
        if (content && document.getElementById('messagesContent').style.display !== 'none') {
            showMessagesFullscreen();
        }
        
        // 更新导航栏徽章
        updateNavMessageBadge();
    }, 3000);
}

// ==================== 停止消息实时更新 ====================
function stopMessagesRealtimeUpdate() {
    if (window.messagesUpdateInterval) {
        clearInterval(window.messagesUpdateInterval);
        window.messagesUpdateInterval = null;
    }
}

// ==================== 保持兼容性：旧函数映射 ====================
// 为了保持与其他文件的兼容性
window.currentMessageFilter = window.currentInteractionFilter || 'all';

// 兼容旧调用，但不再使用旧的分页逻辑
function openMessagesFullscreenPage(type) {
    // 现在统一打开互动消息页面
    showInteractionMessagesPage();
}

// 兼容旧调用
function renderMessagesFullscreenPage(type) {
    renderInteractionMessagesPage();
}

function markMessagesAsReadByType(type) {
    markAllInteractionRead();
}

function openUserProfileFromMessage(username, avatar, messageType) {
    openUserProfileFromInteraction(username, avatar);
}

function openUserProfileFromComment(username, avatar) {
    if (typeof window.showUserProfile === 'function') {
        window.showUserProfile(username, avatar);
    }
}

// ==================== 绑定全局函数 ====================
window.currentInteractionFilter = 'all';
window.showMessagesFullscreen = showMessagesFullscreen;
window.showInteractionMessagesPage = showInteractionMessagesPage;
window.renderInteractionMessagesPage = renderInteractionMessagesPage;
window.toggleInteractionFilterDropdown = toggleInteractionFilterDropdown;
window.changeInteractionFilter = changeInteractionFilter;
window.closeMessagesFullscreenPage = closeMessagesFullscreenPage;
window.markAllRead = markAllRead;
window.clearMessagesByType = clearMessagesByType;
window.updateNavMessageBadge = updateNavMessageBadge;
window.markAllInteractionRead = markAllInteractionRead;
window.openUserProfileFromInteraction = openUserProfileFromInteraction;
window.startMessagesRealtimeUpdate = startMessagesRealtimeUpdate;
window.stopMessagesRealtimeUpdate = stopMessagesRealtimeUpdate;

// 兼容性导出
window.renderMessagesFullscreenPage = renderMessagesFullscreenPage;
window.openMessagesFullscreenPage = openMessagesFullscreenPage;
window.markMessagesAsReadByType = markMessagesAsReadByType;
window.openUserProfileFromMessage = openUserProfileFromMessage;
window.openUserProfileFromComment = openUserProfileFromComment;

console.log('消息中心系统（重构版）已加载');
