// ==================== 账号设置 ====================
function showSettings() {
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    const content = document.getElementById('settingsPageContent');
    
    const doNotDisturbStatus = gameState.doNotDisturb ? '已开启' : '已关闭';
    const doNotDisturbStatusColor = gameState.doNotDisturb ? '#ff6b00' : '#999';
    
    // ✅ 检查是否被封号，如果是则显示警告并禁用修改功能
    if (gameState.isBanned) {
        content.innerHTML = `
            <div style="background: #ff0050; color: #fff; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">🚫 账号已被封禁</div>
                <div style="font-size: 14px;">封禁期间无法修改账号信息</div>
                <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">剩余封禁天数：<span id="settingsBanDays">${gameState.banDaysCount}</span>天</div>
            </div>
            <div class="settings-item" style="opacity: 0.5; cursor: not-allowed;">
                <div><div class="settings-label">修改昵称</div><div class="settings-value">${gameState.username}</div></div>
                <div>🔒</div>
            </div>
            <div class="settings-item" style="opacity: 0.5; cursor: not-allowed;">
                <div><div class="settings-label">用户ID</div><div class="settings-value">${gameState.userId}</div></div>
                <div>🔒</div>
            </div>
            <div class="settings-item" style="opacity: 0.5; cursor: not-allowed;">
                <div><div class="settings-label">修改头像文字</div><div class="settings-value">封禁中</div></div>
                <div>🔒</div>
            </div>
            <div class="settings-item" style="opacity: 0.5; cursor: not-allowed;">
                <div><div class="settings-label">上传头像图片</div><div class="settings-value" style="color: #999;">封禁中</div></div>
                <div>🔒</div>
            </div>
            <div class="settings-item" onclick="toggleDoNotDisturb()" style="background: ${gameState.doNotDisturb ? '#1a2a1a' : '#161823'}; border: ${gameState.doNotDisturb ? '1px solid #00f2ea' : '1px solid #333'};">
                <div>
                    <div class="settings-label" style="color: ${gameState.doNotDisturb ? '#00f2ea' : '#fff'};">🔕 消息免打扰</div>
                    <div class="settings-value" style="color: ${doNotDisturbStatusColor}; font-weight: ${gameState.doNotDisturb ? 'bold' : 'normal'};">
                        ${doNotDisturbStatus}
                    </div>
                </div>
                <div style="font-size: 20px; color: ${gameState.doNotDisturb ? '#00f2ea' : '#666'};">
                    ${gameState.doNotDisturb ? '🔕' : '🔔'}
                </div>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="settings-item" onclick="changeUsername()">
                <div><div class="settings-label">修改昵称</div><div class="settings-value">${gameState.username}</div></div>
                <div>></div>
            </div>
            <div class="settings-item" onclick="changeUserId()">
                <div><div class="settings-label">用户ID</div><div class="settings-value">${gameState.userId}</div></div>
                <div>></div>
            </div>
            <div class="settings-item" onclick="changeAvatar()">
                <div><div class="settings-label">修改头像文字</div><div class="settings-value">点击修改</div></div>
                <div>></div>
            </div>
            <div class="settings-item" onclick="uploadAvatar()">
                <div><div class="settings-label">上传头像图片</div><div class="settings-value" style="color: #667aea;">选择图片</div></div>
                <div>📷</div>
            </div>
            <div class="settings-item" onclick="toggleDoNotDisturb()" style="background: ${gameState.doNotDisturb ? '#1a2a1a' : '#161823'}; border: ${gameState.doNotDisturb ? '1px solid #00f2ea' : '1px solid #333'};">
                <div>
                    <div class="settings-label" style="color: ${gameState.doNotDisturb ? '#00f2ea' : '#fff'};">🔕 消息免打扰</div>
                    <div class="settings-value" style="color: ${doNotDisturbStatusColor}; font-weight: ${gameState.doNotDisturb ? 'bold' : 'normal'};">
                        ${doNotDisturbStatus}
                    </div>
                </div>
                <div style="font-size: 20px; color: ${gameState.doNotDisturb ? '#00f2ea' : '#666'};">
                    ${gameState.doNotDisturb ? '🔕' : '🔔'}
                </div>
            </div>
        `;
    }
    
    const headerTitle = document.getElementById('settingsHeaderTitle');
    if (headerTitle) {
        headerTitle.textContent = '账号设置';
    }
    
    document.getElementById('settingsPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

function toggleDoNotDisturb() {
    gameState.doNotDisturb = !gameState.doNotDisturb;
    saveGame();
    showSettings();
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    const status = gameState.doNotDisturb ? '已开启' : '已关闭';
    const icon = gameState.doNotDisturb ? '🔕' : '🔔';
    showEventPopup(`${icon} 消息免打扰`, `消息小红点提醒${status}`);
}

// ==================== 个人主页（翻新Mod整合版 - 修复作品点击） ====================
const PROFILE_CONFIG = {
    worksPerPage: 5,
    avatarSize: 65,
    categories: [
        { id: 'all', name: '作品', icon: '📁' },
        { id: 'video', name: '视频', icon: '🎬' },
        { id: 'post', name: '动态', icon: '📝' },
        { id: 'live', name: '直播', icon: '📱' }
    ]
};

let profileCurrentCategory = 'all';
let profileCurrentPage = 1;

window.profileWorksCache = {};

function calculateProfileStats() {
    const works = gameState.worksList || [];
    return {
        total: works.length,
        video: works.filter(w => w.type === 'video').length,
        post: works.filter(w => w.type === 'post').length,
        live: works.filter(w => w.type === 'live').length,
        likes: gameState.likes || 0,
        following: (gameState.following || []).length,
        fans: gameState.fans || 0
    };
}

function generateProfileWorkBadges(work) {
    if (typeof window.generateStatusBadges === 'function') {
        return window.generateStatusBadges(work);
    }
    const badges = [];
    if (work.isRecommended) {
        badges.push({ text: '🔥推荐', style: 'background:linear-gradient(135deg, #00f2ea 0%, #667eea 100%);color:#000;' });
    }
    if (work.isHot || work.isHotSearchWork) {
        badges.push({ text: '🔥热搜', style: 'background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;' });
    }
    if (work.isRaffle) {
        badges.push({ text: '🎁抽奖', style: 'background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;' });
    }
    if (work.isControversial) {
        badges.push({ text: '⚠️争议', style: 'background:linear-gradient(135deg, #ff6b00 0%, #ff0050 100%);color:#fff;' });
    }
    return badges;
}

function renderProfileWorkCard(work) {
    window.profileWorksCache[work.id] = work;
    
    const badges = generateProfileWorkBadges(work);
    const statusHtml = badges.map(badge => `
        <span style="${badge.style}animation:glow 2s infinite;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;display:inline-block;">
            ${badge.text}
        </span>
    `).join('');
    
    const typeIcon = work.type === 'video' ? '🎬' : work.type === 'live' ? '📱' : '📝';
    const viewIcon = work.type === 'post' ? '👁️' : '▶️';
    
    // ✅ 检查是否被封号且作品是被封禁时私密的，如果是则显示锁定状态且不可点击
    const isLocked = gameState.isBanned && work.isPrivate && gameState.preBanPublicWorks.includes(work.id);
    const clickAction = isLocked ? '' : `onclick="openProfileWorkDetail(${work.id})"`;
    const cursorStyle = isLocked ? 'cursor: not-allowed; opacity: 0.6;' : 'cursor: pointer;';
    const lockIcon = isLocked ? '<div style="position: absolute; top: 10px; right: 10px; background: #ff0050; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">🔒 封禁锁定</div>' : '';
    
    return `
        <div class="profile-work-item" 
             ${clickAction}
             style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 10px; ${cursorStyle} transition: all 0.2s; border: 1px solid #222; user-select: none; -webkit-tap-highlight-color: transparent; touch-action: manipulation; position: relative;">
            ${lockIcon}
            ${statusHtml ? `<div style="margin-bottom:8px;">${statusHtml}</div>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="background: ${work.type === 'video' ? '#667eea' : work.type === 'live' ? '#ff0050' : '#00f2ea'}; padding: 3px 8px; border-radius: 5px; font-size: 12px;">
                    ${typeIcon} ${work.type === 'video' ? '视频' : work.type === 'live' ? '直播' : '动态'}
                    ${work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">🔒</span>' : ''}
                </span>
                <span style="font-size: 12px; color: #999;">
                    ${formatTime(work.time)}
                    ${work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : ''}
                </span>
            </div>
            <div style="margin-bottom: 10px; line-height: 1.5; word-wrap: break-word; ${work.isPrivate ? 'opacity: 0.7;' : ''}">
                ${work.content}
            </div>
            <div style="display: flex; gap: 15px; font-size: 12px; color: #999;">
                <span>${viewIcon} ${formatNumber(work.views)}</span>
                <span>❤️ ${formatNumber(work.likes)}</span>
                <span>💬 ${formatNumber(work.comments || 0)}</span>
                <span>🔄 ${formatNumber(work.shares)}</span>
            </div>
        </div>
    `;
}

// ✅ 关键修复：打开作品详情前先关闭个人主页
window.openProfileWorkDetail = function(workId) {
    console.log('点击作品ID:', workId);
    
    // ✅ 检查是否被封号且作品是被锁定的
    const work = gameState.worksList.find(w => w.id === workId);
    if (work && gameState.isBanned && work.isPrivate && gameState.preBanPublicWorks.includes(work.id)) {
        showAlert('封禁期间，被私密的作品无法查看', '账号封禁中');
        return;
    }
    
    if (!work) {
        console.error('未找到作品:', workId);
        const foundWork = gameState.worksList.find(w => w.id === workId);
        if (foundWork) {
            console.log('从gameState找到作品:', foundWork.id);
            closeProfilePage(); // 关闭个人主页
            if (typeof showWorkDetail === 'function') {
                showWorkDetail(foundWork);
            } else {
                showAlert('作品详情功能加载失败，请刷新页面', '错误');
            }
        } else {
            showAlert('作品数据丢失，请刷新页面重试', '错误');
        }
        return;
    }
    
    console.log('找到作品:', work.id, work.content.substring(0, 20));
    
    // ✅ 关键：先关闭个人主页，否则会被遮挡
    closeProfilePage();
    
    // 延迟一点确保页面关闭动画完成
    setTimeout(() => {
        if (typeof showWorkDetail === 'function') {
            showWorkDetail(work);
        } else {
            console.error('showWorkDetail函数未定义');
            showAlert('作品详情功能未加载，请刷新页面', '错误');
        }
    }, 50);
};

// ✅ 新增：专门关闭个人主页的函数
function closeProfilePage() {
    const profilePage = document.getElementById('profilePage');
    if (profilePage) {
        profilePage.classList.remove('active');
    }
    // 恢复主内容显示（但showWorkDetail会再次隐藏它）
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
}

function renderProfilePagination(currentPage, totalPages, totalWorks) {
    if (totalPages <= 1) return '';
    
    let html = `<button onclick="changeProfilePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}
                    style="background: #222; border: 1px solid #333; color: #ccc; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin: 0 2px; opacity: ${currentPage === 1 ? '0.5' : '1'};">‹</button>`;
    
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    
    if (start > 1) {
        html += `<button onclick="changeProfilePage(1)" style="background: #222; border: 1px solid #333; color: #ccc; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin: 0 2px;">1</button>`;
        if (start > 2) html += `<span style="color: #666; padding: 0 5px;">...</span>`;
    }
    
    for (let i = start; i <= end; i++) {
        const isActive = i === currentPage;
        html += `<button onclick="changeProfilePage(${i})" 
                        style="background: ${isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#222'}; 
                               border: 1px solid ${isActive ? '#667eea' : '#333'}; 
                               color: ${isActive ? '#fff' : '#ccc'}; 
                               padding: 8px 12px; border-radius: 6px; cursor: pointer; margin: 0 2px; font-weight: ${isActive ? 'bold' : 'normal'};">${i}</button>`;
    }
    
    if (end < totalPages) {
        if (end < totalPages - 1) html += `<span style="color: #666; padding: 0 5px;">...</span>`;
        html += `<button onclick="changeProfilePage(${totalPages})" style="background: #222; border: 1px solid #333; color: #ccc; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin: 0 2px;">${totalPages}</button>`;
    }
    
    html += `<button onclick="changeProfilePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}
                    style="background: #222; border: 1px solid #333; color: #ccc; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin: 0 2px; opacity: ${currentPage === totalPages ? '0.5' : '1'};">›</button>`;
    
    const startItem = totalWorks > 0 ? (currentPage - 1) * PROFILE_CONFIG.worksPerPage + 1 : 0;
    const endItem = Math.min(currentPage * PROFILE_CONFIG.worksPerPage, totalWorks);
    html += `<span style="margin-left: 10px; font-size: 12px; color: #999;">${startItem}-${endItem} / ${totalWorks}</span>`;
    
    return html;
}

function getProfileFilteredWorks() {
    let works = [...(gameState.worksList || [])].sort((a, b) => (b.time || 0) - (a.time || 0));
    if (profileCurrentCategory !== 'all') {
        works = works.filter(w => w.type === profileCurrentCategory);
    }
    return works;
}

window.changeProfileCategory = function(category) {
    profileCurrentCategory = category;
    profileCurrentPage = 1;
    updateProfileCategoryTabs();
    renderProfileWorksList();
};

function updateProfileCategoryTabs() {
    const container = document.getElementById('profileCategoryTabs');
    if (!container) return;
    
    const stats = calculateProfileStats();
    
    container.innerHTML = PROFILE_CONFIG.categories.map(cat => {
        const count = cat.id === 'all' ? stats.total : 
                     cat.id === 'video' ? stats.video : 
                     cat.id === 'post' ? stats.post : stats.live;
        const isActive = profileCurrentCategory === cat.id;
        return `
            <div onclick="changeProfileCategory('${cat.id}')" 
                 style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 5px 0; position: relative;">
                <span style="font-size: 14px; color: ${isActive ? '#fff' : '#666'}; font-weight: ${isActive ? 'bold' : 'normal'};">
                    ${cat.name}
                </span>
                <span style="font-size: 16px; font-weight: bold; color: ${isActive ? '#667eea' : '#999'};">
                    ${formatNumber(count)}
                </span>
                ${isActive ? `<div style="position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #667eea, #00f2ea); border-radius: 2px;"></div>` : ''}
            </div>
        `;
    }).join('');
}

function renderProfileWorksList() {
    const container = document.getElementById('profileWorksList');
    const paginationContainer = document.getElementById('profilePagination');
    
    if (!container) return;
    
    const works = getProfileFilteredWorks();
    const totalWorks = works.length;
    
    if (totalWorks === 0) {
        container.innerHTML = `<div style="text-align: center; color: #666; padding: 40px;">暂无${profileCurrentCategory === 'all' ? '' : PROFILE_CONFIG.categories.find(c => c.id === profileCurrentCategory).name}作品</div>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    
    const totalPages = Math.ceil(totalWorks / PROFILE_CONFIG.worksPerPage);
    if (profileCurrentPage > totalPages) profileCurrentPage = totalPages;
    
    const start = (profileCurrentPage - 1) * PROFILE_CONFIG.worksPerPage;
    const pageWorks = works.slice(start, start + PROFILE_CONFIG.worksPerPage);
    
    window.profileWorksCache = {};
    
    container.innerHTML = pageWorks.map(work => renderProfileWorkCard(work)).join('');
    
    if (paginationContainer) {
        paginationContainer.innerHTML = renderProfilePagination(profileCurrentPage, totalPages, totalWorks);
    }
}

window.changeProfilePage = function(page) {
    const works = getProfileFilteredWorks();
    const totalPages = Math.ceil(works.length / PROFILE_CONFIG.worksPerPage);
    if (page < 1 || page > totalPages) return;
    profileCurrentPage = page;
    renderProfileWorksList();
    const listContainer = document.getElementById('profileWorksList');
    if (listContainer) listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function renderProfileContent() {
    const content = document.getElementById('profilePageContent');
    if (!content) return;
    
    const stats = calculateProfileStats();
    
    // ✅ 检查是否被封号，如果是则显示"账号封禁中！"
    const banWarningHtml = gameState.isBanned ? `
        <div style="background: #ff0050; color: #fff; padding: 10px; text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 15px; border-radius: 8px; animation: pulse 2s infinite;">
            🚫 账号封禁中！
        </div>
    ` : '';
    
    content.innerHTML = `
        <div style="padding: 0; animation: fadeIn 0.3s ease;">
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #ff6b00 50%, #ff0050 75%, #667eea 100%); 
                        background-size: 400% 400%;
                        animation: dynamicGradient 8s ease infinite;
                        padding: 25px 20px; 
                        margin: 0; 
                        display: flex; 
                        align-items: center;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);">
                
                <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; 
                            background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
                            animation: shimmer 3s infinite;
                            pointer-events: none;"></div>
                
                <div style="width: ${PROFILE_CONFIG.avatarSize}px; height: ${PROFILE_CONFIG.avatarSize}px; border-radius: 50%; 
                            background: rgba(255,255,255,0.2); backdrop-filter: blur(10px);
                            display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; 
                            margin-right: 18px; flex-shrink: 0; overflow: hidden; border: 2px solid rgba(255,255,255,0.4); 
                            box-shadow: 0 0 20px rgba(0,0,0,0.2);
                            position: relative; z-index: 1;">
                    ${gameState.avatarImage ? 
                        `<img src="${gameState.avatarImage}" style="width:100%;height:100%;object-fit:cover;">` : 
                        (gameState.avatar || '👤')
                    }
                </div>
                
                <div style="flex: 1; min-width: 0; position: relative; z-index: 1;">
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #fff; 
                                text-shadow: 0 2px 4px rgba(0,0,0,0.3); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                        ${gameState.username || '未命名主播'}
                    </div>
                    <div style="font-size: 11px; color: rgba(255,255,255,0.9); font-family: monospace; letter-spacing: 1px;">
                        UID: ${gameState.userId || '000000000'}
                    </div>
                </div>
            </div>
            
            <div style="padding: 20px; display: flex; justify-content: space-around; align-items: center; gap: 10px; flex-wrap: nowrap;">
                <div style="display: flex; align-items: center; gap: 6px; min-width: fit-content;">
                    <span style="font-size: 14px; color: #999; white-space: nowrap;">点赞</span>
                    <span style="font-size: 18px; font-weight: bold; color: #00f2ea; white-space: nowrap;">${formatNumber(stats.likes)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; min-width: fit-content;">
                    <span style="font-size: 14px; color: #999; white-space: nowrap;">关注</span>
                    <span style="font-size: 18px; font-weight: bold; color: #667eea; white-space: nowrap;">${formatNumber(stats.following)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; min-width: fit-content;">
                    <span style="font-size: 14px; color: #999; white-space: nowrap;">粉丝</span>
                    <span style="font-size: 18px; font-weight: bold; color: #ff0050; white-space: nowrap;">${formatNumber(stats.fans)}</span>
                </div>
            </div>
            
            ${banWarningHtml}
            
            <div id="profileCategoryTabs" style="padding: 0 20px 20px 20px; display: flex; justify-content: flex-start; align-items: center; gap: 25px; flex-wrap: wrap;">
                ${PROFILE_CONFIG.categories.map(cat => {
                    const count = cat.id === 'all' ? stats.total : 
                                 cat.id === 'video' ? stats.video : 
                                 cat.id === 'post' ? stats.post : stats.live;
                    const isActive = profileCurrentCategory === cat.id;
                    return `
                        <div onclick="changeProfileCategory('${cat.id}')" 
                             style="display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 5px 0; position: relative;">
                            <span style="font-size: 14px; color: ${isActive ? '#fff' : '#666'}; font-weight: ${isActive ? 'bold' : 'normal'};">
                                ${cat.name}
                            </span>
                            <span style="font-size: 16px; font-weight: bold; color: ${isActive ? '#667eea' : '#999'};">
                                ${formatNumber(count)}
                            </span>
                            ${isActive ? `<div style="position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #667eea, #00f2ea); border-radius: 2px;"></div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div style="padding: 0 15px 20px 15px;">
                <div id="profileWorksList" style="min-height: 200px;">
                    <div style="text-align: center; color: #666; padding: 40px;">加载中...</div>
                </div>
                <div id="profilePagination" style="display: flex; justify-content: center; align-items: center; margin-top: 20px; flex-wrap: wrap;"></div>
            </div>
            
        </div>
    `;
    
    addProfileStyles();
    renderProfileWorksList();
}

function addProfileStyles() {
    if (document.getElementById('profileRedesignStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'profileRedesignStyles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes dynamicGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .profile-work-item:hover {
            background: #1a1a2e !important;
            border-color: #667eea !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        
        .profile-work-item:active {
            opacity: 0.8;
            transform: scale(0.98);
        }
    `;
    document.head.appendChild(style);
}

function showProfile() {
    profileCurrentCategory = 'all';
    profileCurrentPage = 1;
    
    renderProfileContent();
    
    const profilePage = document.getElementById('profilePage');
    if (profilePage) profilePage.classList.add('active');
    
    const mainContent = document.getElementById('mainContent');
    const bottomNav = document.querySelector('.bottom-nav');
    if (mainContent) mainContent.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
}

window.cachedUserProfile = null;

function showUserProfile(username, avatar) {
    if (window.cachedUserProfile && window.cachedUserProfile.username === username) {
        renderUserProfile(window.cachedUserProfile);
        return;
    }
    
    const fromFollowing = gameState.following.find(u => 
        (typeof u === 'object' ? u.username : u) === username
    );
    
    if (fromFollowing && typeof fromFollowing === 'object') {
        window.cachedUserProfile = fromFollowing;
        renderUserProfile(fromFollowing);
        return;
    }
    
    // ✅ 修改：UID生成改为纯数字（9位随机数）
    const profileData = {
        username: username,
        avatar: avatar,
        userId: Math.floor(Math.random() * 900000000 + 100000000).toString(),
        joinDays: Math.floor(Math.random() * 365) + 1,
        fanCount: Math.floor(Math.random() * 50000) + 100,
        workCount: Math.floor(Math.random() * 500) + 10,
        likeCount: Math.floor(Math.random() * 100000) + 1000,
        following: Math.floor(Math.random() * 500) + 50,
        bio: getRandomUserBio(),
        isFollowing: false
    };
    
    window.cachedUserProfile = profileData;
    renderUserProfile(profileData);
}

function renderUserProfile(profileData) {
    const content = document.getElementById('userProfilePageContent');
    if (!content) {
        console.error('用户主页内容容器未找到');
        return;
    }
    
    const avatarHtml = profileData.avatar ? 
        `<div class="user-profile-avatar">${profileData.avatar}</div>` :
        `<div class="user-profile-avatar">?</div>`;
    
    const isFollowing = gameState.following.some(u => 
        (typeof u === 'object' ? u.username : u) === profileData.username
    );
    
    const followBtnHtml = `<button class="btn" onclick="toggleFollow('${profileData.username}')" 
                           style="width:100%;margin-top:15px;background:${isFollowing ? '#666' : '#667eea'};cursor:${isFollowing ? 'default' : 'pointer'};"
                           ${isFollowing ? 'disabled' : ''}>
                           ${isFollowing ? '✓ 已关注' : '➕ 关注'}
                       </button>`;
    
    content.innerHTML = `
        <div style="text-align:center;padding:20px">
            ${avatarHtml}
            <div class="user-profile-name">${profileData.username}</div>
            <div class="user-profile-id">${profileData.userId}</div>
            
            <div class="user-profile-stats" style="margin-bottom: 20px;">
                <div class="user-profile-stat">
                    <div class="user-profile-stat-value">${formatNumber(profileData.fanCount)}</div>
                    <div class="user-profile-stat-label">粉丝</div>
                </div>
                <div class="user-profile-stat">
                    <div class="user-profile-stat-value">${formatNumber(profileData.following)}</div>
                    <div class="user-profile-stat-label">关注</div>
                </div>
                <div class="user-profile-stat">
                    <div class="user-profile-stat-value">${formatNumber(profileData.workCount)}</div>
                    <div class="user-profile-stat-label">作品</div>
                </div>
                <div class="user-profile-stat">
                    <div class="user-profile-stat-value">${formatNumber(profileData.likeCount)}</div>
                    <div class="user-profile-stat-label">获赞</div>
                </div>
            </div>
            
            <div class="user-profile-info" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #999;">加入平台</span>
                    <span style="font-weight: bold;">${profileData.joinDays}天</span>
                </div>
            </div>
            
            <div class="user-profile-bio">
                <div class="user-profile-bio-title">简介</div>
                <div class="user-profile-bio-content">${profileData.bio}</div>
            </div>
            
            ${followBtnHtml}
            
            <button class="btn btn-secondary" onclick="closeFullscreenPage('userProfile')" style="margin-top: 10px;">关闭</button>
        </div>
    `;
    
    document.getElementById('userProfilePage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

function showAllWorks() {
    if (typeof closeFullscreenPage === 'function') {
        closeFullscreenPage('profile');
    }
    
    setTimeout(() => {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const worksTab = document.querySelector('.nav-item:nth-child(2)');
        if (worksTab) {
            worksTab.classList.add('active');
        }
        
        document.getElementById('mainContent').style.display = 'block';
        document.querySelector('.bottom-nav').style.display = 'flex';
        
        document.querySelectorAll('.main-content-section').forEach(el => el.style.display = 'none');
        
        document.getElementById('worksContent').style.display = 'block';
        
        if (typeof showWorksFullscreen === 'function') {
            showWorksFullscreen();
        }
        
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    }, 100);
}

// ==================== 同步成就系统（已更新至包含等级和新成就） ====================
function showAchievementsFullscreen() {
    // 在显示前进行一次成就检查，确保最新状态
    checkAchievements();

    const content = document.getElementById('achievementsListTab');
    if (!content) return;
    
    // 确保成就点数已初始化
    if (gameState.achievementPoints === undefined) {
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        gameState.achievementPoints = unlockedCount * 10;
    }
    
    // 计算成就等级（点数/10向下取整）
    const points = gameState.achievementPoints || 0;
    const level = Math.floor(points / 10);
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    
    // 等级显示区域
    const levelHtml = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 10px; padding: 15px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            <div style="font-size: 12px; color: rgba(255,255,255,0.9); margin-bottom: 5px;">成就等级</div>
            <div style="font-size: 32px; font-weight: bold; color: #fff; line-height: 1.2;">Lv.${level}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 5px;">${unlockedCount}/${totalCount} 已解锁 | 点数 ${points}</div>
        </div>
    `;
    
    const progressMap = {
        1: { current: () => gameState.fans || 0, target: 1 },
        2: { current: () => gameState.fans || 0, target: 1000 },
        3: { current: () => gameState.fans || 0, target: 100000 },
        4: { current: () => gameState.fans || 0, target: 10000000 },
        5: { 
            current: () => {
                const videoWorks = gameState.worksList.filter(w => !w.isPrivate && (w.type === 'video' || w.type === 'live'));
                return videoWorks.length > 0 ? Math.max(...videoWorks.map(w => w.views), 0) : 0;
            }, 
            target: 1000000 
        },
        6: { current: () => gameState.likes || 0, target: 100000 },
        7: { current: () => gameState.worksList.length, target: 100 },
        8: { 
            current: () => {
                const liveWorks = gameState.worksList.filter(w => !w.isPrivate && w.type === 'live');
                return liveWorks.length > 0 ? Math.max(...liveWorks.map(w => w.views), 0) : 0;
            }, 
            target: 1000 
        },
        9: { current: () => gameState.money || 0, target: 1 },
        10: { current: () => gameState.money || 0, target: 1000000 },
        11: { 
            current: () => {
                const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
                return publicWorks.length > 0 ? Math.max(...publicWorks.map(w => w.shares || 0), 0) : 0;
            }, 
            target: 10000 
        },
        12: { 
            current: () => {
                const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
                return publicWorks.length > 0 ? Math.max(...publicWorks.map(w => w.comments || 0), 0) : 0;
            }, 
            target: 5000 
        },
        13: { 
            current: () => {
                if (!gameState.gameStartTime || gameState.gameStartTime <= 0) return 0;
                const now = Date.now();
                const days = Math.floor((now - gameState.gameStartTime) / (24 * 60 * 60 * 1000));
                return Math.max(0, days);
            }, 
            target: 30 
        },
        14: { current: () => 0, target: 1 },
        15: { current: () => gameState.eventCount || 0, target: 50 },
        16: { current: () => (gameState.following && gameState.following.length) || 0, target: 1000 },
        17: { 
            current: () => {
                if (!gameState.liveHistory) return 0;
                return gameState.liveHistory.filter(live => live.startVirtualHour === 3).length;
            }, 
            target: 1 
        },
        18: { 
            current: () => {
                if (!gameState.liveHistory) return 0;
                return gameState.liveHistory.filter(live => live.startVirtualHour === 6).length;
            }, 
            target: 1 
        },
        19: { current: () => gameState.commentRepliesCount || 0, target: 1000 },
        20: { 
            current: () => {
                const otherAchievements = achievements.filter(a => a.id !== 20);
                return otherAchievements.filter(a => a.unlocked).length;
            }, 
            target: () => achievements.filter(a => a.id !== 20).length
        },
        21: { current: () => gameState.worksList.filter(w => w.isAd && !w.isPrivate).length, target: 1 },
        22: { current: () => gameState.worksList.filter(w => w.isAd && !w.isPrivate).length, target: 10 },
        23: { 
            current: () => {
                const adWorks = gameState.worksList.filter(w => w.isAd && !w.isPrivate);
                const revenues = adWorks.map(w => w.revenue || 0);
                return revenues.length > 0 ? Math.max(...revenues) : 0;
            }, 
            target: 50000 
        },
        24: { current: () => gameState.rejectedAdOrders || 0, target: 5 },
        25: { 
            current: () => {
                const adWorksCount = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length;
                const warningsCount = gameState.warnings || 0;
                if (adWorksCount >= 50 && warningsCount < 5) return 50;
                return Math.min(adWorksCount, 49);
            }, 
            target: 50 
        },
        26: { current: () => gameState.worksList.filter(w => w.isAd && w.adOrder && !w.adOrder.real && !w.isPrivate).length, target: 10 },
        27: { current: () => gameState.fakeAdBans || 0, target: 3 },
        28: { current: () => gameState.monthsWithoutFakeAd || 0, target: 3 },
        // ✅ 新增成就进度
        29: { current: () => gameState.fans || 0, target: 1000000 },
        30: { current: () => gameState.fans || 0, target: 100000000 },
        31: { current: () => gameState.worksList.length, target: 50 },
        32: { current: () => gameState.worksList.length, target: 1000 }
    };
    
    const achievementHtml = achievements.map(achievement => {
        const progress = progressMap[achievement.id];
        let progressHtml = '';
        
        if (achievement.unlocked) {
            progressHtml = '<div style="color: #667aea; font-size: 12px; margin-top: 5px;">✅ 已完成</div>';
        } else if (progress && typeof progress.current === 'function') {
            try {
                const current = progress.current();
                const target = typeof progress.target === 'function' ? progress.target() : progress.target;
                
                if (typeof current === 'number' && typeof target === 'number' && target > 0) {
                    const actualCurrent = Math.min(current, target);
                    const percentage = Math.min(100, Math.floor((actualCurrent / target) * 100));
                    
                    progressHtml = `
                        <div class="achievement-progress">
                            <div class="achievement-progress-bar" style="width: ${percentage}%"></div>
                        </div>
                        <div class="achievement-progress-text">
                            ${formatNumber(actualCurrent)} / ${formatNumber(target)} (${percentage}%)
                        </div>
                    `;
                } else {
                    progressHtml = '<div style="color: #999; font-size: 12px; margin-top: 5px;">🔒 未解锁</div>';
                }
            } catch (e) {
                console.error(`成就 ${achievement.id} 进度计算失败:`, e);
                progressHtml = '<div style="color: #999; font-size: 12px; margin-top: 5px;">🔒 未解锁</div>';
            }
        } else {
            progressHtml = '<div style="color: #999; font-size: 12px; margin-top: 5px;">🔒 未解锁</div>';
        }
        
        return `
            <div class="achievement-item">
                <div class="achievement-icon ${achievement.unlocked ? 'unlocked' : ''}">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                    ${progressHtml}
                </div>
                <div style="color:${achievement.unlocked ? '#667aea' : '#999'};font-size:12px">
                    ${achievement.unlocked ? '已解锁' : '未解锁'}
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = levelHtml + achievementHtml;
}

function changeUsername() {
    // ✅ 检查是否被封号
    if (gameState.isBanned) {
        showAlert('封禁期间无法修改昵称', '账号封禁中');
        return;
    }
    
    showPrompt('请输入新昵称（最多10个字符）', gameState.username, function(newName) {
        if (newName && newName.trim()) {
            gameState.username = newName.trim().substring(0, 10);
            gameState.avatar = gameState.username.charAt(0).toUpperCase();
            updateDisplay();
            showNotification('修改成功', '昵称已更新');
        }
    });
}

// ✅ 修改：输入新的UID只支持输入数字和字母和标点符号
function changeUserId() {
    // ✅ 检查是否被封号
    if (gameState.isBanned) {
        showAlert('封禁期间无法修改用户ID', '账号封禁中');
        return;
    }
    
    showPrompt('请输入新ID（最多20个字符，仅限数字、字母和标点符号）', gameState.userId, function(newId) {
        if (newId && newId.trim()) {
            const trimmedId = newId.trim();
            // 验证只能包含数字、字母和标点符号（包括下划线、横线等）
            if (!/^[a-zA-Z0-9\p{P}\p{S}]+$/u.test(trimmedId)) {
                showAlert('ID只能包含数字、字母和标点符号！', '输入错误');
                return;
            }
            if (trimmedId.length > 20) {
                showAlert('ID不能超过20个字符！', '输入错误');
                return;
            }
            gameState.userId = trimmedId;
            showNotification('修改成功', 'ID已更新');
            saveGame();
        }
    });
}

function changeAvatar() {
    // ✅ 检查是否被封号
    if (gameState.isBanned) {
        showAlert('封禁期间无法修改头像', '账号封禁中');
        return;
    }
    
    showPrompt('请输入头像文字（1个字符），留空则使用图片头像', gameState.avatar || '', function(avatar) {
        if (avatar && avatar.trim()) {
            gameState.avatar = avatar.trim().substring(0, 1);
            gameState.avatarImage = '';
            updateDisplay();
            showNotification('修改成功', '头像文字已更新');
        } else {
            if (gameState.avatarImage) {
                gameState.avatar = '';
                updateDisplay();
                showNotification('修改成功', '已恢复图片头像');
            } else {
                showAlert('没有设置图片头像，请输入文字或先上传图片', '提示');
            }
            saveGame();
        }
    });
}

function clearData() {
    showConfirm('确定要清除所有数据吗？此操作不可恢复！', function(confirmed) {
        if (confirmed) {
            try {
                if (typeof resetGame === 'function') {
                    resetGame();
                }
                localStorage.removeItem('streamerGameState');
                showAlert('数据已清除！页面将刷新。', '提示');
                setTimeout(() => {
                    location.reload(true);
                }, 100);
            } catch (error) {
                console.error('清除数据失败:', error);
                showAlert('清除数据失败，请手动清除浏览器缓存。', '错误');
            }
        }
    });
}

function uploadAvatar() {
    // ✅ 检查是否被封号
    if (gameState.isBanned) {
        showAlert('封禁期间无法上传头像', '账号封禁中');
        return;
    }
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showAlert('请选择图片文件！', '错误');
            document.body.removeChild(fileInput);
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showAlert('图片太大！请选择小于5MB的图片', '错误');
            document.body.removeChild(fileInput);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = img.width;
                let height = img.height;
                const maxSize = 800;
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                
                const base64Size = imageData.length * 0.75;
                
                let finalImageData = imageData;
                if (base64Size > 2 * 1024 * 1024) {
                    finalImageData = canvas.toDataURL('image/jpeg', 0.6);
                    
                    const newBase64Size = finalImageData.length * 0.75;
                    if (newBase64Size > 2 * 1024 * 1024) {
                        showAlert('图片压缩后仍超过2MB，请选择更小的图片', '提示');
                        document.body.removeChild(fileInput);
                        return;
                    }
                }
                
                gameState.avatarImage = finalImageData;
                gameState.avatar = '';
                
                updateDisplay();
                showNotification('上传成功', '头像已更新并压缩！');
                saveGame();
                
                document.body.removeChild(fileInput);
            };
            img.src = event.target.result;
        };
        reader.onerror = function() {
            showAlert('读取图片失败！', '错误');
            document.body.removeChild(fileInput);
        };
        reader.readAsDataURL(file);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

function updateLastWorkTime() {
    if (!gameState.lastWorkTime || gameState.lastWorkTime <= 0) {
        console.log('修复：初始化 lastWorkTime 为当前游戏时间');
    }
    gameState.lastWorkTime = gameTimer;
}

function showFollowingList() {
    if (!gameState.following || gameState.following.length === 0) {
        showAlert('你还没有关注任何人', '关注列表');
        return;
    }
    
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    let followingPage = document.getElementById('followingPage');
    let isNewPage = false;
    
    if (!followingPage) {
        followingPage = document.createElement('div');
        followingPage.id = 'followingPage';
        followingPage.className = 'fullscreen-page';
        followingPage.innerHTML = `
            <div class="fullscreen-header">
                <div class="back-btn" onclick="closeFollowingPage()">‹</div>
                <div class="fullscreen-title">关注列表 (${gameState.following.length})</div>
                <div class="fullscreen-action" style="opacity:0; cursor:default;">占位</div>
            </div>
            <div id="followingPageContent" class="fullscreen-content"></div>
        `;
        document.body.appendChild(followingPage);
        isNewPage = true;
    } else {
        followingPage.querySelector('.fullscreen-title').textContent = `关注列表 (${gameState.following.length})`;
    }
    
    followingPage.classList.add('active');
    
    setTimeout(() => {
        try {
            renderFollowingList();
        } catch (error) {
            console.error('渲染关注列表失败:', error);
            showAlert('关注列表渲染失败，请刷新页面重试', '错误');
            closeFollowingPage();
        }
    }, isNewPage ? 100 : 0);
}

function renderFollowingList() {
    const content = document.getElementById('followingPageContent');
    if (!content) {
        console.error('关注列表内容容器未找到');
        return;
    }
    
    if (!gameState.following || gameState.following.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">关注列表为空</div>';
        return;
    }
    
    try {
        const followingHtml = gameState.following.map((userData, index) => {
            if (typeof userData === 'string') {
                userData = {
                    username: userData,
                    avatar: userData.charAt(0),
                    userId: Math.floor(Math.random() * 900000000 + 100000000).toString(),
                    fanCount: Math.floor(Math.random() * 50000) + 100,
                    workCount: Math.floor(Math.random() * 500) + 10,
                    likeCount: Math.floor(Math.random() * 100000) + 1000,
                    joinDays: Math.floor(Math.random() * 365) + 1,
                    following: Math.floor(Math.random() * 500) + 50,
                    bio: getRandomUserBio()
                };
                gameState.following[index] = userData;
                saveGame();
            }
            
            return `
                <div class="work-item" style="display:flex;justify-content:space-between;align-items:center; padding: 15px; margin-bottom: 10px;">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;cursor:pointer;" 
                         onclick="showUserProfileFromFollowing('${userData.username}', '${userData.avatar}')">
                        <div class="comment-user-avatar">${userData.avatar}</div>
                        <div style="flex:1;">
                            <div style="font-weight:bold;font-size:14px;">${userData.username}</div>
                            <div style="font-size:11px;color:#999;">${userData.userId}</div>
                        </div>
                    </div>
                    <button class="btn btn-secondary" style="width:auto;padding:8px 12px;font-size:12px;background:#ff0050;" 
                            onclick="toggleFollow('${userData.username}')">
                        取消关注
                    </button>
                </div>
            `;
        }).join('');
        
        if (followingHtml.trim() === '') {
            content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">关注列表为空</div>';
        } else {
            content.innerHTML = followingHtml;
        }
    } catch (error) {
        console.error('生成关注列表HTML失败:', error);
        content.innerHTML = '<div style="text-align:center;color:#ff0050;padding:40px;">渲染失败，请刷新页面</div>';
    }
}

function showUserProfileFromFollowing(username, avatar) {
    closeFollowingPage();
    
    const userData = gameState.following.find(u => 
        (typeof u === 'object' ? u.username : u) === username
    );
    
    setTimeout(() => {
        if (typeof userData === 'object') {
            renderUserProfile(userData);
        } else {
            // ✅ 修改：UID生成改为纯数字（9位随机数）
            const profileData = {
                username: username,
                avatar: avatar,
                userId: Math.floor(Math.random() * 900000000 + 100000000).toString(),
                fanCount: Math.floor(Math.random() * 50000) + 100,
                workCount: Math.floor(Math.random() * 500) + 10,
                likeCount: Math.floor(Math.random() * 100000) + 1000,
                joinDays: Math.floor(Math.random() * 365) + 1,
                following: Math.floor(Math.random() * 500) + 50,
                bio: getRandomUserBio(),
                isFollowing: false
            };
            
            const index = gameState.following.findIndex(u => 
                (typeof u === 'object' ? u.username : u) === username
            );
            if (index !== -1) {
                gameState.following[index] = profileData;
                saveGame();
            }
            
            renderUserProfile(profileData);
        }
    }, 100);
}

function closeFollowingPage() {
    const followingPage = document.getElementById('followingPage');
    if (followingPage) {
        followingPage.classList.remove('active');
    }
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
    
    if (typeof updateDisplay === 'function') {
        updateDisplay();
    }
}

function toggleFollow(username) {
    if (!gameState.following) {
        gameState.following = [];
    }
    
    let userData = gameState.following.find(u => 
        (typeof u === 'object' ? u.username : u) === username
    );
    
    const index = gameState.following.findIndex(u => 
        (typeof u === 'object' ? u.username : u) === username
    );
    
    if (index > -1) {
        gameState.following.splice(index, 1);
        showNotification('取消关注', `已取消关注 ${username}`);
        
        const profilePage = document.getElementById('userProfilePage');
        if (profilePage && profilePage.classList.contains('active')) {
            const userProfileContent = document.getElementById('userProfilePageContent');
            if (userProfileContent) {
                const currentUserData = window.cachedUserProfile;
                if (currentUserData && currentUserData.username === username) {
                    renderUserProfile(currentUserData);
                }
            }
        }
        
        const followingPage = document.getElementById('followingPage');
        if (followingPage && followingPage.classList.contains('active')) {
            renderFollowingList();
        }
    } else {
        if (window.cachedUserProfile && window.cachedUserProfile.username === username) {
            userData = window.cachedUserProfile;
        } else {
            // ✅ 修改：UID生成改为纯数字（9位随机数）
            userData = {
                username: username,
                avatar: username.charAt(0),
                userId: Math.floor(Math.random() * 900000000 + 100000000).toString(),
                fanCount: Math.floor(Math.random() * 50000) + 100,
                workCount: Math.floor(Math.random() * 500) + 10,
                likeCount: Math.floor(Math.random() * 100000) + 1000,
                joinDays: Math.floor(Math.random() * 365) + 1,
                following: Math.floor(Math.random() * 500) + 50,
                bio: getRandomUserBio(),
                isFollowing: false
            };
        }
        
        gameState.following.push(userData);
        showNotification('关注成功', `已关注 ${username}`);
        
        const profilePage = document.getElementById('userProfilePage');
        if (profilePage && profilePage.classList.contains('active')) {
            const userProfileContent = document.getElementById('userProfilePageContent');
            if (userProfileContent) {
                renderUserProfile(userData);
            }
        }
        
        const followingPage = document.getElementById('followingPage');
        if (followingPage && followingPage.classList.contains('active')) {
            renderFollowingList();
        }
    }
    
    updateDisplay();
    saveGame();
}

function getRandomUserBio() {
    const bios = [
        '热爱生活，喜欢分享',
        '专业主播，认真创作',
        '记录生活中的美好瞬间',
        '努力学习，不断进步',
        '做一个有趣的人',
        '分享快乐，传递正能量',
        '专注内容创作',
        '感谢每一个支持我的人',
        '用心做好每一个作品',
        '梦想成为一名优秀的主播',
        '在平凡的日子里闪闪发光',
        '创作源于生活',
        '记录成长的点点滴滴',
        '感谢您的关注和支持',
        '用心创作，用爱分享'
    ];
    return bios[Math.floor(Math.random() * bios.length)];
}

window.showSettings = showSettings;
window.showProfile = showProfile;
window.showUserProfile = showUserProfile;
window.renderUserProfile = renderUserProfile;
window.cachedUserProfile = window.cachedUserProfile || null;
window.showFollowingList = showFollowingList;
window.toggleFollow = toggleFollow;
window.renderFollowingList = renderFollowingList;
window.showUserProfileFromFollowing = showUserProfileFromFollowing;
window.closeFollowingPage = closeFollowingPage;
window.getRandomUserBio = getRandomUserBio;
window.changeUsername = changeUsername;
window.changeUserId = changeUserId;
window.changeAvatar = changeAvatar;
window.uploadAvatar = uploadAvatar;
window.clearData = clearData;
window.showAllWorks = showAllWorks;
window.showAchievementsFullscreen = showAchievementsFullscreen; // ✅ 已同步更新
window.updateLastWorkTime = updateLastWorkTime;
window.toggleDoNotDisturb = toggleDoNotDisturb;
window.changeProfileCategory = window.changeProfileCategory;
window.changeProfilePage = window.changeProfilePage;
window.openProfileWorkDetail = window.openProfileWorkDetail;
window.closeProfilePage = closeProfilePage;