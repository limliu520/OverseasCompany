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
    /** 账号层资产：外站通道、Userbot（可挂到项目） */
    extChannels: [],
    userbots: [],
    projects: [],
    roles: [],
    subs: []
  };

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT));
      var state = Object.assign(JSON.parse(JSON.stringify(DEFAULT)), JSON.parse(raw));
      normalizeProjects(state);
      return state;
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
   * 主路径两步：配齐 → 对接接通。
   * status:
   * - pending_activate  已创建，内容通道待接通（运营可不回来；状态可自动变）
   * - ready             已接通，创建流程完成（前置配置在接通后自动生效）
   * - need_collect      已接通且开了自动流，但演示上仍缺采集源绑定
   * 旧态 need_post_config 读入时归一（见 normalizeProjects）
   */
  function deriveStatus(p) {
    if (!p.contentActivated) return "pending_activate";
    if (p.autoflow && !p.hasCollectSource) return "need_collect";
    return "ready";
  }

  function normalizeProjects(state) {
    (state.projects || []).forEach(function (p) {
      if (p.status === "need_post_config") {
        p.status = deriveStatus(p);
      }
      if (!p.boundChannels) p.boundChannels = [];
    });
  }

  function projectStatusLabel(p) {
    var s = p.status === "need_post_config" ? deriveStatus(p) : p.status;
    if (s === "pending_activate") return { text: "待接通", cls: "tag-warn" };
    if (s === "ready") return { text: "已完成", cls: "tag-ok" };
    if (s === "need_collect") return { text: "缺采集源", cls: "tag-muted" };
    return { text: s || "未知", cls: "tag-muted" };
  }

  function extStatusLabel(ext) {
    if (ext.status === "active") return { text: "已激活", cls: "tag-ok" };
    return { text: "待激活", cls: "tag-warn" };
  }

  /** 本项目已绑定的 TG 频道（演示用列表） */
  function projectChannels(project) {
    return (project && project.boundChannels) || [];
  }

  function projectHasChannels(project) {
    return projectChannels(project).length > 0;
  }

  /**
   * 有频道时禁止换绑/取消关联采集号。
   * 返回 null 表示允许；否则返回阻断文案。
   */
  function userbotChangeBlockReason(project, nextId) {
    var cur = project.userbotId || "";
    var next = nextId || "";
    if (cur === next) return null;
    if (!projectHasChannels(project)) return null;
    return (
      "本项目已绑定 " +
      projectChannels(project).length +
      " 个频道。请先解绑全部频道后，再更换或取消采集号。"
    );
  }

  /** 内容通道接通：状态完成，前置意向（自动流等）开始生效 */
  function markContentConnected(project) {
    project.contentActivated = true;
    project.status = deriveStatus(project);
    return project;
  }

  /** 首建后补对照态项目；写入 state.userbots 种子采集号 */
  function seedAfterFirstCreate(state, first) {
    var seedBotId = uid("bot");
    if (!state.userbots) state.userbots = [];
    if (
      !state.userbots.some(function (b) {
        return b.id === seedBotId;
      })
    ) {
      state.userbots.push({ id: seedBotId, name: "演示采集号" });
    }
    var ready = {
      id: uid("p"),
      name: "演示项目 · 已完成",
      status: "ready",
      siteType: "chigua",
      creds: issueProjectCreds("seed_ready"),
      contentActivated: true,
      attachedExtIds: [],
      autoflow: true,
      hasCollectSource: true,
      watermarkDone: true,
      templateDone: true,
      webhookUrl: "https://partner.example.com/hooks/fangzhou",
      userbotId: seedBotId,
      userbotName: "演示采集号",
      boundChannels: [
        { id: uid("ch"), title: "@demo_channel_a", note: "演示：有频道时不可换绑采集号" },
        { id: uid("ch"), title: "@demo_channel_b", note: "" }
      ]
    };
    var pending = {
      id: uid("p"),
      name: "演示项目 · 待接通",
      status: "pending_activate",
      siteType: "chigua",
      creds: issueProjectCreds("seed_pending"),
      contentActivated: false,
      attachedExtIds: [],
      autoflow: true,
      hasCollectSource: false,
      watermarkDone: true,
      templateDone: false,
      webhookUrl: "",
      userbotName: "",
      boundChannels: []
    };
    var out = [first];
    if (first.status !== "ready") out.push(ready);
    if (first.status !== "pending_activate") out.push(pending);
    while (out.length < 3) {
      out.push({
        id: uid("p"),
        name: "演示项目 · 缺采集源",
        status: "need_collect",
        siteType: "video",
        creds: issueProjectCreds("seed_collect"),
        contentActivated: true,
        attachedExtIds: [],
        autoflow: true,
        hasCollectSource: false,
        watermarkDone: true,
        templateDone: true,
        webhookUrl: "",
        userbotId: seedBotId,
        userbotName: "演示采集号",
        boundChannels: []
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
    projectChannels: projectChannels,
    projectHasChannels: projectHasChannels,
    userbotChangeBlockReason: userbotChangeBlockReason,
    deriveStatus: deriveStatus,
    markContentConnected: markContentConnected,
    findProject: findProject,
    upsertProject: upsertProject,
    reset: function () {
      localStorage.removeItem(KEY);
    }
  };
})(window);
