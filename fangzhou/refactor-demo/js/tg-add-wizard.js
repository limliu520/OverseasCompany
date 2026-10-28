/**
 * 添加 Telegram / 采集号向导（对齐现网：快捷登录 | 高级模式）
 * Demo：验证码任填非空即模拟登录成功，不发真实短信。
 */
(function (global) {
  var MASK_ID = "fz-tg-wizard-mask";
  var state = {
    tab: "quick",
    step: 1,
    onSuccess: null,
    label: "",
    phone: "",
    apiId: "",
    apiHash: ""
  };

  function el(id) {
    return document.getElementById(id);
  }

  function toast(msg, type) {
    if (global.FZShell && FZShell.toast) FZShell.toast(msg, type || "err");
    else alert(msg);
  }

  function phoneHint(phone) {
    var p = (phone || "").trim();
    if (!p) return "";
    if (p.length < 8) return p;
    return p.slice(0, 4) + "****" + p.slice(-4);
  }

  /** 字段旁 ? 气泡：解释「是什么 / 从哪来」 */
  function fieldTip(text) {
    var body =
      global.FZShell && global.FZShell.tipHtml
        ? global.FZShell.tipHtml(text)
        : String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/"/g, "&quot;")
            .replace(/；\s*/g, "；<br>")
            .replace(/;\s*/g, ";<br>");
    return (
      '<button type="button" class="field-tip" aria-label="字段说明">' +
      '<span class="field-tip-ico" aria-hidden="true">?</span>' +
      '<span class="field-tip-bubble" role="tooltip">' +
      body +
      "</span></button>"
    );
  }

  var TIP_API_ID =
    "Telegram 应用的 api_id；在 my.telegram.org → API development tools 创建后可见。";
  var TIP_API_HASH =
    "与 API ID 成对的 api_hash；同页获取；请勿泄露。";
  var TIP_PHONE = "须带国家区号，以 + 开头；例：+8613800138000。";
  var TIP_2FA =
    "账号开了两步验证（云密码）时填写；未开启则不会出现本步。";

  function ensureDom() {
    var mask = el(MASK_ID);
    if (mask) return mask;
    mask = document.createElement("div");
    mask.className = "modal-mask";
    mask.id = MASK_ID;
    mask.hidden = true;
    mask.innerHTML =
      '<div class="modal tg-wizard-modal">' +
      '<div class="tg-wiz-head">' +
      '<h2 id="tg-wiz-title">添加 Telegram 账号</h2>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="tg-wiz-x" aria-label="关闭">✕</button>' +
      "</div>" +
      '<div id="tg-wiz-step-1">' +
      '<div class="tg-wiz-tabs" role="tablist">' +
      '<button type="button" class="tg-wiz-tab is-active" role="tab" data-tab="quick" id="tg-tab-quick">快捷登录</button>' +
      '<button type="button" class="tg-wiz-tab" role="tab" data-tab="advanced" id="tg-tab-advanced">高级模式</button>' +
      "</div>" +
      '<div id="tg-wiz-quick">' +
      '<div class="tg-wiz-tip">' +
      '<div class="tg-wiz-tip-title">⚡ 快捷登录</div>' +
      "<div>无需申请 API 凭证，输入手机号 + 验证码即可添加。每个账号登录间隔 <strong>10 分钟</strong>，以防封号或封 IP</div>" +
      "</div>" +
      '<div class="field"><label>账号标签 *</label><input id="tg-wiz-quick-label" type="text" placeholder="如：采集号1、分发号" autocomplete="off" /></div>' +
      '<div class="field"><label>手机号 (国际格式) * ' +
      fieldTip(TIP_PHONE) +
      '</label><input id="tg-wiz-quick-phone" type="text" placeholder="+8613800138000" autocomplete="off" /></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-act="close">取消</button>' +
      '<button type="button" class="btn btn-primary" data-act="quick-send">发送验证码</button>' +
      "</div></div>" +
      '<div id="tg-wiz-advanced" hidden>' +
      '<div class="tg-wiz-steps-copy">' +
      '<p>1. 打开 <a href="https://my.telegram.org" target="_blank" rel="noopener">https://my.telegram.org</a> 获取 API 凭证</p>' +
      "<p>2. 填写下方信息创建新 Userbot 账号</p>" +
      "</div>" +
      '<div class="field"><label>账号标签 *</label><input id="tg-wiz-label" type="text" placeholder="如：主号、副号" autocomplete="off" /></div>' +
      '<div class="field"><label>API ID * ' +
      fieldTip(TIP_API_ID) +
      '</label><input id="tg-wiz-api-id" type="text" inputmode="numeric" placeholder="例如: 12345678" autocomplete="off" /></div>' +
      '<div class="field"><label>API Hash * ' +
      fieldTip(TIP_API_HASH) +
      '</label><input id="tg-wiz-api-hash" type="text" placeholder="例如: abcdef1234567890..." autocomplete="off" /></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-act="close">取消</button>' +
      '<button type="button" class="btn btn-primary" data-act="adv-cred">验证并继续</button>' +
      "</div></div></div>" +
      '<div id="tg-wiz-step-2" hidden>' +
      '<div class="tg-wiz-steps-copy"><p>输入 Telegram 注册手机号，系统将发送验证码。</p></div>' +
      '<div class="field"><label>手机号 (国际格式) * ' +
      fieldTip(TIP_PHONE) +
      '</label><input id="tg-wiz-phone" type="text" placeholder="+8613800138000" autocomplete="off" /></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-act="back-1">上一步</button>' +
      '<button type="button" class="btn btn-primary" data-act="adv-send">发送验证码</button>' +
      "</div></div>" +
      '<div id="tg-wiz-step-3" hidden>' +
      '<div class="tg-wiz-steps-copy" id="tg-wiz-verify-hint"><p>请输入收到的验证码。</p></div>' +
      '<div id="tg-wiz-code-section">' +
      '<div class="field"><label>验证码 *</label><input id="tg-wiz-code" class="tg-wiz-code" type="text" placeholder="12345" maxlength="10" autocomplete="off" /></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" data-act="back-from-code">返回</button>' +
      '<button type="button" class="btn btn-primary" data-act="verify">验证登录</button>' +
      "</div></div>" +
      '<div id="tg-wiz-2fa-section" hidden>' +
      '<div class="field"><label>两步验证密码 * ' +
      fieldTip(TIP_2FA) +
      '</label><input id="tg-wiz-2fa" type="password" placeholder="输入两步验证密码" autocomplete="off" /></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-primary" data-act="verify-2fa">验证密码</button>' +
      "</div></div></div>" +
      '<div id="tg-wiz-step-4" hidden>' +
      '<div class="tg-wiz-done">' +
      '<div class="tg-wiz-done-ico">✓</div>' +
      '<div class="tg-wiz-done-title">账号添加成功</div>' +
      '<div class="tg-wiz-done-info" id="tg-wiz-done-info"></div>' +
      "</div>" +
      '<div class="modal-actions" style="justify-content:center">' +
      '<button type="button" class="btn btn-primary" data-act="finish">完成</button>' +
      "</div></div></div>";
    document.body.appendChild(mask);
    bind(mask);
    return mask;
  }

  function showStep(n) {
    closeFieldTips();
    state.step = n;
    [1, 2, 3, 4].forEach(function (i) {
      var node = el("tg-wiz-step-" + i);
      if (node) node.hidden = i !== n;
    });
  }

  function switchTab(tab) {
    closeFieldTips();
    state.tab = tab === "advanced" ? "advanced" : "quick";
    var q = el("tg-tab-quick");
    var a = el("tg-tab-advanced");
    if (q) q.classList.toggle("is-active", state.tab === "quick");
    if (a) a.classList.toggle("is-active", state.tab === "advanced");
    var quick = el("tg-wiz-quick");
    var adv = el("tg-wiz-advanced");
    if (quick) quick.hidden = state.tab !== "quick";
    if (adv) adv.hidden = state.tab !== "advanced";
  }

  function resetFields() {
    [
      "tg-wiz-quick-label",
      "tg-wiz-quick-phone",
      "tg-wiz-label",
      "tg-wiz-api-id",
      "tg-wiz-api-hash",
      "tg-wiz-phone",
      "tg-wiz-code",
      "tg-wiz-2fa"
    ].forEach(function (id) {
      var n = el(id);
      if (n) n.value = "";
    });
    var sec2fa = el("tg-wiz-2fa-section");
    var secCode = el("tg-wiz-code-section");
    if (sec2fa) sec2fa.hidden = true;
    if (secCode) secCode.hidden = false;
    var hint = el("tg-wiz-verify-hint");
    if (hint) hint.innerHTML = "<p>请输入收到的验证码。</p>";
  }

  function close() {
    var mask = el(MASK_ID);
    if (mask) mask.hidden = true;
    state.onSuccess = null;
  }

  function finishSuccess() {
    var bot = {
      id: global.FZStore ? FZStore.uid("bot") : "bot_" + Date.now(),
      name: state.label,
      phoneHint: phoneHint(state.phone),
      channelCount: 0,
      loginMode: state.tab
    };
    var info = el("tg-wiz-done-info");
    if (info) {
      info.textContent =
        state.label + (state.phone ? " · " + phoneHint(state.phone) : "");
    }
    showStep(4);
    state._pendingBot = bot;
  }

  function closeFieldTips(except) {
    var mask = el(MASK_ID);
    if (!mask) return;
    mask.querySelectorAll(".field-tip.is-open").forEach(function (node) {
      if (node !== except) node.classList.remove("is-open");
    });
  }

  function bind(mask) {
    mask.addEventListener("click", function (e) {
      if (e.target === mask) {
        closeFieldTips();
        close();
        return;
      }
      var tipBtn = e.target.closest(".field-tip");
      if (tipBtn && mask.contains(tipBtn)) {
        e.preventDefault();
        e.stopPropagation();
        var open = tipBtn.classList.contains("is-open");
        closeFieldTips();
        if (!open) tipBtn.classList.add("is-open");
        return;
      }
      closeFieldTips();
    });
    mask.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeFieldTips();
    });
    mask.addEventListener("click", function (e) {
      var t = e.target.closest("[data-tab], [data-act], #tg-wiz-x");
      if (!t) return;
      if (t.id === "tg-wiz-x" || t.getAttribute("data-act") === "close") {
        close();
        return;
      }
      var tab = t.getAttribute("data-tab");
      if (tab) {
        switchTab(tab);
        return;
      }
      var act = t.getAttribute("data-act");
      if (act === "quick-send") {
        var label = (el("tg-wiz-quick-label").value || "").trim();
        var phone = (el("tg-wiz-quick-phone").value || "").trim();
        if (!label || !phone) {
          toast("请填写账号标签和手机号");
          return;
        }
        state.label = label;
        state.phone = phone;
        showStep(3);
        return;
      }
      if (act === "adv-cred") {
        var lab = (el("tg-wiz-label").value || "").trim();
        var apiId = (el("tg-wiz-api-id").value || "").trim();
        var apiHash = (el("tg-wiz-api-hash").value || "").trim();
        if (!lab || !apiId || !apiHash) {
          toast("请填写账号标签、API ID 与 API Hash");
          return;
        }
        state.label = lab;
        state.apiId = apiId;
        state.apiHash = apiHash;
        showStep(2);
        return;
      }
      if (act === "back-1") {
        showStep(1);
        switchTab("advanced");
        return;
      }
      if (act === "adv-send") {
        var ph = (el("tg-wiz-phone").value || "").trim();
        if (!ph) {
          toast("请填写手机号");
          return;
        }
        state.phone = ph;
        showStep(3);
        return;
      }
      if (act === "back-from-code") {
        if (state.tab === "quick") {
          showStep(1);
          switchTab("quick");
        } else {
          showStep(2);
        }
        return;
      }
      if (act === "verify") {
        var code = (el("tg-wiz-code").value || "").trim();
        if (!code) {
          toast("请输入验证码");
          return;
        }
        /* Demo：模拟登录成功（现网此处可能再进两步验证） */
        finishSuccess();
        return;
      }
      if (act === "verify-2fa") {
        var pwd = (el("tg-wiz-2fa").value || "").trim();
        if (!pwd) {
          toast("请输入两步验证密码");
          return;
        }
        finishSuccess();
        return;
      }
      if (act === "finish") {
        var cb = state.onSuccess;
        var bot = state._pendingBot;
        close();
        if (cb && bot) cb(bot);
      }
    });
  }

  function open(opts) {
    opts = opts || {};
    ensureDom();
    state.onSuccess = typeof opts.onSuccess === "function" ? opts.onSuccess : null;
    state._pendingBot = null;
    state.label = "";
    state.phone = "";
    state.apiId = "";
    state.apiHash = "";
    resetFields();
    switchTab("quick");
    showStep(1);
    var title = el("tg-wiz-title");
    if (title) title.textContent = opts.title || "添加 Telegram 账号";
    el(MASK_ID).hidden = false;
    var focus = el("tg-wiz-quick-label");
    if (focus) setTimeout(function () { focus.focus(); }, 30);
  }

  global.FZTgWizard = { open: open, close: close };
})(window);
