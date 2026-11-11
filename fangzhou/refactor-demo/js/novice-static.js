/* 新手教程 · 真实页 1:1 嵌入
 * 内层 iframe = 业务页原样；外层仅「下一步 / 退出 / 完成 / 重新学习」可点。
 */
(function (global) {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function ensureChrome(cfg) {
    if (document.getElementById("novice-chrome")) return;
    var bar = document.createElement("div");
    bar.id = "novice-chrome";
    bar.className = "novice-static-chrome";
    bar.innerHTML =
      '<div class="novice-static-bar">' +
      '<div class="novice-static-bar-badge">教程 Demo</div>' +
      '<div class="novice-static-bar-main">' +
      '<p class="novice-static-bar-step" id="novice-step-label"></p>' +
      '<div class="novice-static-bar-tip" id="novice-tip"></div>' +
      "</div>" +
      '<div class="novice-static-bar-actions">' +
      '<button type="button" class="btn btn-primary" id="novice-next">下一步</button>' +
      '<button type="button" class="btn btn-ghost" id="novice-exit">退出</button>' +
      "</div></div>";
    document.body.appendChild(bar);

    var spot = document.createElement("div");
    spot.id = "novice-spot";
    spot.className = "novice-spot novice-spot--fixed";
    spot.hidden = true;
    document.body.appendChild(spot);

    var done = document.createElement("div");
    done.id = "novice-done";
    done.className = "modal-mask fz-novice-done-mask";
    done.hidden = true;
    done.innerHTML =
      '<div class="modal fz-tg-novice-done-modal" role="dialog" aria-modal="true">' +
      '<div class="fz-tg-novice-done-ico" aria-hidden="true">✓</div>' +
      "<h2>学习完成</h2>" +
      '<p class="hint" style="margin-top:0">' +
      esc(cfg.doneSummary || "你已完成本教程演示。") +
      "</p>" +
      '<div class="modal-actions modal-actions--stack">' +
      '<button type="button" class="btn btn-primary btn-block" id="novice-finish">完成学习</button>' +
      '<button type="button" class="btn btn-ghost btn-block" id="novice-replay">重新学习</button>' +
      "</div></div>";
    document.body.appendChild(done);
  }

  function boot(cfg) {
    cfg = cfg || {};
    var steps = cfg.steps || [];
    var tourId = cfg.id || "";
    var homeHref = cfg.homeHref || "../home.html";
    var frame = document.getElementById("novice-frame");
    if (!frame || !steps.length) return;

    document.body.classList.add("novice-frame-page");
    ensureChrome(cfg);

    var idx = 0;
    var chrome = document.getElementById("novice-chrome");
    var spot = document.getElementById("novice-spot");
    var stepEl = document.getElementById("novice-step-label");
    var tipEl = document.getElementById("novice-tip");
    var nextBtn = document.getElementById("novice-next");
    var exitBtn = document.getElementById("novice-exit");
    var doneMask = document.getElementById("novice-done");
    var finishBtn = document.getElementById("novice-finish");
    var replayBtn = document.getElementById("novice-replay");
    var driving = false;
    var activeFrameSrc = "";
    var defaultFrameSrc = frame.getAttribute("data-src") || frame.src;

    function win() {
      try {
        return frame.contentWindow;
      } catch (e) {
        return null;
      }
    }

    function doc() {
      try {
        return frame.contentDocument;
      } catch (e) {
        return null;
      }
    }

    function api() {
      return {
        win: win,
        doc: doc,
        qs: function (sel) {
          var d = doc();
          return d ? d.querySelector(sel) : null;
        },
        qsa: function (sel) {
          var d = doc();
          return d ? d.querySelectorAll(sel) : [];
        },
        click: function (sel) {
          var el = typeof sel === "string" ? api().qs(sel) : sel;
          if (el && el.click) el.click();
        },
        advance: function () {
          /* 供 run 内主动跳步；默认仍由外层「下一步」控制 */
        },
        hide: function (sel) {
          var el = typeof sel === "string" ? api().qs(sel) : sel;
          if (el) el.hidden = true;
        },
        show: function (sel) {
          var el = typeof sel === "string" ? api().qs(sel) : sel;
          if (el) el.hidden = false;
        },
        closeWizard: function () {
          var w = win();
          if (w && w.FZTgWizard && w.FZTgWizard.close) w.FZTgWizard.close();
        }
      };
    }

    function clearSpot() {
      if (spot) spot.hidden = true;
    }

    function placeChromeNear(spotRect) {
      if (!chrome) return;
      chrome.hidden = false;
      var gap = 14;
      var pad = 12;
      var cw = chrome.offsetWidth || 300;
      var ch = chrome.offsetHeight || 220;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var left;
      var top;
      var r = spotRect;

      if (!r) {
        left = (vw - cw) / 2;
        top = (vh - ch) / 2;
      } else {
        var rightSpace = vw - r.right - pad;
        var leftSpace = r.left - pad;
        var belowSpace = vh - r.bottom - pad;
        var aboveSpace = r.top - pad;

        if (rightSpace >= cw + gap) {
          left = r.right + gap;
          top = r.top + (r.height - ch) / 2;
        } else if (leftSpace >= cw + gap) {
          left = r.left - cw - gap;
          top = r.top + (r.height - ch) / 2;
        } else if (belowSpace >= Math.min(ch, 220) + gap) {
          left = r.left + (r.width - cw) / 2;
          top = r.bottom + gap;
        } else if (aboveSpace >= Math.min(ch, 220) + gap) {
          left = r.left + (r.width - cw) / 2;
          top = r.top - ch - gap;
        } else {
          left = Math.max(pad, Math.min(vw - cw - pad, r.right + gap));
          top = Math.max(pad, Math.min(vh - ch - pad, r.top));
        }
      }

      if (left + cw > vw - pad) left = vw - cw - pad;
      if (left < pad) left = pad;
      if (top + ch > vh - pad) top = vh - ch - pad;
      if (top < pad) top = pad;
      chrome.style.left = Math.round(left) + "px";
      chrome.style.top = Math.round(top) + "px";
    }

    function resolveInFrame(sel) {
      var d = doc();
      if (!d || !sel) return null;
      var parts = String(sel)
        .split(",")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      for (var i = 0; i < parts.length; i++) {
        var nodes;
        try {
          nodes = d.querySelectorAll(parts[i]);
        } catch (e) {
          continue;
        }
        for (var j = 0; j < nodes.length; j++) {
          var el = nodes[j];
          try {
            var st = d.defaultView.getComputedStyle(el);
            if (st.display === "none" || st.visibility === "hidden") continue;
          } catch (e2) {}
          var r = el.getBoundingClientRect();
          if (r.width >= 2 && r.height >= 2) return el;
        }
      }
      return null;
    }

    function placeSpot(sel) {
      if (!spot || !sel) {
        clearSpot();
        placeChromeNear(null);
        return;
      }
      var el = resolveInFrame(sel);
      if (!el) {
        clearSpot();
        placeChromeNear(null);
        return;
      }
      try {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      } catch (e) {}
      var fr = frame.getBoundingClientRect();
      var r = el.getBoundingClientRect();
      var spotRect = {
        left: fr.left + r.left - 6,
        top: fr.top + r.top - 6,
        right: fr.left + r.right + 6,
        bottom: fr.top + r.bottom + 6,
        width: r.width + 12,
        height: r.height + 12
      };
      spot.hidden = false;
      spot.style.left = Math.round(spotRect.left) + "px";
      spot.style.top = Math.round(spotRect.top) + "px";
      spot.style.width = Math.ceil(spotRect.width) + "px";
      spot.style.height = Math.ceil(spotRect.height) + "px";
      placeChromeNear(spotRect);
    }

    function lockFrame() {
      var d = doc();
      if (!d || !d.documentElement) return;
      d.documentElement.classList.add("is-novice-static-frame");
      try {
        d.body.style.pointerEvents = "none";
      } catch (e) {}
    }

    function scheduleSpot(sel, delayMs) {
      var base = typeof delayMs === "number" ? delayMs : 80;
      var times = [base, base + 200, base + 480, base + 900];
      times.forEach(function (t) {
        setTimeout(function () {
          if (steps[idx] && steps[idx].spot === sel) placeSpot(sel);
        }, t);
      });
    }

    function renderTip(step) {
      if (!tipEl) return;
      var blocks = step.tipBlocks;
      if (blocks && blocks.length) {
        tipEl.innerHTML = blocks
          .map(function (b) {
            return (
              '<section class="novice-tip-block">' +
              (b.label
                ? '<div class="novice-tip-label">' + esc(b.label) + "</div>"
                : "") +
              '<p class="novice-tip-text">' +
              esc(b.text || "").replace(/\n/g, "<br>") +
              "</p></section>"
            );
          })
          .join("");
        return;
      }
      var tip = String(step.tip || "").trim();
      if (!tip) {
        tipEl.innerHTML = "";
        return;
      }
      tipEl.innerHTML = tip
        .split(/\n\n+/)
        .map(function (p) {
          return (
            '<p class="novice-tip-text">' +
            esc(p).replace(/\n/g, "<br>") +
            "</p>"
          );
        })
        .join("");
    }

    function normSrc(s) {
      try {
        var u = new URL(String(s || ""), location.href);
        return u.pathname + u.search;
      } catch (e) {
        return String(s || "");
      }
    }

    function applyStepUi(step) {
      if (doneMask) doneMask.hidden = true;
      document.body.classList.remove("is-novice-done");
      if (chrome) chrome.hidden = false;
      if (stepEl) {
        stepEl.textContent =
          "第 " + (idx + 1) + " / " + steps.length + " 步 · " + (step.title || "");
      }
      renderTip(step);
      nextBtn.textContent = idx >= steps.length - 1 ? "完成" : "下一步";
    }

    function runAndSpot(step) {
      lockFrame();
      if (typeof step.run === "function") {
        driving = true;
        try {
          step.run(api(), idx);
        } catch (err) {}
        driving = false;
      }
      scheduleSpot(step.spot, step.delayMs);
    }

    function paint() {
      var step = steps[idx];
      if (!step) {
        showDone();
        return;
      }
      applyStepUi(step);

      var wantSrc = step.frameSrc || defaultFrameSrc;
      if (wantSrc && normSrc(wantSrc) !== normSrc(activeFrameSrc)) {
        driving = true;
        activeFrameSrc = wantSrc;
        frame.onload = function () {
          activeFrameSrc = wantSrc;
          lockFrame();
          if (typeof step.onFrame === "function") {
            try {
              step.onFrame(api(), idx);
            } catch (e) {}
          }
          runAndSpot(step);
        };
        frame.src = wantSrc;
        return;
      }

      runAndSpot(step);
    }

    function showDone() {
      clearSpot();
      if (chrome) chrome.hidden = true;
      document.body.classList.add("is-novice-done");
      if (doneMask) doneMask.hidden = false;
    }

    function goHome(mark) {
      if (mark && tourId && global.FZNovice && FZNovice.markDone) {
        FZNovice.markDone(tourId);
      }
      location.href = homeHref;
    }

    function onFrameReady() {
      activeFrameSrc =
        frame.getAttribute("data-src") ||
        frame.getAttribute("src") ||
        defaultFrameSrc;
      lockFrame();
      if (typeof cfg.onReady === "function") {
        try {
          cfg.onReady(api());
        } catch (e) {}
      }
      idx = 0;
      paint();
    }

    nextBtn.addEventListener("click", function () {
      if (driving) return;
      if (idx >= steps.length - 1) {
        showDone();
        return;
      }
      idx += 1;
      paint();
    });
    exitBtn.addEventListener("click", function () {
      goHome(false);
    });
    finishBtn.addEventListener("click", function () {
      goHome(true);
    });
    replayBtn.addEventListener("click", function () {
      /* 重载 iframe 保证 1:1 初始态 */
      var src = frame.getAttribute("data-src") || defaultFrameSrc;
      activeFrameSrc = "";
      frame.onload = onFrameReady;
      frame.src = src;
    });

    window.addEventListener("resize", function () {
      var step = steps[idx];
      if (step) placeSpot(step.spot);
    });

    if (!frame.getAttribute("data-src")) {
      frame.setAttribute("data-src", frame.getAttribute("src") || frame.src);
    }
    defaultFrameSrc = frame.getAttribute("data-src") || frame.src;
    if (frame.contentDocument && frame.contentDocument.readyState === "complete") {
      onFrameReady();
    } else {
      frame.addEventListener("load", onFrameReady);
    }
  }

  global.FZNoviceStatic = { boot: boot, esc: esc };
})(typeof window !== "undefined" ? window : this);
