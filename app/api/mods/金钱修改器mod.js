// ==================== 金钱修改器Mod v2.0 (适配新版) ====================
// 移除 gameState 依赖，改用 _homeData.coins

(function(window, document) {
    'use strict';

    if (window.moneyModLoaded) {
        console.warn('金钱修改器已加载，跳过');
        return;
    }
    window.moneyModLoaded = true;

    console.log('💰 金钱修改器Mod v2.0 初始化...');

    // ===== 新版API =====
    function getHome() { return window._homeData || {}; }
    function saveHome() {
        try { if (window._homeData) localStorage.setItem('zbgame_home_data', JSON.stringify(window._homeData)); } catch(e) {}
    }
    function refreshUI() {
        if (typeof window.refreshHomeDisplay === 'function') window.refreshHomeDisplay();
        if (typeof window.refreshWorkCards === 'function') window.refreshWorkCards();
    }
    function showToast(msg) {
        if (typeof window.showGameToast === 'function') {
            window.showGameToast(msg);
        } else {
            alert(msg);
        }
    }
    function showEventPopup(title, msg) {
        if (typeof window.showEventPopup === 'function') {
            window.showEventPopup(title, msg);
        } else {
            showToast(title + '：' + msg);
        }
    }

    // ===== 悬浮按钮 =====
    function createButton() {
        if (document.getElementById('moneyModifierBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'moneyModifierBtn';
        btn.innerHTML = '💰';
        btn.title = '修改金钱';
        Object.assign(btn.style, {
            position: 'fixed',
            left: '20px',
            bottom: '140px',  // 避免与其它按钮重叠
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
            zIndex: '99999',   // 确保在最上层
            transition: 'all 0.3s ease',
            opacity: '0.9',
            backdropFilter: 'blur(10px)',
            userSelect: 'none'
        });

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 6px 20px rgba(102,126,234,0.6)';
            btn.style.opacity = '1';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 15px rgba(102,126,234,0.4)';
            btn.style.opacity = '0.9';
        });

        btn.addEventListener('click', showMoneyModifierModal);
        document.body.appendChild(btn);
        console.log('✅ 金钱修改器悬浮按钮已创建');
    }

    // ===== 模态框 =====
    function showMoneyModifierModal() {
        const home = getHome();
        const current = home.coins || 0;

        // 如果已有模态框则移除
        const old = document.getElementById('moneyModifierModal');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'moneyModifierModal';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #1a1a2e;
            border-radius: 16px;
            max-width: 400px;
            width: 90%;
            padding: 20px;
            border: 2px solid #667eea;
            box-shadow: 0 8px 40px rgba(0,0,0,0.8);
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        dialog.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid #333;padding-bottom:12px;">
                <span style="font-size:18px;font-weight:bold;color:#667eea;">💰 修改金钱</span>
                <button id="moneyModalClose" style="background:none;border:none;color:#888;font-size:22px;cursor:pointer;">✕</button>
            </div>
            <div style="margin-bottom:12px;">
                <div style="font-size:13px;color:#999;margin-bottom:4px;">当前金钱</div>
                <div style="background:#161823;padding:10px 14px;border-radius:8px;font-size:18px;color:#00f2ea;font-weight:bold;">
                    ${current.toLocaleString()} 元
                </div>
            </div>
            <div style="margin-bottom:16px;">
                <div style="font-size:13px;color:#999;margin-bottom:4px;">输入新金额</div>
                <input type="number" id="moneyInput" value="${current}" 
                       style="width:100%;padding:10px 14px;background:#222;border:1px solid #444;border-radius:8px;color:#fff;font-size:16px;outline:none;">
                <div style="font-size:11px;color:#666;margin-top:4px;">范围 0 ~ 999,999,999,999</div>
            </div>
            <div style="display:flex;gap:10px;">
                <button id="moneyModalCancel" style="flex:1;padding:12px;background:#333;border:none;border-radius:8px;color:#aaa;cursor:pointer;font-weight:bold;">取消</button>
                <button id="moneyModalConfirm" style="flex:1;padding:12px;background:linear-gradient(135deg,#667eea,#764ba2);border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:bold;">确定修改</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 事件
        const input = document.getElementById('moneyInput');
        input.focus();
        input.select();

        document.getElementById('moneyModalClose').onclick = () => overlay.remove();
        document.getElementById('moneyModalCancel').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        document.getElementById('moneyModalConfirm').onclick = function() {
            const val = parseInt(input.value, 10);
            if (isNaN(val) || val < 0) {
                showToast('请输入有效数字（≥0）');
                return;
            }
            if (val > 999999999999) {
                showToast('数字过大，最大 999,999,999,999');
                return;
            }

            const home = getHome();
            home.coins = val;
            saveHome();
            refreshUI();
            overlay.remove();
            showEventPopup('💰 修改成功', `金钱已修改为 ${val.toLocaleString()} 元`);
            console.log(`💰 金钱修改成功：${val.toLocaleString()}`);
        };

        // 回车确认
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('moneyModalConfirm').click();
            }
        });
    }

    // ===== 启动 =====
    function init() {
        // 等待游戏加载
        const check = setInterval(() => {
            if (typeof window._homeData !== 'undefined') {
                clearInterval(check);
                createButton();
                console.log('✅ 金钱修改器Mod v2.0 加载完成');
            }
        }, 500);
        // 超时保护
        setTimeout(() => {
            if (!document.getElementById('moneyModifierBtn')) {
                createButton();
                console.log('⚠️ 金钱修改器超时强制加载');
            }
        }, 5000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})(window, document);