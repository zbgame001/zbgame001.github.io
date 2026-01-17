// ==================== 警告系统模块 ====================
// 本模块包含所有与警告相关的功能
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS)
// 依赖: game_ui.js (showNotification, showWarning, showAlert, updateDisplay, closeFullscreenPage)

// ==================== 警告类型定义 ====================
const warningTypes = {
    CONTENT_VIOLATION: {
        id: 'content_violation',
        name: '内容违规',
        icon: '⚠️',
        severity: 'high',
        description: '发布的内容包含违规信息',
        penalty: '警告+1，累计20次将被封禁',
        isFakeAd: false  // ✅ 不是虚假商单
    },
    AD_VIOLATION: {
        id: 'ad_violation',
        name: '商单违规',
        icon: '💼',
        severity: 'high',
        description: '商单内容违反平台规定',
        penalty: '警告+1-2，可能被封号',
        isFakeAd: false
    },
    COPYRIGHT_ISSUE: {
        id: 'copyright_issue',
        name: '版权争议',
        icon: '©️',
        severity: 'medium',
        description: '内容涉及版权侵权',
        penalty: '内容可能被删除',
        isFakeAd: false
    },
    SPAM_BEHAVIOR: {
        id: 'spam_behavior',
        name: '垃圾信息',
        icon: '🔇',
        severity: 'medium',
        description: '发布垃圾广告或重复内容',
        penalty: '警告+1',
        isFakeAd: false
    },
    HARASSMENT: {
        id: 'harassment',
        name: '骚扰行为',
        icon: '😡',
        severity: 'high',
        description: '存在骚扰其他用户的行为',
        penalty: '警告+1-3',
        isFakeAd: false
    },
    // ✅ 虚假商单类型：始终不可申诉（即使在非封禁期间）
    FAKE_AD: {
        id: 'fake_ad',
        name: '虚假商单',
        icon: '🎰',
        severity: 'critical',
        description: '发布虚假商单内容',
        penalty: '罚款、警告+5、封号7-30天',
        isFakeAd: true
    },
    SYSTEM_ERROR: {
        id: 'system_error',
        name: '系统误判',
        icon: '🔧',
        severity: 'low',
        description: '系统误判导致的警告',
        penalty: '可申诉撤销',
        isFakeAd: false
    }
};

// ==================== 关闭警告列表（提前定义以确保全局可用） ====================
function closeWarningList() {
    const warningPage = document.getElementById('warningListPage');
    if (warningPage) {
        warningPage.classList.remove('active');
    }
    
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    updateDisplay();
}

// ==================== 警告历史记录 ====================
function addWarningToHistory(type, details, content = '') {
    if (!gameState.warningHistory) {
        gameState.warningHistory = [];
    }
    
    const warningType = warningTypes[type] || warningTypes.CONTENT_VIOLATION;
    const warningRecord = {
        id: Date.now(),
        type: type,
        title: warningType.name,
        icon: warningType.icon,
        severity: warningType.severity,
        description: details || warningType.description,
        penalty: warningType.penalty,
        content: content,
        time: gameTimer,
        isAppealed: false,
        isActive: true,
        isFakeAd: warningType.isFakeAd  // ✅ 记录是否为虚假商单警告
    };
    
    gameState.warningHistory.unshift(warningRecord);
    
    if (gameState.warningHistory.length > 100) {
        gameState.warningHistory = gameState.warningHistory.slice(0, 100);
    }
    
    saveGame();
    return warningRecord;
}

// ==================== 显示警告列表（全屏） ====================
function showWarningListFullscreen() {
    if (!gameState.warningHistory || gameState.warningHistory.length === 0) {
        showAlert('暂无警告记录', '提示');
        return;
    }
    
    // 隐藏主内容和底部导航
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    // 创建或获取警告页面
    let warningPage = document.getElementById('warningListPage');
    if (!warningPage) {
        warningPage = document.createElement('div');
        warningPage.id = 'warningListPage';
        warningPage.className = 'fullscreen-page';
        warningPage.innerHTML = `
            <div class="fullscreen-header">
                <div class="back-btn" id="warningBackBtn">‹</div>
                <div class="fullscreen-title">警告记录</div>
                <div class="fullscreen-action" style="opacity:0;">占位</div>
            </div>
            <div id="warningListContent" class="fullscreen-content"></div>
        `;
        document.body.appendChild(warningPage);
        
        setTimeout(() => {
            const backBtn = document.getElementById('warningBackBtn');
            if (backBtn) {
                backBtn.addEventListener('click', closeWarningList);
                backBtn.style.cursor = 'pointer';
            }
        }, 100);
    }
    
    warningPage.classList.add('active');
    renderWarningList();
}

// 渲染警告列表
function renderWarningList() {
    const content = document.getElementById('warningListContent');
    if (!content) return;
    
    if (!gameState.warningHistory || gameState.warningHistory.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#999;padding:40px;">暂无警告记录</div>';
        return;
    }
    
    const warningHtml = gameState.warningHistory.map(warning => {
        const severityColors = {
            low: '#00f2ea',
            medium: '#ff6b00',
            high: '#ff0050',
            critical: '#8B0000'
        };
        
        const timeAgo = formatTime(warning.time);
        const severityColor = severityColors[warning.severity] || '#999';
        
        return `
            <div class="warning-item" onclick="showWarningDetail(${warning.id})">
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <div style="font-size: 24px; flex-shrink: 0;">${warning.icon}</div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <div style="font-weight: bold; font-size: 14px;">${warning.title}</div>
                            <div style="font-size: 11px; color: #999;">${timeAgo}</div>
                        </div>
                        <div style="font-size: 12px; color: #ccc; margin-bottom: 8px;">${warning.description}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 11px; color: ${severityColor};">
                                ${warning.severity === 'critical' ? '🔴' : warning.severity === 'high' ? '🟠' : warning.severity === 'medium' ? '🟡' : '🔵'} 
                                ${warning.penalty}
                            </div>
                            ${warning.isAppealed ? '<div style="font-size: 11px; color: #00f2ea;">✅ 已申诉</div>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = `
        <div style="padding: 10px 15px;">
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 20px; border: 1px solid #333;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="font-size: 16px; font-weight: bold;">当前警告状态</div>
                    <div style="font-size: 18px; color: ${gameState.warnings >= 15 ? '#ff0050' : gameState.warnings >= 10 ? '#ff6b00' : '#00f2ea'};">
                        ${gameState.warnings}/20
                    </div>
                </div>
                <div style="background: #222; border-radius: 8px; height: 8px; overflow: hidden; margin-bottom: 8px;">
                    <div style="width: ${(gameState.warnings / 20) * 100}%; height: 100%; 
                         background: ${gameState.warnings >= 15 ? 'linear-gradient(90deg, #ff0050, #8B0000)' : 
                                      gameState.warnings >= 10 ? 'linear-gradient(90deg, #ff6b00, #ff0050)' : 
                                      'linear-gradient(90deg, #00f2ea, #667eea)'}; 
                         transition: width 0.5s ease;"></div>
                </div>
                <div style="font-size: 12px; color: #999; text-align: center;">
                    ${gameState.isBanned ? '⚠️ 封禁期间所有警告不可申诉' : 
                      gameState.warnings >= 18 ? '⚠️ 高危状态，再违规将被封禁！' : 
                      gameState.warnings >= 15 ? '⚠️ 警告较多，请注意行为规范' : 
                      gameState.warnings >= 10 ? '⚡ 警告数量中等，请谨慎操作' : 
                      gameState.warnings >= 5 ? 'ℹ️ 警告数量较少，继续保持' : 
                      '✅ 状态良好，请继续保持'}
                </div>
            </div>
            <div style="display: grid; gap: 10px;">
                ${warningHtml}
            </div>
        </div>
    `;
}

// 显示警告详情
function showWarningDetail(warningId) {
    const warning = gameState.warningHistory.find(w => w.id === warningId);
    if (!warning) return;
    
    const timeAgo = formatTime(warning.time);
    const virtualDate = getVirtualDateAtTime(warning.time);
    const dateStr = `虚拟${virtualDate.year}年${virtualDate.month}月${virtualDate.day}日 ${virtualDate.formattedTime}`;
    
    // ✅ 关键修改：封禁期间不可申诉，非封禁期间可以申诉（无论是否在处罚期）
    const canAppealNow = !gameState.isBanned && 
                        !warning.isFakeAd && 
                        !warning.isAppealed;
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">警告详情</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="display: flex; gap: 15px; align-items: flex-start; margin-bottom: 20px;">
                <div style="font-size: 32px; flex-shrink: 0;">${warning.icon}</div>
                <div style="flex: 1;">
                    <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">${warning.title}</div>
                    <div style="font-size: 12px; color: #999; margin-bottom: 15px;">
                        ${dateStr} · ${timeAgo}
                    </div>
                    <div style="background: #161823; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                        <div style="font-size: 14px; line-height: 1.5; margin-bottom: 8px;">
                            <strong>违规内容：</strong><br>
                            ${warning.content || '内容已删除或无法查看'}
                        </div>
                        <div style="font-size: 12px; color: #ccc;">
                            <strong>具体描述：</strong><br>
                            ${warning.description}
                        </div>
                    </div>
                    <div style="background: #222; border-left: 4px solid #667eea; padding: 12px; border-radius: 0 8px 8px 0;">
                        <div style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">
                            <span style="color: #667eea;">ℹ️ 处罚说明</span>
                        </div>
                        <div style="font-size: 11px; color: #999; line-height: 1.5;">
                            ${warning.penalty}
                        </div>
                    </div>
                    ${warning.isActive ? `
                        <div style="background: linear-gradient(135deg, #ff0050 0%, #8B0000 100%); color: #fff; padding: 10px; border-radius: 8px; margin-top: 12px; font-size: 12px; text-align: center;">
                            ⏳ 此警告仍在处罚期内
                        </div>
                    ` : ''}
                    ${gameState.isBanned ? `
                        <div style="background: #8B0000; color: #fff; padding: 10px; border-radius: 8px; margin-top: 12px; font-size: 12px; text-align: center; font-weight: bold;">
                            🚫 封禁期间所有警告不可申诉
                        </div>
                    ` : ''}
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" onclick="closeModal()">关闭</button>
                ${canAppealNow ? 
                  `<button class="btn" onclick="startWarningAppeal(${warning.id})" style="background: #667eea;">申诉警告</button>` : 
                  warning.isFakeAd ? 
                  '<button class="btn" style="background: #666; cursor: default;">虚假商单不可申诉</button>' :
                  gameState.isBanned ? 
                  '<button class="btn" style="background: #666; cursor: default;">封禁期间不可申诉</button>' :
                  warning.isAppealed ? 
                  '<button class="btn" style="background: #666; cursor: default;">已申诉</button>' : ''}
            </div>
        </div>
    `;
    
    showModal(modalContent);
}

// 获取指定时间点的虚拟日期
function getVirtualDateAtTime(timestamp) {
    const totalDays = Math.floor(timestamp / VIRTUAL_DAY_MS);
    const currentYear = GAME_START_VIRTUAL_DATE.year + Math.floor(totalDays / 365);
    const dayOfYear = totalDays % 365;
    
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let remainingDays = dayOfYear;
    let month = 0;
    
    for (let i = 0; i < monthDays.length; i++) {
        if (remainingDays < monthDays[i]) {
            month = i;
            break;
        }
        remainingDays -= monthDays[i];
    }
    
    const timeInDay = timestamp % VIRTUAL_DAY_MS;
    const hours = Math.floor(timeInDay / VIRTUAL_HOUR_MS);
    const minutes = Math.floor((timeInDay % VIRTUAL_HOUR_MS) / VIRTUAL_MINUTE_MS);
    const seconds = Math.floor((timeInDay % VIRTUAL_MINUTE_MS) / VIRTUAL_SECOND_MS);
    
    return {
        year: currentYear,
        month: month + 1,
        day: remainingDays + 1,
        totalDays: totalDays,
        totalMonths: Math.floor(totalDays / 30),
        totalYears: Math.floor(totalDays / 365),
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        formattedTime: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    };
}

// ==================== 启动单个警告申诉流程 ====================
function startWarningAppeal(warningId) {
    // ✅ 新增：封禁期间禁止启动申诉
    if (gameState.isBanned) {
        showAlert('封禁期间无法申诉任何警告', '提示');
        return;
    }
    
    closeModal();
    
    const warning = gameState.warningHistory.find(w => w.id === warningId);
    if (!warning) return;
    
    // ✅ 修改：封禁期间不可申诉，非封禁期间可以申诉（无论是否在处罚期）
    // 移除 !warning.isActive 条件
    if (!warning.isFakeAd && !warning.isAppealed) {
        // 满足条件，继续申诉流程
    } else {
        showAlert('此警告无法申诉', '提示');
        return;
    }
    
    // 显示申诉表单（保持不变）
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">申诉警告</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
                    ${warning.icon} ${warning.title}
                </div>
                <div style="font-size: 12px; color: #999; margin-bottom: 10px;">
                    ${warning.description}
                </div>
                <div style="font-size: 12px; color: #ccc; padding: 10px; background: #222; border-radius: 6px;">
                    ${warning.content || '内容已删除'}
                </div>
            </div>
            
            <div class="input-group" style="margin-bottom: 15px;">
                <div class="input-label" style="color: #ff6b00; font-weight: bold;">
                    ✍️ 请说明申诉理由（系统将检测您的真诚度）
                </div>
                <textarea class="text-input" id="appealReason" rows="6" 
                          placeholder="请详细说明为什么认为此警告不合理，态度真诚有助于申诉成功..."
                          maxlength="300"></textarea>
            </div>
            
            <div style="background: linear-gradient(135deg, #222 0%, #161823 50%); border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                <div style="font-size: 12px; color: #999; margin-bottom: 8px;">
                    💡 申诉提示：
                </div>
                <div style="font-size: 11px; color: #ccc; line-height: 1.5;">
                    • 态度要真诚，说明具体情况<br>
                    • 字数建议在50-200字之间<br>
                    • 系统将检测您的真诚度<br>
                    • 成功后可撤销警告，减少警告次数
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" onclick="closeModal()">取消申诉</button>
                <button class="btn" onclick="submitWarningAppeal(${warning.id})" 
                        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    提交申诉
                </button>
            </div>
        </div>
    `;
    
    showModal(modalContent);
    
    setTimeout(() => {
        const textarea = document.getElementById('appealReason');
        if (textarea) textarea.focus();
    }, 100);
}

// ==================== 提交警告申诉 ====================
function submitWarningAppeal(warningId) {
    // ✅ 新增：封禁期间禁止提交申诉
    if (gameState.isBanned) {
        showAlert('封禁期间无法提交申诉', '提示');
        return;
    }
    
    const reason = document.getElementById('appealReason').value.trim();
    if (!reason) {
        showAlert('请输入申诉理由', '提示');
        return;
    }
    
    if (reason.length < 20) {
        showAlert('申诉理由至少需要20字，请详细说明情况', '提示');
        return;
    }
    
    closeModal();
    showAlert('系统正在审核您的申诉，请稍候...', '申诉提交');
    
    setTimeout(() => {
        if (typeof performAppealAICheck === 'function') {
            performAppealAICheck(reason, function(isSincere, score) {
                closeModal();
                
                const warning = gameState.warningHistory.find(w => w.id === warningId);
                if (!warning) return;
                
                // ✅ 二次检查：封禁期间禁止通过申诉
                if (gameState.isBanned) {
                    showAlert('封禁期间申诉无效', '提示');
                    return;
                }
                
                if (isSincere) {
                    warning.isAppealed = true;
                    warning.isActive = false;
                    gameState.warnings = Math.max(0, gameState.warnings - 1);
                    
                    const successModal = `
                        <div class="modal-header">
                            <div class="modal-title" style="color: #00f2ea;">✅ 申诉成功</div>
                            <div class="close-btn" onclick="closeModal()">✕</div>
                        </div>
                        <div style="padding: 20px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">恭喜！您的申诉已通过</div>
                            <div style="font-size: 14px; color: #ccc; margin-bottom: 15px;">系统检测到您的态度真诚，决定撤销此次警告</div>
                            <div style="background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); color: #000; padding: 10px; border-radius: 8px; font-weight: bold; margin-bottom: 20px;">
                                警告次数已减少：${gameState.warnings + 1} → ${gameState.warnings}
                            </div>
                            <div style="font-size: 11px; color: #999;">真诚度评分：${score.toFixed(1)}/10</div>
                            <button class="btn" onclick="closeModal()" style="background: #00f2ea; color: #000; margin-top: 15px;">确定</button>
                        </div>
                    `;
                    showModal(successModal);
                    showEventPopup('✅ 申诉成功', `警告已撤销，当前警告次数：${gameState.warnings}/20`);
                } else {
                    warning.isAppealed = true;
                    
                    const failModal = `
                        <div class="modal-header">
                            <div class="modal-title" style="color: #ff0050;">❌ 申诉失败</div>
                            <div class="close-btn" onclick="closeModal()">✕</div>
                        </div>
                        <div style="padding: 20px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 15px;">😔</div>
                            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">很遗憾，您的申诉未通过</div>
                            <div style="font-size: 14px; color: #ccc; margin-bottom: 15px;">系统检测认为申诉理由不够真诚或理由不充分</div>
                            <div style="background: #222; border-left: 4px solid #ff0050; padding: 10px; border-radius: 0 8px 8px 0; font-size: 12px; color: #999; margin-bottom: 20px;">建议：下次申诉时态度更真诚，说明更详细的情况</div>
                            <div style="font-size: 11px; color: #999;">真诚度评分：${score.toFixed(1)}/10 (需要 > 7.0)</div>
                            <button class="btn" onclick="closeModal()" style="background: #ff0050; margin-top: 15px;">确定</button>
                        </div>
                    `;
                    showModal(failModal);
                    showEventPopup('❌ 申诉失败', '申诉理由不够真诚，无法撤销警告');
                }
                
                renderWarningList();
                updateDisplay();
            });
        } else {
            showAlert('AI审核系统未加载，请刷新页面重试', '错误');
        }
    }, 1500);
}

// ==================== 全局函数绑定 ====================
window.showWarningListFullscreen = showWarningListFullscreen;
window.closeWarningList = closeWarningList;
window.renderWarningList = renderWarningList;
window.showWarningDetail = showWarningDetail;
window.showAppealFromWarning = showAppealFromWarning;
window.addWarningToHistory = addWarningToHistory;
window.getVirtualDateAtTime = getVirtualDateAtTime;
window.warningTypes = warningTypes;
window.startWarningAppeal = startWarningAppeal;
window.submitWarningAppeal = submitWarningAppeal;

console.log('警告系统模块（最终版：封禁期间禁止申诉）已加载');
