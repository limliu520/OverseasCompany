/* 网站采集：站点卡片 + 记录列表 */
(function () {
  var R = window.FZWebCollectRender;
  var M = window.FZWebCollectModal;
  var D = window.FZWebCollectData;
  var P = window.FZPager;
  var sites = D.sites.slice();
  var records = D.records;
  var selectedId = "w1";
  var filterStatus = "";
  var filterQ = "";
  var filterDate = "";
  var page = 1;
  var pageSize = P.DEFAULT;
  var refreshTimer = null;
  var ACTIVE = { pending: 1, running: 1, retry_requested: 1, processing: 1 };

  function filtered() {
    return records.filter(function (r) {
      if (selectedId && r.siteId !== selectedId) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterDate && String(r.time || "").slice(0, 10) !== filterDate) return false;
      if (filterQ) {
        var q = filterQ.toLowerCase();
        if ((r.title + r.url + r.target + r.id).toLowerCase().indexOf(q) === -1) {
          return false;
        }
      }
      return true;
    });
  }

  function scheduleRefresh(list) {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    var busy = (list || []).some(function (r) {
      return ACTIVE[r.status];
    });
    if (!busy) return;
    refreshTimer = setTimeout(function () {
      paintRecords();
    }, 5000);
  }

  function paintRecords() {
    var all = filtered();
    var slice = P.slice(all, page, pageSize);
    page = slice.page;
    pageSize = slice.pageSize;
    document.getElementById("wc-records").innerHTML = R.records(slice.items, {
      total: slice.total,
      page: slice.page,
      pageSize: slice.pageSize
    });
    scheduleRefresh(all);
  }

  function paint() {
    var site = sites.find(function (s) {
      return s.id === selectedId;
    });
    document.getElementById("wc-sites").innerHTML = R.sites(sites, selectedId);
    document.getElementById("wc-record-title").textContent = site
      ? "采集记录 · " + site.name
      : "采集记录";
    document.getElementById("wc-filters").innerHTML = R.filters(
      filterQ,
      filterStatus,
      filterDate
    );
    var sel = document.getElementById("wc-st");
    if (sel) sel.value = filterStatus;
    paintRecords();
  }

  function onModalDone(nextSites, deletedId) {
    sites = nextSites;
    if (deletedId && selectedId === deletedId) {
      selectedId = sites[0] ? sites[0].id : "";
    }
    paint();
  }

  function bind() {
    document.getElementById("btn-add-site").onclick = function () {
      M.open(null, "create", sites, onModalDone);
    };
    M.bind();
    document.getElementById("wc-sites").addEventListener("click", function (e) {
      var detail = e.target.closest("[data-detail]");
      if (detail) {
        e.preventDefault();
        e.stopPropagation();
        M.open(detail.getAttribute("data-detail"), "view", sites, onModalDone);
        return;
      }
      var tog = e.target.closest("[data-toggle]");
      if (tog) {
        e.preventDefault();
        e.stopPropagation();
        var site = sites.find(function (x) {
          return x.id === tog.getAttribute("data-toggle");
        });
        var to = tog.getAttribute("data-to");
        if (!site) return;
        if (to === "paused" && site.status === "active") {
          site.status = "paused";
          site.nextAt = "—";
          FZShell.toast("已暂停", "ok");
        } else if (to === "active" && site.status === "paused") {
          site.status = "active";
          site.nextAt = "待调度";
          FZShell.toast("已启动", "ok");
        } else {
          FZShell.toast("当前状态不可切换", "err");
          return;
        }
        paint();
        return;
      }
      var card = e.target.closest("[data-site]");
      if (card) {
        selectedId = card.getAttribute("data-site");
        page = 1;
        paint();
      }
    });
    document.getElementById("wc-filters").addEventListener("click", function (e) {
      if (e.target.id === "wc-refresh") {
        if (typeof D.resetDemo === "function") D.resetDemo();
        sites = D.sites.slice();
        records = D.records;
        page = 1;
        paint();
        FZShell.toast("已重置并刷新本列表（筛选保留）", "ok");
      }
      if (e.target.id === "wc-reset") {
        filterQ = "";
        filterStatus = "";
        filterDate = "";
        page = 1;
        paint();
        FZShell.toast("已重置筛选", "ok");
      }
    });
    document.getElementById("wc-filters").addEventListener("change", function (e) {
      if (e.target.id === "wc-st") {
        filterStatus = e.target.value;
        page = 1;
        paint();
      }
      if (e.target.id === "wc-date") {
        filterDate = e.target.value;
        page = 1;
        paint();
      }
    });
    document.getElementById("wc-filters").addEventListener("input", function (e) {
      if (e.target.id === "wc-q") {
        filterQ = e.target.value.trim();
        page = 1;
        paintRecords();
      }
    });
    P.bind(document.getElementById("wc-records"), {
      getState: function () {
        return { page: page, pageSize: pageSize };
      },
      setState: function (next) {
        if (next.page != null) page = next.page;
        if (next.pageSize != null) pageSize = next.pageSize;
      },
      onChange: paintRecords
    });
    document.getElementById("wc-records").addEventListener("click", function (e) {
      var prog = e.target.closest("[data-prog]");
      if (prog) {
        var rec = records.find(function (x) {
          return x.id === Number(prog.getAttribute("data-prog"));
        });
        document.getElementById("wc-prog-body").innerHTML = R.progressBody(rec);
        document.getElementById("wc-prog-modal").hidden = false;
        return;
      }
      var act = e.target.closest("[data-act]");
      if (act) {
        var id = act.getAttribute("data-id");
        var kind = act.getAttribute("data-act");
        if (kind === "stop") {
          if (!confirm("确认停止采集任务 #" + id + "？停止后任务将标记为失败。")) return;
          var row = records.find(function (x) {
            return x.id === Number(id);
          });
          if (row) {
            row.status = "failed";
            row.err = "采集任务已由管理员手动停止";
            row.progress = [];
          }
          FZShell.toast("采集任务已停止并标记为失败", "ok");
          paintRecords();
          return;
        }
        var retryRow = records.find(function (x) {
          return x.id === Number(id);
        });
        if (retryRow) {
          retryRow.status = "pending";
          retryRow.err = "";
        }
        FZShell.toast("已加入待执行队列 #" + id, "ok");
        paintRecords();
        return;
      }
      if (e.target.closest("[data-goto]")) FZShell.toast("Demo：跳转素材管理 / 审核", "ok");
    });
    document.getElementById("wc-prog-close").onclick = function () {
      document.getElementById("wc-prog-modal").hidden = true;
    };
    document.getElementById("wc-prog-modal").addEventListener("click", function (e) {
      if (e.target.id === "wc-prog-modal") e.target.hidden = true;
    });
  }

  function boot() {
    FZShell.boot({ active: "c_web" });
    bind();
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
