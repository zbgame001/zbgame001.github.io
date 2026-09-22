/* 作品清单 + 卡片渲染  —— index.html（随机 6 个）与 works.html（全部）共用
   新增作品：往 WORKS 里加一行 { name: '作品名', url: 'game/xxx.html' } 即可 */
(function () {
 var WORKS = [
  { name: '主播模拟器', url: 'game/game.html' },
  { name: '窗外的死亡凝视', url: 'game/game3.html' },
  { name: '下班后的事（突脸鬼图预警）', url: 'game/game4.html' },
  { name: '心理测试？（突脸鬼图警告）', url: 'game/game5.html' },
  { name: '主播粉丝模拟器', url: 'game/game6.html' },
  { name: '点按钮！（突脸鬼图警告）', url: 'game/game7.html' },
  { name: '国家管理模拟器', url: 'game/game8.html' },
  { name: '接水小游戏', url: 'game/game9.html' },
  { name: 'AI 2048 对战', url: 'game/game10.html' },
  { name: '赛博朋克 2048 合作版', url: 'game/game11.html' },
  { name: 'AI 2048 大战 - 50格', url: 'game/game12.html' },
  { name: '小球对战游戏', url: 'game/game13.html' }
 ];

 window.WORKS = WORKS;

 function shuffled(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
   var j = Math.floor(Math.random() * (i + 1));
   var t = a[i];
   a[i] = a[j];
   a[j] = t;
  }
  return a;
 }

 /* gridId: 容器 id；limit: 0/省略=全部；random: true=随机抽 */
 window.renderWorks = function (gridId, limit, random) {
  var grid = document.getElementById(gridId);
  if (!grid) return;
  var list = random ? shuffled(WORKS) : WORKS.slice();
  if (limit && limit > 0) list = list.slice(0, limit);
  list.forEach(function (w, idx) {
   var a = document.createElement('a');
   a.className = 'work-card';
   a.href = w.url;
   a.target = '_blank';
   a.rel = 'noopener noreferrer';
   a.style.animationDelay = (0.25 + idx * 0.045).toFixed(2) + 's';

   var nameEl = document.createElement('span');
   nameEl.className = 'work-name';
   nameEl.textContent = w.name;

   var goEl = document.createElement('span');
   goEl.className = 'work-go';
   goEl.textContent = '\u2192';

   a.appendChild(nameEl);
   a.appendChild(goEl);
   grid.appendChild(a);
  });

  /* 电脑端两列布局：作品数为奇数时补一个空位块，行线才不会断半截 */
  if (list.length % 2 === 1) {
   var filler = document.createElement('div');
   filler.className = 'work-filler';
   filler.setAttribute('aria-hidden', 'true');
   filler.style.animationDelay = (0.25 + list.length * 0.045).toFixed(2) + 's';
   grid.appendChild(filler);
  }
 };
})();
