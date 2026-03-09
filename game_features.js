// ==================== 发布视频（改为全屏） ====================
function showCreateVideo() {
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法发布作品'); 
        return; 
    }
    
    const content = document.getElementById('createVideoPageContent');
    content.innerHTML = `
        <div class="input-group">
            <div class="input-label">视频标题</div>
            <input type="text" class="text-input" id="videoTitle" placeholder="给你的视频起个标题" maxlength="50">
        </div>
        <div class="input-group">
            <div class="input-label">视频内容</div>
            <textarea class="text-input" id="videoContent" rows="6" placeholder="描述你的视频内容" maxlength="200"></textarea>
        </div>
    `;
    
    document.getElementById('createVideoPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 作品粉丝增长机制（已废弃 - 旧版） ====================
// ⚠️ 此函数已废弃，不再使用
function startWorkFanGrowth(workId, isResume = false) {
    console.warn('⚠️ startWorkFanGrowth 函数已废弃，请使用全局系统');
    // 保留空函数避免报错
}

// ==================== 创建视频（修改版：从0开始 + 全局粉丝增长） ====================
function createVideo() {
    const title = document.getElementById('videoTitle').value.trim();
    const content = document.getElementById('videoContent').value.trim();
    if (!title || !content) { 
        showAlert('请填写完整信息', '提示');
        return; 
    }
    if (typeof checkViolation === 'function' && checkViolation(title + content)) return;
    
    // ✅ 修改：初始值全部设为0，从0开始增长
    const views = 0;
    const likes = 0;
    const comments = 0;
    const shares = 0;
    const work = { 
        id: Date.now(), 
        type: 'video', 
        title: title, 
        content: content, 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: gameTimer,
        isPrivate: false,
        isRecommended: false,
        recommendEndTime: null,
        recommendInterval: null,
        isControversial: false,
        controversyEndTime: null,
        controversyInterval: null,
        isHot: false,
        hotEndTime: null,
        hotInterval: null,
        // ✅ 移除：不再使用单独的粉丝增长定时器
        // growthEndTime: null,
        // fanGrowthInterval: null
    };
    
    // ✅ 新增：为新视频生成初始消息通知
    if (!gameState.messages) gameState.messages = [];
    
    // ✅ 修改：由于初始likes为0，这些循环不会执行
    for (let i = 0; i < Math.min(likes, 5); i++) {
        if (Math.random() < 0.6) {
            gameState.messages.push({
                id: Date.now() + Math.random() + i,
                type: 'like',
                user: generateRandomUsername(),
                workId: work.id,
                workContent: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                time: gameTimer,
                read: false
            });
        }
    }
    
    gameState.worksList.push(work);
    gameState.works++;
    // ✅ 修改：不直接增加views和likes，因为它们从0开始
    // gameState.views += views;
    // gameState.likes += likes;
    
    // ✅ 修改：初始不产生收益
    // gameState.money += Math.floor(views / 1000);
    
    // ✅ 修改：初始不直接增加粉丝，而是通过全局系统获取
    const newFans = 0;
    // gameState.fans += newFans;
    
    const interactionBoost = comments + likes + shares;
    gameState.totalInteractions += interactionBoost;
    
    resetInactivityDropState();
    
    closeFullscreenPage('createVideo');
    updateDisplay();
    
    // ✅ 修改：只显示小弹窗通知
    showEventPopup('🎉 视频发布成功', '视频已发布，开始积累播放量和互动！');
    
    // ✅ ✅ ✅ 关键修改：将作品加入全局粉丝增长系统
    if (typeof window.addWorkToGlobalFanGrowth === 'function') {
        window.addWorkToGlobalFanGrowth(work.id, true); // isNewWork = true
    }
    
    // ✅ 新增：每发布一个作品，提升自然涨粉增益
    gameState.baseFanChangeBoost += 5;
    console.log(`✅ 发布视频成功，自然涨粉增益提升至: ${gameState.baseFanChangeBoost}`);
}

// ==================== 发布动态（改为全屏） ====================
function showCreatePost() {
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法发布作品'); 
        return; 
    }
    
    const content = document.getElementById('createPostPageContent');
    content.innerHTML = `
        <div class="input-group">
            <div class="input-label">动态内容</div>
            <textarea class="text-input" id="postContent" rows="8" placeholder="分享你的想法..." maxlength="500"></textarea>
        </div>
    `;
    
    document.getElementById('createPostPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 创建动态（修改版：从0开始 + 全局粉丝增长） ====================
function createPost() {
    const content = document.getElementById('postContent').value.trim();
    if (!content) { 
        showAlert('请输入动态内容', '提示');
        return; 
    }
    if (typeof checkViolation === 'function' && checkViolation(content)) return;
    
    // ✅ 修改：初始值全部设为0，从0开始增长
    const views = 0;
    const likes = 0;
    const comments = 0;
    const shares = 0;
    const work = { 
        id: Date.now(), 
        type: 'post', 
        content: content, 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: gameTimer,
        isPrivate: false,
        isHot: false,
        hotEndTime: null,
        hotInterval: null,
        // ✅ 移除：不再需要单独的粉丝增长定时器
        // growthEndTime: null,
        // fanGrowthInterval: null
    };
    
    // ✅ 新增：为新动态生成初始消息通知
    if (!gameState.messages) gameState.messages = [];
    
    // ✅ 修改：由于初始likes为0，这些循环不会执行
    for (let i = 0; i < Math.min(likes, 3); i++) {
        if (Math.random() < 0.6) {
            gameState.messages.push({
                id: Date.now() + Math.random() + i,
                type: 'like',
                user: generateRandomUsername(),
                workId: work.id,
                workContent: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                time: gameTimer,
                read: false
            });
        }
    }
    
    for (let i = 0; i < Math.min(comments, 2); i++) {
        if (Math.random() < 0.7) {
            gameState.messages.push({
                id: Date.now() + Math.random() + i + 10000,
                type: 'comment',
                user: generateRandomUsername(),
                workId: work.id,
                workContent: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                time: gameTimer,
                read: false
            });
        }
    }
    
    for (let i = 0; i < Math.min(shares, 2); i++) {
        if (Math.random() < 0.5) {
            gameState.messages.push({
                id: Date.now() + Math.random() + i + 20000,
                type: 'share',
                user: generateRandomUsername(),
                workId: work.id,
                workContent: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
                time: gameTimer,
                read: false
            });
        }
    }
    
    gameState.worksList.push(work);
    gameState.works++;
    gameState.likes += likes;
    // ✅ 修改：初始不直接增加粉丝
    const newFans = 0;
    // gameState.fans += newFans;
    
    const interactionBoost = comments + likes + shares;
    gameState.totalInteractions += interactionBoost;
    
    resetInactivityDropState();
    
    closeFullscreenPage('createPost');
    updateDisplay();
    
    // ✅ 修改：只显示小弹窗通知
    showEventPopup('📝 动态发布成功', '动态已发布，开始积累浏览和互动！');
    
    // ✅ ✅ ✅ 关键修改：将作品加入全局粉丝增长系统
    if (typeof window.addWorkToGlobalFanGrowth === 'function') {
        window.addWorkToGlobalFanGrowth(work.id, true); // isNewWork = true
    }
    
    // ✅ 新增：每发布一个作品，提升自然涨粉增益
    gameState.baseFanChangeBoost += 5;
    console.log(`✅ 发布动态成功，自然涨粉增益提升至: ${gameState.baseFanChangeBoost}`);
}

// ==================== 直播控制 ====================
function startLive() {
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法直播'); 
        return; 
    }
    if (gameState.liveStatus) { 
        showNotification('提示', '你正在直播中'); 
        return; 
    }
    
    const content = document.getElementById('workDetailPageContent');
    content.innerHTML = `
        <div class="live-container">
            <div class="live-header">
                <div>
                    <div style="font-size:16px;font-weight:bold">${gameState.username}的直播间</div>
                    <div style="font-size:12px;color:#999">直播分类：娱乐</div>
                </div>
                <div class="live-viewers">👥 0</div>
            </div>
            <div class="live-content">
                <div class="live-avatar">${gameState.avatar}</div>
            </div>
            <div class="live-controls">
                <button class="live-btn live-btn-start" onclick="startLiveStream()">开始直播</button>
                <button class="live-btn live-btn-end" onclick="endLiveStream()">结束直播</button>
            </div>
        </div>
    `;
    
    gameState.liveStatus = true;
    updateDisplay();
    document.getElementById('workDetailTitle').textContent = '直播间';
    document.getElementById('workDetailPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

function startLiveStream() {
    let liveData = { 
        viewers: Math.floor(Math.random() * 1000) + 100, 
        likes: 0, 
        comments: 0, 
        shares: 0, 
        revenue: 0, 
        duration: 0,
        startTime: Date.now(),
        startVirtualTime: gameTimer
    };
    
    if (!gameState.liveHistory) gameState.liveHistory = [];
    
    // ✅ 获取热度值倍数（在函数开始处获取，避免重复获取）
    const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
        ? window.getHotValueMultiplier() 
        : 1.0;
    
    gameState.liveInterval = setInterval(() => {
        if (!gameState.liveStatus) { 
            clearInterval(gameState.liveInterval); 
            return; 
        }
        liveData.duration++;
        const viewerChange = Math.floor(Math.random() * 100) - 50;
        liveData.viewers = Math.max(50, liveData.viewers + viewerChange);
        if (Math.random() < 0.3) {
            // ✅ 修改：应用热度值倍数到点赞
            const likeGain = Math.floor((Math.floor(Math.random() * 50) + 10) * hotMultiplier);
            liveData.likes += likeGain;
            
            // ✅ 新增：直播点赞生成消息
            if (Math.random() < 0.3 && !gameState.messages) gameState.messages = [];
            if (Math.random() < 0.3) {
                gameState.messages.push({
                    id: Date.now() + Math.random(),
                    type: 'like',
                    user: generateRandomUsername(),
                    workId: Date.now(),
                    workContent: `${gameState.username}的直播间`,
                    time: gameTimer,
                    read: false
                });
            }
        }
        if (Math.random() < 0.1) {
            // ✅ 修改：应用热度值倍数到评论
            const commentGain = Math.floor((Math.floor(Math.random() * 10) + 1) * hotMultiplier);
            liveData.comments += commentGain;
        }
        if (Math.random() < 0.05) {
            // ✅ 修改：应用热度值倍数到转发
            const shareGain = Math.floor((Math.floor(Math.random() * 5) + 1) * hotMultiplier);
            liveData.shares += shareGain;
        }
        if (Math.random() < 0.2) {
            // ✅ 修改：应用热度值倍数到收益
            const revenue = Math.floor((Math.floor(Math.random() * 100) + 10) * hotMultiplier);
            liveData.revenue += revenue;
            gameState.money += revenue;
        }
        if (Math.random() < 0.1) {
            let newFans = Math.floor(Math.random() * 20) + 1;
            
            // ✅ 修改：应用热度值倍数到涨粉
            newFans = Math.floor(newFans * hotMultiplier);
            
            gameState.fans += newFans;
            
            // ✅ 修复：记录直播涨粉
            gameState.todayNewFans += newFans;
            if (Math.random() < 0.5) { // 50%概率通知
                addFanChangeNotification('⬆️', `直播吸引了${newFans.toLocaleString()}个新粉丝`, '直播涨粉', 'gain', newFans);
            }
        }
        const viewersElement = document.querySelector('.live-viewers');
        if (viewersElement) viewersElement.textContent = `👥 ${liveData.viewers.toLocaleString()}`;
        gameState.currentLive = { 
            id: Date.now(), 
            type: 'live', 
            content: `${gameState.username}的直播间`, 
            views: liveData.viewers, 
            likes: liveData.likes, 
            comments: liveData.comments, 
            shares: liveData.shares, 
            time: gameTimer,
            liveData: liveData, 
            isPrivate: false,
            // ✅ 移除：不再需要单独的粉丝增长定时器
            // growthEndTime: null,
            // fanGrowthInterval: null
        };
        if (Math.random() < 0.02) {
            const events = ['用户「直播达人」赠送了火箭礼物！', '用户「小可爱123」加入了直播间', '直播间登上了热门推荐！', '收到了大量弹幕互动！'];
            // ✅ 修改：使用小弹窗通知
            showEventPopup('💬 直播互动', events[Math.floor(Math.random() * events.length)]);
        }
        updateDisplay();
    }, 2000);
    
    // ✅ 新增：小弹窗通知
    showEventPopup('📱 直播已开始', `欢迎来到 ${gameState.username} 的直播间`);
}

function endLiveStream() {
    gameState.liveStatus = false;
    if (gameState.liveInterval) {
        clearInterval(gameState.liveInterval);
        gameState.liveInterval = null;
    }
    if (gameState.currentLive && gameState.currentLive.liveData) {
        const liveData = gameState.currentLive.liveData;
        const totalViews = Math.floor(liveData.viewers * 10 + Math.random() * 10000);
        gameState.currentLive.views = totalViews;
        gameState.currentLive.likes = liveData.likes;
        gameState.currentLive.comments = liveData.comments;
        gameState.currentLive.shares = liveData.shares;
        gameState.currentLive.revenue = liveData.revenue;
        
        const endTime = Date.now();
        const liveRecord = {
            startTime: liveData.startTime,
            endTime: endTime,
            duration: liveData.duration,
            views: totalViews,
            peakViewers: Math.max(liveData.viewers, 100),
            startVirtualHour: Math.floor((liveData.startVirtualTime % VIRTUAL_DAY_MS) / VIRTUAL_HOUR_MS),
            endVirtualHour: Math.floor((gameTimer % VIRTUAL_DAY_MS) / VIRTUAL_HOUR_MS)
        };
        
        if (!gameState.liveHistory) gameState.liveHistory = [];
        gameState.liveHistory.push(liveRecord);
        
        // ✅ 新增：直播结束时生成点赞/评论消息
        if (!gameState.messages) gameState.messages = [];
        
        // 生成直播点赞消息
        for (let i = 0; i < Math.min(liveData.likes, 10); i++) {
            if (Math.random() < 0.4) {
                gameState.messages.push({
                    id: Date.now() + Math.random() + i,
                    type: 'like',
                    user: generateRandomUsername(),
                    workId: gameState.currentLive.id,
                    workContent: `${gameState.username}的直播间`,
                    time: gameTimer,
                    read: false
                });
            }
        }
        
        gameState.worksList.push(gameState.currentLive);
        gameState.works++;
        gameState.views += totalViews;
        gameState.likes += liveData.likes;
        
        gameState.totalInteractions += liveData.comments + liveData.likes + liveData.shares;
        
        // ✅ 已移除: 夜猫子成就检测代码
        // ✅ 已移除: 早起鸟儿成就检测代码
        
        if (totalViews >= 1000) {
            const liveStarAchievement = achievements.find(a => a.id === 8);
            if (liveStarAchievement && !liveStarAchievement.unlocked) {
                liveStarAchievement.unlocked = true;
                gameState.achievements.push(8);
                showAchievementPopup(liveStarAchievement);
                // ✅ 修改：只显示小弹窗通知
                showEventPopup('🏆 成就解锁', `直播新星：${liveStarAchievement.desc}`);
            }
        }
        
        // ✅ 修改：只显示小弹窗通知
        showEventPopup('📱 直播已结束', `🎯 ${totalViews.toLocaleString()} 观看 | 💰 ${liveData.revenue} 元打赏`);
    }
    
    if (typeof checkAchievements === 'function') {
        checkAchievements();
    }
    
    gameState.lastWorkTime = gameTimer;
    
    // ✅ 新增：每发布一个作品（直播结束算发布），提升自然涨粉增益
    gameState.baseFanChangeBoost += 5;
    console.log(`✅ 直播结束，自然涨粉增益提升至: ${gameState.baseFanChangeBoost}`);
    
    closeFullscreenPage('workDetail');
    updateDisplay();
}

function toggleLive() {
    if (!gameState.liveStatus) startLive(); 
    else endLiveStream();
}

// ==================== 全局变量：购买流量排序状态 ====================
window.currentTrafficSort = 'latest';

// ✅ 新增：全局流量推广热度值管理
window.trafficHotValueManager = {
    activeCount: 0,           // 当前活跃的流量推广数量
    growthInterval: null,     // 增长定时器
    dropInterval: null,       // 下降定时器
    dropEndTime: null,        // 下降结束时间
    
    // 计算当前每秒增长范围
    getGrowthRange: function() {
        // 基础 1-10，每个推广 +10，上限 1-150
        const minGrowth = 1;
        const maxGrowth = Math.min(150, 10 + (this.activeCount - 1) * 10);
        return { min: minGrowth, max: maxGrowth };
    },
    
    // 开始增长
    startGrowth: function() {
        if (this.growthInterval) {
            clearInterval(this.growthInterval);
        }
        
        this.growthInterval = setInterval(() => {
            if (window.HotValueSystem && window.HotValueSystem.currentHotValue !== undefined) {
                const range = this.getGrowthRange();
                const increase = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                window.HotValueSystem.currentHotValue = Math.min(
                    window.HotValueSystem.config.maxHotValue,
                    window.HotValueSystem.currentHotValue + increase
                );
                gameState.currentHotValue = window.HotValueSystem.currentHotValue;
            }
        }, 1000);
        
        console.log(`[流量热度值] 启动增长，当前推广数: ${this.activeCount}，范围: 1-${this.getGrowthRange().max}/秒`);
    },
    
    // 停止增长
    stopGrowth: function() {
        if (this.growthInterval) {
            clearInterval(this.growthInterval);
            this.growthInterval = null;
        }
    },
    
    // 开始下降（3天）
    startDrop: function() {
        // 先清理可能存在的旧下降定时器
        this.stopDrop();
        
        this.dropEndTime = gameTimer + (3 * VIRTUAL_DAY_MS);
        
        this.dropInterval = setInterval(() => {
            // 检查是否已到3天
            if (gameTimer >= this.dropEndTime) {
                this.stopDrop();
                console.log('[流量热度值] 3天下降期结束');
                showEventPopup('📈 热度值回落完成', '流量推广带来的热度值已完全回落');
                return;
            }
            
            // 每秒掉1-100
            if (window.HotValueSystem && window.HotValueSystem.currentHotValue !== undefined) {
                const decrease = Math.floor(Math.random() * 100) + 1;
                window.HotValueSystem.currentHotValue = Math.max(0, window.HotValueSystem.currentHotValue - decrease);
                gameState.currentHotValue = window.HotValueSystem.currentHotValue;
            }
        }, 1000);
        
        console.log('[流量热度值] 启动3天下降期');
    },
    
    // 停止下降
    stopDrop: function() {
        if (this.dropInterval) {
            clearInterval(this.dropInterval);
            this.dropInterval = null;
        }
        this.dropEndTime = null;
    },
    
    // 增加活跃计数
    addActive: function() {
        this.activeCount++;
        // 启动或重启增长
        this.startGrowth();
        // 如果有下降定时器，停止它
        this.stopDrop();
    },
    
    // 减少活跃计数
    removeActive: function() {
        this.activeCount = Math.max(0, this.activeCount - 1);
        
        // 如果没有活跃的了
        if (this.activeCount === 0) {
            this.stopGrowth();
            this.startDrop();
        }
    },
    
    // 清理所有
    cleanup: function() {
        this.stopGrowth();
        this.stopDrop();
        this.activeCount = 0;
    }
};

// ==================== 流量购买（改为全屏 + 添加排序 + 天数输入控件） ====================
function showBuyTraffic() {
    // ✅ 新增：账号被封禁时无法购买流量
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法购买流量'); 
        return; 
    }
    
    const availableWorks = gameState.worksList.filter(w => w.type === 'video' || w.type === 'post');
    if (availableWorks.length === 0) { 
        showWarning('暂无作品可推广，请先发布作品'); 
        return; 
    }
    
    window.selectedWorkIds = [];
    window.selectedTrafficDays = 1;
    window.currentTrafficSort = 'latest'; // 重置为默认排序
    
    // 创建排序选择器
    const sortSelector = `
        <div style="margin-bottom: 15px; padding: 10px; background: #161823; border-radius: 10px;">
            <div class="input-label">选择排序方式</div>
            <select id="trafficSortSelect" onchange="sortTrafficWorks(this.value)" style="width: 100%; background: #222; border: 1px solid #333; color: #fff; border-radius: 8px; padding: 10px; font-size: 14px;">
                <option value="latest">📅 最新发布</option>
                <option value="oldest">📅 最早发布</option>
                <option value="mostViews">▶️ 最多播放</option>
                <option value="mostLikes">❤️ 最多点赞</option>
                <option value="mostComments">💬 最多评论</option>
                <option value="mostShares">🔄 最多转发</option>
            </select>
        </div>
    `;
    
    // ✅ 修改：天数选择改为可输入+加减按钮（1-30）
    const daysSelector = `
        <div style="margin-bottom: 15px; padding: 10px; background: #161823; border-radius: 10px;">
            <div class="input-label">选择推广天数</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <button onclick="changeTrafficDays(-1)" style="background: linear-gradient(135deg, #667aea 0%, #764ba2 100%); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer;">-</button>
                <input type="number" id="trafficDaysInput" min="1" max="30" value="1" style="width: 80px; text-align: center; background: #222; border: 1px solid #333; color: #fff; border-radius: 8px; padding: 10px; font-size: 16px; font-weight: bold;" onchange="updateTrafficDaysFromInput()">
                <button onclick="changeTrafficDays(1)" style="background: linear-gradient(135deg, #667aea 0%, #764ba2 100%); border: none; color: #fff; width: 40px; height: 40px; border-radius: 50%; font-size: 20px; cursor: pointer;">+</button>
            </div>
            <div style="font-size: 12px; color: #999; text-align: center; margin-top: 5px;">
                单价 1000元/天 · 总计 <span id="trafficPriceDisplay">1000</span> 元
            </div>
            <div style="font-size: 11px; color: #ff6b00; text-align: center; margin-top: 3px;">
                (可输入1-30天)
            </div>
        </div>
    `;
    
    const content = document.getElementById('buyTrafficPageContent');
    content.innerHTML = `
        ${daysSelector}
        ${sortSelector}
        <div style="margin-bottom: 15px;">
            <div class="input-label">选择要推广的作品（可多选）</div>
            <div style="max-height: 40vh; overflow-y: auto; border-radius: 10px; background: #161823; padding: 10px;">
                <div id="trafficWorksList"></div>
            </div>
            <div id="selectedCount" style="margin-top: 10px; font-size: 14px; color: #667aea;">已选择：0个作品</div>
        </div>
        <button class="btn" id="confirmTrafficBtn" onclick="confirmBuyTraffic()">批量购买并启动推广</button>
    `;
    
    // ✅ 修复：应用默认排序（最新发布）
    const sortedWorks = getSortedWorks(availableWorks, 'latest');
    
    // 初始渲染作品列表
    renderTrafficWorksList(sortedWorks);
    updateTrafficTotalPrice();
    updateSelectedCount();
    
    document.getElementById('buyTrafficPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ✅ 新增：通过加减按钮改变推广天数
function changeTrafficDays(delta) {
    const input = document.getElementById('trafficDaysInput');
    if (!input) return;
    let newVal = parseInt(input.value) + delta;
    if (isNaN(newVal)) newVal = 1;
    newVal = Math.min(30, Math.max(1, newVal));
    input.value = newVal;
    window.selectedTrafficDays = newVal;
    updateTrafficTotalPrice();
}

// ✅ 新增：手动输入时同步天数
function updateTrafficDaysFromInput() {
    const input = document.getElementById('trafficDaysInput');
    if (!input) return;
    let val = parseInt(input.value);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 30) val = 30;
    input.value = val;
    window.selectedTrafficDays = val;
    updateTrafficTotalPrice();
}

function sortTrafficWorks(sortType) {
    window.currentTrafficSort = sortType;
    const availableWorks = gameState.worksList.filter(w => w.type === 'video' || w.type === 'post');
    const sortedWorks = getSortedWorks(availableWorks, sortType);
    renderTrafficWorksList(sortedWorks);
    
    // 显示通知
    const sortNames = {
        'latest': '最新发布',
        'oldest': '最早发布',
        'mostViews': '最多播放',
        'mostLikes': '最多点赞',
        'mostComments': '最多评论',
        'mostShares': '最多转发'
    };
    // ✅ 修改：使用小弹窗通知
    showEventPopup('排序已切换', `当前按${sortNames[sortType] || '最新发布'}显示`);
}

function renderTrafficWorksList(works) {
    const container = document.getElementById('trafficWorksList');
    if (!container) return;
    
    const worksHtml = works.map(work => {
        const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
        const statusText = isTrafficActive ? '（推广中）' : '';
        
        return `
            <div class="work-item traffic-select-item" onclick="toggleTrafficSelection(${work.id})" data-work-id="${work.id}">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <div class="traffic-checkbox" id="checkbox-${work.id}" style="width: 20px; height: 20px; border: 2px solid #667eea; border-radius: 5px; flex-shrink: 0; margin-top: 2px;"></div>
                    <div style="flex: 1;">
                        <div class="work-header">
                            <span class="work-type">${work.type === 'video' ? '🎬 视频' : '📝 动态'} ${statusText}</span>
                            <span class="work-time">${formatTime(work.time)}</span>
                        </div>
                        <div class="work-content" style="font-size: 14px;">${work.content.substring(0, 50)}${work.content.length > 50 ? '...' : ''}</div>
                        <div class="work-stats" style="font-size: 11px;">
                            <span>${work.type === 'post' ? '👁️' : '▶️'} ${work.views.toLocaleString()}</span>
                            <span>❤️ ${work.likes.toLocaleString()}</span>
                            <span>💬 ${work.comments.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = worksHtml;
}

function toggleTrafficSelection(workId) {
    const index = window.selectedWorkIds.indexOf(workId);
    const checkbox = document.getElementById(`checkbox-${workId}`);
    const item = document.querySelector(`[data-work-id="${workId}"]`);
    
    if (index > -1) {
        window.selectedWorkIds.splice(index, 1);
        checkbox.style.background = '';
        item.style.border = '';
        item.style.background = '#161823';
    } else {
        window.selectedWorkIds.push(workId);
        checkbox.style.background = '#667eea';
        item.style.border = '2px solid #667eea';
        item.style.background = '#222';
    }
    
    updateTrafficTotalPrice();
    updateSelectedCount();
}

function updateTrafficTotalPrice() {
    const days = window.selectedTrafficDays || 1;
    const selectedCount = window.selectedWorkIds.length;
    const totalPrice = selectedCount * days * 1000;
    const priceEl = document.getElementById('trafficPriceDisplay');
    if (priceEl) {
        priceEl.textContent = `${totalPrice.toLocaleString()}元`;
    }
}

function updateSelectedCount() {
    const countEl = document.getElementById('selectedCount');
    if (countEl) countEl.textContent = `已选择：${window.selectedWorkIds.length}个作品`;
}

function selectTrafficDays(element, days) {
    // 此函数已废弃，但保留以免其他代码调用
    console.warn('selectTrafficDays 已废弃，请使用天数输入控件');
}

function confirmBuyTraffic() {
    if (!window.selectedWorkIds || window.selectedWorkIds.length === 0) { 
        showWarning('请先选择要推广的作品'); 
        return; 
    }
    
    const days = window.selectedTrafficDays || 1;
    const selectedCount = window.selectedWorkIds.length;
    const totalPrice = selectedCount * days * 1000;
    
    if (gameState.money < totalPrice) { 
        showWarning(`零钱不足！需要${totalPrice.toLocaleString()}元`); 
        return; 
    }
    
    const activeWorks = window.selectedWorkIds.filter(id => 
        gameState.trafficWorks[id] && gameState.trafficWorks[id].isActive
    );
    
    if (activeWorks.length > 0) {
        showWarning(`有${activeWorks.length}个作品已在推广中！`);
        return;
    }
    
    gameState.money -= totalPrice;
    window.selectedWorkIds.forEach(workId => {
        startNewTraffic(workId, days);
    });
    
    closeFullscreenPage('buyTraffic');
    
    // ✅ 修改：显示热度值增长信息
    const range = window.trafficHotValueManager.getGrowthRange();
    showEventPopup('💰 流量购买成功', `已为 ${selectedCount} 个作品购买${days}天流量推送！热度值增长：1-${range.max}/秒`);
    
    updateDisplay();
}

function startNewTraffic(workId, days) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work) return;
    gameState.trafficWorks[workId] = {
        workId: workId,
        days: days,
        startTime: gameTimer,
        isActive: true,
        remainingTime: days
    };
    if (typeof startTrafficProcess === 'function') startTrafficProcess(workId);
    updateDisplay();
}

// ==================== 申诉功能（核心修改：改用AI审核 + 更严厉） ====================
function showAppeal() {
    // 基础检查
    if (!gameState.isBanned || !gameState.appealAvailable) {
        showWarning('当前无法申诉');
        return;
    }
    
    // ✅ 新增：检查是否是假商单封禁
    if (gameState.banReason && gameState.banReason.includes('虚假商单')) {
        showWarning('因接假商单被封禁，无法申诉');
        return;
    }
    
    const timePassed = gameTimer - gameState.banStartTime;
    const daysLeft = Math.ceil(gameState.banDaysCount - (timePassed / VIRTUAL_DAY_MS));
    
    if (daysLeft <= 0) {
        showWarning('账号已解封，无需申诉');
        return;
    }
    
    // ✅ 保留：封禁超过15天无法申诉（一次性被封15天以上）
    if (gameState.banDaysCount > 15) {
        showWarning('封禁天数超过15天，无法申诉');
        return;
    }
    
    // ✅ 改用AI审核系统，更严厉的申诉
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">账号封禁申诉</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
                    🚫 账号封禁申诉
                </div>
                <div style="font-size: 12px; color: #999; margin-bottom: 10px;">
                    封禁原因：${gameState.banReason || '违反社区规定'}
                </div>
                <div style="font-size: 12px; color: #ccc;">
                    剩余封禁天数：${daysLeft}天
                </div>
            </div>
            
            <div class="input-group" style="margin-bottom: 15px;">
                <div class="input-label" style="color: #ff6b00; font-weight: bold;">
                    ✍️ 请说明申诉理由（系统将检测您的真诚度）
                </div>
                <textarea class="text-input" id="appealReason" rows="6" 
                          placeholder="请详细说明为什么认为封禁不合理，态度真诚有助于申诉成功..."
                          maxlength="300"></textarea>
            </div>
            
            <div style="background: linear-gradient(135deg, #222 0%, #161823 50%); border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                <div style="font-size: 12px; color: #999; margin-bottom: 8px;">
                    💡 申诉提示（封禁申诉更严厉）：
                </div>
                <div style="font-size: 11px; color: #ccc; line-height: 1.5;">
                    • 封禁申诉审核更严格，需要更高的真诚度<br>
                    • 字数建议在80-250字之间<br>
                    • 系统将检测您的真诚度，阈值更高<br>
                    • 申诉失败将失去再次申诉的机会<br>
                    • 因接假商单被封禁无法申诉
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" onclick="closeModal()">取消申诉</button>
                <button class="btn" onclick="submitBanAppeal()" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    提交申诉
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
    
    setTimeout(() => {
        const textarea = document.getElementById('appealReason');
        if (textarea) textarea.focus();
    }, 100);
}

// ✅ 提交封禁申诉（更严厉的审核）
function submitBanAppeal() {
    const reason = document.getElementById('appealReason').value.trim();
    if (!reason) {
        showAlert('请输入申诉理由', '提示');
        return;
    }
    
    if (reason.length < 50) {
        showAlert('申诉理由至少需要50字，请详细说明情况', '提示');
        return;
    }
    
    closeModal();
    showAlert('系统正在审核您的申诉，请稍候...', '申诉提交');
    
    setTimeout(() => {
        if (typeof performAppealAICheck === 'function') {
            // ✅ 封禁申诉更严厉：提高阈值到8.5（警告申诉是7.0）
            const originalThreshold = window.APPEAL_AI_CONFIG.sincerityThreshold;
            window.APPEAL_AI_CONFIG.sincerityThreshold = 8.5;
            
            performAppealAICheck(reason, function(isSincere, score) {
                // 恢复原始阈值
                window.APPEAL_AI_CONFIG.sincerityThreshold = originalThreshold;
                
                closeModal();
                
                if (isSincere) {
                    // 申诉成功
                    gameState.isBanned = false;
                    gameState.warnings = Math.max(0, gameState.warnings - 5);
                    gameState.appealAvailable = true;
                    
                    // ✅ 恢复热度值（解封）
                    if (window.HotValueSystem) {
                        const hotValueRecover = Math.floor(Math.random() * 1001) + 500; // 500-1500
                        window.HotValueSystem.currentHotValue += hotValueRecover;
                        gameState.currentHotValue = Math.max(0, window.HotValueSystem.currentHotValue);
                    }
                    
                    const achievement = achievements.find(a => a.id === 14);
                    if (achievement && !achievement.unlocked) {
                        achievement.unlocked = true;
                        gameState.achievements.push(14);
                        showAchievementPopup(achievement);
                        showEventPopup('🏆 成就解锁', `逆风翻盘：${achievement.desc}`);
                    }
                    
                    if (gameState.banInterval) {
                        clearInterval(gameState.banInterval);
                        gameState.banInterval = null;
                    }
                    if (gameState.banDropInterval) {
                        clearInterval(gameState.banDropInterval);
                        gameState.banDropInterval = null;
                    }
                    
                    const successModal = `
                        <div class="modal-header">
                            <div class="modal-title" style="color: #00f2ea;">✅ 申诉成功</div>
                            <div class="close-btn" onclick="closeModal()">✕</div>
                        </div>
                        <div style="padding: 20px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">恭喜！您的申诉已通过</div>
                            <div style="font-size: 14px; color: #ccc; margin-bottom: 15px;">系统检测到您的态度真诚，决定提前解封账号</div>
                            <div style="background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); color: #000; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 20px;">
                                账号已解封，警告次数减少：${gameState.warnings + 5} → ${gameState.warnings}
                            </div>
                            <div style="font-size: 11px; color: #999;">真诚度评分：${score.toFixed(1)}/10 (需要 > 8.5)</div>
                            <button class="btn" onclick="closeModal()" style="background: #00f2ea; color: #000; margin-top: 15px;">确定</button>
                        </div>
                    `;
                    showModal(successModal);
                    showEventPopup('✅ 申诉成功', '账号已解封，可以正常使用了！');
                } else {
                    // 申诉失败
                    gameState.appealAvailable = false;
                    
                    const failModal = `
                        <div class="modal-header">
                            <div class="modal-title" style="color: #ff0050;">❌ 申诉失败</div>
                            <div class="close-btn" onclick="closeModal()">✕</div>
                        </div>
                        <div style="padding: 20px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 15px;">😔</div>
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">很遗憾，您的申诉未通过</div>
                            <div style="font-size: 14px; color: #ccc; margin-bottom: 15px;">系统检测认为申诉理由不够真诚或理由不充分，账号将继续保持封禁状态</div>
                            <div style="background: #222; border-left: 4px solid #ff0050; padding: 10px; border-radius: 0 8px 8px 0; font-size: 12px; color: #999; margin-bottom: 20px;">
                                警告：申诉失败，您已失去再次申诉的机会！
                            </div>
                            <div style="font-size: 11px; color: #999;">真诚度评分：${score.toFixed(1)}/10 (需要 > 8.5)</div>
                            <button class="btn" onclick="closeModal()" style="background: #ff0050; margin-top: 15px;">确定</button>
                        </div>
                    `;
                    showModal(failModal);
                    showEventPopup('❌ 申诉失败', '申诉理由不够真诚，账号继续保持封禁');
                }
                
                const appealBtn = document.getElementById('appealBtn');
                if (appealBtn) appealBtn.style.display = 'none';
                
                saveGame();
                updateDisplay();
            });
        } else {
            showAlert('AI审核系统未加载，请刷新页面重试', '错误');
        }
    }, 1500);
}

// ==================== 检查违规 ====================
function checkViolation(content) {
    const hasViolation = violationKeywords.some(keyword => content.includes(keyword));
    if (hasViolation) {
        if (gameState.warnings < 20) gameState.warnings++;
        
        if (typeof addWarningToHistory === 'function') {
            const violationType = violationKeywords.find(k => content.includes(k));
            addWarningToHistory('CONTENT_VIOLATION', 
                `内容包含违规关键词"${violationType}"`, 
                content.substring(0, 50) + (content.length > 50 ? '...' : ''));
        }
        
        showWarning(`内容包含违规信息，警告${gameState.warnings}/20次`);
        if (!gameState.isBanned && gameState.warnings >= 20) banAccount('多次违反社区规定');
        return true;
    }
    return false;
}

// ==================== 流量推广核心（修改版：点赞、评论、转发同步增长） ====================
function startTrafficProcess(workId) {
    workId = Number(workId);
    const trafficData = gameState.trafficWorks[workId];
    if (!trafficData || !trafficData.isActive) return;
    
    if (trafficData.interval) {
        clearInterval(trafficData.interval);
    }
    
    // ✅ 新增：增加全局活跃计数，启动热度值增长
    if (window.trafficHotValueManager) {
        window.trafficHotValueManager.addActive();
    }
    
    trafficData.interval = setInterval(() => {
        const work = gameState.worksList.find(w => w.id === workId);
        if (!work) return;
        
        const timePassed = gameTimer - trafficData.startTime;
        const daysPassed = timePassed / VIRTUAL_DAY_MS;
        const timeLeft = Math.max(0, trafficData.days - daysPassed);
        
        if (timeLeft <= 0) {
            if (typeof stopTrafficForWork === 'function') stopTrafficForWork(workId);
            return;
        }
        
        // ✅ 修改：获取热度值倍数并应用到所有数据增长
        const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
            ? window.getHotValueMultiplier() 
            : 1.0;
        
        // ✅ 修改：播放量增长（保持不变：1000-5000）
        const viewsBoost = Math.floor((Math.floor(Math.random() * 4000) + 1000) * hotMultiplier);
        
        // ✅ 新增：点赞增长（约为播放量的20%：200-1000）
        const likesBoost = Math.floor((Math.floor(Math.random() * 800) + 200) * hotMultiplier);
        
        // ✅ 修改：评论增长（提升为播放量的5%：50-200，原10-60太低）
        const commentBoost = Math.floor((Math.floor(Math.random() * 150) + 50) * hotMultiplier);
        
        // ✅ 修改：转发增长（提升为播放量的3%：20-100，原5-35太低）
        const shareBoost = Math.floor((Math.floor(Math.random() * 80) + 20) * hotMultiplier);
        
        // ✅ 新增：粉丝增长（保持10-50，因为粉丝是账号级别不是作品级别）
        let fanBoost = Math.floor((Math.floor(Math.random() * 40) + 10) * hotMultiplier);
        
        // 更新作品数据
        work.views += viewsBoost;
        work.likes += likesBoost;
        work.comments += commentBoost;
        work.shares += shareBoost;
        
        // 更新账号总数据
        if (work.type === 'video' || work.type === 'live') {
            gameState.views += viewsBoost;
        }
        gameState.likes += likesBoost;
        gameState.fans += fanBoost;
        
        // ✅ 修复：记录到今日新增粉丝
        gameState.todayNewFans += fanBoost;
        
        // ✅ 修复：添加涨粉通知
        if (Math.random() < 0.2) { // 20%概率显示通知
            addFanChangeNotification('⬆️', `流量推广获得${fanBoost.toLocaleString()}个新粉丝`, '流量推广', 'gain', fanBoost);
        }
        
        gameState.totalInteractions += commentBoost + likesBoost + shareBoost;
        
        // 收益计算（基于播放量）
        const oldRevenue = work.revenue || 0;
        const newRevenue = Math.floor(work.views / 1000);
        const revenueBoost = newRevenue - oldRevenue;
        if (revenueBoost > 0) {
            work.revenue = newRevenue;
            gameState.money += revenueBoost;
        }
        
        // 更新UI
        const viewsEl = document.getElementById(`work-views-${work.id}`);
        if (viewsEl) {
            viewsEl.textContent = `${work.type === 'post' ? '👁️' : '▶️'} ${work.views.toLocaleString()}`;
            animateNumberUpdate(viewsEl);
        }
        
        updateDisplay();
    }, 1000);
    updateDisplay();
}

// ✅ 修改版：结束后减少全局活跃计数，当所有推广都结束时才开始3天下降期
function stopTrafficForWork(workId) {
    workId = Number(workId);
    const trafficData = gameState.trafficWorks[workId];
    if (!trafficData) return;
    if (trafficData.interval) {
        clearInterval(trafficData.interval);
        trafficData.interval = null;
    }
    trafficData.isActive = false;
    delete gameState.trafficWorks[workId];
    
    // ✅ 减少全局活跃计数（当为0时会自动开始下降期）
    if (window.trafficHotValueManager) {
        window.trafficHotValueManager.removeActive();
    }
    
    // ✅ 修改：只显示小弹窗通知
    const remainingActive = window.trafficHotValueManager ? window.trafficHotValueManager.activeCount : 0;
    if (remainingActive > 0) {
        const range = window.trafficHotValueManager.getGrowthRange();
        showEventPopup('📈 单个推广结束', '本作品推广已结束，还有其他推广在进行中。热度值增长调整中...');
    } else {
        showEventPopup('📈 流量推广全部结束', '所有推广已结束，热度值将在3天内逐渐回落。');
    }
    
    updateDisplay();
}

// ==================== 图表显示（修改版 - 移除粉丝和互动图表） ====================
function showCharts() {
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    document.getElementById('chartsPage').classList.add('active');
    
    if (!gameState.chartData.currentIndex && gameState.chartData.likes.length > 0) {
        const virtualDays = Math.floor(getVirtualDaysPassed());
        gameState.chartData.currentIndex = (virtualDays - 1) % 60;
        gameState.chartData.currentDay = virtualDays - 1;
    }
    
    const content = document.getElementById('chartsPageContent');
    content.innerHTML = `
        <div class="chart-container">
            <!-- ✅ 移除：点赞图表已移动到独立界面 -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 10px; padding: 25px; border-radius: 15px; text-align: center; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);">
                    <div style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin-bottom: 10px;">图表已独立</div>
                <div style="font-size: 16px; font-weight: bold; color: #fff; margin-bottom: 10px;">点赞图表已移动到独立界面</div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">
                    点击主界面"点赞"统计数字查看详细图表
                </div>
            </div>
            
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin: 10px; border: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #667aea;">
                    📊 图表功能调整说明
                </div>
                <div style="font-size: 12px; color: #999; line-height: 1.6;">
                    <div style="margin-bottom: 8px;">• 点赞图表已独立到全屏界面</div>
                    <div style="margin-bottom: 8px;">• 播放量图表也已独立</div>
                    <div style="margin-bottom: 8px;">• 点击对应统计数字查看详细图表</div>
                    <div>• 查看更多数据请使用统计数字入口</div>
                </div>
            </div>
        </div>
    `;
    
    if (window.chartRefreshInterval) {
        clearInterval(window.chartRefreshInterval);
    }
    
    // 更新点赞图表的实时刷新
    window.chartRefreshInterval = setInterval(() => {
        const likesPage = document.getElementById('likesPage');
        if (likesPage && likesPage.classList.contains('active')) {
            // 点赞界面图表实时更新
            if (window.charts && window.charts.likesDetail) {
                window.charts.likesDetail.update('none');
            }
        }
    }, 1000);
}

// ==================== 不更新掉粉机制控制函数 ====================
function resetInactivityDropState() {
    gameState.lastWorkTime = gameTimer;
    if (gameState.isDroppingFansFromInactivity) {
        gameState.isDroppingFansFromInactivity = false;
        if (gameState.inactivityDropInterval) {
            clearInterval(gameState.inactivityDropInterval);
            gameState.inactivityDropInterval = null;
        }
    }
    gameState.inactivityWarningShown = false;
}

// ==================== 补充缺失的辅助函数 ====================
function generateRandomUsername() {
    const users = ['小可爱', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子'];
    const randomNum = Math.floor(Math.random() * 9999);
    return users[Math.floor(Math.random() * users.length)] + randomNum;
}

// ==================== 新增：小弹窗通知函数 ====================
function showEventPopup(title, content) {
    // 如果已存在弹窗，先移除
    const existingPopup = document.querySelector('.event-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // 创建弹窗元素
    const popup = document.createElement('div');
    popup.className = 'event-popup';
    popup.innerHTML = `
        <div class="event-popup-header">${title}</div>
        <div class="event-popup-content">${content}</div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .event-popup {
            position: fixed;
            top: 100px;
            right: -320px;
            width: 280px;
            max-width: 90%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            z-index: 998;
            transition: right 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .event-popup.show {
            right: 20px;
        }
        .event-popup-header {
            font-size: 14px;
            font-weight: bold;
            color: #fff;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .event-popup-header::before {
            content: "⚡";
            font-size: 16px;
            animation: pulse 1.5s infinite;
        }
        .event-popup-content {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.4;
        }
        @media(max-width:375px) {
            .event-popup {
                width: 240px;
                top: 80px;
            }
            .event-popup.show {
                right: 10px;
            }
        }
    `;
    
    // 确保样式只添加一次
    if (!document.querySelector('#eventPopupStyle')) {
        style.id = 'eventPopupStyle';
        document.head.appendChild(style);
    }
    
    // 添加到页面
    document.body.appendChild(popup);
    
    // 触发动画
    setTimeout(() => {
        popup.classList.add('show');
    }, 100);
    
    // 4秒后自动消失
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 400);
    }, 4000);
}

// 绑定全局函数
window.showCreateVideo = showCreateVideo;
window.showCreatePost = showCreatePost;
window.startLive = startLive;
window.toggleLive = toggleLive;
window.endLiveStream = endLiveStream;
window.startLiveStream = startLiveStream;
window.showBuyTraffic = showBuyTraffic;
window.toggleTrafficSelection = toggleTrafficSelection;
window.selectTrafficDays = selectTrafficDays;
window.confirmBuyTraffic = confirmBuyTraffic;
window.updateTrafficTotalPrice = updateTrafficTotalPrice;
window.updateSelectedCount = updateSelectedCount;
window.startNewTraffic = startNewTraffic;
window.startTrafficProcess = startTrafficProcess;
window.stopTrafficForWork = stopTrafficForWork;
window.showAppeal = showAppeal;
window.checkViolation = checkViolation;
window.showCharts = showCharts;
window.stopChartsRefresh = stopChartsRefresh;
window.resetInactivityDropState = resetInactivityDropState;
window.generateRandomUsername = generateRandomUsername;
window.showEventPopup = showEventPopup;
window.currentTrafficSort = window.currentTrafficSort || 'latest';
window.sortTrafficWorks = sortTrafficWorks;
window.renderTrafficWorksList = renderTrafficWorksList;
window.submitBanAppeal = submitBanAppeal;
// ✅ 移除：不再导出已废弃的函数
// window.startWorkFanGrowth = startWorkFanGrowth;
// ✅ 新增：导出全局系统相关函数
window.addWorkToGlobalFanGrowth = window.addWorkToGlobalFanGrowth;
window.startGlobalWorkFanGrowth = window.startGlobalWorkFanGrowth;
window.stopGlobalWorkFanGrowth = window.stopGlobalWorkFanGrowth;
window.removeWorkFromGlobalFanGrowth = window.removeWorkFromGlobalFanGrowth;
// ✅ 新增：导出流量热度值管理器
window.trafficHotValueManager = window.trafficHotValueManager;
// ✅ 新增：导出天数控件函数
window.changeTrafficDays = changeTrafficDays;
window.updateTrafficDaysFromInput = updateTrafficDaysFromInput;