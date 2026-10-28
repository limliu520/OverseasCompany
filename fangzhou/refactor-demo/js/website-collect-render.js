/* 网站采集 · 渲染 */
window.FZWebCollectRender = (function () {
  var D = window.FZWebCollectData;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }
  function fmtDur(sec) {
    if (sec == null) return "—";
    var s = Math.max(0, Number(sec) || 0);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = Math.floor(s % 60);
    if (h) return h + "小时" + m + "分" + r + "秒";
    if (m) return m + "分" + r + "秒";
    return r + "秒";
  }
  function fmtBytes(n) {
    var b = Math.max(0, Number(n) || 0);
    if (b < 1024) return Math.floor(b) + " B";
    var u = ["KB", "MB", "GB"];
    var v = b / 1024;
    var i = 0;
    while (v >= 1024 && i < u.length - 1) {
      v /= 1024;
      i++;
    }
    return v.toFixed(1) + " " + u[i];
  }
  function statusBadge(st, err) {
    var map = {
      completed: ["已完成", "badge-ok"],
      running: ["采集中", "badge-warn"],
      failed: ["失败", "badge-danger"],
      processing: ["处理中", "badge-info"],
      pending: ["待采集", "badge-muted"],
      retry_requested: ["准备重试", "badge-warn"]
    };
    var x = map[st] || [st || "未知", "badge-muted"];
    var tip =
      err && st !== "completed" ? ' title="' + esc(err) + '"' : "";
    return (
      '<span class="badge ' + x[1] + '"' + tip + ">" + esc(x[0]) + "</span>"
    );
  }
  function timeHtml(t) {
    var parts = String(t || "").trim().split(/\s+/);
    if (parts.length >= 2) {
      return (
        '<td class="mono wc-td-time"><span class="wc-time-d">' +
        esc(parts[0]) +
        '</span><span class="wc-time-t">' +
        esc(parts.slice(1).join(" ")) +
        "</span></td>"
      );
    }
    return '<td class="mono wc-td-time">' + esc(t || "—") + "</td>";
  }
  /** 按钮上的整体进度摘要；点开弹窗看分片明细 */
  function progressBtn(r) {
    var items = r.progress || [];
    var label = "查看进度";
    if (items.length) {
      var dl = 0;
      var total = 0;
      var done = 0;
      items.forEach(function (p) {
        dl += Number(p.dl) || 0;
        total += Number(p.total) || 0;
        if (p.stage === "downloaded" || (p.seg > 0 && p.segDone >= p.seg)) {
          done += 1;
        }
      });
      label = done + "/" + items.length;
      if (total > 0) label += " · " + Math.min(100, Math.round((dl / total) * 100)) + "%";
      else if (dl > 0) label += " · " + fmtBytes(dl);
    } else if (r.status === "completed") {
      label = "已完成";
    } else if (r.status === "failed" || r.status === "pending") {
      label = "—";
    }
    if (label === "—") {
      return '<span class="muted">—</span>';
    }
    return (
      '<button type="button" class="btn btn-sm wc-prog-btn" data-prog="' +
      r.id +
      '" title="查看完整分片 / 下载进度">' +
      esc(label) +
      "</button>"
    );
  }
  function matDisplayState(st) {
    var map = {
      duplicate: { label: "重复素材", cls: "badge-muted" },
      rejected: { label: "已拒绝", cls: "badge-danger" },
      error: { label: "处理异常", cls: "badge-danger" },
      dispatch_failed: { label: "分发失败", cls: "badge-danger" },
      processing: { label: "处理中", cls: "badge-warn" }
    };
    return map[st] || { label: "处理中", cls: "badge-warn" };
  }
  function matsHtml(r) {
    if (r.status !== "completed") return "—";
    if (!r.mats.length) {
      return r.videoN > 0 ? '<span class="badge badge-danger">素材记录缺失</span>' : "—";
    }
    return r.mats
      .map(function (m) {
        if (m.st === "manual_review") {
          return (
            '<button type="button" class="wc-jump-link" data-goto="review" title="待人工审核 · 点编号进审核">' +
            esc(m.no || "人工审核") +
            "</button>"
          );
        }
        if (m.no) {
          return (
            '<button type="button" class="wc-jump-link" data-goto="mat" title="在素材管理中查看">' +
            esc(m.no) +
            "</button>"
          );
        }
        var ds = matDisplayState(m.st);
        return (
          '<span class="badge ' +
          ds.cls +
          '" title="无正式编号">' +
          esc(ds.label) +
          "</span>"
        );
      })
      .join(" ");
  }
  function rowActions(r) {
    if (r.status === "running") {
      return '<button type="button" class="btn btn-ghost btn-sm" data-act="stop" data-id="' + r.id + '">停止</button>';
    }
    if (r.status === "failed" || r.status === "processing") {
      return '<button type="button" class="btn btn-ghost btn-sm" data-act="retry" data-id="' + r.id + '">重试</button>';
    }
    return "—";
  }

  function sites(list, selectedId) {
    return list
      .map(function (s) {
        var st = D.STATUS[s.status] || { label: s.status, cls: "" };
        var targets = s.targets || [];
        var typeLabel = D.SITE_TYPES[s.type] || s.type || "—";
        var bindHtml = targets.length
          ? '<div class="wc-site-bind">' +
            '<div class="wc-site-bind-hd muted">绑 ' +
            targets.length +
            "/" +
            D.MAX_BIND +
            " 项目</div>" +
            '<ul class="wc-site-bind-list">' +
            targets
              .map(function (t) {
                return "<li>" + esc(t) + "</li>";
              })
              .join("") +
            "</ul></div>"
          : '<div class="wc-site-bind muted">未绑定项目</div>';
        var ops = "";
        if (s.status === "active") {
          ops =
            '<button type="button" class="btn btn-sm wc-btn-pause" data-toggle="' +
            esc(s.id) +
            '" data-to="paused">暂停</button>';
        } else if (s.status === "paused") {
          ops =
            '<button type="button" class="btn btn-sm wc-btn-start" data-toggle="' +
            esc(s.id) +
            '" data-to="active">启动</button>';
        }
        return (
          '<div class="wc-site-card' +
          (s.id === selectedId ? " is-selected" : "") +
          '" data-site="' +
          esc(s.id) +
          '" role="button" tabindex="0"><div class="wc-site-card-top"><span class="wc-site-name">' +
          esc(s.name) +
          '</span><span class="badge ' +
          st.cls +
          '">' +
          esc(st.label) +
          '</span></div><div class="wc-site-domain mono">' +
          esc(s.baseUrl.replace(/^https?:\/\//, "")) +
          '</div><div class="wc-site-meta">' +
          esc(typeLabel) +
          " · " +
          esc(D.INTERVAL[s.interval] || "—") +
          " · 下次 " +
          esc(s.nextAt) +
          "</div>" +
          bindHtml +
          '<div class="wc-site-card-foot">' +
          ops +
          '<button type="button" class="btn btn-sm wc-btn-detail" data-detail="' +
          esc(s.id) +
          '">详情</button></div></div>'
        );
      })
      .join("");
  }

  function filters(filterQ, filterStatus, filterDate) {
    return (
      '<input class="input" type="search" id="wc-q" placeholder="搜索标题 / 链接 / ID" style="max-width:200px" value="' +
      esc(filterQ) +
      '" /><input class="input" type="date" id="wc-date" title="采集日期" style="max-width:150px" value="' +
      esc(filterDate || "") +
      '" /><select class="input" id="wc-st" style="max-width:140px"><option value="">全部状态</option>' +
      '<option value="pending">待采集</option>' +
      '<option value="running">采集中</option><option value="processing">处理中</option>' +
      '<option value="completed">已完成</option><option value="failed">失败</option>' +
      '<option value="retry_requested">准备重试</option></select>' +
      '<button type="button" class="btn" id="wc-reset">重置</button>' +
      '<button type="button" class="btn" id="wc-refresh">刷新</button>'
    );
  }

  function records(list, pagerOpts) {
    if (!list.length) {
      return '<div class="empty-dash" style="min-height:100px">该站点暂无采集记录</div>';
    }
    var rows = list
      .map(function (r) {
        return (
          '<tr><td class="mono wc-td-num">' +
          r.id +
          "</td>" +
          timeHtml(r.time) +
          '<td class="wc-td-clip" title="' +
          esc(r.target) +
          '">' +
          esc(r.target) +
          '</td><td class="wc-td-clip" title="' +
          esc(r.title) +
          '">' +
          esc(r.title) +
          '</td><td class="wc-td-url mono" title="' +
          esc(r.url) +
          '"><a class="collection-link" href="' +
          esc(r.url) +
          '" target="_blank" rel="noopener">' +
          esc(r.url) +
          "</a></td><td class=\"wc-td-num\">" +
          r.videoN +
          '</td><td class="wc-td-num">' +
          r.imageN +
          '</td><td class="wc-td-mats">' +
          matsHtml(r) +
          '</td><td class="wc-td-dur">' +
          fmtDur(r.collectSec) +
          '</td><td class="wc-td-dur">' +
          fmtDur(r.processSec) +
          '</td><td class="wc-td-prog">' +
          progressBtn(r) +
          '</td><td class="wc-td-status">' +
          statusBadge(r.status, r.err) +
          '</td><td class="td-actions">' +
          rowActions(r) +
          "</td></tr>"
        );
      })
      .join("");
    var pager =
      pagerOpts && window.FZPager
        ? window.FZPager.html(pagerOpts)
        : "";
    return (
      '<div class="table-card table-card--wide"><table class="fz-table fz-table--compact wc-records-table"><thead><tr>' +
      "<th>ID</th><th>采集时间</th><th>目标站名</th><th>标题</th><th>链接</th>" +
      "<th>视频</th><th>图片</th><th>素材编号</th>" +
      "<th>采集耗时</th><th>处理耗时</th><th>进度</th><th>状态</th><th>操作</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table></div>" +
      pager
    );
  }

  function progressBody(r) {
    if (!r || !r.progress.length) {
      return (
        '<p class="muted" style="margin:0">暂无分片明细' +
        (r && r.err ? "。原因：" + esc(r.err) : "。") +
        "</p>"
      );
    }
    var dl = 0;
    var total = 0;
    r.progress.forEach(function (p) {
      dl += Number(p.dl) || 0;
      total += Number(p.total) || 0;
    });
    var overall =
      total > 0
        ? Math.min(100, Math.round((dl / total) * 100)) +
          "% · " +
          fmtBytes(dl) +
          " / " +
          fmtBytes(total)
        : fmtBytes(dl);
    return (
      '<p class="wc-prog-overall">整体进度：' +
      esc(overall) +
      '</p><ul class="wc-prog-list">' +
      r.progress
        .map(function (p) {
          var seg = p.seg > 0 ? "分片 " + p.segDone + " / " + p.seg : "分片 —";
          var stage =
            p.stage === "downloaded" ? "下载完成" : "↓ " + fmtBytes(p.speed) + "/s";
          return (
            "<li><span class=\"wc-prog-item-title\">" +
            esc(p.title) +
            "</span><br/>" +
            esc(seg) +
            " · " +
            esc(fmtBytes(p.dl) + " / " + fmtBytes(p.total)) +
            " · " +
            esc(stage) +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  return {
    esc: esc,
    sites: sites,
    filters: filters,
    records: records,
    progressBody: progressBody,
    statusLabel: function (k) {
      return (D.STATUS[k] || {}).label || k;
    }
  };
})();
