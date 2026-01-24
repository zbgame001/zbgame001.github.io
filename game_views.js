// ==================== 播放量全屏界面模块 ====================
// 本模块负责播放量数据分析界面的显示和管理
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS)
// 依赖: game_ui_core.js (updateDisplay)

// 全局变量
window.viewsUpdateInterval = null;
window.cachedViewsStats = {
    dailyViews: 0,
    date: 0
};

// 有状态作品分页相关全局变量
window.viewsActiveWorksPage = 1;
window.viewsActiveWorksPerPage = 5;

// 显示播放量全屏界面
window.showViewsFullscreen = function() {
    // 停止之前的更新
    stopViewsRealtimeUpdate();
    
    // 重置分页到第一页
    window.viewsActiveWorksPage = 1;
    
    // 计算初始统计数据
    calculateViewsStats();
    
    // 显示页面
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    document.getElementById('viewsPage').classList.add('active');
    
    // 渲染界面
    renderViewsPage();
    
    // 启动实时更新
    startViewsRealtimeUpdate();
}

// 关闭播放量全屏界面
window.closeViewsFullscreen = function() {
    stopViewsRealtimeUpdate();
    
    document.getElementById('viewsPage').classList.remove('active');
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    // 重置导航
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
}

// 渲染播放量界面
function renderViewsPage() {
    const content = document.getElementById('viewsPageContent');
    if (!content) return;
    
    // 获取播放量数据
    const totalViews = gameState.views || 0;
    const virtualDays = Math.floor(getVirtualDaysPassed());
    
    // 如果缓存不是今天的，重新计算
    if (window.cachedViewsStats.date !== virtualDays) {
        calculateViewsStats();
        window.cachedViewsStats.date = virtualDays;
    }
    
    const dailyViews = window.cachedViewsStats.dailyViews;
    
    // 获取有状态的作品
    const allActiveWorks = getActiveStatusWorks();
    const totalWorks = allActiveWorks.length;
    const totalPages = Math.max(1, Math.ceil(totalWorks / window.viewsActiveWorksPerPage));
    
    // 确保当前页码有效
    if (window.viewsActiveWorksPage > totalPages) {
        window.viewsActiveWorksPage = totalPages;
    }
    if (window.viewsActiveWorksPage < 1) {
        window.viewsActiveWorksPage = 1;
    }
    
    // 计算当前页的作品
    const startIndex = (window.viewsActiveWorksPage - 1) * window.viewsActiveWorksPerPage;
    const endIndex = startIndex + window.viewsActiveWorksPerPage;
    const pageWorks = allActiveWorks.slice(startIndex, endIndex);
    
    // 生成HTML内容（移除今日新增部分）
    let html = `
        <div class="views-stats-container" style="margin: 10px; background: #161823; border-radius: 15px; border: 1px solid #333; padding: 20px;">
            <div class="views-stat-main" style="text-align: center; margin-bottom: 30px;">
                <div class="stat-label" style="font-size: 14px; color: #999; margin-bottom: 10px;">总播放量</div>
                <div class="stat-value" id="viewsTotalValue" style="font-size: 48px; font-weight: bold; color: #00f2ea; transition: all 0.3s ease;">
                    ${totalViews.toLocaleString()}
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 10px;">实时数据</div>
            </div>
        </div>
        
        <!-- 播放增长趋势图表 -->
        <div class="views-info-section" style="margin: 10px;">
            <div class="info-title" style="font-size: 14px; font-weight: bold; color: #667aea; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                📈 播放增长趋势
            </div>
            <div style="background: #161823; border-radius: 10px; border: 1px solid #333; padding: 15px;">
                <div class="chart-header" style="margin-bottom: 10px;">
                    <div class="chart-title">播放量</div>
                    <div class="chart-value" id="viewsStatValue">${gameState.views.toLocaleString()}</div>
                </div>
                <canvas class="chart-canvas" id="viewsChart" style="height: 200px !important; background: #222; border-radius: 8px;"></canvas>
            </div>
        </div>
    `;
    
    // 添加有状态的作品列表（包含推广、抽奖、热搜话题）
    html += `
        <div class="views-info-section" style="margin: 10px;">
            <div class="info-title" style="font-size: 14px; font-weight: bold; color: #667aea; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
                ⚡ 有状态的作品 <span style="font-size: 12px; color: #999; font-weight: normal;">(${totalWorks}个)</span>
            </div>
            <div id="activeStatusWorks" style="background: #161823; border-radius: 10px; border: 1px solid #333; padding: 10px;">
                ${renderActiveStatusWorks(pageWorks)}
            </div>
            ${totalPages > 1 ? renderViewsActiveWorksPagination(totalPages, totalWorks) : ''}
        </div>
    `;
    
    content.innerHTML = html;
    
    // 绘制图表
    setTimeout(() => {
        drawViewsChart();
    }, 100);
}

// 获取有状态的作品（包含推广、抽奖、热搜话题，排除已结束的抽奖，不分页）
function getActiveStatusWorks() {
    return gameState.worksList.filter(work => {
        // 私密作品不显示
        if (work.isPrivate) return false;
        
        // 检查推广状态
        const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
        
        // 检查抽奖状态（已结束的抽奖不显示）
        const isRaffleActive = work.isRaffle && work.raffleStatus !== 'ended' && work.raffleStatus !== 'completed';
        
        // 检查热搜话题状态
        const isHotSearchActive = work.isHotSearchWork;
        
        // 原有推荐、争议、热搜状态
        const hasOtherStatus = work.isRecommended || work.isControversial || work.isHot;
        
        // 只要有一种状态就显示
        return isTrafficActive || isRaffleActive || isHotSearchActive || hasOtherStatus;
    });
}

// 渲染有状态的作品（接收当前页的作品数组）
function renderActiveStatusWorks(works) {
    if (works.length === 0) {
        return '<div style="text-align:center;color:#999;padding:20px;font-size:12px;">暂无特殊状态作品</div>';
    }
    
    return works.map(work => {
        const statusTags = [];
        
        // 推广状态
        const isTrafficActive = gameState.trafficWorks[work.id] && gameState.trafficWorks[work.id].isActive;
        if (isTrafficActive) {
            const trafficData = gameState.trafficWorks[work.id];
            const timePassed = gameTimer - trafficData.startTime;
            const daysPassed = timePassed / VIRTUAL_DAY_MS;
            const timeLeft = Math.max(0, trafficData.days - daysPassed);
            statusTags.push({
                text: `📈 推广中(${timeLeft.toFixed(1)}天)`,
                style: 'background:linear-gradient(135deg, #ff6b00 0%, #ff0050 100%);color:#fff;'
            });
        }
        
        // 抽奖状态（仅进行中）
        if (work.isRaffle && work.raffleStatus === 'active') {
            const timeLeft = Math.max(0, (work.activityEndTime - gameTimer) / VIRTUAL_DAY_MS);
            statusTags.push({
                text: `🎁 抽奖中(${timeLeft.toFixed(1)}天)`,
                style: 'background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;'
            });
        }
        
        // 热搜话题状态
        if (work.isHotSearchWork) {
            const timeLeft = Math.max(0, work.hotSearchData.endTime - gameTimer) / VIRTUAL_DAY_MS;
            statusTags.push({
                text: `🔥 热搜(${timeLeft.toFixed(1)}天)`,
                style: 'background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;'
            });
        }
        
        // 推荐标识
        if (work.isRecommended) {
            const timeLeft = Math.max(0, work.recommendEndTime - gameTimer) / VIRTUAL_DAY_MS;
            statusTags.push({
                text: `🔥推荐(${timeLeft.toFixed(1)}天)`,
                style: 'background:linear-gradient(135deg, #00f2ea 0%, #667eea 100%);color:#000;'
            });
        }
        
        // 争议标识
        if (work.isControversial) {
            const timeLeft = Math.max(0, work.controversyEndTime - gameTimer) / VIRTUAL_DAY_MS;
            statusTags.push({
                text: `⚠️争议(${timeLeft.toFixed(1)}天)`,
                style: 'background:linear-gradient(135deg, #ff6b00 0%, #ff0050 100%);color:#fff;'
            });
        }
        
        // 热搜标识
        if (work.isHot) {
            const timeLeft = Math.max(0, work.hotEndTime - gameTimer) / VIRTUAL_DAY_MS;
            statusTags.push({
                text: `🔥热搜(${timeLeft.toFixed(1)}天)`,
                style: 'background:linear-gradient(135deg, #FFD700 0%, #ff6b00 100%);color:#000;'
            });
        }
        
        const workType = work.type === 'video' ? '🎬' : work.type === 'live' ? '📱' : '📝';
        
        return `
            <div class="work-item" style="margin-bottom: 8px; cursor: pointer; padding: 12px;" onclick="showWorkDetail(gameState.worksList.find(w => w.id === ${work.id}))">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                    <div style="font-size: 12px; font-weight: bold; color: #667aea;">${workType} ${work.type === 'video' ? '视频' : work.type === 'live' ? '直播' : '动态'}</div>
                    <div style="font-size: 11px; color: #999;">${formatTime(work.time)}</div>
                </div>
                <div style="font-size: 13px; margin-bottom: 8px; line-height: 1.4;">${work.content.substring(0, 60)}${work.content.length > 60 ? '...' : ''}</div>
                <div style="margin-bottom: 8px;">${statusTags.map(tag => `
                    <span style="${tag.style}padding:2px 6px;border-radius:3px;font-size:10px;margin-right:5px;display:inline-block;">
                        ${tag.text}
                    </span>
                `).join('')}</div>
                <div style="display: flex; gap: 15px; font-size: 11px; color: #999;">
                    <span>▶️ ${work.views.toLocaleString()}</span>
                    <span>❤️ ${work.likes.toLocaleString()}</span>
                    <span>💬 ${work.comments.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');
}

// 渲染有状态作品分页控件
function renderViewsActiveWorksPagination(totalPages, totalWorks) {
    const currentPage = window.viewsActiveWorksPage;
    
    let html = '<div style="display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #333; flex-wrap: wrap;">';
    
    // 上一页按钮
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="changeViewsActiveWorksPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} style="background: #222; border: 1px solid #333; color: #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; min-width: 32px;">‹</button>`;
    
    // 页码按钮（最多显示5个）
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // 第一页和省略号
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="changeViewsActiveWorksPage(1)" style="background: #222; border: 1px solid #333; color: #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; min-width: 32px;">1</button>`;
        if (startPage > 2) {
            html += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
    }
    
    // 中间页码
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        html += `<button class="page-btn ${isActive ? 'active' : ''}" onclick="changeViewsActiveWorksPage(${i})" style="background: ${isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#222'}; border: 1px solid ${isActive ? '#667eea' : '#333'}; color: ${isActive ? '#fff' : '#ccc'}; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; min-width: 32px; font-weight: ${isActive ? 'bold' : 'normal'};">${i}</button>`;
    }
    
    // 最后一页和省略号
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
        html += `<button class="page-btn" onclick="changeViewsActiveWorksPage(${totalPages})" style="background: #222; border: 1px solid #333; color: #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; min-width: 32px;">${totalPages}</button>`;
    }
    
    // 下一页按钮
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="changeViewsActiveWorksPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} style="background: #222; border: 1px solid #333; color: #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; min-width: 32px;">›</button>`;
    
    // 统计信息
    const startItem = totalWorks > 0 ? (currentPage - 1) * window.viewsActiveWorksPerPage + 1 : 0;
    const endItem = Math.min(currentPage * window.viewsActiveWorksPerPage, totalWorks);
    html += `<span style="margin-left: 10px; font-size: 12px; color: #999; white-space: nowrap;">${startItem}-${endItem} / ${totalWorks}</span>`;
    
    html += '</div>';
    
    return html;
}

// 切换有状态作品页面
window.changeViewsActiveWorksPage = function(page) {
    const allActiveWorks = getActiveStatusWorks();
    const totalPages = Math.max(1, Math.ceil(allActiveWorks.length / window.viewsActiveWorksPerPage));
    
    if (page < 1 || page > totalPages) return;
    
    window.viewsActiveWorksPage = page;
    
    // 重新渲染作品列表和分页控件
    const container = document.getElementById('activeStatusWorks');
    if (container) {
        const startIndex = (page - 1) * window.viewsActiveWorksPerPage;
        const endIndex = startIndex + window.viewsActiveWorksPerPage;
        const pageWorks = allActiveWorks.slice(startIndex, endIndex);
        
        container.innerHTML = renderActiveStatusWorks(pageWorks);
        
        // 更新分页控件
        const paginationContainer = container.parentElement.querySelector('div[style*="justify-content: center"]');
        if (paginationContainer) {
            paginationContainer.outerHTML = renderViewsActiveWorksPagination(totalPages, allActiveWorks.length);
        }
    }
}

// 计算播放量统计数据
function calculateViewsStats() {
    // 获取当前虚拟天数
    const virtualDays = Math.floor(getVirtualDaysPassed());
    
    // 检查是否需要重置今日数据（新的一天开始）
    if (gameState.todayStatsResetDay !== virtualDays) {
        // 重置今日播放量统计
        if (!gameState.todayViews) {
            gameState.todayViews = 0;
        }
        gameState.todayStatsResetDay = virtualDays;
    }
    
    // 计算今日新增播放量（基于最后更新时间）
    const todayViews = gameState.todayViews || 0;
    window.cachedViewsStats.dailyViews = todayViews;
    window.cachedViewsStats.date = virtualDays;
}

// 启动播放量界面实时更新
function startViewsRealtimeUpdate() {
    if (window.viewsUpdateInterval) {
        clearInterval(window.viewsUpdateInterval);
    }
    
    window.viewsUpdateInterval = setInterval(() => {
        const viewsPage = document.getElementById('viewsPage');
        if (viewsPage && viewsPage.classList.contains('active')) {
            // 更新统计数据
            calculateViewsStats();
            updateViewsPageValues();
            
            // 更新图表
            updateViewsChartRealtime();
            
            // 更新有状态作品列表（保持当前页码）
            const allActiveWorks = getActiveStatusWorks();
            const totalWorks = allActiveWorks.length;
            const totalPages = Math.max(1, Math.ceil(totalWorks / window.viewsActiveWorksPerPage));
            
            // 确保当前页码有效
            if (window.viewsActiveWorksPage > totalPages) {
                window.viewsActiveWorksPage = totalPages;
            }
            if (window.viewsActiveWorksPage < 1) {
                window.viewsActiveWorksPage = 1;
            }
            
            const startIndex = (window.viewsActiveWorksPage - 1) * window.viewsActiveWorksPerPage;
            const endIndex = startIndex + window.viewsActiveWorksPerPage;
            const pageWorks = allActiveWorks.slice(startIndex, endIndex);
            
            const container = document.getElementById('activeStatusWorks');
            if (container) {
                container.innerHTML = renderActiveStatusWorks(pageWorks);
                
                // 更新分页控件（如果存在）
                const paginationContainer = container.parentElement.querySelector('div[style*="justify-content: center"]');
                if (paginationContainer && totalPages > 1) {
                    paginationContainer.outerHTML = renderViewsActiveWorksPagination(totalPages, totalWorks);
                } else if (paginationContainer && totalPages <= 1) {
                    paginationContainer.remove();
                }
            }
        }
    }, 1000);
}

// 停止播放量界面实时更新
function stopViewsRealtimeUpdate() {
    if (window.viewsUpdateInterval) {
        clearInterval(window.viewsUpdateInterval);
        window.viewsUpdateInterval = null;
    }
}

// 更新播放量界面数值
function updateViewsPageValues() {
    const totalViews = gameState.views || 0;
    
    const totalEl = document.getElementById('viewsTotalValue');
    const statEl = document.getElementById('viewsStatValue');
    
    if (totalEl) {
        totalEl.textContent = totalViews.toLocaleString();
    }
    
    if (statEl) {
        statEl.textContent = totalViews.toLocaleString();
    }
}

// 绘制播放量图表
function drawViewsChart() {
    const canvas = document.getElementById('viewsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const currentIndex = gameState.chartData.currentIndex || 0;
    const currentDay = gameState.chartData.currentDay || 0;
    
    // 生成标签和数据
    const labels = [];
    const displayData = [];
    
    for (let i = 0; i < 60; i++) {
        const dataIndex = (currentIndex - 59 + i + 60) % 60;
        const dayNumber = currentDay - (59 - i);
        
        if (dayNumber < 0) {
            labels.push('');
            displayData.push(null);
        } else {
            labels.push(convertDaysToMD(dayNumber));
            const value = gameState.chartData.views[dataIndex] || 0;
            displayData.push(value > 0 ? value : null);
        }
    }
    
    // 销毁旧图表
    if (window.viewsCharts && window.viewsCharts.viewsChart) {
        window.viewsCharts.viewsChart.destroy();
    }
    
    // 创建新图表
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '播放量',
                data: displayData,
                borderColor: '#00f2ea',
                // ==================== 修复：使用RGBA格式确保APK兼容 ====================
                backgroundColor: 'rgba(0, 242, 234, 0.125)',
                // =========================================================================
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: '#00f2ea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
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
                    borderColor: '#00f2ea',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return '播放量: ' + context.parsed.y.toLocaleString();
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
    if (!window.viewsCharts) window.viewsCharts = {};
    window.viewsCharts.viewsChart = chart;
}

// 实时更新播放量图表
function updateViewsChartRealtime() {
    if (!window.viewsCharts) return;
    
    const viewsPage = document.getElementById('viewsPage');
    if (viewsPage && viewsPage.classList.contains('active')) {
        const chart = window.viewsCharts.viewsChart;
        if (chart && typeof chart.update === 'function') {
            chart.update('none');
        }
    }
}

// 清理缓存
function cleanupViewsCache() {
    window.cachedViewsStats = {
        dailyViews: 0,
        date: 0
    };
}

// 模块加载时自动清理
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanupViewsCache);
}

console.log('播放量全屏界面模块已加载');

// ==================== 全局函数绑定 ====================
window.showViewsFullscreen = window.showViewsFullscreen;
window.closeViewsFullscreen = window.closeViewsFullscreen;
window.renderViewsPage = renderViewsPage;
window.calculateViewsStats = calculateViewsStats;
window.startViewsRealtimeUpdate = window.startViewsRealtimeUpdate;
window.stopViewsRealtimeUpdate = window.stopViewsRealtimeUpdate;
window.updateViewsPageValues = window.updateViewsPageValues;
window.drawViewsChart = window.drawViewsChart;
window.updateViewsChartRealtime = window.updateViewsChartRealtime;
window.cleanupViewsCache = window.cleanupViewsCache;
window.getActiveStatusWorks = window.getActiveStatusWorks;
window.renderActiveStatusWorks = window.renderActiveStatusWorks;
window.changeViewsActiveWorksPage = window.changeViewsActiveWorksPage;
window.renderViewsActiveWorksPagination = window.renderViewsActiveWorksPagination;
