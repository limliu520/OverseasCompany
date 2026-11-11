/* 侧栏帮助中心（账户上方）· 预设问题随当前页面功能切换 */
(function (global) {
  /** 各页预设：打开帮助时优先展示当前页功能相关问题 */
  var FAQ_BY_PAGE = {
    home: [
      {
        q: "工作台有什么？",
        a: "顶部是新手教程；下方是数据概览、状态与异常提醒、平台公告摘要；右上角进消息中心。反馈请用帮助中心「反馈」Tab。",
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
        need: "projects.list.proj_new"
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
        a: "项目已创建但内容通道尚未接通。可进「对接」页查看凭证与推送签名密钥；「接通测试」正式版须双向验签都通过才接通。",
        href: "pages/projects.html",
        need: "projects.list.view"
      },
      {
        q: "如何新建项目？",
        a: "点「新建项目」进入创建向导，逐步填写后创建。",
        href: "pages/project-setup.html?new=1",
        need: "projects.list.proj_new"
      }
    ],
    "project-setup": [
      {
        q: "创建步骤哪些必填？",
        a: "「项目名称」「封面」必填。有默认配置的步（水印、内容生成规则、推送规则）确认后直接「下一步 / 创建」，不提供跳过。真正可跳过的只有：片头片尾、文案管理、采集号。",
        href: "pages/project-setup.html?new=1",
        need: "projects.list.proj_new"
      },
      {
        q: "创建成功后做什么？",
        a: "正式流程会提示去「开发对接」或稍后处理。若在新手教程中，只会弹出「学习完成」并回工作台，不进入真实对接。",
        need: "projects.list.proj_new"
      },
      {
        q: "水印和文章要在创建时配完吗？",
        a: "水印、内容生成、推送都有默认，确认即可（无跳过）。文案管理可跳过（自定义提示词须粘贴才算配完）。片头片尾、采集号也可跳过。创建后都可在项目详情再改。",
        need: "projects.list.proj_new"
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
        a: "同一详情页点「文案管理」Tab，可配模板提示词、自定义与文案链接等。",
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
        a: "本页只看本项目：凭证（只读复制）+ 对方反填（收件/事件通知）。接口协议点「查看开发对接文档」。接通后运营侧配置才会真正生效。",
        need: "projects.list.view"
      },
      {
        q: "如何做接通测试？",
        a: "对接页点「接通测试」。正式版：方舟与对方各验签一次都通过才置为已接通。Demo 可模拟双向通过以便演示后续流程。",
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
        a: "在本页看采集中 / 已停止；也可看工作台「状态与异常提醒」。",
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
        a: "点「申请添加采集网站」，填写名称、域名与页面链接，勾选目标项目后保存。",
        href: "pages/website-collect.html",
        need: "collect.web.view"
      },
      {
        q: "技术接入中的站点能改吗？",
        a: "技术接入中的站点不可改配置；等技术接入完成后再编辑或停用。",
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
        a: "顶部切到「待审核素材」，打开详情后审核通过或驳回。",
        href: "pages/materials.html",
        need: "collect.materials.view"
      },
      {
        q: "如何转编辑？",
        a: "在素材详情或列表操作里走「转编辑」，选目标项目后确认。转编辑只占用项目内容通道，素材仍留在平台公共素材池，其他人还能看到。",
        need: "collect.materials.view"
      },
      {
        q: "全部 / 垃圾素材是什么？",
        a: "「全部素材」里「全平台」只有「平台公共素材池」，含各主账号、各项目的料，进了项目的也在里面。后面的「项目」只是其中一份。「垃圾素材」为已丢弃项。用顶部 Tab 切换视图。",
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
        a: "管理 TG 采集号的开始/停止采集；异常时用强制断开。具体频道绑定多在「TG 采集配置」。",
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
    return (FAQ_BY_PAGE[key] || FAQ_BY_PAGE.home || []).slice();
  }

  function mount() {
    if (document.getElementById("fz-help-root")) return;
    var root = document.createElement("div");
    root.id = "fz-help-root";
    root.innerHTML =
      '<div class="fz-help-mask" id="fz-help-mask" hidden>' +
      '<div class="fz-help-panel" role="dialog" aria-label="帮助与反馈">' +
      '<div class="fz-help-head">' +
      '<div class="fz-help-tabs" role="tablist" aria-label="帮助与反馈">' +
      '<button type="button" class="fz-help-tab is-on" id="fz-help-tab-home" role="tab" aria-selected="true" aria-controls="fz-help-home" data-help-tab="home">帮助</button>' +
      '<button type="button" class="fz-help-tab" id="fz-help-tab-fb" role="tab" aria-selected="false" aria-controls="fz-help-fb" data-help-tab="fb">反馈</button>' +
      "</div>" +
      '<button type="button" class="mat-detail-close" id="fz-help-close" aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="fz-help-body fz-help-body--chat" id="fz-help-home" role="tabpanel" aria-labelledby="fz-help-tab-home">' +
      '<div class="fz-help-chat" id="fz-help-chat"></div>' +
      '<div class="fz-help-suggest">' +
      '<span class="fz-help-suggest-lab" id="fz-help-suggest-lab">猜你想问</span>' +
      '<div class="fz-help-faq" id="fz-help-faq"></div></div>' +
      '<form class="fz-help-compose" id="fz-help-form">' +
      '<input id="fz-help-input" placeholder="向助手提问…" autocomplete="off" />' +
      '<button type="submit" class="btn btn-primary">发送</button></form></div>' +
      '<div class="fz-help-body fz-help-body--fb" id="fz-help-fb" role="tabpanel" aria-labelledby="fz-help-tab-fb" hidden>' +
      '<div class="field fz-fb-kind-field"><label>反馈类型</label>' +
      '<div class="fz-fb-kinds" role="radiogroup" aria-label="反馈类型">' +
      '<button type="button" class="fz-fb-kind is-on" role="radio" aria-checked="true" data-fb-kind="bug">缺陷</button>' +
      '<button type="button" class="fz-fb-kind" role="radio" aria-checked="false" data-fb-kind="ui">界面</button>' +
      '<button type="button" class="fz-fb-kind" role="radio" aria-checked="false" data-fb-kind="idea">建议</button>' +
      '<button type="button" class="fz-fb-kind" role="radio" aria-checked="false" data-fb-kind="other">其他</button>' +
      "</div></div>" +
      '<div class="field fz-fb-text-field"><label>反馈说明</label>' +
      '<textarea id="fz-fb-text" rows="4" placeholder="描述遇到的问题或建议"></textarea></div>' +
      '<div class="fz-fb-attach">' +
      '<p class="fz-fb-attach-lead">提交时默认附带<strong>当前页整页示意截图</strong>。若再点选问题位置，会额外带上该区域定位与现场数据，方便研发对照。</p>' +
      '<div class="fz-fb-pick-row">' +
      '<button type="button" class="btn fz-fb-pick-btn" id="fz-fb-pick">点选问题位置</button>' +
      '<button type="button" class="btn fz-fb-pick-btn" id="fz-fb-pick-clear" hidden>清除选区</button>' +
      "</div>" +
      '<div class="fz-fb-pick-sum" id="fz-fb-pick-sum" hidden></div>' +
      "</div>" +
      '<div class="fz-fb-actions">' +
      '<button type="button" class="btn btn-primary" id="fz-fb-submit">提交反馈</button></div></div>' +
      "</div></div>" +
      '<div class="fz-fb-pick-layer" id="fz-fb-pick-layer" hidden>' +
      '<div class="fz-fb-pick-banner" role="status">' +
      "<span>点击页面上有问题的区域</span>" +
      '<button type="button" class="btn btn-sm btn-ghost" id="fz-fb-pick-cancel">取消</button>' +
      "</div>" +
      '<div class="fz-fb-pick-hl" id="fz-fb-pick-hl" hidden></div>' +
      "</div>";
    document.body.appendChild(root);

    var fab = document.createElement("button");
    fab.type = "button";
    fab.className = "fz-help-fab";
    fab.id = "fz-help-fab";
    fab.setAttribute("aria-label", "帮助与反馈");
    fab.innerHTML =
      '<span class="ico" aria-hidden="true">?</span><span>帮助与反馈</span>';
    var slot = document.getElementById("fz-help-slot");
    if (slot) slot.appendChild(fab);
    else document.body.appendChild(fab);

    var mask = document.getElementById("fz-help-mask");
    var home = document.getElementById("fz-help-home");
    var fb = document.getElementById("fz-help-fb");
    var tabHome = document.getElementById("fz-help-tab-home");
    var tabFb = document.getElementById("fz-help-tab-fb");
    var chat = document.getElementById("fz-help-chat");
    var faqBox = document.getElementById("fz-help-faq");
    var suggestLab = document.getElementById("fz-help-suggest-lab");
    var welcomed = false;
    var lastHelpPage = "";
    var pickMeta = null;
    var picking = false;
    var pickLayer = document.getElementById("fz-fb-pick-layer");
    var pickHl = document.getElementById("fz-fb-pick-hl");
    var pickSum = document.getElementById("fz-fb-pick-sum");
    var pickClearBtn = document.getElementById("fz-fb-pick-clear");

    function setTab(which) {
      var isHelp = which !== "fb";
      home.hidden = !isHelp;
      fb.hidden = isHelp;
      tabHome.classList.toggle("is-on", isHelp);
      tabFb.classList.toggle("is-on", !isHelp);
      tabHome.setAttribute("aria-selected", isHelp ? "true" : "false");
      tabFb.setAttribute("aria-selected", isHelp ? "false" : "true");
      if (isHelp) syncPageChrome();
    }
    function showHome() {
      setTab("home");
    }
    function showFb() {
      setTab("fb");
    }

    function syncPageChrome() {
      var label = pageLabel(pageKey());
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
            "」，下方预设问题已按本页功能准备。也可以直接输入提问；需要人工跟进时切到「反馈」。"
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
      if (picking) endPick(false);
      mask.hidden = true;
    }

    function cssPath(el) {
      if (!el || el.nodeType !== 1) return "";
      var parts = [];
      var cur = el;
      while (cur && cur.nodeType === 1 && cur !== document.body && parts.length < 8) {
        var seg = cur.tagName.toLowerCase();
        if (cur.id) {
          parts.unshift(seg + "#" + cur.id);
          break;
        }
        var cls = String(cur.className || "")
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .join(".");
        if (cls) seg += "." + cls;
        var parent = cur.parentElement;
        if (parent) {
          var same = [].filter.call(parent.children, function (c) {
            return c.tagName === cur.tagName;
          });
          if (same.length > 1) {
            seg += ":nth-of-type(" + (same.indexOf(cur) + 1) + ")";
          }
        }
        parts.unshift(seg);
        cur = parent;
      }
      return parts.join(" > ");
    }

    function logicHint(el) {
      if (!el || !el.closest) return "";
      var rules = [
        ["#wb-novice", "工作台新手教程 · js/novice-guide.js"],
        ["#fz-help-root", "帮助与反馈 · js/help-center.js"],
        ["#mat-root", "素材列表 · js/materials-app.js / materials-table.js"],
        ["#mat-detail-mask", "素材详情 · js/materials-detail.js"],
        ["#mat-xfer-mask", "转编辑 · js/materials-transfer.js"],
        ["#tg-bot-list", "TG 采集号列表 · js/tg-collect-render.js"],
        [".tg-detail-actions", "开始/停止采集 · js/tg-collect-ops.js"],
        ["#tg-ch-modal", "加入频道弹窗 · js/tg-collect-modal.js"],
        ["#tg-rr-modal", "新建路由 · js/tg-collect-modal.js"],
        ["#art-tbody", "文章列表 · js/articles-app.js"],
        [".art-edit-shell", "文章编辑 · js/article-edit-app.js"],
        ["#sub-modal", "创建子账号 · js/subs-app.js"],
        ["#role-modal", "岗位权限 · js/subs-app.js"],
        ["#panel", "创建/配置向导主面板 · js/project-setup-app.js"],
        [".config-tabs", "项目详情配置 Tab · pages/project-edit.html"],
        ["#wc-sites", "网站采集站点 · js/website-collect-app.js"],
        [".sidebar", "侧栏导航 · js/shell.js"]
      ];
      for (var i = 0; i < rules.length; i++) {
        if (el.closest(rules[i][0])) return rules[i][1];
      }
      return "";
    }

    function describeTarget(el) {
      if (!el || el.nodeType !== 1) return null;
      var r = el.getBoundingClientRect();
      var text = String(el.innerText || el.value || el.getAttribute("aria-label") || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120);
      var attrs = {};
      [].forEach.call(el.attributes || [], function (a) {
        if (!a || !a.name) return;
        if (
          a.name === "class" ||
          a.name === "style" ||
          a.name.indexOf("data-") === 0 ||
          a.name === "id" ||
          a.name === "name" ||
          a.name === "type" ||
          a.name === "href" ||
          a.name === "role"
        ) {
          attrs[a.name] = String(a.value || "").slice(0, 160);
        }
      });
      var html = "";
      try {
        html = String(el.outerHTML || "").replace(/\s+/g, " ").slice(0, 280);
      } catch (e) {}
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || "",
        className: String(el.className || "").trim().slice(0, 160),
        text: text,
        path: cssPath(el),
        rect: {
          x: Math.round(r.left),
          y: Math.round(r.top),
          w: Math.round(r.width),
          h: Math.round(r.height)
        },
        attrs: attrs,
        htmlSnippet: html,
        logicHint: logicHint(el),
        page: location.pathname.split("/").pop() || "",
        href: location.href
      };
    }

    function pageShotMeta() {
      return {
        mode: "page",
        demo: true,
        note: "Demo：整页示意截图占位；正式环境替换为真实截图字节/URL",
        href: location.href,
        title: document.title || "",
        viewport: {
          w: window.innerWidth,
          h: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
          scrollX: Math.round(window.scrollX || 0),
          scrollY: Math.round(window.scrollY || 0)
        },
        at: Date.now()
      };
    }

    function paintPickSum() {
      if (!pickSum || !pickClearBtn) return;
      if (!pickMeta) {
        pickSum.hidden = true;
        pickSum.innerHTML = "";
        pickClearBtn.hidden = true;
        return;
      }
      pickClearBtn.hidden = false;
      pickSum.hidden = false;
      pickSum.innerHTML =
        '<div class="fz-fb-pick-sum-title">已点选问题位置</div>' +
        '<div class="fz-fb-pick-sum-line">' +
        esc(pickMeta.tag) +
        (pickMeta.id ? "#" + esc(pickMeta.id) : "") +
        (pickMeta.text ? " · 「" + esc(pickMeta.text) + "」" : "") +
        "</div>" +
        (pickMeta.path
          ? '<div class="fz-fb-pick-sum-path">' + esc(pickMeta.path) + "</div>"
          : "") +
        (pickMeta.logicHint
          ? '<div class="fz-fb-pick-sum-hint">研发对照：' +
            esc(pickMeta.logicHint) +
            "</div>"
          : "") +
        '<p class="fz-fb-pick-sum-note">提交时会附带该定位与现场数据；未点选则只带反馈说明 + 整页截图。</p>';
    }

    function placePickHl(el) {
      if (!pickHl || !el) {
        if (pickHl) pickHl.hidden = true;
        return;
      }
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) {
        pickHl.hidden = true;
        return;
      }
      pickHl.hidden = false;
      pickHl.style.left = Math.round(r.left - 2) + "px";
      pickHl.style.top = Math.round(r.top - 2) + "px";
      pickHl.style.width = Math.ceil(r.width + 4) + "px";
      pickHl.style.height = Math.ceil(r.height + 4) + "px";
    }

    function pickIgnore(el) {
      if (!el || !el.closest) return true;
      if (el.closest("#fz-fb-pick-layer")) return true;
      if (el.closest("#fz-help-root")) return true;
      if (el.closest("#fz-help-fab")) return true;
      return false;
    }

    function onPickMove(e) {
      if (!picking) return;
      var el = e.target;
      if (pickIgnore(el)) {
        placePickHl(null);
        return;
      }
      placePickHl(el);
    }

    function onPickClick(e) {
      if (!picking) return;
      var el = e.target;
      if (pickIgnore(el)) return;
      e.preventDefault();
      e.stopPropagation();
      pickMeta = describeTarget(el);
      endPick(true);
    }

    function onPickKey(e) {
      if (!picking) return;
      if (e.key === "Escape") {
        e.preventDefault();
        endPick(false);
      }
    }

    function startPick() {
      if (picking) return;
      picking = true;
      mask.hidden = true;
      if (pickLayer) pickLayer.hidden = false;
      document.body.classList.add("is-fz-fb-picking");
      document.addEventListener("mousemove", onPickMove, true);
      document.addEventListener("click", onPickClick, true);
      document.addEventListener("keydown", onPickKey, true);
      FZShell.toast("请点击页面上有问题的区域", "ok");
    }

    function endPick(reopenFb) {
      picking = false;
      if (pickLayer) pickLayer.hidden = true;
      placePickHl(null);
      document.body.classList.remove("is-fz-fb-picking");
      document.removeEventListener("mousemove", onPickMove, true);
      document.removeEventListener("click", onPickClick, true);
      document.removeEventListener("keydown", onPickKey, true);
      paintPickSum();
      if (reopenFb) {
        mask.hidden = false;
        showFb();
        FZShell.toast(pickMeta ? "已记录问题位置" : "已取消点选", "ok");
      }
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
      if (item && item.href && (!item.need || can(item.need))) {
        link =
          ' <a class="fz-help-link" href="' +
          base() +
          item.href +
          '">去处理 →</a>';
      }
      setTimeout(function () {
        bubble("bot", esc(item ? item.a : "") + link);
      }, 220);
    }

    function matchFaq(text) {
      var t = String(text || "").toLowerCase();
      var list = visibleFaq();
      var i;
      var item;
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

    (function bindFabOpen() {
      var fabBtn = document.getElementById("fz-help-fab");
      if (!fabBtn) return;
      fabBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        open();
      });
    })();
    document.getElementById("fz-help-close").addEventListener("click", close);
    document.addEventListener("click", function (e) {
      if (mask.hidden) return;
      if (mask.contains(e.target)) return;
      if (e.target.closest && e.target.closest("#fz-help-fab")) return;
      close();
    });
    document.addEventListener("keydown", function (e) {
      if (picking) return;
      if (e.key === "Escape" && !mask.hidden) close();
    });
    tabHome.addEventListener("click", function () {
      showHome();
      var input = document.getElementById("fz-help-input");
      if (input) input.focus();
    });
    tabFb.addEventListener("click", function () {
      showFb();
      var ta = document.getElementById("fz-fb-text");
      if (ta) ta.focus();
    });
    var kindBox = document.querySelector("#fz-help-fb .fz-fb-kinds");
    kindBox.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-fb-kind]");
      if (!btn || !kindBox.contains(btn)) return;
      kindBox.querySelectorAll("[data-fb-kind]").forEach(function (el) {
        var on = el === btn;
        el.classList.toggle("is-on", on);
        el.setAttribute("aria-checked", on ? "true" : "false");
      });
    });

    document.getElementById("fz-fb-pick").addEventListener("click", function () {
      startPick();
    });
    document.getElementById("fz-fb-pick-cancel").addEventListener("click", function () {
      endPick(true);
    });
    pickClearBtn.addEventListener("click", function () {
      pickMeta = null;
      paintPickSum();
      FZShell.toast("已清除问题位置，提交时仅附带说明与整页截图", "ok");
    });

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
              "」相关的预设问题，或切到「反馈」提交工单。"
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
      var kindBtn = document.querySelector("#fz-help-fb .fz-fb-kind.is-on");
      var kind = kindBtn ? kindBtn.getAttribute("data-fb-kind") : "bug";
      var shot = pageShotMeta();
      var target = pickMeta || null;
      var s = FZStore.read();
      FZStore.addTicket(s, {
        id: FZStore.uid("tk"),
        kind: kind,
        text: text,
        withShot: true,
        pageShot: shot,
        target: target,
        status: "pending",
        page: location.pathname.split("/").pop() || "",
        at: Date.now(),
        by: s.displayName || s.username
      });
      FZStore.write(s);
      document.getElementById("fz-fb-text").value = "";
      pickMeta = null;
      paintPickSum();
      kindBox.querySelectorAll("[data-fb-kind]").forEach(function (el) {
        var on = el.getAttribute("data-fb-kind") === "bug";
        el.classList.toggle("is-on", on);
        el.setAttribute("aria-checked", on ? "true" : "false");
      });
      FZShell.toast(
        target
          ? "已提交反馈（整页截图 + 问题位置）"
          : "已提交反馈（说明 + 整页截图）",
        "ok"
      );
      submitting = false;
      showHome();
      close();
    });
  }

  global.FZHelpCenter = { mount: mount };
})(window);
