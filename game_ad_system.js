// ==================== 商单系统模块（重构版）=======================
// 本模块包含所有与商业订单相关的功能
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS, violationKeywords)
// 依赖: game_ui.js (showNotification, showWarning, showAlert, updateDisplay, closeFullscreenPage)

// ==================== 新增：底部弹窗通知函数 ====================
function showBottomPopup(title, content) {
    // 创建弹窗元素
    const popup = document.createElement('div');
    popup.className = 'bottom-popup';
    popup.innerHTML = `
        <div class="bottom-popup-content">
            <div class="bottom-popup-title">${title}</div>
            <div class="bottom-popup-message">${content}</div>
        </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .bottom-popup {
            position: fixed;
            bottom: -100px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 400px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px 12px 0 0;
            box-shadow: 0 -4px 20px rgba(102, 126, 234, 0.4);
            z-index: 9999;
            transition: bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bottom-popup.show {
            bottom: 0;
        }
        .bottom-popup-content {
            padding: 18px 20px;
            color: #fff;
        }
        .bottom-popup-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .bottom-popup-title::before {
            content: "💰";
            font-size: 18px;
        }
        .bottom-popup-message {
            font-size: 14px;
            opacity: 0.9;
            line-height: 1.4;
        }
    `;
    
    // 确保样式只添加一次
    if (!document.querySelector('#bottomPopupStyle')) {
        style.id = 'bottomPopupStyle';
        document.head.appendChild(style);
    }
    
    // 添加到页面
    document.body.appendChild(popup);
    
    // 触发动画
    setTimeout(() => {
        popup.classList.add('show');
    }, 100);
    
    // 3.5秒后自动消失
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
        }, 400);
    }, 3500);
}

// ==================== 商单数据库（重构）=======================
window.adOrdersDB = [
    // 低风险商单（真实）
    { id: 1, title: "健康饮品推广", content: "某知名品牌健康饮品，口感清爽，适合运动后的水分补充", baseReward: 5000, risk: 0, keyword: "", actualRisk: 0.1, real: true },
    { id: 2, title: "学习APP推荐", content: "高效学习工具，帮助提升记忆力", baseReward: 8000, risk: 0, keyword: "", actualRisk: 0.05, real: true },
    { id: 3, title: "生活用品测评", content: "日常好物分享，提升生活品质", baseReward: 12000, risk: 0, keyword: "", actualRisk: 0.08, real: true },
    
    // 中风险商单（部分虚假）
    { id: 4, title: "传统草本精华", content: "调节身体机能，效果因人而异，坚持服用见效", baseReward: 30000, risk: 0.6, keyword: "见效", actualRisk: 0.4, real: false },
    { id: 5, title: "游戏陪玩平台", content: "边娱乐边创收，时间自由多劳多得", baseReward: 40000, risk: 0.5, keyword: "多劳多得", actualRisk: 0.35, real: false },
    { id: 6, title: "海外好物分享", content: "原装进口，价格优惠，支持专柜验货", baseReward: 15000, risk: 0.4, keyword: "验货", actualRisk: 0.3, real: false },
    
    // 高风险商单（虚假）
    { id: 7, title: "投资理财课程", content: "零基础学理财，分享年化20%+的实战技巧", baseReward: 50000, risk: 0.7, keyword: "收益", actualRisk: 0.8, real: false },
    { id: 8, title: "资金周转方案", content: "快速审批，灵活还款，解决短期资金需求", baseReward: 80000, risk: 0.9, keyword: "资金周转", actualRisk: 0.95, real: false },
    { id: 9, title: "数字资产机遇", content: "新兴区块链项目，把握时代机遇", baseReward: 100000, risk: 0.85, keyword: "区块链", actualRisk: 0.9, real: false },
    { id: 10, title: "美容护肤产品", content: "7天见证肌肤改变，独家生物科技配方", baseReward: 25000, risk: 0.65, keyword: "7天", actualRisk: 0.75, real: false }
];

// ==================== 生成随机商单（每次10个）=======================
window.generateAdOrder = function() {
    const orders = [];
    const availableOrders = [...window.adOrdersDB];
    
    // 随机选择10个商单
    for (let i = 0; i < 10; i++) {
        if (availableOrders.length === 0) break;
        const randomIndex = Math.floor(Math.random() * availableOrders.length);
        const ad = availableOrders.splice(randomIndex, 1)[0];
        
        // 高风险商单反检查能力更强（检查概率与actualRisk反向相关）
        const riskMultiplier = 1 + (ad.actualRisk * 2); // 风险越高，奖励越高
        const actualReward = Math.floor(ad.baseReward * riskMultiplier * (0.8 + Math.random() * 0.4));
        
        // ✅ 修改：高风险商单反检查能力更强（检查概率与actualRisk反向相关）
        const checkRisk = Math.max(0.05, 1 - ad.actualRisk * 0.9); // 最低5%检查概率
        
        orders.push({ 
            ...ad, 
            actualReward: actualReward, 
            method: null, 
            time: window.gameTimer, 
            status: 'pending',
            checkRisk: checkRisk  // ✅ 修改：实际被检查出来的风险（反向计算）
        });
    }
    
    return orders;
};

// ==================== 显示商单中心（显示10个） ====================
window.showAdOrders = function() {
    if (!window.gameState) {
        console.error('gameState not available');
        return;
    }
    
    if (window.gameState.isBanned) { 
        if (typeof window.showWarning === 'function') {
            window.showWarning('账号被封禁，无法接单'); 
        }
        return; 
    }
    
    const content = document.getElementById('adOrdersPageContent');
    if (!content) {
        console.error('adOrdersPageContent element not found');
        return;
    }
    
    // 检查是否有待处理的品牌合作
    if (window.gameState.pendingBrandDeal && window.gameState.pendingBrandDeal.status === 'pending') {
        const brandDeal = window.gameState.pendingBrandDeal;
        const riskText = '风险等级：低';
        const riskColor = '#00f2ea';
        
        content.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 10px; margin-bottom: 20px; color: #fff; font-weight: bold; text-align: center;">
                🎉 品牌合作机会
            </div>
            <div style="margin-bottom:20px;padding:15px;background:#161823;border-radius:10px;border:1px solid #333; border-left: 4px solid #667eea;">
                <div style="font-size:16px;font-weight:bold;margin-bottom:10px">${brandDeal.title}</div>
                <div style="font-size:14px;margin-bottom:10px;line-height:1.5">${brandDeal.content}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:18px;color:#667eea;font-weight:bold">💰 ${brandDeal.actualReward}元</div>
                    <div style="font-size:12px;color:${riskColor}">${riskText}</div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <div class="action-btn" onclick="acceptBrandDeal()" style="flex: 1; background: #667eea;">
                    <div class="action-icon">✅</div>
                    <div class="action-text">接受合作</div>
                </div>
                <div class="action-btn" onclick="rejectBrandDeal()" style="flex: 1; background: #333;">
                    <div class="action-icon">❌</div>
                    <div class="action-text">拒绝合作</div>
                </div>
            </div>
            <div style="font-size: 12px; color: #999; text-align: center;">
                💡 品牌合作风险较低，但请确保内容真实
            </div>
        `;
    } else {
        // 显示普通商单（10个）
        const ads = window.generateAdOrder();
        window.gameState.currentAdOrders = ads;
        
        const ordersHtml = ads.map((ad, index) => {
            const riskText = { 
                0: '风险等级：低', 
                0.4: '风险等级：中低', 
                0.5: '风险等级：中', 
                0.6: '风险等级：中高', 
                0.65: '风险等级：中高', 
                0.7: '风险等级：高', 
                0.85: '风险等级：很高', 
                0.9: '风险等级：极高' 
            };
            const riskColor = ad.actualRisk > 0.6 ? '#ff0050' : ad.actualRisk > 0.3 ? '#ff6b00' : '#00f2ea';
            const realLabel = ad.real ? '✅' : '⚠️';
            
            return `
                <div style="margin-bottom:15px;padding:15px;background:#161823;border-radius:10px;border:1px solid #333; cursor: pointer;" onclick="selectAdOrder(${index})">
                    <div style="font-size:16px;font-weight:bold;margin-bottom:10px">${ad.title} ${realLabel}</div>
                    <div style="font-size:14px;margin-bottom:10px;line-height:1.5">${ad.content}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="font-size:18px;color:#667eea;font-weight:bold">💰 ${ad.actualReward.toLocaleString()}元</div>
                        <div style="font-size:12px;color:${riskColor}">${riskText[ad.risk] || '风险等级：低'}</div>
                    </div>
                    <div style="font-size:11px;color:#999;margin-top:8px;">
                        实际风险: ${(ad.actualRisk * 100).toFixed(0)}% | 虚假商单: ${ad.real ? '否' : '是'}
                    </div>
                </div>
            `;
        }).join('');
        
        content.innerHTML = `
            <div style="margin-bottom:15px;font-size:14px;color:#999;text-align:center;">
                以下是10个随机商单机会（每月刷新）
            </div>
            ${ordersHtml}
            <div style="margin-top:15px;font-size:12px;color:#999;text-align:center">⚠️ 虚假商单可能带来巨额奖励，但风险极高！</div>
        `;
    }
    
    const adOrdersPage = document.getElementById('adOrdersPage');
    if (adOrdersPage) {
        adOrdersPage.classList.add('active');
    }
    
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        bottomNav.style.display = 'none';
    }
};

// ==================== 选择商单 ====================
window.selectAdOrder = function(index) {
    const ad = window.gameState.currentAdOrders[index];
    if (!ad) return;
    
    window.selectedAdOrder = ad;
    const content = document.getElementById('adOrdersPageContent');
    
    const riskText = { 
        0: '风险等级：低', 
        0.4: '风险等级：中低', 
        0.5: '风险等级：中', 
        0.6: '风险等级：中高', 
        0.65: '风险等级：中高', 
        0.7: '风险等级：高', 
        0.85: '风险等级：很高', 
        0.9: '风险等级：极高' 
    };
    const riskColor = ad.actualRisk > 0.6 ? '#ff0050' : ad.actualRisk > 0.3 ? '#ff6b00' : '#00f2ea';
    const realLabel = ad.real ? '真实商单' : '⚠️ 虚假商单';
    
    content.innerHTML = `
        <div style="margin-bottom:20px;padding:15px;background:#161823;border-radius:10px;border:1px solid #333; border-left: 4px solid ${ad.real ? '#00f2ea' : '#ff0050'};">
            <div style="font-size:16px;font-weight:bold;margin-bottom:10px">${ad.title}</div>
            <div style="font-size:14px;margin-bottom:10px;line-height:1.5">${ad.content}</div>
            <div style="font-size:12px;color:${ad.real ? '#00f2ea' : '#ff6b00'};margin-bottom:10px;font-weight:bold;">
                ${realLabel}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-size:18px;color:#667eea;font-weight:bold">💰 ${ad.actualReward.toLocaleString()}元</div>
                <div style="font-size:12px;color:${riskColor}">${riskText[ad.risk] || '风险等级：低'}</div>
            </div>
            <div style="font-size:11px;color:#999;margin-top:8px;">
                实际风险: ${(ad.actualRisk * 100).toFixed(0)}% | 
                被查概率: ${(ad.checkRisk * 100).toFixed(0)}%
            </div>
        </div>
        <div style="margin-bottom:15px;">
            <div class="input-label">选择发布方式</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
                <div class="action-btn" onclick="selectMethod('video')" style="padding:10px">
                    <div class="action-icon">🎬</div>
                    <div class="action-text">视频</div>
                </div>
                <div class="action-btn" onclick="selectMethod('post')" style="padding:10px">
                    <div class="action-icon">📝</div>
                    <div class="action-text">动态</div>
                </div>
                <div class="action-btn" onclick="selectMethod('live')" style="padding:10px">
                    <div class="action-icon">📱</div>
                    <div class="action-text">直播</div>
                </div>
            </div>
        </div>
        <div id="publishForm" style="display:none">
            <div class="input-group">
                <div class="input-label">内容创作</div>
                <textarea class="text-input" id="adContent" rows="4" placeholder="根据商单要求创作内容..." maxlength="200"></textarea>
            </div>
            <button class="btn" onclick="publishAd()">发布并领取报酬</button>
        </div>
        <div style="margin-top:15px;font-size:12px;color:#999;text-align:center">
            ${ad.real ? '✅ 真实商单，风险较低' : '⚠️ 虚假商单可能带来巨额奖励，但风险极高！'}
        </div>
    `;
};

// ==================== 选择发布方式 ====================
window.selectMethod = function(m) { 
    window.selectedMethod = m; 
    const form = document.getElementById('publishForm');
    if (form) form.style.display = 'block'; 
};

// ==================== 发布商单内容（重构版：从零开始 + 粉丝增长） ====================
window.publishAd = function() {
    const content = document.getElementById('adContent').value.trim();
    const ad = window.selectedAdOrder;
    
    if (!content) { 
        if (typeof window.showAlert === 'function') {
            window.showAlert('请输入内容', '提示');
        }
        return; 
    }
    
    // 检查违规（修改后）
    const hasViolationKeyword = window.violationKeywords && window.violationKeywords.some(k => content.includes(k));
    let hasViolation = hasViolationKeyword; // ✅ 移除了 Math.random() < ad.risk
    if (ad.keyword && content.includes(ad.keyword)) hasViolation = true; // ✅ 保留关键词违规检查
    
    if (hasViolation) {
        window.gameState.warnings = Math.min(20, window.gameState.warnings + Math.floor(Math.random() * 2) + 1);
        
        // ✅ 修改：添加警告历史记录
        if (typeof addWarningToHistory === 'function') {
            addWarningToHistory('AD_VIOLATION', 
                `商单内容违规${ad.keyword ? `（包含关键词"${ad.keyword}"）` : ''}`, 
                content.substring(0, 50) + (content.length > 50 ? '...' : ''));
        }
        
        if (typeof window.showWarning === 'function') {
            window.showWarning(`商单内容违规，警告${window.gameState.warnings}/20次`);
        }
        
        if (window.gameState.warnings >= 20) {
            if (typeof window.banAccount === 'function') {
                window.banAccount('商单违规');
            }
        }
        
        window.gameState.rejectedAdOrders++;
        
        closeFullscreenPage('adOrders');
        updateDisplay();
        saveGame();
        return;
    }
    
    // 成功发布（修改：从零开始）
    const views = 0; // ✅ 从0开始
    const likes = 0; // ✅ 从0开始
    const comments = 0; // ✅ 从0开始
    const shares = 0; // ✅ 从0开始
    const work = { 
        id: Date.now(), 
        type: window.selectedMethod, 
        content: content, 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: window.gameTimer, 
        isAd: true, 
        adOrder: ad, // 保存商单信息
        revenue: Math.floor((Math.random() * 15000 + 5000) / 1000), // ✅ 收益保留，但初始播放量为0
        isPrivate: false,
        hasNegativeComments: false,  // 是否有负面评论
        // ✅ 移除：不再需要单独的粉丝增长定时器
        // growthEndTime: null,
        // fanGrowthInterval: null
    };
    
    window.gameState.worksList.push(work);
    window.gameState.works++;
    
    // 只统计视频和直播的播放量（初始为0）
    if (work.type === 'video' || work.type === 'live') {
        // window.gameState.views += work.views; // ✅ 从0开始，不增加
    }
    
    // window.gameState.likes += work.likes; // ✅ 从0开始，不增加
    window.gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5)); // ✅ 收益影响粉丝（但views初始为0，所以基本不增加）
    window.gameState.money += ad.actualReward;
    window.gameState.adOrdersCount++;
    
    // 统计互动
    if (typeof window.gameState.totalInteractions === 'number') {
        window.gameState.totalInteractions += comments + likes + shares;
    }
    
    // 粉丝疲劳检查
    if (window.gameState.adOrdersCount % 10 === 0) {
        const fanLoss = Math.floor(Math.random() * 1000) + 500;
        window.gameState.fans = Math.max(0, window.gameState.fans - fanLoss);
        // ✅ 修改：使用涨掉粉通知系统
        addFanChangeNotification('⬇️', `长期接商单导致粉丝流失：${fanLoss.toLocaleString()}`, '粉丝疲劳', 'loss', fanLoss);
    }
    
    // ✅ 修改：只显示小弹窗通知，移除通知中心通知
    showEventPopup('🎉 商单完成', `成功完成 "${ad.title}" 商单，获得 ${ad.actualReward.toLocaleString()} 元报酬！`);
    
    // 检查成就
    checkAdAchievements();
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
    
    // 检查高商单数惩罚
    if (typeof window.checkHighAdCountPenalty === 'function') {
        window.checkHighAdCountPenalty();
    }
    
    // ✅ 修复：重置不更新状态（关键修复）
    if (typeof window.resetInactivityDropState === 'function') {
        window.resetInactivityDropState();
    }
    
    // ✅ ✅ ✅ 关键修改：将作品加入全局粉丝增长系统，而不是启动单独定时器
    if (typeof window.addWorkToGlobalFanGrowth === 'function') {
        window.addWorkToGlobalFanGrowth(work.id, true); // isNewWork = true
    }
    
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay();
    }
    
    saveGame();
};

// ==================== 选择发布方式 ====================
window.selectMethod = function(m) { 
    window.selectedMethod = m; 
    const form = document.getElementById('publishForm');
    if (form) form.style.display = 'block'; 
};

// ==================== 发布商单内容（重构版：从零开始 + 粉丝增长） ====================
window.publishAd = window.publishAd;

// ==================== 月底商单检查（修复版：支持所有月份）=======================
window.checkMonthlyAdOrders = function() {
    if (!window.gameState || window.gameState.isBanned) return;
    
    const currentDate = getVirtualDate();
    
    // ✅ 修复：根据月份动态获取最后一天
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const daysInMonth = monthDays[currentDate.month - 1]; // month是1-12，数组索引是0-11
    
    if (currentDate.day !== daysInMonth) return; // 只在每月最后一天检查
    
    console.log(`执行月底商单检查，当前虚拟时间: ${formatVirtualDate(true)}`);
    
    // 检查过去30天接的商单
    const thirtyDaysAgo = window.gameTimer - (30 * VIRTUAL_DAY_MS);
    const recentAdWorks = window.gameState.worksList.filter(work => 
        work.isAd && work.time >= thirtyDaysAgo && !work.isPrivate
    );
    
    let totalFine = 0;
    let hasFakeAd = false;
    let exposedWorks = [];
    
    recentAdWorks.forEach(work => {
        if (!work.adOrder || work.adOrder.real) return; // 真实商单不检查
        
        // 虚假商单检查概率：checkRisk决定
        if (Math.random() < work.adOrder.checkRisk) {
            hasFakeAd = true;
            exposedWorks.push(work);
            
            // 罚款：奖励的1-3倍
            const fine = Math.floor(work.adOrder.actualReward * (1 + Math.random() * 2));
            totalFine += fine;
            
            // 标记为已检查和曝光
            work.adOrder.isChecked = true;
            work.adOrder.isExposed = true;
            work.hasNegativeComments = true;
            
            // ✅ 修复：如果作品有粉丝增长定时器，清理它
            if (work.fanGrowthInterval) {
                clearInterval(work.fanGrowthInterval);
                work.fanGrowthInterval = null;
                work.growthEndTime = null;
                console.log(`[商单查处] 作品 ${work.id} 的粉丝增长定时器已清理`);
            }
        }
    });
    
    if (hasFakeAd) {
        // 1. 罚款
        window.gameState.money = Math.max(0, window.gameState.money - totalFine);
        
        // 2. 警告
        window.gameState.warnings = Math.min(20, window.gameState.warnings + 5);
        
        // 3. 平台惩罚：封号7-30天
        const banDays = Math.floor(Math.random() * 24) + 7;
        window.gameState.isBanned = true;
        window.gameState.banReason = '发布虚假商单内容';
        window.gameState.banDaysCount = banDays;
        window.gameState.banStartTime = window.gameTimer;
        window.gameState.appealAvailable = true;
        
        // 4. 强制结束直播
        if (gameState.liveStatus && typeof endLiveStream === 'function') {
            endLiveStream();
            if (typeof window.showEventPopup === 'function') {
                showEventPopup('🚫 直播中断', '虚假商单曝光，直播已强制结束');
            }
        }
        
        // 5. 停止所有推广
        Object.keys(gameState.trafficWorks).forEach(workId => {
            if (typeof stopTrafficForWork === 'function') {
                stopTrafficForWork(workId);
            }
        });
        
        // 6. 开始持续掉粉惩罚（修复版：不会重置已有惩罚）
        startFakeAdFanLoss(exposedWorks, true);
        
        // ✅ 添加警告历史记录（虚假商单查处）
        if (typeof addWarningToHistory === 'function') {
            exposedWorks.forEach(work => {
                addWarningToHistory('FAKE_AD', 
                    `虚假商单"${work.adOrder.title}"被平台查处`, 
                    work.content.substring(0, 50) + (work.content.length > 50 ? '...' : ''));
            });
        }
        
        // 7. 负面新闻
        if (typeof window.startPublicOpinionCrisis === 'function') {
            window.startPublicOpinionCrisis('⚠️ 虚假商单丑闻');
        }
        
        // ✅ 新增：删除被检测到的虚假商单视频
        exposedWorks.forEach(work => {
            // 找到作品索引
            const workIndex = window.gameState.worksList.findIndex(w => w.id === work.id);
            if (workIndex !== -1) {
                // 从统计数据中减去该视频的贡献
                if (work.type === 'video' || work.type === 'live') {
                    window.gameState.views = Math.max(0, window.gameState.views - work.views);
                }
                window.gameState.likes = Math.max(0, window.gameState.likes - work.likes);
                
                // 更新作品计数器
                window.gameState.works = Math.max(0, window.gameState.works - 1);
                
                // 更新总互动数
                const interactionCount = work.comments + work.likes + work.shares;
                window.gameState.totalInteractions = Math.max(0, window.gameState.totalInteractions - interactionCount);
                
                // 清理推荐定时器
                if (work.recommendInterval) {
                    clearInterval(work.recommendInterval);
                    work.recommendInterval = null;
                }
                
                // 清理争议定时器
                if (work.controversyInterval) {
                    clearInterval(work.controversyInterval);
                    work.controversyInterval = null;
                }
                
                // 清理热搜定时器
                if (work.hotInterval) {
                    clearInterval(work.hotInterval);
                    work.hotInterval = null;
                }
                
                // 清理抽奖相关定时器
                if (work.isRaffle) {
                    if (work.fanGrowthInterval) clearInterval(work.fanGrowthInterval);
                    if (work.dataGrowthInterval) clearInterval(work.dataGrowthInterval);
                    if (work.fanLossInterval) clearInterval(work.fanLossInterval);
                    if (work.manualDrawWarningInterval) clearInterval(work.manualDrawWarningInterval);
                    if (work.crazyFanLossInterval) clearInterval(work.crazyFanLossInterval);
                }
                
                // 清理流量推广
                if (window.gameState.trafficWorks[work.id]) {
                    if (typeof stopTrafficForWork === 'function') {
                        stopTrafficForWork(work.id);
                    }
                    delete window.gameState.trafficWorks[work.id];
                }
                
                // 从列表中删除
                window.gameState.worksList.splice(workIndex, 1);
                
                console.log(`[商单查处] 作品 ${work.id} 已被删除`);
            }
        });
        
        // ✅ 修改：使用小弹窗通知
        if (typeof window.showEventPopup === 'function') {
            showEventPopup('🚨 虚假商单被查处！', `罚款${totalFine.toLocaleString()}元，封号${banDays}天，粉丝将持续流失！`);
        }
        
        if (typeof window.showWarning === 'function') {
            window.showWarning(`发布虚假商单！警告${window.gameState.warnings}/20次`);
        }
    }
};

// ==================== 虚假商单持续掉粉惩罚（终极修复版 - 支持惩罚叠加）=======================
window.startFakeAdFanLoss = function(exposedWorks, isFromMonthlyCheck = false) {
    if (!exposedWorks || exposedWorks.length === 0) return;
    
    // 计算新的惩罚天数（30-180天）
    const newPenaltyDays = Math.floor(Math.random() * 151) + 30;
    const newDailyFanLoss = Math.floor(Math.random() * 500) + 1; // 每秒1-500粉
    
    // 检查是否已存在活跃的惩罚
    if (window.gameState.fakeAdPenalty && window.gameState.fakeAdPenalty.isActive) {
        // 已存在活跃惩罚，将新的惩罚天数追加到剩余时间上
        const now = window.gameTimer;
        const currentEndTime = window.gameState.fakeAdPenalty.endTime;
        const remainingDays = Math.max(0, (currentEndTime - now) / VIRTUAL_DAY_MS);
        
        // 合并惩罚：剩余天数 + 新天数
        const totalDays = remainingDays + newPenaltyDays;
        const mergedEndTime = now + (totalDays * VIRTUAL_DAY_MS);
        const maxDailyLoss = Math.max(window.gameState.fakeAdPenalty.dailyFanLoss, newDailyFanLoss);
        
        console.log(`[惩罚合并] 剩余${remainingDays.toFixed(1)}天 + 新增${newPenaltyDays}天 = 总${totalDays.toFixed(1)}天，使用掉粉速率${maxDailyLoss}`);
        
        // 更新惩罚状态（合并）
        window.gameState.fakeAdPenalty.endTime = mergedEndTime;
        window.gameState.fakeAdPenalty.dailyFanLoss = maxDailyLoss;
        
        // 合并暴露的作品ID（去重）
        const existingIds = window.gameState.fakeAdPenalty.exposedWorkIds || [];
        const newIds = exposedWorks.map(w => w.id);
        window.gameState.fakeAdPenalty.exposedWorkIds = [...new Set([...existingIds, ...newIds])];
        
        // ✅ 修改：使用小弹窗通知
        if (typeof showEventPopup === 'function') {
            showEventPopup('⚠️ 惩罚加重', `虚假商单丑闻恶化，惩罚延长至${Math.ceil(totalDays)}天！`);
        }
        
        return; // 不启动新的定时器，让现有的继续运行
    }
    
    // 不存在活跃惩罚，清除现有定时器（如果有的话）并创建新的惩罚
    if (window.gameState.fakeAdPenaltyInterval) {
        clearInterval(window.gameState.fakeAdPenaltyInterval);
    }
    
    // 创建新的惩罚状态
    const penaltyEndTime = window.gameTimer + (newPenaltyDays * VIRTUAL_DAY_MS);
    
    window.gameState.fakeAdPenalty = {
        isActive: true,
        endTime: penaltyEndTime,
        exposedWorkIds: exposedWorks.map(w => w.id),
        dailyFanLoss: newDailyFanLoss,
        lastNotifyTime: 0
    };
    
    console.log(`[惩罚启动] 持续${newPenaltyDays}天，每秒掉${newDailyFanLoss}粉`);
    
    // 启动掉粉定时器
    window.gameState.fakeAdPenaltyInterval = setInterval(() => {
        if (!window.gameState.fakeAdPenalty || !window.gameState.fakeAdPenalty.isActive) {
            console.log('[惩罚结束] 定时器清理');
            clearInterval(window.gameState.fakeAdPenaltyInterval);
            window.gameState.fakeAdPenaltyInterval = null;
            return;
        }
        
        // 检查是否到期
        if (window.gameTimer >= window.gameState.fakeAdPenalty.endTime) {
            console.log('[惩罚到期] 自动结束');
            window.gameState.fakeAdPenalty.isActive = false;
            clearInterval(window.gameState.fakeAdPenaltyInterval);
            window.gameState.fakeAdPenaltyInterval = null;
            
            // ✅ 修改：使用小弹窗通知
            if (typeof window.showEventPopup === 'function') {
                showEventPopup('✅ 虚假商单影响结束', '粉丝的愤怒逐渐平息');
            }
            return;
        }
        
        // ✅ 修复：每秒从1-500之间随机掉粉
        const lossAmount = Math.floor(Math.random() * 500) + 1; // 1-500之间的随机数
        
        window.gameState.fans = Math.max(0, window.gameState.fans - lossAmount);
        
        // ✅ 修改为每秒显示一次通知（使用涨掉粉通知系统）
        const now = Date.now();
        const lastNotify = window.gameState.fakeAdPenalty.lastNotifyTime || 0;
        if (now - lastNotify > 1000) { // 从5000改为1000，实现每秒通知
            window.gameState.fakeAdPenalty.lastNotifyTime = now;
            const daysLeft = Math.ceil((window.gameState.fakeAdPenalty.endTime - window.gameTimer) / VIRTUAL_DAY_MS);
            
            // ✅ 修改：使用涨掉粉通知系统
            addFanChangeNotification('⬇️', `虚假商单丑闻持续发酵，粉丝流失-${lossAmount}（剩余${daysLeft}天）`, '虚假商单惩罚', 'loss', lossAmount);
        }
        
        if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
        }
    }, 1000);
};

// ✅ 终极修复：游戏加载时恢复惩罚
window.resumeFakeAdPenalty = function() {
    if (!window.gameState || !window.gameState.fakeAdPenalty) {
        console.log('没有未完成的虚假商单惩罚');
        return;
    }
    
    const penalty = window.gameState.fakeAdPenalty;
    const timeLeft = Math.max(0, penalty.endTime - window.gameTimer);
    
    if (timeLeft <= 0) {
        console.log('虚假商单惩罚已过期，清理状态');
        window.gameState.fakeAdPenalty.isActive = false;
        window.gameState.fakeAdPenalty = null;
        if (penalty.interval) {
            clearInterval(penalty.interval);
        }
        return;
    }
    
    console.log(`[恢复惩罚] 剩余${timeLeft / VIRTUAL_DAY_MS}天，每秒掉${penalty.dailyFanLoss}粉`);
    
    // 防止重复启动
    if (window.gameState.fakeAdPenaltyInterval) {
        clearInterval(window.gameState.fakeAdPenaltyInterval);
    }
    
    // 重置为活跃状态
    window.gameState.fakeAdPenalty.isActive = true;
    
    // 重新启动定时器
    window.gameState.fakeAdPenaltyInterval = setInterval(() => {
        if (!window.gameState.fakeAdPenalty || !window.gameState.fakeAdPenalty.isActive) {
            clearInterval(window.gameState.fakeAdPenaltyInterval);
            window.gameState.fakeAdPenaltyInterval = null;
            return;
        }
        
        if (window.gameTimer >= window.gameState.fakeAdPenalty.endTime) {
            window.gameState.fakeAdPenalty.isActive = false;
            clearInterval(window.gameState.fakeAdPenaltyInterval);
            window.gameState.fakeAdPenaltyInterval = null;
            
            // ✅ 修改：使用小弹窗通知
            if (typeof window.showEventPopup === 'function') {
                showEventPopup('✅ 虚假商单影响结束', '粉丝的愤怒逐渐平息');
            }
            return;
        }
        
        // ✅ 修复：每秒从1-500之间随机掉粉
        const lossAmount = Math.floor(Math.random() * 500) + 1; // 1-500之间的随机数
        
        window.gameState.fans = Math.max(0, window.gameState.fans - lossAmount);
        
        // ✅ 修改为每秒显示一次通知（使用涨掉粉通知系统）
        const now = Date.now();
        const lastNotify = window.gameState.fakeAdPenalty.lastNotifyTime || 0;
        if (now - lastNotify > 1000) { // 从5000改为1000，实现每秒通知
            window.gameState.fakeAdPenalty.lastNotifyTime = now;
            const daysLeft = Math.ceil((window.gameState.fakeAdPenalty.endTime - window.gameTimer) / VIRTUAL_DAY_MS);
            
            // ✅ 修改：使用涨掉粉通知系统
            addFanChangeNotification('⬇️', `虚假商单丑闻持续发酵，粉丝流失-${lossAmount}（剩余${daysLeft}天）`, '虚假商单惩罚', 'loss', lossAmount);
        }
        
        if (typeof window.updateDisplay === 'function') {
            window.updateDisplay();
        }
    }, 1000);
    
    // 立即显示恢复提示
    // ✅ 修改：使用小弹窗通知
    if (typeof window.showEventPopup === 'function') {
        const daysLeft = Math.ceil(timeLeft / VIRTUAL_DAY_MS);
        showEventPopup('⚠️ 惩罚恢复', `检测到未完成的虚假商单惩罚，持续掉粉中（剩余${daysLeft}天）`);
    }
};

// ==================== 举报曝光机制 ====================
window.checkAdOrderExposure = function() {
    if (!window.gameState || window.gameState.isBanned) return;
    
    // 获取所有未曝光的虚假商单作品
    const fakeAdWorks = window.gameState.worksList.filter(work => 
        work.isAd && work.adOrder && !work.adOrder.real && 
        !work.adOrder.isExposed && !work.isPrivate
    );
    
    if (fakeAdWorks.length === 0) return;
    
    // ✅ 修改：每个虚假商单有0.3%概率被举报（原1%），降低举报频率
    fakeAdWorks.forEach(work => {
        if (Math.random() < 0.003) {  // 从0.01改为0.003
            // 被曝光
            work.adOrder.isExposed = true;
            work.hasNegativeComments = true;
            
            // ✅ 新增：删除被检测到的虚假商单视频
            const workIndex = window.gameState.worksList.findIndex(w => w.id === work.id);
            if (workIndex !== -1) {
                // 从统计数据中减去该视频的贡献
                if (work.type === 'video' || work.type === 'live') {
                    window.gameState.views = Math.max(0, window.gameState.views - work.views);
                }
                window.gameState.likes = Math.max(0, window.gameState.likes - work.likes);
                
                // 更新作品计数器
                window.gameState.works = Math.max(0, window.gameState.works - 1);
                
                // 更新总互动数
                const interactionCount = work.comments + work.likes + work.shares;
                window.gameState.totalInteractions = Math.max(0, window.gameState.totalInteractions - interactionCount);
                
                // 清理推荐定时器
                if (work.recommendInterval) {
                    clearInterval(work.recommendInterval);
                    work.recommendInterval = null;
                }
                
                // 清理争议定时器
                if (work.controversyInterval) {
                    clearInterval(work.controversyInterval);
                    work.controversyInterval = null;
                }
                
                // 清理热搜定时器
                if (work.hotInterval) {
                    clearInterval(work.hotInterval);
                    work.hotInterval = null;
                }
                
                // 清理抽奖相关定时器
                if (work.isRaffle) {
                    if (work.fanGrowthInterval) clearInterval(work.fanGrowthInterval);
                    if (work.dataGrowthInterval) clearInterval(work.dataGrowthInterval);
                    if (work.fanLossInterval) clearInterval(work.fanLossInterval);
                    if (work.manualDrawWarningInterval) clearInterval(work.manualDrawWarningInterval);
                    if (work.crazyFanLossInterval) clearInterval(work.crazyFanLossInterval);
                }
                
                // 清理流量推广
                if (window.gameState.trafficWorks[work.id]) {
                    if (typeof stopTrafficForWork === 'function') {
                        stopTrafficForWork(work.id);
                    }
                    delete window.gameState.trafficWorks[work.id];
                }
                
                // 从列表中删除
                window.gameState.worksList.splice(workIndex, 1);
                
                // 显示删除通知
                if (typeof window.showEventPopup === 'function') {
                    showEventPopup('🗑️ 视频已删除', `虚假商单视频已被平台删除`);
                }
                
                console.log(`[举报曝光] 作品 ${work.id} 已被删除`);
            }
            
            // 罚款
            const fine = Math.floor(work.adOrder.actualReward * 1.5);
            window.gameState.money = Math.max(0, window.gameState.money - fine);
            window.gameState.warnings = Math.min(20, window.gameState.warnings + 3);
            
            // ✅ 不中断直播（修复：移除了强制结束直播的代码）
            // ✅ 修改：虚假商单被曝光不再强制结束直播
            
            // ✅ 不停止所有推广（修复：移除了停止所有推广的代码）
            // ✅ 修改：虚假商单被曝光不再停止所有流量推广
            
            // 开始掉粉惩罚（修复版：不会重置已有惩罚）
            startFakeAdFanLoss([work]);
            
            // 舆论风波
            if (typeof window.startPublicOpinionCrisis === 'function') {
                window.startPublicOpinionCrisis('⚠️ 虚假商单被曝光');
            }
            
            // ✅ 添加警告历史记录（虚假商单被举报）
            if (typeof addWarningToHistory === 'function') {
                addWarningToHistory('FAKE_AD', 
                    `虚假商单"${work.adOrder.title}"被网友举报`, 
                    work.content.substring(0, 50) + (work.content.length > 50 ? '...' : ''));
            }
            
            // ✅ 修复：如果作品有粉丝增长定时器，清理它
            if (work.fanGrowthInterval) {
                clearInterval(work.fanGrowthInterval);
                work.fanGrowthInterval = null;
                work.growthEndTime = null;
                console.log(`[举报曝光] 作品 ${work.id} 的粉丝增长定时器已清理`);
            }
            
            // ✅ 修改：使用涨掉粉通知系统（罚款通知仍在通知中心）
            showEventPopup('🚨 虚假商单被曝光！', `罚款${fine.toLocaleString()}元，警告+3，粉丝开始流失！`);
            
            if (typeof window.showWarning === 'function') {
                window.showWarning(`虚假商单被曝光！警告${window.gameState.warnings}/20次`);
            }
        }
    });
};

// ==================== 生成负面评论 ====================
window.generateNegativeComments = function(count) {
    const comments = [];
    const users = ['正义使者', '曝光侠', '打假专家', '愤怒的粉丝', '受害者', '维权人士', '监管员', '诚信卫士'];
    const contents = [
        '假广告！退钱！',
        '这种虚假商单也接？取关了！',
        '举报了，欺骗粉丝',
        '难怪最近内容质量下降',
        '失望，居然接假商单',
        '平台应该封禁这种主播',
        '虚假广告害人不浅',
        '再也不相信你了',
        '为了钱什么都干',
        '可耻的虚假宣传'
    ];
    
    for (let i = 0; i < count; i++) {
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const avatarChar = baseUser.charAt(0);
        
        comments.push({
            user: username,
            avatar: avatarChar,
            content: contents[Math.floor(Math.random() * contents.length)],
            likes: Math.floor(Math.random() * 50) + 10,
            time: window.gameTimer,
            isNegative: true
        });
    }
    
    return comments;
};

// ==================== 修改评论生成函数以包含负面评论 ====================
window.generateCommentsWithNegative = function(work, count, workTime) {
    const comments = [];
    const normalUsers = ['小可爱', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子', 
                   '快乐小天使', '追星族', '游戏迷', '文艺青年', '美食家', '旅行达人', '摄影师', '音乐人'];
    const normalContents = ['太棒了！', '支持主播！', '666', '拍得真好', '来了来了', '前排围观', '主播辛苦了', '加油加油', 
                      '很好看', '不错不错', '学习了', '收藏了', '转发支持', '期待更新', '主播最美', '最棒的主播', 
                      '今天状态真好', '这个内容有意思', '讲得很详细', '受益匪浅', '主播人真好', '互动很棒', '直播很有趣'];
    
    const negativeUsers = ['正义使者', '曝光侠', '打假专家', '愤怒的粉丝', '受害者', '维权人士', '监管员', '诚信卫士'];
    const negativeContents = ['假广告！退钱！', '这种虚假商单也接？取关了！', '举报了，欺骗粉丝', '难怪最近内容质量下降', '失望，居然接假商单', '平台应该封禁这种主播', '虚假广告害人不浅', '再也不相信你了', '为了钱什么都干', '可耻的虚假宣传'];
    
    const commentCount = Math.min(count, 20);
    const now = window.gameTimer;
    
    // 如果有负面评论，混合生成
    const negativeRatio = work.hasNegativeComments ? 0.4 : 0; // 40%负面评论
    
    for (let i = 0; i < commentCount; i++) {
        const isNegative = Math.random() < negativeRatio;
        const users = isNegative ? negativeUsers : normalUsers;
        const contents = isNegative ? negativeContents : normalContents;
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const avatarChar = baseUser.charAt(0);
        
        const maxOffset = Math.max(0, now - workTime);
        const randomFactor = Math.random() * Math.random();
        const offset = Math.floor(randomFactor * maxOffset);
        const commentTime = Math.min(workTime + offset, now);
        
        comments.push({ 
            user: username,
            avatar: avatarChar,
            content: contents[Math.floor(Math.random() * contents.length)], 
            likes: Math.floor(Math.random() * (isNegative ? 50 : 100)), 
            time: commentTime,
            isNegative: isNegative
        });
    }
    
    return comments;
};

// ==================== 接受品牌合作（保持原有逻辑） ====================
window.acceptBrandDeal = function() {
    if (!window.gameState.pendingBrandDeal || window.gameState.pendingBrandDeal.status !== 'pending') {
        if (typeof window.showWarning === 'function') {
            window.showWarning('没有待处理的品牌合作');
        }
        return;
    }
    
    const brandDeal = window.gameState.pendingBrandDeal;
    const content = document.getElementById('adOrdersPageContent');
    
    content.innerHTML = `
        <div style="margin-bottom:20px;padding:15px;background:#161823;border-radius:10px;border:1px solid #333; border-left: 4px solid #00f2ea;">
            <div style="font-size:16px;font-weight:bold;margin-bottom:10px">${brandDeal.title}</div>
            <div style="font-size:14px;margin-bottom:10px;line-height:1.5">${brandDeal.content}</div>
            <div style="font-size:18px;color:#667eea;font-weight:bold">💰 ${brandDeal.actualReward}元</div>
        </div>
        <div class="input-group">
            <div class="input-label">合作内容创作</div>
            <textarea class="text-input" id="brandAdContent" rows="6" placeholder="根据品牌要求进行内容创作，注意保持真实体验分享..." maxlength="300"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:15px;">
            <div class="action-btn" onclick="selectBrandMethod('video')" style="padding:10px">
                <div class="action-icon">🎬</div>
                <div class="action-text">视频</div>
            </div>
            <div class="action-btn" onclick="selectBrandMethod('post')" style="padding:10px">
                <div class="action-icon">📝</div>
                <div class="action-text">动态</div>
            </div>
            <div class="action-btn" onclick="selectBrandMethod('live')" style="padding:10px">
                <div class="action-icon">📱</div>
                <div class="action-text">直播</div>
            </div>
        </div>
        <button class="btn" onclick="publishBrandAd()">发布合作内容并领取报酬</button>
        <div style="margin-top:15px;font-size:12px;color:#999;text-align:center">💡 品牌合作内容需真实体验，避免虚假宣传</div>
    `;
    
    window.selectedBrandMethod = 'video'; // 默认选择视频
};

// ==================== 拒绝品牌合作（保持原有逻辑） ====================
window.rejectBrandDeal = function() {
    if (!window.gameState.pendingBrandDeal || window.gameState.pendingBrandDeal.status !== 'pending') {
        if (typeof window.showWarning === 'function') {
            window.showWarning('没有待处理的品牌合作');
        }
        return;
    }
    
    window.gameState.pendingBrandDeal.status = 'rejected';
    window.gameState.rejectedAdOrders++;
    
    // ✅ 修改：使用小弹窗通知
    if (typeof window.showEventPopup === 'function') {
        showEventPopup('合作已拒绝', '你拒绝了品牌合作机会');
    }
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
};

// ==================== 选择品牌合作发布方式（保持原有逻辑） ====================
window.selectBrandMethod = function(method) {
    window.selectedBrandMethod = method;
    
    const buttons = document.querySelectorAll('#adOrdersPageContent .action-btn');
    buttons.forEach(btn => {
        btn.style.border = '1px solid #333';
    });
    
    if (event && event.currentTarget) {
        event.currentTarget.style.border = '2px solid #00f2ea';
    }
};

// ==================== 发布品牌合作内容（修复版：从零开始 + 粉丝增长） ====================
window.publishBrandAd = function() {
    const content = document.getElementById('brandAdContent').value.trim();
    const brandDeal = window.gameState.pendingBrandDeal;
    
    if (!content) { 
        if (typeof window.showAlert === 'function') {
            window.showAlert('请输入合作内容', '提示');
        }
        return; 
    }
    
    // 检查违规
    if (typeof window.checkViolation === 'function' && window.checkViolation(content)) return;
    
    // 成功发布（修改：从零开始）
    const views = 0; // ✅ 从0开始
    const likes = 0; // ✅ 从0开始
    const comments = 0; // ✅ 从0开始
    const shares = 0; // ✅ 从0开始
    const work = { 
        id: Date.now(), 
        type: window.selectedBrandMethod || 'video', 
        content: content, 
        views: views, 
        likes: likes, 
        comments: comments, 
        shares: shares, 
        time: window.gameTimer, 
        isAd: true, 
        revenue: Math.floor(views / 1000), // ✅ 收益从0开始计算
        isPrivate: false,
        // ✅ 移除：不再需要单独的粉丝增长定时器
        // growthEndTime: null,
        // fanGrowthInterval: null
    };
    
    window.gameState.worksList.push(work);
    window.gameState.works++;
    
    // 只统计视频和直播的播放量（初始为0）
    if (work.type === 'video' || work.type === 'live') {
        // window.gameState.views += work.views; // ✅ 从0开始，不增加
    }
    
    // window.gameState.likes += work.likes; // ✅ 从0开始，不增加
    window.gameState.fans += Math.floor(work.views / 1000 * (Math.random() * 2 + 0.5)); // ✅ 基本不增加粉丝
    window.gameState.money += brandDeal.actualReward;
    window.gameState.adOrdersCount++;
    
    // 统计互动
    if (typeof window.gameState.totalInteractions === 'number') {
        window.gameState.totalInteractions += comments + likes + shares;
    }
    
    // 清空pending状态
    window.gameState.pendingBrandDeal = null;
    
    // ✅ 修改：只显示小弹窗通知，移除通知中心通知
    showEventPopup('🎉 品牌合作完成', `品牌合作 "${brandDeal.title}" 已完成，获得 ${brandDeal.actualReward.toLocaleString()} 元报酬！`);
    
    if (typeof window.closeFullscreenPage === 'function') {
        window.closeFullscreenPage('adOrders');
    }
    
    if (typeof window.updateDisplay === 'function') {
        window.updateDisplay();
    }
    
    // 检查成就
    checkAdAchievements();
    
    // ✅ 修复：重置不更新状态（关键修复）
    if (typeof window.resetInactivityDropState === 'function') {
        window.resetInactivityDropState();
    }
    
    // ✅ ✅ ✅ 关键修改：将作品加入全局粉丝增长系统，而不是启动单独定时器
    if (typeof window.addWorkToGlobalFanGrowth === 'function') {
        window.addWorkToGlobalFanGrowth(work.id, true); // isNewWork = true
    }
};

// ==================== 选择发布方式 ====================
window.selectMethod = function(m) { 
    window.selectedMethod = m; 
    const form = document.getElementById('publishForm');
    if (form) form.style.display = 'block'; 
};

// ==================== 发布商单内容（重构版：从零开始 + 粉丝增长） ====================
window.publishAd = window.publishAd;

// ==================== 高商单数惩罚机制（保持原有逻辑） ====================
window.checkHighAdCountPenalty = function() {
    if (!window.gameState || window.gameState.isBanned) return;
    
    // 检查是否达到触发阈值（>=30单且不在惩罚期）
    if (window.gameState.adOrdersCount >= 30 && !window.gameState.adOrdersPenaltyActive) {
        console.log(`商单数达到${window.gameState.adOrdersCount}，触发粉丝疲劳惩罚`);
        
        // 1. 记录惩罚强度
        window.gameState.adOrdersPenaltyIntensity = window.gameState.adOrdersCount;
        
        // 2. 随机设置惩罚期（1-5虚拟天）
        const penaltyDays = Math.floor(Math.random() * 5) + 1;
        window.gameState.adOrdersPenaltyEndTime = window.gameTimer + (penaltyDays * VIRTUAL_DAY_MS);
        window.gameState.adOrdersPenaltyActive = true;
        
        // 3. 清空商单计数
        window.gameState.adOrdersCount = 0;
        
        // 4. 显示通知
        // ✅ 修改：使用小弹窗通知
        if (typeof window.showEventPopup === 'function') {
            showEventPopup('⚠️ 粉丝疲劳爆发', `长期接商单引发粉丝不满！惩罚持续${penaltyDays}虚拟天`);
        }
        
        // 5. 启动惩罚期专用定时器
        if (window.gameState.adOrdersPenaltyInterval) {
            clearInterval(window.gameState.adOrdersPenaltyInterval);
        }
        
        window.gameState.adOrdersPenaltyInterval = setInterval(() => {
            // 检查惩罚是否结束
            if (window.gameTimer >= window.gameState.adOrdersPenaltyEndTime) {
                // 惩罚结束
                clearInterval(window.gameState.adOrdersPenaltyInterval);
                window.gameState.adOrdersPenaltyInterval = null;
                window.gameState.adOrdersPenaltyActive = false;
                window.gameState.adOrdersPenaltyIntensity = 0;
                
                // ✅ 修改：使用小弹窗通知
                if (typeof window.showEventPopup === 'function') {
                    showEventPopup('✅ 粉丝疲劳缓解', '经过休息，粉丝对你的印象有所好转');
                }
                
                if (typeof window.updateDisplay === 'function') {
                    window.updateDisplay();
                }
                return;
            }
            
            // 惩罚期：高概率掉粉
            const baseProbability = 0.30;
            const intensityBonus = Math.floor(window.gameState.adOrdersPenaltyIntensity / 10) * 0.05;
            const dropProbability = Math.min(0.80, baseProbability + intensityBonus);
            
            if (Math.random() < dropProbability) {
                const baseDrop = Math.floor(Math.random() * 11) + 5;
                const intensityDrop = Math.floor(window.gameState.adOrdersPenaltyIntensity / 5) * 2;
                const dropAmount = baseDrop + intensityDrop;
                
                window.gameState.fans = Math.max(0, window.gameState.fans - dropAmount);
                
                // 20%概率显示通知
                if (Math.random() < 0.20) {
                    // ✅ 修改：使用涨掉粉通知系统
                    addFanChangeNotification('⬇️', '因长期接商单失去粉丝', '粉丝疲劳', 'loss', dropAmount);
                }
                
                if (typeof window.updateDisplay === 'function') {
                    window.updateDisplay();
                }
            }
        }, 1000);
        
        if (typeof window.saveGame === 'function') {
            window.saveGame();
        }
    }
};

// ==================== 检查商单成就 ====================
function checkAdAchievements() {
    if (!window.achievements || !window.gameState) return;
    
    // 商单相关成就定义
    const adAchievements = [
        { id: 21, name: '商单新人', desc: '完成首个商单', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 1 },
        { id: 22, name: '广告达人', desc: '完成10个商单', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 10 },
        { id: 23, name: '百万单王', desc: '单次商单收入超50万', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).some(w => (w.revenue || 0) >= 50000) },
        { id: 24, name: '火眼金睛', desc: '识别并拒绝5个违规商单', target: () => window.gameState.rejectedAdOrders >= 5 },
        { id: 25, name: '商单大师', desc: '完成50个商单且未违规', target: () => window.gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 50 && window.gameState.warnings < 5 },
        // 新增成就
        { id: 26, name: '赌徒', desc: '完成10个虚假商单', target: () => window.gameState.worksList.filter(w => w.isAd && w.adOrder && !w.adOrder.real && !w.isPrivate && !w.adOrder.isExposed).length >= 10 },
        { id: 27, name: '身败名裂', desc: '因虚假商单被封号3次', target: () => window.gameState.fakeAdBans >= 3 },
        { id: 28, name: '诚信经营', desc: '连续3个月无虚假商单', target: () => window.gameState.monthsWithoutFakeAd >= 3 }
    ];
    
    adAchievements.forEach(achievementDef => {
        const achievement = window.achievements.find(a => a.id === achievementDef.id);
        if (achievement && !achievement.unlocked && achievementDef.target()) {
            achievement.unlocked = true;
            window.gameState.achievements.push(achievement.id);
            
            // 显示成就弹窗
            if (typeof window.showAchievementPopup === 'function') {
                window.showAchievementPopup(achievement);
            }
            
            // 保留原有的通知中心消息
            window.showNotification('成就解锁！', `${achievement.name}：${achievement.desc}`);
        }
    });
}

// ==================== 初始化商单相关状态（已修复：恢复惩罚定时器） ====================
function initAdSystem() {
    // 确保商单相关状态存在
    if (window.gameState) {
        if (window.gameState.adOrders === undefined) window.gameState.adOrders = [];
        if (window.gameState.currentAdOrders === undefined) window.gameState.currentAdOrders = [];
        if (window.gameState.rejectedAdOrders === undefined) window.gameState.rejectedAdOrders = 0;
        if (window.gameState.adOrdersCount === undefined) window.gameState.adOrdersCount = 0;
        if (window.gameState.pendingBrandDeal === undefined) window.gameState.pendingBrandDeal = null;
        
        // 惩罚机制状态
        if (window.gameState.adOrdersPenaltyActive === undefined) window.gameState.adOrdersPenaltyActive = false;
        if (window.gameState.adOrdersPenaltyEndTime === undefined) window.gameState.adOrdersPenaltyEndTime = 0;
        if (window.gameState.adOrdersPenaltyIntensity === undefined) window.gameState.adOrdersPenaltyIntensity = 0;
        if (window.gameState.adOrdersPenaltyInterval === undefined) window.gameState.adOrdersPenaltyInterval = null;
        
        // 新增虚假商单惩罚状态
        if (window.gameState.fakeAdPenalty === undefined) window.gameState.fakeAdPenalty = null;
        if (window.gameState.fakeAdPenaltyInterval === undefined) window.gameState.fakeAdPenaltyInterval = null;
        if (window.gameState.fakeAdBans === undefined) window.gameState.fakeAdBans = 0;
        if (window.gameState.monthsWithoutFakeAd === undefined) window.gameState.monthsWithoutFakeAd = 0;
        if (window.gameState.lastCheckMonth === undefined) window.gameState.lastCheckMonth = -1;
        
        // ✅ 关键修复：游戏加载时恢复未完成的惩罚
        // 延迟恢复，确保gameTimer已同步
        setTimeout(() => {
            if (window.gameState.fakeAdPenalty && window.gameState.fakeAdPenalty.isActive) {
                console.log('[初始化] 检测到未完成的虚假商单惩罚，5秒后恢复...');
                window.resumeFakeAdPenalty();
            }
        }, 5000);
    }
}

// ==================== 月度检查定时器 ====================
window.startMonthlyCheck = function() {
    if (window.monthlyCheckInterval) {
        clearInterval(window.monthlyCheckInterval);
    }
    
    window.monthlyCheckInterval = setInterval(() => {
        const currentDate = getVirtualDate();
        
        // 每月只检查一次
        if (currentDate.month !== window.gameState.lastCheckMonth) {
            window.gameState.lastCheckMonth = currentDate.month;
            window.checkMonthlyAdOrders();
            
            // 更新无虚假商单月数
            const lastMonthFakeAds = window.gameState.worksList.filter(work => 
                work.isAd && work.adOrder && !work.adOrder.real &&
                work.time >= (window.gameTimer - (30 * VIRTUAL_DAY_MS))
            ).length;
            
            if (lastMonthFakeAds === 0) {
                window.gameState.monthsWithoutFakeAd++;
            } else {
                window.gameState.monthsWithoutFakeAd = 0;
            }
        }
    }, VIRTUAL_DAY_MS); // 每天检查一次
};

// ==================== 举报检查定时器 ====================
window.startExposureCheck = function() {
    if (window.exposureCheckInterval) {
        clearInterval(window.exposureCheckInterval);
    }
    
    // 每天检查一次举报
    window.exposureCheckInterval = setInterval(() => {
        window.checkAdOrderExposure();
    }, VIRTUAL_DAY_MS);
};

// 模块加载时自动初始化
if (typeof window.gameState !== 'undefined') {
    initAdSystem();
}

console.log('商单系统模块（重构版：支持粉丝增长）已加载');

// ==================== 全局函数绑定 ====================
window.generateAdOrder = window.generateAdOrder;
window.showAdOrders = window.showAdOrders;
window.selectAdOrder = window.selectAdOrder;
window.selectMethod = window.selectMethod;
window.publishAd = window.publishAd;
window.acceptBrandDeal = window.acceptBrandDeal;
window.rejectBrandDeal = window.rejectBrandDeal;
window.selectBrandMethod = window.selectBrandMethod;
window.publishBrandAd = window.publishBrandAd;
window.checkHighAdCountPenalty = window.checkHighAdCountPenalty;
window.checkAdAchievements = checkAdAchievements;
window.initAdSystem = initAdSystem;
window.checkMonthlyAdOrders = window.checkMonthlyAdOrders;
window.startFakeAdFanLoss = window.startFakeAdFanLoss;
window.checkAdOrderExposure = window.checkAdOrderExposure;
window.generateNegativeComments = window.generateNegativeComments;
window.generateCommentsWithNegative = window.generateCommentsWithNegative;
window.startMonthlyCheck = window.startMonthlyCheck;
window.startExposureCheck = window.startExposureCheck;
window.resumeFakeAdPenalty = window.resumeFakeAdPenalty;
window.showBottomPopup = showBottomPopup;
