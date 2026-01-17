// ==================== 账号设置 ====================
function showSettings() {
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    const content = document.getElementById('settingsPageContent');
    
    // ✅ 新增：消息免打扰状态显示
    const doNotDisturbStatus = gameState.doNotDisturb ? '已开启' : '已关闭';
    const doNotDisturbStatusColor = gameState.doNotDisturb ? '#ff6b00' : '#999';
    
    content.innerHTML = `
        <div class="settings-item" onclick="changeUsername()">
            <div><div class="settings-label">修改昵称</div><div class="settings-value">${gameState.username}</div></div>
            <div>></div>
        </div>
        <div class="settings-item" onclick="changeUserId()">
            <div><div class="settings-label">用户ID</div><div class="settings-value">${gameState.userId}</div></div>
            <div>></div>
        </div>
        <div class="settings-item" onclick="changeAvatar()">
            <div><div class="settings-label">修改头像文字</div><div class="settings-value">点击修改</div></div>
            <div>></div>
        </div>
        <!-- 新增上传头像功能 -->
        <div class="settings-item" onclick="uploadAvatar()">
            <div><div class="settings-label">上传头像图片</div><div class="settings-value" style="color: #667aea;">选择图片</div></div>
            <div>📷</div>
        </div>
        <!-- ✅ 新增：消息免打扰开关 -->
        <div class="settings-item" onclick="toggleDoNotDisturb()" style="background: ${gameState.doNotDisturb ? '#1a2a1a' : '#161823'}; border: ${gameState.doNotDisturb ? '1px solid #00f2ea' : '1px solid #333'};">
            <div>
                <div class="settings-label" style="color: ${gameState.doNotDisturb ? '#00f2ea' : '#fff'};">🔕 消息免打扰</div>
                <div class="settings-value" style="color: ${doNotDisturbStatusColor}; font-weight: ${gameState.doNotDisturb ? 'bold' : 'normal'};">
                    ${doNotDisturbStatus}
                </div>
            </div>
            <div style="font-size: 20px; color: ${gameState.doNotDisturb ? '#00f2ea' : '#666'};">
                ${gameState.doNotDisturb ? '🔕' : '🔔'}
            </div>
        </div>
    `;
    
    const headerTitle = document.getElementById('settingsHeaderTitle');
    if (headerTitle) {
        headerTitle.textContent = '账号设置';
        headerTitle.onclick = handleDevSettingsClick;
    }
    
    document.getElementById('settingsPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== ✅ 新增：切换消息免打扰状态 ====================
function toggleDoNotDisturb() {
    // 切换状态
    gameState.doNotDisturb = !gameState.doNotDisturb;
    
    // 保存设置
    saveGame();
    
    // 更新UI显示
    showSettings();
    
    // 立即刷新导航栏徽章（根据新状态）
    if (typeof updateNavMessageBadge === 'function') {
        updateNavMessageBadge();
    }
    
    // ✅ 新增：小弹窗通知
    const status = gameState.doNotDisturb ? '已开启' : '已关闭';
    const icon = gameState.doNotDisturb ? '🔕' : '🔔';
    showEventPopup(`${icon} 消息免打扰`, `消息小红点提醒${status}`);
}

// ==================== 个人主页（全屏 + 移除等级 + 添加关注数） ====================
function showProfile() {
    const content = document.getElementById('profilePageContent');
    
    // 头像预览HTML
    const avatarPreview = gameState.avatarImage ? 
        `<div style="width:80px;height:80px;border-radius:50%;overflow:hidden;margin:0 auto 10px">
            <img src="${gameState.avatarImage}" style="width:100%;height:100%;object-fit:cover;">
         </div>` :
        `<div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;font-size:32px;margin:0 auto 10px">
            ${gameState.avatar || 'A'}
         </div>`;
    
    // 添加关注数显示（确保gameState.following存在）
    if (gameState.following === undefined) {
        gameState.following = [];
    }
    
    content.innerHTML = `
        <div style="text-align:center;padding:20px">
            ${avatarPreview}
            <div style="font-size:20px;font-weight:bold;margin-bottom:5px">${gameState.username}</div>
            <div style="font-size:14px;color:#999;margin-bottom:20px">${gameState.userId}</div>
            <div style="display:flex;justify-content:space-around;margin-bottom:20px">
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.fans}</div><div style="font-size:12px;color:#999" style="cursor:pointer;" onclick="showFollowingList()" style="cursor:pointer;">粉丝</div></div>
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.following.length}</div><div style="font-size:12px;color:#999" style="cursor:pointer;" onclick="showFollowingList()" style="cursor:pointer;">关注</div></div>
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.works}</div><div style="font-size:12px;color:#999">作品</div></div>
                <div style="text-align:center"><div style="font-size:18px;font-weight:bold">${gameState.likes}</div><div style="font-size:12px;color:#999">获赞</div></div>
            </div>
            <button class="btn" onclick="showAllWorks()">查看所有作品</button>
        </div>
    `;
    
    document.getElementById('profilePage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 全屏用户主页（移除等级 + 数据缓存） ====================
window.cachedUserProfile = null; // 缓存用户数据

function showUserProfile(username, avatar) {
    // 如果已缓存数据，直接使用缓存
    if (window.cachedUserProfile && window.cachedUserProfile.username === username) {
        renderUserProfile(window.cachedUserProfile);
        return;
    }
    
    // 从关注列表中查找用户数据
    const fromFollowing = gameState.following.find(u => 
        (typeof u === 'object' ? u.username : u) === username
    );
    
    if (fromFollowing && typeof fromFollowing === 'object') {
        // 如果关注列表中有完整数据，使用它
        window.cachedUserProfile = fromFollowing;
        renderUserProfile(fromFollowing);
        return;
    }
    
    // 生成新用户数据并缓存
    const profileData = {
        username: username,
        avatar: avatar,
        userId: 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        joinDays: Math.floor(Math.random() * 365) + 1,
        fanCount: Math.floor(Math.random() * 50000) + 100,
        workCount: Math.floor(Math.random() * 500) + 10,
        likeCount: Math.floor(Math.random() * 100000) + 1000,
        following: Math.floor(Math.random() * 500) + 50,
        bio: getRandomUserBio(),
        isFollowing: false
    };
    
    window.cachedUserProfile = profileData;
    renderUserProfile(profileData);
}

function renderUserProfile(profileData) {
    const content = document.getElementById('userProfilePageContent');
    if (!content) {
        console.error('用户主页内容容器未找到');
        return;
    }
    
    const avatarHtml = profileData.avatar ? 
        `<div class="user-profile-avatar">${profileData.avatar}</div>` :
        `<div class="user-profile-avatar">?</div>`;
    
    // ✅ 新增功能：判断关注状态
    const isFollowing = gameState.following.some(u => 
        (typeof u === 'object' ? u.username : u) === profileData.username
    );
    
    const followBtnHtml = `<button class="btn" onclick="toggleFollow('${profileData.username}')" 
                           style="width:100%;margin-top:15px;background:${isFollowing ? '#666' : '#667eea'};cursor:${isFollowing ? 'default' : 'pointer'};"
                           ${isFollowing ? 'disabled' : ''}>
                           ${isFollowing ? '✓ 已关注' : '➕ 关注'}
                       </button>`;
    
    content.innerHTML = `
        <div style="text-align:center;padding:20px">
            ${avatarHtml}
            <div class="user-profile-name">${profileData.username}</div>
            <div class="user-profile-id">${profileData.userId}</div>
            
            <div class="user-profile-stats" style="margin-bottom: 20px;">
                <div class="user-profile-stat">
                    <div class="user-profile-stat-value">${formatNumber(profileData.fanCount)}</div>
                    <div class="user-profile-stat-label">粉丝</div>
                </div>
                <div class="user-profile-stat">
                    <div class="user-profile-stat-value">${formatNumber(profileData.following)}</div>
                    <div class="user-profile-stat-label">关注</div>
                </div>
                <div class="user-profile-stat">
                    <div class="user-profile-stat-value">${formatNumber(profileData.workCount)}</div>
                    <div class="user-profile-stat-label">作品</div>
                </div>
                <div class="user-profile-stat">
                    <div class="user-profile-stat-value">${formatNumber(profileData.likeCount)}</div>
                    <div class="user-profile-stat-label">获赞</div>
                </div>
            </div>
            
            <div class="user-profile-info" style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="color: #999;">加入平台</span>
                    <span style="font-weight: bold;">${profileData.joinDays}天</span>
                </div>
            </div>
            
            <div class="user-profile-bio">
                <div class="user-profile-bio-title">简介</div>
                <div class="user-profile-bio-content">${profileData.bio}</div>
            </div>
            
            ${followBtnHtml}
            
            <button class="btn btn-secondary" onclick="closeFullscreenPage('userProfile')" style="margin-top: 10px;">关闭</button>
        </div>
    `;
    
    document.getElementById('userProfilePage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 显示所有作品 ====================
// 彻底修复版：直接跳转到作品标签页，不依赖 event 对象
function showAllWorks() {
    // 关闭个人主页（全屏页面）
    if (typeof closeFullscreenPage === 'function') {
        closeFullscreenPage('profile');
    }
    
    // 延迟执行，确保关闭动画完成
    setTimeout(() => {
        // 手动设置作品标签为活动状态
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        const worksTab = document.querySelector('.nav-item:nth-child(2)'); // 作品标签是第二个
        if (worksTab) {
            worksTab.classList.add('active');
        }
        
        // 显示主内容区域
        document.getElementById('mainContent').style.display = 'block';
        document.querySelector('.bottom-nav').style.display = 'flex';
        
        // 隐藏所有主内容区块
        document.querySelectorAll('.main-content-section').forEach(el => el.style.display = 'none');
        
        // 显示作品内容区域
        document.getElementById('worksContent').style.display = 'block';
        
        // 调用作品全屏显示函数
        if (typeof showWorksFullscreen === 'function') {
            showWorksFullscreen();
        }
        
        // 更新显示
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    }, 100);
}

// ==================== 全屏成就页 ====================
function showAchievementsFullscreen() {
    const content = document.getElementById('achievementsListTab');
    if (!content) return;
    
    // ==================== 修复版：特殊成就进度显示 ====================
    const progressMap = {
        // 基础成就
        1: { current: () => gameState.fans || 0, target: 1 },
        2: { current: () => gameState.fans || 0, target: 1000 },
        3: { current: () => gameState.fans || 0, target: 100000 },
        4: { current: () => gameState.fans || 0, target: 10000000 },
        
        // 爆款制造机
        5: { 
            current: () => {
                const videoWorks = gameState.worksList.filter(w => !w.isPrivate && (w.type === 'video' || w.type === 'live'));
                return videoWorks.length > 0 ? Math.max(...videoWorks.map(w => w.views), 0) : 0;
            }, 
            target: 1000000 
        },
        
        // 点赞狂魔
        6: { current: () => gameState.likes || 0, target: 100000 },
        
        // 高产创作者
        7: { current: () => gameState.worksList.filter(w => !w.isPrivate).length, target: 100 },
        
        // 直播新星
        8: { 
            current: () => {
                const liveWorks = gameState.worksList.filter(w => !w.isPrivate && w.type === 'live');
                return liveWorks.length > 0 ? Math.max(...liveWorks.map(w => w.views), 0) : 0;
            }, 
            target: 1000 
        },
        
        // 收益第一桶金
        9: { current: () => gameState.money || 0, target: 1 },
        
        // 百万富翁
        10: { current: () => gameState.money || 0, target: 1000000 },
        
        // 话题之王
        11: { 
            current: () => {
                const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
                return publicWorks.length > 0 ? Math.max(...publicWorks.map(w => w.shares || 0), 0) : 0;
            }, 
            target: 10000 
        },
        
        // 评论互动达人
        12: { 
            current: () => {
                const publicWorks = gameState.worksList.filter(w => !w.isPrivate);
                return publicWorks.length > 0 ? Math.max(...publicWorks.map(w => w.comments || 0), 0) : 0;
            }, 
            target: 5000 
        },
        
        // 全勤主播 - 修复版：正确计算真实天数
        13: { 
            current: () => {
                // 只有当gameStartTime被正确设置时才计算，否则返回0
                if (!gameState.gameStartTime || gameState.gameStartTime <= 0) {
                    return 0;
                }
                const now = Date.now();
                const days = Math.floor((now - gameState.gameStartTime) / (24 * 60 * 60 * 1000));
                return Math.max(0, days);
            }, 
            target: 30 
        },
        
        // 逆风翻盘 - 特殊成就，显示申诉次数
        14: { 
            current: () => {
                // 显示申诉成功次数（此成就只需要一次）
                return 0; // 无法获取申诉次数，显示0/1表示未达成
            }, 
            target: 1 
        },
        
        // 幸运儿
        15: { current: () => gameState.eventCount || 0, target: 50 },
        
        // 社交达人
        16: { current: () => (gameState.following && gameState.following.length) || 0, target: 1000 },
        
        // 夜猫子 - 新增：显示凌晨3点直播次数
        17: { 
            current: () => {
                if (!gameState.liveHistory) return 0;
                return gameState.liveHistory.filter(live => live.startVirtualHour === 3).length;
            }, 
            target: 1 
        },
        
        // 早起鸟儿 - 新增：显示早上6点直播次数
        18: { 
            current: () => {
                if (!gameState.liveHistory) return 0;
                return gameState.liveHistory.filter(live => live.startVirtualHour === 6).length;
            }, 
            target: 1 
        },
        
        // 宠粉狂魔
        19: { current: () => gameState.commentRepliesCount || 0, target: 1000 },
        
        // 传奇主播 - 新增：显示已解锁成就进度
        20: { 
            current: () => {
                const otherAchievements = achievements.filter(a => a.id !== 20);
                return otherAchievements.filter(a => a.unlocked).length;
            }, 
            target: () => {
                const otherAchievements = achievements.filter(a => a.id !== 20);
                return otherAchievements.length;
            }
        },
        
        // 商单新人
        21: { current: () => gameState.worksList.filter(w => w.isAd && !w.isPrivate).length, target: 1 },
        
        // 广告达人
        22: { current: () => gameState.worksList.filter(w => w.isAd && !w.isPrivate).length, target: 10 },
        
        // 百万单王
        23: { 
            current: () => {
                const adWorks = gameState.worksList.filter(w => w.isAd && !w.isPrivate);
                const revenues = adWorks.map(w => w.revenue || 0);
                return revenues.length > 0 ? Math.max(...revenues) : 0;
            }, 
            target: 50000 
        },
        
        // 火眼金睛
        24: { current: () => gameState.rejectedAdOrders || 0, target: 5 },
        
        // 商单大师 - 需要同时满足两个条件
        25: { 
            current: () => {
                const adWorksCount = gameState.worksList.filter(w => w.isAd && !w.isPrivate).length;
                const warningsCount = gameState.warnings || 0;
                // 如果条件满足返回target，否则返回当前进度
                if (adWorksCount >= 50 && warningsCount < 5) return 50;
                return Math.min(adWorksCount, 49); // 显示到49/50
            }, 
            target: 50 
        },
        
        // 赌徒
        26: { current: () => gameState.worksList.filter(w => w.isAd && w.adOrder && !w.adOrder.real && !w.isPrivate).length, target: 10 },
        
        // 身败名裂 - 新增：显示因虚假商单被封号次数
        27: { 
            current: () => {
                return gameState.fakeAdBans || 0;
            }, 
            target: 3 
        },
        
        // 诚信经营
        28: { current: () => gameState.monthsWithoutFakeAd || 0, target: 3 }
    };
    // ==================== 修复结束 ====================
    
    const achievementHtml = achievements.map(achievement => {
        const progress = progressMap[achievement.id];
        let progressHtml = '';
        
        // 检查是否为已解锁状态
        if (achievement.unlocked) {
            progressHtml = '<div style="color: #667aea; font-size: 12px; margin-top: 5px;">✅ 已完成</div>';
        } 
        // 检查是否有进度映射且为正常数值型进度
        else if (progress && typeof progress.current === 'function') {
            try {
                const current = progress.current();
                const target = typeof progress.target === 'function' ? progress.target() : progress.target;
                
                // 安全校验：确保数值有效
                if (typeof current === 'number' && typeof target === 'number' && target > 0) {
                    const actualCurrent = Math.min(current, target); // 防止超过100%
                    const percentage = Math.min(100, Math.floor((actualCurrent / target) * 100));
                    
                    progressHtml = `
                        <div class="achievement-progress">
                            <div class="achievement-progress-bar" style="width: ${percentage}%"></div>
                        </div>
                        <div class="achievement-progress-text">
                            ${actualCurrent.toLocaleString()} / ${target.toLocaleString()} (${percentage}%)
                        </div>
                    `;
                } else {
                    progressHtml = '<div style="color: #999; font-size: 12px; margin-top: 5px;">🔒 未解锁</div>';
                }
            } catch (e) {
                console.error(`成就 ${achievement.id} 进度计算失败:`, e);
                progressHtml = '<div style="color: #999; font-size: 12px; margin-top: 5px;">🔒 未解锁</div>';
            }
        } 
        // 特殊成就或无进度条成就
        else {
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
    
    content.innerHTML = achievementHtml;
}

// ==================== 账号设置相关函数 ====================
function changeUsername() {
    showPrompt('请输入新昵称（最多10个字符）', gameState.username, function(newName) {
        if (newName && newName.trim()) {
            gameState.username = newName.trim().substring(0, 10);
            gameState.avatar = gameState.username.charAt(0).toUpperCase();
            updateDisplay();
            showNotification('修改成功', '昵称已更新');
        }
    });
}

function changeUserId() {
    showPrompt('请输入新ID（最多20个字符）', gameState.userId, function(newId) {
        if (newId && newId.trim()) {
            gameState.userId = newId.trim().substring(0, 20);
            showNotification('修改成功', 'ID已更新');
        }
    });
}

function changeAvatar() {
    showPrompt('请输入头像文字（1个字符），留空则使用图片头像', gameState.avatar || '', function(avatar) {
        if (avatar && avatar.trim()) {
            gameState.avatar = avatar.trim().substring(0, 1);
            gameState.avatarImage = ''; // 清空图片头像
            updateDisplay();
            showNotification('修改成功', '头像文字已更新');
        } else {
            // 如果留空且有图片，则使用图片
            if (gameState.avatarImage) {
                gameState.avatar = '';
                updateDisplay();
                showNotification('修改成功', '已恢复图片头像');
            } else {
                showAlert('没有设置图片头像，请输入文字或先上传图片', '提示');
            }
            saveGame();
        }
    });
}

function clearData() {
    showConfirm('确定要清除所有数据吗？此操作不可恢复！', function(confirmed) {
        if (confirmed) {
            try {
                if (typeof resetGame === 'function') {
                    resetGame();
                }
                localStorage.removeItem('streamerGameState');
                showAlert('数据已清除！页面将刷新。', '提示');
                setTimeout(() => {
                    location.reload(true);
                }, 100);
            } catch (error) {
                console.error('清除数据失败:', error);
                showAlert('清除数据失败，请手动清除浏览器缓存。', '错误');
            }
        }
    });
}

// ==================== 新增：带自动压缩的的头像上传功能 ====================
function uploadAvatar() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
            showAlert('请选择图片文件！', '错误');
            document.body.removeChild(fileInput);
            return;
        }
        
        // 检查文件大小（限制5MB）
        if (file.size > 5 * 1024 * 1024) {
            showAlert('图片太大！请选择小于5MB的图片', '错误');
            document.body.removeChild(fileInput);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // 压缩图片
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 计算压缩后的尺寸
                let width = img.width;
                let height = img.height;
                const maxSize = 800; // 最大边长800px
                
                if (width > maxSize || height > maxSize) {
                    const ratio = Math.min(maxSize / width, maxSize / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 绘制压缩后的图片
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为base64，质量0.8
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                
                // 检查压缩后的大小
                const base64Size = imageData.length * 0.75; // base64大小约为原图的75%
                
                let finalImageData = imageData;
                if (base64Size > 2 * 1024 * 1024) {
                    // 如果还太大，进一步降低质量到0.6
                    finalImageData = canvas.toDataURL('image/jpeg', 0.6);
                    
                    // 再次检查
                    const newBase64Size = finalImageData.length * 0.75;
                    if (newBase64Size > 2 * 1024 * 1024) {
                        // 如果仍然太大，提示用户
                        showAlert('图片压缩后仍超过2MB，请选择更小的图片', '提示');
                        document.body.removeChild(fileInput);
                        return;
                    }
                }
                
                // 保存到游戏状态
                gameState.avatarImage = finalImageData;
                gameState.avatar = ''; // 清空文字头像
                
                // 更新显示
                updateDisplay();
                showNotification('上传成功', '头像已更新并压缩！');
                saveGame();
                
                // 清理
                document.body.removeChild(fileInput);
            };
            img.src = event.target.result;
        };
        reader.onerror = function() {
            showAlert('读取图片失败！', '错误');
            document.body.removeChild(fileInput);
        };
        reader.readAsDataURL(file);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

// ==================== 全勤主播成就相关函数 ====================
function updateLastWorkTime() {
    if (!gameState.lastWorkTime || gameState.lastWorkTime <= 0) {
        console.log('修复：初始化 lastWorkTime 为当前游戏时间');
    }
    gameState.lastWorkTime = gameTimer;
}

// ==================== 开发者模式相关变量 ====================
let settingsClickCount = 0;
let lastSettingsClickTime = 0;

// ==================== 全屏关注列表页面（修复版 - 确保页面正确渲染） ====================
// 修复重点：确保内容正确渲染到followingPageContent容器中
function showFollowingList() {
    if (!gameState.following || gameState.following.length === 0) {
        showAlert('你还没有关注任何人', '关注列表');
        return;
    }
    
    // 先关闭所有全屏页面
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    // 显示主内容（防止空白页面）
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    // 检查followingPage是否已存在
    let followingPage = document.getElementById('followingPage');
    let isNewPage = false;
    
    if (!followingPage) {
        // 创建新的关注列表页面
        followingPage = document.createElement('div');
        followingPage.id = 'followingPage';
        followingPage.className = 'fullscreen-page';
        followingPage.innerHTML = `
            <div class="fullscreen-header">
                <div class="back-btn" onclick="closeFollowingPage()">‹</div>
                <div class="fullscreen-title">关注列表 (${gameState.following.length})</div>
                <div class="fullscreen-action" style="opacity:0; cursor:default;">占位</div>
            </div>
            <div id="followingPageContent" class="fullscreen-content"></div>
        `;
        document.body.appendChild(followingPage);
        isNewPage = true;
    }
    
    // 显示关注列表页面
    followingPage.classList.add('active');
    
    // 延迟渲染内容，确保DOM已准备好
    setTimeout(() => {
        try {
            renderFollowingList();
        } catch (error) {
            console.error('渲染关注列表失败:', error);
            showAlert('关注列表渲染失败，请刷新页面重试', '错误');
            closeFollowingPage();
        }
    }, isNewPage ? 100 : 0);
}

// 渲染关注列表（修复版 - 增加错误处理和空状态处理）
function renderFollowingList() {
    const content = document.getElementById('followingPageContent');
    if (!content) {
        console.error('关注列表内容容器未找到');
        return;
    }
    
    if (!gameState.following || gameState.following.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">关注列表为空</div>';
        return;
    }
    
    // 生成关注列表HTML
    try {
        const followingHtml = gameState.following.map((userData, index) => {
            // 如果 userData 是字符串（旧数据格式），转换为对象
            if (typeof userData === 'string') {
                userData = {
                    username: userData,
                    avatar: userData.charAt(0),
                    userId: 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    fanCount: Math.floor(Math.random() * 50000) + 100,
                    workCount: Math.floor(Math.random() * 500) + 10,
                    likeCount: Math.floor(Math.random() * 100000) + 1000,
                    joinDays: Math.floor(Math.random() * 365) + 1,
                    following: Math.floor(Math.random() * 500) + 50,
                    bio: getRandomUserBio()
                };
                // 更新数组中的数据
                gameState.following[index] = userData;
                saveGame();
            }
            
            return `
                <div class="work-item" style="display:flex;justify-content:space-between;align-items:center; padding: 15px; margin-bottom: 10px;">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;cursor:pointer;" 
                         onclick="showUserProfileFromFollowing('${userData.username}', '${userData.avatar}')">
                        <div class="comment-user-avatar">${userData.avatar}</div>
                        <div style="flex:1;">
                            <div style="font-weight:bold;font-size:14px;">${userData.username}</div>
                            <div style="font-size:11px;color:#999;">${userData.userId}</div>
                        </div>
                    </div>
                    <button class="btn btn-secondary" style="width:auto;padding:8px 12px;font-size:12px;background:#ff0050;" 
                            onclick="toggleFollow('${userData.username}')">
                        取消关注
                    </button>
                </div>
            `;
        }).join('');
        
        // 检查是否有内容，如果没有显示空状态
        if (followingHtml.trim() === '') {
            content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">关注列表为空</div>';
        } else {
            content.innerHTML = followingHtml;
        }
    } catch (error) {
        console.error('生成关注列表HTML失败:', error);
        content.innerHTML = '<div style="text-align:center;color:#ff0050;padding:40px;">渲染失败，请刷新页面</div>';
    }
}

// 从关注列表打开用户主页
function showUserProfileFromFollowing(username, avatar) {
    // 先关闭关注列表
    closeFollowingPage();
    
    // 查找用户数据
    const userData = gameState.following.find(u => 
        (typeof u === 'object' ? u.username : u) === username
    );
    
    // 延迟执行，确保页面切换完成
    setTimeout(() => {
        if (typeof userData === 'object') {
            // 如果有完整数据，直接渲染
            renderUserProfile(userData);
        } else {
            // 如果是旧数据格式，生成新数据
            const profileData = {
                username: username,
                avatar: avatar,
                userId: 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                fanCount: Math.floor(Math.random() * 50000) + 100,
                workCount: Math.floor(Math.random() * 500) + 10,
                likeCount: Math.floor(Math.random() * 100000) + 1000,
                joinDays: Math.floor(Math.random() * 365) + 1,
                following: Math.floor(Math.random() * 500) + 50,
                bio: getRandomUserBio(),
                isFollowing: false
            };
            
            // 更新关注列表中的数据
            const index = gameState.following.findIndex(u => 
                (typeof u === 'object' ? u.username : u) === username
            );
            if (index !== -1) {
                gameState.following[index] = profileData;
                saveGame();
            }
            
            renderUserProfile(profileData);
        }
    }, 100);
}

// 关闭关注列表页面（修复版 - 正确恢复页面状态）
function closeFollowingPage() {
    // 移除关注列表页面
    const followingPage = document.getElementById('followingPage');
    if (followingPage) {
        followingPage.classList.remove('active');
    }
    
    // 恢复主内容显示
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    // 隐藏所有标签页内容
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    // 确保首页标签处于激活状态
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    // 显示首页的主内容区块
    document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
    
    // 更新显示
    if (typeof updateDisplay === 'function') {
        updateDisplay();
    }
}

// ==================== 关注/取消关注逻辑（修复版） ====================
function toggleFollow(username) {
    if (!gameState.following) {
        gameState.following = [];
    }
    
    // 查找用户数据
    let userData = gameState.following.find(u => 
        (typeof u === 'object' ? u.username : u) === username
    );
    
    const index = gameState.following.findIndex(u => 
        (typeof u === 'object' ? u.username : u) === username
    );
    
    if (index > -1) {
        // 取消关注
        gameState.following.splice(index, 1);
        showNotification('取消关注', `已取消关注 ${username}`);
        
        // 如果在用户主页，更新按钮
        const profilePage = document.getElementById('userProfilePage');
        if (profilePage && profilePage.classList.contains('active')) {
            const userProfileContent = document.getElementById('userProfilePageContent');
            if (userProfileContent) {
                // 重新渲染用户主页
                const currentUserData = window.cachedUserProfile;
                if (currentUserData && currentUserData.username === username) {
                    renderUserProfile(currentUserData);
                }
            }
        }
        
        // 如果在关注列表页面，重新渲染
        const followingPage = document.getElementById('followingPage');
        if (followingPage && followingPage.classList.contains('active')) {
            renderFollowingList();
        }
    } else {
        // 关注用户
        // 如果之前访问过，使用缓存数据
        if (window.cachedUserProfile && window.cachedUserProfile.username === username) {
            userData = window.cachedUserProfile;
        } else {
            // 生成新用户数据
            userData = {
                username: username,
                avatar: username.charAt(0),
                userId: 'UID' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                fanCount: Math.floor(Math.random() * 50000) + 100,
                workCount: Math.floor(Math.random() * 500) + 10,
                likeCount: Math.floor(Math.random() * 100000) + 1000,
                joinDays: Math.floor(Math.random() * 365) + 1,
                following: Math.floor(Math.random() * 500) + 50,
                bio: getRandomUserBio(),
                isFollowing: false
            };
        }
        
        gameState.following.push(userData);
        showNotification('关注成功', `已关注 ${username}`);
        
        // 如果在用户主页，更新按钮
        const profilePage = document.getElementById('userProfilePage');
        if (profilePage && profilePage.classList.contains('active')) {
            const userProfileContent = document.getElementById('userProfilePageContent');
            if (userProfileContent) {
                renderUserProfile(userData);
            }
        }
        
        // 如果在关注列表页面，重新渲染
        const followingPage = document.getElementById('followingPage');
        if (followingPage && followingPage.classList.contains('active')) {
            renderFollowingList();
        }
    }
    
    updateDisplay();
    saveGame();
}

// ==================== 新增：获取随机用户简介 ====================
function getRandomUserBio() {
    const bios = [
        '热爱生活，喜欢分享',
        '专业主播，认真创作',
        '记录生活中的美好瞬间',
        '努力学习，不断进步',
        '做一个有趣的人',
        '分享快乐，传递正能量',
        '专注内容创作',
        '感谢每一个支持我的人',
        '用心做好每一个作品',
        '梦想成为一名优秀的主播',
        '在平凡的日子里闪闪发光',
        '创作源于生活',
        '记录成长的点点滴滴',
        '感谢您的关注和支持',
        '用心创作，用爱分享'
    ];
    return bios[Math.floor(Math.random() * bios.length)];
}

// ==================== 全局函数绑定 ====================
window.showSettings = showSettings;
window.showProfile = showProfile;
window.showUserProfile = showUserProfile;
window.renderUserProfile = renderUserProfile;
window.cachedUserProfile = window.cachedUserProfile || null;
window.showFollowingList = showFollowingList;
window.toggleFollow = toggleFollow;
window.renderFollowingList = renderFollowingList;
window.showUserProfileFromFollowing = showUserProfileFromFollowing;
window.closeFollowingPage = closeFollowingPage;
window.getRandomUserBio = getRandomUserBio;
window.changeUsername = changeUsername;
window.changeUserId = changeUserId;
window.changeAvatar = changeAvatar;
window.uploadAvatar = uploadAvatar;
window.clearData = clearData;
function showAllWorks() { return window.showAllWorks(); }
window.showAllWorks = showAllWorks;
window.showAchievementsFullscreen = showAchievementsFullscreen;
window.updateLastWorkTime = updateLastWorkTime;
window.toggleDoNotDisturb = toggleDoNotDisturb; // ✅ 导出免打扰切换函数
