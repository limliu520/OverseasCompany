/* 采集号：按项目归属；连接 / 断开 / 删除（非全局共用池） */
(function () {
  var filterProjectId = "";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function findBot(st, id) {
    return (st.userbots || []).find(function (b) {
      return b.id === id;
    });
  }

  function projectName(st, id) {
    var p = FZStore.findProject(st, id);
    return p ? p.name : id ? "项目已删" : "未归属项目";
  }

  function paintFilter(st) {
    var sel = document.getElementById("ub-filter-project");
    if (!sel) return;
    var opts =
      '<option value="">全部项目</option>' +
      (st.projects || [])
        .map(function (p) {
          return (
            '<option value="' +
            esc(p.id) +
            '"' +
            (filterProjectId === p.id ? " selected" : "") +
            ">" +
            esc(p.name) +
            "</option>"
          );
        })
        .join("");
    sel.innerHTML = opts;
  }

  function render() {
    var st = FZStore.read();
    var lim = FZStore.botLimits();
    var box = document.getElementById("ub-list");
    var lead = document.getElementById("ub-lead");
    if (lead) {
      lead.textContent =
        "采集号按项目归属（一项目最多 " +
        lim.maxBotsPerProject +
        " 个）。单号频道合计 ≤" +
        lim.maxChannelsPerBot +
        "；同频道最多 " +
        lim.maxBotsPerChannel +
        " 个号。上限由 Admin 配置。连接 / 断开 / 删除。";
    }
    paintFilter(st);
    if (!box) return;
    var bots = (st.userbots || []).filter(function (b) {
      return !filterProjectId || b.projectId === filterProjectId;
    });
    if (!bots.length) {
      box.innerHTML =
        '<div class="card card-pad muted">还没有采集号。请先选择归属项目，再点「添加采集号」。</div>';
      return;
    }
    box.innerHTML = bots
      .map(function (b) {
        var stLab = FZStore.userbotStatusLabel(b);
        var chN = FZStore.userbotBoundChannelCount(st, b);
        var connected = b.status === "connected" || b.status === "ok";
        var markCls = connected
          ? "is-on"
          : b.status === "disabled"
            ? "is-off"
            : "is-warn";
        var actions = "";
        if (b.status !== "disabled") {
          actions +=
            '<button type="button" class="btn' +
            (connected ? "" : " btn-primary") +
            '" data-act="toggle" data-id="' +
            esc(b.id) +
            '">' +
            (connected ? "断开" : "连接") +
            "</button>";
        }
        actions +=
          '<button type="button" class="btn btn-ghost" data-act="del" data-id="' +
          esc(b.id) +
          '">删除</button>';
        if (b.projectId) {
          actions +=
            '<a class="btn btn-ghost" href="./project-edit.html?id=' +
            encodeURIComponent(b.projectId) +
            '&tab=channel">项目通道</a>';
        }
        return (
          '<article class="ub-card" data-id="' +
          esc(b.id) +
          '">' +
          '<div class="ub-card-top">' +
          '<div class="ub-mark ' +
          markCls +
          '" aria-hidden="true">采</div>' +
          '<div class="ub-main">' +
          '<div class="ub-head">' +
          '<h2 class="ub-title">' +
          esc(b.name) +
          "</h2>" +
          '<p class="ub-status ' +
          markCls +
          '">' +
          esc(stLab.text) +
          "</p></div>" +
          '<p class="ub-phone">' +
          esc(b.phoneHint || "未填手机号") +
          "</p>" +
          '<p class="ub-stats">归属：' +
          esc(projectName(st, b.projectId)) +
          " · 挂 " +
          chN +
          " / " +
          lim.maxChannelsPerBot +
          " 个频道</p>" +
          "</div></div>" +
          '<div class="ub-actions">' +
          actions +
          "</div></article>"
        );
      })
      .join("");
  }

  function onListClick(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    var id = btn.getAttribute("data-id");
    var st = FZStore.read();
    var bot = findBot(st, id);
    if (!bot) {
      FZShell.toast("采集号不存在", "err");
      return;
    }
    if (act === "toggle") {
      var connected = bot.status === "connected" || bot.status === "ok";
      if (connected) {
        bot.status = "disconnected";
        FZStore.write(st);
        FZShell.toast("已断开会话（演示）", "ok");
      } else if (bot.status === "disabled") {
        FZShell.toast("已停用的采集号不可连接", "err");
        return;
      } else {
        bot.status = "connected";
        FZStore.write(st);
        FZShell.toast("已连接（演示）", "ok");
      }
      render();
      return;
    }
    if (act === "del") {
      var chN = FZStore.userbotBoundChannelCount(st, bot);
      if (chN > 0) {
        FZShell.toast("该采集号仍挂有频道，请先在项目通道里解绑再删", "err");
        return;
      }
      if (!confirm("确定删除采集号「" + bot.name + "」？此操作不可恢复。")) return;
      var proj = bot.projectId ? FZStore.findProject(st, bot.projectId) : null;
      if (proj) FZStore.detachBotFromProject(st, proj, id);
      st.userbots = (st.userbots || []).filter(function (b) {
        return b.id !== id;
      });
      FZStore.write(st);
      FZShell.toast("已删除", "ok");
      render();
    }
  }

  function boot() {
    FZShell.boot({ active: "userbot" });
    var q = new URLSearchParams(location.search).get("project");
    if (q) filterProjectId = q;
    document.getElementById("ub-list").addEventListener("click", onListClick);
    var filt = document.getElementById("ub-filter-project");
    if (filt) {
      filt.addEventListener("change", function () {
        filterProjectId = filt.value || "";
        render();
      });
    }
    document.getElementById("btn-new").addEventListener("click", function () {
      var st = FZStore.read();
      var pid = filterProjectId || (document.getElementById("ub-filter-project") || {}).value;
      if (!pid) {
        FZShell.toast("请先在上方选择归属项目，再添加采集号", "err");
        return;
      }
      var block = FZStore.addBotToProjectBlockReason(st, pid);
      if (block) {
        FZShell.toast(block, "err");
        return;
      }
      var proj = FZStore.findProject(st, pid);
      if (!proj) {
        FZShell.toast("项目不存在", "err");
        return;
      }
      FZTgWizard.open({
        title: "添加采集号 · " + proj.name,
        onSuccess: function (bot) {
          var s2 = FZStore.read();
          var p2 = FZStore.findProject(s2, pid);
          if (!p2) {
            FZShell.toast("项目不存在", "err");
            return;
          }
          var again = FZStore.addBotToProjectBlockReason(s2, pid);
          if (again) {
            FZShell.toast(again, "err");
            return;
          }
          if (!s2.userbots) s2.userbots = [];
          bot.status = bot.status || "connected";
          s2.userbots.push(bot);
          FZStore.attachBotToProject(s2, p2, bot);
          FZStore.write(s2);
          filterProjectId = pid;
          FZShell.toast("采集号已添加到本项目并连接", "ok");
          render();
        }
      });
    });
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
