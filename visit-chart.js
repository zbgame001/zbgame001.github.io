/**
 * 访问统计（零依赖自搓版）
 *   1) 每次访问由本脚本 POST 给免注册计数服务 vercount 累加，并取回实时累计值；
 *   2) 按天历史由 GitHub Actions 每天记录进同站的 stats/visits.json（无跨域、无第三方脚本）；
 *      Actions 读取时会让计数 +1（探针），所以 JSON 里记了 probes 次数，显示时扣掉。
 * 只用到一个第三方：vercount（收计数）。剩下全在这个仓库里。
 */
(function () {
  var API = 'https://events.vercount.one/api/v2/log';
  var SITE = 'https://zbgame001.github.io/';
  var DAYS = 14;

  var elTotal = document.getElementById('visitTotal');
  var elChart = document.getElementById('visitChart');
  var elBox = document.getElementById('visitChartSvg');
  var elHint = document.getElementById('visitHint');

  var probes = 0;

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function setTotal(raw) {
    if (!elTotal || raw == null) return;
    var n = raw - probes;
    if (n < 0) n = raw;
    elTotal.textContent = fmt(n);
  }

  /* ---------------- 计数：本次访问 +1，拿回实时累计 ---------------- */
  function isNewVisitor() {
    var seen = document.cookie.split('; ').some(function (c) { return c.indexOf('zbg_uv=') === 0; });
    if (!seen) document.cookie = 'zbg_uv=1; path=/; max-age=31536000; samesite=lax';
    return !seen;
  }

  function countVisit() {
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: SITE, isNewUv: isNewVisitor() })
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (!d || !d.data) throw new Error('bad payload');
        return Number(d.data.site_pv) || 0;
      });
  }

  /* ---------------- 快照：读同站 JSON ---------------- */
  function loadSnapshots() {
    return fetch('stats/visits.json?v=' + new Date().toISOString().slice(0, 10)).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function renderChart(points) {
    var pts = (points || []).slice().sort(function (a, b) {
      return String(a.d).localeCompare(String(b.d));
    });
    var series = [];
    for (var i = 1; i < pts.length; i++) {
      var diff = Number(pts[i].pv) - Number(pts[i - 1].pv);
      series.push({ d: String(pts[i].d), v: diff > 0 ? diff : 0 });
    }
    series = series.slice(-DAYS);
    if (series.length < 2) {
      if (elHint) elHint.textContent = '访问趋势积累中（每天自动记录一次，攒够两天就出图）';
      return;
    }
    if (elChart) elChart.hidden = false;
    if (elHint) elHint.hidden = true;
    draw(series);
  }

  /* ---------------- 自绘折线图 ---------------- */
  function draw(series) {
    var W = 640, H = 176, PAD = { l: 34, r: 10, t: 14, b: 22 };
    var iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
    var max = Math.max.apply(null, series.map(function (s) { return s.v; }));
    if (max <= 0) max = 1;
    var step = series.length > 1 ? iw / (series.length - 1) : iw;

    function X(i) { return PAD.l + i * step; }
    function Y(v) { return PAD.t + ih - (v / max) * ih; }

    var line = [], area = [];
    series.forEach(function (s, i) { line.push((i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(s.v).toFixed(1)); });
    area.push('M' + X(0).toFixed(1) + ' ' + (PAD.t + ih));
    series.forEach(function (s, i) { area.push('L' + X(i).toFixed(1) + ' ' + Y(s.v).toFixed(1)); });
    area.push('L' + X(series.length - 1).toFixed(1) + ' ' + (PAD.t + ih) + ' Z');

    var svg = [];
    svg.push('<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="近 ' + series.length + ' 天访问量折线图">');
    svg.push('<defs><linearGradient id="vcFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="currentColor" stop-opacity="0.20"/>' +
      '<stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>');

    [0, 0.5, 1].forEach(function (f) {
      var y = PAD.t + ih - f * ih;
      svg.push('<line x1="' + PAD.l + '" y1="' + y.toFixed(1) + '" x2="' + (W - PAD.r) + '" y2="' + y.toFixed(1) + '" class="vc-grid"/>');
      svg.push('<text x="' + (PAD.l - 6) + '" y="' + (y + 3.5).toFixed(1) + '" class="vc-axis" text-anchor="end">' + Math.round(max * f) + '</text>');
    });

    svg.push('<path d="' + area.join(' ') + '" fill="url(#vcFill)"/>');
    svg.push('<path d="' + line.join(' ') + '" class="vc-line"/>');
    series.forEach(function (s, i) {
      svg.push('<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(s.v).toFixed(1) + '" r="2.6" class="vc-dot"><title>' +
        s.d + '：' + s.v + '</title></circle>');
    });

    var ticks = series.length >= 3 ? [0, Math.floor((series.length - 1) / 2), series.length - 1] : [0, series.length - 1];
    ticks.forEach(function (i) {
      var anchor = i === 0 ? 'start' : (i === series.length - 1 ? 'end' : 'middle');
      svg.push('<text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" class="vc-axis" text-anchor="' + anchor + '">' +
        series[i].d.slice(5) + '</text>');
    });
    svg.push('</svg>');
    if (elBox) elBox.innerHTML = svg.join('');
  }

  /* ---------------- 启动：两条请求并行，都落地再渲染 ---------------- */
  var raw = null, snap = null, pending = 2;

  function settle() {
    if (--pending > 0) return;
    if (snap) {
      probes = Number(snap.probes) || 0;
      renderChart(snap.points);
    } else if (elHint && elChart && elChart.hidden) {
      elHint.textContent = '访问趋势暂时取不到数据';
    }
    if (raw != null) setTotal(raw);
    else if (elTotal) elTotal.textContent = '—';
  }

  countVisit().then(function (v) { raw = v; }).catch(function () {}).then(settle);
  loadSnapshots().then(function (d) { snap = d; }).catch(function () {}).then(settle);
})();
