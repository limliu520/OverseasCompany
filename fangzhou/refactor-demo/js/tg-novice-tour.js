/* TG 采集 · 新手教程试做：仅 ?novice=tg_collect 启用；强制分步；结束弹窗 */
(function (global) {
  var POOL = "proj_public_pool";
  var STEP_KEY = "fz_tg_novice_step";

  var STEPS = [
    {
      id: "switch_biz",
      title: "切换到业务项目",
      tip: "点「下一步」自动切到业务项目卡片，看看「项目内采集」和公共池有什么不同。",
      allow: "",
      spotlight: "[data-pick-ctx]:not([data-pick-ctx=\"" + POOL + "\"])"
    },
    {
      id: "switch_pool",
      title: "切回公共采集池",
      tip: "路由只能在公共采集池创建。点「下一步」自动切回「公共采集池」。",
      allow: "",
      spotlight: "[data-pick-ctx=\"" + POOL + "\"]"
    },
    {
      id: "add_bot",
      title: "添加采集号",
      tip: "点高亮旁「下一步」，或直接点「+ 添加采集号」：会自动预填并完成添加，无需手输。",
      allow: "",
      spotlight: "#tg-add-bot",
      waitEvent: "bot"
    },
    {
      id: "add_channel",
      title: "加入频道",
      tip: "点「下一步」：自动加入示例采集频道 @novice_demo_src，并备好分发频道，无需手输。",
      allow: "",
      spotlight: "[data-add-ch]",
      waitEvent: "channel"
    },
    {
      id: "add_route",
      title: "创建路由（仅公共池）",
      tip: "点「保存并完成」：自动打开新建路由并保存预填的采集源与分发目标。",
      allow: "",
      spotlight: "[data-add-route]",
      waitEvent: "route"
    }
  ];

  var NOVICE_SRC = {
    id: "ch_novice_demo_src",
    title: "@novice_demo_src",
    role: "collect"
  };
  var NOVICE_TGT = {
    id: "ch_novice_demo_tgt",
    title: "@novice_demo_tgt",
    role: "push"
  };

  var active = false;
  var dismissed = false;
  var showingDone = false;
  var stepIndex = 0;
  var root = null;
  var spot = null;
  var ackFloat = null;
  var doneMask = null;
  var waiting = "";
  var autoDriving = false;
  var autoDriveTimer = 0;
  var EXIT_KEY = "fz_tg_novice_exit";

  function beginAutoDrive(ms) {
    autoDriving = true;
    if (autoDriveTimer) clearTimeout(autoDriveTimer);
    autoDriveTimer = setTimeout(function () {
      autoDriving = false;
      autoDriveTimer = 0;
    }, ms || 8000);
  }

  function liveContextId() {
    try {
      var u = new URLSearchParams(location.search);
      return u.get("project") || u.get("ctx") || POOL;
    } catch (e) {
      return POOL;
    }
  }

  /** 教程兜底：保证当前上下文至少有一个可用采集号 */
  function ensureNoviceDemoBot() {
    if (!global.FZStore) return null;
    var st = FZStore.read();
    var ctxId = liveContextId();
    var bots = FZStore.botsForProject(st, ctxId);
    if (bots.length) return bots[0];
    var bot = {
      id: FZStore.uid("bot"),
      name: "教程采集号",
      phoneHint: "+861****8000",
      channelCount: 0,
      loginMode: "quick",
      status: "connected",
      monitoring: false
    };
    if (!st.userbots) st.userbots = [];
    st.userbots.push(bot);
    var p = FZStore.findProject(st, ctxId);
    if (p) FZStore.attachBotToProject(st, p, bot);
    FZStore.write(st);
    refreshCollect();
    return bot;
  }

  function forceFinishAddBot(msg) {
    var step = cur();
    if (!step || step.id !== "add_bot" || showingDone) return;
    var mask = document.getElementById("fz-tg-wizard-mask");
    if (mask) mask.hidden = true;
    ensureNoviceDemoBot();
    if (msg && global.FZShell) FZShell.toast(msg, "ok");
    notify("bot");
  }

  function runPrefillAddBot() {
    beginAutoDrive(8000);
    if (!global.FZStore) {
      forceFinishAddBot("已跳过添加采集号");
      return;
    }
    var st = FZStore.read();
    var ctxId = liveContextId();
    var block = FZStore.addBotToProjectBlockReason(st, ctxId);
    if (block) {
      forceFinishAddBot("本项目已有采集号，跳过添加演示");
      return;
    }
    var mask = document.getElementById("fz-tg-wizard-mask");
    if (!mask || mask.hidden) {
      var btn = document.getElementById("tg-add-bot");
      if (btn) btn.click();
    }
    setTimeout(function () {
      var wiz = document.getElementById("fz-tg-wizard-mask");
      if (!wiz || wiz.hidden) {
        forceFinishAddBot("添加向导未打开，已用示例号完成本步");
        return;
      }
      var label = document.getElementById("tg-wiz-quick-label");
      var phone = document.getElementById("tg-wiz-quick-phone");
      if (label) label.value = "教程采集号";
      if (phone) phone.value = "+8613800138000";
      var send = document.querySelector('#fz-tg-wizard-mask [data-act="quick-send"]');
      if (send) send.click();
      setTimeout(function () {
        var code = document.getElementById("tg-wiz-code");
        if (code) code.value = "12345";
        var verify = document.querySelector('#fz-tg-wizard-mask [data-act="verify"]');
        if (verify) verify.click();
        setTimeout(function () {
          var finish = document.querySelector('#fz-tg-wizard-mask [data-act="finish"]');
          if (finish) finish.click();
        }, 100);
      }, 100);
    }, 160);
    /* 向导任一步失败也不卡死 */
    setTimeout(function () {
      forceFinishAddBot("已用示例采集号完成本步");
    }, 3200);
  }

  function runPrefillAddChannel() {
    beginAutoDrive(8000);
    ensureNoviceDemoBot();
    var mask = document.getElementById("tg-ch-modal");
    if (!mask || mask.hidden) {
      var add = document.querySelector("[data-add-ch]");
      if (add) add.click();
    }
    setTimeout(function () {
      var input = document.getElementById("tg-ch-link");
      var role = document.getElementById("tg-ch-role");
      if (input) input.value = "@novice_demo_src";
      if (role) role.value = "collect";
      document.querySelectorAll("[data-ch-role]").forEach(function (b) {
        b.classList.toggle("is-active", b.getAttribute("data-ch-role") === "collect");
      });
      var save = document.getElementById("tg-ch-save");
      if (save) save.click();
      setTimeout(function () {
        var step = cur();
        if (step && step.id === "add_channel" && !showingDone) {
          var bid = currentBotId();
          if (bid) ensureNoviceRoutePair(bid);
          var chMask = document.getElementById("tg-ch-modal");
          if (chMask) chMask.hidden = true;
          if (global.FZShell) FZShell.toast("已挂上示例频道，继续下一步", "ok");
          notify("channel");
        }
      }, 800);
    }, 120);
  }

  function triggerStepAction() {
    if (!active || dismissed || showingDone) return;
    var step = cur();
    if (!step) return;
    beginAutoDrive(8000);
    if (step.id === "switch_biz" || step.id === "switch_pool") {
      var el = resolveSpotlight(step.spotlight);
      if (el) el.click();
      else advance();
      return;
    }
    if (step.id === "add_bot") {
      runPrefillAddBot();
      return;
    }
    if (step.id === "add_channel") {
      runPrefillAddChannel();
      return;
    }
    if (step.id === "add_route") {
      var rrMask = document.getElementById("tg-rr-modal");
      var saveBtn = document.getElementById("tg-rr-save");
      if (rrMask && !rrMask.hidden && saveBtn) {
        try {
          saveBtn.click();
        } catch (err) {}
        setTimeout(function () {
          if (!showingDone) showDone();
        }, 80);
        return;
      }
      var addRr = document.querySelector("[data-add-route]");
      if (addRr && (!rrMask || rrMask.hidden)) {
        addRr.click();
        setTimeout(function () {
          var save2 = document.getElementById("tg-rr-save");
          if (save2) save2.click();
          setTimeout(function () {
            if (!showingDone) showDone();
          }, 120);
        }, 140);
        return;
      }
      showDone();
    }
  }

  function esc(s) {
    return global.FZShell ? FZShell.escHtml(s) : String(s || "");
  }

  function currentBotId() {
    if (global.FZTgCollectApp && FZTgCollectApp.selectedBotId) {
      var live = FZTgCollectApp.selectedBotId();
      if (live) return live;
    }
    try {
      return new URLSearchParams(location.search).get("bot") || "";
    } catch (e) {
      return "";
    }
  }

  function refreshCollect() {
    if (global.FZTgCollectApp && FZTgCollectApp.paint) {
      try {
        FZTgCollectApp.paint();
      } catch (e) {}
    }
  }

  /**
   * 建路由需要同号下至少 1 采集 + 1 分发。教程步骤只点一次「加入」，
   * 此处补齐示例分发（及必要时补采集），避免点「新建路由」被拦。
   */
  function ensureNoviceRoutePair(botId) {
    if (!global.FZStore || !botId) return false;
    var st = FZStore.read();
    var pool = FZStore.findProject(st, POOL);
    if (!pool) return false;
    if (!pool.boundChannels) pool.boundChannels = [];
    var changed = false;
    function upsert(row) {
      var hit = pool.boundChannels.find(function (ch) {
        return ch.botId === botId && (ch.id === row.id || ch.title === row.title);
      });
      if (hit) {
        if (hit.role !== row.role) {
          hit.role = row.role;
          changed = true;
        }
        if (hit.active === false) {
          hit.active = true;
          changed = true;
        }
        return;
      }
      pool.boundChannels.unshift({
        id: row.id,
        title: row.title,
        botId: botId,
        role: row.role,
        active: true,
        boundAt: Date.now(),
        healthStatus: "OK",
        healthError: "",
        note: "教程示例"
      });
      changed = true;
    }
    upsert(NOVICE_SRC);
    upsert(NOVICE_TGT);
    if (changed) {
      if (NOVICE_SRC.role === "collect") pool.hasCollectSource = true;
      FZStore.upsertProject(st, pool);
      FZStore.write(st);
    }
    return changed;
  }

  function enabled() {
    if (dismissed) return false;
    try {
      if (sessionStorage.getItem(EXIT_KEY) === "1") return false;
      return new URLSearchParams(location.search).get("novice") === "tg_collect";
    } catch (e) {
      return false;
    }
  }

  function cur() {
    return STEPS[stepIndex] || null;
  }

  function saveStep() {
    try {
      sessionStorage.setItem(STEP_KEY, String(stepIndex));
    } catch (e) {}
  }

  function loadStep() {
    try {
      var n = parseInt(sessionStorage.getItem(STEP_KEY) || "0", 10);
      if (n >= 0 && n < STEPS.length) stepIndex = n;
    } catch (e) {}
  }

  function ensureUi() {
    if (root) return;
    root = document.createElement("div");
    root.id = "fz-tg-novice";
    root.className = "fz-tg-novice";
    root.innerHTML =
      '<div class="fz-tg-novice-bar">' +
      '<div class="fz-tg-novice-lead">' +
      '<div class="fz-tg-novice-badge">教程 Demo</div>' +
      '<p class="fz-tg-novice-fake">仅演示环境：示例已预填，点高亮旁「下一步」即可，无需手输</p>' +
      "</div>" +
      '<div class="fz-tg-novice-main">' +
      '<p class="fz-tg-novice-step" id="fz-tg-novice-step"></p>' +
      '<p class="fz-tg-novice-tip" id="fz-tg-novice-tip"></p>' +
      '<p class="fz-tg-novice-aside">旁白：开始/停止采集、启用停用、筛选分页等是基础能力，本教程不强制点；跟着高亮旁按钮走即可。</p>' +
      "</div>" +
      '<div class="fz-tg-novice-side">' +
      '<button type="button" class="btn btn-sm fz-tg-novice-exit" id="fz-tg-novice-exit">退出教程</button>' +
      "</div></div>";
    document.body.appendChild(root);
    document.getElementById("fz-tg-novice-exit").onclick = function () {
      exitTour();
    };

    spot = document.createElement("div");
    spot.id = "fz-tg-novice-spot";
    spot.className = "fz-tg-novice-spot";
    spot.hidden = true;
    document.body.appendChild(spot);

    ackFloat = document.createElement("button");
    ackFloat.type = "button";
    ackFloat.id = "fz-tg-novice-ack-float";
    ackFloat.className = "btn btn-primary fz-novice-ack-float";
    ackFloat.hidden = true;
    ackFloat.textContent = "下一步";
    document.body.appendChild(ackFloat);
    ackFloat.onclick = function () {
      triggerStepAction();
    };

    doneMask = document.createElement("div");
    doneMask.id = "fz-tg-novice-done";
    doneMask.className = "modal-mask fz-novice-done-mask";
    doneMask.hidden = true;
    doneMask.innerHTML =
      '<div class="modal fz-tg-novice-done-modal" role="dialog" aria-modal="true" aria-labelledby="fz-tg-novice-done-title">' +
      '<div class="fz-tg-novice-done-ico" aria-hidden="true">✓</div>' +
      '<h2 id="fz-tg-novice-done-title">学习完成</h2>' +
      '<p class="hint" style="margin-top:0">你已走完 TG 采集配置的主流程：切换项目 → 添加采集号 → 加入频道 → 在公共池创建路由。</p>' +
      '<div class="modal-actions modal-actions--stack">' +
      '<button type="button" class="btn btn-primary btn-block" id="fz-tg-novice-finish">完成学习</button>' +
      '<button type="button" class="btn btn-ghost btn-block" id="fz-tg-novice-replay">重新学习</button>' +
      "</div></div>";
    document.body.appendChild(doneMask);

    document.getElementById("fz-tg-novice-finish").onclick = function () {
      if (global.FZNovice && FZNovice.markDone) FZNovice.markDone("tg_collect");
      try {
        sessionStorage.removeItem(STEP_KEY);
      } catch (e) {}
      doneMask.hidden = true;
      FZShell.toast("已完成「TG 采集配置」教程", "ok");
      location.href = "./home.html";
    };
    document.getElementById("fz-tg-novice-replay").onclick = function () {
      doneMask.hidden = true;
      stepIndex = 0;
      waiting = "";
      try {
        sessionStorage.removeItem(STEP_KEY);
        sessionStorage.removeItem(EXIT_KEY);
      } catch (e) {}
      if (global.FZShell) FZShell.toast("已从头开始，请按步骤操作", "ok");
      location.href = "./tg-collect.html?novice=tg_collect";
    };
  }

  function matchesAllow(el, allow) {
    if (!el || !allow) return false;
    var parts = allow.split(",").map(function (s) {
      return s.trim();
    });
    for (var i = 0; i < parts.length; i++) {
      var sel = parts[i];
      if (!sel) continue;
      try {
        if (el.matches && el.matches(sel)) return true;
      } catch (err) {}
      /* closest 不支持「祖先 后代」复合选择器时会抛错，退化为找祖先 id/类 */
      try {
        if (el.closest && el.closest(sel)) return true;
      } catch (err2) {
        var idMatch = sel.match(/^#([A-Za-z0-9_-]+)\s+\*$/);
        if (idMatch) {
          var root = document.getElementById(idMatch[1]);
          if (root && root.contains(el)) return true;
        }
      }
    }
    return false;
  }

  function clickInsideOpenModal(el) {
    if (!el) return false;
    var masks = document.querySelectorAll(".modal-mask");
    for (var i = 0; i < masks.length; i++) {
      var m = masks[i];
      if (m.hidden || m.hasAttribute("hidden")) continue;
      if (m.id === "fz-tg-novice-done") continue;
      if (m.contains(el)) return true;
    }
    return false;
  }

  function showDone() {
    showingDone = true;
    waiting = "";
    autoDriving = false;
    if (autoDriveTimer) {
      clearTimeout(autoDriveTimer);
      autoDriveTimer = 0;
    }
    stepIndex = STEPS.length;
    saveStep();
    ensureUi();
    if (spot) spot.hidden = true;
    if (ackFloat) ackFloat.hidden = true;
    var rr = document.getElementById("tg-rr-modal");
    if (rr) rr.hidden = true;
    if (doneMask) doneMask.hidden = false;
  }

  /** 教程步骤打开的弹窗：高亮应落在弹窗上，避免 spot 遮罩把弹窗压暗 */
  var TOUR_MASK_IDS = [
    "fz-tg-wizard-mask",
    "tg-ch-modal",
    "tg-rr-modal",
    "tg-assign-modal"
  ];

  function openTourModalEl() {
    for (var i = 0; i < TOUR_MASK_IDS.length; i++) {
      var mask = document.getElementById(TOUR_MASK_IDS[i]);
      if (mask && !mask.hidden) {
        return mask.querySelector(".modal") || mask;
      }
    }
    return null;
  }

  function isSpottable(el) {
    if (!el || !el.getBoundingClientRect) return false;
    try {
      var st = window.getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden" || st.opacity === "0")
        return false;
    } catch (err) {
      return false;
    }
    var r = el.getBoundingClientRect();
    return r.width >= 2 && r.height >= 2;
  }

  function resolveSpotlight(sel) {
    if (!sel) return null;
    var nodes;
    try {
      nodes = document.querySelectorAll(sel);
    } catch (err) {
      return null;
    }
    for (var i = 0; i < nodes.length; i++) {
      if (isSpottable(nodes[i])) return nodes[i];
    }
    return null;
  }

  function placeAckFloat(r) {
    if (!ackFloat) return;
    var step = cur();
    if (!step || showingDone || dismissed || !active) {
      ackFloat.hidden = true;
      return;
    }
    ackFloat.hidden = false;
    ackFloat.textContent = step.id === "add_route" ? "保存并完成" : "下一步";
    if (!r) {
      ackFloat.style.left = "50%";
      ackFloat.style.top = "42%";
      ackFloat.style.transform = "translate(-50%, -50%)";
      return;
    }
    ackFloat.style.transform = "";
    var btnW = Math.max(ackFloat.offsetWidth || 110, 110);
    var btnH = Math.max(ackFloat.offsetHeight || 36, 36);
    var left = r.left;
    var top = r.bottom + 12;
    if (top + btnH > window.innerHeight - 16) top = Math.max(12, r.top - btnH - 12);
    if (left + btnW > window.innerWidth - 12) left = Math.max(12, window.innerWidth - btnW - 12);
    if (left < 12) left = 12;
    ackFloat.style.left = Math.round(left) + "px";
    ackFloat.style.top = Math.round(top) + "px";
  }

  function applySpotRect(el, pad) {
    var r = el.getBoundingClientRect();
    spot.hidden = false;
    spot.style.left = Math.max(8, r.left - pad) + "px";
    spot.style.top = Math.max(8, r.top - pad) + "px";
    spot.style.width = Math.ceil(r.width + pad * 2) + "px";
    spot.style.height = Math.ceil(r.height + pad * 2) + "px";
    placeAckFloat({
      left: Math.max(8, r.left - pad),
      top: Math.max(8, r.top - pad),
      bottom: Math.max(8, r.top - pad) + Math.ceil(r.height + pad * 2),
      right: 0
    });
  }

  function placeSpot() {
    if (!spot) return;
    if (showingDone || dismissed || !active) {
      spot.hidden = true;
      if (ackFloat) ackFloat.hidden = true;
      return;
    }
    var step = cur();
    if (!step || !step.spotlight) {
      spot.hidden = true;
      placeAckFloat(null);
      return;
    }
    /* 业务弹窗已打开：高亮弹窗并贴「保存并完成」 */
    var modalEl = openTourModalEl();
    if (modalEl && isSpottable(modalEl)) {
      spot.hidden = true;
      placeAckFloat(modalEl.getBoundingClientRect());
      return;
    }
    var el = resolveSpotlight(step.spotlight);
    if (!el) {
      spot.hidden = true;
      /* 无业务项目时跳过「切到业务项目」 */
      if (step.id === "switch_biz") {
        if (global.FZShell) {
          FZShell.toast("当前没有业务项目，已跳过本步", "ok");
        }
        setTimeout(function () {
          advance();
        }, 40);
      }
      return;
    }
    try {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    } catch (e) {}
    applySpotRect(el, 6);
    setTimeout(function () {
      if (!active || !spot || spot.hidden || showingDone) return;
      if (isSpottable(el)) applySpotRect(el, 6);
    }, 50);
  }

  function renderCoach() {
    ensureUi();
    var step = cur();
    if (!step) return;
    if (step.id === "add_route") {
      var routeBot = currentBotId();
      if (routeBot && ensureNoviceRoutePair(routeBot)) refreshCollect();
    }
    document.getElementById("fz-tg-novice-step").textContent =
      "第 " + (stepIndex + 1) + " / " + STEPS.length + " 步 · " + step.title;
    document.getElementById("fz-tg-novice-tip").textContent = step.tip;
    document.body.classList.add("is-tg-novice");
  }

  function advance() {
    waiting = "";
    stepIndex += 1;
    if (stepIndex >= STEPS.length) {
      showDone();
      return;
    }
    saveStep();
    renderCoach();
    placeSpot();
  }

  function onCtxPicked(ctxId) {
    if (!active || dismissed) return;
    var step = cur();
    if (!step) return;
    if (step.id === "switch_biz" && ctxId && ctxId !== POOL) advance();
    if (step.id === "switch_pool" && ctxId === POOL) advance();
  }

  function notify(kind) {
    if (!active || dismissed) return;
    if (kind === "route") {
      /* 路由保存成功：强制收口，不依赖当前步是否仍为 add_route */
      showDone();
      return;
    }
    if (showingDone) return;
    var step = cur();
    if (!step || step.waitEvent !== kind) return;
    if (kind === "channel") {
      var bid = currentBotId();
      if (bid && ensureNoviceRoutePair(bid)) refreshCollect();
    }
    if (waiting === kind || step.waitEvent === kind) advance();
  }

  function gateClick(e) {
    if (!active || dismissed) return;
    if (autoDriving) return;
    if (
      e.target.closest(
        "#fz-tg-novice, #fz-tg-novice-done, #fz-tg-novice-ack-float, .fz-novice-ack-float, #fz-help-root, .fz-help-fab"
      )
    )
      return;
    if (showingDone) {
      if (e.target.closest("#fz-tg-novice-done")) return;
      if (clickInsideOpenModal(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var step = cur();
    if (!step) return;
    /* 业务弹窗内永远放行（保存路由必须能点到） */
    if (clickInsideOpenModal(e.target)) {
      setTimeout(placeSpot, 40);
      return;
    }
    /* 点高亮目标 = 点「下一步」：避免高亮「添加」却被门禁拦死 */
    var hitSpotlight =
      (step.id === "add_bot" && e.target.closest("#tg-add-bot")) ||
      (step.id === "add_channel" && e.target.closest("[data-add-ch]")) ||
      (step.id === "add_route" && e.target.closest("[data-add-route], #tg-rr-save")) ||
      (step.id === "switch_biz" &&
        e.target.closest("[data-pick-ctx]") &&
        e.target.closest("[data-pick-ctx]").getAttribute("data-pick-ctx") !== POOL) ||
      (step.id === "switch_pool" && e.target.closest('[data-pick-ctx="' + POOL + '"]'));
    if (hitSpotlight) {
      e.preventDefault();
      e.stopPropagation();
      triggerStepAction();
      return;
    }
    if (matchesAllow(e.target, step.allow)) {
      setTimeout(placeSpot, 40);
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    if (global.FZShell) FZShell.toast("请点高亮旁的「下一步」（或高亮按钮）继续：「" + step.title + "」", "err");
  }

  function stripNoviceQuery() {
    try {
      var u = new URL(location.href);
      u.searchParams.delete("novice");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (e) {}
  }

  function exitTour() {
    if (!active && !root && dismissed) return;
    active = false;
    dismissed = true;
    showingDone = false;
    waiting = "";
    stepIndex = 0;
    try {
      sessionStorage.removeItem(STEP_KEY);
      sessionStorage.setItem(EXIT_KEY, "1");
    } catch (e) {}
    document.removeEventListener("click", gateClick, true);
    window.removeEventListener("resize", placeSpot);
    document.body.classList.remove("is-tg-novice");
    if (spot) {
      spot.remove();
      spot = null;
    }
    if (ackFloat) {
      ackFloat.remove();
      ackFloat = null;
    }
    if (doneMask) {
      doneMask.remove();
      doneMask = null;
    }
    if (root) {
      root.remove();
      root = null;
    }
    stripNoviceQuery();
    if (global.FZShell) FZShell.toast("已退出教程，返回工作台", "ok");
    location.href = "./home.html";
  }

  function start() {
    /* 工作台再次点「去学习」会带 ?novice=，允许重新进入 */
    try {
      if (new URLSearchParams(location.search).get("novice") === "tg_collect") {
        sessionStorage.removeItem(EXIT_KEY);
        dismissed = false;
      }
    } catch (e) {}
    if (!enabled()) return;
    if (active && root) {
      renderCoach();
      placeSpot();
      return;
    }
    active = true;
    dismissed = false;
    showingDone = false;
    loadStep();
    /* 若本地已完成教程又从任务进来，从 0 开始演示 */
    if (global.FZNovice && FZNovice.isDone && FZNovice.isDone(FZStore.read(), "tg_collect")) {
      stepIndex = 0;
    }
    if (stepIndex >= STEPS.length) {
      ensureUi();
      showDone();
      document.addEventListener("click", gateClick, true);
      return;
    }
    ensureUi();
    renderCoach();
    document.addEventListener("click", gateClick, true);
    window.addEventListener("resize", placeSpot);
    if (!document.documentElement.getAttribute("data-tg-novice-obs")) {
      document.documentElement.setAttribute("data-tg-novice-obs", "1");
      try {
        new MutationObserver(function () {
          if (active) placeSpot();
        }).observe(document.body, {
          attributes: true,
          subtree: true,
          attributeFilter: ["hidden"],
          childList: true
        });
      } catch (err) {}
    }
    setTimeout(placeSpot, 80);
    setTimeout(placeSpot, 320);
  }

  function onPaint() {
    if (!active || dismissed) return;
    renderCoach();
    placeSpot();
  }

  global.FZTgNovice = {
    start: start,
    exit: exitTour,
    onPaint: onPaint,
    onCtxPicked: onCtxPicked,
    notify: notify,
    complete: showDone,
    ensureRoutePair: ensureNoviceRoutePair,
    active: function () {
      return active && !dismissed && !showingDone;
    },
    dismissed: function () {
      return !!dismissed;
    }
  };
})(window);
