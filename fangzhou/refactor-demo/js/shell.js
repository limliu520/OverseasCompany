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
      children: [{ id: "home", label: "概览", href: "pages/home.html", done: true }]
    },
    {
      id: "projects",
      label: "项目管理",
      ico: "▣",
      children: [
        { id: "projects", label: "项目列表", href: "pages/projects.html", done: true }
      ]
    },
    {
      id: "collect",
      label: "采集",
      ico: "⇩",
      children: [
        { id: "c_web", label: "网站采集配置", stub: "网站采集配置" },
        { id: "c_web_log", label: "网站采集记录", stub: "网站采集记录" },
        { id: "c_tg", label: "TG 采集配置", href: "pages/tg-collect.html", done: true },
        { id: "c_review", label: "素材审核", stub: "素材审核" },
        { id: "c_err", label: "采集异常", stub: "采集异常" }
      ]
    },
    {
      id: "edit",
      label: "编辑",
      ico: "✎",
      children: [
        { id: "e_art", label: "文章", stub: "文章" },
        { id: "e_media", label: "修片 / 媒体处理", stub: "修片" },
        { id: "e_pub", label: "发布/提交任务", stub: "发布/提交任务 · 设计中（列表提交与编辑内提交统一交互）" }
      ]
    },
    {
      id: "interact",
      label: "互动能力",
      ico: "◉",
      children: [
        {
          id: "i_ai",
          label: "AI 评论生成",
          stub:
            "AI 评论生成 · 设计中。产品债务：须补「评论预览」（前台地址预览已删）"
        },
        {
          id: "i_air",
          label: "AI 评论审核",
          stub:
            "AI 评论审核 · 设计中。产品债务：须补「评论预览」（前台地址预览已删）"
        },
        { id: "i_user", label: "用户审核", stub: "用户审核" },
        { id: "i_post", label: "社区帖子", stub: "社区帖子" }
      ]
    },
    {
      id: "global",
      label: "全局配置",
      ico: "⚙",
      children: [
        { id: "subs", label: "子账号与授权", href: "pages/subs.html", done: true }
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
      var hasDone = group.children.some(function (c) {
        return !!c.done;
      });
      var allTodo = group.children.every(function (c) {
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
      group.children.forEach(function (c) {
        if (c.stub || !c.done) {
          html +=
            '<button type="button" class="nav-item nav-sub is-todo" data-stub="' +
            (c.stub || c.label) +
            '">' +
            c.label +
            "</button>";
        } else {
          var act = activeId === c.id ? " active" : "";
          html +=
            '<a class="nav-item nav-sub is-done' +
            act +
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
      '</span><span class="user-role">主账号</span></span>';
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
              FZStore.reset();
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

  function boot(opts) {
    opts = opts || {};
    if (opts.auth !== false && !requireAuth()) return;
    renderSidebar(opts.active || "");
  }

  global.FZShell = {
    BASE: BASE,
    toast: toast,
    requireAuth: requireAuth,
    logout: logout,
    boot: boot
  };
})(window);
