// ==================== 游戏分享导入处理器 ====================
// 依赖: game_mod_system.js (window.modManager, showModManagement)

(function() {
    // 确保全局命名空间
    window.handleSharedModFile = function(fileName, fileContent) {
        console.log('收到分享文件:', fileName, '大小:', fileContent.length);

        // 延迟执行，确保 Mod 管理器已就绪
        setTimeout(function() {
            if (!window.modManager) {
                console.error('Mod管理器未初始化');
                showAlert('Mod系统尚未初始化，请稍后重试', '错误');
                return;
            }

            // 1. 通过 ModManager 导入内容
            window.modManager.importModFromContent(fileContent, fileName)
                .then(function(mod) {
                    console.log('分享文件导入成功:', mod);
                    showNotification('Mod导入成功', `已导入: ${mod.name}`);

                    // 2. 自动跳转到 Mod 管理界面
                    if (typeof showModManagement === 'function') {
                        showModManagement();

                        // 3. 高亮显示刚刚导入的 Mod（通过滚动或视觉标记）
                        setTimeout(function() {
                            highlightImportedMod(mod.id);
                        }, 300);
                    }
                })
                .catch(function(error) {
                    console.error('分享文件导入失败:', error);
                    showAlert('导入失败: ' + error.message, '错误');
                });
        }, 100);
    };

    // 辅助函数：在 Mod 列表高亮显示刚导入的项
    function highlightImportedMod(modId) {
        const checkbox = document.getElementById(`mod-checkbox-${modId}`);
        if (checkbox) {
            const item = checkbox.closest('.work-item');
            if (item) {
                item.style.transition = 'background 0.3s, border 0.3s';
                item.style.background = '#2a2a4a';
                item.style.border = '2px solid #00f2ea';
                setTimeout(() => {
                    item.style.background = '';
                    item.style.border = '';
                }, 1500);
            }
        }
    }

    // 可选：提供直接从 Java 调用的兼容方法
    window.importSharedModFile = window.handleSharedModFile;
})();

console.log('✅ 游戏分享导入模块已加载');