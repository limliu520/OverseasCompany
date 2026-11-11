/* 工作台新手教程：按权限裁剪；入口进独立静态演示页（不挂真实业务页） */
(function (global) {
  var STEPS = [
    {
      id: "create_project",
      title: "创建项目",
      desc: "独立演示页：认识步骤 → 预填示意 → 完成。",
      need: "projects.list.proj_new",
      page: "novice/create-project.html"
    },
    {
      id: "edit_project",
      title: "水印、文章配置",
      desc: "独立演示页：编辑入口 → 水印 Tab → 文案 Tab。",
      need: "projects.list.view",
      page: "novice/edit-project.html"
    },
    {
      id: "tg_collect",
      title: "TG 采集配置",
      desc: "独立演示页：业务项目 / 公共池 → 加号 → 频道 → 路由。",
      need: "collect.tg.view",
      page: "novice/tg-collect.html"
    },
    {
      id: "web_collect",
      title: "网站采集配置",
      desc: "独立演示页：添加网站 → 站点卡片 → 采集记录。",
      need: "collect.web.view",
      page: "novice/web-collect.html"
    },
    {
      id: "materials",
      title: "素材管理",
      desc: "独立演示页：三视图 → 列表 → 详情结构。",
      need: "collect.materials.view",
      page: "novice/materials.html"
    },
    {
      id: "articles",
      title: "文章管理",
      desc: "独立演示页：筛选 → 列表 → 预览。",
      need: "content.article.view",
      page: "novice/articles.html"
    },
    {
      id: "subs",
      title: "子账号与授权",
      desc: "独立演示页：岗位 / 子账号 Tab → 创建入口。",
      need: "global.subs.accounts.view",
      page: "novice/subs.html"
    }
  ];

  function esc(s) {
    return global.FZShell ? FZShell.escHtml(s) : String(s || "");
  }

  function pageBase() {
    var p = location.pathname || "";
    return /\/pages\//.test(p) ? "./" : "pages/";
  }

  function hrefFor(step) {
    var base = pageBase();
    if (step && step.page) return base + step.page;
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

  /** 旧 ?novice= 挂业务页已废弃；保留空实现避免 shell 报错 */
  function consumeQuery() {}

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
    /* 无权限项，或全部学完：整卡消失（不再提供「收起 / 展开」） */
    if (!prog.total || prog.done >= prog.total) {
      mount.hidden = true;
      mount.innerHTML = "";
      return;
    }
    mount.hidden = false;
    var emptyOn =
      FZStore.isEmptyOnboarding && FZStore.isEmptyOnboarding(state);

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
          "</strong></span>" +
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
      "（全部完成后本卡自动消失；每项为独立演示页）</p></div>" +
      "</div>" +
      '<div class="wb-novice-track" style="--wb-novice-n:' +
      prog.total +
      '">' +
      cards +
      "</div></div>";
  }

  function bindWorkbench(mount) {
    if (!mount || mount.getAttribute("data-novice-bound")) return;
    mount.setAttribute("data-novice-bound", "1");
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
