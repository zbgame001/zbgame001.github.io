// ==================== 消息中心系统 ====================

// 全局变量
window.currentMessageFilter = 'all';
window.currentCommentPage = 1;
window.commentsPerPage = 10;

// ==================== 新增：更新消息中心横条的小红点和小蓝点（核心修复） ====================
function updateMessageCenterBars() {
    const content = document.getElementById('messagesListTab');
    if (!content) return;
    
    // 计算未读数
    const privateUnreadCount = gameState.privateMessageSystem ? gameState.privateMessageSystem.unreadCount : 0;
    const systemUnreadCount = gameState.systemMessages ? gameState.systemMessages.unreadCount : 0;
    
    // 查找私信横条的徽章元素
    const privateBadge = content.querySelector('#privateMessageBar .private-unread-badge');
    if (privateBadge) {
        if (privateUnreadCount > 0) {
            privateBadge.textContent = privateUnreadCount > 99 ? '99+' : privateUnreadCount;
            privateBadge.style.display = 'inline-block';
        } else {
            privateBadge.style.display = 'none';
        }
    }
    
    // 查找系统消息横条的徽章元素
    const systemBadge = content.querySelector('#systemMessageBar .system-unread-badge');
    if (systemBadge) {
        if (systemUnreadCount > 0) {
            systemBadge.textContent = systemUnreadCount > 99 ? '99+' : systemUnreadCount;
            systemBadge.style.display = 'inline-block';
        } else {
            systemBadge.style.display = 'none';
        }
    }
}

// 更新消息页面顶部的小红点（增强版）
function updateMessageFilterBadges() {
    // 如果开启了消息免打扰，直接隐藏所有小红点
    if (gameState.doNotDisturb) {
        document.querySelectorAll('.filter-badge').forEach(badge => {
            if (badge.parentNode) {
                badge.parentNode.removeChild(badge);
            }
        });
        return;
    }
    
    if (!gameState.messages) gameState.messages = [];
    
    const unreadCount = {
        all: gameState.messages.filter(msg => !msg.read).length,
        like: gameState.messages.filter(msg => msg.type === 'like' && !msg.read).length,
        comment: gameState.messages.filter(msg => msg.type === 'comment' && !msg.read).length,
        share: gameState.messages.filter(msg => msg.type === 'share' && !msg.read).length
    };
    
    Object.keys(unreadCount).forEach(type => {
        const button = document.querySelector(`[onclick="openMessagesFullscreenPage('${type}')"]`);
        if (!button) return;
        
        let badge = button.querySelector('.filter-badge');
        const count = unreadCount[type];
        
        if (badge && badge.parentNode) {
            badge.parentNode.removeChild(badge);
        }
        
        if (count > 0) {
            badge = document.createElement('span');
            badge.className = 'filter-badge';
            badge.style.cssText = `
                background: #ff0050;
                color: #fff;
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 10px;
                margin-left: 4px;
                display: inline-block;
                min-width: 16px;
                text-align: center;
                font-weight: bold;
                box-shadow: 0 2px 4px rgba(255, 0, 80, 0.3);
            `;
            badge.textContent = count > 30 ? '30+' : count;
            button.appendChild(badge);
        }
    });
}

// 更新导航栏消息徽章
function updateNavMessageBadge() {
    // 如果开启了消息免打扰，直接隐藏导航栏徽章
    if (gameState.doNotDisturb) {
        const badge = document.querySelector('.nav-item:nth-child(3) .nav-badge');
        if (badge && badge.parentNode) {
            badge.parentNode.removeChild(badge);
        }
        return;
    }
    
    // 计算普通消息未读数
    const normalUnread = gameState.messages ? gameState.messages.filter(msg => !msg.read).length : 0;
    
    // 计算私信未读数
    const privateUnread = gameState.privateMessageSystem ? gameState.privateMessageSystem.unreadCount : 0;
    
    // 系统消息未读数
    const systemUnread = gameState.systemMessages ? gameState.systemMessages.unreadCount : 0;
    
    // 总未读数
    const totalUnread = normalUnread + privateUnread + systemUnread;
    
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

// 全屏消息页
function showMessagesFullscreen() {
    const content = document.getElementById('messagesListTab');
    if (!content) return;
    
    const privateUnreadCount = gameState.privateMessageSystem ? gameState.privateMessageSystem.unreadCount : 0;
    const systemUnreadCount = gameState.systemMessages ? gameState.systemMessages.unreadCount : 0;
    
    const filterButtons = `
        <div style="display: flex; gap: 5px; margin-bottom: 10px; flex-wrap: wrap;">
            <button class="message-filter-btn active" onclick="openMessagesFullscreenPage('all')">
                💬 全部消息
                <span class="filter-badge" style="display:none;"></span>
            </button>
            <button class="message-filter-btn" onclick="openMessagesFullscreenPage('like')">
                ❤️ 点赞
                <span class="filter-badge" style="display:none;"></span>
            </button>
            <button class="message-filter-btn" onclick="openMessagesFullscreenPage('comment')">
                💭 评论
                <span class="filter-badge" style="display:none;"></span>
            </button>
            <button class="message-filter-btn" onclick="openMessagesFullscreenPage('share')">
                🔄 转发
                <span class="filter-badge" style="display:none;"></span>
            </button>
        </div>
        
        <!-- 私信横条 -->
        <div id="privateMessageBar" style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 8px; cursor: pointer; border: 1px solid #333; transition: all 0.3s;" 
             onclick="showPrivateMessageList()"
             onmouseover="this.style.borderColor='#667eea';"
             onmouseout="this.style.borderColor='#333';">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="font-size: 20px;">📨</div>
                    <div style="font-weight: bold; font-size: 14px;">来自陌生人的私信</div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="private-unread-badge" style="
                        background: #ff0050;
                        color: #fff;
                        border-radius: 10px;
                        padding: 2px 8px;
                        font-size: 10px;
                        font-weight: bold;
                        ${privateUnreadCount > 0 ? 'display: inline-block;' : 'display: none;'}
                    ">
                        ${privateUnreadCount > 99 ? '99+' : privateUnreadCount}
                    </span>
                    <div style="color: #999; font-size: 18px;">›</div>
                </div>
            </div>
        </div>
        
        <!-- 系统消息横条 -->
        <div id="systemMessageBar" style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 15px; cursor: pointer; border: 1px solid #333; transition: all 0.3s; position: relative;" 
             onclick="showSystemMessagesList()"
             onmouseover="this.style.borderColor='#00f2ea';"
             onmouseout="this.style.borderColor='#333';">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="font-size: 20px;">📢</div>
                    <div style="font-weight: bold; font-size: 14px;">平台系统消息</div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="system-unread-badge" style="
                        background: #00f2ea;
                        color: #000;
                        border-radius: 10px;
                        padding: 2px 8px;
                        font-size: 10px;
                        font-weight: bold;
                        margin-left: 5px;
                        ${systemUnreadCount > 0 ? 'display: inline-block;' : 'display: none;'}
                    ">
                        ${systemUnreadCount > 99 ? '99+' : systemUnreadCount}
                    </span>
                    <div style="color: #999; font-size: 18px;">›</div>
                </div>
            </div>
            <div style="font-size: 11px; color: #666; margin-top: 5px;">包含热搜邀请、月度总结等重要消息</div>
        </div>
        
        <div id="messagesListContainer"></div>
    `;
    
    content.innerHTML = filterButtons;
    
    // 更新小红点
    updateMessageFilterBadges();
    updateNavMessageBadge();
}

// 打开全屏消息页面
function openMessagesFullscreenPage(type) {
    window.currentMessageFilter = type;
    
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    document.getElementById(`messages${type.charAt(0).toUpperCase() + type.slice(1)}Page`).classList.add('active');
    
    renderMessagesFullscreenPage(type);
    markMessagesAsReadByType(type);
    
    // 立即更新导航栏徽章（根据免打扰状态）
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
}

// 关闭全屏消息页面
function closeMessagesFullscreenPage(pageName) {
    const type = pageName.replace('messages', '').toLowerCase();
    
    document.getElementById(pageName + 'Page').classList.remove('active');
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    const activeFullscreenPages = document.querySelectorAll('.fullscreen-page.active');
    if (activeFullscreenPages.length === 0) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector('.nav-item').classList.add('active');
    }
    
    // ✅ 关键修复：返回消息中心时，重新渲染并更新横条红点/蓝点
    if (typeof showMessagesFullscreen === 'function') {
        showMessagesFullscreen();
    }
    
    updateDisplay();
}

// 渲染全屏消息页面内容
function renderMessagesFullscreenPage(type) {
    const contentId = `messages${type.charAt(0).toUpperCase() + type.slice(1)}PageContent`;
    const content = document.getElementById(contentId);
    if (!content) return;
    
    if (!gameState.messages) gameState.messages = [];
    
    let messages = gameState.messages;
    if (type !== 'all') {
        messages = messages.filter(msg => msg.type === type);
    }
    
    // 从50条改为100条，显示更多历史消息
    messages = messages.slice(-100).reverse();
    
    if (messages.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">暂无消息</div>';
        return;
    }
    
    const messagesHtml = messages.map(msg => {
        const typeIcons = {
            like: '❤️',
            comment: '💬',
            share: '🔄'
        };
        const typeTexts = {
            like: '点赞了你的作品',
            comment: '评论了你的作品',
            share: '转发了你的作品'
        };
        
        // 确保显示作品类型图标
        const work = gameState.worksList.find(w => w.id === msg.workId);
        const workTypeIcon = work ? (work.type === 'video' ? '🎬' : work.type === 'live' ? '📱' : '📝') : '📹';
        
        return `
            <div class="comment-item ${!msg.read ? 'new-message' : ''}" style="${!msg.read ? 'border-left: 3px solid #667aea;' : ''}; margin-bottom: 10px;">
                <div class="comment-header">
                    <div class="comment-user-avatar">${msg.user ? msg.user.charAt(0) : '👤'}</div>
                    <span class="comment-user" onclick="openUserProfileFromMessage('${msg.user || '匿名用户'}', '${msg.user ? msg.user.charAt(0) : '👤'}', '${type}')">${msg.user || '匿名用户'}</span>
                    <span class="comment-time">${formatTime(msg.time)}</span>
                </div>
                <div class="comment-content">
                    ${typeIcons[msg.type] || '🔔'} ${typeTexts[msg.type] || '互动了你的作品'}
                </div>
                <div style="font-size: 11px; color: #999; margin-top: 5px; padding: 8px; background: #1a1a1a; border-radius: 5px; display: flex; align-items: center; gap: 5px;">
                    <span>${workTypeIcon}</span>
                    <span>作品：${msg.workContent || '未知作品'}</span>
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = messagesHtml;
}

// 标记消息为已读（批量处理）
function markMessagesAsReadByType(type) {
    if (!gameState.messages || gameState.messages.length === 0) return;
    
    let updated = false;
    gameState.messages.forEach(msg => {
        if (type === 'all' || msg.type === type) {
            if (!msg.read) {
                msg.read = true;
                updated = true;
            }
        }
    });
    
    if (gameState.notifications) {
        gameState.notifications.forEach(n => n.read = true);
    }
    
    if (updated) {
        saveGame();
        // 立即更新导航栏徽章（根据免打扰状态）
        if (typeof updateNavMessageBadge === 'function') {
            updateNavMessageBadge();
        }
    }
}

// 按类型清空消息
function clearMessagesByType(type) {
    if (!gameState.messages || gameState.messages.length === 0) return;
    
    const typeNames = {
        all: '所有',
        like: '点赞',
        comment: '评论',
        share: '转发'
    };
    
    showConfirm(`确定要清空${typeNames[type] || '所有'}消息吗？此操作不可恢复！`, function(confirmed) {
        if (confirmed) {
            const beforeCount = gameState.messages.length;
            
            if (type === 'all') {
                gameState.messages = [];
            } else {
                gameState.messages = gameState.messages.filter(msg => msg.type !== type);
            }
            
            const afterCount = gameState.messages.length;
            
            if (afterCount < beforeCount) {
                saveGame();
                showNotification('清空成功', `已清空${beforeCount - afterCount}条消息`);
                
                // 立即更新UI（根据免打扰状态）
                if (typeof renderMessagesFullscreenPage === 'function') {
                    renderMessagesFullscreenPage(type);
                }
                if (typeof updateNavMessageBadge === 'function') {
                    updateNavMessageBadge();
                }
                if (typeof updateMessageFilterBadges === 'function') {
                    updateMessageFilterBadges();
                }
            }
        }
    }, '清空确认');
}

// 全部已读
function markAllRead() {
    // 标记普通消息已读
    if (gameState.messages) {
        gameState.messages.forEach(msg => msg.read = true);
    }
    
    if (gameState.notifications) {
        gameState.notifications.forEach(n => n.read = true);
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
    
    // 立即更新所有UI
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    if (typeof updatePrivateMessageUI === 'function') {
        updatePrivateMessageUI();
    }
    if (typeof updateMessageFilterBadges === 'function') {
        updateMessageFilterBadges();
    }
    if (typeof updateSystemMessagesUI === 'function') {
        updateSystemMessagesUI();
    }
    
    // 关键修复：重新渲染消息中心页面，确保横条红点/蓝点显示正确
    if (typeof showMessagesFullscreen === 'function') {
        showMessagesFullscreen();
    }
    
    saveGame();
    showNotification('操作成功', '所有消息已标记为已读');
}

// 从消息打开用户主页
function openUserProfileFromMessage(username, avatar, messageType) {
    closeMessagesFullscreenPage(`messages${messageType.charAt(0).toUpperCase() + messageType.slice(1)}`);
    setTimeout(() => {
        window.showUserProfile(username, avatar);
    }, 100);
}

// 从评论打开用户主页
function openUserProfileFromComment(username, avatar) {
    closeCommentDetail();
    setTimeout(() => {
        window.showUserProfile(username, avatar);
    }, 100);
}

// ==================== 消息实时更新系统 ====================

// 启动消息实时更新
function startMessagesRealtimeUpdate() {
    if (window.messagesUpdateInterval) {
        clearInterval(window.messagesUpdateInterval);
    }
    
    window.messagesUpdateInterval = setInterval(() => {
        // 检查是否在消息全屏页面
        const activePage = document.querySelector('.fullscreen-page.active');
        if (activePage && activePage.id.startsWith('messages')) {
            // 获取当前消息类型
            const pageId = activePage.id;
            const type = pageId.replace('messages', '').replace('Page', '').toLowerCase();
            
            // 重新渲染当前页面
            if (typeof renderMessagesFullscreenPage === 'function') {
                renderMessagesFullscreenPage(type);
            }
        }
        
        // 更新消息页面的四个按钮小红点
        if (typeof updateMessageFilterBadges === 'function') {
            updateMessageFilterBadges();
        }
        
        // 更新导航栏消息徽章
        if (typeof updateNavMessageBadge === 'function') {
            updateNavMessageBadge();
        }
        
        // ✅ 关键修复：更新消息中心横条的红点/蓝点
        if (typeof updateMessageCenterBars === 'function') {
            updateMessageCenterBars();
        }
    }, 3000);
}

// 停止消息实时更新
function stopMessagesRealtimeUpdate() {
    if (window.messagesUpdateInterval) {
        clearInterval(window.messagesUpdateInterval);
        window.messagesUpdateInterval = null;
    }
}

// 页面切换时自动停止/启动更新
const originalSwitchTab = window.switchTab;
window.switchTab = function(tab) {
    if (originalSwitchTab) {
        originalSwitchTab(tab);
    }
    
    if (tab === 'messages') {
        startMessagesRealtimeUpdate();
    } else {
        stopMessagesRealtimeUpdate();
    }
};

// 打开全屏消息页时启动更新
const originalOpenMessagesFullscreenPage = window.openMessagesFullscreenPage;
window.openMessagesFullscreenPage = function(type) {
    if (originalOpenMessagesFullscreenPage) {
        originalOpenMessagesFullscreenPage(type);
    }
    startMessagesRealtimeUpdate();
};

// 关闭全屏消息页时停止更新
const originalCloseMessagesFullscreenPage = window.closeMessagesFullscreenPage;
window.closeMessagesFullscreenPage = function(pageName) {
    if (originalCloseMessagesFullscreenPage) {
        originalCloseMessagesFullscreenPage(pageName);
    }
    stopMessagesRealtimeUpdate();
};

// 绑定全局函数
window.currentMessageFilter = window.currentMessageFilter || 'all';
window.renderMessagesFullscreenPage = renderMessagesFullscreenPage;
window.markMessagesAsReadByType = markMessagesAsReadByType;
window.updateNavMessageBadge = updateNavMessageBadge;
window.clearMessagesByType = clearMessagesByType;
window.markAllRead = markAllRead;
window.openUserProfileFromMessage = openUserProfileFromMessage;
window.openUserProfileFromComment = openUserProfileFromComment;
window.updateMessageFilterBadges = updateMessageFilterBadges;
window.showMessagesFullscreen = showMessagesFullscreen;
window.openMessagesFullscreenPage = openMessagesFullscreenPage;
window.closeMessagesFullscreenPage = closeMessagesFullscreenPage;
window.startMessagesRealtimeUpdate = startMessagesRealtimeUpdate;
window.stopMessagesRealtimeUpdate = stopMessagesRealtimeUpdate;
// ✅ 新增：导出横条更新函数
window.updateMessageCenterBars = updateMessageCenterBars;

console.log('消息中心系统已加载');
