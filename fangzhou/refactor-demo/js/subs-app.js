/* 子账号与授权页 */
(function () {
  FZShell.boot({ active: "subs" });
  var tab = new URLSearchParams(location.search).get("tab") === "roles" ? "roles" : "subs";
  var editingRoleId = null;
  var editingSubId = null;
  /** 子账号弹层：custom | roleId；改权限树时自动回 custom */
  var subPresetId = "custom";
  var applyingPreset = false;

  function setTab(next) {
    tab = next;
    history.replaceState(null, "", "./subs.html" + (tab === "roles" ? "?tab=roles" : ""));
    document.getElementById("tab-subs").className =
      "btn" + (tab === "subs" ? " btn-primary" : "");
    document.getElementById("tab-roles").className =
      "btn" + (tab === "roles" ? " btn-primary" : "");
    document.getElementById("tab-desc").textContent =
      tab === "subs"
        ? "子号必选权限 + 项目；可填 CMS 标识。权限按侧栏一/二/三级 + 页内操作细化。岗位在「岗位」Tab。"
        : "岗位 = 菜单层级 + 页内操作的权限包。建子号时可套用岗位再微调。";
    document.getElementById("btn-primary-act").textContent =
      tab === "subs" ? "+ 创建子账号" : "+ 新建岗位";
    renderList();
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
    if (names.length <= 2) return names.join("、");
    return names.slice(0, 2).join("、") + " 等 " + names.length + " 个";
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
        '<div class="card card-pad muted sub-empty">还没有子账号。可先到「岗位」Tab 建合集，也可直接自定义权限创建。</div>';
      return;
    }
    box.innerHTML = s.subs
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
          (u.roleName
            ? '<div class="proj-tags"><span class="proj-tag">' +
              esc(u.roleName) +
              "</span></div>"
            : '<div class="proj-tags"><span class="proj-tag is-custom">自定义权限</span></div>') +
          '<div class="proj-facts">' +
          factRow("CMS", u.cmsId || "未填写", u.cmsId ? "is-mono" : "is-muted") +
          factRow("项目", projectNames(u.projects, s.projects)) +
          factRow("权限", featureStats(u.features), "is-muted") +
          "</div>" +
          '<div class="proj-actions">' +
          '<button type="button" class="btn" data-edit-sub="' +
          esc(u.id) +
          '">编辑</button>' +
          '<button type="button" class="btn btn-ghost" data-reset="' +
          esc(u.id) +
          '">重置密码</button>' +
          '<button type="button" class="btn btn-ghost" data-disable="' +
          esc(u.id) +
          '">' +
          (on ? "停用" : "启用") +
          "</button></div></article>"
        );
      })
      .join("");
    box.querySelectorAll("[data-edit-sub]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openSubModal(btn.getAttribute("data-edit-sub"));
      });
    });
    box.querySelectorAll("[data-reset]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        FZShell.toast("已重置子账号密码（演示）");
      });
    });
    box.querySelectorAll("[data-disable]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var st = FZStore.read();
        st.subs = st.subs.map(function (u) {
          if (u.id === btn.getAttribute("data-disable")) {
            u.disabled = !u.disabled;
            FZShell.toast(u.disabled ? "已停用，演示为立即失效" : "已启用");
          }
          return u;
        });
        FZStore.write(st);
        renderSubs();
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
        '<div class="card card-pad muted sub-empty">还没有岗位。先建一个权限包，创建子账号时可选。</div>';
      return;
    }
    box.innerHTML = s.roles
      .map(function (r) {
        var used = roleUserCount(r.name, s.subs);
        return (
          '<article class="role-card" data-id="' +
          esc(r.id) +
          '"><div class="role-card-body">' +
          '<div class="sub-card-head">' +
          '<div class="role-mark">' +
          esc(markChar(r.name)) +
          "</div>" +
          '<div class="sub-card-head-main">' +
          '<h3 class="sub-title">' +
          esc(r.name) +
          "</h3>" +
          '<p class="sub-status">权限包</p></div></div>' +
          '<div class="proj-facts">' +
          factRow("规模", featureStats(r.features)) +
          factRow(
            "选用",
            used ? used + " 个子账号套用" : "暂无子账号套用",
            used ? "" : "is-muted"
          ) +
          factRow("摘要", FZPerm.summarize(r.features), "is-muted") +
          "</div></div>" +
          '<div class="proj-actions">' +
          '<button type="button" class="btn" data-edit="' +
          esc(r.id) +
          '">编辑</button>' +
          '<button type="button" class="btn btn-ghost" data-del="' +
          esc(r.id) +
          '">删除</button></div></article>'
        );
      })
      .join("");
    box.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openRoleModal(btn.getAttribute("data-edit"));
      });
    });
    box.querySelectorAll("[data-del]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var st = FZStore.read();
        st.roles = st.roles.filter(function (r) {
          return r.id !== btn.getAttribute("data-del");
        });
        FZStore.write(st);
        renderRoles();
        FZShell.toast("已删除岗位");
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
    document.getElementById("sub-user-field").hidden = isEdit;
    document.getElementById("sub-user-ro").hidden = !isEdit;
    document.getElementById("sub-pass-field").hidden = isEdit;
    if (isEdit) {
      document.getElementById("sub-user-ro-text").textContent = "@" + sub.username;
      document.getElementById("sub-name").value = sub.displayName || "";
      document.getElementById("sub-cms").value = sub.cmsId || "";
    } else {
      document.getElementById("sub-user").value = "";
      document.getElementById("sub-name").value = "";
      document.getElementById("sub-pass").value = "Changeme1";
      document.getElementById("sub-cms").value = "";
    }
    subPresetId = detectPreset(sub, s.roles);
    paintRolePresets();
    renderSubPermTree(sub ? sub.features : []);
    var selectedProjects = sub ? sub.projects || [] : [];
    var projBox = document.getElementById("sub-projects");
    if (!s.projects.length) {
      projBox.innerHTML =
        '<p class="muted">还没有项目，请先<a href="./project-setup.html?new=1">创建项目</a></p>';
    } else {
      projBox.innerHTML = s.projects
        .map(function (p) {
          return (
            '<label class="check-item"><input type="checkbox" value="' +
            p.id +
            '"' +
            (selectedProjects.indexOf(p.id) !== -1 ? " checked" : "") +
            " /> " +
            p.name +
            "</label>"
          );
        })
        .join("");
    }
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
  document.getElementById("btn-primary-act").addEventListener("click", function () {
    if (tab === "roles") openRoleModal(null);
    else openSubModal(null);
  });

  document.getElementById("sub-cancel").addEventListener("click", function () {
    document.getElementById("sub-modal").hidden = true;
    editingSubId = null;
  });
  document.getElementById("sub-modal").addEventListener("click", function (e) {
    if (e.target === e.currentTarget) {
      document.getElementById("sub-modal").hidden = true;
      editingSubId = null;
    }
  });
  document.getElementById("sub-save").addEventListener("click", function () {
    var isEdit = !!editingSubId;
    var username = isEdit ? "" : document.getElementById("sub-user").value.trim();
    var displayName = document.getElementById("sub-name").value.trim();
    var cmsId = document.getElementById("sub-cms").value.trim();
    var pass = document.getElementById("sub-pass").value;
    if (!isEdit && (!username || !pass)) {
      FZShell.toast("请填写登录名和密码");
      return;
    }
    if (!isEdit && !displayName) displayName = username;
    if (isEdit && !displayName) {
      FZShell.toast("请填写显示名");
      return;
    }
    var features = FZPerm.collect(document.getElementById("sub-feats"));
    var projects = [];
    document.querySelectorAll("#sub-projects input:checked").forEach(function (el) {
      projects.push(el.value);
    });
    if (!features.length) {
      FZShell.toast("请至少勾选一项权限");
      return;
    }
    if (!projects.length) {
      FZShell.toast("请至少勾选一个项目");
      return;
    }
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
        u.features = features;
        u.projects = projects;
        u.roleName = roleName;
        return u;
      });
      FZStore.write(st);
      document.getElementById("sub-modal").hidden = true;
      editingSubId = null;
      renderList();
      FZShell.toast("子账号已更新", "ok");
      return;
    }
    st.subs.push({
      id: FZStore.uid("sub"),
      username: username,
      displayName: displayName,
      cmsId: cmsId,
      features: features,
      projects: projects,
      roleName: roleName,
      disabled: false
    });
    FZStore.write(st);
    document.getElementById("sub-modal").hidden = true;
    editingSubId = null;
    renderList();
    FZShell.toast("子账号已创建，权限立即生效（演示）");
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

  setTab(tab);
})();
