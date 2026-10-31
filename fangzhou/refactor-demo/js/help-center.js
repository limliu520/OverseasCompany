/* 右下角帮助中心 · 预设问题随当前页面功能切换 */
(function (global) {
  var COMMON_TAIL = [
    {
      q: "想再看一遍菜单引导？",
      a: "点下方「重看侧栏菜单引导」，会按你当前权限重新走一遍侧栏说明（跳过过也能再开）。",
      tour: true
    }
  ];

  /** 各页预设：打开帮助时优先展示当前页功能相关问题 */
  var FAQ_BY_PAGE = {
    home: [
      {
        q: "工作台待办是什么？",
        a: "工作台汇总入驻、对接、审核等待办；点卡片可深链到对应功能。新手教程也在本页顶部。",
        href: "pages/home.html"
      },
      {
        q: "新手教程从哪开始？",
        a: "本页「新手教程」卡片按权限列出模块；点「去学习」会带上教程标记进入对应页，完成或退出都会回工作台。",
        href: "pages/home.html"
      },
      {
        q: "如何创建第一个项目？",
        a: "点新手教程「创建项目」，或侧栏项目管理新建。教程为独立演示，不会写入真实项目数据。",
        href: "pages/project-setup.html?new=1",
        need: "projects.list.create"
      }
    ],
    projects: [
      {
        q: "项目列表怎么进详情？",
        a: "点项目名或「项目详情」进入详情页，可配水印、文章模板、对接等。",
        href: "pages/projects.html",
        need: "projects.list.view"
      },
      {
        q: "待接通是什么意思？",
        a: "项目已创建但内容通道尚未接通。可进「对接」页查看凭证；Demo 可模拟接通。",
        href: "pages/projects.html",
        need: "projects.list.view"
      },
      {
        q: "如何新建项目？",
        a: "点「新建项目」进入创建向导，逐步填写后创建。",
        href: "pages/project-setup.html?new=1",
        need: "projects.list.create"
      }
    ],
    "project-setup": [
      {
        q: "创建步骤哪些必填？",
        a: "「项目名称」等标为必填的步骤需填写后才能「下一步」；可选步骤可用「跳过」或「跳过并创建」。",
        href: "pages/project-setup.html?new=1",
        need: "projects.list.create"
      },
      {
        q: "创建成功后做什么？",
        a: "正式流程会提示去「开发对接」或稍后处理。若在新手教程中，只会弹出「学习完成」并回工作台，不进入真实对接。",
        need: "projects.list.create"
      },
      {
        q: "水印和文章要在创建时配完吗？",
        a: "创建向导里可跳过；创建后也可在项目详情的「水印管理」「文章管理」Tab 再配。",
        need: "projects.list.create"
      }
    ],
    "project-edit": [
      {
        q: "水印在哪里配置？",
        a: "项目详情下方 Tab 点「水印管理」：可上传、移除、调位置与宽度比例等。",
        need: "projects.list.view"
      },
      {
        q: "文章规范 / 模板在哪？",
        a: "同一详情页点「文章管理」Tab，可配模板提示词、自定义与文案链接等。",
        need: "projects.list.view"
      },
      {
        q: "基本信息怎么改？",
        a: "点顶部「编辑基本信息」打开弹窗，改名称、类型、封面尺寸等后保存。",
        need: "projects.list.view"
      }
    ],
    "project-connect": [
      {
        q: "对接页要填什么？",
        a: "查看通道凭证（App ID / Secret 等），交给开发联调；接通后运营侧配置才会真正生效。",
        need: "projects.list.view"
      },
      {
        q: "Demo 如何模拟接通？",
        a: "对接页若有「模拟接通」，点后项目状态会变为已接通（仅演示）。",
        need: "projects.list.view"
      },
      {
        q: "接通前能推送吗？",
        a: "未接通时不会真正推到业务方；自动流等配置接通后按你的选择生效。",
        need: "projects.list.view"
      }
    ],
    "project-after": [
      {
        q: "创建后这一页是做什么的？",
        a: "创建成功后的引导页，可继续对接或回到项目列表。正式环境按页内按钮走即可。",
        need: "projects.list.view"
      }
    ],
    "tg-collect": [
      {
        q: "如何加入采集频道？",
        a: "选好项目后点「+ 加入频道」，填写频道链接，公共池场景选「采集」角色后确认。",
        href: "pages/tg-collect.html",
        need: "collect.tg.view"
      },
      {
        q: "采集号掉线怎么办？",
        a: "在本页检查连接/监听状态；也可看工作台「状态与异常提醒」。",
        href: "pages/tg-collect.html",
        need: "collect.tg.view"
      },
      {
        q: "公共池路由怎么建？",
        a: "在公共池项目下为频道配置路由（采集/推送），按页内加号与向导完成即可。",
        need: "collect.tg.view"
      }
    ],
    "website-collect": [
      {
        q: "如何添加网站？",
        a: "点「+ 添加网站」，填写名称、域名与页面链接，勾选目标项目后保存。",
        href: "pages/website-collect.html",
        need: "collect.web.view"
      },
      {
        q: "接入中的站点能改吗？",
        a: "接入中的站点不可改配置；等接入完成后再编辑或停用。",
        need: "collect.web.view"
      },
      {
        q: "采集记录在哪看？",
        a: "上方点选站点卡片，下方会筛出该站采集记录；可用筛选缩小范围。",
        need: "collect.web.view"
      }
    ],
    materials: [
      {
        q: "待审核素材去哪处理？",
        a: "顶部切到「待审核素材」，打开详情后审核通过或驳回；也可从工作台待办进入。",
        href: "pages/materials.html",
        need: "collect.materials.view"
      },
      {
        q: "如何转编辑？",
        a: "在素材详情或列表操作里走「转编辑」；按页内弹窗选择目标后确认。",
        need: "collect.materials.view"
      },
      {
        q: "全部 / 垃圾素材是什么？",
        a: "「全部素材」看全量；「垃圾素材」为已丢弃项。用顶部 Tab 切换视图。",
        need: "collect.materials.view"
      }
    ],
    articles: [
      {
        q: "文章怎么筛选？",
        a: "用项目、状态筛选，或点搜索/刷新。列表可看状态与操作列。",
        href: "pages/articles.html",
        need: "content.article.view"
      },
      {
        q: "推送前怎么改稿？",
        a: "打开稿件进入编辑，改正文/封面后保存，再确认推送。",
        href: "pages/articles.html",
        need: "content.article.view"
      },
      {
        q: "如何预览文章？",
        a: "在列表点某行可打开预览；关闭后仍停留在文章列表。",
        need: "content.article.view"
      }
    ],
    "article-edit": [
      {
        q: "编辑页怎么保存？",
        a: "改完标题/正文/封面后点保存；再按页内流程确认推送（若有）。",
        need: "content.article.view"
      },
      {
        q: "推送失败怎么办？",
        a: "检查项目通道是否已接通、稿件是否校验通过；也可回文章列表看状态后重试。",
        need: "content.article.view"
      }
    ],
    subs: [
      {
        q: "如何创建子账号？",
        a: "在「子账号」Tab 点「+ 创建子账号」，按向导填个人信息 → 负责项目 → 岗位权限后保存。",
        href: "pages/subs.html",
        need: "global.subs.accounts.view"
      },
      {
        q: "岗位权限在哪配？",
        a: "切到「岗位」Tab 查看或编辑岗位；创建子账号第三步也会绑定岗位权限。",
        need: "global.subs.accounts.view"
      },
      {
        q: "子账号和主账号有何区别？",
        a: "子账号按岗位授权可见菜单与项目；主账号拥有更完整的管理能力。",
        need: "global.subs.accounts.view"
      }
    ],
    roles: [
      {
        q: "岗位怎么理解？",
        a: "岗位定义一组功能权限；子账号绑定岗位后，侧栏与页面按权限裁剪。",
        need: "global.subs.accounts.view"
      }
    ],
    announcements: [
      {
        q: "平台公告在哪看？",
        a: "本页列出公告；点标题进详情。工作台也可能有未读入口。",
        href: "pages/announcements.html"
      }
    ],
    "announcement-detail": [
      {
        q: "公告详情能做什么？",
        a: "阅读完整公告内容；读完可返回公告列表或工作台。",
        href: "pages/announcements.html"
      }
    ],
    userbots: [
      {
        q: "采集号列表是做什么的？",
        a: "管理 TG 采集号连接状态；异常时可重连。具体频道绑定多在「TG 采集配置」。",
        href: "pages/userbots.html",
        need: "collect.tg.view"
      }
    ],
    "ext-channels": [
      {
        q: "外站通道是什么？",
        a: "管理对外内容通道相关配置；按页内状态与操作完成激活或调整。",
        href: "pages/ext-channels.html"
      }
    ]
  };

  var PAGE_LABEL = {
    home: "工作台",
    projects: "项目管理",
    "project-setup": "创建项目",
    "project-edit": "项目详情",
    "project-connect": "开发对接",
    "project-after": "创建后续",
    "tg-collect": "TG 采集",
    "website-collect": "网站采集",
    materials: "素材管理",
    articles: "文章管理",
    "article-edit": "文章编辑",
    subs: "子账号与授权",
    roles: "岗位",
    announcements: "平台公告",
    "announcement-detail": "公告详情",
    userbots: "采集号",
    "ext-channels": "外站通道"
  };

  function esc(s) {
    return global.FZShell ? FZShell.escHtml(s) : String(s || "");
  }

  function base() {
    return (global.FZShell && FZShell.BASE) || "./";
  }

  function can(need) {
    return FZStore.hasFeature(FZStore.read(), need);
  }

  function pageKey() {
    var file = (location.pathname.split("/").pop() || "").replace(/\.html$/i, "");
    return file || "home";
  }

  function pageLabel(key) {
    return PAGE_LABEL[key] || "当前页";
  }

  function faqForPage(key) {
    var list = (FAQ_BY_PAGE[key] || FAQ_BY_PAGE.home || []).slice();
    return list.concat(COMMON_TAIL);
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
      '<span class="fz-help-suggest-lab" id="fz-help-suggest-lab">猜你想问</span>' +
      '<div class="fz-help-faq" id="fz-help-faq"></div></div>' +
      '<div class="fz-help-tools">' +
      '<button type="button" class="btn btn-ghost fz-help-tour-btn" id="fz-help-tour">重看侧栏菜单引导</button></div>' +
      '<form class="fz-help-compose" id="fz-help-form">' +
      '<input id="fz-help-input" placeholder="向助手提问…" autocomplete="off" />' +
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
    var suggestLab = document.getElementById("fz-help-suggest-lab");
    var welcomed = false;
    var lastHelpPage = "";

    function showHome() {
      home.hidden = false;
      fb.hidden = true;
      back.hidden = true;
      if (headMain) headMain.classList.remove("is-fb");
      title.textContent = "方舟助手";
      var st = document.getElementById("fz-help-status");
      if (st) st.hidden = false;
      document.getElementById("fz-help-to-fb").hidden = false;
      syncPageChrome();
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

    function syncPageChrome() {
      var key = pageKey();
      var label = pageLabel(key);
      var st = document.getElementById("fz-help-status");
      if (st) st.textContent = "当前页 · " + label;
      if (suggestLab) suggestLab.textContent = "猜你想问 · " + label;
      var input = document.getElementById("fz-help-input");
      if (input) input.placeholder = "问「" + label + "」相关问题…";
    }

    function open() {
      showHome();
      mask.hidden = false;
      var key = pageKey();
      var label = pageLabel(key);
      renderFaq();
      if (!welcomed) {
        welcomed = true;
        bubble(
          "bot",
          "你好，我是方舟助手。你当前在「" +
            esc(label) +
            "」，下方预设问题已按本页功能准备。也可以直接输入提问；需要人工跟进时点「快速反馈」。"
        );
      } else if (lastHelpPage && lastHelpPage !== key) {
        bubble(
          "bot",
          "已按「" + esc(label) + "」更新预设问题，点下方快捷项或继续提问即可。"
        );
      }
      lastHelpPage = key;
      setTimeout(function () {
        var input = document.getElementById("fz-help-input");
        if (input) input.focus();
      }, 50);
    }
    function close() {
      mask.hidden = true;
    }

    function visibleFaq() {
      return faqForPage(pageKey()).filter(function (item) {
        return !item.need || can(item.need);
      });
    }

    function renderFaq() {
      syncPageChrome();
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
      var i;
      var item;
      for (i = 0; i < list.length; i++) {
        item = list[i];
        if (
          (t.indexOf("引导") !== -1 || t.indexOf("菜单说明") !== -1) &&
          item.tour
        )
          return item;
      }
      for (i = 0; i < list.length; i++) {
        item = list[i];
        var q = item.q || "";
        if (q.length >= 4 && t.indexOf(q.slice(0, 4)) !== -1) return item;
        if (item.keywords) {
          for (var k = 0; k < item.keywords.length; k++) {
            if (t.indexOf(item.keywords[k]) !== -1) return item;
          }
        }
      }
      for (i = 0; i < list.length; i++) {
        item = list[i];
        var words = String(item.q || "").replace(/[？?，,、]/g, " ").split(/\s+/);
        for (var w = 0; w < words.length; w++) {
          if (words[w].length >= 2 && t.indexOf(words[w]) !== -1) return item;
        }
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
      var DRAG_PX = 8;
      var dragging = false;
      var pressed = false;
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
      function persist() {
        try {
          localStorage.setItem(FAB_KEY, String(clampBottom(readBottom())));
        } catch (err) {}
      }

      try {
        var saved = localStorage.getItem(FAB_KEY);
        if (saved != null && saved !== "") applyBottom(+saved);
      } catch (err0) {}

      fab.title = "单击打开；按住拖动可上下移动";
      fab.addEventListener("pointerdown", function (e) {
        if (e.button != null && e.button !== 0) return;
        pressed = true;
        dragging = false;
        startY = e.clientY;
        startBottom = readBottom();
        pointerId = e.pointerId;
        try {
          fab.setPointerCapture(pointerId);
        } catch (err1) {}
      });
      fab.addEventListener("pointermove", function (e) {
        if (!pressed) return;
        if (pointerId != null && e.pointerId !== pointerId) return;
        var dy = e.clientY - startY;
        if (!dragging) {
          if (Math.abs(dy) < DRAG_PX) return;
          dragging = true;
          fab.classList.add("is-dragging");
        }
        e.preventDefault();
        applyBottom(startBottom - dy);
      });
      function endPointer(e) {
        if (!pressed) return;
        if (pointerId != null && e.pointerId !== pointerId) return;
        var wasDragging = dragging;
        pressed = false;
        dragging = false;
        fab.classList.remove("is-dragging");
        try {
          fab.releasePointerCapture(pointerId);
        } catch (err2) {}
        pointerId = null;
        if (wasDragging) {
          persist();
          return;
        }
        open();
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
            "这个问题我暂时没有现成说明。你可以点下方与「" +
              esc(pageLabel(pageKey())) +
              "」相关的预设问题，或点右上角「快速反馈」提交工单。"
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
