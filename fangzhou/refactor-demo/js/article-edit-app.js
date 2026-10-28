/* 文章编辑 · 正文优先布局；控件 Toast 占位 */
(function () {
  FZShell.boot({ active: "e_art" });

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function stub(name) {
    FZShell.toast(name + " · 布局确认后再做具体交互（Demo）");
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

  var st = FZArticles.statusMeta(article.status);
  document.getElementById("art-edit-id").textContent = "#" + article.id;
  var badge = document.getElementById("art-edit-status");
  badge.className = "badge " + st.cls;
  badge.textContent = st.text;
  document.getElementById("art-title").value = article.title || "";
  document.getElementById("art-site-hint").textContent =
    article.siteType === "video" ? "视频站 · 文+视频为主" : "瓜站 · 图文混排";
  editor.innerHTML =
    "<p>这是 Demo 正文区。标题已单独放在上方，这里只写正文，避免和标题重复。</p>" +
    "<p class=\"muted\">点顶栏「AI 稿件」打开侧抽屉生成/换稿；右侧是封面与分类等发布属性。</p>";

  var drafts = [
    { id: "d1", label: "主稿 · 设问标题" },
    { id: "d2", label: "备稿 · 事件推进" },
    { id: "d3", label: "备稿 · 人物视角" },
    { id: "d4", label: "备稿 · 短平快" },
    { id: "d5", label: "备稿 · 悬念收束" }
  ];
  var activeDraft = drafts[0].id;

  function paintDraftTabs(boxId, stacked) {
    var box = document.getElementById(boxId);
    if (!box) return;
    box.innerHTML = drafts
      .map(function (d) {
        return (
          '<button type="button" class="art-ai-tab' +
          (d.id === activeDraft ? " is-on" : "") +
          (stacked ? " art-ai-tab--block" : "") +
          '" data-draft="' +
          d.id +
          '">' +
          esc(d.label) +
          "</button>"
        );
      })
      .join("");
  }

  function setActiveDraft(draftId, label) {
    activeDraft = draftId;
    paintDraftTabs("art-ai-tabs", false);
    paintDraftTabs("art-ai-tabs-drawer", true);
    document.getElementById("art-ai-meta").textContent =
      (label || "已选稿") + " · 已载入正文（Demo）";
  }

  paintDraftTabs("art-ai-tabs", false);
  paintDraftTabs("art-ai-tabs-drawer", true);

  function onDraftClick(e) {
    var btn = e.target.closest("[data-draft]");
    if (!btn) return;
    setActiveDraft(btn.getAttribute("data-draft"), btn.textContent.trim());
    stub("切换 AI 稿「" + btn.textContent.trim() + "」");
  }
  document.getElementById("art-ai-tabs").addEventListener("click", onDraftClick);
  document
    .getElementById("art-ai-tabs-drawer")
    .addEventListener("click", onDraftClick);

  function renderChips(inputId, boxId) {
    var raw = document.getElementById(inputId).value || "";
    var parts = raw
      .split(/[,，]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    document.getElementById(boxId).innerHTML = parts
      .map(function (p) {
        return '<span class="art-chip">' + esc(p) + "</span>";
      })
      .join("");
  }
  ["art-keywords", "art-tags"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", function () {
      renderChips(
        id,
        id === "art-keywords" ? "art-keyword-chips" : "art-tag-chips"
      );
    });
  });
  document.getElementById("art-keywords").value = "Demo关键词甲, Demo关键词乙";
  document.getElementById("art-tags").value = "标签一, 标签二";
  renderChips("art-keywords", "art-keyword-chips");
  renderChips("art-tags", "art-tag-chips");

  function countChars() {
    var t = editor.innerText || "";
    document.getElementById("art-char-count").textContent =
      t.replace(/\s+/g, "").length + " 字";
  }
  editor.addEventListener("input", countChars);
  countChars();

  /* —— AI 抽屉 —— */
  var overlay = document.getElementById("art-ai-overlay");
  var drawer = document.getElementById("art-ai-drawer");
  function openAi() {
    overlay.hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      overlay.classList.add("is-open");
      drawer.classList.add("is-open");
    });
  }
  function closeAi() {
    overlay.classList.remove("is-open");
    drawer.classList.remove("is-open");
    setTimeout(function () {
      overlay.hidden = true;
      drawer.hidden = true;
    }, 180);
  }
  document.getElementById("art-btn-ai").addEventListener("click", openAi);
  document.getElementById("art-ai-close").addEventListener("click", closeAi);
  overlay.addEventListener("click", closeAi);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !drawer.hidden) closeAi();
  });

  /* —— 右侧属性栏折叠 —— */
  var railOpen = true;
  document.getElementById("art-rail-toggle").addEventListener("click", function () {
    railOpen = !railOpen;
    document.getElementById("art-rail-body").hidden = !railOpen;
    this.textContent = railOpen ? "收起" : "展开";
    document
      .querySelector(".art-edit-workspace")
      .classList.toggle("is-rail-collapsed", !railOpen);
  });

  /* —— 顶栏更多 —— */
  var moreMenu = document.getElementById("art-top-more-menu");
  document.getElementById("art-btn-more").addEventListener("click", function (e) {
    e.stopPropagation();
    moreMenu.hidden = !moreMenu.hidden;
  });
  document.addEventListener("click", function () {
    moreMenu.hidden = true;
  });
  moreMenu.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.querySelectorAll("[data-regen]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-regen]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
    });
  });

  var clickMap = {
    "art-btn-source": "原素材",
    "art-btn-compare": "版本对比",
    "art-btn-preview": "预览",
    "art-btn-draft": "保存",
    "art-btn-push": "确认推送",
    "art-ai-run": "AI 生成",
    "art-cover-pick": "选择封面图",
    "art-cover-custom": "自定义封面",
    "art-cover-restore": "恢复默认封面",
    "art-cover-preview": "封面放大"
  };
  Object.keys(clickMap).forEach(function (cid) {
    var el = document.getElementById(cid);
    if (el) {
      el.addEventListener("click", function () {
        stub(clickMap[cid]);
        if (cid === "art-btn-source" || cid === "art-btn-compare") {
          moreMenu.hidden = true;
        }
      });
    }
  });

  document.getElementById("art-category").addEventListener("change", function () {
    if (!this.value) return;
    stub("添加分类");
    this.value = "";
  });
  document.querySelectorAll("[data-mat]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      stub("插入素材到正文");
    });
  });
  document.querySelectorAll("[data-tool]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      stub("正文工具「" + (btn.textContent || btn.getAttribute("data-tool")) + "」");
    });
  });
})();
