// ==================== 抽奖系统模块 ====================
// 本模块负责抽奖活动的创建、管理和执行
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS, formatNumber, formatTime)
// 依赖: game_ui_core.js (showEventPopup, showAlert, showConfirm, updateDisplay)
// 依赖: game_features.js (startTrafficProcess, stopTrafficForWork)
// 依赖: game_ui_works_core.js (showWorkDetail)

// ==================== 抽奖系统状态 ====================
let raffleUpdateInterval = null;
let raffleFanGrowthInterval = null;
let raffleDataGrowthInterval = null;
let rafflePostEndFanLossInterval = null;
let raffleManualDrawWarningInterval = null;
let raffleCrazyFanLossInterval = null;

// 奖品数据配置
const RAFFLE_PRIZES = [
    { id: 'phone', name: '📱 iPhone 15 Pro', price: 8000, icon: '📱' },
    { id: 'laptop', name: '💻 MacBook Pro', price: 15000, icon: '💻' },
    { id: 'cash', name: '💰 现金红包', price: 5000, icon: '💰' },
    { id: 'switch', name: '🎮 Switch游戏机', price: 3000, icon: '🎮' },
    { id: 'airpods', name: '🎧 AirPods', price: 2000, icon: '🎧' },
    { id: 'watch', name: '⌚ Apple Watch', price: 3500, icon: '⌚' },
    { id: 'camera', name: '📷 数码相机', price: 6000, icon: '📷' },
    { id: 'headset', name: '🎤 专业麦克风', price: 2500, icon: '🎤' }
];

// 全局变量
window.selectedPrize = null;
window.raffleFormData = {
    title: '',
    type: 'video',
    content: '',
    days: 7,
    drawMethod: 'auto' // 'auto' 或 'manual'
};

// ==================== 显示抽奖创建页面 ====================
window.showRafflePage = function() {
    // ✅ 新增：账号被封禁时无法发起抽奖
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法发起抽奖活动'); 
        return; 
    }
    
    // 检查是否已有进行中的抽奖活动
    const activeRaffle = gameState.worksList.find(w => w.isRaffle && w.raffleStatus === 'active');
    if (activeRaffle) {
        showAlert('您已有一个进行中的抽奖活动，请先完成或结束该活动', '提示');
        return;
    }

    // 检查是否有已结束但未抽奖的手动抽奖活动
    const pendingManualRaffle = gameState.worksList.find(w => 
        w.isRaffle && w.raffleStatus === 'ended' && w.drawMethod === 'manual' && !w.hasDrawn && !w.manualDrawExpired
    );
    if (pendingManualRaffle) {
        showConfirm('您有一个已结束但未进行抽奖的手动抽奖活动，是否现在去抽奖？', function(confirmed) {
            if (confirmed) {
                showRaffleDetailPage(pendingManualRaffle.id);
            }
        });
        return;
    }

    const content = document.getElementById('rafflePageContent');
    content.innerHTML = `
        <div class="raffle-form-section">
            <div class="section-title">🎁 选择奖品</div>
            <div class="raffle-prize-selector" id="prizeSelector">
                ${RAFFLE_PRIZES.map(prize => `
                    <div class="prize-option" data-prize-id="${prize.id}" onclick="selectRafflePrize('${prize.id}')">
                        <div style="font-size: 24px; margin-bottom: 5px;">${prize.icon}</div>
                        <div style="font-size: 12px; font-weight: bold;">${prize.name}</div>
                        <div class="prize-price">${formatNumber(prize.price)}元</div>
                    </div>
                `).join('')}
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 10px; text-align: center;">
                💰 当前零钱：${formatNumber(Math.floor(gameState.money))}元
            </div>
        </div>

        <div class="raffle-form-section">
            <div class="section-title">✏️ 抽奖信息</div>
            <div class="input-group">
                <div class="input-label">抽奖标题</div>
                <input type="text" class="text-input" id="raffleTitle" placeholder="输入抽奖标题" maxlength="50" 
                       value="${gameState.username}的福利抽奖">
            </div>
            <div class="input-group">
                <div class="input-label">发布方式</div>
                <select class="text-input" id="raffleType" onchange="updateRaffleFormData()">
                    <option value="video">🎬 视频</option>
                    <option value="post" selected>📝 动态</option>
                </select>
            </div>
            <div class="input-group">
                <div class="input-label">抽奖内容</div>
                <textarea class="text-input" id="raffleContent" rows="4" placeholder="描述抽奖活动..." maxlength="200"
                          oninput="updateRaffleFormData()">关注并转发即可参与抽奖！</textarea>
            </div>
            <div class="input-group">
                <div class="input-label">奖品信息</div>
                <div class="text-input" id="rafflePrizeInfo" style="background: #111; color: #999;" readonly>
                    请先选择奖品
                </div>
            </div>
        </div>

        <div class="raffle-form-section">
            <div class="section-title">⏱️ 活动设置</div>
            <div class="input-group">
                <div class="input-label">活动天数</div>
                <div class="raffle-days-selector" id="daysSelector">
                    ${Array.from({length: 30}, (_, i) => i + 1).map(day => `
                        <div class="raffle-day-option ${day === 7 ? 'selected' : ''}" 
                             onclick="selectRaffleDays(${day})">${day}天</div>
                    `).join('')}
                </div>
            </div>
            <div class="input-group">
                <div class="input-label">抽奖方式</div>
                <div class="raffle-method-selector">
                    <div class="raffle-method-option selected" onclick="selectDrawMethod('auto', event)">
                        <div style="font-size: 16px; margin-bottom: 5px;">🤖</div>
                        <div style="font-size: 12px; font-weight: bold;">自动抽奖</div>
                        <div style="font-size: 10px; color: #999;">到期自动抽取</div>
                    </div>
                    <div class="raffle-method-option" onclick="selectDrawMethod('manual', event)">
                        <div style="font-size: 16px; margin-bottom: 5px;">👆</div>
                        <div style="font-size: 12px; font-weight: bold;">手动抽奖</div>
                        <div style="font-size: 10px; color: #999;">到期后手动抽取</div>
                    </div>
                </div>
            </div>
        </div>

        <div style="font-size: 12px; color: #999; margin: 20px 0; line-height: 1.5;">
            💡 提示：抽奖活动期间将疯狂涨粉和增加播放量，但活动结束后会掉粉！
        </div>

        <button class="btn" id="createRaffleBtn" onclick="createRaffle()" disabled>
            确定发布抽奖
        </button>
    `;

    // 初始化表单数据
    window.raffleFormData = {
        title: document.getElementById('raffleTitle').value,
        type: document.getElementById('raffleType').value,
        content: document.getElementById('raffleContent').value,
        days: 7,
        drawMethod: 'auto'
    };

    document.getElementById('rafflePage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
};

// ==================== 选择奖品 ====================
window.selectRafflePrize = function(prizeId) {
    // 取消所有选中状态
    document.querySelectorAll('.prize-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 选中当前奖品
    const selectedElement = document.querySelector(`[data-prize-id="${prizeId}"]`);
    selectedElement.classList.add('selected');
    
    // 保存选中的奖品
    window.selectedPrize = RAFFLE_PRIZES.find(p => p.id === prizeId);
    
    // 更新奖品信息显示
    document.getElementById('rafflePrizeInfo').value = `${window.selectedPrize.icon} ${window.selectedPrize.name}`;
    document.getElementById('rafflePrizeInfo').style.color = '#fff';
    
    // 检查是否可以创建抽奖
    checkRaffleCreationAvailability();
};

// ==================== 选择活动天数 ====================
window.selectRaffleDays = function(days) {
    // 取消所有选中状态
    document.querySelectorAll('.raffle-day-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 选中当前天数
    const selectedElement = Array.from(document.querySelectorAll('.raffle-day-option')).find(
        option => option.textContent === `${days}天`
    );
    selectedElement.classList.add('selected');
    
    // 更新表单数据
    window.raffleFormData.days = days;
    
    // 更新费用显示
    checkRaffleCreationAvailability();
};

// ==================== 选择抽奖方式 ====================
window.selectDrawMethod = function(method, event) {
    // 取消所有选中状态
    document.querySelectorAll('.raffle-method-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 选中的方式
    if (event && event.target) {
        event.target.closest('.raffle-method-option').classList.add('selected');
    } else {
        // 降级处理：直接通过数据属性查找
        const methodOptions = document.querySelectorAll('.raffle-method-option');
        methodOptions.forEach(option => {
            if (option.getAttribute('onclick').includes(`'${method}'`)) {
                option.classList.add('selected');
            }
        });
    }
    
    // 更新表单数据
    window.raffleFormData.drawMethod = method;
};

// ==================== 更新表单数据 ====================
window.updateRaffleFormData = function() {
    const titleInput = document.getElementById('raffleTitle');
    const typeSelect = document.getElementById('raffleType');
    const contentTextarea = document.getElementById('raffleContent');
    
    if (titleInput) window.raffleFormData.title = titleInput.value;
    if (typeSelect) window.raffleFormData.type = typeSelect.value;
    if (contentTextarea) window.raffleFormData.content = contentTextarea.value;
};

// ==================== 检查抽奖创建可用性 ====================
function checkRaffleCreationAvailability() {
    const createBtn = document.getElementById('createRaffleBtn');
    if (!window.selectedPrize) {
        createBtn.disabled = true;
        createBtn.textContent = '请先选择奖品';
        return;
    }
    
    const daysCost = window.raffleFormData.days * 10000;
    const totalCost = window.selectedPrize.price + daysCost;
    
    if (gameState.money < totalCost) {
        createBtn.disabled = true;
        createBtn.textContent = `零钱不足（需要${formatNumber(totalCost)}元）`;
        return;
    }
    
    createBtn.disabled = false;
    createBtn.textContent = '确定发布抽奖';
};

// ==================== 创建抽奖活动 ====================
window.createRaffle = function() {
    // ✅ 双重保险：再次检查账号状态
    if (gameState.isBanned) { 
        showWarning('账号被封禁，无法发起抽奖活动'); 
        return; 
    }
    
    if (!window.selectedPrize) {
        showAlert('请先选择奖品', '提示');
        return;
    }
    
    const daysCost = window.raffleFormData.days * 10000;
    const totalCost = window.selectedPrize.price + daysCost;
    
    if (gameState.money < totalCost) {
        showAlert(`零钱不足！需要${formatNumber(totalCost)}元`, '提示');
        return;
    }
    
    // 扣除奖品费用 + 天数费用
    gameState.money -= totalCost;
    
    // 创建抽奖作品
    const raffleWork = {
        id: Date.now(),
        type: window.raffleFormData.type,
        title: window.raffleFormData.title,
        content: window.raffleFormData.content,
        prize: window.selectedPrize,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        time: gameTimer,
        isPrivate: false,
        isRaffle: true,
        raffleStatus: 'active', // 'active', 'ended', 'drawing', 'completed'
        drawMethod: window.raffleFormData.drawMethod,
        activityDays: window.raffleFormData.days,
        activityStartTime: gameTimer,
        activityEndTime: gameTimer + (window.raffleFormData.days * VIRTUAL_DAY_MS),
        hasDrawn: false,
        winners: [],
        manualDrawDeadline: window.raffleFormData.drawMethod === 'manual' 
            ? gameTimer + (window.raffleFormData.days * VIRTUAL_DAY_MS) + (3 * VIRTUAL_DAY_MS)
            : null,
        manualDrawExpired: false,
        fanGrowthInterval: null,
        fanLossInterval: null,
        crazyFanLossInterval: null,
        fanLossEndTime: null
    };
    
    // 添加到作品列表
    gameState.worksList.push(raffleWork);
    gameState.works++;
    
    // 生成初始消息
    generateInitialRaffleMessages(raffleWork);
    
    // 启动抽奖涨粉
    startRaffleFanGrowth(raffleWork.id);
    
    // 启动抽奖数据增长
    startRaffleDataGrowth(raffleWork.id);
    
    // 关闭页面
    closeFullscreenPage('raffle');
    
    // 显示成功通知
    showEventPopup('🎉 抽奖发布成功', `奖品：${window.selectedPrize.name} | 活动时长：${window.raffleFormData.days}天`);
    
    // 重置表单
    window.selectedPrize = null;
    window.raffleFormData = {
        title: '',
        type: 'video',
        content: '',
        days: 7,
        drawMethod: 'auto'
    };
    
    // 更新显示
    updateDisplay();
};

// ==================== 生成初始抽奖消息 ====================
function generateInitialRaffleMessages(raffleWork) {
    if (!gameState.messages) gameState.messages = [];
    
    // 生成点赞消息
    for (let i = 0; i < 5; i++) {
        gameState.messages.push({
            id: Date.now() + Math.random() + i,
            type: 'like',
            user: generateRandomUsername(),
            workId: raffleWork.id,
            workContent: `🎁 抽奖：${raffleWork.prize.name}`,
            time: gameTimer,
            read: false
        });
    }
    
    // 生成转发消息
    for (let i = 0; i < 3; i++) {
        gameState.messages.push({
            id: Date.now() + Math.random() + i + 10000,
            type: 'share',
            user: generateRandomUsername(),
            workId: raffleWork.id,
            workContent: `🎁 抽奖：${raffleWork.prize.name}`,
            time: gameTimer,
            read: false
        });
    }
}

// ==================== 启动抽奖涨粉 ====================
function startRaffleFanGrowth(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRaffle || work.raffleStatus !== 'active') return;
    
    // 停止之前的定时器
    if (work.fanGrowthInterval) {
        clearInterval(work.fanGrowthInterval);
    }
    
    // 启动涨粉定时器（每秒1-10000随机涨粉）
    work.fanGrowthInterval = setInterval(() => {
        const timePassed = gameTimer - work.activityStartTime;
        const daysPassed = timePassed / VIRTUAL_DAY_MS;
        
        // 检查是否还在活动期内
        if (daysPassed >= work.activityDays) {
            endRaffleActivity(work.id);
            return;
        }
        
        // 随机涨粉（1-10000）
        const fanGrowth = Math.floor(Math.random() * 10000) + 1;
        gameState.fans += fanGrowth;
        gameState.todayNewFans += fanGrowth;
        
        // 记录粉丝增长
        if (!work.totalFanGrowth) work.totalFanGrowth = 0;
        work.totalFanGrowth += fanGrowth;
        
        // 更新显示
        if (typeof addFanChangeNotification === 'function') {
            addFanChangeNotification('⬆️', `抽奖活动获得${fanGrowth.toLocaleString()}个新粉丝`, '抽奖涨粉', 'gain', fanGrowth);
        }
        
        updateDisplay();
    }, 1000);
}

// ==================== 启动抽奖数据增长 ====================
function startRaffleDataGrowth(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRaffle || work.raffleStatus !== 'active') return;
    
    // 停止之前的定时器
    if (work.dataGrowthInterval) {
        clearInterval(work.dataGrowthInterval);
    }
    
    // 启动数据增长定时器（类似流量推送）
    work.dataGrowthInterval = setInterval(() => {
        const timePassed = gameTimer - work.activityStartTime;
        const daysPassed = timePassed / VIRTUAL_DAY_MS;
        
        // 检查是否还在活动期内
        if (daysPassed >= work.activityDays) {
            endRaffleActivity(work.id);
            return;
        }
        
        // 类似流量推送的数据增长
        const viewsBoost = Math.floor(Math.random() * 4000) + 1000;
        const likesBoost = Math.floor(Math.random() * 500) + 100;
        const commentsBoost = Math.floor(Math.random() * 100) + 20;
        const sharesBoost = Math.floor(Math.random() * 50) + 10;
        
        work.views += viewsBoost;
        work.likes += likesBoost;
        work.comments += commentsBoost;
        work.shares += sharesBoost;
        
        if (work.type === 'video') {
            gameState.views += viewsBoost;
        }
        gameState.likes += likesBoost;
        
        // 更新总互动数
        gameState.totalInteractions += commentsBoost + sharesBoost;
        
        // 生成收益
        const oldRevenue = work.revenue || 0;
        const newRevenue = Math.floor(work.views / 1000);
        const revenueGrowth = newRevenue - oldRevenue;
        if (revenueGrowth > 0) {
            work.revenue = newRevenue;
            gameState.money += revenueBoost;
        }
        
        updateDisplay();
    }, 1000);
}

// ==================== 结束抽奖活动 ====================
function endRaffleActivity(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRaffle || work.raffleStatus !== 'active') return;
    
    // 更新状态
    work.raffleStatus = 'ended';
    
    // ✅ 设置随机掉粉天数（1-50天）
    const fanLossDuration = Math.floor(Math.random() * 50) + 1;
    work.fanLossEndTime = gameTimer + (fanLossDuration * VIRTUAL_DAY_MS);
    
    // 停止涨粉和数据增长
    if (work.fanGrowthInterval) {
        clearInterval(work.fanGrowthInterval);
        work.fanGrowthInterval = null;
    }
    if (work.dataGrowthInterval) {
        clearInterval(work.dataGrowthInterval);
        work.dataGrowthInterval = null;
    }
    
    // 开始活动结束后的自然掉粉
    startRafflePostEndFanLoss(work.id);
    
    // 如果是自动抽奖，立即开始抽奖
    if (work.drawMethod === 'auto') {
        startRaffleDraw(work.id);
    } else {
        // 手动抽奖，启动3天倒计时警告
        startManualDrawWarning(work.id);
    }
    
    // 发送通知
    showEventPopup('📢 抽奖活动结束', `您的抽奖活动"${work.title}"已结束${work.drawMethod === 'auto' ? '，自动抽奖中' : '，请在3天内手动抽奖'}（掉粉持续${fanLossDuration}天）`);
    
    updateDisplay();
}

// ==================== 抽奖活动结束后的掉粉 ====================
function startRafflePostEndFanLoss(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRaffle || work.raffleStatus !== 'ended') return;
    
    // 停止之前的定时器
    if (work.fanLossInterval) {
        clearInterval(work.fanLossInterval);
    }
    
    // ✅ 启动每秒掉粉（1-500），持续随机天数（1-50天）
    work.fanLossInterval = setInterval(() => {
        // 检查是否已到掉粉结束时间
        if (gameTimer >= work.fanLossEndTime) {
            console.log(`[抽奖掉粉] 作品 ${workId} 掉粉期结束`);
            clearInterval(work.fanLossInterval);
            work.fanLossInterval = null;
            work.fanLossEndTime = null;
            
            // ✅ 修改：使用小弹窗通知
            showEventPopup('✅ 抽奖影响结束', '粉丝的抽奖热情逐渐平息，掉粉已停止');
            return;
        }
        
        // 随机掉粉（1-500）
        const fanLoss = Math.floor(Math.random() * 500) + 1;
        gameState.fans = Math.max(0, gameState.fans - fanLoss);
        gameState.todayLostFans += fanLoss;
        
        // 记录掉粉总数
        if (!work.totalFanLoss) work.totalFanLoss = 0;
        work.totalFanLoss += fanLoss;
        
        // 显示通知（较低频率，20%概率）
        if (Math.random() < 0.2) {
            if (typeof addFanChangeNotification === 'function') {
                const remainingDays = Math.ceil((work.fanLossEndTime - gameTimer) / VIRTUAL_DAY_MS);
                addFanChangeNotification('⬇️', `失去了${fanLoss.toLocaleString()}个粉丝（抽奖活动结束，剩余${remainingDays}天）`, '抽奖掉粉', 'loss', fanLoss);
            }
        }
        
        updateDisplay();
    }, 1000);
}

// ==================== 手动抽奖3天倒计时警告 ====================
function startManualDrawWarning(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || work.drawMethod !== 'manual' || work.hasDrawn || work.manualDrawExpired) return;
    
    // 停止之前的定时器
    if (work.manualDrawWarningInterval) {
        clearInterval(work.manualDrawWarningInterval);
    }
    
    work.manualDrawWarningInterval = setInterval(() => {
        const timePassed = gameTimer - work.activityEndTime;
        const daysPassed = timePassed / VIRTUAL_DAY_MS;
        
        // 检查是否已到3天
        if (daysPassed >= 3) {
            endManualDrawDeadline(work.id);
            return;
        }
        
        // 显示警告（每天显示一次）
        if (daysPassed > 0 && Math.floor(daysPassed) > (work.warningShown || 0)) {
            work.warningShown = Math.floor(daysPassed);
            const remainingDays = Math.ceil(3 - daysPassed);
            showEventPopup('⚠️ 手动抽奖提醒', `您的抽奖活动"${work.title}"已结束${work.warningShown}天，还有${remainingDays}天进行手动抽奖，否则将疯狂掉粉！`);
        }
    }, 1000);
}

// ==================== 超过3天未抽奖，疯狂掉粉 ====================
function endManualDrawDeadline(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || work.hasDrawn || work.manualDrawExpired) return;
    
    // 停止3天倒计时警告
    if (work.manualDrawWarningInterval) {
        clearInterval(work.manualDrawWarningInterval);
        work.manualDrawWarningInterval = null;
    }
    
    // ✅ 设置过期标志，防止继续抽奖
    work.manualDrawExpired = true;
    
    // 启动疯狂掉粉
    startCrazyFanLoss(workId);
    
    showEventPopup('⚠️ 抽奖超时警告', `您的抽奖活动"${work.title}"已超过3天未抽奖，开始疯狂掉粉！请立即前往抽奖！`);
}

// ==================== 疯狂掉粉（手动抽奖超时惩罚） ====================
function startCrazyFanLoss(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || work.hasDrawn || work.manualDrawExpired) return;
    
    // 停止之前的定时器
    if (work.crazyFanLossInterval) {
        clearInterval(work.crazyFanLossInterval);
    }
    
    work.crazyFanLossInterval = setInterval(() => {
        if (work.hasDrawn || work.manualDrawExpired) {
            clearInterval(work.crazyFanLossInterval);
            work.crazyFanLossInterval = null;
            return;
        }
        
        // 疯狂掉粉（100-500）
        const crazyLoss = Math.floor(Math.random() * 400) + 100;
        gameState.fans = Math.max(0, gameState.fans - crazyLoss);
        gameState.todayLostFans += crazyLoss;
        
        // 显示警告通知
        if (typeof addFanChangeNotification === 'function') {
            addFanChangeNotification('⬇️', `疯狂失去了${crazyLoss.toLocaleString()}个粉丝（抽奖超时）`, '抽奖超时惩罚', 'loss', crazyLoss);
        }
        
        updateDisplay();
    }, 1000);
}

// ==================== 开始抽奖 ====================
function startRaffleDraw(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRaffle || work.hasDrawn || work.manualDrawExpired) return;
    
    // ✅ 更新状态
    work.raffleStatus = 'drawing';
    work.hasDrawn = true;
    
    // ✅ 停止疯狂掉粉定时器（如果存在）
    if (work.crazyFanLossInterval) {
        clearInterval(work.crazyFanLossInterval);
        work.crazyFanLossInterval = null;
    }
    
    // ✅ 不要停止正常掉粉定时器 work.fanLossInterval（这是关键修改）
    
    // 生成中奖用户
    const winnerCount = Math.min(10, gameState.fans > 0 ? Math.floor(gameState.fans / 1000) + 1 : 1);
    const winners = [];
    
    for (let i = 0; i < winnerCount; i++) {
        winners.push({
            username: generateRandomUsername(),
            prize: work.prize.name,
            drawTime: gameTimer,
            prizeIcon: work.prize.icon
        });
    }
    
    work.winners = winners;
    work.raffleStatus = 'completed';
    
    // 发送中奖消息
    winners.forEach((winner, index) => {
        if (!gameState.messages) gameState.messages = [];
        gameState.messages.push({
            id: Date.now() + Math.random() + index,
            type: 'system',
            user: '系统消息',
            content: `${winner.username} 在您的抽奖活动中中奖了！奖品：${winner.prize}`,
            time: gameTimer,
            read: false
        });
    });
    
    // 显示中奖结果
    showRaffleResult(work);
    
    // 保存游戏状态
    saveGame();
    updateDisplay();
}

// ==================== 显示抽奖结果 ====================
function showRaffleResult(work) {
    const winnersHtml = work.winners.map((winner, index) => `
        <div class="raffle-winner-item">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">${winner.prizeIcon}</span>
                <div>
                    <div style="font-size: 12px; font-weight: bold;">${winner.username}</div>
                    <div style="font-size: 10px; color: #999;">${formatTime(winner.drawTime)}</div>
                </div>
            </div>
            <div class="raffle-status-indicator raffle-status-completed">中奖</div>
        </div>
    `).join('');
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">🎉 抽奖结果</div>
            <div class="close-btn" onclick="closeModalAndRaffleDetail()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">
                ${work.title}
            </div>
            <div style="font-size: 14px; color: #999; margin-bottom: 20px;">
                ${work.prize.icon} ${work.prize.name} | 中奖人数：${work.winners.length}
            </div>
            <div class="raffle-winner-list">
                ${winnersHtml}
            </div>
            <button class="btn" onclick="closeModalAndRaffleDetail()" style="margin-top: 15px;">确定</button>
        </div>
    `;
    
    showModal(modalContent);
}

// ==================== 新增函数：关闭模态框和抽奖详情页面 ====================
function closeModalAndRaffleDetail() {
    closeModal();
    closeFullscreenPage('raffleDetail');
}

// ==================== 显示抽奖管理页面 ====================
window.showRaffleManagePage = function() {
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    document.getElementById('raffleManagePage').classList.add('active');
    
    renderRaffleManagePage();
};

// ==================== 渲染抽奖管理页面 ====================
function renderRaffleManagePage() {
    const content = document.getElementById('raffleManagePageContent');
    const raffleWorks = gameState.worksList.filter(w => w.isRaffle);
    
    if (raffleWorks.length === 0) {
        content.innerHTML = `
            <div style="text-align: center; color: #999; padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 10px;">🎁</div>
                <div>暂无抽奖活动</div>
                <div style="font-size: 12px; margin-top: 10px;">点击"发起抽奖"按钮创建您的第一个抽奖活动</div>
            </div>
        `;
        return;
    }
    
    const raffleListHtml = raffleWorks.map(work => {
        const statusText = {
            'active': '进行中',
            'ended': '已结束',
            'drawing': '抽奖中',
            'completed': '已完成'
        };
        
        const statusClass = {
            'active': 'raffle-status-active',
            'ended': 'raffle-status-ended',
            'drawing': 'raffle-status-drawing',
            'completed': 'raffle-status-completed'
        };
        
        const timePassed = gameTimer - work.time;
        const daysPassed = Math.floor(timePassed / VIRTUAL_DAY_MS);
        
        let actionButton = '';
        if (work.raffleStatus === 'ended' && work.drawMethod === 'manual' && !work.hasDrawn && !work.manualDrawExpired) {
            actionButton = `<button class="btn" style="margin-top: 10px; padding: 8px;" onclick="showRaffleDetailPage(${work.id})">立即抽奖</button>`;
        } else if (work.raffleStatus === 'active') {
            const timeLeft = Math.max(0, (work.activityEndTime - gameTimer) / VIRTUAL_DAY_MS);
            actionButton = `<div style="font-size: 12px; color: #667aea; margin-top: 10px;">剩余${timeLeft.toFixed(1)}天</div>`;
        } else if (work.raffleStatus === 'completed') {
            actionButton = `<button class="btn btn-secondary" style="margin-top: 10px; padding: 8px;" onclick="showRaffleResult(${work.id})">查看结果</button>`;
        } else if (work.manualDrawExpired) {
            actionButton = `<div style="font-size: 12px; color: #ff0050; margin-top: 10px;">已过期</div>`;
        }
        
        return `
            <div class="work-item" onclick="showRaffleDetailPage(${work.id})">
                <div class="work-header">
                    <span class="work-type">🎁 抽奖活动</span>
                    <span class="work-time">${daysPassed}天前</span>
                </div>
                
                <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                    ${work.title}
                    <span class="raffle-status-indicator ${statusClass[work.raffleStatus]}">${statusText[work.raffleStatus]}</span>
                </div>
                
                <div style="font-size: 14px; color: #ccc; margin-top: 5px;">
                    ${work.prize.icon} ${work.prize.name} | 参与方式：${work.drawMethod === 'auto' ? '自动' : '手动'}抽奖
                </div>
                
                <div class="work-stats">
                    <span>▶️ ${work.views.toLocaleString()}</span>
                    <span>❤️ ${work.likes.toLocaleString()}</span>
                    <span>💬 ${work.comments.toLocaleString()}</span>
                    <span>🔄 ${work.shares.toLocaleString()}</span>
                </div>
                
                ${actionButton}
            </div>
        `;
    }).join('');
    
    content.innerHTML = `
        <div class="section-title" style="margin: 10px; margin-top: 20px;">
            <span>抽奖活动管理</span>
            <span style="font-size: 12px; color: #999;">共${raffleWorks.length}个活动</span>
        </div>
        ${raffleListHtml}
    `;
}

// ==================== 显示抽奖详情页面 ====================
window.showRaffleDetailPage = function(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRaffle) return;
    
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    document.getElementById('raffleDetailPage').classList.add('active');
    
    renderRaffleDetailPage(work);
};

// ==================== 渲染抽奖详情页面 ====================
function renderRaffleDetailPage(work) {
    const content = document.getElementById('raffleDetailPageContent');
    document.getElementById('raffleDetailTitle').textContent = '抽奖详情';
    
    const timePassed = gameTimer - work.time;
    const daysPassed = Math.floor(timePassed / VIRTUAL_DAY_MS);
    
    const statusText = {
        'active': '进行中',
        'ended': '已结束',
        'drawing': '抽奖中',
        'completed': '已完成'
    };
    
    const statusClass = {
        'active': 'raffle-status-active',
        'ended': 'raffle-status-ended',
        'drawing': 'raffle-status-drawing',
        'completed': 'raffle-status-completed'
    };
    
    // 计算剩余时间
    let timeInfoHtml = '';
    if (work.raffleStatus === 'active') {
        const timeLeft = Math.max(0, (work.activityEndTime - gameTimer) / VIRTUAL_DAY_MS);
        timeInfoHtml = `<div style="background: #161823; border-radius: 8px; padding: 10px; margin: 10px 0; border: 1px solid #333;">
            <div style="font-size: 14px; font-weight: bold; color: #667aea; margin-bottom: 5px;">⏱️ 活动倒计时</div>
            <div style="font-size: 12px; color: #ccc;">剩余时间：<span style="color: #00f2ea; font-weight: bold;">${timeLeft.toFixed(1)}天</span></div>
        </div>`;
    } else if (work.raffleStatus === 'ended' && work.drawMethod === 'manual' && !work.hasDrawn && !work.manualDrawExpired) {
        const timePassed = gameTimer - work.activityEndTime;
        const daysPassed = timePassed / VIRTUAL_DAY_MS;
        const remainingDays = Math.max(0, 3 - daysPassed);
        
        if (remainingDays > 0) {
            timeInfoHtml = `<div style="background: linear-gradient(135deg, #2a1a00 0%, #161823 100%); border-radius: 8px; padding: 10px; margin: 10px 0; border: 1px solid #ff6b00;">
                <div style="font-size: 14px; font-weight: bold; color: #ff6b00; margin-bottom: 5px;">⚠️ 手动抽奖倒计时</div>
                <div style="font-size: 12px; color: #ccc;">剩余时间：<span style="color: #ff6b00; font-weight: bold;">${remainingDays.toFixed(1)}天</span></div>
            </div>`;
        } else {
            timeInfoHtml = `<div class="raffle-countdown-warning">
                ⚠️ 已超过3天未抽奖，正在疯狂掉粉！请立即抽奖！
            </div>`;
        }
    } else if (work.manualDrawExpired) {
        timeInfoHtml = `<div class="raffle-countdown-warning">
            ❌ 抽奖已过期，无法再进行抽奖操作！
        </div>`;
    }
    
    // 抽奖按钮
    let drawButtonHtml = '';
    if (work.raffleStatus === 'ended' && work.drawMethod === 'manual' && !work.hasDrawn && !work.manualDrawExpired) {
        drawButtonHtml = `
            <button class="raffle-manual-draw-btn" onclick="startRaffleDraw(${work.id})">
                🎯 立即开始抽奖
            </button>
            <div style="font-size: 11px; color: #999; text-align: center; margin-top: 10px;">
                点击按钮开始抽取中奖用户
            </div>
        `;
    } else if (work.raffleStatus === 'drawing') {
        drawButtonHtml = `
            <div style="background: #161823; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #667aea;">
                <div style="font-size: 16px; margin-bottom: 10px;">🎲</div>
                <div style="font-size: 14px; font-weight: bold; color: #667aea;">抽奖进行中...</div>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">正在抽取中奖用户</div>
            </div>
        `;
    } else if (work.raffleStatus === 'completed') {
        drawButtonHtml = `
            <button class="btn" onclick="showRaffleResult(${work.id})">
                🏆 查看中奖结果
            </button>
        `;
    } else if (work.manualDrawExpired) {
        drawButtonHtml = `
            <div style="background: #2a000a; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #ff0050;">
                <div style="font-size: 16px; margin-bottom: 10px;">❌</div>
                <div style="font-size: 14px; font-weight: bold; color: #ff0050;">抽奖已过期</div>
                <div style="font-size: 12px; color: #999; margin-top: 5px;">超过3天未抽奖，无法进行抽奖操作</div>
            </div>
        `;
    }
    
    // 掉粉状态显示
    let fanLossStatusHtml = '';
    // ✅ 新增：显示掉粉剩余天数和掉粉统计
    if (work.raffleStatus === 'ended' && work.fanLossInterval && work.fanLossEndTime) {
        const timeLeft = Math.max(0, (work.fanLossEndTime - gameTimer) / VIRTUAL_DAY_MS);
        const totalDuration = (work.fanLossEndTime - work.activityEndTime) / VIRTUAL_DAY_MS;
        fanLossStatusHtml = `
            <div style="background: linear-gradient(135deg, #2a000a 0%, #161823 100%); border-radius: 8px; padding: 10px; margin: 10px 0; border: 1px solid #ff0050;">
                <div style="font-size: 14px; font-weight: bold; color: #ff0050; margin-bottom: 5px;">⬇️ 掉粉中</div>
                <div style="font-size: 12px; color: #ccc;">持续时间：${totalDuration.toFixed(0)}天 | 剩余：<span style="color: #ff0050; font-weight: bold;">${timeLeft.toFixed(1)}天</span></div>
                <div style="font-size: 11px; color: #999; margin-top: 5px;">每秒随机失去1-500个粉丝</div>
            </div>
        `;
    } else if (work.totalFanLoss && work.totalFanLoss > 0) {
        fanLossStatusHtml = `
            <div style="background: #161823; border-radius: 8px; padding: 10px; margin: 10px 0; border: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; color: #999; margin-bottom: 5px;">📊 掉粉统计</div>
                <div style="font-size: 12px; color: #ccc;">活动期间总涨粉：<span style="color: #00f2ea; font-weight: bold;">${formatNumber(work.totalFanGrowth || 0)}</span></div>
                <div style="font-size: 12px; color: #ccc; margin-top: 3px;">活动结束后掉粉：<span style="color: #ff0050; font-weight: bold;">${formatNumber(work.totalFanLoss || 0)}</span></div>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div style="background: #161823; border-radius: 15px; padding: 15px; margin: 10px; border: 1px solid #333;">
            <div class="work-header">
                <span class="work-type">🎁 抽奖活动</span>
                <span class="work-time">${daysPassed}天前</span>
            </div>
            
            <div style="font-size: 18px; font-weight: bold; margin: 10px 0;">
                ${work.title}
                <span class="raffle-status-indicator ${statusClass[work.raffleStatus]}">${statusText[work.raffleStatus]}</span>
            </div>
            
            <div style="background: linear-gradient(135deg, #222 0%, #161823 100%); border-radius: 10px; padding: 15px; margin: 10px 0;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 24px;">${work.prize.icon}</span>
                    <div>
                        <div style="font-size: 14px; font-weight: bold;">${work.prize.name}</div>
                        <div style="font-size: 12px; color: #667aea;">价值 ${formatNumber(work.prize.price)}元</div>
                    </div>
                </div>
            </div>
            
            <div style="font-size: 14px; line-height: 1.5; margin: 10px 0;">${work.content}</div>
            
            ${timeInfoHtml}
            
            ${fanLossStatusHtml}
            
            <div style="background: #161823; border-radius: 8px; padding: 10px; margin: 10px 0; border: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; color: #667aea; margin-bottom: 10px;">📊 活动数据</div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 12px;">
                    <div>▶️ 播放量：<span style="color: #fff; font-weight: bold;">${work.views.toLocaleString()}</span></div>
                    <div>❤️ 点赞：<span style="color: #fff; font-weight: bold;">${work.likes.toLocaleString()}</span></div>
                    <div>💬 评论：<span style="color: #fff; font-weight: bold;">${work.comments.toLocaleString()}</span></div>
                    <div>🔄 转发：<span style="color: #fff; font-weight: bold;">${work.shares.toLocaleString()}</span></div>
                </div>
                ${work.totalFanGrowth ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #333;">
                        <div style="display: flex; justify-content: space-between; font-size: 12px;">
                            <span>⬆️ 活动期间涨粉：</span>
                            <span style="color: #00f2ea; font-weight: bold;">${formatNumber(work.totalFanGrowth)}</span>
                        </div>
                        ${work.totalFanLoss ? `
                            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 5px;">
                                <span>⬇️ 活动结束后掉粉：</span>
                                <span style="color: #ff0050; font-weight: bold;">${formatNumber(work.totalFanLoss)}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
            
            ${drawButtonHtml}
        </div>
    `;
}

// ==================== ✅ 新增：抽奖状态检查主循环 ====================
window.startRaffleStatusCheck = function() {
    // 每3秒检查一次抽奖状态
    setInterval(() => {
        gameState.worksList.forEach(work => {
            if (!work.isRaffle) return;
            
            // 检查活动是否结束
            if (work.raffleStatus === 'active' && gameTimer >= work.activityEndTime) {
                console.log(`[抽奖状态检查] 作品 ${work.id} 活动已结束，当前状态：${work.raffleStatus}`);
                endRaffleActivity(work.id);
            }
            
            // 检查手动抽奖是否超时
            if (work.raffleStatus === 'ended' && work.drawMethod === 'manual' && 
                !work.hasDrawn && !work.manualDrawExpired && gameTimer >= work.manualDrawDeadline) {
                console.log(`[抽奖状态检查] 作品 ${work.id} 手动抽奖超时`);
                work.manualDrawExpired = true;
                startCrazyFanLoss(work.id);
            }
        });
    }, 3000);
    
    console.log('抽奖状态检查循环已启动（每3秒）');
};

// ==================== ✅ 新增：恢复抽奖活动状态（游戏加载时调用） ====================
window.resumeRaffleState = function(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRaffle) return;
    
    console.log(`[恢复抽奖] 恢复作品 ${workId} 的抽奖状态: ${work.raffleStatus}`);
    
    // 清理可能存在的旧定时器
    if (work.fanGrowthInterval) {
        clearInterval(work.fanGrowthInterval);
        work.fanGrowthInterval = null;
    }
    if (work.dataGrowthInterval) {
        clearInterval(work.dataGrowthInterval);
        work.dataGrowthInterval = null;
    }
    if (work.fanLossInterval) {
        clearInterval(work.fanLossInterval);
        work.fanLossInterval = null;
    }
    if (work.manualDrawWarningInterval) {
        clearInterval(work.manualDrawWarningInterval);
        work.manualDrawWarningInterval = null;
    }
    if (work.crazyFanLossInterval) {
        clearInterval(work.crazyFanLossInterval);
        work.crazyFanLossInterval = null;
    }
    
    // 根据状态恢复相应的定时器
    const timePassed = gameTimer - work.activityStartTime;
    const daysPassed = timePassed / VIRTUAL_DAY_MS;
    
    if (work.raffleStatus === 'active') {
        // 检查是否已过期
        if (daysPassed >= work.activityDays) {
            console.log(`[恢复抽奖] 作品 ${workId} 本应已结束，修正状态`);
            work.raffleStatus = 'ended';
            // 继续处理 ended 状态
        } else {
            console.log(`[恢复抽奖] 作品 ${workId} 恢复活动状态，剩余 ${work.activityDays - daysPassed} 天`);
            startRaffleFanGrowth(workId);
            startRaffleDataGrowth(workId);
            return;
        }
    }
    
    if (work.raffleStatus === 'ended') {
        // ✅ 恢复掉粉周期
        if (!work.fanLossEndTime || work.fanLossEndTime <= gameTimer) {
            // 如果掉粉时间未设置或已过期，重新设置随机天数
            console.log(`[恢复抽奖] 作品 ${workId} 掉粉时间已过期，重新设置`);
            const fanLossDuration = Math.floor(Math.random() * 50) + 1;
            work.fanLossEndTime = gameTimer + (fanLossDuration * VIRTUAL_DAY_MS);
        }
        
        if (work.drawMethod === 'auto' && !work.hasDrawn) {
            console.log(`[恢复抽奖] 作品 ${workId} 自动抽奖中...`);
            startRaffleDraw(workId);
        } else if (work.drawMethod === 'manual' && !work.hasDrawn) {
            // 检查是否超过3天
            const manualTimePassed = gameTimer - work.activityEndTime;
            const manualDaysPassed = manualTimePassed / VIRTUAL_DAY_MS;
            
            if (manualDaysPassed >= 3) {
                console.log(`[恢复抽奖] 作品 ${workId} 手动抽奖已过期`);
                work.manualDrawExpired = true;
                startCrazyFanLoss(workId);
            } else {
                console.log(`[恢复抽奖] 作品 ${workId} 等待手动抽奖，剩余 ${3 - manualDaysPassed} 天`);
                startRafflePostEndFanLoss(workId); // ✅ 恢复掉粉
                startManualDrawWarning(workId);
            }
        } else if (work.hasDrawn) {
            console.log(`[恢复抽奖] 作品 ${workId} 已完成抽奖`);
            // 清理掉粉定时器
            if (work.fanLossInterval) {
                clearInterval(work.fanLossInterval);
                work.fanLossInterval = null;
            }
            work.fanLossEndTime = null;
        }
    }
};

// ==================== 清理抽奖定时器（用于游戏重置） ====================
function cleanupRaffleTimers() {
    // 清理所有抽奖相关的定时器
    gameState.worksList.forEach(work => {
        if (work.isRaffle) {
            if (work.fanGrowthInterval) {
                clearInterval(work.fanGrowthInterval);
                work.fanGrowthInterval = null;
            }
            if (work.dataGrowthInterval) {
                clearInterval(work.dataGrowthInterval);
                work.dataGrowthInterval = null;
            }
            if (work.fanLossInterval) {
                clearInterval(work.fanLossInterval);
                work.fanLossInterval = null;
            }
            if (work.manualDrawWarningInterval) {
                clearInterval(work.manualDrawWarningInterval);
                work.manualDrawWarningInterval = null;
            }
            if (work.crazyFanLossInterval) {
                clearInterval(work.crazyFanLossInterval);
                work.crazyFanLossInterval = null;
            }
            // 清理掉粉结束时间
            work.fanLossEndTime = null;
        }
    });
    
    // 清理全局定时器
    if (raffleUpdateInterval) {
        clearInterval(raffleUpdateInterval);
        raffleUpdateInterval = null;
    }
    
    console.log('抽奖系统定时器已清理');
}

// ==================== 全局函数绑定 ====================
window.selectRafflePrize = window.selectRafflePrize;
window.selectRaffleDays = window.selectRaffleDays;
window.selectDrawMethod = window.selectDrawMethod;
window.updateRaffleFormData = window.updateRaffleFormData;
window.createRaffle = window.createRaffle;
window.showRafflePage = window.showRafflePage;
window.showRaffleManagePage = window.showRaffleManagePage;
window.showRaffleDetailPage = window.showRaffleDetailPage;
window.startRaffleDraw = window.startRaffleDraw;
window.showRaffleResult = window.showRaffleResult;
window.startRaffleStatusCheck = window.startRaffleStatusCheck;
window.cleanupRaffleTimers = cleanupRaffleTimers;
window.resumeRaffleState = window.resumeRaffleState; // ✅ 新增导出

// 添加清理函数到游戏重置逻辑
const originalResetGame = window.resetGame;
if (originalResetGame) {
    window.resetGame = function() {
        cleanupRaffleTimers();
        return originalResetGame.call(this);
    };
}

console.log('抽奖系统模块已加载');

// ==================== 将天数转换为月日格式的函数（冗余定义避免依赖问题） ====================
function convertDaysToMD(dayNumber) {
    if (dayNumber < 0) return '';
    
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const monthNames = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    
    let dayInYear = dayNumber % 365;
    if (dayInYear < 0) {
        dayInYear = (dayInYear + 365) % 365;
    }
    
    let remainingDays = dayInYear;
    for (let i = 0; i < monthDays.length; i++) {
        if (remainingDays < monthDays[i]) {
            return `${monthNames[i]}.${remainingDays + 1}`;
        }
        remainingDays -= monthDays[i];
    }
    
    return '12.31';
}
