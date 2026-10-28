/* 素材管理 · 三视图表头 / 行（全部素材：行动态上色、类型轻标、分类弱化） */
(function (w) {
  function tip(esc, text) {
    var body =
      w.FZShell && w.FZShell.tipHtml
        ? w.FZShell.tipHtml(text)
        : esc(text).replace(/；\s*/g, "；<br>").replace(/;\s*/g, ";<br>");
    return (
      '<button type="button" class="field-tip" aria-label="列说明">' +
      '<span class="field-tip-ico" aria-hidden="true">?</span>' +
      '<span class="field-tip-bubble" role="tooltip">' +
      body +
      "</span></button>"
    );
  }
  function th(esc, label, tipText, cls) {
    return (
      "<th" +
      (cls ? ' class="' + cls + '"' : "") +
      ">" +
      esc(label) +
      (tipText ? tip(esc, tipText) : "") +
      "</th>"
    );
  }
  function btn(row, label, cls, id) {
    return (
      '<button type="button" class="btn btn-sm ' +
      (cls || "btn-mat-ghost") +
      '" data-row="' +
      row +
      '" data-id="' +
      id +
      '">' +
      label +
      "</button>"
    );
  }
  function emptyCell() {
    return '<span class="mat-empty" aria-hidden="true">—</span>';
  }
  function timeCell(esc, t) {
    var s = String(t || "").trim();
    return (
      '<td class="td-time"><span class="mat-time mono">' +
      esc(s || "—") +
      "</span></td>"
    );
  }
  function rowActions(tab, m) {
    var id = m.id;
    var detail = btn("detail", "详情", null, id);
    if (tab === "pending") {
      /* 现网 manual_review：仅驳回+通过；详情统一靠右 */
      return (
        btn("reject", "驳回", "btn-danger", id) +
        btn("pass", "通过", "btn-primary", id) +
        detail
      );
    }
    if (tab === "trash") {
      return btn("restore", "手动通过", "btn-primary", id) + detail;
    }
    /* 转编辑靠左，详情靠右；下载只在详情里 */
    var left = "";
    if (m.status === "available" || m.status === "duplicate") {
      left = btn("edit", "转编辑", "btn-primary", id);
    }
    return left + detail;
  }
  function adRiskHtml(esc, label) {
    var t = String(label || "-");
    var cls = "mat-ad-risk";
    if (t.indexOf("高风险") >= 0) cls += " is-high";
    else if (t.indexOf("中风险") >= 0) cls += " is-mid";
    return '<span class="' + cls + '" title="' + esc(t) + '">' + esc(t) + "</span>";
  }
  /* 类型：同色系轻标，不跟状态抢色 */
  function typeTag(esc, mediaType) {
    var t = mediaType || "-";
    var kind = t.indexOf("视频") >= 0 ? "video" : "image";
    return '<span class="mat-type-tag is-' + kind + '">' + esc(t) + "</span>";
  }
  /* 状态：仅待审 / 可使用上色，其余安静灰字 */
  function statusHtml(esc, labelMap, m) {
    var st = labelMap[m.status] || { text: m.status };
    if (m.status === "pending") {
      return '<span class="badge badge-warn">' + esc(st.text) + "</span>";
    }
    if (m.status === "available") {
      return '<span class="badge badge-ok">' + esc(st.text) + "</span>";
    }
    return '<span class="mat-status-quiet">' + esc(st.text) + "</span>";
  }
  function numCell(esc, m) {
    var num = m.formalNumber || m.id || "";
    return (
      '<td class="td-num">' +
      '<button type="button" class="mat-num-copy mono" data-copy-num="' +
      esc(num) +
      '" title="点击复制编号">' +
      esc(num) +
      "</button></td>"
    );
  }
  function titleBlock(esc, m, opts) {
    opts = opts || {};
    var tags = [];
    if (opts.withType !== false) tags.push(typeTag(esc, m.mediaType));
    if (m.category) tags.push('<span class="mat-cat-quiet">' + esc(m.category) + "</span>");
    /* 单行：标题 + 类型/分类；编号在独立列且位于标题列前 */
    return (
      '<div class="mat-title-cell">' +
      '<div class="mat-title-main">' +
      '<span class="cell-title">' +
      esc(m.title) +
      "</span></div>" +
      (tags.length ? '<div class="mat-title-tags">' + tags.join("") + "</div>" : "") +
      "</div>"
    );
  }
  function sortTh(esc, label, key, sortState) {
    var active = sortState && sortState.sort === key;
    var dir = active ? sortState.sortDir || "desc" : "";
    var markCls = "th-sort-mark";
    if (active) markCls += dir === "asc" ? " is-asc" : " is-desc";
    else markCls += " is-both";
    var extra =
      key === "created_at" ? " th-time" : key === "view_count" || key === "interaction_count" ? " th-metric" : "";
    return (
      '<th class="th-sort' +
      extra +
      (active ? " is-active" : "") +
      '" data-sort="' +
      esc(key) +
      '" title="点击按' +
      esc(label) +
      '排序，再点切换升/降序" role="button" tabindex="0">' +
      esc(label) +
      '<span class="' +
      markCls +
      '" aria-hidden="true"><i class="th-sort-up"></i><i class="th-sort-down"></i></span></th>'
    );
  }
  /* 全部素材列：来源频道 +（项目：采集方式 / 公共池：分发频道） */
  function fusedHead(esc, scopeCtx) {
    var sc = scopeCtx || {};
    if (sc.kind === "pool") {
      return th(
        esc,
        "分发频道",
        "TG 源经公共池路由后的分发频道；网站未绑定项目进公共池此列为空；点击查看具体分发频道。",
        "th-fused"
      );
    }
    return th(
      esc,
      "采集方式",
      "项目自采：本项目频道采入；公共池转入：从公共池转编辑占用。",
      "th-fused"
    );
  }
  function targetList(m) {
    if (m.targetChannels && m.targetChannels.length) return m.targetChannels;
    if (m.targetChannel) return [m.targetChannel];
    return [];
  }
  function isWebMat(m) {
    return (
      m.collectType === "web" ||
      (m.source && String(m.source).indexOf("网站") === 0) ||
      String(m.channel || "").indexOf("站") >= 0
    );
  }
  function sourceCell(esc, m) {
    var isWeb = isWebMat(m);
    return (
      '<div class="mat-source-cell">' +
      '<span class="mat-collect-tag is-' +
      (isWeb ? "web" : "tg") +
      '">' +
      (isWeb ? "网站" : "TG") +
      '</span><span class="mat-source-name" title="' +
      esc(m.channel) +
      '">' +
      esc(m.channel) +
      "</span></div>"
    );
  }
  /* 待审：通过后会落到哪里（项目通道 / TG 频道 / 公共池） */
  function destCell(esc, m) {
    if (m.belong === "proj") {
      var proj = m.project || m.dispatchProject || "";
      return (
        '<span class="mat-dest is-proj" title="通过后进入该项目内容通道">' +
        '<span class="mat-dest-k">项目</span>' +
        '<span class="mat-dest-v">' +
        esc(proj || "—") +
        "</span></span>"
      );
    }
    var list = targetList(m);
    if (list.length && !isWebMat(m)) {
      return (
        '<span class="mat-dest is-tg" title="通过后按公共池路由推送到这些 TG 频道">' +
        '<span class="mat-dest-k">TG</span>' +
        '<button type="button" class="mat-targets-btn" data-row-targets="' +
        esc(m.id) +
        '">' +
        list.length +
        " 个频道</button></span>"
      );
    }
    return (
      '<span class="mat-dest is-pool" title="' +
      (isWebMat(m)
        ? "网站未绑项目：留在公共池；可再转编辑进项目；不会推 TG"
        : "留在公共池；暂无项目或 TG 去向") +
      '">' +
      '<span class="mat-dest-k">公共池</span>' +
      '<span class="mat-dest-v mat-dest-muted">' +
      (isWebMat(m) ? "未绑项目" : "无固定去向") +
      "</span></span>"
    );
  }
  function fusedCell(esc, m, scopeCtx) {
    var sc = scopeCtx || {};
    if (sc.kind === "pool") {
      var list = targetList(m);
      if (!list.length) return emptyCell();
      return (
        '<button type="button" class="mat-targets-btn" data-row-targets="' +
        esc(m.id) +
        '" title="查看全部分发频道">' +
        list.length +
        " 个频道</button>"
      );
    }
    var name = sc.name || "";
    if (m.belong === "proj" && m.project === name) {
      return '<span class="mat-v2-how is-own">项目自采</span>';
    }
    if (m.dispatchProject === name) {
      return '<span class="mat-v2-how is-xfer">公共池转入</span>';
    }
    return emptyCell();
  }
  function headHtml(esc, tab, sortState, scopeCtx) {
    var check =
      '<th class="th-check">' +
      '<input type="checkbox" id="mat-check-all" class="mat-check-all" title="全选本页" aria-label="全选本页" />' +
      "</th>";
    var op = '<th class="th-actions">操作</th>';
    if (tab === "trash") {
      return (
        "<thead><tr>" +
        check +
        th(esc, "频道", "采集来源；左侧标签区分 TG / 网站。", "th-source") +
        th(esc, "编号", "系统素材编号；点击复制。", "th-num") +
        th(esc, "内容", "素材标题；右侧小字为媒体类型与分类。", "th-title") +
        th(
          esc,
          "广告类别",
          "广告过滤风险类别；高风险偏红；中风险偏黄。",
          "th-ad"
        ) +
        '<th class="th-score">得分</th><th class="th-rule">命中规则</th>' +
        '<th class="th-time">采集时间</th>' +
        op +
        "</tr></thead>"
      );
    }
    if (tab === "pending") {
      return (
        "<thead><tr>" +
        check +
        th(esc, "编号", "系统素材编号；点击复制。", "th-num") +
        th(esc, "标题", "素材标题；右侧小字为媒体类型与分类。", "th-title") +
        th(
          esc,
          "来源频道",
          "采入来源；左侧区分 TG / 网站；不是推送目标。",
          "th-source"
        ) +
        th(
          esc,
          "通过后去向",
          "项目：进内容通道；TG：按公共池路由推频道；公共池：暂无固定去向。",
          "th-dest"
        ) +
        sortTh(esc, "浏览", "view_count", sortState) +
        sortTh(esc, "互动", "interaction_count", sortState) +
        sortTh(esc, "采集时间", "created_at", sortState) +
        op +
        "</tr></thead>"
      );
    }
    return (
      "<thead><tr>" +
      check +
      th(esc, "编号", "系统素材编号；点击复制。", "th-num") +
      th(
        esc,
        "标题",
        "素材标题；右侧小字为媒体类型与分类。",
        "th-title"
      ) +
      th(
        esc,
        "状态",
        "待人工审核 / 可使用高亮，通常需处理；其余灰色，可筛可看详情。",
        "th-status"
      ) +
      th(esc, "来源频道", "采入来源；左侧区分 TG / 网站。", "th-source") +
      fusedHead(esc, scopeCtx) +
      '<th class="th-time">采集时间</th>' +
      op +
      "</tr></thead>"
    );
  }
  function titleCell(esc, m) {
    return titleBlock(esc, m, { withType: true });
  }
  function rowHtml(esc, tab, labelMap, m, scopeCtx) {
    var check =
      '<td class="td-check"><input type="checkbox" class="mat-row-check" data-id="' +
      esc(m.id) +
      '" aria-label="选择" /></td>';
    var act = '<td class="td-actions">' + rowActions(tab, m) + "</td>";
    var open = '<tr data-id="' + esc(m.id) + '">' + check;
    if (tab === "trash") {
      return (
        open +
        '<td class="td-source">' +
        sourceCell(esc, m) +
        "</td>" +
        numCell(esc, m) +
        '<td class="td-title">' +
        titleCell(esc, m) +
        '</td><td class="td-ad">' +
        adRiskHtml(esc, m.adCategory) +
        '</td><td class="td-score mono mat-ad-score">' +
        esc(m.score || "-") +
        '</td><td class="td-rule">' +
        esc(m.hitRule || "-") +
        "</td>" +
        timeCell(esc, m.time) +
        act +
        "</tr>"
      );
    }
    if (tab === "pending") {
      return (
        open +
        numCell(esc, m) +
        '<td class="td-title">' +
        titleCell(esc, m) +
        '</td><td class="td-source">' +
        sourceCell(esc, m) +
        '</td><td class="td-dest">' +
        destCell(esc, m) +
        '</td><td class="td-metric mono mat-metric">' +
        esc(m.views) +
        '</td><td class="td-metric mono mat-metric">' +
        esc(m.interact) +
        "</td>" +
        timeCell(esc, m.time) +
        act +
        "</tr>"
      );
    }
    return (
      open +
      numCell(esc, m) +
      '<td class="td-title">' +
      titleBlock(esc, m) +
      '</td><td class="td-status">' +
      statusHtml(esc, labelMap, m) +
      '</td><td class="td-source">' +
      sourceCell(esc, m) +
      '</td><td class="td-fused">' +
      fusedCell(esc, m, scopeCtx) +
      "</td>" +
      timeCell(esc, m.time) +
      act +
      "</tr>"
    );
  }

  w.FZMatTable = {
    headHtml: headHtml,
    rowHtml: rowHtml
  };
})(window);
