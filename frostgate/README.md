# 霜降 · Frostgate

一个两关的小玩具 + 一套「点个心才解锁」的迷你 SDK。纯静态，丢 GitHub Pages 就能跑。

**玩法**：关卡一「初霜」点碎冒头的冰晶（免费）；关卡二「极寒」格更密、速度更快，还夹着火苗（别碰）——
但**要先给这个项目点个心（GitHub star）才开**。

## 目录

```
index.html            外壳页
assets/style.css      样式
sdk/config.js         ← 唯一要改的配置：owner / repo / 校验模式
sdk/toy-sdk.js        「点个心」SDK
game/levels.js        关卡配置（加关卡只改这里）
game/game.js          游戏逻辑
tests/selftest.html   自测（25+ 条断言，无头 Chrome 跑）
tests/shot.html       截图用，不是给用户看的
```

## 在线试

**https://zbgame001.github.io/frostgate/**

> 换仓库时记得改 `sdk/config.js` 里的 `owner` / `repo`，否则「点个心」会跳错地方。

## SDK 接口

游戏里判断一道门槛就一行：

```js
if (!toy.isUnlocked()) { /* 锁着 */ }
```

| 方法 | 作用 |
| --- | --- |
| `toy.isUnlocked()` | 同步，读本地缓存（渲染关卡列表用） |
| `toy.checkUnlock()` | **按需查一次** → `Promise<{unlocked, reason}>` |
| `toy.requestUnlock()` | 引导去点心 + 开始校验 → `Promise<bool>` |
| `toy.lockState()` | `'locked'` / `'checking'` / `'unlocked'` / `'failed'` |
| `toy.on('checking'｜'unlocked'｜'failed'｜'reset', fn)` | 事件 |
| `toy.saveState(obj)` / `toy.loadState(keys)` / `toy.clearState(keys)` | 本地存档 |
| `toy.getViewer()` | 访客信息（静态站没有登录态，返回游客） |
| `toy.openLink(url)` | 跳转 |
| `toy.resetUnlock()` | 调试用：清掉本地解锁状态 |
| `toy.actionLabel` / `toy.heartUrl` | 按钮文案 / 要去点心的地址 |

## 校验怎么做的（v1.1 改过）

**不轮询。** 只在两个时刻各查一次：

1. 用户点「去点个心」——先记下**那一刻的星数基线**（此时还没算他点的星），再打开仓库页；
2. 用户**回到这个页面**（`visibilitychange` / `focus` / `pageshow`）——查一次，星数比基线涨了就解锁，并写进本地缓存（以后不再查）。

外加一个手动入口 `toy.checkUnlock()`，界面上就是那颗「✓ 我已点过心，再查一次」按钮——**什么时候查由用户决定**。

> 为什么不用 `setInterval` 轮询：打开仓库页会让本页进后台，而 Chrome 会把后台页的定时器节流到大约 1 次/分钟，
> 于是「点完星回来」根本查不到，表现为**永远不解锁**。这是 v1.0 的坑，已删。

模式在 `sdk/config.js` 里一个字段切换：

| 模式 | 怎么判断 | 说明 |
| --- | --- | --- |
| `star`（默认） | 星数比基线涨了才放行 | 认真校验；涨不了就锁着，不会偷偷放行 |
| `soft` | 点一下按钮就算点过，只写本地开关 | 只适合演示/调试 |

## 这个门槛拦得住谁

**拦得住**：手滑点进来的人、想顺手白拿的人。
**拦不住**：存心想绕的人——纯前端门槛没有秘密可言。

而且「星数涨了」≠「是你点的」：

- 如果你**在点按钮之前就已经 star 过**，星数不会涨，这个门槛认不出来；
- 别人同时点了星，星数也会涨。

**想要真校验**（按人查「你有没有 star」），得加一个带 OAuth 的极小后端，GitHub Pages 这种纯静态托管做不到：

```
GET /api/starred?token=***<github access_token>
 -> 调 https://api.github.com/user/starred/{owner}/{repo}
 -> 204 = 点过，404 = 没点过
```

前端把 GitHub OAuth 的 access_token 交给它即可。需要的话再加。

## 本地跑 / 自测

本机的无头 Chrome 和 shell 不在同一个网络命名空间，**别开 http 服务去喂 Chrome**，直接用 file://：

```bash
chrome --headless=new --no-sandbox --allow-file-access-from-files \
  --virtual-time-budget=15000 --dump-dom file:///root/work/frostgate/tests/selftest.html
```

调试解锁状态：控制台 `toy.resetUnlock()` 清掉，`toy.isUnlocked()` / `toy.lockState()` 看当前值。

## License

MIT
