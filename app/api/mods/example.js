/* 示例在线 Mod —— 默认未启用（mods.json 里没有列它）。
 *
 * 启用方式：在 mods.json 的 data 数组里加一条，例如
 *   { "name": "示例Mod", "version": "1.0", "url": "mods/example.js", "enabled": true }
 *
 * 运行契约：本文件全部内容会被包进
 *   new Function('window', 'document', 'gameState', <本文件内容>)
 * 执行一次（每次进入游戏页面执行一次），所以这里可以直接使用
 * window / document / gameState，也可以调用游戏里的全局函数。
 * 执行失败只会打日志，不会影响游戏本体。
 */

console.log('[示例Mod] 已注入，版本 v1.0');
window.__zbgExampleModLoaded = true;

// 想让玩家看见效果，可以调用游戏里的全局通知函数：
// showEventPopup('示例Mod', '在线 Mod 运行成功');
