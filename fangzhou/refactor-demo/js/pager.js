/* 列表翻页：每页 20 / 30（对齐现网布局：左页大小、右共 N 条 + 页码） */
window.FZPager = (function () {
  var SIZES = [20, 30];
  var DEFAULT = 20;

  function clampSize(n) {
    var x = Number(n) || DEFAULT;
    return SIZES.indexOf(x) >= 0 ? x : DEFAULT;
  }

  function pageCount(total, size) {
    return Math.max(1, Math.ceil(Math.max(0, total) / size));
  }

  function clampPage(page, total, size) {
    var pages = pageCount(total, size);
    var p = Math.floor(Number(page) || 1);
    if (p < 1) return 1;
    if (p > pages) return pages;
    return p;
  }

  /** @returns {{ page, pageSize, total, pages, items }} */
  function slice(list, page, pageSize) {
    var all = list || [];
    var size = clampSize(pageSize);
    var total = all.length;
    var p = clampPage(page, total, size);
    var start = (p - 1) * size;
    return {
      page: p,
      pageSize: size,
      total: total,
      pages: pageCount(total, size),
      items: all.slice(start, start + size)
    };
  }

  function pageButtons(page, pages) {
    var start = Math.max(1, Math.min(page - 2, pages - 4));
    var end = Math.min(pages, start + 4);
    var html = "";
    var i;
    for (i = start; i <= end; i++) {
      html +=
        '<button type="button" class="fz-pager-btn' +
        (i === page ? " is-active" : "") +
        '" data-pager-page="' +
        i +
        '">' +
        i +
        "</button>";
    }
    return html;
  }

  /**
   * @param {{ total, page, pageSize }} opts
   * @returns {string}
   */
  function html(opts) {
    var total = Math.max(0, Number(opts.total) || 0);
    var size = clampSize(opts.pageSize);
    var pages = pageCount(total, size);
    var page = clampPage(opts.page, total, size);
    var sizeOpts = SIZES.map(function (n) {
      return (
        '<option value="' +
        n +
        '"' +
        (n === size ? " selected" : "") +
        ">" +
        n +
        " 条</option>"
      );
    }).join("");
    var nav =
      total === 0
        ? ""
        : '<span class="fz-pager-total">共 ' +
          total +
          " 条</span>" +
          '<button type="button" class="fz-pager-btn" data-pager-page="prev"' +
          (page <= 1 ? " disabled" : "") +
          ">‹</button>" +
          pageButtons(page, pages) +
          '<button type="button" class="fz-pager-btn" data-pager-page="next"' +
          (page >= pages ? " disabled" : "") +
          ">›</button>";
    return (
      '<div class="fz-pager" role="navigation" aria-label="列表翻页">' +
      '<div class="fz-pager-size"><span class="fz-pager-label">每页显示</span>' +
      '<select class="input fz-pager-select" data-pager-size aria-label="每页条数">' +
      sizeOpts +
      "</select></div>" +
      '<div class="fz-pager-nav">' +
      nav +
      "</div></div>"
    );
  }

  /**
   * 在容器上委托翻页事件。
   * @param {Element} root
   * @param {{ getState: function, setState: function, onChange: function }} ctrl
   *   getState() → { page, pageSize }
   *   setState({ page?, pageSize? })
   *   onChange() 重绘
   */
  function bind(root, ctrl) {
    if (!root || root._fzPagerBound) return;
    root._fzPagerBound = true;
    root.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-pager-page]");
      if (!btn || !root.contains(btn) || btn.disabled) return;
      var st = ctrl.getState();
      var key = btn.getAttribute("data-pager-page");
      var next = st.page;
      if (key === "prev") next = st.page - 1;
      else if (key === "next") next = st.page + 1;
      else next = Number(key) || 1;
      if (next === st.page) return;
      ctrl.setState({ page: next });
      ctrl.onChange();
    });
    root.addEventListener("change", function (e) {
      if (!e.target.matches("[data-pager-size]")) return;
      ctrl.setState({ pageSize: Number(e.target.value), page: 1 });
      ctrl.onChange();
    });
  }

  return {
    SIZES: SIZES,
    DEFAULT: DEFAULT,
    clampSize: clampSize,
    clampPage: clampPage,
    slice: slice,
    html: html,
    bind: bind
  };
})();
