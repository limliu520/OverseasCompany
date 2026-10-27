/* 网站采集 · 弹窗表单辅助 + 现网硬规则校验 */
window.FZWebCollectForm = (function () {
  var D = window.FZWebCollectData;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  /** http/https、末尾斜杠视为同一页面（对齐现网 _page_key） */
  function pageKey(url) {
    try {
      var u = new URL(String(url || "").trim());
      var path = u.pathname.replace(/\/+$/, "") || "/";
      return (u.host + path + (u.search || "")).toLowerCase();
    } catch (e) {
      return String(url || "")
        .trim()
        .replace(/\/+$/, "")
        .toLowerCase();
    }
  }

  function parsePages(raw) {
    return String(raw || "")
      .split(/\n/)
      .map(function (x) {
        return x.trim();
      })
      .filter(Boolean);
  }

  /**
   * @returns {string|null} 错误文案；null=通过
   */
  function validateConfig(opts) {
    var name = (opts.name || "").trim();
    var baseUrl = (opts.baseUrl || "").trim();
    var pages = opts.pages || [];
    var sites = opts.sites || [];
    var excludeId = opts.excludeId || null;
    if (!name || !baseUrl || !pages.length) {
      return "请填写站点名称、主域名和至少一个具体网页链接";
    }
    if (pages.length > D.MAX_PAGES) {
      return "具体网页链接最多 " + D.MAX_PAGES + " 个";
    }
    var seen = {};
    var i;
    for (i = 0; i < pages.length; i++) {
      var key = pageKey(pages[i]);
      if (seen[key]) return "同一配置内不要重复填写相同页面：" + pages[i];
      seen[key] = true;
    }
    for (i = 0; i < sites.length; i++) {
      var other = sites[i];
      if (excludeId && other.id === excludeId) continue;
      var taken = (other.pages || []).filter(function (u) {
        return seen[pageKey(u)];
      });
      if (taken.length) {
        var state = other.status === "paused" ? "，已暂停" : "";
        return (
          "采集页面 " +
          taken[0] +
          " 已在网站采集配置「" +
          other.name +
          "」" +
          state +
          "里，同一页面不能重复配置；要发到更多项目，请编辑那条配置加绑项目"
        );
      }
    }
    return null;
  }

  function fillTargets(type, selectedNames) {
    var list = D.PROJECTS[type] || [];
    var chosen = {};
    (selectedNames || []).forEach(function (n) {
      chosen[n] = true;
    });
    document.getElementById("wc-f-targets-label").textContent =
      "绑定" + (D.SITE_TYPES[type] || type) + "项目（同类型，最多 " + D.MAX_BIND + " 个）";
    var box = document.getElementById("wc-f-targets");
    if (!list.length) {
      box.innerHTML = '<span class="muted" style="font-size:13px">暂无该类型项目</span>';
      return;
    }
    box.innerHTML = list
      .map(function (name) {
        return (
          '<label class="check-inline"><input type="checkbox" value="' +
          esc(name) +
          '"' +
          (chosen[name] ? " checked" : "") +
          " /> " +
          esc(name) +
          "</label>"
        );
      })
      .join("");
  }

  /** mode: create | view | edit */
  function siteModalActions(mode, status) {
    if (mode === "create") {
      return (
        '<button type="button" class="btn" id="wc-site-cancel">关闭</button>' +
        '<button type="button" class="btn btn-primary" id="wc-site-save">提交申请</button>'
      );
    }
    if (mode === "view") {
      var html = '<button type="button" class="btn" id="wc-site-cancel">关闭</button>';
      if (status === "active" || status === "paused" || status === "failed") {
        html += '<button type="button" class="btn btn-primary" id="wc-site-enter-edit">编辑</button>';
      }
      return html;
    }
    var saveLabel = status === "failed" ? "重新提交" : "保存编辑";
    return (
      '<button type="button" class="btn" id="wc-site-cancel">关闭</button>' +
      '<button type="button" class="btn" style="color:var(--danger)" id="wc-site-del">删除</button>' +
      '<button type="button" class="btn btn-primary" id="wc-site-save">' +
      saveLabel +
      "</button>"
    );
  }

  function setFormLocked(locked, opts) {
    opts = opts || {};
    var ids = ["wc-f-name", "wc-f-url", "wc-f-pages", "wc-f-interval", "wc-f-notes", "wc-f-dedup", "wc-f-collect"];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = locked;
    });
    document.querySelectorAll("#wc-f-targets input").forEach(function (el) {
      el.disabled = locked;
    });
    var typeSel = document.getElementById("wc-f-type");
    if (typeSel) typeSel.disabled = locked || !!opts.typeLocked;
  }

  return {
    fillTargets: fillTargets,
    siteModalActions: siteModalActions,
    setFormLocked: setFormLocked,
    parsePages: parsePages,
    validateConfig: validateConfig
  };
})();
