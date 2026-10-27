/* 素材管理 · Demo 数据（三视图：待审 / 全部 / 垃圾） */
(function (w) {
  var AD_CATS = [
    "广告-高风险（拦截）",
    "广告-高风险（直接拦截）",
    "广告-中风险（人工复核）"
  ];
  var CHANNELS = ["源频道甲", "源频道乙", "源频道丙", "示例短剧站 A"];
  var TABS = [
    { id: "all", label: "全部素材" },
    { id: "trash", label: "垃圾素材" },
    { id: "pending", label: "待我审核" }
  ];
  /* 全部素材用的流水线状态（垃圾非 MaterialStatus，不进此表） */
  var LABEL = {
    pending: { text: "待人工审核", cls: "badge-warn" },
    rejected: { text: "已驳回", cls: "badge-danger" },
    kept: { text: "去重保留", cls: "badge-ok" },
    duplicate: { text: "重复淘汰", cls: "badge-muted" },
    available: { text: "可使用", cls: "badge-ok" },
    used: { text: "已使用", cls: "badge-muted" }
  };
  var ALL_STATUSES = ["pending", "rejected", "kept", "duplicate", "available", "used"];

  function mk(id, title, project, channel, status, time, views, interact, opts) {
    opts = opts || {};
    var mediaType = opts.mediaType || (project.indexOf("视频") >= 0 ? "视频" : "图文");
    var num = String(id).replace(/^m/, "");
    /* belong=none → 公共池（可 TG 分发）；proj → 专属站点（不进 TG，目标频道为空） */
    var belong = opts.belong || "none";
    var dedicated = belong === "proj";
    var poolDispatched = !dedicated && (status === "available" || status === "used" || status === "kept");
    return {
      id: id,
      formalNumber: opts.formalNumber || "FZ-" + num,
      title: title,
      project: project,
      channel: channel,
      source: channel.indexOf("站") >= 0 ? "网站 · " + channel : "TG · " + channel,
      status: status,
      time: time,
      views: views || 0,
      interact: interact || 0,
      category: opts.category || (mediaType === "视频" ? "短剧" : "资讯"),
      mediaType: mediaType,
      belong: belong,
      targetChannel:
        opts.targetChannel != null ? opts.targetChannel : poolDispatched ? "@push_demo_a" : "",
      /* 专属：列里显示「专属·项目」；公共池 used：显示转编辑占用项目（可与目标频道并存） */
      dispatchProject:
        opts.dispatchProject != null
          ? opts.dispatchProject
          : dedicated
            ? "专属·" + project
            : status === "used"
              ? project
              : "",
      dispatchKind: dedicated ? "dedicated" : status === "used" ? "usage" : ""
    };
  }
  function mkTrash(id, title, project, channel, time, adCategory, score, hitRule) {
    var m = mk(id, title, project, channel, "trash", time, 0, 0);
    m.adCategory = adCategory;
    m.score = String(score);
    m.hitRule = hitRule;
    return m;
  }

  var ITEMS = [
    mk("m1012", "频道快讯 · 图文组", "演示瓜站", "源频道甲", "pending", "2026-10-27 10:48", 1200, 88),
    mk("m1011", "短视频素材 #8841", "演示视频站", "源频道乙", "pending", "2026-10-27 10:12", 860, 41, {
      mediaType: "视频"
    }),
    mk("m1009", "已驳回样例", "演示瓜站", "源频道甲", "rejected", "2026-10-27 08:00", 90, 3),
    mk("m1007", "去重保留样例", "演示视频站", "源频道乙", "kept", "2026-10-26 20:10", 500, 20),
    mk("m1006", "重复淘汰样例", "演示瓜站", "源频道丙", "duplicate", "2026-10-26 19:00", 40, 1),
    mkTrash("m1005", "广告疑似 · 已入垃圾", "演示瓜站", "源频道丙", "2026-10-26 22:01", AD_CATS[0], 9.2, "导流外链"),
    /* 公共池：可有目标频道；尚未转编辑 → 分发项目空 */
    mk("m1002", "可用成片 · 可转编辑", "演示视频站", "示例短剧站 A", "available", "2026-10-26 18:40", 2200, 156, {
      mediaType: "视频",
      belong: "none",
      targetChannel: "@push_demo_a",
      dispatchProject: ""
    }),
    /* 公共池：TG 已分发 + 又被转编辑占用 → 两列可同时有值 */
    mk("m0998", "公共池已转编辑", "演示瓜站", "源频道甲", "used", "2026-10-25 12:00", 300, 18, {
      belong: "none",
      targetChannel: "@push_demo_b",
      dispatchProject: "演示瓜站"
    }),
    /* 专属站点：不进 TG，目标频道空，分发项目显示专属徽标 */
    mk("m0997", "专属站点自动流转", "演示瓜站", "源频道乙", "available", "2026-10-25 09:00", 180, 9, {
      belong: "proj",
      targetChannel: "",
      dispatchProject: "专属·演示瓜站"
    })
  ];
  (function pad() {
    var i;
    for (i = 0; i < 40; i++) {
      var ch = CHANNELS[i % CHANNELS.length];
      var id = "m" + (980 - i);
      var title = "演示素材 #" + (980 - i);
      var proj = i % 2 ? "演示视频站" : "演示瓜站";
      var time = "2026-10-24 " + String(8 + (i % 10)).padStart(2, "0") + ":00";
      if (i % 5 === 4) {
        ITEMS.push(
          mkTrash(id, title, proj, ch, time, AD_CATS[i % 3], (5 + (i % 50) / 10).toFixed(1), "规则#" + ((i % 7) + 1))
        );
      } else {
        var st = ALL_STATUSES[i % ALL_STATUSES.length];
        /* 多数公共池；约 1/8 专属（专属无目标频道） */
        ITEMS.push(
          mk(id, title, proj, ch, st, time, 100 + i * 17, 3 + (i % 20), {
            mediaType: i % 3 ? "图文" : "视频",
            belong: i % 8 === 0 ? "proj" : "none"
          })
        );
      }
    }
  })();

  w.FZMatData = {
    AD_CATS: AD_CATS,
    CHANNELS: CHANNELS,
    TABS: TABS,
    LABEL: LABEL,
    ALL_STATUSES: ALL_STATUSES,
    ITEMS: ITEMS
  };
})(window);
