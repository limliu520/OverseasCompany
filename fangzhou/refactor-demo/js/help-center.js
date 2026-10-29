/* 右下角帮助中心 · FAQ + 对话；快速反馈为二级 */
(function (global) {
  var FAQ = [
    {
      q: "如何创建第一个项目？",
      a: "在「项目管理」点新建，或走工作台入驻待办。配齐信息后创建，再交给开发对接通道。",
      href: "pages/project-setup.html?new=1",
      need: "projects.list.create"
    },
    {
      q: "内容通道如何接通？",
      a: "项目配齐后进入「对接」页查看凭证。正式环境可由系统或对方首次合法调用变已接通；Demo 可点「模拟接通」。",
      href: "pages/projects.html",
      need: "projects.list.view"
    },
    {
      q: "素材待审核去哪处理？",
      a: "采集中心 → 素材管理 →「待我审核」视图。也可从工作台业务待办深链进入。",
      href: "pages/materials.html",
      need: "collect.materials.view"
    },
    {
      q: "文章推送前怎么改？",
      a: "内容中心 → 文章管理打开稿件，改正文/封面后保存，再确认推送。",
      href: "pages/articles.html",
      need: "content.article.view"
    },
    {
      q: "采集号掉线怎么办？",
      a: "到「TG 采集」检查连接与监听；工作台「状态提醒」也会列出异常项。",
      href: "pages/tg-collect.html",
      need: "collect.tg.view"
    }
  ];

  function esc(s) {
    return global.FZShell ? FZShell.escHtml(s) : String(s || "");
  }

  function base() {
    return (global.FZShell && FZShell.BASE) || "./";
  }

  function can(need) {
    var s = FZStore.read();
    return FZStore.hasFeature(s, need);
  }

  function mount() {
    if (document.getElementById("fz-help-root")) return;
    var root = document.createElement("div");
    root.id = "fz-help-root";
    root.innerHTML =
      '<button type="button" class="fz-help-fab" id="fz-help-fab" aria-label="帮助与反馈">帮助与反馈</button>' +
      '<div class="fz-help-mask" id="fz-help-mask" hidden>' +
      '<div class="fz-help-panel" role="dialog" aria-labelledby="fz-help-title">' +
      '<div class="fz-help-head">' +
      '<button type="button" class="btn btn-ghost fz-help-back" id="fz-help-back" hidden>返回帮助</button>' +
      '<strong id="fz-help-title">帮助中心</strong>' +
      '<button type="button" class="btn btn-ghost" id="fz-help-to-fb">快速反馈</button>' +
      '<button type="button" class="fz-help-x" id="fz-help-close" aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="fz-help-body" id="fz-help-home">' +
      '<p class="muted fz-help-lead">常见问题（后续由 Admin 维护问答库）</p>' +
      '<div class="fz-help-faq" id="fz-help-faq"></div>' +
      '<div class="fz-help-chat" id="fz-help-chat"></div>' +
      '<form class="fz-help-compose" id="fz-help-form">' +
      '<input id="fz-help-input" placeholder="输入问题，例如：如何接通通道？" autocomplete="off" />' +
      '<button type="submit" class="btn btn-primary">发送</button></form></div>' +
      '<div class="fz-help-body" id="fz-help-fb" hidden>' +
      '<p class="muted fz-help-lead">提交后会出现在工作台「工单跟进」；Admin 侧可查看（Demo 本地保存）。</p>' +
      '<div class="field"><label>反馈说明</label>' +
      '<textarea id="fz-fb-text" rows="4" placeholder="描述遇到的问题或建议"></textarea></div>' +
      '<label class="fz-fb-shot"><input type="checkbox" id="fz-fb-shot" checked /> 附带当前页示意截图（Demo 占位）</label>' +
      '<div class="fz-fb-actions">' +
      '<button type="button" class="btn btn-primary" id="fz-fb-submit">提交反馈</button></div></div>' +
      "</div></div>";
    document.body.appendChild(root);

    var mask = document.getElementById("fz-help-mask");
    var home = document.getElementById("fz-help-home");
    var fb = document.getElementById("fz-help-fb");
    var back = document.getElementById("fz-help-back");
    var title = document.getElementById("fz-help-title");
    var chat = document.getElementById("fz-help-chat");
    var faqBox = document.getElementById("fz-help-faq");

    function showHome() {
      home.hidden = false;
      fb.hidden = true;
      back.hidden = true;
      title.textContent = "帮助中心";
      document.getElementById("fz-help-to-fb").hidden = false;
    }
    function showFb() {
      home.hidden = true;
      fb.hidden = false;
      back.hidden = false;
      title.textContent = "快速反馈";
      document.getElementById("fz-help-to-fb").hidden = true;
    }
    function open() {
      showHome();
      mask.hidden = false;
      renderFaq();
    }
    function close() {
      mask.hidden = true;
    }

    function renderFaq() {
      faqBox.innerHTML = FAQ.filter(function (item) {
        return !item.need || can(item.need);
      })
        .map(function (item, i) {
          return (
            '<button type="button" class="fz-help-faq-item" data-faq="' +
            i +
            '">' +
            esc(item.q) +
            "</button>"
          );
        })
        .join("");
      faqBox.querySelectorAll("[data-faq]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var item = FAQ[+btn.getAttribute("data-faq")];
          if (item) answer(item.q, item);
        });
      });
    }

    function bubble(role, html) {
      var el = document.createElement("div");
      el.className = "fz-help-bubble " + role;
      el.innerHTML = html;
      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
    }

    function answer(q, item) {
      bubble("me", esc(q));
      var link = "";
      if (item && item.href && (!item.need || can(item.need))) {
        link =
          ' <a href="' +
          base() +
          item.href +
          '">去处理</a>';
      }
      bubble("bot", esc(item ? item.a : "") + link);
    }

    function matchFaq(text) {
      var t = String(text || "").toLowerCase();
      for (var i = 0; i < FAQ.length; i++) {
        var item = FAQ[i];
        if (item.need && !can(item.need)) continue;
        if (t.indexOf("项目") !== -1 && item.q.indexOf("项目") !== -1) return item;
        if (t.indexOf("接通") !== -1 || t.indexOf("通道") !== -1) {
          if (item.q.indexOf("接通") !== -1) return item;
        }
        if (t.indexOf("素材") !== -1 && item.q.indexOf("素材") !== -1) return item;
        if (t.indexOf("文章") !== -1 || t.indexOf("推送") !== -1) {
          if (item.q.indexOf("文章") !== -1) return item;
        }
        if ((t.indexOf("采集") !== -1 || t.indexOf("掉线") !== -1) && item.q.indexOf("采集") !== -1)
          return item;
      }
      return null;
    }

    document.getElementById("fz-help-fab").addEventListener("click", open);
    document.getElementById("fz-help-close").addEventListener("click", close);
    mask.addEventListener("click", function (e) {
      if (e.target === mask) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mask.hidden) close();
    });
    document.getElementById("fz-help-to-fb").addEventListener("click", showFb);
    back.addEventListener("click", showHome);

    document.getElementById("fz-help-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("fz-help-input");
      var text = (input.value || "").trim();
      if (!text) return;
      input.value = "";
      var hit = matchFaq(text);
      if (hit) answer(text, hit);
      else {
        bubble("me", esc(text));
        bubble(
          "bot",
          "暂时没有匹配到现成说明。可点右上角「快速反馈」提交问题，我们会在工作台工单里跟进。"
        );
      }
    });

    var submitting = false;
    document.getElementById("fz-fb-submit").addEventListener("click", function () {
      if (submitting) return;
      var text = (document.getElementById("fz-fb-text").value || "").trim();
      if (!text) {
        FZShell.toast("请填写反馈内容", "err");
        return;
      }
      submitting = true;
      var shot = document.getElementById("fz-fb-shot").checked;
      var s = FZStore.read();
      FZStore.addTicket(s, {
        id: FZStore.uid("tk"),
        text: text,
        withShot: shot,
        status: "pending",
        page: location.pathname.split("/").pop() || "",
        at: Date.now(),
        by: s.displayName || s.username
      });
      FZStore.write(s);
      document.getElementById("fz-fb-text").value = "";
      FZShell.toast("已提交反馈", "ok");
      submitting = false;
      showHome();
      close();
      if (typeof global.FZHomeRefreshTickets === "function") {
        global.FZHomeRefreshTickets();
      }
    });
  }

  global.FZHelpCenter = { mount: mount };
})(window);
