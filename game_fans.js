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

// ==================== 新增：互动数据只涨不减控制变量（仅用于右上角显示） ====================
let currentDayInteractionsMax = 0;  // 当天显示的最大互动值（仅用于右上角）
let currentDayIndex = -1;           // 当前记录的天数索引，用于检测天数变化

// ==================== 新增：23:47快照相关变量 ====================
window.interactionsSnapshot = [];    // 存储每天23:47的快照数据
window.lastSnapshotDay = -1;         // 记录上次快照的日期索引，避免重复保存

// ==================== 新增：获取热度值调整后的今日互动数据（只涨不减版 - 仅用于右上角显示） ====================
function getTodayInteractionsWithHotValue() {
    // ==================== 关键修复：使用虚拟天数计算索引，确保每天使用正确的位置 ====================
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const dayIndex = virtualDays % 60;
    
    // 检测是否为新的一天（索引变化或首次调用）
    if (dayIndex !== currentDayIndex) {
        // 如果之前有记录的天数，保存那天的最终数据到 gameState（关键修复）
        if (currentDayIndex >= 0 && currentDayInteractionsMax > 0) {
            // 保存到 gameState.chartData.interactions，确保历史数据持久化
            if (gameState.chartData && gameState.chartData.interactions) {
                gameState.chartData.interactions[currentDayIndex] = currentDayInteractionsMax;
            }
            
            // 同时保存到 snapshot，用于图表显示
            if (!window.interactionsSnapshot) window.interactionsSnapshot = new Array(60).fill(null);
            window.interactionsSnapshot[currentDayIndex] = currentDayInteractionsMax;
            
            // 保存游戏状态
            saveGame();
            
            console.log(`[粉丝界面] 保存第${currentDayIndex}天数据: ${currentDayInteractionsMax}`);
        }
        
        currentDayIndex = dayIndex;
        currentDayInteractionsMax = 0;  // 新的一天，清零重新开始
        console.log(`[粉丝界面] 新的一天开始，互动数据索引: ${dayIndex}`);
    }
    // =========================================================================================
    
    // 获取基础互动数据（原始存储的今日增量）
    const baseInteractions = gameState.chartData.interactions[dayIndex] || 0;
    
    // 如果没有粉丝，互动为0
    if (!gameState.fans || gameState.fans <= 0) {
        return 0;
    }
    
    // 获取热度值倍数
    const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
        ? window.getHotValueMultiplier() 
        : 1.0;
    
    // 应用热度值倍数（热度值越高，互动数据越高）
    let adjustedInteractions = Math.floor(baseInteractions * hotMultiplier);
    
    // 确保不超过粉丝数本身（关键限制）
    adjustedInteractions = Math.min(adjustedInteractions, gameState.fans);
    
    // ==================== 核心修改：只涨不减逻辑（仅用于右上角显示） ====================
    // 如果新计算的值大于之前显示的最大值，则更新最大值
    if (adjustedInteractions > currentDayInteractionsMax) {
        currentDayInteractionsMax = adjustedInteractions;
        // 同时更新 gameState 中的数据，确保持久化
        if (gameState.chartData && gameState.chartData.interactions) {
            gameState.chartData.interactions[dayIndex] = currentDayInteractionsMax;
        }
    }
    
    // 返回当天显示过的最大值（确保不会减少）
    return currentDayInteractionsMax;
    // ============================================================
}

// ==================== 新增：23:47快照保存函数 ====================
function saveInteractionsSnapshot() {
    const virtualDate = getVirtualDate();
    const currentIdx = Math.floor(getVirtualDaysPassed()) % 60;
    
    // 检查是否是23:47（允许1分钟误差范围，即23:47-23:48）
    if (virtualDate.hours === 23 && virtualDate.minutes >= 47 && virtualDate.minutes <= 48) {
        // 确保今天还没有保存过快照
        if (window.lastSnapshotDay !== currentIdx) {
            // 初始化快照数组（如果未初始化）
            if (!window.interactionsSnapshot || window.interactionsSnapshot.length === 0) {
                window.interactionsSnapshot = new Array(60).fill(null);
            }
            
            // 保存当前互动数据到快照（应用热度值倍数后的值）
            const baseVal = gameState.chartData.interactions[currentIdx] || 0;
            if (baseVal > 0) {
                const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
                    ? window.getHotValueMultiplier() 
                    : 1.0;
                window.interactionsSnapshot[currentIdx] = Math.floor(baseVal * hotMultiplier);
                window.lastSnapshotDay = currentIdx;
                console.log(`[23:47快照] 已保存第${currentIdx}天的互动数据: ${window.interactionsSnapshot[currentIdx]}`);
            }
        }
    }
}

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
        // 计算天数标签
        const dayNumber = currentDay - (59 - i);
        
        // 如果是未来的天数（dayNumber < 0），标签为空，数据设为null
        if (dayNumber < 0) {
            labels.push('');
            displayData.push(null); // 未来天数设为null，不画线
        } else {
            // 将天数转换为月日格式
            labels.push(convertDaysToMD(dayNumber));
            
            // ==================== 修复：根据showZero参数决定是否显示0值 ====================
            const value = data[dataIndex];
            if (showZero) {
                // 显示0值（用于互动图表，确保新游戏也能绘制）
                // 注意：这里不修改原始数据，只是确保0值不被转为null
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
                            // 只显示非空标签
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
        fans: document.getElementById('fansStatValue'),
        interactions: document.getElementById('interactionsStatValue')
    };
    
    if (statElements.fans) statElements.fans.textContent = gameState.fans.toLocaleString();
    
    // 修改：互动统计显示今日增量（应用热度值倍数，只涨不减，且不超过粉丝数）- 仅右上角
    if (statElements.interactions) {
        const todayInteractions = getTodayInteractionsWithHotValue();
        statElements.interactions.textContent = '+' + todayInteractions.toLocaleString();
    }
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
window.saveInteractionsSnapshot = saveInteractionsSnapshot;

// 显示粉丝全屏界面
window.showFansFullscreen = function() {
    // 停止之前的更新
    stopFansRealtimeUpdate();
    
    // ==================== 新增：打开界面时重置天数检测（仅影响右上角） ====================
    // 重新计算当前天数，确保数据同步
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const dayIndex = virtualDays % 60;
    
    // 如果检测到天数的实际变化，保存旧数据
    if (dayIndex !== currentDayIndex && currentDayIndex >= 0) {
        if (currentDayInteractionsMax > 0) {
            gameState.chartData.interactions[currentDayIndex] = currentDayInteractionsMax;
            if (!window.interactionsSnapshot) window.interactionsSnapshot = new Array(60).fill(null);
            window.interactionsSnapshot[currentDayIndex] = currentDayInteractionsMax;
            saveGame();
        }
        currentDayIndex = dayIndex;
        currentDayInteractionsMax = 0;
    }
    
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

// 渲染粉丝界面（增强版 - 添加图表和涨掉粉通知区域）
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
    
    const newFansToday = window.cachedDailyStats.newFans;
    const lostFansToday = window.cachedDailyStats.lostFans;
    
    // 计算热度值调整后的互动数据（关键修改：只涨不减）- 用于右上角显示
    const todayInteractionsAdjusted = getTodayInteractionsWithHotValue();
    
    // ==================== 关键修改：图表使用23:47快照数据（如果存在），否则使用 gameState 数据 ====================
    // 初始化快照数组（如果未初始化）
    if (!window.interactionsSnapshot || window.interactionsSnapshot.length === 0) {
        window.interactionsSnapshot = new Array(60).fill(null);
    }
    
    // 准备图表数据：优先使用23:47快照，如果没有则使用 gameState.chartData.interactions
    const interactionsDataForChart = [];
    for (let i = 0; i < 60; i++) {
        // 优先使用快照数据（23:47记录）
        let baseVal = window.interactionsSnapshot[i];
        
        // 如果没有快照（null），则使用 gameState.chartData.interactions 中的数据
        if (baseVal === null || baseVal === undefined) {
            baseVal = gameState.chartData.interactions[i] || 0;
        }
        
        // 应用热度值倍数
        if (baseVal > 0) {
            const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
                ? window.getHotValueMultiplier() 
                : 1.0;
            let adjustedVal = Math.floor(baseVal * hotMultiplier);
            
            // 限制不超过当天的粉丝数
            const dayFans = gameState.chartData.fans[i] || 1;
            adjustedVal = Math.min(adjustedVal, dayFans);
            
            interactionsDataForChart[i] = adjustedVal;
        } else {
            interactionsDataForChart[i] = 0;
        }
    }
    // ============================================================================================
    
    // 生成HTML内容（增强版：添加图表和涨掉粉通知区域）
    content.innerHTML = `
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
                <div class="stat-value" id="fansNewValue">+${newFansToday.toLocaleString()}</div>
            </div>
        </div>
        
        <!-- 新增：粉丝增长趋势图表区域 -->
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
        
        <!-- 新增：粉丝互动趋势图表区域 -->
        <div class="fans-info-section" style="margin: 10px;">
            <div class="info-title">💬 粉丝互动趋势</div>
            <div class="chart-item" style="margin: 0; padding: 15px;">
                <div class="chart-header" style="margin-bottom: 10px;">
                    <div class="chart-title">互动次数</div>
                    <div class="chart-value" id="interactionsStatValue">+${todayInteractionsAdjusted.toLocaleString()}</div>
                </div>
                <canvas class="chart-canvas" id="interactionsChart" style="height: 200px !important;"></canvas>
            </div>
        </div>
        
        <!-- ✅ 新增：涨掉粉通知区域（长方形框架） -->
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
        
        // ==================== 关键修改：互动图表使用已保存的历史数据 ====================
        // 使用 interactionsDataForChart（优先使用23:47快照或 gameState 数据），确保历史数据不被第二天清零影响
        // showZero=true 确保0值也能绘制（修复新游戏不绘制的问题）
        drawFansChart('interactionsChart', interactionsDataForChart, '#FFD700', '互动次数', true);
        // ================================================================================
        
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
    
    // 直接从gameState读取今日累计数据
    window.cachedDailyStats.newFans = gameState.todayNewFans || 0;
    window.cachedDailyStats.lostFans = gameState.todayLostFans || 0;
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
            
            // ✅ 渲染涨掉粉通知列表
            renderFanChangeNotifications();
            
            // ==================== 新增：23:47快照检查 ====================
            saveInteractionsSnapshot();
            // ============================================================
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
    const newFansToday = window.cachedDailyStats.newFans;
    const lostFansToday = window.cachedDailyStats.lostFans;
    
    const elements = {
        total: document.getElementById('fansTotalValue'),
        newFans: document.getElementById('fansNewValue'),
        lostFans: document.getElementById('fansLostValue')
    };
    
    // 更新总粉丝数（具体数字，带千位分隔符）
    if (elements.total) {
        elements.total.textContent = totalFans.toLocaleString();
        // 移除动画效果
    }
    
    // 更新新增粉丝
    if (elements.newFans) {
        elements.newFans.textContent = `+${newFansToday.toLocaleString()}`;
        // 移除动画效果
    }
    
    // 更新取关数
    if (elements.lostFans) {
        elements.lostFans.textContent = lostFansToday.toLocaleString();
        // 移除动画效果
    }
}

// ✅ 渲染涨掉粉通知列表
function renderFanChangeNotifications() {
    const listContainer = document.getElementById('fanChangeNotificationsList');
    if (!listContainer) return;
    
    // 如果没有通知，显示空状态
    if (!gameState.fanChangeNotifications || gameState.fanChangeNotifications.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">暂无涨掉粉记录</div>';
        return;
    }
    
    // 生成HTML，最多显示10条（从game_core.js的状态中取，已经自动限制）
    const notificationsHtml = gameState.fanChangeNotifications.slice(-10).reverse().map(notification => {
        const isGain = notification.changeType === 'gain';
        const icon = isGain ? '⬆️' : '⬇️';
        const color = isGain ? '#00f2ea' : '#ff0050';
        const sign = isGain ? '+' : '-';
        
        return `
            <div class="notification-item" style="padding: 8px; border-bottom: 1px solid #222; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="color: ${color};">${icon}</span>
                        <span style="color: ${color}; font-weight: bold;">${sign}${notification.fanCount.toLocaleString()}</span>
                        <span style="color: #ccc;">${notification.title}</span>
                    </div>
                    <span style="color: #999; font-size: 10px;">${formatTime(notification.time)}</span>
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
    // ==================== 新增：清理只涨不减控制变量（仅右上角） ====================
    currentDayInteractionsMax = 0;
    currentDayIndex = -1;
    // 注意：不清理 interactionsSnapshot，因为它需要持久化保存23:47的记录
}

// 模块加载时自动清理
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanupFansCache);
}

// 将天数转换为月日格式的函数（从game_features.js移动过来）
function convertDaysToMD(dayNumber) {
    if (dayNumber < 0) return '';
    
    // 每月天数（不考虑闰年，2月固定28天）
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const monthNames = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    
    // 计算年内第几天（对365取模）
    let dayInYear = dayNumber % 365;
    
    // 处理负数情况
    if (dayInYear < 0) {
        dayInYear = (dayInYear + 365) % 365;
    }
    
    // 遍历月份，找到对应的月和日
    let remainingDays = dayInYear;
    for (let i = 0; i < monthDays.length; i++) {
        if (remainingDays < monthDays[i]) {
            // 返回 "月.日" 格式
            return `${monthNames[i]}.${remainingDays + 1}`;
        }
        remainingDays -= monthDays[i];
    }
    
    // 默认为12月31日
    return '12.31';
}

console.log('粉丝全屏界面模块（增强版 - 包含图表和涨掉粉通知）已加载');

// ==================== 全局函数绑定 ====================
window.showFansFullscreen = window.showFansFullscreen;
window.closeFansFullscreen = window.closeFansFullscreen;
window.renderFansPage = renderFansPage;
window.calculateDailyStats = calculateDailyStats;
window.startFansRealtimeUpdate = window.startFansRealtimeUpdate;
window.stopFansRealtimeUpdate = window.stopFansRealtimeUpdate;
window.updateFansPageValues = updateFansPageValues;
window.drawFansChart = drawFansChart;
window.updateFansChartStatsRealtime = updateFansChartStatsRealtime;
window.updateFansChartsRealtime = updateFansChartsRealtime;
window.cleanupFansCache = window.cleanupFansCache;
window.convertDaysToMD = window.convertDaysToMD;
// ✅ 新增：绑定涨掉粉通知渲染函数
window.renderFanChangeNotifications = renderFanChangeNotifications;
// ✅ 新增：绑定热度值互动计算函数（供其他模块可能需要使用）
window.getTodayInteractionsWithHotValue = getTodayInteractionsWithHotValue;
// ✅ 新增：绑定23:47快照函数
window.saveInteractionsSnapshot = saveInteractionsSnapshot;
