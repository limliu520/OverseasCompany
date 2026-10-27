/* 演示状态 · localStorage，无真实接口 */
(function (global) {
  /** v3：外站并入项目配置；不再依赖独立外站挂载主路径 */
  var KEY = "fz_refactor_demo_v3";

  /** 账号层演示资产（固定 id，便于跨页对照；字段对齐现网新增外站） */
  var DEMO_EXT_CHANNELS = [
    {
      id: "ext_demo_alpha",
      name: "合作站 · Alpha CMS",
      note: "对接方：Alpha 内容组",
      notes: "对接方：Alpha 内容组",
      status: "active",
      docReady: true,
      siteKind: "push",
      code: "site-alpha1",
      baseUrl: "https://api.alpha.example.com",
      apiPrefix: "/oash/v1",
      isActive: true,
      autoPush: true,
      requireVideo: true,
      generationMode: "ai",
      tags: ["CMS", "主发"]
    },
    {
      id: "ext_demo_beta",
      name: "视频外发 · Beta",
      note: "对接方：Beta 视频站",
      notes: "对接方：Beta 视频站",
      status: "active",
      docReady: true,
      siteKind: "push",
      code: "site-beta02",
      baseUrl: "https://api.beta.example.com",
      apiPrefix: "/oash/v1",
      isActive: true,
      autoPush: false,
      requireVideo: true,
      generationMode: "raw",
      sliceEnabled: true,
      tags: ["视频"]
    },
    {
      id: "ext_demo_gamma",
      name: "待签 · Gamma 站",
      note: "合同未齐，可先挂项目",
      notes: "合同未齐，可先挂项目",
      status: "pending_activate",
      docReady: true,
      siteKind: "push",
      code: "site-gamma3",
      baseUrl: "https://api.gamma.example.com",
      apiPrefix: "/oash/v1",
      isActive: false,
      autoPush: true,
      requireVideo: true,
      generationMode: "ai",
      tags: ["待签"]
    },
    {
      id: "ext_demo_delta",
      name: "停用 · 旧站 Delta",
      note: "已停运，勿新挂",
      notes: "已停运，勿新挂",
      status: "inactive",
      docReady: false,
      siteKind: "pull",
      code: "site-delta4",
      baseUrl: "https://cue.delta.example.com",
      apiPrefix: "",
      isActive: false,
      dewatermarkEnabled: true,
      tags: ["停用"]
    }
  ];

  /**
   * 采集号上限（模拟 Admin 全局配置；业务端只读校验）
   * 口径：方舟-TG采集号与频道限流口径-20261027
   */
  var BOT_LIMITS = {
    maxBotsPerProject: 10,
    maxChannelsPerBot: 10,
    maxBotsPerChannel: 5
  };

  /**
   * 采集号演示：归属项目（projectId）；connected=已连接可采。
   * 对齐现网卡片：仅连接 / 断开 / 删除。
   */
  var DEMO_USERBOTS = [
    {
      id: "bot_demo_free",
      name: "采集号 · 空闲可用",
      phoneHint: "+1****1201",
      status: "connected",
      projectId: "proj_demo_ready",
      channelCount: 2
    },
    {
      id: "bot_demo_busy",
      name: "采集号 · 已断开",
      phoneHint: "+1****2202",
      status: "disconnected",
      projectId: "proj_demo_collect",
      channelCount: 0
    }
  ];

  /** 岗位权限：菜单 L2/L3 + 页内操作 id（见 perm-tree.js） */
  var DEMO_ROLES = [
    {
      id: "role_demo_ops",
      name: "采集运营",
      features: [
        "home.overview.view",
        "collect.web.view",
        "collect.web.create",
        "collect.web.edit",
        "collect.tg.view",
        "collect.tg.create",
        "collect.tg.edit",
        "collect.review.view",
        "collect.review.approve"
      ]
    },
    {
      id: "role_demo_editor",
      name: "内容编辑",
      features: [
        "home.overview.view",
        "collect.review.view",
        "collect.review.approve",
        "edit.article.view",
        "edit.article.create",
        "edit.article.edit",
        "edit.article.publish",
        "edit.media.view",
        "edit.media.edit",
        "edit.publish.view",
        "edit.publish.publish"
      ]
    },
    {
      id: "role_demo_pm",
      name: "项目管理",
      features: [
        "home.overview.view",
        "projects.list.view",
        "projects.list.create",
        "projects.list.edit",
        "projects.list.config",
        "projects.list.connect",
        "edit.publish.view",
        "edit.publish.publish",
        "global.userbot.view",
        "global.userbot.create",
        "global.userbot.edit",
        "global.subs.accounts.view",
        "global.subs.accounts.create",
        "global.subs.accounts.edit",
        "global.subs.roles.view",
        "global.subs.roles.create",
        "global.subs.roles.edit"
      ]
    }
  ];

  /** 子账号演示（projects 在 ensure 时绑到当前项目） */
  var DEMO_SUBS = [
    {
      id: "sub_demo_xiaowang",
      username: "ops_xiaowang",
      displayName: "小王",
      cmsId: "cms_partner_xiaowang",
      features: DEMO_ROLES[0].features.slice(),
      roleName: "采集运营",
      disabled: false
    },
    {
      id: "sub_demo_lili",
      username: "editor_lili",
      displayName: "李丽",
      cmsId: "cms_partner_lili",
      features: DEMO_ROLES[1].features.slice(),
      roleName: "内容编辑",
      disabled: false
    },
    {
      id: "sub_demo_chen",
      username: "pm_chen",
      displayName: "陈晨",
      cmsId: "",
      features: DEMO_ROLES[2].features.slice(),
      roleName: "项目管理",
      disabled: false
    },
    {
      id: "sub_demo_old",
      username: "ops_retired",
      displayName: "已停用 · 旧号",
      cmsId: "cms_partner_old",
      features: ["home.overview.view", "collect.tg.view"],
      roleName: "",
      disabled: true
    }
  ];

  function issueProjectCreds(projectId) {
    var short = String(projectId || "demo").slice(-6);
    return {
      appId: "fz_app_" + short,
      appSecret: "sk_live_demo_" + short + "_xxxxxxxx",
      webhookHint: "https://api.fangzhou.example/v1/hooks/" + short
    };
  }

  /** 各状态演示项目（首次登录即有，不必先走新建） */
  var DEMO_PROJECTS = [
    {
      id: "proj_demo_ready",
      name: "演示项目 · 已完成",
      status: "ready",
      siteType: "chigua",
      creds: issueProjectCreds("seed_ready"),
      contentActivated: true,
      attachedExtIds: [],
      apiBaseUrl: "https://api.partner-demo.com",
      apiPrefix: "/oash/v1",
      siteCode: "site-demo1",
      generationMode: "ai",
      requireVideo: true,
      dewatermarkEnabled: true,
      sliceEnabled: true,
      autoPush: true,
      autoflow: true,
      hasCollectSource: true,
      watermarkDone: true,
      templateDone: true,
      coverWidth: "720",
      coverHeight: "1280",
      webhookUrl: "https://partner.example.com/hooks/fangzhou",
      userbotId: "bot_demo_free",
      userbotName: "采集号 · 空闲可用",
      userbotIds: ["bot_demo_free"],
      boundChannels: [
        {
          id: "ch_demo_a",
          title: "@demo_channel_a",
          botId: "bot_demo_free",
          role: "collect",
          note: ""
        },
        {
          id: "ch_demo_b",
          title: "@demo_channel_b",
          botId: "bot_demo_free",
          role: "push",
          note: ""
        }
      ]
    },
    {
      id: "proj_demo_pending",
      name: "演示项目 · 待接通",
      status: "pending_activate",
      siteType: "short_drama",
      creds: issueProjectCreds("seed_pending"),
      contentActivated: false,
      attachedExtIds: [],
      apiBaseUrl: "https://api.pending-demo.com",
      apiPrefix: "/oash/v1",
      siteCode: "site-pend1",
      generationMode: "none",
      requireVideo: true,
      dewatermarkEnabled: true,
      sliceEnabled: true,
      pushAllEpisodes: true,
      episodeTitleFormat: "Episode {n}",
      autoPush: true,
      autoflow: true,
      hasCollectSource: false,
      watermarkDone: true,
      templateDone: false,
      coverWidth: "720",
      coverHeight: "1280",
      webhookUrl: "",
      userbotName: "",
      userbotIds: [],
      boundChannels: []
    },
    {
      id: "proj_demo_collect",
      name: "演示项目 · 缺采集源",
      status: "need_collect",
      siteType: "video",
      creds: issueProjectCreds("seed_collect"),
      contentActivated: true,
      attachedExtIds: [],
      apiBaseUrl: "https://api.video-demo.com",
      apiPrefix: "/oash/v1",
      siteCode: "site-vid01",
      generationMode: "ai",
      requireVideo: true,
      autoPush: true,
      autoflow: true,
      hasCollectSource: false,
      watermarkDone: true,
      templateDone: true,
      coverWidth: "720",
      coverHeight: "1280",
      webhookUrl: "",
      userbotId: "bot_demo_busy",
      userbotName: "采集号 · 已断开",
      userbotIds: ["bot_demo_busy"],
      boundChannels: []
    }
  ];

  var DEFAULT = {
    loggedIn: false,
    totpBound: false,
    username: "demo_owner",
    displayName: "主账号演示",
    firstProjectDone: true,
    zeroPromptDismissed: false,
    /** Userbot 按项目归属；extChannels 仅兼容旧数据 */
    extChannels: [],
    userbots: JSON.parse(JSON.stringify(DEMO_USERBOTS)),
    projects: JSON.parse(JSON.stringify(DEMO_PROJECTS)),
    roles: JSON.parse(JSON.stringify(DEMO_ROLES)),
    subs: JSON.parse(JSON.stringify(DEMO_SUBS))
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /** 合并缺失的演示资产（不清空用户自建） */
  function ensureDemoAssets(state) {
    var changed = false;
    if (!state.extChannels) {
      state.extChannels = [];
      changed = true;
    }
    if (!state.userbots) {
      state.userbots = [];
      changed = true;
    }
    DEMO_USERBOTS.forEach(function (seed) {
      var hit = state.userbots.find(function (b) {
        return b.id === seed.id;
      });
      if (!hit) {
        state.userbots.push(clone(seed));
        changed = true;
        return;
      }
      /* 只补缺，不覆盖用户编辑后的名称/状态 */
      if (hit.status === "ok") {
        hit.status = "connected";
        changed = true;
      }
      if (hit.status == null) {
        hit.status = seed.status;
        changed = true;
      }
      if (hit.phoneHint == null) {
        hit.phoneHint = seed.phoneHint;
        changed = true;
      }
      if (hit.channelCount == null) {
        hit.channelCount = seed.channelCount;
        changed = true;
      }
    });
    /* 去掉多余演示号（旧版隔离号等） */
    var keep = { bot_demo_free: 1, bot_demo_busy: 1 };
    var filtered = state.userbots.filter(function (b) {
      if (String(b.id).indexOf("bot_demo_") === 0 && !keep[b.id]) {
        changed = true;
        return false;
      }
      return true;
    });
    if (filtered.length !== state.userbots.length) {
      state.userbots = filtered;
      changed = true;
    }

    if (!state.projects) {
      state.projects = [];
      changed = true;
    }
    DEMO_PROJECTS.forEach(function (seed) {
      var hit = state.projects.find(function (p) {
        return p.id === seed.id;
      });
      if (!hit) {
        state.projects.push(clone(seed));
        changed = true;
      }
    });
    if (state.projects.length && !state.firstProjectDone) {
      state.firstProjectDone = true;
      changed = true;
    }

    if (!state.roles) {
      state.roles = [];
      changed = true;
    }
    DEMO_ROLES.forEach(function (seed) {
      var hit = state.roles.find(function (r) {
        return r.id === seed.id;
      });
      if (!hit) {
        state.roles.push(clone(seed));
        changed = true;
      } else if (needsPermMigrate(hit.features)) {
        hit.features = seed.features.slice();
        changed = true;
      }
    });

    if (!state.subs) {
      state.subs = [];
      changed = true;
    }
    var projectIds = (state.projects || []).map(function (p) {
      return p.id;
    });
    DEMO_SUBS.forEach(function (seed) {
      var hit = state.subs.find(function (u) {
        return u.id === seed.id;
      });
      if (!hit) {
        var row = clone(seed);
        row.projects = projectIds.slice();
        state.subs.push(row);
        changed = true;
      } else {
        if ((!hit.projects || !hit.projects.length) && projectIds.length) {
          hit.projects = projectIds.slice();
          changed = true;
        }
        if (needsPermMigrate(hit.features)) {
          hit.features = seed.features.slice();
          changed = true;
        }
      }
    });

    (state.roles || []).forEach(function (r) {
      if (needsPermMigrate(r.features)) {
        r.features = migratePermIds(r.features);
        changed = true;
      }
    });
    (state.subs || []).forEach(function (u) {
      if (needsPermMigrate(u.features)) {
        u.features = migratePermIds(u.features);
        changed = true;
      }
    });

    return changed;
  }

  function needsPermMigrate(features) {
    return (features || []).some(function (id) {
      return id && id.indexOf(".") === -1;
    });
  }

  function migratePermIds(features) {
    if (global.FZPerm && FZPerm.migrateFeatures) {
      return FZPerm.migrateFeatures(features);
    }
    return features || [];
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT);
      var state = Object.assign(clone(DEFAULT), JSON.parse(raw));
      /* 旧本地态可能是空数组，覆盖 DEFAULT 种子后需补回 */
      if (!state.extChannels) state.extChannels = [];
      if (!(state.userbots && state.userbots.length)) {
        state.userbots = clone(DEMO_USERBOTS);
      }
      if (!(state.projects && state.projects.length)) {
        state.projects = clone(DEMO_PROJECTS);
        state.firstProjectDone = true;
      }
      if (!(state.roles && state.roles.length)) {
        state.roles = clone(DEMO_ROLES);
      }
      if (!(state.subs && state.subs.length)) {
        var pids = (state.projects || []).map(function (p) {
          return p.id;
        });
        state.subs = DEMO_SUBS.map(function (seed) {
          var row = clone(seed);
          row.projects = pids.slice();
          return row;
        });
      }
      normalizeProjects(state);
      normalizeExtChannels(state);
      if (ensureDemoAssets(state)) write(state);
      return state;
    } catch (e) {
      return clone(DEFAULT);
    }
  }

  function write(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 9);
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

  function syncProjectUserbotFields(p, bots) {
    var ids = (p.userbotIds || []).slice();
    if (!ids.length && p.userbotId) ids = [p.userbotId];
    ids = ids.filter(function (id, i, arr) {
      return id && arr.indexOf(id) === i;
    });
    p.userbotIds = ids;
    var primary = ids[0] || "";
    p.userbotId = primary;
    var hit = (bots || []).find(function (b) {
      return b.id === primary;
    });
    p.userbotName = hit ? hit.name : ids.length ? p.userbotName || primary : "";
  }

  /** 旧数据：全局 Bot / 单 userbotId → 项目归属 + userbotIds */
  function normalizeUserbots(state) {
    if (!state.userbots) state.userbots = [];
    if (!state.projects) state.projects = [];
    state.projects.forEach(function (p) {
      if (!Array.isArray(p.userbotIds)) {
        p.userbotIds = p.userbotId ? [p.userbotId] : [];
      }
      (p.boundChannels || []).forEach(function (ch) {
        if (!ch.botId && p.userbotIds[0]) ch.botId = p.userbotIds[0];
        if (!ch.role) ch.role = "collect";
      });
    });
    state.userbots.forEach(function (b) {
      if (b.projectId) return;
      var owners = state.projects.filter(function (p) {
        return (p.userbotIds || []).indexOf(b.id) !== -1 || p.userbotId === b.id;
      });
      b.projectId = owners[0] ? owners[0].id : "";
      owners.slice(1).forEach(function (p) {
        p.userbotIds = (p.userbotIds || []).filter(function (id) {
          return id !== b.id;
        });
      });
    });
    state.projects.forEach(function (p) {
      syncProjectUserbotFields(p, state.userbots);
    });
  }

  function normalizeProjects(state) {
    normalizeUserbots(state);
    (state.projects || []).forEach(function (p) {
      if (p.status === "need_post_config") {
        p.status = deriveStatus(p);
      }
      if (!p.boundChannels) p.boundChannels = [];
      if (!p.attachedExtIds) p.attachedExtIds = [];
      if (!p.siteType || p.siteType === "content") p.siteType = "chigua";
      if (global.FZProjectUnion) global.FZProjectUnion.normalizeProject(p);
      else {
        if (p.generationMode == null) {
          p.generationMode = p.siteType === "short_drama" ? "none" : "ai";
        }
        if (p.requireVideo == null) p.requireVideo = true;
        if (p.dewatermarkEnabled == null) p.dewatermarkEnabled = true;
        if (p.sliceEnabled == null) p.sliceEnabled = true;
        if (p.apiPrefix == null) p.apiPrefix = "/oash/v1";
        if (p.autoPush == null) p.autoPush = !!p.autoflow;
        if (p.coverWidth == null) p.coverWidth = "720";
        if (p.coverHeight == null) p.coverHeight = "1280";
      }
      syncProjectUserbotFields(p, state.userbots);
    });
  }

  /**
   * 外站通道：兼容旧 seed（仅 name/note/status）。
   * 字段对齐现网「新增外站」主数据。
   */
  function normalizeExtChannels(state) {
    (state.extChannels || []).forEach(function (e) {
      if (!e.siteKind) e.siteKind = "push";
      if (!e.code) {
        var tail = String(e.id || "").replace(/\W/g, "").slice(-6) || "legacy";
        e.code = "site-" + tail;
      }
      if (e.baseUrl == null) e.baseUrl = "";
      if (e.apiPrefix == null) e.apiPrefix = e.siteKind === "push" ? "/oash/v1" : "";
      if (e.isActive == null) e.isActive = e.status === "active";
      if (e.autoPush == null) e.autoPush = e.siteKind === "push";
      if (e.requireVideo == null) e.requireVideo = e.siteKind === "push";
      if (e.generationMode == null) e.generationMode = e.siteKind === "push" ? "ai" : "";
      if (e.dewatermarkEnabled == null) e.dewatermarkEnabled = false;
      if (e.sliceEnabled == null) e.sliceEnabled = false;
      if (e.notes == null) e.notes = e.note || "";
      if (e.note == null) e.note = e.notes || "";
      if (e.docReady == null) e.docReady = true;
      if (!e.pushConfig && e.siteKind === "push") {
        e.pushConfig = {
          publish: true,
          extra: {},
          episodes: false,
          episodeTitleFormat: "",
          coverAspect: "",
          category: { id: null, name: "" }
        };
      }
      if (!e.watermarkConfig) {
        e.watermarkConfig = {
          fixed: { positions: [], wr: {}, fileName: "" },
          cycle: { positions: [], wr: {}, fileName: "" },
          motion: { path: "diagonal", wr: {}, fileName: "" },
          image: { position: "br", fileName: "" }
        };
      }
      if (e.siteKind === "pull" && !e.pullConfig) {
        e.pullConfig = {
          maxInflight: "",
          heartbeat: "",
          waitTimeout: "",
          maxAttempts: "",
          verifySource: true,
          keepResolution: true,
          skipTrim: false,
          tolSeconds: "",
          tolRatio: "",
          resultStorage: "cdn",
          resultHosts: "",
          profiles: "",
          workerId: "",
          requestTimeout: "",
          reportTimeout: "",
          configJson: ""
        };
      }
      if (e.appSecretSet == null) e.appSecretSet = false;
      if (e.appSecretHint == null) e.appSecretHint = "";
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
    if (ext.status === "active") return { text: "有效", cls: "tag-ok" };
    if (ext.status === "inactive") return { text: "无效", cls: "tag-muted" };
    return { text: "待激活", cls: "tag-warn" };
  }

  function extKindLabel(ext) {
    return ext && ext.siteKind === "pull" ? "拉取加水印" : "推送站点";
  }

  function userbotStatusLabel(bot) {
    var st = bot && bot.status;
    if (st === "disabled") return { text: "已停用", cls: "tag-muted" };
    if (st === "disconnected") return { text: "已断开", cls: "tag-warn" };
    if (st === "connected" || st === "ok") return { text: "已连接", cls: "tag-ok" };
    return { text: "未连接", cls: "tag-warn" };
  }

  /** 本项目已绑定的 TG 频道（演示用列表） */
  function projectChannels(project) {
    return (project && project.boundChannels) || [];
  }

  function projectHasChannels(project) {
    return projectChannels(project).length > 0;
  }

  /** 启用了某外站的项目列表 */
  function projectsUsingExt(state, extId) {
    return (state.projects || []).filter(function (p) {
      return (p.attachedExtIds || []).indexOf(extId) !== -1;
    });
  }

  function projectUserbotIds(project) {
    if (!project) return [];
    if (Array.isArray(project.userbotIds) && project.userbotIds.length) {
      return project.userbotIds.slice();
    }
    return project.userbotId ? [project.userbotId] : [];
  }

  function botsForProject(state, projectId) {
    if (!projectId) return [];
    return (state.userbots || []).filter(function (b) {
      return b.projectId === projectId;
    });
  }

  /** 选用了某采集号的项目列表（归属项目） */
  function projectsUsingUserbot(state, botId) {
    if (!botId) return [];
    var bot = (state.userbots || []).find(function (b) {
      return b.id === botId;
    });
    if (bot && bot.projectId) {
      var p = findProject(state, bot.projectId);
      return p ? [p] : [];
    }
    return (state.projects || []).filter(function (p) {
      return projectUserbotIds(p).indexOf(botId) !== -1;
    });
  }

  /** 某 Bot 已挂频道数（采集+分发合计） */
  function userbotBoundChannelCount(state, bot) {
    if (!bot) return 0;
    var n = 0;
    (state.projects || []).forEach(function (p) {
      (p.boundChannels || []).forEach(function (ch) {
        if (ch.botId === bot.id || (!ch.botId && projectUserbotIds(p).indexOf(bot.id) !== -1)) {
          n += 1;
        }
      });
    });
    if (n) return n;
    return bot.channelCount != null ? bot.channelCount : 0;
  }

  /** 某频道已被多少 Bot 挂上（跨项目合计） */
  function botsOnChannelCount(state, channelId) {
    if (!channelId) return 0;
    var n = 0;
    (state.projects || []).forEach(function (p) {
      (p.boundChannels || []).forEach(function (ch) {
        if (ch.id === channelId) n += 1;
      });
    });
    return n;
  }

  /** 频道是否已被其他项目占用 */
  function channelOwnerProject(state, channelId, exceptProjectId) {
    if (!channelId) return null;
    return (
      (state.projects || []).find(function (p) {
        if (exceptProjectId && p.id === exceptProjectId) return false;
        return (p.boundChannels || []).some(function (ch) {
          return ch.id === channelId;
        });
      }) || null
    );
  }

  function botLimits() {
    return {
      maxBotsPerProject: BOT_LIMITS.maxBotsPerProject,
      maxChannelsPerBot: BOT_LIMITS.maxChannelsPerBot,
      maxBotsPerChannel: BOT_LIMITS.maxBotsPerChannel
    };
  }

  /** 本项目再加一个 Bot？null=允许 */
  function addBotToProjectBlockReason(state, projectId) {
    var lim = botLimits().maxBotsPerProject;
    var n = botsForProject(state, projectId).length;
    if (n >= lim) {
      return "本项目采集号已达上限（" + lim + " 个），无法再添加。上限由 Admin 配置。";
    }
    return null;
  }

  /** Bot 再挂一个频道？null=允许 */
  function botJoinChannelBlockReason(state, botId, channelId, projectId) {
    var bot = (state.userbots || []).find(function (b) {
      return b.id === botId;
    });
    if (!bot) return "采集号不存在";
    if (bot.projectId && projectId && bot.projectId !== projectId) {
      return "该采集号归属其他项目，不能在本项目挂频道。";
    }
    var owner = channelOwnerProject(state, channelId, projectId);
    if (owner) {
      return (
        "该频道已被项目「" +
        (owner.name || owner.id) +
        "」的采集号加入，本项目不能再加入（勿重复进群）。"
      );
    }
    var onCh = botsOnChannelCount(state, channelId);
    var limCh = botLimits().maxBotsPerChannel;
    if (onCh >= limCh) {
      return "该频道上的采集号已达上限（" + limCh + " 个），无法再加入。";
    }
    var limBot = botLimits().maxChannelsPerBot;
    if (userbotBoundChannelCount(state, bot) >= limBot) {
      return (
        "该采集号加入的频道已达上限（采集+分发合计 " + limBot + " 个），无法再加入。"
      );
    }
    return null;
  }

  /**
   * 从本项目移除某采集号：若该号还挂着本项目频道则阻断。
   * 兼容旧「换绑唯一号」调用：nextId 为空表示清空。
   */
  function userbotChangeBlockReason(project, nextId) {
    var ids = projectUserbotIds(project);
    var next = nextId || "";
    if (!next) {
      if (!ids.length) return null;
      if (!projectHasChannels(project)) return null;
      return (
        "本项目仍有 " +
        projectChannels(project).length +
        " 个频道绑定在采集号上。请先解绑频道，再移除采集号。"
      );
    }
    if (ids.indexOf(next) !== -1) return null;
    return null;
  }

  function attachBotToProject(state, project, bot) {
    if (!project || !bot) return;
    bot.projectId = project.id;
    if (!project.userbotIds) project.userbotIds = [];
    if (project.userbotIds.indexOf(bot.id) === -1) project.userbotIds.push(bot.id);
    syncProjectUserbotFields(project, state.userbots);
  }

  function detachBotFromProject(state, project, botId) {
    if (!project) return;
    project.userbotIds = projectUserbotIds(project).filter(function (id) {
      return id !== botId;
    });
    var bot = (state.userbots || []).find(function (b) {
      return b.id === botId;
    });
    if (bot && bot.projectId === project.id) bot.projectId = "";
    syncProjectUserbotFields(project, state.userbots);
  }

  /** 内容通道接通：状态完成，前置意向（自动流等）开始生效 */
  function markContentConnected(project) {
    project.contentActivated = true;
    project.status = deriveStatus(project);
    return project;
  }

  /**
   * 新建项目写入列表：演示三态项目由 ensureDemoAssets 常驻维护，
   * 此处只把新建项放到最前，不再依赖「首建才补对照态」。
   */
  function seedAfterFirstCreate(state, first) {
    ensureDemoAssets(state);
    var rest = (state.projects || []).filter(function (p) {
      return p.id !== first.id;
    });
    return [first].concat(rest);
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
    { id: "publish_ext", name: "发布/提交任务" },
    { id: "interact", name: "互动能力" },
    { id: "userbot_cfg", name: "Userbot 配置" },
    { id: "sub_manage", name: "子账号管理" }
  ];

  global.FZStore = {
    KEY: KEY,
    FEATURES: FEATURES,
    BOT_LIMITS: BOT_LIMITS,
    DEMO_EXT_CHANNELS: DEMO_EXT_CHANNELS,
    DEMO_USERBOTS: DEMO_USERBOTS,
    DEMO_ROLES: DEMO_ROLES,
    DEMO_SUBS: DEMO_SUBS,
    DEMO_PROJECTS: DEMO_PROJECTS,
    read: read,
    write: write,
    uid: uid,
    issueProjectCreds: issueProjectCreds,
    seedAfterFirstCreate: seedAfterFirstCreate,
    ensureDemoAssets: ensureDemoAssets,
    projectStatusLabel: projectStatusLabel,
    extStatusLabel: extStatusLabel,
    extKindLabel: extKindLabel,
    normalizeExtChannels: normalizeExtChannels,
    userbotStatusLabel: userbotStatusLabel,
    projectChannels: projectChannels,
    projectHasChannels: projectHasChannels,
    projectUserbotIds: projectUserbotIds,
    botsForProject: botsForProject,
    projectsUsingExt: projectsUsingExt,
    projectsUsingUserbot: projectsUsingUserbot,
    userbotBoundChannelCount: userbotBoundChannelCount,
    botsOnChannelCount: botsOnChannelCount,
    channelOwnerProject: channelOwnerProject,
    botLimits: botLimits,
    addBotToProjectBlockReason: addBotToProjectBlockReason,
    botJoinChannelBlockReason: botJoinChannelBlockReason,
    userbotChangeBlockReason: userbotChangeBlockReason,
    attachBotToProject: attachBotToProject,
    detachBotFromProject: detachBotFromProject,
    syncProjectUserbotFields: syncProjectUserbotFields,
    deriveStatus: deriveStatus,
    markContentConnected: markContentConnected,
    findProject: findProject,
    upsertProject: upsertProject,
    reset: function () {
      localStorage.removeItem(KEY);
    }
  };
})(window);
