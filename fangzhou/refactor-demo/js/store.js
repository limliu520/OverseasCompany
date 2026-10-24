/* 演示状态 · localStorage，无真实接口 */
(function (global) {
  var KEY = "fz_refactor_demo_v2";

  var DEFAULT = {
    loggedIn: false,
    totpBound: false,
    username: "demo_owner",
    displayName: "主账号演示",
    firstProjectDone: false,
    zeroPromptDismissed: false,
    /** 账号层外站通道资产（可待激活仍可挂项目） */
    extChannels: [],
    projects: [],
    roles: [],
    subs: []
  };

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      return Object.assign(JSON.parse(JSON.stringify(DEFAULT)), JSON.parse(raw));
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT));
    }
  }

  function write(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9);
  }

  function issueProjectCreds(projectId) {
    var short = projectId.slice(-6);
    return {
      appId: "fz_app_" + short,
      appSecret: "sk_live_demo_" + short + "_xxxxxxxx",
      webhookHint: "https://api.fangzhou.example/v1/hooks/" + short
    };
  }

  /**
   * status:
   * - pending_activate  已创建，待内容通道测试激活
   * - need_post_config  已激活，待配自动流等
   * - ready             创建流程真正完成
   * - need_collect      演示：激活后开了自动流但缺采集（可选）
   */
  function projectStatusLabel(p) {
    if (p.status === "pending_activate") return { text: "待激活", cls: "tag-warn" };
    if (p.status === "need_post_config") return { text: "待完成激活后配置", cls: "tag-warn" };
    if (p.status === "ready") return { text: "已完成", cls: "tag-ok" };
    if (p.status === "need_collect") return { text: "缺采集源", cls: "tag-muted" };
    return { text: p.status || "未知", cls: "tag-muted" };
  }

  function extStatusLabel(ext) {
    if (ext.status === "active") return { text: "已激活", cls: "tag-ok" };
    return { text: "待激活", cls: "tag-warn" };
  }

  /** 首建后补两个对照态项目 */
  function seedAfterFirstCreate(first) {
    var ready = {
      id: uid("p"),
      name: "演示项目 · 已完成",
      status: "ready",
      siteType: "chigua",
      creds: issueProjectCreds("seed_ready"),
      contentActivated: true,
      attachedExtIds: [],
      autoflow: false,
      hasCollectSource: true,
      watermarkDone: true,
      templateDone: true,
      userbotName: "演示 Bot"
    };
    var pending = {
      id: uid("p"),
      name: "演示项目 · 待激活",
      status: "pending_activate",
      siteType: "chigua",
      creds: issueProjectCreds("seed_pending"),
      contentActivated: false,
      attachedExtIds: [],
      autoflow: false,
      hasCollectSource: false,
      watermarkDone: true,
      templateDone: false,
      userbotName: ""
    };
    var out = [first];
    if (first.status !== "ready") out.push(ready);
    if (first.status !== "pending_activate") out.push(pending);
    while (out.length < 3) {
      out.push({
        id: uid("p"),
        name: "演示项目 · 待完成激活后配置",
        status: "need_post_config",
        siteType: "video",
        creds: issueProjectCreds("seed_post"),
        contentActivated: true,
        attachedExtIds: [],
        autoflow: false,
        hasCollectSource: false,
        watermarkDone: true,
        templateDone: true,
        userbotName: "演示 Bot"
      });
    }
    return out.slice(0, 3);
  }

  function findProject(state, id) {
    return (state.projects || []).find(function (p) {
      return p.id === id;
    });
  }

  function upsertProject(state, project) {
    var i = state.projects.findIndex(function (p) {
      return p.id === project.id;
    });
    if (i >= 0) state.projects[i] = project;
    else state.projects.unshift(project);
  }

  var FEATURES = [
    { id: "workbench", name: "工作台" },
    { id: "project_manage", name: "创建/管理项目" },
    { id: "project_config", name: "项目配置" },
    { id: "collect_web", name: "网站采集" },
    { id: "collect_tg", name: "TG 采集" },
    { id: "review_material", name: "素材审核" },
    { id: "edit_article", name: "文章编辑" },
    { id: "edit_media", name: "修片" },
    { id: "publish_ext", name: "外站发布任务" },
    { id: "interact", name: "互动能力" },
    { id: "userbot_cfg", name: "Userbot 配置" },
    { id: "ext_cfg", name: "外站通道配置" },
    { id: "sub_manage", name: "子账号管理" }
  ];

  global.FZStore = {
    KEY: KEY,
    FEATURES: FEATURES,
    read: read,
    write: write,
    uid: uid,
    issueProjectCreds: issueProjectCreds,
    seedAfterFirstCreate: seedAfterFirstCreate,
    projectStatusLabel: projectStatusLabel,
    extStatusLabel: extStatusLabel,
    findProject: findProject,
    upsertProject: upsertProject,
    reset: function () {
      localStorage.removeItem(KEY);
    }
  };
})(window);
