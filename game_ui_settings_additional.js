// ==================== 成就显示 ====================
function showAchievements() {
    const achievementHtml = achievements.map(achievement => `<div class="achievement-item">
        <div class="achievement-icon ${achievement.unlocked ? 'unlocked' : ''}">${achievement.icon}</div>
        <div class="achievement-info"><div class="achievement-name">${achievement.name}</div><div class="achievement-desc">${achievement.desc}</div></div>
        <div style="color:${achievement.unlocked ? '#667aea' : '#999'};font-size:12px">${achievement.unlocked ? '已解锁' : '未解锁'}</div>
    </div>`).join('');
    showModal(`<div class="modal-header"><div class="modal-title">成就系统</div><div class="close-btn" onclick="closeModal()">✕</div></div><div style="max-height:60vh;overflow-y:auto">${achievementHtml}</div>`);
}

// ==================== 成就帮助 ====================
function showAchievementsHelp() {
    showModal(`<div class="modal-header"><div class="modal-title">成就说明</div><div class="close-btn" onclick="closeModal()">✕</div></div>
        <div style="padding: 20px; line-height: 1.6;">
            <p style="margin-bottom: 15px;">🏆 完成成就可以获得游戏内的荣誉标识</p>
            <p style="margin-bottom: 15px;">📊 每个成就都有对应的进度条，完成目标即可解锁</p>
            <p style="margin-bottom: 15px;">💡 部分成就需要特定条件才能解锁，请多尝试不同玩法</p>
            <p style="color: #667aea;">🎯 努力成为传奇主播吧！</p>
        </div>
    `);
}

// ==================== 开发者设置点击处理 ====================
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
window.showAchievements = showAchievements;
window.showAchievementsHelp = showAchievementsHelp;
window.handleDevSettingsClick = handleDevSettingsClick;
window.updateLastWorkTime = updateLastWorkTime;

// 重新绑定被拆分的全局变量
window.settingsClickCount = settingsClickCount;
window.lastSettingsClickTime = lastSettingsClickTime;
