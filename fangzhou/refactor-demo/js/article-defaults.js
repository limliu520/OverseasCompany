/* 文章生成设置 · 默认结构（对齐现网 / 文章生成设置 PRD） */
(function (global) {
  var TPL = [
    { id: "T01", name: "事件推进体", on: true, fit: "非成人 / 成人 / 擦边", cond: "题材：吃瓜爆料、情感纠纷、人物八卦、社会猎奇" },
    { id: "T02", name: "事实推进体", on: true, fit: "非成人 / 成人 / 擦边", cond: "" },
    { id: "T03", name: "动作推进体", on: true, fit: "成人 / 擦边", cond: "题材：AV作品、成人影像·写真" },
    { id: "T04", name: "倒叙钩子体", on: true, fit: "非成人 / 成人 / 擦边", cond: "" },
    { id: "T05", name: "时间线实况体", on: false, fit: "非成人 / 成人 / 擦边", cond: "" },
    { id: "T06", name: "人物档案体", on: true, fit: "非成人 / 成人 / 擦边", cond: "要有人名" },
    { id: "T07", name: "前后反差体", on: true, fit: "非成人 / 成人 / 擦边", cond: "要有换装 / 姿势变化" },
    { id: "T08", name: "看点清单体", on: false, fit: "非成人 / 成人 / 擦边", cond: "信息量 ≥ 3" },
    { id: "T09", name: "剧情解说体", on: false, fit: "非成人 / 成人 / 擦边", cond: "要有作品 / 剧情" },
    { id: "T10", name: "疑问导向体", on: false, fit: "非成人 / 成人 / 擦边", cond: "" }
  ];

  function defaultArticle() {
    return {
      templateOn: false,
      customOn: true,
      customText: "",
      minSuggest: 350,
      maxSuggest: 900,
      absMin: 250,
      templates: JSON.parse(JSON.stringify(TPL)),
      presets: ["口吻更口语，少写环境", "压到 400 字以内，保留关键动作"],
      links: [],
      /** 派生：有词条即视为开启，无独立总开关 */
      linkOn: true
    };
  }

  function ensureArticle(project) {
    if (!project.article || !project.article.templates) {
      project.article = defaultArticle();
    }
    var a = project.article;
    if (!Array.isArray(a.links)) a.links = [];
    a.linkOn = a.links.length > 0 ? true : a.linkOn !== false;
    return a;
  }

  /* 可选包：按项目开通。生成进内容中心，审核进审核中心（评论/用户/帖子），不再分站内外站 */
  var OPTIONAL_PACKS = [
    {
      id: "ai_comment",
      name: "AI 评论",
      desc: "生成能力。开通后可配条数、分散小时等；内容中心出现运营入口。待办：须补评论预览（前台地址已删）。"
    },
    {
      id: "comment_review",
      name: "评论审核",
      desc: "审核能力。项目推过来的评论待审（含原 AI 评论审核 / 社区评论 / 外站评论审核）。待办：须补评论预览。"
    },
    { id: "user_review", name: "用户审核", desc: "审核能力。用户资料等待审，按项目开通。" },
    { id: "post_review", name: "帖子审核", desc: "审核能力。社区帖子等待审，按项目开通。" }
  ];

  function defaultWmSlot(extra) {
    var base = {
      enabled: false,
      name: "",
      dataUrl: "",
      ratioH: "0.2",
      ratioV: "0.2",
      invert: false,
      intermittent: false,
      intervalSec: "3"
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        base[k] = extra[k];
      });
    }
    return base;
  }

  function defaultWatermarks() {
    return {
      videoEnabled: false,
      /** 固定 / 四角循环 / 移动可多选同开 */
      videoModes: ["videoFixed"],
      introOutroEnabled: false,
      image: defaultWmSlot({
        position: "top-right"
      }),
      videoFixed: defaultWmSlot({
        positions: ["top-right"]
      }),
      videoCycle: defaultWmSlot({
        positions: ["top-left", "top-right", "bottom-left", "bottom-right"],
        cycleDir: "ltr"
      }),
      motion: defaultWmSlot({
        track: "circular",
        position: "top-right",
        speed: "1"
      }),
      /** 片头/片尾整段拼接（非叠层）；可只配一端或两端 */
      introOutro: {
        enabled: false,
        intro: { name: "", dataUrl: "" },
        outro: { name: "", dataUrl: "" }
      }
    };
  }

  function ensureWatermarks(project) {
    if (!project.watermarks) project.watermarks = defaultWatermarks();
    var w = project.watermarks;
    var defaults = defaultWatermarks();
    ["image", "videoFixed", "videoCycle", "motion"].forEach(function (key) {
      if (!w[key]) w[key] = defaults[key];
      else {
        var d = defaults[key];
        Object.keys(d).forEach(function (fk) {
          if (w[key][fk] == null) w[key][fk] = d[fk];
        });
      }
    });
    if (!w.introOutro) w.introOutro = defaults.introOutro;
    else {
      if (!w.introOutro.intro) w.introOutro.intro = { name: "", dataUrl: "" };
      if (!w.introOutro.outro) w.introOutro.outro = { name: "", dataUrl: "" };
      /* 旧版单文件字段迁到片头 */
      if ((w.introOutro.name || w.introOutro.dataUrl) && !w.introOutro.intro.name && !w.introOutro.intro.dataUrl) {
        w.introOutro.intro.name = w.introOutro.name || "";
        w.introOutro.intro.dataUrl = w.introOutro.dataUrl || "";
      }
    }
    if (w.image.enabled == null) {
      w.image.enabled = !!(w.image.name || w.image.dataUrl);
    }
    var videoKeys = ["videoFixed", "videoCycle", "motion"];
    if (!Array.isArray(w.videoModes) || !w.videoModes.length) {
      if (w.videoMode && videoKeys.indexOf(w.videoMode) !== -1) {
        w.videoModes = [w.videoMode];
      } else {
        w.videoModes = videoKeys.filter(function (k) {
          return w[k] && w[k].enabled;
        });
        if (!w.videoModes.length) w.videoModes = ["videoFixed"];
      }
    }
    w.videoModes = normalizeVideoModes(w.videoModes);
    if (w.videoEnabled == null) {
      w.videoEnabled = videoKeys.some(function (k) {
        return !!(w[k] && (w[k].enabled || w[k].name || w[k].dataUrl));
      });
    }
    /* 片头片尾：有上传文件即生效，无独立总开关 */
    var io = w.introOutro || {};
    w.introOutroEnabled = !!(
      (io.intro && (io.intro.name || io.intro.dataUrl)) ||
      (io.outro && (io.outro.name || io.outro.dataUrl)) ||
      io.name ||
      io.dataUrl
    );
    videoKeys.forEach(function (k) {
      w[k].enabled = !!(w.videoEnabled && w.videoModes.indexOf(k) !== -1);
    });
    w.introOutro.enabled = !!w.introOutroEnabled;
    return w;
  }

  /** 合法：固定 / 四角循环 / 移动任意组合（可 1～3 同开）；空则回落固定 */
  function normalizeVideoModes(modes) {
    var allow = { videoFixed: 1, videoCycle: 1, motion: 1 };
    var list = [];
    (modes || []).forEach(function (m) {
      if (allow[m] && list.indexOf(m) === -1) list.push(m);
    });
    if (!list.length) list = ["videoFixed"];
    return list;
  }

  global.FZArticle = {
    TPL: TPL,
    OPTIONAL_PACKS: OPTIONAL_PACKS,
    defaultArticle: defaultArticle,
    ensureArticle: ensureArticle,
    defaultWatermarks: defaultWatermarks,
    ensureWatermarks: ensureWatermarks,
    normalizeVideoModes: normalizeVideoModes
  };
})(window);
