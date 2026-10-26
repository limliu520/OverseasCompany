/* 封面 / 水印 / 文章模板 · setup 与 project-edit 共用渲染与采集 */
(function (global) {
  var POS = [
    ["top-left", "左上", "tl"],
    ["top-right", "右上", "tr"],
    ["bottom-left", "左下", "bl"],
    ["bottom-right", "右下", "br"]
  ];

  var IMAGE_WM = {
    key: "image",
    title: "图片水印",
    accept: "image/png",
    multiPos: false,
    tip: "叠加在封面图、正文配图上。PNG 透明底效果更好。"
  };

  /** 视频水印类型：固定 / 四角循环 / 移动可多选同开 */
  var VIDEO_WM_MODES = [
    {
      key: "videoFixed",
      title: "固定水印",
      accept: "video/mp4,video/quicktime,image/png",
      multiPos: true,
      tip: "文案类视频成片的固定角标；可多选位置。"
    },
    {
      key: "videoCycle",
      title: "四角循环",
      accept: "video/mp4,video/quicktime,image/png",
      multiPos: true,
      tip: "按顺序在四角轮换，降低遮挡同一区域过久。"
    },
    {
      key: "motion",
      title: "移动水印",
      accept: "video/mp4,video/quicktime,image/png",
      multiPos: false,
      tip: "沿轨迹移动的水印，适合长视频防裁切。"
    }
  ];

  var VIDEO_MODE_KEYS = VIDEO_WM_MODES.map(function (d) {
    return d.key;
  });
  var WM_DEFS = [IMAGE_WM].concat(VIDEO_WM_MODES);

  function normalizeVideoModes(modes) {
    if (global.FZArticle && FZArticle.normalizeVideoModes) {
      return FZArticle.normalizeVideoModes(modes);
    }
    return modes && modes.length ? modes.slice() : ["videoFixed"];
  }

  function resolveVideoModes(watermarks) {
    if (Array.isArray(watermarks.videoModes) && watermarks.videoModes.length) {
      return normalizeVideoModes(watermarks.videoModes);
    }
    if (watermarks.videoMode && VIDEO_MODE_KEYS.indexOf(watermarks.videoMode) !== -1) {
      return [watermarks.videoMode];
    }
    var hit = VIDEO_MODE_KEYS.filter(function (k) {
      return watermarks[k] && watermarks[k].enabled;
    });
    return normalizeVideoModes(hit.length ? hit : ["videoFixed"]);
  }

  function isVideoEnabled(watermarks) {
    if (watermarks.videoEnabled != null) return !!watermarks.videoEnabled;
    return VIDEO_MODE_KEYS.some(function (k) {
      return !!(watermarks[k] && watermarks[k].enabled);
    });
  }

  function isIntroOutroEnabled(watermarks) {
    if (watermarks.introOutroEnabled != null) return !!watermarks.introOutroEnabled;
    return !!(watermarks.introOutro && watermarks.introOutro.enabled);
  }

  function fieldTip(text) {
    return (
      '<button type="button" class="field-tip" aria-label="字段说明">' +
      '<span class="field-tip-ico" aria-hidden="true">?</span>' +
      '<span class="field-tip-bubble" role="tooltip">' +
      text +
      "</span></button>"
    );
  }

  function posRadios(name, selected) {
    return (
      '<div class="pos-group" role="radiogroup" aria-label="水印位置">' +
      POS.map(function (pair) {
        return (
          '<label data-corner="' +
          pair[2] +
          '"><input type="radio" name="' +
          name +
          '" value="' +
          pair[0] +
          '"' +
          (selected === pair[0] ? " checked" : "") +
          " /> " +
          pair[1] +
          "</label>"
        );
      }).join("") +
      "</div>"
    );
  }

  function posChecks(name, selected) {
    selected = selected || [];
    return (
      '<div class="pos-group" role="group" aria-label="水印位置（可多选）">' +
      POS.map(function (pair) {
        return (
          '<label data-corner="' +
          pair[2] +
          '"><input type="checkbox" data-pos-group="' +
          name +
          '" value="' +
          pair[0] +
          '"' +
          (selected.indexOf(pair[0]) !== -1 ? " checked" : "") +
          " /> " +
          pair[1] +
          "</label>"
        );
      }).join("") +
      "</div>"
    );
  }

  function wmExtra(key, w) {
    if (key === "videoCycle") {
      return (
        '<div class="field"><label>循环方向 ' +
        fieldTip("决定四角切换的先后顺序。") +
        "</label><select data-cycle-dir>" +
        '<option value="ltr"' +
        (w.cycleDir === "ltr" ? " selected" : "") +
        ">从左到右</option>" +
        '<option value="rtl"' +
        (w.cycleDir === "rtl" ? " selected" : "") +
        ">从右到左</option></select></div>"
      );
    }
    if (key === "motion") {
      var labels = { circular: "环形运动", diagonal: "对角", random: "随机" };
      return (
        '<div class="field"><label>移动轨迹 ' +
        fieldTip("成片里水印的运动路径。") +
        "</label><select data-motion-track>" +
        ["circular", "diagonal", "random"]
          .map(function (t) {
            return (
              '<option value="' +
              t +
              '"' +
              (w.track === t ? " selected" : "") +
              ">" +
              labels[t] +
              "</option>"
            );
          })
          .join("") +
        "</select></div>"
      );
    }
    return "";
  }

  function wmMetaText(hasFile, enabled, fileName) {
    if (!enabled) return "已关闭 · 不叠加";
    if (hasFile) return "已启用 · " + (fileName || "已上传");
    return "已启用 · 尚未上传素材（暂不叠加）";
  }

  function wmConfigFields(def, w) {
    var accept = def.accept;
    var hasFile = !!(w.name || w.dataUrl);
    var preview = w.dataUrl
      ? accept.indexOf("video") !== -1 && String(w.dataUrl).indexOf("video") !== -1
        ? '<video src="' + w.dataUrl + '" muted></video>'
        : '<img src="' + w.dataUrl + '" alt="" />'
      : "未上传";
    var uploadLabel =
      accept.indexOf("image") !== -1 && accept.indexOf("video") === -1
        ? hasFile
          ? "更换图片"
          : "上传图片"
        : hasFile
          ? "更换素材"
          : "上传素材";
    return (
      '<p class="hint" style="margin:0 0 12px">' +
      def.tip +
      "</p>" +
      '<div class="wm-acc-grid">' +
      '<div class="wm-preview" id="prev-' +
      def.key +
      '">' +
      preview +
      "</div>" +
      '<div class="wm-acc-fields">' +
      '<div class="wm-acc-actions">' +
      '<label class="btn">' +
      uploadLabel +
      '<input type="file" accept="' +
      accept +
      '" data-upload="' +
      def.key +
      '" hidden /></label>' +
      (hasFile
        ? '<button type="button" class="btn btn-ghost" data-remove-wm="' +
          def.key +
          '">清除素材</button>'
        : "") +
      "</div>" +
      (hasFile
        ? '<p class="hint" style="margin:0 0 10px">「清除素材」只删已上传文件，不等于关闭开关。</p>' +
          (w.name
            ? '<div class="muted" style="font-size:12px;margin-bottom:8px">已加载：' +
              w.name +
              "</div>"
            : "")
        : "") +
      '<div class="field" style="margin:0 0 8px"><label>位置' +
      (def.multiPos ? "（多选）" : "") +
      " " +
      fieldTip(
        def.multiPos
          ? "可勾选多个角；布局与画面四角一致。"
          : "水印锚点；布局与画面四角一致。"
      ) +
      "</label>" +
      (def.multiPos
        ? posChecks(def.key, w.positions)
        : posRadios("pos-" + def.key, w.position || "top-right")) +
      "</div>" +
      wmExtra(def.key, w) +
      wmFxFields(def.key, w) +
      '<div class="field" style="margin:0"><label>宽度比例（0.02~1，留空走默认） ' +
      fieldTip("相对画面短边的宽度占比；横屏 / 竖屏可分开。") +
      "</label>" +
      '<div class="ratio-row">' +
      '<div class="field"><label>横屏</label><input data-ratio="' +
      def.key +
      '-h" value="' +
      (w.ratioH || "") +
      '" placeholder="如 0.2" /></div>' +
      '<div class="field"><label>竖屏</label><input data-ratio="' +
      def.key +
      '-v" value="' +
      (w.ratioV || "") +
      '" placeholder="如 0.2" /></div></div></div>' +
      "</div></div>"
    );
  }

  /** 片头/片尾拼接：上传完整视频，拼在原片前或后；无位置、无时长裁切、无宽度比例 */
  function renderIntroOutroFields(io) {
    io = io || {};
    var intro = io.intro || {};
    var outro = io.outro || {};
    function clipCard(slot, title, tip, clip) {
      var hasFile = !!(clip.name || clip.dataUrl);
      var preview = clip.dataUrl
        ? '<video src="' + clip.dataUrl + '" muted></video>'
        : "未上传";
      return (
        '<div class="cfg-card" style="margin:0;box-shadow:none" data-io-slot="' +
        slot +
        '">' +
        '<div class="cfg-card-head"><div class="cfg-card-title">' +
        title +
        "</div>" +
        '<div class="cfg-card-sub">' +
        tip +
        "</div></div>" +
        '<div class="wm-acc-grid">' +
        '<div class="wm-preview" id="prev-io-' +
        slot +
        '">' +
        preview +
        "</div>" +
        '<div class="wm-acc-fields">' +
        '<div class="wm-acc-actions">' +
        '<label class="btn">' +
        (hasFile ? "更换视频" : "上传视频") +
        '<input type="file" accept="video/mp4,video/quicktime" data-upload="introOutro:' +
        slot +
        '" hidden /></label>' +
        (hasFile
          ? '<button type="button" class="btn btn-ghost" data-remove-wm="introOutro:' +
            slot +
            '">清除</button>'
          : "") +
        "</div>" +
        (hasFile && clip.name
          ? '<div class="muted" style="font-size:12px;margin-top:8px">已加载：' +
            clip.name +
            "</div>"
          : "") +
        "</div></div></div>"
      );
    }
    return (
      '<p class="hint" style="margin:0 0 12px">不是叠层水印：上传完整视频片段，整段拼在原视频前面（片头）和/或后面（片尾）。可只配一端，也可两段都配；播完上传文件的完整时长，无角标位置、无宽度比例、无另设秒数。</p>' +
      '<div class="media-rules-split">' +
      clipCard("intro", "片头", "拼在原视频之前", intro) +
      clipCard("outro", "片尾", "拼在原视频之后", outro) +
      "</div>"
    );
  }

  /** 本轮新能力：反转 / 间歇 / 速度（仅视频叠层水印） */
  function wmFxFields(key, w) {
    var isVideoType = VIDEO_MODE_KEYS.indexOf(key) !== -1;
    if (!isVideoType) return "";
    var html = "";
    html +=
      '<label class="check-item"><input type="checkbox" data-wm-invert="' +
      key +
      '"' +
      (w.invert ? " checked" : "") +
      " /> 水印反转 " +
      fieldTip("水平镜像水印素材（本轮新能力）。") +
      "</label>";
    html +=
      '<label class="check-item"><input type="checkbox" data-wm-intermittent="' +
      key +
      '"' +
      (w.intermittent ? " checked" : "") +
      " /> 水印间歇展示 " +
      fieldTip("一会儿出现、一会儿隐藏，按下方间隔循环（本轮新能力）。") +
      "</label>";
    html +=
      '<div class="field" data-wm-interval-wrap="' +
      key +
      '"' +
      (w.intermittent ? "" : " hidden") +
      "><label>间歇间隔（秒） " +
      fieldTip("显隐一轮的大致间隔；仅开启「间歇展示」时生效。") +
      '</label><input type="number" min="0.5" step="0.5" data-wm-interval="' +
      key +
      '" value="' +
      (w.intervalSec || "3") +
      '" /></div>';
    if (key === "motion") {
      html +=
        '<div class="field"><label>移动速度 ' +
        fieldTip("相对默认轨迹速度的倍率，1 为正常（本轮新能力）。") +
        '</label><input type="number" min="0.2" max="5" step="0.1" data-wm-speed="' +
        key +
        '" value="' +
        (w.speed || "1") +
        '" /></div>';
    }
    return html;
  }

  /** 说明文案在左、保存在右上（避免滚到底才看见） */
  function paneTopBar(lead, opts) {
    opts = opts || {};
    if (!opts.saveId) {
      return '<p class="muted media-lead">' + lead + "</p>";
    }
    return (
      '<div class="tab-pane-toolbar">' +
      '<p class="muted media-lead" style="margin:0">' +
      lead +
      "</p>" +
      '<button type="button" class="btn btn-primary tab-pane-save" id="' +
      opts.saveId +
      '">' +
      (opts.saveLabel || "保存") +
      "</button></div>"
    );
  }

  function wmAddFlowLabel(imgOn, videoOn) {
    var bits = [];
    if (imgOn) bits.push("图片水印");
    if (videoOn) bits.push("视频水印");
    if (!bits.length) return "当前：图片 / 视频水印均未启用（可都关）";
    return "当前：已启用 " + bits.join(" + ") + "（可同开）";
  }

  /**
   * 添加水印：图片水印 / 视频水印（叠层）。片头片尾已独立，不在此。
   * 视频水印内：固定 / 四角循环 / 移动可多选同开。
   */
  function renderAddWmSection(watermarks, opts) {
    opts = opts || {};
    var img = watermarks.image || {};
    var imgOn = !!img.enabled;
    var videoOn = isVideoEnabled(watermarks);
    var modes = resolveVideoModes(watermarks);
    var view = opts.wmAddView === "video" ? "video" : "image";
    if (view === "image" && !imgOn && videoOn) view = "video";
    if (view === "video" && !videoOn && imgOn) view = "image";

    var cols = VIDEO_WM_MODES.map(function (d) {
      var on = modes.indexOf(d.key) !== -1;
      return (
        '<div class="wm-video-col' +
        (on ? "" : " is-off") +
        '" data-wm="' +
        d.key +
        '" data-video-pane="' +
        d.key +
        '">' +
        '<label class="wm-video-col-head">' +
        '<input type="checkbox" data-wm-video-mode="' +
        d.key +
        '"' +
        (on ? " checked" : "") +
        " />" +
        "<div><strong>" +
        d.title +
        '</strong><span class="art-mode-tag">' +
        d.tip +
        "</span></div></label>" +
        '<div class="wm-video-col-body">' +
        wmConfigFields(d, watermarks[d.key] || {}) +
        "</div></div>"
      );
    }).join("");

    return (
      '<div class="cfg-card wm-add-card">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">添加水印</div>' +
      '<div class="cfg-card-sub">叠层能力 · 图片水印 / 视频水印可同开；片头片尾请到独立页配置</div></div>' +
      '<p class="muted" style="margin:0 0 12px;font-size:13px;line-height:1.5">开关开才展开下方配置。视频水印三种类型左中右并排，可同开。</p>' +
      '<input type="hidden" id="wm-add-view" value="' +
      view +
      '" />' +
      '<div class="art-modes">' +
      '<button type="button" class="art-mode-sub' +
      (view === "image" ? " is-on" : "") +
      '" data-wm-add-sub="image">' +
      '<div class="art-mode-head"><div><strong>图片水印</strong>' +
      '<span class="art-mode-tag">封面图、正文配图叠加。</span></div>' +
      '<span class="switch' +
      (imgOn ? " on" : "") +
      '" id="sw-wm-image" role="switch" aria-checked="' +
      (imgOn ? "true" : "false") +
      '" aria-label="图片水印开关"><i></i></span></div></button>' +
      '<button type="button" class="art-mode-sub' +
      (view === "video" ? " is-on" : "") +
      '" data-wm-add-sub="video">' +
      '<div class="art-mode-head"><div><strong>视频水印</strong>' +
      '<span class="art-mode-tag">固定 / 四角循环 / 移动 · 左中右三列。</span></div>' +
      '<span class="switch' +
      (videoOn ? " on" : "") +
      '" id="sw-wm-video" role="switch" aria-checked="' +
      (videoOn ? "true" : "false") +
      '" aria-label="视频水印开关"><i></i></span></div></button></div>' +
      '<div class="art-flow" id="wm-add-flow">' +
      wmAddFlowLabel(imgOn, videoOn) +
      "</div>" +
      '<div class="cfg-card" id="wm-image-block" data-wm="image"' +
      (view === "image" && imgOn ? "" : " hidden") +
      ">" +
      '<div class="cfg-card-head"><div class="cfg-card-title">图片水印配置</div>' +
      '<div class="cfg-card-sub">开关关则不叠加、不展开</div></div>' +
      wmConfigFields(IMAGE_WM, img) +
      "</div>" +
      '<div class="cfg-card" id="wm-video-block"' +
      (view === "video" && videoOn ? "" : " hidden") +
      ">" +
      '<div class="cfg-card-head"><div class="cfg-card-title">视频水印配置</div>' +
      '<div class="cfg-card-sub">左中右三列并排；勾选启用，至少保留一种</div></div>' +
      '<div class="wm-video-cols" role="group" aria-label="视频水印类型">' +
      cols +
      "</div></div></div>"
    );
  }

  /**
   * 水印管理：上下同级两卡——上「去源水印」，下「添加水印」。
   * @param opts {{ lead?: string, allowDefault?: boolean, showSave?: boolean, dewatermarkEnabled?: boolean, showDewatermark?: boolean, wmAddView?: string }}
   */
  function renderWatermarkPanel(watermarks, opts) {
    opts = opts || {};
    var showDewm = opts.showDewatermark !== false;
    var dewmOn = opts.dewatermarkEnabled !== false;
    var lead =
      opts.lead ||
      (showDewm
        ? "上下同级两块：去源水印、添加水印。片头片尾不在本页。"
        : "配置本项目叠加水印。");
    var removePane =
      '<div class="cfg-card wm-dewm-card">' +
      '<div class="wm-dewm-row">' +
      '<div class="wm-dewm-copy"><div class="cfg-card-title">去源水印</div>' +
      '<div class="cfg-card-sub">抹掉素材上原站留下的水印 · 与下方添加无关 ' +
      fieldTip("现网外站 dewatermark_enabled。关=保留原站水印；开=推送前尽量抹掉。") +
      "</div></div>" +
      '<span class="switch' +
      (dewmOn ? " on" : "") +
      '" id="de-wm" role="switch" aria-checked="' +
      (dewmOn ? "true" : "false") +
      '" aria-label="去源水印"><i></i></span></div></div>';
    var addPane =
      renderAddWmSection(watermarks, { wmAddView: opts.wmAddView }) +
      (opts.allowDefault
        ? '<div class="media-sec-actions">' +
          '<button type="button" class="btn btn-ghost" id="btn-wm-default">使用默认水印配置，稍后在项目详情改</button>' +
          "</div>"
        : "");
    return (
      '<div class="media-mod media-mod--wide" data-media-wm>' +
      paneTopBar(lead, opts.showSave ? { saveId: "btn-save-wm", saveLabel: "保存水印配置" } : null) +
      (showDewm ? removePane : "") +
      addPane +
      "</div>"
    );
  }

  /** 片头和片尾：整段拼接，独立于水印 */
  function renderIntroOutroPanel(watermarks, opts) {
    opts = opts || {};
    var io = (watermarks && watermarks.introOutro) || {};
    var lead =
      opts.lead ||
      "整段视频拼在原片前面（片头）和/或后面（片尾）。不是叠层水印；不填则不拼接。";
    return (
      '<div class="media-mod media-mod--wide" data-media-io>' +
      paneTopBar(lead, opts.showSave ? { saveId: "btn-save-io", saveLabel: "保存片头片尾" } : null) +
      '<div class="cfg-card">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">片头和片尾</div>' +
      '<div class="cfg-card-sub">上传完整视频片段 · 可只配一端或两端</div></div>' +
      renderIntroOutroFields(io) +
      "</div></div>"
    );
  }

  /** @param opts {{ lead?: string }} */
  function renderCoverPanel(coverWidth, coverHeight, opts) {
    opts = opts || {};
    return (
      '<div class="media-mod" data-media-cover>' +
      '<p class="muted media-lead">' +
      (opts.lead ||
        "只配一套宽高：生成封面与推送封面共用，不再另设「推送比例」。") +
      "</p>" +
      '<div class="cfg-card">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">图片封面尺寸</div>' +
      '<div class="cfg-card-sub">生成与推送同一规格 · 单边 200–4096px</div></div>' +
      '<div class="field"><label>宽 / 高 (px) ' +
      fieldTip(
        "须在 200–4096。水印出图、推送封面、自定义封面画框都按这组像素。旧外站 cover_aspect 已废弃，比例由宽高本身决定（如 1920×1080 即横版）。"
      ) +
      "</label>" +
      '<div class="ratio-row">' +
      '<div class="field"><label>宽</label><input id="f-cw" value="' +
      (coverWidth || "720") +
      '" inputmode="numeric" /></div>' +
      '<div class="field"><label>高</label><input id="f-ch" value="' +
      (coverHeight || "1280") +
      '" inputmode="numeric" /></div></div></div>' +
      '<div class="preset-chips" role="group" aria-label="常用尺寸">' +
      [
        ["720", "1280", "竖版 9:16"],
        ["1920", "1080", "横版 16:9"],
        ["1080", "1080", "方图 1:1"]
      ]
        .map(function (p) {
          var on = String(coverWidth) === p[0] && String(coverHeight) === p[1];
          return (
            '<button type="button" class="preset-chip' +
            (on ? " is-on" : "") +
            '" data-cw="' +
            p[0] +
            '" data-ch="' +
            p[1] +
            '">' +
            p[2] +
            "</button>"
          );
        })
        .join("") +
      "</div>" +
      '<p class="hint" style="margin:8px 0 0">快捷项写入上方宽高；手动改宽高后，仅当数值完全等于某快捷项时才保持选中。</p></div></div>'
    );
  }

  function normalizeArtMode(art) {
    if (!art) return art;
    /* 可同开；不可同关；默认优先自定义 */
    if (!art.templateOn && !art.customOn) art.customOn = true;
    return art;
  }

  function flowLabel(art) {
    if (art.customOn && art.templateOn)
      return "当前：优先自定义提示词，再套模板结构";
    if (art.customOn) return "当前：只用自定义提示词";
    if (art.templateOn) return "当前：只用模板提示词";
    return "当前：两套均已关闭（不可保存）";
  }

  /**
   * 文章管理：顶栏「AI 文章提示词管理 / 文案内链管理」；
   * 提示词内再分「自定义提示词 / 模板提示词」（自定义优先，与文案内链无关）。
   * @param opts {{ lead?: string, showSave?: boolean, showLinks?: boolean, artSection?: string, artView?: string }}
   */
  function renderArticlePanel(article, opts) {
    opts = opts || {};
    var art = article;
    var showLinks = opts.showLinks !== false;
    var rows = art.templates
      .map(function (t) {
        return (
          '<div class="tpl-row">' +
          '<input type="checkbox" data-tpl="' +
          t.id +
          '"' +
          (t.on ? " checked" : "") +
          " />" +
          '<div class="grow"><div class="tpl-name">' +
          t.name +
          " · " +
          t.id +
          '</div><div class="muted" style="font-size:12px">适用：' +
          t.fit +
          (t.cond ? " · 条件：" + t.cond : "") +
          "</div></div></div>"
        );
      })
      .join("");
    var linkRows = (art.links || [])
      .map(function (l, i) {
        return (
          "<tr><td>" +
          l.kw +
          '</td><td style="word-break:break-all">' +
          l.url +
          '</td><td><button type="button" class="btn btn-ghost" data-del-link="' +
          i +
          '">删除</button></td></tr>'
        );
      })
      .join("");

    normalizeArtMode(art);
    var section =
      opts.artSection === "links" || opts.artView === "links" ? "links" : "prompt";
    if (!showLinks) section = "prompt";
    var view = opts.artView === "template" ? "template" : "custom";
    if (section === "links") view = "custom";
    var tplOn = !!art.templateOn;
    var cusOn = !!art.customOn;

    var promptPane =
      '<div class="art-modes">' +
      '<button type="button" class="art-mode-sub' +
      (view === "custom" ? " is-on" : "") +
      '" data-art-sub="custom">' +
      '<div class="art-mode-head"><div><strong>自定义提示词</strong>' +
      '<span class="art-mode-tag">优先：粘贴一整段自己的提示词。</span></div>' +
      '<span class="switch' +
      (cusOn ? " on" : "") +
      '" id="sw-custom" role="switch" aria-checked="' +
      (cusOn ? "true" : "false") +
      '" aria-label="自定义提示词开关"><i></i></span></div></button>' +
      '<button type="button" class="art-mode-sub' +
      (view === "template" ? " is-on" : "") +
      '" data-art-sub="template">' +
      '<div class="art-mode-head"><div><strong>模板提示词</strong>' +
      '<span class="art-mode-tag">其次：原「结构模板」，按题材选结构。</span></div>' +
      '<span class="switch' +
      (tplOn ? " on" : "") +
      '" id="sw-template" role="switch" aria-checked="' +
      (tplOn ? "true" : "false") +
      '" aria-label="模板提示词开关"><i></i></span></div></button></div>' +
      '<div class="art-flow" id="art-flow-label">' +
      flowLabel(art) +
      "</div>" +
      '<div class="cfg-card" id="art-custom-block"' +
      (view === "custom" && cusOn ? "" : " hidden") +
      ">" +
      '<div class="cfg-card-head"><div class="cfg-card-title">自定义提示词</div>' +
      '<div class="cfg-card-sub">开关打开时须填写全文；关闭则收起本区</div></div>' +
      '<div class="field" style="margin:0"><label>提示词全文</label>' +
      '<textarea id="art-custom-text" rows="6" class="media-ta" placeholder="在这里粘贴完整提示词">' +
      (art.customText || "") +
      "</textarea></div></div>" +
      '<div class="cfg-card" id="art-tpl-block"' +
      (view === "template" && tplOn ? "" : " hidden") +
      ">" +
      '<div class="cfg-card-head"><div class="cfg-card-title">结构模板</div>' +
      '<div class="cfg-card-sub">勾选启用的体裁；模板开关打开时至少保留一套</div></div>' +
      '<div class="tpl-list">' +
      rows +
      "</div>" +
      '<details class="cfg-details">' +
      "<summary>篇幅与改写预设（进阶）</summary>" +
      '<div class="ratio-row" style="margin-top:12px">' +
      '<div class="field"><label>最低建议</label><input id="art-min" value="' +
      art.minSuggest +
      '" /></div>' +
      '<div class="field"><label>最高建议</label><input id="art-max" value="' +
      art.maxSuggest +
      '" /></div>' +
      '<div class="field"><label>绝对最低</label><input id="art-abs" value="' +
      art.absMin +
      '" /></div></div>' +
      '<div class="field"><label>「按要求改写」预设（一行一条）</label>' +
      '<textarea id="art-presets" rows="3" class="media-ta">' +
      (art.presets || []).join("\n") +
      "</textarea></div></details></div>";

    var linksPane =
      '<div class="cfg-card">' +
      '<div class="cfg-card-head"><div class="cfg-card-title">文案内链</div>' +
      '<div class="cfg-card-sub">无总开关：词表有条目则对新稿关键词首次出现加链；空词表不生效。与提示词无关。</div></div>' +
      '<div id="link-body">' +
      '<div class="media-sec-actions" style="margin:0 0 10px">' +
      '<button type="button" class="btn btn-ghost" id="btn-dl-tpl">下载 Excel 模板</button>' +
      '<button type="button" class="btn btn-ghost" id="btn-imp">导入 Excel</button></div>' +
      '<div class="link-add-row">' +
      '<input id="link-kw" placeholder="关键词" />' +
      '<input id="link-url" placeholder="https://" />' +
      '<button type="button" class="btn btn-primary" id="btn-add-link">新增</button></div>' +
      '<table class="link-table"><thead><tr><th align="left">关键词</th><th align="left">链接</th><th></th></tr></thead><tbody id="link-rows">' +
      (linkRows || '<tr><td colspan="3" class="muted">暂无链接（不填则不加链）</td></tr>') +
      "</tbody></table></div></div>";

    var artLead =
      opts.lead ||
      "两大块独立配置：AI 文章提示词管理（自定义优先 / 模板其次）与文案内链管理。顶栏切换；提示词内点卡片切换，右侧开关开才展开下方配置（可同开，不可同关）。";
    return (
      '<div class="media-mod" data-media-art>' +
      paneTopBar(
        artLead,
        opts.showSave ? { saveId: "btn-save-art", saveLabel: "保存提示词配置" } : null
      ) +
      '<input type="hidden" id="art-section" value="' +
      section +
      '" />' +
      '<input type="hidden" id="art-view" value="' +
      view +
      '" />' +
      (showLinks
        ? '<div class="wm-subtabs" role="tablist" aria-label="文章管理">' +
          '<button type="button" class="btn' +
          (section === "prompt" ? " btn-primary" : "") +
          '" data-art-section="prompt" role="tab" aria-selected="' +
          (section === "prompt" ? "true" : "false") +
          '">AI 文章提示词管理</button>' +
          '<button type="button" class="btn' +
          (section === "links" ? " btn-primary" : "") +
          '" data-art-section="links" role="tab" aria-selected="' +
          (section === "links" ? "true" : "false") +
          '">文案内链管理</button></div>'
        : "") +
      '<div data-art-pane="prompt"' +
      (section === "prompt" ? "" : " hidden") +
      ">" +
      promptPane +
      "</div>" +
      (showLinks
        ? '<div data-art-pane="links"' +
          (section === "links" ? "" : " hidden") +
          ">" +
          linksPane +
          "</div>"
        : "") +
      "</div>"
    );
  }

  function collectCover(root) {
    root = root || document;
    var cwEl = root.querySelector ? root.querySelector("#f-cw") : document.getElementById("f-cw");
    var chEl = root.querySelector ? root.querySelector("#f-ch") : document.getElementById("f-ch");
    return {
      coverWidth: ((cwEl && cwEl.value) || "720").trim(),
      coverHeight: ((chEl && chEl.value) || "1280").trim()
    };
  }

  function collectDewatermark(root) {
    root = root || document;
    var el = root.querySelector ? root.querySelector("#de-wm") : document.getElementById("de-wm");
    if (!el) return null;
    if (el.getAttribute("role") === "switch") {
      return el.classList.contains("on") || el.getAttribute("aria-checked") === "true";
    }
    return !!el.checked;
  }

  function validateCover(cw, ch) {
    var w = Number(cw);
    var h = Number(ch);
    if (!w || w < 200 || w > 4096) return "封面宽须在 200–4096";
    if (!h || h < 200 || h > 4096) return "封面高须在 200–4096";
    return "";
  }

  function applyWatermarkForm(watermarks, root) {
    root = root || document;
    var w = watermarks;
    if (!w.image) w.image = {};
    if (!w.introOutro) w.introOutro = { intro: {}, outro: {} };
    var swImg = root.querySelector("#sw-wm-image");
    var swVid = root.querySelector("#sw-wm-video");
    if (swImg) w.image.enabled = swImg.classList.contains("on");
    w.videoEnabled = swVid ? swVid.classList.contains("on") : isVideoEnabled(w);
    /* 片头片尾不在水印表单采集；由独立页上传决定是否生效 */
    syncIntroOutroEnabled(w);

    var picked = [];
    root.querySelectorAll("[data-wm-video-mode]:checked").forEach(function (el) {
      picked.push(el.getAttribute("data-wm-video-mode"));
    });
    w.videoModes = normalizeVideoModes(picked.length ? picked : resolveVideoModes(w));
    w.videoMode = w.videoModes[0] || "videoFixed";
    VIDEO_MODE_KEYS.forEach(function (key) {
      if (!w[key]) w[key] = {};
      w[key].enabled = !!(w.videoEnabled && w.videoModes.indexOf(key) !== -1);
    });

    var imgPos = root.querySelector('input[name="pos-image"]:checked');
    if (imgPos) w.image.position = imgPos.value;
    var motPos = root.querySelector('input[name="pos-motion"]:checked');
    if (motPos) w.motion.position = motPos.value;
    ["videoFixed", "videoCycle"].forEach(function (key) {
      w[key].positions = [];
      root.querySelectorAll('[data-pos-group="' + key + '"]:checked').forEach(function (el) {
        w[key].positions.push(el.value);
      });
    });
    var cd = root.querySelector("[data-cycle-dir]");
    if (cd) w.videoCycle.cycleDir = cd.value;
    var mt = root.querySelector("[data-motion-track]");
    if (mt) w.motion.track = mt.value;
    ["image", "videoFixed", "videoCycle", "motion"].forEach(function (key) {
      if (!w[key]) w[key] = {};
      var h = root.querySelector('[data-ratio="' + key + '-h"]');
      var v = root.querySelector('[data-ratio="' + key + '-v"]');
      if (h) w[key].ratioH = h.value.trim();
      if (v) w[key].ratioV = v.value.trim();
    });
    VIDEO_MODE_KEYS.forEach(function (key) {
      var inv = root.querySelector('[data-wm-invert="' + key + '"]');
      var inter = root.querySelector('[data-wm-intermittent="' + key + '"]');
      var iv = root.querySelector('[data-wm-interval="' + key + '"]');
      if (inv) w[key].invert = !!inv.checked;
      if (inter) w[key].intermittent = !!inter.checked;
      if (iv) w[key].intervalSec = iv.value.trim() || "3";
    });
    var sp = root.querySelector('[data-wm-speed="motion"]');
    if (sp) w.motion.speed = sp.value.trim() || "1";
    return w;
  }

  function ioClipHasFile(clip) {
    return !!(clip && (clip.name || clip.dataUrl));
  }

  function syncIntroOutroEnabled(watermarks) {
    var io = watermarks.introOutro || {};
    var has =
      ioClipHasFile(io.intro) ||
      ioClipHasFile(io.outro) ||
      !!(io.name || io.dataUrl);
    watermarks.introOutroEnabled = has;
    if (!watermarks.introOutro) watermarks.introOutro = { intro: {}, outro: {} };
    watermarks.introOutro.enabled = has;
    return has;
  }

  function hasWmFile(watermarks) {
    var img = watermarks.image;
    if (img && img.enabled && (img.name || img.dataUrl)) return true;
    if (!isVideoEnabled(watermarks)) return false;
    return resolveVideoModes(watermarks).some(function (mode) {
      var v = watermarks[mode];
      return !!(v && (v.name || v.dataUrl));
    });
  }

  function hasIntroOutroFile(watermarks) {
    return syncIntroOutroEnabled(watermarks || {});
  }

  /** 解析 introOutro:intro / introOutro:outro；普通 key 原样返回 */
  function parseWmUploadKey(key) {
    if (String(key).indexOf("introOutro:") === 0) {
      return { kind: "introOutro", slot: String(key).slice("introOutro:".length) };
    }
    return { kind: "slot", key: key };
  }

  function applyWmUpload(watermarks, key, file, dataUrl) {
    var parsed = parseWmUploadKey(key);
    if (parsed.kind === "introOutro") {
      if (!watermarks.introOutro) watermarks.introOutro = { intro: {}, outro: {} };
      if (!watermarks.introOutro[parsed.slot]) watermarks.introOutro[parsed.slot] = {};
      watermarks.introOutro[parsed.slot].name = file.name;
      watermarks.introOutro[parsed.slot].dataUrl = dataUrl;
      syncIntroOutroEnabled(watermarks);
      return;
    }
    if (!watermarks[parsed.key]) watermarks[parsed.key] = {};
    watermarks[parsed.key].name = file.name;
    watermarks[parsed.key].dataUrl = dataUrl;
  }

  function clearWmUpload(watermarks, key) {
    var parsed = parseWmUploadKey(key);
    if (parsed.kind === "introOutro") {
      if (!watermarks.introOutro) return;
      watermarks.introOutro[parsed.slot] = { name: "", dataUrl: "" };
      syncIntroOutroEnabled(watermarks);
      return;
    }
    if (!watermarks[parsed.key]) return;
    watermarks[parsed.key].name = "";
    watermarks[parsed.key].dataUrl = "";
  }

  /** 片头片尾页：上传 / 清除（与水印共用 key 协议） */
  function bindIntroOutroUI(root, handlers) {
    handlers = handlers || {};
    root = root || document;
    bindFieldTips(root);
    root.querySelectorAll("[data-upload]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var key = inp.getAttribute("data-upload");
        var file = inp.files && inp.files[0];
        if (!file) return;
        if (handlers.onUpload) handlers.onUpload(key, file);
      });
    });
    root.querySelectorAll("[data-remove-wm]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-remove-wm");
        if (handlers.onRemove) handlers.onRemove(key);
      });
    });
  }

  function readArticleForm(root) {
    root = root || document;
    var swTpl = root.querySelector("#sw-template");
    var swCus = root.querySelector("#sw-custom");
    var templateOn = swTpl ? swTpl.classList.contains("on") : false;
    var customOn = swCus ? swCus.classList.contains("on") : true;
    return {
      templateOn: templateOn,
      customOn: customOn,
      customText: ((root.querySelector("#art-custom-text") || {}).value || ""),
      minSuggest: Number((root.querySelector("#art-min") || {}).value) || 350,
      maxSuggest: Number((root.querySelector("#art-max") || {}).value) || 900,
      absMin: Number((root.querySelector("#art-abs") || {}).value) || 250,
      presets: ((root.querySelector("#art-presets") || {}).value || "")
        .split("\n")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean),
      tplOns: (function () {
        var map = {};
        root.querySelectorAll("[data-tpl]").forEach(function (box) {
          map[box.getAttribute("data-tpl")] = box.checked;
        });
        return map;
      })()
    };
  }

  function applyArticleForm(article, root) {
    var form = readArticleForm(root);
    article.templateOn = form.templateOn;
    article.customOn = form.customOn;
    if (!article.templateOn && !article.customOn) article.customOn = true;
    /* 文案内链无总开关：有词条即生效 */
    article.linkOn = !!(article.links && article.links.length);
    article.customText = form.customText;
    article.minSuggest = form.minSuggest;
    article.maxSuggest = form.maxSuggest;
    article.absMin = form.absMin;
    article.presets = form.presets;
    article.templates.forEach(function (tpl) {
      if (Object.prototype.hasOwnProperty.call(form.tplOns, tpl.id)) {
        tpl.on = form.tplOns[tpl.id];
      }
    });
    return article;
  }

  function validateArticle(article) {
    if (!article.templateOn && !article.customOn) {
      return "至少保留一套提示词";
    }
    if (article.customOn && !(article.customText || "").trim()) {
      return "自定义提示词已打开，请先粘贴全文";
    }
    if (
      article.templateOn &&
      !article.templates.some(function (x) {
        return x.on;
      })
    ) {
      return "模板提示词已打开，至少启用一套结构";
    }
    return "";
  }

  function bindFieldTips(root) {
    root = root || document;
    root.querySelectorAll(".field-tip").forEach(function (btn) {
      if (btn.getAttribute("data-tip-bound")) return;
      btn.setAttribute("data-tip-bound", "1");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = btn.classList.contains("is-open");
        root.querySelectorAll(".field-tip.is-open").forEach(function (n) {
          n.classList.remove("is-open");
        });
        if (!open) btn.classList.add("is-open");
      });
    });
  }

  function syncCoverPresetChips(root) {
    root = root || document;
    var a = root.querySelector("#f-cw");
    var b = root.querySelector("#f-ch");
    var cw = a ? String(a.value || "").trim() : "";
    var ch = b ? String(b.value || "").trim() : "";
    root.querySelectorAll("[data-cw]").forEach(function (c) {
      var match =
        c.getAttribute("data-cw") === cw && c.getAttribute("data-ch") === ch;
      c.classList.toggle("is-on", match);
    });
  }

  function bindCoverUI(root, onChange) {
    root = root || document;
    bindFieldTips(root);
    syncCoverPresetChips(root);
    root.querySelectorAll("[data-cw]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var cw = chip.getAttribute("data-cw");
        var ch = chip.getAttribute("data-ch");
        var a = root.querySelector("#f-cw");
        var b = root.querySelector("#f-ch");
        if (a) a.value = cw;
        if (b) b.value = ch;
        syncCoverPresetChips(root);
        if (onChange) onChange();
      });
    });
    ["#f-cw", "#f-ch"].forEach(function (sel) {
      var el = root.querySelector(sel);
      if (!el) return;
      el.addEventListener("input", function () {
        syncCoverPresetChips(root);
        if (onChange) onChange();
      });
    });
  }

  function bindWatermarkUI(root, handlers) {
    handlers = handlers || {};
    root = root || document;
    bindFieldTips(root);
    function toastWm(msg, kind) {
      if (handlers.toast) handlers.toast(msg, kind);
      else if (global.FZShell) FZShell.toast(msg, kind || "err");
    }
    function syncWmFlow() {
      var swImg = root.querySelector("#sw-wm-image");
      var swVid = root.querySelector("#sw-wm-video");
      var lab = root.querySelector("#wm-add-flow");
      if (!lab) return;
      lab.textContent = wmAddFlowLabel(
        !!(swImg && swImg.classList.contains("on")),
        !!(swVid && swVid.classList.contains("on"))
      );
    }
    /** 仅「当前选中卡 + 开关开」才展开下方配置 */
    function syncWmAddPanels() {
      var viewEl = root.querySelector("#wm-add-view");
      var which = (viewEl && viewEl.value) || "image";
      var swImg = root.querySelector("#sw-wm-image");
      var swVid = root.querySelector("#sw-wm-video");
      var imgOn = !!(swImg && swImg.classList.contains("on"));
      var videoOn = !!(swVid && swVid.classList.contains("on"));
      var ib = root.querySelector("#wm-image-block");
      var vb = root.querySelector("#wm-video-block");
      if (ib) ib.hidden = !(which === "image" && imgOn);
      if (vb) vb.hidden = !(which === "video" && videoOn);
    }
    function syncVideoModePanes(modes) {
      root.querySelectorAll("[data-video-pane]").forEach(function (pane) {
        var key = pane.getAttribute("data-video-pane");
        var on = modes.indexOf(key) !== -1;
        pane.classList.toggle("is-off", !on);
        pane.hidden = false;
      });
      root.querySelectorAll("[data-wm-video-mode]").forEach(function (el) {
        el.checked = modes.indexOf(el.getAttribute("data-wm-video-mode")) !== -1;
      });
    }
    function readVideoModesFromDom() {
      var picked = [];
      root.querySelectorAll("[data-wm-video-mode]:checked").forEach(function (el) {
        picked.push(el.getAttribute("data-wm-video-mode"));
      });
      return picked;
    }
    function showWmAddSub(which) {
      var view = root.querySelector("#wm-add-view");
      if (view) view.value = which;
      root.querySelectorAll("[data-wm-add-sub]").forEach(function (el) {
        el.classList.toggle("is-on", el.getAttribute("data-wm-add-sub") === which);
      });
      syncWmAddPanels();
      if (handlers.onSubChange) handlers.onSubChange(which);
      if (handlers.onFormChange) handlers.onFormChange();
    }
    function toggleWmSwitch(which) {
      var sw = root.querySelector(which === "video" ? "#sw-wm-video" : "#sw-wm-image");
      if (!sw) return;
      var on = !sw.classList.contains("on");
      sw.classList.toggle("on", on);
      sw.setAttribute("aria-checked", on ? "true" : "false");
      syncWmFlow();
      syncWmAddPanels();
      if (handlers.onFormChange) handlers.onFormChange();
    }
    root.querySelectorAll("[data-wm-add-sub]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.closest(".switch")) return;
        showWmAddSub(el.getAttribute("data-wm-add-sub"));
      });
    });
    ["#sw-wm-image", "#sw-wm-video"].forEach(function (sel) {
      var sw = root.querySelector(sel);
      if (!sw) return;
      sw.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleWmSwitch(sel === "#sw-wm-video" ? "video" : "image");
      });
    });
    var swDewm = root.querySelector("#de-wm");
    if (swDewm && swDewm.getAttribute("role") === "switch") {
      swDewm.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var on = !swDewm.classList.contains("on");
        swDewm.classList.toggle("on", on);
        swDewm.setAttribute("aria-checked", on ? "true" : "false");
        if (handlers.onFormChange) handlers.onFormChange();
      });
    }
    root.querySelectorAll("[data-wm-video-mode]").forEach(function (box) {
      box.addEventListener("change", function () {
        var before = readVideoModesFromDom();
        if (!box.checked && !before.length) {
          box.checked = true;
          toastWm("至少保留一种视频水印类型", "err");
          return;
        }
        syncVideoModePanes(normalizeVideoModes(before));
        if (handlers.onFormChange) handlers.onFormChange();
      });
    });
    root.querySelectorAll("[data-wm-intermittent]").forEach(function (box) {
      box.addEventListener("change", function () {
        var key = box.getAttribute("data-wm-intermittent");
        var wrap = root.querySelector('[data-wm-interval-wrap="' + key + '"]');
        if (wrap) wrap.hidden = !box.checked;
        if (handlers.onFormChange) handlers.onFormChange();
      });
    });
    root.querySelectorAll("[data-upload]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var key = inp.getAttribute("data-upload");
        var file = inp.files && inp.files[0];
        if (!file) return;
        if (handlers.onUpload) handlers.onUpload(key, file);
      });
    });
    root.querySelectorAll("[data-remove-wm]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-remove-wm");
        if (handlers.onRemove) handlers.onRemove(key);
      });
    });
    var defBtn = root.querySelector("#btn-wm-default");
    if (defBtn && handlers.onUseDefault) {
      defBtn.addEventListener("click", handlers.onUseDefault);
    }
    if (handlers.onFormChange) {
      root.querySelectorAll("input, select").forEach(function (el) {
        if (el.type === "file") return;
        el.addEventListener("change", handlers.onFormChange);
        if (el.tagName === "INPUT" && el.type !== "checkbox" && el.type !== "radio") {
          el.addEventListener("input", handlers.onFormChange);
        }
      });
    }
  }

  function bindArticleUI(root, handlers) {
    handlers = handlers || {};
    root = root || document;
    bindFieldTips(root);
    var toast =
      handlers.toast ||
      function (msg, kind) {
        if (global.FZShell) FZShell.toast(msg, kind || "err");
      };
    function syncFlow() {
      var swTpl = root.querySelector("#sw-template");
      var swCus = root.querySelector("#sw-custom");
      var lab = root.querySelector("#art-flow-label");
      if (!lab) return;
      lab.textContent = flowLabel({
        templateOn: !!(swTpl && swTpl.classList.contains("on")),
        customOn: !!(swCus && swCus.classList.contains("on"))
      });
    }
    function syncArtPanels() {
      var viewEl = root.querySelector("#art-view");
      var which = (viewEl && viewEl.value) || "template";
      var swTpl = root.querySelector("#sw-template");
      var swCus = root.querySelector("#sw-custom");
      var tplOn = !!(swTpl && swTpl.classList.contains("on"));
      var cusOn = !!(swCus && swCus.classList.contains("on"));
      var tb = root.querySelector("#art-tpl-block");
      var cb = root.querySelector("#art-custom-block");
      if (tb) tb.hidden = !(which === "template" && tplOn);
      if (cb) cb.hidden = !(which === "custom" && cusOn);
    }
    function showSection(which) {
      var sec = root.querySelector("#art-section");
      if (sec) sec.value = which;
      root.querySelectorAll("[data-art-section]").forEach(function (el) {
        var on = el.getAttribute("data-art-section") === which;
        el.classList.toggle("btn-primary", on);
        el.setAttribute("aria-selected", on ? "true" : "false");
      });
      root.querySelectorAll("[data-art-pane]").forEach(function (pane) {
        pane.hidden = pane.getAttribute("data-art-pane") !== which;
      });
      if (handlers.onChange) handlers.onChange();
    }
    function showSub(which) {
      var view = root.querySelector("#art-view");
      if (view) view.value = which;
      root.querySelectorAll("[data-art-sub]").forEach(function (el) {
        el.classList.toggle("is-on", el.getAttribute("data-art-sub") === which);
      });
      syncArtPanels();
      if (handlers.onChange) handlers.onChange();
    }
    function toggleSwitch(which) {
      var swTpl = root.querySelector("#sw-template");
      var swCus = root.querySelector("#sw-custom");
      if (!swTpl || !swCus) return;
      var templateOn = swTpl.classList.contains("on");
      var customOn = swCus.classList.contains("on");
      if (which === "template") {
        if (templateOn && !customOn) {
          toast("至少保留一套提示词", "err");
          return;
        }
        templateOn = !templateOn;
        swTpl.classList.toggle("on", templateOn);
        swTpl.setAttribute("aria-checked", templateOn ? "true" : "false");
      } else {
        if (customOn && !templateOn) {
          toast("至少保留一套提示词", "err");
          return;
        }
        customOn = !customOn;
        swCus.classList.toggle("on", customOn);
        swCus.setAttribute("aria-checked", customOn ? "true" : "false");
        if (customOn) {
          var text = ((root.querySelector("#art-custom-text") || {}).value || "").trim();
          if (!text) toast("自定义提示词还是空的，保存前需要贴上全文", "err");
        }
      }
      syncFlow();
      syncArtPanels();
      if (handlers.onChange) handlers.onChange();
    }
    root.querySelectorAll("[data-art-section]").forEach(function (el) {
      el.addEventListener("click", function () {
        showSection(el.getAttribute("data-art-section"));
      });
    });
    root.querySelectorAll("[data-art-sub]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.closest(".switch")) return;
        showSub(el.getAttribute("data-art-sub"));
      });
    });
    ["#sw-template", "#sw-custom"].forEach(function (sel) {
      var sw = root.querySelector(sel);
      if (!sw) return;
      sw.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSwitch(sel === "#sw-template" ? "template" : "custom");
      });
    });
    root.querySelectorAll("[data-tpl]").forEach(function (box) {
      box.addEventListener("change", function () {
        if (handlers.onChange) handlers.onChange();
      });
    });
    ["#art-min", "#art-max", "#art-abs", "#art-presets", "#art-custom-text"].forEach(
      function (sel) {
        var el = root.querySelector(sel);
        if (!el) return;
        el.addEventListener("input", function () {
          if (handlers.onChange) handlers.onChange();
        });
      }
    );
    var add = root.querySelector("#btn-add-link");
    if (add && handlers.onAddLink) add.addEventListener("click", handlers.onAddLink);
    root.querySelectorAll("[data-del-link]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (handlers.onDelLink) handlers.onDelLink(Number(btn.getAttribute("data-del-link")));
      });
    });
    var dl = root.querySelector("#btn-dl-tpl");
    if (dl) {
      dl.addEventListener("click", function () {
        if (global.FZShell) FZShell.toast("已下载模板：关键词、链接（演示）", "ok");
      });
    }
    var imp = root.querySelector("#btn-imp");
    if (imp) {
      imp.addEventListener("click", function () {
        if (global.FZShell) FZShell.toast("导入 Excel · 设计中（演示）", "err");
      });
    }
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  global.FZMediaConfig = {
    POS: POS,
    WM_DEFS: WM_DEFS,
    fieldTip: fieldTip,
    flowLabel: flowLabel,
    normalizeArtMode: normalizeArtMode,
    renderCoverPanel: renderCoverPanel,
    renderWatermarkPanel: renderWatermarkPanel,
    renderIntroOutroPanel: renderIntroOutroPanel,
    renderArticlePanel: renderArticlePanel,
    collectCover: collectCover,
    collectDewatermark: collectDewatermark,
    validateCover: validateCover,
    applyWatermarkForm: applyWatermarkForm,
    hasWmFile: hasWmFile,
    hasIntroOutroFile: hasIntroOutroFile,
    syncIntroOutroEnabled: syncIntroOutroEnabled,
    applyWmUpload: applyWmUpload,
    clearWmUpload: clearWmUpload,
    readArticleForm: readArticleForm,
    applyArticleForm: applyArticleForm,
    validateArticle: validateArticle,
    bindFieldTips: bindFieldTips,
    bindCoverUI: bindCoverUI,
    bindWatermarkUI: bindWatermarkUI,
    bindIntroOutroUI: bindIntroOutroUI,
    bindArticleUI: bindArticleUI,
    clone: clone
  };
})(window);
