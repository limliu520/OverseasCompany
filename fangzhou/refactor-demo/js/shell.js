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

  function toast(msg) {
    var wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    var el = document.createElement("div");
    el.className = "toast";
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
    }, 2200);
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

  /** 一级菜单均带二级；未做项 stub 点击提示设计中 */
  var NAV = [
    {
      id: "home",
      label: "工作台",
      ico: "⌂",
      children: [{ id: "home", label: "概览", href: "pages/home.html" }]
    },
    {
      id: "projects",
      label: "项目管理",
      ico: "▣",
      children: [
        { id: "projects", label: "项目列表", href: "pages/projects.html" },
        { id: "project_new", label: "新建项目", href: "pages/project-setup.html?new=1" }
      ]
    },
    {
      id: "collect",
      label: "采集",
      ico: "⇩",
      children: [
        { id: "c_web", label: "网站采集配置", stub: "网站采集配置" },
        { id: "c_web_log", label: "网站采集记录", stub: "网站采集记录" },
        { id: "c_tg", label: "TG 采集配置", stub: "TG 采集配置" },
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
        { id: "e_pub", label: "外站发布任务", stub: "外站发布任务" }
      ]
    },
    {
      id: "interact",
      label: "互动能力",
      ico: "◉",
      children: [
        { id: "i_ai", label: "AI 评论生成", stub: "AI 评论生成" },
        { id: "i_air", label: "AI 评论审核", stub: "AI 评论审核" },
        { id: "i_user", label: "用户审核", stub: "用户审核" },
        { id: "i_post", label: "社区帖子", stub: "社区帖子" }
      ]
    },
    {
      id: "global",
      label: "全局配置",
      ico: "⚙",
      children: [
        { id: "subs", label: "子账号与授权", href: "pages/subs.html" },
        { id: "roles", label: "岗位管理", href: "pages/roles.html" },
        { id: "userbot", label: "Userbot", stub: "Userbot" },
        { id: "ext", label: "外站通道", stub: "外站通道" }
      ]
    }
  ];

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
      html += '<div class="nav-group">';
      html +=
        '<div class="nav-group-title"><span class="ico">' +
        group.ico +
        "</span>" +
        group.label +
        "</div>";
      group.children.forEach(function (c) {
        if (c.stub) {
          html +=
            '<button type="button" class="nav-item nav-sub" data-stub="' +
            c.stub +
            '">' +
            c.label +
            "</button>";
        } else {
          var act = activeId === c.id ? " active" : "";
          html +=
            '<a class="nav-item nav-sub' +
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

    mount.querySelectorAll("[data-stub]").forEach(function (el) {
      el.addEventListener("click", function () {
        toast(el.getAttribute("data-stub") + " · 设计中");
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
