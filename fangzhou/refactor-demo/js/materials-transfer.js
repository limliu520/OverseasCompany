/* 转编辑 / 驳回弹窗（只选项目进内容通道） */
(function (w) {
  var PROJECTS = [
    { id: "p1", name: "演示瓜站", siteType: "瓜站" },
    { id: "p2", name: "演示视频站", siteType: "视频站" },
    {
      id: "p3",
      name: "演示短剧站",
      siteType: "短剧站",
      disabled: true,
      reason: "该素材已被当前项目使用"
    }
  ];

  function open(materialId) {
    bind();
    document.getElementById("mat-xfer-mid").value = materialId;
    var sel = document.getElementById("mat-xfer-project");
    var hint = document.getElementById("mat-xfer-hint");
    sel.innerHTML =
      '<option value="">-- 请选择项目 --</option>' +
      PROJECTS.map(function (p) {
        return (
          '<option value="' +
          p.id +
          '"' +
          (p.disabled ? " disabled" : "") +
          ">" +
          p.name +
          (p.siteType ? " · " + p.siteType : "") +
          (p.disabled ? "（不可用）" : "") +
          "</option>"
        );
      }).join("");
    var first = PROJECTS.filter(function (p) {
      return !p.disabled;
    })[0];
    if (first) sel.value = first.id;
    document.getElementById("mat-xfer-cover").value = "3";
    onProjectChange();
    document.getElementById("mat-xfer-mask").hidden = false;
  }
  function onProjectChange() {
    var pid = document.getElementById("mat-xfer-project").value;
    var hint = document.getElementById("mat-xfer-hint");
    var p = PROJECTS.filter(function (x) {
      return x.id === pid;
    })[0];
    if (!pid) {
      if (hint) hint.textContent = "";
      updateSubmit();
      return;
    }
    if (p && p.disabled) {
      if (hint) hint.textContent = p.reason || "该项目不可用";
    } else if (hint) {
      hint.textContent = "确认后将占用该项目内容通道并派发处理。";
    }
    updateSubmit();
  }
  function updateSubmit() {
    var btn = document.getElementById("mat-xfer-submit");
    var sel = document.getElementById("mat-xfer-project");
    var p = PROJECTS.filter(function (x) {
      return x.id === sel.value;
    })[0];
    if (btn) btn.disabled = !p || !!p.disabled;
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
    if (!p || p.disabled) {
      FZShell.toast("请选择可用项目", "err");
      return;
    }
    var cover = document.getElementById("mat-xfer-cover").value || "3";
    FZShell.toast(
      "Demo：已派发媒体处理（" + p.name + " · 封面拼图 " + cover + " · 素材 " + mid + "）",
      "ok"
    );
    close();
    if (w.FZMatDetail) w.FZMatDetail.close();
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
        if (e.target === xfer || e.target.closest("[data-xfer-close]")) close();
        if (e.target.id === "mat-xfer-submit") submit();
      });
      document.getElementById("mat-xfer-project").addEventListener("change", onProjectChange);
    }
    var rej = document.getElementById("mat-reject-mask");
    if (rej && !rej._bound) {
      rej._bound = true;
      rej.addEventListener("click", function (e) {
        if (e.target === rej || e.target.closest("[data-reject-close]")) closeReject();
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
