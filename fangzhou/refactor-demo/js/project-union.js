/**
 * 项目配置并集（现网 CMS 项目 ∪ 外站「推送站点」字段，按 To-Be 融合口径）
 * 对照边界：新增外站只看「推送站点」；「拉取加水印」不进本并集（后续单独服务）。
 * 对接：方舟规范（OASH）；无对方登录发布账号；无独立外站资产。
 */
(function (global) {
  var GLOBAL_MIN_VIDEO_SEC = 30;
  var GLOBAL_MAX_EPISODES = 50;

  var SITE_TYPES = [
    {
      id: "chigua",
      title: "瓜站（内容站）",
      desc: "图文混排（含吃瓜站）。资讯/爆料类；默认可含视频。走内容编辑或原文直推。"
    },
    {
      id: "video",
      title: "视频站",
      desc: "短视频形态；一稿一个视频。含「AI 文 + 单视频」类（如原 51 短剧形态）。走内容编辑或原文直推。"
    },
    {
      id: "short_drama",
      title: "短剧站",
      desc: "无文章主路径；去水印/加水印 + 分集推送（蜜果 / KiteDrama 形态）。剧集站同此类型。"
    }
  ];

  function tip(text) {
    return (
      '<button type="button" class="field-tip" aria-label="字段说明">' +
      '<span class="field-tip-ico" aria-hidden="true">?</span>' +
      '<span class="field-tip-bubble" role="tooltip">' +
      text +
      "</span></button>"
    );
  }

  function label(text, tipText) {
    return (
      "<label>" +
      text +
      (tipText ? " " + tip(tipText) : "") +
      "</label>"
    );
  }

  function siteTypeLabel(id) {
    var hit = SITE_TYPES.find(function (t) {
      return t.id === id;
    });
    return hit ? hit.title : id || "—";
  }

  function defaultsForType(siteType) {
    var t = siteType || "chigua";
    var short = t === "short_drama";
    return {
      siteType: t,
      siteCode: "",
      apiBaseUrl: "",
      apiPrefix: "/oash/v1",
      appSecret: "",
      channelNotes: "",
      generationMode: short ? "none" : "ai",
      requireVideo: true,
      dewatermarkEnabled: true,
      sliceEnabled: true,
      imageOutputFormat: "png",
      pushAllEpisodes: short,
      episodeTitleFormat: short ? "Episode {n}" : "",
      coverAspect: "",
      partnerCategoryId: "",
      partnerCategoryName: "",
      coverWidth: "720",
      coverHeight: "1280",
      minVideoSeconds: GLOBAL_MIN_VIDEO_SEC,
      maxEpisodes: GLOBAL_MAX_EPISODES,
      autoPush: false,
      autoflow: false,
      hasCollectSource: false,
      webhookUrl: ""
    };
  }

  function applyTypeDefaults(target, siteType) {
    var d = defaultsForType(siteType);
    Object.keys(d).forEach(function (k) {
      if (k === "siteType") target.siteType = d.siteType;
      else if (target[k] == null || target[k] === "") target[k] = d[k];
    });
    if (siteType === "short_drama") {
      target.generationMode = "none";
      target.pushAllEpisodes = true;
    } else {
      target.generationMode = "ai";
    }
    if (siteType !== "short_drama") {
      target.pushAllEpisodes = false;
    }
    return target;
  }

  function normalizeProject(p) {
    if (!p) return p;
    if (!p.siteType || p.siteType === "content") p.siteType = "chigua";
    var d = defaultsForType(p.siteType);
    Object.keys(d).forEach(function (k) {
      if (p[k] == null) p[k] = d[k];
    });
    if (p.autoPush == null && p.autoflow != null) p.autoPush = !!p.autoflow;
    if (p.autoflow == null) p.autoflow = !!p.autoPush;
    if (p.minVideoSeconds == null || p.minVideoSeconds < GLOBAL_MIN_VIDEO_SEC) {
      p.minVideoSeconds = GLOBAL_MIN_VIDEO_SEC;
    }
    if (p.maxEpisodes == null || p.maxEpisodes > GLOBAL_MAX_EPISODES) {
      p.maxEpisodes = GLOBAL_MAX_EPISODES;
    }
    if (p.maxEpisodes < 1) p.maxEpisodes = 1;
    return p;
  }

  function needsArticle(siteType) {
    return siteType !== "short_drama";
  }

  function needsEpisodes(siteType) {
    return siteType === "short_drama";
  }

  function renderSiteTypeCards(selectedId, nameAttr) {
    var sel = selectedId || "chigua";
    var name = nameAttr || "f-type";
    return (
      '<div class="site-type-cards" role="radiogroup" aria-label="站点类型">' +
      SITE_TYPES.map(function (t) {
        var on = sel === t.id;
        return (
          '<button type="button" class="site-type-card' +
          (on ? " is-selected" : "") +
          '" data-site-type="' +
          t.id +
          '" role="radio" aria-checked="' +
          (on ? "true" : "false") +
          '"><span class="site-type-title">' +
          t.title +
          '</span><span class="site-type-desc">' +
          t.desc +
          "</span></button>"
        );
      }).join("") +
      '</div><input type="hidden" id="' +
      name +
      '" value="' +
      sel +
      '" />'
    );
  }

  function renderConnectFields(p, prefix) {
    prefix = prefix || "";
    var id = function (x) {
      return prefix + x;
    };
    return (
      '<div class="field">' +
      label(
        "站点代码",
        "现网外站 code：站点唯一标识。留空创建时自动生成；创建后一般不可改。"
      ) +
      '<input id="' +
      id("site-code") +
      '" value="' +
      esc(p.siteCode) +
      '" placeholder="留空则自动生成 site-xxxxxx" /></div>' +
      '<div class="field">' +
      label(
        "对方收件接口地址",
        "方舟把内容推到对方时填写对方接收根地址（现网外站 base_url）。若主要是对方来调方舟接口，可先留空，以上方方舟签发的凭证为准。"
      ) +
      '<input id="' +
      id("api-base") +
      '" value="' +
      esc(p.apiBaseUrl) +
      '" placeholder="https://api.partner.com（可选，推送到对方时再填）" /></div>' +
      '<div class="field">' +
      label(
        "接口前缀",
        "现网默认 /oash/v1。与接口地址拼成完整推送路径。"
      ) +
      '<input id="' +
      id("api-prefix") +
      '" value="' +
      esc(p.apiPrefix || "/oash/v1") +
      '" /></div>' +
      '<div class="field">' +
      label(
        "签名密钥（可选）",
        "现网 app_secret：配了则请求带签名；不配不签。不是对方登录密码。"
      ) +
      '<input id="' +
      id("api-secret") +
      '" value="' +
      esc(p.appSecret) +
      '" placeholder="对方提供的签名密钥；可不填" autocomplete="off" /></div>' +
      '<div class="field">' +
      label("对接备注", "现网 notes，仅展示与排障用。") +
      '<input id="' +
      id("ch-notes") +
      '" value="' +
      esc(p.channelNotes) +
      '" placeholder="对接方名称、环境等" /></div>' +
      '<p class="hint">本块给开发联调：上方为方舟签发凭证（对方来接我们）；下方为可选的对方收件地址（我们推到对方）。不配对方登录账号；身份用子账号「CMS 标识」。</p>'
    );
  }

  function collectConnect(root, into, prefix) {
    root = root || document;
    prefix = prefix || "";
    into.siteCode = val(root, prefix + "site-code");
    into.apiBaseUrl = val(root, prefix + "api-base");
    into.apiPrefix = val(root, prefix + "api-prefix") || "/oash/v1";
    into.appSecret = val(root, prefix + "api-secret");
    into.channelNotes = val(root, prefix + "ch-notes");
  }

  /**
   * 出稿路径由「分发去向」决定（见 To-Be 泳道图），不在项目上手选 generation_mode。
   * - 去 TG 分发 → 不经文章 AI（直推/转发）
   * - 去内容通道 → 瓜/视频走编辑+AI；短剧不生成文章只推媒体
   * 对方栏目：新规范下不在项目配置打固定 category；发稿或对方侧处理（待技术细化）。
   */
  function renderGenerationFields(p) {
    var short = p.siteType === "short_drama";
    var typeName = siteTypeLabel(p.siteType);
    return (
      '<div class="placeholder-doc" style="text-align:left">' +
      "<strong>出稿怎么走（按流程，不用手选）</strong>" +
      '<ul style="margin:10px 0 0;padding-left:18px;font-size:13px;color:var(--muted);line-height:1.55">' +
      "<li><strong>分发到 TG</strong>：走 TG 分发支路，不经文章 AI（你说的 TG 推 TG / 直推）。</li>" +
      "<li><strong>分发到内容通道</strong>（给业务方）：" +
      (short
        ? "短剧站固定<strong>不生成文章</strong>，主推分集媒体。"
        : "瓜站/视频站走<strong>内容编辑 + AI</strong>（提示词与内链在「文章管理」步），再提交/自动推送。") +
      "</li>" +
      "<li>项目可同时配 TG 采集/路由与内容通道；<strong>每条素材按当次去向</strong>走一条路，不在项目里再选手选「AI / 原文」。</li>" +
      "</ul>" +
      '<p class="hint" style="margin:12px 0 0">当前类型：' +
      typeName +
      "。对方「栏目」不再做项目固定字段；若对接仍要 category，发稿时或规范里另定（待技术）。</p></div>" +
      '<input type="hidden" id="gen-mode" value="' +
      esc(short ? "none" : "ai") +
      '" />'
    );
  }

  function collectGeneration(root, into) {
    if (into.siteType === "short_drama") into.generationMode = "none";
    else into.generationMode = "ai";
    /* 对方分类：新口径不再写入项目配置 */
    into.partnerCategoryId = "";
    into.partnerCategoryName = "";
  }

  /**
   * 图片视频规则：左右分栏。
   * 左=图片规则（输出格式等）；右=视频规则（必须视频 / 切片 / 时长）。
   */
  function renderVideoRulesFields(p, prefix) {
    prefix = prefix || "";
    var id = function (x) {
      return prefix + x;
    };
    var fmt = p.imageOutputFormat || "png";
    return (
      '<div class="media-rules-split">' +
      '<div class="cfg-card media-rules-col">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">图片规则</div>' +
      '<div class="cfg-card-sub">出图与推送封面的格式</div></div>' +
      '<div class="field" style="margin:0">' +
      label(
        "图片输出格式",
        "生成封面 / 配图落盘与推送时的编码格式。与是否加水印无关，常驻生效。"
      ) +
      '<select id="' +
      id("img-fmt") +
      '">' +
      '<option value="png"' +
      (fmt === "png" ? " selected" : "") +
      ">PNG（透明底友好）</option>" +
      '<option value="jpeg"' +
      (fmt === "jpeg" ? " selected" : "") +
      ">JPEG</option>" +
      '<option value="webp"' +
      (fmt === "webp" ? " selected" : "") +
      ">WebP</option>" +
      "</select></div></div>" +
      '<div class="cfg-card media-rules-col">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">视频规则</div>' +
      '<div class="cfg-card-sub">闸门与切片</div></div>' +
      '<label class="check-item"><input type="checkbox" id="' +
      id("req-video") +
      '"' +
      (p.requireVideo ? " checked" : "") +
      " /> 必须含视频 " +
      tip("现网外站 require_video；CMS 视频站发布亦要求有视频。三站默认开。") +
      "</label>" +
      '<label class="check-item"><input type="checkbox" id="' +
      id("slice") +
      '"' +
      (p.sliceEnabled ? " checked" : "") +
      " /> 切片生成 m3u8 " +
      tip("现网外站 slice_enabled；CMS 转编辑常固定提交切片。合并后做开关。") +
      "</label>" +
      '<div class="field" style="margin-top:12px">' +
      label(
        "最短视频时长（秒）",
        "全局下限 " +
          GLOBAL_MIN_VIDEO_SEC +
          " 秒（现网 EXTERNAL_PUBLISH_MIN_VIDEO_SECONDS）。项目可在此之上收紧。"
      ) +
      '<input type="number" id="' +
      id("min-sec") +
      '" min="' +
      GLOBAL_MIN_VIDEO_SEC +
      '" value="' +
      esc(p.minVideoSeconds || GLOBAL_MIN_VIDEO_SEC) +
      '" /></div>' +
      '<p class="hint" style="margin:10px 0 0">「推送全部分集」在「推送规则」；短剧站默认开启。</p>' +
      "</div></div>"
    );
  }

  function collectVideoRules(root, into, prefix) {
    root = root || document;
    prefix = prefix || "";
    into.requireVideo = !!(root.getElementById(prefix + "req-video") || {}).checked;
    into.sliceEnabled = !!(root.getElementById(prefix + "slice") || {}).checked;
    var sec = Number(val(root, prefix + "min-sec"));
    into.minVideoSeconds = isFinite(sec) ? Math.max(GLOBAL_MIN_VIDEO_SEC, sec) : GLOBAL_MIN_VIDEO_SEC;
    var fmtEl = root.getElementById(prefix + "img-fmt");
    var fmt = fmtEl ? String(fmtEl.value || "png") : into.imageOutputFormat || "png";
    if (["png", "jpeg", "webp"].indexOf(fmt) === -1) fmt = "png";
    into.imageOutputFormat = fmt;
  }

  /** @deprecated 用 renderVideoRulesFields；兼容旧调用名 */
  function renderMediaPolicyFields(p, prefix) {
    return renderVideoRulesFields(p, prefix);
  }

  function collectMediaPolicy(root, into, prefix) {
    collectVideoRules(root, into, prefix);
  }

  /** 推送规则：外站「推送方式」+ 短剧分集；接通后生效。 */
  function renderPushRulesFields(p, prefix) {
    prefix = prefix || "";
    var id = function (x) {
      return prefix + x;
    };
    var short = p.siteType === "short_drama";
    var autoOn = !!(p.autoPush || p.autoflow);
    var html =
      '<div class="cfg-card" style="margin-bottom:12px">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">推送方式</div>' +
      '<div class="cfg-card-sub">对齐现网外站「推送方式」· auto_push</div></div>' +
      '<div class="mode-toggles" role="radiogroup" aria-label="推送方式">' +
      '<label class="check-item" style="margin:0"><input type="radio" name="' +
      id("push-mode") +
      '" id="' +
      id("auto-push-on") +
      '" value="auto"' +
      (autoOn ? " checked" : "") +
      " /> 内容就绪后自动推送 " +
      tip("开：加工完成后自动推；对应外站推送方式「自动」。内容通道接通后才生效。") +
      "</label>" +
      '<label class="check-item" style="margin:0"><input type="radio" name="' +
      id("push-mode") +
      '" id="' +
      id("auto-push-off") +
      '" value="manual"' +
      (!autoOn ? " checked" : "") +
      " /> 待人工确认再推 " +
      tip("关：停在待推送，运营点推送/重试；对应外站推送方式「待人工」。待推超 7 天会取消（全局）。") +
      "</label></div>" +
      '<p class="hint" style="margin:10px 0 0">接通前只存意向，不会真推。列表仍可人工「提交」。</p></div>' +
      '<label class="check-item"><input type="checkbox" id="' +
      id("has-collect") +
      '"' +
      (p.hasCollectSource ? " checked" : "") +
      " /> 演示：已有采集源绑定本项目</label>" +
      '<div class="field" style="margin-top:12px">' +
      label("业务方 Webhook URL（可选）", "方舟 → 业务方事件通知；接通后按此推送。") +
      '<input id="' +
      id("hook") +
      '" placeholder="https://partner.example.com/hooks/fangzhou" value="' +
      esc(p.webhookUrl || "") +
      '" /></div>';

    if (short) {
      html +=
        '<div class="cfg-card" style="margin-top:14px">' +
        '<div class="cfg-card-head"><div class="cfg-card-title">推送全部分集</div>' +
        '<div class="cfg-card-sub">短剧站开关 · 瓜/视频站不展示 · 默认开启</div></div>' +
        '<p class="muted" style="margin:0 0 12px;font-size:13px;line-height:1.5">一条稿件带上素材里的全部视频（短剧第 1～N 集）；对方须已支持对接规范 v1.1 的 episodes；时长限制按全部分集合计。最多 ' +
        GLOBAL_MAX_EPISODES +
        " 集。</p>" +
        '<label class="check-item"><input type="checkbox" id="' +
        id("episodes") +
        '"' +
        (p.pushAllEpisodes !== false ? " checked" : "") +
        " /> 启用推送全部分集</label>" +
        '<div class="field">' +
        label(
          "分集标题格式（可选）",
          "现网外站就有：如 Episode {n}；留空用源站分集名，没有则「第N集」。英文站建议填。"
        ) +
        '<input id="' +
        id("ep-fmt") +
        '" value="' +
        esc(p.episodeTitleFormat) +
        '" placeholder="留空用源站名；英文站可填 Episode {n}" /></div>' +
        '<p class="hint" style="margin:0">单稿最多集数：现网是全局上限 ' +
        GLOBAL_MAX_EPISODES +
        " 集（MAX_EPISODES），外站弹窗不按站点配；本 Demo 也不单独做项目字段。</p></div>";
    } else {
      html +=
        '<p class="hint" style="margin-top:14px">当前非短剧站：不展示「推送全部分集」。选「短剧站」后出现该开关，且默认开启。</p>';
    }
    return html;
  }

  function collectPushRules(root, into, prefix) {
    root = root || document;
    prefix = prefix || "";
    var onEl = root.getElementById(prefix + "auto-push-on");
    var legacy = root.getElementById(prefix + "auto-push");
    if (onEl) into.autoPush = !!onEl.checked;
    else if (legacy) into.autoPush = !!legacy.checked;
    else into.autoPush = !!(into.autoPush || into.autoflow);
    into.autoflow = into.autoPush;
    into.hasCollectSource = !!(root.getElementById(prefix + "has-collect") || {}).checked;
    into.webhookUrl = val(root, prefix + "hook");
    var epEl = root.getElementById(prefix + "episodes");
    if (epEl) {
      into.pushAllEpisodes = !!epEl.checked;
      into.episodeTitleFormat = val(root, prefix + "ep-fmt");
      into.maxEpisodes = GLOBAL_MAX_EPISODES;
    } else if (into.siteType !== "short_drama") {
      into.pushAllEpisodes = false;
    }
  }

  function renderAutoPushFields(p, prefix) {
    return renderPushRulesFields(p, prefix);
  }

  function collectAutoPush(root, into, prefix) {
    collectPushRules(root, into, prefix);
  }

  function bindSiteTypeCards(root, onChange) {
    root = root || document;
    /* Element 无 getElementById，须用 querySelector；勿假定 root 是 document */
    root.querySelectorAll("[data-site-type]").forEach(function (card) {
      card.addEventListener("click", function () {
        var v = card.getAttribute("data-site-type");
        var hidden =
          root.querySelector("#f-type, #b-type") ||
          document.getElementById("f-type") ||
          document.getElementById("b-type");
        if (hidden) hidden.value = v;
        root.querySelectorAll("[data-site-type]").forEach(function (c) {
          var on = c.getAttribute("data-site-type") === v;
          c.classList.toggle("is-selected", on);
          c.setAttribute("aria-checked", on ? "true" : "false");
        });
        if (onChange) onChange(v);
      });
    });
  }

  function bindGenModeCards(root) {
    root = root || document;
    root.querySelectorAll("[data-gen-mode]").forEach(function (card) {
      card.addEventListener("click", function () {
        var v = card.getAttribute("data-gen-mode");
        var hidden = root.getElementById("gen-mode");
        if (hidden) hidden.value = v;
        root.querySelectorAll("[data-gen-mode]").forEach(function (c) {
          c.classList.toggle("is-selected", c.getAttribute("data-gen-mode") === v);
        });
      });
    });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function val(root, id) {
    var el = root.getElementById ? root.getElementById(id) : document.getElementById(id);
    return el && el.value != null ? String(el.value).trim() : "";
  }

  function validateConnect(p) {
    var url = (p.apiBaseUrl || "").trim();
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) return "对方收件接口地址需以 http/https 开头";
    return "";
  }

  function validateCover(p) {
    var w = Number(p.coverWidth);
    var h = Number(p.coverHeight);
    if (!w || w < 200 || w > 4096) return "封面宽须在 200–4096（必填）";
    if (!h || h < 200 || h > 4096) return "封面高须在 200–4096（必填）";
    return "";
  }

  function validateShortCategory() {
    /* 对方分类已移出项目配置；占位兼容旧调用 */
    return "";
  }

  global.FZProjectUnion = {
    GLOBAL_MIN_VIDEO_SEC: GLOBAL_MIN_VIDEO_SEC,
    GLOBAL_MAX_EPISODES: GLOBAL_MAX_EPISODES,
    SITE_TYPES: SITE_TYPES,
    siteTypeLabel: siteTypeLabel,
    defaultsForType: defaultsForType,
    applyTypeDefaults: applyTypeDefaults,
    normalizeProject: normalizeProject,
    needsArticle: needsArticle,
    needsEpisodes: needsEpisodes,
    renderSiteTypeCards: renderSiteTypeCards,
    renderConnectFields: renderConnectFields,
    collectConnect: collectConnect,
    renderGenerationFields: renderGenerationFields,
    collectGeneration: collectGeneration,
    renderVideoRulesFields: renderVideoRulesFields,
    collectVideoRules: collectVideoRules,
    renderPushRulesFields: renderPushRulesFields,
    collectPushRules: collectPushRules,
    renderMediaPolicyFields: renderMediaPolicyFields,
    collectMediaPolicy: collectMediaPolicy,
    renderAutoPushFields: renderAutoPushFields,
    collectAutoPush: collectAutoPush,
    bindSiteTypeCards: bindSiteTypeCards,
    bindGenModeCards: bindGenModeCards,
    validateConnect: validateConnect,
    validateCover: validateCover,
    validateShortCategory: validateShortCategory
  };
})(window);
