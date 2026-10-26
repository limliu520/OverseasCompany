/**
 * 创建项目向导（并集口径：一项目一套内容通道）
 */
(function () {
  FZShell.boot({ active: "projects" });

  var STEPS = [];
  var stepIndex = 0;
  var createdProjectId = "";

  var draft = FZProjectUnion.applyTypeDefaults(
    {
      name: "",
      siteType: "chigua",
      userbotId: "",
      userbotName: "",
      watermarks: FZArticle.defaultWatermarks(),
      wmUseDefault: false,
      wmConfigured: false,
      article: FZArticle.defaultArticle(),
      articleConfigured: false
    },
    "chigua"
  );

  function rebuildSteps() {
    var curId = STEPS[stepIndex] && STEPS[stepIndex].id;
    STEPS = [
      { id: "basic", title: "基本信息", required: true },
      { id: "userbot", title: "采集号" },
      { id: "cover", title: "封面", required: true },
      { id: "watermark", title: "水印" },
      { id: "intro", title: "片头和片尾" },
      { id: "media", title: "图片视频规则" },
      { id: "article", title: "文章管理" },
      { id: "flow", title: "推送规则" }
    ];
    if (!FZProjectUnion.needsArticle(draft.siteType)) {
      STEPS = STEPS.filter(function (s) {
        return s.id !== "article";
      });
    }
    if (curId) {
      var ni = -1;
      for (var i = 0; i < STEPS.length; i++) {
        if (STEPS[i].id === curId) {
          ni = i;
          break;
        }
      }
      stepIndex = ni >= 0 ? ni : Math.min(stepIndex, STEPS.length - 1);
    }
  }

  function renderSteps() {
    document.getElementById("steps").innerHTML = STEPS.map(function (st, i) {
      var cls = "step" + (i === stepIndex ? " active" : i < stepIndex ? " done" : "");
      return (
        '<button type="button" class="' +
        cls +
        '" data-i="' +
        i +
        '"><span class="step-num">' +
        (i + 1) +
        '</span><span class="step-text"><span class="step-title">' +
        st.title +
        (st.required ? " *" : "") +
        "</span></span></button>"
      );
    }).join("");
    document.querySelectorAll("#steps [data-i]").forEach(function (b) {
      b.addEventListener("click", function () {
        collect();
        stepIndex = Number(b.getAttribute("data-i"));
        render();
      });
    });
  }

  function wmSummary() {
    if (!draft.watermarks) return "未配 / 可跳过";
    if (FZMediaConfig.hasWmFile(draft.watermarks)) return "已上传素材";
    if (draft.wmUseDefault) return "默认（稍后可改）";
    if (draft.wmConfigured) return "已调整参数";
    return "未配 / 可跳过";
  }

  function wmDone() {
    return !!(
      draft.watermarks &&
      (FZMediaConfig.hasWmFile(draft.watermarks) ||
        draft.wmUseDefault ||
        draft.wmConfigured)
    );
  }

  function renderSummary() {
    var typeLabel = FZProjectUnion.siteTypeLabel(draft.siteType);
    var artLine = FZProjectUnion.needsArticle(draft.siteType)
      ? "<div>文章管理：" +
        (draft.articleConfigured || (draft.article && draft.article.templateOn)
          ? "已就绪"
          : "未配 / 可跳过") +
        "</div>"
      : "<div>文章管理：短剧站跳过</div>";
    document.getElementById("summary").innerHTML =
      "<div>名称：" +
      (draft.name || "未填") +
      "</div><div>类型：" +
      typeLabel +
      "</div><div>采集号：" +
      (draft.userbotName || "未选/可跳过") +
      "</div><div>封面：" +
      (draft.coverWidth || "—") +
      " × " +
      (draft.coverHeight || "—") +
      "</div><div>水印：" +
      wmSummary() +
      "</div><div>片头片尾：" +
      (FZMediaConfig.hasIntroOutroFile(draft.watermarks) ? "已配" : "未配 / 可跳过") +
      "</div>" +
      artLine +
      "<div>推送方式：" +
      (draft.autoPush || draft.autoflow ? "自动推（接通后生效）" : "待人工") +
      (draft.siteType === "short_drama"
        ? draft.pushAllEpisodes !== false
          ? " · 分集开"
          : " · 分集关"
        : "") +
      "</div><div>Webhook：" +
      (draft.webhookUrl ? "已填" : "未填") +
      "</div>";
  }

  function panelBasic() {
    return (
      '<h2 style="margin:0 0 8px;font-size:18px">基本信息</h2>' +
      '<p class="muted" style="margin:0 0 14px">创建前必填。项目专属 Token 在点击「创建项目」之后才会生成。</p>' +
      '<div class="field"><label>项目名称 *</label><input id="f-name" value="' +
      esc(draft.name) +
      '" placeholder="例如：出海内容站 A" /></div>' +
      '<div class="field"><label>站点类型</label>' +
      FZProjectUnion.renderSiteTypeCards(draft.siteType, "f-type") +
      "</div>"
    );
  }

  function panelUserbot() {
    var st = FZStore.read();
    var list = (st.userbots || []).slice();
    if (draft.userbotId && !list.some(function (b) {
      return b.id === draft.userbotId;
    })) {
      list.unshift({ id: draft.userbotId, name: draft.userbotName || draft.userbotId });
    }
    return (
      '<h2 style="margin:0 0 8px;font-size:18px">采集号（Userbot）</h2>' +
      '<p class="muted" style="margin:0 0 10px">这个项目的 TG 频道，要用哪个号去加、去采？一个项目挂一个采集号；之后在本项目加的频道都只能用这个号。</p>' +
      '<div class="placeholder-doc" style="text-align:left;margin-bottom:14px">' +
      "<strong>怎么选</strong>" +
      '<ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:var(--muted)">' +
      "<li>已有号、还要给本项目加频道 / 采料 → 选已有</li>" +
      "<li>本项目要单独一个号（隔离 / 风控）→ 新建</li>" +
      "<li>本项目暂不采 TG → 选「暂不绑定」或跳过本步</li></ul>" +
      '<p class="hint" style="margin:8px 0 0">有频道后不可轻易换绑：须先解绑本项目全部频道，再更换采集号。</p></div>' +
      '<div id="bot-list">' +
      FZPickCards.renderUserbotSelect({
        bots: list,
        selectedId: draft.userbotId || "",
        state: st,
        project: null,
        allowEmpty: true,
        emptyLabel: "暂不绑定",
        emptyText: "暂无采集号"
      }) +
      "</div>" +
      '<button type="button" class="btn" id="btn-new-bot" style="margin-top:12px">新建采集号</button>'
    );
  }

  function panelCover() {
    return (
      '<h2 style="margin:0 0 8px;font-size:18px">封面</h2>' +
      FZMediaConfig.renderCoverPanel(draft.coverWidth, draft.coverHeight, {
        lead: "只配宽高一套；生成与推送共用。水印 / 图片视频规则在后续步骤。"
      })
    );
  }

  function panelMedia() {
    return (
      '<h2 style="margin:0 0 8px;font-size:18px">图片视频规则</h2>' +
      '<p class="muted" style="margin:0 0 14px">左栏图片输出格式；右栏必须含视频、切片、最短时长。分集在「推送规则」。</p>' +
      FZProjectUnion.renderVideoRulesFields(draft)
    );
  }

  function panelWatermark() {
    if (FZArticle.ensureWatermarks) FZArticle.ensureWatermarks(draft);
    return (
      '<h2 style="margin:0 0 8px;font-size:18px">水印</h2>' +
      FZMediaConfig.renderWatermarkPanel(draft.watermarks, {
        lead: "上下同级两块：去源水印、添加水印（图片 / 视频叠层）。片头片尾在下一步。",
        allowDefault: true,
        showSave: false,
        dewatermarkEnabled: draft.dewatermarkEnabled !== false,
        showDewatermark: true,
        wmAddView: draft.wmAddView || "image"
      })
    );
  }

  function panelIntro() {
    if (FZArticle.ensureWatermarks) FZArticle.ensureWatermarks(draft);
    return (
      '<h2 style="margin:0 0 8px;font-size:18px">片头和片尾</h2>' +
      FZMediaConfig.renderIntroOutroPanel(draft.watermarks, {
        lead: "整段拼接在原片前/后，不是水印。可跳过；有上传才拼接。",
        showSave: false
      })
    );
  }

  function panelArticle() {
    return (
      '<h2 style="margin:0 0 8px;font-size:18px">文章管理</h2>' +
      FZMediaConfig.renderArticlePanel(draft.article, {
        lead: "顶栏切换「AI 文章提示词管理 / 文案内链管理」。提示词默认优先自定义；点卡片切换，开关开才展开（可同开，不可同关）。文案内链独立，与提示词无关。",
        showSave: false,
        showLinks: true,
        artSection: draft.artSection || "prompt",
        artView: draft.artView || "custom"
      })
    );
  }

  function panelFlow() {
    return (
      '<h2 style="margin:0 0 8px;font-size:18px">推送规则</h2>' +
      '<p class="muted" style="margin:0 0 14px">含外站「推送方式」（自动 / 待人工），短剧另含分集。通道接通前不生效。</p>' +
      FZProjectUnion.renderPushRulesFields(draft)
    );
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function collect() {
    var id = STEPS[stepIndex] && STEPS[stepIndex].id;
    if (id === "basic") {
      draft.name = (document.getElementById("f-name") || {}).value || "";
      draft.siteType = (document.getElementById("f-type") || {}).value || draft.siteType || "chigua";
    }
    if (id === "userbot") {
      var botPick = FZPickCards.selectedUserbot(document.getElementById("bot-list"));
      draft.userbotId = botPick.id;
      draft.userbotName = botPick.id ? botPick.name : "";
    }
    if (id === "cover") {
      var cov = FZMediaConfig.collectCover(document);
      draft.coverWidth = cov.coverWidth;
      draft.coverHeight = cov.coverHeight;
      draft.coverAspect = "";
    }
    if (id === "media") FZProjectUnion.collectVideoRules(document, draft);
    if (id === "watermark") {
      if (document.querySelector("[data-media-wm]")) {
        FZMediaConfig.applyWatermarkForm(draft.watermarks, document);
        var dewm = FZMediaConfig.collectDewatermark(document);
        if (dewm != null) draft.dewatermarkEnabled = dewm;
        var wav = document.getElementById("wm-add-view");
        if (wav) draft.wmAddView = wav.value || "image";
      }
    }
    if (id === "article") {
      if (document.querySelector("[data-media-art]")) {
        FZMediaConfig.applyArticleForm(draft.article, document);
        draft.articleConfigured = !FZMediaConfig.validateArticle(draft.article);
        var as = document.getElementById("art-section");
        if (as) draft.artSection = as.value || "prompt";
        var av = document.getElementById("art-view");
        if (av) draft.artView = av.value || "custom";
      }
    }
    if (id === "flow") FZProjectUnion.collectPushRules(document, draft);
  }

  function afterPick() {
    collect();
    renderSummary();
    syncFoot();
  }

  function bindMedia() {
    var coverRoot = document.querySelector("[data-media-cover]");
    if (coverRoot) {
      FZMediaConfig.bindCoverUI(coverRoot, function () {
        afterPick();
      });
    }
    var wmRoot = document.querySelector("[data-media-wm]");
    if (wmRoot) {
      FZMediaConfig.bindWatermarkUI(wmRoot, {
        onSubChange: function (which) {
          draft.wmAddView = which;
        },
        onUpload: function (key, file) {
          var reader = new FileReader();
          reader.onload = function () {
            FZMediaConfig.applyWmUpload(draft.watermarks, key, file, reader.result);
            draft.wmUseDefault = false;
            draft.wmConfigured = true;
            var wav = document.getElementById("wm-add-view");
            if (wav) draft.wmAddView = wav.value || "image";
            FZShell.toast("水印素材已加载", "ok");
            render();
          };
          reader.readAsDataURL(file);
        },
        onRemove: function (key) {
          FZMediaConfig.clearWmUpload(draft.watermarks, key);
          draft.wmUseDefault = false;
          FZShell.toast("已清除", "ok");
          render();
        },
        onUseDefault: function () {
          var io = draft.watermarks && draft.watermarks.introOutro;
          draft.watermarks = FZArticle.defaultWatermarks();
          if (io) draft.watermarks.introOutro = io;
          draft.wmUseDefault = true;
          draft.wmConfigured = true;
          FZShell.toast("已套用默认水印，创建后可在项目详情调整", "ok");
          render();
        },
        onFormChange: function () {
          draft.wmConfigured = true;
          draft.wmUseDefault = false;
          afterPick();
        }
      });
    }
    var ioRoot = document.querySelector("[data-media-io]");
    if (ioRoot) {
      FZMediaConfig.bindIntroOutroUI(ioRoot, {
        onUpload: function (key, file) {
          var reader = new FileReader();
          reader.onload = function () {
            FZMediaConfig.applyWmUpload(draft.watermarks, key, file, reader.result);
            FZShell.toast("片头/片尾已加载", "ok");
            render();
          };
          reader.readAsDataURL(file);
        },
        onRemove: function (key) {
          FZMediaConfig.clearWmUpload(draft.watermarks, key);
          FZShell.toast("已清除", "ok");
          render();
        }
      });
    }
    var artRoot = document.querySelector("[data-media-art]");
    if (artRoot) {
      FZMediaConfig.bindArticleUI(artRoot, {
        onChange: afterPick,
        onAddLink: function () {
          collect();
          draft.artSection = "links";
          var kw = ((document.getElementById("link-kw") || {}).value || "").trim();
          var url = ((document.getElementById("link-url") || {}).value || "").trim();
          if (!kw || !url) {
            FZShell.toast("请填写关键词和链接", "err");
            return;
          }
          if (!draft.article.links) draft.article.links = [];
          draft.article.links.push({ kw: kw, url: url });
          draft.article.linkOn = true;
          render();
        },
        onDelLink: function (i) {
          collect();
          draft.artSection = "links";
          if (draft.article.links) draft.article.links.splice(i, 1);
          draft.article.linkOn = !!(draft.article.links && draft.article.links.length);
          render();
        }
      });
    }
  }

  function onSiteTypeChange(val) {
    collect();
    draft.siteType = val;
    FZProjectUnion.applyTypeDefaults(draft, val);
    if (val === "short_drama") {
      draft.generationMode = "none";
      draft.pushAllEpisodes = true;
      if (!draft.partnerCategoryName) draft.partnerCategoryName = "Short Drama";
    } else {
      draft.pushAllEpisodes = false;
      if (draft.generationMode === "none") draft.generationMode = "ai";
    }
    rebuildSteps();
    render();
  }

  function bind() {
    var botList = document.getElementById("bot-list");
    if (botList) {
      FZPickCards.bindUserbotSelect(botList, {
        onChange: function (id, name) {
          draft.userbotId = id;
          draft.userbotName = id ? name : "";
          afterPick();
        }
      });
    }
    var nb = document.getElementById("btn-new-bot");
    if (nb) {
      nb.addEventListener("click", function () {
        FZTgWizard.open({
          onSuccess: function (bot) {
            var stBot = FZStore.read();
            if (!stBot.userbots) stBot.userbots = [];
            stBot.userbots.push(bot);
            FZStore.write(stBot);
            draft.userbotId = bot.id;
            draft.userbotName = bot.name;
            FZShell.toast("采集号已创建", "ok");
            render();
          }
        });
      });
    }
    FZProjectUnion.bindSiteTypeCards(document, onSiteTypeChange);
    FZProjectUnion.bindGenModeCards(document);
    bindMedia();
  }

  function stepHasContent(stepId) {
    if (stepId === "basic") return !!(draft.name || "").trim();
    if (stepId === "userbot") return !!draft.userbotId;
    if (stepId === "cover") return !FZProjectUnion.validateCover(draft);
    if (stepId === "media") return true;
    if (stepId === "watermark") return wmDone();
    if (stepId === "article") {
      return !!(draft.articleConfigured || !FZMediaConfig.validateArticle(draft.article));
    }
    if (stepId === "flow") {
      return !!(
        draft.autoPush ||
        draft.autoflow ||
        draft.hasCollectSource ||
        (draft.webhookUrl || "").trim()
      );
    }
    return true;
  }

  function requiredHint(step) {
    if (!step) return "请先完成必填项";
    if (step.id === "basic") return "请先填写项目名称";
    if (step.id === "cover") {
      return FZProjectUnion.validateCover(draft) || "请填写封面尺寸";
    }
    return "请先完成必填项";
  }

  function setUnavailable(btn, on, title) {
    if (on) {
      btn.classList.add("is-disabled");
      btn.setAttribute("aria-disabled", "true");
    } else {
      btn.classList.remove("is-disabled");
      btn.removeAttribute("aria-disabled");
    }
    btn.title = title || "";
  }

  function isUnavailable(btn) {
    return btn.classList.contains("is-disabled") || btn.disabled;
  }

  function syncFoot() {
    collect();
    var step = STEPS[stepIndex];
    var last = stepIndex === STEPS.length - 1;
    var prev = document.getElementById("btn-prev");
    var skip = document.getElementById("btn-skip");
    var next = document.getElementById("btn-next");
    var hint = document.getElementById("foot-hint");

    setUnavailable(prev, stepIndex === 0, stepIndex === 0 ? "已是第一步" : "返回上一步");
    next.textContent = last ? "创建项目" : "下一步";
    setUnavailable(skip, false, "");

    if (step.required) {
      skip.style.display = "none";
      var ok = stepHasContent(step.id);
      setUnavailable(next, !ok, ok ? "进入下一步" : requiredHint(step));
      hint.textContent = ok ? "" : requiredHint(step);
    } else if (last) {
      skip.style.display = "";
      skip.textContent = "跳过并创建";
      setUnavailable(next, !draft.name.trim(), "创建项目");
      hint.textContent = stepHasContent(step.id)
        ? ""
        : "本步未填可点「跳过并创建」，或填完后点「创建项目」";
    } else {
      skip.style.display = "";
      skip.textContent = "跳过";
      var filled = stepHasContent(step.id);
      setUnavailable(
        next,
        !filled,
        filled ? "保存本步并继续" : "本步未填写，请点「跳过」或先填写"
      );
      hint.textContent = filled ? "" : "未填写时「下一步」不可用，请点「跳过」";
    }
  }

  function showSuccess(project) {
    createdProjectId = project.id;
    document.getElementById("success-title").textContent = "创建成功";
    document.getElementById("success-lead").textContent =
      "「" +
      project.name +
      "」已创建。通道凭证与对接参数统一在「开发对接」里交给开发配置/联调；接通后运营侧配置才真正生效。";
    var blocks = [
      "开发对接尚未完成：通道凭证、对方收件地址等请在对接页配置",
      project.autoPush || project.autoflow
        ? "推送方式为「自动」，接通前不会真推"
        : "推送方式为「待人工」；接通后可在项目里再改",
      project.webhookUrl
        ? "已填 Webhook，接通后才会按此地址推送事件"
        : "未填业务方 Webhook（可选）"
    ];
    if (!project.hasCollectSource && (project.autoPush || project.autoflow)) {
      blocks.push("自动推送需采集源绑定本项目，请稍后在「采集」中配置");
    }
    document.getElementById("success-blocks").innerHTML =
      '<div style="font-weight:600">当前还不能做的事</div><ul>' +
      blocks
        .map(function (b) {
          return "<li>" + b + "</li>";
        })
        .join("") +
      '</ul><p style="margin:10px 0 0;font-size:12.5px;color:var(--muted)">下一步：把对接材料交给开发，接通后上述能力按你的配置自动生效，运营一般不必再回来配一轮。</p>';
    document.getElementById("success-modal").hidden = false;
    FZShell.toast("项目创建成功", "ok");
  }

  function jumpToStep(id) {
    for (var i = 0; i < STEPS.length; i++) {
      if (STEPS[i].id === id) {
        stepIndex = i;
        return;
      }
    }
  }

  function createProject() {
    collect();
    if (!draft.name.trim()) {
      jumpToStep("basic");
      render();
      FZShell.toast("创建失败：请填写项目名称", "err");
      return;
    }
    var coverErr = FZProjectUnion.validateCover(draft);
    if (coverErr) {
      jumpToStep("cover");
      render();
      FZShell.toast(coverErr, "err");
      return;
    }
    var nextBtn = document.getElementById("btn-next");
    var skipBtn = document.getElementById("btn-skip");
    setUnavailable(nextBtn, true, "创建中");
    setUnavailable(skipBtn, true, "创建中");
    nextBtn.textContent = "创建中…";

    try {
      var st = FZStore.read();
      var id = FZStore.uid("p");
      var siteCode = (draft.siteCode || "").trim() || "site-" + Math.random().toString(36).slice(2, 8);
      var project = {
        id: id,
        name: draft.name.trim(),
        siteType: draft.siteType,
        status: "pending_activate",
        creds: FZStore.issueProjectCreds(id),
        contentActivated: false,
        attachedExtIds: [],
        siteCode: siteCode,
        apiBaseUrl: (draft.apiBaseUrl || "").trim(),
        apiPrefix: draft.apiPrefix || "/oash/v1",
        appSecret: draft.appSecret || "",
        channelNotes: draft.channelNotes || "",
        generationMode: draft.generationMode || "ai",
        requireVideo: !!draft.requireVideo,
        dewatermarkEnabled: !!draft.dewatermarkEnabled,
        sliceEnabled: !!draft.sliceEnabled,
        pushAllEpisodes: !!draft.pushAllEpisodes,
        episodeTitleFormat: draft.episodeTitleFormat || "",
        partnerCategoryId: draft.partnerCategoryId || "",
        partnerCategoryName: draft.partnerCategoryName || "",
        coverAspect: "",
        minVideoSeconds: draft.minVideoSeconds,
        maxEpisodes: draft.maxEpisodes,
        userbotId: draft.userbotId,
        userbotName: draft.userbotName,
        coverWidth: draft.coverWidth || "720",
        coverHeight: draft.coverHeight || "1280",
        watermarks: FZMediaConfig.clone(draft.watermarks),
        article: FZMediaConfig.clone(draft.article),
        watermarkDone: wmDone(),
        templateDone: FZProjectUnion.needsArticle(draft.siteType)
          ? !!(draft.articleConfigured || !FZMediaConfig.validateArticle(draft.article))
          : true,
        autoPush: !!(draft.autoPush || draft.autoflow),
        autoflow: !!(draft.autoPush || draft.autoflow),
        hasCollectSource: !!draft.hasCollectSource,
        webhookUrl: (draft.webhookUrl || "").trim(),
        webhook: !!(draft.webhookUrl || "").trim(),
        boundChannels: []
      };
      FZProjectUnion.normalizeProject(project);

      var wasEmpty = !st.projects.length;
      if (wasEmpty) {
        st.projects = FZStore.seedAfterFirstCreate(st, project);
        st.firstProjectDone = true;
        st.zeroPromptDismissed = true;
      } else {
        st.projects.unshift(project);
      }
      FZStore.write(st);
      showSuccess(project);
    } catch (e) {
      FZShell.toast("创建失败，请重试", "err");
      nextBtn.textContent = "创建项目";
      syncFoot();
    }
  }

  function bindLive() {
    function refreshSide() {
      collect();
      renderSummary();
      syncFoot();
    }
    ["f-name", "site-code", "api-base", "api-prefix", "api-secret", "ch-notes", "cat-id", "cat-name", "hook"].forEach(
      function (fid) {
        var el = document.getElementById(fid);
        if (!el) return;
        el.addEventListener("input", refreshSide);
      }
    );
    ["req-video", "de-wm", "slice", "episodes", "auto-push-on", "auto-push-off", "has-collect", "min-sec", "ep-fmt", "hook"].forEach(
      function (fid) {
        var el = document.getElementById(fid);
        if (!el) return;
        var ev = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input";
        el.addEventListener(ev, refreshSide);
      }
    );
    document.querySelectorAll("[data-gen-mode]").forEach(function (card) {
      card.addEventListener("click", function () {
        setTimeout(refreshSide, 0);
      });
    });
    var botList = document.getElementById("bot-list");
    if (botList) {
      botList.querySelectorAll(".pick-card[data-bot]").forEach(function (card) {
        card.addEventListener("click", function () {
          setTimeout(refreshSide, 0);
        });
      });
    }
  }

  function render() {
    var map = {
      basic: panelBasic,
      userbot: panelUserbot,
      cover: panelCover,
      media: panelMedia,
      watermark: panelWatermark,
      intro: panelIntro,
      article: panelArticle,
      flow: panelFlow
    };
    var step = STEPS[stepIndex];
    document.getElementById("panel").innerHTML = map[step.id]();
    renderSteps();
    renderSummary();
    bind();
    bindLive();
    syncFoot();
  }

  document.getElementById("btn-prev").addEventListener("click", function () {
    if (isUnavailable(this)) {
      FZShell.toast("已是第一步", "err");
      return;
    }
    collect();
    if (stepIndex > 0) {
      stepIndex--;
      render();
    }
  });

  document.getElementById("btn-skip").addEventListener("click", function () {
    if (isUnavailable(this)) {
      FZShell.toast("请稍候", "err");
      return;
    }
    collect();
    var last = stepIndex === STEPS.length - 1;
    if (last) {
      createProject();
      return;
    }
    FZShell.toast("已跳过「" + STEPS[stepIndex].title + "」");
    stepIndex++;
    render();
  });

  document.getElementById("btn-next").addEventListener("click", function () {
    if (isUnavailable(this)) {
      FZShell.toast(
        STEPS[stepIndex].required
          ? requiredHint(STEPS[stepIndex])
          : "本步未填写，请点「跳过」或先完成填写",
        "err"
      );
      return;
    }
    collect();
    if (STEPS[stepIndex].required && !stepHasContent(STEPS[stepIndex].id)) {
      FZShell.toast(requiredHint(STEPS[stepIndex]), "err");
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      stepIndex++;
      render();
    } else {
      createProject();
    }
  });

  document.getElementById("success-go").addEventListener("click", function () {
    FZShell.toast("正在打开开发对接…", "ok");
    location.href = "./project-connect.html?id=" + encodeURIComponent(createdProjectId);
  });
  document.getElementById("success-later").addEventListener("click", function () {
    FZShell.toast("可稍后在待办或项目列表进入对接", "ok");
    location.href = "./projects.html";
  });

  rebuildSteps();
  render();
})();
