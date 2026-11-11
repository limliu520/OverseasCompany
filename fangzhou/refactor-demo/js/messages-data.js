/* 消息中心：产品 / 系统自动提醒（与 Admin 公告分开）
 * 右上角弹窗：仅手动关闭或被更新消息顶掉，不自动消失。
 */
(function (global) {
  var LIST = [
    {
      id: "m1",
      category: "collect",
      kind: "采集",
      level: "ok",
      title: "网站采集完成",
      time: "2026-11-10 16:58",
      body: "网站「示例短剧站 A」本轮采集完成，新增 12 条素材进入待审核。",
      href: "./materials.html"
    },
    {
      id: "m2",
      category: "transfer",
      kind: "转编辑",
      level: "ok",
      title: "素材已转编辑",
      time: "2026-11-10 16:42",
      body: "「公共池可再转 · 每日大赛已占用」已转入项目「每日大赛」，可去文章列表继续编辑。",
      href: "./articles.html"
    },
    {
      id: "m3",
      category: "push",
      kind: "推送",
      level: "ok",
      title: "文章推送成功",
      time: "2026-11-10 14:05",
      body: "「文案称「教父」有人来了…」已推送到项目内容通道。",
      href: "./articles.html"
    },
    {
      id: "m4",
      category: "article",
      kind: "文章",
      level: "ok",
      title: "媒体处理完成",
      time: "2026-11-09 19:22",
      body: "稿件 #A1024 媒体处理完成，状态已变为「待编辑」。",
      href: "./articles.html"
    },
    {
      id: "m5",
      category: "collect",
      kind: "采集",
      level: "warn",
      title: "TG 采集已停止",
      time: "2026-11-09 11:08",
      body: "采集号「晚风号」已停止采集；会话默认保留，可随时再开。",
      href: "./tg-collect.html"
    },
    {
      id: "m6",
      category: "channel_anomaly",
      kind: "频道异常",
      level: "danger",
      title: "发现频道异常",
      time: "2026-11-10 16:51",
      body: "公共池源频道「影视速递」体检失败：not a member。请确认采集号仍在频道内。",
      href: "./tg-collect.html"
    },
    {
      id: "m7",
      category: "tg_anomaly",
      kind: "TG 异常",
      level: "danger",
      title: "采集号异常",
      time: "2026-11-10 15:40",
      body: "采集号「晚风号」当前状态：已断开。相关采集与路由已暂停，请重新连接。",
      href: "./tg-collect.html"
    },
    {
      id: "m8",
      category: "push",
      kind: "推送",
      level: "danger",
      title: "文章推送失败",
      time: "2026-11-10 13:12",
      body: "「短剧精选周报」推送失败：对方接口超时。可在文章列表重试。",
      href: "./articles.html"
    },
    {
      id: "m9",
      category: "collect",
      kind: "采集",
      level: "ok",
      title: "TG 采集完成",
      time: "2026-11-08 21:06",
      body: "频道「影视速递」本轮入库 8 条素材，已进入公共池待审。",
      href: "./materials.html"
    },
    {
      id: "m10",
      category: "transfer",
      kind: "转编辑",
      level: "ok",
      title: "素材已转编辑",
      time: "2026-11-08 18:33",
      body: "「周末档预告合集」已转入项目「海外长视频」，媒体处理中。",
      href: "./articles.html"
    },
    {
      id: "m11",
      category: "connect",
      kind: "对接",
      level: "ok",
      title: "内容通道已接通",
      time: "2026-11-08 11:20",
      body: "项目「每日大赛」内容通道已接通，自动流与推送规则开始生效。",
      href: "./home.html"
    },
    {
      id: "m12",
      category: "channel_anomaly",
      kind: "频道异常",
      level: "warn",
      title: "分发频道体检未知",
      time: "2026-11-07 16:45",
      body: "项目「海外长视频」分发频道「速递分发」健康状态 UNKNOWN，请稍后复查。",
      href: "./tg-collect.html"
    },
    {
      id: "m13",
      category: "article",
      kind: "文章",
      level: "ok",
      title: "媒体处理完成",
      time: "2026-11-07 09:12",
      body: "稿件 #A0988 媒体处理完成，状态已变为「待编辑」。",
      href: "./articles.html"
    },
    {
      id: "m14",
      category: "push",
      kind: "推送",
      level: "ok",
      title: "文章推送成功",
      time: "2026-11-06 20:01",
      body: "「十一月片单精选」已推送到项目内容通道。",
      href: "./articles.html"
    },
    {
      id: "m15",
      category: "collect",
      kind: "采集",
      level: "danger",
      title: "网站采集失败",
      time: "2026-11-06 14:28",
      body: "网站「示例资讯站 B」本轮采集失败：列表页超时。可在网站采集重试。",
      href: "./website-collect.html"
    },
    {
      id: "m16",
      category: "tg_anomaly",
      kind: "TG 异常",
      level: "warn",
      title: "采集号短暂受限",
      time: "2026-11-05 22:17",
      body: "采集号「晨星号」触发限流，已自动降速；约 30 分钟后恢复常态。",
      href: "./tg-collect.html"
    },
    {
      id: "m17",
      category: "collect",
      kind: "采集",
      level: "ok",
      title: "网站采集完成",
      time: "2026-11-05 10:04",
      body: "网站「示例短剧站 A」本轮采集完成，新增 5 条素材进入待审核。",
      href: "./materials.html"
    },
    {
      id: "m18",
      category: "push",
      kind: "推送",
      level: "danger",
      title: "推送通道异常",
      time: "2026-11-04 19:55",
      body: "项目「每日大赛」内容通道连续回调失败，请检查对接凭证与收件地址。",
      href: "./home.html"
    }
  ];

  var READ_KEY = "fz_msg_read_v1";
  var POPUP_DISMISS_KEY = "fz_msg_popup_dismiss_v1";
  var HOST_ID = "fz-msg-popup-host";

  function accountKey() {
    try {
      var s = global.FZStore && FZStore.read && FZStore.read();
      return String((s && (s.accountId || s.username || s.displayName)) || "demo");
    } catch (e) {
      return "demo";
    }
  }

  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      var all = raw ? JSON.parse(raw) : {};
      return all && typeof all === "object" ? all : {};
    } catch (e) {
      return {};
    }
  }

  function writeJson(key, map) {
    try {
      localStorage.setItem(key, JSON.stringify(map || {}));
    } catch (e) {}
  }

  function readIds() {
    var list = readJson(READ_KEY)[accountKey()];
    return Array.isArray(list) ? list.slice() : [];
  }

  function isRead(id) {
    return readIds().indexOf(String(id)) >= 0;
  }

  function markRead(id) {
    if (!id) return;
    var map = readJson(READ_KEY);
    var key = accountKey();
    var list = Array.isArray(map[key]) ? map[key].slice() : [];
    if (list.indexOf(String(id)) < 0) {
      list.push(String(id));
      map[key] = list;
      writeJson(READ_KEY, map);
    }
  }

  /** 一键清空未读；同时压住右上角弹窗（按当前最新时间抬 ceiling） */
  function markAllRead() {
    var map = readJson(READ_KEY);
    var key = accountKey();
    var list = Array.isArray(map[key]) ? map[key].slice() : [];
    var newest = "";
    LIST.forEach(function (m) {
      if (!m || !m.id) return;
      if (list.indexOf(String(m.id)) < 0) list.push(String(m.id));
      if (String(m.time || "") > newest) newest = String(m.time || "");
    });
    map[key] = list;
    writeJson(READ_KEY, map);
    if (newest) {
      var st = popupState();
      if (newest > st.ceiling) st.ceiling = newest;
      LIST.forEach(function (m) {
        if (m && m.id && st.ids.indexOf(String(m.id)) < 0) st.ids.push(String(m.id));
      });
      writePopupState(st);
    }
  }

  /** 点进消息：标已读 + 收起该条弹窗，返回跳转地址 */
  function openMessage(id) {
    var m = byId(id);
    if (!m) return "./messages.html";
    markRead(m.id);
    markPopupDismissed(m.id, m.time);
    return m.href || "./home.html";
  }

  function popupState() {
    var raw = readJson(POPUP_DISMISS_KEY)[accountKey()];
    if (Array.isArray(raw)) {
      return { ids: raw.slice(), ceiling: "" };
    }
    if (raw && typeof raw === "object") {
      return {
        ids: Array.isArray(raw.ids) ? raw.ids.slice() : [],
        ceiling: String(raw.ceiling || "")
      };
    }
    return { ids: [], ceiling: "" };
  }

  function writePopupState(st) {
    var map = readJson(POPUP_DISMISS_KEY);
    map[accountKey()] = {
      ids: (st && st.ids) || [],
      ceiling: (st && st.ceiling) || ""
    };
    writeJson(POPUP_DISMISS_KEY, map);
  }

  function markPopupDismissed(id, time) {
    if (!id) return;
    var st = popupState();
    if (st.ids.indexOf(String(id)) < 0) st.ids.push(String(id));
    /* 关闭后不连环弹出更早未读；只有比 ceiling 更新的消息才再弹 */
    if (time && String(time) > st.ceiling) st.ceiling = String(time);
    writePopupState(st);
  }

  function enrich(m) {
    if (!m) return null;
    return Object.assign({}, m, { unread: !isRead(m.id) });
  }

  function sortedList() {
    return LIST.slice().sort(function (a, b) {
      return String(b.time || "").localeCompare(String(a.time || ""));
    });
  }

  function all() {
    return sortedList().map(enrich);
  }

  function unreadCount() {
    return all().filter(function (m) {
      return m.unread;
    }).length;
  }

  function byId(id) {
    var hit = LIST.find(function (m) {
      return m.id === id;
    });
    return enrich(hit);
  }

  function nextPopupMessage() {
    var st = popupState();
    var items = all();
    for (var i = 0; i < items.length; i++) {
      var m = items[i];
      if (!m.unread) continue;
      if (st.ids.indexOf(String(m.id)) >= 0) continue;
      if (st.ceiling && String(m.time || "") <= st.ceiling) continue;
      return m;
    }
    return null;
  }

  var _shownId = null;

  function ensureHost() {
    var host = document.getElementById(HOST_ID);
    if (host) return host;
    host = document.createElement("div");
    host.id = HOST_ID;
    host.className = "fz-msg-popup-host";
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
    host.addEventListener("click", function (e) {
      var closeBtn = e.target.closest("[data-msg-popup-close]");
      if (closeBtn) {
        e.preventDefault();
        dismissPopup();
        return;
      }
      var openBtn = e.target.closest("[data-msg-popup-open]");
      if (openBtn) {
        var href = openBtn.getAttribute("href") || "./messages.html";
        if (_shownId) {
          var cur = byId(_shownId);
          markRead(_shownId);
          markPopupDismissed(_shownId, cur && cur.time);
        }
        location.href = href;
      }
    });
    return host;
  }

  function levelClass(level) {
    if (level === "danger") return " is-danger";
    if (level === "warn") return " is-warn";
    if (level === "ok") return " is-ok";
    return "";
  }

  function renderPopup(m) {
    var host = ensureHost();
    if (!m) {
      host.innerHTML = "";
      host.hidden = true;
      _shownId = null;
      return;
    }
    _shownId = m.id;
    host.hidden = false;
    var href = m.href || "./messages.html";
    host.innerHTML =
      '<div class="fz-msg-popup' +
      levelClass(m.level) +
      '" role="status">' +
      '<div class="fz-msg-popup-hd">' +
      '<span class="fz-msg-popup-kind">' +
      esc(m.kind || "消息") +
      "</span>" +
      '<button type="button" class="fz-msg-popup-x" data-msg-popup-close aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="fz-msg-popup-title">' +
      esc(m.title) +
      "</div>" +
      '<p class="fz-msg-popup-body">' +
      esc(m.body) +
      "</p>" +
      '<div class="fz-msg-popup-ft">' +
      '<span class="fz-msg-popup-time">' +
      esc(m.time) +
      "</span>" +
      '<a class="fz-msg-popup-link" data-msg-popup-open href="' +
      esc(href) +
      '">查看</a>' +
      "</div></div>";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  /** 展示当前应弹出的最新未读；不自动消失 */
  function syncPopup() {
    renderPopup(nextPopupMessage());
  }

  /** 手动关闭当前条；不标已读；不连环弹更早未读，等真正的新消息再出 */
  function dismissPopup() {
    if (_shownId) {
      var cur = byId(_shownId);
      markPopupDismissed(_shownId, cur && cur.time);
    }
    renderPopup(null);
  }

  /**
   * 新消息到达：写入列表头部并立刻顶掉当前弹窗。
   * Demo 可调：FZMessages.pushDemo({ title, body, kind, level, href })
   */
  function pushMessage(partial) {
    var id =
      (partial && partial.id) ||
      "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var item = Object.assign(
      {
        id: id,
        category: "system",
        kind: "消息",
        level: "ok",
        title: "新消息",
        time: formatNow(),
        body: "",
        href: "./messages.html"
      },
      partial || {},
      { id: id }
    );
    LIST.unshift(item);
    /* 新消息顶掉：清掉当前展示，强制出新条 */
    _shownId = null;
    renderPopup(enrich(item));
    return enrich(item);
  }

  function formatNow() {
    var d = new Date();
    function p(n) {
      return n < 10 ? "0" + n : String(n);
    }
    return (
      d.getFullYear() +
      "-" +
      p(d.getMonth() + 1) +
      "-" +
      p(d.getDate()) +
      " " +
      p(d.getHours()) +
      ":" +
      p(d.getMinutes())
    );
  }

  function pushDemo(partial) {
    return pushMessage(partial);
  }

  function mountPopup() {
    if (document.documentElement.getAttribute("data-fz-msg-popup") === "1") {
      syncPopup();
      return;
    }
    document.documentElement.setAttribute("data-fz-msg-popup", "1");
    syncPopup();
  }

  global.FZMessages = {
    all: all,
    byId: byId,
    markRead: markRead,
    markAllRead: function () {
      markAllRead();
      syncPopup();
      return unreadCount();
    },
    openMessage: function (id) {
      var href = openMessage(id);
      syncPopup();
      return href;
    },
    isRead: isRead,
    unreadCount: unreadCount,
    syncPopup: syncPopup,
    dismissPopup: dismissPopup,
    mountPopup: mountPopup,
    pushMessage: pushMessage,
    pushDemo: pushDemo
  };
})(typeof window !== "undefined" ? window : this);
