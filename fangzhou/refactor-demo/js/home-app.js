/* 工作台：上固定概览/快捷/公告；下可变长高密度列表 */
(function (global) {
  /* 演示报表（按可见项目名粗匹配；真环境按项目隔离） */
  var DEMO_STATS = {
    每日大赛: {
      tgYesterday: 128,
      webYesterday: 36,
      matIn: 420,
      matPass: 310,
      toArticle: 86,
      pushed: 72
    },
    "51 吃瓜": {
      tgYesterday: 64,
      webYesterday: 22,
      matIn: 210,
      matPass: 150,
      toArticle: 40,
      pushed: 28
    },
    "91 网黄": {
      tgYesterday: 12,
      webYesterday: 4,
      matIn: 48,
      matPass: 20,
      toArticle: 9,
      pushed: 5
    },
    "51 原创": {
      tgYesterday: 28,
      webYesterday: 8,
      matIn: 96,
      matPass: 55,
      toArticle: 18,
      pushed: 12
    },
    "51 短剧": {
      tgYesterday: 0,
      webYesterday: 0,
      matIn: 0,
      matPass: 0,
      toArticle: 0,
      pushed: 0
    },
    "51 短视频": {
      tgYesterday: 6,
      webYesterday: 14,
      matIn: 32,
      matPass: 18,
      toArticle: 0,
      pushed: 0
    },
    _default: {
      tgYesterday: 40,
      webYesterday: 10,
      matIn: 80,
      matPass: 50,
      toArticle: 20,
      pushed: 12
    }
  };

  /* 近 7 日采集（示意；与昨日 KPI 粗对齐） */
  var DEMO_WEEK = {
    labels: ["10-23", "10-24", "10-25", "10-26", "10-27", "10-28", "10-29"],
    tg: [98, 112, 105, 130, 88, 122, 140],
    web: [22, 30, 28, 35, 18, 32, 40]
  };

  var PAGE_MID = 5;
  var PAGE_WORK = 20;
  var pageState = { todos: 1, alerts: 1, mats: 1, arts: 1 };

  function esc(s) {
    return FZShell.escHtml(s);
  }
  function can(need) {
    return FZStore.hasFeature(FZStore.read(), need);
  }
  function empty(msg) {
    return '<p class="muted wb-empty">' + esc(msg) + "</p>";
  }

  function slicePage(list, page, size) {
    var all = list || [];
    var total = all.length;
    var pages = Math.max(1, Math.ceil(total / size) || 1);
    var p = Math.min(Math.max(1, Number(page) || 1), pages);
    var start = (p - 1) * size;
    return {
      page: p,
      pages: pages,
      total: total,
      size: size,
      items: all.slice(start, start + size)
    };
  }

  /** always：中间栏即使不足一页也显示分页器，高度固定可对齐 */
  function compactPager(key, sl, always) {
    if (!sl) return "";
    if (!always && sl.total <= sl.size) return "";
    return (
      '<div class="wb-pager" data-wb-pg="' +
      esc(key) +
      '">' +
      '<span class="wb-pager-meta">共 ' +
      sl.total +
      " 条 · 每页 " +
      sl.size +
      "</span>" +
      '<button type="button" class="wb-pager-btn" data-wb-pg-go="prev"' +
      (sl.page <= 1 ? " disabled" : "") +
      ">‹</button>" +
      '<span class="wb-pager-meta">' +
      sl.page +
      " / " +
      sl.pages +
      "</span>" +
      '<button type="button" class="wb-pager-btn" data-wb-pg-go="next"' +
      (sl.page >= sl.pages ? " disabled" : "") +
      ">›</button></div>"
    );
  }

  function bindWorkbenchPagers() {
    var root = document.getElementById("wb-root");
    if (!root || root.getAttribute("data-wb-pg-bound")) return;
    root.setAttribute("data-wb-pg-bound", "1");
    root.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-wb-pg-go]");
      if (!btn || btn.disabled) return;
      var wrap = btn.closest("[data-wb-pg]");
      if (!wrap) return;
      var key = wrap.getAttribute("data-wb-pg");
      if (!pageState.hasOwnProperty(key)) return;
      var go = btn.getAttribute("data-wb-pg-go");
      pageState[key] += go === "next" ? 1 : -1;
      if (pageState[key] < 1) pageState[key] = 1;
      var s = FZStore.read();
      if (key === "todos") renderTodos(s);
      else if (key === "alerts") renderAlerts(s);
      else if (key === "mats") renderMats();
      else if (key === "arts") renderArts();
    });
  }

  function denseRow(cells, actionHtml, opts) {
    opts = opts || {};
    var sev = opts.sev === "danger" || opts.sev === "warn" ? " is-" + opts.sev : "";
    return (
      '<div class="wb-drow' +
      sev +
      '">' +
      '<div class="wb-dcols">' +
      cells
        .map(function (c, i) {
          return (
            '<span class="wb-dcell' +
            (i === 0 ? " is-main" : "") +
            (c.cls ? " " + c.cls : "") +
            '"' +
            (c.tip ? ' title="' + esc(c.tip) + '"' : "") +
            ">" +
            (c.html || esc(c.text || "—")) +
            "</span>"
          );
        })
        .join("") +
      "</div>" +
      (actionHtml || "") +
      "</div>"
    );
  }

  function headRow(labels) {
    return (
      '<div class="wb-drow wb-drow--head"><div class="wb-dcols">' +
      labels
        .map(function (l, i) {
          return (
            '<span class="wb-dcell' +
            (i === 0 ? " is-main" : "") +
            '">' +
            esc(l) +
            "</span>"
          );
        })
        .join("") +
      '</div><span class="wb-dact-ph"></span></div>'
    );
  }

  function sumStats(projects) {
    var acc = {
      tgYesterday: 0,
      webYesterday: 0,
      matIn: 0,
      matPass: 0,
      toArticle: 0,
      pushed: 0
    };
    if (!projects.length) return acc;
    projects.forEach(function (p) {
      var row = DEMO_STATS[p.name] || DEMO_STATS._default;
      Object.keys(acc).forEach(function (k) {
        acc[k] += row[k] || 0;
      });
    });
    return acc;
  }

  function isNewEmpty() {
    return !!(FZStore.isEmptyOnboarding && FZStore.isEmptyOnboarding(FZStore.read()));
  }

  function pendingMats() {
    if (isNewEmpty()) return [];
    if (!can("collect.materials.view")) {
      return [];
    }
    return ((global.FZMatData && FZMatData.ITEMS) || []).filter(function (m) {
      return m.status === "pending";
    });
  }

  function workArts() {
    if (isNewEmpty()) return [];
    if (!can("content.article.view") || !global.FZArticles) return [];
    return FZArticles.list().filter(function (a) {
      return (
        a.status === "awaiting_edit" ||
        a.status === "failed" ||
        a.status === "pending"
      );
    });
  }

  function pct(num, den) {
    if (!den) return "—";
    return Math.round((num / den) * 100) + "%";
  }

  function deltaPct(cur, prev) {
    if (prev == null || prev === 0) return "";
    var d = Math.round(((cur - prev) / prev) * 1000) / 10;
    var sign = d > 0 ? "+" : "";
    return sign + d + "%";
  }

  /** 近 7 日双折线：可读刻度 + 悬停提示 */
  function sparkLines(seriesA, seriesB, labels) {
    var max = 1;
    seriesA.concat(seriesB).forEach(function (v) {
      if (v > max) max = v;
    });
    max = Math.ceil(max / 10) * 10 || 10;
    var w = 560;
    var h = 168;
    var padL = 28;
    var padR = 8;
    var padTop = 10;
    var padBot = 20;
    var plotH = h - padTop - padBot;
    var plotW = w - padL - padR;
    var n = seriesA.length;
    var step = n <= 1 ? 0 : plotW / (n - 1);
    var baseY = padTop + plotH;

    function pt(series, i) {
      return {
        x: padL + i * step,
        y: padTop + plotH * (1 - series[i] / max)
      };
    }
    function ptsOf(series) {
      var out = [];
      for (var i = 0; i < n; i++) out.push(pt(series, i));
      return out;
    }
    function smoothPath(pts) {
      if (!pts.length) return "";
      if (pts.length === 1) {
        return "M " + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
      }
      var d = "M " + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
      for (var i = 0; i < pts.length - 1; i++) {
        var p0 = pts[i];
        var p1 = pts[i + 1];
        var cx = ((p0.x + p1.x) / 2).toFixed(1);
        d +=
          " C " +
          cx +
          " " +
          p0.y.toFixed(1) +
          ", " +
          cx +
          " " +
          p1.y.toFixed(1) +
          ", " +
          p1.x.toFixed(1) +
          " " +
          p1.y.toFixed(1);
      }
      return d;
    }
    function areaPath(pts) {
      if (!pts.length) return "";
      var d = smoothPath(pts);
      var last = pts[pts.length - 1];
      var first = pts[0];
      return (
        d +
        " L " +
        last.x.toFixed(1) +
        " " +
        baseY +
        " L " +
        first.x.toFixed(1) +
        " " +
        baseY +
        " Z"
      );
    }
    function dots(pts, cls) {
      return pts
        .map(function (p) {
          return (
            '<circle class="' +
            cls +
            '" cx="' +
            p.x.toFixed(1) +
            '" cy="' +
            p.y.toFixed(1) +
            '" r="3"/>'
          );
        })
        .join("");
    }
    var ptsA = ptsOf(seriesA);
    var ptsB = ptsOf(seriesB);
    /* 仅刻度文字，不要中间网格 */
    var axisLabels = "";
    [0, 0.5, 1].forEach(function (t) {
      var y = (padTop + plotH * (1 - t)).toFixed(1);
      var val = Math.round(max * t);
      axisLabels +=
        '<text class="wb-spark-y" x="' +
        (padL - 4) +
        '" y="' +
        (Number(y) + 3) +
        '" text-anchor="end">' +
        val +
        "</text>";
    });
    var hits = "";
    for (var i = 0; i < n; i++) {
      var hx = padL + i * step - step / 2;
      var hw = i === 0 || i === n - 1 ? step / 2 + 4 : step;
      if (i === 0) hx = padL - 2;
      hits +=
        '<rect class="wb-spark-hit" data-i="' +
        i +
        '" data-label="' +
        esc(labels[i]) +
        '" data-a="' +
        seriesA[i] +
        '" data-b="' +
        seriesB[i] +
        '" data-da="' +
        esc(deltaPct(seriesA[i], i ? seriesA[i - 1] : null)) +
        '" data-db="' +
        esc(deltaPct(seriesB[i], i ? seriesB[i - 1] : null)) +
        '" x="' +
        Math.max(padL - 2, hx).toFixed(1) +
        '" y="' +
        padTop +
        '" width="' +
        hw.toFixed(1) +
        '" height="' +
        plotH +
        '" fill="transparent"/>';
    }
    var labs = labels
      .map(function (lb, i) {
        var x = padL + i * step;
        return (
          '<text class="wb-spark-x" x="' +
          x.toFixed(1) +
          '" y="' +
          (h - 4) +
          '" text-anchor="middle">' +
          esc(lb.slice(3)) +
          "</text>"
        );
      })
      .join("");
    return (
      '<div class="wb-spark-wrap">' +
      '<svg class="wb-spark" viewBox="0 0 ' +
      w +
      " " +
      h +
      '" preserveAspectRatio="none" role="img" aria-label="近7日采集折线图">' +
      "<defs>" +
      '<linearGradient id="wbSparkFillA" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#93c5fd" stop-opacity="0.18"/>' +
      '<stop offset="100%" stop-color="#93c5fd" stop-opacity="0.01"/>' +
      "</linearGradient>" +
      '<linearGradient id="wbSparkFillB" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#fcd34d" stop-opacity="0.14"/>' +
      '<stop offset="100%" stop-color="#fcd34d" stop-opacity="0.01"/>' +
      "</linearGradient></defs>" +
      axisLabels +
      '<line class="wb-spark-yaxis" x1="' +
      padL +
      '" y1="' +
      padTop +
      '" x2="' +
      padL +
      '" y2="' +
      baseY +
      '"/>' +
      '<line class="wb-spark-base" x1="' +
      padL +
      '" y1="' +
      baseY +
      '" x2="' +
      (w - padR) +
      '" y2="' +
      baseY +
      '"/>' +
      '<path class="wb-spark-area-a" d="' +
      areaPath(ptsA) +
      '" fill="url(#wbSparkFillA)"/>' +
      '<path class="wb-spark-area-b" d="' +
      areaPath(ptsB) +
      '" fill="url(#wbSparkFillB)"/>' +
      '<path class="wb-spark-line-a" d="' +
      smoothPath(ptsA) +
      '" fill="none"/>' +
      '<path class="wb-spark-line-b" d="' +
      smoothPath(ptsB) +
      '" fill="none"/>' +
      dots(ptsA, "wb-spark-dot-a") +
      dots(ptsB, "wb-spark-dot-b") +
      labs +
      hits +
      "</svg>" +
      '<div class="wb-spark-tip" hidden></div>' +
      '<div class="wb-spark-cross" hidden></div></div>'
    );
  }

  function bindSparkTips(root) {
    if (!root) return;
    root.querySelectorAll(".wb-spark-wrap").forEach(function (wrap) {
      var tip = wrap.querySelector(".wb-spark-tip");
      var cross = wrap.querySelector(".wb-spark-cross");
      var svg = wrap.querySelector(".wb-spark");
      if (!tip || !svg) return;
      var dotsA = wrap.querySelectorAll(".wb-spark-dot-a");
      var dotsB = wrap.querySelectorAll(".wb-spark-dot-b");
      dotsA.forEach(function (d, i) {
        d.setAttribute("data-i", String(i));
      });
      dotsB.forEach(function (d, i) {
        d.setAttribute("data-i", String(i));
      });
      function setDots(i) {
        dotsA.forEach(function (d) {
          d.classList.toggle("is-on", Number(d.getAttribute("data-i")) === i);
        });
        dotsB.forEach(function (d) {
          d.classList.toggle("is-on", Number(d.getAttribute("data-i")) === i);
        });
      }
      wrap.querySelectorAll(".wb-spark-hit").forEach(function (hit) {
        hit.addEventListener("mouseenter", function () {
          var i = Number(hit.getAttribute("data-i"));
          var label = hit.getAttribute("data-label") || "";
          var a = hit.getAttribute("data-a");
          var b = hit.getAttribute("data-b");
          var da = hit.getAttribute("data-da") || "";
          var db = hit.getAttribute("data-db") || "";
          tip.hidden = false;
          tip.innerHTML =
            '<div class="wb-spark-tip-h">' +
            esc(label) +
            "</div>" +
            '<div class="wb-spark-tip-row"><i class="is-a"></i><span>TG</span><strong>' +
            esc(a) +
            "</strong>" +
            (da ? "<em>" + esc(da) + "</em>" : "") +
            "</div>" +
            '<div class="wb-spark-tip-row"><i class="is-b"></i><span>网站</span><strong>' +
            esc(b) +
            "</strong>" +
            (db ? "<em>" + esc(db) + "</em>" : "") +
            "</div>";
          var cx =
            Number(hit.getAttribute("x")) + Number(hit.getAttribute("width")) / 2;
          var vb = svg.viewBox.baseVal;
          var ratioX = svg.clientWidth / (vb.width || 1);
          var left = cx * ratioX;
          tip.style.left =
            Math.min(wrap.clientWidth - 12, Math.max(12, left)) + "px";
          if (cross) {
            cross.hidden = false;
            cross.style.left = left + "px";
          }
          setDots(i);
        });
        hit.addEventListener("mouseleave", function () {
          tip.hidden = true;
          if (cross) cross.hidden = true;
          setDots(-1);
        });
      });
    });
  }

  /** KPI 迷你柱：示意近 5 档走势，高度跟数值弱相关 */
  function miniBars(n) {
    var base = [0.38, 0.62, 0.48, 0.78, 0.92];
    var bump = ((Number(n) || 0) % 9) / 30;
    return (
      '<span class="wb-kpi-bars" aria-hidden="true">' +
      base
        .map(function (f) {
          var h = Math.round((f + bump) * 100);
          return "<i style=\"height:" + Math.min(100, h) + '%"></i>';
        })
        .join("") +
      "</span>"
    );
  }

  function kpiIcon(kind) {
    var paths = {
      tg: '<path d="M4 12h16M8 8l4-4 4 4M8 16l4 4 4-4"/>',
      web: '<circle cx="12" cy="12" r="8"/><path d="M3 12h18M12 4a14 14 0 010 16M12 4a14 14 0 000 16"/>',
      mat: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5"/>',
      pass: '<path d="M5 12l4 4L19 7"/>',
      art: '<path d="M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M14 4v5h5"/>',
      push: '<path d="M5 12h10M12 7l5 5-5 5"/>',
      pending: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/>',
      draft: '<path d="M5 19l3.5-1L18 8.5 15.5 6 5 15.5V19z"/>'
    };
    return (
      '<span class="wb-kpi-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      (paths[kind] || paths.mat) +
      "</svg></span>"
    );
  }

  function kpiCard(c) {
    return (
      '<div class="wb-kpi' +
      (c.warn ? " is-warn" : "") +
      (c.live ? " is-live" : "") +
      " is-" +
      (c.tone || "t1") +
      '">' +
      '<div class="wb-kpi-top">' +
      kpiIcon(c.icon) +
      '<div class="wb-kpi-l">' +
      esc(c.l) +
      "</div></div>" +
      '<div class="wb-kpi-foot"><div class="wb-kpi-val"><span class="wb-kpi-n">' +
      c.n +
      "</span>" +
      (c.sub ? '<span class="wb-kpi-unit">' + esc(c.sub) + "</span>" : "") +
      "</div>" +
      miniBars(c.n) +
      "</div></div>"
    );
  }

  /** 昨日贡献 Top3：玻璃柱领奖台（2 / 1 / 3） */
  function projectPodium(projects) {
    var rows = projects
      .map(function (p) {
        var row = DEMO_STATS[p.name] || DEMO_STATS._default;
        return {
          name: p.name,
          v: (row.tgYesterday || 0) + (row.webYesterday || 0)
        };
      })
      .sort(function (a, b) {
        return b.v - a.v;
      })
      .slice(0, 3);
    if (!rows.length) {
      return '<p class="muted wb-empty" style="margin:0">暂无项目贡献</p>';
    }
    while (rows.length < 3) {
      rows.push({ name: "—", v: 0, empty: true });
    }
    var max = Math.max(rows[0].v, 1);
    var order = [1, 0, 2];
    var heights = [108, 148, 86];
    var medalSvg =
      '<svg viewBox="0 0 40 48" aria-hidden="true">' +
      '<path class="wb-podium-ribbon" d="M14 6h12l-2 10h-8z"/>' +
      '<circle class="wb-podium-coin" cx="20" cy="28" r="12"/>' +
      '<path class="wb-podium-star" d="M20 20.5l2.2 4.4 4.8.7-3.5 3.4.8 4.8L20 31.5l-4.3 2.3.8-4.8-3.5-3.4 4.8-.7z"/>' +
      "</svg>";
    return (
      '<div class="wb-podium">' +
      '<div class="wb-podium-glow" aria-hidden="true"></div>' +
      order
        .map(function (rankIdx, vis) {
          var r = rows[rankIdx];
          var h =
            r.v <= 0
              ? 48
              : Math.max(58, Math.round((r.v / max) * heights[vis]));
          return (
            '<div class="wb-podium-col is-r' +
            (rankIdx + 1) +
            (r.empty ? " is-empty" : "") +
            '">' +
            '<div class="wb-podium-medal">' +
            medalSvg +
            "</div>" +
            '<div class="wb-podium-name" title="' +
            esc(r.name) +
            '">' +
            esc(r.name) +
            "</div>" +
            '<div class="wb-podium-n">' +
            r.v +
            "</div>" +
            '<div class="wb-podium-shaft" style="height:' +
            h +
            'px">' +
            '<i class="is-top"></i><i class="is-face"></i><i class="is-side"></i>' +
            "</div></div>"
          );
        })
        .join("") +
      '<div class="wb-podium-mist" aria-hidden="true"></div></div>'
    );
  }

  /** 链路转化：倒三角分层流（参考图左右颠倒 → 上宽下窄） */
  function funnelHtml(acc, canMat, canArt) {
    var steps = [];
    if (canMat) {
      steps.push({
        label: "收到素材",
        n: acc.matIn,
        rate: null
      });
      steps.push({
        label: "素材通过",
        n: acc.matPass,
        rate: pct(acc.matPass, acc.matIn)
      });
    }
    if (canArt) {
      steps.push({
        label: "进入文章",
        n: acc.toArticle,
        rate: pct(acc.toArticle, acc.matPass || acc.matIn)
      });
      steps.push({
        label: "已推业务端",
        n: acc.pushed,
        rate: pct(acc.pushed, acc.toArticle || acc.matPass)
      });
    }
    if (!steps.length) return "";
    var W = 300;
    var H = 210;
    var n = steps.length;
    var topW = 250;
    var botW = 48;
    var y0 = 18;
    var y1 = H - 14;
    var bandH = (y1 - y0) / n;
    var fills = [
      "rgba(253, 186, 116, 0.62)",
      "rgba(253, 186, 116, 0.5)",
      "rgba(254, 215, 170, 0.55)",
      "rgba(254, 243, 226, 0.7)"
    ];
    var paths = "";
    var markers = "";
    var labels = "";
    for (var i = 0; i < n; i++) {
      var tA = i / n;
      var tB = (i + 1) / n;
      var wA = topW + (botW - topW) * tA;
      var wB = topW + (botW - topW) * tB;
      var ya = y0 + i * bandH;
      var yb = y0 + (i + 1) * bandH;
      var xaL = (W - wA) / 2;
      var xaR = xaL + wA;
      var xbL = (W - wB) / 2;
      var xbR = xbL + wB;
      var midY = (ya + yb) / 2;
      /* 轻微外凸，更像流带 */
      var bulge = 4 + (n - i) * 1.2;
      paths +=
        '<path class="wb-funnel-band" fill="' +
        fills[i % fills.length] +
        '" d="M' +
        xaL.toFixed(1) +
        " " +
        ya.toFixed(1) +
        " C " +
        (xaL - bulge).toFixed(1) +
        " " +
        midY.toFixed(1) +
        ", " +
        (xbL - bulge).toFixed(1) +
        " " +
        midY.toFixed(1) +
        ", " +
        xbL.toFixed(1) +
        " " +
        yb.toFixed(1) +
        " L " +
        xbR.toFixed(1) +
        " " +
        yb.toFixed(1) +
        " C " +
        (xbR + bulge).toFixed(1) +
        " " +
        midY.toFixed(1) +
        ", " +
        (xaR + bulge).toFixed(1) +
        " " +
        midY.toFixed(1) +
        ", " +
        xaR.toFixed(1) +
        " " +
        ya.toFixed(1) +
        ' Z"/>';
      var pillW = 88;
      var onRight = i % 2 === 0;
      var pillX = onRight
        ? Math.min(W - pillW - 4, xaR - 10)
        : Math.max(4, xaL - pillW + 10);
      var markX = onRight ? xaR - 2 : xaL + 2;
      markers +=
        '<line class="wb-funnel-mark" x1="' +
        markX.toFixed(1) +
        '" y1="' +
        (ya + 4).toFixed(1) +
        '" x2="' +
        markX.toFixed(1) +
        '" y2="' +
        (yb - 4).toFixed(1) +
        '"/>';
      labels +=
        '<g class="wb-funnel-callout" transform="translate(' +
        pillX.toFixed(1) +
        " " +
        (midY - 16).toFixed(1) +
        ')">' +
        '<rect rx="9" ry="9" width="' +
        pillW +
        '" height="32" class="wb-funnel-pill"/>' +
        '<text x="' +
        pillW / 2 +
        '" y="13" text-anchor="middle" class="wb-funnel-pill-n">' +
        steps[i].n +
        (steps[i].rate ? " · " + esc(steps[i].rate) : "") +
        "</text>" +
        '<text x="' +
        pillW / 2 +
        '" y="25" text-anchor="middle" class="wb-funnel-pill-l">' +
        esc(steps[i].label) +
        "</text></g>";
    }
    return (
      '<div class="wb-funnel-viz">' +
      '<svg class="wb-funnel-svg" viewBox="0 0 ' +
      W +
      " " +
      H +
      '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="链路转化倒三角">' +
      "<defs>" +
      '<linearGradient id="wbFunnelSheen" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#fff" stop-opacity="0.28"/>' +
      '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
      "</linearGradient></defs>" +
      paths +
      '<rect width="' +
      W +
      '" height="' +
      H +
      '" fill="url(#wbFunnelSheen)" pointer-events="none"/>' +
      markers +
      labels +
      "</svg></div>"
    );
  }

  function weekSumHtml(seriesA, seriesB) {
    function sum(arr) {
      return (arr || []).reduce(function (a, b) {
        return a + (b || 0);
      }, 0);
    }
    var tg = sum(seriesA);
    var web = sum(seriesB);
    var tgDelta = deltaPct(
      seriesA[seriesA.length - 1],
      seriesA[seriesA.length - 2]
    );
    var webDelta = deltaPct(
      seriesB[seriesB.length - 1],
      seriesB[seriesB.length - 2]
    );
    function arrow(d) {
      if (!d) return "";
      if (d.charAt(0) === "+") return '<i class="wb-trend is-up" aria-hidden="true"></i>';
      if (d.charAt(0) === "-") return '<i class="wb-trend is-down" aria-hidden="true"></i>';
      return "";
    }
    return (
      '<div class="wb-spark-sum">' +
      '<div class="wb-spark-sum-i">' +
      '<span class="wb-spark-sum-l">TG 近 7 日</span>' +
      '<div class="wb-spark-sum-v"><strong>' +
      tg +
      "</strong>" +
      arrow(tgDelta) +
      "</div></div>" +
      '<div class="wb-spark-sum-i">' +
      '<span class="wb-spark-sum-l">网站 近 7 日</span>' +
      '<div class="wb-spark-sum-v"><strong>' +
      web +
      "</strong>" +
      arrow(webDelta) +
      "</div></div></div>"
    );
  }

  function overviewProjects(s) {
    var list = FZStore.businessProjects(s) || [];
    if (list.length) return list;
    /* 无业务项目时仍用示意项目名汇总，避免首页数字全空 */
    return Object.keys(DEMO_STATS)
      .filter(function (k) {
        return k !== "_default";
      })
      .map(function (name) {
        return { name: name };
      });
  }

  function renderStats(s) {
    /* 模块人人可见；指标按权限裁剪，无权限的数字不出现（不整块隐藏） */
    var box = document.getElementById("wb-stats");
    var extra = document.getElementById("wb-stats-extra");
    if (!box) return;
    var projects = overviewProjects(s);
    var canTg = can("collect.tg.view");
    var canWeb = can("collect.web.view");
    var canMat =
      can("collect.materials.view");
    var canArt = can("content.article.view");
    var acc = sumStats(projects);
    var mats = canMat ? pendingMats().length : 0;
    var arts = canArt ? workArts().length : 0;
    var cards = [
      {
        n: acc.tgYesterday,
        l: "昨日 TG 采集",
        sub: "条",
        need: canTg,
        icon: "tg",
        tone: "t1"
      },
      {
        n: acc.webYesterday,
        l: "昨日网站采集",
        sub: "条",
        need: canWeb,
        icon: "web",
        tone: "t2"
      },
      {
        n: acc.matIn,
        l: "昨日收到素材",
        sub: "条",
        need: canMat,
        icon: "mat",
        tone: "t3"
      },
      {
        n: acc.matPass,
        l: "昨日素材通过",
        sub: "条",
        need: canMat,
        icon: "pass",
        tone: "t4"
      },
      {
        n: acc.toArticle,
        l: "昨日进入文章",
        sub: "篇",
        need: canArt,
        icon: "art",
        tone: "t5"
      },
      {
        n: acc.pushed,
        l: "昨日已推业务端",
        sub: "篇",
        need: canArt,
        icon: "push",
        tone: "t6"
      },
      {
        n: mats,
        l: "当前待审素材",
        sub: "条",
        need: canMat,
        warn: mats > 0,
        live: true,
        icon: "pending",
        tone: "t7"
      },
      {
        n: arts,
        l: "当前待处理稿件",
        sub: "篇",
        need: canArt,
        warn: arts > 0,
        live: true,
        icon: "draft",
        tone: "t8"
      }
    ].filter(function (c) {
      return !!c.need;
    });
    if (!cards.length) {
      box.innerHTML = empty("当前权限下暂无可汇总指标");
    } else {
      box.innerHTML = cards.map(kpiCard).join("");
    }
    if (!extra) return;
    var panels = [];
    if (canTg || canWeb) {
      panels.push(
        '<div class="wb-stat-panel wb-stat-panel--spark">' +
          '<div class="wb-stat-panel-h">近 7 日采集' +
          '<span class="wb-spark-leg"><i class="is-a"></i>TG <i class="is-b"></i>网站</span></div>' +
          weekSumHtml(DEMO_WEEK.tg, DEMO_WEEK.web) +
          sparkLines(DEMO_WEEK.tg, DEMO_WEEK.web, DEMO_WEEK.labels) +
          "</div>"
      );
    }
    if (canMat || canArt) {
      panels.push(
        '<div class="wb-stat-panel wb-stat-panel--funnel">' +
          '<div class="wb-stat-panel-h">链路转化</div>' +
          funnelHtml(acc, canMat, canArt) +
          "</div>"
      );
    }
    if (canTg || canWeb || can("projects.list.view")) {
      panels.push(
        '<div class="wb-stat-panel wb-stat-panel--podium">' +
          '<div class="wb-stat-panel-h">昨日项目贡献 · Top3</div>' +
          projectPodium(projects) +
          "</div>"
      );
    }
    extra.innerHTML = panels.join("");
    extra.classList.toggle("is-sparse", panels.length < 3);
    bindSparkTips(extra);
  }

  function canSeeTodos() {
    return can("projects.list.view");
  }

  function canSeeMats() {
    return can("collect.materials.view");
  }

  function canSeeArts() {
    return can("content.article.view");
  }

  function adaptWorkbenchLayout() {
    /* 本期工作台只保留：新手教程 + 数据概览 / 状态异常 / 平台公告 */
  }

  function renderQuick() {
    var box = document.getElementById("wb-quick");
    if (!box) return;
    var items = [
      {
        need: "projects.list.proj_new",
        label: "新建项目",
        href: "./project-setup.html?new=1",
        primary: true
      },
      {
        need: "collect.tg.bot_add",
        label: "添加采集号",
        href: "./tg-collect.html?action=add_bot"
      },
      {
        need: "collect.tg.ch_join",
        label: "添加频道",
        href: "./tg-collect.html?action=add_channel"
      },
      {
        need: "collect.web.site_apply",
        label: "添加网站",
        href: "./website-collect.html?new=1"
      },
      {
        need: "collect.tg.route_add",
        label: "增加路由",
        href: "./tg-collect.html?action=add_route"
      }
    ].filter(function (x) {
      return can(x.need);
    });
    if (!items.length) {
      box.innerHTML = empty("当前角色无快捷操作权限");
      return;
    }
    box.innerHTML = items
      .map(function (x) {
        return (
          '<a class="wb-qchip' +
          (x.primary ? " is-primary" : "") +
          '" href="' +
          x.href +
          '">' +
          esc(x.label) +
          "</a>"
        );
      })
      .join("");
  }

  function renderAnnounce() {
    var box = document.getElementById("wb-announce");
    if (!box) return;
    var list =
      global.FZAnnouncements && typeof FZAnnouncements.all === "function"
        ? FZAnnouncements.all().slice(0, 3)
        : [];
    if (!list.length) {
      box.innerHTML = empty("暂无公告");
      return;
    }
    box.innerHTML = list
      .map(function (a) {
        return (
          '<a class="wb-an-item" href="./announcement-detail.html?id=' +
          encodeURIComponent(a.id) +
          '">' +
          '<div class="wb-an-top"><strong>' +
          esc(a.title) +
          "</strong><span>" +
          esc(a.time) +
          "</span></div>" +
          "<p>" +
          esc(a.body) +
          "</p></a>"
        );
      })
      .join("");
  }

  function statusTag(text, cls) {
    return (
      '<span class="tag ' +
      (cls || "tag-warn") +
      '">' +
      esc(text) +
      "</span>"
    );
  }

  function buildTodoItems(s) {
    var items = [];
    var projects = FZStore.businessProjects(s);
    var canProj = can("projects.list.view");

    if (canProj && !projects.length && can("projects.list.proj_new")) {
      items.push({
        matter: "创建首个业务项目",
        tip: "新号入驻",
        type: "入驻",
        statusHtml: statusTag("需创建", "tag-warn"),
        act:
          '<a class="btn btn-sm btn-create" href="./project-setup.html?new=1">+ 创建</a>',
        rank: 0
      });
    }
    if (canProj) {
      projects.forEach(function (p) {
        var matter = "";
        var href = "";
        var btn = "";
        var stText = "";
        var stCls = "tag-warn";
        if (p.status === "pending_activate" && can("projects.list.proj_connect")) {
          matter = "内容通道待接通 · " + p.name;
          href = "./project-connect.html?id=" + encodeURIComponent(p.id);
          btn = "对接";
          stText = "待接通";
        } else if (p.status === "need_collect" && can("projects.list.view")) {
          matter = "缺采集源 · " + p.name;
          href =
            "./project-edit.html?id=" + encodeURIComponent(p.id) + "&tab=flow";
          btn = "配置";
          stText = "待完善";
          stCls = "tag-muted";
        } else if (!p.watermarkDone && can("projects.list.wm")) {
          matter = "媒体配置待完善 · " + p.name;
          href = "./project-edit.html?id=" + encodeURIComponent(p.id);
          btn = "完善";
          stText = "待完善";
        }
        if (!matter) return;
        items.push({
          matter: matter,
          tip: p.name,
          type: "项目",
          statusHtml: statusTag(stText, stCls),
          act: href
            ? '<a class="btn btn-sm btn-primary" href="' + href + '">' + btn + "</a>"
            : "",
          rank: 1
        });
      });
    }

    var ticketKind = { bug: "Bug", ui: "UI", idea: "建议", other: "其他" };
    (s.tickets || []).forEach(function (t) {
      var done = t.status === "done";
      var text = String(t.text || "");
      var short = text.slice(0, 48) + (text.length > 48 ? "…" : "");
      var kindLabel = ticketKind[t.kind] || "";
      items.push({
        matter: short || "（空反馈）",
        tip: (t.by ? "提交人 " + t.by + " · " : "") + text,
        type: kindLabel ? "反馈 · " + kindLabel : "反馈工单",
        statusHtml: done
          ? statusTag("已处理", "tag-ok")
          : statusTag("待处理", "tag-warn"),
        act: done
          ? ""
          : '<button type="button" class="btn btn-sm" data-tk-done="' +
            esc(t.id) +
            '">办结</button>',
        rank: done ? 3 : 2
      });
    });

    items.sort(function (a, b) {
      return a.rank - b.rank;
    });
    return items;
  }

  function bindTodoActions(box) {
    if (!box || box.getAttribute("data-todo-bound")) return;
    box.setAttribute("data-todo-bound", "1");
    box.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tk-done]");
      if (!btn) return;
      var id = btn.getAttribute("data-tk-done");
      var st = FZStore.read();
      (st.tickets || []).forEach(function (t) {
        if (t.id === id) t.status = "done";
      });
      FZStore.write(st);
      FZShell.toast("工单已办结", "ok");
      renderTodos(FZStore.read());
    });
  }

  function renderTodos(s) {
    var box = document.getElementById("wb-todos");
    if (!box) return;
    bindTodoActions(box);
    bindWorkbenchPagers();
    var canProj = can("projects.list.view");
    var items = buildTodoItems(s);
    if (!canProj && !(s.tickets || []).length) {
      box.innerHTML =
        empty("暂无待办") +
        compactPager("todos", slicePage([], 1, PAGE_MID), true);
      return;
    }
    if (!items.length) {
      box.innerHTML =
        empty("暂无待办事项") +
        compactPager("todos", slicePage([], 1, PAGE_MID), true);
      return;
    }
    var sl = slicePage(items, pageState.todos, PAGE_MID);
    pageState.todos = sl.page;
    box.innerHTML =
      headRow(["事项", "类型", "状态"]) +
      '<div class="wb-dense-body">' +
      sl.items
        .map(function (it) {
          return denseRow(
            [
              { text: it.matter, tip: it.tip || it.matter },
              { text: it.type },
              { html: it.statusHtml }
            ],
            it.act || ""
          );
        })
        .join("") +
      "</div>" +
      compactPager("todos", sl, true);
  }

  function alertTypeLabel(kind) {
    var k = String(kind || "异常");
    if (/频道/.test(k)) return "频道异常";
    if (/采集号|Userbot|号异常/.test(k)) return "采集号异常";
    if (/素材/.test(k)) return "素材异常";
    if (/稿件|文章/.test(k)) return "稿件异常";
    return k.indexOf("异常") >= 0 ? k : k + "异常";
  }

  function buildAlerts(s) {
    var list = [];
    var projects = FZStore.businessProjects(s) || [];
    var seedAlerts = s.statusAlerts || [];
    if (!seedAlerts.length && FZStore.readDefaultStatusAlerts) {
      seedAlerts = FZStore.readDefaultStatusAlerts();
    }
    seedAlerts.forEach(function (a) {
      if (a.need && !can(a.need)) return;
      var obj = a.objectName || "—";
      list.push({
        object: obj,
        type: alertTypeLabel(a.kindLabel || "异常"),
        reason: a.reason || "",
        tip: [a.projectName, a.botName ? "采集号 " + a.botName : "", a.objectExtra]
          .filter(Boolean)
          .join(" · "),
        sev: a.severity === "warn" ? "warn" : "danger",
        href: a.href || "./tg-collect.html"
      });
    });

    if (can("collect.tg.view")) {
      var pool = (s.projects || []).find(function (p) {
        return FZStore.isPublicPool(p);
      });
      if (pool && pool.routingRules) {
        pool.routingRules.forEach(function (rr) {
          var hs = String(rr.healthStatus || "").toUpperCase();
          if (hs !== "BROKEN" && hs !== "UNKNOWN") return;
          var bot = (s.userbots || []).find(function (b) {
            return b.id === rr.botId;
          });
          var src = (pool.boundChannels || []).find(function (c) {
            return c.id === rr.sourceId;
          });
          var ch = (src && src.title) || rr.sourceId;
          list.push({
            object: ch,
            type: "频道异常",
            reason: rr.healthError || hs,
            tip:
              (pool.name || "公共池") +
              (bot && bot.name ? " · 采集号 " + bot.name : ""),
            sev: hs === "BROKEN" ? "danger" : "warn",
            href: "./tg-collect.html?project=" + encodeURIComponent(pool.id)
          });
        });
      }
      /* 业务项目 + 公共池上的异常频道 */
      (projects || []).concat(pool ? [pool] : []).forEach(function (p) {
        (p.boundChannels || []).forEach(function (ch) {
          var hs = String(ch.healthStatus || "").toUpperCase();
          if (hs !== "BROKEN" && hs !== "UNKNOWN") return;
          list.push({
            object: ch.title || ch.id || "—",
            type: "频道异常",
            reason: ch.healthError || hs,
            tip: (p.name || "项目") + (ch.role === "push" ? " · 分发" : " · 采集"),
            sev: hs === "BROKEN" ? "danger" : "warn",
            href:
              "./tg-collect.html?project=" + encodeURIComponent(p.id || "")
          });
        });
      });
      projects.forEach(function (p) {
        var bots = FZStore.botsForProject(s, p.id) || [];
        bots.forEach(function (b) {
          if (b.status === "connected" || b.status === "ok") return;
          var lab =
            (FZStore.userbotStatusLabel(b) && FZStore.userbotStatusLabel(b).text) ||
            b.status;
          list.push({
            object: b.name || b.id,
            type: "采集号异常",
            reason: "当前状态：" + lab,
            tip: p.name,
            sev: "danger",
            href: "./tg-collect.html?project=" + encodeURIComponent(p.id)
          });
        });
      });
    }

    /* 素材/稿件卡住量是汇总统计，不进本列表；待办看下方 Tab */

    list.sort(function (a, b) {
      var rank = { danger: 0, warn: 1 };
      var d = (rank[a.sev] || 9) - (rank[b.sev] || 9);
      if (d !== 0) return d;
      return String(a.type || "").localeCompare(String(b.type || ""), "zh");
    });
    return list;
  }

  function renderAlerts(s) {
    var box = document.getElementById("wb-alerts");
    if (!box) return;
    bindWorkbenchPagers();
    if (
      (!s.statusAlerts || !s.statusAlerts.length) &&
      FZStore.readDefaultStatusAlerts
    ) {
      s.statusAlerts = FZStore.readDefaultStatusAlerts();
      try {
        FZStore.write(s);
      } catch (e) {}
    }
    var list = buildAlerts(s);
    if (!list.length) {
      box.innerHTML =
        empty("暂无状态或异常提醒") +
        compactPager("alerts", slicePage([], 1, PAGE_MID), true);
      return;
    }
    var sl = slicePage(list, pageState.alerts, PAGE_MID);
    pageState.alerts = sl.page;
    box.innerHTML =
      headRow(["异常对象", "类型", "原因", "紧急度"]) +
      '<div class="wb-dense-body">' +
      sl.items
        .map(function (a) {
          var level =
            a.sev === "danger"
              ? '<span class="tag tag-danger">紧急</span>'
              : '<span class="tag tag-warn">关注</span>';
          return denseRow(
            [
              { text: a.object, tip: a.tip || a.object },
              { text: a.type },
              { text: a.reason, tip: a.reason, cls: "is-reason" },
              { html: level }
            ],
            '<a class="btn btn-sm" href="' + a.href + '">查看</a>'
          );
        })
        .join("") +
      "</div>" +
      compactPager("alerts", sl, true);
  }

  function setWorkTab(which) {
    var matsOn = which === "mats";
    document.querySelectorAll("[data-wb-tab]").forEach(function (btn) {
      var on = btn.getAttribute("data-wb-tab") === which;
      btn.classList.toggle("is-on", on);
      btn.setAttribute("aria-selected", on ? "true" : "false");
    });
    var matsPane = document.getElementById("wb-mats");
    var artsPane = document.getElementById("wb-arts");
    if (matsPane) matsPane.hidden = !matsOn;
    if (artsPane) artsPane.hidden = matsOn;
    var more = document.getElementById("wb-work-more");
    if (more) {
      more.href = matsOn ? "./materials.html" : "./articles.html";
      more.textContent = matsOn ? "素材管理" : "文章管理";
    }
  }

  function bindWorkTabs() {
    var root = document.getElementById("wb-root");
    if (!root || root.getAttribute("data-wb-tabs-bound")) return;
    root.setAttribute("data-wb-tabs-bound", "1");
    root.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-wb-tab]");
      if (!btn) return;
      setWorkTab(btn.getAttribute("data-wb-tab"));
    });
  }

  function refreshMatsAfterDetail() {
    renderMats();
    renderStats(FZStore.read());
    renderAlerts(FZStore.read());
  }

  function ensureMatDetailHook() {
    if (!global.FZMatDetail || FZMatDetail._wbHooked) return;
    FZMatDetail._wbHooked = true;
    var prev = FZMatDetail.close.bind(FZMatDetail);
    FZMatDetail.close = function () {
      prev();
      refreshMatsAfterDetail();
    };
    var targetsMask = document.getElementById("mat-targets-mask");
    if (targetsMask && !targetsMask._wbBound) {
      targetsMask._wbBound = true;
      targetsMask.addEventListener("click", function (e) {
        if (e.target === targetsMask || e.target.closest("[data-targets-close]")) {
          targetsMask.hidden = true;
        }
      });
    }
  }

  function openMatReview(id) {
    if (!global.FZMatDetail) {
      FZShell.toast("素材审核组件未加载", "err");
      return;
    }
    ensureMatDetailHook();
    var list = pendingMats();
    var hit = list.find(function (m) {
      return m.id === id;
    });
    if (!hit) {
      FZShell.toast("该素材已不在待审列表", "err");
      refreshMatsAfterDetail();
      return;
    }
    FZMatDetail.open(id, list);
  }

  function bindMatReview() {
    var box = document.getElementById("wb-mats");
    if (!box || box.getAttribute("data-mat-review-bound")) return;
    box.setAttribute("data-mat-review-bound", "1");
    box.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-mat-review]");
      if (!btn) return;
      e.preventDefault();
      openMatReview(btn.getAttribute("data-mat-review"));
    });
  }

  function renderMats() {
    var box = document.getElementById("wb-mats");
    var nEl = document.getElementById("wb-tab-mats-n");
    if (!box) return;
    bindMatReview();
    bindWorkbenchPagers();
    if (!can("collect.materials.view")) {
      if (nEl) nEl.textContent = "";
      box.innerHTML = empty("无素材权限");
      return;
    }
    var list = pendingMats();
    if (nEl) nEl.textContent = String(list.length);
    if (!list.length) {
      box.innerHTML = empty("暂无待审素材");
      return;
    }
    var sl = slicePage(list, pageState.mats, PAGE_WORK);
    pageState.mats = sl.page;
    box.innerHTML =
      headRow(["素材", "项目", "来源", "时间"]) +
      '<div class="wb-dense-body">' +
      sl.items
        .map(function (m) {
          return denseRow(
            [
              { text: m.title || m.id },
              { text: m.project || "—" },
              { text: m.channel || "—" },
              { text: m.time || "—" }
            ],
            '<button type="button" class="btn btn-sm btn-primary" data-mat-review="' +
              esc(m.id) +
              '">审核</button>'
          );
        })
        .join("") +
      "</div>" +
      compactPager("mats", sl);
  }

  function renderArts() {
    var box = document.getElementById("wb-arts");
    var nEl = document.getElementById("wb-tab-arts-n");
    if (!box) return;
    bindWorkbenchPagers();
    if (!can("content.article.view")) {
      if (nEl) nEl.textContent = "";
      box.innerHTML = empty("无文章权限");
      return;
    }
    var list = workArts();
    if (nEl) nEl.textContent = String(list.length);
    if (!list.length) {
      box.innerHTML = empty("暂无待处理稿件");
      return;
    }
    var sl = slicePage(list, pageState.arts, PAGE_WORK);
    pageState.arts = sl.page;
    box.innerHTML =
      headRow(["稿件", "项目", "状态", "时间"]) +
      '<div class="wb-dense-body">' +
      sl.items
        .map(function (a) {
          var st =
            FZArticles.statusMeta && FZArticles.statusMeta(a.status)
              ? FZArticles.statusMeta(a.status).text
              : a.status;
          return denseRow(
            [
              { text: a.title || "#" + a.id },
              { text: a.projectName || "—" },
              { text: st },
              { text: a.time || "—" }
            ],
            '<a class="btn btn-sm btn-primary" href="./article-edit.html?id=' +
              encodeURIComponent(a.id) +
              '">打开</a>'
          );
        })
        .join("") +
      "</div>" +
      compactPager("arts", sl);
  }

  function maybeBlankWorkbench(s) {
    /* 有工作台概览即可；公共三块始终可看，不因缺采编权限整页清空 */
    var root = document.getElementById("wb-root");
    if (!root) return false;
    if (can("home.overview.view")) {
      root.classList.remove("is-blank");
      return false;
    }
    root.classList.add("is-blank");
    root.innerHTML =
      '<div class="card card-pad wb-blank">' +
      "<strong>当前账号无工作台权限</strong>" +
      "<p class=\"muted\">请联系主账号开通「工作台 · 概览」后再访问。</p>" +
      "</div>";
    return true;
  }

  function renderNovice() {
    var mount = document.getElementById("wb-novice");
    if (!mount || !global.FZNovice) return;
    FZNovice.bindWorkbench(mount);
    FZNovice.renderWorkbench(mount);
  }

  function render() {
    var s = FZStore.read();
    if (maybeBlankWorkbench(s)) return;
    bindWorkTabs();
    adaptWorkbenchLayout();
    renderNovice();
    renderStats(s);
    renderAnnounce();
    renderAlerts(s);
  }

  global.FZHomeRefreshTickets = function () {
    renderTodos(FZStore.read());
  };
  global.FZHomeApp = {
    render: render,
    boot: function () {
      render();
      /* 新号不再弹「欢迎创建首个项目」；侧栏引导仅从帮助中心重看 */
    }
  };
})(window);
