// game_version_info.js
// 版本信息全屏页面模块

// ==================== 开发者模式相关变量（从账号设置模块迁移至此） ====================
let versionInfoClickCount = 0;
let lastVersionInfoClickTime = 0;

// ==================== 显示版本信息全屏界面 ====================
function showVersionInfo() {
    // 关闭所有全屏页面
    document.querySelectorAll('.fullscreen-page').forEach(page => page.classList.remove('active'));
    
    // 隐藏主内容和底部导航
    document.getElementById('mainContent').style.display = 'none';
    document.querySelector('.bottom-nav').style.display = 'none';
    
    // 显示版本信息全屏页面
    document.getElementById('versionInfoPage').classList.add('active');
    
    // 渲染页面内容
    renderVersionPage();
}

// ==================== 关闭版本信息全屏界面 ====================
function closeVersionInfo() {
    // 关闭版本信息页面
    document.getElementById('versionInfoPage').classList.remove('active');
    
    // 恢复主内容和底部导航
    document.getElementById('mainContent').style.display = 'block';
    document.querySelector('.bottom-nav').style.display = 'flex';
    
    // 重置到首页标签
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('.nav-item').classList.add('active');
    
    // 隐藏所有标签页内容
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    // 显示首页主内容区块
    document.querySelectorAll('.main-content-section').forEach(el => el.style.display = '');
}

// ==================== 显示更新内容模态框 ====================
function showUpdateContentModal() {
    const versionData = {
        version: "V6.4",
        updateDate: "2026-01-25",
        author: "用户8044",
        updateContent: [
            "1.个人主页翻新",
            "2.游戏设置新增下载mod选项",
            "3.私信界面新增清空功能",
            "4.修复了粉丝互动两个问题，目前还不够全面"
        ]
    };
    
    const updateContentHtml = versionData.updateContent.map(item => 
        `<div style="margin-bottom: 10px; padding: 12px; background: #161823; border-radius: 8px; border-left: 3px solid #667eea; font-size: 13px; line-height: 1.5;">
            ${item}
        </div>`
    ).join('');
    
    const modalContent = `
        <div class="modal-header">
            <div class="modal-title">📋 更新内容详情</div>
            <div class="close-btn" onclick="closeModal()">✕</div>
        </div>
        <div style="padding: 20px;">
            <div style="background: #161823; border-radius: 10px; padding: 15px; margin-bottom: 15px; border: 1px solid #333;">
                <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #667aea;">
                    📝 版本 ${versionData.version} 更新内容
                </div>
                <div style="font-size: 12px; color: #999; margin-bottom: 15px;">
                    更新日期：${versionData.updateDate} | 开发者：${versionData.author}
                </div>
                <div id="updateContentList">
                    ${updateContentHtml}
                </div>
            </div>
            <div style="background: #161823; border-radius: 10px; padding: 15px; border: 1px solid #333;">
                <div style="font-size: 12px; color: #999; line-height: 1.5;">
                    <div style="margin-bottom: 5px;">💡 提示：</div>
                    <div>• 定期查看更新内容，了解新功能</div>
                    <div>• 遇到问题可以加入QQ群反馈</div>
                </div>
            </div>
            <button class="btn" onclick="closeModal()" style="margin-top: 15px;">确定</button>
        </div>
    `;
    
    showModal(modalContent);
}

// ==================== 渲染版本信息页面内容 ====================
function renderVersionPage() {
    const content = document.getElementById('versionInfoPageContent');
    if (!content) return;
    
    // 版本信息数据
    const versionData = {
        version: "V6.4",
        updateDate: "2026-01-25",
        author: "用户8044",
        updateContent: [
            "1.个人主页翻新",
            "2.游戏设置新增下载mod选项",
            "3.私信界面新增清空功能",
            "4.修复了粉丝互动两个问题，目前还不够全面"
        ]
    };
    
    // 页面结构
    content.innerHTML = `
        <style>
            /* 动态背景动画 */
            @keyframes dynamicGradient {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            .version-display-dynamic {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #ff6b00 50%, #ff0050 75%, #667eea 100%);
                background-size: 400% 400%;
                animation: dynamicGradient 8s ease infinite;
                margin: 10px;
                padding: 25px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
                position: relative;
                overflow: hidden;
            }
            
            .version-display-dynamic::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(
                    45deg,
                    transparent 30%,
                    rgba(255, 255, 255, 0.1) 50%,
                    transparent 70%
                );
                animation: shimmer 3s infinite;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
            
            .version-number {
                position: relative;
                z-index: 1;
                font-size: 42px;
                font-weight: bold;
                color: #fff;
                margin-bottom: 5px;
                letter-spacing: 1px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            
            .update-content-btn {
                background: linear-gradient(135deg, #222 0%, #161823 100%);
                border: 2px solid #667eea;
                border-radius: 10px;
                padding: 15px;
                margin: 10px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .update-content-btn:hover {
                border-color: #764ba2;
                background: linear-gradient(135deg, #1a1a3a 0%, #222 100%);
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            
            .update-content-btn:active {
                transform: scale(0.98);
            }
            
            .update-content-info {
                font-size: 14px;
                font-weight: bold;
            }
            
            .update-content-arrow {
                color: #667eea;
                font-size: 18px;
            }
        </style>
        
        <div style="padding: 10px;">
            <!-- 版本号大屏显示（动态背景，点击15次触发开发者模式） -->
            <div class="version-display-dynamic">
                <div style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin-bottom: 10px; position: relative; z-index: 1;">当前版本</div>
                <div class="version-number" id="versionNumber">${versionData.version}</div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.8); position: relative; z-index: 1;">更新日期：${versionData.updateDate}</div>
            </div>
            
            <!-- 更新内容按钮（点击弹出） -->
            <div class="update-content-btn" onclick="showUpdateContentModal()">
                <div style="flex: 1;">
                    <div class="update-content-info">📋 查看更新内容</div>
                    <div style="font-size: 12px; color: #999;">点击查看详细更新日志</div>
                </div>
                <div class="update-content-arrow">></div>
            </div>
            
            <!-- 作者信息 -->
            <div style="background: #161823; margin: 10px; padding: 20px; border-radius: 15px; border: 1px solid #333; text-align: center;">
                <div style="font-size: 14px; color: #999; margin-bottom: 10px;">开发者</div>
                <div style="font-size: 18px; font-weight: bold; color: #fff; margin-bottom: 5px;">
                    ${versionData.author}
                </div>
                <div style="font-size: 11px; color: #667aea; margin-top: 8px;">
                    KIMI-K2创作
                </div>
                <div style="font-size: 12px; color: #667aea; margin-top: 15px; padding-top: 15px; border-top: 1px solid #222;">
                    💡 感谢您的支持！如有问题请加入QQ群反馈
                </div>
            </div>
        </div>
    `;
    
    // 添加版本号的点击事件监听
    setTimeout(() => {
        const versionNumberEl = document.getElementById('versionNumber');
        if (versionNumberEl) {
            versionNumberEl.addEventListener('click', handleVersionNumberClick);
        }
    }, 100);
}

// ==================== 处理版本号点击事件（点击15次触发开发者模式） ====================
function handleVersionNumberClick(event) {
    const now = Date.now();
    
    // 如果距离上次点击超过3秒，重置计数
    if (now - lastVersionInfoClickTime > 3000) {
        versionInfoClickCount = 0;
    }
    
    lastVersionInfoClickTime = now;
    versionInfoClickCount++;
    
    // 静默计数，不显示任何UI反馈
    
    // 如果达到15次，显示密码框
    if (versionInfoClickCount >= 15) {
        versionInfoClickCount = 0; // 重置计数
        showDevPasswordModal();
    }
}

// ==================== 模块初始化 ====================
console.log('版本信息模块已加载');

// ==================== 全局函数绑定 ====================
window.showVersionInfo = showVersionInfo;
window.closeVersionInfo = closeVersionInfo;
window.renderVersionPage = renderVersionPage;
window.showUpdateContentModal = showUpdateContentModal;
window.handleVersionNumberClick = handleVersionNumberClick;
