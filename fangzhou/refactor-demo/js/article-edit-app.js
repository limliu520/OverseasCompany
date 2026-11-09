/* 文章编辑 · 正文 / AI / 发布属性 / 素材 / 预览推送 */
(function () {
  FZShell.boot({ active: "e_art" });

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var params = new URLSearchParams(location.search);
  var id = Number(params.get("id") || 0);
  var article = FZArticles.get(id);
  var editor = document.getElementById("art-editor");

  if (!article) {
    document.getElementById("art-edit-id").textContent = "#—";
    editor.textContent =
      "未找到文章 #" + (params.get("id") || "") + "。请从列表重新进入。";
    FZShell.toast("文章不存在", "err");
    return;
  }
  if (article.siteType === "short_drama") {
    FZShell.toast("短剧项目不进文章编辑", "err");
    location.href = "./articles.html";
    return;
  }

  function hasPushHistory(a) {
    return !!(a && (a.hasManualVersion || a.prevBodyHtml || a.prevTitle));
  }

  function paintStatus() {
    var st = FZArticles.statusMeta(article.status);
    var badge = document.getElementById("art-edit-status");
    badge.className = "badge " + st.cls;
    badge.textContent = st.text;
    var cmp = document.getElementById("art-btn-compare");
    if (cmp) cmp.hidden = !hasPushHistory(article);
  }

  document.getElementById("art-edit-id").textContent = "#" + article.id;
  paintStatus();

  var titleEl = document.getElementById("art-title");
  titleEl.value = article.title || "";
  function fitTitle() {
    titleEl.style.height = "0px";
    titleEl.style.height = Math.max(36, titleEl.scrollHeight) + "px";
  }
  fitTitle();
  titleEl.addEventListener("input", fitTitle);

  document.getElementById("art-site-hint").textContent =
    article.siteType === "video" ? "视频站 · 文+视频为主" : "瓜站 · 图文混排";
  editor.innerHTML = article.bodyHtml || FZArticles.DEMO_BODY;

  function refreshCount() {
    var text = (editor.innerText || "").replace(/\s+/g, "");
    document.getElementById("art-char-count").textContent = text.length + " 字";
  }
  refreshCount();
  editor.addEventListener("input", refreshCount);

  /* —— 文章素材 —— */
  var matAssets = [
    { id: "1", kind: "image", label: "封面", tone: "#dbeafe", isCover: true },
    { id: "2", kind: "image", label: "图 2", tone: "#fce7f3" },
    { id: "3", kind: "image", label: "图 3", tone: "#dcfce7" },
    { id: "4", kind: "image", label: "图 4", tone: "#fef3c7" },
    { id: "5", kind: "video", label: "视频", tone: "#e0e7ff" }
  ];
  function findMat(mid) {
    return (
      matAssets.find(function (a) {
        return a.id === String(mid);
      }) || null
    );
  }

  function insertMat(mid) {
    var a = findMat(mid);
    if (!a) return;
    var block =
      a.kind === "video"
        ? '<p class="art-embed art-embed--video" contenteditable="false">▶ ' +
          esc(a.label) +
          "</p>"
        : '<p class="art-embed art-embed--image" contenteditable="false">🖼 ' +
          esc(a.label) +
          "</p>";
    editor.focus();
    try {
      document.execCommand("insertHTML", false, block);
    } catch (err) {
      editor.insertAdjacentHTML("beforeend", block);
    }
    refreshCount();
    FZShell.toast("已插入「" + a.label + "」", "ok");
  }

  function paintMatPanel() {
    var idBtn = document.getElementById("art-btn-source");
    var mid = article.materialId;
    if (mid) {
      idBtn.textContent = "#" + mid;
      idBtn.hidden = false;
      idBtn.disabled = false;
    } else {
      idBtn.textContent = "无原素材";
      idBtn.disabled = true;
    }
    document.getElementById("art-mat-thumbs").innerHTML = matAssets
      .map(function (a) {
        return (
          '<div class="art-mat-thumb' +
          (a.isCover ? " is-cover" : "") +
          '" draggable="true" data-mat-id="' +
          a.id +
          '" style="--mat-tone:' +
          a.tone +
          '">' +
          '<div class="art-mat-thumb-media">' +
          '<button type="button" class="art-mat-thumb-preview" data-mat-zoom="' +
          a.id +
          '" title="点击放大" aria-label="放大查看">' +
          (a.kind === "video" ? '<span class="art-mat-thumb-play">▶</span>' : "") +
          "</button>" +
          '<div class="art-mat-thumb-shade">' +
          '<span class="art-mat-thumb-name">' +
          esc(a.label) +
          "</span></div></div>" +
          '<div class="art-mat-thumb-acts">' +
          '<button type="button" class="art-mat-thumb-btn" data-mat-insert="' +
          a.id +
          '">插入正文</button>' +
          '<button type="button" class="art-mat-thumb-btn" data-mat-save="' +
          a.id +
          '">保存</button>' +
          "</div></div>"
        );
      })
      .join("");
  }
  paintMatPanel();

  var zoomMask = document.getElementById("art-mat-zoom");
  var zoomStage = document.getElementById("art-mat-zoom-stage");
  function openMatZoom(mid) {
    var a = findMat(mid);
    if (!a) return;
    zoomStage.innerHTML =
      '<div class="art-mat-zoom-view" style="background:' +
      a.tone +
      '">' +
      (a.kind === "video" ? "▶ " + esc(a.label) : "🖼 " + esc(a.label)) +
      "</div>";
    zoomMask.hidden = false;
  }
  function closeMatZoom() {
    zoomMask.hidden = true;
    zoomStage.innerHTML = "";
  }
  document.getElementById("art-mat-zoom-close").addEventListener("click", closeMatZoom);
  zoomMask.addEventListener("click", function (e) {
    if (e.target === zoomMask) closeMatZoom();
  });

  function openSource() {
    if (!article.materialId) {
      FZShell.toast("当前文章没有关联素材", "err");
      return;
    }
    if (!window.FZMatDetail) {
      FZShell.toast("素材详情组件未加载", "err");
      return;
    }
    var m = FZArticles.buildSourceMaterial(article);
    FZMatDetail.open(m.id, [m], { previewOnly: true });
  }
  document.getElementById("art-btn-source").addEventListener("click", openSource);

  (function bindMatTargetsClose() {
    var targetsMask = document.getElementById("mat-targets-mask");
    if (!targetsMask || targetsMask._artBound) return;
    targetsMask._artBound = true;
    targetsMask.addEventListener("click", function (e) {
      if (e.target === targetsMask || e.target.closest("[data-targets-close]")) {
        targetsMask.hidden = true;
      }
    });
  })();

  /* 桌面左右分栏各自滚动（CSS 控高）；清掉旧版「左侧跟右侧同高」的内联高度 */
  (function clearLegacyWriteHeight() {
    var surface = document.querySelector(".art-write-surface");
    if (!surface) return;
    surface.style.height = "";
    surface.style.minHeight = "";
  })();

  document.getElementById("art-mat-thumbs").addEventListener("click", function (e) {
    var ins = e.target.closest("[data-mat-insert]");
    if (ins) {
      e.preventDefault();
      e.stopPropagation();
      insertMat(ins.getAttribute("data-mat-insert"));
      return;
    }
    var save = e.target.closest("[data-mat-save]");
    if (save) {
      e.preventDefault();
      e.stopPropagation();
      var sa = findMat(save.getAttribute("data-mat-save"));
      FZShell.toast(
        "已保存「" + ((sa && sa.label) || "素材") + "」到素材库（Demo）",
        "ok"
      );
      return;
    }
    var zoom = e.target.closest("[data-mat-zoom]");
    if (zoom) {
      e.preventDefault();
      openMatZoom(zoom.getAttribute("data-mat-zoom"));
    }
  });

  document.getElementById("art-mat-thumbs").addEventListener("dragstart", function (e) {
    var card = e.target.closest("[data-mat-id]");
    if (!card || !e.dataTransfer) return;
    e.dataTransfer.setData("text/fangzhou-mat", card.getAttribute("data-mat-id"));
    e.dataTransfer.setData("text/plain", card.getAttribute("data-mat-id"));
    e.dataTransfer.effectAllowed = "copy";
    card.classList.add("is-dragging");
  });
  document.getElementById("art-mat-thumbs").addEventListener("dragend", function (e) {
    var card = e.target.closest("[data-mat-id]");
    if (card) card.classList.remove("is-dragging");
  });

  editor.addEventListener("dragover", function (e) {
    if (
      e.dataTransfer &&
      (e.dataTransfer.types.indexOf("text/fangzhou-mat") >= 0 ||
        e.dataTransfer.types.indexOf("text/plain") >= 0)
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      editor.classList.add("is-mat-drop");
    }
  });
  editor.addEventListener("dragleave", function () {
    editor.classList.remove("is-mat-drop");
  });
  editor.addEventListener("drop", function (e) {
    editor.classList.remove("is-mat-drop");
    var mid =
      (e.dataTransfer && e.dataTransfer.getData("text/fangzhou-mat")) ||
      (e.dataTransfer && e.dataTransfer.getData("text/plain"));
    if (!mid || !findMat(mid)) return;
    e.preventDefault();
    insertMat(mid);
  });

  /* —— 稿签 + AI —— */
  var drafts = [
    {
      id: "d1",
      label: "主稿 · 设问标题",
      title: article.title || "主稿标题",
      body:
        article.bodyHtml ||
        FZArticles.DEMO_BODY
    },
    {
      id: "d2",
      label: "备稿 · 事件推进",
      title: "事件持续发酵，多方回应陆续披露",
      body:
        "<p>事件仍在推进中。属地部门表示已成立工作专班，对涉事人员与现场情况逐一核查。</p>" +
        "<p>网民关注点集中在时间线是否完整、是否存在瞒报。截至发稿，尚无最终调查结论。</p>"
    },
    {
      id: "d3",
      label: "备稿 · 人物视角",
      title: "目击者讲述：当时场面一度失控",
      body:
        "<p>一位不愿具名的目击者称，冲突爆发突然，围观者迅速聚集，有人试图劝阻未果。</p>" +
        "<p>相关人士回应称「细节仍在核实」，提醒公众勿传播未经证实的视频。</p>"
    },
    {
      id: "d4",
      label: "备稿 · 短平快",
      title: "现场已管控，官方称正在核查",
      body:
        "<p>今日下午，相关事件引发关注。属地通报称已派人到场，现场秩序逐步恢复。</p>" +
        "<p>官方尚未发布最终结论，后续进展待更新。</p>"
    },
    {
      id: "d5",
      label: "备稿 · 悬念收束",
      title: "调查仍在继续，结论何时公布？",
      body:
        "<p>从爆发到通报，再到「正在核查」，公众等待的是一份可核对的时间线与责任说明。</p>" +
        "<p>在最终结论公布前，本报仅呈现已核实信息，不臆测动机与定性。</p>"
    }
  ];
  var activeDraft = drafts[0].id;

  function paintDraftTabs() {
    var box = document.getElementById("art-ai-tabs");
    if (!box) return;
    box.innerHTML = drafts
      .map(function (d) {
        return (
          '<button type="button" class="art-ai-tab' +
          (d.id === activeDraft ? " is-on" : "") +
          '" data-draft="' +
          d.id +
          '">' +
          esc(d.label) +
          "</button>"
        );
      })
      .join("");
  }

  function applyDraft(draftId, silent) {
    var d = drafts.find(function (x) {
      return x.id === draftId;
    });
    if (!d) return;
    activeDraft = d.id;
    titleEl.value = d.title;
    fitTitle();
    editor.innerHTML = d.body;
    refreshCount();
    paintDraftTabs();
    if (!silent) FZShell.toast("已写入「" + d.label + "」", "ok");
  }

  paintDraftTabs();
  document.getElementById("art-ai-tabs").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-draft]");
    if (!btn) return;
    applyDraft(btn.getAttribute("data-draft"));
  });

  /* —— AI 内联展开 —— */
  var aiPanel = document.getElementById("art-ai-panel");
  var aiBtn = document.getElementById("art-btn-ai");
  var aiRun = document.getElementById("art-ai-run");
  var aiStatus = document.getElementById("art-ai-status");
  var aiPrompt = document.getElementById("art-ai-prompt");
  var aiBusy = false;
  var aiTimer = 0;

  function setAiBusy(on) {
    aiBusy = !!on;
    aiPanel.classList.toggle("is-busy", aiBusy);
    aiRun.disabled = aiBusy;
    aiRun.textContent = aiBusy ? "生成中…" : "生成";
    aiPrompt.disabled = aiBusy;
    document.querySelectorAll("[data-regen]").forEach(function (b) {
      b.disabled = aiBusy;
    });
    aiStatus.textContent = aiBusy ? "正在生成草稿…" : "";
  }

  function openAi() {
    aiPanel.hidden = false;
    aiBtn.classList.add("is-on");
    aiBtn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(function () {
      aiPanel.classList.add("is-open");
      try {
        aiPrompt.focus();
      } catch (err) {}
    });
  }

  function closeAi() {
    if (aiTimer) {
      clearTimeout(aiTimer);
      aiTimer = 0;
    }
    setAiBusy(false);
    aiPanel.classList.remove("is-open");
    aiBtn.classList.remove("is-on");
    aiBtn.setAttribute("aria-expanded", "false");
    setTimeout(function () {
      if (!aiPanel.classList.contains("is-open")) aiPanel.hidden = true;
    }, 180);
  }

  aiBtn.setAttribute("aria-expanded", "false");
  aiBtn.setAttribute("aria-controls", "art-ai-panel");
  aiBtn.addEventListener("click", function () {
    if (aiPanel.classList.contains("is-open")) closeAi();
    else openAi();
  });

  document.querySelectorAll("[data-regen]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (aiBusy) return;
      document.querySelectorAll("[data-regen]").forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
    });
  });

  aiRun.addEventListener("click", function () {
    if (aiBusy) return;
    setAiBusy(true);
    if (aiTimer) clearTimeout(aiTimer);
    aiTimer = setTimeout(function () {
      aiTimer = 0;
      var mode =
        (document.querySelector("[data-regen].is-on") || {}).getAttribute &&
        document.querySelector("[data-regen].is-on").getAttribute("data-regen");
      var hint = (aiPrompt.value || "").trim();
      var genId = "d" + (drafts.length + 1);
      var genLabel = mode === "patch" ? "备稿 · 当前稿改写" : "备稿 · 整篇重写";
      var genTitle =
        (hint ? hint.slice(0, 24) + (hint.length > 24 ? "…" : "") : "") ||
        (mode === "patch"
          ? (titleEl.value || article.title || "改写稿") + "（改写）"
          : "AI 新稿 · " + (article.projectName || "演示"));
      var genBody =
        mode === "patch"
          ? "<p>（基于当前稿修改）" +
            esc(hint || "已按指令调整语气与篇幅") +
            "。</p>" +
            editor.innerHTML
          : "<p>AI 整篇重写结果（Demo）。" +
            (hint ? "指令：" + esc(hint) + "。" : "") +
            "</p>" +
            FZArticles.DEMO_BODY;
      drafts.push({ id: genId, label: genLabel, title: genTitle, body: genBody });
      applyDraft(genId, true);
      setAiBusy(false);
      FZShell.toast("已生成并写入「" + genLabel + "」", "ok");
      closeAi();
    }, 1200);
  });

  /* —— 封面：本地图片 / 拼图封面；改过后才出现「恢复默认」 —— */
  var CC_LABELS_BY_N = {
    1: ["整图"],
    2: ["左", "右"],
    3: ["左", "中", "右"]
  };

  function resolveCoverProject() {
    try {
      var stAll = FZStore.read();
      var hit = (stAll.projects || []).find(function (p) {
        return p.id === article.projectId;
      });
      if (hit && window.FZProjectUnion && FZProjectUnion.normalizeProject) {
        FZProjectUnion.normalizeProject(hit);
      }
      return hit || null;
    } catch (e) {
      return null;
    }
  }

  function clampCoverPanels(n) {
    n = Number(n);
    if (n !== 1 && n !== 2 && n !== 3) return 3;
    return n;
  }

  function coverPanelCount() {
    var p = resolveCoverProject();
    return clampCoverPanels(p ? p.coverPanelCount : 3);
  }

  /** 本次弹层默认：本篇已保存拼图优先，否则跟项目配置 */
  function sessionCoverPanelCount() {
    if (article.coverKind === "custom" && article.customPanelCount) {
      return clampCoverPanels(article.customPanelCount);
    }
    if (article.customCells && article.customCells.length) {
      return clampCoverPanels(article.customCells.length);
    }
    return coverPanelCount();
  }

  function coverSizeLabel() {
    var p = resolveCoverProject();
    var w = (p && Number(p.coverWidth)) || 960;
    var h = (p && Number(p.coverHeight)) || 540;
    return w + "×" + h;
  }

  function coverCustomHint(n) {
    var size = coverSizeLabel();
    var projN = coverPanelCount();
    var follow =
      n === projN
        ? "（与项目默认一致）"
        : "（项目默认" + ({ 1: "单", 2: "二", 3: "三" }[projN] || "") + "拼图，本次已改）";
    if (n === 1) {
      return (
        "按项目封面尺寸 " +
        size +
        " 使用单格整图（单拼图）" +
        follow +
        "。点击空格添加图片。有图后才能保存。"
      );
    }
    if (n === 2) {
      return (
        "按项目封面尺寸 " +
        size +
        " 均分为左、右两格（二拼图）" +
        follow +
        "。点击空格添加图片。两格都有图才能保存。"
      );
    }
    return (
      "按项目封面尺寸 " +
      size +
      " 均分为左、中、右三格（三拼图）" +
      follow +
      "。点击空格添加图片。三格都有图才能保存。"
    );
  }

  function syncCcHint() {
    var el = document.getElementById("art-cc-hint");
    if (!el || !ccState) return;
    el.textContent =
      coverCustomHint(ccState.panelN) +
      " 已填格：无极缩放 / 无极旋转；放大后可拖动挪位；滚轮也可缩放。";
  }

  function syncCcPanelSeg() {
    var seg = document.getElementById("art-cc-panel-seg");
    if (!seg || !ccState) return;
    seg.querySelectorAll("[data-cc-panels]").forEach(function (b) {
      var on = Number(b.getAttribute("data-cc-panels")) === ccState.panelN;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-checked", on ? "true" : "false");
    });
  }

  function resizeCcCells(n) {
    n = clampCoverPanels(n);
    var prev = (ccState && ccState.cells) || [];
    var out = [];
    var i;
    for (i = 0; i < n; i++) {
      out.push(normalizeCcCell(prev[i] || null));
    }
    return out;
  }

  function setCcPanelN(n) {
    if (!ccState) return;
    n = clampCoverPanels(n);
    if (n === ccState.panelN) return;
    ccState.panelN = n;
    ccState.cells = resizeCcCells(n);
    if (ccState.active >= n) ccState.active = -1;
    if (ccState.view !== "frame") ccState.view = "frame";
    syncCcPanelSeg();
    syncCcHint();
    renderCustomCover();
  }
  var coverPreview = document.getElementById("art-cover-preview");
  var coverStatus = document.getElementById("art-cover-status");
  var coverRestore = document.getElementById("art-cover-restore");
  var defaultMat = matAssets.find(function (a) {
    return a.isCover;
  }) || matAssets[0];
  var baseCover = {
    tone: (defaultMat && defaultMat.tone) || "#dbeafe",
    label: "默认封面"
  };
  if (!article.coverKind) {
    article.coverKind = "default";
    article.coverTone = article.coverTone || baseCover.tone;
    article.coverLabel = article.coverLabel || baseCover.label;
    article.baseCoverTone = baseCover.tone;
    article.baseCoverLabel = baseCover.label;
  }
  if (!article.baseCoverTone) {
    article.baseCoverTone = baseCover.tone;
    article.baseCoverLabel = baseCover.label;
  }

  function paintCover() {
    var tone = article.coverTone || article.baseCoverTone || baseCover.tone;
    var label = article.coverLabel || "封面";
    var changed = article.coverKind === "custom" || article.coverKind === "local";
    coverPreview.style.background = tone;
    if (article.coverKind === "custom" && article.customCells) {
      var pn = clampCoverPanels(
        article.customPanelCount || article.customCells.length || 3
      );
      coverPreview.innerHTML =
        '<div class="art-cover-tri" data-panels="' +
        pn +
        '">' +
        article.customCells
          .slice(0, pn)
          .map(function (c) {
            return (
              '<i style="background:' +
              esc((c && c.tone) || "#e4e4e7") +
              '"></i>'
            );
          })
          .join("") +
        "</div><span>" +
        esc(label) +
        "</span>";
    } else {
      coverPreview.innerHTML = "<span>" + esc(label) + "</span>";
    }
    coverPreview.classList.add("has-cover");
    if (coverRestore) coverRestore.hidden = !changed;
    if (coverStatus) {
      if (article.coverKind === "custom") {
        coverStatus.textContent = "已用拼图封面（可再换）";
      } else if (article.coverKind === "local") {
        coverStatus.textContent = "已用本地图片（可再换）";
      } else {
        coverStatus.textContent = "跟随项目默认";
      }
    }
  }
  paintCover();

  var coverFile = document.getElementById("art-cover-file");
  document.getElementById("art-cover-pick").addEventListener("click", function () {
    if (coverFile) coverFile.click();
  });
  if (coverFile) {
    coverFile.addEventListener("change", function () {
      var f = coverFile.files && coverFile.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) {
        FZShell.toast("请选择图片文件", "err");
        coverFile.value = "";
        return;
      }
      article.coverKind = "local";
      article.customCells = null;
      article.customPanelCount = null;
      article.coverTone = "#c7d2fe";
      article.coverLabel =
        f.name.replace(/\.[^.]+$/, "").slice(0, 20) || "本地封面";
      paintCover();
      FZShell.toast("已选择本地封面「" + article.coverLabel + "」", "ok");
      coverFile.value = "";
    });
  }

  if (coverRestore) {
    coverRestore.addEventListener("click", function () {
      if (article.coverKind === "default" && !article.customCells) {
        FZShell.toast("当前已是默认封面", "err");
        return;
      }
      article.coverKind = "default";
      article.customCells = null;
      article.customPanelCount = null;
      article.coverTone = article.baseCoverTone || baseCover.tone;
      article.coverLabel = article.baseCoverLabel || baseCover.label;
      paintCover();
      FZShell.toast("已恢复为默认封面，保存文章后生效", "ok");
    });
  }

  /* 拼图封面弹窗 · 每格：无极缩放 / 无极旋转 / 拖动挪位 / 删除 */
  var ccMask = document.getElementById("art-cc-mask");
  var ccBody = document.getElementById("art-cc-body");
  var ccSave = document.getElementById("art-cc-save");
  var ccFile = document.getElementById("art-cc-file");
  var ccState = null;
  var ccDrag = null;
  var CC_ZOOM_MIN = 1;
  var CC_ZOOM_MAX = 4;

  function closeCustomCover() {
    if (ccMask) ccMask.hidden = true;
    ccState = null;
    ccDrag = null;
  }

  function normalizeCcCell(raw) {
    if (!raw) return null;
    var scale = Number(raw.scale);
    if (!isFinite(scale)) scale = 1;
    scale = Math.min(CC_ZOOM_MAX, Math.max(CC_ZOOM_MIN, scale));
    var rotate = Number(raw.rotate);
    if (!isFinite(rotate)) rotate = 0;
    rotate = ((rotate % 360) + 360) % 360;
    var ox = Number(raw.ox);
    var oy = Number(raw.oy);
    if (!isFinite(ox)) ox = 0;
    if (!isFinite(oy)) oy = 0;
    return {
      id: raw.id,
      tone: raw.tone,
      label: raw.label,
      scale: scale,
      rotate: rotate,
      ox: ox,
      oy: oy
    };
  }

  function ccTransformCss(c) {
    return (
      "translate(" +
      (c.ox || 0) +
      "px," +
      (c.oy || 0) +
      "px) rotate(" +
      (c.rotate || 0) +
      "deg) scale(" +
      (c.scale || 1) +
      ")"
    );
  }

  function ccZoomLabel(scale) {
    return Math.round((Number(scale) || 1) * 100) + "%";
  }

  function ccRotateLabel(deg) {
    return Math.round(Number(deg) || 0) + "°";
  }

  function clampCcPan(c, cellEl) {
    if (!c) return;
    var scale = c.scale || 1;
    if (scale <= 1.001) {
      c.ox = 0;
      c.oy = 0;
      return;
    }
    var w = cellEl && cellEl.clientWidth ? cellEl.clientWidth : 240;
    var h = cellEl && cellEl.clientHeight ? cellEl.clientHeight : 240;
    var maxX = w * (0.2 + (scale - 1) * 0.45);
    var maxY = h * (0.2 + (scale - 1) * 0.45);
    c.ox = Math.max(-maxX, Math.min(maxX, Number(c.ox) || 0));
    c.oy = Math.max(-maxY, Math.min(maxY, Number(c.oy) || 0));
  }

  function applyCcCellTransform(i) {
    if (!ccState || !ccBody) return;
    var c = ccState.cells[i];
    var cell = ccBody.querySelector('.art-cc-cell[data-cc-cell="' + i + '"]');
    var media = ccBody.querySelector('.art-cc-media[data-cc-i="' + i + '"]');
    if (!c || !media) return;
    clampCcPan(c, cell);
    media.style.transform = ccTransformCss(c);
    media.classList.toggle("is-pannable", (c.scale || 1) > 1.001);
    var zVal = ccBody.querySelector('.art-cc-zoom-val[data-cc-i="' + i + '"]');
    var zRange = ccBody.querySelector('input[data-cc-zoom="' + i + '"]');
    var rVal = ccBody.querySelector('.art-cc-rot-val[data-cc-i="' + i + '"]');
    var rRange = ccBody.querySelector('input[data-cc-rotate="' + i + '"]');
    if (zVal) zVal.textContent = ccZoomLabel(c.scale);
    if (zRange && String(zRange.value) !== String(c.scale)) zRange.value = String(c.scale);
    if (rVal) rVal.textContent = ccRotateLabel(c.rotate);
    if (rRange && String(rRange.value) !== String(c.rotate)) rRange.value = String(c.rotate);
  }

  function setCcZoom(i, scale) {
    var c = ccState && ccState.cells[i];
    if (!c) return;
    c.scale = Math.min(
      CC_ZOOM_MAX,
      Math.max(CC_ZOOM_MIN, Number(scale) || 1)
    );
    applyCcCellTransform(i);
  }

  function setCcRotate(i, deg) {
    var c = ccState && ccState.cells[i];
    if (!c) return;
    var n = Number(deg);
    if (!isFinite(n)) n = 0;
    c.rotate = ((n % 360) + 360) % 360;
    applyCcCellTransform(i);
  }

  function renderCustomCover() {
    if (!ccState || !ccBody) return;
    var filled = ccState.cells.every(Boolean);
    ccSave.disabled = ccState.busy || ccState.view !== "frame" || !filled;
    ccSave.textContent = ccState.busy ? "生成中…" : "保存";

    if (ccState.view === "source") {
      var srcLabels = CC_LABELS_BY_N[ccState.panelN] || CC_LABELS_BY_N[3];
      ccBody.innerHTML =
        '<div class="art-cc-source"><b>选择图片来源 · ' +
        srcLabels[ccState.active] +
        (ccState.panelN === 1 ? "" : "格") +
        "</b>" +
        '<button type="button" class="art-cc-source-opt" data-cc-lib="1">素材库<span>本篇素材里的图片</span></button>' +
        '<button type="button" class="art-cc-source-opt" data-cc-local="1">本地上传<span>jpg、png、webp，一次一张</span></button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-cc-back="1">返回</button></div>';
      return;
    }
    if (ccState.view === "library") {
      var imgs = matAssets.filter(function (a) {
        return a.kind === "image";
      });
      ccBody.innerHTML =
        '<div class="art-cc-lib-head"><b>素材库 · 图片素材</b>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-cc-back="1">返回</button></div>' +
        (imgs.length
          ? '<div class="art-cc-lib-grid">' +
            imgs
              .map(function (a) {
                return (
                  '<button type="button" class="art-cc-lib-item" data-cc-fill="' +
                  esc(a.id) +
                  '" style="background:' +
                  esc(a.tone) +
                  '" title="' +
                  esc(a.label) +
                  '"><span>' +
                  esc(a.label) +
                  "</span></button>"
                );
              })
              .join("") +
            "</div>"
          : '<div class="empty-state"><div class="empty-state-text">本篇素材里没有图片，可以用本地上传</div></div>');
      return;
    }

    var frameLabels = CC_LABELS_BY_N[ccState.panelN] || CC_LABELS_BY_N[3];
    ccBody.innerHTML =
      '<div class="art-cc-frame" data-panels="' +
      ccState.panelN +
      '">' +
      ccState.cells
        .map(function (c, i) {
          if (c) {
            return (
              '<div class="art-cc-cell" data-cc-cell="' +
              i +
              '">' +
              '<div class="art-cc-media' +
              ((c.scale || 1) > 1.001 ? " is-pannable" : "") +
              '" data-cc-i="' +
              i +
              '" style="background:' +
              esc(c.tone) +
              ";transform:" +
              ccTransformCss(c) +
              '"></div>' +
              '<span class="art-cc-cell-name">' +
              esc(c.label) +
              "</span>" +
              '<div class="art-cc-tools" data-stop-cc="1">' +
              '<label class="art-cc-zoom-wrap">' +
              "<span>缩放</span>" +
              '<input type="range" min="' +
              CC_ZOOM_MIN +
              '" max="' +
              CC_ZOOM_MAX +
              '" step="0.01" value="' +
              esc(c.scale) +
              '" data-cc-zoom="' +
              i +
              '" aria-label="缩放" />' +
              '<span class="art-cc-zoom-val" data-cc-i="' +
              i +
              '">' +
              ccZoomLabel(c.scale) +
              "</span></label>" +
              '<label class="art-cc-zoom-wrap">' +
              "<span>旋转</span>" +
              '<input type="range" min="0" max="360" step="1" value="' +
              esc(c.rotate) +
              '" data-cc-rotate="' +
              i +
              '" aria-label="旋转" />' +
              '<span class="art-cc-rot-val" data-cc-i="' +
              i +
              '">' +
              ccRotateLabel(c.rotate) +
              "</span></label>" +
              '<div class="art-cc-tools-btns">' +
              '<button type="button" data-cc-clear="' +
              i +
              '">删除</button>' +
              "</div></div></div>"
            );
          }
          return (
            '<button type="button" class="art-cc-cell art-cc-empty" data-cc-pick="' +
            i +
            '"><span class="art-cc-plus">+</span><span>' +
            frameLabels[i] +
            (ccState.panelN === 1 ? "" : " · ") +
            "添加图片</span></button>"
          );
        })
        .join("") +
      "</div>";
  }

  function openCustomCover() {
    var n = sessionCoverPanelCount();
    var saved = article.customCells || [];
    ccState = {
      view: "frame",
      active: -1,
      busy: false,
      panelN: n,
      cells: (function () {
        var out = [];
        var i;
        for (i = 0; i < n; i++) {
          out.push(normalizeCcCell(saved[i] || null));
        }
        return out;
      })()
    };
    syncCcPanelSeg();
    syncCcHint();
    ccMask.hidden = false;
    renderCustomCover();
  }

  document.getElementById("art-cover-custom").addEventListener("click", openCustomCover);
  document.getElementById("art-cc-close").addEventListener("click", closeCustomCover);
  document.getElementById("art-cc-cancel").addEventListener("click", closeCustomCover);
  var ccPanelSeg = document.getElementById("art-cc-panel-seg");
  if (ccPanelSeg) {
    ccPanelSeg.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cc-panels]");
      if (!b || !ccState || ccState.busy) return;
      setCcPanelN(b.getAttribute("data-cc-panels"));
    });
  }
  /* 编辑弹窗：点遮罩不关闭（modal-mask-dismiss） */

  ccBody.addEventListener("click", function (e) {
    if (!ccState) return;
    var pick = e.target.closest("[data-cc-pick]");
    if (pick) {
      ccState.active = Number(pick.getAttribute("data-cc-pick"));
      ccState.view = "source";
      renderCustomCover();
      return;
    }
    var clear = e.target.closest("[data-cc-clear]");
    if (clear) {
      ccState.cells[Number(clear.getAttribute("data-cc-clear"))] = null;
      renderCustomCover();
      return;
    }
    if (e.target.closest("[data-cc-lib]")) {
      ccState.view = "library";
      renderCustomCover();
      return;
    }
    if (e.target.closest("[data-cc-local]")) {
      if (ccFile) ccFile.click();
      return;
    }
    if (e.target.closest("[data-cc-back]")) {
      ccState.view = ccState.view === "library" ? "source" : "frame";
      renderCustomCover();
      return;
    }
    var fill = e.target.closest("[data-cc-fill]");
    if (fill) {
      var mid = fill.getAttribute("data-cc-fill");
      var a = findMat(mid);
      if (!a || ccState.active < 0) return;
      ccState.cells[ccState.active] = normalizeCcCell({
        id: a.id,
        tone: a.tone,
        label: a.label,
        scale: 1,
        rotate: 0,
        ox: 0,
        oy: 0
      });
      ccState.view = "frame";
      renderCustomCover();
    }
  });

  ccBody.addEventListener("input", function (e) {
    if (!ccState) return;
    var zoom = e.target.closest("[data-cc-zoom]");
    if (zoom) {
      setCcZoom(Number(zoom.getAttribute("data-cc-zoom")), zoom.value);
      return;
    }
    var rot = e.target.closest("[data-cc-rotate]");
    if (rot) {
      setCcRotate(Number(rot.getAttribute("data-cc-rotate")), rot.value);
    }
  });

  ccBody.addEventListener(
    "wheel",
    function (e) {
      if (!ccState || ccState.view !== "frame") return;
      var cell = e.target.closest("[data-cc-cell]");
      if (!cell || e.target.closest("[data-stop-cc]")) return;
      var i = Number(cell.getAttribute("data-cc-cell"));
      var c = ccState.cells[i];
      if (!c) return;
      e.preventDefault();
      var next = (c.scale || 1) * (e.deltaY < 0 ? 1.06 : 1 / 1.06);
      setCcZoom(i, next);
    },
    { passive: false }
  );

  ccBody.addEventListener("pointerdown", function (e) {
    if (!ccState || ccState.view !== "frame") return;
    if (e.target.closest("[data-stop-cc]")) return;
    var media = e.target.closest(".art-cc-media");
    if (!media) return;
    var i = Number(media.getAttribute("data-cc-i"));
    var c = ccState.cells[i];
    if (!c || (c.scale || 1) <= 1.001) return;
    e.preventDefault();
    media.setPointerCapture(e.pointerId);
    ccDrag = {
      i: i,
      x0: e.clientX,
      y0: e.clientY,
      ox0: c.ox || 0,
      oy0: c.oy || 0
    };
    media.classList.add("is-dragging");
  });
  ccBody.addEventListener("pointermove", function (e) {
    if (!ccDrag || !ccState) return;
    var c = ccState.cells[ccDrag.i];
    if (!c) return;
    c.ox = ccDrag.ox0 + (e.clientX - ccDrag.x0);
    c.oy = ccDrag.oy0 + (e.clientY - ccDrag.y0);
    applyCcCellTransform(ccDrag.i);
  });
  function endCcDrag(e) {
    if (!ccDrag) return;
    var media = ccBody && ccBody.querySelector('.art-cc-media[data-cc-i="' + ccDrag.i + '"]');
    if (media) {
      media.classList.remove("is-dragging");
      try {
        media.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    ccDrag = null;
  }
  ccBody.addEventListener("pointerup", endCcDrag);
  ccBody.addEventListener("pointercancel", endCcDrag);

  if (ccFile) {
    ccFile.addEventListener("change", function () {
      var f = ccFile.files && ccFile.files[0];
      ccFile.value = "";
      if (!f || !ccState || ccState.active < 0) return;
      if (!/\.(jpe?g|png|webp)$/i.test(f.name) && !/^image\//.test(f.type)) {
        FZShell.toast("只支持 jpg、png、webp 图片", "err");
        return;
      }
      ccState.cells[ccState.active] = normalizeCcCell({
        id: "local_" + Date.now(),
        tone: "#a5b4fc",
        label: f.name.replace(/\.[^.]+$/, "").slice(0, 12) || "本地图",
        scale: 1,
        rotate: 0,
        ox: 0,
        oy: 0
      });
      ccState.view = "frame";
      renderCustomCover();
    });
  }

  ccSave.addEventListener("click", function () {
    if (!ccState || ccState.busy || ccState.cells.some(function (c) {
      return !c;
    })) {
      return;
    }
    ccState.busy = true;
    renderCustomCover();
    setTimeout(function () {
      if (!article.baseCoverTone) {
        article.baseCoverTone = article.coverTone || baseCover.tone;
        article.baseCoverLabel = article.coverLabel || baseCover.label;
      }
      article.coverKind = "custom";
      article.customPanelCount = ccState.panelN;
      article.customCells = ccState.cells.map(function (c) {
        return normalizeCcCell(c);
      });
      article.coverTone =
        "linear-gradient(90deg," +
        article.customCells
          .map(function (c) {
            return c.tone;
          })
          .join(",") +
        ")";
      article.coverLabel =
        ({ 1: "单拼图封面", 2: "二拼图封面", 3: "三拼图封面" }[ccState.panelN] ||
          "拼图封面");
      paintCover();
      closeCustomCover();
      FZShell.toast("拼图封面已生成，保存文章后生效", "ok");
    }, 500);
  });

  coverPreview.addEventListener("click", function () {
    zoomStage.innerHTML =
      '<div class="art-mat-zoom-view" style="background:' +
      (article.coverTone || baseCover.tone) +
      '">🖼 ' +
      esc(article.coverLabel || "封面") +
      "</div>";
    zoomMask.hidden = false;
  });

  /* —— 视频封面（RF-01）：与文章封面分离；可上传覆盖项目策略 —— */
  var VCS_LABELS = {
    article: "文章封面",
    first_frame: "视频首帧",
    random: "随机视频抽帧"
  };
  var projectVcs = "article";
  try {
    var stAll = FZStore.read();
    var projHit = (stAll.projects || []).find(function (p) {
      return p.id === article.projectId;
    });
    if (projHit && window.FZProjectUnion && FZProjectUnion.normalizeProject) {
      FZProjectUnion.normalizeProject(projHit);
    }
    if (projHit && projHit.videoCoverStrategy) projectVcs = projHit.videoCoverStrategy;
  } catch (eVcs) {}
  if (!article.videoCoverKind) article.videoCoverKind = "strategy";

  var vcPreview = document.getElementById("art-vc-preview");
  var vcStatus = document.getElementById("art-vc-status");
  var vcHint = document.getElementById("art-vc-strategy-hint");
  var vcRestore = document.getElementById("art-vc-restore");
  if (vcHint) {
    vcHint.textContent =
      "项目默认：「" + (VCS_LABELS[projectVcs] || "文章封面") + "」。本篇换图后以手动图为准。";
  }

  function paintVideoCover() {
    if (!vcPreview) return;
    var custom = article.videoCoverKind === "custom";
    var tone;
    var label;
    if (custom) {
      tone = article.videoCoverTone || "#c7d2fe";
      label = article.videoCoverLabel || "手动视频封面";
    } else if (projectVcs === "article") {
      tone = article.coverTone || article.baseCoverTone || baseCover.tone;
      label = "跟随文章封面";
    } else if (projectVcs === "first_frame") {
      tone = "#e0e7ff";
      label = "视频首帧（策略）";
    } else {
      tone = "#fef3c7";
      label = "随机抽帧（策略）";
    }
    vcPreview.style.background = tone;
    vcPreview.innerHTML = "<span>" + esc(label) + "</span>";
    vcPreview.classList.add("has-cover");
    if (vcRestore) vcRestore.hidden = !custom;
    if (vcStatus) {
      vcStatus.textContent = custom
        ? "已手动替换（改文章封面不会覆盖）"
        : "跟随项目策略";
    }
  }
  paintVideoCover();

  var _paintCover = paintCover;
  paintCover = function () {
    _paintCover();
    if (article.videoCoverKind !== "custom" && projectVcs === "article") {
      paintVideoCover();
    }
  };

  function applyCustomVideoCover(tone, label) {
    article.videoCoverKind = "custom";
    article.videoCoverTone = tone || "#a5b4fc";
    article.videoCoverLabel = label || "自定义视频封面";
    paintVideoCover();
  }

  var vcFile = document.getElementById("art-vc-file");
  var vcPick = document.getElementById("art-vc-pick");
  var vcFromMat = document.getElementById("art-vc-from-mat");
  var vcMatMask = document.getElementById("art-vc-mat-mask");
  var vcMatBody = document.getElementById("art-vc-mat-body");

  function closeVcMatPicker() {
    if (vcMatMask) vcMatMask.hidden = true;
  }

  function openVcMatPicker() {
    var imgs = matAssets.filter(function (a) {
      return a.kind === "image";
    });
    if (!imgs.length) {
      FZShell.toast("本篇素材里没有可用图片", "err");
      return;
    }
    if (!vcMatMask || !vcMatBody) {
      /* 无弹层时退化为选第一张（不应常态触发） */
      applyCustomVideoCover(imgs[0].tone, imgs[0].label);
      FZShell.toast("已用素材「" + imgs[0].label + "」作视频封面，保存文章后生效", "ok");
      return;
    }
    vcMatBody.innerHTML =
      '<div class="art-cc-lib-grid">' +
      imgs
        .map(function (a) {
          return (
            '<button type="button" class="art-cc-lib-item" data-vc-mat="' +
            esc(a.id) +
            '" style="background:' +
            esc(a.tone) +
            '" title="' +
            esc(a.label) +
            '"><span>' +
            esc(a.label) +
            "</span></button>"
          );
        })
        .join("") +
      "</div>";
    vcMatMask.hidden = false;
  }

  if (vcFromMat) {
    vcFromMat.addEventListener("click", openVcMatPicker);
  }
  if (vcMatBody) {
    vcMatBody.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-vc-mat]");
      if (!btn) return;
      var a = findMat(btn.getAttribute("data-vc-mat"));
      if (!a) return;
      applyCustomVideoCover(a.tone, a.label);
      closeVcMatPicker();
      FZShell.toast("已用素材「" + a.label + "」作视频封面，保存文章后生效", "ok");
    });
  }
  if (vcMatMask) {
    /* 选封面素材：编辑类，点遮罩不关闭 */
    var vcMatClose = document.getElementById("art-vc-mat-close");
    if (vcMatClose) vcMatClose.addEventListener("click", closeVcMatPicker);
  }

  if (vcPick) {
    vcPick.addEventListener("click", function () {
      if (vcFile) vcFile.click();
    });
  }
  if (vcFile) {
    vcFile.addEventListener("change", function () {
      var f = vcFile.files && vcFile.files[0];
      if (!f) return;
      if (!/^image\//.test(f.type)) {
        FZShell.toast("请选择图片文件", "err");
        vcFile.value = "";
        return;
      }
      applyCustomVideoCover(
        "#a5b4fc",
        f.name.replace(/\.[^.]+$/, "").slice(0, 20) || "自定义视频封面"
      );
      FZShell.toast(
        "已上传视频封面「" + article.videoCoverLabel + "」，保存文章后生效",
        "ok"
      );
      vcFile.value = "";
    });
  }
  if (vcRestore) {
    vcRestore.addEventListener("click", function () {
      if (article.videoCoverKind !== "custom") {
        FZShell.toast("当前已是跟随项目策略");
        return;
      }
      article.videoCoverKind = "strategy";
      article.videoCoverTone = null;
      article.videoCoverLabel = null;
      paintVideoCover();
      FZShell.toast("已恢复跟随项目策略，保存文章后生效", "ok");
    });
  }
  if (vcPreview) {
    vcPreview.addEventListener("click", function () {
      var tone =
        article.videoCoverKind === "custom"
          ? article.videoCoverTone || "#a5b4fc"
          : projectVcs === "article"
            ? article.coverTone || baseCover.tone
            : projectVcs === "first_frame"
              ? "#e0e7ff"
              : "#fef3c7";
      var label =
        article.videoCoverKind === "custom"
          ? article.videoCoverLabel || "视频封面"
          : projectVcs === "article"
            ? "跟随文章封面"
            : VCS_LABELS[projectVcs] || "视频封面";
      zoomStage.innerHTML =
        '<div class="art-mat-zoom-view" style="background:' +
        tone +
        '">🎬 ' +
        esc(label) +
        "</div>";
      zoomMask.hidden = false;
    });
  }

  /* 分类：点选开关，不再「下拉 + 下方标签」双显 */
  var CAT_OPTIONS = ["今日吃瓜", "社会", "娱乐"];
  function paintCatToggles() {
    var selected = article.categories || [];
    var box = document.getElementById("art-category-chips");
    box.innerHTML = CAT_OPTIONS.map(function (name) {
      var on = selected.indexOf(name) >= 0;
      return (
        '<button type="button" class="art-cat-toggle' +
        (on ? " is-on" : "") +
        '" data-cat="' +
        esc(name) +
        '" aria-pressed="' +
        (on ? "true" : "false") +
        '">' +
        esc(name) +
        "</button>"
      );
    }).join("");
  }
  paintCatToggles();
  document.getElementById("art-category-chips").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-cat]");
    if (!btn) return;
    var name = btn.getAttribute("data-cat");
    article.categories = article.categories || [];
    var i = article.categories.indexOf(name);
    if (i >= 0) {
      article.categories.splice(i, 1);
      FZShell.toast("已取消分类「" + name + "」", "ok");
    } else {
      article.categories.push(name);
      FZShell.toast("已添加分类「" + name + "」", "ok");
    }
    paintCatToggles();
  });

  /* 关键词 / 标签：一体标签框（芯片 + 行内输入），不再下方重复一排 */
  function paintTagField(listKey, boxId) {
    var list = article[listKey] || [];
    document.getElementById(boxId).innerHTML = list
      .map(function (p, i) {
        return (
          '<button type="button" class="art-tag-chip" data-tag-i="' +
          i +
          '" data-list="' +
          listKey +
          '" title="移除">' +
          esc(p) +
          " <span aria-hidden=\"true\">×</span></button>"
        );
      })
      .join("");
  }

  function addTag(listKey, boxId, inputEl) {
    var raw = (inputEl.value || "").trim().replace(/[,，]+$/, "");
    if (!raw) return;
    var parts = raw.split(/[,，]/).map(function (s) {
      return s.trim();
    }).filter(Boolean);
    article[listKey] = article[listKey] || [];
    var added = 0;
    parts.forEach(function (p) {
      if (article[listKey].indexOf(p) >= 0) return;
      article[listKey].push(p);
      added += 1;
    });
    inputEl.value = "";
    paintTagField(listKey, boxId);
    if (!added) FZShell.toast("已存在，未重复添加", "err");
  }

  paintTagField("keywords", "art-keyword-chips");
  paintTagField("tags", "art-tag-chips");

  function bindTagField(fieldId, inputId, listKey, boxId) {
    var field = document.getElementById(fieldId);
    var input = document.getElementById(inputId);
    field.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-tag-i]");
      if (chip) {
        var i = Number(chip.getAttribute("data-tag-i"));
        var key = chip.getAttribute("data-list");
        article[key].splice(i, 1);
        paintTagField(key, key === "keywords" ? "art-keyword-chips" : "art-tag-chips");
        return;
      }
      input.focus();
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(listKey, boxId, input);
        return;
      }
      if (e.key === "Backspace" && !input.value && (article[listKey] || []).length) {
        article[listKey].pop();
        paintTagField(listKey, boxId);
      }
    });
    input.addEventListener("blur", function () {
      if ((input.value || "").trim()) addTag(listKey, boxId, input);
    });
  }
  bindTagField("art-keyword-field", "art-keywords", "keywords", "art-keyword-chips");
  bindTagField("art-tag-field", "art-tags", "tags", "art-tag-chips");

  var regionEl = document.getElementById("art-region");
  if (regionEl) {
    regionEl.value = article.region || "";
    regionEl.addEventListener("change", function () {
      article.region = regionEl.value;
      FZShell.toast(
        regionEl.value
          ? "已设置地区「" + regionEl.options[regionEl.selectedIndex].text + "」"
          : "已清空地区",
        "ok"
      );
    });
  }

  /* —— 正文工具栏 —— */
  function runCmd(cmd, val) {
    editor.focus();
    try {
      document.execCommand(cmd, false, val || null);
    } catch (err) {}
    refreshCount();
  }

  document.querySelectorAll("[data-tool]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tool = btn.getAttribute("data-tool");
      if (tool === "undo") return runCmd("undo");
      if (tool === "redo") return runCmd("redo");
      if (tool === "bold") return runCmd("bold");
      if (tool === "italic") return runCmd("italic");
      if (tool === "list") return runCmd("insertUnorderedList");
      if (tool === "link") {
        var url = window.prompt("输入链接地址", "https://");
        if (!url) return;
        runCmd("createLink", url);
        FZShell.toast("已插入链接", "ok");
        return;
      }
      if (tool === "image") {
        insertMat("2");
        return;
      }
      if (tool === "video") {
        insertMat("5");
        return;
      }
    });
  });
  document.querySelectorAll("[data-mat]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      insertMat(btn.getAttribute("data-mat"));
    });
  });

  /* —— 保存 / 预览 / 推送 / 版本对比 —— */
  function collectPayload() {
    return {
      title: (titleEl.value || "").trim() || "未命名文章",
      bodyHtml: editor.innerHTML,
      coverKind: article.coverKind || "default",
      coverTone: article.coverTone || "",
      coverLabel: article.coverLabel || "",
      baseCoverTone: article.baseCoverTone || "",
      baseCoverLabel: article.baseCoverLabel || "",
      customCells: article.customCells || null,
      customPanelCount: article.customPanelCount || null,
      categories: (article.categories || []).slice(),
      keywords: (article.keywords || []).slice(),
      tags: (article.tags || []).slice(),
      region: article.region || ""
    };
  }

  function saveArticle(opts) {
    opts = opts || {};
    var payload = collectPayload();
    var cur = drafts.find(function (d) {
      return d.id === activeDraft;
    });
    if (cur) {
      cur.title = payload.title;
      cur.body = payload.bodyHtml;
    }
    FZArticles.update(article.id, payload);
    article = FZArticles.get(article.id);
    titleEl.value = article.title;
    fitTitle();
    paintStatus();
    if (!opts.silent) FZShell.toast("已保存", "ok");
    return article;
  }

  var previewMask = document.getElementById("art-preview-mask");
  function openPreview() {
    var payload = collectPayload();
    document.getElementById("art-preview-title").textContent = payload.title;
    document.getElementById("art-preview-meta").textContent =
      "#" +
      article.id +
      " · " +
      (article.projectName || "—") +
      " · " +
      FZArticles.statusMeta(article.status).text;
    document.getElementById("art-preview-body").innerHTML =
      payload.bodyHtml || "<p class=\"muted\">暂无正文</p>";
    previewMask.hidden = false;
  }
  function closePreview() {
    previewMask.hidden = true;
  }
  document.getElementById("art-preview-close").addEventListener("click", closePreview);
  previewMask.addEventListener("click", function (e) {
    if (e.target === previewMask) closePreview();
  });

  var compareMask = document.getElementById("art-compare-mask");
  function openCompare() {
    if (!hasPushHistory(article)) {
      FZShell.toast("当前文章没有可对比的历史版本", "err");
      return;
    }
    var payload = collectPayload();
    document.getElementById("art-compare-hint").textContent =
      "对照当前稿与上一推送版（Demo）。";
    document.getElementById("art-compare-prev").innerHTML =
      "<p><strong>" +
      esc(article.prevTitle || "上一版标题") +
      "</strong></p>" +
      (article.prevBodyHtml || "<p class=\"muted\">暂无上一版正文</p>");
    document.getElementById("art-compare-cur").innerHTML =
      "<p><strong>" +
      esc(payload.title) +
      "</strong></p>" +
      (payload.bodyHtml || "<p class=\"muted\">暂无正文</p>");
    compareMask.hidden = false;
  }
  function closeCompare() {
    compareMask.hidden = true;
  }
  document.getElementById("art-btn-compare").addEventListener("click", openCompare);
  document.getElementById("art-compare-close").addEventListener("click", closeCompare);
  compareMask.addEventListener("click", function (e) {
    if (e.target === compareMask) closeCompare();
  });

  /* —— 页内二次确认 —— */
  var confirmMask = document.getElementById("art-confirm-mask");
  var confirmTitle = document.getElementById("art-confirm-title");
  var confirmMsg = document.getElementById("art-confirm-msg");
  var confirmOk = document.getElementById("art-confirm-ok");
  var confirmCancel = document.getElementById("art-confirm-cancel");
  var confirmCb = null;

  function openConfirm(opts) {
    opts = opts || {};
    confirmTitle.textContent = opts.title || "确认";
    confirmMsg.textContent = opts.message || "";
    confirmOk.textContent = opts.okText || "确定";
    confirmCancel.textContent = opts.cancelText || "取消";
    confirmCb = typeof opts.onOk === "function" ? opts.onOk : null;
    confirmMask.hidden = false;
  }
  function closeConfirm() {
    confirmMask.hidden = true;
    confirmCb = null;
  }
  confirmOk.addEventListener("click", function () {
    var fn = confirmCb;
    closeConfirm();
    if (fn) fn();
  });
  confirmCancel.addEventListener("click", closeConfirm);
  /* 二次确认：点遮罩不关闭，须点取消 / 确认 */

  document.getElementById("art-btn-draft").addEventListener("click", function () {
    saveArticle();
  });

  document.getElementById("art-btn-preview").addEventListener("click", openPreview);

  document.getElementById("art-btn-push").addEventListener("click", function () {
    var payload = collectPayload();
    if (!payload.title || payload.title === "未命名文章") {
      FZShell.toast("请先填写标题", "err");
      return;
    }
    if (!(editor.innerText || "").trim()) {
      FZShell.toast("正文不能为空", "err");
      return;
    }
    openConfirm({
      title: "确认推送",
      okText: "确认推送",
      message: "确认将本文推送到内容通道？推送后列表状态将变为「已推送」。",
      onOk: function () {
        var prevTitle = article.title;
        var prevBody = article.bodyHtml;
        saveArticle({ silent: true });
        FZArticles.update(article.id, {
          status: "draft_created",
          hasManualVersion: true,
          prevTitle: prevTitle,
          prevBodyHtml: prevBody,
          pusher: "小王"
        });
        article = FZArticles.get(article.id);
        paintStatus();
        FZShell.toast("已确认推送", "ok");
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var matMask = document.getElementById("mat-detail-mask");
    if (confirmMask && !confirmMask.hidden) closeConfirm();
    else if (vcMatMask && !vcMatMask.hidden) closeVcMatPicker();
    else if (ccMask && !ccMask.hidden) closeCustomCover();
    else if (!zoomMask.hidden) closeMatZoom();
    else if (aiPanel.classList.contains("is-open")) closeAi();
    else if (matMask && !matMask.hidden && window.FZMatDetail) FZMatDetail.close();
    else if (!previewMask.hidden) closePreview();
    else if (!compareMask.hidden) closeCompare();
  });

  if (window.FZMatDetail) FZMatDetail.bind();
})();
