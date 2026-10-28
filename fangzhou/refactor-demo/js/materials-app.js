/* 素材管理：三视图（待审核素材 / 全部素材 / 垃圾素材）；全部素材下挂项目/公共池范围 */
(function () {
  var D = window.FZMatData;
  var Fil = window.FZMatFilters;
  var Tbl = window.FZMatTable;
  var TABS = D.TABS;
  var ITEMS = D.ITEMS;
  var LABEL = D.LABEL;
  var PROJECTS = D.DISPATCH_PROJECTS || ["演示瓜站", "演示视频站", "演示短剧站"];
  var F = Fil.blank();
  var esc = Fil.esc;

  var q = new URLSearchParams(location.search);
  var tab = q.get("tab") || "all";
  if (!TABS.some(function (t) { return t.id === tab; })) tab = "all";
  var page = 1;
  var pageSize = window.FZPager ? window.FZPager.DEFAULT : 20;
  var scope = q.get("scope") || "proj:" + PROJECTS[0];
  if (!Fil.parseScope(scope) || (Fil.parseScope(scope).kind === "proj" && PROJECTS.indexOf(Fil.parseScope(scope).name) < 0)) {
    scope = "proj:" + PROJECTS[0];
  }
  F.all.scope = scope;
  var selected = Object.create(null);

  function selectedIds() {
    return Object.keys(selected).filter(function (id) {
      return selected[id];
    });
  }
  function clearSelected() {
    selected = Object.create(null);
  }
  function bulkActsHtml() {
    if (tab === "pending") {
      return (
        '<button type="button" class="btn btn-sm btn-primary" data-bulk="pass">通过</button>' +
        '<button type="button" class="btn btn-sm btn-danger" data-bulk="reject">驳回</button>' +
        '<button type="button" class="btn btn-sm" data-bulk="edit">转编辑</button>'
      );
    }
    if (tab === "trash") {
      return '<button type="button" class="btn btn-sm btn-primary" data-bulk="restore">手动通过</button>';
    }
    return '<button type="button" class="btn btn-sm btn-primary" data-bulk="edit">转编辑</button>';
  }
  function bulkBarHtml() {
    var n = selectedIds().length;
    if (!n) return "";
    return (
      '<div class="mat-bulk-bar" id="mat-bulk-bar">' +
      '<span class="mat-bulk-count">已选 ' +
      n +
      " 项</span>" +
      '<div class="mat-bulk-acts">' +
      bulkActsHtml() +
      '<button type="button" class="btn btn-sm btn-ghost" data-bulk-clear>取消选择</button>' +
      "</div></div>"
    );
  }
  function syncChecks() {
    var ids = [];
    document.querySelectorAll("#mat-root .mat-row-check").forEach(function (ck) {
      var id = ck.getAttribute("data-id");
      ck.checked = !!selected[id];
      if (id) ids.push(id);
    });
    var all = document.getElementById("mat-check-all");
    if (all) {
      var onPage = ids.filter(function (id) {
        return selected[id];
      }).length;
      all.checked = ids.length > 0 && onPage === ids.length;
      all.indeterminate = onPage > 0 && onPage < ids.length;
    }
  }

  function findItem(id) {
    var i;
    for (i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
    return null;
  }
  function openTargets(id) {
    var m = findItem(id);
    var mask = document.getElementById("mat-targets-mask");
    var bd = document.getElementById("mat-targets-bd");
    var title = document.getElementById("mat-targets-title");
    if (!mask || !bd || !m) return;
    var list =
      m.targetChannels && m.targetChannels.length
        ? m.targetChannels
        : m.targetChannel
          ? [m.targetChannel]
          : [];
    var logs = m.dispatchLogs || [];
    if (title) title.textContent = "分发频道 · " + (m.formalNumber || m.id);
    if (!list.length) {
      bd.innerHTML = '<p class="muted" style="margin:0">暂无分发频道</p>';
    } else {
      bd.innerHTML =
        '<ul class="mat-targets-list">' +
        list
          .map(function (t) {
            var log = null;
            var j;
            for (j = 0; j < logs.length; j++) {
              if (logs[j].target === t) {
                log = logs[j];
                break;
              }
            }
            return (
              "<li><span class=\"mono mat-channel\">" +
              esc(t) +
              "</span>" +
              (log
                ? '<span class="mat-targets-meta">' +
                  esc(log.status || "") +
                  (log.time ? " · " + esc(log.time) : "") +
                  "</span>"
                : "") +
              "</li>"
            );
          })
          .join("") +
        "</ul>";
    }
    mask.hidden = false;
  }
  function closeTargets() {
    var mask = document.getElementById("mat-targets-mask");
    if (mask) mask.hidden = true;
  }
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
    if (tab === "all") F.all.scope = scope;
    return Fil.filterList(ITEMS, tab, F[tab]);
  }
  function setTab(next) {
    tab = next;
    page = 1;
    clearSelected();
    var u = new URL(location.href);
    u.searchParams.set("tab", tab);
    if (tab === "all") u.searchParams.set("scope", scope);
    else u.searchParams.delete("scope");
    history.replaceState(null, "", u.pathname + u.search);
    paint();
  }
  function setScope(next) {
    scope = next;
    F.all.scope = scope;
    page = 1;
    clearSelected();
    var u = new URL(location.href);
    u.searchParams.set("tab", "all");
    u.searchParams.set("scope", scope);
    history.replaceState(null, "", u.pathname + u.search);
    paintScopes();
    paintToolbar();
    paintTable();
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
  function paintScopes() {
    var el = document.getElementById("mat-scopes");
    if (!el) return;
    if (tab !== "all") {
      el.hidden = true;
      el.innerHTML = "";
      return;
    }
    el.hidden = false;
    var parts = [
      '<button type="button" class="mat-v2-scope mat-v2-scope--pool' +
        (scope === "pool" ? " is-on" : "") +
        '" data-scope="pool"><span class="mat-v2-scope-name">公共池</span><span class="mat-v2-scope-n">' +
        Fil.scopeCount(ITEMS, "pool") +
        "</span></button>"
    ];
    PROJECTS.forEach(function (name) {
      var key = "proj:" + name;
      var n = Fil.scopeCount(ITEMS, key);
      var typeLabel =
        (D.siteTypeLabel && D.siteTypeLabel(name)) ||
        (D.SITE_TYPE_LABEL &&
          D.SITE_TYPE_LABEL[D.PROJECT_SITE_TYPE && D.PROJECT_SITE_TYPE[name]]) ||
        "";
      parts.push(
        '<button type="button" class="mat-v2-scope' +
          (scope === key ? " is-on" : "") +
          '" data-scope="' +
          esc(key) +
          '" title="' +
          esc(name + (typeLabel ? " · " + typeLabel : "")) +
          '"><span class="mat-v2-scope-name">' +
          esc(name) +
          "</span>" +
          (typeLabel
            ? '<span class="mat-v2-scope-type">' + esc(typeLabel) + "</span>"
            : "") +
          '<span class="mat-v2-scope-n">' +
          n +
          "</span></button>"
      );
    });
    el.innerHTML = parts.join("");
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
      clearSelected();
      document.getElementById("mat-root").innerHTML =
        '<div class="empty-dash" style="min-height:120px">当前视图暂无素材</div>';
      return;
    }
    var sortState =
      tab === "pending"
        ? { sort: F.pending.sort || "created_at", sortDir: F.pending.sortDir || "desc" }
        : null;
    var scopeCtx = tab === "all" ? Fil.parseScope(scope) : null;
    document.getElementById("mat-root").innerHTML =
      bulkBarHtml() +
      '<div class="table-card table-card--mat"><table class="fz-table fz-table--mat">' +
      Tbl.headHtml(esc, tab, sortState, scopeCtx) +
      "<tbody>" +
      slice.items
        .map(function (m) {
          return Tbl.rowHtml(esc, tab, LABEL, m, scopeCtx);
        })
        .join("") +
      "</tbody></table></div>" +
      (P ? P.html({ total: slice.total, page: slice.page, pageSize: slice.pageSize }) : "");
    syncChecks();
  }
  function applyFiltersAndPaint() {
    Fil.readFilters(tab, F[tab]);
    if (tab === "all") F.all.scope = scope;
    page = 1;
    paintTable();
  }
  function paint() {
    paintTabs();
    paintScopes();
    paintToolbar();
    paintTable();
  }
  function bind() {
    document.getElementById("mat-tabs").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-tab]");
      if (btn) setTab(btn.getAttribute("data-tab"));
    });
    var targetsMask = document.getElementById("mat-targets-mask");
    if (targetsMask && !targetsMask._bound) {
      targetsMask._bound = true;
      targetsMask.addEventListener("click", function (e) {
        if (e.target === targetsMask || e.target.closest("[data-targets-close]")) closeTargets();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key !== "Escape") return;
        if (!targetsMask.hidden) closeTargets();
      });
    }
    var scopes = document.getElementById("mat-scopes");
    if (scopes) {
      scopes.addEventListener("click", function (e) {
        var b = e.target.closest("[data-scope]");
        if (b) setScope(b.getAttribute("data-scope"));
      });
    }
    var bar = document.getElementById("mat-toolbar");
    bar.addEventListener("click", function (e) {
      if (e.target.id === "mat-refresh") {
        if (window.FZMatData && typeof FZMatData.reset === "function") {
          FZMatData.reset();
        }
        page = 1;
        applyFiltersAndPaint();
        FZShell.toast("已重置并刷新本列表（筛选与 Tab 保留）", "ok");
        return;
      }
      if (e.target.id === "mat-reset") {
        F[tab] = Fil.blank()[tab] || {};
        if (tab === "all") F.all.scope = scope;
        page = 1;
        paint();
        FZShell.toast("已重置筛选条件", "ok");
        return;
      }
      if (e.target.id === "mat-merge") {
        FZShell.toast("Demo：消息合并（对齐现网人工审核）", "ok");
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
      if (e.target.closest("[data-bulk-clear]")) {
        clearSelected();
        paintTable();
        return;
      }
      var bulk = e.target.closest("[data-bulk]");
      if (bulk) {
        var n = selectedIds().length;
        if (!n) {
          FZShell.toast("请先勾选素材", "err");
          return;
        }
        FZShell.toast("Demo：批量「" + bulk.getAttribute("data-bulk") + "」" + n + " 条", "ok");
        return;
      }
      var copyNum = e.target.closest("[data-copy-num]");
      if (copyNum) {
        e.stopPropagation();
        var text = copyNum.getAttribute("data-copy-num") || "";
        function copied() {
          FZShell.toast("已复制编号 " + text, "ok");
        }
        function failCopy() {
          FZShell.toast("复制失败，请手动选择编号", "err");
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(copied).catch(failCopy);
        } else {
          try {
            var ta = document.createElement("textarea");
            ta.value = text;
            ta.setAttribute("readonly", "");
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            copied();
          } catch (err) {
            failCopy();
          }
        }
        return;
      }
      var sortTh = e.target.closest("[data-sort]");
      if (sortTh) {
        var key = sortTh.getAttribute("data-sort");
        if (F.pending.sort === key) {
          F.pending.sortDir = F.pending.sortDir === "asc" ? "desc" : "asc";
        } else {
          F.pending.sort = key;
          F.pending.sortDir = "desc";
        }
        page = 1;
        paintTable();
        return;
      }
      var tgtBtn = e.target.closest("[data-row-targets]");
      if (tgtBtn) {
        e.stopPropagation();
        openTargets(tgtBtn.getAttribute("data-row-targets"));
        return;
      }
      var btn = e.target.closest("[data-row]");
      var list = filtered();
      if (btn) {
        var id =
          btn.getAttribute("data-id") ||
          (btn.closest("tr[data-id]") && btn.closest("tr[data-id]").getAttribute("data-id"));
        if (!id) return;
        var act = btn.getAttribute("data-row");
        if (act === "detail" && window.FZMatDetail) {
          window.FZMatDetail.open(id, list);
          return;
        }
        if (act === "edit" && window.FZMatTransfer) {
          window.FZMatTransfer.open(id);
          return;
        }
        if ((act === "reject" || act === "pass") && window.FZMatTransfer) {
          window.FZMatTransfer.openReject(id, act === "pass" ? "pass" : "reject");
          return;
        }
        if (act === "restore" && window.FZMatTransfer) {
          window.FZMatTransfer.openReject(id, "restore");
        }
        return;
      }
      if (e.target.closest("input,button,a,label,.field-tip,.pager,.mat-bulk-bar,.mat-targets-btn")) return;
      var tr = e.target.closest("#mat-root tbody tr[data-id]");
      if (!tr || !window.FZMatDetail) return;
      window.FZMatDetail.open(tr.getAttribute("data-id"), list);
    });
    document.getElementById("mat-root").addEventListener("change", function (e) {
      var t = e.target;
      if (t.id === "mat-check-all") {
        document.querySelectorAll("#mat-root .mat-row-check").forEach(function (ck) {
          var id = ck.getAttribute("data-id");
          if (!id) return;
          if (t.checked) selected[id] = true;
          else delete selected[id];
        });
        paintTable();
        return;
      }
      if (t.classList && t.classList.contains("mat-row-check")) {
        var rid = t.getAttribute("data-id");
        if (!rid) return;
        if (t.checked) selected[rid] = true;
        else delete selected[rid];
        paintTable();
      }
    });
  }
  function boot() {
    FZShell.boot({ active: "c_mat" });
    bind();
    if (window.FZMatDetail) window.FZMatDetail.bind();
    if (window.FZMatTransfer) window.FZMatTransfer.bind();
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
