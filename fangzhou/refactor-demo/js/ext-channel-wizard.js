/**
 * 新建外站通道向导（对齐现网「外站发布 → 站点配置 → 新增外站」）
 *
 * 现网字段清单（按站点类型显隐）：
 * ① 基础对接：站点类型*（push|pull，创建后不可改）、站点代码（可改后锁定）、
 *    站点名称*、接口地址*、接口前缀（仅 push，默认 /oash/v1）、
 *    签名密钥/接入令牌（push 可选签名；pull 为对方令牌）、启用站点
 * ② 推送策略（仅 push · To-Be 项目并集只对照这一支）：自动推送、必须含视频、
 *    内容生成(ai|raw|none)、去源水印+logo、切片 m3u8、推送全部分集、分集标题、
 *    封面比例、对方分类 ID/名、推送即发布、附加 JSON
 * ③ 拉取处理（仅 pull · 不进项目管理，后续单独服务）：在途/续租/超时等 + 接入 JSON
 * ④ 站点水印：视频固定/四角循环/移动 + 图片 logo（位置、宽比、轨迹）；
 *    新建保存后才能真上传——Demo 只记文件名与选项
 * ⑤ 备注；push 创建时可一并填「发布账号」名称/登录名/密码
 * 创建后：Demo 状态「待激活」（可挂项目）；启用开关按现网：push 默开、pull 默关
 */
(function (global) {
  var MASK_ID = "fz-ext-wizard-mask";
  var POS = [
    { v: "tl", t: "左上" },
    { v: "tr", t: "右上" },
    { v: "bl", t: "左下" },
    { v: "br", t: "右下" }
  ];

  var state = {
    step: 1,
    onSuccess: null,
    kind: "push",
    data: null
  };

  function el(id) {
    return document.getElementById(id);
  }

  function toast(msg, type) {
    if (global.FZShell && FZShell.toast) FZShell.toast(msg, type || "err");
    else alert(msg);
  }

  function fieldTip(text) {
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

  function genCode() {
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    var r = "";
    for (var i = 0; i < 6; i++) r += chars[Math.floor(Math.random() * chars.length)];
    return "site-" + r;
  }

  function emptyWm() {
    return {
      fixed: { positions: [], wr: { l: "", p: "", s: "" }, fileName: "" },
      cycle: { positions: [], wr: { l: "", p: "", s: "" }, fileName: "" },
      motion: { path: "diagonal", wr: { l: "", p: "", s: "" }, fileName: "" },
      image: { position: "br", fileName: "" }
    };
  }

  function defaultData() {
    return {
      code: genCode(),
      name: "",
      baseUrl: "",
      apiPrefix: "/oash/v1",
      appSecret: "",
      isActive: true,
      autoPush: true,
      requireVideo: true,
      generationMode: "ai",
      dewatermarkEnabled: false,
      sliceEnabled: false,
      episodes: false,
      episodeTitleFormat: "",
      coverAspect: "",
      categoryId: "",
      categoryName: "",
      publish: true,
      extraJson: "",
      notes: "",
      initAccountName: "",
      initAccountUsername: "",
      initAccountPassword: "",
      watermark: emptyWm(),
      pull: {
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
      }
    };
  }

  function switchRow(id, label, tip) {
    return (
      '<div class="ext-wiz-switch">' +
      '<div class="ext-wiz-switch-text"><span>' +
      label +
      "</span>" +
      (tip ? fieldTip(tip) : "") +
      '</div><button type="button" class="switch" id="' +
      id +
      '" aria-pressed="false"><i></i></button></div>'
    );
  }

  function setSwitch(id, on) {
    var btn = el(id);
    if (!btn) return;
    btn.classList.toggle("on", !!on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function getSwitch(id) {
    var btn = el(id);
    return !!(btn && btn.classList.contains("on"));
  }

  function posChecks(name, selected) {
    selected = selected || [];
    return (
      '<div class="pos-group">' +
      POS.map(function (p) {
        var on = selected.indexOf(p.v) !== -1;
        return (
          '<label><input type="checkbox" name="' +
          name +
          '" value="' +
          p.v +
          '"' +
          (on ? " checked" : "") +
          " />" +
          p.t +
          "</label>"
        );
      }).join("") +
      "</div>"
    );
  }

  function wrInputs(prefix, wr) {
    wr = wr || {};
    return (
      '<div class="ratio-row">' +
      '<div class="field"><label>横屏</label><input id="' +
      prefix +
      '-l" type="number" step="0.01" min="0.02" max="1" placeholder="默认" value="' +
      (wr.l || "") +
      '" /></div>' +
      '<div class="field"><label>竖屏</label><input id="' +
      prefix +
      '-p" type="number" step="0.01" min="0.02" max="1" placeholder="默认" value="' +
      (wr.p || "") +
      '" /></div>' +
      '<div class="field"><label>正方形</label><input id="' +
      prefix +
      '-s" type="number" step="0.01" min="0.02" max="1" placeholder="默认" value="' +
      (wr.s || "") +
      '" /></div></div>'
    );
  }

  function filePick(id, fileName) {
    return (
      '<div class="ext-wiz-file">' +
      '<input type="file" id="' +
      id +
      '" accept="image/png,video/mp4,video/quicktime" hidden />' +
      '<button type="button" class="btn btn-sm" data-file="' +
      id +
      '">选择文件</button>' +
      '<span class="muted" id="' +
      id +
      '-name">' +
      (fileName || "未配置") +
      "</span>" +
      (fileName
        ? '<button type="button" class="btn btn-ghost btn-sm" data-clear-file="' +
          id +
          '">清除</button>'
        : "") +
      "</div>"
    );
  }

  function stepIndicator(n) {
    var labels =
      state.kind === "pull"
        ? ["基础对接", "拉取处理", "站点水印", "备注确认"]
        : ["基础对接", "推送策略", "站点水印", "账号与备注"];
    return (
      '<div class="ext-wiz-steps" role="list">' +
      labels
        .map(function (lab, i) {
          var k = i + 1;
          var cls = k === n ? "is-active" : k < n ? "is-done" : "";
          return (
            '<div class="ext-wiz-step ' +
            cls +
            '" role="listitem"><span class="ext-wiz-step-num">' +
            k +
            "</span>" +
            lab +
            "</div>"
          );
        })
        .join('<span class="ext-wiz-step-sep" aria-hidden="true"></span>') +
      "</div>"
    );
  }

  function renderStep1() {
    var d = state.data;
    var isPull = state.kind === "pull";
    return (
      stepIndicator(1) +
      '<div class="field"><label>站点类型 * ' +
      fieldTip(
        "推送站点：方舟把加工好的素材推给对方。拉取加水印：方舟从对方领视频，加水印后回报。创建后不可修改。"
      ) +
      '</label><select id="ext-wiz-kind">' +
      '<option value="push"' +
      (!isPull ? " selected" : "") +
      ">推送站点：方舟把加工好的素材推给对方</option>" +
      '<option value="pull"' +
      (isPull ? " selected" : "") +
      ">拉取加水印：方舟从对方领视频，加水印后回报</option>" +
      "</select>" +
      '<p class="hint" id="ext-wiz-kind-hint">' +
      (isPull
        ? "创建后不可修改；不需要发布账号，也不用绑定采集源"
        : "创建后不可修改") +
      "</p></div>" +
      '<div class="field"><label>站点代码 ' +
      fieldTip(
        isPull
          ? "小写字母/数字/中划线。创建后不可改；领任务时默认以 fangzhou-<站点代码> 作处理方名称。"
          : "小写字母/数字/中划线。创建后不可改；对方请求头 X-OASH-Site 会带它。"
      ) +
      '</label><input id="ext-wiz-code" maxlength="64" value="' +
      esc(d.code) +
      '" /></div>' +
      '<div class="field"><label>站点名称 *</label><input id="ext-wiz-name" maxlength="120" placeholder="运营看到的名字" value="' +
      esc(d.name) +
      '" /></div>' +
      '<div class="field"><label>接口地址 * ' +
      fieldTip("对方 API 根地址。现网仅管理员可改接口地址与前缀。") +
      '</label><input id="ext-wiz-base" type="url" maxlength="500" placeholder="' +
      (isPull ? "https://cue.example.com" : "https://api.partner.com") +
      '" value="' +
      esc(d.baseUrl) +
      '" /></div>' +
      (isPull
        ? ""
        : '<div class="field"><label>接口前缀 ' +
          fieldTip("对方按规范实现时默认 /oash/v1，一般不用改。") +
          '</label><input id="ext-wiz-prefix" maxlength="100" value="' +
          esc(d.apiPrefix || "/oash/v1") +
          '" /></div>') +
      '<div class="field"><label id="ext-wiz-secret-lab">' +
      (isPull ? "接入令牌" : "签名密钥") +
      "（可选） " +
      fieldTip(
        isPull
          ? "对方给的接入令牌（如 Cue 的 RESTAGE_WATERMARK_TOKEN）。填在此处，不要写进下方接入配置 JSON。"
          : "对方提供的签名密钥；不填则请求不带签名。"
      ) +
      '</label><input id="ext-wiz-secret" type="password" maxlength="200" autocomplete="new-password" placeholder="' +
      (isPull
        ? "对方给的接入令牌"
        : "对方提供的签名密钥；不填则请求不带签名") +
      '" value="' +
      esc(d.appSecret) +
      '" /></div>' +
      switchRow(
        "ext-wiz-active",
        "启用站点",
        isPull
          ? "停用后不再领新任务，已领的处理完并回报就停。新建拉取站点默认停用，核对好配置和令牌再启用。"
          : "关闭后该站点不再参与新的推送任务。"
      ) +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-act="close">取消</button>' +
      '<button type="button" class="btn btn-primary" data-act="next-1">下一步</button></div>'
    );
  }

  function renderStep2Push() {
    var d = state.data;
    return (
      stepIndicator(2) +
      switchRow(
        "ext-wiz-auto",
        "内容就绪后自动推送",
        "关闭后任务停在「内容就绪」，由运营在任务页确认推送。"
      ) +
      switchRow(
        "ext-wiz-video",
        "必须含视频",
        "关闭后纯图文素材也会推送。"
      ) +
      '<div class="field"><label>内容生成 ' +
      fieldTip("决定推送前是否调用 AI 写标题正文，或只推媒体。") +
      '</label><select id="ext-wiz-gen">' +
      '<option value="ai">AI 生成标题与正文</option>' +
      '<option value="raw">素材原文直推（不调 AI）</option>' +
      '<option value="none">不生成文章（只推媒体，标题取文案首行）</option>' +
      "</select></div>" +
      switchRow(
        "ext-wiz-slice",
        "生成 m3u8",
        "未配置或超时只推 mp4。"
      ) +
      switchRow(
        "ext-wiz-episodes",
        "推送全部分集",
        "一条稿件带上素材里的全部视频（短剧第 1～N 集）；对方须已支持对接规范 v1.1 的 episodes。"
      ) +
      '<div class="field"><label>分集标题 ' +
      fieldTip("{n} 推送时换成集号。留空则用源站分集名，没有时为「第N集」。") +
      '</label><input id="ext-wiz-ep-title" maxlength="100" placeholder="留空用源站分集名；英文站填 Episode {n}" value="' +
      esc(d.episodeTitleFormat) +
      '" /></div>' +
      '<div class="field"><label>封面比例 ' +
      fieldTip("对方列表卡片固定横版时选 16:9：竖版画面完整居中、两侧补模糊背景，不拉伸。") +
      '</label><select id="ext-wiz-cover">' +
      '<option value="">保持原尺寸</option>' +
      '<option value="16:9">横版 16:9</option></select></div>' +
      '<div class="ratio-row">' +
      '<div class="field grow"><label>对方分类 ID（可选）</label><input id="ext-wiz-cat-id" placeholder="选填" value="' +
      esc(d.categoryId) +
      '" /></div>' +
      '<div class="field grow"><label>对方分类名（可选）</label><input id="ext-wiz-cat-name" placeholder="选填；留空用素材分类" value="' +
      esc(d.categoryName) +
      '" /></div></div>' +
      switchRow(
        "ext-wiz-publish",
        "推送即发布",
        "关闭后对方按草稿接收（options.publish=false）。"
      ) +
      '<div class="field"><label>附加字段 JSON（可选） ' +
      fieldTip("随稿件 extra 原样推送，须为 JSON 对象。") +
      '</label><textarea id="ext-wiz-extra" class="ext-wiz-mono" rows="3" placeholder=\'{"channel": "oash"}\'>' +
      esc(d.extraJson) +
      "</textarea></div>" +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-act="back">上一步</button>' +
      '<button type="button" class="btn btn-primary" data-act="next-2">下一步</button></div>'
    );
  }

  function renderStep2Pull() {
    var p = state.data.pull;
    return (
      stepIndicator(2) +
      '<p class="hint" style="margin-top:0">处理选项决定领任务与回报行为；接入配置含接口路径 / 鉴权 / 报文模板（相对接口地址）。</p>' +
      '<div class="ext-wiz-grid">' +
      '<div class="field"><label>在途上限 ' +
      fieldTip("同时在处理的任务数，满了不领新的；和水印服务共用水印并发。") +
      '</label><input id="ext-wiz-inflight" type="number" min="1" max="50" value="' +
      esc(p.maxInflight) +
      '" /></div>' +
      '<div class="field"><label>续租间隔（分钟） ' +
      fieldTip("要小于对方租约时长（Cue 是 30 分钟）。") +
      '</label><input id="ext-wiz-hb" type="number" min="1" max="120" value="' +
      esc(p.heartbeat) +
      '" /></div>' +
      '<div class="field"><label>水印超时（分钟） ' +
      fieldTip("超过就回报失败，不重投。") +
      '</label><input id="ext-wiz-wait" type="number" min="10" max="1440" value="' +
      esc(p.waitTimeout) +
      '" /></div>' +
      '<div class="field"><label>水印失败重投次数 ' +
      fieldTip("含第一次提交。") +
      '</label><input id="ext-wiz-attempts" type="number" min="1" max="10" value="' +
      esc(p.maxAttempts) +
      '" /></div></div>' +
      switchRow("ext-wiz-verify", "核对 sha256 与大小", "对方给了才核；不符直接回报失败。") +
      switchRow("ext-wiz-keep-res", "分辨率必须不变", "") +
      switchRow(
        "ext-wiz-skip-trim",
        "保持原画面（不裁黑边、不放大）",
        "水印服务默认会裁黑边、放大小画幅；对方要求分辨率不变时打开。"
      ) +
      '<div class="ext-wiz-grid">' +
      '<div class="field"><label>时长偏差（秒）</label><input id="ext-wiz-tol-s" type="number" min="0" max="60" step="0.1" value="' +
      esc(p.tolSeconds) +
      '" /></div>' +
      '<div class="field"><label>时长偏差（比例） ' +
      fieldTip("与秒数任一以内都算通过，0.02 = 2%。") +
      '</label><input id="ext-wiz-tol-r" type="number" min="0" max="0.5" step="0.01" value="' +
      esc(p.tolRatio) +
      '" /></div></div>' +
      '<div class="field"><label>成片地址</label><select id="ext-wiz-storage">' +
      '<option value="cdn">转存方舟 CDN 后回报</option>' +
      '<option value="watermark_url">直接回报水印服务地址</option></select></div>' +
      '<div class="field"><label>成片域名白名单（可选） ' +
      fieldTip("逗号分隔；与对方可信域名一致，不在名单里的成片直接回报失败。") +
      '</label><input id="ext-wiz-hosts" placeholder="逗号分隔；留空不校验" value="' +
      esc(p.resultHosts) +
      '" /></div>' +
      '<div class="field"><label>只处理这些 profile（可选）</label><input id="ext-wiz-profiles" placeholder="逗号分隔；留空全处理" value="' +
      esc(p.profiles) +
      '" /></div>' +
      '<div class="field"><label>处理方名称（可选）</label><input id="ext-wiz-worker" maxlength="100" placeholder="留空用 fangzhou-站点代码" value="' +
      esc(p.workerId) +
      '" /></div>' +
      '<div class="ext-wiz-grid">' +
      '<div class="field"><label>请求超时（秒）</label><input id="ext-wiz-req-to" type="number" min="5" max="300" value="' +
      esc(p.requestTimeout) +
      '" /></div>' +
      '<div class="field"><label>成功回报超时（秒） ' +
      fieldTip("对方要下载校验整片，要留足。") +
      '</label><input id="ext-wiz-rep-to" type="number" min="5" max="3600" value="' +
      esc(p.reportTimeout) +
      '" /></div></div>' +
      '<div class="field"><label>接入配置 JSON * ' +
      fieldTip(
        "接口路径 / 鉴权 / 报文模板 / 字段映射。占位符如 {worker_id}{task_id}{lease_token} 等发请求时替换。令牌填在上一步，不要写进这里。"
      ) +
      '</label><textarea id="ext-wiz-pull-json" class="ext-wiz-mono" rows="5" placeholder=\'{"preset":"cue","paths":{}}\'>' +
      esc(p.configJson) +
      "</textarea></div>" +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-act="back">上一步</button>' +
      '<button type="button" class="btn btn-primary" data-act="next-2">下一步</button></div>'
    );
  }

  function renderStep3() {
    var w = state.data.watermark;
    var isPull = state.kind === "pull";
    return (
      stepIndicator(3) +
      switchRow(
        "ext-wiz-dewm",
        isPull ? "去源水印 + 叠加站点 logo" : "去源水印 + 叠加站点 logo",
        isPull
          ? "拉取加水印站点只用视频水印；至少配一种（或打开去水印）才会领任务。"
          : "水印没完成不推送（失败后自动重试，不会推原片）；logo 在下方配置，不配就只去水印。"
      ) +
      '<div class="ext-wiz-panel" id="ext-wiz-wm-panel">' +
      "<h4>视频 · 固定水印</h4>" +
      filePick("ext-wm-fixed", w.fixed.fileName) +
      "<p class=\"hint\">位置</p>" +
      posChecks("ext-wm-fixed-pos", w.fixed.positions) +
      "<p class=\"hint\">宽度比例（0.02～1，留空走默认）</p>" +
      wrInputs("ext-wm-fixed-wr", w.fixed.wr) +
      "<h4>视频 · 四角循环</h4>" +
      filePick("ext-wm-cycle", w.cycle.fileName) +
      "<p class=\"hint\">循环位置</p>" +
      posChecks("ext-wm-cycle-pos", w.cycle.positions) +
      wrInputs("ext-wm-cycle-wr", w.cycle.wr) +
      "<h4>视频 · 移动水印</h4>" +
      filePick("ext-wm-motion", w.motion.fileName) +
      '<div class="field"><label>移动轨迹</label><select id="ext-wm-path">' +
      '<option value="diagonal">对角来回</option>' +
      '<option value="circle">环形运动</option>' +
      '<option value="random">随机游走</option></select></div>' +
      wrInputs("ext-wm-motion-wr", w.motion.wr) +
      (isPull
        ? ""
        : "<h4>图片 logo（PNG）</h4>" +
          filePick("ext-wm-image", w.image.fileName) +
          '<div class="field"><label>位置</label><select id="ext-wm-img-pos">' +
          '<option value="br">右下</option><option value="bl">左下</option>' +
          '<option value="tr">右上</option><option value="tl">左上</option></select></div>') +
      '<p class="hint">视频水印可传 MOV / MP4（≤200MB）或 PNG（≤20MB）；固定 / 四角循环 / 移动可同开。新建站点保存后才能正式上传；此处先记下选项与文件名。</p></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-act="back">上一步</button>' +
      '<button type="button" class="btn btn-primary" data-act="next-3">下一步</button></div>'
    );
  }

  function renderStep4() {
    var d = state.data;
    var isPull = state.kind === "pull";
    return (
      stepIndicator(4) +
      (isPull
        ? ""
        : '<div class="ext-wiz-panel"><h4>发布账号（可选）</h4>' +
          '<p class="hint">保存站点时一并创建，之后可在编辑里增删。</p>' +
          '<div class="ext-wiz-grid">' +
          '<div class="field"><label>名称</label><input id="ext-wiz-acc-name" maxlength="100" placeholder="如 主账号" value="' +
          esc(d.initAccountName) +
          '" /></div>' +
          '<div class="field"><label>登录名</label><input id="ext-wiz-acc-user" maxlength="200" autocomplete="off" value="' +
          esc(d.initAccountUsername) +
          '" /></div>' +
          '<div class="field"><label>密码</label><input id="ext-wiz-acc-pass" type="password" maxlength="500" autocomplete="new-password" placeholder="密码" value="' +
          esc(d.initAccountPassword) +
          '" /></div></div></div>') +
      '<div class="field"><label>备注（可选）</label><textarea id="ext-wiz-notes" rows="3" placeholder="选填">' +
      esc(d.notes) +
      "</textarea></div>" +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-act="back">上一步</button>' +
      '<button type="button" class="btn btn-primary" data-act="submit">创建通道</button></div>'
    );
  }

  function renderDone(ext) {
    return (
      '<div class="tg-wiz-done">' +
      '<div class="tg-wiz-done-ico">✓</div>' +
      '<div class="tg-wiz-done-title">外站通道已创建</div>' +
      '<div class="tg-wiz-done-info">' +
      esc(ext.name) +
      " · " +
      (ext.siteKind === "pull" ? "拉取加水印" : "推送站点") +
      " · " +
      esc(ext.code) +
      "<br />状态：待激活" +
      (ext.isActive ? "" : " · 业务开关：停用") +
      "</div></div>" +
      '<div class="modal-actions" style="justify-content:center">' +
      '<button type="button" class="btn btn-primary" data-act="finish">完成</button></div>'
    );
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function readPos(name) {
    var mask = el(MASK_ID);
    if (!mask) return [];
    return Array.prototype.map
      .call(mask.querySelectorAll('input[name="' + name + '"]:checked'), function (n) {
        return n.value;
      });
  }

  function readWr(prefix) {
    return {
      l: (el(prefix + "-l") || {}).value || "",
      p: (el(prefix + "-p") || {}).value || "",
      s: (el(prefix + "-s") || {}).value || ""
    };
  }

  function fileNameOf(id) {
    var n = el(id + "-name");
    if (!n) return "";
    var t = (n.textContent || "").trim();
    return t === "未配置" ? "" : t;
  }

  function collectStep1() {
    var kind = (el("ext-wiz-kind") || {}).value || "push";
    state.kind = kind === "pull" ? "pull" : "push";
    var code = ((el("ext-wiz-code") || {}).value || "").trim().toLowerCase();
    var name = ((el("ext-wiz-name") || {}).value || "").trim();
    var baseUrl = ((el("ext-wiz-base") || {}).value || "").trim();
    if (!name) {
      toast("请填写站点名称");
      return false;
    }
    if (!baseUrl) {
      toast("请填写接口地址");
      return false;
    }
    if (code && !/^[a-z0-9-]+$/.test(code)) {
      toast("站点代码仅支持小写字母、数字与中划线");
      return false;
    }
    state.data.code = code || genCode();
    state.data.name = name;
    state.data.baseUrl = baseUrl;
    state.data.apiPrefix = ((el("ext-wiz-prefix") || {}).value || "/oash/v1").trim() || "/oash/v1";
    state.data.appSecret = ((el("ext-wiz-secret") || {}).value || "").trim();
    state.data.isActive = getSwitch("ext-wiz-active");
    return true;
  }

  function collectStep2(quiet) {
    if (state.kind === "pull") {
      var raw = ((el("ext-wiz-pull-json") || {}).value || "").trim();
      if (!quiet) {
        if (!raw) {
          toast("拉取加水印站点要填接入配置");
          return false;
        }
        try {
          var cfg = JSON.parse(raw);
          if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
            toast("接入配置必须是 JSON 对象");
            return false;
          }
        } catch (e) {
          toast("接入配置不是合法 JSON");
          return false;
        }
      }
      state.data.pull = {
        maxInflight: ((el("ext-wiz-inflight") || {}).value || "").trim(),
        heartbeat: ((el("ext-wiz-hb") || {}).value || "").trim(),
        waitTimeout: ((el("ext-wiz-wait") || {}).value || "").trim(),
        maxAttempts: ((el("ext-wiz-attempts") || {}).value || "").trim(),
        verifySource: getSwitch("ext-wiz-verify"),
        keepResolution: getSwitch("ext-wiz-keep-res"),
        skipTrim: getSwitch("ext-wiz-skip-trim"),
        tolSeconds: ((el("ext-wiz-tol-s") || {}).value || "").trim(),
        tolRatio: ((el("ext-wiz-tol-r") || {}).value || "").trim(),
        resultStorage: (el("ext-wiz-storage") || {}).value || "cdn",
        resultHosts: ((el("ext-wiz-hosts") || {}).value || "").trim(),
        profiles: ((el("ext-wiz-profiles") || {}).value || "").trim(),
        workerId: ((el("ext-wiz-worker") || {}).value || "").trim(),
        requestTimeout: ((el("ext-wiz-req-to") || {}).value || "").trim(),
        reportTimeout: ((el("ext-wiz-rep-to") || {}).value || "").trim(),
        configJson: raw
      };
      return true;
    }
    var extraRaw = ((el("ext-wiz-extra") || {}).value || "").trim();
    if (!quiet && extraRaw) {
      try {
        var extra = JSON.parse(extraRaw);
        if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
          toast("附加字段必须是 JSON 对象");
          return false;
        }
      } catch (e2) {
        toast("附加字段不是合法 JSON");
        return false;
      }
    }
    state.data.autoPush = getSwitch("ext-wiz-auto");
    state.data.requireVideo = getSwitch("ext-wiz-video");
    state.data.generationMode = (el("ext-wiz-gen") || {}).value || "ai";
    state.data.sliceEnabled = getSwitch("ext-wiz-slice");
    state.data.episodes = getSwitch("ext-wiz-episodes");
    state.data.episodeTitleFormat = ((el("ext-wiz-ep-title") || {}).value || "").trim();
    state.data.coverAspect = (el("ext-wiz-cover") || {}).value || "";
    state.data.categoryId = ((el("ext-wiz-cat-id") || {}).value || "").trim();
    state.data.categoryName = ((el("ext-wiz-cat-name") || {}).value || "").trim();
    state.data.publish = getSwitch("ext-wiz-publish");
    state.data.extraJson = extraRaw;
    return true;
  }

  function collectStep3() {
    state.data.dewatermarkEnabled = getSwitch("ext-wiz-dewm");
    state.data.watermark = {
      fixed: {
        positions: readPos("ext-wm-fixed-pos"),
        wr: readWr("ext-wm-fixed-wr"),
        fileName: fileNameOf("ext-wm-fixed")
      },
      cycle: {
        positions: readPos("ext-wm-cycle-pos"),
        wr: readWr("ext-wm-cycle-wr"),
        fileName: fileNameOf("ext-wm-cycle")
      },
      motion: {
        path: (el("ext-wm-path") || {}).value || "diagonal",
        wr: readWr("ext-wm-motion-wr"),
        fileName: fileNameOf("ext-wm-motion")
      },
      image: {
        position: (el("ext-wm-img-pos") || {}).value || "br",
        fileName: fileNameOf("ext-wm-image")
      }
    };
    return true;
  }

  function collectStep4() {
    state.data.notes = ((el("ext-wiz-notes") || {}).value || "").trim();
    if (state.kind !== "pull") {
      state.data.initAccountName = ((el("ext-wiz-acc-name") || {}).value || "").trim();
      state.data.initAccountUsername = ((el("ext-wiz-acc-user") || {}).value || "").trim();
      state.data.initAccountPassword = ((el("ext-wiz-acc-pass") || {}).value || "").trim();
    }
    return true;
  }

  function buildExtRecord() {
    var d = state.data;
    var secret = d.appSecret || "";
    var extra = {};
    if (d.extraJson) {
      try {
        extra = JSON.parse(d.extraJson);
      } catch (e) {
        extra = {};
      }
    }
    var pushConfig = {
      publish: !!d.publish,
      extra: extra,
      episodes: !!d.episodes,
      episodeTitleFormat: d.episodeTitleFormat || "",
      coverAspect: d.coverAspect || "",
      category: {
        id: d.categoryId || null,
        name: d.categoryName || ""
      }
    };
    var initAccount = null;
    if (
      state.kind === "push" &&
      (d.initAccountName || d.initAccountUsername || d.initAccountPassword)
    ) {
      initAccount = {
        name: d.initAccountName || "",
        username: d.initAccountUsername || "",
        passwordSet: !!d.initAccountPassword
      };
    }
    return {
      id: global.FZStore ? FZStore.uid("ext") : "ext_" + Date.now(),
      name: d.name,
      note: d.notes || "",
      notes: d.notes || "",
      status: "pending_activate",
      docReady: true,
      siteKind: state.kind,
      code: d.code,
      baseUrl: d.baseUrl,
      apiPrefix: state.kind === "push" ? d.apiPrefix : "",
      appSecretSet: !!secret,
      appSecretHint: secret ? "••••" + secret.slice(-4) : "",
      isActive: !!d.isActive,
      autoPush: state.kind === "push" ? !!d.autoPush : false,
      requireVideo: state.kind === "push" ? !!d.requireVideo : false,
      generationMode: state.kind === "push" ? d.generationMode || "ai" : "",
      dewatermarkEnabled: !!d.dewatermarkEnabled,
      sliceEnabled: state.kind === "push" ? !!d.sliceEnabled : false,
      pushConfig: state.kind === "push" ? pushConfig : null,
      watermarkConfig: d.watermark,
      pullConfig: state.kind === "pull" ? d.pull : null,
      initAccount: initAccount
    };
  }

  function paintStep(n) {
    state.step = n;
    var body = el("ext-wiz-body");
    if (!body) return;
    if (n === 1) body.innerHTML = renderStep1();
    else if (n === 2) body.innerHTML = state.kind === "pull" ? renderStep2Pull() : renderStep2Push();
    else if (n === 3) body.innerHTML = renderStep3();
    else if (n === 4) body.innerHTML = renderStep4();
    applyStepValues(n);
  }

  function applyStepValues(n) {
    var d = state.data;
    if (n === 1) {
      setSwitch("ext-wiz-active", d.isActive);
      return;
    }
    if (n === 2 && state.kind === "push") {
      setSwitch("ext-wiz-auto", d.autoPush);
      setSwitch("ext-wiz-video", d.requireVideo);
      setSwitch("ext-wiz-slice", d.sliceEnabled);
      setSwitch("ext-wiz-episodes", d.episodes);
      setSwitch("ext-wiz-publish", d.publish);
      if (el("ext-wiz-gen")) el("ext-wiz-gen").value = d.generationMode || "ai";
      if (el("ext-wiz-cover")) el("ext-wiz-cover").value = d.coverAspect || "";
      return;
    }
    if (n === 2 && state.kind === "pull") {
      setSwitch("ext-wiz-verify", d.pull.verifySource);
      setSwitch("ext-wiz-keep-res", d.pull.keepResolution);
      setSwitch("ext-wiz-skip-trim", d.pull.skipTrim);
      if (el("ext-wiz-storage")) el("ext-wiz-storage").value = d.pull.resultStorage || "cdn";
      return;
    }
    if (n === 3) {
      setSwitch("ext-wiz-dewm", d.dewatermarkEnabled);
      if (el("ext-wm-path")) el("ext-wm-path").value = d.watermark.motion.path || "diagonal";
      if (el("ext-wm-img-pos")) el("ext-wm-img-pos").value = d.watermark.image.position || "br";
    }
  }

  function onKindChange() {
    var next = (el("ext-wiz-kind") || {}).value === "pull" ? "pull" : "push";
    state.data.code = ((el("ext-wiz-code") || {}).value || "").trim().toLowerCase() || state.data.code;
    state.data.name = ((el("ext-wiz-name") || {}).value || "").trim();
    state.data.baseUrl = ((el("ext-wiz-base") || {}).value || "").trim();
    state.data.apiPrefix =
      ((el("ext-wiz-prefix") || {}).value || state.data.apiPrefix || "/oash/v1").trim() ||
      "/oash/v1";
    state.data.appSecret = ((el("ext-wiz-secret") || {}).value || "").trim();
    state.kind = next;
    state.data.isActive = next !== "pull";
    paintStep(1);
  }

  function ensureDom() {
    var mask = el(MASK_ID);
    if (mask) return mask;
    mask = document.createElement("div");
    mask.className = "modal-mask";
    mask.id = MASK_ID;
    mask.hidden = true;
    mask.innerHTML =
      '<div class="modal ext-wizard-modal">' +
      '<div class="tg-wiz-head">' +
      '<h2 id="ext-wiz-title">新建外站通道</h2>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="ext-wiz-x" aria-label="关闭">✕</button>' +
      "</div>" +
      '<div class="ext-wiz-scroll" id="ext-wiz-body"></div></div>';
    document.body.appendChild(mask);
    bind(mask);
    return mask;
  }

  function closeFieldTips(except) {
    var mask = el(MASK_ID);
    if (!mask) return;
    mask.querySelectorAll(".field-tip.is-open").forEach(function (node) {
      if (node !== except) node.classList.remove("is-open");
    });
  }

  function close() {
    var mask = el(MASK_ID);
    if (mask) mask.hidden = true;
    state.onSuccess = null;
    state._pending = null;
  }

  function bind(mask) {
    mask.addEventListener("change", function (e) {
      if (e.target && e.target.id === "ext-wiz-kind") onKindChange();
      if (e.target && e.target.type === "file" && e.target.id) {
        var f = e.target.files && e.target.files[0];
        var nameEl = el(e.target.id + "-name");
        if (nameEl) nameEl.textContent = f ? f.name : "未配置";
      }
    });
    mask.addEventListener("click", function (e) {
      if (e.target === mask) {
        closeFieldTips();
        close();
        return;
      }
      var tipBtn = e.target.closest(".field-tip");
      if (tipBtn && mask.contains(tipBtn)) {
        e.preventDefault();
        e.stopPropagation();
        var open = tipBtn.classList.contains("is-open");
        closeFieldTips();
        if (!open) tipBtn.classList.add("is-open");
        return;
      }
      closeFieldTips();

      var sw = e.target.closest(".switch");
      if (sw && mask.contains(sw) && sw.id) {
        setSwitch(sw.id, !sw.classList.contains("on"));
        return;
      }
      var fileBtn = e.target.closest("[data-file]");
      if (fileBtn) {
        var fid = fileBtn.getAttribute("data-file");
        var inp = el(fid);
        if (inp) inp.click();
        return;
      }
      var clearBtn = e.target.closest("[data-clear-file]");
      if (clearBtn) {
        var cid = clearBtn.getAttribute("data-clear-file");
        var cin = el(cid);
        if (cin) cin.value = "";
        var cn = el(cid + "-name");
        if (cn) cn.textContent = "未配置";
        return;
      }

      var t = e.target.closest("[data-act], #ext-wiz-x");
      if (!t) return;
      if (t.id === "ext-wiz-x" || t.getAttribute("data-act") === "close") {
        close();
        return;
      }
      var act = t.getAttribute("data-act");
      if (act === "next-1") {
        if (!collectStep1()) return;
        paintStep(2);
        return;
      }
      if (act === "next-2") {
        if (!collectStep2()) return;
        paintStep(3);
        return;
      }
      if (act === "next-3") {
        if (!collectStep3()) return;
        paintStep(4);
        return;
      }
      if (act === "back") {
        /* 返回不校验，尽量保留已填 */
        if (state.step === 2) {
          collectStep2(true);
          paintStep(1);
        } else if (state.step === 3) {
          collectStep3();
          paintStep(2);
        } else if (state.step === 4) {
          collectStep4();
          paintStep(3);
        }
        return;
      }
      if (act === "submit") {
        if (!collectStep4()) return;
        var ext = buildExtRecord();
        state._pending = ext;
        var body = el("ext-wiz-body");
        if (body) body.innerHTML = renderDone(ext);
        state.step = 5;
        return;
      }
      if (act === "finish") {
        var cb = state.onSuccess;
        var pending = state._pending;
        close();
        if (cb && pending) cb(pending);
      }
    });
  }

  function open(opts) {
    opts = opts || {};
    ensureDom();
    state.onSuccess = typeof opts.onSuccess === "function" ? opts.onSuccess : null;
    state._pending = null;
    state.kind = "push";
    state.data = defaultData();
    var title = el("ext-wiz-title");
    if (title) title.textContent = opts.title || "新建外站通道";
    paintStep(1);
    el(MASK_ID).hidden = false;
    var focus = el("ext-wiz-name");
    if (focus) setTimeout(function () { focus.focus(); }, 30);
  }

  global.FZExtWizard = { open: open, close: close };
})(window);
