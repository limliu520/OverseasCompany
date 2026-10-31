/* 工作台新手教程：按权限裁剪；从任务跳转带 ?novice=；到达目标页即记完成 */
(function (global) {
  var STEPS = [
    {
      id: "create_project",
      title: "创建项目",
      desc: "分步体验：看步骤条 → 填写创建 → 看到成功。",
      need: "projects.list.create"
    },
    {
      id: "edit_project",
      title: "编辑项目",
      desc: "分步体验：项目详情 → 改基本信息 → 切换配置 Tab。",
      need: "projects.list.view"
    },
    {
      id: "tg_collect",
      title: "TG 采集配置",
      desc: "分步体验：切换项目 → 加号 → 加频道 → 公共池建路由。",
      need: "collect.tg.view"
    },
    {
      id: "web_collect",
      title: "网站采集配置",
      desc: "分步体验：添加网站 → 点选站点 → 看采集记录。",
      need: "collect.web.view"
    },
    {
      id: "materials",
      title: "素材管理",
      desc: "分步体验：切换视图 → 打开详情 → 看审核入口。",
      need: "collect.materials.view"
    },
    {
      id: "articles",
      title: "文章管理",
      desc: "分步体验：筛选列表 → 预览或进入编辑。",
      need: "content.article.view"
    },
    {
      id: "subs",
      title: "子账号与授权",
      desc: "分步体验：切 Tab → 走创建子账号向导。",
      need: "global.subs.accounts.view"
    }
  ];

  function esc(s) {
    return global.FZShell ? FZShell.escHtml(s) : String(s || "");
  }

  function pageBase() {
    var p = location.pathname || "";
    return /\/pages\//.test(p) ? "./" : "pages/";
  }

  function hrefFor(step, state) {
    var base = pageBase();
    var q = "novice=" + encodeURIComponent(step.id);
    if (step.id === "create_project") {
      return base + "project-setup.html?new=1&" + q;
    }
    if (step.id === "edit_project") {
      var list =
        FZStore.businessProjects && FZStore.businessProjects(state)
          ? FZStore.businessProjects(state)
          : [];
      if (list.length) {
        return (
          base +
          "project-edit.html?id=" +
          encodeURIComponent(list[0].id) +
          "&" +
          q
        );
      }
      return base + "projects.html?" + q;
    }
    if (step.id === "tg_collect") return base + "tg-collect.html?" + q;
    if (step.id === "web_collect") return base + "website-collect.html?" + q;
    if (step.id === "materials") return base + "materials.html?" + q;
    if (step.id === "articles") return base + "articles.html?" + q;
    if (step.id === "subs") return base + "subs.html?" + q;
    return base + "home.html";
  }

  function visibleSteps(state) {
    state = state || FZStore.read();
    return STEPS.filter(function (step) {
      return !step.need || FZStore.hasFeature(state, step.need);
    });
  }

  function doneMap(state) {
    state = state || FZStore.read();
    var all = state.noviceDoneByAccount || {};
    return all[FZStore.accountKey(state)] || {};
  }

  function isDone(state, stepId) {
    return !!doneMap(state)[stepId];
  }

  function markDone(stepId) {
    if (!stepId || !FZStore) return false;
    var st = FZStore.read();
    if (!st.noviceDoneByAccount) st.noviceDoneByAccount = {};
    var key = FZStore.accountKey(st);
    if (!st.noviceDoneByAccount[key]) st.noviceDoneByAccount[key] = {};
    if (st.noviceDoneByAccount[key][stepId]) {
      FZStore.write(st);
      return false;
    }
    st.noviceDoneByAccount[key][stepId] = true;
    FZStore.write(st);
    return true;
  }

  function isCollapsed(state) {
    state = state || FZStore.read();
    var map = state.noviceCollapsedByAccount || {};
    return !!map[FZStore.accountKey(state)];
  }

  function setCollapsed(collapsed) {
    var st = FZStore.read();
    if (!st.noviceCollapsedByAccount) st.noviceCollapsedByAccount = {};
    st.noviceCollapsedByAccount[FZStore.accountKey(st)] = !!collapsed;
    FZStore.write(st);
  }

  /** 进入即记完成；有页内分步教程的模块跳过，改由「完成学习」勾选 */
  var INTERACTIVE_TOURS = {
    create_project: true,
    edit_project: true,
    tg_collect: true,
    web_collect: true,
    materials: true,
    articles: true,
    subs: true
  };
  function consumeQuery() {
    try {
      var step = new URLSearchParams(location.search).get("novice");
      if (!step || INTERACTIVE_TOURS[step]) return;
      markDone(step);
    } catch (e) {}
  }

  function progress(state) {
    var steps = visibleSteps(state);
    var done = 0;
    steps.forEach(function (s) {
      if (isDone(state, s.id)) done += 1;
    });
    return { total: steps.length, done: done, steps: steps };
  }

  function renderWorkbench(mount) {
    if (!mount || !FZStore) return;
    var state = FZStore.read();
    var prog = progress(state);
    if (!prog.total) {
      mount.hidden = true;
      mount.innerHTML = "";
      return;
    }
    mount.hidden = false;
    var collapsed = isCollapsed(state) && prog.done >= prog.total;
    var emptyOn =
      FZStore.isEmptyOnboarding && FZStore.isEmptyOnboarding(state);

    if (collapsed) {
      mount.innerHTML =
        '<div class="wb-novice wb-novice--collapsed card card-pad">' +
        '<div class="wb-novice-head">' +
        "<div><h2>新手教程</h2>" +
        '<p class="wb-novice-sum">已完成全部 ' +
        prog.total +
        " 项，可随时回看。</p></div>" +
        '<button type="button" class="btn btn-ghost btn-sm" data-novice-expand>展开</button>' +
        "</div></div>";
      return;
    }

    var cards = prog.steps
      .map(function (step, i) {
        var done = isDone(state, step.id);
        var focus = emptyOn && step.id === "create_project" && !done;
        var href = hrefFor(step, state);
        return (
          '<a class="wb-novice-card' +
          (done ? " is-done" : "") +
          (focus ? " is-focus" : "") +
          '" href="' +
          esc(href) +
          '" data-novice-step="' +
          esc(step.id) +
          '">' +
          '<span class="wb-novice-idx">' +
          (done ? "✓" : String(i + 1)) +
          "</span>" +
          '<span class="wb-novice-txt"><strong>' +
          esc(step.title) +
          "</strong><span>" +
          esc(step.desc) +
          "</span></span>" +
          '<span class="wb-novice-go">' +
          (done ? "再看一次" : "去学习") +
          "</span></a>"
        );
      })
      .join("");

    mount.innerHTML =
      '<div class="wb-novice card card-pad">' +
      '<div class="wb-novice-head">' +
      "<div><h2>新手教程</h2>" +
      '<p class="wb-novice-sum">按你的权限逐步认识方舟 · 已完成 ' +
      prog.done +
      " / " +
      prog.total +
      "（从这里进入会带上教程标记，便于后续页内说明）</p></div>" +
      (prog.done >= prog.total
        ? '<button type="button" class="btn btn-ghost btn-sm" data-novice-collapse>收起</button>'
        : "") +
      "</div>" +
      '<div class="wb-novice-track">' +
      cards +
      "</div></div>";
  }

  function bindWorkbench(mount) {
    if (!mount || mount.getAttribute("data-novice-bound")) return;
    mount.setAttribute("data-novice-bound", "1");
    mount.addEventListener("click", function (e) {
      if (e.target.closest("[data-novice-collapse]")) {
        e.preventDefault();
        setCollapsed(true);
        renderWorkbench(mount);
        return;
      }
      if (e.target.closest("[data-novice-expand]")) {
        e.preventDefault();
        setCollapsed(false);
        renderWorkbench(mount);
      }
    });
  }

  global.FZNovice = {
    STEPS: STEPS,
    visibleSteps: visibleSteps,
    isDone: isDone,
    markDone: markDone,
    consumeQuery: consumeQuery,
    progress: progress,
    hrefFor: hrefFor,
    renderWorkbench: renderWorkbench,
    bindWorkbench: bindWorkbench,
    isFromNovice: function () {
      try {
        return !!new URLSearchParams(location.search).get("novice");
      } catch (e) {
        return false;
      }
    }
  };
})(window);
