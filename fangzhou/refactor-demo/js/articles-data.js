/* 文章管理 · Demo 种子（仅瓜站/视频站；短剧不进文章编辑） */
(function (w) {
  var STATUS = {
    pending: { text: "待处理", cls: "badge-muted" },
    processing_media: { text: "媒体处理中", cls: "badge-info" },
    media_ready: { text: "媒体就绪", cls: "badge-ok" },
    generating: { text: "生成中", cls: "badge-info" },
    awaiting_edit: { text: "待编辑", cls: "badge-warn" },
    uploading: { text: "上传中", cls: "badge-info" },
    publishing: { text: "发布中", cls: "badge-info" },
    draft_created: { text: "已推送", cls: "badge-ok" },
    failed: { text: "失败", cls: "badge-danger" }
  };

  function mk(id, opts) {
    opts = opts || {};
    return {
      id: id,
      title: opts.title || "未命名文章",
      projectId: opts.projectId,
      projectName: opts.projectName,
      siteType: opts.siteType || "chigua",
      materialId: opts.materialId,
      status: opts.status || "awaiting_edit",
      failReason: opts.failReason || "",
      operator: opts.operator || "—",
      autoTransfer: !!opts.autoTransfer,
      hasManualVersion: !!opts.hasManualVersion,
      time: opts.time || "2026-10-27 16:00"
    };
  }

  var SEED = [
    mk(1201, {
      title: "文案称「教父，夫人来了」枪口对准婴儿头…",
      projectId: "proj_demo_ready",
      projectName: "演示瓜站",
      siteType: "chigua",
      materialId: 39699,
      status: "awaiting_edit",
      operator: "小王",
      time: "2026-10-27 16:27"
    }),
    mk(1200, {
      title: "自动流入待编 · 专属频道成片",
      projectId: "proj_demo_ready",
      projectName: "演示瓜站",
      siteType: "chigua",
      materialId: 39680,
      status: "awaiting_edit",
      operator: "自动",
      autoTransfer: true,
      time: "2026-10-27 15:10"
    }),
    mk(1198, {
      title: "视频站成片 · 已推送可再编辑",
      projectId: "proj_demo_collect",
      projectName: "演示视频站",
      siteType: "video",
      materialId: 39501,
      status: "draft_created",
      operator: "李丽",
      hasManualVersion: true,
      time: "2026-10-26 21:08"
    }),
    mk(1195, {
      title: "媒体处理失败样例",
      projectId: "proj_demo_ready",
      projectName: "演示瓜站",
      siteType: "chigua",
      materialId: 39440,
      status: "failed",
      failReason: "水印服务超时，请重试",
      operator: "阿晨（主）",
      time: "2026-10-26 18:40"
    }),
    mk(1192, {
      title: "生成中 · 勿打断",
      projectId: "proj_demo_collect",
      projectName: "演示视频站",
      siteType: "video",
      materialId: 39300,
      status: "generating",
      operator: "小王",
      time: "2026-10-26 17:02"
    }),
    mk(1188, {
      title: "主号转入 · 待编辑",
      projectId: "proj_demo_ready",
      projectName: "演示瓜站",
      siteType: "chigua",
      materialId: 39210,
      status: "awaiting_edit",
      operator: "阿晨（主）",
      hasManualVersion: false,
      time: "2026-10-25 12:00"
    })
  ];

  function statusMeta(code) {
    return STATUS[code] || { text: code || "未知", cls: "badge-muted" };
  }

  function list() {
    return SEED.slice();
  }

  function get(id) {
    var n = Number(id);
    return SEED.find(function (a) {
      return a.id === n;
    }) || null;
  }

  /** 业务项目中可进文章编辑的（排除短剧） */
  function articleProjects(state) {
    var list =
      w.FZStore && typeof FZStore.businessProjects === "function"
        ? FZStore.businessProjects(state || FZStore.read())
        : [];
    return list.filter(function (p) {
      return p.siteType !== "short_drama";
    });
  }

  w.FZArticles = {
    STATUS: STATUS,
    statusMeta: statusMeta,
    list: list,
    get: get,
    articleProjects: articleProjects
  };
})(window);
