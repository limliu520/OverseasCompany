/* 文章管理 · 列表（筛选 / 行操作 / 预览 / 素材 / 版本对比） */
(function () {
  FZShell.boot({ active: "e_art" });

  var page = 1;
  var pageSize = window.FZPager ? window.FZPager.DEFAULT : 20;
  var filter = { projectId: "", status: "", qId: "", qTitle: "", qOp: "" };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function canPreview(a) {
    return (
      ["awaiting_edit", "draft_created", "publishing"].indexOf(a.status) >= 0
    );
  }

  function filtered() {
    return FZArticles.list().filter(function (a) {
      if (a.siteType === "short_drama") return false;
      if (filter.projectId && a.projectId !== filter.projectId) return false;
      if (filter.status && a.status !== filter.status) return false;
      if (filter.qId && String(a.id).indexOf(filter.qId.trim()) < 0) return false;
      if (
        filter.qTitle &&
        String(a.title || "")
          .toLowerCase()
          .indexOf(filter.qTitle.trim().toLowerCase()) < 0
      ) {
        return false;
      }
      if (
        filter.qOp &&
        String(a.operator || "")
          .toLowerCase()
          .indexOf(filter.qOp.trim().toLowerCase()) < 0
      ) {
        return false;
      }
      return true;
    });
  }

  function paintFilter() {
    var s = FZStore.read();
    var projects = FZArticles.articleProjects(s);
    var proj = document.getElementById("art-f-project");
    var st = document.getElementById("art-f-status");
    proj.innerHTML =
      '<option value="">全部项目</option>' +
      projects
        .map(function (p) {
          var type = siteTypeLabel(p.siteType);
          return (
            '<option value="' +
            esc(p.id) +
            '"' +
            (filter.projectId === p.id ? " selected" : "") +
            ">" +
            esc(p.name) +
            (type && type !== "—" ? " · " + type : "") +
            "</option>"
          );
        })
        .join("");
    st.innerHTML =
      '<option value="">全部状态</option>' +
      Object.keys(FZArticles.STATUS)
        .map(function (k) {
          var m = FZArticles.STATUS[k];
          return (
            '<option value="' +
            k +
            '"' +
            (filter.status === k ? " selected" : "") +
            ">" +
            m.text +
            "</option>"
          );
        })
        .join("");
  }

  function moreMenuHtml(items) {
    if (!items.length) return "";
    return (
      '<div class="art-more">' +
      '<button type="button" class="btn btn-sm btn-ghost art-more-btn" aria-label="更多" aria-haspopup="true">⋯</button>' +
      '<div class="art-more-menu" hidden role="menu">' +
      items.join("") +
      "</div></div>"
    );
  }

  function menuItem(act, id, label, danger) {
    return (
      '<button type="button" class="art-more-item' +
      (danger ? " is-danger" : "") +
      '" role="menuitem" data-act="' +
      act +
      '" data-id="' +
      id +
      '">' +
      esc(label) +
      "</button>"
    );
  }

  function actionsHtml(a) {
    var id = a.id;
    var primary = [];
    var more = [];

    if (a.status === "awaiting_edit") {
      primary.push(
        '<a class="btn btn-sm btn-primary" href="./article-edit.html?id=' +
          id +
          '">编辑</a>'
      );
    }
    if (a.status === "draft_created") {
      primary.push(
        '<button type="button" class="btn btn-sm btn-primary" data-act="reopen" data-id="' +
          id +
          '">重新编辑</button>'
      );
    }
    if (a.status === "failed") {
      primary.push(
        '<button type="button" class="btn btn-sm" data-act="retry" data-id="' +
          id +
          '">重试</button>'
      );
      more.push(menuItem("release", id, "释放占用"));
    }
    if (canPreview(a)) {
      more.push(menuItem("preview", id, "预览"));
    }
    if (a.hasManualVersion) {
      more.push(menuItem("compare", id, "版本对比"));
    }
    if (a.materialId) {
      more.push(menuItem("source", id, "原素材"));
    }
    more.push(menuItem("delete", id, "删除", true));

    return primary.join("") + moreMenuHtml(more);
  }

  var SITE_TYPE_LABEL = {
    chigua: "瓜站",
    video: "视频站",
    short_drama: "短剧站"
  };

  function siteTypeLabel(code) {
    return SITE_TYPE_LABEL[code] || code || "—";
  }

  function matCell(a) {
    if (!a.materialId) return '<span class="mat-empty">—</span>';
    return (
      '<button type="button" class="art-link mono" data-act="mat" data-id="' +
      a.id +
      '" data-mid="' +
      a.materialId +
      '" title="查看素材 #' +
      a.materialId +
      '">' +
      a.materialId +
      "</button>"
    );
  }

  function projectCell(a) {
    var type = siteTypeLabel(a.siteType);
    var typeCls =
      a.siteType === "video"
        ? "is-video"
        : a.siteType === "short_drama"
          ? "is-drama"
          : "is-chigua";
    return (
      '<div class="art-proj-cell">' +
      (type && type !== "—"
        ? '<span class="art-proj-tag ' + typeCls + '">' + esc(type) + "</span>"
        : "") +
      '<span class="art-proj-name">' +
      esc(a.projectName || "—") +
      "</span></div>"
    );
  }

  function rowHtml(a) {
    var st = FZArticles.statusMeta(a.status);
    var fail =
      a.status === "failed"
        ? '<div class="art-fail" title="' +
          esc(a.failReason || "") +
          '">' +
          esc(a.failReason || "原因未记录") +
          "</div>"
        : '<span class="mat-empty">—</span>';
    var preview = canPreview(a);
    return (
      "<tr data-id=\"" +
      a.id +
      "\"" +
      (preview
        ? ' class="art-row--preview" data-preview-id="' +
          a.id +
          '" tabindex="0" title="点击预览文章"'
        : "") +
      ">" +
      '<td class="mono">' +
      a.id +
      "</td>" +
      '<td class="cell-title"><div class="cell-clip" title="' +
      esc(a.title) +
      '">' +
      esc(a.title) +
      "</div></td>" +
      "<td>" +
      projectCell(a) +
      "</td>" +
      "<td>" +
      matCell(a) +
      "</td>" +
      "<td><span class=\"badge " +
      st.cls +
      '">' +
      esc(st.text) +
      "</span></td>" +
      "<td>" +
      fail +
      "</td>" +
      "<td>" +
      esc(a.operator) +
      "</td>" +
      '<td class="td-time mono">' +
      esc(a.time) +
      "</td>" +
      '<td class="td-actions" data-stop-row="1">' +
      actionsHtml(a) +
      "</td></tr>"
    );
  }

  /* —— 弹层：确认 / 预览 / 对比 / 原素材 —— */
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
    confirmOk.className = "btn " + (opts.danger ? "btn-danger" : "btn-primary");
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
  confirmMask.addEventListener("click", function (e) {
    if (e.target === confirmMask) closeConfirm();
  });

  var previewMask = document.getElementById("art-preview-mask");
  var compareMask = document.getElementById("art-compare-mask");

  function openPreview(a) {
    if (!a) {
      FZShell.toast("文章不存在", "err");
      return;
    }
    if (!previewMask) {
      FZShell.toast("预览弹层未加载，请硬刷新页面", "err");
      return;
    }
    document.getElementById("art-preview-title").textContent = a.title || "无标题";
    document.getElementById("art-preview-meta").textContent =
      "#" +
      a.id +
      " · " +
      (a.projectName || "—") +
      " · " +
      FZArticles.statusMeta(a.status).text;
    document.getElementById("art-preview-body").innerHTML =
      a.bodyHtml || "<p class=\"muted\">暂无正文</p>";
    previewMask.hidden = false;
  }

  function closePreview() {
    if (previewMask) previewMask.hidden = true;
  }

  function openCompare(a) {
    if (!a) return;
    if (!a.hasManualVersion) {
      FZShell.toast("当前文章没有可对比的历史版本", "err");
      return;
    }
    document.getElementById("art-compare-prev").innerHTML =
      "<p><strong>" +
      esc(a.prevTitle || "上一版标题") +
      "</strong></p>" +
      (a.prevBodyHtml || "<p class=\"muted\">暂无上一版正文</p>");
    document.getElementById("art-compare-cur").innerHTML =
      "<p><strong>" +
      esc(a.title || "当前标题") +
      "</strong></p>" +
      (a.bodyHtml || "<p class=\"muted\">暂无正文</p>");
    compareMask.hidden = false;
  }

  function closeCompare() {
    compareMask.hidden = true;
  }

  function openSource(a) {
    if (!a || !a.materialId) {
      FZShell.toast("当前文章没有关联素材", "err");
      return;
    }
    if (!window.FZMatDetail) {
      FZShell.toast("素材详情组件未加载", "err");
      return;
    }
    var m = FZArticles.buildSourceMaterial(a);
    FZMatDetail.open(m.id, [m], { previewOnly: true });
  }

  function closeAllMenus() {
    document.querySelectorAll(".art-more-menu").forEach(function (m) {
      m.hidden = true;
    });
  }

  function handleAct(act, id) {
    var a = FZArticles.get(id);
    if (!a && act !== "delete") {
      FZShell.toast("文章不存在或已删除", "err");
      render();
      return;
    }

    if (act === "preview") {
      openPreview(a);
      return;
    }
    if (act === "compare") {
      openCompare(a);
      return;
    }
    if (act === "source" || act === "mat") {
      openSource(a);
      return;
    }
    if (act === "retry") {
      if (a.status !== "failed") {
        FZShell.toast("仅失败状态可重试", "err");
        return;
      }
      FZArticles.retry(id);
      FZShell.toast("已重试，回到待编辑", "ok");
      render();
      return;
    }
    if (act === "reopen") {
      if (a.status !== "draft_created") {
        FZShell.toast("仅已推送状态可重新编辑", "err");
        return;
      }
      /* 口径：内容通道（不做 CMS 多账号）；语义对齐现网 reopen，文案按重构方案改写 */
      openConfirm({
        title: "重新编辑",
        okText: "重新编辑",
        message:
          "将该已推送文章退回「待编辑」。再次确认推送将向内容通道新建一篇（原推送稿保留），确定继续？",
        onOk: function () {
          FZArticles.reopen(id);
          FZShell.toast("已退回待编辑", "ok");
          location.href = "./article-edit.html?id=" + id;
        }
      });
      return;
    }
    if (act === "release") {
      if (a.status !== "failed") {
        FZShell.toast("仅失败状态可释放占用", "err");
        return;
      }
      openConfirm({
        title: "释放占用",
        okText: "释放占用",
        message: "释放占用后文章将回到「待处理」，确认继续？",
        onOk: function () {
          FZArticles.release(id);
          FZShell.toast("已释放占用", "ok");
          render();
        }
      });
      return;
    }
    if (act === "delete") {
      openConfirm({
        title: "删除文章",
        okText: "删除",
        danger: true,
        message: "确定删除文章 #" + id + "？此操作不可恢复。",
        onOk: function () {
          FZArticles.remove(id);
          FZShell.toast("已删除 #" + id, "ok");
          render();
        }
      });
      return;
    }
    FZShell.toast("未知操作", "err");
  }

  function bindRow(box) {
    /* 行内操作：拦截冒泡，避免触发整行预览 */
    box.querySelectorAll("[data-act]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeAllMenus();
        handleAct(btn.getAttribute("data-act"), btn.getAttribute("data-id"));
      });
    });

    box.querySelectorAll(".art-more-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var menu = btn.parentElement.querySelector(".art-more-menu");
        var open = menu && !menu.hidden;
        closeAllMenus();
        if (menu && !open) menu.hidden = false;
      });
    });

    box.querySelectorAll("a.btn").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });

    box.querySelectorAll("[data-stop-row]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });
  }

  /* 整行预览：对齐现网 article-row onclick（操作列 stopPropagation） */
  var artTbody = document.getElementById("art-tbody");
  artTbody.addEventListener("click", function (e) {
    if (e.target.closest("[data-stop-row], a.btn, button, .art-more, .art-link")) {
      return;
    }
    var tr = e.target.closest("tr.art-row--preview[data-preview-id]");
    if (!tr) return;
    openPreview(FZArticles.get(tr.getAttribute("data-preview-id")));
  });
  artTbody.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var tr = e.target.closest("tr.art-row--preview[data-preview-id]");
    if (!tr || e.target !== tr) return;
    e.preventDefault();
    openPreview(FZArticles.get(tr.getAttribute("data-preview-id")));
  });

  function render() {
    var rows = filtered();
    var box = document.getElementById("art-tbody");
    var pager = document.getElementById("art-pager");
    closeAllMenus();
    if (!rows.length) {
      box.innerHTML =
        '<tr><td colspan="9" class="empty-state"><div class="empty-state-text">暂无文章（短剧项目不会出现在此）</div></td></tr>';
      if (pager) pager.innerHTML = "";
      return;
    }
    var slice = window.FZPager
      ? FZPager.slice(rows, page, pageSize)
      : { items: rows, total: rows.length, page: 1, pageSize: rows.length };
    page = slice.page;
    pageSize = slice.pageSize;
    box.innerHTML = slice.items.map(rowHtml).join("");
    if (pager && window.FZPager) {
      pager.innerHTML = FZPager.html({
        total: slice.total,
        page: page,
        pageSize: pageSize
      });
    }
    bindRow(box);
  }

  function readFilter() {
    filter.projectId = document.getElementById("art-f-project").value;
    filter.status = document.getElementById("art-f-status").value;
    filter.qId = document.getElementById("art-f-id").value;
    filter.qTitle = document.getElementById("art-f-title").value;
    filter.qOp = document.getElementById("art-f-op").value;
  }

  function clearFilter() {
    filter = { projectId: "", status: "", qId: "", qTitle: "", qOp: "" };
    document.getElementById("art-f-id").value = "";
    document.getElementById("art-f-title").value = "";
    document.getElementById("art-f-op").value = "";
    paintFilter();
    page = 1;
    render();
    FZShell.toast("已清空筛选", "ok");
  }

  paintFilter();
  render();

  document.getElementById("art-f-search").addEventListener("click", function () {
    readFilter();
    page = 1;
    render();
    FZShell.toast("已按条件筛选", "ok");
  });
  document.getElementById("art-f-clear").addEventListener("click", clearFilter);
  document.getElementById("art-f-refresh").addEventListener("click", function () {
    /* 刷新 = 重置本列表演示数据（失败/已推送等种子态），筛选条件保留 */
    if (typeof FZArticles.reset === "function") FZArticles.reset();
    paintFilter();
    page = 1;
    render();
    FZShell.toast("已重置并刷新本列表", "ok");
  });
  ["art-f-project", "art-f-status"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", function () {
      readFilter();
      page = 1;
      render();
    });
  });
  ["art-f-id", "art-f-title", "art-f-op"].forEach(function (id) {
    document.getElementById(id).addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        readFilter();
        page = 1;
        render();
      }
    });
  });

  document.getElementById("art-preview-close").addEventListener("click", closePreview);
  previewMask.addEventListener("click", function (e) {
    if (e.target === previewMask) closePreview();
  });
  document.getElementById("art-compare-close").addEventListener("click", closeCompare);
  compareMask.addEventListener("click", function (e) {
    if (e.target === compareMask) closeCompare();
  });

  document.addEventListener("click", closeAllMenus);
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var matMask = document.getElementById("mat-detail-mask");
    if (confirmMask && !confirmMask.hidden) closeConfirm();
    else if (matMask && !matMask.hidden && window.FZMatDetail) FZMatDetail.close();
    else if (!previewMask.hidden) closePreview();
    else if (!compareMask.hidden) closeCompare();
  });

  if (window.FZPager) {
    FZPager.bind(document.getElementById("art-pager"), {
      getState: function () {
        return { page: page, pageSize: pageSize };
      },
      setState: function (next) {
        if (next.page != null) page = next.page;
        if (next.pageSize != null) pageSize = next.pageSize;
      },
      onChange: render
    });
  }

  if (window.FZMatDetail) FZMatDetail.bind();
})();
