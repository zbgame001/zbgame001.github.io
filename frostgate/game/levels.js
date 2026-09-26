/*! levels.js — 关卡配置，加关卡只改这里 */
window.TOY_LEVELS = [
  {
    id: 1,
    name: '初霜',
    desc: '点碎冒头的冰晶，别让它化掉',
    grid: 3,
    target: 20,
    spawnMs: 820,
    lifeMs: 1500,
    hazards: 0,
    life: 3
  },
  {
    id: 2,
    name: '极寒',
    desc: '更密更快，火苗别碰',
    grid: 4,
    target: 30,
    spawnMs: 560,
    lifeMs: 1100,
    hazards: 2,
    life: 3,
    gated: true          // ← 要「点个心」才开
  }
];
