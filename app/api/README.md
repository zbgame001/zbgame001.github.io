# app/api —— 主播模拟器 App 的 GitHub Pages 数据源

App（包名 `zb.game`）里原来的公告 / 版本更新 / 在线 Mod 都走自建服务器
`https://api.zbgame.bid/game/api/*`，现已全部改成本目录下的**静态文件**。
静态托管换不了 POST，所以线上是 **GET**。

| 文件 | 线上地址 | 用途 |
| --- | --- | --- |
| `announcement.json` | https://zbgame001.github.io/app/api/announcement.json | 启动弹的「公告」 |
| `version.json` | https://zbgame001.github.io/app/api/version.json | 启动自动检测更新 + 设置里「检测更新」 |
| `mods.json` | https://zbgame001.github.io/app/api/mods.json | 在线 Mod 列表 |
| `mods/*.js` | https://zbgame001.github.io/app/api/mods/xxx.js | 在线 Mod 源码 |

App 侧代码：`PagesSource.java`（基址/取数）、`AnnouncementUI.java`、
`MainActivity.checkForUpdateInternal()`、`OnlineModsLoader.java`。

## 改法

直接在 GitHub 网页编辑器里改这个文件、提交即可（或本地改完 `git push`）。
**没有后台，改完就是发布**。

- 改完约 1 分钟内生效（Pages 会重新部署并让新内容生效，客户端不用做任何缓存绕行）。
- 文件必须是 **合法 JSON**，`"success": true` 不能少，数据放在 `data` 里。
  写坏了 App 只会静默失败（公告不弹 / 检测更新报网络失败），不会崩。

## announcement.json

```json
{ "success": true, "data": { "content": "支持 <b>HTML</b> 的公告内容<br>可换行" } }
```

`content` 为空或全空白 → 不弹公告。

## version.json

```json
{
  "success": true,
  "data": {
    "latest_version_code": 52,
    "latest_version_name": "V6.6-test-4",
    "update_url": "https://zbgame001.github.io/game.apk",
    "update_content": "更新说明，\n支持换行",
    "force_update": false,
    "min_version_code": 0
  }
}
```

- 只有 `latest_version_code` **大于** App 自己的 `versionCode` 才弹更新页；
  相等 → 手动检测时提示「当前已是最新版本」。
- `force_update: true` → 更新页不显示「稍后再说」，强制更新。
- `update_url` 必须是 `https://`，否则 App 拒绝下载。
- `min_version_code` 客户端当前忽略，留 0 即可。

## mods.json

```json
{
  "success": true,
  "data": [
    { "name": "示例Mod", "version": "1.0", "url": "mods/example.js", "enabled": true }
  ]
}
```

每个条目的字段：

- `name`：Mod 名（日志里用它区分）
- `version`：可选，仅日志
- `url`：相对 `app/api/` 的路径（写 `http(s)://` 开头的完整地址也行）；**或者**
- `content`：直接把 JS 源码写在这里（不推荐，文件会很大）
- `enabled`：`false` 临时下线，默认 `true`

限制：最多取前 50 个，单个源码上限 256KB，源码为空/超限会跳过。

### 在线 Mod 的运行契约

每个 Mod 的源码会被包进

```js
new Function('window', 'document', 'gameState', <你的源码>)()
```

在游戏页面加载完成后执行一次（每次进游戏页面执行一次，不做持久化）。
所以可以直接用 `window` / `document` / `gameState`，也可以调用游戏里的全局函数
（例如 `showEventPopup(标题, 内容)`）。单个 Mod 执行失败只记日志，不影响其它 Mod 和游戏本体。

参考 `mods/example.js`。

> ⚠️ 在线 Mod 是**直接执行代码**：GitHub Pages 是公开仓库，任何能推送到本仓库的人
> 都能给玩家下发代码。不要往里放来路不明的 JS。
