/* TG 采集 · 新手教程试做：仅 ?novice=tg_collect 启用；强制分步；结束弹窗 */
(function (global) {
  var POOL = "proj_public_pool";
  var STEP_KEY = "fz_tg_novice_step";

  var STEPS = [
    {
      id: "switch_biz",
      title: "切换到业务项目",
      tip: "先点一张业务项目卡片，看看「项目内采集」和公共池有什么不同。",
      allow: "[data-pick-ctx]:not([data-pick-ctx=\"" + POOL + "\"])",
      spotlight: "[data-pick-ctx]:not([data-pick-ctx=\"" + POOL + "\"])"
    },
    {
      id: "switch_pool",
      title: "切回公共池",
      tip: "路由只能在公共池创建。请点「公共池」，后面要在这里建 TG→TG 路由。",
      allow: "[data-pick-ctx=\"" + POOL + "\"]",
      spotlight: "[data-pick-ctx=\"" + POOL + "\"]"
    },
    {
      id: "add_bot",
      title: "添加采集号",
      tip: "点左侧「+ 添加」。Demo 里验证码随便填非空即可模拟登录成功。",
      allow: "#tg-add-bot, #fz-tg-wizard-mask, #fz-tg-wizard-mask *",
      spotlight: "#tg-add-bot",
      waitEvent: "bot"
    },
    {
      id: "add_channel",
      title: "加入频道",
      tip: "点「+ 加入频道」。已帮你填好示例 @novice_demo_src，直接确认即可（公共池请选「采集」）。",
      allow:
        "[data-add-ch], #tg-ch-modal, #tg-ch-modal *, [data-pick-bot], .tg-bot-item, .tg-bot-item *",
      spotlight: "[data-add-ch]",
      waitEvent: "channel",
      prefillChannel: true
    },
    {
      id: "add_route",
      title: "创建路由（仅公共池）",
      tip: "点「+ 新建路由」：选一个采集源，勾至少一个分发目标，保存。若还没有分发频道，可先加入一个用途为「分发」的频道。",
      allow:
        "[data-add-route], #tg-rr-modal, #tg-rr-modal *, [data-add-ch], #tg-ch-modal, #tg-ch-modal *, [data-ch-role], [data-ch-role] *, [data-assign-pick], #tg-assign-modal, #tg-assign-modal *",
      spotlight: "[data-add-route]",
      waitEvent: "route"
    }
  ];

  var active = false;
  var dismissed = false;
  var stepIndex = 0;
  var root = null;
  var spot = null;
  var doneMask = null;
  var waiting = "";
  var EXIT_KEY = "fz_tg_novice_exit";

  function esc(s) {
    return global.FZShell ? FZShell.escHtml(s) : String(s || "");
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
      '<p class="fz-tg-novice-fake">仅演示环境，可随意填写，不会产生真实操作</p>' +
      "</div>" +
      '<div class="fz-tg-novice-main">' +
      '<p class="fz-tg-novice-step" id="fz-tg-novice-step"></p>' +
      '<p class="fz-tg-novice-tip" id="fz-tg-novice-tip"></p>' +
      '<p class="fz-tg-novice-aside">旁白：连接/断开、启用停用、筛选分页等是基础能力，本教程不强制点；跟着高亮走主流程即可。</p>' +
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
      saveStep();
      renderCoach();
      placeSpot();
      FZShell.toast("已从头开始，请按步骤操作", "ok");
    };
  }

  function matchesAllow(el, allow) {
    if (!el || !allow) return false;
    var parts = allow.split(",").map(function (s) {
      return s.trim();
    });
    for (var i = 0; i < parts.length; i++) {
      try {
        if (el.closest && el.closest(parts[i])) return true;
        if (el.matches && el.matches(parts[i])) return true;
      } catch (err) {}
    }
    return false;
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

  function applySpotRect(el, pad) {
    var r = el.getBoundingClientRect();
    spot.hidden = false;
    spot.style.left = Math.max(8, r.left - pad) + "px";
    spot.style.top = Math.max(8, r.top - pad) + "px";
    spot.style.width = Math.ceil(r.width + pad * 2) + "px";
    spot.style.height = Math.ceil(r.height + pad * 2) + "px";
  }

  function placeSpot() {
    if (!spot) return;
    var step = cur();
    if (!step || !step.spotlight) {
      spot.hidden = true;
      return;
    }
    var modalEl = openTourModalEl();
    if (modalEl && !isSpottable(modalEl)) modalEl = null;
    var el = modalEl || resolveSpotlight(step.spotlight);
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
    var pad = modalEl ? 8 : 6;
    if (!modalEl) {
      try {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      } catch (e) {}
    }
    applySpotRect(el, pad);
    if (!modalEl) {
      setTimeout(function () {
        if (!active || !spot || spot.hidden) return;
        if (isSpottable(el)) applySpotRect(el, pad);
      }, 50);
    }
  }

  function renderCoach() {
    ensureUi();
    var step = cur();
    if (!step) return;
    document.getElementById("fz-tg-novice-step").textContent =
      "第 " + (stepIndex + 1) + " / " + STEPS.length + " 步 · " + step.title;
    document.getElementById("fz-tg-novice-tip").textContent = step.tip;
    document.body.classList.add("is-tg-novice");
  }

  function advance() {
    waiting = "";
    stepIndex += 1;
    if (stepIndex >= STEPS.length) {
      saveStep();
      ensureUi();
      doneMask.hidden = false;
      if (spot) spot.hidden = true;
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
    var step = cur();
    if (!step || step.waitEvent !== kind) return;
    if (waiting === kind || step.waitEvent === kind) advance();
  }

  function gateClick(e) {
    if (!active || dismissed) return;
    if (e.target.closest("#fz-tg-novice, #fz-tg-novice-done, #fz-help-root, .fz-help-fab"))
      return;
    var step = cur();
    if (!step) return;
    if (matchesAllow(e.target, step.allow)) {
      if (e.target.closest("[data-add-ch]")) {
        setTimeout(function () {
          var input = document.getElementById("tg-ch-link");
          var role = document.getElementById("tg-ch-role");
          var wantPush = step.id === "add_route";
          var roleVal = wantPush ? "push" : "collect";
          var demo = wantPush ? "@novice_demo_tgt" : "@novice_demo_src";
          if (input) input.value = demo;
          if (role) role.value = roleVal;
          document.querySelectorAll("[data-ch-role]").forEach(function (b) {
            b.classList.toggle(
              "is-active",
              b.getAttribute("data-ch-role") === roleVal
            );
          });
          placeSpot();
        }, 60);
      } else if (
        e.target.closest("#tg-add-bot, [data-add-route], [data-ch-assign]")
      ) {
        setTimeout(placeSpot, 40);
        setTimeout(placeSpot, 160);
      }
      return;
    }
    /* 已有遮罩打开时，放行遮罩内操作（避免卡死） */
    var openMask = document.querySelector(".modal-mask:not([hidden])");
    if (openMask && openMask.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();
    if (global.FZShell) FZShell.toast("请先完成当前教程步骤：" + step.title, "err");
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
    loadStep();
    /* 若本地已完成教程又从任务进来，从 0 开始演示 */
    if (global.FZNovice && FZNovice.isDone && FZNovice.isDone(FZStore.read(), "tg_collect")) {
      stepIndex = 0;
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
    active: function () {
      return active && !dismissed;
    },
    dismissed: function () {
      return !!dismissed;
    }
  };
})(window);
