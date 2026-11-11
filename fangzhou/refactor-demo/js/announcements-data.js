/* 平台公告（Admin 配置；工作台摘要 / 列表 / 详情共用） */
(function (global) {
  var LIST = [
    {
      id: "an1",
      title: "系统维护通知",
      time: "2026-10-28",
      important: true,
      body: "10-30 02:00–04:00 计划维护，推送可能延迟。",
      content:
        "计划于 2026-10-30 02:00–04:00（UTC+8）进行系统维护。维护期间推送、对接回调可能延迟或短暂不可用；采集与审核一般不受影响。\n\n维护结束后无需额外操作，未完成推送会自动重试。如超时仍未恢复，请通过右下角帮助中心反馈。"
    },
    {
      id: "an2",
      title: "重构 Demo 能力更新",
      time: "2026-10-29",
      important: true,
      body: "工作台：新手教程、数据概览、状态异常、平台公告与消息中心。",
      content:
        "本轮 Demo 工作台已对齐信息架构：新手教程、数据概览、状态与异常提醒、平台公告摘要；右上角进入消息中心。反馈请走帮助中心「反馈」Tab（整页截图 / 点选位置），不在工作台挂反馈待办。\n\n侧栏仅保留列表入口；新建等动作在页内完成。"
    },
    {
      id: "an3",
      title: "采集异常排查指引",
      time: "2026-10-25",
      important: false,
      body: "频道 not a member / 体检超时请先查号是否仍在频道内。",
      content:
        "TG 路由出现「not a member」或体检超时，请先确认采集号 / 分发号仍在对应源、目标频道内，且未受限。\n\n仍异常时：在「TG 采集」查看路由健康状态，必要时换号或重新绑定频道。工作台「状态与异常提醒」会汇总相关条目。"
    },
    {
      id: "an4",
      title: "内容通道对接说明",
      time: "2026-10-20",
      important: false,
      body: "一个项目一套文章内容通道；推送时带上子账号 CMS 标识。",
      content:
        "方舟侧一个业务项目对应一套文章内容通道，不做多 CMS 账号分发。对接时请配置接口与凭证；推送时携带对方后台复制的子账号 CMS 标识，由接收方判断内容归属。\n\n待接通项目可在「项目管理」列表点「对接」进入对接页。"
    },
    {
      id: "an5",
      title: "安全登录与二次验证",
      time: "2026-10-18",
      important: false,
      body: "新号首次登录需绑定 TOTP；已有号使用密码 + 6 位验证码。",
      content:
        "演示环境：新号走密码 → TOTP 扫码绑定；已有演示角色走密码 + 6 位验证码。角色仅在登录页选择，会话内不切换。\n\n正式环境以现网账号与安全策略为准，本公告仅说明 Demo 口径。"
    }
  ];

  var READ_KEY = "fz_ann_read_v1";

  function accountKey() {
    try {
      var s = global.FZStore && FZStore.read && FZStore.read();
      return String((s && (s.accountId || s.username || s.displayName)) || "demo");
    } catch (e) {
      return "demo";
    }
  }

  function readMap() {
    try {
      var raw = localStorage.getItem(READ_KEY);
      var all = raw ? JSON.parse(raw) : {};
      return all && typeof all === "object" ? all : {};
    } catch (e) {
      return {};
    }
  }

  function writeMap(map) {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(map || {}));
    } catch (e) {}
  }

  function readIds() {
    var map = readMap();
    var list = map[accountKey()];
    return Array.isArray(list) ? list.slice() : [];
  }

  function isRead(id) {
    return readIds().indexOf(String(id)) >= 0;
  }

  function markRead(id) {
    if (!id) return;
    var map = readMap();
    var key = accountKey();
    var list = Array.isArray(map[key]) ? map[key].slice() : [];
    if (list.indexOf(String(id)) < 0) {
      list.push(String(id));
      map[key] = list;
      writeMap(map);
    }
  }

  function enrich(a) {
    if (!a) return null;
    return Object.assign({}, a, {
      important: !!a.important,
      unread: !isRead(a.id)
    });
  }

  function all() {
    return LIST.map(enrich);
  }

  function byId(id) {
    var hit = LIST.find(function (a) {
      return a.id === id;
    });
    return enrich(hit);
  }

  function importantTag(a) {
    return a && a.important
      ? '<span class="ann-tag ann-tag--important">重要</span>'
      : "";
  }

  function unreadDot(a) {
    return a && a.unread
      ? '<span class="wb-an-dot" title="未读" aria-label="未读"></span>'
      : "";
  }

  global.FZAnnouncements = {
    all: all,
    byId: byId,
    markRead: markRead,
    isRead: isRead,
    importantTag: importantTag,
    unreadDot: unreadDot
  };
})(typeof window !== "undefined" ? window : this);
