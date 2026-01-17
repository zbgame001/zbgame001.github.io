// ==================== 评论互动系统（带存储优化 + 无限制点赞 + 点赞增长 + 分页按需生成） ====================

// 评论存储限制配置
const COMMENTS_STORAGE_LIMIT = {
    maxRealComments: 50,  // 每个作品最多存储50条真实评论
    cleanupThreshold: 100, // 超过100条时触发清理
    keepRecentDays: 7      // 保留最近7天作品的评论
};

// 评论点赞自动增长定时器
window.commentLikesGrowthInterval = null;

// 评论生成缓存 - 记录每个作品已生成的评论
window.commentsGenerationCache = {};

// ==================== 新增：评论点赞数格式化函数 ====================
function formatCommentLikes(likes) {
    likes = Number(likes) || 0;
    if (likes > 99) {
        return '99+';
    }
    return likes.toString();
}

// 获取排序后的评论
function getSortedComments(comments, sortType) {
    const sorted = [...comments];
    switch(sortType) {
        case 'hottest':
            return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        case 'asc':
            return sorted.sort((a, b) => (a.time || 0) - (b.time || 0));
        case 'desc':
            return sorted.sort((a, b) => (b.time || 0) - (a.time || 0));
        default:
            return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
}

// 生成虚拟评论（初始点赞数为1-10000随机）
function generateVirtualComments(work, count, page = 0, commentsPerPage = 10) {
    const comments = [];
    const users = ['小可爱', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子', 
                   '快乐小天使', '追星族', '游戏迷', '文艺青年', '美食家', '旅行达人', '摄影师', '音乐人'];
    const contents = ['太棒了！', '支持主播！', '666', '拍得真好', '来了来了', '前排围观', '主播辛苦了', '加油加油', 
                      '很好看', '不错不错', '学习了', '收藏了', '转发支持', '期待更新', '主播最美', '最棒的主播', 
                      '今天状态真好', '这个内容有意思', '讲得很详细', '受益匪浅', '主播人真好', '互动很棒', '直播很有趣'];

    const now = gameTimer;
    const workTime = work.time || now;

    // 生成当前页的评论
    for (let i = 0; i < count; i++) {
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const maxOffset = Math.max(0, now - workTime);
        const offset = Math.floor((Math.random() * Math.random()) * maxOffset);
        const commentTime = Math.min(workTime + offset, now);

        // 虚拟评论对象（初始点赞数为1-10000随机）
        const comment = { 
            user: username,
            avatar: baseUser.charAt(0),
            content: contents[Math.floor(Math.random() * contents.length)], 
            // ✅ 初始点赞数为1-10000随机
            likes: Math.floor(Math.random() * 10000) + 1,
            time: commentTime,
            isVirtual: true,  // 标记为虚拟评论
            pageGenerated: page  // 记录生成的页码
        };
        
        comments.push(comment);
    }
    
    return comments;
}

// 生成真实评论（用于存储，初始点赞数为1-10000随机）
function generateRealComments(work, count, existingCount = 0) {
    const comments = [];
    const users = ['小可爱', '直播达人', '路人甲', '粉丝一号', '吃瓜群众', '热心网友', '匿名用户', '夜猫子'];
    const contents = ['太棒了！', '支持主播！', '666', '拍得真好', '来了来了', '前排围观', '主播辛苦了', '加油加油'];

    const now = gameTimer;
    const workTime = work.time || now;

    for (let i = 0; i < count; i++) {
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const maxOffset = Math.max(0, now - workTime);
        const offset = Math.floor((Math.random() * Math.random()) * maxOffset);
        const commentTime = Math.min(workTime + offset, now);

        // 真实评论对象（精简字段，初始点赞数为1-10000随机）
        const comment = { 
            user: username,
            content: contents[Math.floor(Math.random() * contents.length)], 
            // ✅ 初始点赞数为1-10000随机
            likes: Math.floor(Math.random() * 10000) + 1,
            time: commentTime,
            isNegative: false,
            isVirtual: false
        };
        
        comments.push(comment);
    }
    
    return comments;
}

// 主评论生成函数（按需生成版）
function generateComments(work, count, page = 0, commentsPerPage = 10) {
    const hasViolation = work.hasNegativeComments && typeof window.generateCommentsWithNegative === 'function';
    if (hasViolation) {
        return window.generateCommentsWithNegative(work, count, page, commentsPerPage);
    }

    // 优先使用虚拟评论，不占用存储
    return generateVirtualComments(work, count, page, commentsPerPage);
}

// 获取或生成指定页面的评论（核心优化函数）
function getOrGenerateCommentsForPage(work, page, commentsPerPage) {
    // ✅ 确保参数为数字
    page = parseInt(page) || 0;
    commentsPerPage = parseInt(commentsPerPage) || 10;
    
    // 初始化缓存
    if (!window.commentsGenerationCache[work.id]) {
        window.commentsGenerationCache[work.id] = {
            generatedPages: new Set(),
            comments: {}
        };
    }
    
    const cache = window.commentsGenerationCache[work.id];
    
    // 如果已经生成过这一页，直接返回
    if (cache.generatedPages.has(page)) {
        console.log(`[评论生成] 作品 ${work.id} 第 ${page} 页已生成过，使用缓存`);
        const startIndex = page * commentsPerPage;
        const comments = [];
        for (let i = 0; i < commentsPerPage; i++) {
            const comment = cache.comments[startIndex + i];
            if (comment) {
                comments.push(comment);
            }
        }
        return comments;
    }
    
    // 否则生成这一页的评论
    console.log(`[评论生成] 作品 ${work.id} 第 ${page} 页首次生成`);
    
    // 计算需要生成的评论数量
    const remainingComments = work.comments - page * commentsPerPage;
    const count = Math.min(commentsPerPage, Math.max(0, remainingComments));
    
    // 生成评论
    const newComments = generateComments(work, count, page, commentsPerPage);
    
    // 保存到缓存
    const startIndex = page * commentsPerPage;
    newComments.forEach((comment, index) => {
        cache.comments[startIndex + index] = comment;
    });
    
    cache.generatedPages.add(page);
    
    return newComments;
}

// 清空评论缓存（当作品评论数更新或作品删除时调用）
function clearCommentsCache(workId) {
    if (window.commentsGenerationCache[workId]) {
        delete window.commentsGenerationCache[workId];
        console.log(`[评论缓存] 清空作品 ${workId} 的缓存`);
    }
}

// 清空所有评论缓存
function clearAllCommentsCache() {
    window.commentsGenerationCache = {};
    console.log('[评论缓存] 清空所有缓存');
}

// ✅ 增强版：评论点赞数自动增长函数（使用1-10000随机增长）
function updateCommentLikes(work) {
    if (!work || !work.commentsList || work.commentsList.length === 0) return;
    
    // 每条评论有30%概率获得1-10000个点赞（增长概率和数量大幅提高）
    work.commentsList.forEach(comment => {
        if (Math.random() < 0.3) {
            const likeIncrease = Math.floor(Math.random() * 10000) + 1;
            comment.likes = (comment.likes || 0) + likeIncrease;
        }
    });
}

// ✅ 全局评论点赞增长定时器（每5秒执行一次）
function startGlobalCommentLikesGrowth() {
    // 停止已存在的定时器
    if (window.commentLikesGrowthInterval) {
        clearInterval(window.commentLikesGrowthInterval);
    }
    
    console.log('启动全局评论点赞增长系统...');
    
    // 每5秒执行一次点赞增长
    window.commentLikesGrowthInterval = setInterval(() => {
        if (gameState.worksList && gameState.worksList.length > 0) {
            // 随机选择一个作品进行评论点赞增长
            const randomWork = gameState.worksList[Math.floor(Math.random() * gameState.worksList.length)];
            if (randomWork && randomWork.commentsList && randomWork.commentsList.length > 0) {
                updateCommentLikes(randomWork);
                console.log(`[评论点赞增长] 作品 ${randomWork.id} 的评论点赞数已更新`);
            }
        }
    }, 5000);
}

// 点赞评论（修复版 - 立即更新UI + 无限制点赞）
function likeComment(workId, commentIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work) return;

    // 获取当前显示的评论列表（包括虚拟评论）
    const comments = getOrGenerateCommentsForPage(work, window.currentCommentPage - 1, window.commentsPerPage);
    const comment = comments[commentIndex];
    if (!comment) return;

    // 如果是虚拟评论，先转为真实评论再存储
    if (comment.isVirtual) {
        convertVirtualCommentToReal(work, comment);
    }

    const commentKey = `${workId}_${commentIndex}_${comment.time}`;
    
    if (!gameState.commentLikes) {
        gameState.commentLikes = {};
    }
    
    if (gameState.commentLikes[commentKey]) {
        showWarning('你已经点赞过这条评论了！');
        return;
    }

    gameState.commentLikes[commentKey] = true;
    
    // 找到对应的真实评论并增加点赞
    if (work.commentsList && work.commentsList.length > 0) {
        const realComment = work.commentsList.find(c => 
            c.time === comment.time && c.user === comment.user
        );
        if (realComment) {
            // ✅ 移除99上限，允许无限点赞
            realComment.likes = (realComment.likes || 0) + 1;
        }
    }

    work.likes += 1;
    gameState.likes += 1;

    // 生成点赞消息（异步）
    setTimeout(() => {
        if (!gameState.messages) gameState.messages = [];
        gameState.messages.push({
            id: Date.now(),
            type: 'like',
            user: generateRandomUsername(),
            workId: work.id,
            workContent: work.content.substring(0, 30) + (work.content.length > 30 ? '...' : ''),
            time: gameTimer,
            read: false
        });
        
        // 限制消息数量
        if (gameState.messages.length > 200) {
            gameState.messages = gameState.messages.slice(-150);
        }
    }, 0);

    // ✅ 修复：立即更新UI - 更新整个评论项，包括爱心图标和数字
    const element = document.querySelector(`[data-comment-index="${commentIndex}"]`);
    if (element) {
        const likeBtn = element.querySelector('.comment-action');
        if (likeBtn) {
            // 立即改变爱心颜色并更新数字（使用formatCommentLikes格式化）
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = `❤️ <span>${formatCommentLikes((comment.likes || 0) + 1)}</span>`;
        }
    }

    showNotification('点赞成功', '你点赞了一条评论');
    updateDisplay();
    saveGame();
}

// 将虚拟评论转换为真实评论
function convertVirtualCommentToReal(work, virtualComment) {
    if (!work.commentsList) {
        work.commentsList = [];
    }

    // 检查是否已存在
    const exists = work.commentsList.some(c => 
        c.time === virtualComment.time && c.user === virtualComment.user
    );
    
    if (exists) return;

    // 清理旧评论（如果超过限制）
    if (work.commentsList.length >= COMMENTS_STORAGE_LIMIT.cleanupThreshold) {
        cleanupOldComments(work);
    }

    // 转换为真实评论并存储（精简字段）
    const realComment = {
        user: virtualComment.user,
        content: virtualComment.content,
        likes: virtualComment.likes || 0,
        time: virtualComment.time,
        isNegative: virtualComment.isNegative || false
    };
    
    work.commentsList.push(realComment);
    
    // 再次检查上限
    if (work.commentsList.length > COMMENTS_STORAGE_LIMIT.maxRealComments) {
        work.commentsList.sort((a, b) => b.time - a.time);
        work.commentsList = work.commentsList.slice(0, COMMENTS_STORAGE_LIMIT.maxRealComments);
    }
}

// 清理旧评论
function cleanupOldComments(work) {
    if (!work.commentsList || work.commentsList.length === 0) return;

    // 按时间排序（最新的在前）
    work.commentsList.sort((a, b) => b.time - a.time);
    
    // 删除超过7天的旧评论
    const cutoffTime = gameTimer - (COMMENTS_STORAGE_LIMIT.keepRecentDays * VIRTUAL_DAY_MS);
    work.commentsList = work.commentsList.filter(c => c.time > cutoffTime);
    
    // 如果还超过上限，删除最旧的
    if (work.commentsList.length > COMMENTS_STORAGE_LIMIT.maxRealComments) {
        work.commentsList = work.commentsList.slice(0, COMMENTS_STORAGE_LIMIT.maxRealComments);
    }
}

// 清理所有作品的评论数据
function cleanupAllWorksComments() {
    let totalCleaned = 0;
    gameState.worksList.forEach(work => {
        if (work.commentsList && work.commentsList.length > 0) {
            const before = work.commentsList.length;
            cleanupOldComments(work);
            totalCleaned += before - (work.commentsList.length || 0);
        }
    });
    
    if (totalCleaned > 0) {
        console.log(`[评论清理] 共清理 ${totalCleaned} 条旧评论`);
        saveGame();
    }
}

// 退出作品详情时清理评论（✅ 新增：自动删除已存储的评论，不显示通知）
function cleanupWorkCommentsOnExit(workId) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;
    
    // 保留最近30条评论，其余删除
    const keepCount = 30;
    if (work.commentsList.length > keepCount) {
        const before = work.commentsList.length;
        
        // 按时间排序，保留最新的
        work.commentsList.sort((a, b) => b.time - a.time);
        work.commentsList = work.commentsList.slice(0, keepCount);
        
        const cleanedCount = before - work.commentsList.length;
        console.log(`[作品详情退出] 作品 ${workId} 清理了 ${cleanedCount} 条评论，保留 ${work.commentsList.length} 条`);
        
        // ✅ 移除通知，只清理不提示
        if (cleanedCount > 0) {
            saveGame();
            // showNotification('缓存清理', `已自动清理 ${cleanedCount} 条旧评论`); // 已移除
        }
    }
    
    // 清理缓存
    clearCommentsCache(workId);
}

// 回复评论
function replyComment(workId, commentIndex, username) {
    window.showCommentDetail(workId, commentIndex);
}

// 切换评论排序（修复版 - 核心bug修复）
function changeCommentSort(workId, sortType) {
    window.currentCommentSort = sortType;
    
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work) return;

    // ✅ 修复1：清除缓存，强制重新生成评论（确保排序生效）
    if (window.commentsGenerationCache && window.commentsGenerationCache[work.id]) {
        delete window.commentsGenerationCache[work.id];
        console.log(`[评论排序] 清除作品 ${workId} 的缓存，重新生成评论`);
    }
    
    window.currentCommentPage = 1;
    
    // ✅ 修复2：正确调用 renderPaginatedComments（移除未定义的 getMixedComments）
    const commentsHtml = renderPaginatedComments(work, window.commentsPerPage);
    const paginationHtml = renderCommentsPagination(work, window.commentsPerPage);
    
    const commentsListEl = document.getElementById('commentsList');
    const paginationEl = document.querySelector('#commentsList + div[style*="flex-wrap"]');
    
    if (commentsListEl) {
        commentsListEl.innerHTML = commentsHtml;
    }
    
    if (paginationEl) {
        paginationEl.outerHTML = paginationHtml;
    }
    
    const sortNames = {
        'hottest': '最火的',
        'asc': '正序',
        'desc': '倒序'
    };
    showNotification('排序已切换', `当前按${sortNames[sortType] || '最火的'}显示`);
}

// 渲染分页评论（核心优化：按页生成）
function renderPaginatedComments(work, commentsPerPage) {
    const sortType = window.currentCommentSort || 'hottest';
    
    // ✅ 修复：按需生成当前页评论（带排序）
    const page = window.currentCommentPage || 1;
    const comments = getOrGenerateCommentsForPage(work, page - 1, commentsPerPage);
    
    // 对当前页的评论进行排序
    const sortedComments = getSortedComments(comments, sortType);
    
    return sortedComments.map((comment, index) => {
        const globalIndex = (page - 1) * commentsPerPage + index;
        const commentKey = `${work.id}_${globalIndex}_${comment.time}`;
        const hasLiked = gameState.commentLikes && gameState.commentLikes[commentKey];
        
        return `
            <div class="comment-item" style="${comment.isNegative ? 'border-left: 3px solid #ff0050;' : ''}" 
                 data-comment-index="${globalIndex}">
                <div class="comment-header">
                    <div class="comment-user-avatar">${comment.avatar || comment.user.charAt(0)}</div>
                    <span class="comment-user" onclick="openUserProfileFromComment('${comment.user}', '${comment.user.charAt(0)}')">${comment.user}</span>
                    <span class="comment-time">${formatTime(comment.time)}</span>
                </div>
                <div class="comment-content" style="${comment.isNegative ? 'color: #ff6b00; font-weight: bold;' : ''}">${comment.content}</div>
                <div class="comment-actions">
                    <span class="comment-action ${hasLiked ? 'liked' : ''}" 
                          onclick="likeComment('${work.id}', '${globalIndex}')">
                        ${hasLiked ? '❤️' : '🤍'} 
                        <!-- ✅ 使用formatCommentLikes格式化点赞数 -->
                        <span>${formatCommentLikes(comment.likes || 0)}</span>
                    </span>
                    <span class="comment-action" onclick="replyComment('${work.id}', '${globalIndex}')">
                        回复
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// 渲染评论分页控件（核心优化：基于作品评论数计算总页数）
function renderCommentsPagination(work, commentsPerPage = 10) {
    // ✅ 基于作品评论数计算总页数，限制30页
    const totalComments = work.comments || 0;
    const maxPages = 30;
    const totalPages = Math.min(maxPages, Math.max(1, Math.ceil(totalComments / commentsPerPage)));
    
    const page = window.currentCommentPage || 1;
    const startItem = totalComments > 0 ? (page - 1) * commentsPerPage + 1 : 0;
    const endItem = Math.min(page * commentsPerPage, Math.min(totalComments, page * commentsPerPage));
    
    let paginationHtml = '<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin: 20px 0;">';
    
    // 分页按钮容器
    paginationHtml += '<div style="display: flex; justify-content: center; align-items: center; gap: 5px; flex-wrap: wrap;">';
    
    const prevDisabled = page === 1;
    paginationHtml += `<button class="page-btn ${prevDisabled ? 'disabled' : ''}" onclick="window.changeCommentPage(${page - 1})" ${prevDisabled ? 'disabled' : ''}>‹</button>`;
    
    const maxButtons = 7;
    let startPage, endPage;
    
    if (totalPages <= maxButtons) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const halfVisible = Math.floor(maxButtons / 2);
        startPage = Math.max(1, page - halfVisible);
        endPage = Math.min(totalPages, page + halfVisible);
        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
    }
    
    if (startPage > 1) {
        paginationHtml += `<button class="page-btn" onclick="window.changeCommentPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHtml += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="window.changeCommentPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHtml += `<span style="color: #666; padding: 0 5px;">...</span>`;
        }
        paginationHtml += `<button class="page-btn" onclick="window.changeCommentPage(${totalPages})">${totalPages}</button>`;
    }
    
    const nextDisabled = page === totalPages;
    paginationHtml += `<button class="page-btn ${nextDisabled ? 'disabled' : ''}" onclick="window.changeCommentPage(${page + 1})" ${nextDisabled ? 'disabled' : ''}>›</button>`;
    
    paginationHtml += '</div>';
    
    // ✅ 最后一页提示信息（数字改为30）
    if (totalComments > maxPages * commentsPerPage && page === maxPages) {
        const remainingComments = totalComments - (maxPages * commentsPerPage);
        paginationHtml += `<div style="font-size: 11px; color: #999; margin-top: 5px; text-align: center;">
            最多展示${maxPages}页，还有${remainingComments}条评论未显示
        </div>`;
    }
    
    // 页码信息显示
    paginationHtml += `<div style="font-size: 11px; color: #999; margin-top: 5px;">
        第${startItem}-${Math.min(endItem, totalComments)}条 / 共${totalComments}条
    </div>`;
    
    paginationHtml += '</div>';
    return paginationHtml;
}

// 切换评论页码（核心优化：按需生成评论）
function changeCommentPage(page) {
    const work = window.currentDetailWork;
    if (!work) return;

    // ✅ 基于作品评论数计算总页数，限制30页
    const totalComments = work.comments || 0;
    const maxPages = 30;
    const totalPages = Math.min(maxPages, Math.max(1, Math.ceil(totalComments / window.commentsPerPage)));
    
    if (page < 1 || page > totalPages) return;
    
    window.currentCommentPage = page;
    
    // 按需生成当前页评论
    const commentsHtml = renderPaginatedComments(work, window.commentsPerPage);
    const paginationHtml = renderCommentsPagination(work, window.commentsPerPage);
    
    const commentsListEl = document.getElementById('commentsList');
    const paginationEl = document.querySelector('#commentsList + div[style*="display: flex"]');
    
    if (commentsListEl) {
        commentsListEl.innerHTML = commentsHtml;
    }
    
    if (paginationEl) {
        paginationEl.outerHTML = paginationHtml;
    }
    
    if (commentsListEl) {
        commentsListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// 评论详情页（完整版 + 格式化点赞数）
function showCommentDetail(workId, commentIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work) {
        console.error('未找到作品:', workId);
        return;
    }

    // ✅ 修复1：确保 commentIndex 是数字
    commentIndex = parseInt(commentIndex);
    if (isNaN(commentIndex)) {
        console.error('无效的 commentIndex:', commentIndex);
        return;
    }

    // 计算评论所在的页码和页内索引
    const commentsPerPage = window.commentsPerPage || 10;
    const page = Math.floor(commentIndex / commentsPerPage);
    const indexInPage = commentIndex % commentsPerPage;
    
    console.log(`[评论详情] workId=${workId}, commentIndex=${commentIndex}, page=${page}, indexInPage=${indexInPage}`);
    
    // 生成该页的评论
    const comments = getOrGenerateCommentsForPage(work, page, commentsPerPage);
    
    // ✅ 修复2：从生成的评论数组中获取主评论
    const mainComment = comments[indexInPage];
    if (!mainComment) {
        console.error('未找到主评论:', { workId, commentIndex, page, indexInPage, commentsLength: comments.length });
        return;
    }
    
    currentDetailWork = work;
    
    if (!mainComment.replies) {
        mainComment.replies = generateReplies(mainComment, 2 + Math.floor(Math.random() * 3));
        mainComment.replyCount = mainComment.replies.length;
    }
    
    const mainCommentKey = `${workId}_${commentIndex}_${mainComment.time}`;
    const hasLikedMain = gameState.commentLikes && gameState.commentLikes[mainCommentKey];
    
    const mainCommentHtml = `
        <div class="highlight-comment">
            <div class="comment-header">
                <div class="comment-user-avatar">${mainComment.avatar || mainComment.user.charAt(0)}</div>
                <span class="comment-user" onclick="openUserProfileFromComment('${mainComment.user}', '${mainComment.user.charAt(0)}')">${mainComment.user}</span>
                <span class="comment-time">${formatTime(mainComment.time)}</span>
            </div>
            <div class="comment-content">${mainComment.content}</div>
            <div class="comment-actions">
                <span class="comment-action ${hasLikedMain ? 'liked' : ''}" 
                      onclick="likeComment('${work.id}', '${commentIndex}')">
                    ${hasLikedMain ? '❤️' : '🤍'} 
                    <!-- ✅ 使用formatCommentLikes格式化主评论点赞数 -->
                    <span>${formatCommentLikes(mainComment.likes || 0)}</span>
                </span>
                <span style="font-size: 12px; color: #999;">
                    ${mainComment.replyCount || 0}条回复
                </span>
            </div>
        </div>
    `;
    
    const repliesHtml = mainComment.replies.map((reply, idx) => {
        // ✅ 使用formatCommentLikes格式化回复的点赞数
        return `
            <div class="comment-item nested-reply">
                <div class="comment-header">
                    <div class="comment-user-avatar">${reply.avatar}</div>
                    <span class="comment-user" onclick="openUserProfileFromComment('${reply.user}', '${reply.avatar}')">${reply.user}</span>
                    <span class="comment-time">${formatTime(reply.time)}</span>
                </div>
                <div class="comment-content">${reply.content}</div>
                <div class="comment-actions">
                    <span class="comment-action ${reply.isLiked ? 'liked' : ''}" 
                          onclick="likeReply('${work.id}', ${commentIndex}, ${idx})">
                        ${reply.isLiked ? '❤️' : '🤍'} 
                        <!-- ✅ 使用formatCommentLikes格式化回复点赞数 -->
                        <span>${formatCommentLikes(reply.likes || 0)}</span>
                    </span>
                    <span class="comment-action" onclick="replyToReply('${work.id}', ${commentIndex}, ${idx})">回复</span>
                </div>
            </div>
        `;
    }).join('');
    
    const replyBoxHtml = `
        <div style="position: fixed; bottom: 0; left: 0; right: 0; background: #161823; border-top: 1px solid #333; padding: 10px;">
            <div style="display: flex; gap: 10px; align-items: flex-end;">
                <textarea class="text-input" id="replyInput" rows="2" placeholder="写下你的回复..." maxlength="200"></textarea>
                <button class="btn" onclick="submitReply('${work.id}', ${commentIndex})" style="width: auto; margin: 0; padding: 10px 20px;">回复</button>
            </div>
        </div>
    `;
    
    const content = document.getElementById('commentDetailPageContent');
    content.innerHTML = `
        <div style="margin-bottom: 80px;">
            ${mainCommentHtml}
            <div style="font-size: 14px; font-weight: bold; margin: 15px 0; color: #667aea;">回复列表</div>
            <div id="repliesList">${repliesHtml || '<div style="text-align:center;color:#999;padding:20px;">暂无回复</div>'}</div>
        </div>
        ${replyBoxHtml}
    `;
    
    document.getElementById('commentDetailPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// 提交回复
function submitReply(workId, commentIndex) {
    const input = document.getElementById('replyInput');
    const content = input.value.trim();
    if (!content) {
        showAlert('请输入回复内容', '提示');
        return;
    }
    
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;

    // ✅ 修复：确保 commentIndex 是数字
    commentIndex = parseInt(commentIndex);
    if (isNaN(commentIndex)) {
        console.error('submitReply: 无效的 commentIndex:', commentIndex);
        return;
    }

    const commentsPerPage = window.commentsPerPage || 10;
    const page = Math.floor(commentIndex / commentsPerPage);
    const indexInPage = commentIndex % commentsPerPage;
    
    const comments = getOrGenerateCommentsForPage(work, page, commentsPerPage);
    const mainComment = comments[indexInPage];
    if (!mainComment) {
        console.error('submitReply: 未找到主评论', { workId, commentIndex, page, indexInPage });
        return;
    }

    if (!mainComment.replies) {
        mainComment.replies = [];
    }
    
    const reply = {
        user: gameState.username,
        avatar: gameState.avatar || '😊',
        content: content,
        likes: 0,
        time: gameTimer,
        isReply: true,
        isLiked: false
    };
    
    mainComment.replies.push(reply);
    mainComment.replyCount = (mainComment.replyCount || 0) + 1;
    
    work.comments += 1;
    gameState.totalInteractions += 1;
    
    // 累积宠粉狂魔成就计数
    if (!gameState.commentRepliesCount) gameState.commentRepliesCount = 0;
    gameState.commentRepliesCount += 1;
    
    input.value = '';
    
    showNotification('回复成功', '你的回复已发布');
    showCommentDetail(workId, commentIndex);
    
    // 检查宠粉狂魔成就
    if (gameState.commentRepliesCount >= 1000) {
        const fanLoveAchievement = achievements.find(a => a.id === 19);
        if (fanLoveAchievement && !fanLoveAchievement.unlocked) {
            fanLoveAchievement.unlocked = true;
            gameState.achievements.push(19);
            showAchievementPopup(fanLoveAchievement);
            showNotification('🏆 成就解锁', `宠粉狂魔：回复1000条评论`);
        }
    }
    
    updateDisplay();
    saveGame();
}

// 点赞回复（✅ 移除点赞上限）
function likeReply(workId, commentIndex, replyIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;

    // ✅ 修复：确保参数为数字
    commentIndex = parseInt(commentIndex);
    replyIndex = parseInt(replyIndex);
    
    const commentsPerPage = window.commentsPerPage || 10;
    const page = Math.floor(commentIndex / commentsPerPage);
    const indexInPage = commentIndex % commentsPerPage;
    
    const comments = getOrGenerateCommentsForPage(work, page, commentsPerPage);
    const mainComment = comments[indexInPage];
    if (!mainComment || !mainComment.replies) return;
    
    const reply = mainComment.replies[replyIndex];
    if (!reply || reply.isLiked) return;
    
    // ✅ 移除点赞上限
    reply.likes = (reply.likes || 0) + 1;
    reply.isLiked = true;
    
    showNotification('点赞成功', '你点赞了一条回复');
    showCommentDetail(workId, commentIndex);
    updateDisplay();
    saveGame();
}

// 回复回复
function replyToReply(workId, commentIndex, replyIndex) {
    const work = gameState.worksList.find(w => w.id == workId);
    if (!work || !work.commentsList) return;

    // ✅ 修复：确保参数为数字
    commentIndex = parseInt(commentIndex);
    replyIndex = parseInt(replyIndex);
    
    const commentsPerPage = window.commentsPerPage || 10;
    const page = Math.floor(commentIndex / commentsPerPage);
    const indexInPage = commentIndex % commentsPerPage;
    
    const comments = getOrGenerateCommentsForPage(work, page, commentsPerPage);
    const mainComment = comments[indexInPage];
    if (!mainComment || !mainComment.replies) return;
    
    const targetReply = mainComment.replies[replyIndex];
    if (!targetReply) return;
    
    showPrompt(`回复 @${targetReply.user}`, '', function(content) {
        if (!content || !content.trim()) {
            showAlert('请输入回复内容', '提示');
            return;
        }
        
        const newReply = {
            user: gameState.username,
            avatar: gameState.avatar || '😊',
            content: `@${targetReply.user} ${content.trim()}`,
            likes: 0,
            time: gameTimer,
            isReply: true,
            isLiked: false
        };
        
        mainComment.replies.push(newReply);
        mainComment.replyCount += 1;
        
        work.comments += 1;
        gameState.totalInteractions += 1;
        
        // 累积宠粉狂魔成就计数
        if (!gameState.commentRepliesCount) gameState.commentRepliesCount = 0;
        gameState.commentRepliesCount += 1;
        
        showNotification('回复成功', '你的回复已发布');
        showCommentDetail(workId, commentIndex);
        
        // 检查宠粉狂魔成就
        if (gameState.commentRepliesCount >= 1000) {
            const fanLoveAchievement = achievements.find(a => a.id === 19);
            if (fanLoveAchievement && !fanLoveAchievement.unlocked) {
                fanLoveAchievement.unlocked = true;
                gameState.achievements.push(19);
                showAchievementPopup(fanLoveAchievement);
                showNotification('🏆 成就解锁', `宠粉狂魔：回复1000条评论`);
            }
        }
        
        updateDisplay();
        saveGame();
    });
}

// 生成回复（初始点赞数为0）
function generateReplies(comment, count) {
    const replies = [];
    const users = ['小可爱', '直播达人', '热心网友', '粉丝一号', '吃瓜群众', '匿名用户'];
    const contents = ['说得对！', '支持！', '有道理', '学习了', '感谢分享', '😂😂😂', '好有道理', '确实如此'];
    
    const now = gameTimer;
    const minTime = comment.time || now;

    for (let i = 0; i < count; i++) {
        const baseUser = users[Math.floor(Math.random() * users.length)];
        const randomNum = Math.floor(Math.random() * 9999);
        const username = baseUser + randomNum;
        const offset = Math.floor(Math.random() * (now - minTime));
        const replyTime = Math.min(minTime + offset, now);
        
        replies.push({
            user: username,
            avatar: baseUser.charAt(0),
            content: contents[Math.floor(Math.random() * contents.length)],
            // ✅ 取消上限，初始点赞数为0
            likes: 0,
            time: replyTime,
            isReply: true,
            isLiked: false
        });
    }
    
    return replies;
}

// 关闭评论详情页
function closeCommentDetail() {
    document.getElementById('commentDetailPage').classList.remove('active');
    
    const activeFullscreenPages = document.querySelectorAll('.fullscreen-page.active');
    if (activeFullscreenPages.length === 0) {
        document.getElementById('mainContent').style.display = 'block';
        document.querySelector('.bottom-nav').style.display = 'flex';
    }
    
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    document.getElementById('commentDetailPageContent').innerHTML = '';
    // 修复：不要清除 currentDetailWork
}

// 从评论打开用户主页
function openUserProfileFromComment(username, avatar) {
    showUserProfile(username, avatar);
}

// ==================== 全局函数绑定 ====================
window.getSortedComments = getSortedComments;
window.generateComments = generateComments;
window.likeComment = likeComment;
window.replyComment = replyComment;
window.changeCommentSort = changeCommentSort;
window.renderPaginatedComments = renderPaginatedComments;
window.renderCommentsPagination = renderCommentsPagination;
window.changeCommentPage = changeCommentPage;
window.closeCommentDetail = closeCommentDetail;
window.showCommentDetail = showCommentDetail;
window.submitReply = submitReply;
window.likeReply = likeReply;
window.replyToReply = replyToReply;
window.generateReplies = generateReplies;
window.getMixedComments = getMixedComments;
window.cleanupAllWorksComments = cleanupAllWorksComments;
window.currentCommentSort = window.currentCommentSort || 'hottest';
// ✅ 新增：导出评论点赞增长函数
window.updateCommentLikes = updateCommentLikes;
window.startGlobalCommentLikesGrowth = startGlobalCommentLikesGrowth;
// ✅ 新增：导出退出清理函数
window.cleanupWorkCommentsOnExit = cleanupWorkCommentsOnExit;
// ✅ 新增：导出点赞数格式化函数
window.formatCommentLikes = formatCommentLikes;
// ✅ 新增：导出缓存管理函数
window.getOrGenerateCommentsForPage = getOrGenerateCommentsForPage;
window.clearCommentsCache = clearCommentsCache;
window.clearAllCommentsCache = clearAllCommentsCache;
window.commentsGenerationCache = window.commentsGenerationCache || {};

console.log('评论系统（优化版 + 无限制点赞 + 点赞增长 + 退出清理 + 99+显示 + 按需生成）已加载');

// ==================== 启动评论点赞增长定时器 ====================
// 在游戏加载时启动
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            startGlobalCommentLikesGrowth();
        }, 5000); // 延迟5秒启动
    });
}
