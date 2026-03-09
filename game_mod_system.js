// ==================== Mod系统核心 ====================
// Mod存储键名
const MOD_STORAGE_KEY = 'streamerGameMods';
const ACTIVE_MODS_KEY = 'streamerGameActiveMods';
const LOADED_MODS_KEY = 'streamerGameLoadedMods'; // ✅ 新增：已加载Mod列表

// Mod文件管理器
class ModManager {
    constructor() {
        this.mods = this.loadMods();
        this.activeMods = this.loadActiveMods();
        this.loadedMods = this.loadLoadedMods(); // ✅ 新增：加载已加载列表
    }

    // 从localStorage加载Mod列表
    loadMods() {
        try {
            const stored = localStorage.getItem(MOD_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('加载Mod失败:', error);
            return [];
        }
    }

    // 加载激活的Mod列表
    loadActiveMods() {
        try {
            const stored = localStorage.getItem(ACTIVE_MODS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('加载激活Mod失败:', error);
            return [];
        }
    }

    // ✅ 新增：加载已加载Mod列表
    loadLoadedMods() {
        try {
            const stored = localStorage.getItem(LOADED_MODS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('加载已加载Mod失败:', error);
            return [];
        }
    }

    // 保存Mod列表
    saveMods() {
        localStorage.setItem(MOD_STORAGE_KEY, JSON.stringify(this.mods));
    }

    // 保存激活的Mod列表
    saveActiveMods() {
        localStorage.setItem(ACTIVE_MODS_KEY, JSON.stringify(this.activeMods));
    }

    // ✅ 新增：保存已加载Mod列表
    saveLoadedMods() {
        localStorage.setItem(LOADED_MODS_KEY, JSON.stringify(this.loadedMods));
    }

    // 添加新Mod
    addMod(name, code, description = '') {
        const mod = {
            id: Date.now(),
            name: name,
            code: code,
            description: description,
            createdAt: new Date().toISOString(),
            enabled: false
        };
        this.mods.push(mod);
        this.saveMods();
        return mod;
    }

    // 删除Mod
    deleteMod(id) {
        this.mods = this.mods.filter(mod => mod.id !== id);
        this.activeMods = this.activeMods.filter(modId => modId !== id);
        this.loadedMods = this.loadedMods.filter(modId => modId !== id); // ✅ 同步清理已加载列表
        this.saveMods();
        this.saveActiveMods();
        this.saveLoadedMods(); // ✅ 保存已加载列表
    }

    // 切换Mod启用状态
    toggleMod(id) {
        const mod = this.mods.find(m => m.id === id);
        if (mod) {
            mod.enabled = !mod.enabled;
            if (mod.enabled) {
                if (!this.activeMods.includes(id)) {
                    this.activeMods.push(id);
                }
            } else {
                this.activeMods = this.activeMods.filter(modId => modId !== id);
            }
            this.saveMods();
            this.saveActiveMods();
        }
    }

    // 获取所有Mod
    getAllMods() {
        return this.mods;
    }

    // 获取激活的Mod
    getActiveMods() {
        return this.mods.filter(mod => this.activeMods.includes(mod.id));
    }

    // 清空所有Mod
    clearAllMods() {
        this.mods = [];
        this.activeMods = [];
        this.loadedMods = []; // ✅ 清空已加载列表
        this.saveMods();
        this.saveActiveMods();
        this.saveLoadedMods();
    }

    // ✅ 新增：从JS代码中提取元数据
    extractMetadataFromJS(code) {
        try {
            // 匹配各种形式的元数据定义
            const patterns = [
                // window.xxxMetadata = {...};
                /window\.(\w+Metadata)\s*=\s*({[\s\S]*?});?\s*$/m,
                // var xxxMetadata = {...};
                /var\s+(\w+Metadata)\s*=\s*({[\s\S]*?});?\s*$/m,
                // const xxxMetadata = {...};
                /const\s+(\w+Metadata)\s*=\s*({[\s\S]*?});?\s*$/m,
                // let xxxMetadata = {...};
                /let\s+(\w+Metadata)\s*=\s*({[\s\S]*?});?\s*$/m,
                // 匹配 Mod元数据对象，支持没有分号结尾的情况
                /window\.(\w+Metadata)\s*=\s*({[\s\S]*?})(?:\s*;|\s*$)/m
            ];
            
            for (const pattern of patterns) {
                const match = code.match(pattern);
                if (match && match[2]) {
                    try {
                        // 清理可能的尾部逗号（JSON不允许，但JS对象允许）
                        let metadataStr = match[2].trim()
                            .replace(/,\s*}/g, '}')  // 移除对象末尾的逗号
                            .replace(/,\s*]/g, ']'); // 移除数组末尾的逗号
                        
                        // 使用Function构造器安全地解析对象（比eval安全）
                        const metadata = new Function('return ' + metadataStr)();
                        if (metadata && typeof metadata === 'object') {
                            return metadata;
                        }
                    } catch (parseError) {
                        console.warn('解析元数据对象失败，尝试下一个模式:', parseError);
                        continue;
                    }
                }
            }
        } catch (error) {
            console.warn('提取Mod元数据失败:', error);
        }
        return null;
    }

    // ✅ 新增：直接通过内容和文件名导入Mod（无需File对象）
    importModFromContent(content, fileName) {
        return new Promise((resolve, reject) => {
            try {
                // 尝试提取元数据
                const metadata = this.extractMetadataFromJS(content);
                let name = fileName;
                let description = '';

                if (metadata) {
                    name = metadata.name || name;
                    description = metadata.description || '';
                } else {
                    // 移除文件扩展名作为默认名称
                    name = fileName.replace(/\.(js|json|txt)$/i, '');
                }

                // 如果内容是JSON格式，尝试解析
                let code = content;
                if (fileName.endsWith('.json')) {
                    try {
                        const jsonObj = JSON.parse(content);
                        if (jsonObj.code) {
                            code = jsonObj.code;
                            name = jsonObj.name || name;
                            description = jsonObj.description || description;
                        }
                    } catch (e) {
                        // 不是有效的JSON，当作纯文本处理
                    }
                }

                // 添加到Mod列表
                const mod = this.addMod(name, code, description);
                resolve(mod);
            } catch (error) {
                reject(error);
            }
        });
    }

    // 从文件导入Mod（复用importModFromContent）
    importModFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    // 直接调用新增方法
                    this.importModFromContent(content, file.name).then(resolve).catch(reject);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }
}

// 全局Mod管理器实例
window.modManager = new ModManager();

// ==================== 页面加载时自动执行已加载的Mod ====================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.modManager && window.modManager.loadedMods.length > 0) {
            console.log(`检测到 ${window.modManager.loadedMods.length} 个已加载Mod，正在自动执行...`);
            
            let successCount = 0;
            window.modManager.loadedMods.forEach(modId => {
                const mod = window.modManager.mods.find(m => m.id === modId);
                if (mod && mod.code) {
                    try {
                        const modFunction = new Function('gameState', 'window', 'document', mod.code);
                        modFunction(gameState, window, document);
                        console.log(`✅ 自动加载Mod: ${mod.name}`);
                        successCount++;
                    } catch (error) {
                        console.error(`❌ 自动加载Mod失败: ${mod.name}`, error);
                    }
                }
            });
            
            // ✅ 更新已加载计数显示
            window.loadedModCount = successCount;
            setTimeout(() => {
                const loadedEl = document.getElementById('loadedModCount');
                if (loadedEl && typeof loadedEl.textContent !== 'undefined') {
                    loadedEl.textContent = successCount;
                }
            }, 500);
            
            // ✅ 显示加载结果
            if (successCount > 0) {
                showEventPopup('🎮 Mod自动加载', `成功加载 ${successCount} 个Mod！`);
            }
        }
    }, 2000); // 页面加载2秒后执行，确保游戏核心已初始化
});

// ==================== 显示Mod管理主界面 ====================
function showModManagement() {
    const content = `
        <div class="fullscreen-header">
            <div class="back-btn" onclick="closeModManagement()">←</div>
            <div class="fullscreen-title">🎮 Mod管理中心</div>
            <div class="fullscreen-action" style="opacity:0; cursor:default;">占位</div>
        </div>
        <div id="modManagementPageContent" class="fullscreen-content">
            <div style="padding: 10px;">
                <!-- 如何制作Mod -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 15px; margin-bottom: 20px; cursor: pointer;" onclick="showModHelp()">
                    <div style="font-size: 16px; font-weight: bold; color: #fff; margin-bottom: 5px;">
                        ❓ 如何制作Mod？
                    </div>
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.9);">
                        点击查看Mod制作教程
                    </div>
                </div>

                <!-- 粘贴Mod代码 -->
                <div style="margin-bottom: 20px;">
                    <div class="input-label" style="color: #00f2ea; margin-bottom: 10px;">
                        📋 粘贴Mod代码到文本框
                    </div>
                    <textarea class="text-input" id="modCodeInput" rows="8" 
                              placeholder="将Mod代码粘贴到这里..." 
                              style="background: #222; border: 2px solid #333; color: #fff; font-family: monospace; font-size: 12px;"></textarea>
                    <div style="margin-top: 10px;">
                        <button class="btn" onclick="confirmAddMod()" style="width: 100%; background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); color: #000; font-weight: bold;">
                            将以上代码组建Mod
                        </button>
                    </div>
                </div>

                <!-- Mod文件管理 -->
                <div style="background: #161823; border-radius: 10px; padding: 15px; border: 1px solid #333; margin-bottom: 20px;">
                    <div class="input-label" style="margin-bottom: 15px; color: #667aea; font-weight: bold;">
                        📁 Mod文件管理
                    </div>
                    <div id="modFileList" style="max-height: 250px; overflow-y: auto; margin-bottom: 15px;">
                        ${renderModFileList()}
                    </div>
                    <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-secondary" onclick="importModFile()" style="flex: 1; min-width: 120px;">
                            📥 导入Mod文件
                        </button>
                        <button class="btn btn-danger" onclick="deleteSelectedMods()" style="flex: 1; min-width: 120px;">
                            🗑️ 删除选中Mod
                        </button>
                        <button class="btn" onclick="loadSelectedMods()" style="flex: 2; min-width: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-weight: bold;">
                            🚀 确定加载Mod
                        </button>
                        <button class="btn btn-danger" onclick="unloadSelectedMods()" style="flex: 2; min-width: 200px; background: linear-gradient(135deg, #ff6b00 0%, #ff0050 100%); font-weight: bold;">
                            ⚠️ 取消加载Mod
                        </button>
                    </div>
                </div>

                <!-- Mod状态统计 -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px;">
                    <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #667aea;" id="totalModCount">${window.modManager.getAllMods().length}</div>
                        <div style="font-size: 11px; color: #999;">总计Mod</div>
                    </div>
                    <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #00f2ea;" id="activeModCount">${window.modManager.getActiveMods().length}</div>
                        <div style="font-size: 11px; color: #999;">已启用</div>
                    </div>
                    <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 10px; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #ff6b00;" id="loadedModCount">${window.modManager.loadedMods.length}</div>
                        <div style="font-size: 11px; color: #999;">已加载</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 获取或创建页面元素
    let page = document.getElementById('modManagementPage');
    if (!page) {
        page = document.createElement('div');
        page.id = 'modManagementPage';
        page.className = 'fullscreen-page';
        document.body.appendChild(page);
    }
    
    page.innerHTML = content;
    
    // 显示全屏页面
    page.classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== 关闭Mod管理全屏页面 ====================
function closeModManagement() {
    const page = document.getElementById('modManagementPage');
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

// ==================== 显示Mod制作帮助（改为全屏） ====================
function showModHelp() {
    const helpContent = `
        <div class="fullscreen-header">
            <div class="back-btn" onclick="closeModHelp()">←</div>  <!-- ✅ 改为close函数 -->
            <div class="fullscreen-title">📚 Mod制作教程</div>
            <div class="fullscreen-action" style="opacity:0; cursor:default;">占位</div>
        </div>
        <div id="modHelpPageContent" class="fullscreen-content">
            <div style="padding: 10px;">
                <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 20px; border: 1px solid #333;">
                    <div style="font-size: 14px; font-weight: bold; color: #667aea; margin-bottom: 15px;">
                        如何制作Mod？
                    </div>
                    <div style="font-size: 12px; color: #ccc; line-height: 1.6; margin-bottom: 15px;">
                        复制以下文本，去任意一个AI把文本粘贴出来，并写出你要制作什么让AI来给你制作出来。
                    </div>
                    
                    <div style="background: #222; border: 1px solid #333; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                        <div style="font-size: 11px; color: #999; margin-bottom: 8px;">
                            📋 点击复制游戏描述文本（已自动生成）：
                        </div>
                        <div style="background: #111; border-radius: 5px; padding: 10px; font-size: 11px; color: #ccc; font-family: monospace; max-height: 150px; overflow-y: auto; white-space: pre-wrap; line-height: 1.4;" id="gameDescription">${escapeHtml(generateGameDescription())}</div>
                        <button class="btn btn-secondary" onclick="copyGameDescription()" style="margin-top: 10px; width: 100%; font-size: 12px; padding: 8px;">
                            📋 复制游戏描述
                        </button>
                    </div>
                </div>

                <div style="background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                    <div style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 10px;">
                        💡 Mod制作示例
                    </div>
                    <div style="font-size: 11px; color: #333; line-height: 1.5;">
                        例如：你可以要求AI制作一个"自动发布作品Mod"，让游戏每隔一段时间自动发布随机内容。
                    </div>
                </div>

                <div style="background: #161823; border-radius: 10px; padding: 15px; border: 1px solid #333;">
                    <div style="font-size: 14px; font-weight: bold; color: #667aea; margin-bottom: 10px;">
                        🔧 Mod代码示例
                    </div>
                    <div style="font-size: 11px; color: #999; line-height: 1.5; margin-bottom: 10px;">
                        Mod代码应该是有效的JavaScript代码，可以直接在游戏中执行。
                    </div>
                    <textarea class="text-input" rows="6" style="background: #222; border: 1px solid #333; color: #fff; font-family: monospace; font-size: 10px;" readonly>
// 示例Mod：自动发布作品
(function() {
    // 检查是否已经存在自动发布
    if (window.autoPostInterval) return;
    
    // 每虚拟天自动发布一条随机动态
    window.autoPostInterval = setInterval(() => {
        const contents = ['大家好！', '今天心情不错~', '持续更新中', '感谢支持！', '😊'];
        const randomContent = contents[Math.floor(Math.random() * contents.length)];
        
        // 调用游戏的创建动态函数
        if (typeof createPost === 'function') {
            // 模拟用户输入
            const originalContent = document.getElementById('postContent');
            if (originalContent) {
                originalContent.value = randomContent;
                createPost();
            }
        }
    }, VIRTUAL_DAY_MS); // 每虚拟天发布一次
    
    console.log('✅ 自动发布Mod已激活！');
})();</textarea>

                    <!-- 新增：教程2按钮 -->
                    <button class="btn" onclick="window.location.href='jz.html'" style="width: 100%; margin-top: 15px; background: linear-gradient(135deg, #00f2ea 0%, #667eea 100%); color: #000; font-weight: bold;">
                        📚 教程2：让AI看到游戏文件来制作
                    </button>
                </div>

                <button class="btn" onclick="closeModHelp()" style="width: 100%; margin-top: 20px;">返回Mod管理</button>  <!-- ✅ 改为close函数 -->
            </div>
        </div>
    `;
    
    // 获取或创建页面元素
    let page = document.getElementById('modHelpPage');
    if (!page) {
        page = document.createElement('div');
        page.id = 'modHelpPage';
        page.className = 'fullscreen-page';
        document.body.appendChild(page);
    }
    
    page.innerHTML = helpContent;
    
    // 显示全屏页面
    page.classList.add('active');
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
}

// ==================== ✅ 新增：关闭Mod教程页面 ====================
function closeModHelp() {
    const page = document.getElementById('modHelpPage');
    if (page) {
        page.classList.remove('active');
    }
    
    // 返回Mod管理页面，而不是关闭整个设置
    showModManagement();
}

// ==================== 辅助函数：转义HTML特殊字符 ====================
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ==================== 核心功能：自动生成游戏描述文本 ====================
function generateGameDescription() {
    try {
        // 确保gameState已初始化
        const hasGameState = typeof gameState !== 'undefined' && gameState !== null;
        
        // 基础游戏信息
        const description = [];
        description.push('=== 主播模拟器游戏完整功能说明 ===');
        description.push('');
        
        // 核心系统
        description.push('【核心系统】');
        description.push('- 游戏采用虚拟时间系统：1分钟 = 1虚拟天，游戏从2025年1月1日开始计时');
        description.push('- 拥有完整的粉丝系统：支持自然涨粉和掉粉、热搜效应、舆论风波、不活跃惩罚等多种机制');
        description.push('- 拥有经济系统：通过作品收益和商单获得游戏货币');
        description.push('- 拥有成就系统：内置28个成就，记录从新手到传奇的完整主播生涯');
        description.push('- 拥有警告系统：20次警告触发封号，支持申诉机制');
        description.push('- 存档系统：支持导出、导入、自动清理缓存等完整存档管理功能');
        description.push('');
        
        // 内容创作系统
        description.push('【内容创作系统】');
        description.push('- 支持发布三种内容形式：视频、动态、直播');
        description.push('- 作品数据从0开始自然增长，支持播放、点赞、评论、转发四种互动');
        description.push('- 拥有流量推广功能：可购买流量加速作品传播');
        description.push('- 拥有推荐机制：作品可能被系统推荐获得额外曝光');
        description.push('- 拥有热搜机制：作品可能登上热搜获得大量曝光');
        description.push('- 支持设置作品为私密状态');
        description.push('- 直播系统支持实时观看、打赏收益、直播涨粉');
        description.push('');
        
        // 商单系统
        description.push('【商单合作系统】');
        description.push('- 提供真实商单和虚假商单两种类型');
        description.push('- 真实商单：收益较低但安全稳定，完成50个可解锁成就');
        description.push('- 虚假商单：收益极高但会被平台检测到，导致封号和持续掉粉惩罚');
        description.push('- 商单完成数量统计：完成10个解锁"广告达人"，单次收入超5万解锁"百万单王"');
        description.push('- 虚假商单惩罚：连续3个月不接触虚假商单可解除负面状态');
        description.push('');
        
        // 抽奖系统
        if (hasGameState && typeof window.addWorkToGlobalFanGrowth !== 'undefined') {
            description.push('【抽奖福利系统】');
            description.push('- 可发起抽奖活动，设置奖品和参与方式');
            description.push('- 抽奖期间作品获得特殊标识，疯狂涨粉和增加互动');
            description.push('- 抽奖结束后会经历短暂掉粉期');
            description.push('- 支持多种奖品：虚拟礼物、实物奖品、现金红包等');
            description.push('- 支持自动开奖和手动开奖两种模式');
            description.push('');
        }
        
        // 热搜与舆论系统
        description.push('【热搜与舆论系统】');
        description.push('- 随机触发热搜事件：持续1-3天，期间每秒涨粉50-150人');
        description.push('- 平台会推送热搜话题邀请，接受后作品获得爆炸式曝光');
        description.push('- 随机触发舆论风波：持续1-3天，期间每秒掉粉10-60人');
        description.push('- 两种事件都有明显的视觉提示和倒计时显示');
        description.push('');
        
        // 互动系统
        description.push('【社交互动系统】');
        description.push('- 完整的评论区：支持用户评论、主播回复、评论点赞');
        description.push('- 评论支持倒序、正序、最火三种排序方式');
        description.push('- 评论点赞数会自动增长，模拟真实互动');
        description.push('- 关注系统：可关注其他用户，互相关注增加社交属性');
        description.push('- 用户主页：可查看用户基本信息和统计数据');
        description.push('- 评论支持嵌套回复，形成对话链');
        description.push('');
        
        // 消息系统
        description.push('【消息通知系统】');
        description.push('- 实时消息弹窗：粉丝变化、系统事件、成就解锁等');
        description.push('- 消息免打扰模式：可关闭消息红点提醒');
        description.push('- 支持多种消息类型：涨粉、掉粉、互动、系统通知等');
        description.push('- 所有通知采用右上角滑入式弹窗，3.5秒自动消失');
        description.push('');
        
        // 私信系统
        if (hasGameState && gameState.privateMessageSystem) {
            description.push('【私信系统】');
            description.push('- 接收来自粉丝的私信，包含支持赞美或恶意辱骂内容');
            description.push('- 支持私信回复和对话记录');
            description.push('- 未读私信有红点标记');
            description.push('- 定期自动生成新的私信（每30秒检查一次）');
            description.push('');
        }
        
        // 系统消息
        if (hasGameState && gameState.systemMessages) {
            description.push('【系统消息中心】');
            description.push('- 提供官方系统通知，包含平台政策、活动邀请等');
            description.push('- 支持接受或拒绝热搜话题邀请');
            description.push('- 邀请接受后关联作品进入热搜状态');
            description.push('');
        }
        
        // 数据可视化
        description.push('【数据可视化】');
        description.push('- 提供粉丝、点赞、播放量的趋势图表');
        description.push('- 支持60天的历史数据展示');
        description.push('- 点击主界面的统计数据可进入全屏分析页');
        description.push('- 图表采用Chart.js实现，支持实时更新');
        description.push('');
        
        // 成就系统详情
        description.push('【成就系统详情】');
        description.push('- 成就1-4：粉丝里程碑（1、1000、10万、1000万）');
        description.push('- 成就5：单条作品播放量破百万');
        description.push('- 成就6：累计获得10万个赞');
        description.push('- 成就7：发布100个作品');
        description.push('- 成就8：首次直播获得1000观看');
        description.push('- 成就9-10：收益里程碑（首次、100万）');
        description.push('- 成就11：单条动态获得1万转发');
        description.push('- 成就12：单条作品获得5000评论');
        description.push('- 成就14：从封号中申诉成功（逆风翻盘）');
        description.push('- 成就15：触发50次随机事件（幸运儿）');
        description.push('- 成就16：关注1000个用户（社交达人）');
        description.push('- 成就19：回复1000条评论（宠粉狂魔）');
        description.push('- 成就20：解锁所有成就（传奇主播）');
        description.push('- 成就21-25：商单相关成就（新人、达人、单王、大师）');
        description.push('- 成就26-28：商单惩罚相关成就（赌徒、身败名裂、诚信经营）');
        description.push('');
        
        // Mod系统
        description.push('【Mod扩展系统】');
        description.push('- 完整的Mod管理器：支持添加、删除、启用、禁用Mod');
        description.push('- Mod持久化存储：Mod数据保存在localStorage中');
        description.push('- 支持从文件导入Mod（.js、.json格式）');
        description.push('- 支持批量加载多个Mod');
        description.push('- 提供Mod统计：总计数、已启用数、已加载数');
        description.push('- 页面加载时自动加载已加载的Mod');
        description.push('');
        
        // 违规与惩罚系统
        description.push('【违规与惩罚系统】');
        description.push('- 违规关键词检测：包含暴力、色情、政治、谣言、诈骗、盗版、侵权、辱骂、歧视、毒品等');
        description.push('- 内容检测：发布作品时自动检测标题和内容是否违规');
        description.push('- 警告机制：每次违规增加1次警告，达到20次触发封号');
        description.push('- 不更新惩罚：连续7天不发布作品，触发粉丝流失惩罚');
        description.push('- 虚假商单惩罚：接虚假商单后持续掉粉，直到3个月不接触');
        description.push('- 惩罚警告：触发惩罚时显示明显警告弹窗');
        description.push('');
        
        // 申诉系统
        description.push('【账号申诉系统】');
        description.push('- 封号后支持申诉，需要写申诉理由');
        description.push('- 申诉理由由AI检测真诚度（使用关键词匹配算法）');
        description.push('- 真诚度评分需超过阈值才能申诉成功');
        description.push('- 申诉成功：-5警告次数，账号解封');
        description.push('- 申诉失败：失去再次申诉机会');
        description.push('- 因接假商单被封号无法申诉');
        description.push('');
        
        // 技术实现细节
        description.push('【技术实现与接口说明】');
        description.push('- 游戏核心数据存储在全局变量gameState中');
        description.push('- 虚拟时间计时器：gameTimer（毫秒），VIRTUAL_DAY_MS=60000（1分钟=1天）');
        description.push('- 作品数据结构：包含id、type、title/content、views/likes/comments/shares、time等');
        description.push('- 互动数据：点赞、评论、转发都会增加totalInteractions计数');
        description.push('- 粉丝变化：通过addFanChangeNotification(gain|loss)函数记录');
        description.push('- 消息系统：gameState.messages数组存储所有互动消息');
        description.push('- 私信系统：gameState.privateMessageSystem对象管理私信');
        description.push('- 系统消息：gameState.systemMessages对象管理系统消息');
        description.push('- 评论点赞：gameState.commentLikes对象记录用户点赞的评论');
        description.push('- 关注列表：gameState.following数组存储关注用户列表');
        description.push('- 抽奖数据：作品对象包含isRaffle、raffleStatus、prize等相关属性');
        description.push('- 热搜数据：作品对象包含isHotSearchWork、hotSearchData等相关属性');
        description.push('- 关键函数：createVideo()、createPost()、toggleLive()等用于内容创作');
        description.push('- 关键函数：addFanChangeNotification(icon, title, content, type, count)用于粉丝变化通知');
        description.push('- 关键函数：showEventPopup(title, content)用于右上角弹窗通知');
        description.push('- 关键函数：startHotSearch(title)、startPublicOpinionCrisis(title)用于事件触发');
        description.push('');
        
        description.push('【重要开发提示】');
        description.push('- 所有定时器使用前需检查是否已存在，避免重复创建');
        description.push('- 修改gameState数据后需调用saveGame()保存');
        description.push('- 更新UI需调用updateDisplay()刷新显示');
        description.push('- 粉丝数必须保持>=0，使用Math.max(0, value)保护');
        description.push('- 时间计算使用gameTimer和VIRTUAL_DAY_MS常量');
        description.push('- 避免在事件处理中直接操作DOM，使用函数封装');
        description.push('- 所有随机数使用Math.random()生成');
        description.push('- 字符串操作注意转义特殊字符');
        description.push('');
        
        description.push('=== 描述结束 ===');
        
        return description.join('\n');
        
    } catch (error) {
        console.error('生成游戏描述失败:', error);
        return '=== 主播模拟器游戏完整功能说明 ===\n\n游戏描述生成失败，请确保游戏已完全加载。\n\n这是一个功能完整的主播模拟器游戏，包含内容创作、粉丝管理、商单合作、抽奖活动、社交互动等多个系统。';
    }
}

// ==================== 辅助函数：复制游戏描述文本 ====================
function copyGameDescription() {
    const text = generateGameDescription();
    
    // 创建临时文本区域
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('复制成功', '游戏描述已复制到剪贴板');
    } catch (err) {
        showWarning('复制失败，请手动复制');
    }
    
    document.body.removeChild(textarea);
}

// ==================== 确认添加Mod ====================
function confirmAddMod() {
    const code = document.getElementById('modCodeInput').value.trim();
    if (!code) {
        showAlert('请输入Mod代码', '提示');
        return;
    }
    
    // 自动生成Mod名称
    const name = `自定义Mod_${Date.now().toString().slice(-4)}`;
    const description = '从粘贴的代码创建的Mod';
    
    try {
        // 验证代码语法（简单检查）
        new Function(code);
        
        // 添加到Mod管理器
        const mod = window.modManager.addMod(name, code, description);
        
        showAlert(`Mod添加成功：${mod.name}`, '成功');
        
        // 清空输入框
        document.getElementById('modCodeInput').value = '';
        
        // 刷新列表
        refreshModFileList();
    } catch (error) {
        showAlert(`Mod代码有误：${error.message}`, '错误');
    }
}

// ==================== 渲染Mod文件列表 ====================
function renderModFileList() {
    const mods = window.modManager.getAllMods();
    
    if (mods.length === 0) {
        return '<div style="text-align: center; color: #999; padding: 20px;">暂无Mod文件</div>';
    }
    
    return mods.map(mod => `
        <div class="work-item" style="margin-bottom: 8px; cursor: pointer;" onclick="toggleModSelection(${mod.id})">
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <div style="width: 20px; height: 20px; border: 2px solid #667eea; border-radius: 5px; flex-shrink: 0; margin-top: 2px;" id="mod-checkbox-${mod.id}"></div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                        <div style="font-size: 14px; font-weight: bold; color: #fff;">${mod.name}</div>
                        <div style="font-size: 10px; color: #999;">${formatTime(new Date(mod.createdAt).getTime())}</div>
                    </div>
                    <div style="font-size: 12px; color: #ccc; margin-bottom: 5px;">
                        ${mod.description || '暂无描述'}
                    </div>
                    <div style="display: flex; gap: 10px; font-size: 11px; color: #999;">
                        <span>📄 ${mod.code.length} 字符</span>
                        <span style="color: ${mod.enabled ? '#00f2ea' : '#999'};" id="mod-status-${mod.id}">${mod.enabled ? '✅ 已启用' : '⚪ 未启用'}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ==================== Mod选择状态管理 ====================
window.selectedModIds = [];

function toggleModSelection(modId) {
    const index = window.selectedModIds.indexOf(modId);
    const checkbox = document.getElementById(`mod-checkbox-${modId}`);
    const item = checkbox.closest('.work-item');
    
    if (index > -1) {
        window.selectedModIds.splice(index, 1);
        checkbox.style.background = '';
        item.style.border = '';
        item.style.background = '#161823';
    } else {
        window.selectedModIds.push(modId);
        checkbox.style.background = '#667eea';
        item.style.border = '2px solid #667eea';
        item.style.background = '#222';
    }
}

// ==================== 导入Mod文件 ====================
function importModFile() {
    // 创建文件选择器
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.js,.json,.txt';
    fileInput.style.display = 'none';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // 验证文件类型
        if (!file.name.match(/\.(js|json|txt)$/i)) {
            showAlert('请上传.js、.json或.txt格式的文件', '错误');
            document.body.removeChild(fileInput);
            return;
        }
        
        // 读取文件（已重构为调用importModFromContent）
        window.modManager.importModFromFile(file)
            .then(mod => {
                showNotification('导入成功', `Mod "${mod.name}" 已导入`);
                refreshModFileList();
            })
            .catch(error => {
                showAlert(`导入失败：${error.message}`, '错误');
            });
        
        document.body.removeChild(fileInput);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
}

// ==================== 删除选中的Mod ====================
function deleteSelectedMods() {
    if (!window.selectedModIds || window.selectedModIds.length === 0) {
        showAlert('请先选择要删除的Mod', '提示');
        return;
    }
    
    showConfirm(`确定要删除选中的 ${window.selectedModIds.length} 个Mod吗？

⚠️ 重要提示：
删除Mod后，需要重新进入游戏才能完全清除Mod的影响。

此操作不可恢复！`, function(confirmed) {
        if (!confirmed) return;
        
        window.selectedModIds.forEach(modId => {
            window.modManager.deleteMod(modId);
        });
        
        window.selectedModIds = [];
        refreshModFileList();
        
        showNotification('删除成功', '选中的Mod已删除，请重新进入游戏生效');
    }, '删除Mod');
}

// ✅ 修复核心问题：加载选中的Mod并更新状态（不刷新页面）
window.loadSelectedMods = function() {
    // 获取选中的mod
    const selectedMods = window.selectedModIds.map(id => 
        window.modManager.mods.find(mod => mod.id === id)
    ).filter(mod => mod); // 过滤掉未找到的
    
    if (selectedMods.length === 0) {
        showAlert('没有选中的Mod需要加载', '提示');
        return;
    }
    
    showConfirm(`确定要加载 ${selectedMods.length} 个Mod吗？加载后将立即生效。`, function(confirmed) {
        if (!confirmed) return;
        
        try {
            // 执行所有选中的Mod代码
            let successCount = 0;
            selectedMods.forEach(mod => {
                try {
                    // 创建一个安全的执行环境
                    const modFunction = new Function('gameState', 'window', 'document', mod.code);
                    modFunction(gameState, window, document);
                    
                    // ✅ 关键修复：更新Mod状态为已启用
                    mod.enabled = true;
                    if (!window.modManager.activeMods.includes(mod.id)) {
                        window.modManager.activeMods.push(mod.id);
                    }
                    
                    // ✅ 关键修复：添加到已加载列表
                    if (!window.modManager.loadedMods.includes(mod.id)) {
                        window.modManager.loadedMods.push(mod.id);
                    }
                    
                    console.log(`✅ Mod加载成功: ${mod.name}`);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Mod加载失败: ${mod.name}`, error);
                    showAlert(`Mod "${mod.name}" 加载失败: ${error.message}`, '错误');
                }
            });
            
            // ✅ 保存所有状态
            window.modManager.saveMods();
            window.modManager.saveActiveMods();
            window.modManager.saveLoadedMods(); // ✅ 保存已加载列表
            
            // ✅ 更新已加载计数（从已加载列表获取真实数量）
            window.loadedModCount = window.modManager.loadedMods.length;
            updateLoadedModCount();
            
            // ✅ 显示成功提示（不刷新页面）
            showAlert(`成功加载 ${successCount}/${selectedMods.length} 个Mod！已即时生效。`, '加载成功');
            
            // ✅ 刷新Mod列表显示
            refreshModFileList();
            
            // ✅ 重置选择状态
            window.selectedModIds = [];
            
        } catch (error) {
            showAlert(`Mod加载失败: ${error.message}`, '错误');
        }
    }, '加载Mod');
};

// ==================== ✅ 新增：取消加载选中的Mod ====================
function unloadSelectedMods() {
    // 获取选中的mod
    const selectedMods = window.selectedModIds.map(id => 
        window.modManager.mods.find(mod => mod.id === id)
    ).filter(mod => mod && mod.enabled); // 过滤掉未找到的
    
    if (selectedMods.length === 0) {
        showAlert('请先选择要取消加载的Mod（只能选择已启用的Mod）', '提示');
        return;
    }
    
    showConfirm(`确定要取消加载 ${selectedMods.length} 个Mod吗？

⚠️ 重要提示：
取消加载Mod后，必须重新进入游戏（刷新页面）才能真正取消Mod加载。`, function(confirmed) {
        if (!confirmed) return;
        
        try {
            // 从已加载列表中移除选中的Mod
            let successCount = 0;
            selectedMods.forEach(mod => {
                const index = window.modManager.loadedMods.indexOf(mod.id);
                if (index > -1) {
                    window.modManager.loadedMods.splice(index, 1);
                    successCount++;
                    
                    // 同时取消激活状态
                    mod.enabled = false;
                    const activeIndex = window.modManager.activeMods.indexOf(mod.id);
                    if (activeIndex > -1) {
                        window.modManager.activeMods.splice(activeIndex, 1);
                    }
                    
                    console.log(`✅ 取消加载Mod: ${mod.name}`);
                }
            });
            
            // ✅ 保存所有状态
            window.modManager.saveMods();
            window.modManager.saveActiveMods();
            window.modManager.saveLoadedMods(); // ✅ 保存已加载列表
            
            // ✅ 更新已加载计数
            window.loadedModCount = window.modManager.loadedMods.length;
            updateLoadedModCount();
            
            // ✅ 显示成功提示，重点告知需要重新进入游戏
            showAlert(`成功取消加载 ${successCount} 个Mod！

⚠️ 重要提示：
Mod已标记为未加载状态，但需要重新进入游戏（刷新页面）才能真正生效。`, '取消加载成功');
            
            // ✅ 刷新Mod列表显示
            refreshModFileList();
            
            // ✅ 重置选择状态
            window.selectedModIds = [];
            
        } catch (error) {
            showAlert(`取消加载失败: ${error.message}`, '错误');
        }
    }, '取消加载Mod');
}

// ==================== 刷新Mod文件列表 ====================
function refreshModFileList() {
    const listContainer = document.getElementById('modFileList');
    if (listContainer) {
        listContainer.innerHTML = renderModFileList();
    }
    
    // 更新统计
    const totalEl = document.getElementById('totalModCount');
    const activeEl = document.getElementById('activeModCount');
    const loadedEl = document.getElementById('loadedModCount'); // ✅ 确保已加载计数也更新
    
    if (totalEl) totalEl.textContent = window.modManager.getAllMods().length;
    if (activeEl) activeEl.textContent = window.modManager.getActiveMods().length;
    if (loadedEl) loadedEl.textContent = window.modManager.loadedMods.length; // ✅ 从持久化列表获取
}

// ==================== 更新已加载Mod数量显示 ====================
function updateLoadedModCount() {
    const loadedEl = document.getElementById('loadedModCount');
    if (loadedEl && typeof loadedEl.textContent !== 'undefined') { // ✅ 确保是文本元素
        loadedEl.textContent = window.loadedModCount || window.modManager.loadedMods.length || 0;
        
        // ✅ 添加加载成功的视觉反馈
        if ((window.loadedModCount || 0) > 0) {
            loadedEl.style.color = '#00f2ea';
            loadedEl.style.textShadow = '0 0 10px rgba(0, 242, 234, 0.5)';
        }
    }
}

// ==================== 全局函数绑定 ====================
window.showModManagement = showModManagement;
window.closeModManagement = closeModManagement;
window.showModHelp = showModHelp;
window.closeModHelp = closeModHelp;  // ✅ 导出关闭函数
window.copyGameDescription = copyGameDescription;
window.confirmAddMod = confirmAddMod;
window.renderModFileList = renderModFileList;
window.toggleModSelection = toggleModSelection;
window.importModFile = importModFile;
window.deleteSelectedMods = deleteSelectedMods;
window.loadSelectedMods = window.loadSelectedMods;
window.refreshModFileList = refreshModFileList;
window.updateLoadedModCount = updateLoadedModCount;
window.generateGameDescription = generateGameDescription;
window.escapeHtml = escapeHtml;
window.unloadSelectedMods = unloadSelectedMods; // ✅ 导出取消加载函数

console.log('✅ Mod系统已加载（带自动描述生成器和JS元数据提取）');