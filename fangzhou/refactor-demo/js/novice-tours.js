/* 各模块页内分步教程配置；依赖 novice-tour-kit.js，按 ?novice= 自动 start */
(function (global) {
  if (!global.FZNoviceTour) return;

  function qs(sel) {
    return document.querySelector(sel);
  }

  var TOURS = {};

  function prefillCreateProject() {
    var name = document.getElementById("f-name");
    if (name && !String(name.value || "").trim()) name.value = "教程演示项目";
  }

  /* —— 创建项目 —— */
  TOURS.create_project = FZNoviceTour.create({
    id: "create_project",
    title: "创建项目",
    doneSummary:
      "你已走完创建项目主流程（演示数据未写入真实项目）。点「完成学习」返回工作台；本教程与产品对接、项目列表无跳转关联。",
    modalMaskIds: [],
    exitToast: "已退出教程，返回工作台",
    exitHref: "./home.html",
    replayHref: "./project-setup.html?new=1&novice=create_project",
    onStart: function () {
      setTimeout(prefillCreateProject, 60);
    },
    onStep: function () {
      setTimeout(prefillCreateProject, 40);
    },
    steps: [
      {
        id: "see_steps",
        title: "认识创建步骤",
        tip: "左侧是创建步骤。示例项目名已预填，点「下一步」继续。",
        allow: "",
        spotlight: "#steps",
        strict: true,
        ack: true,
        ackLabel: "下一步"
      },
      {
        id: "fill_next",
        title: "一路下一步 / 跳过",
        tip: "必填已预填。点「下一步」：系统会自动点页脚「下一步 / 跳过」直至演示创建完成，无需手输。",
        allow: "",
        spotlight: "#btn-skip, #btn-next",
        strict: true,
        waitEvent: "created",
        ack: true,
        ackLabel: "下一步",
        onAck: function () {
          prefillCreateProject();
          var ticks = 0;
          var iv = setInterval(function () {
            ticks += 1;
            if (ticks > 24) {
              clearInterval(iv);
              return;
            }
            prefillCreateProject();
            var skip = document.getElementById("btn-skip");
            var next = document.getElementById("btn-next");
            if (skip && skip.style.display !== "none" && !skip.classList.contains("is-disabled")) {
              skip.click();
              return;
            }
            if (next && !next.classList.contains("is-disabled")) next.click();
          }, 140);
        }
      }
    ]
  });

  /* —— 水印 / 文章配置（演示详情页，不依赖真实项目） —— */
  TOURS.edit_project = FZNoviceTour.create({
    id: "edit_project",
    title: "水印、文章配置",
    doneSummary:
      "你已在演示项目详情走过水印与文章配置入口（未写入真实项目）。点「完成学习」返回工作台。",
    modalMaskIds: ["basic-modal"],
    exitHref: "./home.html",
    replayHref:
      "./project-edit.html?id=novice_demo_edit&tab=watermark&novice=edit_project",
    steps: [
      {
        id: "edit_basic",
        title: "认识详情页",
        tip: "演示项目详情。点「下一步」打开「编辑基本信息」再自动关闭，无需手填。",
        allow: "",
        spotlight: "#btn-edit-basic",
        strict: true,
        skipIfMissing: true,
        ack: true,
        ackLabel: "下一步",
        onAck: function (api) {
          var btn = document.getElementById("btn-edit-basic");
          if (btn) btn.click();
          setTimeout(function () {
            var cancel =
              document.querySelector("#basic-modal [data-close], #basic-modal .btn:not(.btn-primary)") ||
              document.getElementById("basic-cancel");
            if (cancel) cancel.click();
            else {
              var mask = document.getElementById("basic-modal");
              if (mask) mask.hidden = true;
            }
            api.advance();
          }, 120);
        }
      },
      {
        id: "wm_tab",
        title: "打开水印管理",
        tip: "点「下一步」切换到水印管理 Tab。",
        allow: "",
        spotlight: '.config-tabs [data-tab="watermark"]',
        strict: true,
        skipIfMissing: true,
        ack: true,
        ackLabel: "下一步",
        onAck: function (api) {
          var t = document.querySelector('.config-tabs [data-tab="watermark"]');
          if (t) t.click();
          setTimeout(function () {
            api.advance();
          }, 40);
        }
      },
      {
        id: "article_tab",
        title: "打开文案管理",
        tip: "点「确认了解」切换到文案管理并完成本教程。",
        allow: "",
        spotlight: '.config-tabs [data-tab="article"]',
        strict: true,
        skipIfMissing: true,
        ack: true,
        ackLabel: "确认了解",
        onAck: function (api) {
          var t = document.querySelector('.config-tabs [data-tab="article"]');
          if (t) t.click();
          setTimeout(function () {
            api.advance();
          }, 40);
        }
      }
    ]
  });

  function prefillWebSiteForm() {
    var typeSel = document.getElementById("wc-f-type");
    if (typeSel) typeSel.value = "short_drama";
    if (window.FZWebCollectForm && typeSel) {
      FZWebCollectForm.fillTargets("short_drama", ["51 短剧"]);
    }
    var name = document.getElementById("wc-f-name");
    var url = document.getElementById("wc-f-url");
    var pages = document.getElementById("wc-f-pages");
    if (name) name.value = "教程演示站";
    if (url) url.value = "https://novice-demo.example.com";
    if (pages) pages.value = "https://novice-demo.example.com/list";
    var first = document.querySelector("#wc-f-targets input[type=checkbox]");
    if (first) first.checked = true;
    var collect = document.getElementById("wc-f-collect");
    var dedup = document.getElementById("wc-f-dedup");
    if (collect) collect.checked = true;
    if (dedup) dedup.checked = true;
  }

  /* —— 网站采集 —— */
  TOURS.web_collect = FZNoviceTour.create({
    id: "web_collect",
    title: "网站采集配置",
    doneSummary:
      "你已走完网站采集主流程：添加网站 → 查看站点卡片 → 浏览采集记录。",
    replayHref: "./website-collect.html?novice=web_collect",
    modalMaskIds: ["wc-site-modal", "wc-prog-modal"],
    steps: [
      {
        id: "add_site",
        title: "添加网站",
        tip: "点「下一步」：自动打开添加弹窗并预填示例，再自动提交，无需手输。",
        allow: "",
        spotlight: "#btn-add-site",
        strict: true,
        ack: true,
        ackLabel: "下一步",
        waitEvent: "site_saved",
        onAck: function () {
          var btn = document.getElementById("btn-add-site");
          if (btn) btn.click();
          setTimeout(function () {
            prefillWebSiteForm();
            setTimeout(function () {
              prefillWebSiteForm();
              var save = document.getElementById("wc-site-save");
              if (save) save.click();
            }, 80);
          }, 100);
        }
      },
      {
        id: "pick_site",
        title: "点选站点卡片",
        tip: "点「下一步」自动选中演示站点卡片，下方会联动采集记录。",
        allow: "",
        spotlight: "#wc-sites .wc-site-card, #wc-sites [data-site], #wc-sites > *",
        strict: true,
        ack: true,
        ackLabel: "下一步",
        skipIfMissing: true,
        onAck: function (api) {
          var card =
            document.querySelector("#wc-sites .wc-site-card") ||
            document.querySelector("#wc-sites [data-site]");
          if (card) card.click();
          setTimeout(function () {
            api.advance();
          }, 40);
        }
      },
      {
        id: "records",
        title: "看采集记录",
        tip: "这里是采集记录区。新站可能暂时没有数据，知道位置即可。",
        allow: "",
        spotlight: ".wc-record-head, #wc-records",
        strict: true,
        ack: true,
        ackLabel: "确认了解"
      }
    ]
  });

  /* —— 素材管理（严格路径：不让点未引导的 Tab / 审核通过） —— */
  function matPrepareListStep() {
    if (window.FZMatApp) {
      if (FZMatApp.setTab) FZMatApp.setTab("all");
      if (FZMatApp.setScope) FZMatApp.setScope("pool");
      setTimeout(function () {
        if (FZMatApp.markTourHitRow) FZMatApp.markTourHitRow();
      }, 40);
    }
  }

  TOURS.materials = FZNoviceTour.create({
    id: "materials",
    title: "素材管理",
    doneSummary:
      "你已走完素材管理主路径：认识三视图 → 在公共素材池打开详情 → 了解详情结构。",
    replayHref: "./materials.html?novice=materials&tab=all&scope=pool",
    modalMaskIds: [
      "mat-detail-mask",
      "mat-xfer-mask",
      "mat-reject-mask",
      "mat-targets-mask"
    ],
    onStart: function () {
      matPrepareListStep();
    },
    onStep: function (step) {
      if (!step) return;
      if (step.id === "open_detail" || step.id === "tabs") matPrepareListStep();
    },
    steps: [
      {
        id: "tabs",
        title: "认识素材视图",
        tip: "顶部有三个视图。本教程只走「全部素材 → 平台公共素材池」，点「下一步」继续。",
        allow: "",
        spotlight: "#mat-tabs",
        strict: true,
        ack: true,
        ackLabel: "下一步"
      },
      {
        id: "open_detail",
        title: "打开素材详情",
        tip: "已切到平台公共素材池并标出示例行。点「下一步」自动打开详情，无需手点表格。",
        allow: "",
        spotlight: "#mat-root tbody tr[data-tour-hit]",
        waitEvent: "detail_open",
        strict: true,
        skipIfMissing: true,
        ack: true,
        ackLabel: "下一步",
        onAck: function () {
          matPrepareListStep();
          setTimeout(function () {
            var row = document.querySelector("#mat-root tbody tr[data-tour-hit]");
            var detail =
              row &&
              row.querySelector('[data-row="detail"]');
            if (detail) detail.click();
            else if (row) row.click();
          }, 60);
        }
      },
      {
        id: "detail_actions",
        title: "看详情结构",
        tip: "这是素材详情。审核通过等不在本教程路径，点「确认了解」完成即可。",
        allow: "",
        spotlight: "#mat-detail-mask .mat-detail",
        strict: true,
        ack: true,
        ackLabel: "确认了解"
      }
    ]
  });

  /* —— 文章管理 —— */
  TOURS.articles = FZNoviceTour.create({
    id: "articles",
    title: "文章管理",
    doneSummary:
      "你已熟悉文章列表：筛选 → 预览。教程只在本页演示，不会进入真实编辑页。",
    replayHref: "./articles.html?novice=articles",
    modalMaskIds: ["art-preview-mask", "art-confirm-mask", "art-compare-mask"],
    steps: [
      {
        id: "filter",
        title: "认识筛选",
        tip: "上方可按项目 / 状态筛选。点「下一步」自动点一次刷新，无需手输。",
        allow: "",
        spotlight: ".list-toolbar, #art-f-search",
        strict: true,
        ack: true,
        ackLabel: "下一步",
        onAck: function (api) {
          var btn =
            document.getElementById("art-f-refresh") ||
            document.getElementById("art-f-search");
          if (btn) btn.click();
          setTimeout(function () {
            api.advance();
          }, 40);
        }
      },
      {
        id: "preview_or_edit",
        title: "打开预览",
        tip: "点「下一步」打开第一条预览。本教程不进入编辑页。",
        allow: "",
        spotlight: "#art-tbody tr",
        strict: true,
        skipIfMissing: true,
        ack: true,
        ackLabel: "下一步",
        onAck: function (api) {
          var row = document.querySelector("#art-tbody tr");
          if (row) row.click();
          setTimeout(function () {
            api.advance();
          }, 80);
        }
      },
      {
        id: "close_or_done",
        title: "确认列表能力",
        tip: "预览可关闭。点「确认了解」完成本教程。",
        allow: "",
        spotlight: ".fz-table--art, #art-preview-mask .modal",
        strict: true,
        ack: true,
        ackLabel: "确认了解"
      }
    ]
  });

  function prefillSubWizard() {
    var u = document.getElementById("sub-user");
    var n = document.getElementById("sub-name");
    if (u) u.value = "novice_demo_" + Date.now().toString(36).slice(-4);
    if (n) n.value = "教程演示号";
    var proj = document.querySelector("#sub-modal input[type=checkbox]");
    if (proj) proj.checked = true;
  }

  /* —— 子账号与授权 —— */
  TOURS.subs = FZNoviceTour.create({
    id: "subs",
    title: "子账号与授权",
    doneSummary:
      "你已走完子账号与授权主流程：切 Tab → 创建/查看子账号向导 → 了解岗位。",
    replayHref: "./subs.html?novice=subs",
    modalMaskIds: ["sub-modal", "role-modal"],
    steps: [
      {
        id: "tabs",
        title: "子账号 / 岗位 Tab",
        tip: "本页有「子账号」「岗位」两个 Tab。点「下一步」先看岗位。",
        allow: "",
        spotlight: "#tab-roles",
        strict: true,
        ack: true,
        ackLabel: "下一步",
        onAck: function (api) {
          var t = document.getElementById("tab-roles");
          if (t) t.click();
          setTimeout(function () {
            api.advance();
          }, 40);
        }
      },
      {
        id: "back_subs",
        title: "回到子账号",
        tip: "点「下一步」回到子账号 Tab。",
        allow: "",
        spotlight: "#tab-subs",
        strict: true,
        ack: true,
        ackLabel: "下一步",
        onAck: function (api) {
          var t = document.getElementById("tab-subs");
          if (t) t.click();
          setTimeout(function () {
            api.advance();
          }, 40);
        }
      },
      {
        id: "create_sub",
        title: "创建子账号",
        tip: "点「下一步」打开创建向导并预填示例账号，再自动保存。无需手输。",
        allow: "",
        spotlight: "#btn-primary-act",
        waitEvent: "sub_wizard_done",
        strict: true,
        ack: true,
        ackLabel: "下一步",
        onAck: function () {
          var btn = document.getElementById("btn-primary-act");
          if (btn) btn.click();
          setTimeout(function () {
            prefillSubWizard();
            var next = document.getElementById("sub-next");
            if (next) next.click();
            setTimeout(function () {
              prefillSubWizard();
              var next2 = document.getElementById("sub-next");
              if (next2) next2.click();
              setTimeout(function () {
                var save = document.getElementById("sub-save");
                var cancel = document.getElementById("sub-cancel");
                if (save) save.click();
                else if (cancel) cancel.click();
              }, 80);
            }, 80);
          }, 100);
        }
      }
    ]
  });

  function currentTourId() {
    try {
      return new URLSearchParams(location.search).get("novice") || "";
    } catch (e) {
      return "";
    }
  }

  function boot() {
    var id = currentTourId();
    var tour = TOURS[id];
    if (!tour) return;
    tour.start();
  }

  global.FZNoviceTours = {
    all: TOURS,
    get: function (id) {
      return TOURS[id] || null;
    },
    boot: boot,
    notify: function (id, kind) {
      var t = TOURS[id];
      if (t) t.notify(kind);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    setTimeout(boot, 0);
  }
})(window);
