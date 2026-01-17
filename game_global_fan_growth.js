// ==================== 全局作品粉丝增长系统模块 ====================
// 本模块实现合并式的作品粉丝增长机制
// 依赖: game_core.js (gameState, gameTimer, VIRTUAL_DAY_MS)
// 依赖: game_ui_core.js (updateDisplay, addFanChangeNotification)

// 全局变量
window.globalFanGrowthInterval = null;

// 启动全局作品粉丝增长系统
window.startGlobalWorkFanGrowth = function() {
    const system = gameState.workFanGrowthSystem;
    
    // 如果已经运行，不再启动
    if (system.isRunning && system.globalInterval) {
        console.log('全局粉丝增长系统已在运行中');
        return;
    }
    
    console.log('[全局系统] 启动作品粉丝增长机制');
    
    system.isRunning = true;
    system.globalInterval = setInterval(() => {
        // 每秒执行一次全局粉丝变化
        processGlobalFanGrowth();
    }, 1000);
    
    // 立即处理一次，确保新加入的作品立即生效
    processGlobalFanGrowth();
};

// 停止全局作品粉丝增长系统
window.stopGlobalWorkFanGrowth = function() {
    const system = gameState.workFanGrowthSystem;
    
    if (!system.isRunning || !system.globalInterval) {
        console.log('全局粉丝增长系统未运行');
        return;
    }
    
    console.log('[全局系统] 停止作品粉丝增长机制');
    
    clearInterval(system.globalInterval);
    system.globalInterval = null;
    system.isRunning = false;
};

// 将作品添加到全局增长系统
window.addWorkToGlobalFanGrowth = function(workId, isNewWork = false) {
    const system = gameState.workFanGrowthSystem;
    const work = gameState.worksList.find(w => w.id === workId);
    
    if (!work) {
        console.error(`[全局系统] 无法找到作品 ${workId}`);
        return;
    }
    
    // 检查作品是否已在系统中
    const existingIndex = system.activeWorks.findIndex(w => w.workId === workId);
    if (existingIndex !== -1) {
        console.log(`[全局系统] 作品 ${workId} 已存在于系统中，更新状态`);
        // 更新结束时间（恢复模式）
        system.activeWorks[existingIndex].endTime = work.growthEndTime || (gameTimer + 60 * VIRTUAL_DAY_MS);
        return;
    }
    
    // 添加新作品到系统
    const growthDurationInMs = 60 * VIRTUAL_DAY_MS; // 60虚拟天
    const endTime = gameTimer + growthDurationInMs;
    
    // 保存作品的结束时间
    work.growthEndTime = endTime;
    
    system.activeWorks.push({
        workId: workId,
        endTime: endTime,
        baseChangeRate: Math.random() * 0.5 + 0.5 // 0.5-1.0的基础变化率
    });
    
    // 如果是新作品，显示提示
    if (isNewWork) {
        const workType = work.type === 'video' ? '视频' : work.type === 'live' ? '直播' : '动态';
        console.log(`[全局系统] 新${workType}加入增长系统，ID: ${workId}`);
    }
    
    // 确保系统正在运行
    if (!system.isRunning) {
        startGlobalWorkFanGrowth();
    }
};

// 从全局增长系统中移除作品
window.removeWorkFromGlobalFanGrowth = function(workId) {
    const system = gameState.workFanGrowthSystem;
    const index = system.activeWorks.findIndex(w => w.workId === workId);
    
    if (index !== -1) {
        system.activeWorks.splice(index, 1);
        console.log(`[全局系统] 作品 ${workId} 已从增长系统移除`);
        
        // 如果活跃作品为空，可以停止系统（可选）
        // if (system.activeWorks.length === 0) {
        //     stopGlobalWorkFanGrowth();
        // }
    }
};

// 处理全局粉丝增长逻辑
function processGlobalFanGrowth() {
    const system = gameState.workFanGrowthSystem;
    
    if (!system || !system.activeWorks || system.activeWorks.length === 0) {
        // 没有活跃作品，可以停止系统
        if (system.isRunning) {
            stopGlobalWorkFanGrowth();
        }
        return;
    }
    
    // 清理已过期的作品
    const currentTime = gameTimer;
    const expiredWorks = [];
    
    system.activeWorks.forEach((activeWork, index) => {
        if (currentTime >= activeWork.endTime) {
            expiredWorks.push(activeWork.workId);
        }
    });
    
    // 移除过期作品
    expiredWorks.forEach(workId => {
        removeWorkFromGlobalFanGrowth(workId);
        
        // 清理作品的growthEndTime
        const work = gameState.worksList.find(w => w.id === workId);
        if (work) {
            work.growthEndTime = null;
        }
    });
    
    // 如果没有活跃作品了，停止处理
    if (system.activeWorks.length === 0) {
        return;
    }
    
    // 计算全局粉丝变化
    // 基准值：每个作品贡献 +/-1-3 粉丝
    let totalFanChange = 0;
    let gainWorks = 0;
    let lossWorks = 0;
    
    system.activeWorks.forEach(activeWork => {
        const work = gameState.worksList.find(w => w.id === activeWork.workId);
        if (!work) return;
        
        // 60%概率增粉，40%概率掉粉
        const isGain = Math.random() > 0.4;
        const maxChange = isGain ? 3 : 2; // 增粉1-3，掉粉1-2
        const change = Math.floor(Math.random() * maxChange) + 1;
        
        if (isGain) {
            totalFanChange += change;
            gainWorks++;
        } else {
            totalFanChange -= change;
            lossWorks++;
        }
    });
    
    // 应用粉丝变化
    if (totalFanChange !== 0) {
        gameState.fans = Math.max(0, gameState.fans + totalFanChange);
        
        // 更新今日统计
        if (totalFanChange > 0) {
            gameState.todayNewFans += totalFanChange;
        } else {
            gameState.todayLostFans += Math.abs(totalFanChange);
        }
        
        // 20%概率显示通知
        if (Math.random() < 0.2) {
            const isNetGain = totalFanChange > 0;
            const icon = isNetGain ? '⬆️' : '⬇️';
            const title = isNetGain ? `作品带动${gainWorks}个` : `作品导致${lossWorks}个`;
            const content = isNetGain ? '粉丝被作品吸引' : '粉丝取消关注';
            
            addFanChangeNotification(icon, title, content, isNetGain ? 'gain' : 'loss', Math.abs(totalFanChange));
        }
        
        // 更新显示
        if (typeof updateDisplay === 'function') {
            updateDisplay();
        }
    }
    
    // 更新系统统计
    system.totalFanChange += totalFanChange;
}

// 模块加载完成日志
console.log('✅ 全局作品粉丝增长系统模块已加载');

// ==================== 全局函数绑定 ====================
window.startGlobalWorkFanGrowth = window.startGlobalWorkFanGrowth;
window.stopGlobalWorkFanGrowth = window.stopGlobalWorkFanGrowth;
window.addWorkToGlobalFanGrowth = window.addWorkToGlobalFanGrowth;
window.removeWorkFromGlobalFanGrowth = window.removeWorkFromGlobalFanGrowth;
window.processGlobalFanGrowth = window.processGlobalFanGrowth;
window.globalFanGrowthInterval = window.globalFanGrowthInterval;
