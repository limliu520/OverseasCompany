/**
 * 外站 / 采集号选择卡（setup 多选挂载、edit 换绑、全局管理列表）
 * 依赖 FZStore；Toast 走 FZShell（可选）。
 */
(function (global) {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(msg, type) {
    if (global.FZShell && FZShell.toast) FZShell.toast(msg, type || "err");
  }

  function tagsHtml(tags) {
    if (!tags || !tags.length) return "";
    return (
      '<div class="pick-card-tags">' +
      tags
        .map(function (t) {
          return '<span class="pick-chip">' + esc(t) + "</span>";
        })
        .join("") +
      "</div>"
    );
  }

  function emptyBox(text) {
    return (
      '<div class="pick-empty" role="status">' +
      '<p class="pick-empty-text">' +
      esc(text || "暂无数据") +
      "</p></div>"
    );
  }

  /**
   * 多选挂载外站
   * opts: { channels, selectedIds, projectId, state, emptyText }
   */
  function renderExtSelect(opts) {
    var channels = opts.channels || [];
    var selected = opts.selectedIds || [];
    var projectId = opts.projectId || "";
    var state = opts.state || { projects: [] };
    if (!channels.length) return emptyBox(opts.emptyText || "暂无外站通道");

    return (
      '<div class="pick-cards pick-cards--multi" role="group" aria-label="外站通道">' +
      channels
        .map(function (e) {
          var on = selected.indexOf(e.id) !== -1;
          var st = FZStore.extStatusLabel(e);
          var users = FZStore.projectsUsingExt(state, e.id);
          var onThis =
            projectId &&
            users.some(function (p) {
              return p.id === projectId;
            });
          /* 创建向导无 projectId：用 selected 表示「将挂本项目」 */
          if (!projectId) onThis = on;
          var other = users.filter(function (p) {
            return p.id !== projectId;
          }).length;
          var metaBits = [];
          if (e.note) metaBits.push(e.note);
          metaBits.push(onThis ? "已挂本项目" : "未挂本项目");
          if (other > 0) metaBits.push("另有 " + other + " 个项目启用");
          return (
            '<button type="button" class="pick-card' +
            (on ? " is-selected" : "") +
            (e.status === "inactive" ? " is-dim" : "") +
            '" data-ext="' +
            esc(e.id) +
            '" aria-pressed="' +
            (on ? "true" : "false") +
            '">' +
            '<div class="pick-card-head">' +
            '<span class="pick-card-title">' +
            esc(e.name) +
            '</span><span class="tag ' +
            st.cls +
            '">' +
            esc(st.text) +
            "</span></div>" +
            '<div class="pick-card-meta">' +
            esc(metaBits.join(" · ")) +
            "</div>" +
            tagsHtml(e.tags) +
            '<span class="pick-card-check" aria-hidden="true"></span>' +
            "</button>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function selectedExtIds(root) {
    if (!root) return [];
    return Array.prototype.map.call(
      root.querySelectorAll(".pick-card.is-selected[data-ext]"),
      function (el) {
        return el.getAttribute("data-ext");
      }
    );
  }

  function bindExtSelect(root) {
    if (!root) return;
    root.querySelectorAll(".pick-card[data-ext]").forEach(function (card) {
      card.addEventListener("click", function () {
        var on = !card.classList.contains("is-selected");
        card.classList.toggle("is-selected", on);
        card.setAttribute("aria-pressed", on ? "true" : "false");
      });
    });
  }

  /**
   * 单选采集号
   * opts: { bots, selectedId, state, project, allowEmpty, emptyLabel, emptyText }
   */
  function renderUserbotSelect(opts) {
    var bots = opts.bots || [];
    var selectedId = opts.selectedId || "";
    var state = opts.state || { projects: [] };
    var project = opts.project || null;
    var allowEmpty = opts.allowEmpty !== false;
    if (!bots.length && !allowEmpty) {
      return emptyBox(opts.emptyText || "暂无采集号");
    }

    var cards = "";
    if (allowEmpty) {
      var emptyOn = !selectedId;
      cards +=
        '<button type="button" class="pick-card pick-card--skip' +
        (emptyOn ? " is-selected" : "") +
        '" data-bot="" data-bot-name="" role="radio" aria-checked="' +
        (emptyOn ? "true" : "false") +
        '">' +
        '<div class="pick-card-head">' +
        '<span class="pick-card-title">' +
        esc(opts.emptyLabel || "暂不绑定") +
        '</span><span class="tag tag-muted">可跳过</span></div>' +
        '<div class="pick-card-meta">本项目暂不采 TG，或稍后再关联</div>' +
        '<span class="pick-card-check" aria-hidden="true"></span></button>';
    }

    cards += bots
      .map(function (b) {
        var on = selectedId === b.id;
        var disabled = b.status === "disabled";
        var st = FZStore.userbotStatusLabel(b);
        var chN = FZStore.userbotBoundChannelCount(state, b);
        var users = FZStore.projectsUsingUserbot(state, b.id);
        var otherProjects = users.filter(function (p) {
          return !project || p.id !== project.id;
        });
        var occupied = otherProjects.length > 0;
        var metaBits = ["已挂 " + chN + " 个频道"];
        if (disabled) {
          metaBits.push("不可选用，请换可用号或新建");
        } else if (occupied) {
          metaBits.push("已被 " + otherProjects.length + " 个其他项目占用");
        } else if (project && project.userbotId === b.id) {
          metaBits.push("当前项目已关联");
        } else {
          metaBits.push("空闲可挂");
        }
        if (b.phoneHint) metaBits.push(b.phoneHint);
        return (
          '<button type="button" class="pick-card' +
          (on ? " is-selected" : "") +
          (disabled ? " is-dim" : "") +
          '" data-bot="' +
          esc(b.id) +
          '" data-bot-name="' +
          esc(b.name) +
          '" data-bot-disabled="' +
          (disabled ? "1" : "0") +
          '" role="radio" aria-checked="' +
          (on ? "true" : "false") +
          '">' +
          '<div class="pick-card-head">' +
          '<span class="pick-card-title">' +
          esc(b.name) +
          '</span><span class="tag ' +
          st.cls +
          '">' +
          esc(disabled ? "不可用" : st.text) +
          "</span></div>" +
          '<div class="pick-card-meta">' +
          esc(metaBits.join(" · ")) +
          "</div>" +
          '<span class="pick-card-check" aria-hidden="true"></span></button>'
        );
      })
      .join("");

    return (
      '<div class="pick-cards pick-cards--single" role="radiogroup" aria-label="采集号">' +
      cards +
      "</div>"
    );
  }

  function selectedUserbot(root) {
    var card = root && root.querySelector(".pick-card.is-selected[data-bot]");
    if (!card) return { id: "", name: "" };
    return {
      id: card.getAttribute("data-bot") || "",
      name: card.getAttribute("data-bot-name") || ""
    };
  }

  /**
   * opts: { getBlockReason(nextId) → string|null, onChange(id, name) }
   * 有阻断时 Toast，不切选中态（可点 + Toast）。
   */
  function bindUserbotSelect(root, opts) {
    if (!root) return;
    opts = opts || {};
    root.querySelectorAll(".pick-card[data-bot]").forEach(function (card) {
      card.addEventListener("click", function () {
        var nextId = card.getAttribute("data-bot") || "";
        var nextName = card.getAttribute("data-bot-name") || "";
        if (card.getAttribute("data-bot-disabled") === "1") {
          toast("该采集号不可用，请选用可用号、新建，或选「暂不绑定」", "err");
          return;
        }
        if (typeof opts.getBlockReason === "function") {
          var reason = opts.getBlockReason(nextId);
          if (reason) {
            toast(reason, "err");
            return;
          }
        }
        root.querySelectorAll(".pick-card[data-bot]").forEach(function (c) {
          var on = c === card;
          c.classList.toggle("is-selected", on);
          c.setAttribute("aria-checked", on ? "true" : "false");
        });
        if (typeof opts.onChange === "function") opts.onChange(nextId, nextName);
      });
    });
  }

  /**
   * 全局管理列表（非选择态）
   * opts: { channels, state, emptyText }
   */
  function renderExtManage(opts) {
    var channels = opts.channels || [];
    var state = opts.state || { projects: [] };
    if (!channels.length) return emptyBox(opts.emptyText || "还没有外站通道。");

    return (
      '<div class="pick-cards pick-cards--manage">' +
      channels
        .map(function (e) {
          var st = FZStore.extStatusLabel(e);
          var used = FZStore.projectsUsingExt(state, e.id).length;
          var metaBits = [];
          if (e.note) metaBits.push(e.note);
          metaBits.push(used + " 个项目启用");
          return (
            '<div class="pick-card pick-card--static' +
            (e.status === "inactive" ? " is-dim" : "") +
            '">' +
            '<div class="pick-card-head">' +
            '<span class="pick-card-title">' +
            esc(e.name) +
            '</span><span class="tag ' +
            st.cls +
            '">' +
            esc(st.text) +
            "</span></div>" +
            '<div class="pick-card-meta">' +
            esc(metaBits.join(" · ")) +
            "</div>" +
            tagsHtml(e.tags) +
            '<div class="pick-card-actions">' +
            (e.status !== "active"
              ? '<button type="button" class="btn" data-act="' +
                esc(e.id) +
                '">模拟激活</button>'
              : '<span class="muted" style="font-size:12px">已可对接</span>') +
            "</div></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  global.FZPickCards = {
    renderExtSelect: renderExtSelect,
    bindExtSelect: bindExtSelect,
    selectedExtIds: selectedExtIds,
    renderUserbotSelect: renderUserbotSelect,
    bindUserbotSelect: bindUserbotSelect,
    selectedUserbot: selectedUserbot,
    renderExtManage: renderExtManage,
    emptyBox: emptyBox
  };
})(window);
