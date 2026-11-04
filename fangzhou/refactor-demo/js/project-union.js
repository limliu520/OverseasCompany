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
      desc: "图文混排（含吃瓜站）。资讯/爆料类；默认可含视频。走内容编辑或原文直推。演示项目名：每日大赛、51 吃瓜。"
    },
    {
      id: "video",
      title: "视频站",
      desc: "短视频形态；一稿一个视频。走内容编辑或原文直推。演示项目名：91 网黄、51 原创。"
    },
    {
      id: "short_drama",
      title: "短剧站",
      desc: "无文章主路径；去水印/加水印 + 分集推送（蜜果 / KiteDrama 形态）。演示项目名：51 短剧、51 短视频。"
    }
  ];

  /** 各站点类型可用演示项目名（全站统一） */
  var DEMO_PROJECT_NAMES = {
    chigua: ["每日大赛", "51 吃瓜"],
    video: ["91 网黄", "51 原创"],
    short_drama: ["51 短剧", "51 短视频"]
  };

  function demoProjectName(siteType, index) {
    var list = DEMO_PROJECT_NAMES[siteType] || DEMO_PROJECT_NAMES.chigua;
    var i = Number(index) || 0;
    return list[((i % list.length) + list.length) % list.length];
  }

  function tip(text) {
    var body =
      global.FZShell && global.FZShell.tipHtml
        ? global.FZShell.tipHtml(text)
        : String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/"/g, "&quot;")
            .replace(/；\s*/g, "；<br>")
            .replace(/;\s*/g, ";<br>");
    return (
      '<button type="button" class="field-tip" aria-label="字段说明">' +
      '<span class="field-tip-ico" aria-hidden="true">?</span>' +
      '<span class="field-tip-bubble" role="tooltip">' +
      body +
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
      /* 文章封面拼图：1 单 / 2 二 / 3 三，现网默认 3 */
      coverPanelCount: 3,
      minVideoSeconds: GLOBAL_MIN_VIDEO_SEC,
      maxEpisodes: GLOBAL_MAX_EPISODES,
      autoToEdit: false,
      /* RF-04：新建默认推送 = 手动 */
      autoPush: false,
      autoflow: false,
      videoCoverStrategy: "article",
      /* 去源水印默认：图 / 视频总开关都开；move/fixed 与 video 对齐（兼容旧字段） */
      dewatermarkImage: "remove",
      dewatermarkVideo: "remove",
      dewatermarkMove: "remove",
      dewatermarkFixed: "remove",
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
    /* 两段闸门：autoToEdit=素材→编辑；autoPush=编辑→业务方。旧数据曾混在 autoflow/autoPush */
    if (p.autoToEdit == null) {
      p.autoToEdit = !!(p.autoflow || p.autoPush);
    }
    if (p.autoPush == null && p.autoflow != null) p.autoPush = !!p.autoflow;
    if (p.autoPush == null) p.autoPush = false;
    p.autoflow = !!p.autoToEdit;
    if (!p.videoCoverStrategy) p.videoCoverStrategy = "article";
    var panelN = Number(p.coverPanelCount);
    p.coverPanelCount =
      panelN === 1 || panelN === 2 || panelN === 3 ? panelN : 3;
    if (!p.dewatermarkVideo) {
      if (p.dewatermarkMove === "keep" && p.dewatermarkFixed === "keep") {
        p.dewatermarkVideo = "keep";
      } else if (p.dewatermarkEnabled === false) {
        p.dewatermarkVideo = "keep";
      } else {
        p.dewatermarkVideo = "remove";
      }
    }
    if (!p.dewatermarkImage) {
      p.dewatermarkImage =
        p.dewatermarkEnabled === false ? "keep" : "remove";
    }
    /* 本期视频为总开关：同步写回 move/fixed，避免旧逻辑读到分叉 */
    p.dewatermarkMove = p.dewatermarkVideo;
    p.dewatermarkFixed = p.dewatermarkVideo;
    p.dewatermarkEnabled =
      p.dewatermarkImage !== "keep" || p.dewatermarkVideo !== "keep";
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
        "对接用的站点唯一标识。留空创建时自动生成；创建后一般不要改。"
      ) +
      '<input id="' +
      id("site-code") +
      '" value="' +
      esc(p.siteCode) +
      '" placeholder="留空则自动生成 site-xxxxxx" /></div>' +
      '<div class="field">' +
      label(
        "对方收件接口地址",
        "方舟把「内容正文/媒体」推到对方业务系统时填对方接收根地址。若主要是对方来调方舟，可先留空。"
      ) +
      '<input id="' +
      id("api-base") +
      '" value="' +
      esc(p.apiBaseUrl) +
      '" placeholder="https://api.partner.com（推送到对方时再填）" /></div>' +
      '<div class="field">' +
      label("接口前缀", "与收件地址拼成完整推送路径，默认 /oash/v1。") +
      '<input id="' +
      id("api-prefix") +
      '" value="' +
      esc(p.apiPrefix || "/oash/v1") +
      '" /></div>' +
      '<div class="field">' +
      label(
        "签名密钥（可选）",
        "配了则推送请求带签名；不配不签。不是对方登录密码。"
      ) +
      '<input id="' +
      id("api-secret") +
      '" value="' +
      esc(p.appSecret) +
      '" placeholder="对方提供的签名密钥；可不填" autocomplete="off" /></div>' +
      '<div class="field">' +
      label(
        "事件通知地址（Webhook，可选）",
        "状态变更等事件通知对方；与上面「收件接口」不同：收件接口推内容，这里推事件。未接通前不生效。"
      ) +
      '<input id="' +
      id("hook") +
      '" placeholder="https://partner.example.com/hooks/fangzhou" value="' +
      esc(p.webhookUrl || "") +
      '" /></div>' +
      '<div class="field">' +
      label("对接备注", "对接方名称、环境等，仅展示与排障。") +
      '<input id="' +
      id("ch-notes") +
      '" value="' +
      esc(p.channelNotes) +
      '" placeholder="对接方名称、环境等" /></div>' +
      '<p class="hint">本块给开发联调：凭证给对方来接方舟；收件接口 / 事件通知按需填。不配对方登录账号；推送身份用子账号「CMS 标识」。</p>'
    );
  }

  function collectConnect(root, into, prefix) {
    root = root || document;
    prefix = prefix || "";
    into.siteCode = val(root, prefix + "site-code");
    into.apiBaseUrl = val(root, prefix + "api-base");
    into.apiPrefix = val(root, prefix + "api-prefix") || "/oash/v1";
    into.appSecret = val(root, prefix + "api-secret");
    into.webhookUrl = val(root, prefix + "hook");
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
   * 内容生成规则：左右分栏。
   * 左=图片生成规则；右=视频生成规则。推送门槛归「推送规则」。
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
      '<div class="cfg-card-head"><div class="cfg-card-title">图片生成规则</div>' +
      '<div class="cfg-card-sub">出图与推送封面的编码</div></div>' +
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
      '<div class="cfg-card-head"><div class="cfg-card-title">视频生成规则</div>' +
      '<div class="cfg-card-sub">推送前如何交付播放地址</div></div>' +
      '<label class="check-item"><input type="checkbox" id="' +
      id("slice") +
      '"' +
      (p.sliceEnabled ? " checked" : "") +
      " /> 生成可边下边播的播放地址 " +
      tip(
        "开启后推送前把视频切成适合网页/App 边下边播的格式（技术上叫 m3u8）。切片服务没配好、超时或失败时，仍只推完整视频文件，不会卡死整条推送。对方站若不需要自适应播放，可关掉。"
      ) +
      "</label>" +
      '<p class="hint" style="margin:10px 0 0">「必须含视频」「最短时长」等出站门槛在「推送规则」。</p>' +
      "</div></div>"
    );
  }

  function collectVideoRules(root, into, prefix) {
    root = root || document;
    prefix = prefix || "";
    into.sliceEnabled = !!(root.getElementById(prefix + "slice") || {}).checked;
    if (into.minVideoSeconds == null || into.minVideoSeconds < GLOBAL_MIN_VIDEO_SEC) {
      into.minVideoSeconds = GLOBAL_MIN_VIDEO_SEC;
    }
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

  /** 推送规则：两段闸门（素材→编辑 / 编辑→业务方）+ 短剧分集；技术地址在「开发对接」。 */
  function renderPushRulesFields(p, prefix) {
    prefix = prefix || "";
    var id = function (x) {
      return prefix + x;
    };
    var short = p.siteType === "short_drama";
    var toEditOn = !!p.autoToEdit;
    var pushOn = !!p.autoPush;
    var html =
      '<div class="cfg-card" style="margin-bottom:12px">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">① 素材进编辑</div>' +
      '<div class="cfg-card-sub">采集加工完成之后</div></div>' +
      (global.FZMediaConfig && FZMediaConfig.renderSeg
        ? FZMediaConfig.renderSeg(
            id("to-edit-mode"),
            [
              { value: "auto", label: "自动转入编辑" },
              { value: "manual", label: "人工转编辑" }
            ],
            toEditOn ? "auto" : "manual",
            "素材进编辑"
          )
        : "") +
      '<p class="hint" style="margin:10px 0 0">自动：素材可用后进本项目编辑。人工：停在「可使用」，在素材管理点「转编辑」。</p></div>' +
      '<div class="cfg-card" style="margin-bottom:12px">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">② 推送给业务方</div>' +
      '<div class="cfg-card-sub">编辑侧内容就绪之后 · 通道接通前只记意向</div></div>' +
      (global.FZMediaConfig && FZMediaConfig.renderSeg
        ? FZMediaConfig.renderSeg(
            id("push-mode"),
            [
              { value: "auto", label: "内容就绪后自动推送" },
              { value: "manual", label: "待人工确认再推" }
            ],
            pushOn ? "auto" : "manual",
            "推送给业务方"
          )
        : "") +
      '<p class="hint" style="margin:10px 0 0">新建项目默认「待人工确认再推」（RF-04）；两段可分开配。收件/事件通知在「开发对接」。</p></div>' +
      '<div class="cfg-card" style="margin-bottom:12px">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">③ 出站媒体门槛</div>' +
      '<div class="cfg-card-sub">推给业务方时校验 · 不管采集</div></div>' +
      '<label class="check-item"><input type="checkbox" id="' +
      id("req-video") +
      '"' +
      (p.requireVideo ? " checked" : "") +
      " /> 必须含视频才可推送 " +
      tip(
        "开着时无视频不推（自动推、人工点推都一样）。关掉后纯图文也可以推。采集进池不看这项。"
      ) +
      "</label>" +
      '<div class="field" style="margin-top:12px">' +
      '<label>推送最短时长（只读） ' +
      tip(
        "单视频看片长；开了「推送全部分集」则各集时长加总。短于全局下限则不推。现网是环境全局值，项目侧不单独改。"
      ) +
      "</label>" +
      '<p class="hint" style="margin:6px 0 0">当前全局下限 ' +
      GLOBAL_MIN_VIDEO_SEC +
      " 秒。过短仍可采进池、可转编辑，只是推不出去。</p></div></div>";

    if (short) {
      html +=
        '<div class="cfg-card" style="margin-top:14px">' +
        '<div class="cfg-card-head"><div class="cfg-card-title">推送全部分集</div>' +
        '<div class="cfg-card-sub">仅短剧站 · 默认开启</div></div>' +
        '<p class="muted" style="margin:0 0 12px;font-size:13px;line-height:1.5">一条稿件带上素材里的全部视频（第 1～N 集）。时长按全部分集合计，单稿最多 ' +
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
          "例如 Episode {n}。留空则用源站分集名；没有则显示「第 N 集」。面向英文站时可填。"
        ) +
        '<input id="' +
        id("ep-fmt") +
        '" value="' +
        esc(p.episodeTitleFormat) +
        '" placeholder="留空用源站名；可填 Episode {n}" /></div></div>';
    } else {
      html +=
        '<p class="hint" style="margin-top:14px">当前不是短剧站，不展示「推送全部分集」。项目类型改为「短剧站」后会出现该开关（默认开启）。</p>';
    }
    return html;
  }

  function collectPushRules(root, into, prefix) {
    root = root || document;
    prefix = prefix || "";
    var readSeg =
      global.FZMediaConfig && FZMediaConfig.readSeg
        ? function (name) {
            return FZMediaConfig.readSeg(root, name);
          }
        : function () {
            return null;
          };
    var toEditSeg = readSeg(prefix + "to-edit-mode");
    if (toEditSeg != null) into.autoToEdit = toEditSeg === "auto";
    else {
      var toEditOn = root.getElementById(prefix + "auto-to-edit-on");
      var toEditLegacy = root.getElementById(prefix + "auto-to-edit");
      if (toEditOn) into.autoToEdit = !!toEditOn.checked;
      else if (toEditLegacy) into.autoToEdit = !!toEditLegacy.checked;
      else if (into.autoToEdit == null) into.autoToEdit = !!(into.autoflow || into.autoPush);
    }

    var pushSeg = readSeg(prefix + "push-mode");
    if (pushSeg != null) into.autoPush = pushSeg === "auto";
    else {
      var onEl = root.getElementById(prefix + "auto-push-on");
      var legacy = root.getElementById(prefix + "auto-push");
      if (onEl) into.autoPush = !!onEl.checked;
      else if (legacy) into.autoPush = !!legacy.checked;
      else if (into.autoPush == null) into.autoPush = false;
    }

    into.autoflow = !!into.autoToEdit;
    var reqEl = root.getElementById(prefix + "req-video");
    if (reqEl) into.requireVideo = !!reqEl.checked;
    if (into.minVideoSeconds == null || into.minVideoSeconds < GLOBAL_MIN_VIDEO_SEC) {
      into.minVideoSeconds = GLOBAL_MIN_VIDEO_SEC;
    }
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
    DEMO_PROJECT_NAMES: DEMO_PROJECT_NAMES,
    demoProjectName: demoProjectName,
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
