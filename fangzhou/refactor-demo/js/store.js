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
  /* Demo 抬高频道上限以便验收长列表；产品口径默认 10，Admin 可配 */
  var BOT_LIMITS = {
    maxBotsPerProject: 10,
    maxChannelsPerBot: 40,
    maxBotsPerChannel: 5
  };

  /**
   * 采集号演示：归属项目（projectId）；connected=已连接可采。
   * 对齐现网卡片：仅连接 / 断开 / 删除。
   */
  /** 公共池：与业务项目同级，专管 TG→TG；非项目料进此池 */
  var PUBLIC_POOL_ID = "proj_public_pool";

  /** 名称只作标签，不含连接/监听状态（状态看 status / monitoring） */
  var DEMO_USERBOTS = [
    {
      id: "bot_demo_free",
      name: "星火采",
      phoneHint: "+1****1201",
      status: "connected",
      projectId: "proj_demo_ready",
      channelCount: 2
    },
    {
      id: "bot_demo_busy",
      name: "青柚采",
      phoneHint: "+1****2202",
      status: "disconnected",
      projectId: "proj_demo_collect",
      channelCount: 0
    },
    {
      id: "bot_demo_pool",
      name: "晚风号",
      phoneHint: "+1****3303",
      status: "connected",
      monitoring: true,
      projectId: PUBLIC_POOL_ID,
      channelCount: 4
    },
    {
      id: "bot_demo_pool_b",
      name: "云雀号",
      phoneHint: "+1****3304",
      status: "connected",
      monitoring: false,
      projectId: PUBLIC_POOL_ID,
      channelCount: 2
    }
  ];

  /**
   * Demo「Telegram 侧已进、方舟尚未登记」的频道。
   * 「拉取频道」= 把这些同步进当前上下文列表（现网 sync-from-telegram）。
   */
  /* 拉取模拟：公共池进列表为未分配；业务项目为采集（见 syncChannelsFromTelegram） */
  var DEMO_TG_LATENT = {
    bot_demo_pool: [
      { id: "ch_pool_latent_src", title: "@pool_latent_src" },
      { id: "ch_pool_latent_out", title: "@pool_latent_out" },
      { id: "ch_pool_latent_w1", title: "@pool_latent_wait_1" },
      { id: "ch_pool_latent_w2", title: "@pool_latent_wait_2" }
    ],
    bot_demo_pool_b: [
      { id: "ch_pool_b_latent", title: "@pool_backup_feed" }
    ],
    bot_demo_free: [
      { id: "ch_proj_latent_a", title: "@alpha_extra_feed" }
    ],
    bot_demo_busy: []
  };

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
        "collect.materials.view",
        "collect.materials.approve"
      ]
    },
    {
      id: "role_demo_editor",
      name: "内容编辑",
      features: [
        "home.overview.view",
        "collect.materials.view",
        "collect.materials.approve",
        "content.article.view",
        "content.article.create",
        "content.article.edit",
        "content.article.publish",
        "content.ai_cmt.view",
        "review.comment.view",
        "review.comment.approve",
        "review.user.view",
        "review.post.view"
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
        "content.article.view",
        "content.article.publish",
        "content.pull_wm.view",
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
      id: PUBLIC_POOL_ID,
      name: "公共池",
      isPublicPool: true,
      status: "ready",
      siteType: "chigua",
      contentActivated: true,
      hasCollectSource: true,
      autoToEdit: false,
      autoPush: false,
      autoflow: false,
      userbotId: "bot_demo_pool",
      userbotName: "晚风号",
      userbotIds: ["bot_demo_pool", "bot_demo_pool_b"],
      boundChannels: [
        {
          id: "ch_pool_src",
          title: "@pool_source_alpha",
          botId: "bot_demo_pool",
          role: "collect",
          note: ""
        },
        {
          id: "ch_pool_src_beta",
          title: "@pool_source_beta",
          botId: "bot_demo_pool",
          role: "collect",
          note: ""
        },
        {
          id: "ch_pool_t1",
          title: "@pool_target_one",
          botId: "bot_demo_pool",
          role: "push",
          note: ""
        },
        {
          id: "ch_pool_t2",
          title: "@pool_target_two",
          botId: "bot_demo_pool",
          role: "push",
          note: ""
        },
        {
          id: "ch_pool_b_src",
          title: "@pool_backup_src",
          botId: "bot_demo_pool_b",
          role: "collect",
          note: ""
        },
        {
          id: "ch_pool_b_out",
          title: "@pool_backup_out",
          botId: "bot_demo_pool_b",
          role: "push",
          note: ""
        }
      ],
      /** TG→TG：仅公共池；一源多目标 */
      routingRules: [
        {
          id: "rr_demo_1a",
          botId: "bot_demo_pool",
          sourceId: "ch_pool_src",
          targetIds: ["ch_pool_t1"],
          active: true,
          healthStatus: "OK",
          healthError: ""
        },
        {
          id: "rr_demo_1b",
          botId: "bot_demo_pool",
          sourceId: "ch_pool_src",
          targetIds: ["ch_pool_t2"],
          active: true,
          healthStatus: "BROKEN",
          healthError: "分发号无法读取源频道（not a member）"
        },
        {
          id: "rr_demo_2",
          botId: "bot_demo_pool",
          sourceId: "ch_pool_src_beta",
          targetIds: ["ch_pool_t1"],
          active: true,
          healthStatus: "UNKNOWN",
          healthError: "体检超时，结果无法判定"
        },
        {
          id: "rr_demo_3",
          botId: "bot_demo_pool_b",
          sourceId: "ch_pool_b_src",
          targetIds: ["ch_pool_b_out"],
          active: true,
          healthStatus: "",
          healthError: ""
        },
        {
          id: "rr_demo_4",
          botId: "bot_demo_pool",
          sourceId: "ch_pool_src_beta",
          targetIds: ["ch_pool_t2"],
          active: true,
          healthStatus: "OK",
          healthError: ""
        }
      ]
    },
    {
      id: "proj_demo_ready",
      name: "演示瓜站",
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
      autoToEdit: true,
      autoPush: true,
      autoflow: true,
      hasCollectSource: true,
      watermarkDone: true,
      templateDone: true,
      coverWidth: "720",
      coverHeight: "1280",
      webhookUrl: "https://partner.example.com/hooks/fangzhou",
      userbotId: "bot_demo_free",
      userbotName: "星火采",
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
          role: "collect",
          note: ""
        }
      ]
    },
    {
      id: "proj_demo_pending",
      name: "演示短剧站",
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
      autoToEdit: true,
      autoPush: false,
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
      name: "演示视频站",
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
      autoToEdit: true,
      autoPush: true,
      autoflow: true,
      hasCollectSource: false,
      watermarkDone: true,
      templateDone: true,
      coverWidth: "720",
      coverHeight: "1280",
      webhookUrl: "",
      userbotId: "bot_demo_busy",
      userbotName: "青柚采",
      userbotIds: ["bot_demo_busy"],
      boundChannels: []
    }
  ];

  var DEFAULT = {
    loggedIn: false,
    totpBound: false,
    username: "demo_owner",
    displayName: "主账号演示",
    /** owner | sub */
    accountKind: "owner",
    /** owner / owner_empty / 子账号 id */
    accountId: "owner",
    features: null,
    firstProjectDone: true,
    zeroPromptDismissed: false,
    /** { [accountId]: true } 菜单二级引导完成 */
    menuTourDoneByAccount: {},
    /** 快速反馈工单 */
    tickets: [],
    /** 额外状态提醒种子（采集号断线由工作台从 userbots 推导；此处只补频道级样例） */
    statusAlerts: [
      {
        id: "alert_ch_listen",
        need: "collect.tg.view",
        projectName: "演示瓜站",
        kindLabel: "频道异常",
        objectName: "@demo_channel_b",
        objectExtra: "采集频道",
        botName: "星火采",
        reason: "连续拉取失败 3 次，请检查号是否仍在频道内。",
        severity: "danger",
        href: "./tg-collect.html"
      }
    ],
    /** Userbot 按项目归属；extChannels 仅兼容旧数据 */
    extChannels: [],
    userbots: JSON.parse(JSON.stringify(DEMO_USERBOTS)),
    projects: JSON.parse(JSON.stringify(DEMO_PROJECTS)),
    roles: JSON.parse(JSON.stringify(DEMO_ROLES)),
    subs: JSON.parse(JSON.stringify(DEMO_SUBS)),
    /** 备份：新号登录前的业务项目快照 */
    _projectsBackup: null
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /** 合并缺失的演示资产（不清空用户自建） */
  function ensureDemoAssets(state) {
    var changed = false;
    if (!state.tickets) {
      state.tickets = [];
      changed = true;
    }
    if (!state.menuTourDoneByAccount) {
      state.menuTourDoneByAccount = {};
      changed = true;
    }
    if (
      !state.statusAlerts ||
      !state.statusAlerts.length ||
      (state.statusAlerts[0] && !state.statusAlerts[0].projectName)
    ) {
      state.statusAlerts = clone(DEFAULT.statusAlerts);
      changed = true;
    } else {
      (state.statusAlerts || []).forEach(function (a) {
        var map = {
          "演示项目 · 已完成": "演示瓜站",
          "演示项目 · 待接通": "演示短剧站",
          "演示项目 · 缺采集源": "演示视频站"
        };
        if (a.projectName && map[a.projectName]) {
          a.projectName = map[a.projectName];
          changed = true;
        }
        if (a.kindLabel === "频道监听异常") {
          a.kindLabel = "频道异常";
          changed = true;
        }
        if (!a.severity) {
          a.severity = "danger";
          changed = true;
        }
      });
    }
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
      /* 只补缺；演示号旧名含状态词（空闲可用/已断开等）则纠正为标签名 */
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
      if (
        /空闲可用|已断开|主转发|备援|转发用|公共池|转发号\s*[AB]|Alpha\s*采集|Beta\s*采集/.test(
          String(hit.name || "")
        ) &&
        hit.name !== seed.name
      ) {
        hit.name = seed.name;
        changed = true;
        (state.projects || []).forEach(function (p) {
          if (p.userbotId === hit.id || (p.userbotIds || []).indexOf(hit.id) !== -1) {
            if (p.userbotId === hit.id) p.userbotName = hit.name;
          }
        });
      }
    });
    /* 去掉多余演示号（旧版隔离号等）；公共池号必须保留 */
    var keep = {
      bot_demo_free: 1,
      bot_demo_busy: 1,
      bot_demo_pool: 1,
      bot_demo_pool_b: 1
    };
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
    /*
     * 新号空态：禁止补演示业务项目；但绝不在 ensure 里删用户已建项目
     * （清空演示项只在 applyLoginProfile(owner_empty) 时做一次）
     */
    var emptyOnboard = isEmptyOnboarding(state);
    if (emptyOnboard && !(state.projects || []).some(isPublicPool)) {
      var poolSeed0 = DEMO_PROJECTS.find(function (p) {
        return isPublicPool(p);
      });
      if (poolSeed0) {
        state.projects = (state.projects || []).concat([clone(poolSeed0)]);
        changed = true;
      }
    }
    /* 任何项目名尾部不得附带状态文案；状态只在 status 字段 / 列表「状态」列 */
    (state.projects || []).forEach(function (p) {
      var n = String(p.name || "");
      var cleaned = n;
      if (/^演示项目\s*·\s*(已完成|待接通|缺采集源)$/.test(n)) {
        cleaned =
          {
            proj_demo_ready: "演示瓜站",
            proj_demo_pending: "演示短剧站",
            proj_demo_collect: "演示视频站"
          }[p.id] || "演示项目";
      } else if (/\s*·\s*(已完成|待接通|缺采集源)$/.test(n)) {
        cleaned = n.replace(/\s*·\s*(已完成|待接通|缺采集源)$/, "");
      }
      if (cleaned && cleaned !== n) {
        p.name = cleaned;
        changed = true;
      }
    });
    DEMO_PROJECTS.forEach(function (seed) {
      if (emptyOnboard && !seed.isPublicPool) return;
      var hit = state.projects.find(function (p) {
        return p.id === seed.id;
      });
      if (!hit) {
        state.projects.push(clone(seed));
        changed = true;
        return;
      }
      /* 演示种子名曾把状态写进名称；纠正为纯项目名（状态只走 status 列） */
      if (!seed.isPublicPool && hit.name !== seed.name) {
        var dirtyName =
          /演示项目\s*·\s*(已完成|待接通|缺采集源)/.test(String(hit.name || "")) ||
          /\s*·\s*(已完成|待接通|缺采集源)$/.test(String(hit.name || ""));
        if (dirtyName) {
          hit.name = seed.name;
          changed = true;
        }
      }
      /* 公共池：补演示号/频道/路由（不覆盖用户已改过的非空配置） */
      if (seed.isPublicPool) {
        if (!(hit.userbotIds || []).length && (seed.userbotIds || []).length) {
          hit.userbotIds = seed.userbotIds.slice();
          hit.userbotId = seed.userbotId;
          hit.userbotName = seed.userbotName;
          changed = true;
        } else {
          (seed.userbotIds || []).forEach(function (bid) {
            if ((hit.userbotIds || []).indexOf(bid) === -1) {
              if (!hit.userbotIds) hit.userbotIds = [];
              hit.userbotIds.push(bid);
              changed = true;
            }
          });
        }
        if (!hit.boundChannels) hit.boundChannels = [];
        (seed.boundChannels || []).forEach(function (ch) {
          if (
            !hit.boundChannels.some(function (x) {
              return x.id === ch.id && x.botId === ch.botId;
            })
          ) {
            hit.boundChannels.push(clone(ch));
            changed = true;
          }
        });
        if (!hit.routingRules) hit.routingRules = [];
        (seed.routingRules || []).forEach(function (rr) {
          var exist = hit.routingRules.find(function (x) {
            return x.id === rr.id;
          });
          if (!exist) {
            hit.routingRules.push(clone(rr));
            changed = true;
          } else {
            if (exist.healthStatus == null && rr.healthStatus != null) {
              exist.healthStatus = rr.healthStatus;
              changed = true;
            }
            if (rr.healthError && !exist.healthError) {
              exist.healthError = rr.healthError;
              changed = true;
            }
          }
        });
        /* 旧演示 rr_demo_1（一源两目标）拆成边后可删，避免重复 */
        var beforeRr = hit.routingRules.length;
        hit.routingRules = hit.routingRules.filter(function (r) {
          return r.id !== "rr_demo_1";
        });
        if (hit.routingRules.length !== beforeRr) changed = true;
        /* Demo：补到接近上限，方便验收折叠/搜索（线上 Admin 可把上限调高） */
        var fillBot = "bot_demo_pool";
        var onBot = hit.boundChannels.filter(function (x) {
          return x.botId === fillBot;
        }).length;
        var i;
        for (i = 1; i <= 40 && onBot < BOT_LIMITS.maxChannelsPerBot; i++) {
          var fid = "ch_pool_fill_" + i;
          if (
            hit.boundChannels.some(function (x) {
              return x.id === fid;
            })
          ) {
            continue;
          }
          hit.boundChannels.push({
            id: fid,
            title: "@pool_demo_ch_" + (i < 10 ? "0" + i : i),
            botId: fillBot,
            role: i % 4 === 0 ? "push" : "collect",
            active: true,
            boundAt: Date.now() - (40 - i) * 60000,
            note: "演示填充"
          });
          onBot += 1;
          changed = true;
        }
        /* 修复：曾误把演示填充改成未分配 → 恢复角色并启用 */
        hit.boundChannels.forEach(function (ch) {
          if (String(ch.id || "").indexOf("ch_pool_fill_") !== 0) return;
          if (ch.role === "collect" || ch.role === "push") {
            if (ch.active == null) {
              ch.active = true;
              changed = true;
            }
            return;
          }
          var num = parseInt(String(ch.id).replace("ch_pool_fill_", ""), 10) || 0;
          ch.role = num % 4 === 0 ? "push" : "collect";
          ch.active = true;
          ch.note = "演示填充";
          changed = true;
        });
        /* 仅保留少量固定「未分配」样例；更多未分配靠「拉取频道」生成 */
        [
          { id: "ch_pool_pending_a", title: "@pool_pending_a" },
          { id: "ch_pool_pending_b", title: "@pool_pending_b" }
        ].forEach(function (row) {
          var exist = hit.boundChannels.find(function (x) {
            return x.id === row.id;
          });
          if (exist) {
            if (!exist.role) {
              exist.active = false;
              exist.note = "拉取待分配";
            }
            return;
          }
          hit.boundChannels.unshift({
            id: row.id,
            title: row.title,
            botId: fillBot,
            role: "",
            active: false,
            boundAt: Date.now(),
            note: "拉取待分配"
          });
          changed = true;
        });
        hit.boundChannels.forEach(function (ch, idx) {
          if (ch.role == null) {
            ch.role = "";
            changed = true;
          }
          if (ch.role === "collect" || ch.role === "push") {
            if (ch.active == null) {
              ch.active = true;
              changed = true;
            }
          } else if (ch.active == null) {
            ch.active = false;
            changed = true;
          }
          if (ch.boundAt == null) {
            ch.boundAt = Date.now() - (hit.boundChannels.length - idx) * 1000;
            changed = true;
          }
        });
        (hit.routingRules || []).forEach(function (rr) {
          if (rr.healthError == null) {
            if (rr.healthStatus === "BROKEN") {
              rr.healthError = "分发号无法读取源频道（not a member）";
              changed = true;
            } else if (rr.healthStatus === "UNKNOWN") {
              rr.healthError = "体检超时，结果无法判定";
              changed = true;
            }
          }
        });
      }
    });
    /* 全项目频道补 active / boundAt；业务项目禁止分发角色 */
    (state.projects || []).forEach(function (p) {
      var pool = isPublicPool(p);
      (p.boundChannels || []).forEach(function (ch, idx) {
        if (!pool && ch.role === "push") {
          ch.role = "collect";
          changed = true;
        }
        if (ch.active == null) {
          ch.active = ch.role === "collect" || ch.role === "push";
          changed = true;
        }
        if (ch.boundAt == null) {
          ch.boundAt = Date.now() - ((p.boundChannels || []).length - idx) * 1000;
          changed = true;
        }
      });
      if (!pool && p.routingRules && p.routingRules.length) {
        p.routingRules = [];
        changed = true;
      }
    });
    /* 仅有业务项目时才视为已完成首项；公共池不算入驻完成 */
    if (businessProjects(state).length && !state.firstProjectDone) {
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
   * - need_collect      已接通且开了「自动转入编辑」，但演示上仍缺采集源绑定
   * 旧态 need_post_config 读入时归一（见 normalizeProjects）
   */
  function deriveStatus(p) {
    if (!p.contentActivated) return "pending_activate";
    var wantAutoEdit = !!(p.autoToEdit || p.autoflow);
    if (wantAutoEdit && !p.hasCollectSource) return "need_collect";
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
        /* 公共池允许 role 空=未分配；业务项目旧数据才兜底成采集 */
        if (!ch.role && !isPublicPool(p)) ch.role = "collect";
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
        if (p.autoToEdit == null) p.autoToEdit = !!(p.autoflow || p.autoPush);
        if (p.autoPush == null) p.autoPush = !!p.autoflow;
        p.autoflow = !!p.autoToEdit;
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

  /**
   * 拉取频道（现网 sync-from-telegram）：把 Telegram 侧已进、方舟未登记的频道同步进当前上下文。
   * Demo 用 DEMO_TG_LATENT 模拟；返回 { synced, added, skipped }。
   */
  function syncChannelsFromTelegram(state, botId, projectId) {
    var bot = (state.userbots || []).find(function (b) {
      return b.id === botId;
    });
    var project = findProject(state, projectId);
    if (!bot || !project) {
      return { ok: false, error: "采集号或上下文不存在" };
    }
    if (bot.status !== "connected" && bot.status !== "ok") {
      return { ok: false, error: "请先连接会话，再拉取频道" };
    }
    if (!project.boundChannels) project.boundChannels = [];
    var isPool = isPublicPool(project);
    var added = 0;
    var skipped = 0;
    var rows = (DEMO_TG_LATENT[botId] || []).slice();
    /* 公共池：每次拉取再生成 3 条未分配，专门方便演示标记用途 */
    if (isPool) {
      var stamp = Date.now().toString(36);
      var n;
      for (n = 1; n <= 3; n++) {
        rows.push({
          id: "ch_pull_" + stamp + "_" + n,
          title: "@pool_pulled_" + stamp.slice(-4) + "_" + n
        });
      }
    }
    if (!rows.length) {
      return { ok: true, synced: 0, added: 0, skipped: 0 };
    }
    rows.forEach(function (row) {
      if (
        project.boundChannels.some(function (ch) {
          return ch.id === row.id && ch.botId === botId;
        })
      ) {
        skipped += 1;
        return;
      }
      /* 拉取：业务项目默认采集；公共池未分配，由运营再标采集/分发 */
      var role = isPool ? "" : "collect";
      var block = botJoinChannelBlockReason(state, botId, row.id, projectId);
      if (block) {
        skipped += 1;
        return;
      }
      project.boundChannels.unshift({
        id: row.id,
        title: row.title,
        botId: botId,
        role: role,
        active: !!role,
        boundAt: Date.now(),
        note: "拉取同步"
      });
      if (role === "collect" && !isPool) project.hasCollectSource = true;
      added += 1;
    });
    bot.channelCount = userbotBoundChannelCount(state, bot);
    upsertProject(state, project);
    return { ok: true, synced: rows.length, added: added, skipped: skipped };
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
      var ownerLabel = owner.isPublicPool ? "公共池" : "项目「" + (owner.name || owner.id) + "」";
      return (
        "该频道已被" +
        ownerLabel +
        "的采集号加入，此处不能再加入（勿重复进群）。"
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
   * 新号首建：退出空态、补齐演示对照项目，并把新建项放最前。
   */
  function seedAfterFirstCreate(state, first) {
    state.firstProjectDone = true;
    if (state.accountId === "owner_empty") {
      state.accountId = "owner";
      if (!state.displayName || /新号/.test(String(state.displayName))) {
        state.displayName = "主账号演示";
      }
    }
    if (!state.statusAlerts || !state.statusAlerts.length) {
      state.statusAlerts = clone(DEFAULT.statusAlerts);
    }
    /* 先毕业再 ensure，否则空态逻辑会把业务项目（含刚建的）滤掉 */
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

  function isPublicPool(projectOrId) {
    if (!projectOrId) return false;
    if (typeof projectOrId === "string") return projectOrId === PUBLIC_POOL_ID;
    return !!(projectOrId.isPublicPool || projectOrId.id === PUBLIC_POOL_ID);
  }

  /** 业务项目列表（不含公共池；项目管理页用） */
  function businessProjects(state) {
    return (state.projects || []).filter(function (p) {
      return !isPublicPool(p);
    });
  }

  /** 主账号新号入驻：尚无业务项目时工作台空态 + 引导创建；首建后即毕业 */
  function isEmptyOnboarding(state) {
    if (!state) return false;
    if (state.firstProjectDone) return false;
    if (businessProjects(state).length) return false;
    if (state.accountId === "owner_empty") return true;
    return state.accountKind === "owner";
  }

  function flattenOwnerFeatures() {
    var out = [];
    var tree = (global.FZPerm && global.FZPerm.TREE) || [];
    function walk(nodes) {
      (nodes || []).forEach(function (n) {
        if (n.children && n.children.length) walk(n.children);
        else if (n.actions && n.actions.length) {
          n.actions.forEach(function (a) {
            out.push(n.id + "." + a);
          });
        }
      });
    }
    walk(tree);
    if (!out.length) {
      out = ["home.overview.view", "projects.list.view", "projects.list.create"];
    }
    return out;
  }

  function hasFeature(state, featureId) {
    if (!featureId) return true;
    /* 未标记子账号的一律按主账号（全量或 features 列表） */
    if (!state || state.accountKind !== "sub") {
      var feats = state && state.features;
      if (!feats || !feats.length) return true;
      return feats.indexOf(featureId) !== -1;
    }
    return (state.features || []).indexOf(featureId) !== -1;
  }

  function accountKey(state) {
    return (state && state.accountId) || "owner";
  }

  function isMenuTourDone(state) {
    var map = state.menuTourDoneByAccount || {};
    return !!map[accountKey(state)];
  }

  function setMenuTourDone(state, done) {
    if (!state.menuTourDoneByAccount) state.menuTourDoneByAccount = {};
    state.menuTourDoneByAccount[accountKey(state)] = !!done;
  }

  /**
   * 登录页选角色后写入会话。
   * profile: owner | owner_empty | sub id
   */
  function applyLoginProfile(state, profile) {
    profile = profile || "owner";
    state.loggedIn = true;
    state.tickets = state.tickets || [];
    state.statusAlerts = state.statusAlerts || clone(DEFAULT.statusAlerts);
    state.menuTourDoneByAccount = state.menuTourDoneByAccount || {};

    if (profile === "owner" || profile === "owner_empty") {
      state.accountKind = "owner";
      state.accountId = profile;
      state.username = "demo_owner";
      state.displayName = profile === "owner_empty" ? "主账号 · 新号" : "主账号演示";
      state.features = flattenOwnerFeatures();
      if (profile === "owner_empty") {
        if (!state._projectsBackup) {
          state._projectsBackup = clone(state.projects || []);
        }
        state.projects = (state.projects || []).filter(function (p) {
          return isPublicPool(p);
        });
        if (!state.projects.length) {
          var pool = DEMO_PROJECTS.find(function (p) {
            return isPublicPool(p);
          });
          state.projects = pool ? [clone(pool)] : [];
        }
        state.firstProjectDone = false;
        state.zeroPromptDismissed = false;
        state.statusAlerts = [];
        state.tickets = [];
        /* 新号入驻：始终重新绑定谷歌验证 */
        state.totpBound = false;
        state.totpBindMode = "enroll";
      } else {
        if (state._projectsBackup && state._projectsBackup.length) {
          state.projects = clone(state._projectsBackup);
          state._projectsBackup = null;
        } else {
          ensureDemoAssets(state);
        }
        state.firstProjectDone = businessProjects(state).length > 0;
      }
      return state;
    }

    var sub = (state.subs || []).find(function (u) {
      return u.id === profile;
    });
    if (!sub) {
      return applyLoginProfile(state, "owner");
    }
    state.accountKind = "sub";
    state.accountId = sub.id;
    state.username = sub.username;
    state.displayName = sub.displayName;
    state.features = (sub.features || []).slice();
    state.zeroPromptDismissed = true;
    if (state._projectsBackup && state._projectsBackup.length) {
      state.projects = clone(state._projectsBackup);
      state._projectsBackup = null;
    }
    ensureDemoAssets(state);
    state.firstProjectDone = businessProjects(state).length > 0;
    return state;
  }

  function addTicket(state, ticket) {
    if (!state.tickets) state.tickets = [];
    state.tickets.unshift(ticket);
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
    { id: "collect_web", name: "网站采集" },
    { id: "collect_materials", name: "素材管理" },
    { id: "review_material", name: "素材审核" },
    { id: "edit_article", name: "文章管理" },
    { id: "interact", name: "内容中心 · 生成 / 审核中心" },
    { id: "pull_wm", name: "拉取加水印" },
    { id: "userbot_cfg", name: "Userbot 配置" },
    { id: "sub_manage", name: "子账号管理" }
  ];

  global.FZStore = {
    KEY: KEY,
    PUBLIC_POOL_ID: PUBLIC_POOL_ID,
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
    syncChannelsFromTelegram: syncChannelsFromTelegram,
    userbotChangeBlockReason: userbotChangeBlockReason,
    attachBotToProject: attachBotToProject,
    detachBotFromProject: detachBotFromProject,
    syncProjectUserbotFields: syncProjectUserbotFields,
    deriveStatus: deriveStatus,
    markContentConnected: markContentConnected,
    findProject: findProject,
    upsertProject: upsertProject,
    isPublicPool: isPublicPool,
    businessProjects: businessProjects,
    isEmptyOnboarding: isEmptyOnboarding,
    flattenOwnerFeatures: flattenOwnerFeatures,
    hasFeature: hasFeature,
    accountKey: accountKey,
    isMenuTourDone: isMenuTourDone,
    setMenuTourDone: setMenuTourDone,
    applyLoginProfile: applyLoginProfile,
    addTicket: addTicket,
    reset: function () {
      localStorage.removeItem(KEY);
      /* 文章列表独立缓存，重置时一并清掉，避免失败/已推送等种子态回不来 */
      try {
        localStorage.removeItem("fz_articles_demo_v1");
        localStorage.removeItem("fz_articles_demo_v2");
      } catch (err) {}
      /* 菜单引导本会话防重复标记；不清理则重置后引导不会再自动弹出 */
      try {
        var kill = [];
        var i;
        for (i = 0; i < sessionStorage.length; i++) {
          var k = sessionStorage.key(i);
          if (k && k.indexOf("fz_tour_auto_") === 0) kill.push(k);
        }
        kill.forEach(function (k) {
          sessionStorage.removeItem(k);
        });
      } catch (err2) {}
      if (global.FZArticles && typeof FZArticles.reset === "function") {
        FZArticles.reset();
      }
    }
  };
})(window);
