/**
 * 权限树：对齐侧栏 L1 → L2（→ L3）+ 页内操作（查看/新增/编辑/删除…）
 * 存盘用扁平 id，如 projects.list.create
 */
(function (global) {
  var ACT = {
    view: "查看",
    create: "新增",
    edit: "编辑",
    delete: "删除",
    enable: "启用/停用",
    reset: "重置密码",
    connect: "对接接通",
    config: "改配置",
    publish: "提交/推送",
    approve: "审核通过/驳回",
    export: "导出"
  };

  function leaf(id, label, acts) {
    return { id: id, label: label, actions: acts };
  }

  /** 与 shell NAV 同构；有三级菜单的挂 children，否则 actions 直接挂在二级 */
  var PERM_TREE = [
    {
      id: "home",
      label: "工作台",
      children: [leaf("home.overview", "概览", ["view"])]
    },
    {
      id: "projects",
      label: "项目管理",
      children: [
        leaf("projects.list", "项目列表", [
          "view",
          "create",
          "edit",
          "config",
          "connect"
        ])
      ]
    },
    {
      id: "collect",
      label: "采集",
      children: [
        leaf("collect.web", "网站采集配置", ["view", "create", "edit", "delete", "enable"]),
        leaf("collect.web_log", "网站采集记录", ["view", "export"]),
        leaf("collect.tg", "TG 采集配置", ["view", "create", "edit", "delete"]),
        leaf("collect.review", "素材审核", ["view", "approve", "edit"]),
        leaf("collect.err", "采集异常", ["view", "edit"])
      ]
    },
    {
      id: "edit",
      label: "编辑",
      children: [
        leaf("edit.article", "文章", ["view", "create", "edit", "delete", "publish"]),
        leaf("edit.media", "修片 / 媒体处理", ["view", "edit", "publish"]),
        leaf("edit.publish", "发布/提交任务", ["view", "publish", "edit"])
      ]
    },
    {
      id: "interact",
      label: "互动能力",
      children: [
        leaf("interact.ai_gen", "AI 评论生成", ["view", "create", "edit", "enable"]),
        leaf("interact.ai_review", "AI 评论审核", ["view", "approve"]),
        leaf("interact.user", "用户审核", ["view", "approve", "enable"]),
        leaf("interact.post", "社区帖子", ["view", "approve", "delete"])
      ]
    },
    {
      id: "global",
      label: "全局配置",
      children: [
        {
          id: "global.subs",
          label: "子账号与授权",
          children: [
            leaf("global.subs.accounts", "子账号", [
              "view",
              "create",
              "edit",
              "enable",
              "reset"
            ]),
            leaf("global.subs.roles", "岗位", ["view", "create", "edit", "delete"])
          ]
        },
        leaf("global.userbot", "Userbot", ["view", "create", "edit", "enable"])
      ]
    }
  ];

  /** 旧扁平功能 → 新权限 id（演示迁移） */
  var LEGACY_MAP = {
    workbench: ["home.overview.view"],
    project_manage: ["projects.list.view", "projects.list.create", "projects.list.edit"],
    project_config: ["projects.list.view", "projects.list.config"],
    collect_web: [
      "collect.web.view",
      "collect.web.create",
      "collect.web.edit",
      "collect.web.delete"
    ],
    collect_tg: [
      "collect.tg.view",
      "collect.tg.create",
      "collect.tg.edit",
      "collect.tg.delete"
    ],
    review_material: [
      "collect.review.view",
      "collect.review.approve",
      "collect.review.edit"
    ],
    edit_article: [
      "edit.article.view",
      "edit.article.create",
      "edit.article.edit",
      "edit.article.publish"
    ],
    edit_media: ["edit.media.view", "edit.media.edit", "edit.media.publish"],
    publish_ext: [
      "edit.publish.view",
      "edit.publish.publish",
      "edit.publish.edit"
    ],
    interact: [
      "interact.ai_gen.view",
      "interact.ai_review.view",
      "interact.user.view",
      "interact.post.view"
    ],
    userbot_cfg: [
      "global.userbot.view",
      "global.userbot.create",
      "global.userbot.edit"
    ],
    sub_manage: [
      "global.subs.accounts.view",
      "global.subs.accounts.create",
      "global.subs.accounts.edit",
      "global.subs.roles.view",
      "global.subs.roles.create",
      "global.subs.roles.edit"
    ]
  };

  function actionLabel(a) {
    return ACT[a] || a;
  }

  function migrateFeatures(ids) {
    var out = [];
    var seen = {};
    (ids || []).forEach(function (id) {
      var mapped = LEGACY_MAP[id];
      if (mapped) {
        mapped.forEach(function (x) {
          if (!seen[x]) {
            seen[x] = 1;
            out.push(x);
          }
        });
      } else if (id && !seen[id]) {
        seen[id] = 1;
        out.push(id);
      }
    });
    return out;
  }

  function isChecked(set, id) {
    return !!set[id];
  }

  function renderNode(node, depth, selectedSet) {
    var kids = node.children || [];
    var acts = node.actions || [];
    var html = '<div class="perm-node depth-' + depth + '">';

    if (kids.length) {
      html +=
        '<div class="perm-row perm-group">' +
        '<label class="perm-check">' +
        '<input type="checkbox" data-group="' +
        node.id +
        '" />' +
        '<span class="perm-label">' +
        '<span class="perm-lvl">L' +
        depth +
        "</span>" +
        node.label +
        "</span></label>" +
        '<span class="perm-hint">' +
        (depth === 1 ? "一级菜单" : depth === 2 ? "二级菜单" : "三级菜单") +
        "</span></div>";
      html += '<div class="perm-children">';
      kids.forEach(function (c) {
        html += renderNode(c, depth + 1, selectedSet);
      });
      html += "</div>";
    } else if (acts.length) {
      html +=
        '<div class="perm-row perm-page">' +
        '<label class="perm-check">' +
        '<input type="checkbox" data-page="' +
        node.id +
        '" />' +
        '<span class="perm-label">' +
        '<span class="perm-lvl">L' +
        depth +
        "</span>" +
        node.label +
        "</span></label>" +
        '<div class="perm-acts">';
      acts.forEach(function (a) {
        var pid = node.id + "." + a;
        html +=
          '<label class="perm-act">' +
          '<input type="checkbox" data-perm="' +
          pid +
          '"' +
          (isChecked(selectedSet, pid) ? " checked" : "") +
          " />" +
          actionLabel(a) +
          "</label>";
      });
      html += "</div></div>";
    }

    html += "</div>";
    return html;
  }

  function syncGroupStates(root) {
    root.querySelectorAll("[data-page]").forEach(function (pageCb) {
      var pageId = pageCb.getAttribute("data-page");
      var acts = root.querySelectorAll('[data-perm^="' + pageId + '."]');
      var n = 0;
      var on = 0;
      acts.forEach(function (el) {
        n++;
        if (el.checked) on++;
      });
      pageCb.checked = n > 0 && on === n;
      pageCb.indeterminate = on > 0 && on < n;
    });
    root.querySelectorAll("[data-group]").forEach(function (gCb) {
      var wrap = gCb.closest(".perm-node");
      if (!wrap) return;
      var leaves = wrap.querySelectorAll("[data-perm]");
      var n = 0;
      var on = 0;
      leaves.forEach(function (el) {
        n++;
        if (el.checked) on++;
      });
      gCb.checked = n > 0 && on === n;
      gCb.indeterminate = on > 0 && on < n;
    });
  }

  function bind(root, onChange) {
    function fire() {
      if (typeof onChange === "function") onChange();
    }
    root.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || t.tagName !== "INPUT") return;
      if (t.hasAttribute("data-perm")) {
        syncGroupStates(root);
        fire();
        return;
      }
      if (t.hasAttribute("data-page")) {
        var pageId = t.getAttribute("data-page");
        root.querySelectorAll('[data-perm^="' + pageId + '."]').forEach(function (el) {
          el.checked = t.checked;
        });
        syncGroupStates(root);
        fire();
        return;
      }
      if (t.hasAttribute("data-group")) {
        var wrap = t.closest(".perm-node");
        if (wrap) {
          wrap.querySelectorAll("[data-perm]").forEach(function (el) {
            el.checked = t.checked;
          });
        }
        syncGroupStates(root);
        fire();
      }
    });
  }

  /** opts.onChange：用户改勾选后回调（程序化套用岗位时勿依赖） */
  function render(mount, selectedIds, opts) {
    if (!mount) return;
    opts = opts || {};
    var set = {};
    migrateFeatures(selectedIds || []).forEach(function (id) {
      set[id] = 1;
    });
    var html =
      '<div class="perm-tree">' +
      '<div class="perm-tree-head">' +
      "<div><strong>菜单与功能权限</strong>" +
      '<p class="hint" style="margin:4px 0 0">按侧栏层级勾选：一级 / 二级 / 三级菜单；末级为页面内操作（查看、新增、编辑、删除等）。勾选上级可全选其下。</p></div>' +
      '<button type="button" class="btn btn-ghost" data-perm-clear>清空</button>' +
      "</div>";
    PERM_TREE.forEach(function (n) {
      html += renderNode(n, 1, set);
    });
    html += "</div>";
    mount.innerHTML = html;
    var root = mount.querySelector(".perm-tree");
    bind(root, opts.onChange);
    syncGroupStates(root);
    var clearBtn = mount.querySelector("[data-perm-clear]");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        root.querySelectorAll("[data-perm]").forEach(function (el) {
          el.checked = false;
        });
        syncGroupStates(root);
        if (typeof opts.onChange === "function") opts.onChange();
      });
    }
  }

  function collect(mount) {
    var ids = [];
    if (!mount) return ids;
    mount.querySelectorAll("[data-perm]:checked").forEach(function (el) {
      ids.push(el.getAttribute("data-perm"));
    });
    return ids;
  }

  function summarize(ids) {
    var list = migrateFeatures(ids || []);
    if (!list.length) return "未勾选权限";
    var pages = {};
    list.forEach(function (id) {
      var parts = id.split(".");
      var act = parts.pop();
      var page = parts.join(".");
      if (!pages[page]) pages[page] = [];
      pages[page].push(actionLabel(act));
    });
    var keys = Object.keys(pages);
    var head = keys.slice(0, 3).map(function (p) {
      return p.split(".").pop() + "（" + pages[p].join("、") + "）";
    });
    var more = keys.length > 3 ? " 等 " + keys.length + " 个页面" : "";
    return head.join("；") + more;
  }

  global.FZPerm = {
    TREE: PERM_TREE,
    ACT: ACT,
    migrateFeatures: migrateFeatures,
    render: render,
    collect: collect,
    summarize: summarize,
    actionLabel: actionLabel
  };
})(window);
