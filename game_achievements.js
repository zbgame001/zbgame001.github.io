// ==================== 成就系统 ====================

// ==================== 成就列表 ====================
const achievements = [
    { id: 1, name: '初入江湖', desc: '获得第一个粉丝', icon: '🌱', unlocked: false },
    { id: 2, name: '小有名气', desc: '粉丝达到1000', icon: '🌟', unlocked: false },
    { id: 3, name: '网红达人', desc: '粉丝达到10万', icon: '⭐', unlocked: false },
    { id: 4, name: '顶级流量', desc: '粉丝达到1000万', icon: '⭐', unlocked: false },
    { id: 5, name: '爆款制造机', desc: '单条视频播放量破百万', icon: '🔥', unlocked: false },
    { id: 6, name: '点赞狂魔', desc: '累计获得10万个赞', icon: '👍', unlocked: false },
    { id: 7, name: '高产创作者', desc: '发布100个作品', icon: '📹', unlocked: false },
    { id: 8, name: '直播新星', desc: '首次直播获得1000观看', icon: '📱', unlocked: false },
    { id: 9, name: '收益第一桶金', desc: '获得首次收益', icon: '💰', unlocked: false },
    { id: 10, name: '百万富翁', desc: '累计收益达到100万', icon: '💎', unlocked: false },
    { id: 11, name: '话题之王', desc: '单条动态获得1万转发', icon: '🔁', unlocked: false },
    { id: 12, name: '评论互动达人', desc: '单条作品获得5000评论', icon: '💬', unlocked: false },
    { id: 14, name: '逆风翻盘', desc: '从封号中申诉成功', icon: '🔄', unlocked: false },
    { id: 15, name: '幸运儿', desc: '触发50次随机事件', icon: '🍀', unlocked: false },
    { id: 16, name: '社交达人', desc: '关注1000个用户', icon: '👥', unlocked: false },
    { id: 19, name: '宠粉狂魔', desc: '回复1000条评论', icon: '💖', unlocked: false },
    { id: 20, name: '传奇主播', desc: '解锁所有成就', icon: '👑', unlocked: false },
    { id: 21, name: '商单新人', desc: '完成首个商单', icon: '💼', unlocked: false },
    { id: 22, name: '广告达人', desc: '完成10个商单', icon: '📢', unlocked: false },
    { id: 23, name: '百万单王', desc: '单次商单收入超50万', icon: '💵', unlocked: false },
    { id: 25, name: '商单大师', desc: '完成50个商单且未违规', icon: '🏆', unlocked: false },
    { id: 26, name: '赌徒', desc: '完成10个虚假商单', icon: '🎰', unlocked: false },
    { id: 27, name: '身败名裂', desc: '因虚假商单被封号3次', icon: '💀', unlocked: false },
    { id: 28, name: '诚信经营', desc: '连续3个月无虚假商单', icon: '✅', unlocked: false },

    // ✅ 新增：粉丝里程碑扩展
    { id: 29, name: '百万粉丝', desc: '粉丝达到100万', icon: '⭐', unlocked: false },
    { id: 30, name: '亿万粉丝', desc: '粉丝达到1亿', icon: '💫', unlocked: false },
    // ✅ 新增：作品数量扩展
    { id: 31, name: '创作小成', desc: '发布50个作品', icon: '📹', unlocked: false },
    { id: 32, name: '创作大神', desc: '发布1000个作品', icon: '🏆', unlocked: false }
];

// ==================== 成就检查函数 ====================
function checkAchievements() {
    // 初始化成就点数（兼容旧存档）
    if (gameState.achievementPoints === undefined) {
        const unlockedCount = gameState.achievements ? gameState.achievements.length : 0;
        gameState.achievementPoints = unlockedCount * 10;
    }

    achievements.forEach(achievement => {
        if (!achievement.unlocked) {
            let unlocked = false;
            
            if (!gameState) return;
            
            switch (achievement.id) {
                case 1: unlocked = (gameState.fans || 0) >= 1; break;
                case 2: unlocked = (gameState.fans || 0) >= 1000; break;
                case 3: unlocked = (gameState.fans || 0) >= 100000; break;
                case 4: unlocked = (gameState.fans || 0) >= 10000000; break;
                case 5: {
                    const videoWorks = gameState.worksList.filter(w => !w.isPrivate && (w.type === 'video' || w.type === 'live'));
                    unlocked = videoWorks.some(w => (w.views || 0) >= 1000000);
                    break;
                }
                case 6: unlocked = (gameState.likes || 0) >= 100000; break;
                case 7: unlocked = gameState.worksList.length >= 100; break;
                case 8: {
                    const liveWorks = gameState.worksList.filter(w => !w.isPrivate && w.type === 'live');
                    unlocked = liveWorks.some(w => (w.views || 0) >= 1000);
                    break;
                }
                case 9: unlocked = (gameState.money || 0) >= 1; break;
                case 10: unlocked = (gameState.money || 0) >= 1000000; break;
                case 11: {
                    const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
                    unlocked = publicWorks.some(w => (w.shares || 0) >= 10000);
                    break;
                }
                case 12: {
                    const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
                    unlocked = publicWorks.some(w => (w.comments || 0) >= 5000);
                    break;
                }
                case 14: break; // 由申诉触发
                case 15: {
                    if (!gameState.eventCount) gameState.eventCount = 0;
                    unlocked = gameState.eventCount >= 50;
                    break;
                }
                case 16: {
                    if (!gameState.following) gameState.following = [];
                    unlocked = gameState.following.length >= 1000;
                    break;
                }
                case 19: {
                    if (!gameState.commentRepliesCount) gameState.commentRepliesCount = 0;
                    unlocked = gameState.commentRepliesCount >= 1000;
                    break;
                }
                case 20: {
                    const otherAchievements = achievements.filter(a => a.id !== 20);
                    unlocked = otherAchievements.every(a => a.unlocked);
                    break;
                }
                case 21: unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 1; break;
                case 22: unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 10; break;
                case 23: {
                    const adWorks = gameState.worksList.filter(w => w.isAd && !w.isPrivate);
                    unlocked = adWorks.some(w => (w.revenue || 0) >= 50000);
                    break;
                }
                case 25: {
                    unlocked = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length >= 50 && (gameState.warnings || 0) < 5;
                    break;
                }
                case 26: {
                    const fakeAdCount = gameState.worksList.filter(w => w.isAd && w.adOrder && !w.adOrder.real && !w.isPrivate).length;
                    unlocked = fakeAdCount >= 10;
                    break;
                }
                case 27: {
                    if (!gameState.fakeAdBans) gameState.fakeAdBans = 0;
                    unlocked = gameState.fakeAdBans >= 3;
                    break;
                }
                case 28: {
                    unlocked = (gameState.monthsWithoutFakeAd || 0) >= 3;
                    break;
                }
                // ✅ 新增成就的解锁逻辑
                case 29: unlocked = (gameState.fans || 0) >= 1000000; break;
                case 30: unlocked = (gameState.fans || 0) >= 100000000; break;
                case 31: unlocked = gameState.worksList.length >= 50; break;
                case 32: unlocked = gameState.worksList.length >= 1000; break;
                default: break;
            }
            
            if (unlocked) {
                achievement.unlocked = true;
                
                if (!gameState.achievements.includes(achievement.id)) {
                    gameState.achievements.push(achievement.id);
                    if (gameState.achievementPoints === undefined) gameState.achievementPoints = 0;
                    gameState.achievementPoints += 10;
                }
                
                if (typeof showAchievementPopup === 'function') {
                    showAchievementPopup(achievement);
                }
                
                console.log(`✅ 成就解锁: ${achievement.name} (ID: ${achievement.id})`);
                
                // 检查传奇主播成就
                if (achievement.id !== 20 && !achievements.find(a => a.id === 20).unlocked) {
                    const legendary = achievements.find(a => a.id === 20);
                    const other = achievements.filter(a => a.id !== 20);
                    if (other.every(a => a.unlocked) && !legendary.unlocked) {
                        legendary.unlocked = true;
                        gameState.achievements.push(20);
                        showAchievementPopup(legendary);
                    }
                }
            }
        }
    });
}

// ==================== 成就显示（全屏页面） ====================
function showAchievementsFullscreen() {
    // 显示前强制检查一次成就状态
    checkAchievements();

    const content = document.getElementById('achievementsListTab');
    if (!content) return;
    
    // 确保成就点数已初始化
    if (gameState.achievementPoints === undefined) {
        const unlockedCount = achievements.filter(a => a.unlocked).length;
        gameState.achievementPoints = unlockedCount * 10;
    }
    
    const points = gameState.achievementPoints || 0;
    const level = Math.floor(points / 10);
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;
    
    const levelHtml = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 10px; padding: 15px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            <div style="font-size: 12px; color: rgba(255,255,255,0.9); margin-bottom: 5px;">成就等级</div>
            <div style="font-size: 32px; font-weight: bold; color: #fff; line-height: 1.2;">Lv.${level}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.8); margin-top: 5px;">${unlockedCount}/${totalCount} 已解锁 | 点数 ${points}</div>
        </div>
    `;
    
    const progressMap = {
        1: { current: () => gameState.fans || 0, target: 1 },
        2: { current: () => gameState.fans || 0, target: 1000 },
        3: { current: () => gameState.fans || 0, target: 100000 },
        4: { current: () => gameState.fans || 0, target: 10000000 },
        5: { 
            current: () => {
                const videoWorks = gameState.worksList.filter(w => !w.isPrivate && (w.type === 'video' || w.type === 'live'));
                return videoWorks.length > 0 ? Math.max(...videoWorks.map(w => w.views), 0) : 0;
            }, 
            target: 1000000 
        },
        6: { current: () => gameState.likes || 0, target: 100000 },
        7: { current: () => gameState.worksList.length, target: 100 },
        8: { 
            current: () => {
                const liveWorks = gameState.worksList.filter(w => !w.isPrivate && w.type === 'live');
                return liveWorks.length > 0 ? Math.max(...liveWorks.map(w => w.views), 0) : 0;
            }, 
            target: 1000 
        },
        9: { current: () => gameState.money || 0, target: 1 },
        10: { current: () => gameState.money || 0, target: 1000000 },
        11: { 
            current: () => {
                const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
                return publicWorks.length > 0 ? Math.max(...publicWorks.map(w => w.shares || 0), 0) : 0;
            }, 
            target: 10000 
        },
        12: { 
            current: () => {
                const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
                return publicWorks.length > 0 ? Math.max(...publicWorks.map(w => w.comments || 0), 0) : 0;
            }, 
            target: 5000 
        },
        13: { 
            current: () => {
                if (!gameState.gameStartTime || gameState.gameStartTime <= 0) return 0;
                const now = Date.now();
                const days = Math.floor((now - gameState.gameStartTime) / (24 * 60 * 60 * 1000));
                return Math.max(0, days);
            }, 
            target: 30 
        },
        14: { current: () => 0, target: 1 },
        15: { current: () => gameState.eventCount || 0, target: 50 },
        16: { current: () => (gameState.following && gameState.following.length) || 0, target: 1000 },
        17: { 
            current: () => {
                if (!gameState.liveHistory) return 0;
                return gameState.liveHistory.filter(live => live.startVirtualHour === 3).length;
            }, 
            target: 1 
        },
        18: { 
            current: () => {
                if (!gameState.liveHistory) return 0;
                return gameState.liveHistory.filter(live => live.startVirtualHour === 6).length;
            }, 
            target: 1 
        },
        19: { current: () => gameState.commentRepliesCount || 0, target: 1000 },
        20: { 
            current: () => {
                const other = achievements.filter(a => a.id !== 20);
                return other.filter(a => a.unlocked).length;
            }, 
            target: () => achievements.filter(a => a.id !== 20).length
        },
        21: { current: () => gameState.worksList.filter(w => w.isAd && !w.isPrivate).length, target: 1 },
        22: { current: () => gameState.worksList.filter(w => w.isAd && !w.isPrivate).length, target: 10 },
        23: { 
            current: () => {
                const adWorks = gameState.worksList.filter(w => w.isAd && !w.isPrivate);
                const revs = adWorks.map(w => w.revenue || 0);
                return revs.length > 0 ? Math.max(...revs) : 0;
            }, 
            target: 50000 
        },
        24: { current: () => gameState.rejectedAdOrders || 0, target: 5 },
        25: { 
            current: () => {
                const count = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length;
                const warn = gameState.warnings || 0;
                return count >= 50 && warn < 5 ? 50 : Math.min(count, 49);
            }, 
            target: 50 
        },
        26: { 
            current: () => gameState.worksList.filter(w => w.isAd && w.adOrder && !w.adOrder.real && !w.isPrivate).length, 
            target: 10 
        },
        27: { current: () => gameState.fakeAdBans || 0, target: 3 },
        28: { current: () => gameState.monthsWithoutFakeAd || 0, target: 3 },
        // ✅ 新增成就进度
        29: { current: () => gameState.fans || 0, target: 1000000 },
        30: { current: () => gameState.fans || 0, target: 100000000 },
        31: { current: () => gameState.worksList.length, target: 50 },
        32: { current: () => gameState.worksList.length, target: 1000 }
    };
    
    const achievementHtml = achievements.map(achievement => {
        const progress = progressMap[achievement.id];
        let progressHtml = '';
        
        if (achievement.unlocked) {
            progressHtml = '<div style="color: #667aea; font-size: 12px; margin-top: 5px;">✅ 已完成</div>';
        } else if (progress && typeof progress.current === 'function') {
            try {
                const current = progress.current();
                const target = typeof progress.target === 'function' ? progress.target() : progress.target;
                
                if (typeof current === 'number' && typeof target === 'number' && target > 0) {
                    const actualCurrent = Math.min(current, target);
                    const percentage = Math.min(100, Math.floor((actualCurrent / target) * 100));
                    
                    progressHtml = `
                        <div class="achievement-progress">
                            <div class="achievement-progress-bar" style="width: ${percentage}%"></div>
                        </div>
                        <div class="achievement-progress-text">
                            ${formatNumber(actualCurrent)} / ${formatNumber(target)} (${percentage}%)
                        </div>
                    `;
                } else {
                    progressHtml = '<div style="color: #999; font-size: 12px; margin-top: 5px;">🔒 未解锁</div>';
                }
            } catch (e) {
                progressHtml = '<div style="color: #999; font-size: 12px; margin-top: 5px;">🔒 未解锁</div>';
            }
        } else {
            progressHtml = '<div style="color: #999; font-size: 12px; margin-top: 5px;">🔒 未解锁</div>';
        }
        
        return `
            <div class="achievement-item">
                <div class="achievement-icon ${achievement.unlocked ? 'unlocked' : ''}">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                    ${progressHtml}
                </div>
                <div style="color:${achievement.unlocked ? '#667aea' : '#999'};font-size:12px">
                    ${achievement.unlocked ? '已解锁' : '未解锁'}
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = levelHtml + achievementHtml;
}

// ==================== 辅助函数 ====================
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

function showAchievements() {
    const achievementHtml = achievements.map(achievement => `<div class="achievement-item">
        <div class="achievement-icon ${achievement.unlocked ? 'unlocked' : ''}">${achievement.icon}</div>
        <div class="achievement-info"><div class="achievement-name">${achievement.name}</div><div class="achievement-desc">${achievement.desc}</div></div>
        <div style="color:${achievement.unlocked ? '#667aea' : '#999'};font-size:12px">${achievement.unlocked ? '已解锁' : '未解锁'}</div>
    </div>`).join('');
    showModal(`<div class="modal-header"><div class="modal-title">成就系统</div><div class="close-btn" onclick="closeModal()">✕</div></div><div style="max-height:60vh;overflow-y:auto">${achievementHtml}</div>`);
}

// ==================== 全局函数绑定 ====================
window.achievements = achievements;
window.checkAchievements = checkAchievements;
window.showAchievementsFullscreen = showAchievementsFullscreen;
window.showAchievementsHelp = showAchievementsHelp;
window.showAchievements = showAchievements;

console.log('成就系统模块已加载（新增等级、百万粉丝、亿万粉丝、50/1000作品成就）');