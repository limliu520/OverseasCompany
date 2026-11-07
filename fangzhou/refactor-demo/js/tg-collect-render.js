/* TG 采集 · 工作台渲染 */
window.FZTgCollectRender = (function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function ctxStats(st, project) {
    var bots = FZStore.botsForProject(st, project.id);
    var chN = (project.boundChannels || []).length;
    var mon = bots.filter(function (b) {
      return b.monitoring;
    }).length;
    return { bots: bots.length, channels: chN, collecting: mon };
  }

  var SITE_TYPE_SHORT = {
    chigua: "瓜站",
    video: "视频站",
    short_drama: "短剧站"
  };

  function siteTypeShort(p) {
    if (!p || FZStore.isPublicPool(p)) return "";
    return SITE_TYPE_SHORT[p.siteType] || "";
  }

  function contextCards(st, selectedId) {
    var items = [];
    var pool = FZStore.findProject(st, FZStore.PUBLIC_POOL_ID);
    if (pool) items.push(pool);
    FZStore.businessProjects(st).forEach(function (p) {
      items.push(p);
    });
    return items
      .map(function (p) {
        var isPool = FZStore.isPublicPool(p);
        var s = ctxStats(st, p);
        var title = isPool ? "公共采集池" : p.name;
        var typeLabel = isPool ? "TG→TG 转发" : siteTypeShort(p);
        var meta =
          s.bots +
          " 个采集号 · " +
          s.channels +
          " 个频道" +
          (s.collecting ? " · " + s.collecting + " 采集中" : "");
        return (
          '<button type="button" class="tg-ctx-card' +
          (p.id === selectedId ? " is-active" : "") +
          (isPool ? " is-pool" : "") +
          '" role="option" aria-selected="' +
          (p.id === selectedId ? "true" : "false") +
          '" data-pick-ctx="' +
          esc(p.id) +
          '" title="' +
          esc(title + (typeLabel ? " · " + typeLabel : "")) +
          '">' +
          (isPool ? '<span class="tg-ctx-card-badge">公共</span>' : "") +
          '<span class="tg-ctx-card-name">' +
          esc(title) +
          "</span>" +
          (typeLabel
            ? '<span class="tg-ctx-card-type">' + esc(typeLabel) + "</span>"
            : "") +
          '<span class="tg-ctx-card-meta">' +
          esc(meta) +
          "</span></button>"
        );
      })
      .join("");
  }

  function botList(bots, selectedId) {
    if (!bots.length) {
      return '<p class="muted tg-bot-empty">还没有采集号，点上方添加</p>';
    }
    return bots
      .map(function (b) {
        var collecting = !!b.monitoring;
        var disabled = b.status === "disabled";
        var st = disabled ? "已停用" : collecting ? "采集中" : "已停止";
        return (
          '<div class="tg-bot-row' +
          (b.id === selectedId ? " is-active" : "") +
          '"><button type="button" class="tg-bot-item" data-pick-bot="' +
          esc(b.id) +
          '"><span class="tg-bot-dot ' +
          (collecting ? "is-on is-mon" : disabled ? "is-off" : "is-off") +
          '" title="' +
          esc(st) +
          '"></span><span class="tg-bot-item-main"><span class="tg-bot-item-name">' +
          esc(b.name) +
          '</span><span class="tg-bot-item-meta">' +
          esc(st) +
          "</span></span></button></div>"
        );
      })
      .join("");
  }

  function detail(ctx, bot, lim, opts) {
    opts = opts || {};
    if (!bot) {
      return '<div class="tg-detail-empty muted">请选择左侧采集号，或先添加。</div>';
    }
    var isPool = FZStore.isPublicPool(ctx);
    var chs = (ctx.boundChannels || []).filter(function (c) {
      return c.botId === bot.id;
    });
    var collecting = !!bot.monitoring;
    var disabled = bot.status === "disabled";
    var sessAlive = bot.status === "connected" || bot.status === "ok";
    var statusBadge = disabled
      ? '<span class="badge badge-muted">已停用</span>'
      : collecting
        ? '<span class="badge badge-ok">采集中</span>'
        : '<span class="badge badge-muted">已停止</span>';
    var html =
      '<div class="tg-detail-head"><div class="tg-detail-identity"><h2 class="tg-detail-title">' +
      esc(bot.name) +
      '</h2><div class="tg-detail-meta">' +
      statusBadge +
      (bot.phoneHint
        ? '<span class="tg-detail-info">' + esc(bot.phoneHint) + "</span>"
        : "") +
      '<span class="tg-detail-info">已挂 ' +
      chs.length +
      " / " +
      lim.maxChannelsPerBot +
      "</span></div></div>" +
      '<div class="tg-detail-actions">';

    if (!disabled) {
      html +=
        '<button type="button" class="btn' +
        (collecting ? "" : " btn-primary") +
        '" data-collect="' +
        esc(bot.id) +
        '" title="' +
        (collecting
          ? "停止采集：不再收新消息，会话默认保留"
          : "开始采集：系统按需建连并收启用中的采集频道") +
        '">' +
        (collecting ? "停止采集" : "开始采集") +
        "</button>";
      if (sessAlive) {
        html +=
          '<button type="button" class="btn btn-ghost" data-force-disconnect="' +
          esc(bot.id) +
          '" title="排障用：释放会话；日常请用停止采集">强制断开</button>';
      }
    }

    html += "</div></div>";

    /* 先频道后路由：配完频道再配转发。会话由操作时按需建连，按钮不因未连接灰掉。 */
    var chPanel =
      window.FZTgCollectChannels &&
      FZTgCollectChannels.panel(bot, chs, true, isPool, {
        q: opts.chQuery,
        role: opts.chRole,
        status: opts.chStatus,
        page: opts.chPage
      });
    if (chPanel) html += chPanel;
    if (isPool && window.FZTgCollectRoutes) {
      html += FZTgCollectRoutes.panel(ctx, bot, true, {
        routeView: opts.routeView,
        routeQuery: opts.routeQuery,
        routeHealth: opts.routeHealth
      });
    } else if (!isPool) {
      html +=
        '<p class="hint tg-project-hint">业务项目：只挂采集频道 → 开始采集后收料进本项目。无分发频道、无路由（路由只在公共池）。</p>';
    }
    return html;
  }

  return {
    esc: esc,
    contextCards: contextCards,
    botList: botList,
    detail: detail
  };
})();
