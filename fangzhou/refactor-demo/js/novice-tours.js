/* 各模块页内分步教程配置；依赖 novice-tour-kit.js，按 ?novice= 自动 start */
(function (global) {
  if (!global.FZNoviceTour) return;

  function qs(sel) {
    return document.querySelector(sel);
  }

  var TOURS = {};

  /* —— 创建项目 —— */
  TOURS.create_project = FZNoviceTour.create({
    id: "create_project",
    title: "创建项目",
    doneSummary:
      "你已走完创建项目主流程（演示数据未写入真实项目）。点「完成学习」返回工作台；本教程与产品对接、项目列表无跳转关联。",
    modalMaskIds: [],
    exitToast: "已退出教程，返回工作台",
    exitHref: "./home.html",
    steps: [
      {
        id: "see_steps",
        title: "认识创建步骤",
        tip: "左侧步骤条会标出当前进度。先点一下步骤条熟悉结构，再去填表。",
        allow: "#steps, #steps *",
        spotlight: "#steps",
        clickAdvance: true
      },
      {
        id: "fill_next",
        title: "必填用「下一步」，可选用「跳过」",
        tip: "先填「项目名称」等必填项，点「下一步」。到可选步骤时「跳过」会出现，可连续点「跳过 / 跳过并创建」。演示创建成功后会出现「学习完成」，不会进入开发对接。",
        allow: "#panel, #panel *, #btn-next, #btn-prev, #btn-skip, #foot-hint",
        /* 必填步会隐藏跳过；优先可见的跳过，否则高亮下一步 */
        spotlight: "#btn-skip, #btn-next",
        waitEvent: "created"
      }
    ]
  });

  /* —— 编辑项目 / 项目详情（列表页或详情页） —— */
  TOURS.edit_project = FZNoviceTour.create({
    id: "edit_project",
    title: "编辑项目",
    doneSummary:
      "你已熟悉项目详情：进入详情 → 编辑基本信息 → 切换配置 Tab。点「完成学习」返回工作台。",
    modalMaskIds: ["basic-modal"],
    exitHref: "./home.html",
    steps: [
      {
        id: "enter_detail",
        title: "打开项目详情",
        tip: "若在列表：点「项目详情」或项目名进入（仍带教程标记）。已在详情页可点顶部「编辑基本信息」继续。",
        allow:
          "#project-list, #project-list *, a[href*='project-edit'], #btn-edit-basic, .detail-hero, .detail-hero *",
        spotlight: "#btn-edit-basic, #project-list .proj-card, #project-list a.btn",
        clickAdvance: true,
        skipIfMissing: true
      },
      {
        id: "edit_basic",
        title: "编辑基本信息",
        tip: "点「编辑基本信息」打开弹窗。Demo 可改名称后保存，或直接取消。",
        allow: "#btn-edit-basic, #basic-modal, #basic-modal *",
        spotlight: "#btn-edit-basic",
        waitEvent: "basic_done",
        skipIfMissing: true
      },
      {
        id: "tabs",
        title: "切换配置 Tab",
        tip: "点下方任一配置 Tab（如水印管理、文章模板），看看各块怎么配。本步只在详情页内切换，不会离开教程。",
        allow: ".config-tabs, .config-tabs *, [data-tab]",
        spotlight: ".config-tabs [data-tab], [data-tab]",
        clickAdvance: true,
        skipIfMissing: true
      }
    ]
  });

  /* —— 网站采集 —— */
  TOURS.web_collect = FZNoviceTour.create({
    id: "web_collect",
    title: "网站采集配置",
    doneSummary:
      "你已走完网站采集主流程：添加网站 → 查看站点卡片 → 浏览采集记录。",
    modalMaskIds: ["wc-site-modal", "wc-prog-modal"],
    steps: [
      {
        id: "add_site",
        title: "添加网站",
        tip: "点右上角「+ 添加网站」。Demo 里名称、域名、页面链接可随便填，保存即可。",
        allow: "#btn-add-site, #wc-site-modal, #wc-site-modal *",
        spotlight: "#btn-add-site",
        waitEvent: "site_saved",
        onAllowClick: function () {
          setTimeout(function () {
            var name = document.getElementById("wc-f-name");
            var url = document.getElementById("wc-f-url");
            var pages = document.getElementById("wc-f-pages");
            if (name && !name.value) name.value = "教程演示站";
            if (url && !url.value) url.value = "https://novice-demo.example.com";
            if (pages && !pages.value)
              pages.value = "https://novice-demo.example.com/list";
            var first = document.querySelector("#wc-f-targets input[type=checkbox]");
            if (first && !document.querySelector("#wc-f-targets input:checked")) {
              first.checked = true;
            }
          }, 80);
        }
      },
      {
        id: "pick_site",
        title: "点选站点卡片",
        tip: "点上方任一站点卡片，下方会筛出该站的采集记录。",
        allow: "#wc-sites, #wc-sites *",
        spotlight: "#wc-sites .wc-site-card, #wc-sites [data-site], #wc-sites > *",
        clickAdvance: true,
        skipIfMissing: true
      },
      {
        id: "records",
        title: "看采集记录",
        tip: "下方是采集记录区，可用筛选缩小范围。点一下记录区域即可完成本步。",
        allow: "#wc-records, #wc-records *, #wc-filters, #wc-filters *",
        spotlight: "#wc-record-title",
        clickAdvance: true
      }
    ]
  });

  /* —— 素材管理 —— */
  TOURS.materials = FZNoviceTour.create({
    id: "materials",
    title: "素材管理",
    doneSummary:
      "你已熟悉素材管理：切换待审/全部视图 → 打开详情 → 了解审核或转编辑入口。",
    modalMaskIds: [
      "mat-detail-mask",
      "mat-xfer-mask",
      "mat-reject-mask",
      "mat-targets-mask"
    ],
    steps: [
      {
        id: "tabs",
        title: "切换素材视图",
        tip: "顶部可切「待审核素材 / 全部素材 / 垃圾素材」。先点「全部素材」或保持待审。",
        allow: "#mat-tabs, #mat-tabs *, #mat-scopes, #mat-scopes *",
        spotlight: "#mat-tabs",
        clickAdvance: true
      },
      {
        id: "open_detail",
        title: "打开素材详情",
        tip: "点列表里某一条的「审核」或行内入口，打开详情弹窗。",
        allow:
          "#mat-root, #mat-root *, #mat-detail-mask, #mat-detail-mask *, [data-mat-open], [data-audit]",
        spotlight: "#mat-root .btn-primary, #mat-root [data-audit], #mat-root button",
        waitEvent: "detail_open",
        skipIfMissing: true
      },
      {
        id: "detail_actions",
        title: "看详情操作",
        tip: "详情里可切换「基本信息 / 分发记录」，也可关闭。点关闭或任意详情内按钮完成本步。",
        allow: "#mat-detail-mask, #mat-detail-mask *, [data-mat-close]",
        spotlight: "#mat-detail-mask .mat-detail",
        clickAdvance: true
      }
    ]
  });

  /* —— 文章管理 —— */
  TOURS.articles = FZNoviceTour.create({
    id: "articles",
    title: "文章管理",
    doneSummary:
      "你已熟悉文章列表：筛选 → 预览。教程只在本页演示，不会进入真实编辑页。",
    modalMaskIds: ["art-preview-mask", "art-confirm-mask", "art-compare-mask"],
    steps: [
      {
        id: "filter",
        title: "试用筛选",
        tip: "用项目 / 状态筛选，或点「搜索」「刷新」。先点一次「刷新」或「搜索」。",
        allow:
          ".list-toolbar, .list-toolbar *, #art-f-search, #art-f-clear, #art-f-refresh, #art-f-project, #art-f-status",
        spotlight: "#art-f-search",
        clickAdvance: true
      },
      {
        id: "preview_or_edit",
        title: "打开预览",
        tip: "点某行打开预览即可。本教程不进入编辑页，避免跳进真实产品流程。",
        allow:
          "#art-tbody, #art-tbody *, #art-preview-mask, #art-preview-mask *",
        spotlight: "#art-tbody tr",
        clickAdvance: true,
        skipIfMissing: true
      },
      {
        id: "close_or_done",
        title: "确认列表能力",
        tip: "若开了预览可点关闭；或再点一下表格区域，确认你会看状态与操作列。",
        allow:
          "#art-tbody, #art-tbody *, #art-preview-mask, #art-preview-mask *, #art-preview-close",
        spotlight: ".fz-table--art",
        clickAdvance: true
      }
    ]
  });

  /* —— 子账号与授权 —— */
  TOURS.subs = FZNoviceTour.create({
    id: "subs",
    title: "子账号与授权",
    doneSummary:
      "你已走完子账号与授权主流程：切 Tab → 创建/查看子账号向导 → 了解岗位。",
    modalMaskIds: ["sub-modal", "role-modal"],
    steps: [
      {
        id: "tabs",
        title: "子账号 / 岗位 Tab",
        tip: "本页两个 Tab：子账号、岗位。先点「岗位」看一眼，再点回「子账号」。",
        allow: "#tab-subs, #tab-roles, [data-tab]",
        spotlight: "#tab-roles",
        clickAdvance: true
      },
      {
        id: "back_subs",
        title: "回到子账号",
        tip: "点「子账号」Tab，准备走创建流程。",
        allow: "#tab-subs, [data-tab=\"subs\"]",
        spotlight: "#tab-subs",
        clickAdvance: true
      },
      {
        id: "create_sub",
        title: "创建子账号",
        tip: "点「+ 创建子账号」。向导分三步：个人信息 → 负责项目 → 岗位权限。Demo 可随便填，走完保存或取消。",
        allow:
          "#btn-primary-act, #sub-modal, #sub-modal *, #sub-next, #sub-prev, #sub-save, #sub-cancel",
        spotlight: "#btn-primary-act",
        waitEvent: "sub_wizard_done",
        onAllowClick: function () {
          setTimeout(function () {
            var u = document.getElementById("sub-user");
            var n = document.getElementById("sub-name");
            if (u && !u.value) u.value = "novice_demo_" + Date.now().toString(36).slice(-4);
            if (n && !n.value) n.value = "教程演示号";
          }, 80);
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
