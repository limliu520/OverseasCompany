/* TG 采集 · 加频道 / 建路由弹窗 */
window.FZTgCollectModal = (function () {
  var pendingChBotId = "";
  var pendingRouteBotId = "";
  var getContextId = null;
  var onDone = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeChannelInput(raw) {
    var s = String(raw || "").trim();
    if (!s) return null;
    var m = s.match(/^(?:https?:\/\/)?(?:t\.me\/|telegram\.me\/)(?:joinchat\/|\+)?([^\s/?#]+)/i);
    if (m) {
      var part = m[1];
      if (/joinchat/i.test(s) || s.indexOf("+") !== -1) {
        return { id: "ch_inv_" + part.toLowerCase(), title: "邀请链接 · " + part.slice(0, 8) };
      }
      return { id: "ch_" + part.toLowerCase(), title: "@" + part.replace(/^@/, "") };
    }
    if (s.charAt(0) === "@") {
      var u = s.slice(1).replace(/\s/g, "");
      if (!u) return null;
      return { id: "ch_" + u.toLowerCase(), title: "@" + u };
    }
    if (/^[A-Za-z0-9_]{4,}$/.test(s)) {
      return { id: "ch_" + s.toLowerCase(), title: "@" + s };
    }
    return null;
  }

  function ctx(st) {
    return FZStore.findProject(st, getContextId());
  }

  function setRole(role) {
    var v = role === "push" ? "push" : "collect";
    document.getElementById("tg-ch-role").value = v;
    Array.prototype.forEach.call(document.querySelectorAll(".tg-role-opt"), function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-ch-role") === v);
    });
  }

  function openChannel(botId, role) {
    var st = FZStore.read();
    var c = ctx(st);
    var bot = (st.userbots || []).find(function (b) {
      return b.id === botId;
    });
    if (!bot || (bot.status !== "connected" && bot.status !== "ok")) {
      FZShell.toast("请先连接会话，再加入频道", "err");
      return;
    }
    pendingChBotId = botId;
    var isPool = c && FZStore.isPublicPool(c);
    document.getElementById("tg-ch-modal-title").textContent = isPool
      ? "加入频道"
      : "加入采集频道";
    setRole(isPool && role === "push" ? "push" : "collect");
    document.getElementById("tg-ch-role-field").hidden = !isPool;
    document.getElementById("tg-ch-hint").textContent = isPool
      ? "公共池：先选用途（采集进料 / 分发作 TG→TG 目标），再填频道；开监听后才收消息。"
      : "业务项目只挂采集频道，料进本项目；无分发频道、无路由。开监听后才收消息。";
    document.getElementById("tg-ch-link").value = "";
    document.getElementById("tg-ch-modal").hidden = false;
    document.getElementById("tg-ch-link").focus();
  }

  function saveChannel() {
    var parsed = normalizeChannelInput(document.getElementById("tg-ch-link").value);
    if (!parsed) {
      FZShell.toast("请填写有效的 @用户名 或 t.me 链接", "err");
      return;
    }
    var st = FZStore.read();
    var c = ctx(st);
    if (!c) return;
    var isPool = FZStore.isPublicPool(c);
    var role =
      isPool && document.getElementById("tg-ch-role").value === "push" ? "push" : "collect";
    if ((c.boundChannels || []).some(function (ch) {
      return ch.id === parsed.id && ch.botId === pendingChBotId;
    })) {
      FZShell.toast("该采集号已挂过此频道", "err");
      return;
    }
    var block = FZStore.botJoinChannelBlockReason(
      st,
      pendingChBotId,
      parsed.id,
      getContextId()
    );
    if (block) {
      FZShell.toast(block, "err");
      return;
    }
    if (!c.boundChannels) c.boundChannels = [];
    c.boundChannels.unshift({
      id: parsed.id,
      title: parsed.title,
      botId: pendingChBotId,
      role: role,
      active: true,
      boundAt: Date.now(),
      note: ""
    });
    if (role === "collect") c.hasCollectSource = true;
    FZStore.upsertProject(st, c);
    FZStore.write(st);
    document.getElementById("tg-ch-modal").hidden = true;
    FZShell.toast("已加入「" + parsed.title + "」", "ok");
    if (onDone) onDone();
  }

  function openRoute(botId) {
    var st = FZStore.read();
    var c = ctx(st);
    if (!c || !FZStore.isPublicPool(c)) return;
    var bot = (st.userbots || []).find(function (b) {
      return b.id === botId;
    });
    if (!bot || (bot.status !== "connected" && bot.status !== "ok")) {
      FZShell.toast("请先连接会话", "err");
      return;
    }
    var mine = (c.boundChannels || []).filter(function (ch) {
      return ch.botId === botId;
    });
    var sources = mine.filter(function (ch) {
      return ch.role === "collect" && ch.active !== false;
    });
    var targets = mine.filter(function (ch) {
      return ch.role === "push" && ch.active !== false;
    });
    if (!sources.length || !targets.length) {
      FZShell.toast(
        "请先为本号标记并启用至少 1 个采集频道和 1 个分发频道（拉取进来的需先标用途）",
        "err"
      );
      return;
    }
    pendingRouteBotId = botId;
    document.getElementById("tg-rr-source").innerHTML = sources
      .map(function (ch) {
        return '<option value="' + esc(ch.id) + '">' + esc(ch.title) + "</option>";
      })
      .join("");
    document.getElementById("tg-rr-targets").innerHTML = targets
      .map(function (ch) {
        return (
          '<label class="check-inline"><input type="checkbox" value="' +
          esc(ch.id) +
          '" /> ' +
          esc(ch.title) +
          "</label>"
        );
      })
      .join("");
    document.getElementById("tg-rr-modal").hidden = false;
  }

  function saveRoute() {
    var src = document.getElementById("tg-rr-source").value;
    var tgts = Array.prototype.map
      .call(document.querySelectorAll("#tg-rr-targets input:checked"), function (el) {
        return el.value;
      })
      .filter(Boolean);
    if (!src || !tgts.length) {
      FZShell.toast("请选择采集源，并至少勾选一个分发目标", "err");
      return;
    }
    if (tgts.indexOf(src) !== -1) {
      FZShell.toast("源频道和目标频道不能相同（频道不能路由给自己）", "err");
      return;
    }
    var st = FZStore.read();
    var c = ctx(st);
    if (!c) return;
    if (!c.routingRules) c.routingRules = [];
    var added = 0;
    var skipped = 0;
    var blocked = 0;
    tgts.forEach(function (tid) {
      var exists = c.routingRules.some(function (r) {
        return (
          r.botId === pendingRouteBotId &&
          r.sourceId === src &&
          (r.targetIds || []).indexOf(tid) !== -1
        );
      });
      if (exists) {
        skipped += 1;
        return;
      }
      /* 对齐现网：禁止反向成环 A→B 与 B→A */
      var reverse = c.routingRules.some(function (r) {
        return r.sourceId === tid && (r.targetIds || []).indexOf(src) !== -1;
      });
      if (reverse) {
        blocked += 1;
        return;
      }
      c.routingRules.push({
        id: FZStore.uid("rr"),
        botId: pendingRouteBotId,
        sourceId: src,
        targetIds: [tid],
        active: true,
        healthStatus: "",
        healthError: ""
      });
      added += 1;
    });
    if (!added) {
      FZShell.toast(
        blocked && !skipped
          ? "已存在反向路由，禁止再建，避免素材成环"
          : blocked
            ? "无新增：部分目标已存在反向路由或相同边"
            : "所选目标均已存在相同路由",
        "err"
      );
      return;
    }
    FZStore.upsertProject(st, c);
    FZStore.write(st);
    document.getElementById("tg-rr-modal").hidden = true;
    FZShell.toast(
      "已建 " + added + " 条边" + (skipped ? "（跳过已存在 " + skipped + "）" : ""),
      "ok"
    );
    if (onDone) onDone();
  }

  var confirmOkFn = null;
  var pendingAssignId = "";

  function closeConfirm() {
    document.getElementById("tg-confirm-modal").hidden = true;
    confirmOkFn = null;
  }

  /** 页内二次确认（对齐现网 showConfirm；预览里原生 confirm 常被挡） */
  function confirm(opts) {
    opts = opts || {};
    document.getElementById("tg-confirm-title").textContent = opts.title || "确认操作";
    document.getElementById("tg-confirm-msg").textContent = opts.message || "";
    var okBtn = document.getElementById("tg-confirm-ok");
    okBtn.textContent = opts.okText || "确定";
    okBtn.className = "btn " + (opts.danger ? "btn-danger" : "btn-primary");
    confirmOkFn = typeof opts.onOk === "function" ? opts.onOk : null;
    document.getElementById("tg-confirm-modal").hidden = false;
  }

  function openAssign(chId) {
    var st = FZStore.read();
    var c = ctx(st);
    if (!c || !FZStore.isPublicPool(c)) return;
    var row = (c.boundChannels || []).find(function (ch) {
      return ch.id === chId;
    });
    if (!row) return;
    if (row.role === "collect" || row.role === "push") {
      FZShell.toast("该频道已标记用途，如需调整请先解绑再加入", "err");
      return;
    }
    pendingAssignId = chId;
    document.getElementById("tg-assign-name").textContent =
      "为「" + (row.title || chId) + "」选择用途：";
    document.getElementById("tg-assign-modal").hidden = false;
  }

  function closeAssign() {
    document.getElementById("tg-assign-modal").hidden = true;
    pendingAssignId = "";
  }

  function pickAssign(role) {
    if (role !== "collect" && role !== "push") return;
    if (!pendingAssignId) return;
    var st = FZStore.read();
    var c = ctx(st);
    if (!c) return;
    var row = (c.boundChannels || []).find(function (ch) {
      return ch.id === pendingAssignId;
    });
    if (!row) {
      closeAssign();
      return;
    }
    row.role = role;
    row.active = true;
    if (role === "collect") c.hasCollectSource = true;
    FZStore.upsertProject(st, c);
    FZStore.write(st);
    closeAssign();
    FZShell.toast(role === "push" ? "已标记为分发并启用" : "已标记为采集并启用", "ok");
    if (onDone) onDone();
  }

  function bind(opts) {
    getContextId = opts.getContextId;
    onDone = opts.onDone;
    document.getElementById("tg-ch-role-field").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-ch-role]");
      if (!btn) return;
      setRole(btn.getAttribute("data-ch-role"));
    });
    document.getElementById("tg-ch-cancel").onclick = function () {
      document.getElementById("tg-ch-modal").hidden = true;
    };
    document.getElementById("tg-ch-save").onclick = saveChannel;
    document.getElementById("tg-ch-modal").addEventListener("click", function (e) {
      if (e.target.id === "tg-ch-modal") e.target.hidden = true;
    });
    document.getElementById("tg-rr-cancel").onclick = function () {
      document.getElementById("tg-rr-modal").hidden = true;
    };
    document.getElementById("tg-rr-save").onclick = saveRoute;
    document.getElementById("tg-rr-modal").addEventListener("click", function (e) {
      if (e.target.id === "tg-rr-modal") e.target.hidden = true;
    });
    document.getElementById("tg-confirm-cancel").onclick = closeConfirm;
    document.getElementById("tg-confirm-ok").onclick = function () {
      var fn = confirmOkFn;
      closeConfirm();
      if (fn) fn();
    };
    document.getElementById("tg-confirm-modal").addEventListener("click", function (e) {
      if (e.target.id === "tg-confirm-modal") closeConfirm();
    });
    document.getElementById("tg-assign-cancel").onclick = closeAssign;
    document.getElementById("tg-assign-modal").addEventListener("click", function (e) {
      if (e.target.id === "tg-assign-modal") closeAssign();
      var pick = e.target.closest("[data-assign-pick]");
      if (pick) pickAssign(pick.getAttribute("data-assign-pick"));
    });
  }

  return {
    bind: bind,
    openChannel: openChannel,
    openRoute: openRoute,
    openAssign: openAssign,
    confirm: confirm
  };
})();
