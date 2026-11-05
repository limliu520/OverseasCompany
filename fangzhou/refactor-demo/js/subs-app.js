/* 子账号与授权页 */
(function () {
  FZShell.boot({ active: "subs" });
  var tab = new URLSearchParams(location.search).get("tab") === "roles" ? "roles" : "subs";
  var editingRoleId = null;
  var editingSubId = null;
  /** 子账号弹层：custom | roleId；改权限树时自动回 custom */
  var subPresetId = "custom";
  var applyingPreset = false;
  /** 创建/编辑子账号：1 个人信息 → 2 负责项目 → 3 岗位权限 */
  var subStep = 1;
  /** 已到达的最远步；侧栏只允许点 ≤ farthest，禁止跳过未走过的步 */
  var subFarthest = 1;
  var subSelectedProjects = [];
  var filterProjId = "";
  var filterQSubs = "";
  var filterQRoles = "";
  var page = 1;
  var pageSize = window.FZPager ? window.FZPager.DEFAULT : 20;

  function setTab(next) {
    tab = next;
    page = 1;
    var q = [];
    if (tab === "roles") q.push("tab=roles");
    try {
      var nov = new URLSearchParams(location.search).get("novice");
      if (nov) q.push("novice=" + encodeURIComponent(nov));
    } catch (err) {}
    history.replaceState(null, "", "./subs.html" + (q.length ? "?" + q.join("&") : ""));
    document.getElementById("tab-subs").className =
      "btn" + (tab === "subs" ? " btn-primary" : "");
    document.getElementById("tab-roles").className =
      "btn" + (tab === "roles" ? " btn-primary" : "");
    paintToolbar();
    renderList();
  }

  function paintToolbar() {
    var box = document.getElementById("sub-toolbar");
    if (!box) return;
    if (tab === "subs") {
      var s = FZStore.read();
      var list =
        typeof FZStore.businessProjects === "function"
          ? FZStore.businessProjects(s)
          : (s.projects || []).filter(function (p) {
              return !FZStore.isPublicPool(p);
            });
      var opts = '<option value="">全部项目</option>';
      list.forEach(function (p) {
        opts +=
          '<option value="' +
          esc(p.id) +
          '"' +
          (filterProjId === p.id ? " selected" : "") +
          ">" +
          esc(p.name) +
          "</option>";
      });
      box.innerHTML =
        '<input class="input" type="search" id="sub-f-q" placeholder="搜索显示名 / 登录名 / CMS 标识" value="' +
        esc(filterQSubs) +
        '" aria-label="搜索子账号" />' +
        '<select class="input" id="sub-filter-proj" aria-label="按项目筛选子账号">' +
        opts +
        "</select>" +
        '<button type="button" class="btn" id="sub-f-search">搜索</button>' +
        '<button type="button" class="btn btn-ghost" id="sub-f-reset">重置</button>' +
        '<div class="list-toolbar-actions">' +
        '<button type="button" class="btn btn-create" id="btn-primary-act">+ 创建子账号</button></div>';
    } else {
      box.innerHTML =
        '<input class="input" type="search" id="sub-f-q" placeholder="搜索岗位名称" value="' +
        esc(filterQRoles) +
        '" aria-label="搜索岗位" />' +
        '<button type="button" class="btn" id="sub-f-search">搜索</button>' +
        '<button type="button" class="btn btn-ghost" id="sub-f-reset">重置</button>' +
        '<div class="list-toolbar-actions">' +
        '<button type="button" class="btn btn-create" id="btn-primary-act">+ 新建岗位</button></div>';
    }
  }

  function paintPager(total) {
    var box = document.getElementById("list-pager");
    if (!box || !window.FZPager) return;
    if (!total) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML = FZPager.html({ total: total, page: page, pageSize: pageSize });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function markChar(name) {
    var t = String(name || "").trim();
    return t ? t.charAt(0) : "?";
  }

  function projectNames(ids, projects) {
    var map = {};
    (projects || []).forEach(function (p) {
      map[p.id] = p.name;
    });
    var names = (ids || [])
      .map(function (id) {
        return map[id] || id;
      })
      .filter(Boolean);
    if (!names.length) return "未绑定项目";
    if (names.length <= 3) return names.join("、");
    return names.slice(0, 3).join("、") + " 等 " + names.length + " 个";
  }

  function featureStats(features) {
    var list = FZPerm.migrateFeatures(features || []);
    var pages = {};
    list.forEach(function (id) {
      var parts = id.split(".");
      parts.pop();
      pages[parts.join(".")] = true;
    });
    var pageN = Object.keys(pages).length;
    return list.length + " 项权限 · " + pageN + " 个页面";
  }

  /** 岗位卡用：覆盖页面中文名，避免英文 id 挤换行 */
  function roleCoverPages(features) {
    var list = FZPerm.migrateFeatures(features || []);
    if (!list.length) return "未勾选权限";
    var pageIds = {};
    list.forEach(function (id) {
      var parts = id.split(".");
      parts.pop();
      pageIds[parts.join(".")] = true;
    });
    var labels = [];
    function walk(nodes) {
      (nodes || []).forEach(function (n) {
        if (n.actions && pageIds[n.id]) labels.push(n.label);
        if (n.children) walk(n.children);
      });
    }
    walk(FZPerm.TREE || []);
    if (!labels.length) return Object.keys(pageIds).length + " 个页面";
    if (labels.length <= 3) return labels.join("、");
    return labels.slice(0, 3).join("、") + " 等 " + labels.length + " 个";
  }

  function factRow(k, v, vClass) {
    return (
      '<div class="proj-fact"><span class="proj-fact-k">' +
      esc(k) +
      '</span><span class="proj-fact-v' +
      (vClass ? " " + vClass : "") +
      '">' +
      esc(v) +
      "</span></div>"
    );
  }

  function renderSubs() {
    var s = FZStore.read();
    var box = document.getElementById("list-box");
    box.className = "fz-card-grid sub-card-grid";
    if (!s.subs.length) {
      box.innerHTML =
        '<div class="card card-pad muted sub-empty">还没有子账号。点「创建子账号」按三步：个人信息 → 负责项目 → 岗位权限。</div>';
      paintPager(0);
      return;
    }
    var rows = s.subs;
    if (filterProjId) {
      rows = rows.filter(function (u) {
        return (u.projects || []).indexOf(filterProjId) !== -1;
      });
    }
    if (filterQSubs) {
      var q = filterQSubs.toLowerCase();
      rows = rows.filter(function (u) {
        var blob = (
          (u.displayName || "") +
          " " +
          (u.username || "") +
          " " +
          (u.cmsId || "") +
          " " +
          (u.tgPhone || "")
        ).toLowerCase();
        return blob.indexOf(q) !== -1;
      });
    }
    if (!rows.length) {
      box.innerHTML =
        '<div class="card card-pad muted sub-empty">没有匹配的子账号。可改搜索词或项目筛选，或点「创建子账号」。</div>';
      paintPager(0);
      return;
    }
    var slice = window.FZPager
      ? FZPager.slice(rows, page, pageSize)
      : { items: rows, total: rows.length, page: 1, pageSize: rows.length };
    page = slice.page;
    pageSize = slice.pageSize;
    box.innerHTML = slice.items
      .map(function (u) {
        var on = !u.disabled;
        return (
          '<article class="sub-card' +
          (on ? "" : " is-off") +
          '" data-id="' +
          esc(u.id) +
          '">' +
          '<div class="sub-card-head">' +
          '<div class="sub-mark' +
          (on ? " is-on" : " is-off") +
          '">' +
          esc(markChar(u.displayName || u.username)) +
          "</div>" +
          '<div class="sub-card-head-main">' +
          '<h3 class="sub-title">' +
          esc(u.displayName || u.username) +
          "</h3>" +
          '<div class="sub-handle">@' +
          esc(u.username) +
          "</div></div>" +
          '<span class="tag ' +
          (on ? "tag-ok" : "tag-warn") +
          '">' +
          (on ? "启用中" : "已停用") +
          "</span></div>" +
          '<div class="sub-facts">' +
          factRow("岗位", u.roleName || "自定义权限") +
          factRow("权限", featureStats(u.features), "is-muted") +
          factRow(
            "CMS 标识",
            u.cmsId || "未填写",
            u.cmsId ? "is-mono" : "is-muted"
          ) +
          factRow(
            "Telegram",
            u.tgPhone || "未填写",
            u.tgPhone ? "is-mono" : "is-muted"
          ) +
          factRow("负责项目", projectNames(u.projects, s.projects)) +
          "</div>" +
          '<div class="proj-actions">' +
          '<div class="fz-actions-opt">' +
          '<button type="button" class="btn" data-reset="' +
          esc(u.id) +
          '">重置密码</button>' +
          '<button type="button" class="btn" data-reset-totp="' +
          esc(u.id) +
          '">重置验证器</button>' +
          '<button type="button" class="btn" data-disable="' +
          esc(u.id) +
          '">' +
          (on ? "停用" : "启用") +
          "</button></div>" +
          '<div class="fz-actions-fix">' +
          '<button type="button" class="btn btn-primary" data-edit-sub="' +
          esc(u.id) +
          '">编辑</button></div></div></article>'
        );
      })
      .join("");
    paintPager(slice.total);
    box.querySelectorAll("[data-edit-sub]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openSubModal(btn.getAttribute("data-edit-sub"));
      });
    });
    box.querySelectorAll("[data-reset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openResetPassModal(btn.getAttribute("data-reset"));
      });
    });
    box.querySelectorAll("[data-reset-totp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        resetSubTotp(btn.getAttribute("data-reset-totp"));
      });
    });
    box.querySelectorAll("[data-disable]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-disable");
        var u = (FZStore.read().subs || []).filter(function (x) {
          return x.id === id;
        })[0];
        if (!u) return;
        var name = u.displayName || u.username || "该子账号";
        var turningOff = !u.disabled;
        FZShell.confirm({
          title: turningOff ? "停用子账号" : "启用子账号",
          message: turningOff
            ? "确定停用「" + name + "」？停用后对方立即无法登录与操作。"
            : "确定重新启用「" + name + "」？启用后对方可按原权限继续使用。",
          okText: turningOff ? "停用" : "启用",
          danger: turningOff,
          onOk: function () {
            var st = FZStore.read();
            st.subs = st.subs.map(function (row) {
              if (row.id === id) {
                row.disabled = !row.disabled;
                FZShell.toast(
                  row.disabled ? "已停用，演示为立即失效" : "已启用",
                  "ok"
                );
              }
              return row;
            });
            FZStore.write(st);
            renderSubs();
          }
        });
      });
    });
  }

  function roleUserCount(roleName, subs) {
    return (subs || []).filter(function (u) {
      return u.roleName === roleName;
    }).length;
  }

  function renderRoles() {
    var s = FZStore.read();
    var box = document.getElementById("list-box");
    box.className = "fz-card-grid sub-card-grid";
    if (!s.roles.length) {
      box.innerHTML =
        '<div class="card card-pad muted sub-empty">还没有岗位。点「新建岗位」建一个权限包，创建子账号时可选。</div>';
      paintPager(0);
      return;
    }
    var roles = s.roles;
    if (filterQRoles) {
      var rq = filterQRoles.toLowerCase();
      roles = roles.filter(function (r) {
        return String(r.name || "")
          .toLowerCase()
          .indexOf(rq) !== -1;
      });
    }
    if (!roles.length) {
      box.innerHTML =
        '<div class="card card-pad muted sub-empty">没有匹配的岗位。可改搜索词，或点「新建岗位」。</div>';
      paintPager(0);
      return;
    }
    var slice = window.FZPager
      ? FZPager.slice(roles, page, pageSize)
      : { items: roles, total: roles.length, page: 1, pageSize: roles.length };
    page = slice.page;
    pageSize = slice.pageSize;
    box.innerHTML = slice.items
      .map(function (r) {
        var used = roleUserCount(r.name, s.subs);
        var feats = FZPerm.migrateFeatures(r.features || []);
        var pageN = 0;
        var pages = {};
        feats.forEach(function (id) {
          var parts = id.split(".");
          parts.pop();
          pages[parts.join(".")] = true;
        });
        pageN = Object.keys(pages).length;
        return (
          '<article class="role-card" data-id="' +
          esc(r.id) +
          '">' +
          '<div class="sub-card-head">' +
          '<div class="role-mark">' +
          esc(markChar(r.name)) +
          "</div>" +
          '<div class="sub-card-head-main">' +
          '<h3 class="sub-title">' +
          esc(r.name) +
          "</h3></div>" +
          '<span class="tag ' +
          (used ? "tag-ok" : "tag-muted") +
          '" title="当前使用该岗位的子账号数">' +
          (used ? "使用人数 " + used : "暂无人使用") +
          "</span></div>" +
          '<div class="sub-facts sub-facts--flat">' +
          factRow("权限", feats.length + " 项") +
          factRow("页面", pageN + " 个") +
          factRow("覆盖", roleCoverPages(r.features), "is-muted") +
          "</div>" +
          '<div class="proj-actions">' +
          '<div class="fz-actions-opt">' +
          '<button type="button" class="btn" data-del="' +
          esc(r.id) +
          '">删除</button></div>' +
          '<div class="fz-actions-fix">' +
          '<button type="button" class="btn btn-primary" data-edit="' +
          esc(r.id) +
          '">编辑</button></div></div></article>'
        );
      })
      .join("");
    paintPager(slice.total);
    box.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openRoleModal(btn.getAttribute("data-edit"));
      });
    });
    box.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-del");
        var r = (FZStore.read().roles || []).filter(function (x) {
          return x.id === id;
        })[0];
        var name = (r && r.name) || "该岗位";
        var used = roleUserCount(name, FZStore.read().subs);
        FZShell.confirm({
          title: "删除岗位",
          message:
            "确定删除岗位「" +
            name +
            "」？" +
            (used
              ? "当前有 " + used + " 个子账号仍挂此岗位名，删除后不影响已写权限，但无法再套用该岗位。"
              : "删除后不可恢复。"),
          okText: "删除",
          danger: true,
          onOk: function () {
            var st = FZStore.read();
            st.roles = st.roles.filter(function (row) {
              return row.id !== id;
            });
            FZStore.write(st);
            renderRoles();
            FZShell.toast("已删除岗位", "ok");
          }
        });
      });
    });
  }

  function renderList() {
    if (tab === "roles") renderRoles();
    else renderSubs();
  }

  function sameFeatures(a, b) {
    var x = FZPerm.migrateFeatures(a || []).slice().sort();
    var y = FZPerm.migrateFeatures(b || []).slice().sort();
    if (x.length !== y.length) return false;
    for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
    return true;
  }

  function detectPreset(sub, roles) {
    if (!sub || !sub.roleName) return "custom";
    var hit = roles.find(function (r) {
      return r.name === sub.roleName && sameFeatures(sub.features, r.features);
    });
    return hit ? hit.id : "custom";
  }

  function paintRolePresets() {
    var s = FZStore.read();
    var box = document.getElementById("sub-role-presets");
    var chips =
      '<button type="button" class="preset-chip is-custom' +
      (subPresetId === "custom" ? " is-on" : "") +
      '" data-preset="custom">自定义</button>';
    s.roles.forEach(function (r) {
      chips +=
        '<button type="button" class="preset-chip' +
        (subPresetId === r.id ? " is-on" : "") +
        '" data-preset="' +
        r.id +
        '">' +
        r.name +
        "</button>";
    });
    if (!s.roles.length) {
      chips +=
        '<span class="muted" style="font-size:12px;align-self:center">暂无岗位，可先到「岗位」Tab 新建</span>';
    }
    box.innerHTML = chips;
    box.querySelectorAll("[data-preset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyRolePreset(btn.getAttribute("data-preset"));
      });
    });
  }

  function renderSubPermTree(features) {
    FZPerm.render(document.getElementById("sub-feats"), features || [], {
      onChange: function () {
        if (applyingPreset) return;
        if (subPresetId === "custom") return;
        subPresetId = "custom";
        paintRolePresets();
      }
    });
  }

  function applyRolePreset(presetId) {
    var s = FZStore.read();
    subPresetId = presetId || "custom";
    paintRolePresets();
    if (subPresetId === "custom") return;
    var role = s.roles.find(function (r) {
      return r.id === subPresetId;
    });
    if (!role) {
      subPresetId = "custom";
      paintRolePresets();
      return;
    }
    applyingPreset = true;
    renderSubPermTree(role.features);
    applyingPreset = false;
  }

  function siteTypeText(type) {
    if (window.FZUnion && FZUnion.siteTypeLabel) return FZUnion.siteTypeLabel(type);
    if (type === "video") return "视频站";
    if (type === "short_drama") return "短剧站";
    return "瓜站";
  }

  function paintSubSteps() {
    document.querySelectorAll(".sub-wiz-step").forEach(function (btn) {
      var n = Number(btn.getAttribute("data-goto-step"));
      var locked = n > subFarthest;
      btn.classList.toggle("is-on", n === subStep);
      btn.classList.toggle("is-done", n < subStep);
      btn.classList.toggle("is-locked", locked);
      btn.setAttribute("aria-selected", n === subStep ? "true" : "false");
      if (locked) {
        btn.setAttribute("aria-disabled", "true");
        btn.title = "请按顺序完成前面的步骤";
      } else {
        btn.removeAttribute("aria-disabled");
        btn.removeAttribute("title");
      }
    });
    document.querySelectorAll(".sub-wiz-pane").forEach(function (pane) {
      pane.hidden = Number(pane.getAttribute("data-step")) !== subStep;
    });
    document.getElementById("sub-prev").hidden = subStep <= 1;
    document.getElementById("sub-next").hidden = subStep >= 3;
    document.getElementById("sub-save").hidden = subStep !== 3;
  }

  function paintSubProjects() {
    var s = FZStore.read();
    var list =
      typeof FZStore.businessProjects === "function"
        ? FZStore.businessProjects(s)
        : (s.projects || []).filter(function (p) {
            return !FZStore.isPublicPool(p);
          });
    var box = document.getElementById("sub-projects");
    var countEl = document.getElementById("sub-proj-count");
    if (!list.length) {
      box.innerHTML =
        '<p class="muted">还没有业务项目，请先<a href="./project-setup.html?new=1">创建项目</a></p>';
      if (countEl) countEl.textContent = "";
      return;
    }
    box.innerHTML = list
      .map(function (p) {
        var on = subSelectedProjects.indexOf(p.id) !== -1;
        var st = FZStore.projectStatusLabel
          ? FZStore.projectStatusLabel(p)
          : { text: p.status || "—", cls: "tag-muted" };
        return (
          '<button type="button" class="sub-proj-card' +
          (on ? " is-on" : "") +
          '" data-proj="' +
          esc(p.id) +
          '" aria-pressed="' +
          (on ? "true" : "false") +
          '">' +
          '<div class="sub-proj-card-top">' +
          '<strong class="sub-proj-name">' +
          esc(p.name) +
          '</strong><span class="tag ' +
          esc(st.cls || "tag-muted") +
          '">' +
          esc(st.text) +
          "</span></div>" +
          '<div class="sub-proj-meta">' +
          esc(siteTypeText(p.siteType)) +
          "</div>" +
          '<span class="sub-proj-check" aria-hidden="true"></span></button>'
        );
      })
      .join("");
    box.querySelectorAll("[data-proj]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-proj");
        var i = subSelectedProjects.indexOf(id);
        if (i >= 0) subSelectedProjects.splice(i, 1);
        else subSelectedProjects.push(id);
        paintSubProjects();
      });
    });
    if (countEl) {
      countEl.textContent = subSelectedProjects.length
        ? "已选 " + subSelectedProjects.length + " 个项目"
        : "尚未选择项目";
    }
  }

  function validateSubStep(step) {
    if (step === 1) {
      var isEdit = !!editingSubId;
      var username = isEdit ? "" : document.getElementById("sub-user").value.trim();
      var displayName = document.getElementById("sub-name").value.trim();
      var pass = document.getElementById("sub-pass").value;
      if (!isEdit && !username) {
        FZShell.toast("请填写登录名", "err");
        return false;
      }
      if (!isEdit) {
        var pErr = validateNewPassword(pass, pass);
        if (pErr) {
          FZShell.toast(pErr === "两次输入的密码不一致" ? "请填写初始密码（至少 8 位）" : pErr, "err");
          return false;
        }
      }
      if (!displayName) {
        FZShell.toast("请填写显示名", "err");
        return false;
      }
      var tg = document.getElementById("sub-tg").value.trim().replace(/[\s-]/g, "");
      if (tg && !/^\+\d{8,15}$/.test(tg)) {
        FZShell.toast("Telegram 须为带国家码的手机号，例如 +8613800000000", "err");
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!subSelectedProjects.length) {
        FZShell.toast("请至少选择一个负责项目", "err");
        return false;
      }
      return true;
    }
    if (step === 3) {
      var features = FZPerm.collect(document.getElementById("sub-feats"));
      if (!features.length) {
        FZShell.toast("请至少勾选一项权限", "err");
        return false;
      }
      return true;
    }
    return true;
  }

  function goSubStep(next) {
    if (next < 1 || next > 3) return;
    /* 前进到未走过的步：只允许相邻 +1，且校验当前步 */
    if (next > subFarthest) {
      if (next !== subStep + 1 || next !== subFarthest + 1) return;
      if (!validateSubStep(subStep)) return;
    } else if (next > subStep && !validateSubStep(subStep)) {
      return;
    }
    subStep = next;
    if (subStep > subFarthest) subFarthest = subStep;
    if (subStep === 2) paintSubProjects();
    if (subStep === 3) {
      paintRolePresets();
    }
    paintSubSteps();
  }

  var resetPassSubId = null;

  function genPassword() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    var out = "";
    for (var i = 0; i < 10; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }

  function validateNewPassword(pass, confirm) {
    if (!pass || pass.length < 8) return "新密码至少 8 位";
    if (pass !== confirm) return "两次输入的密码不一致";
    return "";
  }

  function resetSubTotp(subId) {
    var u = (FZStore.read().subs || []).filter(function (x) {
      return x.id === subId;
    })[0];
    if (!u) return;
    var name = u.displayName || u.username || "该子账号";
    FZShell.confirm({
      title: "重置谷歌验证",
      message: "确定重置「" + name + "」的谷歌验证器？对方下次登录须重新扫码绑定。",
      okText: "重置验证器",
      danger: true,
      onOk: function () {
        var st = FZStore.read();
        st.subs = (st.subs || []).map(function (row) {
          if (row.id !== subId) return row;
          row.totpBound = false;
          return row;
        });
        FZStore.write(st);
        renderList();
        FZShell.toast("已重置谷歌验证，对方下次登录须重新绑定", "ok");
      }
    });
  }

  function openResetPassModal(subId) {
    var u = (FZStore.read().subs || []).filter(function (x) {
      return x.id === subId;
    })[0];
    if (!u) {
      FZShell.toast("子账号不存在", "err");
      return;
    }
    if (u.disabled) {
      FZShell.toast("已停用的子账号请先启用，再重置密码", "err");
      return;
    }
    resetPassSubId = subId;
    var name = u.displayName || u.username;
    document.getElementById("sub-pass-lead").textContent =
      "为「" + name + "」（@" + u.username + "）设置新登录密码。生效后对方须用新密码登录。";
    document.getElementById("sub-pass-new").value = "";
    document.getElementById("sub-pass-confirm").value = "";
    document.getElementById("sub-pass-modal").hidden = false;
    document.getElementById("sub-pass-new").focus();
  }

  function closeResetPassModal() {
    document.getElementById("sub-pass-modal").hidden = true;
    resetPassSubId = null;
  }

  function showPassDone(username, password) {
    document.getElementById("sub-pass-done-user").textContent = "@" + username;
    document.getElementById("sub-pass-done-pwd").textContent = password;
    document.getElementById("sub-pass-done-modal").hidden = false;
  }

  function closePassDone() {
    document.getElementById("sub-pass-done-modal").hidden = true;
    document.getElementById("sub-pass-done-pwd").textContent = "";
  }

  function openSubModal(subId) {
    var s = FZStore.read();
    editingSubId = subId || null;
    var sub = editingSubId
      ? s.subs.find(function (u) {
          return u.id === editingSubId;
        })
      : null;
    var isEdit = !!sub;
    document.getElementById("sub-modal-title").textContent = isEdit
      ? "编辑子账号"
      : "创建子账号";
    document.getElementById("sub-modal-lead").textContent = isEdit
      ? "分三步调整：① 个人信息 → ② 负责项目 → ③ 岗位与权限。"
      : "分三步：① 个人信息 → ② 负责项目 → ③ 岗位与权限。";
    document.getElementById("sub-user-field").hidden = isEdit;
    document.getElementById("sub-user-ro").hidden = !isEdit;
    document.getElementById("sub-pass-field").hidden = isEdit;
    if (isEdit) {
      document.getElementById("sub-user-ro-text").textContent = "@" + sub.username;
      document.getElementById("sub-name").value = sub.displayName || "";
      document.getElementById("sub-cms").value = sub.cmsId || "";
      document.getElementById("sub-tg").value = sub.tgPhone || "";
    } else {
      document.getElementById("sub-user").value = "";
      document.getElementById("sub-name").value = "";
      document.getElementById("sub-pass").value = "Changeme1";
      document.getElementById("sub-cms").value = "";
      document.getElementById("sub-tg").value = "";
    }
    subSelectedProjects = sub && sub.projects ? sub.projects.slice() : [];
    subPresetId = detectPreset(sub, s.roles);
    paintRolePresets();
    renderSubPermTree(sub ? sub.features : []);
    subStep = 1;
    /* 编辑：三步均已填过，可自由切换；新建：从第 1 步起按序推进 */
    subFarthest = isEdit ? 3 : 1;
    paintSubSteps();
    document.getElementById("sub-modal").hidden = false;
  }

  function openRoleModal(id) {
    editingRoleId = id || null;
    var s = FZStore.read();
    var role = id
      ? s.roles.find(function (r) {
          return r.id === id;
        })
      : null;
    document.getElementById("role-modal-title").textContent = role
      ? "编辑岗位"
      : "新建岗位";
    document.getElementById("role-name").value = role ? role.name : "";
    FZPerm.render(document.getElementById("role-feats"), role ? role.features : []);
    document.getElementById("role-modal").hidden = false;
  }

  document.getElementById("tab-subs").addEventListener("click", function () {
    setTab("subs");
  });
  document.getElementById("tab-roles").addEventListener("click", function () {
    setTab("roles");
  });
  (function bindToolbar() {
    var bar = document.getElementById("sub-toolbar");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      if (e.target.id === "btn-primary-act") {
        if (tab === "roles") openRoleModal(null);
        else openSubModal(null);
        return;
      }
      if (e.target.id === "sub-f-search") {
        var qEl = document.getElementById("sub-f-q");
        var q = ((qEl && qEl.value) || "").trim();
        if (tab === "roles") filterQRoles = q;
        else filterQSubs = q;
        page = 1;
        renderList();
        return;
      }
      if (e.target.id === "sub-f-reset") {
        if (tab === "roles") {
          filterQRoles = "";
        } else {
          filterQSubs = "";
          filterProjId = "";
        }
        page = 1;
        paintToolbar();
        renderList();
        FZShell.toast("已重置筛选", "ok");
      }
    });
    bar.addEventListener("change", function (e) {
      if (e.target.id !== "sub-filter-proj") return;
      filterProjId = e.target.value || "";
      page = 1;
      renderList();
    });
    bar.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || e.target.id !== "sub-f-q") return;
      e.preventDefault();
      var q = (e.target.value || "").trim();
      if (tab === "roles") filterQRoles = q;
      else filterQSubs = q;
      page = 1;
      renderList();
    });
  })();

  function notifySubWizardDone() {
    if (window.FZNoviceTours) FZNoviceTours.notify("subs", "sub_wizard_done");
  }
  document.getElementById("sub-cancel").addEventListener("click", function () {
    document.getElementById("sub-modal").hidden = true;
    editingSubId = null;
    subStep = 1;
    notifySubWizardDone();
  });
  document.getElementById("sub-modal").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) {
      document.getElementById("sub-modal").hidden = true;
      editingSubId = null;
      subStep = 1;
      notifySubWizardDone();
    }
  });
  document.getElementById("sub-prev").addEventListener("click", function () {
    goSubStep(subStep - 1);
  });
  document.getElementById("sub-next").addEventListener("click", function () {
    goSubStep(subStep + 1);
  });
  document.getElementById("sub-wiz-steps").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-goto-step]");
    if (!btn) return;
    var target = Number(btn.getAttribute("data-goto-step"));
    if (target === subStep) return;
    if (target > subFarthest) {
      FZShell.toast("请按顺序完成前面的步骤，不能跳过", "err");
      return;
    }
    /* 仅在已到达的步骤间切换修改，不校验、不自动跨步推进 */
    subStep = target;
    if (subStep === 2) paintSubProjects();
    if (subStep === 3) paintRolePresets();
    paintSubSteps();
  });
  document.getElementById("sub-save").addEventListener("click", function () {
    if (!validateSubStep(1)) {
      goSubStep(1);
      return;
    }
    if (!validateSubStep(2)) {
      goSubStep(2);
      return;
    }
    if (!validateSubStep(3)) {
      goSubStep(3);
      return;
    }
    var isEdit = !!editingSubId;
    var username = isEdit ? "" : document.getElementById("sub-user").value.trim();
    var displayName = document.getElementById("sub-name").value.trim();
    var cmsId = document.getElementById("sub-cms").value.trim();
    var tgPhone = document.getElementById("sub-tg").value.trim().replace(/[\s-]/g, "");
    var features = FZPerm.collect(document.getElementById("sub-feats"));
    var projects = subSelectedProjects.slice();
    var st = FZStore.read();
    var role =
      subPresetId !== "custom"
        ? st.roles.find(function (r) {
            return r.id === subPresetId;
          })
        : null;
    var roleName = role ? role.name : "";
    if (isEdit) {
      st.subs = st.subs.map(function (u) {
        if (u.id !== editingSubId) return u;
        u.displayName = displayName;
        u.cmsId = cmsId;
        u.tgPhone = tgPhone;
        u.features = features;
        u.projects = projects;
        u.roleName = roleName;
        return u;
      });
      FZStore.write(st);
      document.getElementById("sub-modal").hidden = true;
      editingSubId = null;
      subStep = 1;
      renderList();
      FZShell.toast("子账号已更新", "ok");
      notifySubWizardDone();
      return;
    }
    var initPass = document.getElementById("sub-pass").value;
    var passErr = validateNewPassword(initPass, initPass);
    if (passErr) {
      FZShell.toast(passErr, "err");
      goSubStep(1);
      return;
    }
    st.subs.push({
      id: FZStore.uid("sub"),
      username: username,
      displayName: displayName,
      password: initPass,
      cmsId: cmsId,
      tgPhone: tgPhone,
      totpBound: true,
      features: features,
      projects: projects,
      roleName: roleName,
      disabled: false
    });
    FZStore.write(st);
    document.getElementById("sub-modal").hidden = true;
    editingSubId = null;
    subStep = 1;
    renderList();
    FZShell.toast("子账号已创建，可用登录名与初始密码登录", "ok");
    notifySubWizardDone();
  });

  document.getElementById("sub-pass-cancel").addEventListener("click", closeResetPassModal);
  document.getElementById("sub-pass-modal").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) closeResetPassModal();
  });
  document.getElementById("sub-pass-gen").addEventListener("click", function () {
    var p = genPassword();
    var neu = document.getElementById("sub-pass-new");
    var conf = document.getElementById("sub-pass-confirm");
    neu.type = "text";
    conf.type = "text";
    neu.value = p;
    conf.value = p;
    FZShell.toast("已生成随机密码，可改后再确认", "ok");
  });
  document.getElementById("sub-pass-ok").addEventListener("click", function () {
    if (!resetPassSubId) return;
    var neu = document.getElementById("sub-pass-new").value;
    var conf = document.getElementById("sub-pass-confirm").value;
    var err = validateNewPassword(neu, conf);
    if (err) {
      FZShell.toast(err, "err");
      return;
    }
    var st = FZStore.read();
    var hit = null;
    st.subs = st.subs.map(function (u) {
      if (u.id !== resetPassSubId) return u;
      u.password = neu;
      u.passwordUpdatedAt = new Date().toISOString();
      hit = u;
      return u;
    });
    if (!hit) {
      FZShell.toast("子账号不存在", "err");
      closeResetPassModal();
      return;
    }
    FZStore.write(st);
    closeResetPassModal();
    showPassDone(hit.username, neu);
    FZShell.toast("密码已重置", "ok");
  });
  document.getElementById("sub-pass-copy").addEventListener("click", function () {
    var text = document.getElementById("sub-pass-done-pwd").textContent || "";
    if (!text) return;
    function ok() {
      FZShell.toast("已复制新密码", "ok");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(function () {
        FZShell.toast("复制失败，请手动选中密码", "err");
      });
    } else {
      FZShell.toast("请手动选中密码复制", "err");
    }
  });
  document.getElementById("sub-pass-done-ok").addEventListener("click", closePassDone);
  document.getElementById("sub-pass-done-modal").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) closePassDone();
  });

  document.getElementById("role-cancel").addEventListener("click", function () {
    document.getElementById("role-modal").hidden = true;
  });
  document.getElementById("role-modal").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) document.getElementById("role-modal").hidden = true;
  });
  document.getElementById("role-save").addEventListener("click", function () {
    var name = document.getElementById("role-name").value.trim();
    if (!name) {
      FZShell.toast("请填写岗位名称");
      return;
    }
    var features = FZPerm.collect(document.getElementById("role-feats"));
    if (!features.length) {
      FZShell.toast("请至少勾选一项权限");
      return;
    }
    var st = FZStore.read();
    if (editingRoleId) {
      st.roles = st.roles.map(function (r) {
        if (r.id === editingRoleId) return { id: r.id, name: name, features: features };
        return r;
      });
    } else {
      st.roles.push({ id: FZStore.uid("role"), name: name, features: features });
    }
    FZStore.write(st);
    document.getElementById("role-modal").hidden = true;
    renderList();
    FZShell.toast("岗位已保存");
  });

  if (window.FZPager) {
    FZPager.bind(document.getElementById("list-pager"), {
      getState: function () {
        return { page: page, pageSize: pageSize };
      },
      setState: function (next) {
        if (next.page != null) page = next.page;
        if (next.pageSize != null) pageSize = next.pageSize;
      },
      onChange: renderList
    });
  }
  setTab(tab);
})();
