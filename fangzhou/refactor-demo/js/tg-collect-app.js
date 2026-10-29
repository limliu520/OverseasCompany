/* TG 采集：项目 | 公共池 · 左号右详情（真实写 store） */
(function () {
  var R = window.FZTgCollectRender;
  var M = window.FZTgCollectModal;
  var q = new URLSearchParams(location.search);
  var contextId = q.get("project") || q.get("ctx") || FZStore.PUBLIC_POOL_ID;
  var selectedBotId = q.get("bot") || "";
  var routeView =
    q.get("routeView") === "by_target" || sessionStorage.getItem("fz_tg_route_view") === "by_target"
      ? "by_target"
      : "by_source";
  var routeQuery = "";
  var routeHealth = "";
  var chQuery = "";
  var chRole = "all";
  var chStatus = "";
  var chPage = 1;

  function resetFilters() {
    routeQuery = "";
    routeHealth = "";
    chQuery = "";
    chRole = "all";
    chStatus = "";
    chPage = 1;
  }

  function syncUrl() {
    var u = "./tg-collect.html?project=" + encodeURIComponent(contextId);
    if (selectedBotId) u += "&bot=" + encodeURIComponent(selectedBotId);
    if (routeView === "by_target") u += "&routeView=by_target";
    history.replaceState(null, "", u);
  }

  function ctx(st) {
    return FZStore.findProject(st, contextId);
  }

  function paint() {
    var st = FZStore.read();
    FZStore.ensureDemoAssets(st);
    var c = ctx(st);
    if (!c) {
      contextId = FZStore.PUBLIC_POOL_ID;
      c = ctx(st);
    }
    var lim = FZStore.botLimits();
    var bots = FZStore.botsForProject(st, contextId);
    if (!selectedBotId || !bots.some(function (b) { return b.id === selectedBotId; })) {
      selectedBotId = bots[0] ? bots[0].id : "";
    }
    var bot = bots.find(function (b) {
      return b.id === selectedBotId;
    });

    document.getElementById("tg-ctx").innerHTML = R.contextCards(st, contextId);
    var prevCh = document.getElementById("tg-ch-search");
    var prevRr = document.getElementById("tg-route-search");
    var keepCh = document.activeElement === prevCh;
    var keepRr = document.activeElement === prevRr;
    var caretCh = keepCh ? prevCh.selectionStart : null;
    var caretRr = keepRr ? prevRr.selectionStart : null;

    document.getElementById("tg-bot-list").innerHTML = R.botList(bots, selectedBotId);
    document.getElementById("tg-detail").innerHTML = R.detail(c, bot, lim, {
      routeView: routeView,
      routeQuery: routeQuery,
      routeHealth: routeHealth,
      chQuery: chQuery,
      chRole: chRole,
      chStatus: chStatus,
      chPage: chPage
    });

    function bindSearch(el, apply) {
      if (!el) return;
      el.oninput = function () {
        var val = this.value;
        clearTimeout(el._fzTimer);
        el._fzTimer = setTimeout(function () {
          apply(val);
          paint();
        }, 180);
      };
    }
    bindSearch(document.getElementById("tg-ch-search"), function (val) {
      chQuery = val;
      chPage = 1;
    });
    bindSearch(document.getElementById("tg-route-search"), function (val) {
      routeQuery = val;
    });
    if (keepCh) {
      var s1 = document.getElementById("tg-ch-search");
      if (s1) {
        s1.focus();
        try {
          s1.setSelectionRange(caretCh, caretCh);
        } catch (err) {}
      }
    }
    if (keepRr) {
      var s2 = document.getElementById("tg-route-search");
      if (s2) {
        s2.focus();
        try {
          s2.setSelectionRange(caretRr, caretRr);
        } catch (err) {}
      }
    }
    syncUrl();
  }

  function onWorkspaceClick(e) {
    var viewBtn = e.target.closest("[data-route-view]");
    if (viewBtn) {
      routeView =
        viewBtn.getAttribute("data-route-view") === "by_target" ? "by_target" : "by_source";
      try {
        sessionStorage.setItem("fz_tg_route_view", routeView);
      } catch (err) {}
      paint();
      return;
    }
    var healthBtn = e.target.closest("[data-route-health]");
    if (healthBtn) {
      routeHealth = healthBtn.getAttribute("data-route-health") || "";
      paint();
      return;
    }
    var filterBtn = e.target.closest("[data-ch-filter]");
    if (filterBtn) {
      chRole = filterBtn.getAttribute("data-ch-filter") || "all";
      chPage = 1;
      paint();
      return;
    }
    var chStatusBtn = e.target.closest("[data-ch-status]");
    if (chStatusBtn) {
      chStatus = chStatusBtn.getAttribute("data-ch-status") || "";
      chPage = 1;
      paint();
      return;
    }
    var pageBtn = e.target.closest("[data-ch-page]");
    if (pageBtn && !pageBtn.disabled) {
      var p = parseInt(pageBtn.getAttribute("data-ch-page"), 10);
      if (p >= 1) {
        chPage = p;
        paint();
      }
      return;
    }
    var pick = e.target.closest("[data-pick-bot]");
    if (pick) {
      selectedBotId = pick.getAttribute("data-pick-bot");
      resetFilters();
      paint();
      return;
    }
    if (e.target.id === "tg-add-bot" || e.target.closest("#tg-add-bot")) {
      var st0 = FZStore.read();
      var block0 = FZStore.addBotToProjectBlockReason(st0, contextId);
      if (block0) {
        FZShell.toast(block0, "err");
        return;
      }
      var c0 = ctx(st0);
      FZTgWizard.open({
        title: "添加采集号 · " + (c0 ? c0.name : ""),
        onSuccess: function (bot) {
          var s2 = FZStore.read();
          var p2 = ctx(s2);
          if (!p2) return;
          var again = FZStore.addBotToProjectBlockReason(s2, contextId);
          if (again) {
            FZShell.toast(again, "err");
            return;
          }
          if (!s2.userbots) s2.userbots = [];
          bot.status = "connected";
          bot.monitoring = false;
          s2.userbots.push(bot);
          FZStore.attachBotToProject(s2, p2, bot);
          FZStore.write(s2);
          selectedBotId = bot.id;
          FZShell.toast("采集号已添加并连接会话", "ok");
          paint();
        }
      });
      return;
    }

    /* 行内启用/解绑优先于整行「未分配」点击，避免点不到 */
    var rowAction = e.target.closest("[data-ch-active],[data-unbind]");
    var t =
      rowAction ||
      e.target.closest(
        "[data-toggle],[data-add-ch],[data-sync-ch],[data-monitor],[data-add-route],[data-del-route],[data-del-edge],[data-ch-assign]"
      );
    if (!t) return;
    if (rowAction) {
      e.preventDefault();
      e.stopPropagation();
    }
    FZTgCollectOps.handle(t, {
      getContextId: function () {
        return contextId;
      },
      getCtx: ctx,
      paint: paint,
      modal: M
    });
  }

  function boot() {
    FZShell.boot({ active: "c_tg" });
    M.bind({
      getContextId: function () {
        return contextId;
      },
      onDone: paint
    });
    document.getElementById("tg-ctx").addEventListener("click", function (e) {
      var card = e.target.closest("[data-pick-ctx]");
      if (!card) return;
      var next = card.getAttribute("data-pick-ctx") || FZStore.PUBLIC_POOL_ID;
      if (next === contextId) return;
      contextId = next;
      selectedBotId = "";
      resetFilters();
      paint();
    });
    document.getElementById("tg-workspace").addEventListener("click", onWorkspaceClick);
    paint();
    /* 工作台快捷：?action=add_bot|add_channel|add_route */
    var act = q.get("action");
    if (act === "add_bot") {
      setTimeout(function () {
        var btn = document.getElementById("tg-add-bot");
        if (btn) btn.click();
      }, 80);
    } else if (act === "add_channel" || act === "add_route") {
      setTimeout(function () {
        var sel =
          act === "add_channel" ? "[data-add-ch]" : "[data-add-route]";
        var el = document.querySelector(sel);
        if (el) el.click();
        else
          FZShell.toast(
            act === "add_channel"
              ? "请先选中采集号后再添加频道"
              : "请先选中采集号后再增加路由",
            "err"
          );
      }, 120);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
