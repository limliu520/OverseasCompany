/* 素材管理 · Demo 数据（To-Be：公共池 | 业务项目，无专属/外站） */
(function (w) {
  var AD_CATS = [
    "广告-高风险（拦截）",
    "广告-高风险（直接拦截）",
    "广告-中风险（人工复核）"
  ];
  var CHANNELS = ["源频道甲", "源频道乙", "源频道丙", "示例短剧站 A"];
  /* 全部素材筛选项：对齐列表「分发频道 / 分发项目」列 */
  var TARGET_CHANNELS = ["@push_demo_a", "@push_demo_b", "@push_demo_c", "@push_demo_d"];
  var DISPATCH_PROJECTS = [
    "每日大赛",
    "51 吃瓜",
    "91 网黄",
    "51 原创",
    "51 短剧",
    "51 短视频"
  ];
  var PROJECT_SITE_TYPE = {
    每日大赛: "chigua",
    "51 吃瓜": "chigua",
    "91 网黄": "video",
    "51 原创": "video",
    "51 短剧": "short_drama",
    "51 短视频": "short_drama"
  };
  var SITE_TYPE_LABEL = {
    chigua: "瓜站",
    video: "视频站",
    short_drama: "短剧站"
  };
  function siteTypeLabel(codeOrName) {
    if (SITE_TYPE_LABEL[codeOrName]) return SITE_TYPE_LABEL[codeOrName];
    var code = PROJECT_SITE_TYPE[codeOrName];
    return (code && SITE_TYPE_LABEL[code]) || "";
  }
  var TABS = [
    { id: "all", label: "全部素材" },
    { id: "pending", label: "待审核素材" },
    { id: "trash", label: "垃圾素材" }
  ];
  var LABEL = {
    pending: { text: "待人工审核", cls: "badge-warn" },
    rejected: { text: "已驳回", cls: "badge-danger" },
    kept: { text: "去重保留", cls: "badge-ok" },
    duplicate: { text: "重复淘汰", cls: "badge-muted" },
    available: { text: "可使用", cls: "badge-ok" },
    used: { text: "已使用", cls: "badge-muted" },
    trash: { text: "已驳回", cls: "badge-danger" }
  };
  /* 内容级状态（公共池行）；「已使用」只在项目池按 usedByProjects 推导，不进种子 status */
  var ALL_STATUSES = ["pending", "rejected", "kept", "duplicate", "available"];
  var POOL_STATUSES = ["kept", "duplicate", "available"];

  function usedByList(m) {
    var list = [];
    function add(n) {
      if (n && list.indexOf(n) < 0) list.push(n);
    }
    (m.usedByProjects || []).forEach(add);
    /* 兼容旧 Demo 种子 / 本地残留：曾把 used 写在全局 status 上 */
    if (m.status === "used") {
      (m.dispatchProjects || []).forEach(add);
      add(m.dispatchProject);
      add(m.project);
    }
    return list;
  }
  function poolStatus(m) {
    if (m.status === "used") return "available";
    return m.status;
  }
  /** scopeCtx: { kind:'pool' } | { kind:'proj', name } | null；已使用仅项目池 */
  function effectiveStatus(m, scopeCtx) {
    var sc = scopeCtx || {};
    if (sc.kind === "proj" && sc.name && usedByList(m).indexOf(sc.name) >= 0) {
      return "used";
    }
    return poolStatus(m);
  }
  function isUsedBy(m, projectName) {
    return !!projectName && usedByList(m).indexOf(projectName) >= 0;
  }
  function markUsedBy(m, projectName) {
    if (!m || !projectName) return;
    if (!m.usedByProjects) m.usedByProjects = usedByList(m);
    if (m.usedByProjects.indexOf(projectName) < 0) m.usedByProjects.push(projectName);
    if (m.status === "used") m.status = "available";
    if (!m.dispatchProjects) m.dispatchProjects = [];
    if (m.dispatchProjects.indexOf(projectName) < 0) m.dispatchProjects.push(projectName);
    if (!m.dispatchProject) m.dispatchProject = projectName;
  }

  function mk(id, title, project, channel, status, time, views, interact, opts) {
    opts = opts || {};
    var mediaType = opts.mediaType || (project.indexOf("视频") >= 0 ? "视频" : "图文");
    var num = String(id).replace(/^m/, "");
    var collectType =
      opts.collectType || (String(channel || "").indexOf("站") >= 0 ? "web" : "tg");
    /*
     * belong：采入主路径标记（展示「采集方式」用）
     *   none = 先入公共采集 / 未绑项目网站等
     *   proj = 项目自采（频道/网站已绑项目）
     * 口径：不论 belong，素材一律进「公共素材池」；转编辑进项目后仍留在公共素材池，他人可见。
     * 「已使用」按项目记在 usedByProjects，公共池 status 仍为可使用等。
     * 网站料永不挂 TG 分发频道（进不了 TG）。
     */
    var belong = opts.belong != null ? opts.belong : collectType === "web" ? "proj" : "none";
    var isPool = belong === "none";
    var usedBy = (opts.usedByProjects || []).slice();
    var st = status === "used" ? "available" : status;
    if (status === "used" && !usedBy.length && project) usedBy = [project];
    var poolRouted =
      isPool &&
      collectType === "tg" &&
      (st === "available" || st === "kept" || usedBy.length);
    /* 公共池 TG 可一源多目标；网站公共池无 targetChannels */
    var targets;
    if (collectType === "web") targets = [];
    else if (opts.targetChannels) targets = opts.targetChannels.slice();
    else if (opts.targetChannel != null && opts.targetChannel !== "") targets = [opts.targetChannel];
    else if (opts.targetChannel === "") targets = [];
    else if (poolRouted) targets = ["@push_demo_a", "@push_demo_b"];
    else targets = [];
    var target = targets[0] || "";
    var dispatch;
    if (opts.dispatchProject != null) dispatch = opts.dispatchProject;
    else if (!isPool) dispatch = project;
    else if (usedBy.length) dispatch = usedBy[0];
    else dispatch = "";
    var kw = opts.keywords || ["热点", "资讯", "演示"];
    var vidN = mediaType === "视频" ? 3 : 0;
    var imgN = mediaType === "视频" ? 2 : 4;
    return {
      id: id,
      formalNumber: opts.formalNumber || "FZ-" + num,
      title: title,
      project: project,
      channel: channel,
      collectType: collectType,
      source: collectType === "web" ? "网站 · " + channel : "TG · " + channel,
      status: st,
      usedByProjects: usedBy,
      time: time,
      publishTime: opts.publishTime || time,
      views: views || 0,
      interact: interact || 0,
      category: opts.category || (mediaType === "视频" ? "短剧" : "资讯"),
      mediaType: mediaType,
      belong: belong,
      targetChannel: target,
      targetChannels: targets,
      dispatchProject: dispatch,
      dispatchProjects: opts.dispatchProjects || (dispatch ? [dispatch] : []),
      keywords: kw,
      summary: opts.summary || title + "。演示用素材简介，用于详情「素材简介」字段。",
      textContent: opts.textContent || title + "\n\n（Demo 正文预览，对齐现网详情左侧文案区。）",
      videoCount: opts.videoCount != null ? opts.videoCount : vidN,
      imageCount: opts.imageCount != null ? opts.imageCount : imgN,
      logs: opts.logs || [
        { agent: "merge_agent", stage: "merge", msg: "Already merged by ChannelMonitor", time: time }
      ],
      dispatchLogs: opts.dispatchLogs || targets.map(function (t, i) {
        return {
          target: t,
          status: i === 0 ? "已分发" : i === 1 ? "已分发" : "未分发",
          time: time
        };
      })
    };
  }
  function mkTrash(id, title, project, channel, time, adCategory, score, hitRule, opts) {
    /* 与现网一致：垃圾详情走同一套详情壳；多数广告拦截料 media_files 为空 → 走无媒体布局（非另一套弹窗） */
    opts = opts || {};
    var m = mk(id, title, project, channel, "trash", time, 0, 0, {
      videoCount: opts.videoCount != null ? opts.videoCount : 0,
      imageCount: opts.imageCount != null ? opts.imageCount : 0,
      mediaType: opts.mediaType || "图文"
    });
    m.adCategory = adCategory;
    m.score = String(score);
    m.hitRule = hitRule;
    return m;
  }

  var ITEMS = [
    /* 待审只出现在「待审核素材」Tab；通过后才进公共池 / 项目池 */
    mk("m1012", "频道快讯 · 图文组", "每日大赛", "源频道甲", "pending", "2026-10-27 10:48", 1200, 88, {
      imageCount: 12,
      videoCount: 0,
      belong: "none",
      targetChannels: ["@push_demo_a", "@push_demo_b"]
    }),
    mk("m1011", "短视频素材 #8841", "91 网黄", "源频道乙", "pending", "2026-10-27 10:12", 860, 41, {
      mediaType: "视频",
      belong: "proj",
      targetChannels: []
    }),
    mk("m1010", "待审样例 · 暂无路由", "每日大赛", "源频道丙", "pending", "2026-10-27 09:40", 420, 19, {
      belong: "none",
      targetChannels: []
    }),
    mkTrash("m1009", "人工驳回样例", "每日大赛", "源频道甲", "2026-10-27 08:00", AD_CATS[1] || AD_CATS[0], 7.5, "人工驳回"),
    mk("m1007", "去重保留样例", "91 网黄", "源频道乙", "kept", "2026-10-26 20:10", 500, 20),
    mk("m1006", "重复淘汰样例", "每日大赛", "源频道丙", "duplicate", "2026-10-26 19:00", 40, 1),
    mkTrash("m1005", "广告疑似 · 已入垃圾", "每日大赛", "源频道丙", "2026-10-26 22:01", AD_CATS[0], 9.2, "导流外链"),
    /* 少数垃圾仍带媒体：证明详情壳相同，有 media_files 就会出预览 */
    mkTrash("m1004", "垃圾但有图 · 对照", "每日大赛", "源频道甲", "2026-10-26 21:30", AD_CATS[2], 6.1, "关键词命中", {
      imageCount: 3,
      videoCount: 0
    }),
    /* 网站已绑项目 → 进项目；无 TG 分发频道 */
    mk("m1002", "网站已绑项目 · 进短剧站", "51 短剧", "示例短剧站 A", "available", "2026-10-26 18:40", 2200, 156, {
      mediaType: "视频",
      collectType: "web",
      belong: "proj",
      targetChannels: [],
      dispatchProject: "51 短剧"
    }),
    /* 网站未绑任何项目 → 进公共池；分发频道为空（进不了 TG） */
    mk("m1003", "网站未绑项目 · 进公共池", "", "示例短剧站 A", "available", "2026-10-26 18:10", 900, 44, {
      mediaType: "视频",
      collectType: "web",
      belong: "none",
      targetChannels: [],
      dispatchProject: ""
    }),
    /* 公共池仍「可使用」；每日大赛已占用，91 网黄有分发行但未占用 → 可再转 */
    mk("m0998", "公共池可再转 · 每日大赛已占用", "每日大赛", "源频道甲", "available", "2026-10-25 12:00", 300, 18, {
      belong: "none",
      targetChannels: ["@push_demo_b", "@push_demo_d", "@push_demo_c"],
      dispatchProject: "每日大赛",
      dispatchProjects: ["每日大赛", "91 网黄"],
      usedByProjects: ["每日大赛"]
    }),
    /* TG 项目自采 */
    mk("m0997", "项目自采进内容通道", "每日大赛", "源频道乙", "available", "2026-10-25 09:00", 180, 9, {
      belong: "proj",
      targetChannels: [],
      dispatchProject: "每日大赛"
    }),
    /* 公共池 TG 可用成片 */
    mk("m1001", "公共池可用 · 可转编辑", "91 网黄", "源频道甲", "available", "2026-10-26 17:20", 1800, 120, {
      mediaType: "视频",
      belong: "none",
      targetChannels: ["@push_demo_a", "@push_demo_b", "@push_demo_c"],
      dispatchProject: ""
    })
  ];
  (function pad() {
    var i;
    for (i = 0; i < 40; i++) {
      var ch = CHANNELS[i % CHANNELS.length];
      var isWeb = String(ch).indexOf("站") >= 0;
      var id = "m" + (980 - i);
      var title = "演示素材 #" + (980 - i);
      /* 网站：约 1/3 未绑项目进公共池，其余进短剧站 */
      var webInPool = isWeb && i % 3 === 0;
      var proj = webInPool ? "" : isWeb ? "51 短剧" : i % 2 ? "91 网黄" : "每日大赛";
      var time = "2026-10-24 " + String(8 + (i % 10)).padStart(2, "0") + ":00";
      if (i % 5 === 4) {
        ITEMS.push(
          mkTrash(id, title, proj || "每日大赛", ch, time, AD_CATS[i % 3], (5 + (i % 50) / 10).toFixed(1), "规则#" + ((i % 7) + 1))
        );
      } else {
        var st = POOL_STATUSES[i % POOL_STATUSES.length];
        if (i % 7 === 0) st = "available";
        var usedBy = undefined;
        if (st === "available" && !webInPool && proj && i % 6 === 0) {
          usedBy = [proj];
        }
        ITEMS.push(
          mk(id, title, proj, ch, st, time, 100 + i * 17, 3 + (i % 20), {
            mediaType: i % 3 ? "图文" : "视频",
            collectType: isWeb ? "web" : "tg",
            belong: webInPool ? "none" : isWeb ? "proj" : i % 8 === 0 ? "proj" : "none",
            dispatchProject: webInPool ? "" : undefined,
            usedByProjects: usedBy
          })
        );
      }
    }
  })();

  var SEED_ITEMS = JSON.parse(JSON.stringify(ITEMS));

  function reset() {
    var fresh = JSON.parse(JSON.stringify(SEED_ITEMS));
    ITEMS.length = 0;
    fresh.forEach(function (row) {
      ITEMS.push(row);
    });
  }

  w.FZMatData = {
    AD_CATS: AD_CATS,
    CHANNELS: CHANNELS,
    TARGET_CHANNELS: TARGET_CHANNELS,
    DISPATCH_PROJECTS: DISPATCH_PROJECTS,
    PROJECT_SITE_TYPE: PROJECT_SITE_TYPE,
    SITE_TYPE_LABEL: SITE_TYPE_LABEL,
    siteTypeLabel: siteTypeLabel,
    TABS: TABS,
    LABEL: LABEL,
    ALL_STATUSES: ALL_STATUSES,
    POOL_STATUSES: POOL_STATUSES,
    usedByList: usedByList,
    poolStatus: poolStatus,
    effectiveStatus: effectiveStatus,
    isUsedBy: isUsedBy,
    markUsedBy: markUsedBy,
    ITEMS: ITEMS,
    reset: reset
  };
})(window);
