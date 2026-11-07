/* TG 采集 · 详情区内写 store 的操作 */
window.FZTgCollectOps = (function () {
  function ensureSession(bot) {
    if (!bot) return { ok: false, error: "采集号不存在" };
    if (bot.status === "disabled") {
      return { ok: false, error: "采集号已停用" };
    }
    if (bot.status !== "connected" && bot.status !== "ok") {
      bot.status = "connected";
    }
    return { ok: true };
  }

  function hasActiveCollect(ctx, botId) {
    return (ctx.boundChannels || []).some(function (ch) {
      return (
        ch.botId === botId &&
        ch.role === "collect" &&
        ch.active !== false
      );
    });
  }

  function handle(t, api) {
    if (!t) return false;
    if (t.disabled) {
      FZShell.toast(t.getAttribute("title") || "当前不可操作", "err");
      return true;
    }
    var st = FZStore.read();
    var c = api.getCtx(st);
    if (!c) return true;
    var contextId = api.getContextId();
    var paint = api.paint;
    var M = api.modal;

    if (t.getAttribute("data-sync-ch")) {
      var syncBot = (st.userbots || []).find(function (b) {
        return b.id === t.getAttribute("data-sync-ch");
      });
      var ready = ensureSession(syncBot);
      if (!ready.ok) {
        FZShell.toast(ready.error || "会话连接失败，请重试", "err");
        return true;
      }
      var syncRes = FZStore.syncChannelsFromTelegram(
        st,
        t.getAttribute("data-sync-ch"),
        contextId
      );
      if (!syncRes.ok) {
        FZShell.toast(syncRes.error || "拉取失败", "err");
        return true;
      }
      FZStore.write(st);
      FZShell.toast(
        syncRes.added
          ? FZStore.isPublicPool(c)
            ? "已拉取并生成 " + syncRes.added + " 个未分配频道，点「未分配」标签选择采集或分发"
            : "已拉取 " + syncRes.added + " 个采集频道"
          : "拉取完成：无新频道（均已在列表或已达上限）",
        "ok"
      );
      paint();
      return true;
    }
    if (t.getAttribute("data-collect")) {
      var mb = (st.userbots || []).find(function (b) {
        return b.id === t.getAttribute("data-collect");
      });
      if (!mb) return true;
      if (mb.monitoring) {
        mb.monitoring = false;
        FZStore.write(st);
        FZShell.toast("已停止采集", "ok");
        paint();
        return true;
      }
      var startReady = ensureSession(mb);
      if (!startReady.ok) {
        FZShell.toast(startReady.error || "会话连接失败，请重试或强制断开后重新登录", "err");
        return true;
      }
      if (!hasActiveCollect(c, mb.id)) {
        FZShell.toast("请先加入并启用至少一个采集频道，再开始采集", "err");
        return true;
      }
      mb.monitoring = true;
      FZStore.write(st);
      FZShell.toast("已开始采集", "ok");
      paint();
      return true;
    }
    if (t.getAttribute("data-force-disconnect")) {
      var fb = (st.userbots || []).find(function (b) {
        return b.id === t.getAttribute("data-force-disconnect");
      });
      if (!fb) return true;
      fb.status = "disconnected";
      fb.monitoring = false;
      FZStore.write(st);
      FZShell.toast("已强制断开会话", "ok");
      paint();
      return true;
    }
    if (t.getAttribute("data-ch-assign")) {
      M.openAssign(t.getAttribute("data-ch-assign"));
      return true;
    }
    if (t.getAttribute("data-ch-active")) {
      var actId = t.getAttribute("data-ch-active");
      var actBot = t.getAttribute("data-ch-bot") || "";
      var actRow = (c.boundChannels || []).find(function (ch) {
        if (ch.id !== actId) return false;
        if (actBot && ch.botId && ch.botId !== actBot) return false;
        return true;
      });
      if (!actRow) {
        FZShell.toast("未找到该频道，请刷新后重试", "err");
        return true;
      }
      if (actRow.role !== "collect" && actRow.role !== "push") {
        FZShell.toast("请先标记为采集或分发，再启用", "err");
        return true;
      }
      actRow.active = !(actRow.active !== false);
      FZStore.upsertProject(st, c);
      FZStore.write(st);
      FZShell.toast(actRow.active ? "已启用频道" : "已停用频道", "ok");
      paint();
      return true;
    }
    if (t.getAttribute("data-unbind")) {
      var cid = t.getAttribute("data-unbind");
      var chRow = (c.boundChannels || []).find(function (ch) {
        return ch.id === cid;
      });
      M.confirm({
        title: "解绑频道",
        message:
          "确认解绑「" +
          ((chRow && chRow.title) || cid) +
          "」？相关路由会一并清理。",
        okText: "解绑",
        danger: true,
        onOk: function () {
          var st2 = FZStore.read();
          var c2 = api.getCtx(st2);
          if (!c2) return;
          c2.boundChannels = (c2.boundChannels || []).filter(function (ch) {
            return ch.id !== cid;
          });
          if (c2.routingRules) {
            c2.routingRules = c2.routingRules
              .map(function (r) {
                r.targetIds = (r.targetIds || []).filter(function (id) {
                  return id !== cid;
                });
                if (r.sourceId === cid || !r.targetIds.length) return null;
                return r;
              })
              .filter(Boolean);
          }
          FZStore.upsertProject(st2, c2);
          FZStore.write(st2);
          FZShell.toast("已解绑频道", "ok");
          paint();
        }
      });
      return true;
    }
    if (t.getAttribute("data-add-ch")) {
      M.openChannel(t.getAttribute("data-add-ch"), t.getAttribute("data-role") || "collect");
      return true;
    }
    if (t.getAttribute("data-add-route")) {
      M.openRoute(t.getAttribute("data-add-route"));
      return true;
    }
    if (t.getAttribute("data-del-route") || t.getAttribute("data-del-edge")) {
      var rid = t.getAttribute("data-del-route") || t.getAttribute("data-del-edge");
      var onlyTarget = t.getAttribute("data-del-target");
      var rule = (c.routingRules || []).find(function (r) {
        return r.id === rid;
      });
      var nameOf = function (id) {
        var hit = (c.boundChannels || []).find(function (ch) {
          return ch.id === id;
        });
        return (hit && hit.title) || id || "";
      };
      var pair =
        rule && onlyTarget
          ? "：" + nameOf(rule.sourceId) + " → " + nameOf(onlyTarget)
          : "";
      var msg = onlyTarget
        ? "确认删除路由" + pair + "？删除后该条分发规则将立即停止。"
        : "确认删除该路由规则？删除后将立即停止。";
      M.confirm({
        title: "删除路由",
        message: msg,
        okText: "删除",
        danger: true,
        onOk: function () {
          var st2 = FZStore.read();
          var c2 = api.getCtx(st2);
          if (!c2) return;
          c2.routingRules = c2.routingRules
            .map(function (r) {
              if (r.id !== rid) return r;
              if (!onlyTarget) return null;
              r.targetIds = (r.targetIds || []).filter(function (id) {
                return id !== onlyTarget;
              });
              return r.targetIds.length ? r : null;
            })
            .filter(Boolean);
          FZStore.upsertProject(st2, c2);
          FZStore.write(st2);
          FZShell.toast("已删除路由", "ok");
          paint();
        }
      });
      return true;
    }
    return false;
  }

  return { handle: handle, ensureSession: ensureSession };
})();
