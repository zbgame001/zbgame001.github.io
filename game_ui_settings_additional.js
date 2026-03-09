// ==================== 开发者设置点击处理 ====================
let settingsClickCount = 0;
let lastSettingsClickTime = 0;

function handleDevSettingsClick() {
    const now = Date.now();
    if (now - lastSettingsClickTime > 3000) {
        settingsClickCount = 0;
    }
    
    lastSettingsClickTime = now;
    
    settingsClickCount++;
    if (settingsClickCount >= 15) {
        showDevPasswordModal();
    }
}

// ==================== 全勤主播成就相关函数 ====================
function updateLastWorkTime() {
    if (!gameState.lastWorkTime || gameState.lastWorkTime <= 0) {
        console.log('修复：初始化 lastWorkTime 为当前游戏时间');
    }
    gameState.lastWorkTime = gameTimer;
}

// ==================== 全局函数绑定 ====================
window.updateLastWorkTime = updateLastWorkTime;

// 重新绑定被拆分的全局变量
window.settingsClickCount = settingsClickCount;
window.lastSettingsClickTime = lastSettingsClickTime;