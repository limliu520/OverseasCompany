/* 侧栏菜单逐步引导 · 到二级 · 按权限裁剪；气泡贴在选中项右侧 */
(function (global) {
  function visibleSteps() {
    var s = FZStore.read();
    var steps = [];
    var nav = global.FZShell && FZShell.getNav ? FZShell.getNav() : [];
    nav.forEach(function (group) {
      (group.children || []).forEach(function (c) {
        if (!c.done || c.stub || c.tourSkip) return;
        if (c.need && !FZStore.hasFeature(s, c.need)) return;
        steps.push({
          id: c.id,
          label: group.label + " · " + c.label,
          tip:
            c.tourTip ||
            ("「" + c.label + "」是业务操作入口：从侧栏进入后按页面提示完成配置或处理待办。")
        });
      });
    });
    return steps;
  }

  function ensureLayer() {
    var layer = document.getElementById("fz-tour-layer");
    if (layer) return layer;
    layer = document.createElement("div");
    layer.id = "fz-tour-layer";
    layer.className = "fz-tour-layer";
    layer.innerHTML =
      '<div class="fz-tour-dim" aria-hidden="true"></div>' +
      '<div class="fz-tour-card" id="fz-tour-card">' +
      '<p class="fz-tour-step" id="fz-tour-step"></p>' +
      '<p class="fz-tour-tip" id="fz-tour-tip"></p>' +
      '<div class="fz-tour-actions">' +
      '<button type="button" class="btn btn-ghost" id="fz-tour-skip">跳过</button>' +
      '<button type="button" class="btn btn-primary" id="fz-tour-next">下一步</button>' +
      "</div></div>";
    document.body.appendChild(layer);
    return layer;
  }

  function placeCard(target) {
    var card = document.getElementById("fz-tour-card");
    if (!card) return;
    if (!target) {
      card.style.left = "calc(var(--sidebar-w, 232px) + 16px)";
      card.style.top = "80px";
      card.style.bottom = "auto";
      return;
    }
    var r = target.getBoundingClientRect();
    var gap = 14;
    var w = card.offsetWidth || 320;
    var h = card.offsetHeight || 140;
    var left = Math.round(r.right + gap);
    var top = Math.round(r.top + r.height / 2 - h / 2);
    top = Math.max(12, Math.min(top, window.innerHeight - h - 12));
    if (left + w > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - w - 12);
    }
    card.style.left = left + "px";
    card.style.top = top + "px";
    card.style.bottom = "auto";
  }

  function start(opts) {
    opts = opts || {};
    var steps = visibleSteps();
    if (!steps.length) {
      if (opts.onSkip) opts.onSkip();
      return;
    }
    var i = 0;
    var layer = ensureLayer();
    layer.hidden = false;
    document.body.classList.add("is-fz-tour");

    function clearHi() {
      document.querySelectorAll(".nav-item.is-tour-hi").forEach(function (el) {
        el.classList.remove("is-tour-hi");
      });
    }

    function finish(skipped) {
      clearHi();
      layer.hidden = true;
      document.body.classList.remove("is-fz-tour");
      window.removeEventListener("resize", onResize);
      var st = FZStore.read();
      FZStore.setMenuTourDone(st, true);
      FZStore.write(st);
      if (skipped && opts.onSkip) opts.onSkip();
      else if (opts.onDone) opts.onDone();
    }

    function onResize() {
      var hi = document.querySelector(".nav-item.is-tour-hi");
      placeCard(hi);
    }

    function render() {
      clearHi();
      var step = steps[i];
      document.getElementById("fz-tour-step").textContent =
        "菜单引导 " + (i + 1) + " / " + steps.length + " · " + step.label;
      document.getElementById("fz-tour-tip").textContent = step.tip;
      var nextBtn = document.getElementById("fz-tour-next");
      nextBtn.textContent = i >= steps.length - 1 ? "完成" : "下一步";
      var target = document.querySelector(
        '.nav-item[data-nav-id="' + step.id + '"]'
      );
      if (target) {
        target.classList.add("is-tour-hi");
        target.scrollIntoView({ block: "nearest" });
      }
      requestAnimationFrame(function () {
        placeCard(target);
        requestAnimationFrame(function () {
          placeCard(target);
        });
      });
    }

    document.getElementById("fz-tour-skip").onclick = function () {
      finish(true);
      FZShell.toast("已跳过菜单引导", "ok");
    };
    document.getElementById("fz-tour-next").onclick = function () {
      if (i >= steps.length - 1) {
        finish(false);
        FZShell.toast("菜单引导完成", "ok");
        return;
      }
      i += 1;
      render();
    };
    window.addEventListener("resize", onResize);
    render();
  }

  global.FZMenuTour = {
    start: start,
    visibleSteps: visibleSteps
  };
})(window);
