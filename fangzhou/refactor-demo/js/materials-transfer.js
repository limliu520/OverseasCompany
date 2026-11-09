/* 转编辑 / 驳回弹窗（只选项目进内容通道） */
(function (w) {
  var PROJECTS = [
    { id: "proj_demo_ready", name: "每日大赛", siteType: "瓜站" },
    { id: "proj_demo_chigua2", name: "51 吃瓜", siteType: "瓜站" },
    { id: "proj_demo_collect", name: "91 网黄", siteType: "视频站" },
    { id: "proj_demo_video2", name: "51 原创", siteType: "视频站" },
    { id: "proj_demo_pending", name: "51 短剧", siteType: "短剧站" },
    { id: "proj_demo_drama2", name: "51 短视频", siteType: "短剧站" }
  ];

  function findMaterial(mid) {
    var items = (w.FZMatData && w.FZMatData.ITEMS) || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === mid) return items[i];
    }
    return null;
  }
  function usedNames(m) {
    if (w.FZMatData && w.FZMatData.usedByList) return w.FZMatData.usedByList(m);
    return (m && m.usedByProjects) || [];
  }

  function open(materialId, preferProjectName) {
    bind();
    document.getElementById("mat-xfer-mid").value = materialId;
    var m = findMaterial(materialId);
    var occupied = usedNames(m);
    var sel = document.getElementById("mat-xfer-project");
    var hint = document.getElementById("mat-xfer-hint");
    sel.innerHTML =
      '<option value="">-- 请选择项目 --</option>' +
      PROJECTS.map(function (p) {
        var taken = occupied.indexOf(p.name) >= 0;
        return (
          '<option value="' +
          p.id +
          '"' +
          (taken ? " disabled" : "") +
          ">" +
          p.name +
          (p.siteType ? " · " + p.siteType : "") +
          (taken ? "（该素材已在本项目使用）" : "") +
          "</option>"
        );
      }).join("");
    var preferred = preferProjectName
      ? PROJECTS.filter(function (p) {
          return occupied.indexOf(p.name) < 0 && p.name === preferProjectName;
        })[0]
      : null;
    var first =
      preferred ||
      PROJECTS.filter(function (p) {
        return occupied.indexOf(p.name) < 0;
      })[0];
    if (first) sel.value = first.id;
    else sel.value = "";
    applyCoverDefault(first && first.id);
    onProjectChange();
    document.getElementById("mat-xfer-mask").hidden = false;
  }
  function projectCoverPanel(pid) {
    try {
      if (w.FZStore) {
        var st = FZStore.read();
        var hit = (st.projects || []).find(function (x) {
          return x.id === pid;
        });
        if (hit) {
          if (w.FZProjectUnion && FZProjectUnion.normalizeProject) {
            FZProjectUnion.normalizeProject(hit);
          }
          var n = Number(hit.coverPanelCount);
          if (n === 1 || n === 2 || n === 3) return n;
        }
      }
    } catch (e) {}
    return 3;
  }
  function applyCoverDefault(pid) {
    var el = document.getElementById("mat-xfer-cover");
    if (!el) return;
    el.value = String(projectCoverPanel(pid));
  }
  function onProjectChange() {
    var pid = document.getElementById("mat-xfer-project").value;
    var hint = document.getElementById("mat-xfer-hint");
    var p = PROJECTS.filter(function (x) {
      return x.id === pid;
    })[0];
    applyCoverDefault(pid);
    if (!pid) {
      if (hint) hint.textContent = "";
      updateSubmit();
      return;
    }
    var mid = document.getElementById("mat-xfer-mid").value;
    var m = findMaterial(mid);
    if (p && occupiedHas(m, p.name)) {
      if (hint) hint.textContent = "该素材已在本项目使用";
    } else if (hint) {
      hint.textContent =
        "确认后占用该项目内容通道并派发处理；素材仍留在公共素材池，其他人仍可查看，也可再转到其他未占用项目。文章封面拼图默认取项目配置，可改本次。";
    }
    updateSubmit();
  }
  function occupiedHas(m, name) {
    return usedNames(m).indexOf(name) >= 0;
  }
  function updateSubmit() {
    var btn = document.getElementById("mat-xfer-submit");
    var sel = document.getElementById("mat-xfer-project");
    var p = PROJECTS.filter(function (x) {
      return x.id === sel.value;
    })[0];
    var mid = document.getElementById("mat-xfer-mid").value;
    var m = findMaterial(mid);
    if (btn) btn.disabled = !p || occupiedHas(m, p.name);
  }
  function close() {
    document.getElementById("mat-xfer-mask").hidden = true;
  }
  function submit() {
    var mid = document.getElementById("mat-xfer-mid").value;
    var sel = document.getElementById("mat-xfer-project");
    var p = PROJECTS.filter(function (x) {
      return x.id === sel.value;
    })[0];
    var m = findMaterial(mid);
    if (!p || occupiedHas(m, p.name)) {
      FZShell.toast(
        occupiedHas(m, p && p.name) ? "该素材已在本项目使用" : "请选择可用项目",
        "err"
      );
      return;
    }
    if (w.FZMatData && w.FZMatData.markUsedBy) w.FZMatData.markUsedBy(m, p.name);
    else if (m) {
      if (!m.usedByProjects) m.usedByProjects = [];
      if (m.usedByProjects.indexOf(p.name) < 0) m.usedByProjects.push(p.name);
      if (m.status === "used") m.status = "available";
    }
    var cover = document.getElementById("mat-xfer-cover").value || "3";
    var coverLabel = { 1: "单拼图", 2: "二拼图", 3: "三拼图" }[cover] || "三拼图";
    var isDrama = p.siteType === "短剧站";
    FZShell.toast(
      isDrama
        ? "已推送"
        : "已转编辑（" + p.name + " · 文章封面" + coverLabel + "）",
      "ok"
    );
    close();
    if (w.FZMatDetail) w.FZMatDetail.close();
    if (w.FZMatApp && w.FZMatApp.paint) w.FZMatApp.paint();
  }
  function openReject(materialId, mode) {
    bind();
    if (mode !== "pass" && mode !== "restore") mode = "reject";
    document.getElementById("mat-reject-mid").value = materialId;
    document.getElementById("mat-reject-mode").value = mode;
    document.getElementById("mat-reject-reason").value = "";
    var title = document.getElementById("mat-reject-title");
    var label = document.getElementById("mat-reject-label");
    var btn = document.getElementById("mat-reject-submit");
    var ta = document.getElementById("mat-reject-reason");
    if (mode === "pass") {
      if (title) title.textContent = "填写审核原因";
      if (label) label.textContent = "通过理由 *";
      if (ta) ta.placeholder = "请输入通过理由";
      if (btn) {
        btn.textContent = "确认通过";
        btn.className = "btn btn-primary";
      }
    } else if (mode === "restore") {
      if (title) title.textContent = "手动通过";
      if (label) label.textContent = "通过理由 *";
      if (ta) ta.placeholder = "请输入手动通过理由（素材将离开垃圾池，进入后续流程）";
      if (btn) {
        btn.textContent = "确认手动通过";
        btn.className = "btn btn-primary";
      }
    } else {
      if (title) title.textContent = "驳回素材";
      if (label) label.textContent = "驳回理由 *";
      if (ta) ta.placeholder = "请输入驳回理由（将反馈给自学习机制优化筛选规则）";
      if (btn) {
        btn.textContent = "确认驳回";
        btn.className = "btn btn-danger";
      }
    }
    document.getElementById("mat-reject-mask").hidden = false;
    /* 教程中预填理由，避免卡在必填 */
    try {
      if (
        w.FZNoviceTours &&
        FZNoviceTours.get &&
        FZNoviceTours.get("materials") &&
        FZNoviceTours.get("materials").active &&
        FZNoviceTours.get("materials").active()
      ) {
        var ta0 = document.getElementById("mat-reject-reason");
        if (ta0 && !String(ta0.value || "").trim()) {
          ta0.value =
            mode === "reject" ? "教程演示：驳回示例" : "教程演示：通过示例";
        }
      }
    } catch (err) {}
  }
  function closeReject() {
    document.getElementById("mat-reject-mask").hidden = true;
  }
  function submitReject() {
    var reason = document.getElementById("mat-reject-reason").value.trim();
    var mode = document.getElementById("mat-reject-mode").value;
    if (!reason) {
      FZShell.toast(
        mode === "reject" ? "请填写驳回原因" : "请填写通过理由",
        "err"
      );
      return;
    }
    var msg =
      mode === "restore"
        ? "Demo：已手动通过，素材离开垃圾池（" + reason.slice(0, 20) + "）"
        : mode === "pass"
          ? "Demo：已通过（" + reason.slice(0, 20) + "）"
          : "Demo：已驳回（" + reason.slice(0, 20) + "）";
    FZShell.toast(msg, "ok");
    closeReject();
    if (w.FZMatDetail) w.FZMatDetail.close();
  }
  function bind() {
    var xfer = document.getElementById("mat-xfer-mask");
    if (xfer && !xfer._bound) {
      xfer._bound = true;
      xfer.addEventListener("click", function (e) {
        /* 转编辑：编辑类，点遮罩不关闭；仅明确关闭按钮 */
        if (e.target.closest("[data-xfer-close]")) close();
        if (e.target.id === "mat-xfer-submit") submit();
      });
      document.getElementById("mat-xfer-project").addEventListener("change", onProjectChange);
    }
    var rej = document.getElementById("mat-reject-mask");
    if (rej && !rej._bound) {
      rej._bound = true;
      rej.addEventListener("click", function (e) {
        if (e.target.closest("[data-reject-close]")) closeReject();
        if (e.target.id === "mat-reject-submit") submitReject();
      });
    }
  }

  w.FZMatTransfer = {
    open: open,
    openReject: openReject,
    close: close,
    bind: bind
  };
})(window);
