/* 网站采集 · 详情/编辑弹窗逻辑 */
window.FZWebCollectModal = (function () {
  var D = window.FZWebCollectData;
  var R = window.FZWebCollectRender;
  var F = window.FZWebCollectForm;
  var editingId = null;
  var modalMode = "view";
  var sitesRef = null;
  var onDone = null;

  function selectedTargets() {
    return Array.prototype.map.call(
      document.querySelectorAll("#wc-f-targets input:checked"),
      function (el) {
        return el.value;
      }
    );
  }

  function fillForm(s) {
    document.getElementById("wc-f-name").value = s ? s.name : "";
    document.getElementById("wc-f-url").value = s ? s.baseUrl : "";
    document.getElementById("wc-f-pages").value = s ? (s.pages || []).join("\n") : "";
    document.getElementById("wc-f-interval").value = String(s ? s.interval : 60);
    document.getElementById("wc-f-collect").checked = s ? s.collectOn !== false : true;
    document.getElementById("wc-f-dedup").checked = s ? s.dedup !== false : true;
    document.getElementById("wc-f-notes").value = s ? s.notes || "" : "";
    var type = s ? s.type || "short_drama" : "short_drama";
    var typeSel = document.getElementById("wc-f-type");
    var typeRo = document.getElementById("wc-f-type-ro");
    typeSel.hidden = !!s;
    typeRo.hidden = !s;
    if (s) typeRo.textContent = D.SITE_TYPES[type] || type;
    else typeSel.value = type;
    F.fillTargets(type, s ? s.targets : []);
    document.getElementById("wc-f-status-row").hidden = !s;
    if (s) document.getElementById("wc-f-status-text").textContent = R.statusLabel(s.status);
  }

  function open(id, mode, sites, done) {
    sitesRef = sites;
    onDone = done;
    editingId = id;
    var s = id ? sites.find(function (x) { return x.id === id; }) : null;
    modalMode = mode || (s ? "view" : "create");
    var st = s ? s.status : "";
    var titles = { create: "添加网站", view: "网站采集详情", edit: "编辑网站采集配置" };
    var hints = {
      create: "创建后进入「接入中」；完成→生效中，失败→无法接入。",
      view: "只读展示。点「编辑」进入编辑态；启动/暂停在卡片上操作。",
      edit: "类型不可改。保存编辑后写回配置；删除将移除本站配置。"
    };
    if (modalMode === "view" && st === "connecting") hints.view = "接入中不可改配置。";
    if (modalMode === "view" && st === "failed") {
      hints.view = "无法接入：可编辑后重新提交，再次进入接入中。";
    }
    if (modalMode === "edit" && st === "failed") {
      hints.edit = "修改后点「重新提交」，状态回到接入中，等待 Admin 再次接入。";
    }
    document.getElementById("wc-site-modal-title").textContent = titles[modalMode];
    document.getElementById("wc-site-modal-hint").textContent = hints[modalMode];
    fillForm(s);
    if (modalMode === "create") F.setFormLocked(false, { typeLocked: false });
    else F.setFormLocked(modalMode !== "edit", { typeLocked: true });
    document.getElementById("wc-site-modal-actions").innerHTML = F.siteModalActions(modalMode, st);
    document.getElementById("wc-site-modal").hidden = false;
  }

  function applySave() {
    var cur0 = editingId
      ? sitesRef.find(function (x) {
          return x.id === editingId;
        })
      : null;
    if (cur0 && cur0.status === "connecting") {
      FZShell.toast("接入中不可修改配置", "err");
      return;
    }
    var picks = selectedTargets();
    if (picks.length > D.MAX_BIND) {
      FZShell.toast("一个网站采集配置最多绑定 " + D.MAX_BIND + " 个项目", "err");
      return;
    }
    var typeVal = cur0 ? cur0.type : document.getElementById("wc-f-type").value;
    var allowed = D.PROJECTS[typeVal] || [];
    if (picks.some(function (n) {
      return allowed.indexOf(n) === -1;
    })) {
      FZShell.toast("只能绑定与站点类型一致的项目", "err");
      return;
    }
    var name = document.getElementById("wc-f-name").value.trim();
    var baseUrl = document.getElementById("wc-f-url").value.trim();
    var pages = F.parsePages(document.getElementById("wc-f-pages").value);
    var err = F.validateConfig({
      name: name,
      baseUrl: baseUrl,
      pages: pages,
      sites: sitesRef,
      excludeId: cur0 ? cur0.id : null
    });
    if (err) {
      FZShell.toast(err, "err");
      return;
    }
    var interval = Number(document.getElementById("wc-f-interval").value) || 60;
    var collectOn = document.getElementById("wc-f-collect").checked;
    var dedup = document.getElementById("wc-f-dedup").checked;
    var notes = document.getElementById("wc-f-notes").value.trim();
    if (!cur0) {
      var id = "w" + Date.now().toString(36);
      sitesRef.unshift({
        id: id,
        name: name,
        type: typeVal,
        baseUrl: baseUrl,
        pages: pages,
        status: "connecting",
        collectOn: collectOn,
        dedup: dedup,
        interval: interval,
        nextAt: "—",
        notes: notes,
        targets: picks
      });
      FZShell.toast("已提交申请，状态为「接入中」", "ok");
      document.getElementById("wc-site-modal").hidden = true;
      if (onDone) onDone(sitesRef);
      return;
    }
    cur0.targets = picks;
    cur0.name = name;
    cur0.baseUrl = baseUrl;
    cur0.pages = pages;
    cur0.interval = interval;
    cur0.collectOn = collectOn;
    cur0.dedup = dedup;
    cur0.notes = notes;
    if (cur0.status === "failed") {
      cur0.status = "connecting";
      cur0.nextAt = "—";
      FZShell.toast("已重新提交，状态为「接入中」", "ok");
    } else if (cur0.status === "paused" || cur0.status === "active") {
      cur0.status = "active";
      cur0.nextAt = "待调度";
      FZShell.toast("已保存编辑", "ok");
    } else {
      FZShell.toast("已保存编辑", "ok");
    }
    if (onDone) onDone(sitesRef);
    open(editingId, "view", sitesRef, onDone);
  }

  function bind() {
    document.getElementById("wc-f-type").addEventListener("change", function () {
      if (editingId) return;
      F.fillTargets(this.value, []);
    });
    document.getElementById("wc-f-targets").addEventListener("change", function (e) {
      var input = e.target;
      if (!input || input.type !== "checkbox" || !input.checked) return;
      if (selectedTargets().length > D.MAX_BIND) {
        input.checked = false;
        FZShell.toast("一个网站采集配置最多绑定 " + D.MAX_BIND + " 个项目", "err");
      }
    });
    document.getElementById("wc-site-modal").addEventListener("click", function (e) {
      if (e.target.closest(".field-tip")) {
        e.preventDefault();
        return;
      }
      if (e.target.id === "wc-site-modal" || e.target.id === "wc-site-cancel") {
        document.getElementById("wc-site-modal").hidden = true;
        return;
      }
      if (e.target.id === "wc-site-enter-edit") {
        open(editingId, "edit", sitesRef, onDone);
        return;
      }
      if (e.target.id === "wc-site-save") {
        applySave();
        return;
      }
      if (e.target.id === "wc-site-del") {
        if (!editingId) return;
        if (!confirm("确认删除该配置？历史采集记录将保留。")) return;
        sitesRef = sitesRef.filter(function (x) {
          return x.id !== editingId;
        });
        FZShell.toast("已删除", "ok");
        document.getElementById("wc-site-modal").hidden = true;
        if (onDone) onDone(sitesRef, editingId);
      }
    });
  }

  return { open: open, bind: bind };
})();
