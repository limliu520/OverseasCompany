/* TG 采集 · TG→TG 路由（按采集/分发 + 搜索 + 健康筛选） */
window.FZTgCollectRoutes = (function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function healthOf(r) {
    return r && r.healthStatus ? r.healthStatus : "";
  }

  function healthMeta(st) {
    if (st === "OK") return { icon: "✓", label: "OK", cls: "is-ok" };
    if (st === "BROKEN") return { icon: "✗", label: "BROKEN", cls: "is-broken" };
    if (st === "UNKNOWN") return { icon: "?", label: "UNKNOWN", cls: "is-unknown" };
    return { icon: "○", label: "未检查", cls: "is-unchecked" };
  }

  function edges(rules, botId) {
    var list = [];
    (rules || []).forEach(function (r) {
      if (botId && r.botId !== botId) return;
      (r.targetIds || []).forEach(function (tid) {
        list.push({
          ruleId: r.id,
          sourceId: r.sourceId,
          targetId: tid,
          healthStatus: healthOf(r),
          healthError: r.healthError || ""
        });
      });
    });
    return list;
  }

  function filterEdges(list, map, opts) {
    var q = String((opts && opts.q) || "")
      .trim()
      .toLowerCase();
    var health = (opts && opts.health) || "";
    return list.filter(function (e) {
      if (health === "UNCHECKED") {
        if (e.healthStatus) return false;
      } else if (health && e.healthStatus !== health) {
        return false;
      }
      if (!q) return true;
      var hay =
        (map[e.sourceId] || e.sourceId) + " " + (map[e.targetId] || e.targetId);
      return hay.toLowerCase().indexOf(q) !== -1;
    });
  }

  function groupBy(list, key) {
    var groups = {};
    var order = [];
    list.forEach(function (e) {
      var k = e[key];
      if (!groups[k]) {
        groups[k] = [];
        order.push(k);
      }
      groups[k].push(e);
    });
    return { groups: groups, order: order };
  }

  function healthBadge(e) {
    var m = healthMeta(e.healthStatus);
    var tip;
    if (m.label === "OK") {
      tip = "正常：分发号能读到源频道，可正常转发";
    } else if (m.label === "BROKEN") {
      tip = e.healthError || "异常：分发号无法读取源频道";
    } else if (m.label === "UNKNOWN") {
      tip = e.healthError || "未知：已体检但结果无法判定";
    } else {
      tip = "未检查：尚未做过健康体检";
    }
    return (
      '<span class="tg-route-health ' +
      m.cls +
      '" tabindex="0" aria-label="' +
      esc(tip) +
      '">' +
      m.icon +
      '<span class="tg-route-health-reason" role="tooltip">' +
      esc(tip) +
      "</span></span>"
    );
  }

  function delBtn(e) {
    return (
      '<button type="button" class="btn btn-ghost btn-sm" data-del-edge="' +
      esc(e.ruleId) +
      '" data-del-target="' +
      esc(e.targetId) +
      '" title="移除该边">×</button>'
    );
  }

  function rows(filtered, map, viewMode) {
    if (!filtered.length) {
      return '<p class="muted" style="margin:0">没有匹配的路由。</p>';
    }
    var bySource = viewMode !== "by_target";
    var packed = groupBy(filtered, bySource ? "sourceId" : "targetId");
    return (
      '<ul class="tg-route-list">' +
      packed.order
        .map(function (key) {
          var list = packed.groups[key];
          if (bySource) {
            return (
              '<li class="tg-route-card"><div class="tg-route-target"><span class="badge badge-ok">采集</span><strong>' +
              esc(map[key] || key) +
              '</strong><span class="muted">' +
              list.length +
              ' 个分发</span></div><div class="tg-route-arrow">→</div><div class="tg-route-sources">' +
              list
                .map(function (e) {
                  return (
                    '<div class="tg-route-src">' +
                    healthBadge(e) +
                    '<span class="badge badge-info">分发</span>' +
                    '<span class="tg-route-src-name">' +
                    esc(map[e.targetId] || e.targetId) +
                    "</span> " +
                    delBtn(e) +
                    "</div>"
                  );
                })
                .join("") +
              "</div></li>"
            );
          }
          return (
            '<li class="tg-route-card"><div class="tg-route-sources">' +
            list
              .map(function (e) {
                return (
                  '<div class="tg-route-src">' +
                  healthBadge(e) +
                  '<span class="badge badge-ok">采集</span>' +
                  '<span class="tg-route-src-name">' +
                  esc(map[e.sourceId] || e.sourceId) +
                  "</span> " +
                  delBtn(e) +
                  "</div>"
                );
              })
              .join("") +
            '</div><div class="tg-route-arrow">→</div><div class="tg-route-target"><span class="badge badge-info">分发</span><strong>' +
            esc(map[key] || key) +
            '</strong><span class="muted">' +
            list.length +
            " 个采集源</span></div></li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function healthChips(allEdges, active) {
    /* 对齐现网路由体检：OK / BROKEN / UNKNOWN / 未检查；控件样式与已挂频道筛选一致 */
    var chips = [
      { id: "", label: "全部" },
      { id: "OK", label: "正常" },
      { id: "BROKEN", label: "异常" },
      { id: "UNKNOWN", label: "未知" },
      { id: "UNCHECKED", label: "未检查" }
    ];
    var seg =
      '<div class="tg-filter-seg" role="group" aria-label="路由健康筛选">' +
      chips
        .map(function (c) {
          var on = (active || "") === c.id;
          return (
            '<button type="button" class="btn btn-sm' +
            (on ? " is-active" : "") +
            '" data-route-health="' +
            esc(c.id) +
            '">' +
            esc(c.label) +
            "</button>"
          );
        })
        .join("") +
      "</div>";
    var tip =
      '<span class="field-tip tg-filter-tip" tabindex="0" aria-label="健康状态说明">' +
      '<span class="field-tip-ico" aria-hidden="true">?</span>' +
      '<span class="field-tip-bubble" role="tooltip">' +
      "全部：不按健康状态过滤。<br>" +
      "正常：分发号能读到源频道，可正常转发。<br>" +
      "异常：分发号无法读取源频道（如被踢、无权限），转发受影响。<br>" +
      "未知：已体检但无法判定（如临时超时、目标未绑定号），不等于正常。<br>" +
      "未检查：尚未做过健康体检，或新建后未轮到检查。" +
      "</span></span>";
    return '<div class="tg-filter-with-tip">' + seg + tip + "</div>";
  }

  function panel(ctx, bot, connected, opts) {
    opts = opts || {};
    var view = opts.routeView === "by_target" ? "by_target" : "by_source";
    var map = {};
    (ctx.boundChannels || []).forEach(function (c) {
      map[c.id] = c.title;
    });
    var all = edges(ctx.routingRules, bot.id);
    var filtered = filterEdges(all, map, { q: opts.routeQuery, health: opts.routeHealth });

    return (
      '<section class="tg-panel"><div class="tg-panel-head"><h3>TG→TG 路由</h3>' +
      '<div class="tg-panel-actions">' +
      '<button type="button" class="btn btn-sm btn-primary" data-add-route="' +
      esc(bot.id) +
      '"' +
      (connected ? "" : " disabled") +
      ">+ 新建路由</button></div></div>" +
      '<div class="tg-route-toolbar">' +
      '<span class="muted">列表展示</span>' +
      '<div class="tg-filter-seg" role="group" aria-label="路由列表视角">' +
      '<button type="button" class="btn btn-sm' +
      (view === "by_source" ? " is-active" : "") +
      '" data-route-view="by_source">按采集</button>' +
      '<button type="button" class="btn btn-sm' +
      (view === "by_target" ? " is-active" : "") +
      '" data-route-view="by_target">按分发</button></div></div>' +
      '<div class="tg-route-controls">' +
      '<input type="search" class="input tg-route-search" id="tg-route-search" placeholder="搜索源/分发频道…" value="' +
      esc(opts.routeQuery || "") +
      '" />' +
      healthChips(all, opts.routeHealth) +
      "</div>" +
      '<p class="hint" style="margin:0 0 10px">' +
      (view === "by_source"
        ? "默认与新建一致：一个采集 → 多个分发。健康状态对齐现网体检（OK / 异常 / 未知 / 未检查）。"
        : "按分发统计巡检。可用搜索与健康筛选缩小范围。") +
      (filtered.length !== all.length
        ? " · 当前显示 " + filtered.length + " / " + all.length
        : "") +
      "</p>" +
      (all.length
        ? rows(filtered, map, view)
        : '<p class="muted" style="margin:0">暂无路由。先挂采集源与分发目标，再新建路由。</p>') +
      "</section>"
    );
  }

  return { panel: panel };
})();
