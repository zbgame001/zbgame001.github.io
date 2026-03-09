// ==================== 随机事件数据 ====================
const randomEvents = [
    // ========== 新增：热搜邀请类事件（新功能）==========
    { type: 'neutral', title: '热搜邀请', desc: '平台向你发出热搜话题邀请', effect: { hotSearchInvite: true }, weight: 1 }, 
    
    // ========== 新增：视频推荐类事件（新功能）==========
    { type: 'good', title: '视频爆了！', desc: '你的视频被推荐到首页，播放量暴涨', effect: { recommendVideo: true, duration: 1 } }, 
    { type: 'good', title: '病毒传播', desc: '你的视频成为病毒式传播', effect: { recommendVideo: true, duration: 1 } }, 
    
    // ========== 新增：动态热搜类事件（新功能）==========
    { type: 'good', title: '动态热门', desc: '你的动态获得大量曝光', effect: { hotPost: true, duration: 1 } }, 
    
    // ========== 新增：品牌合作事件（新功能）==========
    { type: 'good', title: '品牌合作', desc: '有品牌找你合作推广', effect: { brandDeal: true } }, 
    
    // ========== 恢复：原始热搜事件（重要！恢复概率）==========
    { type: 'good', title: '登上热搜', desc: '你的内容登上平台热搜榜，获得海量曝光', effect: { hotSearch: true } }, 
    { type: 'good', title: '话题引爆', desc: '你制造的话题引发全网讨论', effect: { hotSearch: true } }, 
    { type: 'good', title: '热搜第一', desc: '你的内容登上热搜榜第一名！', effect: { hotSearch: true } },
    
    // ========== 新增：争议类事件（新功能）==========
    // 警告事件权重设为 0.05（极难触发）
    { type: 'bad', title: '内容争议', desc: '你的内容引发争议，有人举报', effect: { controversial: true, duration: 1, addWarning: true }, weight: 0.05 }, 
    { type: 'bad', title: '网络暴力', desc: '你被网暴了，心情低落', effect: { controversial: true, duration: 2, addWarning: false } }, 
    
    // ========== 新增：删除视频类事件（新功能）==========
    // 警告事件权重设为 0.05（极难触发）
    { type: 'bad', title: '系统误判', desc: '系统误判你的内容违规', effect: { removeVideo: true, addWarning: true }, weight: 0.05 }, 
    { type: 'bad', title: '版权争议', desc: '你的视频涉及版权问题', effect: { removeVideo: true, addWarning: true }, weight: 0.05 }, 
    
    // ========== 保持不变的原有事件（duration字段用于热度值增减持续时间）==========
    { type: 'good', title: '大V转发', desc: '知名博主转发了你的作品', effect: { views: 30000, fans: 3000, likes: 2000, duration: 1 } }, 
    { type: 'good', title: '粉丝福利', desc: '粉丝们给你刷了礼物', effect: { money: 1000, likes: 500, duration: 0.5 } }, 
    { type: 'bad', title: '黑粉攻击', desc: '有人组织黑粉攻击你的账号', effect: { fans: -1000, likes: -500, duration: 1 } }, 
    { type: 'bad', title: '竞争对手', desc: '同类型主播抢走了你的流量', effect: { views: -10000, fans: -800, duration: 1 } }, 
    { type: 'neutral', title: '粉丝互动', desc: '和粉丝们聊得很开心', effect: { likes: 100, duration: 0.3 } }, 
    { type: 'bad', title: '恶意投诉', desc: '有人恶意投诉你的直播', effect: { warnings: 1 }, weight: 0.05 }, 
    { type: 'good', title: '平台推荐', desc: '平台给你提供了推荐位', effect: { views: 40000, fans: 4000, duration: 1 } }, 
    { type: 'bad', title: '算法调整', desc: '平台算法调整，流量下降', effect: { views: -15000, duration: 1 } }, 
    { type: 'bad', title: '负面新闻', desc: '关于你的负面新闻在网上传播', effect: { publicOpinion: true } },
    
    // 警告事件权重设为 0.05（极难触发）
    { type: 'bad', title: '争议言论', desc: '你的言论引发争议', effect: { publicOpinion: true }, weight: 0.05 },
    
    // ========== 新增：举报事件 ==========
    { type: 'bad', title: '网友举报', desc: '有网友发现你的商单存在问题，向平台举报', effect: { reportAd: true }, weight: 0.05 },
    
    // ========== 新增：私信相关事件 ==========
    { type: 'neutral', title: '私信轰炸', desc: '有大量的粉丝给你发来私信', effect: { generatePrivateMessages: 3 } },
    { type: 'bad', title: '黑粉骚扰', desc: '有黑粉在私信里辱骂你', effect: { generatePrivateMessages: 2, negative: true, duration: 0.5 } }
];

// ==================== 随机事件处理函数 ====================
function handleRandomEvent(event) {
    let message = event.desc;
    let targetWork = null;
    
    // 初始化事件计数器
    if (!gameState.eventCount) {
        gameState.eventCount = 0;
    }
    
    // 每次触发事件都增加计数器
    gameState.eventCount++;
    
    // ========== 处理热搜邀请事件（新功能）==========
    if (event.effect.hotSearchInvite) {
        // 直接调用系统消息模块的函数
        if (typeof generateHotSearchInvite === 'function') {
            generateHotSearchInvite();
        } else {
            console.error('generateHotSearchInvite函数未找到');
        }
        // ✅ 修改：只显示小弹窗通知，不移除通知中心通知（因为是系统消息）
        showEventPopup(event.title, '热搜邀请已发送至系统消息');
        return; // 热搜邀请由系统消息模块处理，这里不再处理
    }
    
    // ========== 处理视频推荐事件（新功能）==========
    else if (event.effect.recommendVideo) {
        const videos = gameState.worksList.filter(w => w.type === 'video' && !w.isPrivate);
        if (videos.length === 0) return; // 没有视频则静默忽略
        
        targetWork = videos[Math.floor(Math.random() * videos.length)];
        targetWork.isRecommended = true;
        targetWork.recommendEndTime = gameTimer + (event.effect.duration * VIRTUAL_DAY_MS);
        message = `视频《${targetWork.title || targetWork.content.substring(0, 20)}...》${event.desc}`;
        
        // ✅ 修改：启动热度值持续增加（持续duration天）
        if (event.effect.duration && typeof window.startHotValueBoost === 'function') {
            window.startHotValueBoost(event.effect.duration);
            console.log(`[热度值] 视频推荐事件：启动持续增加 ${event.effect.duration} 天`);
            
            // 设置定时器在推荐结束后开始热度值下降
            setTimeout(() => {
                if (typeof window.startHotValueDrop === 'function') {
                    window.startHotValueDrop(event.effect.duration);
                    console.log(`[热度值] 视频推荐结束：启动持续减少 ${event.effect.duration} 天`);
                }
            }, event.effect.duration * VIRTUAL_DAY_MS);
        }
        
        // ✅ 修改：只显示小弹窗通知
        showEventPopup(event.title, message);
        
        // ✅ 检查幸运儿成就
        const luckyAchievement = achievements.find(a => a.id === 15);
        if (luckyAchievement && !luckyAchievement.unlocked) {
            if (gameState.eventCount >= 50) {
                luckyAchievement.unlocked = true;
                gameState.achievements.push(15);
                showAchievementPopup(luckyAchievement);
                showEventPopup('🏆 成就解锁', `${luckyAchievement.name}：${luckyAchievement.desc}`);
                checkAchievements();
            }
        }
        
        startRecommendEffect(targetWork.id, event.effect.duration);
    }
    
    // ========== 处理动态热搜事件（新功能）==========
    else if (event.effect.hotPost) {
        const posts = gameState.worksList.filter(w => w.type === 'post' && !w.isPrivate);
        if (posts.length === 0) return; // 没有动态则静默忽略
        
        targetWork = posts[Math.floor(Math.random() * posts.length)];
        targetWork.isHot = true;
        targetWork.hotEndTime = gameTimer + (event.effect.duration * VIRTUAL_DAY_MS);
        message = `动态《${targetWork.content.substring(0, 20)}...》登上热搜！`;
        
        // ✅ 修改：启动热度值持续增加（持续duration天）
        if (event.effect.duration && typeof window.startHotValueBoost === 'function') {
            window.startHotValueBoost(event.effect.duration);
            console.log(`[热度值] 动态热搜事件：启动持续增加 ${event.effect.duration} 天`);
            
            // 设置定时器在热搜结束后开始热度值下降
            setTimeout(() => {
                if (typeof window.startHotValueDrop === 'function') {
                    window.startHotValueDrop(event.effect.duration);
                    console.log(`[热度值] 动态热搜结束：启动持续减少 ${event.effect.duration} 天`);
                }
            }, event.effect.duration * VIRTUAL_DAY_MS);
        }
        
        // ✅ 修改：只显示小弹窗通知
        showEventPopup(event.title, message);
        
        // ✅ 检查幸运儿成就
        const luckyAchievement = achievements.find(a => a.id === 15);
        if (luckyAchievement && !luckyAchievement.unlocked) {
            if (gameState.eventCount >= 50) {
                luckyAchievement.unlocked = true;
                gameState.achievements.push(15);
                showAchievementPopup(luckyAchievement);
                showEventPopup('🏆 成就解锁', `${luckyAchievement.name}：${luckyAchievement.desc}`);
                checkAchievements();
            }
        }
        
        startPostHotEffect(targetWork.id, event.effect.duration);
    }
    
    // ========== 处理品牌合作事件（新功能）==========
    else if (event.effect.brandDeal) {
        generateBrandDeal();
        message = '有新的品牌合作机会，请在商单中心查看！';
        
        // ✅ 修改：品牌合作增加热度值改为持续模式（持续0.5天，结束后降0.5天）
        if (typeof window.startHotValueBoost === 'function') {
            const duration = 0.5;
            window.startHotValueBoost(duration);
            console.log(`[热度值] 品牌合作事件：启动持续增加 ${duration} 天`);
            
            setTimeout(() => {
                if (typeof window.startHotValueDrop === 'function') {
                    window.startHotValueDrop(duration);
                    console.log(`[热度值] 品牌合作结束：启动持续减少 ${duration} 天`);
                }
            }, duration * VIRTUAL_DAY_MS);
        }
        
        // ✅ 修改：只显示小弹窗通知
        showEventPopup(event.title, message);
        
        // ✅ 检查幸运儿成就
        const luckyAchievement = achievements.find(a => a.id === 15);
        if (luckyAchievement && !luckyAchievement.unlocked) {
            if (gameState.eventCount >= 50) {
                luckyAchievement.unlocked = true;
                gameState.achievements.push(15);
                showAchievementPopup(luckyAchievement);
                showEventPopup('🏆 成就解锁', `${luckyAchievement.name}：${luckyAchievement.desc}`);
                checkAchievements();
            }
        }
    }
    
    // ========== 恢复：处理原始热搜事件（重要！）==========
    else if (event.effect.hotSearch) {
        const title = event.title || '🔥 话题热议中';
        startHotSearch(title);
        
        // ✅ 修改：只显示小弹窗通知
        showEventPopup(event.title, event.desc);
        
        // ✅ 检查幸运儿成就
        const luckyAchievement = achievements.find(a => a.id === 15);
        if (luckyAchievement && !luckyAchievement.unlocked) {
            if (gameState.eventCount >= 50) {
                luckyAchievement.unlocked = true;
                gameState.achievements.push(15);
                showAchievementPopup(luckyAchievement);
                showEventPopup('🏆 成就解锁', `${luckyAchievement.name}：${luckyAchievement.desc}`);
                checkAchievements();
            }
        }
    }
    
    // ========== 处理争议事件（新功能 - 修改为负面热度机制）==========
    else if (event.effect.controversial) {
        const videos = gameState.worksList.filter(w => w.type === 'video' && !w.isPrivate && !w.isControversial);
        if (videos.length > 0) {
            targetWork = videos[Math.floor(Math.random() * videos.length)];
            targetWork.isControversial = true;
            targetWork.controversyEndTime = gameTimer + (event.effect.duration * VIRTUAL_DAY_MS);
            message = `视频《${targetWork.title || targetWork.content.substring(0, 20)}...》${event.desc}`;
            
            // ✅ 修改为负面热度机制：启动7天增长期
            if (typeof window.startNegativeHotValueBoost === 'function') {
                window.startNegativeHotValueBoost(7);
                console.log(`[负面热度] 内容争议事件：启动7天增长期`);
            }
            
            // ✅ 修改：只显示小弹窗通知
            showEventPopup(event.title, message);
            
            // ✅ 检查幸运儿成就
            const luckyAchievement = achievements.find(a => a.id === 15);
            if (luckyAchievement && !luckyAchievement.unlocked) {
                if (gameState.eventCount >= 50) {
                    luckyAchievement.unlocked = true;
                    gameState.achievements.push(15);
                    showAchievementPopup(luckyAchievement);
                    showEventPopup('🏆 成就解锁', `${luckyAchievement.name}：${luckyAchievement.desc}`);
                    checkAchievements();
                }
            }
            
            startControversyEffect(targetWork.id, event.effect.duration);
            if (event.effect.addWarning) {
                gameState.warnings = Math.min(20, gameState.warnings + Math.floor(Math.random() * 2) + 1);
                
                // ✅ 添加警告历史记录
                if (typeof addWarningToHistory === 'function') {
                    addWarningToHistory('CONTENT_VIOLATION', 
                        '内容引发争议被举报', 
                        '');
                }
                
                showWarning(`内容违规，警告${gameState.warnings}/20次`);
            }
        } else {
            // 没有合适的视频，静默忽略（原有弹窗已移除）
            return;
        }
    }
    
    // ========== 处理删除视频事件（新功能 - 修改为负面热度机制）==========
    else if (event.effect.removeVideo) {
        const videos = gameState.worksList.filter(w => w.type === 'video' && !w.isPrivate);
        if (videos.length > 0) {
            targetWork = videos[Math.floor(Math.random() * videos.length)];
            const workIndex = gameState.worksList.findIndex(w => w.id === targetWork.id);
            
            // 从统计数据中减去该视频的贡献
            gameState.views = Math.max(0, gameState.views - targetWork.views);
            gameState.likes = Math.max(0, gameState.likes - targetWork.likes);
            const interactionCount = targetWork.comments + targetWork.likes + targetWork.shares;
            gameState.totalInteractions = Math.max(0, gameState.totalInteractions - interactionCount);
            
            // 更新作品计数器（关键修复）
            gameState.works = Math.max(0, gameState.works - 1);
            
            // 从列表中删除视频
            gameState.worksList.splice(workIndex, 1);
            
            message = `视频《${targetWork.title || targetWork.content.substring(0, 20)}...》因${event.desc}被删除`;
            
            // ✅ 修改为负面热度机制：启动7天增长期
            if (typeof window.startNegativeHotValueBoost === 'function') {
                window.startNegativeHotValueBoost(7);
                console.log(`[负面热度] 视频删除事件：启动7天增长期`);
            }
            
            // ✅ 修改：只显示小弹窗通知
            showEventPopup(event.title, message);
            
            // ✅ 检查幸运儿成就
            const luckyAchievement = achievements.find(a => a.id === 15);
            if (luckyAchievement && !luckyAchievement.unlocked) {
                if (gameState.eventCount >= 50) {
                    luckyAchievement.unlocked = true;
                    gameState.achievements.push(15);
                    showAchievementPopup(luckyAchievement);
                    showEventPopup('🏆 成就解锁', `${luckyAchievement.name}：${luckyAchievement.desc}`);
                    checkAchievements();
                }
            }
            
            // 清理可能存在的定时器
            if (targetWork.recommendInterval) {
                clearInterval(targetWork.recommendInterval);
            }
            if (targetWork.controversyInterval) {
                clearInterval(targetWork.controversyInterval);
            }
            if (targetWork.hotInterval) {
                clearInterval(targetWork.hotInterval);
            }
            if (targetWork.fanGrowthInterval) {
                clearInterval(targetWork.fanGrowthInterval);
            }
            
            if (event.effect.addWarning) {
                gameState.warnings = Math.min(20, gameState.warnings + Math.floor(Math.random() * 2) + 1);
                
                // ✅ 添加警告历史记录
                if (typeof addWarningToHistory === 'function') {
                    addWarningToHistory(event.title.includes('版权') ? 'COPYRIGHT_ISSUE' : 'SYSTEM_ERROR', 
                        event.desc, 
                        targetWork.title || targetWork.content.substring(0, 50));
                }
                
                showWarning(`内容违规，警告${gameState.warnings}/20次`);
            }
        } else {
            // 没有可删除的视频，静默忽略
            return;
        }
    }
    
    // ========== 处理举报事件（修改为负面热度机制）==========
    else if (event.effect.reportAd) {
        const fakeAdWorks = gameState.worksList.filter(work => 
            work.isAd && work.adOrder && !work.adOrder.real && !work.adOrder.isExposed && !work.isPrivate
        );
        
        if (fakeAdWorks.length > 0) {
            const targetWork = fakeAdWorks[Math.floor(Math.random() * fakeAdWorks.length)];
            targetWork.adOrder.isExposed = true;
            targetWork.hasNegativeComments = true;
            
            const fine = Math.floor(targetWork.adOrder.actualReward * 1.5);
            gameState.money = Math.max(0, gameState.money - fine);
            gameState.warnings = Math.min(20, gameState.warnings + 3);
            
            // ✅ 修改为负面热度机制：启动7天增长期
            if (typeof window.startNegativeHotValueBoost === 'function') {
                window.startNegativeHotValueBoost(7);
                console.log(`[负面热度] 虚假商单举报事件：启动7天增长期`);
            }
            
            // ✅ 强制结束直播
            if (gameState.liveStatus && typeof endLiveStream === 'function') {
                endLiveStream();
                // ✅ 修改：使用小弹窗通知
                if (typeof showEventPopup === 'function') {
                    showEventPopup('🚫 直播中断', '账号被举报，直播已强制结束');
                }
            }
            
            // ✅ 停止所有推广
            Object.keys(gameState.trafficWorks).forEach(workId => {
                if (typeof stopTrafficForWork === 'function') {
                    stopTrafficForWork(workId);
                }
            });
            
            // 开始掉粉惩罚（修复版：不会重置已有惩罚）
            startFakeAdFanLoss([targetWork]);
            
            // 舆论风波
            if (typeof startPublicOpinionCrisis === 'function') {
                startPublicOpinionCrisis('⚠️ 虚假商单被曝光');
            }
            
            // ✅ 添加警告历史记录（虚假商单被举报）
            if (typeof addWarningToHistory === 'function') {
                addWarningToHistory('FAKE_AD', 
                    `虚假商单"${targetWork.adOrder.title}"被网友举报`, 
                    targetWork.content.substring(0, 50) + (targetWork.content.length > 50 ? '...' : ''));
            }
            
            // ✅ 修复：如果作品有粉丝增长定时器，清理它
            if (targetWork.fanGrowthInterval) {
                clearInterval(targetWork.fanGrowthInterval);
                targetWork.fanGrowthInterval = null;
                targetWork.growthEndTime = null;
                console.log(`[举报曝光] 作品 ${targetWork.id} 的粉丝增长定时器已清理`);
            }
            
            // ✅ 修改：使用涨掉粉通知系统（罚款通知仍在通知中心）
            showEventPopup('🚨 虚假商单被曝光！', `罚款${fine.toLocaleString()}元，警告+3，粉丝开始流失！`);
            
            if (typeof showWarning === 'function') {
                showWarning(`虚假商单被曝光！警告${gameState.warnings}/20次`);
            }
            
            // ✅ 检查负面成就
            // 赌徒成就（完成10个虚假商单）
            const gamblerAchievement = achievements.find(a => a.id === 26);
            if (gamblerAchievement && !gamblerAchievement.unlocked) {
                const fakeAdWorks = gameState.worksList.filter(w => 
                    w.isAd && w.adOrder && !w.adOrder.real && !w.isPrivate
                );
                if (fakeAdWorks.length >= 10) {
                    gamblerAchievement.unlocked = true;
                    gameState.achievements.push(26);
                    showAchievementPopup(gamblerAchievement);
                    showEventPopup('🏆 负面成就解锁', `赌徒：完成10个虚假商单`);
                    checkAchievements();
                }
            }
            
            // 身败名裂成就（因虚假商单被封号3次）
            const disgraceAchievement = achievements.find(a => a.id === 27);
            if (disgraceAchievement && !disgraceAchievement.unlocked) {
                if (!gameState.fakeAdBans) gameState.fakeAdBans = 0;
                gameState.fakeAdBans += 1;
                if (gameState.fakeAdBans >= 3) {
                    disgraceAchievement.unlocked = true;
                    gameState.achievements.push(27);
                    showAchievementPopup(disgraceAchievement);
                    showEventPopup('🏆 负面成就解锁', `身败名裂：因虚假商单被封号3次`);
                    checkAchievements();
                }
            }
        } else {
            showAlert('举报风波', '有网友质疑你的内容，但未被证实');
        }
    }
    
    // ========== 处理私信生成事件（修改为负面热度机制）==========
    else if (event.effect.generatePrivateMessages) {
        const count = event.effect.generatePrivateMessages || 1;
        const isNegative = event.effect.negative || false;
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                // 如果是负面事件，强制生成负面消息
                if (isNegative) {
                    const userData = generateRandomPrivateMessageUser();
                    const conversation = gameState.privateMessageSystem.conversations.find(c => c.username === userData.username);
                    if (conversation && Math.random() < 0.7) {
                        // 70%概率生成负面消息
                        generatePrivateMessage();
                    }
                } else {
                    generatePrivateMessage();
                }
            }, i * 1000);
        }
        
        // ✅ 修改为负面热度机制：黑粉骚扰启动7天增长期
        if (isNegative && typeof window.startNegativeHotValueBoost === 'function') {
            window.startNegativeHotValueBoost(7);
            console.log(`[负面热度] 黑粉骚扰事件：启动7天增长期`);
        }
        
        // ✅ 修改：只显示小弹窗通知
        showEventPopup(event.title, event.desc);
        
        // ✅ 检查幸运儿成就
        const luckyAchievement = achievements.find(a => a.id === 15);
        if (luckyAchievement && !luckyAchievement.unlocked) {
            if (gameState.eventCount >= 50) {
                luckyAchievement.unlocked = true;
                gameState.achievements.push(15);
                showAchievementPopup(luckyAchievement);
                showEventPopup('🏆 成就解锁', `${luckyAchievement.name}：${luckyAchievement.desc}`);
                checkAchievements();
            }
        }
    }
    
    // ========== 处理原有直接效果事件（修改为负面热度机制 + 掉粉加成）==========
    else {
        // ✅ 修改：处理直接粉丝变化效果，并正确记录到今日统计，添加负面热度掉粉加成
        if (event.effect.fans) {
            let change = event.effect.fans;
            
            // ✅ 如果是掉粉且是负面事件，应用负面热度加成
            if (change < 0 && event.type === 'bad') {
                if (typeof window.getNegativeHotValueRatio === 'function') {
                    const negativeRatio = window.getNegativeHotValueRatio();
                    if (negativeRatio > 0) {
                        const bonusLoss = Math.floor(Math.abs(change) * negativeRatio * 0.5); // 最多额外50%掉粉
                        change -= bonusLoss; // change已经是负数，再减就是更多负数
                        console.log(`[随机事件掉粉] 基础掉粉:${Math.abs(event.effect.fans)}, 负面热度加成:${bonusLoss}, 总掉粉:${Math.abs(change)}`);
                    }
                }
            }
            
            gameState.fans = Math.max(0, gameState.fans + change);
            
            // ✅ 记录到今日统计
            if (change > 0) {
                gameState.todayNewFans += change; // 涨粉
                // ✅ 添加涨粉通知
                addFanChangeNotification('⬆️', `获得了${change.toLocaleString()}个新粉丝`, event.title, 'gain', change);
            } else if (change < 0) {
                gameState.todayLostFans += Math.abs(change); // 掉粉
                // ✅ 添加掉粉通知
                addFanChangeNotification('⬇️', `失去了${Math.abs(change).toLocaleString()}个粉丝`, event.title, 'loss', Math.abs(change));
            }
        }
        
        if (event.effect.likes) gameState.likes = Math.max(0, gameState.likes + event.effect.likes);
        if (event.effect.views) gameState.views = Math.max(0, gameState.views + event.effect.views);
        if (event.effect.money) gameState.money = Math.max(0, gameState.money + event.effect.money);
        if (event.effect.warnings) gameState.warnings = Math.min(20, gameState.warnings + event.effect.warnings);
        if (event.effect.publicOpinion) startPublicOpinionCrisis(event.title);
        
        // ✅ 修改：处理带duration字段的普通事件（负面事件改为负面热度机制）
        if (event.effect.duration) {
            const isBadEvent = event.type === 'bad';
            
            if (isBadEvent) {
                // ✅ 负面事件：启动负面热度7天增长期
                if (typeof window.startNegativeHotValueBoost === 'function') {
                    window.startNegativeHotValueBoost(7);
                    console.log(`[负面热度] ${event.title}：启动7天增长期`);
                }
            } else {
                // 正面或中性事件：先升热度值，结束后降热度值（保持原有逻辑）
                if (typeof window.startHotValueBoost === 'function') {
                    window.startHotValueBoost(event.effect.duration);
                    console.log(`[热度值] ${event.title}：启动持续增加 ${event.effect.duration} 天`);
                    
                    setTimeout(() => {
                        if (typeof window.startHotValueDrop === 'function') {
                            window.startHotValueDrop(event.effect.duration);
                            console.log(`[热度值] ${event.title}结束：启动持续减少 ${event.effect.duration} 天`);
                        }
                    }, event.effect.duration * VIRTUAL_DAY_MS);
                }
            }
        }
        
        // ✅ 检查幸运儿成就
        const luckyAchievement = achievements.find(a => a.id === 15);
        if (luckyAchievement && !luckyAchievement.unlocked) {
            if (gameState.eventCount >= 50) {
                luckyAchievement.unlocked = true;
                gameState.achievements.push(15);
                showAchievementPopup(luckyAchievement);
                showEventPopup('🏆 成就解锁', `${luckyAchievement.name}：${luckyAchievement.desc}`);
                checkAchievements();
            }
        }
        
        // ✅ 修改：只显示小弹窗通知
        showEventPopup(event.title, event.desc);
    }
    
    if (!gameState.isBanned && gameState.warnings >= 20) banAccount('多次违反社区规定');
    if (typeof updateDisplay === 'function') updateDisplay();
}

// ==================== 新增：视频推荐效果（支持恢复模式）==========
function startRecommendEffect(workId, durationDays, isResume = false) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRecommended) return;
    
    if (work.recommendInterval) clearInterval(work.recommendInterval);
    
    work.recommendInterval = setInterval(() => {
        if (gameTimer >= work.recommendEndTime) {
            endRecommendEffect(workId);
            return;
        }
        
        const viewsBoost = Math.floor(Math.random() * 4000) + 1000;
        const likesBoost = Math.floor(Math.random() * 400) + 100;
        let fanBoost = Math.floor(Math.random() * 40) + 10;
        
        // ✅ 新增：应用热度值倍数（只影响涨粉）
        if (fanBoost > 0) {
            const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
                ? window.getHotValueMultiplier() 
                : 1.0;
            fanBoost = Math.floor(fanBoost * hotMultiplier);
        }
        
        work.views += viewsBoost;
        gameState.views += viewsBoost;
        work.likes += likesBoost;
        gameState.likes += likesBoost;
        gameState.fans += fanBoost;
        
        // ✅ 修复：记录到今日新增粉丝
        gameState.todayNewFans += fanBoost;
        
        // ✅ 修复：添加涨粉通知
        if (Math.random() < 0.3) { // 30%概率显示通知，避免刷屏
            addFanChangeNotification('⬆️', `视频推荐获得${fanBoost.toLocaleString()}个新粉丝`, '视频推荐', 'gain', fanBoost);
        }
        
        updateDisplay();
        updateWorksList();
    }, 1000);
    
    // 只在非恢复模式下显示通知
    if (!isResume) {
        // ✅ 修改：使用小弹窗通知
        showEventPopup('🔥 视频推荐', `视频《${work.title || work.content.substring(0, 20)}...》获得平台推荐！`);
    }
}

function endRecommendEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isRecommended) return;
    
    if (work.recommendInterval) clearInterval(work.recommendInterval);
    work.isRecommended = false;
    work.recommendEndTime = null;
    work.recommendInterval = null;
    
    // ✅ 修改：推荐结束不再单独处理热度值（由主事件循环处理）
    
    // ✅ 修改：使用小弹窗通知
    showEventPopup('推荐结束', `视频《${work.title || work.content.substring(0, 20)}...》的热度推荐已结束`);
    updateDisplay();
    updateWorksList();
}

// ==================== 新增：动态热搜效果（支持恢复模式）==========
function startPostHotEffect(workId, durationDays, isResume = false) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isHot) return;
    
    if (work.hotInterval) clearInterval(work.hotInterval);
    
    work.hotInterval = setInterval(() => {
        if (gameTimer >= work.hotEndTime) {
            endPostHotEffect(workId);
            return;
        }
        
        const viewsBoost = Math.floor(Math.random() * 1500) + 500;
        const likesBoost = Math.floor(Math.random() * 30) + 5;
        const commentsBoost = Math.floor(Math.random() * 10) + 2;
        let fanBoost = Math.floor(Math.random() * 25) + 5;
        
        // ✅ 新增：应用热度值倍数（只影响涨粉）
        if (fanBoost > 0) {
            const hotMultiplier = (typeof window.getHotValueMultiplier === 'function') 
                ? window.getHotValueMultiplier() 
                : 1.0;
            fanBoost = Math.floor(fanBoost * hotMultiplier);
        }
        
        work.views += viewsBoost;
        work.likes += likesBoost;
        work.comments += commentsBoost;
        gameState.fans += fanBoost;
        
        // ✅ 修复：记录到今日新增粉丝
        gameState.todayNewFans += fanBoost;
        
        // ✅ 修复：添加涨粉通知
        if (Math.random() < 0.3) { // 30%概率显示通知
            addFanChangeNotification('⬆️', `动态热搜获得${fanBoost.toLocaleString()}个新粉丝`, '动态热搜', 'gain', fanBoost);
        }
        
        updateDisplay();
        updateWorksList();
    }, 1000);
    
    if (!isResume) {
        // ✅ 修改：使用小弹窗通知
        showEventPopup('🔥 动态热搜', `动态《${work.content.substring(0, 20)}...》登上热搜！`);
    }
}

function endPostHotEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isHot) return;
    
    if (work.hotInterval) clearInterval(work.hotInterval);
    work.isHot = false;
    work.hotEndTime = null;
    work.hotInterval = null;
    
    // ✅ 修改：动态热搜结束不再单独处理热度值（由主事件循环处理）
    
    // ✅ 修改：使用小弹窗通知
    showEventPopup('热搜结束', `动态《${work.content.substring(0, 20)}...》的热搜已结束`);
    updateDisplay();
    updateWorksList();
}

// ==================== 新增：争议效果（支持恢复模式 - 添加负面热度掉粉加成）==========
function startControversyEffect(workId, durationDays, isResume = false) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isControversial) return;
    
    if (work.controversyInterval) clearInterval(work.controversyInterval);
    
    work.controversyInterval = setInterval(() => {
        if (gameTimer >= work.controversyEndTime) {
            endControversyEffect(workId);
            return;
        }
        
        let fanLoss = Math.floor(Math.random() * 30) + 20;
        
        // ✅ 应用负面热度掉粉加成
        if (typeof window.getNegativeHotValueRatio === 'function') {
            const negativeRatio = window.getNegativeHotValueRatio();
            if (negativeRatio > 0) {
                const bonusLoss = Math.floor(fanLoss * negativeRatio * 0.5); // 最多额外50%掉粉
                fanLoss += bonusLoss;
            }
        }
        
        gameState.fans = Math.max(0, gameState.fans - fanLoss);
        
        // ✅ 修复：记录到今日取关数
        gameState.todayLostFans += fanLoss;
        
        // ✅ 修复：添加掉粉通知
        if (Math.random() < 0.2) { // 20%概率显示通知，避免刷屏
            addFanChangeNotification('⬇️', `视频争议导致失去${fanLoss.toLocaleString()}个粉丝`, '内容争议', 'loss', fanLoss);
        }
        
        if (work.likes > 0) {
            const likesLoss = Math.floor(Math.random() * 10) + 1;
            work.likes = Math.max(0, work.likes - likesLoss);
            gameState.likes = Math.max(0, gameState.likes - likesLoss);
        }
        
        // 视频争议粉丝持续流失的弹窗通知已删除
        
    }, 1000);
    
    if (!isResume) {
        // ✅ 修改：使用小弹窗通知
        showEventPopup('⚠️ 内容争议', `视频《${work.title || work.content.substring(0, 20)}...》引发争议！`);
    }
}

function endControversyEffect(workId) {
    const work = gameState.worksList.find(w => w.id === workId);
    if (!work || !work.isControversial) return;
    
    if (work.controversyInterval) clearInterval(work.controversyInterval);
    work.isControversial = false;
    work.controversyEndTime = null;
    work.controversyInterval = null;
    
    // ✅ 修改：争议平息不再单独处理热度值（由主事件循环处理）
    
    // ✅ 修改：使用小弹窗通知
    showEventPopup('争议平息', `视频《${work.title || work.content.substring(0, 20)}...》的争议已平息`);
    updateDisplay();
    updateWorksList();
}

// ==================== 新增：生成品牌合作 ==========
function generateBrandDeal() {
    const brands = ['知名品牌', '热门品牌', '新兴品牌', '国际大牌', '国货之光'];
    const products = ['健康饮品', '学习APP', '生活用品', '美容护肤', '游戏周边'];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const reward = Math.floor(Math.random() * 50000) + 5000;
    
    gameState.pendingBrandDeal = {
        id: Date.now(),
        title: `${brand}${product}推广`,
        content: `${brand}推出新款${product}，邀请你进行体验推广，要求真实体验分享`,
        actualReward: reward,
        risk: 0.2,
        isBrandDeal: true,
        status: 'pending'
    };
    
    // ✅ 修改：使用小弹窗通知
    showEventPopup('品牌合作', `你有新的品牌合作机会：${gameState.pendingBrandDeal.title}，报酬${reward}元`);
}

// ==================== 全局函数绑定 ====================
window.randomEvents = randomEvents;
window.handleRandomEvent = handleRandomEvent;
window.startRecommendEffect = startRecommendEffect;
window.endRecommendEffect = endRecommendEffect;
window.startPostHotEffect = startPostHotEffect;
window.endPostHotEffect = endPostHotEffect;
window.startControversyEffect = startControversyEffect;
window.endControversyEffect = endControversyEffect;
window.generateBrandDeal = generateBrandDeal;