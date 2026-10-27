/* 素材管理 · 三视图筛选（待审 / 全部 / 垃圾） */
(function (w) {
  function blank() {
    return {
      pending: { q: "", sort: "created_at", sortDir: "desc", channel: "" },
      all: { q: "", status: "", category: "", dateFrom: "", dateTo: "" },
      trash: { channel: "", content: "", adCategory: "", hitRule: "", dateFrom: "", dateTo: "" }
    };
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }
  function dayOf(t) {
    return String(t || "").slice(0, 10);
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || "").trim() : "";
  }
  function selectOptions(emptyLabel, values, sel) {
    return (
      '<option value="">' +
      esc(emptyLabel) +
      "</option>" +
      values
        .map(function (c) {
          return '<option value="' + esc(c) + '"' + (sel === c ? " selected" : "") + ">" + esc(c) + "</option>";
        })
        .join("")
    );
  }

  function filterList(items, tab, f) {
    f = f || {};
    var list;
    if (tab === "trash") {
      list = items.filter(function (m) {
        return m.status === "trash";
      });
    } else if (tab === "pending") {
      list = items.filter(function (m) {
        return m.status === "pending";
      });
    } else {
      /* 全部素材：流水线状态，排除垃圾池 */
      list = items.filter(function (m) {
        return m.status !== "trash";
      });
    }

    if (tab === "trash") {
      if (f.channel) list = list.filter(function (m) { return m.channel.indexOf(f.channel) >= 0; });
      if (f.content) {
        var kw = f.content.toLowerCase();
        list = list.filter(function (m) {
          return (m.title + m.id).toLowerCase().indexOf(kw) >= 0;
        });
      }
      if (f.adCategory) list = list.filter(function (m) { return m.adCategory === f.adCategory; });
      if (f.hitRule) list = list.filter(function (m) { return (m.hitRule || "").indexOf(f.hitRule) >= 0; });
      if (f.dateFrom) list = list.filter(function (m) { return dayOf(m.time) >= f.dateFrom; });
      if (f.dateTo) list = list.filter(function (m) { return dayOf(m.time) <= f.dateTo; });
      return list;
    }
    if (tab === "pending") {
      if (f.q) {
        var pq = f.q.toLowerCase();
        list = list.filter(function (m) {
          return (m.title + m.id + m.channel).toLowerCase().indexOf(pq) >= 0;
        });
      }
      if (f.channel) list = list.filter(function (m) { return m.channel === f.channel; });
      var dir = f.sortDir === "asc" ? 1 : -1;
      list.sort(function (a, b) {
        var ka = f.sort === "view_count" ? a.views : f.sort === "interaction_count" ? a.interact : a.time;
        var kb = f.sort === "view_count" ? b.views : f.sort === "interaction_count" ? b.interact : b.time;
        return ka > kb ? dir : ka < kb ? -dir : 0;
      });
      return list;
    }
    /* all */
    if (f.q) {
      var aq = f.q.toLowerCase();
      list = list.filter(function (m) {
        return (m.title + m.id + (m.category || "")).toLowerCase().indexOf(aq) >= 0;
      });
    }
    if (f.status) list = list.filter(function (m) { return m.status === f.status; });
    if (f.category) list = list.filter(function (m) { return m.category === f.category; });
    if (f.dateFrom) list = list.filter(function (m) { return dayOf(m.time) >= f.dateFrom; });
    if (f.dateTo) list = list.filter(function (m) { return dayOf(m.time) <= f.dateTo; });
    /* 全部素材：项目 / 公共池范围（替代原分发频道、分发项目筛） */
    if (tab === "all" && f.scope) list = applyScope(list, f.scope);
    return list;
  }

  function inProject(m, name) {
    if (m.status === "trash") return false;
    if (m.dispatchProject === name) return true;
    return m.belong === "proj" && m.project === name;
  }
  function inPool(m) {
    return m.status !== "trash" && m.belong === "none" && !m.dispatchProject;
  }
  function parseScope(s) {
    if (s === "pool") return { kind: "pool" };
    if (String(s || "").indexOf("proj:") === 0) {
      return { kind: "proj", name: String(s).slice(5) };
    }
    return null;
  }
  function applyScope(list, scopeKey) {
    var sc = parseScope(scopeKey);
    if (!sc) return list;
    if (sc.kind === "pool") return list.filter(inPool);
    return list.filter(function (m) {
      return inProject(m, sc.name);
    });
  }
  function scopeCount(items, scopeKey) {
    return applyScope(
      (items || []).filter(function (m) {
        return m.status !== "trash";
      }),
      scopeKey
    ).length;
  }

  function paintToolbar(tab, f, meta) {
    var AD_CATS = meta.AD_CATS;
    var CHANNELS = meta.CHANNELS;
    f = f || {};
    var html = '<div class="list-toolbar-row" id="mat-filter-row">';
    if (tab === "trash") {
      html +=
        '<input class="input" id="mat-trash-channel" placeholder="频道名" style="max-width:130px" value="' +
        esc(f.channel) +
        '" />' +
        '<input class="input" id="mat-trash-content" placeholder="内容" style="max-width:160px" value="' +
        esc(f.content) +
        '" />' +
        '<select class="input" id="mat-trash-ad" style="max-width:190px"><option value="">全部广告类别</option>' +
        AD_CATS.map(function (c) {
          return (
            '<option value="' +
            esc(c) +
            '"' +
            (f.adCategory === c ? " selected" : "") +
            ">" +
            esc(c) +
            "</option>"
          );
        }).join("") +
        "</select>" +
        '<input class="input" id="mat-trash-rule" placeholder="命中规则" style="max-width:130px" value="' +
        esc(f.hitRule) +
        '" />' +
        '<input class="input" type="date" id="mat-trash-from" title="采集起始日期" style="max-width:150px" value="' +
        esc(f.dateFrom) +
        '" />' +
        '<input class="input" type="date" id="mat-trash-to" title="采集结束日期" style="max-width:150px" value="' +
        esc(f.dateTo) +
        '" />' +
        '<button type="button" class="btn" id="mat-reset">重置</button>';
    } else if (tab === "pending") {
      /* 排序改在表头点选：浏览 / 互动 / 采集时间 */
      html +=
        '<input class="input" id="mat-q" placeholder="搜索标题/标签/编号/内容" style="max-width:240px" value="' +
        esc(f.q) +
        '" />' +
        '<select class="input" id="mat-channel" style="max-width:180px" aria-label="来源频道">' +
        selectOptions("全部来源频道", CHANNELS, f.channel) +
        '</select><button type="button" class="btn" id="mat-merge">消息合并</button>' +
        '<button type="button" class="btn" id="mat-reset">重置</button>';
    } else {
      html +=
        '<input class="input" id="mat-q" placeholder="搜索标题/标签/编号/内容" style="max-width:240px" value="' +
        esc(f.q) +
        '" />' +
        '<select class="input" id="mat-status" style="max-width:160px"><option value="">全部状态</option>' +
        '<option value="pending"' +
        (f.status === "pending" ? " selected" : "") +
        ">待人工审核</option>" +
        '<option value="rejected"' +
        (f.status === "rejected" ? " selected" : "") +
        ">已驳回</option>" +
        '<option value="kept"' +
        (f.status === "kept" ? " selected" : "") +
        ">去重保留</option>" +
        '<option value="duplicate"' +
        (f.status === "duplicate" ? " selected" : "") +
        ">重复淘汰</option>" +
        '<option value="available"' +
        (f.status === "available" ? " selected" : "") +
        ">可使用</option>" +
        '<option value="used"' +
        (f.status === "used" ? " selected" : "") +
        ">已使用</option></select>" +
        '<select class="input" id="mat-category" style="max-width:140px"><option value="">全部分类</option>' +
        '<option value="资讯"' +
        (f.category === "资讯" ? " selected" : "") +
        ">资讯</option>" +
        '<option value="短剧"' +
        (f.category === "短剧" ? " selected" : "") +
        ">短剧</option></select>" +
        '<span class="mat-date-range" title="采集时间">' +
        '<input class="input" type="date" id="mat-date-from" aria-label="采集起始日期" value="' +
        esc(f.dateFrom) +
        '" />' +
        '<span class="mat-date-sep">至</span>' +
        '<input class="input" type="date" id="mat-date-to" aria-label="采集截止日期" value="' +
        esc(f.dateTo) +
        '" /></span>' +
        '<button type="button" class="btn" id="mat-reset">重置</button>';
    }
    html += '<button type="button" class="btn" id="mat-refresh">刷新</button></div>';
    /* 全选在表头；批量操作在有勾选时出现在表上方，不再单独占一排 */
    return html;
  }

  function readFilters(tab, f) {
    if (!f) return;
    if (tab === "trash") {
      f.channel = val("mat-trash-channel");
      f.content = val("mat-trash-content");
      f.adCategory = val("mat-trash-ad");
      f.hitRule = val("mat-trash-rule");
      f.dateFrom = val("mat-trash-from");
      f.dateTo = val("mat-trash-to");
      return;
    }
    if (tab === "pending") {
      f.q = val("mat-q");
      f.channel = val("mat-channel");
      return;
    }
    f.q = val("mat-q");
    f.status = val("mat-status");
    f.category = val("mat-category");
    f.dateFrom = val("mat-date-from");
    f.dateTo = val("mat-date-to");
  }

  w.FZMatFilters = {
    blank: blank,
    esc: esc,
    filterList: filterList,
    paintToolbar: paintToolbar,
    readFilters: readFilters,
    parseScope: parseScope,
    scopeCount: scopeCount,
    inProject: inProject,
    inPool: inPool
  };
})(window);
