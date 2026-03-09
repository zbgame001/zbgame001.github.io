// ==================== 粉丝全屏界面模块 ====================
// 本模块负责粉丝数据分析界面的显示和管理
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS)
// 依赖: game_ui_core.js (updateDisplay)

// 全局变量
window.fansUpdateInterval = null;
window.cachedDailyStats = {
    newFans: 0,
    lostFans: 0,
    date: 0
};

// Chart.js图表系统（从game_features.js移动过来）
// ==================== 修复：添加showZero参数，控制是否显示0值 ====================
function drawFansChart(canvasId, data, color, label, showZero = false) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const currentIndex = virtualDays % 60; // 使用虚拟天数计算索引
    const currentDay = virtualDays;
    
    // 生成正确对齐的标签和数据（从第X-59天到第X天）
    const labels = [];
    const displayData = [];
    
    for (let i = 0; i < 60; i++) {
        // 计算数据索引：从旧到新排列
        const dataIndex = (currentIndex - 59 + i + 60) % 60;
        // 计算天数标签（从虚拟起始日期开始的天数偏移）
        const dayNumber = currentDay - (59 - i);
        
        // 如果是未来的天数（dayNumber < 0），标签为空，数据设为null
        if (dayNumber < 0) {
            labels.push('');
            displayData.push(null); // 未来天数设为null，不画线
        } else {
            // V3关键修改：使用新的函数名convertFansDaysToMD，避免缓存问题
            labels.push(convertFansDaysToMD(dayNumber));
            
            // ==================== 修复：根据showZero参数决定是否显示0值 ====================
            const value = data[dataIndex];
            if (showZero) {
                // 显示0值（用于互动图表，确保新游戏也能绘制）
                displayData.push(typeof value === 'number' ? value : 0);
            } else {
                // 原逻辑：0值设为null（用于粉丝图表，避免画直线）
                displayData.push(value > 0 ? value : null);
            }
            // =============================================================================
        }
    }
    
    // 销毁旧图表
    if (window.fansCharts && window.fansCharts[canvasId]) {
        window.fansCharts[canvasId].destroy();
    }
    
    // 创建新图表（优化性能）
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: displayData,
                borderColor: color,
                // ==================== 修复：使用RGBA格式确保APK兼容 ====================
                backgroundColor: color.startsWith('#') ? 
                    `rgba(${parseInt(color.slice(1,3), 16)}, ${parseInt(color.slice(3,5), 16)}, ${parseInt(color.slice(5,7), 16)}, 0.125)` : 
                    color + '20',
                // =========================================================================
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                // 关键：null值处断开，不画线
                spanGaps: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 0 },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: color,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return label + ': ' + context.parsed.y.toLocaleString();
                        },
                        title: function(context) {
                            const label = context[0].label;
                            if (label) {
                                return `日期: ${label}`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.05)', 
                        borderColor: 'rgba(255, 255, 255, 0.1)' 
                    },
                    ticks: { 
                        color: '#999', 
                        maxTicksLimit: 10,
                        callback: function(value, index) {
                            const label = this.getLabelForValue(value);
                            return label || '';
                        }
                    }
                },
                y: {
                    grid: { 
                        color: 'rgba(255, 255, 255, 0.05)', 
                        borderColor: 'rgba(255, 255, 255, 0.1)' 
                    },
                    ticks: { 
                        color: '#999', 
                        callback: function(value) { 
                            return value.toLocaleString(); 
                        } 
                    }
                }
            },
            interaction: { 
                intersect: false, 
                mode: 'index' 
            }
        }
    });
    
    // 保存图表实例
    if (!window.fansCharts) window.fansCharts = {};
    window.fansCharts[canvasId] = chart;
}

// 新增：实时更新图表右上角的统计数字
function updateFansChartStatsRealtime() {
    const fansChartPage = document.getElementById('fansPage');
    if (!fansChartPage || !fansChartPage.classList.contains('active')) return;
    
    const statElements = {
        fans: document.getElementById('fansStatValue')
    };
    
    if (statElements.fans) statElements.fans.textContent = gameState.fans.toLocaleString();
}

// 修改：实时刷新图表数据
function updateFansChartsRealtime() {
    if (!window.fansCharts) return;
    
    const fansChartPage = document.getElementById('fansPage');
    if (fansChartPage && fansChartPage.classList.contains('active')) {
        Object.keys(window.fansCharts).forEach(key => {
            const chart = window.fansCharts[key];
            if (chart && typeof chart.update === 'function') {
                chart.update('none');
            }
        });
    }
}

// 将Chart.js相关函数绑定到全局
window.drawFansChart = drawFansChart;
window.updateFansChartStatsRealtime = updateFansChartStatsRealtime;
window.updateFansChartsRealtime = updateFansChartsRealtime;

// 显示粉丝全屏界面
window.showFansFullscreen = function() {
    // 停止之前的更新
    stopFansRealtimeUpdate();
    
    // 计算初始统计数据
    calculateDailyStats();
    
    // 显示页面
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    document.getElementById('fansPage').classList.add('active');
    
    // 渲染界面
    renderFansPage();
    
    // 启动实时更新
    startFansRealtimeUpdate();
}

// 关闭粉丝全屏界面
window.closeFansFullscreen = function() {
    stopFansRealtimeUpdate();
    
    document.getElementById('fansPage').classList.remove('active');
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    // 重置导航
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
}

// 渲染粉丝界面（已移除粉丝互动部分）
function renderFansPage() {
    const content = document.getElementById('fansPageContent');
    if (!content) return;
    
    // 获取粉丝数
    const totalFans = gameState.fans || 0;
    
    // 获取今日统计
    const today = getVirtualDaysPassed();
    const todayKey = Math.floor(today);
    
    // 如果缓存不是今天的，重新计算
    if (window.cachedDailyStats.date !== todayKey) {
        calculateDailyStats();
        window.cachedDailyStats.date = todayKey;
    }
    
    // ✅ 关键修复：如果被封号，今日新增显示为0（因为涨粉被拦截了）
    const newFansToday = gameState.isBanned ? 0 : window.cachedDailyStats.newFans;
    const lostFansToday = window.cachedDailyStats.lostFans;
    
    // ✅ 新增：封号状态提示
    const banStatusHtml = gameState.isBanned ? 
        `<div style="background: linear-gradient(135deg, #8B0000 0%, #ff0050 100%); color: #fff; padding: 10px; border-radius: 8px; margin-bottom: 10px; text-align: center; font-size: 12px; font-weight: bold;">
            🚫 账号封禁中，涨粉已暂停，仅记录取关
        </div>` : '';
    
    // 生成HTML内容（已移除粉丝互动图表区域）
    content.innerHTML = `
        ${banStatusHtml}
        
        <div class="fans-stats-container">
            <div class="fans-stat-box top-left">
                <div class="stat-label">总粉丝数</div>
                <div class="stat-value" id="fansTotalValue">${totalFans.toLocaleString()}</div>
            </div>
            
            <div class="fans-stat-box bottom-left">
                <div class="stat-label">今日取关</div>
                <div class="stat-value lost" id="fansLostValue">${lostFansToday.toLocaleString()}</div>
            </div>
            
            <div class="fans-stat-box top-right">
                <div class="stat-label">今日新增</div>
                <div class="stat-value" id="fansNewValue">${gameState.isBanned ? '-' : '+' + newFansToday.toLocaleString()}</div>
            </div>
        </div>
        
        <!-- 粉丝增长趋势图表区域 -->
        <div class="fans-info-section" style="margin: 10px;">
            <div class="info-title">📈 粉丝增长趋势</div>
            <div class="chart-item" style="margin: 0; padding: 15px;">
                <div class="chart-header" style="margin-bottom: 10px;">
                    <div class="chart-title">粉丝数量</div>
                    <div class="chart-value" id="fansStatValue">${gameState.fans.toLocaleString()}</div>
                </div>
                <canvas class="chart-canvas" id="fansChart" style="height: 200px !important;"></canvas>
            </div>
        </div>
        
        <!-- 涨掉粉通知区域（长方形框架） -->
        <div class="fans-info-section" style="margin: 10px;">
            <div class="info-title" style="display: flex; justify-content: space-between; align-items: center;">
                <span>📊 涨掉粉通知</span>
                <span style="font-size: 12px; color: #999;">最近10条</span>
            </div>
            <div id="fanChangeNotificationsList" style="max-height: 300px; overflow-y: auto; background: #111; border-radius: 8px; border: 1px solid #222; padding: 10px;">
                <!-- 通知内容将通过JavaScript动态填充 -->
            </div>
        </div>
    `;
    
    // 绘制图表（延迟100ms确保DOM已渲染）
    setTimeout(() => {
        // 粉丝图表（不显示0值，保持原逻辑）
        drawFansChart('fansChart', gameState.chartData.fans, '#667eea', '粉丝数');
        
        // 渲染涨掉粉通知列表
        renderFanChangeNotifications();
    }, 100);
}

// 计算每日统计数据（基于真实游戏逻辑）
function calculateDailyStats() {
    // 获取当前虚拟天数
    const virtualDays = Math.floor(getVirtualDaysPassed());
    
    // 检查是否需要重置今日数据（新的一天开始）
    if (gameState.todayStatsResetDay !== virtualDays) {
        gameState.todayNewFans = 0;
        gameState.todayLostFans = 0;
        gameState.todayStatsResetDay = virtualDays;
    }
    
    // ✅ 关键修复：如果被封号，今日新增强制为0（因为涨粉被拦截了）
    if (gameState.isBanned) {
        window.cachedDailyStats.newFans = 0;
        window.cachedDailyStats.lostFans = gameState.todayLostFans || 0; // 掉粉仍然可以显示
    } else {
        window.cachedDailyStats.newFans = gameState.todayNewFans || 0;
        window.cachedDailyStats.lostFans = gameState.todayLostFans || 0;
    }
    
    window.cachedDailyStats.date = virtualDays;
}

// 启动粉丝界面实时更新
function startFansRealtimeUpdate() {
    if (window.fansUpdateInterval) {
        clearInterval(window.fansUpdateInterval);
    }
    
    window.fansUpdateInterval = setInterval(() => {
        const fansPage = document.getElementById('fansPage');
        if (fansPage && fansPage.classList.contains('active')) {
            // 更新统计数据（每天只重新计算一次基础值）
            calculateDailyStats();
            updateFansPageValues();
            
            // 更新图表
            updateFansChartStatsRealtime();
            updateFansChartsRealtime();
            
            // 渲染涨掉粉通知列表
            renderFanChangeNotifications();
        }
    }, 1000);
}

// 停止粉丝界面实时更新
function stopFansRealtimeUpdate() {
    if (window.fansUpdateInterval) {
        clearInterval(window.fansUpdateInterval);
        window.fansUpdateInterval = null;
    }
}

// 更新粉丝界面数值（移除动画效果）
function updateFansPageValues() {
    const totalFans = gameState.fans || 0;
    
    // ✅ 关键修复：如果被封号，今日新增显示为0
    const newFansToday = gameState.isBanned ? 0 : window.cachedDailyStats.newFans;
    const lostFansToday = window.cachedDailyStats.lostFans;
    
    const elements = {
        total: document.getElementById('fansTotalValue'),
        newFans: document.getElementById('fansNewValue'),
        lostFans: document.getElementById('fansLostValue')
    };
    
    // 更新总粉丝数（具体数字，带千位分隔符）
    if (elements.total) {
        elements.total.textContent = totalFans.toLocaleString();
    }
    
    // 更新新增粉丝
    if (elements.newFans) {
        // ✅ 封号期间显示 "-" 而不是 "+0"
        elements.newFans.textContent = gameState.isBanned ? '-' : `+${newFansToday.toLocaleString()}`;
        // 封号期间改变颜色为灰色
        elements.newFans.style.color = gameState.isBanned ? '#666' : '#00f2ea';
    }
    
    // 更新取关数
    if (elements.lostFans) {
        elements.lostFans.textContent = lostFansToday.toLocaleString();
    }
}

// 渲染涨掉粉通知列表
function renderFanChangeNotifications() {
    const listContainer = document.getElementById('fanChangeNotificationsList');
    if (!listContainer) return;
    
    // 如果没有通知，显示空状态
    if (!gameState.fanChangeNotifications || gameState.fanChangeNotifications.length === 0) {
        // ✅ 新增：封号期间显示特殊提示
        if (gameState.isBanned) {
            listContainer.innerHTML = '<div style="text-align: center; color: #ff0050; padding: 20px;">🚫 账号封禁中，涨粉通知已暂停</div>';
        } else {
            listContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">暂无涨掉粉记录</div>';
        }
        return;
    }
    
    // ✅ 新增：如果被封号，显示封禁提示
    if (gameState.isBanned) {
        listContainer.innerHTML = '<div style="text-align: center; color: #ff0050; padding: 20px; border-bottom: 1px solid #333; margin-bottom: 10px;">🚫 账号封禁中，仅显示取关记录</div>';
    }
    
    // 生成HTML，最多显示10条（从game_core.js的状态中取，已经自动限制）
    // ✅ 过滤：封号期间只显示取关记录
    let notifications = gameState.fanChangeNotifications.slice(-10).reverse();
    if (gameState.isBanned) {
        notifications = notifications.filter(n => n.changeType === 'loss');
    }
    
    if (notifications.length === 0) {
        listContainer.innerHTML += '<div style="text-align: center; color: #666; padding: 20px;">暂无取关记录</div>';
        return;
    }
    
    const notificationsHtml = notifications.map(notification => {
        const isGain = notification.changeType === 'gain';
        const icon = isGain ? '⬆️' : '⬇️';
        const color = isGain ? '#00f2ea' : '#ff0050';
        const sign = isGain ? '+' : '-';
        
        // ✅ 移除了时间显示
        return `
            <div class="notification-item" style="padding: 8px; border-bottom: 1px solid #222; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="color: ${color};">${icon}</span>
                        <span style="color: ${color}; font-weight: bold;">${sign}${notification.fanCount.toLocaleString()}</span>
                        <span style="color: #ccc;">${notification.title}</span>
                    </div>
                </div>
                <div style="color: #999; margin-top: 3px; padding-left: 20px;">${notification.content}</div>
            </div>
        `;
    }).join('');
    
    listContainer.innerHTML = notificationsHtml;
    
    // 滚动到顶部
    listContainer.scrollTop = 0;
}

// 清理缓存（防止内存泄漏）
function cleanupFansCache() {
    window.cachedDailyStats = {
        newFans: 0,
        lostFans: 0,
        date: 0
    };
}

// 模块加载时自动清理
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanupFansCache);
}

// ==================== V3关键修改：全新函数convertFansDaysToMD ====================
// 将天数转换为月日格式的函数（基于虚拟起始日期，不再固定从1.1开始）
// 使用全新函数名避免任何可能的缓存冲突
function convertFansDaysToMD(dayNumber) {
    if (dayNumber < 0) return '';
    
    // 获取虚拟起始日期（如果不存在则使用默认值兼容旧存档）
    const startDate = gameState.virtualStartDate || { year: 2025, month: 1, day: 1 };
    
    // 从虚拟起始日期开始计算
    let currentYear = startDate.year;
    let currentMonth = startDate.month;
    let currentDay = startDate.day + dayNumber; // 加上经过的天数
    
    // 处理日期进位（考虑闰年和不同月份天数）
    while (true) {
        const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
        const daysInCurrentMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][currentMonth - 1];
        
        if (currentDay > daysInCurrentMonth) {
            currentDay -= daysInCurrentMonth;
            currentMonth++;
            if (currentMonth > 12) {
                currentMonth = 1;
                currentYear++;
            }
        } else {
            break;
        }
    }
    
    return `${currentMonth}.${currentDay}`;
}

console.log('粉丝全屏界面模块V3（图表跟随虚拟时间，函数名convertFansDaysToMD）已加载');

// ==================== 全局函数绑定 ====================
window.showFansFullscreen = window.showFansFullscreen;
window.closeFansFullscreen = window.closeFansFullscreen;
window.renderFansPage = renderFansPage;
window.calculateDailyStats = calculateDailyStats;
window.startFansRealtimeUpdate = window.startFansRealtimeUpdate;
window.stopFansRealtimeUpdate = window.stopFansRealtimeUpdate;
window.updateFansPageValues = window.updateFansPageValues;
window.drawFansChart = drawFansChart;
window.updateFansChartStatsRealtime = updateFansChartStatsRealtime;
window.updateFansChartsRealtime = updateFansChartsRealtime;
window.cleanupFansCache = window.cleanupFansCache;
window.convertFansDaysToMD = convertFansDaysToMD;
window.renderFanChangeNotifications = renderFanChangeNotifications;