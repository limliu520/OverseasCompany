/* 当前登录人：修改密码、个人资料、重置自己的谷歌验证 */
(function (global) {
  var pwdMask = null;
  var profileMask = null;

  function session() {
    return global.FZStore.read();
  }

  function currentSub(s) {
    if (!s || s.accountKind !== "sub") return null;
    return (s.subs || []).filter(function (u) {
      return u.id === s.accountId;
    })[0] || null;
  }

  function currentPassword(s) {
    var sub = currentSub(s);
    if (sub) return sub.password || "demo1234";
    var map = s.accountPasswords || {};
    return map[s.accountId] || "demo1234";
  }

  function esc(s) {
    return global.FZShell.escHtml(s);
  }

  function field(label, inner) {
    return '<div class="field"><label>' + label + "</label>" + inner + "</div>";
  }

  function ensurePwd() {
    if (pwdMask) return pwdMask;
    pwdMask = document.createElement("div");
    pwdMask.className = "modal-mask";
    pwdMask.id = "acct-pwd-modal";
    pwdMask.hidden = true;
    pwdMask.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="acct-pwd-title">' +
      '<h2 id="acct-pwd-title">修改密码</h2>' +
      '<p class="hint" style="margin-top:0">修改的是当前登录账号的密码。完成后请用新密码登录。</p>' +
      field("当前密码 *", '<input id="acct-pwd-old" type="password" autocomplete="current-password" />') +
      field("新密码 *", '<input id="acct-pwd-new" type="password" autocomplete="new-password" placeholder="至少 8 位" />') +
      field("确认新密码 *", '<input id="acct-pwd-confirm" type="password" autocomplete="new-password" />') +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="acct-pwd-cancel">取消</button>' +
      '<button type="button" class="btn btn-primary" id="acct-pwd-ok">保存</button>' +
      "</div></div>";
    document.body.appendChild(pwdMask);
    pwdMask.querySelector("#acct-pwd-cancel").addEventListener("click", closePwd);
    pwdMask.addEventListener("click", function (e) {
      if (e.target === pwdMask) closePwd();
    });
    pwdMask.querySelector("#acct-pwd-ok").addEventListener("click", savePassword);
    return pwdMask;
  }

  function closePwd() {
    if (pwdMask) pwdMask.hidden = true;
  }

  function savePassword() {
    var oldPass = document.getElementById("acct-pwd-old").value;
    var next = document.getElementById("acct-pwd-new").value;
    var again = document.getElementById("acct-pwd-confirm").value;
    var s = session();
    if (oldPass !== currentPassword(s)) {
      global.FZShell.toast("当前密码不正确", "err");
      return;
    }
    if (!next || next.length < 8) {
      global.FZShell.toast("新密码至少 8 位", "err");
      return;
    }
    if (next !== again) {
      global.FZShell.toast("两次输入的新密码不一致", "err");
      return;
    }
    if (next === oldPass) {
      global.FZShell.toast("新密码不能与当前密码相同", "err");
      return;
    }
    var sub = currentSub(s);
    if (sub) sub.password = next;
    else {
      s.accountPasswords = s.accountPasswords || {};
      s.accountPasswords[s.accountId] = next;
    }
    global.FZStore.write(s);
    closePwd();
    global.FZShell.toast("密码已更新，下次请用新密码登录", "ok");
  }

  function ensureProfile() {
    if (profileMask) return profileMask;
    profileMask = document.createElement("div");
    profileMask.className = "modal-mask";
    profileMask.id = "acct-profile-modal";
    profileMask.hidden = true;
    profileMask.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="acct-profile-title">' +
      '<h2 id="acct-profile-title">个人资料</h2>' +
      '<div id="acct-profile-body"></div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="acct-profile-cancel">取消</button>' +
      '<button type="button" class="btn btn-primary" id="acct-profile-ok">保存</button>' +
      "</div></div>";
    document.body.appendChild(profileMask);
    profileMask.querySelector("#acct-profile-cancel").addEventListener("click", closeProfile);
    profileMask.addEventListener("click", function (e) {
      if (e.target === profileMask) closeProfile();
    });
    profileMask.querySelector("#acct-profile-ok").addEventListener("click", saveProfile);
    return profileMask;
  }

  function closeProfile() {
    if (profileMask) profileMask.hidden = true;
  }

  function ro(label, value) {
    return field(label, '<div class="muted" style="font-size:13px">' + esc(value) + "</div>");
  }

  function paintProfile() {
    var s = session();
    var sub = currentSub(s);
    var kind = s.accountKind === "sub" ? "子账号" : "主账号";
    var html = ro("登录名", s.username || "—") + ro("账号类型", kind);
    html += field(
      "显示名 *",
      '<input id="acct-name" value="' + esc(s.displayName || "") + '" />'
    );
    var cmsId = sub
      ? sub.cmsId
      : ((s.ownerCmsId || {})[s.accountId] || "");
    html += ro("CMS 标识", cmsId || "未填写");
    var tgPhone = sub
      ? sub.tgPhone
      : ((s.tgPhones || {})[s.accountId] || "");
    html += ro("Telegram", tgPhone || "未填写");
    html +=
      '<div class="field" style="margin-bottom:0">' +
      '<label>谷歌验证</label>' +
      '<p class="hint" style="margin:0 0 8px">重置后须重新扫码绑定，当前会话会进入绑定页。</p>' +
      '<button type="button" class="btn" id="acct-reset-totp">重置我的谷歌验证</button>' +
      "</div>";
    document.getElementById("acct-profile-body").innerHTML = html;
    document.getElementById("acct-reset-totp").addEventListener("click", resetOwnTotp);
  }

  function saveProfile() {
    var name = (document.getElementById("acct-name").value || "").trim();
    if (!name) {
      global.FZShell.toast("请填写显示名", "err");
      return;
    }
    var s = session();
    var sub = currentSub(s);
    s.displayName = name;
    if (sub) sub.displayName = name;
    else {
      s.profileNames = s.profileNames || {};
      s.profileNames[s.accountId] = name;
    }
    global.FZStore.write(s);
    var avatar = document.querySelector("#sidebar-user .avatar");
    var label = document.querySelector("#sidebar-user .user-name");
    if (avatar) avatar.textContent = name.slice(0, 1);
    if (label) label.textContent = name;
    closeProfile();
    global.FZShell.toast("个人资料已保存", "ok");
  }

  function resetOwnTotp() {
    global.FZShell.confirm({
      title: "重置谷歌验证",
      message: "重置后需要重新绑定谷歌验证器。确定后进入绑定页。",
      okText: "重置并绑定",
      danger: true,
      onOk: function () {
        var s = session();
        var sub = currentSub(s);
        if (sub) sub.totpBound = false;
        s.totpBound = false;
        s.totpBindMode = "enroll";
        global.FZStore.write(s);
        location.href = global.FZShell.BASE + "totp.html?mode=enroll";
      }
    });
  }

  function openPassword() {
    ensurePwd();
    document.getElementById("acct-pwd-old").value = "";
    document.getElementById("acct-pwd-new").value = "";
    document.getElementById("acct-pwd-confirm").value = "";
    pwdMask.hidden = false;
    document.getElementById("acct-pwd-old").focus();
  }

  function openProfile() {
    ensureProfile();
    paintProfile();
    profileMask.hidden = false;
    var input = document.getElementById("acct-name");
    if (input) input.focus();
  }

  global.FZAccount = {
    openPassword: openPassword,
    openProfile: openProfile
  };
})(window);
