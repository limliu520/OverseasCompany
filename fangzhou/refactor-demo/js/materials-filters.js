/* 素材管理 · 三视图筛选（待审 / 全部 / 垃圾） */
(function (w) {
  function blank() {
    return {
      pending: { q: "", sort: "created_at", sortDir: "desc", channel: "" },
      all: { q: "", status: "", category: "", channel: "", belong: "" },
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
  function channelOptions(channels, sel) {
    return (
      '<option value="">全部频道</option>' +
      channels
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
    if (f.channel) list = list.filter(function (m) { return m.channel === f.channel; });
    if (f.belong === "none") list = list.filter(function (m) { return m.belong === "none"; });
    if (f.belong === "proj") list = list.filter(function (m) { return m.belong === "proj"; });
    return list;
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
      html +=
        '<input class="input" id="mat-q" placeholder="搜索标题/标签/编号/内容" style="max-width:240px" value="' +
        esc(f.q) +
        '" />' +
        '<select class="input" id="mat-sort" style="max-width:130px">' +
        '<option value="created_at"' +
        (f.sort === "created_at" ? " selected" : "") +
        ">采集时间</option>" +
        '<option value="view_count"' +
        (f.sort === "view_count" ? " selected" : "") +
        ">浏览量</option>" +
        '<option value="interaction_count"' +
        (f.sort === "interaction_count" ? " selected" : "") +
        ">互动量</option></select>" +
        '<button type="button" class="btn" id="mat-sort-dir" title="切换排序方向">' +
        (f.sortDir === "asc" ? "↑" : "↓") +
        "</button>" +
        '<select class="input" id="mat-channel" style="max-width:180px">' +
        channelOptions(CHANNELS, f.channel) +
        '</select><button type="button" class="btn" id="mat-merge">消息合并</button>';
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
        '<select class="input" id="mat-channel" style="max-width:180px">' +
        channelOptions(CHANNELS, f.channel) +
        "</select>" +
        '<span class="mat-filter-with-tip">' +
        '<select class="input" id="mat-belong" style="max-width:150px" aria-label="归属"><option value="">全部归属</option>' +
        '<option value="none"' +
        (f.belong === "none" ? " selected" : "") +
        ">公共池</option>" +
        '<option value="proj"' +
        (f.belong === "proj" ? " selected" : "") +
        ">业务项目</option></select>" +
        '<button type="button" class="field-tip" aria-label="归属说明">' +
        '<span class="field-tip-ico" aria-hidden="true">?</span>' +
        '<span class="field-tip-bubble" role="tooltip">对齐现网「全部归属」筛：公共池=未绑专属项目的料；业务项目=专属站点/项目内的料。与列表「分发项目」列不同：筛的是素材归属，列的是已转到哪些项目。</span>' +
        "</button></span>";
    }
    html += '<button type="button" class="btn" id="mat-refresh">刷新</button></div>';
    html += '<div class="list-toolbar-row list-toolbar-actions">';
    html += '<label class="check-inline"><input type="checkbox" id="mat-check-all" /> 全选本页</label>';
    if (tab === "pending") {
      html +=
        '<button type="button" class="btn btn-ghost btn-sm" data-bulk="pass">通过</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-bulk="reject">驳回</button>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-bulk="edit">转编辑</button>';
    } else if (tab === "all") {
      html += '<button type="button" class="btn btn-ghost btn-sm" data-bulk="edit">转编辑</button>';
    } else if (tab === "trash") {
      html += '<button type="button" class="btn btn-ghost btn-sm" data-bulk="restore">手动通过</button>';
    }
    html += "</div>";
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
      f.sort = val("mat-sort") || "created_at";
      f.channel = val("mat-channel");
      return;
    }
    f.q = val("mat-q");
    f.status = val("mat-status");
    f.category = val("mat-category");
    f.channel = val("mat-channel");
    f.belong = val("mat-belong");
  }

  w.FZMatFilters = {
    blank: blank,
    esc: esc,
    filterList: filterList,
    paintToolbar: paintToolbar,
    readFilters: readFilters
  };
})(window);
