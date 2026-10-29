/* TG 采集 · 已挂频道（页内搜索 / 筛选 / 分页，一排 4 · 每页 20） */
window.FZTgCollectChannels = (function () {
  var COLS = 4;
  var PAGE_SIZE = 20; /* 4 列 × 5 行 */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function roleOf(c) {
    return c && c.role === "push" ? "push" : c && c.role === "collect" ? "collect" : "";
  }

  function healthOf(c) {
    return c && c.healthStatus ? c.healthStatus : "";
  }

  function isEnabled(c) {
    var r = roleOf(c);
    return !!r && c.active !== false;
  }

  function matchStatus(c, status) {
    if (!status) return true;
    if (status === "on") return isEnabled(c);
    if (status === "off") return !!roleOf(c) && c.active === false;
    if (status === "BROKEN") return healthOf(c) === "BROKEN";
    if (status === "UNKNOWN") return healthOf(c) === "UNKNOWN";
    if (status === "UNCHECKED") return !healthOf(c);
    return true;
  }

  function filterList(chs, opts) {
    var q = String((opts && opts.q) || "")
      .trim()
      .toLowerCase();
    var role = (opts && opts.role) || "all";
    var status = (opts && opts.status) || "";
    var list = (chs || []).filter(function (c) {
      var r = roleOf(c);
      if (role === "collect" && r !== "collect") return false;
      if (role === "push" && r !== "push") return false;
      if (role === "unassigned" && r) return false;
      if (!matchStatus(c, status)) return false;
      if (!q) return true;
      return String(c.title || c.id)
        .toLowerCase()
        .indexOf(q) !== -1;
    });
    /* 按挂载时间倒序；分配用途不改 boundAt，位置不变 */
    list.sort(function (a, b) {
      return (b.boundAt || 0) - (a.boundAt || 0);
    });
    return list;
  }

  function filterGroup(label, aria, chips, active, attr) {
    var seg =
      '<div class="tg-ch-filter-group">' +
      '<span class="tg-ch-filter-lab">' +
      esc(label) +
      "</span>" +
      '<div class="tg-filter-seg" role="group" aria-label="' +
      esc(aria) +
      '">' +
      chips
        .map(function (c) {
          var on = (active || "") === c.id;
          return (
            '<button type="button" class="btn btn-sm' +
            (on ? " is-active" : "") +
            '" ' +
            attr +
            '="' +
            esc(c.id) +
            '">' +
            esc(c.label) +
            "</button>"
          );
        })
        .join("") +
      "</div></div>";
    return seg;
  }

  function typeFilter(active, isPool) {
    if (!isPool) return "";
    return filterGroup(
      "类型",
      "频道类型筛选",
      [
        { id: "all", label: "全部" },
        { id: "unassigned", label: "未分配" },
        { id: "collect", label: "采集" },
        { id: "push", label: "分发" }
      ],
      active || "all",
      "data-ch-filter"
    );
  }

  function statusFilter(active) {
    var tip =
      '<span class="field-tip tg-filter-tip" tabindex="0" aria-label="状态筛选说明">' +
      '<span class="field-tip-ico" aria-hidden="true">?</span>' +
      '<span class="field-tip-bubble" role="tooltip">' +
      "启用 / 停用：已分配用途频道的开关。<br>" +
      "异常 / 未知 / 未检查：本采集号是否仍在频道内的校验结果。<br>" +
      "与下方路由筛选不同：路由是「分发号能否读源」。" +
      "</span></span>";
    return (
      '<div class="tg-filter-with-tip tg-ch-status-wrap">' +
      filterGroup(
        "状态",
        "频道状态筛选",
        [
          { id: "", label: "全部" },
          { id: "on", label: "启用" },
          { id: "off", label: "停用" },
          { id: "BROKEN", label: "异常" },
          { id: "UNKNOWN", label: "未知" },
          { id: "UNCHECKED", label: "未检查" }
        ],
        active || "",
        "data-ch-status"
      ) +
      tip +
      "</div>"
    );
  }

  function roleCell(c, isPool) {
    var r = roleOf(c);
    if (isPool && !r) {
      return '<span class="badge badge-muted">未分配</span>';
    }
    return (
      '<span class="badge ' +
      (r === "push" ? "badge-info" : "badge-ok") +
      '">' +
      (r === "push" ? "分发" : "采集") +
      "</span>"
    );
  }

  /** 频道成员校验（号是否仍在频道内）；与路由「分发号能否读源」不同 */
  function healthBadge(c) {
    var st = c && c.healthStatus ? c.healthStatus : "";
    var meta =
      st === "OK"
        ? { icon: "✓", cls: "is-ok", tip: "正常：本采集号仍在频道内，可监听 / 拉取" }
        : st === "BROKEN"
          ? {
              icon: "✗",
              cls: "is-broken",
              tip: (c && c.healthError) || "异常：本采集号已不在频道内（not a member）"
            }
          : st === "UNKNOWN"
            ? {
                icon: "?",
                cls: "is-unknown",
                tip: (c && c.healthError) || "未知：已体检但结果无法判定"
              }
            : { icon: "○", cls: "is-unchecked", tip: "未检查：尚未做过成员校验" };
    return (
      '<span class="tg-route-health tg-ch-health ' +
      meta.cls +
      '" tabindex="0" aria-label="' +
      esc(meta.tip) +
      '">' +
      meta.icon +
      '<span class="tg-route-health-reason" role="tooltip">' +
      esc(meta.tip) +
      "</span></span>"
    );
  }

  function rows(list, isPool) {
    if (!list.length) {
      return '<p class="muted" style="margin:0">没有匹配的频道。</p>';
    }
    return (
      '<ul class="tg-ch-list tg-ch-grid">' +
      list
        .map(function (c) {
          var r = roleOf(c);
          var on = !!r && c.active !== false;
          var needAssign = isPool && !r;
          var actions =
            '<span class="tg-ch-actions">' +
            (r
              ? '<button type="button" class="btn btn-ghost btn-sm tg-ch-active-btn" data-ch-active="' +
                esc(c.id) +
                '" data-ch-bot="' +
                esc(c.botId || "") +
                '">' +
                (on ? "停用" : "启用") +
                "</button>"
              : "") +
            '<button type="button" class="btn btn-ghost btn-sm tg-ch-unbind" data-unbind="' +
            esc(c.id) +
            '" title="解绑" aria-label="解绑">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">' +
            '<path fill="currentColor" d="M18.3 5.7a1 1 0 0 0-1.4-1.4L12 9.17 7.1 4.3A1 1 0 0 0 5.7 5.7L10.17 12 5.7 16.9a1 1 0 1 0 1.4 1.4L12 14.83l4.9 4.87a1 1 0 0 0 1.4-1.4L13.83 12l4.47-4.9z"/>' +
            "</svg></button></span>";
          return (
            '<li class="' +
            (on || !r ? "" : "is-off") +
            (needAssign ? " is-assignable" : "") +
            '"' +
            (needAssign
              ? ' data-ch-assign="' +
                esc(c.id) +
                '" title="点击整行标记用途" role="button" tabindex="0"'
              : "") +
            '><span class="tg-ch-grid-main">' +
            roleCell(c, isPool) +
            healthBadge(c) +
            '<span class="tg-ch-grid-title">' +
            '<span class="tg-ch-grid-title-text">' +
            esc(c.title) +
            '</span><span class="tg-ch-name-tip" role="tooltip">' +
            esc(c.title) +
            "</span></span></span>" +
            actions +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function pager(page, totalPages, total) {
    if (totalPages <= 1) {
      return (
        '<div class="tg-ch-pager"><span class="muted">共 ' +
        total +
        " 个</span></div>"
      );
    }
    return (
      '<div class="tg-ch-pager">' +
      '<button type="button" class="btn btn-sm" data-ch-page="' +
      (page - 1) +
      '"' +
      (page <= 1 ? " disabled" : "") +
      ">上一页</button>" +
      '<span class="tg-ch-pager-info">第 ' +
      page +
      " / " +
      totalPages +
      " 页 · 共 " +
      total +
      " 个</span>" +
      '<button type="button" class="btn btn-sm" data-ch-page="' +
      (page + 1) +
      '"' +
      (page >= totalPages ? " disabled" : "") +
      ">下一页</button></div>"
    );
  }

  function panel(bot, chs, connected, isPool, opts) {
    opts = opts || {};
    var role = opts.role || "all";
    var page = Math.max(1, parseInt(opts.page, 10) || 1);
    var filtered = filterList(chs, opts);
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1);
    if (page > totalPages) page = totalPages;
    var start = (page - 1) * PAGE_SIZE;
    var shown = filtered.slice(start, start + PAGE_SIZE);
    var title = isPool ? "已挂频道" : "采集频道";

    var html =
      '<section class="tg-panel"><div class="tg-panel-head"><h3>' +
      title +
      ' <span class="muted">共 ' +
      chs.length +
      " 个" +
      (filtered.length !== chs.length ? " · 筛选后 " + filtered.length : "") +
      '</span></h3><div class="tg-panel-actions">' +
      '<button type="button" class="btn btn-sm" data-sync-ch="' +
      esc(bot.id) +
      '"' +
      (connected ? "" : " disabled title=\"请先连接会话\"") +
      ' title="模拟从 Telegram 拉取；公共池会生成若干「未分配」频道">拉取频道</button>' +
      '<button type="button" class="btn btn-sm btn-primary" data-add-ch="' +
      esc(bot.id) +
      '" data-role="collect"' +
      (connected ? "" : " disabled title=\"请先连接会话\"") +
      ">+ 加入频道</button></div></div>";

    html +=
      '<div class="tg-ch-toolbar">' +
      '<input type="search" class="input tg-ch-search" id="tg-ch-search" placeholder="搜索频道…" value="' +
      esc(opts.q || "") +
      '" />' +
      statusFilter(opts.status || "") +
      typeFilter(role, !!isPool) +
      "</div>";

    if (!chs.length) {
      html +=
        '<p class="muted" style="margin:0">尚未挂频道。点「加入频道」或「拉取频道」。' +
        (isPool
          ? "「拉取频道」会生成未分配项，点标签后选择采集或分发。"
          : "业务项目仅采集，料进本项目。") +
        "</p></section>";
      return html;
    }

    html += rows(shown, !!isPool);
    html += pager(page, totalPages, filtered.length);
    html += "</section>";
    return html;
  }

  return { panel: panel, PAGE_SIZE: PAGE_SIZE, COLS: COLS };
})();
