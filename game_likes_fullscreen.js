// ==================== 点赞全屏界面模块 ====================
// 本模块处理点赞数据的独立全屏显示

// ==================== 显示点赞全屏界面 ====================
function showLikesFullscreen() {
    // 关闭所有全屏页面
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    // 隐藏主内容和底部导航
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    // 显示点赞全屏页面
    document.getElementById('likesPage').classList.add('active');
    
    // 渲染页面内容
    renderLikesPage();
}

// ==================== 关闭点赞全屏界面 ====================
function closeLikesFullscreen() {
    // 关闭点赞页面
    document.getElementById('likesPage').classList.remove('active');
    
    // 恢复主内容和底部导航
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    // 重置到首页标签
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    // 隐藏所有标签页内容
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    // 显示首页主内容区块
    document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
}

// ==================== 渲染点赞页面内容 ====================
function renderLikesPage() {
    const content = document.getElementById('likesPageContent');
    if (!content) return;
    
    // 页面结构：顶部统计数字 + 图表（移除底部介绍）
    content.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 10px; padding: 25px; border-radius: 15px; text-align: center; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);">
            <div style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin-bottom: 10px;">总点赞数</div>
            <div id="likesTotalCount" style="font-size: 42px; font-weight: bold; color: #fff; margin-bottom: 5px; letter-spacing: 1px;">
                ${gameState.likes.toLocaleString()}
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8);">
                更新时间：${formatVirtualDate(true)}
            </div>
        </div>
        
        <div style="padding: 20px;">
            <div class="chart-item">
                <div class="chart-header">
                    <div class="chart-title">点赞增长趋势</div>
                    <div class="chart-value" id="likesDetailStatValue">${gameState.likes.toLocaleString()}</div>
                </div>
                <canvas class="chart-canvas" id="likesDetailChart"></canvas>
            </div>
        </div>
    `;
    
    // 延迟绘制图表，确保DOM已准备好
    setTimeout(() => {
        drawLikesDetailChart();
        startLikesDetailChartRealtimeUpdate();
    }, 100);
}

// ==================== 绘制点赞详细图表 ====================
function drawLikesDetailChart() {
    const canvas = document.getElementById('likesDetailChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 销毁旧图表
    if (window.charts && window.charts.likesDetail) {
        window.charts.likesDetail.destroy();
    }
    
    // 准备数据
    const virtualDays = Math.floor(getVirtualDaysPassed());
    const currentIndex = gameState.chartData.currentIndex || 0;
    
    // 生成正确对齐的标签和数据
    const labels = [];
    const displayData = [];
    
    for (let i = 0; i < 60; i++) {
        // 计算数据索引：从旧到新排列
        const dataIndex = (currentIndex - 59 + i + 60) % 60;
        // 计算天数标签
        const dayNumber = virtualDays - (59 - i);
        
        // 如果是未来的天数（dayNumber < 0），标签为空，数据设为null
        if (dayNumber < 0) {
            labels.push('');
            displayData.push(null); // 未来天数设为null，不画线
        } else {
            // 将天数转换为月日格式
            labels.push(convertDaysToMD(dayNumber));
            
            // 如果数据为0，也设为null，避免画直线
            const value = gameState.chartData.likes[dataIndex] || 0;
            displayData.push(value > 0 ? value : null);
        }
    }
    
    // 创建新图表
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '点赞数',
                data: displayData,
                borderColor: '#ff0050',
                // ==================== 修复：使用RGBA格式确保APK兼容 ====================
                backgroundColor: 'rgba(255, 0, 80, 0.125)',
                // =========================================================================
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: '#ff0050',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                // 断开null值，不连接
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
                    borderColor: '#ff0050',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return '点赞: ' + context.parsed.y.toLocaleString();
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
    if (!window.charts) window.charts = {};
    window.charts.likesDetail = chart;
}

// ==================== 实时更新点赞图表（包含顶部总数字） ====================
function startLikesDetailChartRealtimeUpdate() {
    // 停止之前的更新定时器
    if (window.likesDetailChartInterval) {
        clearInterval(window.likesDetailChartInterval);
    }
    
    // 每秒更新一次（与主界面同步）
    window.likesDetailChartInterval = setInterval(() => {
        const likesPage = document.getElementById('likesPage');
        if (likesPage && likesPage.classList.contains('active')) {
            // ✅ 新增：更新顶部总点赞数大数字
            const totalCount = document.getElementById('likesTotalCount');
            if (totalCount) {
                totalCount.textContent = gameState.likes.toLocaleString();
            }
            
            // 更新图表右上角的统计数字
            const statValue = document.getElementById('likesDetailStatValue');
            if (statValue) {
                statValue.textContent = gameState.likes.toLocaleString();
            }
            
            // 更新图表
            if (window.charts && window.charts.likesDetail) {
                window.charts.likesDetail.update('none');
            }
        }
    }, 1000); // 改为1000ms，与主界面更新频率一致
}

// ==================== 停止实时更新 ====================
function stopLikesDetailChartRealtimeUpdate() {
    if (window.likesDetailChartInterval) {
        clearInterval(window.likesDetailChartInterval);
        window.likesDetailChartInterval = null;
    }
}

// ==================== 模块初始化 ====================
console.log('点赞全屏界面模块已加载');

// ==================== 全局函数绑定 ====================
window.showLikesFullscreen = showLikesFullscreen;
window.closeLikesFullscreen = closeLikesFullscreen;
window.renderLikesPage = renderLikesPage;
window.drawLikesDetailChart = drawLikesDetailChart;
window.startLikesDetailChartRealtimeUpdate = startLikesDetailChartRealtimeUpdate;
window.stopLikesDetailChartRealtimeUpdate = stopLikesDetailChartRealtimeUpdate;
