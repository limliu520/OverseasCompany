/* 文章管理 · Demo 种子与可变数据（瓜站/视频站；短剧不进文章编辑） */
(function (w) {
  var STORE_KEY = "fz_articles_demo_v2";

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

  var DEMO_BODY =
    "<p>据多方消息，事件在短时间内迅速发酵。目击者称现场一度聚集大量围观者，相关人员随后介入处置。</p>" +
    "<p>截至发稿，官方尚未发布最终结论。以下为目前可核实的时间线与相关方表态，供后续改写使用。</p>" +
    "<p><strong>时间线（Demo）</strong></p>" +
    "<p>14:20 有网民在社交平台发布短视频，画面中可见对峙场面。</p>" +
    "<p>15:05 属地通报称已派人到场，现场秩序逐步恢复。</p>" +
    "<p>16:40 相关人士回应称「正在核查细节，稍后发布说明」。目前尚无官方定论。</p>";

  function nowStr() {
    var d = new Date();
    function p(n) {
      return n < 10 ? "0" + n : String(n);
    }
    return (
      d.getFullYear() +
      "-" +
      p(d.getMonth() + 1) +
      "-" +
      p(d.getDate()) +
      " " +
      p(d.getHours()) +
      ":" +
      p(d.getMinutes())
    );
  }

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
      time: opts.time || "2026-10-27 16:00",
      bodyHtml: opts.bodyHtml || DEMO_BODY,
      prevTitle: opts.prevTitle || "",
      prevBodyHtml: opts.prevBodyHtml || "",
      coverTone: opts.coverTone || "",
      coverLabel: opts.coverLabel || "",
      categories: opts.categories || [],
      keywords: opts.keywords || ["Demo关键词甲", "Demo关键词乙"],
      tags: opts.tags || ["标签一", "标签二"],
      region: opts.region || ""
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
      time: "2026-10-27 16:27",
      categories: ["今日吃瓜"]
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
      time: "2026-10-26 21:08",
      prevTitle: "视频站成片 · 首版推送稿",
      prevBodyHtml:
        "<p>首版摘要：事件初步通报后已推送至内容通道，后续人工修订见当前稿。</p>" +
        "<p class=\"muted\">（上一版 Demo）</p>",
      categories: ["社会"]
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

  var articles = SEED.map(function (a) {
    return Object.assign({}, a, {
      categories: (a.categories || []).slice(),
      keywords: (a.keywords || []).slice(),
      tags: (a.tags || []).slice()
    });
  });

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(articles));
    } catch (err) {}
  }

  function hydrate() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) articles = parsed;
    } catch (err) {}
  }
  hydrate();

  function statusMeta(code) {
    return STATUS[code] || { text: code || "未知", cls: "badge-muted" };
  }

  function list() {
    return articles.slice();
  }

  function get(id) {
    var n = Number(id);
    return (
      articles.find(function (a) {
        return a.id === n;
      }) || null
    );
  }

  function update(id, patch) {
    var a = get(id);
    if (!a || !patch) return null;
    Object.keys(patch).forEach(function (k) {
      a[k] = patch[k];
    });
    if (!patch.time) a.time = nowStr();
    persist();
    return a;
  }

  function remove(id) {
    var n = Number(id);
    var i = articles.findIndex(function (a) {
      return a.id === n;
    });
    if (i < 0) return false;
    articles.splice(i, 1);
    persist();
    return true;
  }

  /** 失败重试 → 回到待编辑 */
  function retry(id) {
    var a = get(id);
    if (!a) return null;
    if (a.status !== "failed") return a;
    return update(id, {
      status: "awaiting_edit",
      failReason: "",
      operator: a.operator || "—"
    });
  }

  /**
   * 已推送重新编辑：退回待编辑（对齐现网 reopen）。
   * 再次确认推送将向内容通道新建一篇，原推送稿保留。
   */
  function reopen(id) {
    var a = get(id);
    if (!a) return null;
    if (a.status !== "draft_created") return a;
    return update(id, {
      status: "awaiting_edit",
      failReason: ""
    });
  }

  /** 释放占用 → 回到待处理，清空异常 */
  function release(id) {
    var a = get(id);
    if (!a) return null;
    if (a.status !== "failed") return a;
    return update(id, {
      status: "pending",
      failReason: ""
    });
  }

  function articleProjects(state) {
    var list =
      w.FZStore && typeof FZStore.businessProjects === "function"
        ? FZStore.businessProjects(state || FZStore.read())
        : [];
    return list.filter(function (p) {
      return p.siteType !== "short_drama";
    });
  }

  /** 原素材详情壳用的合成素材 */
  function buildSourceMaterial(article) {
    if (!article || !article.materialId) return null;
    var mid = String(article.materialId);
    var items = (w.FZMatData && FZMatData.ITEMS) || [];
    var hit = null;
    var i;
    for (i = 0; i < items.length; i++) {
      if (
        String(items[i].formalNumber) === mid ||
        String(items[i].id) === mid ||
        String(items[i].formalNumber).indexOf(mid) >= 0
      ) {
        hit = items[i];
        break;
      }
    }
    if (hit) {
      return Object.assign({}, hit, {
        formalNumber: mid,
        title: hit.title || article.title,
        project: article.projectName || hit.project
      });
    }
    var isVideo = article.siteType === "video";
    return {
      id: "art_src_" + mid,
      formalNumber: mid,
      title: article.title || "原素材 #" + mid,
      project: article.projectName || "—",
      channel: "源频道 · 演示",
      collectType: "tg",
      source: "TG · 源频道 · 演示",
      status: "used",
      time: article.time || nowStr(),
      publishTime: article.time || nowStr(),
      views: 1280,
      interact: 64,
      category: isVideo ? "成片" : "资讯",
      mediaType: isVideo ? "视频" : "图文",
      belong: "proj",
      targetChannel: "",
      targetChannels: [],
      dispatchProject: article.projectName || "",
      dispatchProjects: article.projectName ? [article.projectName] : [],
      keywords: ["演示", "转编"],
      summary:
        (article.title || "原素材") +
        "。采集转入后供文章编辑取用；本弹窗仅预览，不提供转编辑等操作。",
      textContent: article.title || "",
      videoCount: isVideo ? 2 : 0,
      imageCount: isVideo ? 2 : 4,
      dispatchLogs: []
    };
  }

  function reset() {
    articles = SEED.map(function (a) {
      return Object.assign({}, a, {
        categories: (a.categories || []).slice(),
        keywords: (a.keywords || []).slice(),
        tags: (a.tags || []).slice()
      });
    });
    try {
      localStorage.removeItem(STORE_KEY);
    } catch (err) {}
  }

  w.FZArticles = {
    STATUS: STATUS,
    DEMO_BODY: DEMO_BODY,
    statusMeta: statusMeta,
    list: list,
    get: get,
    update: update,
    remove: remove,
    retry: retry,
    reopen: reopen,
    release: release,
    articleProjects: articleProjects,
    buildSourceMaterial: buildSourceMaterial,
    nowStr: nowStr,
    reset: reset
  };
})(window);
