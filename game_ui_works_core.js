// ==================== 作品管理与作品列表 ====================

// 全局变量
window.worksUpdateInterval = null;
window.currentWorksPage = 1;
window.worksPerPage = 10;
window.currentWorksCategory = 'all';
window.currentWorksSort = 'latest';
window.currentDetailWork = null;
window.commentsPerPage = 10;

// 作品排序函数
function getSortedWorks(works, sortType) {
    const sorted = [...works];
    switch(sortType) {
        case 'latest':
            return sorted.sort((a, b) => (b.time || 0) - (a.time || 0));
        case 'oldest':
            return sorted.sort((a, b) => (a.time || 0) - (b.time || 0));
        case 'mostViews':
            return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
        case 'mostLikes':
            return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        case 'mostComments':
            return sorted.sort((a, b) => (b.comments || 0) - (a.comments || 0));
        case 'mostShares':
            return sorted.sort((a, b) => (b.shares || 0) - (a.shares || 0));
        default:
            return sorted.sort((a, b) => (b.time || 0) - (a.time || 0));
    }
}

// 切换作品排序
function changeWorksSort(sortType) {
    window.currentWorksSort = sortType;
    
    const sortSelect = document.getElementById('worksSortSelect');
    if (sortSelect) {
        sortSelect.value = sortType;
    }
    
    window.currentWorksPage = 1;
    renderWorksPage();
    
    const sortNames = {
        'latest': '最新发布',
        'oldest': '最早发布',
        'mostViews': '最多播放',
        'mostLikes': '最多点赞',
        'mostComments': '最多评论',
        'mostShares': '最多转发'
    };
    showNotification('排序已切换', `当前按${sortNames[sortType] || '最新发布'}显示`);
}

// 作品自动更新
function startWorkUpdates() {
    setInterval(() => {
        if (gameState.worksList.length === 0) return;
        
        gameState.worksList.forEach(work => {
            if (work.isPrivate) return;
            
            const viewsGrowth = Math.floor(Math.random() * 50);
            const likesGrowth = Math.floor(Math.random() * 20);
            const commentsGrowth = Math.floor(Math.random() * 10);
            const sharesGrowth = Math.floor(Math.random() * 5);
            
            if (!gameState.messages) gameState.messages = [];
            
            for (let i = 0; i < likesGrowth; i++) {
                if (Math.random() < 0.15) {
                    gameState.messages.push({
                        id: Date.now() + Math.random() + i,
                        type: 'like',
                        user: generateRandomUsername(),
                        workId: work.id,
                        workContent: work.content.substring(0, 30) + (work.content.length > 30 ? '...' : ''),
                        time: gameTimer,
                        read: false
                    });
                }
            }
            
            for (let i = 0; i < commentsGrowth; i++) {
                if (Math.random() < 0.2) {
                    gameState.messages.push({
                        id: Date.now() + Math.random() + i + 10000,
                        type: 'comment',
                        user: generateRandomUsername(),
                        workId: work.id,
                        workContent: work.content.substring(0, 30) + (work.content.length > 30 ? '...' : ''),
                        time: gameTimer,
                        read: false
                    });
                }
            }
            
            for (let i = 0; i < sharesGrowth; i++) {
                if (Math.random() < 0.3) {
                    gameState.messages.push({
                        id: Date.now() + Math.random() + i + 20000,
                        type: 'share',
                        user: generateRandomUsername(),
                        workId: work.id,
                        workContent: work.content.substring(0, 30) + (work.content.length > 30 ? '...' : ''),
                        time: gameTimer,
                        read: false
                    });
                }
            }
            
            work.views += viewsGrowth;
            if (work.type === 'video' || work.type === 'live') {
                gameState.views += viewsGrowth;
            }
            
            const oldRevenue = work.revenue || 0;
            const newRevenue = Math.floor(work.views / 1000);
            const revenueGrowth = newRevenue - oldRevenue;
            if (revenueGrowth > 0) {
                work.revenue = newRevenue;
                gameState.money += revenueGrowth;
            }
            
            work.likes += likesGrowth;
            gameState.likes += likesGrowth;
            work.comments += commentsGrowth;
            work.shares += sharesGrowth;
            
            gameState.totalInteractions += commentsGrowth + sharesGrowth;
            
            if (typeof window.updateCommentLikes === 'function') {
                window.updateCommentLikes(work);
            }
            
            const viewsEl = document.getElementById(`work-views-${work.id}`);
            const likesEl = document.getElementById(`work-likes-${work.id}`);
            const commentsEl = document.getElementById(`work-comments-${work.id}`);
            const sharesEl = document.getElementById(`work-shares-${work.id}`);
            
            if (viewsEl) {
                const icon = work.type === 'post' ? '👁️' : '▶️';
                viewsEl.textContent = `${icon} ${work.views.toLocaleString()}`;
                animateNumberUpdate(viewsEl);
            }
            if (likesEl) { likesEl.textContent = work.likes.toLocaleString(); animateNumberUpdate(likesEl); }
            if (commentsEl) { commentsEl.textContent = work.comments.toLocaleString(); animateNumberUpdate(commentsEl); }
            if (sharesEl) { sharesEl.textContent = work.shares.toLocaleString(); animateNumberUpdate(sharesEl); }
        });
        
        if (gameState.messages.length > 200) {
            gameState.messages = gameState.messages.slice(-150);
        }
        
        if (typeof updateNavMessageBadge === 'function') {
            updateNavMessageBadge();
        }
        
        updateDisplay();
    }, 3000);
}

// 生成状态标识HTML
function generateStatusBadges(work) {
    const badges = [];
    
    // 流量推广标识 - 添加剩余天数显示
    const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
    if (isTrafficActive) {
        const trafficData = gameState.trafficWorks[work.id];
        const timePassed = gameTimer - trafficData.startTime;
        const daysPassed = timePassed / VIRTUAL_DAY_MS;
        const timeLeft = Math.max(0, trafficData.days - daysPassed);
        
        badges.push({
            text: `📈 推广中(${timeLeft.toFixed(1)}天)`,
            class: 'traffic-indicator',
            style: 'background:linear-gradient(135deg, #ff6b00 0%, #ff0050 100%);color:#fff;'
        });
    }
    
    // ✅ 新增：抽奖活动标识
    if (work.isRaffle) {
        const statusText = {
            'active': '抽奖进行中',
            'ended': '抽奖已结束',
            'drawing': '抽奖中',
            'completed': '抽奖已完成'
        };
        badges.push({
            text: `🎁 ${statusText[work.raffleStatus] || '抽奖'}`,
            class: 'raffle-indicator',
            style: 'background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;'
        });
    }
    
    // ✅ 新增：热搜话题标识
    if (work.isHotSearchWork || work.isHot) {
        const timeLeft = work.hotSearchData ? 
            Math.max(0, work.hotSearchData.endTime - gameTimer) / VIRTUAL_DAY_MS :
            Math.max(0, work.hotEndTime - gameTimer) / VIRTUAL_DAY_MS;
        badges.push({
            text: `🔥 热搜(${timeLeft.toFixed(1)}天)`,
            class: 'hotsearch-indicator',
            style: 'background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;'
        });
    }
    
    // 推荐标识
    if (work.isRecommended) {
        const timeLeft = Math.max(0, work.recommendEndTime - gameTimer) / VIRTUAL_DAY_MS;
        badges.push({
            text: `🔥推荐(${timeLeft.toFixed(1)}天)`,
            class: 'recommend-indicator',
            style: 'background:linear-gradient(135deg, #00f2ea 0%, #667eea 100%);color:#000;'
        });
    }
    
    // 争议标识
    if (work.isControversial) {
        const timeLeft = Math.max(0, work.controversyEndTime - gameTimer) / VIRTUAL_DAY_MS;
        badges.push({
            text: `⚠️争议(${timeLeft.toFixed(1)}天)`,
            class: 'controversy-indicator',
            style: 'background:linear-gradient(135deg, #ff6b00 0%, #ff0050 100%);color:#fff;'
        });
    }
    
    return badges;
}

// 作品详情显示（核心修改：移除立即生成评论的调用）
function showWorkDetail(work) {
    try {
        if (currentDetailWork && currentDetailWork.id === work.id) {
            console.log('同个作品详情，跳过重复渲染');
            return;
        }
        
        currentDetailWork = null;
        
        // ✅ 修改：不再立即生成评论，改为按需生成
        // 如果还没有评论列表，创建空数组
        if (!work.commentsList) {
            work.commentsList = [];
            saveGame();
        }
        
        currentDetailWork = work;
        window.currentCommentPage = 1;
        
        // 生成状态标识
        const badges = generateStatusBadges(work);
        const statusHtml = badges.map(badge => `
            <div class="work-status-badge ${badge.class}" style="${badge.style}animation:pulse 1s infinite;padding:4px 8px;border-radius:5px;font-size:10px;font-weight:bold;margin-bottom:5px;display:inline-block;margin-right:5px;">
                ${badge.text}
            </div>
        `).join('');
        
        const trafficData = gameState.trafficWorks[work.id];
        const isTrafficActive = trafficData && trafficData.isActive;
        
        // 计算推广剩余天数
        let trafficInfoHtml = '';
        if (isTrafficActive) {
            const timePassed = gameTimer - trafficData.startTime;
            const daysPassed = timePassed / VIRTUAL_DAY_MS;
            const timeLeft = Math.max(0, trafficData.days - daysPassed);
            trafficInfoHtml = `
                <div style="background: linear-gradient(135deg, #ff6b00 0%, #ff0050 100%); color: #fff; padding: 8px; border-radius: 8px; margin-bottom: 10px; font-size: 12px; text-align: center;">
                    📈 流量推广进行中，剩余${timeLeft.toFixed(1)}天
                </div>
            `;
        }
        
        const sortControls = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-weight: bold">评论区</div>
                <div style="display: flex; gap: 10px; font-size: 12px;">
                    <select id="commentSortSelect" onchange="window.changeCommentSort('${work.id}', this.value)" style="background: #222; border: 1px solid #333; color: #fff; border-radius: 4px; padding: 4px 8px;">
                        <option value="hottest" ${window.currentCommentSort === 'hottest' ? 'selected' : ''}>🔥 最火的</option>
                        <option value="asc" ${window.currentCommentSort === 'asc' ? 'selected' : ''}>⬆️ 正序</option>
                        <option value="desc" ${window.currentCommentSort === 'desc' ? 'selected' : ''}>⬇️ 倒序</option>
                    </select>
                </div>
            </div>
        `;
        
        // ✅ 修改：不再立即生成评论，使用按需生成
        // const comments = work.commentsList || [];
        const totalComments = work.comments || 0;
        const totalPages = Math.min(30, Math.max(1, Math.ceil(totalComments / window.commentsPerPage)));
        
        // 生成第一页评论（按需生成）
        const commentsHtml = renderPaginatedComments(work, window.commentsPerPage);
        const paginationHtml = renderCommentsPagination(work, window.commentsPerPage);
        
        const content = document.getElementById('workDetailPageContent');
        content.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div style="margin-bottom:20px">
                <!-- 状态标识区域 -->
                <div style="margin-bottom:10px;">
                    ${statusHtml}
                </div>
                
                ${trafficInfoHtml}
                
                ${work.isAd ? '<div style="background:#ff0050;color:white;padding:5px 10px;border-radius:5px;font-size:12px;display:inline-block;margin-bottom:10px;">🎯 商单合作</div>' : ''}
                ${work.isPrivate ? '<div style="background:#999;color:white;padding:5px 10px;border-radius:5px;font-size:12px;display:inline-block;margin-bottom:10px;">🔒 私密作品</div>' : ''}
                
                <!-- ✅ 新增：抽奖和热搜的详细信息 -->
                ${work.isRaffle && work.raffleStatus === 'active' ? `
                    <div style="background: linear-gradient(135deg, #FFD700 0%, #ff6b00 100%); color: #000; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">🎁 抽奖活动进行中</div>
                        <div style="font-size: 12px;">奖品：${work.prize.name} | 剩余${Math.max(0, (work.activityEndTime - gameTimer) / VIRTUAL_DAY_MS).toFixed(1)}天</div>
                    </div>
                ` : ''}
                
                ${work.isHotSearchWork ? `
                    <div style="background: linear-gradient(135deg, #FFD700 0%, #ff6b00 100%); color: #000; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">🔥 热搜话题：${work.hotSearchData.topic}</div>
                        <div style="font-size: 12px;">活动时长：${work.hotSearchData.duration}天 | 剩余${Math.max(0, (work.hotSearchData.endTime - gameTimer) / VIRTUAL_DAY_MS).toFixed(1)}天</div>
                    </div>
                ` : ''}
                
                <div style="font-size:16px;margin-bottom:10px">${work.content}</div>
                <div style="font-size:12px;color:#999;margin-bottom:15px">${formatTime(work.time)}</div>
                
                <div style="display:flex;justify-content:space-around;padding:15px;background:#161823;border-radius:10px;margin-bottom:20px">
                    <div style="text-align:center">
                        <div style="font-size:18px;font-weight:bold">${work.views.toLocaleString()}</div>
                        <div style="font-size:12px;color:#999">${work.type === 'post' ? '👁️ 查阅' : work.type === 'live' ? '📱 观看' : '▶️ 播放'}</div>
                    </div>
                    <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.likes.toLocaleString()}</div><div style="font-size:12px;color:#999">点赞</div></div>
                    <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.comments.toLocaleString()}</div><div style="font-size:12px;color:#999">评论</div></div>
                    <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${work.shares.toLocaleString()}</div><div style="font-size:12px;color:#999">转发</div></div>
                </div>
                
                ${work.revenue ? `<div style="font-size:14px;color:#667eea;margin-bottom:15px">💰 收益：${work.revenue}元</div>` : ''}
                ${sortControls}
                <div style="font-size:12px;color:#999;margin-bottom:10px;text-align:right;">
                    共${totalComments}条评论，${totalPages}页
                </div>
                <div id="commentsList">${commentsHtml}</div>
                ${paginationHtml}
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="btn" onclick="togglePrivate(${work.id})" style="${work.isPrivate ? '#667eea' : '#333'}; flex: 1;">
                        ${work.isPrivate ? '🔓 取消私密' : '🔒 设为私密'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteWork(${work.id})" style="flex: 1; background: #ff0050;">
                        🗑️ 删除作品
                    </button>
                </div>
            </div>
        `;
        
        fragment.appendChild(wrapper);
        content.appendChild(wrapper);
        
        document.getElementById('workDetailTitle').textContent = work.type === 'video' ? '视频详情' : work.type === 'live' ? '直播详情' : '动态详情';
        document.getElementById('workDetailPage').classList.add('active');
        document.getElementById('mainContent').style.display = 'none';
        document.querySelector('.bottom-nav').style.display = 'none';
        
    } catch (error) {
        console.error('显示作品详情失败:', error);
    }
}

// 删除作品
function deleteWork(workId) {
    const workIndex = gameState.worksList.findIndex(w => w.id === workId);
    if (workIndex === -1) return;
    
    const work = gameState.worksList[workIndex];
    
    showConfirm(`确定要删除这个${work.type === 'video' ? '视频' : work.type === 'live' ? '直播' : '动态'}吗？此操作不可恢复！`, function(confirmed) {
        if (confirmed) {
            if (work.isRecommended && work.recommendInterval) {
                clearInterval(work.recommendInterval);
            }
            if (work.isControversial && work.controversyInterval) {
                clearInterval(work.controversyInterval);
            }
            if (work.isHot && work.hotInterval) {
                clearInterval(work.hotInterval);
            }
            
            // ✅ 清理抽奖相关定时器
            if (work.isRaffle) {
                if (work.fanGrowthInterval) clearInterval(work.fanGrowthInterval);
                if (work.dataGrowthInterval) clearInterval(work.dataGrowthInterval);
                if (work.fanLossInterval) clearInterval(work.fanLossInterval);
                if (work.manualDrawWarningInterval) clearInterval(work.manualDrawWarningInterval);
                if (work.crazyFanLossInterval) clearInterval(work.crazyFanLossInterval);
            }
            
            // ✅ 清理热搜相关定时器
            if (work.isHotSearchWork && work.hotSearchInterval) {
                clearInterval(work.hotSearchInterval);
                work.hotSearchInterval = null;
            }
            
            if (work.type === 'video' || work.type === 'live') {
                gameState.views = Math.max(0, gameState.views - work.views);
            }
            gameState.likes = Math.max(0, gameState.likes - work.likes);
            
            gameState.worksList.splice(workIndex, 1);
            
            if (gameState.trafficWorks[workId]) {
                if (typeof stopTrafficForWork === 'function') stopTrafficForWork(workId);
            }
            
            const interactionCount = work.comments + work.likes + work.shares;
            gameState.totalInteractions = Math.max(0, gameState.totalInteractions - interactionCount);
            
            gameState.works = gameState.worksList.filter(w => !w.isPrivate).length;
            
            currentDetailWork = null;
            
            // ✅ 清理评论缓存
            if (typeof window.clearCommentsCache === 'function') {
                window.clearCommentsCache(workId);
            }
            
            closeFullscreenPage('workDetail');
            updateDisplay();
            showNotification('删除成功', '作品已删除');
            
            const workType = work.type === 'video' ? '视频' : work.type === 'live' ? '直播' : '动态';
            if (typeof showEventPopup === 'function') {
                showEventPopup('🗑️ 作品删除成功', `${workType} "${work.content.substring(0, 30)}..." 已删除`);
            }
        }
    });
}

// 切换私密状态
function togglePrivate(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work) return;
    
    work.isPrivate = !work.isPrivate;
    
    const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
    gameState.works = publicWorks.length;
    gameState.views = publicWorks.filter(w => w.type === 'video' || w.type === 'live').reduce((sum, w) => sum + w.views, 0);
    gameState.likes = publicWorks.reduce((sum, w) => sum + w.likes, 0);
    
    gameState.totalInteractions = publicWorks.reduce((sum, w) => {
        return sum + w.comments + w.likes + w.shares;
    }, 0);
    
    showNotification('设置成功', work.isPrivate ? '作品已设为私密' : '作品已取消私密');
    showWorkDetail(work);
    updateDisplay();
}

// 关闭作品详情页
function closeFullscreenPage(pageName) {
    if (pageName === 'workDetail') {
        if (currentDetailWork && currentDetailWork.id) {
            if (typeof window.cleanupWorkCommentsOnExit === 'function') {
                window.cleanupWorkCommentsOnExit(currentDetailWork.id);
            }
        }
    }
    
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    if (pageName === 'workDetail') {
        currentDetailWork = null;
        window.cachedUserProfile = null;
        
        // ✅ 清理评论缓存
        if (typeof window.clearAllCommentsCache === 'function') {
            window.clearAllCommentsCache();
        }
    }
    
    document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
}

// 全屏作品页
function showWorksFullscreen() {
    const content = document.getElementById('worksListTab');
    if (!content) return;
    
    window.currentWorksPage = 1;
    window.currentWorksCategory = 'all';
    window.currentWorksSort = 'latest';
    
    const categoryTabs = `
        <div style="display: flex; padding: 10px; gap: 10px; background: #161823; border-radius: 10px; margin: 10px;">
            <div class="category-tab active" data-category="all" onclick="filterWorksByCategory('all')">全部</div>
            <div class="category-tab" data-category="video" onclick="filterWorksByCategory('video')">视频</div>
            <div class="category-tab" data-category="post" onclick="filterWorksByCategory('post')">动态</div>
            <div class="category-tab" data-category="live" onclick="filterWorksByCategory('live')">直播</div>
        </div>
        <div style="display: flex; padding: 0 10px; margin-bottom: 15px;">
            <select id="worksSortSelect" onchange="changeWorksSort(this.value)" style="flex: 1; background: #222; border: 1px solid #333; color: #fff; border-radius: 8px; padding: 10px; font-size: 14px;">
                <option value="latest">📅 最新发布</option>
                <option value="oldest">📅 最早发布</option>
                <option value="mostViews">▶️ 最多播放</option>
                <option value="mostLikes">❤️ 最多点赞</option>
                <option value="mostComments">💬 最多评论</option>
                <option value="mostShares">🔄 最多转发</option>
            </select>
        </div>
        <div id="filteredWorksList" style="padding: 0 10px;"></div>
        <div id="worksPagination" style="display: flex; justify-content: center; align-items: center; gap: 8px; padding: 15px 10px; background: #161823; margin: 10px; border-radius: 10px; border: 1px solid #333; flex-wrap: wrap; max-width: 100%;"></div>
    `;
    
    content.innerHTML = categoryTabs;
    renderWorksPage();
    
    const totalCountEl = document.getElementById('worksTotalCount');
    if (totalCountEl) {
        const totalWorks = gameState.worksList.length;
        totalCountEl.textContent = `共${totalWorks}个作品`;
    }
}

function renderWorksPage() {
    try {
        const filteredListEl = document.getElementById('filteredWorksList');
        const paginationEl = document.getElementById('worksPagination');
        if (!filteredListEl || !paginationEl) return;
        
        let filteredWorks = gameState.worksList;
        if (window.currentWorksCategory !== 'all') {
            filteredWorks = gameState.worksList.filter(work => work.type === window.currentWorksCategory);
        }
        
        filteredWorks = getSortedWorks(filteredWorks, window.currentWorksSort);
        
        const totalWorks = filteredWorks.length;
        const totalPages = Math.max(1, Math.ceil(totalWorks / window.worksPerPage));
        
        if (window.currentWorksPage > totalPages) {
            window.currentWorksPage = totalPages;
        }
        if (window.currentWorksPage < 1) {
            window.currentWorksPage = 1;
        }
        
        const startIndex = (window.currentWorksPage - 1) * window.worksPerPage;
        const endIndex = startIndex + window.worksPerPage;
        const pageWorks = filteredWorks.slice(startIndex, endIndex);
        
        const fragment = document.createDocumentFragment();
        
        pageWorks.forEach((work) => {
            const badges = generateStatusBadges(work);
            const statusBar = badges.map(badge => `
                <span class="${badge.class}" style="${badge.style}animation:pulse 1s infinite;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;display:inline-block;">
                    ${badge.text}
                </span>
            `).join('');
            
            const workDiv = document.createElement('div');
            workDiv.className = 'work-item';
            workDiv.onclick = () => showWorkDetail(work);
            workDiv.innerHTML = `
                ${statusBar ? `<div style="margin-bottom:8px;">${statusBar}</div>` : ''}
                <div class="work-header">
                    <span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'} ${work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">🔒私密</span>' : ''}</span>
                    <span class="work-time">${formatTime(work.time)} ${work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : ''}</span>
                </div>
                <div class="work-content" style="${work.isPrivate ? 'opacity: 0.7;' : ''}">${work.content}</div>
                <div class="work-stats">
                    <span>${work.type === 'post' ? '👁️' : '▶️'} ${work.views.toLocaleString()}</span>
                    <span>❤️ ${work.likes.toLocaleString()}</span>
                    <span>💬 ${(work.comments || 0).toLocaleString()}</span>
                    <span>🔄 ${work.shares.toLocaleString()}</span>
                </div>
            `;
            fragment.appendChild(workDiv);
        });
        
        filteredListEl.innerHTML = '';
        filteredListEl.appendChild(fragment);
        
        renderWorksPagination(totalPages, totalWorks);
        
    } catch (error) {
        console.error('渲染作品页失败:', error);
    }
}

function renderWorksPagination(totalPages, totalWorks) {
    try {
        const paginationEl = document.getElementById('worksPagination');
        if (!paginationEl) return;
        
        paginationEl.innerHTML = '';
        
        const currentPage = window.currentWorksPage;
        
        paginationEl.style.display = 'flex';
        paginationEl.style.justifyContent = 'center';
        paginationEl.style.alignItems = 'center';
        paginationEl.style.flexWrap = 'wrap';
        paginationEl.style.gap = '5px';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = `page-btn ${currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.innerHTML = '‹';
        prevBtn.onclick = () => changeWorksPage(currentPage - 1);
        if (currentPage === 1) prevBtn.disabled = true;
        paginationEl.appendChild(prevBtn);
        
        const maxVisibleButtons = 5;
        let startPage, endPage;
        
        if (totalPages <= maxVisibleButtons) {
            startPage = 1;
            endPage = totalPages;
        } else {
            const halfVisible = Math.floor(maxVisibleButtons / 2);
            startPage = Math.max(1, currentPage - halfVisible);
            endPage = Math.min(totalPages, currentPage + halfVisible);
            
            if (endPage - startPage + 1 < maxVisibleButtons) {
                startPage = Math.max(1, endPage - maxVisibleButtons + 1);
            }
        }
        
        if (startPage > 1) {
            const firstBtn = document.createElement('button');
            firstBtn.className = 'page-btn';
            firstBtn.innerHTML = '1';
            firstBtn.onclick = () => changeWorksPage(1);
            paginationEl.appendChild(firstBtn);
            
            if (startPage > 2) {
                const dots = document.createElement('span');
                dots.style.color = '#666';
                dots.style.padding = '0 5px';
                dots.innerHTML = '...';
                paginationEl.appendChild(dots);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            pageBtn.innerHTML = i;
            pageBtn.onclick = () => changeWorksPage(i);
            paginationEl.appendChild(pageBtn);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const dots = document.createElement('span');
                dots.style.color = '#666';
                dots.style.padding = '0 5px';
                dots.innerHTML = '...';
                paginationEl.appendChild(dots);
            }
            
            const lastBtn = document.createElement('button');
            lastBtn.className = 'page-btn';
            lastBtn.innerHTML = totalPages;
            lastBtn.onclick = () => changeWorksPage(totalPages);
            paginationEl.appendChild(lastBtn);
        }
        
        const nextBtn = document.createElement('button');
        nextBtn.className = `page-btn ${currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.innerHTML = '›';
        nextBtn.onclick = () => changeWorksPage(currentPage + 1);
        if (currentPage === totalPages) nextBtn.disabled = true;
        paginationEl.appendChild(nextBtn);
        
        const startItem = totalWorks > 0 ? (currentPage - 1) * window.worksPerPage + 1 : 0;
        const endItem = Math.min(currentPage * window.worksPerPage, totalWorks);
        const infoSpan = document.createElement('span');
        infoSpan.style.marginLeft = '10px';
        infoSpan.style.fontSize = '12px';
        infoSpan.style.color = '#999';
        infoSpan.style.whiteSpace = 'nowrap';
        infoSpan.innerHTML = `${startItem}-${endItem} / ${totalWorks}`;
        paginationEl.appendChild(infoSpan);
        
    } catch (error) {
        console.error('渲染分页失败:', error);
    }
}

function changeWorksPage(page) {
    try {
        const filteredWorks = window.currentWorksCategory === 'all' 
            ? gameState.worksList 
            : gameState.worksList.filter(work => work.type === window.currentWorksCategory);
        
        const sortedWorks = getSortedWorks(filteredWorks, window.currentWorksSort);
        
        const totalPages = Math.max(1, Math.ceil(sortedWorks.length / window.worksPerPage));
        
        if (page < 1 || page > totalPages) return;
        
        window.currentWorksPage = page;
        
        renderWorksPage();
        
        const content = document.querySelector('.fullscreen-content');
        if (content) {
            content.scrollTop = 0;
        }
        
    } catch (error) {
        console.error('切换页面失败:', error);
    }
}

function filterWorksByCategory(category) {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    window.currentWorksCategory = category;
    window.currentWorksPage = 1;
    
    renderWorksPage();
}

function startWorksRealtimeUpdate() {
    if (window.worksUpdateInterval) {
        clearInterval(window.worksUpdateInterval);
    }
    
    window.worksUpdateInterval = setInterval(() => {
        const worksPage = document.getElementById('worksListTab');
        if (worksPage && worksPage.offsetParent !== null) {
            const activeTab = document.querySelector('.nav-item.active');
            if (activeTab && activeTab.textContent.includes('作品')) {
                if (typeof renderWorksPage === 'function') {
                    renderWorksPage();
                }
            }
        }
    }, 1000);
}

// 作品列表更新
function updateWorksList() {
    const worksList = document.getElementById('worksList');
    if (!worksList) return;
    
    worksList.innerHTML = '';
    const recentWorks = gameState.worksList.slice(-5).reverse();
    
    const fragment = document.createDocumentFragment();
    
    recentWorks.forEach((work) => {
        const badges = generateStatusBadges(work);
        const statusBar = badges.map(badge => `
            <span class="${badge.class}" style="${badge.style}animation:pulse 1s infinite;padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;display:inline-block;">
                ${badge.text}
            </span>
        `).join('');
        
        const workDiv = document.createElement('div');
        workDiv.className = 'work-item';
        workDiv.onclick = () => showWorkDetail(work);
        workDiv.innerHTML = `
            ${statusBar ? `<div style="margin-bottom:8px;">${statusBar}</div>` : ''}
            <div class="work-header">
                <span class="work-type">${work.type === 'video' ? '🎬 视频' : work.type === 'live' ? '📱 直播' : '📝 动态'} ${work.isPrivate ? '<span style="background:#999;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">🔒私密</span>' : ''}</span>
                <span class="work-time">${formatTime(work.time)} ${work.isAd ? '<span style="background:#ff0050;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">商单</span>' : ''}</span>
            </div>
            <div class="work-content" style="${work.isPrivate ? 'opacity: 0.7;' : ''}">${work.content}</div>
            <div class="work-stats">
                <span>${work.type === 'post' ? '👁️' : '▶️'} ${work.views.toLocaleString()}</span>
                <span>❤️ ${work.likes.toLocaleString()}</span>
                <span>💬 ${(work.comments || 0).toLocaleString()}</span>
                <span>🔄 ${work.shares.toLocaleString()}</span>
            </div>
        `;
        fragment.appendChild(workDiv);
    });
    
    worksList.appendChild(fragment);
    
    if (recentWorks.length === 0) {
        worksList.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">还没有作品，快去创作吧！</div>';
    }
}

// 用户主页显示
function showUserProfile(username, avatar) {
    const userId = 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const joinDays = Math.floor(Math.random() * 365) + 1;
    const fanCount = Math.floor(Math.random() * 50000) + 100;
    const workCount = Math.floor(Math.random() * 500) + 10;
    const likeCount = Math.floor(Math.random() * 100000) + 1000;
    const following = Math.floor(Math.random() * 500) + 50;
    const level = Math.floor(Math.random() * 50) + 1;
    const vipLevel = Math.random() < 0.3 ? Math.floor(Math.random() * 5) + 1 : 0;
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">用户主页</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: bold; margin: 0 auto 15px;">
                ${avatar}
            </div>
            <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">
                ${username}
                ${vipLevel > 0 ? `<span style="background: linear-gradient(135deg, #FFD700 0%, #ff6b00 100%); color: #000; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin-left: 8px;">VIP${vipLevel}</span>` : ''}
            </div>
            <div style="font-size: 12px; color: #999; margin-bottom: 20px;">${userId}</div>
            
            <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold;">${formatNumber(fanCount)}</div>
                    <div style="font-size: 12px; color: #999;">粉丝</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold;">${formatNumber(following)}</div>
                    <div style="font-size: 12px; color: #999;">关注</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold;">${formatNumber(workCount)}</div>
                    <div style="font-size: 12px; color: #999;">作品</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 18px; font-weight: bold;">${formatNumber(likeCount)}</div>
                    <div style="font-size: 12px; color: #999;">获赞</div>
                </div>
            </div>
            
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #999;">等级</span>
                    <span style="font-weight: bold;">Lv.${level}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #999;">加入平台</span>
                    <span style="font-weight: bold;">${joinDays}天</span>
                </div>
            </div>
            
            <div style="background: #161823; border-radius: 10px; padding: 15px;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">简介</div>
                <div style="font-size: 12px; color: #999; line-height: 1.5;">
                    ${getRandomUserBio()}
                </div>
            </div>
            
            <button class="btn" onclick="closeModal()" style="margin-top: 20px;">关闭</button>
        </div>
    `;
    
    showModal(modalContent);
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

function generateStableCommentId(workId, index) {
    return `comment_${workId}_${index}`;
}

// 绑定全局函数
window.updateWorksList = updateWorksList;
window.startWorkUpdates = startWorkUpdates;
window.showWorkDetail = showWorkDetail;
window.deleteWork = deleteWork;
window.togglePrivate = togglePrivate;
window.showWorksFullscreen = showWorksFullscreen;
window.renderWorksPage = renderWorksPage;
window.renderWorksPagination = renderWorksPagination;
window.changeWorksPage = changeWorksPage;
window.filterWorksByCategory = filterWorksByCategory;
window.startWorksRealtimeUpdate = startWorksRealtimeUpdate;
window.showUserProfile = showUserProfile;
window.getRandomUserBio = getRandomUserBio;
window.generateStableCommentId = generateStableCommentId;
window.currentDetailWork = currentDetailWork;
window.changeWorksSort = changeWorksSort;
window.getSortedWorks = getSortedWorks;
window.generateStatusBadges = generateStatusBadges;
