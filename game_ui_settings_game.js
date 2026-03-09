// game_ui_settings_game.js
// 游戏设置菜单和功能

// ==================== 游戏设置 ====================
function showGameSettings() {
    const headerTitle = document.getElementById('settingsHeaderTitle');
    if (headerTitle) {
        headerTitle.textContent = '游戏设置';
        headerTitle.onclick = null;
    }
    
    const content = document.getElementById('settingsPageContent');
    content.innerHTML = `
        <div class="settings-item" onclick="showPlayTime()">
            <div><div class="settings-label">游玩时间</div><div class="settings-value">查看统计</div></div>
            <div>></div>
        </div>
        <div class="settings-item" onclick="showQQGroup()">
            <div><div class="settings-label">加入QQ交流群</div><div class="settings-value">交流讨论</div></div>
            <div>></div>
        </div>
        
        <!-- ✅ 新增：版本信息入口 -->
        <div class="settings-item" onclick="showVersionInfo()">
            <div><div class="settings-label">📋 版本信息</div><div class="settings-value">查看版本详情</div></div>
            <div>></div>
        </div>
        
        <!-- ✅ 新增：存档管理主菜单（整合所有存档功能） -->
        <div class="settings-item" onclick="showArchiveManagement()">
            <div><div class="settings-label">📦 存档管理</div><div class="settings-value">导出/导入/清理</div></div>
            <div>></div>
        </div>
        
        <!-- ✅ 新增：Mod管理入口 -->
        <div class="settings-item" onclick="showModManagement()">
            <div><div class="settings-label">🎮 Mod管理</div><div class="settings-value">导入/加载Mod</div></div>
            <div>></div>
        </div>
        
        <!-- ✅ 修改：mod下载入口 - 现在点击弹出网址复制弹窗，不再自动跳转 -->
        <div class="settings-item" onclick="window.openModDownloadSite()">
            <div><div class="settings-label">📥 mod下载（可以分享自己制作的mod）</div><div class="settings-value">访问mod分享网站</div></div>
            <div>></div>
        </div>
        
        <div class="settings-item" onclick="clearData()" style="background:#ff0050">
            <div><div class="settings-label">清除数据</div><div class="settings-value">谨慎操作</div></div>
        </div>
    `;
    
    document.getElementById('settingsPage').classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 显示游玩时间 ====================
function showPlayTime() {
    const totalMinutes = Math.floor(gameTimer / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(getVirtualDaysPassed());
    
    // ✅ 获取虚拟起始日期，如果没有则显示为"随机起始日期"
    let startDateInfo = "随机起始日期";
    if (gameState.virtualStartDate) {
        const startDate = gameState.virtualStartDate;
        startDateInfo = `${startDate.year}年${String(startDate.month).padStart(2, '0')}月${String(startDate.day).padStart(2, '0')}日`;
    }
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">游玩时间统计</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <div style="font-size: 24px; color: #667aea; margin-bottom: 10px;">${hours}小时 ${minutes}分钟</div>
                <div style="font-size: 14px; color: #999;">实际游玩时间</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 24px; color: #00f2ea; margin-bottom: 10px;">${days}天</div>
                <div style="font-size: 14px; color: #999;">虚拟时间流逝</div>
            </div>
            <div style="background: #161823; padding: 15px; border-radius: 10px; font-size: 12px; color: #999; line-height: 1.5;">
                <p>• 虚拟时间：1分钟 = 1虚拟天</p>
                <p>• 游戏起始时间：${startDateInfo}</p>
                <p>• 当前时间：${formatVirtualDate(true)}</p>
            </div>
            <button class="btn" onclick="closeModal()" style="margin-top: 20px;">确定</button>
        </div>
    `;
    showModal(modalContent);
}

// ==================== 显示QQ群号 ====================
function showQQGroup() {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">加入QQ交流群</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">👥</div>
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">主播模拟器交流群</div>
                <div style="font-size: 14px; color: #999; margin-bottom: 20px;">欢迎加入QQ群与其他玩家交流</div>
            </div>
            <div style="background: #161823; border-radius: 10px; padding: 20px;">
                <div style="font-size: 16px; color: #667aea; margin-bottom: 10px;">群号</div>
                <div style="font-size: 32px; font-weight: bold; color: #fff; letter-spacing: 3px; margin-bottom: 10px;">816068043</div>
                <div style="font-size: 12px; color: #999;">点击号码可复制</div>
            </div>
            <div style="font-size: 12px; color: #999; line-height: 1.5; margin-bottom: 20px;">
                <p>• 分享游戏心得</p>
                <p>• 反馈游戏问题</p>
                <p>• 获取最新资讯</p>
            </div>
            <button class="btn" onclick="copyQQGroup()">复制群号</button>
        </div>
    `;
    showModal(modalContent);
}

// ==================== 复制QQ群号 ====================
function copyQQGroup() {
    const groupNumber = '816068043';
    const textarea = document.createElement('textarea');
    textarea.value = groupNumber;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('复制成功', 'QQ群号已复制到剪贴板');
    } catch (err) {
        showWarning('复制失败，请手动输入：816068043');
    }
    
    document.body.removeChild(textarea);
    closeModal();
}

// ==================== 显示密码输入框 ====================
function showDevPasswordModal() {
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">开发者模式</div>
            <div class="close-btn" onclick="closeDevPasswordModal()">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="margin-bottom: 15px; font-size: 14px; color: #999;">
                请输入开发者密码
            </div>
            <input type="password" class="text-input" id="devPasswordInput" placeholder="输入密码" maxlength="20" 
                   style="margin-bottom: 15px; background: #222; border: 1px solid #333; color: #fff;">
            <button class="btn" onclick="devVerifyPassword()">确定</button>
        </div>
    `;
    showModal(modalContent);
    
    setTimeout(() => {
        const input = document.getElementById('devPasswordInput');
        if (input) input.focus();
    }, 100);
}

// ==================== 关闭密码输入框 ====================
function closeDevPasswordModal() {
    closeModal();
    settingsClickCount = 0;
}

// ==================== 存档管理主菜单（整合所有存档功能） ====================
function showArchiveManagement() {
    // 计算存档内存大小
    const memorySize = getArchiveMemorySize();
    
    // ✅ 获取当前自动清理缓存间隔显示文本
    const cleanIntervalMin = gameState.autoCleanCacheInterval || 5;
    let cleanIntervalText = '';
    if (cleanIntervalMin < 1) {
        cleanIntervalText = '关闭';
    } else if (cleanIntervalMin < 60) {
        cleanIntervalText = `${cleanIntervalMin}分钟`;
    } else {
        cleanIntervalText = `${Math.floor(cleanIntervalMin / 60)}小时`;
    }
    
    const content = `
        <div class="fullscreen-header">
            <div class="back-btn" onclick="closeArchiveManagement()">←</div>
            <div class="fullscreen-title">📦 存档管理</div>
            <div class="fullscreen-action" style="opacity:0; cursor:default;">占位</div>
        </div>
        <div id="archiveManagementPageContent" class="fullscreen-content">
            <div style="padding: 10px;">
                <!-- 存档内存大小显示 -->
                <div class="settings-item" style="cursor: default; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div class="settings-label" style="color: #00f2ea;">存档内存大小</div>
                        <div class="settings-value" style="color: #667aea; font-weight: bold;">${memorySize}</div>
                    </div>
                    <div style="opacity: 0.5;">💾</div>
                </div>
                
                <!-- 导出存档 -->
                <div class="settings-item" onclick="exportSaveData()" style="margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div class="settings-label">📤 导出存档</div>
                        <div class="settings-value" style="color: #999;">下载到本地</div>
                    </div>
                    <div style="color: #667aea;">></div>
                </div>
                
                <!-- 导入存档 -->
                <div class="settings-item" onclick="handleImportClick()" style="margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div class="settings-label">📥 导入存档</div>
                        <div class="settings-value" style="color: #999;">从文件导入</div>
                    </div>
                    <div style="color: #667aea;">></div>
                </div>
                
                <!-- 清理存档缓存 -->
                <div class="settings-item" onclick="cleanArchiveCache()" style="margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div class="settings-label" style="color: #ff6b00;">🗑️ 清理存档缓存</div>
                        <div class="settings-value" style="color: #999;">释放空间</div>
                    </div>
                    <div style="color: #667aea;">></div>
                </div>
                
                <!-- 自动清理缓存设置 -->
                <div class="settings-item" onclick="changeAutoCleanCache()" style="margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div class="settings-label">⏰ 自动清理缓存</div>
                        <div class="settings-value" style="color: #667aea; font-weight: bold;">${cleanIntervalText}</div>
                    </div>
                    <div style="color: #667aea;">></div>
                </div>
                
                <!-- 说明信息 -->
                <div style="font-size: 12px; color: #999; line-height: 1.5; background: #161823; padding: 15px; border-radius: 8px; border: 1px solid #333;">
                    <div style="margin-bottom: 8px; font-weight: bold; color: #667aea;">💡 使用说明：</div>
                    <div style="margin-bottom: 5px;">• 导出存档：将当前游戏进度保存为文件</div>
                    <div style="margin-bottom: 5px;">• 导入存档：从本地文件恢复游戏进度</div>
                    <div style="margin-bottom: 5px;">• 清理缓存：释放存档占用的存储空间</div>
                    <div>• 自动清理：定期自动清理过期数据</div>
                </div>
            </div>
        </div>
    `;
    
    // 获取或创建页面元素
    let page = document.getElementById('archiveManagementPage');
    if (!page) {
        page = document.createElement('div');
        page.id = 'archiveManagementPage';
        page.className = 'fullscreen-page';
        document.body.appendChild(page);
    }
    
    page.innerHTML = content;
    
    // 显示全屏页面
    page.classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 关闭存档管理全屏页面 ====================
function closeArchiveManagement() {
    const page = document.getElementById('archiveManagementPage');
    if (page) {
        page.classList.remove('active');
    }
    
    // ✅ 修复：先关闭游戏设置全屏，再恢复主界面
    const settingsPage = document.getElementById('settingsPage');
    if (settingsPage) {
        settingsPage.classList.remove('active');
    }
    
    // ✅ 延迟恢复主界面，确保页面切换动画完成
    setTimeout(() => {
        document.getElementById('mainContent').style.display = 'block';
        document.querySelector('.bottom-nav').style.display = 'flex';
    }, 50);
}

// ==================== 计算存档内存大小 ====================
function getArchiveMemorySize() {
    try {
        let totalBytes = 0;
        
        // 计算localStorage中所有数据的大小
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                // 键和值的长度都计入（每个字符约2字节）
                totalBytes += key.length * 2;
                totalBytes += localStorage[key].length * 2;
            }
        }
        
        // 转换为MB并保留2位小数
        const sizeInMB = (totalBytes / (1024 * 1024)).toFixed(2);
        
        // 根据大小返回不同的颜色
        if (totalBytes < 1024 * 1024) {
            return `<span style="color: #00f2ea;">${sizeInMB} MB</span>`;
        } else if (totalBytes < 5 * 1024 * 1024) {
            return `<span style="color: #667aea;">${sizeInMB} MB</span>`;
        } else if (totalBytes < 10 * 1024 * 1024) {
            return `<span style="color: #ff6b00;">${sizeInMB} MB</span>`;
        } else {
            return `<span style="color: #ff0050;">${sizeInMB} MB</span>`;
        }
    } catch (error) {
        console.error('计算存档内存失败:', error);
        return '<span style="color: #ff0050;">计算失败</span>';
    }
}

// ==================== 清理存档缓存（已修复：保留Mod数据） ====================
function cleanArchiveCache() {
    showConfirm(`确定要清理存档缓存吗？

这将：
• 清理过期的缓存数据
• 清理临时数据
• 保留核心存档数据和Mod数据

建议定期清理以保持游戏流畅。`, function(confirmed) {
        if (!confirmed) return;
        
        try {
            // 备份核心存档数据和Mod数据
            const coreData = {
                streamerGameState: localStorage.getItem('streamerGameState'),
                streamerGameMods: localStorage.getItem('streamerGameMods'),
                streamerGameActiveMods: localStorage.getItem('streamerGameActiveMods'),
                streamerGameLoadedMods: localStorage.getItem('streamerGameLoadedMods')
            };
            
            // 清理localStorage中其他可能存在的缓存
            const keysToRemove = [];
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    // 保留核心数据和Mod数据
                    if (key !== 'streamerGameState' && 
                        key !== 'streamerGameMods' && 
                        key !== 'streamerGameActiveMods' && 
                        key !== 'streamerGameLoadedMods' && 
                        key.startsWith('streamer')) {
                        keysToRemove.push(key);
                    }
                }
            }
            
            // 删除过期的缓存键
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // 恢复核心数据和Mod数据
            Object.keys(coreData).forEach(key => {
                if (coreData[key]) {
                    localStorage.setItem(key, coreData[key]);
                }
            });
            
            // 显示清理结果
            const cleanedCount = keysToRemove.length;
            showNotification('清理成功', `已清理 ${cleanedCount} 个缓存项，存档内存已优化，Mod数据已保留`);
            
            // 如果当前在设置页面，刷新显示
            if (document.getElementById('settingsPage').classList.contains('active')) {
                showGameSettings();
            }
            
            saveGame();
        } catch (error) {
            console.error('清理存档缓存失败:', error);
            showAlert('清理失败：' + error.message, '错误');
        }
    });
}

// ==================== 修改自动清理缓存间隔 ====================
function changeAutoCleanCache() {
    const currentInterval = gameState.autoCleanCacheInterval || 5;
    
    // 创建选择器
    const optionsHtml = [
        { value: 0, text: '关闭' },
        { value: 1, text: '1分钟（测试模式）' },
        { value: 5, text: '5分钟（推荐）' },
        { value: 10, text: '10分钟' },
        { value: 30, text: '30分钟' },
        { value: 60, text: '1小时' },
        { value: 1440, text: '24小时' }
    ].map(opt => `
        <option value="${opt.value}" ${currentInterval === opt.value ? 'selected' : ''}>
            ${opt.text}
        </option>
    `).join('');
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">自动清理缓存设置</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="margin-bottom: 15px; font-size: 14px; color: #999; line-height: 1.5;">
                <p>选择自动清理缓存的时间间隔，系统将定期清理过期的临时数据，保持游戏流畅运行。</p>
                <p style="margin-top: 10px; color: #ff6b00;">当前设置：${currentInterval === 0 ? '关闭' : currentInterval + '分钟'}</p>
            </div>
            <select id="autoCleanCacheSelect" style="width: 100%; background: #222; border: 1px solid #333; color: #fff; border-radius: 8px; padding: 12px; font-size: 14px; margin-bottom: 15px;">
                ${optionsHtml}
            </select>
            <div style="font-size: 12px; color: #999; margin-bottom: 15px; line-height: 1.5;">
                <p>• 清理过期的缓存数据</p>
                <p>• 清理临时数据</p>
                <p>• 保留核心存档数据和Mod数据</p>
            </div>
            <button class="btn" onclick="confirmAutoCleanCacheChange()">确定</button>
        </div>
    `;
    showModal(modalContent);
    
    // 聚焦选择器
    setTimeout(() => {
        const select = document.getElementById('autoCleanCacheSelect');
        if (select) select.focus();
    }, 100);
}

// ==================== 确认修改自动清理缓存间隔 ====================
function confirmAutoCleanCacheChange() {
    const select = document.getElementById('autoCleanCacheSelect');
    if (!select) {
        closeModal();
        return;
    }
    
    const newInterval = parseInt(select.value);
    const oldInterval = gameState.autoCleanCacheInterval || 5;
    
    // 停止旧的定时器
    stopAutoCleanCache();
    
    // 应用新设置
    gameState.autoCleanCacheInterval = newInterval;
    
    // 如果间隔大于0，启动新的定时器
    if (newInterval > 0) {
        startAutoCleanCache();
    }
    
    // 更新显示文本
    let intervalText = '';
    if (newInterval < 1) {
        intervalText = '关闭';
    } else if (newInterval < 60) {
        intervalText = `${newInterval}分钟`;
    } else {
        intervalText = `${Math.floor(newInterval / 60)}小时`;
    }
    
    // 如果在存档管理窗口中，更新显示
    const valueEl = document.querySelector('#archiveManagementPage .settings-item:nth-child(4) .settings-value');
    if (valueEl) {
        valueEl.textContent = intervalText;
    }
    
    closeModal();
    
    // 显示通知
    showNotification('设置已保存', `自动清理缓存已设置为：${intervalText}（Mod数据将保留）`);
    
    // 保存游戏
    saveGame();
}

// ==================== 启动自动清理缓存定时器 ====================
function startAutoCleanCache() {
    // 先停止可能存在的旧定时器
    stopAutoCleanCache();
    
    const intervalMinutes = gameState.autoCleanCacheInterval || 5;
    
    if (intervalMinutes <= 0) {
        console.log('自动清理缓存已关闭');
        return;
    }
    
    const intervalMs = intervalMinutes * 60 * 1000; // 转换为毫秒
    
    console.log(`启动自动清理缓存：每${intervalMinutes}分钟执行一次`);
    
    // 立即执行一次清理
    performAutoCleanCache();
    
    // 设置定时器
    gameState.autoCleanCacheTimer = setInterval(() => {
        performAutoCleanCache();
    }, intervalMs);
    
    // 同时设置一个全局引用方便调试
    window.autoCleanCacheInterval = gameState.autoCleanCacheTimer;
}

// ==================== 停止自动清理缓存定时器 ====================
function stopAutoCleanCache() {
    if (gameState.autoCleanCacheTimer) {
        clearInterval(gameState.autoCleanCacheTimer);
        gameState.autoCleanCacheTimer = null;
        console.log('自动清理缓存已停止');
    }
    
    if (window.autoCleanCacheInterval) {
        clearInterval(window.autoCleanCacheInterval);
        window.autoCleanCacheInterval = null;
    }
}

// ==================== 执行自动清理缓存操作（保留Mod数据） ====================
function performAutoCleanCache() {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] 开始自动清理缓存...`);
        
        // 备份核心存档数据（包括Mod数据）
        const coreData = {
            streamerGameState: localStorage.getItem('streamerGameState'),
            streamerGameMods: localStorage.getItem('streamerGameMods'),
            streamerGameActiveMods: localStorage.getItem('streamerGameActiveMods'),
            streamerGameLoadedMods: localStorage.getItem('streamerGameLoadedMods')
        };
        
        // 清理localStorage中其他可能存在的缓存
        const keysToRemove = [];
        for (let key in localStorage) {
            // ✅ 修复：保留Mod相关键，只清理其他以'streamer'开头的键
            if (key !== 'streamerGameState' && 
                key !== 'streamerGameMods' && 
                key !== 'streamerGameActiveMods' && 
                key !== 'streamerGameLoadedMods' &&
                key.startsWith('streamer')) {
                keysToRemove.push(key);
            }
        }
        
        // 删除过期的缓存键
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.error(`清理键 ${key} 失败:`, e);
            }
        });
        
        // 恢复核心数据（包括Mod数据）
        Object.keys(coreData).forEach(key => {
            if (coreData[key]) {
                localStorage.setItem(key, coreData[key]);
            }
        });
        
        console.log(`自动清理完成：清理了 ${keysToRemove.length} 个缓存项`);
        
        // 如果清理了较多空间，显示通知
        if (keysToRemove.length > 0) {
            showNotification('自动清理完成', `清理了 ${keysToRemove.length} 个缓存项，Mod数据已保留`);
        }
        
        saveGame();
    } catch (error) {
        console.error('自动清理缓存失败:', error);
    }
}

// ==================== 存档导出功能（已修复） ====================
function exportSaveData() {
    let timerWasStopped = false;
    
    try {
        // 停止游戏计时器，确保导出时数据一致
        if (typeof stopGameTimer === 'function') {
            stopGameTimer();
            timerWasStopped = true;
        }
        
        // 清理私信（避免数据过大）
        if (typeof cleanupPrivateMessages === 'function') {
            cleanupPrivateMessages();
        }
        
        // 获取最新的游戏状态
        gameState.gameTimer = gameTimer;
        gameState.realStartTime = realStartTime;
        
        // ✅ 生成文件名，包含用户名和当前虚拟日期
        const currentDate = getVirtualDate();
        const fileName = `主播模拟器存档_${gameState.username}_${currentDate.year}年${currentDate.month}月${currentDate.day}日_${Date.now()}.json`;
        
        // 创建JSON数据
        const saveData = JSON.stringify(gameState, null, 2);
        
        // ✅ 优先使用Android原生接口（核心修复）
        if (window.AndroidBridge && window.AndroidBridge.exportGameData) {
            AndroidBridge.exportGameData(saveData, fileName);
        } else {
            // 非Android环境的降级方案（使用Blob下载）
            const blob = new Blob([saveData], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(link.href), 100);
        }
        
        showNotification('导出成功', `存档已保存: ${fileName}`);
        
        // 如果当前在设置页面，刷新显示
        if (document.getElementById('settingsPage').classList.contains('active')) {
            showGameSettings();
        }
        
    } catch (error) {
        console.error('导出存档失败:', error);
        showAlert('导出失败：' + error.message, '错误');
    } finally {
        // 确保计时器重新启动
        if (timerWasStopped && typeof startGameTimer === 'function') {
            startGameTimer();
        }
    }
}

// ==================== 处理导入按钮点击（打开文件选择器） ====================
function handleImportClick() {
    // 创建文件选择器
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!file.name.endsWith('.json')) {
            showAlert('请选择JSON格式的存档文件！', '错误');
            document.body.removeChild(fileInput);
            return;
        }
        
        // 读取文件
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                importSaveData(event.target.result, file.name);
            } catch (error) {
                console.error('读取文件失败:', error);
                showAlert('读取文件失败：' + error.message, '错误');
            }
        };
        
        reader.onerror = function() {
            showAlert('文件读取失败，请重试！', '错误');
        };
        
        reader.readAsText(file);
        document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

// ==================== 导入存档数据 ====================
function importSaveData(fileContent, fileName) {
    try {
        // 解析JSON
        const importedData = JSON.parse(fileContent);
        
        // 验证存档格式
        if (!importedData || typeof importedData !== 'object') {
            throw new Error('无效的存档格式');
        }
        
        // 验证必要字段
        const requiredFields = ['username', 'userId', 'fans', 'worksList'];
        for (const field of requiredFields) {
            if (!(field in importedData)) {
                throw new Error(`存档缺少必要字段: ${field}`);
            }
        }
        
        // 确认导入（会覆盖当前进度）
        showConfirm(`确定要导入存档 "${importedData.username}" 吗？
这将覆盖您当前的游戏进度！`, function(confirmed) {
            if (!confirmed) return;
            
            try {
                // 停止当前游戏计时器
                if (typeof stopGameTimer === 'function') {
                    stopGameTimer();
                }
                
                // 清理所有定时器
                if (gameState.liveInterval) clearInterval(gameState.liveInterval);
                if (gameState.banInterval) clearInterval(gameState.banInterval);
                if (gameState.banDropInterval) clearInterval(gameState.banDropInterval);
                if (gameState.hotSearchInterval) clearInterval(gameState.hotSearchInterval);
                if (gameState.publicOpinionInterval) clearInterval(gameState.publicOpinionInterval);
                if (gameState.inactivityDropInterval) clearInterval(gameState.inactivityDropInterval);
                if (gameState.highAdCountDropInterval) clearInterval(gameState.highAdCountDropInterval);
                
                // 清理私信生成定时器
                if (typeof stopPrivateMessageGeneration === 'function') {
                    stopPrivateMessageGeneration();
                }
                
                // 停止系统消息定时器
                if (typeof stopSystemMessagesTimer === 'function') {
                    stopSystemMessagesTimer();
                }
                
                // 停止自动清理缓存
                if (typeof stopAutoCleanCache === 'function') {
                    stopAutoCleanCache();
                }
                
                // 清理商单相关定时器
                if (gameState.fakeAdPenaltyInterval) {
                    clearInterval(gameState.fakeAdPenaltyInterval);
                }
                if (window.monthlyCheckInterval) {
                    clearInterval(window.monthlyCheckInterval);
                }
                if (window.exposureCheckInterval) {
                    clearInterval(window.exposureCheckInterval);
                }
                
                // 清理作品更新定时器
                if (window.chartRefreshInterval) {
                    clearInterval(window.chartRefreshInterval);
                }
                if (window.devCountdownInterval) {
                    clearInterval(window.devCountdownInterval);
                }
                if (window.worksUpdateInterval) {
                    clearInterval(window.worksUpdateInterval);
                }
                if (window.messagesUpdateInterval) {
                    clearInterval(window.messagesUpdateInterval);
                }
                
                // 清理所有推广定时器
                Object.keys(gameState.trafficWorks).forEach(workId => {
                    const trafficData = gameState.trafficWorks[workId];
                    if (trafficData && trafficData.interval) {
                        clearInterval(trafficData.interval);
                    }
                });
                
                // 清理作品相关定时器
                gameState.worksList.forEach(work => {
                    if (work.recommendInterval) clearInterval(work.recommendInterval);
                    if (work.controversyInterval) clearInterval(work.controversyInterval);
                    if (work.hotInterval) clearInterval(work.hotInterval);
                });
                
                // 重置charts对象
                window.charts = { fans: null, likes: null, views: null, interactions: null };
                
                // 应用导入的存档
                gameState = importedData;
                
                // 确保必要的属性存在（包含自动清理缓存配置）
                const requiredStates = [
                    'following', 'commentLikes', 'messages', 'privateMessageSystem',
                    'systemMessages', 'commentRepliesCount', 'liveHistory',
                    'unlockedAchievements', 'warningHistory'
                ];
                
                requiredStates.forEach(state => {
                    if (gameState[state] === undefined) {
                        if (state === 'privateMessageSystem') {
                            gameState[state] = {
                                conversations: [],
                                unreadCount: 0,
                                lastCheckTime: 0,
                                generationInterval: null
                            };
                        } else if (state === 'systemMessages') {
                            gameState[state] = {
                                unreadCount: 0,
                                messages: [],
                                hotSearchActiveWorks: []
                            };
                        } else if (state === 'following' || state === 'messages') {
                            gameState[state] = [];
                        } else if (state === 'commentLikes' || state === 'unlockedAchievements') {
                            gameState[state] = {};
                        } else if (state === 'commentRepliesCount') {
                            gameState[state] = 0;
                        } else if (state === 'liveHistory' || state === 'warningHistory') {
                            gameState[state] = [];
                        }
                    }
                });
                
                // 确保自动清理缓存配置存在
                if (gameState.autoCleanCacheInterval === undefined) {
                    gameState.autoCleanCacheInterval = 5;
                }
                if (gameState.autoCleanCacheTimer === undefined) {
                    gameState.autoCleanCacheTimer = null;
                }
                
                // 同步计时器
                gameTimer = gameState.gameTimer || 0;
                window.gameTimer = gameTimer;
                realStartTime = Date.now();
                
                // 更新存档中的成就状态
                achievements.forEach(achievement => {
                    achievement.unlocked = gameState.achievements && gameState.achievements.includes(achievement.id);
                });
                
                // 清理私信（保留最近100条）
                if (typeof cleanupPrivateMessages === 'function') {
                    cleanupPrivateMessages();
                }
                
                // 显示成功提示
                showNotification('导入成功', `存档 "${gameState.username}" 已加载！`);
                
                // 保存到本地存储
                saveGame();
                
                // 关闭设置页面
                closeFullscreenPage('settings');
                
                // 更新显示
                if (typeof updateDisplay === 'function') {
                    updateDisplay();
                }
                
                // 重新初始化各种定时器
                if (typeof startGameTimer === 'function') {
                    startGameTimer();
                }
                
                if (typeof startWorkUpdates === 'function') {
                    startWorkUpdates();
                }
                
                // 恢复私信系统
                if (typeof initPrivateMessageOnGameLoad === 'function') {
                    initPrivateMessageOnGameLoad();
                }
                
                // 恢复系统消息
                if (typeof startSystemMessagesTimer === 'function') {
                    startSystemMessagesTimer();
                }
                
                // 恢复自动清理缓存
                if (typeof startAutoCleanCache === 'function') {
                    startAutoCleanCache();
                }
                
                // 启动月度检查
                if (typeof window.startMonthlyCheck === 'function') {
                    window.startMonthlyCheck();
                }
                
                // 启动曝光检查
                if (typeof window.startExposureCheck === 'function') {
                    window.startExposureCheck();
                }
                
                // 恢复开发者模式
                if (gameState.devMode) {
                    document.getElementById('devFloatButton').style.display = 'block';
                    if (typeof devStartCountdownTracker === 'function') {
                        devStartCountdownTracker();
                    }
                }
                
            } catch (error) {
                console.error('导入存档失败:', error);
                showAlert('导入失败：' + error.message, '错误');
                
                // 尝试恢复当前游戏
                try {
                    saveGame();
                    if (typeof updateDisplay === 'function') {
                        updateDisplay();
                    }
                } catch (e) {
                    console.error('恢复当前游戏失败:', e);
                }
            }
        });
        
    } catch (error) {
        console.error('导入存档解析失败:', error);
        showAlert('存档文件格式错误：' + error.message, '错误');
    }
}

// ==================== 清除数据（保持在主设置页面） ====================
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

// ✅ 在文件末尾添加Mod管理函数声明
window.showModManagement = function() {
    // 这个函数在game_mod_system.js中实现
    if (typeof window.showModManagement === 'function') {
        window.showModManagement();
    } else {
        showAlert('Mod系统未加载，请刷新页面重试', '错误');
    }
};

// ✅ 新增：版本信息函数声明（在game_version_info.js中实现）
window.showVersionInfo = function() {
    if (typeof window.showVersionInfo === 'function') {
        window.showVersionInfo();
    } else {
        showAlert('版本信息模块未加载，请刷新页面重试', '错误');
    }
};

window.closeVersionInfo = function() {
    if (typeof window.closeVersionInfo === 'function') {
        window.closeVersionInfo();
    } else {
        showAlert('版本信息模块未加载，请刷新页面重试', '错误');
    }
};

// ==================== ✅ 修改：MOD下载网站 - 改为弹窗复制网址，不再自动跳转 ====================
window.openModDownloadSite = function() {
    const url = 'http://zbgame.555436.xyz'; // 已更新网址
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">📥 Mod下载</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px; text-align: center;">
            <div style="margin-bottom: 20px;">
                <div style="font-size: 16px; color: #667aea; margin-bottom: 10px;">Mod分享网站</div>
                <div style="background: #161823; border-radius: 8px; padding: 12px; font-size: 14px; color: #fff; word-break: break-all;">
                    ${url}
                </div>
                <div style="font-size: 12px; color: #999; margin-top: 10px;">请复制网址在浏览器中打开</div>
            </div>
            <button class="btn" onclick="copyModDownloadUrl('${url}')">复制网址</button>
        </div>
    `;
    showModal(modalContent);
};

// ==================== 复制Mod下载网址 ====================
function copyModDownloadUrl(url) {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('复制成功', '网址已复制到剪贴板');
    } catch (err) {
        showWarning('复制失败，请手动复制：' + url);
    }
    
    document.body.removeChild(textarea);
    closeModal(); // 复制后自动关闭弹窗，与复制QQ群行为一致
}

// ==================== 全局函数绑定 ====================
window.showGameSettings = showGameSettings;
window.showPlayTime = showPlayTime;
window.showQQGroup = showQQGroup;
window.copyQQGroup = copyQQGroup;
window.showDevPasswordModal = showDevPasswordModal;
window.closeDevPasswordModal = closeDevPasswordModal;
window.getArchiveMemorySize = getArchiveMemorySize;
window.cleanArchiveCache = cleanArchiveCache;
window.changeAutoCleanCache = changeAutoCleanCache;
window.confirmAutoCleanCacheChange = confirmAutoCleanCacheChange;
window.startAutoCleanCache = startAutoCleanCache;
window.stopAutoCleanCache = stopAutoCleanCache;
window.performAutoCleanCache = performAutoCleanCache;
window.exportSaveData = exportSaveData;
window.handleImportClick = handleImportClick;
window.importSaveData = importSaveData;
window.showArchiveManagement = showArchiveManagement;
window.closeArchiveManagement = closeArchiveManagement;
window.clearData = clearData;
window.showModManagement = window.showModManagement;
window.showVersionInfo = window.showVersionInfo;
window.closeVersionInfo = window.closeVersionInfo;
window.openModDownloadSite = window.openModDownloadSite;
window.copyModDownloadUrl = copyModDownloadUrl; // 新增绑定