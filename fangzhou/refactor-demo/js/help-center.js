/* 右下角帮助中心 · 主界面 = Agent 对话；快速反馈为二级页 */
(function (global) {
  var FAQ = [
    {
      q: "如何创建第一个项目？",
      a: "在「项目管理」点新建，或走工作台入驻待办。配齐信息后创建，再交给开发对接通道。",
      href: "pages/project-setup.html?new=1",
      need: "projects.list.create"
    },
    {
      q: "内容通道如何接通？",
      a: "项目配齐后进入「对接」页查看凭证。正式环境可由系统或对方首次合法调用变已接通；Demo 可点「模拟接通」。",
      href: "pages/projects.html",
      need: "projects.list.view"
    },
    {
      q: "素材待审核去哪处理？",
      a: "采集中心 → 素材管理 →「待我审核」视图。也可从工作台业务待办深链进入。",
      href: "pages/materials.html",
      need: "collect.materials.view"
    },
    {
      q: "文章推送前怎么改？",
      a: "内容中心 → 文章管理打开稿件，改正文/封面后保存，再确认推送。",
      href: "pages/articles.html",
      need: "content.article.view"
    },
    {
      q: "采集号掉线怎么办？",
      a: "到「TG 采集配置」检查连接与监听；工作台「状态与异常提醒」也会列出异常项。",
      href: "pages/tg-collect.html",
      need: "collect.tg.view"
    },
    {
      q: "想再看一遍菜单引导？",
      a: "点下方「重看侧栏菜单引导」，会按你当前权限重新走一遍侧栏说明（跳过过也能再开）。",
      tour: true
    }
  ];

  function esc(s) {
    return global.FZShell ? FZShell.escHtml(s) : String(s || "");
  }

  function base() {
    return (global.FZShell && FZShell.BASE) || "./";
  }

  function can(need) {
    return FZStore.hasFeature(FZStore.read(), need);
  }

  function mount() {
    if (document.getElementById("fz-help-root")) return;
    var root = document.createElement("div");
    root.id = "fz-help-root";
    root.innerHTML =
      '<button type="button" class="fz-help-fab" id="fz-help-fab" aria-label="帮助与反馈">帮助与反馈</button>' +
      '<div class="fz-help-mask" id="fz-help-mask" hidden>' +
      '<div class="fz-help-panel" role="dialog" aria-labelledby="fz-help-title">' +
      '<div class="fz-help-head">' +
      '<button type="button" class="btn btn-ghost fz-help-back" id="fz-help-back" hidden>← 返回对话</button>' +
      '<div class="fz-help-head-main" id="fz-help-head-main">' +
      '<span class="fz-help-avatar" aria-hidden="true">舟</span>' +
      '<div class="fz-help-head-txt">' +
      '<strong id="fz-help-title">方舟助手</strong>' +
      '<span class="fz-help-status" id="fz-help-status">在线 · Demo Agent</span></div></div>' +
      '<button type="button" class="btn btn-ghost" id="fz-help-to-fb">快速反馈</button>' +
      '<button type="button" class="fz-help-x" id="fz-help-close" aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="fz-help-body fz-help-body--chat" id="fz-help-home">' +
      '<div class="fz-help-chat" id="fz-help-chat"></div>' +
      '<div class="fz-help-suggest">' +
      '<span class="fz-help-suggest-lab">猜你想问</span>' +
      '<div class="fz-help-faq" id="fz-help-faq"></div></div>' +
      '<div class="fz-help-tools">' +
      '<button type="button" class="btn btn-ghost fz-help-tour-btn" id="fz-help-tour">重看侧栏菜单引导</button></div>' +
      '<form class="fz-help-compose" id="fz-help-form">' +
      '<input id="fz-help-input" placeholder="向助手提问，例如：如何接通通道？" autocomplete="off" />' +
      '<button type="submit" class="btn btn-primary">发送</button></form></div>' +
      '<div class="fz-help-body fz-help-body--fb" id="fz-help-fb" hidden>' +
      '<p class="muted fz-help-lead">提交后会出现在工作台「项目待办」里的反馈工单；Admin 侧可查看（Demo 本地保存）。</p>' +
      '<div class="field"><label>反馈说明</label>' +
      '<textarea id="fz-fb-text" rows="4" placeholder="描述遇到的问题或建议"></textarea></div>' +
      '<label class="fz-fb-shot"><input type="checkbox" id="fz-fb-shot" checked /> 附带当前页示意截图（Demo 占位）</label>' +
      '<div class="fz-fb-actions">' +
      '<button type="button" class="btn btn-primary" id="fz-fb-submit">提交反馈</button></div></div>' +
      "</div></div>";
    document.body.appendChild(root);

    var mask = document.getElementById("fz-help-mask");
    var home = document.getElementById("fz-help-home");
    var fb = document.getElementById("fz-help-fb");
    var back = document.getElementById("fz-help-back");
    var title = document.getElementById("fz-help-title");
    var headMain = document.getElementById("fz-help-head-main");
    var chat = document.getElementById("fz-help-chat");
    var faqBox = document.getElementById("fz-help-faq");
    var welcomed = false;

    function showHome() {
      home.hidden = false;
      fb.hidden = true;
      back.hidden = true;
      if (headMain) headMain.classList.remove("is-fb");
      title.textContent = "方舟助手";
      var st = document.getElementById("fz-help-status");
      if (st) st.hidden = false;
      document.getElementById("fz-help-to-fb").hidden = false;
    }
    function showFb() {
      home.hidden = true;
      fb.hidden = false;
      back.hidden = false;
      if (headMain) headMain.classList.add("is-fb");
      title.textContent = "快速反馈";
      var st = document.getElementById("fz-help-status");
      if (st) st.hidden = true;
      document.getElementById("fz-help-to-fb").hidden = true;
    }
    function open() {
      showHome();
      mask.hidden = false;
      renderFaq();
      if (!welcomed) {
        welcomed = true;
        bubble(
          "bot",
          "你好，我是方舟助手。可以直接问我通道对接、素材审核、文章推送等问题；也可以点下方快捷问题。需要人工跟进时，再点右上角「快速反馈」。"
        );
      }
      setTimeout(function () {
        var input = document.getElementById("fz-help-input");
        if (input) input.focus();
      }, 50);
    }
    function close() {
      mask.hidden = true;
    }

    function visibleFaq() {
      return FAQ.filter(function (item) {
        return !item.need || can(item.need);
      });
    }

    function renderFaq() {
      var list = visibleFaq();
      faqBox.innerHTML = list
        .map(function (item, i) {
          return (
            '<button type="button" class="fz-help-faq-item" data-faq="' +
            i +
            '">' +
            esc(item.q) +
            "</button>"
          );
        })
        .join("");
      faqBox.querySelectorAll("[data-faq]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var item = list[+btn.getAttribute("data-faq")];
          if (item) answer(item.q, item);
        });
      });
    }

    function bubble(role, html) {
      var el = document.createElement("div");
      el.className = "fz-help-bubble " + role;
      if (role === "bot") {
        el.innerHTML =
          '<div class="fz-help-bubble-meta">方舟助手</div><div class="fz-help-bubble-txt">' +
          html +
          "</div>";
      } else {
        el.innerHTML = '<div class="fz-help-bubble-txt">' + html + "</div>";
      }
      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
    }

    function answer(q, item) {
      bubble("me", esc(q));
      var link = "";
      if (item && item.tour) {
        link =
          ' <button type="button" class="fz-help-link fz-help-link-btn" data-start-tour="1">立即重看 →</button>';
      } else if (item && item.href && (!item.need || can(item.need))) {
        link =
          ' <a class="fz-help-link" href="' +
          base() +
          item.href +
          '">去处理 →</a>';
      }
      setTimeout(function () {
        bubble("bot", esc(item ? item.a : "") + link);
        var last = chat.lastElementChild;
        var tourBtn = last && last.querySelector("[data-start-tour]");
        if (tourBtn) {
          tourBtn.addEventListener("click", function () {
            startMenuTour();
          });
        }
      }, 220);
    }

    function matchFaq(text) {
      var t = String(text || "").toLowerCase();
      var list = visibleFaq();
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (
          (t.indexOf("引导") !== -1 || t.indexOf("菜单说明") !== -1) &&
          item.tour
        )
          return item;
        if (t.indexOf("项目") !== -1 && item.q.indexOf("项目") !== -1) return item;
        if (t.indexOf("接通") !== -1 || t.indexOf("通道") !== -1) {
          if (item.q.indexOf("接通") !== -1) return item;
        }
        if (t.indexOf("素材") !== -1 && item.q.indexOf("素材") !== -1) return item;
        if (t.indexOf("文章") !== -1 || t.indexOf("推送") !== -1) {
          if (item.q.indexOf("文章") !== -1) return item;
        }
        if (
          (t.indexOf("采集") !== -1 || t.indexOf("掉线") !== -1) &&
          item.q.indexOf("采集") !== -1
        )
          return item;
      }
      return null;
    }

    function startMenuTour() {
      function run() {
        if (!global.FZMenuTour || typeof FZMenuTour.start !== "function") {
          FZShell.toast("菜单引导暂不可用", "err");
          return;
        }
        var steps = FZMenuTour.visibleSteps();
        if (!steps.length) {
          FZShell.toast("当前账号可见菜单过少，暂无引导步骤", "err");
          return;
        }
        close();
        FZMenuTour.start({});
      }
      if (global.FZMenuTour) {
        run();
        return;
      }
      if (global.FZShell && typeof FZShell.loadScriptOnce === "function") {
        FZShell.loadScriptOnce("js/menu-tour.js?v=20261029wb40", run);
      } else {
        var el = document.createElement("script");
        el.src = base() + "js/menu-tour.js?v=20261029wb40";
        el.onload = run;
        document.head.appendChild(el);
      }
    }

    (function bindFabDrag() {
      var fab = document.getElementById("fz-help-fab");
      if (!fab) return;
      var FAB_KEY = "fz_help_fab_bottom";
      var LONG_MS = 40;
      var pressTimer = null;
      var dragging = false;
      var suppressClick = false;
      var startY = 0;
      var startBottom = 0;
      var pointerId = null;

      function fabH() {
        return fab.offsetHeight || 40;
      }
      function clampBottom(b) {
        var min = 12;
        var max = Math.max(min, window.innerHeight - fabH() - 12);
        return Math.min(max, Math.max(min, Math.round(b)));
      }
      function readBottom() {
        var r = fab.getBoundingClientRect();
        return window.innerHeight - r.bottom;
      }
      function applyBottom(b) {
        fab.style.bottom = clampBottom(b) + "px";
        fab.style.top = "auto";
      }
      function clearPress() {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      }
      function persist() {
        try {
          localStorage.setItem(FAB_KEY, String(clampBottom(readBottom())));
        } catch (err) {}
      }

      try {
        var saved = localStorage.getItem(FAB_KEY);
        if (saved != null && saved !== "") applyBottom(+saved);
      } catch (err0) {}

      fab.title = "单击打开；长按可上下拖动";
      fab.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        dragging = false;
        suppressClick = false;
        startY = e.clientY;
        startBottom = readBottom();
        pointerId = e.pointerId;
        try {
          fab.setPointerCapture(pointerId);
        } catch (err1) {}
        clearPress();
        pressTimer = setTimeout(function () {
          pressTimer = null;
          dragging = true;
          suppressClick = true;
          fab.classList.add("is-dragging");
        }, LONG_MS);
      });
      fab.addEventListener("pointermove", function (e) {
        if (pointerId != null && e.pointerId !== pointerId) return;
        var dy = e.clientY - startY;
        if (!dragging) {
          if (Math.abs(dy) > 10) clearPress();
          return;
        }
        e.preventDefault();
        applyBottom(startBottom - dy);
      });
      function endPointer(e) {
        if (pointerId != null && e.pointerId !== pointerId) return;
        var wasDragging = dragging;
        clearPress();
        fab.classList.remove("is-dragging");
        try {
          fab.releasePointerCapture(pointerId);
        } catch (err2) {}
        pointerId = null;
        dragging = false;
        if (wasDragging) {
          persist();
          suppressClick = true;
          setTimeout(function () {
            suppressClick = false;
          }, 0);
          return;
        }
        if (!suppressClick) open();
      }
      fab.addEventListener("pointerup", endPointer);
      fab.addEventListener("pointercancel", endPointer);
      fab.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      window.addEventListener("resize", function () {
        applyBottom(readBottom());
        persist();
      });
    })();
    document.getElementById("fz-help-tour").addEventListener("click", startMenuTour);
    document.getElementById("fz-help-close").addEventListener("click", close);
    mask.addEventListener("click", function (e) {
      if (e.target === mask) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mask.hidden) close();
    });
    document.getElementById("fz-help-to-fb").addEventListener("click", showFb);
    back.addEventListener("click", showHome);

    document.getElementById("fz-help-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("fz-help-input");
      var text = (input.value || "").trim();
      if (!text) return;
      input.value = "";
      var hit = matchFaq(text);
      if (hit) answer(text, hit);
      else {
        bubble("me", esc(text));
        setTimeout(function () {
          bubble(
            "bot",
            "这个问题我暂时没有现成说明。你可以换个问法，或点右上角「快速反馈」提交工单，我们会在工作台待办里跟进。"
          );
        }, 220);
      }
    });

    var submitting = false;
    document.getElementById("fz-fb-submit").addEventListener("click", function () {
      if (submitting) return;
      var text = (document.getElementById("fz-fb-text").value || "").trim();
      if (!text) {
        FZShell.toast("请填写反馈内容", "err");
        return;
      }
      submitting = true;
      var shot = document.getElementById("fz-fb-shot").checked;
      var s = FZStore.read();
      FZStore.addTicket(s, {
        id: FZStore.uid("tk"),
        text: text,
        withShot: shot,
        status: "pending",
        page: location.pathname.split("/").pop() || "",
        at: Date.now(),
        by: s.displayName || s.username
      });
      FZStore.write(s);
      document.getElementById("fz-fb-text").value = "";
      FZShell.toast("已提交反馈", "ok");
      submitting = false;
      showHome();
      close();
      if (typeof global.FZHomeRefreshTickets === "function") {
        global.FZHomeRefreshTickets();
      }
    });
  }

  global.FZHelpCenter = { mount: mount };
})(window);
