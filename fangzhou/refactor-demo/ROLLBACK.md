# UI 改版回退说明

## 当前改版

- 方向：Linear 浅色精密后台（见 `DESIGN.md`）
- 备份：`css/app.css.bak-20261028-mixpanel.css`（改版前 Mixpanel 紫灰版）

## 一键退回（推荐）

在仓库里执行：

```bash
cp "fangzhou/refactor-demo/css/app.css.bak-20261028-mixpanel.css" \
   "fangzhou/refactor-demo/css/app.css"
```

然后浏览器硬刷（Cmd+Shift+R）。不必改 HTML。

或运行：

```bash
bash fangzhou/refactor-demo/css/restore-mixpanel.sh
```

## 注意

- 只回退样式；JS/HTML 结构改动（如文章编辑布局、项目类型标签）不会自动撤销。
- 若只要旧皮肤、保留新布局，退 CSS 即可。
- 新备份请另存，勿覆盖 `app.css.bak-20261028-mixpanel.css`。
