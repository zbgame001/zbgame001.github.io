// ==================== 私信系统 ====================

// 初始化私信系统状态
function initPrivateMessageSystem() {
    if (!gameState.privateMessageSystem) {
        gameState.privateMessageSystem = {
            conversations: [],      // 所有私信会话
            unreadCount: 0,         // 总未读数量
            lastCheckTime: 0,       // 上次检查时间
            generationInterval: null // 生成定时器
        };
    }
}

// 随机生成的私信内容库
const privateMessageTemplates = {
    positive: [
        { content: "主播你好厉害！我是你的忠实粉丝！", weight: 5 },
        { content: "感谢你的分享，对我帮助很大！", weight: 5 },
        { content: "姐姐可以带我一起做直播吗？", weight: 3 },
        { content: "你的视频真的太棒了！期待更新！", weight: 5 },
        { content: "从你这里学到了很多，真的谢谢你！", weight: 4 },
        { content: "主播的声音好好听，可以多发视频吗？", weight: 3 },
        { content: "我是新粉丝，请问可以请教问题吗？", weight: 4 },
        { content: "你的直播内容好有趣，我会一直支持你的！", weight: 5 },
        { content: "能不能教教我怎么剪辑视频？", weight: 3 },
        { content: "主播人美心善！为你打call！", weight: 4 },
        { content: "看了你的视频我决定也试试看！", weight: 4 },
        { content: "你的建议太实用了，已经成功涨粉了！", weight: 5 }
    ],
    negative: [
        { content: "你这个骗子！虚假宣传！", weight: 3 },
        { content: "取关了！内容越来越没质量", weight: 4 },
        { content: "就这？我还以为多厉害呢", weight: 3 },
        { content: "就知道接广告，还有良心吗？", weight: 4 },
        { content: "举报了，等着被封号吧！", weight: 2 },
        { content: "收钱办事的垃圾主播", weight: 3 },
        { content: "技术这么差还教别人？", weight: 3 },
        { content: "天天就知道卖惨骗礼物", weight: 3 },
        { content: "内容全是抄袭的，不要脸", weight: 2 },
        { content: "粉丝都是买的吧？笑死", weight: 3 },
        { content: "这么菜也配当主播？", weight: 3 },
        { content: "等着律师函吧，侵权了", weight: 1 },
        { content: "别信这个主播，是骗子", weight: 2 }
    ]
};

// 私信实时更新定时器（新增）
let privateMessagesUpdateInterval = null;
window.isPrivateMessageListOpen = false;

// 启动私信列表实时更新（新增）
function startPrivateMessagesRealtimeUpdate() {
    // 如果已经存在定时器，先停止
    if (privateMessagesUpdateInterval) {
        clearInterval(privateMessagesUpdateInterval);
    }
    
    // 每4秒更新一次私信列表（比消息中心稍慢，避免性能问题）
    privateMessagesUpdateInterval = setInterval(() => {
        // 只有在私信列表页面打开时才更新
        if (window.isPrivateMessageListOpen) {
            // 检查是否有新的私信
            const hasNewMessages = checkForNewPrivateMessages();
            
            if (hasNewMessages) {
                // 重新渲染私信列表
                if (typeof renderPrivateMessageList === 'function') {
                    renderPrivateMessageList();
                }
                
                // 更新导航栏徽章
                if (typeof updateNavMessageBadge === 'function') {
                    updateNavMessageBadge();
                }
                
                // 更新消息中心页面
                if (typeof showMessagesFullscreen === 'function') {
                    showMessagesFullscreen();
                }
            }
        }
    }, 4000);
    
    console.log('私信列表实时更新已启动');
}

// 停止私信列表实时更新（新增）
function stopPrivateMessagesRealtimeUpdate() {
    if (privateMessagesUpdateInterval) {
        clearInterval(privateMessagesUpdateInterval);
        privateMessagesUpdateInterval = null;
        console.log('私信列表实时更新已停止');
    }
}

// 检查是否有新的私信（新增）
function checkForNewPrivateMessages() {
    if (!gameState.privateMessageSystem || !gameState.privateMessageSystem.conversations) {
        return false;
    }
    
    // 检查最后更新时间
    const now = gameTimer;
    const timeDiff = now - gameState.privateMessageSystem.lastCheckTime;
    
    // 根据粉丝数量决定检查频率
    const baseCheckInterval = VIRTUAL_MINUTE_MS * 15; // 15虚拟分钟
    const fanBonus = Math.min(gameState.fans / 1000, 0.5); // 粉丝越多检查越频繁
    
    if (timeDiff < baseCheckInterval * (1 - fanBonus)) {
        return false;
    }
    
    // 更新最后检查时间
    gameState.privateMessageSystem.lastCheckTime = now;
    
    // 检查是否有未读消息
    const totalUnread = gameState.privateMessageSystem.conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
    
    return totalUnread > 0;
}

// 生成随机用户名
function generateRandomPrivateMessageUser() {
    const names = ['小可爱', '犀利评论家', '路人甲', '铁粉一号', '吃瓜群众',
        '热心网友', '匿名用户', '夜猫子', '正义使者', '老粉丝',
        '新关注者', '键盘侠', '小学生', '大学生', '打工人'];
    const avatarChars = ['萌', '酷', '帅', '美', '憨', '神', '迷', '暖', '冷', '呆'];
    
    return {
        username: names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 9999),
        avatar: avatarChars[Math.floor(Math.random() * avatarChars.length)]
    };
}

// 获取随机消息内容
function getRandomPrivateMessageContent() {
    const isPositive = Math.random() > 0.4; // 60%正面，40%负面
    const pool = isPositive ? privateMessageTemplates.positive : privateMessageTemplates.negative;
    
    // 按权重选择
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const item of pool) {
        random -= item.weight;
        if (random <= 0) {
            return { content: item.content, isPositive };
        }
    }
    
    return { content: pool[0].content, isPositive: isPositive };
}

// 生成新的私信消息
function generatePrivateMessage() {
    if (!gameState.privateMessageSystem) initPrivateMessageSystem();
    
    const system = gameState.privateMessageSystem;
    
    // 根据粉丝数量调整生成概率
    const baseProbability = 0.3;
    const fanBonus = Math.min(gameState.fans / 10000, 2); // 最多增加2倍概率
    if (Math.random() > baseProbability * fanBonus) return;
    
    const userData = generateRandomPrivateMessageUser();
    const messageData = getRandomPrivateMessageContent();
    
    // 查找是否已有该用户的会话
    let conversation = system.conversations.find(c => c.username === userData.username);
    
    if (!conversation) {
        conversation = {
            id: Date.now() + Math.random(),
            username: userData.username,
            avatar: userData.avatar,
            lastMessage: '',
            lastMessageTime: 0,
            unreadCount: 0,
            messages: [],
            isBlocked: false
        };
        system.conversations.push(conversation);
    }
    
    // 避免骚扰：单个用户最多未读5条就停止生成
    if (conversation.unreadCount >= 5) return;
    
    const newMessage = {
        id: Date.now(),
        content: messageData.content,
        time: gameTimer,
        isIncoming: true, // 粉丝发给主播
        isPositive: messageData.isPositive
    };
    
    conversation.messages.push(newMessage);
    conversation.lastMessage = messageData.content;
    conversation.lastMessageTime = gameTimer;
    conversation.unreadCount++;
    
    system.unreadCount++;
    
    // 更新UI（如果私信列表已打开）
    if (window.isPrivateMessageListOpen) {
        if (typeof updatePrivateMessageUI === 'function') {
            updatePrivateMessageUI();
        }
        if (typeof showMessagesFullscreen === 'function') {
            showMessagesFullscreen();
        }
    }
    
    saveGame();
    
    // 负面私信弹窗通知已删除
}

// 启动私信生成定时器
function startPrivateMessageGeneration() {
    if (!gameState.privateMessageSystem) initPrivateMessageSystem();
    
    // 先检查是否已存在定时器，避免重复创建
    if (gameState.privateMessageSystem.generationInterval) {
        console.log('私信生成定时器已存在，先清除旧定时器');
        clearInterval(gameState.privateMessageSystem.generationInterval);
    }
    
    // 每10-30秒检查一次
    gameState.privateMessageSystem.generationInterval = setInterval(() => {
        // 在隐私设置中可以有开关控制是否接收私信
        generatePrivateMessage();
    }, 15000); // 15秒一次
    
    console.log('私信生成定时器已启动');
}

// 停止私信生成
function stopPrivateMessageGeneration() {
    if (gameState.privateMessageSystem && gameState.privateMessageSystem.generationInterval) {
        clearInterval(gameState.privateMessageSystem.generationInterval);
        gameState.privateMessageSystem.generationInterval = null;
        console.log('私信生成定时器已停止');
    }
}

// 更新私信UI
function updatePrivateMessageUI() {
    if (!gameState.privateMessageSystem) return;
    
    const system = gameState.privateMessageSystem;
    
    // 更新导航栏私信按钮的未读数
    const privateBtn = document.getElementById('privateMessageNavBtn');
    if (privateBtn) {
        const unreadEl = privateBtn.querySelector('.private-unread-badge');
        if (unreadEl) {
            if (system.unreadCount > 0) {
                unreadEl.textContent = system.unreadCount > 99 ? '99+' : system.unreadCount;
                unreadEl.style.display = 'block';
            } else {
                unreadEl.style.display = 'none';
            }
        }
    }
    
    // 更新主页面消息导航栏的小红点（包含私信）
    updateNavMessageBadge();
}

// 显示私信列表（全屏）
function showPrivateMessageList() {
    // 标记私信列表为打开状态（新增）
    window.isPrivateMessageListOpen = true;
    
    // 启动实时更新（新增）
    startPrivateMessagesRealtimeUpdate();
    
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    const page = document.getElementById('privateMessagesPage');
    if (page) {
        page.classList.add('active');
        renderPrivateMessageList();
    }
}

// 渲染私信列表
function renderPrivateMessageList() {
    const content = document.getElementById('privateMessagesPageContent');
    if (!content) return;
    
    if (!gameState.privateMessageSystem || gameState.privateMessageSystem.conversations.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">还没有私信消息</div>';
        return;
    }
    
    // 按最后消息时间排序
    const conversations = [...gameState.privateMessageSystem.conversations]
        .sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    
    const listHtml = conversations.map(conv => {
        const timeAgo = formatTime(conv.lastMessageTime);
        const unreadStyle = conv.unreadCount > 0 ? 
            'border-left: 4px solid #ff0050; background: #222;' : '';
        const unreadBadge = conv.unreadCount > 0 ? 
            `<span style="background: #ff0050; color: #fff; border-radius: 10px; padding: 2px 6px; font-size: 10px; margin-left: 5px;">
                ${conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>` : '';
        
        const sentimentIcon = conv.messages.length > 0 && !conv.messages[conv.messages.length - 1].isPositive ? 
            '💢' : '💬';
        
        return `
            <div class="private-message-item" style="${unreadStyle}" onclick="openPrivateChat('${conv.username}')">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                    <div class="user-avatar" style="width: 48px; height: 48px; border-radius: 50%; 
                         background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         display: flex; align-items: center; justify-content: center; font-size: 18px;">
                        ${conv.avatar}
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <div style="font-weight: bold; font-size: 14px;">${conv.username}</div>
                            ${unreadBadge}
                        </div>
                        <div style="font-size: 12px; color: #999; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${sentimentIcon} ${conv.lastMessage}
                        </div>
                    </div>
                </div>
                <div style="font-size: 11px; color: #666; margin-left: 8px;">${timeAgo}</div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = `
        <div style="padding: 10px;">
            ${listHtml}
        </div>
    `;
}

// 清空所有私信
function clearAllPrivateMessages() {
    if (!gameState.privateMessageSystem || gameState.privateMessageSystem.conversations.length === 0) {
        showNotification('提示', '没有需要清理的私信');
        return;
    }
    
    // 显示确认对话框
    showConfirm('确定要清空所有私信吗？此操作不可恢复！', function(confirmed) {
        if (confirmed) {
            // 停止实时更新避免冲突
            stopPrivateMessagesRealtimeUpdate();
            
            // 清空所有会话
            gameState.privateMessageSystem.conversations = [];
            gameState.privateMessageSystem.unreadCount = 0;
            gameState.privateMessageSystem.lastCheckTime = gameTimer;
            
            // 保存游戏
            saveGame();
            
            // 更新UI
            updatePrivateMessageUI();
            updateNavMessageBadge();
            
            // 重新渲染列表（显示空状态）
            renderPrivateMessageList();
            
            // 显示成功通知
            showNotification('清理成功', '所有私信已清空');
            
            // 重新启动实时更新
            if (window.isPrivateMessageListOpen) {
                startPrivateMessagesRealtimeUpdate();
            }
        }
    });
}

// 打开私信聊天界面（保持静态，不启动实时更新）
function openPrivateChat(username) {
    // 标记私信列表为关闭状态（新增）
    window.isPrivateMessageListOpen = false;
    
    // 停止实时更新（新增）
    stopPrivateMessagesRealtimeUpdate();
    
    const page = document.getElementById('privateMessagesPage');
    page.classList.remove('active');
    
    const chatPage = document.getElementById('privateChatPage');
    chatPage.dataset.currentUser = username;
    chatPage.classList.add('active');
    
    // 标记未读消息为已读
    const system = gameState.privateMessageSystem;
    const conversation = system.conversations.find(c => c.username === username);
    if (conversation) {
        // 修复：将未读数清零
        system.unreadCount -= conversation.unreadCount;
        conversation.unreadCount = 0;
        updatePrivateMessageUI();
        saveGame();
    }
    
    renderPrivateChat(username);
}

// 渲染聊天界面（保持静态，不添加实时更新）
function renderPrivateChat(username) {
    const content = document.getElementById('privateChatPageContent');
    if (!content) return;
    
    const system = gameState.privateMessageSystem;
    const conversation = system.conversations.find(c => c.username === username);
    
    if (!conversation) return;
    
    const messagesHtml = conversation.messages.map(msg => {
        const isIncoming = msg.isIncoming;
        const isPositive = msg.isPositive;
        
        const messageStyle = isIncoming ? 
            'background: #222; border: 1px solid #333;' : 
            'background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); color: #000;';
        
        const avatar = isIncoming ? conversation.avatar : gameState.avatar;
        
        return `
            <div style="display: flex; ${isIncoming ? 'justify-content: flex-start;' : 'justify-content: flex-end;'} margin-bottom: 15px;">
                ${isIncoming ? `
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         display: flex; align-items: center; justify-content: center; font-size: 14px; margin-right: 10px; flex-shrink: 0;">
                        ${avatar}
                    </div>
                ` : ''}
                <div style="${messageStyle} padding: 10px 12px; border-radius: 12px; max-width: 70%; font-size: 14px; line-height: 1.4;">
                    ${msg.content}
                    <div style="font-size: 10px; opacity: 0.7; margin-top: 4px; text-align: ${isIncoming ? 'left' : 'right'};">
                        ${formatTime(msg.time)}
                    </div>
                </div>
                ${!isIncoming ? `
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); 
                         display: flex; align-items: center; justify-content: center; font-size: 14px; margin-left: 10px; flex-shrink: 0; color: #000;">
                        ${avatar}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    content.innerHTML = `
        <div style="padding: 10px; height: calc(100% - 80px); overflow-y: auto;">
            ${messagesHtml}
        </div>
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #161823; border-top: 1px solid #333; padding: 10px;">
            <div style="display: flex; gap: 10px;">
                <input type="text" id="privateMessageInput" placeholder="回复 ${username}..." 
                       style="flex: 1; background: #222; border: 1px solid #333; color: #fff; border-radius: 20px; padding: 10px 15px; font-size: 14px;">
                <button onclick="sendPrivateMessage('${username}')" 
                        style="background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); color: #000; border: none; border-radius: 50%; width: 44px; height: 44px; cursor: pointer; font-size: 16px;">
                    ➤
                </button>
            </div>
        </div>
    `;
    
    // 滚动到底部
    setTimeout(() => {
        const scrollArea = content.querySelector('div[style*="overflow-y"]');
        if (scrollArea) {
            scrollArea.scrollTop = scrollArea.scrollHeight;
        }
    }, 100);
}

// 发送私信回复
function sendPrivateMessage(username) {
    const input = document.getElementById('privateMessageInput');
    const content = input.value.trim();
    if (!content) return;
    
    const system = gameState.privateMessageSystem;
    const conversation = system.conversations.find(c => c.username === username);
    
    if (!conversation) return;
    
    const newMessage = {
        id: Date.now(),
        content: content,
        time: gameTimer,
        isIncoming: false, // 主播发送给粉丝
        isPositive: true
    };
    
    conversation.messages.push(newMessage);
    conversation.lastMessage = content;
    conversation.lastMessageTime = gameTimer;
    
    input.value = '';
    
    renderPrivateChat(username);
    saveGame();
    
    showNotification('私信已发送', '你的回复已发送给 ' + username);
}

// 关闭私信列表（新增停止更新）
function closePrivateMessageList() {
    // 标记私信列表为关闭状态（新增）
    window.isPrivateMessageListOpen = false;
    
    // 停止实时更新（新增）
    stopPrivateMessagesRealtimeUpdate();
    
    document.getElementById('privateMessagesPage').classList.remove('active');
    
    const activeFullscreenPages = document.querySelectorAll('.fullscreen-page.active');
    if (activeFullscreenPages.length === 0) {
        document.getElementById('mainContent').style.display = 'block';
        document.querySelector('.bottom-nav').style.display = 'flex';
    }
    
    // 更新显示
    updateDisplay();
}

// 关闭聊天界面
function closePrivateChat() {
    document.getElementById('privateChatPage').classList.remove('active');
    document.getElementById('privateChatPage').dataset.currentUser = '';
    
    // ✅ 重要：返回列表时重新启动实时更新
    showPrivateMessageList();
}

// 在游戏加载时初始化
function initPrivateMessageOnGameLoad() {
    initPrivateMessageSystem();
    startPrivateMessageGeneration();
}

// 保存时清理旧消息（保留最近100条）
function cleanupPrivateMessages() {
    if (!gameState.privateMessageSystem) return;
    
    gameState.privateMessageSystem.conversations.forEach(conv => {
        if (conv.messages.length > 100) {
            conv.messages = conv.messages.slice(-100);
        }
    });
    
    // 清理空会话
    gameState.privateMessageSystem.conversations = gameState.privateMessageSystem.conversations.filter(
        conv => conv.messages.length > 0
    );
}

// ==================== 全局函数绑定 ====================
window.initPrivateMessageSystem = initPrivateMessageSystem;
window.showPrivateMessageList = showPrivateMessageList;
window.closePrivateMessageList = closePrivateMessageList;
window.openPrivateChat = openPrivateChat;
window.closePrivateChat = closePrivateChat;
window.sendPrivateMessage = sendPrivateMessage;
window.updatePrivateMessageUI = updatePrivateMessageUI;
window.startPrivateMessageGeneration = startPrivateMessageGeneration;
window.stopPrivateMessageGeneration = stopPrivateMessageGeneration;
window.initPrivateMessageOnGameLoad = initPrivateMessageOnGameLoad;
window.cleanupPrivateMessages = cleanupPrivateMessages;
// ✅ 新增：导出实时更新相关函数
window.startPrivateMessagesRealtimeUpdate = startPrivateMessagesRealtimeUpdate;
window.stopPrivateMessagesRealtimeUpdate = stopPrivateMessagesRealtimeUpdate;
window.checkForNewPrivateMessages = checkForNewPrivateMessages;
// ✅ 新增：导出清空私信函数
window.clearAllPrivateMessages = clearAllPrivateMessages;

console.log('私信系统模块已加载');
