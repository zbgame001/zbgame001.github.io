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
    /* star = 认真校验：记下点按钮那一刻的星数，回到页面后星数涨了才放行
       soft = 纯本地开关：点一下就算点过了（只适合演示/调试） */
    mode: 'star',
    /* 点完心最多等多久（毫秒）；等不到就退回锁定，用户可以再点一次 */
    timeoutMs: 180000
  },
  /* 本地存档名前缀（换项目时一起改，避免和别的站串档） */
  storageKey: 'frostgate:v1'
};
