/* 素材详情 · 主预览 + 缩略条（主窗内切换/播放，不再套放大层） */
(function (w) {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }
  function list(m) {
    var out = [];
    var i;
    for (i = 0; i < (m.videoCount || 0); i++) out.push({ kind: "video", label: "视频" + (i + 1) });
    for (i = 0; i < (m.imageCount || 0); i++) out.push({ kind: "image", label: "图" + (i + 1) });
    return out;
  }
  function html(m, mediaIdx, playing) {
    var items = list(m);
    if (!items.length) {
      return '<div class="muted" style="padding:24px">无媒体预览</div>';
    }
    if (mediaIdx >= items.length) mediaIdx = 0;
    var cur = items[mediaIdx];
    var isVideo = cur.kind === "video";
    var isPlaying = !!(playing && isVideo);
    var thumbs = items
      .map(function (it, i) {
        return (
          '<button type="button" class="mat-thumb' +
          (it.kind === "video" ? " is-video" : "") +
          (i === mediaIdx ? " is-on" : "") +
          '" data-media-pick="' + i + '" title="' + esc(it.label) + '">' +
          (it.kind === "video" ? '<span class="mat-play">▶</span>' : "") +
          "<span>" + esc(it.label) + "</span></button>"
        );
      })
      .join("");
    var stageInner;
    if (isVideo && isPlaying) {
      stageInner =
        '<span class="mat-stage-play is-on">❚❚</span>' +
        '<span class="mat-stage-label">' + esc(cur.label) + "</span>" +
        '<span class="mat-stage-hint">Demo 播放中 · 再点暂停</span>';
    } else if (isVideo) {
      stageInner =
        '<span class="mat-stage-play">▶</span>' +
        '<span class="mat-stage-label">' + esc(cur.label) + "</span>" +
        '<span class="mat-stage-hint">点击播放</span>';
    } else {
      stageInner =
        '<span class="mat-stage-label">' + esc(cur.label) + "</span>" +
        '<span class="mat-stage-hint">当前预览</span>';
    }
    return (
      '<div class="mat-media">' +
      '<button type="button" class="mat-stage' +
      (isVideo ? " is-video" : "") +
      (isPlaying ? " is-playing" : "") +
      '"' +
      (isVideo ? ' data-media-toggle-play title="点击播放/暂停"' : " disabled title=\"当前图片预览\"") +
      ">" +
      stageInner +
      "</button>" +
      '<div class="mat-thumbs-wrap"><div class="mat-thumbs">' + thumbs + "</div>" +
      (items.length > 6 ? '<span class="mat-thumbs-count">共 ' + items.length + " 个</span>" : "") +
      "</div></div>"
    );
  }
  w.FZMatMedia = { list: list, html: html };
})(window);
