/* 素材详情弹窗（主预览媒体 / Tab / 上下条；处理日志不对业务端默认展示） */
(function (w) {
  var state = {
    id: null,
    list: [],
    tab: "info",
    mediaIdx: 0,
    mediaPlaying: false,
    minH: 0,
    previewOnly: false
  };
  var Media = w.FZMatMedia;
  function hasMedia(m) {
    return !!((m.videoCount || 0) + (m.imageCount || 0));
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }
  function find(id) {
    var i;
    for (i = 0; i < state.list.length; i++) if (state.list[i].id === id) return state.list[i];
    var items = (w.FZMatData && w.FZMatData.ITEMS) || [];
    for (i = 0; i < items.length; i++) {
      if (items[i].id === id || String(items[i].formalNumber) === String(id)) {
        return items[i];
      }
    }
    return null;
  }
  function idxInList() {
    var i;
    for (i = 0; i < state.list.length; i++) if (state.list[i].id === state.id) return i;
    return -1;
  }
  function field(label, value, wide) {
    return (
      '<div class="mat-df' + (wide ? " is-wide" : "") + '"><div class="mat-df-k">' +
      esc(label) + '</div><div class="mat-df-v">' + value + "</div></div>"
    );
  }
  /* 下载跟资源走，放左侧 */
  function mediaActionsHtml(m) {
    var vc = m.videoCount || 0;
    var n = vc + (m.imageCount || 0);
    if (!n) return "";
    var label = vc > 1 ? "下载全部(" + vc + ")" : vc === 1 ? "下载" : "下载图片";
    if (!vc && n > 1) label = "下载全部(" + n + ")";
    return (
      '<div class="mat-media-actions">' +
      '<button type="button" class="btn mat-dl-btn" data-detail-act="dl">' +
      label +
      "</button></div>"
    );
  }
  /* 现网口径：转编辑=available|duplicate；驳回=available；used 无转编辑；待审=驳回+通过；垃圾=手动通过 */
  function bizActionsHtml(m) {
    var btns = [];
    if (m.status === "pending") {
      btns.push('<button type="button" class="btn btn-danger btn-sm" data-detail-act="reject">驳回</button>');
      btns.push('<button type="button" class="btn btn-primary btn-sm" data-detail-act="pass">通过</button>');
    } else if (m.status === "available" || m.status === "duplicate") {
      btns.push('<button type="button" class="btn btn-primary btn-sm" data-detail-act="edit">转编辑</button>');
      if (m.status === "available") {
        btns.push('<button type="button" class="btn btn-danger btn-sm" data-detail-act="reject">驳回</button>');
      }
    } else if (m.status === "trash") {
      btns.push('<button type="button" class="btn btn-primary btn-sm" data-detail-act="restore">手动通过</button>');
    }
    if (!btns.length) return "";
    return '<div class="mat-summary-acts">' + btns.join("") + "</div>";
  }
  function adBlock(m) {
    if (m.status !== "trash") return "";
    var cls = "mat-ad-risk";
    if (String(m.adCategory || "").indexOf("高风险") >= 0) cls += " is-high";
    else if (String(m.adCategory || "").indexOf("中风险") >= 0) cls += " is-mid";
    return (
      '<div class="mat-ad-panel"><div class="mat-detail-sec-title">广告过滤（垃圾素材）</div><div class="mat-df-grid">' +
      field("广告类别", '<span class="' + cls + '">' + esc(m.adCategory || "-") + "</span>") +
      field("得分", '<span class="mat-ad-score">' + esc(m.score || "-") + "</span>") +
      field("命中规则", esc(m.hitRule || "-"), true) + "</div></div>"
    );
  }
  function isWebCollect(m) {
    return (
      m.collectType === "web" ||
      (m.source && String(m.source).indexOf("网站") === 0) ||
      String(m.channel || "").indexOf("站") >= 0
    );
  }
  function sourceFieldHtml(m) {
    var isWeb = isWebCollect(m);
    return (
      '<div class="mat-source-cell">' +
      '<span class="mat-collect-tag is-' +
      (isWeb ? "web" : "tg") +
      '">' +
      (isWeb ? "网站" : "TG") +
      '</span><span class="mat-source-name">' +
      esc(m.channel) +
      "</span></div>"
    );
  }
  /* 对齐列表「采集方式」：项目自采 / 公共池转入 / 公共池 */
  function howFieldHtml(m) {
    if (m.belong === "proj") {
      return (
        '<span class="mat-v2-how is-own">项目自采</span>' +
        (m.project
          ? '<span class="mat-how-proj"> · ' + esc(m.project) + "</span>"
          : "")
      );
    }
    if (m.dispatchProject) {
      return (
        '<span class="mat-v2-how is-xfer">公共池转入</span>' +
        '<span class="mat-how-proj"> · ' +
        esc(m.dispatchProject) +
        "</span>"
      );
    }
    return '<span class="mat-v2-how is-pool">公共池</span>';
  }
  function channelList(m) {
    if (m.targetChannels && m.targetChannels.length) return m.targetChannels.slice();
    if (m.targetChannel) return [m.targetChannel];
    return [];
  }
  function projectList(m) {
    var out = [];
    var seen = {};
    function add(p) {
      p = String(p || "").trim();
      if (!p || seen[p]) return;
      seen[p] = true;
      out.push(p);
    }
    if (m.dispatchProjects && m.dispatchProjects.length) {
      m.dispatchProjects.forEach(add);
    }
    if (m.belong === "proj") add(m.project);
    add(m.dispatchProject);
    return out;
  }
  /* 分发频道/项目：合并一条文案，点开弹窗分块展示 */
  function dispatchFieldHtml(m) {
    var ch = channelList(m);
    var pj = projectList(m);
    if (!ch.length && !pj.length) return '<span class="mat-empty">—</span>';
    var bits = [];
    if (ch.length) bits.push(ch.length + " 个频道");
    if (pj.length) bits.push(pj.length + " 个项目");
    return (
      '<button type="button" class="mat-targets-btn" data-dispatch-all="' +
      esc(m.id) +
      '" title="查看全部分发去向">' +
      esc(bits.join(" · ")) +
      "</button>"
    );
  }
  function openDispatchMask(id) {
    var m = find(id);
    var mask = document.getElementById("mat-targets-mask");
    var bd = document.getElementById("mat-targets-bd");
    var title = document.getElementById("mat-targets-title");
    if (!mask || !bd || !m) return;
    var channels = channelList(m);
    var projects = projectList(m);
    var logs = m.dispatchLogs || [];
    if (title) title.textContent = "分发频道/项目 · " + (m.formalNumber || m.id);
    if (!channels.length && !projects.length) {
      bd.innerHTML = '<p class="muted" style="margin:0">暂无分发去向</p>';
      mask.hidden = false;
      return;
    }
    var html = "";
    if (channels.length) {
      html +=
        '<div class="mat-dispatch-sec"><div class="mat-dispatch-sec-title">分发频道（' +
        channels.length +
        "）</div><ul class=\"mat-targets-list\">" +
        channels
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
        "</ul></div>";
    }
    if (projects.length) {
      html +=
        '<div class="mat-dispatch-sec"><div class="mat-dispatch-sec-title">分发项目（' +
        projects.length +
        "）</div><ul class=\"mat-targets-list\">" +
        projects
          .map(function (p) {
            return "<li><span class=\"mat-channel\">" + esc(p) + "</span></li>";
          })
          .join("") +
        "</ul></div>";
    }
    bd.innerHTML = html;
    mask.hidden = false;
  }
  function infoHtml(m) {
    var LABEL = (w.FZMatData && w.FZMatData.LABEL) || {};
    var st = LABEL[m.status] || { text: m.status, cls: "badge-muted" };
    var chips = (m.keywords || [])
      .map(function (k) { return '<span class="mat-chip">' + esc(k) + "</span>"; })
      .join("");
    var collectLabel = isWebCollect(m) ? "网站采集" : "TG 采集";
    var num = m.formalNumber || m.id || "";
    var mediaCol = hasMedia(m)
      ? '<div class="mat-detail-media">' +
        Media.html(m, state.mediaIdx, state.mediaPlaying) +
        (state.previewOnly ? "" : mediaActionsHtml(m)) +
        "</div>"
      : "";
    var note = state.previewOnly
      ? '<div class="mat-detail-note">原素材预览 · 仅查看，不可操作</div>'
      : m.status === "pending"
        ? '<div class="mat-detail-note">该素材待人工审核</div>'
        : "";
    var typeCat = [m.mediaType, m.category].filter(Boolean).join(" · ") || "-";
    var metaBits = [
      "浏览 " + esc(m.views),
      "互动 " + esc(m.interact)
    ].join('<span class="mat-meta-dot" aria-hidden="true">·</span>');
    return (
      '<div class="mat-detail-layout' + (hasMedia(m) ? "" : " is-nomedia") + '">' +
      mediaCol +
      '<div class="mat-detail-main">' +
      note +
      (state.previewOnly ? "" : adBlock(m)) +
      '<header class="mat-summary">' +
      '<div class="mat-summary-head">' +
      '<div class="mat-summary-text">' +
      '<h3 class="mat-summary-title">' +
      esc(m.title) +
      (!state.previewOnly && m.status === "available"
        ? ' <button type="button" class="btn btn-ghost btn-sm" data-detail-act="edit-title">✎ 编辑</button>'
        : "") +
      "</h3>" +
      '<div class="mat-summary-meta">' +
      '<span class="badge ' + st.cls + '">' + esc(st.text) + "</span>" +
      '<span class="mat-summary-typecat">' + esc(typeCat) + "</span>" +
      '<span class="mat-summary-metrics">' + metaBits + "</span>" +
      "</div></div>" +
      (state.previewOnly ? "" : bizActionsHtml(m)) +
      "</div></header>" +
      '<section class="mat-detail-sec mat-detail-sec--meta">' +
      '<div class="mat-detail-sec-title">基本信息</div>' +
      '<div class="mat-df-grid">' +
      field(
        "编号",
        '<button type="button" class="mat-num-copy mono" data-copy-num="' +
          esc(num) +
          '" title="点击复制编号">' +
          esc(num) +
          "</button>"
      ) +
      field("采集方式", howFieldHtml(m)) +
      field("来源频道", sourceFieldHtml(m)) +
      field("分发频道/项目", dispatchFieldHtml(m)) +
      field("采集时间", esc(m.time || "-")) +
      field("发布时间", esc(m.publishTime || m.time || "-")) +
      "</div></section>" +
      '<section class="mat-detail-sec mat-detail-sec--body">' +
      '<div class="mat-detail-sec-title">素材简介</div>' +
      '<p class="mat-summary-body">' +
      esc(m.summary || "暂无简介") +
      "</p>" +
      (chips
        ? '<div class="mat-kw-row"><span class="mat-kw-label">关键词</span><div class="mat-chips">' +
          chips +
          "</div></div>"
        : "") +
      "</section>" +
      '<section class="mat-detail-sec mat-detail-sec--std">' +
      '<div class="mat-detail-sec-title">标准化素材介绍</div>' +
      '<div class="mat-detail-box">【素材编号】' +
      esc(m.formalNumber) +
      "\n【素材类型】" +
      esc(m.mediaType) +
      "\n【采集类型】" +
      collectLabel +
      "\n【来源频道】" +
      esc(m.channel) +
      "\n【素材简介】" +
      esc(m.summary) +
      (m.status === "trash"
        ? "\n【广告类别】" +
          esc(m.adCategory) +
          "\n【得分】" +
          esc(m.score) +
          "\n【命中规则】" +
          esc(m.hitRule)
        : "") +
      "</div></section>" +
      "</div></div>"
    );
  }
  function dispatchHtml(m) {
    var rows = (m.dispatchLogs || [])
      .map(function (r) {
        return (
          "<tr><td>" + esc(r.target) + "</td><td>" + esc(r.status) +
          '</td><td class="mono muted">' + esc(r.time) + "</td></tr>"
        );
      })
      .join("");
    if (!rows) return '<div class="empty-dash" style="min-height:120px">暂无分发记录</div>';
    return (
      '<div class="table-card"><table class="fz-table"><thead><tr><th>分发频道</th><th>状态</th><th>时间</th></tr></thead><tbody>' +
      rows + "</tbody></table></div>"
    );
  }
  function lockHeight() {
    var shell = document.querySelector("#mat-detail-mask .mat-detail");
    if (!shell) return;
    var cap = Math.round(window.innerHeight * 0.9);
    var h = Math.min(shell.offsetHeight, cap);
    if (h > state.minH) {
      state.minH = h;
      shell.style.minHeight = h + "px";
    }
  }
  function paint() {
    var m = find(state.id);
    if (!m) return;
    var i = idxInList();
    var prog = document.getElementById("mat-detail-progress");
    if (prog) prog.textContent = i >= 0 ? i + 1 + " / " + state.list.length : "";
    var prev = document.getElementById("mat-detail-prev");
    var next = document.getElementById("mat-detail-next");
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i < 0 || i >= state.list.length - 1;
    document.querySelectorAll("[data-mat-tab]").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-mat-tab") === state.tab);
    });
    var panel = document.getElementById("mat-detail-panel");
    if (panel) panel.innerHTML = state.tab === "dispatch" ? dispatchHtml(m) : infoHtml(m);
    requestAnimationFrame(lockHeight);
  }
  function open(id, list, opts) {
    opts = opts || {};
    bind();
    state.previewOnly = !!opts.previewOnly;
    state.id = id;
    state.list = list && list.length ? list.slice() : [find(id)].filter(Boolean);
    state.tab = "info";
    state.mediaIdx = 0;
    state.mediaPlaying = false;
    state.minH = 0;
    var shell = document.querySelector("#mat-detail-mask .mat-detail");
    if (shell) shell.style.minHeight = "";
    var mask = document.getElementById("mat-detail-mask");
    if (mask) {
      mask.hidden = false;
      mask.classList.toggle("is-preview-only", state.previewOnly);
    }
    var title = document.getElementById("mat-detail-title");
    if (title) {
      title.innerHTML =
        (state.previewOnly ? "原素材 " : "素材详情 ") +
        '<span class="mat-detail-progress" id="mat-detail-progress"></span>';
    }
    var prev = document.getElementById("mat-detail-prev");
    var next = document.getElementById("mat-detail-next");
    if (prev) prev.hidden = state.previewOnly && state.list.length <= 1;
    if (next) next.hidden = state.previewOnly && state.list.length <= 1;
    paint();
  }
  function close() {
    var mask = document.getElementById("mat-detail-mask");
    if (mask) {
      mask.hidden = true;
      mask.classList.remove("is-preview-only");
    }
    var shell = document.querySelector("#mat-detail-mask .mat-detail");
    if (shell) shell.style.minHeight = "";
    var title = document.getElementById("mat-detail-title");
    if (title) {
      title.innerHTML =
        '素材详情 <span class="mat-detail-progress" id="mat-detail-progress"></span>';
    }
    state.id = null;
    state.mediaPlaying = false;
    state.minH = 0;
    state.previewOnly = false;
  }
  function goto(delta) {
    var i = idxInList();
    if (i < 0) return;
    var n = i + delta;
    if (n < 0 || n >= state.list.length) return;
    state.id = state.list[n].id;
    state.tab = "info";
    state.mediaIdx = 0;
    state.mediaPlaying = false;
    paint();
  }
  function onAct(act, m) {
    if (act === "edit" && w.FZMatTransfer) w.FZMatTransfer.open(m.id);
    else if (act === "reject" && w.FZMatTransfer) w.FZMatTransfer.openReject(m.id, "reject");
    else if (act === "pass" && w.FZMatTransfer) w.FZMatTransfer.openReject(m.id, "pass");
    else if (act === "restore" && w.FZMatTransfer) w.FZMatTransfer.openReject(m.id, "restore");
    else if (act === "dl" || act === "dl-one") FZShell.toast("Demo：下载媒体", "ok");
    else if (act === "edit-title") FZShell.toast("Demo：编辑标题（对齐现网 ✎）", "ok");
  }
  function bind() {
    var mask = document.getElementById("mat-detail-mask");
    if (!mask || mask._bound) return;
    mask._bound = true;
    mask.addEventListener("click", function (e) {
      if (e.target === mask) close();
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
      var allBtn = e.target.closest("[data-dispatch-all]");
      if (allBtn) {
        e.stopPropagation();
        openDispatchMask(allBtn.getAttribute("data-dispatch-all"));
        return;
      }
      var pick = e.target.closest("[data-media-pick]");
      if (pick) {
        state.mediaIdx = Number(pick.getAttribute("data-media-pick")) || 0;
        state.mediaPlaying = false;
        paint();
        return;
      }
      if (e.target.closest("[data-media-toggle-play]")) {
        state.mediaPlaying = !state.mediaPlaying;
        paint();
        return;
      }
      var t = e.target.closest("[data-mat-close],[data-mat-tab],[data-detail-act],#mat-detail-prev,#mat-detail-next");
      if (!t) return;
      if (t.hasAttribute("data-mat-close")) close();
      else if (t.id === "mat-detail-prev") goto(-1);
      else if (t.id === "mat-detail-next") goto(1);
      else if (t.hasAttribute("data-mat-tab")) {
        state.tab = t.getAttribute("data-mat-tab");
        paint();
      } else {
        if (state.previewOnly) return;
        var m = find(state.id);
        if (m) onAct(t.getAttribute("data-detail-act"), m);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (!state.id) return;
      var maskEl = document.getElementById("mat-detail-mask");
      if (!maskEl || maskEl.hidden) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") goto(-1);
      if (e.key === "ArrowRight") goto(1);
    });
  }

  w.FZMatDetail = { open: open, close: close, bind: bind, currentId: function () { return state.id; } };
})(window);
