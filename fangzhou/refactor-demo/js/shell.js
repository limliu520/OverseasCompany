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
  var THEME_KEY = "fz_ui_theme";
  var _themeMql =
    window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  /** 用户偏好：light | dark | auto */
  function themePreference() {
    try {
      var saved = localStorage.getItem(THEME_KEY);
      if (saved === "dark" || saved === "light" || saved === "auto") return saved;
    } catch (e) {}
    return "auto";
  }

  function systemTheme() {
    return _themeMql && _themeMql.matches ? "dark" : "light";
  }

  /** 实际生效的深浅色 */
  function resolvedTheme(pref) {
    var p = pref || themePreference();
    if (p === "auto") return systemTheme();
    return p === "dark" ? "dark" : "light";
  }

  function currentTheme() {
    return resolvedTheme(themePreference());
  }

  function syncThemeSwitch(pref) {
    var sw = document.getElementById("fz-theme-switch");
    if (!sw) return;
    var p =
      pref === "dark" || pref === "light" || pref === "auto" ? pref : "auto";
    sw.setAttribute("data-mode", p);
    sw.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      btn.setAttribute(
        "aria-checked",
        btn.getAttribute("data-theme-set") === p ? "true" : "false"
      );
    });
  }

  function applyResolved(resolved) {
    document.documentElement.setAttribute(
      "data-theme",
      resolved === "dark" ? "dark" : "light"
    );
  }

  function applyTheme(theme) {
    var p =
      theme === "dark" || theme === "light" || theme === "auto" ? theme : "auto";
    try {
      localStorage.setItem(THEME_KEY, p);
    } catch (e) {}
    applyResolved(resolvedTheme(p));
    syncThemeSwitch(p);
    return p;
  }

  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    setTheme(next);
  }

  function setTheme(theme, opts) {
    opts = opts || {};
    var prevPref = themePreference();
    var prevResolved = resolvedTheme(prevPref);
    var nextPref = applyTheme(theme);
    var nextResolved = resolvedTheme(nextPref);
    if (opts.silent) return nextPref;
    if (nextPref !== prevPref || nextResolved !== prevResolved) {
      var msg =
        nextPref === "auto"
          ? "已跟随系统外观（当前" +
            (nextResolved === "dark" ? "深色" : "浅色") +
            "）"
          : nextResolved === "dark"
            ? "已切换深色外观"
            : "已切换浅色外观";
      toast(msg, "ok");
    }
    return nextPref;
  }

  function onSystemThemeChange() {
    if (themePreference() !== "auto") return;
    applyResolved(systemTheme());
  }

  if (_themeMql) {
    if (_themeMql.addEventListener) {
      _themeMql.addEventListener("change", onSystemThemeChange);
    } else if (_themeMql.addListener) {
      _themeMql.addListener(onSystemThemeChange);
    }
  }

  applyTheme(themePreference());

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

  var _confirmCb = null;

  function ensureConfirmModal() {
    var mask = document.getElementById("fz-shell-confirm");
    if (mask) return mask;
    mask = document.createElement("div");
    mask.className = "modal-mask";
    mask.id = "fz-shell-confirm";
    mask.hidden = true;
    mask.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="fz-shell-confirm-title">' +
      '<h2 id="fz-shell-confirm-title">确认</h2>' +
      '<p id="fz-shell-confirm-msg"></p>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="fz-shell-confirm-cancel">取消</button>' +
      '<button type="button" class="btn btn-primary" id="fz-shell-confirm-ok">确定</button>' +
      "</div></div>";
    document.body.appendChild(mask);
    function close() {
      mask.hidden = true;
      _confirmCb = null;
    }
    mask.querySelector("#fz-shell-confirm-cancel").addEventListener("click", close);
    mask.querySelector("#fz-shell-confirm-ok").addEventListener("click", function () {
      var fn = _confirmCb;
      close();
      if (fn) fn();
    });
    /* 二次确认：点遮罩不关闭（modal-mask-dismiss） */
    return mask;
  }

  /**
   * 页内二次确认（预览里原生 confirm 常被挡）。
   * @param {{ title?: string, message?: string, okText?: string, cancelText?: string, danger?: boolean, onOk?: function }} opts
   */
  function confirm(opts) {
    opts = opts || {};
    var mask = ensureConfirmModal();
    mask.querySelector("#fz-shell-confirm-title").textContent = opts.title || "确认";
    mask.querySelector("#fz-shell-confirm-msg").textContent = opts.message || "";
    var okBtn = mask.querySelector("#fz-shell-confirm-ok");
    var cancelBtn = mask.querySelector("#fz-shell-confirm-cancel");
    okBtn.textContent = opts.okText || "确定";
    cancelBtn.textContent = opts.cancelText || "取消";
    okBtn.className = "btn " + (opts.danger ? "btn-danger" : "btn-primary");
    _confirmCb = typeof opts.onOk === "function" ? opts.onOk : null;
    mask.hidden = false;
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
   * - 未做模块用 stub，点击 Toast「{菜单名}，方案重构中」
   */
  /** done: 本 Demo 已可点可演示；无 done 且 stub = 未做（侧栏降透） */
  var NAV = [
    {
      id: "home",
      label: "工作台",
      ico: "⌂",
      href: "pages/home.html",
      done: true,
      need: "home.overview.view",
      leaf: true,
      tourSkip: true
    },
    {
      id: "collect",
      label: "采集中心",
      ico: "⇩",
      children: [
        {
          id: "c_tg",
          label: "TG 采集配置",
          ico: "✈",
          href: "pages/tg-collect.html",
          done: true,
          need: "collect.tg.view",
          tourTip:
            "配置 Telegram 采集：添加采集号、绑定源频道，公共池还可配「源→目标」路由。号掉线、频道 not a member、路由体检失败时，可从工作台「状态与异常提醒」跳回这里处理。"
        },
        {
          id: "c_web",
          label: "网站采集配置",
          ico: "◎",
          href: "pages/website-collect.html",
          done: true,
          need: "collect.web.view",
          tourTip:
            "配置网站采集任务：添加站点、填写采集规则，查看技术接入中 / 已接入记录。技术接入中的站点不可改配置；需要停用或调整时，等接入完成后再编辑。"
        },
        {
          id: "c_mat",
          label: "素材管理",
          ico: "▤",
          href: "pages/materials.html",
          done: true,
          need: "collect.materials.view",
          tourTip:
            "处理采进来的素材。顶部切换「待审核 / 全部 / 垃圾」。全部素材里「全平台」只有「平台公共素材池」，含各主账号、各项目的料；进了项目的也留在池里。后面「项目」是其中一份。垃圾可恢复。"
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
          ico: "✎",
          href: "pages/articles.html",
          done: true,
          need: "content.article.view",
          tourTip:
            "管理进入内容通道的稿件：查看待编、失败、已推等状态。点开可二次编辑正文与封面，确认后推送给业务方。工作台「当前待处理稿件」会汇总需要你动手的条目。"
        },
        {
          id: "i_ai",
          label: "AI 评论",
          ico: "✦",
          need: "content.ai_cmt.view",
          stub:
            "AI 评论（生成）· 设计中。产品债务：须补「评论预览」（前台地址预览已删）"
        },
        {
          id: "e_pull_wm",
          label: "拉取加水印",
          ico: "▣",
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
          ico: "◇",
          need: "review.comment.view",
          stub:
            "评论审核 · 设计中。按项目开通；含 AI 评论与社区评论等推过来的评论待审（不再分站内/外站）。产品债务：须补「评论预览」"
        },
        {
          id: "r_user",
          label: "用户审核",
          ico: "○",
          need: "review.user.view",
          stub: "用户审核 · 设计中。按项目开通"
        },
        {
          id: "r_post",
          label: "帖子审核",
          ico: "☰",
          need: "review.post.view",
          stub: "帖子审核 · 设计中。按项目开通"
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
          ico: "▣",
          href: "pages/projects.html",
          done: true,
          need: "projects.list.view",
          tourTip:
            "这里管理所有业务项目：一个项目对应一套文章内容通道。新建时配齐基本信息与对接材料；待接通项目可点「对接」交给开发。日常改水印、模板、自动流等，从「项目详情」进入。"
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
          ico: "⚙",
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
    html +=
      '<div class="nav-search" role="search">' +
      '<span class="nav-search-ico" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.2-3.2"/></svg></span>' +
      '<span class="nav-search-ph">搜索</span>' +
      '<kbd class="nav-search-kbd">⌘K</kbd></div>';
    html += '<div class="nav-section">';

    NAV.forEach(function (group) {
      var isLeaf =
        !!group.leaf ||
        (!!(group.href || group.stub) && !(group.children && group.children.length));
      if (isLeaf) {
        if (group.need && !FZStore.hasFeature(s, group.need)) return;
        if (group.stub || !group.done) {
          html +=
            '<button type="button" class="nav-item nav-top is-todo" data-nav-id="' +
            group.id +
            '" data-stub="1"><span class="ico" aria-hidden="true">' +
            (group.ico || "") +
            "</span>" +
            group.label +
            "</button>";
        } else {
          var leafAct = activeId === group.id ? " active" : "";
          html +=
            '<a class="nav-item nav-top is-done' +
            leafAct +
            '" data-nav-id="' +
            group.id +
            '" href="' +
            BASE +
            group.href +
            '"><span class="ico" aria-hidden="true">' +
            (group.ico || "") +
            "</span>" +
            group.label +
            "</a>";
        }
        return;
      }

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
      /* 分组标题无 icon；可点项才带 icon（对齐 Trackify） */
      html += '<div class="nav-group-title">' + group.label + "</div>";
      kids.forEach(function (c) {
        var ico =
          '<span class="ico" aria-hidden="true">' + (c.ico || "") + "</span>";
        if (c.stub || !c.done) {
          html +=
            '<button type="button" class="nav-item nav-sub is-todo" data-nav-id="' +
            c.id +
            '" data-stub="1">' +
            ico +
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
            ico +
            c.label +
            "</a>";
        }
      });
      html += "</div>";
    });

    html += "</div>";

    /* 帮助入口固定在侧栏账户上方（不再右下角悬浮） */
    html += '<div class="sidebar-help" id="fz-help-slot"></div>';

    var themePref = themePreference();
    html +=
      '<div class="sidebar-theme">' +
      '<div class="theme-switch" id="fz-theme-switch" data-mode="' +
      themePref +
      '" role="radiogroup" aria-label="外观模式">' +
      '<span class="theme-switch-thumb" aria-hidden="true"></span>' +
      '<button type="button" class="theme-switch-opt theme-switch-opt--auto" data-theme-set="auto" role="radio" aria-checked="' +
      (themePref === "auto" ? "true" : "false") +
      '" title="跟随系统" aria-label="跟随系统">' +
      '<span class="theme-switch-auto">Auto</span></button>' +
      '<button type="button" class="theme-switch-opt" data-theme-set="light" role="radio" aria-checked="' +
      (themePref === "light" ? "true" : "false") +
      '" title="浅色外观" aria-label="浅色外观">' +
      '<svg class="theme-switch-ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/>' +
      '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M12 2.8v2.2M12 19v2.2M2.8 12h2.2M19 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M5.1 18.9l1.6-1.6M17.3 6.7l1.6-1.6"/>' +
      "</svg></button>" +
      '<button type="button" class="theme-switch-opt" data-theme-set="dark" role="radio" aria-checked="' +
      (themePref === "dark" ? "true" : "false") +
      '" title="深色外观" aria-label="深色外观">' +
      '<svg class="theme-switch-ico" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">' +
      '<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.4A7.2 7.2 0 0 1 10.6 4.5 7.4 7.4 0 1 0 19.5 13.4z"/>' +
      "</svg></button>" +
      "</div></div>";

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
    html += '<span class="user-caret" aria-hidden="true">⇅</span>';
    html += "</button>";
    html += '<div class="user-menu" id="user-menu" hidden>';
    html += '<button type="button" data-act="pwd">修改密码</button>';
    html += '<button type="button" data-act="profile">个人资料</button>';
    html += '<button type="button" data-act="reset">重置演示数据</button>';
    html += '<button type="button" data-act="logout" class="danger">退出登录</button>';
    html += "</div></div>";

    mount.innerHTML = html;
    syncThemeSwitch(themePref);

    var themeSwitch = document.getElementById("fz-theme-switch");
    if (themeSwitch) {
      themeSwitch.querySelectorAll("[data-theme-set]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          setTheme(btn.getAttribute("data-theme-set"));
        });
      });
    }

    var navSec = mount.querySelector(".nav-section");
    if (navSec) {
      var activeEl = mount.querySelector(".nav-item.active");
      /*
       * 记忆滚动 + scrollIntoView 会在切到「采集中心」等项时把上方「工作台」顶出视口。
       * 规则：当前项本可完整落在首屏 → 强制 scrollTop=0；否则再 nearest 滚到可见。
       */
      try {
        var saved = sessionStorage.getItem(NAV_SCROLL_KEY);
        if (saved != null) navSec.scrollTop = Number(saved) || 0;
      } catch (e) {}
      if (activeEl) {
        var fitsTop =
          activeEl.offsetTop + activeEl.offsetHeight <= navSec.clientHeight;
        if (fitsTop) {
          navSec.scrollTop = 0;
        } else if (typeof activeEl.scrollIntoView === "function") {
          activeEl.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
        try {
          sessionStorage.setItem(NAV_SCROLL_KEY, String(navSec.scrollTop));
        } catch (eSave) {}
      }
      navSec.addEventListener("scroll", function () {
        try {
          sessionStorage.setItem(NAV_SCROLL_KEY, String(navSec.scrollTop));
        } catch (e2) {}
      });
    }

    mount.querySelectorAll("[data-stub]").forEach(function (el) {
      el.addEventListener("click", function () {
        var name = (el.textContent || "").replace(/\s+/g, " ").trim() || "该功能";
        toast(name + "，方案重构中");
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
          } else if (act === "pwd" || act === "profile") {
            loadScriptOnce("js/account-self.js?v=20261106tg1", function () {
              if (!global.FZAccount) return;
              if (act === "pwd") global.FZAccount.openPassword();
              else global.FZAccount.openProfile();
            });
          }
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

  /** 弹窗右上角 ×：data-dismiss-for 点等同按钮；data-dismiss-mask 直接关遮罩 */
  function bindModalDismiss() {
    if (document.documentElement.getAttribute("data-fz-modal-dismiss") === "1") return;
    document.documentElement.setAttribute("data-fz-modal-dismiss", "1");
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-dismiss-for], [data-dismiss-mask]");
      if (!b) return;
      var forId = b.getAttribute("data-dismiss-for");
      if (forId) {
        var t = document.getElementById(forId);
        if (t) t.click();
        return;
      }
      var maskId = b.getAttribute("data-dismiss-mask");
      if (maskId) {
        var m = document.getElementById(maskId);
        if (m) m.hidden = true;
      }
    });
  }
  bindModalDismiss();

  function boot(opts) {
    opts = opts || {};
    if (opts.auth !== false && !requireAuth()) return;
    bindModalDismiss();
    renderSidebar(opts.active || "");
    function mountHelp() {
      if (global.FZHelpCenter && typeof FZHelpCenter.mount === "function") {
        FZHelpCenter.mount();
      }
    }
    if (global.FZHelpCenter) mountHelp();
    else loadScriptOnce("js/help-center.js?v=20261106perm2", mountHelp);
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
    confirm: confirm,
    escHtml: escHtml,
    tipHtml: tipHtml,
    requireAuth: requireAuth,
    logout: logout,
    boot: boot,
    loadScriptOnce: loadScriptOnce,
    applyTheme: applyTheme,
    currentTheme: currentTheme,
    themePreference: themePreference,
    resolvedTheme: resolvedTheme,
    toggleTheme: toggleTheme,
    setTheme: setTheme,
    getNav: function () {
      return NAV;
    }
  };
})(window);
