/* 网站采集 Demo 数据 */
window.FZWebCollectData = {
  INTERVAL: {
    30: "每 30 分钟",
    60: "每 1 小时",
    180: "每 3 小时",
    360: "每 6 小时",
    720: "每 12 小时",
    1440: "每天"
  },
  /*
   * 站点状态（配置级，非单次采集任务）：
   * 创建 → 接入中 →（Admin 完成）生效中
   *                 →（接入失败）无法接入（不可操作）
   * 生效中 ↔ 已暂停；生效/暂停可「重新配置生效」
   * 接入中：不可改配置内容
   */
  STATUS: {
    connecting: { label: "接入中", cls: "badge-info" },
    failed: { label: "无法接入", cls: "badge-danger" },
    active: { label: "生效中", cls: "badge-ok" },
    paused: { label: "已暂停", cls: "badge-warn" }
  },
  /* 站点类型：一站一种；只能绑同类型项目；最多 5 个（承接现网外站上限） */
  MAX_BIND: 5,
  /* 现网硬规则：单配置最多 50 个页面；同一页面不可进两条配置 */
  MAX_PAGES: 50,
  SITE_TYPES: {
    chigua: "瓜站",
    video: "视频站",
    short_drama: "短剧站"
  },
  PROJECTS: {
    chigua: ["演示瓜站 · 主站", "演示瓜站 · 分站"],
    video: ["演示视频站", "演示视频站 · 备用"],
    short_drama: ["演示短剧项目", "演示短剧项目·备用", "演示短剧·海外"]
  },
  sites: [
    {
      id: "w1",
      name: "示例短剧站 A",
      type: "short_drama",
      baseUrl: "https://drama-a.example.com",
      pages: ["https://drama-a.example.com/list"],
      status: "active",
      collectOn: true,
      dedup: true,
      interval: 60,
      nextAt: "2026-10-27 12:00",
      notes: "",
      targets: ["演示短剧项目", "演示短剧项目·备用"]
    },
    {
      id: "w2",
      name: "示例视频源 B",
      type: "video",
      baseUrl: "https://source-b.example.com",
      pages: ["https://source-b.example.com/v"],
      status: "connecting",
      collectOn: true,
      dedup: true,
      interval: 180,
      nextAt: "—",
      notes: "Admin 接入中",
      targets: ["演示视频站"]
    },
    {
      id: "w3",
      name: "新申请瓜站 C",
      type: "chigua",
      baseUrl: "https://new-c.example.com",
      pages: ["https://new-c.example.com/"],
      status: "failed",
      collectOn: false,
      dedup: true,
      interval: 60,
      nextAt: "—",
      notes: "源站反爬，无法接入",
      targets: []
    },
    {
      id: "w4",
      name: "暂停中的短剧 D",
      type: "short_drama",
      baseUrl: "https://drama-d.example.com",
      pages: ["https://drama-d.example.com/list"],
      status: "paused",
      collectOn: true,
      dedup: true,
      interval: 60,
      nextAt: "—",
      notes: "",
      targets: ["演示短剧·海外"]
    }
  ],
  records: [
    {
      id: 901,
      time: "2026-10-27 11:02",
      siteId: "w1",
      target: "示例短剧站 A",
      title: "第 102 集列表页",
      url: "https://drama-a.example.com/ep/102",
      videoN: 3,
      imageN: 1,
      mats: [{ no: "WZ-20261027-001", st: "available" }],
      collectSec: 86,
      processSec: 42,
      status: "completed",
      err: "",
      progress: [
        { title: "视频1", dl: 42000000, total: 42000000, seg: 12, segDone: 12, stage: "downloaded", speed: 0 }
      ]
    },
    {
      id: 900,
      time: "2026-10-27 10:02",
      siteId: "w1",
      target: "示例短剧站 A",
      title: "第 101 集",
      url: "https://drama-a.example.com/ep/101",
      videoN: 2,
      imageN: 0,
      mats: [
        { no: "WZ-20261027-002", st: "manual_review" },
        { no: "", st: "duplicate" }
      ],
      collectSec: 120,
      processSec: 55,
      status: "completed",
      err: "",
      progress: [
        { title: "主片", dl: 18000000, total: 18000000, seg: 8, segDone: 8, stage: "downloaded", speed: 0 }
      ]
    },
    {
      id: 899,
      time: "2026-10-27 09:15",
      siteId: "w1",
      target: "示例短剧站 A",
      title: "采集中任务",
      url: "https://drama-a.example.com/ep/100",
      videoN: 0,
      imageN: 0,
      mats: [],
      collectSec: null,
      processSec: null,
      status: "running",
      err: "",
      progress: [
        { title: "视频1", dl: 8500000, total: 32000000, seg: 20, segDone: 5, stage: "downloading", speed: 1200000 },
        { title: "视频2", dl: 0, total: 28000000, seg: 16, segDone: 0, stage: "downloading", speed: 0 }
      ]
    },
    {
      id: 880,
      time: "2026-10-26 18:40",
      siteId: "w1",
      target: "示例短剧站 A",
      title: "结构变更失败",
      url: "https://drama-a.example.com/ep/99",
      videoN: 0,
      imageN: 0,
      mats: [],
      collectSec: 12,
      processSec: null,
      status: "failed",
      err: "列表页结构变更，解析失败",
      progress: []
    },
    {
      id: 870,
      time: "2026-10-26 12:00",
      siteId: "w2",
      target: "示例视频源 B",
      title: "开发接通前试采",
      url: "https://source-b.example.com/v/1",
      videoN: 0,
      imageN: 0,
      mats: [],
      collectSec: 5,
      processSec: null,
      status: "failed",
      err: "站点尚未接通",
      progress: []
    }
  ]
};

/* 补足 Demo 条数，方便演示翻页（每页 20/30） */
(function padRecords() {
  var base = window.FZWebCollectData.records;
  var i;
  var id = 860;
  for (i = 0; i < 42; i++) {
    id -= 1;
    base.push({
      id: id,
      time: "2026-10-25 " + String(10 + (i % 10)).padStart(2, "0") + ":00",
      siteId: "w1",
      target: "示例短剧站 A",
      title: "历史列表页 · 第 " + (80 - i) + " 批",
      url: "https://drama-a.example.com/ep/" + (80 - i),
      videoN: (i % 3) + 1,
      imageN: i % 2,
      mats: [
        {
          no: "WZ-20261025-" + String(100 + i).padStart(3, "0"),
          st: "available"
        }
      ],
      collectSec: 40 + (i % 50),
      processSec: 20 + (i % 30),
      status: "completed",
      err: "",
      progress: []
    });
  }
})();
