/* TG 采集配置：采集号↔频道 的唯一操作台（连接/断开、挂频道、解绑） */
(function () {
  var projectId = new URLSearchParams(location.search).get("project") || "";
  var focusBot = new URLSearchParams(location.search).get("bot") || "";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function paintProjectSelect(st) {
    var sel = document.getElementById("tg-project");
    if (!sel) return;
    var list = st.projects || [];
    if (!projectId && list[0]) projectId = list[0].id;
    sel.innerHTML = list
      .map(function (p) {
        return (
          '<option value="' +
          esc(p.id) +
          '"' +
          (p.id === projectId ? " selected" : "") +
          ">" +
          esc(p.name) +
          "</option>"
        );
      })
      .join("");
    if (!list.length) {
      sel.innerHTML = '<option value="">暂无项目</option>';
      projectId = "";
    }
  }

  function channelsForBot(p, botId) {
    return (p.boundChannels || []).filter(function (c) {
      return c.botId === botId;
    });
  }

  function render() {
    var st = FZStore.read();
    var lim = FZStore.botLimits();
    paintProjectSelect(st);
    var root = document.getElementById("tg-root");
    if (!root) return;
    if (!projectId) {
      root.innerHTML =
        '<div class="card card-pad muted">请先创建项目，再在此配置采集号与频道。</div>';
      return;
    }
    var p = FZStore.findProject(st, projectId);
    if (!p) {
      root.innerHTML = '<div class="card card-pad muted">项目不存在。</div>';
      return;
    }
    var bots = FZStore.botsForProject(st, projectId);
    var lead = document.getElementById("tg-lead");
    if (lead) {
      lead.textContent =
        "当前项目：「" +
        p.name +
        "」。单号频道 ≤" +
        lim.maxChannelsPerBot +
        "；同频道最多 " +
        lim.maxBotsPerChannel +
        " 个号；跨项目不可重复进同一频道。";
    }

    var cards =
      bots.length === 0
        ? '<div class="card card-pad muted">本项目还没有采集号。可在下方添加，或到项目详情「TG 采集号」添加。</div>'
        : '<div class="fz-card-grid">' +
          bots
            .map(function (b) {
              var lab = FZStore.userbotStatusLabel(b);
              var chs = channelsForBot(p, b.id);
              var connected = b.status === "connected" || b.status === "ok";
              var markCls = connected
                ? "is-on"
                : b.status === "disabled"
                  ? "is-off"
                  : "is-warn";
              var chList =
                chs.length === 0
                  ? '<p class="muted" style="font-size:12px;margin:0">尚未挂频道</p>'
                  : '<ul class="tg-ch-list">' +
                    chs
                      .map(function (c) {
                        return (
                          "<li><span><strong>" +
                          esc(c.title) +
                          "</strong> · " +
                          (c.role === "push" ? "分发" : "采集") +
                          '</span><button type="button" class="btn btn-ghost btn-sm" data-unbind="' +
                          esc(c.id) +
                          '">解绑</button></li>'
                        );
                      })
                      .join("") +
                    "</ul>";
              var focus = focusBot === b.id ? " is-focus" : "";
              return (
                '<article class="ub-card' +
                focus +
                '" data-bot="' +
                esc(b.id) +
                '">' +
                '<div class="ub-card-top">' +
                '<div class="ub-mark ' +
                markCls +
                '">采</div>' +
                '<div class="ub-main">' +
                '<h2 class="ub-title">' +
                esc(b.name) +
                "</h2>" +
                '<p class="ub-status ' +
                markCls +
                '">' +
                esc(lab.text) +
                "</p>" +
                '<p class="ub-phone">' +
                esc(b.phoneHint || "") +
                "</p>" +
                '<p class="ub-stats">已挂 ' +
                chs.length +
                " / " +
                lim.maxChannelsPerBot +
                " 个频道</p>" +
                chList +
                "</div></div>" +
                '<div class="ub-actions">' +
                (b.status !== "disabled"
                  ? '<button type="button" class="btn' +
                    (connected ? "" : " btn-primary") +
                    '" data-toggle="' +
                    esc(b.id) +
                    '">' +
                    (connected ? "断开" : "连接") +
                    "</button>"
                  : "") +
                '<button type="button" class="btn" data-add-ch="' +
                esc(b.id) +
                '" data-role="collect">+ 采集频道</button>' +
                '<button type="button" class="btn btn-ghost" data-add-ch="' +
                esc(b.id) +
                '" data-role="push">+ 分发频道</button>' +
                "</div></article>"
              );
            })
            .join("") +
          "</div>";

    root.innerHTML =
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">' +
      '<button type="button" class="btn btn-primary" id="tg-add-bot">+ 添加采集号</button>' +
      '<a class="btn btn-ghost" href="./project-edit.html?id=' +
      encodeURIComponent(projectId) +
      '&tab=channel">回项目「TG 采集号」</a></div>' +
      cards;
  }

  function onRootClick(e) {
    if (e.target.id === "tg-add-bot" || e.target.closest("#tg-add-bot")) {
      var st0 = FZStore.read();
      var block0 = FZStore.addBotToProjectBlockReason(st0, projectId);
      if (block0) {
        FZShell.toast(block0, "err");
        return;
      }
      var proj0 = FZStore.findProject(st0, projectId);
      FZTgWizard.open({
        title: "添加采集号 · " + (proj0 ? proj0.name : ""),
        onSuccess: function (bot) {
          var s2 = FZStore.read();
          var p2 = FZStore.findProject(s2, projectId);
          if (!p2) return;
          var again = FZStore.addBotToProjectBlockReason(s2, projectId);
          if (again) {
            FZShell.toast(again, "err");
            return;
          }
          if (!s2.userbots) s2.userbots = [];
          bot.status = bot.status || "connected";
          s2.userbots.push(bot);
          FZStore.attachBotToProject(s2, p2, bot);
          FZStore.write(s2);
          FZShell.toast("采集号已添加", "ok");
          render();
        }
      });
      return;
    }

    var t = e.target.closest("[data-toggle],[data-unbind],[data-add-ch]");
    if (!t) return;
    var st = FZStore.read();
    var p = FZStore.findProject(st, projectId);
    if (!p) return;

    if (t.getAttribute("data-toggle")) {
      var bid = t.getAttribute("data-toggle");
      var bot = (st.userbots || []).find(function (b) {
        return b.id === bid;
      });
      if (!bot) return;
      var on = bot.status === "connected" || bot.status === "ok";
      bot.status = on ? "disconnected" : "connected";
      FZStore.write(st);
      FZShell.toast(on ? "已断开（演示）" : "已连接（演示）", "ok");
      render();
      return;
    }

    if (t.getAttribute("data-unbind")) {
      var cid = t.getAttribute("data-unbind");
      p.boundChannels = (p.boundChannels || []).filter(function (c) {
        return c.id !== cid;
      });
      FZStore.upsertProject(st, p);
      FZStore.write(st);
      FZShell.toast("已解绑频道", "ok");
      render();
      return;
    }

    if (t.getAttribute("data-add-ch")) {
      var botId = t.getAttribute("data-add-ch");
      var role = t.getAttribute("data-role") || "collect";
      var chId = FZStore.uid("ch");
      var block = FZStore.botJoinChannelBlockReason(st, botId, chId, projectId);
      if (block) {
        FZShell.toast(block, "err");
        return;
      }
      if (!p.boundChannels) p.boundChannels = [];
      p.boundChannels.push({
        id: chId,
        title: "@demo_" + Math.random().toString(36).slice(2, 7),
        botId: botId,
        role: role === "push" ? "push" : "collect",
        note: ""
      });
      if (role !== "push") p.hasCollectSource = true;
      FZStore.upsertProject(st, p);
      FZStore.write(st);
      FZShell.toast(role === "push" ? "已添加分发频道（演示）" : "已添加采集频道（演示）", "ok");
      render();
    }
  }

  function boot() {
    FZShell.boot({ active: "c_tg" });
    document.getElementById("tg-project").addEventListener("change", function () {
      projectId = this.value || "";
      focusBot = "";
      history.replaceState(
        null,
        "",
        "./tg-collect.html" + (projectId ? "?project=" + encodeURIComponent(projectId) : "")
      );
      render();
    });
    document.getElementById("tg-root").addEventListener("click", onRootClick);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
