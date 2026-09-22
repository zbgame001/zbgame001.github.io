/*!
 * ZBG —— 自己写的一门小语言（v1）
 *
 * 从零手写：词法 → 语法 → 树遍历解释器，全部是原生 JS，零依赖、零构建、零第三方。
 * 浏览器直接就能跑（这就是它存在的意义）：
 *     <script src="zbg.js"></script>
 *     <script type="text/zbg">
 *       echo "你好，世界"
 *     </script>
 *
 * 语法要点
 *   变量        let x = 1       /  x = x + 1（裸赋值即声明）
 *   函数        fn 加(a, b) { return a + b }
 *   分支        if x > 1 { ... } elif x > 0 { ... } else { ... }
 *   循环        while 条件 { ... }   /   for i in 0..5 { ... }   /   for 项 in 列表 { ... }
 *   定时        every 10min { ... }       ← 时间字面量：30s / 10min / 2h / 1d
 *   异步        值 = await get("https://…/x.json")   （get/post 返回 Promise，可直接 await）
 *   字符串      "共 ${n} 次"（双引号里 ${表达式} 会求值）
 *   注释        # 到行尾
 *   逻辑        and / or / not（也兼容 && || !）
 *   列表/映射   [1, 2, 3]        { 名称: "值", pv: 3 }
 *   下标/取键   a[0]            m.pv 或 m["pv"]
 *   标识符      允许中文：let 总数 = 0
 */
(function (root) {
  'use strict';

  /* =====================================================================
   * 1. 词法
   * ===================================================================== */
  var KEYWORDS = ['fn', 'if', 'elif', 'else', 'while', 'for', 'in', 'return',
                  'break', 'continue', 'true', 'false', 'null', 'and', 'or',
                  'not', 'let', 'every', 'await', 'try', 'catch'];
  var UNITS = { ms: 1, s: 1000, min: 60000, h: 3600000, d: 86400000 };
  var PUNCT = ['==', '!=', '<=', '>=', '..', '&&', '||', '=', '<', '>', '+', '-',
               '*', '/', '%', '(', ')', '[', ']', '{', '}', ',', '.', ':', '?'];

  function err(msg, line) {
    var e = new Error(msg);
    e.zbg = true;
    e.line = line || 0;
    return e;
  }
  function isIdStart(ch) { return !!ch && (/[A-Za-z_$\u4e00-\u9fff]/.test(ch)); }
  function isIdPart(ch) { return !!ch && (/[A-Za-z0-9_$\u4e00-\u9fff]/.test(ch)); }
  function isDigit(ch) { return ch >= '0' && ch <= '9'; }

  function tokenize(src) {
    var toks = [], i = 0, line = 1, n = src.length;
    function push(t, v, extra) {
      var tok = { t: t, v: v, line: line };
      if (extra) { for (var k in extra) { tok[k] = extra[k]; } }
      toks.push(tok);
      return tok;
    }
    while (i < n) {
      var c = src[i];
      if (c === '\n') { push('nl', '\n'); i++; line++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '#') { while (i < n && src[i] !== '\n') { i++; } continue; }

      /* 字符串（双引号支持 ${} 插值） */
      if (c === '"' || c === "'") {
        var quote = c, parts = [], buf = '', j = i + 1, closed = false;
        while (j < n) {
          var ch = src[j];
          if (ch === '\\') {
            var nx = src[j + 1];
            buf += nx === 'n' ? '\n' : (nx === 't' ? '\t' : nx);
            j += 2; continue;
          }
          if (ch === quote) { closed = true; j++; break; }
          if (quote === '"' && ch === '$' && src[j + 1] === '{') {
            if (buf) { parts.push({ text: buf }); buf = ''; }
            var depth = 1, k = j + 2, start = k;
            while (k < n) {
              if (src[k] === '{') { depth++; }
              else if (src[k] === '}') { depth--; if (depth === 0) { break; } }
              k++;
            }
            parts.push({ code: src.slice(start, k), line: line });
            j = k + 1; continue;
          }
          if (ch === '\n') { line++; }
          buf += ch; j++;
        }
        if (!closed) { throw err('字符串少了收尾的引号', line); }
        if (buf || !parts.length) { parts.push({ text: buf }); }
        push('str', null, { parts: parts });
        i = j; continue;
      }

      /* 数字（含时间字面量：10min / 30s / 2h / 1d / 500ms） */
      if (isDigit(c) || (c === '.' && isDigit(src[i + 1] || ''))) {
        var s = i;
        while (i < n && isDigit(src[i])) { i++; }
        if (src[i] === '.' && isDigit(src[i + 1] || '')) {
          i++;
          while (i < n && isDigit(src[i])) { i++; }
        }
        var text = src.slice(s, i), val = parseFloat(text);
        var m = /^(ms|min|s|h|d)/.exec(src.slice(i, i + 3));
        if (m && !isIdPart(src[i + m[1].length] || '')) {
          i += m[1].length;
          push('num', val, { unit: m[1], ms: val * UNITS[m[1]] });
        } else {
          push('num', val);
        }
        continue;
      }

      /* 标识符 / 关键字 */
      if (isIdStart(c)) {
        var s2 = i;
        while (i < n && isIdPart(src[i])) { i++; }
        var w = src.slice(s2, i);
        push(KEYWORDS.indexOf(w) >= 0 ? 'kw' : 'id', w);
        continue;
      }

      /* 符号 */
      var matched = null;
      for (var p = 0; p < PUNCT.length; p++) {
        if (src.substr(i, PUNCT[p].length) === PUNCT[p]) { matched = PUNCT[p]; break; }
      }
      if (!matched) { throw err('看不懂的字符 “' + c + '”', line); }
      push('punct', matched);
      i += matched.length;
    }
    toks.push({ t: 'eof', v: null, line: line });
    return toks;
  }

  /* =====================================================================
   * 2. 语法（递归下降 + 优先级爬升）
   * ===================================================================== */
  function parse(src) {
    var toks = tokenize(src), pos = 0;

    function peek(k) { return toks[pos + (k || 0)]; }
    function at(t, v) {
      var x = peek();
      return !!x && x.t === t && (v === undefined || x.v === v);
    }
    function next() { return toks[pos++]; }
    function eat(t, v) { return at(t, v) ? toks[pos++] : null; }
    function expect(t, v, what) {
      var got = eat(t, v);
      if (!got) {
        var cur = peek();
        throw err('这里应该是 ' + (what || ('“' + v + '”')),
                  cur ? cur.line : 0);
      }
      return got;
    }
    function skipNL() { while (at('nl')) { pos++; } }

    function parseBlock() {
      expect('punct', '{');
      var body = [];
      skipNL();
      while (!at('punct', '}')) {
        if (at('eof')) { throw err('少了收尾的 }', peek().line); }
        body.push(parseStatement());
        skipNL();
      }
      expect('punct', '}');
      return { k: 'block', body: body };
    }

    function parseParams() {
      expect('punct', '(');
      var params = [];
      skipNL();
      if (!at('punct', ')')) {
        do {
          skipNL();
          params.push(expect('id', undefined, '参数名').v);
          skipNL();
          if (!at('punct', ',')) { break; }
          next();
        } while (true);
      }
      expect('punct', ')');
      return params;
    }

    function parseStatement() {
      var t = peek();

      if (at('kw', 'fn')) {
        next();
        var fname = expect('id', undefined, '函数名').v;
        var fparams = parseParams();
        skipNL();
        return { k: 'fn', name: fname, params: fparams, body: parseBlock(), line: t.line };
      }

      if (at('kw', 'if')) {
        next();
        var cond = parseExpr();
        skipNL();
        var node = { k: 'if', cond: cond, then: parseBlock(), alt: null, line: t.line };
        var cur = node;
        while (true) {
          var save = pos;
          skipNL();
          if (at('kw', 'elif')) {
            next();
            var c2 = parseExpr();
            skipNL();
            var n2 = { k: 'if', cond: c2, then: parseBlock(), alt: null, line: peek().line };
            cur.alt = { k: 'block', body: [n2] };
            cur = n2;
            continue;
          }
          if (at('kw', 'else')) {
            next();
            skipNL();
            cur.alt = parseBlock();
          } else {
            pos = save;
          }
          break;
        }
        return node;
      }

      if (at('kw', 'while')) {
        next();
        var wcond = parseExpr();
        skipNL();
        return { k: 'while', cond: wcond, body: parseBlock(), line: t.line };
      }

      if (at('kw', 'for')) {
        next();
        var vname = expect('id', undefined, '循环变量').v;
        expect('kw', 'in', 'in');
        var iter = parseExpr();
        skipNL();
        return { k: 'for', name: vname, iter: iter, body: parseBlock(), line: t.line };
      }

      if (at('kw', 'every')) {
        next();
        var dur = parseExpr();
        skipNL();
        return { k: 'every', ms: dur, body: parseBlock(), line: t.line };
      }

      if (at('kw', 'return')) {
        next();
        var nxt = peek();
        var value = null;
        if (nxt && nxt.t !== 'nl' && !(nxt.t === 'punct' && nxt.v === '}') && nxt.t !== 'eof') {
          value = parseExpr();
        }
        return { k: 'return', value: value, line: t.line };
      }

      if (at('kw', 'break')) { next(); return { k: 'break', line: t.line }; }
      if (at('kw', 'continue')) { next(); return { k: 'continue', line: t.line }; }

      if (at('kw', 'try')) {
        next();
        skipNL();
        var tbody = parseBlock();
        skipNL();
        var ename = null, cbody = null;
        if (at('kw', 'catch')) {
          next();
          if (at('id')) { ename = next().v; }
          skipNL();
          cbody = parseBlock();
        }
        return { k: 'try', body: tbody, ename: ename, cbody: cbody, line: t.line };
      }

      if (at('kw', 'let')) {
        next();
        var lname = expect('id', undefined, '变量名').v;
        expect('punct', '=', '=');
        return { k: 'assign', name: lname, value: parseExpr(), line: t.line };
      }

      var expr = parseExpr();
      if (expr.k === 'var' && at('punct', '=')) {
        next();
        return { k: 'assign', name: expr.name, value: parseExpr(), line: t.line };
      }
      return { k: 'expr', value: expr, line: t.line };
    }

    /* ---- 表达式 ---- */
    function parseExpr() { return parseTernary(); }

    function parseTernary() {
      var cond = parseOr();
      if (at('punct', '?')) {
        next();
        var yes = parseExpr();
        expect('punct', ':', ':');
        var no = parseExpr();
        return { k: 'tern', cond: cond, a: yes, b: no, line: cond.line };
      }
      return cond;
    }

    function parseOr() {
      var left = parseAnd();
      while (at('kw', 'or') || at('punct', '||')) {
        next();
        left = { k: 'logic', op: 'or', a: left, b: parseAnd(), line: left.line };
      }
      return left;
    }
    function parseAnd() {
      var left = parseNot();
      while (at('kw', 'and') || at('punct', '&&')) {
        next();
        left = { k: 'logic', op: 'and', a: left, b: parseNot(), line: left.line };
      }
      return left;
    }
    function parseNot() {
      if (at('kw', 'not')) {
        var tok = next();
        return { k: 'unary', op: 'not', a: parseNot(), line: tok.line };
      }
      return parseCompare();
    }
    function parseCompare() {
      var left = parseRange();
      while (at('punct', '==') || at('punct', '!=') || at('punct', '<') ||
             at('punct', '<=') || at('punct', '>') || at('punct', '>=')) {
        var op = next().v;
        left = { k: 'bin', op: op, a: left, b: parseRange(), line: left.line };
      }
      return left;
    }
    function parseRange() {
      var left = parseAdd();
      if (at('punct', '..')) {
        next();
        return { k: 'range', a: left, b: parseAdd(), line: left.line };
      }
      return left;
    }
    function parseAdd() {
      var left = parseMul();
      while (at('punct', '+') || at('punct', '-')) {
        var op = next().v;
        left = { k: 'bin', op: op, a: left, b: parseMul(), line: left.line };
      }
      return left;
    }
    function parseMul() {
      var left = parseUnary();
      while (at('punct', '*') || at('punct', '/') || at('punct', '%')) {
        var op = next().v;
        left = { k: 'bin', op: op, a: left, b: parseUnary(), line: left.line };
      }
      return left;
    }
    function parseUnary() {
      if (at('punct', '-')) {
        var tok = next();
        return { k: 'unary', op: '-', a: parseUnary(), line: tok.line };
      }
      if (at('kw', 'await')) {
        var t2 = next();
        return { k: 'await', a: parseUnary(), line: t2.line };
      }
      return parsePostfix();
    }
    function parsePostfix() {
      var node = parsePrimary();
      while (true) {
        if (at('punct', '(')) {
          next();
          var args = [];
          skipNL();
          if (!at('punct', ')')) {
            do {
              skipNL();
              args.push(parseExpr());
              skipNL();
              if (!at('punct', ',')) { break; }
              next();
            } while (true);
          }
          expect('punct', ')');
          node = { k: 'call', callee: node, args: args, line: node.line };
          continue;
        }
        if (at('punct', '[')) {
          next();
          var idx = parseExpr();
          expect('punct', ']');
          node = { k: 'index', obj: node, idx: idx, line: node.line };
          continue;
        }
        if (at('punct', '.')) {
          next();
          var prop = expect('id', undefined, '成员名');
          node = { k: 'member', obj: node, name: prop.v, line: node.line };
          continue;
        }
        break;
      }
      return node;
    }
    function parsePrimary() {
      var t = peek();
      if (!t) { throw err('表达式不完整', 0); }
      if (t.t === 'num') { next(); return { k: 'num', v: t.ms !== undefined ? t.ms : t.v, raw: t.v, unit: t.unit, line: t.line }; }
      if (t.t === 'str') { next(); return { k: 'str', parts: t.parts, line: t.line }; }
      if (t.t === 'id') { next(); return { k: 'var', name: t.v, line: t.line }; }
      if (at('kw', 'true')) { next(); return { k: 'num', v: true, line: t.line }; }
      if (at('kw', 'false')) { next(); return { k: 'num', v: false, line: t.line }; }
      if (at('kw', 'null')) { next(); return { k: 'num', v: null, line: t.line }; }
      if (at('punct', '(')) {
        next();
        var inner = parseExpr();
        skipNL();
        expect('punct', ')');
        return inner;
      }
      if (at('punct', '[')) {
        next();
        var items = [];
        skipNL();
        if (!at('punct', ']')) {
          do {
            skipNL();
            items.push(parseExpr());
            skipNL();
            if (!at('punct', ',')) { break; }
            next();
          } while (true);
        }
        expect('punct', ']');
        return { k: 'list', items: items, line: t.line };
      }
      if (at('punct', '{')) {
        next();
        var pairs = [];
        skipNL();
        if (!at('punct', '}')) {
          do {
            skipNL();
            var keyTok = next();
            var key;
            if (keyTok.t === 'id' || keyTok.t === 'kw' || keyTok.t === 'num') {
              key = String(keyTok.v);
            } else if (keyTok.t === 'str') {
              key = keyTok.parts.map(function (p) { return p.text || ''; }).join('');
            } else {
              throw err('映射的键只能是名字或字符串', keyTok.line);
            }
            expect('punct', ':');
            pairs.push({ key: key, value: parseExpr() });
            skipNL();
            if (!at('punct', ',')) { break; }
            next();
          } while (true);
        }
        expect('punct', '}');
        return { k: 'map', pairs: pairs, line: t.line };
      }
      throw err('这里看不懂：“' + (t.v === null ? t.t : t.v) + '”', t.line);
    }

    var program = [];
    skipNL();
    while (!at('eof')) {
      program.push(parseStatement());
      skipNL();
    }
    return { k: 'program', body: program };
  }

  /* =====================================================================
   * 3. 运行时
   * ===================================================================== */
  function Env(parent) { this.vars = Object.create(null); this.parent = parent || null; }
  Env.prototype.get = function (name, line) {
    var e = this;
    while (e) {
      if (name in e.vars) { return e.vars[name]; }
      e = e.parent;
    }
    throw err('没有这个变量：“' + name + '”', line);
  };
  Env.prototype.has = function (name) {
    var e = this;
    while (e) { if (name in e.vars) { return true; } e = e.parent; }
    return false;
  };
  Env.prototype.set = function (name, value) {
    var e = this;
    while (e) {
      if (name in e.vars) { e.vars[name] = value; return value; }
      e = e.parent;
    }
    this.vars[name] = value;
    return value;
  };
  Env.prototype.def = function (name, value) { this.vars[name] = value; return value; };

  function Ret(v) { this.v = v; }
  function Brk() {}
  function Cnt() {}

  function truthy(v) {
    if (v === null || v === undefined || v === false) { return false; }
    if (v === 0 || v === '') { return false; }
    return true;
  }
  function toStr(v) {
    if (v === null || v === undefined) { return 'null'; }
    if (typeof v === 'string') { return v; }
    if (typeof v === 'number' || typeof v === 'boolean') { return String(v); }
    if (Array.isArray(v)) {
      return '[' + v.map(function (x) { return toStr(x); }).join(', ') + ']';
    }
    if (typeof v === 'function') { return '<函数>';
    }
    return JSON.stringify(v);
  }

  var HOST = {};      // 宿主环境（浏览器），由 installHost 注入

  function makeApi(options) {
    options = options || {};
    var out = options.out || function () {
      if (typeof console !== 'undefined') { console.log.apply(console, arguments); }
    };
    var api = {};
    var cache = {};

    api.echo = function () {
      var parts = [];
      for (var i = 0; i < arguments.length; i++) { parts.push(toStr(arguments[i])); }
      out(parts.join(' '));
      return null;
    };
    api.log = api.echo;
    api.fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
    api.str = function (v) { return toStr(v); };
    api.num = function (v) { return Number(v); };
    api.len = function (v) {
      if (v === null || v === undefined) { return 0; }
      if (Array.isArray(v) || typeof v === 'string') { return v.length; }
      return Object.keys(v).length;
    };
    api.abs = Math.abs; api.floor = Math.floor; api.ceil = Math.ceil;
    api.round = Math.round; api.sqrt = Math.sqrt;
    api.min = function () { return Math.min.apply(null, [].slice.call(arguments)); };
    api.max = function () { return Math.max.apply(null, [].slice.call(arguments)); };
    api.random = Math.random;
    api.now = function () { return Date.now(); };
    api.date = function (ms) {
      var d = ms === undefined ? new Date() : new Date(ms);
      return d.toISOString().slice(0, 10);
    };
    api.push = function (list, v) {
      if (!Array.isArray(list)) { throw err('push 的第一个参数得是列表'); }
      list.push(v);
      return list;
    };
    api.pop = function (list) { return Array.isArray(list) ? list.pop() : null; };
    api.sort = function (list, key) {
      if (!Array.isArray(list)) { return list; }
      var copy = list.slice();
      copy.sort(function (a, b) {
        var x = key ? getPath(a, key) : a, y = key ? getPath(b, key) : b;
        return x < y ? -1 : (x > y ? 1 : 0);
      });
      return copy;
    };
    api.slice = function (list, a, b) { return [].slice.call(list || [], a, b); };
    api.join = function (list, sep) { return [].slice.call(list || []).map(toStr).join(sep === undefined ? ',' : sep); };
    api.split = function (s, sep) { return String(s).split(sep); };
    api.keys = function (m) { return m ? Object.keys(m) : []; };
    api.has = function (m, k) { return !!m && (k in m); };
    api.pick = function (m, k, dflt) {
      if (m === null || m === undefined) { return dflt === undefined ? null : dflt; }
      var v = m[k];
      return v === undefined ? (dflt === undefined ? null : dflt) : v;
    };
    api.set = function (m, k, v) { m[k] = v; return m; };
    api.upper = function (s) { return String(s).toUpperCase(); };
    api.lower = function (s) { return String(s).toLowerCase(); };
    api.trim = function (s) { return String(s).trim(); };
    api.replace = function (s, a, b) { return String(s).split(a).join(b); };
    api.contains = function (s, sub) {
      return Array.isArray(s) ? s.indexOf(sub) >= 0 : String(s).indexOf(sub) >= 0;
    };
    api.parseJson = function (text) { return JSON.parse(text); };
    api.toJson = function (v) { return JSON.stringify(v); };

    /* 网络：直接用浏览器的 fetch，不经过任何第三方 */
    api.fetchText = function (url, opts) {
      return HOST.fetch(url, opts);
    };
    api.fetchJson = function (url, opts) {
      return HOST.fetch(url, opts).then(function (r) {
        if (typeof r === 'string') {
          try { return JSON.parse(r); } catch (e) { return r; }
        }
        return r;
      });
    };

    /* 定时 */
    api.wait = function (ms) {
      ms = Number(ms) || 0;
      return new Promise(function (res) { setTimeout(res, ms); });
    };

    /* DOM（没有 document 的环境自动降级为空操作，方便在别处跑同一份程序） */
    api.text = function (sel, s) { return HOST.dom('text', sel, s); };
    api.html = function (sel, s) { return HOST.dom('html', sel, s); };
    api.value = function (sel) { return HOST.dom('value', sel); };
    api.attr = function (sel, name, v) { return HOST.dom('attr', sel, name, v); };
    api.show = function (sel, yes) { return HOST.dom('show', sel, yes === undefined ? true : yes); };
    api.hide = function (sel) { return HOST.dom('show', sel, false); };
    api.on = function (sel, evt, fn) { return HOST.dom('on', sel, evt, fn); };

    /* 网络快捷方式 */
    api.get = function (url) { return api.fetchJson(url); };
    api.post = function (url, body) { return api.fetchJson(url, { method: 'POST', body: body }); };

    /* 本地：访客标记存哪儿、怎么取 */
    api.store = function (name, value) { return HOST.store(name, value); };
    api.cookie = function (name, value, days) { return HOST.cookie(name, value, days); };
    api.fixed = function (v, d) { return Number(v).toFixed(d === undefined ? 1 : d); };

    return api;
  }

  function getPath(obj, key) {
    var parts = String(key).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur === null || cur === undefined) { return undefined; }
      cur = cur[parts[i]];
    }
    return cur;
  }

  /* ---- 求值 ---- */
  async function evalExpr(node, env, rt) {
    switch (node.k) {
      case 'num': return node.v;
      case 'str': {
        var s = '';
        for (var i = 0; i < node.parts.length; i++) {
          var p = node.parts[i];
          if (p.text !== undefined) { s += p.text; }
          else {
            var sub = parse(p.code).body;
            var v = sub.length ? await evalExpr(sub[0].k === 'expr' ? sub[0].value : sub[0], env, rt) : null;
            s += toStr(v);
          }
        }
        return s;
      }
      case 'list': {
        var out = [];
        for (var j = 0; j < node.items.length; j++) { out.push(await evalExpr(node.items[j], env, rt)); }
        return out;
      }
      case 'map': {
        var m = {};
        for (var k = 0; k < node.pairs.length; k++) {
          m[node.pairs[k].key] = await evalExpr(node.pairs[k].value, env, rt);
        }
        return m;
      }
      case 'var': return env.get(node.name, node.line);
      case 'range': {
        var a = Number(await evalExpr(node.a, env, rt));
        var b = Number(await evalExpr(node.b, env, rt));
        var arr = [];
        if (a <= b) { for (var x = a; x < b; x++) { arr.push(x); } }
        else { for (var y = a; y > b; y--) { arr.push(y); } }
        return arr;
      }
      case 'unary': {
        var u = await evalExpr(node.a, env, rt);
        if (node.op === '-') { return -Number(u); }
        if (node.op === 'not') { return !truthy(u); }
        return u;
      }
      case 'await': return await evalExpr(node.a, env, rt);
      case 'tern': {
        var tc = await evalExpr(node.cond, env, rt);
        return truthy(tc) ? await evalExpr(node.a, env, rt) : await evalExpr(node.b, env, rt);
      }
      case 'logic': {
        var l = await evalExpr(node.a, env, rt);
        if (node.op === 'or') { return truthy(l) ? l : await evalExpr(node.b, env, rt); }
        return truthy(l) ? await evalExpr(node.b, env, rt) : l;
      }
      case 'bin': {
        var av = await evalExpr(node.a, env, rt);
        var bv = await evalExpr(node.b, env, rt);
        switch (node.op) {
          case '+':
            if (Array.isArray(av)) { return av.concat(Array.isArray(bv) ? bv : [bv]); }
            if (typeof av === 'string' || typeof bv === 'string') { return toStr(av) + toStr(bv); }
            return Number(av) + Number(bv);
          case '-': return Number(av) - Number(bv);
          case '*': return Number(av) * Number(bv);
          case '/': return Number(bv) === 0 ? 0 : Number(av) / Number(bv);
          case '%': return Number(av) % Number(bv);
          case '==': return av === bv || (typeof av !== 'object' && typeof bv !== 'object' && String(av) === String(bv) && (typeof av === typeof bv || av === null || bv === null));
          case '!=': return !(await evalExpr({ k: 'bin', op: '==', a: node.a, b: node.b, line: node.line }, env, rt));
          case '<': return av < bv;
          case '<=': return av <= bv;
          case '>': return av > bv;
          case '>=': return av >= bv;
        }
        throw err('不认识的运算符 ' + node.op, node.line);
      }
      case 'member': {
        var objm = await evalExpr(node.obj, env, rt);
        if (objm === null || objm === undefined) { return null; }
        var mv = objm[node.name];
        return mv === undefined ? null : mv;
      }
      case 'index': {
        var obji = await evalExpr(node.obj, env, rt);
        var ii = await evalExpr(node.idx, env, rt);
        if (obji === null || obji === undefined) { return null; }
        var iv = obji[ii];
        return iv === undefined ? null : iv;
      }
      case 'call': {
        var fn = await evalExpr(node.callee, env, rt);
        var args = [];
        for (var q = 0; q < node.args.length; q++) { args.push(await evalExpr(node.args[q], env, rt)); }
        if (typeof fn !== 'function') {
          throw err('“' + (node.callee.name || '这个值') + '” 不是函数，不能调用', node.line);
        }
        return await fn.apply(null, args);
      }
    }
    throw err('内部错误：不认识的表达式 ' + node.k, node.line);
  }

  async function execBlock(block, env, rt) {
    for (var i = 0; i < block.body.length; i++) {
      await execStmt(block.body[i], env, rt);
    }
  }

  async function execStmt(node, env, rt) {
    switch (node.k) {
      case 'block': return execBlock(node, env, rt);
      case 'expr': return evalExpr(node.value, env, rt);
      case 'assign': {
        var v = await evalExpr(node.value, env, rt);
        env.set(node.name, v);
        return v;
      }
      case 'fn': {
        var declared = makeFunction(node, env, rt);
        env.set(node.name, declared);
        return declared;
      }
      case 'if': {
        if (truthy(await evalExpr(node.cond, env, rt))) {
          return execBlock(node.then, new Env(env), rt);
        }
        if (node.alt) { return execBlock(node.alt, new Env(env), rt); }
        return null;
      }
      case 'while': {
        var guard = 0;
        while (truthy(await evalExpr(node.cond, env, rt))) {
          if (++guard > 10000000) { throw err('循环次数过多，先停一下', node.line); }
          try {
            await execBlock(node.body, new Env(env), rt);
          } catch (e) {
            if (e instanceof Brk) { break; }
            if (e instanceof Cnt) { continue; }
            throw e;
          }
        }
        return null;
      }
      case 'for': {
        var iter = await evalExpr(node.iter, env, rt);
        var seq = Array.isArray(iter) ? iter
                : (typeof iter === 'string' ? iter.split('') : []);
        for (var i = 0; i < seq.length; i++) {
          var inner = new Env(env);
          inner.def(node.name, seq[i]);
          try {
            await execBlock(node.body, inner, rt);
          } catch (e) {
            if (e instanceof Brk) { break; }
            if (e instanceof Cnt) { continue; }
            throw e;
          }
        }
        return null;
      }
      case 'every': {
        var ms = Number(await evalExpr(node.ms, env, rt)) || 0;
        if (ms < 50) { ms = 50; }
        var bodyEnv = env;
        rt.timers.push(setInterval(function () {
          execBlock(node.body, new Env(bodyEnv), rt).catch(function (e) { rt.onError(e); });
        }, ms));
        return ms;
      }
      case 'try': {
        try {
          return await execBlock(node.body, new Env(env), rt);
        } catch (e) {
          if (e instanceof Ret || e instanceof Brk || e instanceof Cnt) { throw e; }
          if (!node.cbody) { throw e; }
          var ce = new Env(env);
          if (node.ename) {
            ce.def(node.ename, {
              message: (e && e.message) ? e.message : toStr(e),
              line: (e && e.line) || 0
            });
          }
          return await execBlock(node.cbody, ce, rt);
        }
      }
      case 'return': {
        var rv = node.value ? await evalExpr(node.value, env, rt) : null;
        throw new Ret(rv);
      }
      case 'break': throw new Brk();
      case 'continue': throw new Cnt();
    }
    throw err('内部错误：不认识的语句 ' + node.k, node.line);
  }

  function makeFunction(node, closure, rt) {
    var f = async function () {
      var local = new Env(closure);
      for (var i = 0; i < node.params.length; i++) {
        local.def(node.params[i], arguments[i]);
      }
      try {
        await execBlock(node.body, local, rt);
        return null;
      } catch (e) {
        if (e instanceof Ret) { return e.v; }
        throw e;
      }
    };
    f.zbgName = node.name;
    f.zbgParams = node.params;
    return f;
  }

  /* =====================================================================
   * 4. 浏览器适配层
   * ===================================================================== */
  function installHost() {
    var hasDom = (typeof document !== 'undefined');
    HOST.fetch = function (url, opts) {
      if (typeof fetch !== 'function') {
        return Promise.reject(err('当前环境没有 fetch'));
      }
      var o = opts || {};
      if (o.body && typeof o.body === 'object') {
        o = { method: o.method || 'POST',
              headers: Object.assign({ 'Content-Type': 'application/json' }, o.headers || {}),
              body: JSON.stringify(o.body) };
      }
      return fetch(url, o).then(function (r) {
        return r.text().then(function (t) {
          var ct = r.headers && r.headers.get ? (r.headers.get('content-type') || '') : '';
          if (ct.indexOf('json') >= 0) {
            try { return JSON.parse(t); } catch (e) { return t; }
          }
          var s = t.trim();
          if (s.charAt(0) === '{' || s.charAt(0) === '[') {
            try { return JSON.parse(s); } catch (e) { return t; }
          }
          return t;
        });
      });
    };
    HOST.store = function (name, value) {
      try {
        if (value === undefined) { return localStorage.getItem(name); }
        localStorage.setItem(name, String(value));
        return value;
      } catch (e) { return null; }
    };
    HOST.cookie = function (name, value, days) {
      if (typeof document === 'undefined') { return null; }
      var all = document.cookie || '';
      if (value === undefined) {
        var m = new RegExp('(?:^|; )' + name + '=([^;]*)').exec(all);
        return m ? decodeURIComponent(m[1]) : null;
      }
      document.cookie = name + '=' + encodeURIComponent(value) +
        '; path=/; max-age=' + (days === undefined ? 31536000 : days * 86400) + '; samesite=lax';
      return value;
    };

    HOST.dom = function (op, sel, a, b) {
      if (!hasDom) { return null; }
      var el = document.querySelector(sel);
      if (!el) { return null; }
      if (op === 'text') { el.textContent = a === null || a === undefined ? '' : toStr(a); return el; }
      if (op === 'html') { el.innerHTML = a === null || a === undefined ? '' : toStr(a); return el; }
      if (op === 'value') { return el.value; }
      if (op === 'attr') {
        if (b === undefined) { return el.getAttribute(a); }
        el.setAttribute(a, toStr(b));
        return el;
      }
      if (op === 'show') { el.hidden = !a; return el; }
      if (op === 'on') {
        if (typeof b === 'function') { el.addEventListener(a, function () { b(); }); }
        return el;
      }
      return null;
    };
  }

  /* =====================================================================
   * 5. 对外接口
   * ===================================================================== */
  var runtime = { timers: [], onError: null };

  function run(source, options) {
    var opts = options || {};
    var rt = {
      timers: [],
      onError: opts.onError || function (e) {
        reportError(e, opts);
      }
    };
    var api = makeApi({ out: opts.out, env: opts.env });
    var g = new Env(null);
    Object.keys(api).forEach(function (name) { g.def(name, api[name]); });
    g.def('ZBG', { version: '1.0', run: run, lang: 'ZBG' });

    var program;
    try {
      program = parse(source);
    } catch (e) {
      rt.onError(e);
      return Promise.reject(e);
    }
    return (async function () {
      try {
        await execBlock(program, g, rt);
        return { ok: true, timers: rt.timers.length };
      } catch (e) {
        rt.onError(e);
        return { ok: false, error: e };
      }
    })();
  }

  function reportError(e, opts) {
    var where = e && e.line ? ('第 ' + e.line + ' 行：') : '';
    var msg = 'ZBG 出错 → ' + where + ((e && e.message) || e);
    if (opts && typeof opts.onError === 'function') { opts.onError(msg); return; }
    if (typeof console !== 'undefined') { console.error(msg); }
  }

  function autoRun(options) {
    if (typeof document === 'undefined') { return Promise.resolve(); }
    var scripts = document.querySelectorAll('script[type="text/zbg"]');
    var jobs = Promise.resolve();
    Array.prototype.forEach.call(scripts, function (s) {
      var src = s.textContent || '';
      var out = options && options.out;
      if (s.getAttribute('data-out')) {
        var sel = s.getAttribute('data-out');
        out = function (line) {
          var el = document.querySelector(sel);
          if (el) { el.textContent += (el.textContent ? '\n' : '') + line; }
        };
      }
      jobs = jobs.then(function () { return run(src, { out: out, onError: options && options.onError }); });
    });
    return jobs;
  }

  installHost();

  var ZBG = {
    version: '1.0',
    name: 'ZBG',
    tokenize: tokenize,
    parse: parse,
    run: run,
    autoRun: autoRun,
    help: function () { return HELP; }
  };

  var HELP = [
    'ZBG 小语言 —— 自己写的，浏览器直接能跑',
    '',
    '  变量      let x = 1        x = x + 1',
    '  函数      fn 加(a, b) { return a + b }',
    '  分支      if x > 1 { } elif x > 0 { } else { }',
    '  循环      while 条件 { } / for i in 0..5 { } / for 项 in 列表 { }',
    '  定时      every 10min { }      （时间字面量：30s / 10min / 2h / 1d / 500ms）',
    '  网络      d = await get("https://…")     post("https://…", {a: 1})',
    '  页面      text("#id", "内容")   html("#id", "<b>…</b>")   on("#btn", "click", 函数)',
    '  容错      try { } catch e { echo e.message }',
    '  字符串    "共 ${n} 次"（${} 里是表达式）',
    '  注释      # 到行尾        逻辑 and / or / not',
    '  列表映射  [1, 2, 3]        { 名称: "值", pv: 3 }',
    '  内置      echo fmt len str num min max floor round random push slice sort',
    '            join split keys pick set has upper lower trim replace contains',
    '            json parseJson toJson now date wait text html value attr show hide on'
  ].join('\n');

  if (typeof module !== 'undefined' && module.exports) { module.exports = ZBG; }
  root.ZBG = ZBG;

  if (typeof document !== 'undefined') {
    var boot = function () {
      ZBG.autoRun().catch(function () { /* 错误已通过 onError 报出 */ });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
