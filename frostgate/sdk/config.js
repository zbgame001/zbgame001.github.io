/*!
 * config.js — 改这一个文件就够了
 * 部署前把 owner / repo 换成你自己的仓库。
 */
window.TOY_CONFIG = {
  project: {
    /* 部署位置：https://zbgame001.github.io/frostgate/
       「点个心」指向承载它的仓库；想换成单独仓库，改这两行就行 */
    owner: 'zbgame001',
    repo:  'zbgame001.github.io'
  },
  heart: {
    /* 按钮上那句话 */
    label: '♥ 去点个心',
    /* auto  = 先按「星数有没有涨」判断，超时后放行（推荐，静态站最好用）
       count = 只认真实星数变化，超时就解锁失败
       soft  = 纯本地开关：点一下按钮就算点过了（最省事，也最容易绕过） */
    mode: 'auto',
    timeoutMs: 120000,
    pollMs: 4000
  },
  /* 本地存档名前缀（换项目时一起改，避免和别的站串档） */
  storageKey: 'frostgate:v1'
};
