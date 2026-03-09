// ==================== 热度值全屏界面 ====================

window.HotValueFullscreen = {
    // 更新定时器
    updateInterval: null,
    
    // 显示全屏页面
    show: function() {
        const page = document.getElementById('hotValuePage');
        if (!page) return;
        
        page.classList.add('active');
        document.getElementById('mainContent').style.display = 'none';
        document.querySelector('.bottom-nav').style.display = 'none';
        
        // 立即渲染
        this.render();
        
        // 启动实时更新（仅用于刷新界面）
        this.startRealtimeUpdate();
        
        console.log('[热度值全屏] 已打开');
    },
    
    // 关闭全屏页面
    close: function() {
        const page = document.getElementById('hotValuePage');
        if (page) {
            page.classList.remove('active');
        }
        
        document.getElementById('mainContent').style.display = 'block';
        document.querySelector('.bottom-nav').style.display = 'flex';
        
        // 停止实时更新
        this.stopRealtimeUpdate();
        
        console.log('[热度值全屏] 已关闭');
    },
    
    // 启动实时更新
    startRealtimeUpdate: function() {
        this.stopRealtimeUpdate();
        
        // 每秒更新一次显示（仅刷新UI）
        this.updateInterval = setInterval(() => {
            this.render();
        }, 1000);
    },
    
    // 停止实时更新
    stopRealtimeUpdate: function() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    },
    
    // 渲染整个页面
    render: function() {
        this.renderHotValueBox();
        this.renderHistoryList();
        this.renderStatsInfo();
    },
    
    // 渲染大长方形热度值数据
    renderHotValueBox: function() {
        const box = document.getElementById('hotValueBigBox');
        if (!box) return;
        
        let currentValue = 0;
        let multiplier = 1.0;
        
        if (window.HotValueSystem) {
            currentValue = window.HotValueSystem.getCurrentHotValue();
            multiplier = window.HotValueSystem.getHotValueMultiplier();
        }
        
        // 根据热度值设置颜色
        let glowColor = '#999';
        if (currentValue >= 5000) {
            glowColor = '#ff0050';
        } else if (currentValue >= 2000) {
            glowColor = '#ff6b00';
        } else if (currentValue >= 1000) {
            glowColor = '#00f2ea';
        }
        
        // 计算变化趋势（从历史记录获取）
        let trendHtml = '';
        if (gameState.hotValueHistory && gameState.hotValueHistory.length > 0) {
            const latest = gameState.hotValueHistory[0];
            if (latest.change > 0) {
                trendHtml = `<div style="color: #00f2ea; font-size: 14px; margin-top: 10px;">▲ 较上次 +${latest.change}</div>`;
            } else if (latest.change < 0) {
                trendHtml = `<div style="color: #ff0050; font-size: 14px; margin-top: 10px;">▼ 较上次 ${latest.change}</div>`;
            }
        }
        
        box.innerHTML = `
            <div style="text-align: center; animation: pulse 2s infinite;">
                <div style="font-size: 72px; font-weight: bold; color: ${glowColor}; text-shadow: 0 0 20px ${glowColor}40; line-height: 1.2;">
                    ${this.formatHotValueBig(currentValue)}
                </div>
                <div style="font-size: 16px; color: #999; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">
                    当前热度值
                </div>
                ${trendHtml}
                <div style="font-size: 12px; color: #667eea; margin-top: 15px; padding: 5px 15px; background: rgba(102, 126, 234, 0.1); border-radius: 15px; display: inline-block;">
                    粉丝增长倍数: ${multiplier.toFixed(2)}x
                </div>
            </div>
        `;
    },
    
    // 渲染历史记录列表（8条）- 已移除时间显示
    renderHistoryList: function() {
        const list = document.getElementById('hotValueHistoryList');
        if (!list) return;
        
        const history = gameState.hotValueHistory || [];
        
        if (history.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; color: #666; padding: 40px 20px; font-size: 14px;">
                    暂无热度变化记录<br>
                    <span style="font-size: 12px; color: #444;">热度值变化将自动记录</span>
                </div>
            `;
            return;
        }
        
        const html = history.map((record, index) => {
            const isPositive = record.change > 0;
            const isNegative = record.change < 0;
            const changeColor = isPositive ? '#00f2ea' : (isNegative ? '#ff0050' : '#999');
            const changeSymbol = isPositive ? '+' : '';
            const bgColor = index % 2 === 0 ? 'rgba(102, 126, 234, 0.05)' : 'transparent';
            
            return `
                <div style="background: ${bgColor}; padding: 15px; border-radius: 10px; margin-bottom: 8px; border-left: 3px solid ${changeColor}; animation: slideIn 0.3s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="font-size: 14px; color: #ccc;">
                                ${record.reason}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 18px; font-weight: bold; color: ${changeColor};">
                                ${changeSymbol}${record.change}
                            </div>
                            <div style="font-size: 12px; color: #666; margin-top: 2px;">
                                ${this.formatHotValueBig(record.value)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        list.innerHTML = html;
    },
    
    // 渲染统计信息
    renderStatsInfo: function() {
        const container = document.getElementById('hotValueStatsInfo');
        if (!container) return;
        
        let currentValue = 0;
        let maxValue = 100000;
        
        if (window.HotValueSystem) {
            currentValue = window.HotValueSystem.getCurrentHotValue();
            maxValue = window.HotValueSystem.config.maxHotValue;
        }
        
        // 计算百分比
        const percentage = Math.min(100, (currentValue / maxValue) * 100).toFixed(1);
        
        // 计算平均值（如果有历史记录）
        let avgChange = 0;
        const history = gameState.hotValueHistory || [];
        if (history.length > 0) {
            const sum = history.reduce((acc, r) => acc + Math.abs(r.change), 0);
            avgChange = Math.floor(sum / history.length);
        }
        
        container.innerHTML = `
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 10px;">
                <div style="font-size: 12px; color: #999; margin-bottom: 8px;">热度值上限进度</div>
                <div style="background: #222; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
                    <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${percentage}%; transition: width 0.5s ease;"></div>
                </div>
                <div style="font-size: 12px; color: #667eea; text-align: right;">${percentage}% (${this.formatHotValueBig(currentValue)}/${this.formatHotValueBig(maxValue)})</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                <div style="background: #161823; border-radius: 10px; padding: 15px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #ff6b00;">${avgChange}</div>
                    <div style="font-size: 12px; color: #999; margin-top: 5px;">平均波动</div>
                </div>
            </div>
        `;
    },
    
    // 格式化热度值（大数字显示）
    formatHotValueBig: function(value) {
        if (value >= 100000000) {
            return (value / 100000000).toFixed(1) + 'M';
        } else if (value >= 10000) {
            return (value / 10000).toFixed(1) + 'W';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return Math.floor(value).toString();
    }
};

// ==================== 全局函数绑定 ====================

// 显示热度值全屏页
window.showHotValueFullscreen = function() {
    if (window.HotValueFullscreen) {
        window.HotValueFullscreen.show();
    }
};

// 关闭热度值全屏页
window.closeHotValueFullscreen = function() {
    if (window.HotValueFullscreen) {
        window.HotValueFullscreen.close();
    }
};

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
    // 等待游戏核心加载完成
    const checkAndInit = setInterval(() => {
        if (typeof gameState !== 'undefined' && window.HotValueSystem) {
            clearInterval(checkAndInit);
            // 全屏界面不需要额外初始化，只需读取存档中的 history
            console.log('[热度值全屏] 初始化完成');
        }
    }, 100);
    
    // 10秒后停止检查
    setTimeout(() => clearInterval(checkAndInit), 10000);
});

console.log('🔥 热度值全屏界面模块已加载（记录已全局化，时间已移除）');