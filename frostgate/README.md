# 霜降 · Frostgate

一个两关的小玩具 + 一套「点个心才解锁」的迷你 SDK。纯静态，丢 GitHub Pages 就能跑。

**玩法**：关卡一「初霜」点碎冒头的冰晶（免费）；关卡二「极寒」格更密、速度更快，还夹着火苗（别碰）——
但**要先给这个项目点个心（star）才开**。

## 目录

```
index.html            外壳页
assets/style.css      样式
sdk/config.js         ← 唯一要改的配置：owner / repo / 校验模式
sdk/toy-sdk.js        「点个心」SDK（本轮重写的核心）
game/levels.js        关卡配置（加关卡只改这里）
game/game.js          游戏逻辑
```

## 在线试

部署到 GitHub Pages 后：`https://<owner>.github.io/frostgate/`

> **部署前记得改 `sdk/config.js` 里的 `owner` / `repo`，指到你自己的仓库**，否则「点个心」按钮会跳错地方。

## SDK 是什么

`toy-sdk.js` 的接口形状是照 B 站互动玩具的 `toy-sdk` 抄的，好处是游戏代码换个宿主不用动：

| 方法 | 作用 |
| --- | --- |
| `toy.getAuthorRelation()` | 查「作者关系」，本 SDK 里就是**点没点过心**。返回 `{followed, hearted, source}` |
| `toy.requestHeart()` | 打开仓库页去点星，并开始校验；resolve 是否通过 |
| `toy.isHearted()` | 同步读本地缓存（渲染关卡列表用） |
| `toy.getCloudStorage(keys)` / `setCloudStorage(obj)` / `removeCloudStorage(keys)` | 云存档，这里落在 localStorage |
| `toy.getUserProfile()` | 用户信息（静态站没人登录，返回游客） |
| `toy.navigate({url})` | 跳转 |
| `toy.on('heart:verified' \| 'heart:pending' \| 'heart:failed', fn)` | 事件 |
| `toy.resetHeart()` | 调试用：清掉本地解锁状态 |

游戏里那道门槛就一行：

```js
const rel = await toy.getAuthorRelation();
if (!rel.followed) { /* 没点过心，锁着 */ }
```

## 三种校验模式（`sdk/config.js`）

| 模式 | 怎么判断 | 能不能真拦人 |
| --- | --- | --- |
| `auto`（默认） | 记下打开仓库页之前的星数，轮询 GitHub API，星数涨了就解锁；超时后**放行** | 拦得住手滑，拦不住想绕的 |
| `count` | 同上，但不放行——星数不涨就一直锁着 | 能（同一个 IP 上别人点星也算数） |
| `soft` | 点一下按钮就算点过，只写本地开关 | 纯粹走个过场 |

**为什么不能真校验「是不是你点的星」**：GitHub Pages 是纯静态托管，没有后端也没有登录态，
浏览器拿不到「当前访客有没有 star 这个仓库」。

想要真校验，得加一个带 OAuth 的极小后端（Cloudflare Worker 之类）：

```
GET /api/hearted?token=<github access_token>
 -> 调 https://api.github.com/user/starred/{owner}/{repo}
 -> 204 = 点过，404 = 没点过
```

前端把 GitHub OAuth 的 access_token 交给它即可。需要的话再加。

## 本地跑

```bash
python3 -m http.server 8899     # 然后开 http://127.0.0.1:8899/
```

调试解锁状态：控制台 `toy.resetHeart()` 清掉，`toy.isHearted()` 看当前值。

## License

MIT
