/* 素材管理 · 三视图表头 / 行（含列问号气泡） */
(function (w) {
  function tip(esc, text) {
    return (
      '<button type="button" class="field-tip" aria-label="列说明">' +
      '<span class="field-tip-ico" aria-hidden="true">?</span>' +
      '<span class="field-tip-bubble" role="tooltip">' +
      text +
      "</span></button>"
    );
  }
  function th(esc, label, tipText) {
    return "<th>" + esc(label) + (tipText ? tip(esc, tipText) : "") + "</th>";
  }
  function btn(row, label, cls) {
    return (
      '<button type="button" class="btn btn-sm ' +
      (cls || "btn-mat-act") +
      '" data-row="' +
      row +
      '">' +
      label +
      "</button>"
    );
  }
  function rowActions(tab, m) {
    if (tab === "pending") {
      return (
        btn("detail", "详情") +
        btn("reject", "驳回", "btn-danger") +
        btn("pass", "通过", "btn-primary") +
        btn("edit", "转编辑")
      );
    }
    if (tab === "trash") return btn("detail", "详情") + btn("restore", "手动通过", "btn-primary");
    var s = btn("detail", "详情") + btn("dl", "下载");
    if (m.status === "available" || m.status === "pending") s += btn("edit", "转编辑", "btn-primary");
    return s;
  }
  function adRiskHtml(esc, label) {
    var t = String(label || "-");
    var cls = "mat-ad-risk";
    if (t.indexOf("高风险") >= 0) cls += " is-high";
    else if (t.indexOf("中风险") >= 0) cls += " is-mid";
    return '<span class="' + cls + '" title="' + esc(t) + '">' + esc(t) + "</span>";
  }
  function headHtml(esc, tab) {
    var check = '<th style="width:36px"></th>';
    var op = '<th class="th-actions">操作</th>';
    if (tab === "trash") {
      return (
        "<thead><tr>" +
        check +
        th(esc, "频道", "采集来源频道名称（对齐现网垃圾列表「频道」列）。") +
        "<th>内容</th>" +
        th(esc, "广告类别", "广告过滤命中的风险标签。高风险红色、中风险黄色。") +
        "<th>得分</th><th>命中规则</th><th>采集时间</th>" +
        op +
        "</tr></thead>"
      );
    }
    if (tab === "pending") {
      return (
        "<thead><tr>" +
        check +
        th(esc, "标题 / 编号", "现网人工审核是卡片墙：编号 + 正文预览。Demo 用表表达同字段。") +
        th(esc, "来源频道", "素材从哪个采集频道进来（source channel），不是分发目标。") +
        "<th>浏览</th><th>互动</th><th>采集时间</th>" +
        op +
        "</tr></thead>"
      );
    }
    return (
      "<thead><tr>" +
      check +
      "<th>素材编号</th><th>类型</th><th>状态</th><th>分类</th><th>标题</th>" +
      th(
        esc,
        "目标频道",
        "公共池素材走 TG→TG 路由后的落点频道。专属站点 / 外站素材不进 TG 分发，此列一般为「-」。"
      ) +
      th(
        esc,
        "分发项目",
        "两路展示：①公共池被「转编辑」占用的业务项目（可与目标频道同时有值）；②专属/外站归属徽标（这类料不进 TG，目标频道应为空）。不等于顶栏「归属」筛。"
      ) +
      "<th>采集时间</th>" +
      op +
      "</tr></thead>"
    );
  }
  function titleCell(esc, m) {
    return (
      '<div class="cell-title">' +
      esc(m.title) +
      '</div><div class="cell-sub mono">' +
      esc(m.formalNumber || m.id) +
      "</div>"
    );
  }
  function rowHtml(esc, tab, labelMap, m) {
    var check = '<td><input type="checkbox" class="mat-row-check" /></td>';
    var act = '<td class="td-actions">' + rowActions(tab, m) + "</td>";
    var open = '<tr data-id="' + esc(m.id) + '">' + check;
    if (tab === "trash") {
      return (
        open +
        "<td>" +
        esc(m.channel) +
        "</td><td>" +
        titleCell(esc, m) +
        "</td><td>" +
        adRiskHtml(esc, m.adCategory) +
        '</td><td class="mono mat-ad-score">' +
        esc(m.score || "-") +
        "</td><td>" +
        esc(m.hitRule || "-") +
        '</td><td class="mono muted">' +
        esc(m.time) +
        "</td>" +
        act +
        "</tr>"
      );
    }
    if (tab === "pending") {
      return (
        open +
        "<td>" +
        titleCell(esc, m) +
        "</td><td>" +
        esc(m.channel) +
        '</td><td class="mono">' +
        esc(m.views) +
        '</td><td class="mono">' +
        esc(m.interact) +
        '</td><td class="mono muted">' +
        esc(m.time) +
        "</td>" +
        act +
        "</tr>"
      );
    }
    var st = labelMap[m.status] || { text: m.status, cls: "badge-muted" };
    return (
      open +
      '<td class="mono">' +
      esc(m.formalNumber || m.id) +
      "</td><td>" +
      esc(m.mediaType || "-") +
      '</td><td><span class="badge ' +
      st.cls +
      '">' +
      esc(st.text) +
      "</span></td><td>" +
      esc(m.category || "-") +
      '</td><td><div class="cell-title">' +
      esc(m.title) +
      "</div></td><td>" +
      esc(m.targetChannel || "-") +
      "</td><td>" +
      (m.dispatchProject
        ? '<span class="mat-proj-badge' +
          (m.dispatchKind === "dedicated" ? " is-dedicated" : "") +
          '">' +
          esc(m.dispatchProject) +
          "</span>"
        : '<span class="muted">-</span>') +
      '</td><td class="mono muted">' +
      esc(m.time) +
      "</td>" +
      act +
      "</tr>"
    );
  }

  w.FZMatTable = {
    headHtml: headHtml,
    rowHtml: rowHtml
  };
})(window);
