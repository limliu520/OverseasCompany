/* 素材管理：三视图（待我审核 / 全部素材 / 垃圾素材） */
(function () {
  var D = window.FZMatData;
  var Fil = window.FZMatFilters;
  var Tbl = window.FZMatTable;
  var TABS = D.TABS;
  var ITEMS = D.ITEMS;
  var LABEL = D.LABEL;
  var F = Fil.blank();
  var esc = Fil.esc;

  var q = new URLSearchParams(location.search);
  var tab = q.get("tab") || "all";
  if (!TABS.some(function (t) { return t.id === tab; })) tab = "all";
  var page = 1;
  var pageSize = window.FZPager ? window.FZPager.DEFAULT : 20;

  function counts() {
    var c = { pending: 0, trash: 0, all: 0 };
    ITEMS.forEach(function (m) {
      if (m.status === "trash") c.trash++;
      else {
        c.all++;
        if (m.status === "pending") c.pending++;
      }
    });
    return c;
  }
  function filtered() {
    return Fil.filterList(ITEMS, tab, F[tab]);
  }
  function setTab(next) {
    tab = next;
    page = 1;
    var u = new URL(location.href);
    u.searchParams.set("tab", tab);
    history.replaceState(null, "", u.pathname + u.search);
    paint();
  }
  function paintTabs() {
    var c = counts();
    document.getElementById("mat-tabs").innerHTML = TABS.map(function (t) {
      var n = t.id === "all" ? c.all : t.id === "pending" ? c.pending : c.trash;
      return (
        '<button type="button" class="btn' +
        (t.id === tab ? " btn-primary" : "") +
        '" data-tab="' +
        t.id +
        '">' +
        esc(t.label) +
        (n ? '<span class="tab-count">' + n + "</span>" : "") +
        "</button>"
      );
    }).join("");
  }
  function paintToolbar() {
    document.getElementById("mat-toolbar").innerHTML = Fil.paintToolbar(tab, F[tab], D);
  }
  function paintTable() {
    var all = filtered();
    var P = window.FZPager;
    var slice = P
      ? P.slice(all, page, pageSize)
      : { items: all, total: all.length, page: 1, pageSize: all.length || 20 };
    page = slice.page;
    pageSize = slice.pageSize;
    if (!all.length) {
      document.getElementById("mat-root").innerHTML =
        '<div class="empty-dash" style="min-height:120px">当前视图暂无素材</div>';
      return;
    }
    document.getElementById("mat-root").innerHTML =
      '<div class="table-card"><table class="fz-table">' +
      Tbl.headHtml(esc, tab) +
      "<tbody>" +
      slice.items
        .map(function (m) {
          return Tbl.rowHtml(esc, tab, LABEL, m);
        })
        .join("") +
      "</tbody></table></div>" +
      (P ? P.html({ total: slice.total, page: slice.page, pageSize: slice.pageSize }) : "");
  }
  function applyFiltersAndPaint() {
    Fil.readFilters(tab, F[tab]);
    page = 1;
    paintTable();
  }
  function paint() {
    paintTabs();
    paintToolbar();
    paintTable();
  }
  function bind() {
    document.getElementById("mat-tabs").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tab]");
      if (btn) setTab(btn.getAttribute("data-tab"));
    });
    var bar = document.getElementById("mat-toolbar");
    bar.addEventListener("click", function (e) {
      if (e.target.id === "mat-refresh") {
        FZShell.toast("已刷新当前列表（筛选与 Tab 保留）", "ok");
        applyFiltersAndPaint();
        return;
      }
      if (e.target.id === "mat-reset") {
        F[tab] = Fil.blank()[tab] || {};
        page = 1;
        paint();
        FZShell.toast("已重置筛选条件", "ok");
        return;
      }
      if (e.target.id === "mat-sort-dir") {
        F.pending.sortDir = F.pending.sortDir === "asc" ? "desc" : "asc";
        page = 1;
        paint();
        return;
      }
      if (e.target.id === "mat-merge") {
        FZShell.toast("Demo：消息合并（对齐现网人工审核）", "ok");
        return;
      }
      var bulk = e.target.closest("[data-bulk]");
      if (bulk) {
        FZShell.toast("Demo：批量「" + bulk.getAttribute("data-bulk") + "」（需先勾选）", "ok");
      }
    });
    bar.addEventListener("change", function (e) {
      if (!e.target.closest("#mat-filter-row")) return;
      applyFiltersAndPaint();
    });
    bar.addEventListener("input", function (e) {
      if (!e.target.closest("#mat-filter-row")) return;
      if (e.target.tagName === "SELECT") return;
      clearTimeout(bar._t);
      bar._t = setTimeout(applyFiltersAndPaint, 250);
    });
    if (window.FZPager) {
      window.FZPager.bind(document.getElementById("mat-root"), {
        getState: function () {
          return { page: page, pageSize: pageSize };
        },
        setState: function (next) {
          if (next.page != null) page = next.page;
          if (next.pageSize != null) pageSize = next.pageSize;
        },
        onChange: paintTable
      });
    }
    document.getElementById("mat-root").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-row]");
      if (!btn) return;
      var map = {
        detail: "打开详情",
        dl: "下载素材",
        pass: "通过",
        reject: "驳回",
        edit: "转编辑",
        restore: "手动通过（出垃圾）"
      };
      FZShell.toast("Demo：" + (map[btn.getAttribute("data-row")] || ""), "ok");
    });
  }
  function boot() {
    FZShell.boot({ active: "c_mat" });
    bind();
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
