/**
 * 权限树：侧栏层级 + 页内真实按钮。
 * 存盘用扁平 id，如 collect.tg.bot_add。
 */
(function (global) {
  var ACT = { view: "查看" };

  function pair(id, label) {
    ACT[id] = label;
    return [id, label];
  }

  function leaf(id, label, spec, note) {
    var groups = [];
    var flat = [];
    var actions = [];
    (spec || []).forEach(function (item) {
      if (item && item.g) {
        groups.push({ label: item.g, actions: item.a });
        item.a.forEach(function (p) {
          actions.push(p[0]);
        });
      } else {
        flat.push(item);
        actions.push(item[0]);
      }
    });
    return {
      id: id,
      label: label,
      actions: actions,
      flat: flat,
      groups: groups,
      note: note || ""
    };
  }

  var ALWAYS_ON = ["home.overview.view", "home.announcements.view"];

  function isAlwaysOn(id) {
    return ALWAYS_ON.indexOf(id) !== -1;
  }

  var V = pair("view", "查看");

  /** 与 shell NAV 同构。工作台两项全员默认，不进本树。 */
  var PERM_TREE = [
    {
      id: "collect",
      label: "采集中心",
      children: [
        leaf("collect.tg", "TG 采集配置", [
          {
            g: "采集号",
            a: [
              pair("bot_add", "添加采集号"),
              pair("collect", "开始/停止采集"),
              pair("sess", "强制断开")
            ]
          },
          {
            g: "频道",
            a: [
              pair("ch_pull", "拉取频道"),
              pair("ch_join", "加入频道"),
              pair("ch_assign", "标记用途"),
              pair("ch_toggle", "启用/停用"),
              pair("ch_unbind", "解绑")
            ]
          },
          {
            g: "路由",
            a: [pair("route_add", "新建路由"), pair("route_remove", "移除路由")]
          }
        ]),
        leaf("collect.web", "网站采集配置", [
          {
            g: "网站",
            a: [
              pair("site_apply", "申请添加网站"),
              pair("site_edit", "编辑网站"),
              pair("site_del", "删除网站"),
              pair("site_toggle", "启动/暂停")
            ]
          },
          {
            g: "采集记录",
            a: [pair("rec_stop", "停止任务"), pair("rec_retry", "重试任务")]
          }
        ]),
        leaf("collect.materials", "素材管理", [
          {
            g: "待审核",
            a: [pair("mat_pass", "通过"), pair("mat_reject", "驳回")]
          },
          {
            g: "素材池",
            a: [
              pair("mat_edit", "转编辑"),
              pair("mat_title", "编辑标题"),
              pair("mat_dl", "下载")
            ]
          },
          { g: "垃圾素材", a: [pair("mat_restore", "手动通过")] }
        ])
      ]
    },
    {
      id: "content",
      label: "内容中心",
      children: [
        leaf("content.article", "文章管理", [
          {
            g: "稿件",
            a: [
              pair("art_edit", "编辑"),
              pair("art_save", "保存"),
              pair("art_push", "推送"),
              pair("art_reopen", "重新编辑"),
              pair("art_del", "删除")
            ]
          },
          {
            g: "失败处理",
            a: [pair("art_retry", "重试"), pair("art_release", "释放占用")]
          }
        ]),
        leaf(
          "content.ai_cmt",
          "AI 评论",
          [V],
          "页面尚未落地，按钮出来后再补操作项"
        ),
        leaf(
          "content.pull_wm",
          "拉取加水印",
          [V],
          "页面尚未落地，按钮出来后再补操作项"
        )
      ]
    },
    {
      id: "review",
      label: "审核中心",
      children: [
        leaf("review.comment", "评论审核", [V], "页面尚未落地，按钮出来后再补操作项"),
        leaf("review.user", "用户审核", [V], "页面尚未落地，按钮出来后再补操作项"),
        leaf("review.post", "帖子审核", [V], "页面尚未落地，按钮出来后再补操作项")
      ]
    },
    {
      id: "projects",
      label: "项目管理",
      children: [
        leaf("projects.list", "项目列表", [
          { g: "列表", a: [pair("proj_new", "新建项目"), pair("proj_connect", "对接")] },
          {
            g: "详情",
            a: [
              pair("proj_basic", "编辑基本信息"),
              pair("wm", "水印管理"),
              pair("intro", "片头和片尾"),
              pair("copy", "文案管理"),
              pair("media", "内容生成规则"),
              pair("proj_tg", "TG 采集号"),
              pair("flow", "推送规则"),
              pair("channel_cfg", "内容通道对接配置"),
              pair("optional", "可选功能")
            ]
          }
        ])
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
              pair("sub_create", "创建子账号"),
              pair("sub_edit", "编辑"),
              pair("sub_reset", "重置密码"),
              pair("sub_totp", "重置验证器"),
              pair("sub_toggle", "停用/启用")
            ]),
            leaf("global.subs.roles", "岗位", [
              pair("role_create", "新建岗位"),
              pair("role_edit", "编辑"),
              pair("role_del", "删除")
            ])
          ]
        }
      ]
    }
  ];

  /** 旧扁平功能、以及上一版笼统动作 → 当前按钮 id */
  var LEGACY_MAP = {
    workbench: [],
    project_manage: ["projects.list.view", "projects.list.proj_new", "projects.list.proj_basic"],
    project_config: ["projects.list.view", "projects.list.wm", "projects.list.flow"],
    collect_web: ["collect.web.view", "collect.web.site_apply", "collect.web.site_edit"],
    collect_tg: ["collect.tg.view", "collect.tg.bot_add", "collect.tg.ch_join", "collect.tg.route_add"],
    review_material: ["collect.materials.view", "collect.materials.mat_pass", "collect.materials.mat_reject"],
    edit_article: ["content.article.view", "content.article.art_edit", "content.article.art_save", "content.article.art_push"],
    edit_media: ["content.article.view"],
    publish_ext: ["content.article.view", "content.article.art_push"],
    interact: ["content.ai_cmt.view", "review.comment.view", "review.user.view", "review.post.view"],
    userbot_cfg: ["collect.tg.view", "collect.tg.bot_add", "collect.tg.collect", "collect.tg.sess"],
    "global.userbot.view": ["collect.tg.view"],
    "global.userbot.create": ["collect.tg.bot_add"],
    "global.userbot.edit": ["collect.tg.collect", "collect.tg.sess"],
    "global.userbot.enable": ["collect.tg.sess"],
    "collect.tg.monitor": ["collect.tg.collect"],
    sub_manage: [
      "global.subs.accounts.view",
      "global.subs.accounts.sub_create",
      "global.subs.accounts.sub_edit",
      "global.subs.roles.view",
      "global.subs.roles.role_create",
      "global.subs.roles.role_edit"
    ],
    "collect.tg.create": ["collect.tg.bot_add", "collect.tg.ch_join", "collect.tg.route_add"],
    "collect.tg.edit": ["collect.tg.collect", "collect.tg.sess", "collect.tg.ch_pull", "collect.tg.ch_assign", "collect.tg.ch_toggle"],
    "collect.tg.delete": ["collect.tg.ch_unbind", "collect.tg.route_remove"],
    "collect.web.create": ["collect.web.site_apply"],
    "collect.web.edit": ["collect.web.site_edit"],
    "collect.web.delete": ["collect.web.site_del"],
    "collect.web.enable": ["collect.web.site_toggle"],
    "collect.materials.approve": ["collect.materials.mat_pass", "collect.materials.mat_reject"],
    "collect.materials.edit": ["collect.materials.mat_edit", "collect.materials.mat_title"],
    "collect.materials.delete": ["collect.materials.mat_reject"],
    "content.article.create": ["content.article.art_edit"],
    "content.article.edit": ["content.article.art_edit", "content.article.art_save", "content.article.art_reopen"],
    "content.article.delete": ["content.article.art_del"],
    "content.article.publish": ["content.article.art_push"],
    "content.ai_cmt.create": [],
    "content.ai_cmt.edit": [],
    "content.ai_cmt.enable": [],
    "content.pull_wm.create": [],
    "content.pull_wm.edit": [],
    "content.pull_wm.enable": [],
    "review.comment.approve": [],
    "review.comment.edit": [],
    "review.user.approve": [],
    "review.user.enable": [],
    "review.post.approve": [],
    "review.post.delete": [],
    "projects.list.create": ["projects.list.proj_new"],
    "projects.list.edit": ["projects.list.proj_basic"],
    "projects.list.config": [
      "projects.list.wm",
      "projects.list.intro",
      "projects.list.copy",
      "projects.list.media",
      "projects.list.proj_tg",
      "projects.list.flow",
      "projects.list.optional"
    ],
    "projects.list.connect": ["projects.list.proj_connect", "projects.list.channel_cfg"],
    "global.subs.accounts.create": ["global.subs.accounts.sub_create"],
    "global.subs.accounts.edit": ["global.subs.accounts.sub_edit"],
    "global.subs.accounts.enable": ["global.subs.accounts.sub_toggle"],
    "global.subs.accounts.reset": ["global.subs.accounts.sub_reset", "global.subs.accounts.sub_totp"],
    "global.subs.roles.create": ["global.subs.roles.role_create"],
    "global.subs.roles.edit": ["global.subs.roles.role_edit"],
    "global.subs.roles.delete": ["global.subs.roles.role_del"]
  };

  var KNOWN = {};
  function walkKnown(nodes) {
    (nodes || []).forEach(function (n) {
      (n.actions || []).forEach(function (a) {
        KNOWN[n.id + "." + a] = 1;
      });
      walkKnown(n.children);
    });
  }
  walkKnown(PERM_TREE);

  function actionLabel(a) {
    return ACT[a] || a;
  }

  function migrateFeatures(ids) {
    var out = [];
    var seen = {};
    function take(id) {
      if (!id || seen[id]) return;
      var mapped = LEGACY_MAP[id];
      if (mapped) {
        mapped.forEach(take);
        return;
      }
      if (isAlwaysOn(id) || !KNOWN[id]) return;
      seen[id] = 1;
      out.push(id);
    }
    (ids || []).forEach(take);
    return out;
  }

  function isChecked(set, id) {
    return !!set[id];
  }

  function actsHtml(pageId, pairs, selectedSet) {
    var html = "";
    pairs.forEach(function (p) {
      var pid = pageId + "." + p[0];
      html +=
        '<label class="perm-act">' +
        '<input type="checkbox" data-perm="' +
        pid +
        '"' +
        (isChecked(selectedSet, pid) ? " checked" : "") +
        " />" +
        p[1] +
        "</label>";
    });
    return html;
  }

  function renderNode(node, depth, selectedSet) {
    var kids = node.children || [];
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
    } else if ((node.actions || []).length) {
      var viewOnly =
        node.actions.length === 1 &&
        node.actions[0] === "view" &&
        !(node.groups && node.groups.length);
      if (viewOnly) {
        var vid = node.id + ".view";
        html +=
          '<div class="perm-row perm-page">' +
          '<label class="perm-check">' +
          '<input type="checkbox" data-perm="' +
          vid +
          '"' +
          (isChecked(selectedSet, vid) ? " checked" : "") +
          " />" +
          '<span class="perm-label">' +
          '<span class="perm-lvl">L' +
          depth +
          "</span>" +
          node.label +
          "</span></label>" +
          (node.note ? '<span class="perm-note">' + node.note + "</span>" : "") +
          "</div>";
      } else {
        var flat = (node.flat || []).filter(function (p) {
          return p[0] !== "view";
        });
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
          (flat.length
            ? '<div class="perm-acts">' + actsHtml(node.id, flat, selectedSet) + "</div>"
            : "") +
          "</div>";
        if (node.groups && node.groups.length) {
          html += '<div class="perm-op-groups">';
          node.groups.forEach(function (g) {
            html +=
              '<div class="perm-op-line"><span class="perm-op-name">' +
              g.label +
              '</span><div class="perm-acts">' +
              actsHtml(node.id, g.actions, selectedSet) +
              "</div></div>";
          });
          html += "</div>";
        }
      }
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
      '<p class="hint" style="margin:4px 0 0">按侧栏层级勾选。末级是该页真实按钮，按页面上的区域分组。勾了任一按钮就能进入该页，进入不单独勾选。勾选页面名称即全选其下按钮。还没有按钮的页面，勾选页面名称即可进入。「概览」「平台公告」全员默认开通，无需勾选。</p></div>' +
      '<button type="button" class="btn perm-tree-clear" data-perm-clear>清空</button>' +
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
    ALWAYS_ON: ALWAYS_ON,
    isAlwaysOn: isAlwaysOn,
    migrateFeatures: migrateFeatures,
    render: render,
    collect: collect,
    summarize: summarize,
    actionLabel: actionLabel
  };
})(window);
