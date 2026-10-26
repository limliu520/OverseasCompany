/* Userbot 列表：对齐现网 Telegram 配置卡片 · 仅连接 / 断开 / 删除 */
(function () {
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

  function render() {
    var st = FZStore.read();
    var box = document.getElementById("ub-list");
    if (!box) return;
    var bots = st.userbots || [];
    if (!bots.length) {
      box.innerHTML =
        '<div class="card card-pad muted">还没有采集号。点右上角「添加采集号」。</div>';
      return;
    }
    box.innerHTML = bots
      .map(function (b) {
        var stLab = FZStore.userbotStatusLabel(b);
        var used = FZStore.projectsUsingUserbot(st, b.id);
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
        /* 头像仅色块标识；状态文案只出现在 ub-status 一行，避免「连/已连接」重复 */
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
          "</p>" +
          "</div>" +
          '<p class="ub-phone">' +
          esc(b.phoneHint || "未填手机号") +
          "</p>" +
          '<p class="ub-stats">挂 ' +
          chN +
          " 个频道 · 被 " +
          used.length +
          " 个项目选用</p>" +
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
      var used = FZStore.projectsUsingUserbot(st, id);
      if (used.length) {
        FZShell.toast(
          "仍有 " + used.length + " 个项目在用该采集号，请先在项目里解绑后再删",
          "err"
        );
        return;
      }
      if (!confirm("确定删除采集号「" + bot.name + "」？此操作不可恢复。")) return;
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
    document.getElementById("ub-list").addEventListener("click", onListClick);
    document.getElementById("btn-new").addEventListener("click", function () {
      FZTgWizard.open({
        title: "添加采集号",
        onSuccess: function (bot) {
          var st = FZStore.read();
          if (!st.userbots) st.userbots = [];
          bot.status = bot.status || "connected";
          st.userbots.push(bot);
          FZStore.write(st);
          FZShell.toast("采集号已添加并连接", "ok");
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
