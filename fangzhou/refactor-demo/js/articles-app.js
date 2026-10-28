/* 文章管理 · 列表（布局可点；次要能力 Toast，布局确认后再做真交互） */
(function () {
  FZShell.boot({ active: "e_art" });

  var page = 1;
  var pageSize = window.FZPager ? window.FZPager.DEFAULT : 20;
  var filter = { projectId: "", status: "", qId: "", qTitle: "", qOp: "" };
  var ACT_LABEL = {
    retry: "重试",
    release: "释放占用",
    preview: "预览",
    compare: "版本对比",
    source: "原素材",
    delete: "删除",
    mat: "查看素材"
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toastStub(name) {
    FZShell.toast(name + " · 布局确认后再做具体交互（Demo）");
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
    var opts =
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
    st.innerHTML = opts;
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
        '<a class="btn btn-sm btn-primary" href="./article-edit.html?id=' +
          id +
          '">重新编辑</a>'
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
      "<tr" +
      (preview
        ? ' class="art-row--preview" data-preview-id="' + a.id + '" tabindex="0"'
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

  function closeAllMenus() {
    document.querySelectorAll(".art-more-menu").forEach(function (m) {
      m.hidden = true;
    });
  }

  function bindRow(box) {
    box.querySelectorAll("[data-act]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        closeAllMenus();
        var act = btn.getAttribute("data-act");
        toastStub(ACT_LABEL[act] || act);
      });
    });

    box.querySelectorAll(".art-more-btn").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var menu = btn.parentElement.querySelector(".art-more-menu");
        var open = menu && !menu.hidden;
        closeAllMenus();
        if (menu && !open) menu.hidden = false;
      });
    });

    box.querySelectorAll("a, [data-stop-row]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });

    box.querySelectorAll("tr.art-row--preview").forEach(function (tr) {
      function goPreview() {
        toastStub("预览 #" + tr.getAttribute("data-preview-id"));
      }
      tr.addEventListener("click", goPreview);
      tr.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goPreview();
        }
      });
    });
  }

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
  }

  paintFilter();
  render();

  document.getElementById("art-f-search").addEventListener("click", function () {
    readFilter();
    page = 1;
    render();
  });
  document.getElementById("art-f-clear").addEventListener("click", clearFilter);
  document.getElementById("art-f-refresh").addEventListener("click", function () {
    render();
    FZShell.toast("已刷新", "ok");
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

  document.addEventListener("click", closeAllMenus);

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
})();
