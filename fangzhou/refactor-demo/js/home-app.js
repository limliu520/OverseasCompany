/* 工作台：上固定概览/快捷/公告；下可变长高密度列表 */
(function (global) {
  /* 演示报表（按可见项目名粗匹配；真环境按项目隔离） */
  var DEMO_STATS = {
    演示瓜站: {
      tgYesterday: 128,
      webYesterday: 36,
      matIn: 420,
      matPass: 310,
      toArticle: 86,
      pushed: 72
    },
    演示短剧站: {
      tgYesterday: 0,
      webYesterday: 0,
      matIn: 0,
      matPass: 0,
      toArticle: 0,
      pushed: 0
    },
    演示视频站: {
      tgYesterday: 12,
      webYesterday: 4,
      matIn: 48,
      matPass: 20,
      toArticle: 9,
      pushed: 5
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

  function pendingMats() {
    if (!can("collect.materials.view") && !can("collect.materials.approve")) {
      return [];
    }
    return ((global.FZMatData && FZMatData.ITEMS) || []).filter(function (m) {
      return m.status === "pending";
    });
  }

  function workArts() {
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

  function sparkBars(seriesA, seriesB, labels) {
    var max = 1;
    seriesA.concat(seriesB).forEach(function (v) {
      if (v > max) max = v;
    });
    var w = 280;
    var h = 48;
    var n = seriesA.length;
    var gap = 4;
    var groupW = (w - gap * (n - 1)) / n;
    var barW = Math.max(3, (groupW - 2) / 2);
    var bars = "";
    for (var i = 0; i < n; i++) {
      var x0 = i * (groupW + gap);
      var hA = Math.round((seriesA[i] / max) * (h - 4));
      var hB = Math.round((seriesB[i] / max) * (h - 4));
      bars +=
        '<rect class="wb-spark-a" x="' +
        x0 +
        '" y="' +
        (h - hA) +
        '" width="' +
        barW +
        '" height="' +
        hA +
        '" rx="1"/>' +
        '<rect class="wb-spark-b" x="' +
        (x0 + barW + 2) +
        '" y="' +
        (h - hB) +
        '" width="' +
        barW +
        '" height="' +
        hB +
        '" rx="1"/>';
    }
    var labs = labels
      .map(function (lb, i) {
        var x = i * (groupW + gap) + groupW / 2;
        return (
          '<text x="' +
          x +
          '" y="' +
          (h + 12) +
          '" text-anchor="middle">' +
          esc(lb.slice(3)) +
          "</text>"
        );
      })
      .join("");
    return (
      '<svg class="wb-spark" viewBox="0 0 ' +
      w +
      " " +
      (h + 16) +
      '" preserveAspectRatio="none" aria-hidden="true">' +
      bars +
      labs +
      "</svg>"
    );
  }

  function projectBars(projects) {
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
    var max = 1;
    rows.forEach(function (r) {
      if (r.v > max) max = r.v;
    });
    if (!rows.length) {
      return '<p class="muted wb-empty" style="margin:0">暂无项目贡献</p>';
    }
    return rows
      .map(function (r) {
        var w = r.v <= 0 ? 0 : Math.max(2, Math.round((r.v / max) * 100));
        return (
          '<div class="wb-hbar">' +
          '<div class="wb-hbar-lab" title="' +
          esc(r.name) +
          '">' +
          esc(r.name) +
          "</div>" +
          '<div class="wb-hbar-track"><i style="width:' +
          w +
          '%"></i></div>' +
          '<div class="wb-hbar-n">' +
          r.v +
          "</div></div>"
        );
      })
      .join("");
  }

  function renderStats(s) {
    var box = document.getElementById("wb-stats");
    var extra = document.getElementById("wb-stats-extra");
    if (!box) return;
    var projects = FZStore.businessProjects(s);
    var show =
      can("collect.tg.view") ||
      can("collect.web.view") ||
      can("collect.materials.view") ||
      can("content.article.view") ||
      can("projects.list.view");
    if (!show) {
      box.innerHTML = empty("当前角色无可查看的数据统计");
      if (extra) extra.innerHTML = "";
      return;
    }
    var acc = sumStats(projects);
    var mats = pendingMats().length;
    var arts = workArts().length;
    var cards = [
      { n: acc.tgYesterday, l: "昨日 TG 采集", need: "collect.tg.view" },
      { n: acc.webYesterday, l: "昨日网站采集", need: "collect.web.view" },
      { n: acc.matIn, l: "昨日收到素材", need: "collect.materials.view" },
      { n: acc.matPass, l: "昨日素材通过", need: "collect.materials.view" },
      { n: acc.toArticle, l: "昨日进入文章", need: "content.article.view" },
      { n: acc.pushed, l: "昨日已推业务端", need: "content.article.view" },
      {
        n: mats,
        l: "当前待审素材",
        need: "collect.materials.view",
        warn: mats > 0,
        live: true
      },
      {
        n: arts,
        l: "当前待处理稿件",
        need: "content.article.view",
        warn: arts > 0,
        live: true
      }
    ].filter(function (c) {
      return !c.need || can(c.need);
    });
    box.innerHTML = cards
      .map(function (c) {
        return (
          '<div class="wb-stat' +
          (c.warn ? " is-warn" : "") +
          (c.live ? " is-live" : "") +
          '"><div class="wb-stat-n">' +
          c.n +
          '</div><div class="wb-stat-l">' +
          esc(c.l) +
          "</div></div>"
        );
      })
      .join("");
    if (!extra) return;
    var funnel =
      '<div class="wb-funnel">' +
      '<div class="wb-funnel-i"><span>素材通过率</span><em>' +
      pct(acc.matPass, acc.matIn) +
      "</em></div>" +
      '<div class="wb-funnel-i"><span>进文转化</span><em>' +
      pct(acc.toArticle, acc.matPass) +
      "</em></div>" +
      '<div class="wb-funnel-i"><span>推送完成率</span><em>' +
      pct(acc.pushed, acc.toArticle) +
      "</em></div>" +
      "</div>";
    extra.innerHTML =
      '<div class="wb-stat-panel">' +
      '<div class="wb-stat-panel-h">近 7 日采集' +
      '<span class="wb-spark-leg"><i class="is-a"></i>TG <i class="is-b"></i>网站</span></div>' +
      sparkBars(DEMO_WEEK.tg, DEMO_WEEK.web, DEMO_WEEK.labels) +
      "</div>" +
      '<div class="wb-stat-panel">' +
      '<div class="wb-stat-panel-h">昨日项目贡献 · Top3</div>' +
      '<div class="wb-hbars">' +
      projectBars(projects) +
      "</div></div>" +
      '<div class="wb-stat-panel">' +
      '<div class="wb-stat-panel-h">链路转化</div>' +
      funnel +
      "</div>";
  }

  function renderQuick() {
    var box = document.getElementById("wb-quick");
    if (!box) return;
    var items = [
      {
        need: "projects.list.create",
        label: "新建项目",
        href: "./project-setup.html?new=1",
        primary: true
      },
      {
        need: "collect.tg.create",
        label: "添加采集号",
        href: "./tg-collect.html?action=add_bot"
      },
      {
        need: "collect.tg.edit",
        label: "添加频道",
        href: "./tg-collect.html?action=add_channel"
      },
      {
        need: "collect.web.create",
        label: "添加网站",
        href: "./website-collect.html?new=1"
      },
      {
        need: "collect.tg.edit",
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
    var canProj = can("projects.list.view") || can("projects.list.create");

    if (canProj && !projects.length && can("projects.list.create")) {
      items.push({
        matter: "创建首个业务项目",
        tip: "新号入驻",
        type: "入驻",
        statusHtml: statusTag("需创建", "tag-warn"),
        act:
          '<a class="btn btn-sm btn-primary" href="./project-setup.html?new=1">创建</a>',
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
        if (p.status === "pending_activate" && can("projects.list.connect")) {
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
        } else if (!p.watermarkDone && can("projects.list.config")) {
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

    (s.tickets || []).forEach(function (t) {
      var done = t.status === "done";
      var text = String(t.text || "");
      var short = text.slice(0, 48) + (text.length > 48 ? "…" : "");
      items.push({
        matter: short || "（空反馈）",
        tip: (t.by ? "提交人 " + t.by + " · " : "") + text,
        type: "反馈工单",
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
    var canProj = can("projects.list.view") || can("projects.list.create");
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
    var projects = FZStore.businessProjects(s);

    (s.statusAlerts || []).forEach(function (a) {
      if (a.need && !can(a.need)) return;
      if (!projects.length) return;
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
    if (!can("collect.materials.view") && !can("collect.materials.approve")) {
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
    /* 几乎只有工作台查看、无业务块时 */
    var hasBiz =
      can("projects.list.view") ||
      can("collect.tg.view") ||
      can("collect.web.view") ||
      can("collect.materials.view") ||
      can("content.article.view");
    var root = document.getElementById("wb-root");
    if (!root) return false;
    if (hasBiz) {
      root.classList.remove("is-blank");
      return false;
    }
    root.classList.add("is-blank");
    root.innerHTML =
      '<div class="card card-pad wb-blank">' +
      "<strong>当前账号无可运营模块</strong>" +
      "<p class=\"muted\">仅授权类权限时，工作台不展示采编待办。请联系主账号调整岗位权限。</p>" +
      "</div>";
    return true;
  }

  function render() {
    var s = FZStore.read();
    if (maybeBlankWorkbench(s)) return;
    bindWorkTabs();
    renderStats(s);
    renderAnnounce();
    renderTodos(s);
    renderAlerts(s);
    renderMats();
    renderArts();
    /* 无素材权限但有文章权限时，默认落到稿件 Tab */
    var tabMats = document.getElementById("wb-tab-mats");
    var tabArts = document.getElementById("wb-tab-arts");
    if (tabMats && tabArts) {
      var canMat =
        can("collect.materials.view") || can("collect.materials.approve");
      var canArt = can("content.article.view");
      tabMats.hidden = !canMat;
      tabArts.hidden = !canArt;
      if (!canMat && canArt) setWorkTab("arts");
      else if (canMat) setWorkTab("mats");
    }
  }

  function bootWelcomeAndTour() {
    var s = FZStore.read();
    var zero = !FZStore.businessProjects(s).length;
    var modal = document.getElementById("zero-modal");
    if (modal && zero && !s.zeroPromptDismissed && can("projects.list.create")) {
      modal.hidden = false;
    }
    var go = document.getElementById("btn-go-setup");
    var later = document.getElementById("btn-later");
    if (go) {
      go.onclick = function () {
        location.href = "./project-setup.html?new=1";
      };
    }
    function dismissZero() {
      var st = FZStore.read();
      st.zeroPromptDismissed = true;
      FZStore.write(st);
      if (modal) modal.hidden = true;
      render();
    }
    if (later) later.onclick = dismissZero;
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) dismissZero();
      });
    }
    if (!zero && !FZStore.isMenuTourDone(s) && global.FZMenuTour) {
      var steps = FZMenuTour.visibleSteps();
      if (steps.length) {
        var autoKey = "fz_tour_auto_" + FZStore.accountKey(s);
        try {
          if (!sessionStorage.getItem(autoKey)) {
            sessionStorage.setItem(autoKey, "1");
            setTimeout(function () {
              FZMenuTour.start({});
            }, 400);
          }
        } catch (e) {}
      }
    }
  }

  global.FZHomeRefreshTickets = function () {
    renderTodos(FZStore.read());
  };
  global.FZHomeApp = {
    render: render,
    boot: function () {
      render();
      bootWelcomeAndTour();
    }
  };
})(window);
