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
    return { bots: bots.length, channels: chN, monitoring: mon };
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
        var title = isPool ? "公共池" : p.name;
        var typeLabel = isPool ? "TG→TG 转发" : siteTypeShort(p);
        var meta =
          s.bots +
          " 个采集号 · " +
          s.channels +
          " 个频道" +
          (s.monitoring ? " · " + s.monitoring + " 监听中" : "");
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
          '"><span class="tg-ctx-card-name">' +
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
        var on = b.status === "connected" || b.status === "ok";
        var mon = !!b.monitoring;
        var st = (on ? "已连接" : "已断开") + (mon ? " · 监听中" : " · 未监听");
        var sess =
          b.status === "disabled"
            ? ""
            : '<button type="button" class="btn btn-sm tg-bot-sess' +
              (on ? "" : " btn-primary") +
              '" data-toggle="' +
              esc(b.id) +
              '" title="' +
              (on
                ? "断开会话（运维）：退出登录，监听也会停"
                : "连接会话（运维）：登录后方可监听与进群") +
              '">' +
              (on ? "断开" : "连接") +
              "</button>";
        return (
          '<div class="tg-bot-row' +
          (b.id === selectedId ? " is-active" : "") +
          '"><button type="button" class="tg-bot-item" data-pick-bot="' +
          esc(b.id) +
          '"><span class="tg-bot-dot ' +
          (on ? "is-on" : "is-off") +
          (on && mon ? " is-mon" : "") +
          '" title="' +
          esc(
            on && mon
              ? "全部畅通：已连接且监听中"
              : on
                ? "部分畅通：已连接、未监听"
                : "完全不畅通：已断开"
          ) +
          '"></span><span class="tg-bot-item-main"><span class="tg-bot-item-name">' +
          esc(b.name) +
          '</span><span class="tg-bot-item-meta">' +
          esc(st) +
          "</span></span></button>" +
          sess +
          "</div>"
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
    var connected = bot.status === "connected" || bot.status === "ok";
    var monitoring = !!bot.monitoring;
    var sessBadge = connected
      ? '<span class="badge badge-ok">已连接</span>'
      : bot.status === "disabled"
        ? '<span class="badge badge-muted">已停用</span>'
        : '<span class="badge badge-warn">已断开</span>';
    var monBadge = monitoring
      ? '<span class="badge badge-info">监听中</span>'
      : '<span class="badge badge-muted">未监听</span>';
    var html =
      '<div class="tg-detail-head"><div class="tg-detail-identity"><h2 class="tg-detail-title">' +
      esc(bot.name) +
      '</h2><div class="tg-detail-meta">' +
      sessBadge +
      monBadge +
      (bot.phoneHint
        ? '<span class="tg-detail-info">' + esc(bot.phoneHint) + "</span>"
        : "") +
      '<span class="tg-detail-info">已挂 ' +
      chs.length +
      " / " +
      lim.maxChannelsPerBot +
      "</span></div></div>" +
      '<div class="tg-detail-actions">' +
      '<button type="button" class="btn' +
      (monitoring ? "" : " btn-primary") +
      '" data-monitor="' +
      esc(bot.id) +
      '"' +
      (connected ? "" : " disabled title=\"请先在左侧连接会话\"") +
      ">" +
      (monitoring ? "停止监听" : "开始监听") +
      "</button></div></div>";

    /* 先频道后路由：配完频道再配转发 */
    var chPanel =
      window.FZTgCollectChannels &&
      FZTgCollectChannels.panel(bot, chs, connected, isPool, {
        q: opts.chQuery,
        role: opts.chRole,
        status: opts.chStatus,
        page: opts.chPage
      });
    if (chPanel) html += chPanel;
    if (isPool && window.FZTgCollectRoutes) {
      html += FZTgCollectRoutes.panel(ctx, bot, connected, {
        routeView: opts.routeView,
        routeQuery: opts.routeQuery,
        routeHealth: opts.routeHealth
      });
    } else if (!isPool) {
      html +=
        '<p class="hint tg-project-hint">业务项目：只挂采集频道 → 监听收料进本项目。无分发频道、无路由（路由只在公共池）。</p>';
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
