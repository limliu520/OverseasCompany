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

  function filterList(chs, opts) {
    var q = String((opts && opts.q) || "")
      .trim()
      .toLowerCase();
    var role = (opts && opts.role) || "all";
    var list = (chs || []).filter(function (c) {
      var r = roleOf(c);
      if (role === "collect" && r !== "collect") return false;
      if (role === "push" && r !== "push") return false;
      if (role === "unassigned" && r) return false;
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
      '" />';
    if (isPool) {
      html +=
        '<div class="tg-ch-role-seg" role="group">' +
        '<button type="button" class="btn btn-sm' +
        (role === "all" ? " is-active" : "") +
        '" data-ch-filter="all">全部</button>' +
        '<button type="button" class="btn btn-sm' +
        (role === "unassigned" ? " is-active" : "") +
        '" data-ch-filter="unassigned">未分配</button>' +
        '<button type="button" class="btn btn-sm' +
        (role === "collect" ? " is-active" : "") +
        '" data-ch-filter="collect">采集</button>' +
        '<button type="button" class="btn btn-sm' +
        (role === "push" ? " is-active" : "") +
        '" data-ch-filter="push">分发</button></div>';
    }
    html += "</div>";

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
