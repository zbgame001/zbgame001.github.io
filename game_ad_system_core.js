// ==================== 商单系统核心模块 =======================
// 本模块包含商单数据库、生成、展示和选择功能
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS)
// 依赖: game_ui.js (showWarning, showAlert, closeFullscreenPage, updateDisplay)

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

// ==================== 选择发布方式（通用）===================
window.selectMethod = function(m) { 
    window.selectedMethod = m; 
    const form = document.getElementById('publishForm');
    if (form) form.style.display = 'block'; 
};

// ==================== 接受品牌合作 ====================
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

// ==================== 拒绝品牌合作 ====================
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

// ==================== 选择品牌合作发布方式 ====================
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

// ==================== 全局函数绑定 ====================
window.showBottomPopup = showBottomPopup;
window.adOrdersDB = window.adOrdersDB;
window.generateAdOrder = window.generateAdOrder;
window.showAdOrders = window.showAdOrders;
window.selectAdOrder = window.selectAdOrder;
window.selectMethod = window.selectMethod;
window.acceptBrandDeal = window.acceptBrandDeal;
window.rejectBrandDeal = window.rejectBrandDeal;
window.selectBrandMethod = window.selectBrandMethod;
