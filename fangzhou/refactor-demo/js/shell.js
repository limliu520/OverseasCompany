/* 壳：侧栏注入、鉴权、Toast、个人菜单 */
(function (global) {
  function basePath() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].src || "";
      if (src.indexOf("shell.js") !== -1) {
        return src.replace(/js\/shell\.js.*$/, "");
      }
    }
    return "./";
  }

  var BASE = basePath();

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }
  /** 气泡文案：分号处分行，便于竖排阅读 */
  function tipHtml(text) {
    return escHtml(text)
      .replace(/；\s*/g, "；<br>")
      .replace(/;\s*/g, ";<br>");
  }

  /** type: '' | 'ok' | 'err' */
  function toast(msg, type) {
    var wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    var el = document.createElement("div");
    el.className = "toast" + (type === "ok" ? " ok" : type === "err" ? " err" : "");
    el.textContent = msg;
    wrap.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add("show");
    });
    setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () {
        el.remove();
      }, 220);
    }, type === "ok" ? 2800 : 2200);
  }

  function requireAuth() {
    var s = FZStore.read();
    if (!s.loggedIn) {
      location.href = BASE + "login.html";
      return false;
    }
    if (!s.totpBound) {
      location.href = BASE + "totp.html";
      return false;
    }
    return true;
  }

  function logout() {
    var s = FZStore.read();
    s.loggedIn = false;
    FZStore.write(s);
    location.href = BASE + "login.html";
  }

  /**
   * 信息架构约定（框架层）：
   * - 侧栏只放「列表 / 工作区」入口，不放「新建 xxx」等页内动作
   * - 岗位归属「子账号与授权」页内 Tab，不单独占二级菜单
   * - 未做模块用 stub，点击 Toast「设计中」
   */
  /** done: 本 Demo 已可点可演示；无 done 且 stub = 未做（侧栏降透） */
  var NAV = [
    {
      id: "home",
      label: "工作台",
      ico: "⌂",
      children: [
        {
          id: "home",
          label: "概览",
          href: "pages/home.html",
          done: true,
          need: "home.overview.view",
          tourSkip: true
        },
        {
          id: "announcements",
          label: "平台公告",
          href: "pages/announcements.html",
          done: true,
          need: "home.announcements.view",
          tourSkip: true
        }
      ]
    },
    {
      id: "projects",
      label: "项目管理",
      ico: "▣",
      children: [
        {
          id: "projects",
          label: "项目列表",
          href: "pages/projects.html",
          done: true,
          need: "projects.list.view",
          tourTip:
            "这里管理所有业务项目：一个项目对应一套文章内容通道。新建时配齐基本信息与对接材料；待接通项目可点「对接」交给开发。日常改水印、模板、自动流等，从「项目详情」进入。"
        }
      ]
    },
    {
      id: "collect",
      label: "采集中心",
      ico: "⇩",
      children: [
        {
          id: "c_tg",
          label: "TG 采集配置",
          href: "pages/tg-collect.html",
          done: true,
          need: "collect.tg.view",
          tourTip:
            "配置 Telegram 采集：添加采集号、绑定源频道，公共池还可配「源→目标」路由。号掉线、频道 not a member、路由体检失败时，可从工作台「状态与异常提醒」跳回这里处理。"
        },
        {
          id: "c_web",
          label: "网站采集配置",
          href: "pages/website-collect.html",
          done: true,
          need: "collect.web.view",
          tourTip:
            "配置网站采集任务：添加站点、填写采集规则，查看接入中 / 已接入记录。接入中的站点不可改配置；需要停用或调整时，等接入完成后再编辑。"
        },
        {
          id: "c_mat",
          label: "素材管理",
          href: "pages/materials.html",
          done: true,
          need: "collect.materials.view",
          tourTip:
            "处理采进来的素材。顶部切换「待审核 / 全部 / 垃圾」视图：待审可在详情里通过、驳回或转编辑；全部素材按项目或公共池筛选；垃圾可恢复。工作台「当前待审素材」点审核也会打开同一套详情弹窗。"
        }
      ]
    },
    {
      id: "content",
      label: "内容中心",
      ico: "✎",
      children: [
        {
          id: "e_art",
          label: "文章管理",
          href: "pages/articles.html",
          done: true,
          need: "content.article.view",
          tourTip:
            "管理进入内容通道的稿件：查看待编、失败、已推等状态。点开可二次编辑正文与封面，确认后推送给业务方。工作台「当前待处理稿件」会汇总需要你动手的条目。"
        },
        {
          id: "i_ai",
          label: "AI 评论",
          need: "content.ai_cmt.view",
          stub:
            "AI 评论（生成）· 设计中。产品债务：须补「评论预览」（前台地址预览已删）"
        },
        {
          id: "e_pull_wm",
          label: "拉取加水印",
          need: "content.pull_wm.view",
          stub:
            "拉取加水印 · 设计中（对方领任务加水印后回报；不进项目内容通道并集）"
        }
      ]
    },
    {
      id: "review",
      label: "审核中心",
      ico: "✓",
      children: [
        {
          id: "r_cmt",
          label: "评论审核",
          need: "review.comment.view",
          stub:
            "评论审核 · 设计中。按项目开通；含 AI 评论与社区评论等推过来的评论待审（不再分站内/外站）。产品债务：须补「评论预览」"
        },
        {
          id: "r_user",
          label: "用户审核",
          need: "review.user.view",
          stub: "用户审核 · 设计中。按项目开通"
        },
        {
          id: "r_post",
          label: "帖子审核",
          need: "review.post.view",
          stub: "帖子审核 · 设计中。按项目开通"
        }
      ]
    },
    {
      id: "global",
      label: "全局配置",
      ico: "⚙",
      children: [
        {
          id: "subs",
          label: "子账号与授权",
          href: "pages/subs.html",
          done: true,
          need: "global.subs.accounts.view",
          tourTip:
            "给协作同学开子账号、挂岗位并勾选功能权限（工作台、采集、文章等）。岗位在本页 Tab 里维护。采集号不在这里配，请到对应项目或「TG 采集」里绑定。"
        }
      ]
    }
  ];

  var NAV_SCROLL_KEY = "fz_refactor_nav_scroll";

  function renderSidebar(activeId) {
    var mount = document.getElementById("sidebar");
    if (!mount) return;
    var s = FZStore.read();
    var html = "";
    html += '<div class="brand">';
    html += '<div class="brand-mark">舟</div>';
    html += '<div><div class="brand-text">方舟</div>';
    html += '<div class="brand-sub">业务端 · 重构 Demo</div></div></div>';
    html += '<div class="nav-search"><span>⌕</span><span>搜索 ⌘K</span></div>';
    html += '<div class="nav-section">';

    NAV.forEach(function (group) {
      var kids = (group.children || []).filter(function (c) {
        return !c.need || FZStore.hasFeature(s, c.need);
      });
      if (!kids.length) return;
      var hasDone = kids.some(function (c) {
        return !!c.done;
      });
      var allTodo = kids.every(function (c) {
        return !c.done;
      });
      html +=
        '<div class="nav-group' +
        (allTodo ? " is-todo-group" : "") +
        (hasDone ? " is-done-group" : "") +
        '">';
      html +=
        '<div class="nav-group-title"><span class="ico">' +
        group.ico +
        "</span>" +
        group.label +
        "</div>";
      kids.forEach(function (c) {
        if (c.stub || !c.done) {
          html +=
            '<button type="button" class="nav-item nav-sub is-todo" data-nav-id="' +
            c.id +
            '" data-stub="' +
            (c.stub || c.label) +
            '">' +
            c.label +
            "</button>";
        } else {
          var act = activeId === c.id ? " active" : "";
          html +=
            '<a class="nav-item nav-sub is-done' +
            act +
            '" data-nav-id="' +
            c.id +
            '" href="' +
            BASE +
            c.href +
            '">' +
            c.label +
            "</a>";
        }
      });
      html += "</div>";
    });

    html += "</div>";

    html += '<div class="sidebar-user" id="sidebar-user">';
    html += '<button type="button" class="user-trigger" id="user-menu-btn">';
    html +=
      '<span class="avatar">' +
      (s.displayName || "主").slice(0, 1) +
      "</span>";
    html +=
      '<span class="user-meta"><span class="user-name">' +
      (s.displayName || s.username) +
      '</span><span class="user-role">' +
      (s.accountKind === "sub" ? "子账号" : "主账号") +
      "</span></span>";
    html += '<span class="user-caret">▴</span>';
    html += "</button>";
    html += '<div class="user-menu" id="user-menu" hidden>';
    html += '<button type="button" data-act="pwd">修改密码</button>';
    html += '<button type="button" data-act="profile">个人资料</button>';
    html += '<button type="button" data-act="reset">重置演示数据</button>';
    html += '<button type="button" data-act="logout" class="danger">退出登录</button>';
    html += "</div></div>";

    mount.innerHTML = html;

    var navSec = mount.querySelector(".nav-section");
    if (navSec) {
      try {
        var saved = sessionStorage.getItem(NAV_SCROLL_KEY);
        if (saved != null) navSec.scrollTop = Number(saved) || 0;
      } catch (e) {}
      var activeEl = mount.querySelector(".nav-item.active");
      if (activeEl && typeof activeEl.scrollIntoView === "function") {
        activeEl.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      navSec.addEventListener("scroll", function () {
        try {
          sessionStorage.setItem(NAV_SCROLL_KEY, String(navSec.scrollTop));
        } catch (e2) {}
      });
    }

    mount.querySelectorAll("[data-stub]").forEach(function (el) {
      el.addEventListener("click", function () {
        var msg = el.getAttribute("data-stub") || "";
        toast(/设计中|产品债务/.test(msg) ? msg : msg + " · 设计中");
      });
    });

    var menuBtn = document.getElementById("user-menu-btn");
    var menu = document.getElementById("user-menu");
    if (menuBtn && menu) {
      menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
      });
      document.addEventListener("click", function () {
        menu.hidden = true;
      });
      menu.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      menu.querySelectorAll("[data-act]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var act = btn.getAttribute("data-act");
          menu.hidden = true;
          if (act === "logout") logout();
          else if (act === "reset") {
            if (confirm("重置全部演示数据并回到登录页？")) {
              if (global.FZArticles && typeof FZArticles.reset === "function") {
                FZArticles.reset();
              }
              FZStore.reset();
              /* 双保险：清掉本会话引导防重入标记，重置后登录应再出菜单引导 */
              try {
                var kill = [];
                var si;
                for (si = 0; si < sessionStorage.length; si++) {
                  var sk = sessionStorage.key(si);
                  if (sk && sk.indexOf("fz_tour_auto_") === 0) kill.push(sk);
                }
                kill.forEach(function (k) {
                  sessionStorage.removeItem(k);
                });
              } catch (eClr) {}
              location.href = BASE + "login.html";
            }
          } else if (act === "pwd") toast("修改密码 · 设计中");
          else if (act === "profile") toast("个人资料 · 设计中");
        });
      });
    }

    var topUser = document.getElementById("top-user");
    if (topUser) topUser.innerHTML = "";
  }

  function loadScriptOnce(src, cb) {
    var id = "src:" + src;
    if (document.querySelector('script[data-fz="' + id + '"]')) {
      if (cb) cb();
      return;
    }
    var el = document.createElement("script");
    el.src = BASE + src;
    el.setAttribute("data-fz", id);
    el.onload = function () {
      if (cb) cb();
    };
    document.head.appendChild(el);
  }

  function boot(opts) {
    opts = opts || {};
    if (opts.auth !== false && !requireAuth()) return;
    renderSidebar(opts.active || "");
    function mountHelp() {
      if (global.FZHelpCenter && typeof FZHelpCenter.mount === "function") {
        FZHelpCenter.mount();
      }
    }
    if (global.FZHelpCenter) mountHelp();
    else loadScriptOnce("js/help-center.js?v=20261031fabClick", mountHelp);
    function mountNovice() {
      if (global.FZNovice && typeof FZNovice.consumeQuery === "function") {
        FZNovice.consumeQuery();
      }
    }
    if (global.FZNovice) mountNovice();
    else loadScriptOnce("js/novice-guide.js?v=20261031novice1", mountNovice);
  }

  global.FZShell = {
    BASE: BASE,
    toast: toast,
    escHtml: escHtml,
    tipHtml: tipHtml,
    requireAuth: requireAuth,
    logout: logout,
    boot: boot,
    loadScriptOnce: loadScriptOnce,
    getNav: function () {
      return NAV;
    }
  };
})(window);
