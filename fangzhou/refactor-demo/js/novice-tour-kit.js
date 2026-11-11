/* 页内分步教程通用壳：教练条 / 挖洞高亮 / 点击门禁 / 退出 / 完成 */
(function (global) {
  var SHARED_CSS = "is-novice-tour";

  function createTour(cfg) {
    cfg = cfg || {};
    var tourId = cfg.id || "tour";
    var STEPS = cfg.steps || [];
    var STEP_KEY = "fz_novice_step_" + tourId;
    var EXIT_KEY = "fz_novice_exit_" + tourId;
    var modalMaskIds = cfg.modalMaskIds || [];
    var uid = "fz-novice-" + tourId;

    var active = false;
    var dismissed = false;
    var showingDone = false;
    var stepIndex = 0;
    var root = null;
    var spot = null;
    var ackFloat = null;
    var doneMask = null;
    var waiting = "";
    var api = null;
    var spotRaf = 0;
    var mutObs = null;
    var runId = 0;
    var lastSpotEl = null;
    /** 点「下一步」时代点页面时放行门禁，避免 allow 为空时拦掉程序点击 */
    var autoDriving = false;
    var autoDriveTimer = 0;

    function enabled() {
      if (dismissed) return false;
      try {
        if (sessionStorage.getItem(EXIT_KEY) === "1") return false;
        return new URLSearchParams(location.search).get("novice") === tourId;
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

    function matchesSelectorList(el, list) {
      if (!el || !list) return false;
      var parts = String(list)
        .split(",")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      for (var i = 0; i < parts.length; i++) {
        var sel = parts[i];
        try {
          if (el.matches && el.matches(sel)) return true;
        } catch (err) {}
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

    function matchesAllow(el, allow) {
      return matchesSelectorList(el, allow);
    }

    function matchesBlock(el, block) {
      return matchesSelectorList(el, block);
    }

    function openTourModalEl() {
      for (var i = 0; i < modalMaskIds.length; i++) {
        var mask = document.getElementById(modalMaskIds[i]);
        if (mask && !mask.hidden) {
          return (
            mask.querySelector(".modal, .mat-detail, .mat-xfer, .mat-reject, .mat-targets") ||
            mask
          );
        }
      }
      var any = document.querySelector(".modal-mask:not([hidden]), .mat-detail-mask:not([hidden]), .mat-xfer-mask:not([hidden])");
      if (any && modalMaskIds.length) {
        /* 仅当配置了 mask 列表时，才把未登记遮罩也高亮 */
      }
      return null;
    }

    function ensureUi() {
      if (root) return;
      root = document.createElement("div");
      root.id = uid;
      root.className = "fz-novice-tour fz-tg-novice";
      root.innerHTML =
        '<div class="fz-tg-novice-bar">' +
        '<div class="fz-tg-novice-lead">' +
        '<div class="fz-tg-novice-badge">教程 Demo</div>' +
        '<p class="fz-tg-novice-fake">仅演示环境：示例已预填，点高亮旁「下一步」即可，无需手输</p>' +
        "</div>" +
        '<div class="fz-tg-novice-main">' +
        '<p class="fz-tg-novice-step" id="' +
        uid +
        '-step"></p>' +
        '<p class="fz-tg-novice-tip" id="' +
        uid +
        '-tip"></p>' +
        '<p class="fz-tg-novice-aside">' +
        (cfg.aside ||
          "旁白：筛选、分页、启用停用等是基础能力，本教程不强制点；跟着高亮走主流程即可。") +
        "</p></div>" +
        '<div class="fz-tg-novice-side">' +
        '<button type="button" class="btn btn-sm fz-tg-novice-exit" id="' +
        uid +
        '-exit">退出教程</button>' +
        "</div></div>";
      document.body.appendChild(root);
      document.getElementById(uid + "-exit").onclick = function () {
        exitTour();
      };

      spot = document.createElement("div");
      spot.id = uid + "-spot";
      spot.className = "fz-tg-novice-spot";
      spot.hidden = true;
      document.body.appendChild(spot);

      /* 确认了解 / 下一步：贴在高亮旁，不放底部教练条 */
      ackFloat = document.createElement("button");
      ackFloat.type = "button";
      ackFloat.id = uid + "-ack-float";
      ackFloat.className = "btn btn-primary fz-novice-ack-float";
      ackFloat.hidden = true;
      ackFloat.textContent = "确认了解";
      document.body.appendChild(ackFloat);
      function onAckFloatClick(e) {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (!active || dismissed || showingDone) return;
        var step = cur();
        if (!step || !(step.ack || step.ackLabel)) return;
        beginAutoDrive(12000);
        if (typeof step.onAck === "function") {
          try {
            step.onAck(api);
          } catch (err) {}
          return;
        }
        advance();
      }
      ackFloat.addEventListener("click", onAckFloatClick, true);
      ackFloat.onclick = onAckFloatClick;

      doneMask = document.createElement("div");
      doneMask.id = uid + "-done";
      doneMask.className = "modal-mask fz-novice-done-mask";
      doneMask.hidden = true;
      doneMask.innerHTML =
        '<div class="modal fz-tg-novice-done-modal" role="dialog" aria-modal="true">' +
        '<div class="fz-tg-novice-done-ico" aria-hidden="true">✓</div>' +
        "<h2>学习完成</h2>" +
        '<p class="hint" style="margin-top:0">' +
        (cfg.doneSummary || "你已走完本模块主流程。") +
        "</p>" +
        '<div class="modal-actions modal-actions--stack">' +
        '<button type="button" class="btn btn-primary btn-block" id="' +
        uid +
        '-finish">完成学习</button>' +
        '<button type="button" class="btn btn-ghost btn-block" id="' +
        uid +
        '-replay">重新学习</button>' +
        "</div></div>";
      document.body.appendChild(doneMask);

      document.getElementById(uid + "-finish").onclick = function () {
        if (global.FZNovice && FZNovice.markDone) FZNovice.markDone(tourId);
        try {
          sessionStorage.removeItem(STEP_KEY);
        } catch (e) {}
        doneMask.hidden = true;
        if (global.FZShell) {
          FZShell.toast("已完成「" + (cfg.title || tourId) + "」教程", "ok");
        }
        location.href = "./home.html";
      };
      document.getElementById(uid + "-replay").onclick = function () {
        replayTour();
      };
    }

    /** 重新学习：清进度并回到教程入口（默认整页重进，避免停在完成态） */
    function replayTour() {
      runId += 1;
      showingDone = false;
      waiting = "";
      stepIndex = 0;
      try {
        sessionStorage.removeItem(STEP_KEY);
        sessionStorage.removeItem(EXIT_KEY);
      } catch (e) {}
      if (doneMask) doneMask.hidden = true;
      if (spot) spot.hidden = true;
      if (typeof cfg.onReplay === "function") {
        try {
          cfg.onReplay(api);
        } catch (err) {}
        return;
      }
      var href = cfg.replayHref;
      if (!href) {
        try {
          var u = new URL(location.href);
          u.searchParams.set("novice", tourId);
          href = u.pathname + u.search + u.hash;
        } catch (e2) {
          href = location.href;
        }
      }
      if (global.FZShell) FZShell.toast("已从头开始，请按步骤操作", "ok");
      location.href = href;
    }

    function scheduleSpot() {
      if (spotRaf) return;
      spotRaf = requestAnimationFrame(function () {
        spotRaf = 0;
        placeSpot();
      });
    }

    function beginAutoDrive(ms) {
      autoDriving = true;
      if (autoDriveTimer) clearTimeout(autoDriveTimer);
      autoDriveTimer = setTimeout(function () {
        autoDriving = false;
        autoDriveTimer = 0;
      }, ms || 2000);
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
      clearAckShield();
      doneMask.hidden = false;
      if (spotRaf) {
        cancelAnimationFrame(spotRaf);
        spotRaf = 0;
      }
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

    /** 逗号选择器里取第一个「可见且有尺寸」的节点，避免 display:none 的跳过钮把高亮钉到 0,0 */
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
      placeAckFloat(r);
    }

    function clearAckShield() {
      document.querySelectorAll("[data-novice-ack-shield]").forEach(function (el) {
        el.removeAttribute("data-novice-ack-shield");
      });
    }

    function placeAckFloat(anchorRect) {
      if (!ackFloat) return;
      var step = cur();
      var needAck = !!(step && (step.ack || step.ackLabel));
      if (!needAck || showingDone || dismissed || !active) {
        ackFloat.hidden = true;
        clearAckShield();
        return;
      }
      ackFloat.hidden = false;
      ackFloat.textContent = step.ackLabel || "确认了解";
      /* 高亮目标不抢点击，避免与浮层叠在一起「点不动」 */
      clearAckShield();
      if (lastSpotEl) lastSpotEl.setAttribute("data-novice-ack-shield", "1");
      var r = anchorRect;
      if (!r && lastSpotEl && lastSpotEl.getBoundingClientRect) {
        r = lastSpotEl.getBoundingClientRect();
      }
      if (!r && spot && !spot.hidden) {
        r = spot.getBoundingClientRect();
      }
      if (!r) {
        ackFloat.style.left = "50%";
        ackFloat.style.top = "40%";
        ackFloat.style.transform = "translate(-50%, -50%)";
        return;
      }
      ackFloat.style.transform = "";
      var btnW = Math.max(ackFloat.offsetWidth || 110, 110);
      var btnH = Math.max(ackFloat.offsetHeight || 40, 40);
      /* 优先放在高亮左侧，避免盖住页脚「下一步」 */
      var left = r.left - btnW - 14;
      var top = r.top + (r.height - btnH) / 2;
      if (left < 12) {
        left = r.left;
        top = r.bottom + 14;
      }
      if (top + btnH > window.innerHeight - 16) {
        top = Math.max(12, r.top - btnH - 14);
      }
      if (left + btnW > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - btnW - 12);
      }
      if (left < 12) left = 12;
      if (top < 12) top = 12;
      ackFloat.style.left = Math.round(left) + "px";
      ackFloat.style.top = Math.round(top) + "px";
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
      var modalEl = openTourModalEl();
      if (modalEl && !isSpottable(modalEl)) modalEl = null;
      var el = modalEl || resolveSpotlight(step.spotlight);
      if (!el) {
        spot.hidden = true;
        placeAckFloat(null);
        if (step.skipIfMissing) {
          var skipAt = runId;
          setTimeout(function () {
            if (skipAt !== runId || showingDone || dismissed) return;
            if (!resolveSpotlight(step.spotlight)) advance();
          }, 80);
        }
        return;
      }
      lastSpotEl = el;
      var pad = modalEl ? 8 : 6;
      if (!modalEl) {
        try {
          el.scrollIntoView({ block: "nearest", inline: "nearest" });
        } catch (e) {}
      }
      applySpotRect(el, pad);
      /* 滚动后再量一次，避免位置漂移 */
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
      document.getElementById(uid + "-step").textContent =
        "第 " + (stepIndex + 1) + " / " + STEPS.length + " 步 · " + step.title;
      document.getElementById(uid + "-tip").textContent = step.tip || "";
      document.body.classList.add(SHARED_CSS, "is-tg-novice");
      scheduleSpot();
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
      scheduleSpot();
      if (typeof cfg.onStep === "function") cfg.onStep(cur(), stepIndex, api);
    }

    function notify(kind) {
      if (!active || dismissed || showingDone) return;
      var step = cur();
      if (!step || step.waitEvent !== kind) return;
      advance();
    }

    /** 强制收口到「学习完成」（创建成功等场景，不依赖当前步） */
    function complete() {
      if (dismissed) return;
      if (!active) {
        active = true;
        dismissed = false;
      }
      showDone();
    }

    function isLeavePageLink(el) {
      var a = el && el.closest ? el.closest("a[href]") : null;
      if (!a) return null;
      var href = (a.getAttribute("href") || "").trim();
      if (!href || href.charAt(0) === "#" || href.indexOf("javascript:") === 0)
        return null;
      try {
        var u = new URL(href, location.href);
        if (u.pathname === location.pathname && u.search === location.search)
          return null;
        return a;
      } catch (err) {
        return a;
      }
    }

    function clickInsideOpenModal(el) {
      if (!el) return false;
      var sels = [
        ".modal-mask",
        ".mat-detail-mask",
        ".mat-xfer-mask",
        ".mat-reject-mask",
        ".mat-targets-mask"
      ];
      for (var s = 0; s < sels.length; s++) {
        var nodes = document.querySelectorAll(sels[s]);
        for (var i = 0; i < nodes.length; i++) {
          var m = nodes[i];
          if (m.hidden) continue;
          if (m.contains(el)) return true;
        }
      }
      return false;
    }

    function gateClick(e) {
      if (!active || dismissed) return;
      if (autoDriving) return;
      if (
        e.target.closest(
          "#" +
            uid +
            ", #" +
            uid +
            "-done, #" +
            uid +
            "-ack-float, #fz-help-root, .fz-help-fab, .fz-novice-ack-float"
        )
      ) {
        return;
      }
      /* 完成弹层已出时，仍放行业务弹窗内操作（避免「通过」理由框被锁死） */
      if (showingDone) {
        if (clickInsideOpenModal(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      var step = cur();
      if (!step) return;

      /* 教程期间禁止跳进真实产品页；完成/退出只回工作台 */
      var leave = isLeavePageLink(e.target);
      if (leave && !matchesAllow(leave, step.allow)) {
        e.preventDefault();
        e.stopPropagation();
        if (global.FZShell) {
          FZShell.toast(
            "教程进行中不会进入其他功能，请继续当前步骤，或点「退出教程」回工作台",
            "err"
          );
        }
        return;
      }

      if (matchesBlock(e.target, step.block)) {
        e.preventDefault();
        e.stopPropagation();
        if (global.FZShell) {
          FZShell.toast(
            step.blockToast || "本教程不走这条操作，请按高亮或「下一步」继续",
            "err"
          );
        }
        return;
      }

      /* 弹层内：strict 步仍按 allow 收口；非 strict 整窗放行（兼容 TG 等二次窗） */
      if (clickInsideOpenModal(e.target)) {
        if (step.strict && !matchesAllow(e.target, step.allow)) {
          e.preventDefault();
          e.stopPropagation();
          if (global.FZShell) {
            FZShell.toast(strictToast(step), "err");
          }
          return;
        }
        if (typeof step.onAllowClick === "function" && matchesAllow(e.target, step.allow)) {
          try {
            step.onAllowClick(e, api);
          } catch (err) {}
        }
        setTimeout(scheduleSpot, 40);
        setTimeout(scheduleSpot, 160);
        return;
      }

      if (matchesAllow(e.target, step.allow)) {
        if (typeof step.onAllowClick === "function") {
          try {
            step.onAllowClick(e, api);
          } catch (err) {}
        }
        if (step.waitEvent) {
          setTimeout(scheduleSpot, 40);
          setTimeout(scheduleSpot, 160);
          return;
        }
        if (step.clickAdvance) {
          setTimeout(function () {
            advance();
          }, 30);
          return;
        }
        setTimeout(scheduleSpot, 40);
        setTimeout(scheduleSpot, 160);
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      if (global.FZShell) {
        FZShell.toast(strictToast(step), "err");
      }
    }

    function strictToast(step) {
      if (step && (step.ack || step.ackLabel)) {
        return (
          "请按教程操作：点「" +
          (step.ackLabel || "确认了解") +
          "」继续（" +
          step.title +
          "）"
        );
      }
      return "请先完成当前教程步骤：" + ((step && step.title) || "");
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
      window.removeEventListener("resize", scheduleSpot);
      if (mutObs) {
        try {
          mutObs.disconnect();
        } catch (e2) {}
        mutObs = null;
      }
      if (spotRaf) {
        cancelAnimationFrame(spotRaf);
        spotRaf = 0;
      }
      document.body.classList.remove(SHARED_CSS, "is-tg-novice");
      if (spot) {
        spot.remove();
        spot = null;
      }
      clearAckShield();
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
      if (typeof cfg.onExit === "function") {
        try {
          cfg.onExit(api);
        } catch (err) {}
        return;
      }
      if (global.FZShell) {
        FZShell.toast(cfg.exitToast || "已退出教程，返回工作台", "ok");
      }
      location.href = cfg.exitHref || "./home.html";
    }

    function start() {
      try {
        if (new URLSearchParams(location.search).get("novice") === tourId) {
          sessionStorage.removeItem(EXIT_KEY);
          dismissed = false;
        }
      } catch (e) {}
      if (!enabled()) return;
      if (active && root) {
        if (showingDone || stepIndex >= STEPS.length) {
          showDone();
          return;
        }
        renderCoach();
        scheduleSpot();
        return;
      }
      active = true;
      dismissed = false;
      showingDone = false;
      loadStep();
      if (
        global.FZNovice &&
        FZNovice.isDone &&
        FZNovice.isDone(FZStore.read(), tourId)
      ) {
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
      window.addEventListener("resize", scheduleSpot);
      if (!mutObs) {
        try {
          mutObs = new MutationObserver(function (mutations) {
            if (!active || showingDone || dismissed) return;
            for (var i = 0; i < mutations.length; i++) {
              var t = mutations[i].target;
              if (t === spot || t === root || t === doneMask) continue;
              if (spot && spot.contains && spot.contains(t)) continue;
              if (root && root.contains && root.contains(t)) continue;
              if (doneMask && doneMask.contains && doneMask.contains(t)) continue;
              scheduleSpot();
              return;
            }
          });
          mutObs.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ["hidden"],
            childList: true
          });
        } catch (err) {}
      }
      setTimeout(scheduleSpot, 80);
      setTimeout(scheduleSpot, 320);
      if (typeof cfg.onStart === "function") cfg.onStart(api);
    }

    function onPaint() {
      if (!active || dismissed || showingDone) return;
      renderCoach();
      scheduleSpot();
    }

    api = {
      id: tourId,
      start: start,
      exit: exitTour,
      onPaint: onPaint,
      notify: notify,
      advance: advance,
      complete: complete,
      replay: replayTour,
      placeSpot: placeSpot,
      active: function () {
        return active && !dismissed;
      },
      dismissed: function () {
        return !!dismissed;
      },
      cur: cur,
      stepIndex: function () {
        return stepIndex;
      }
    };
    return api;
  }

  global.FZNoviceTour = {
    create: createTour
  };
})(window);
