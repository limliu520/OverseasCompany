/* 侧栏菜单逐步引导 · 到二级 · 按权限裁剪 */
(function (global) {
  function visibleSteps() {
    var s = FZStore.read();
    var steps = [];
    var nav = (global.FZShell && FZShell.getNav) ? FZShell.getNav() : [];
    nav.forEach(function (group) {
      (group.children || []).forEach(function (c) {
        if (!c.done || c.stub) return;
        if (c.need && !FZStore.hasFeature(s, c.need)) return;
        steps.push({
          id: c.id,
          label: group.label + " · " + c.label,
          tip: c.tourTip || ("「" + c.label + "」用于日常相关操作，可从侧栏进入。")
        });
      });
    });
    return steps;
  }

  function start(opts) {
    opts = opts || {};
    var steps = visibleSteps();
    if (!steps.length) {
      if (opts.onSkip) opts.onSkip();
      return;
    }
    var i = 0;
    var layer = document.getElementById("fz-tour-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.id = "fz-tour-layer";
      layer.className = "fz-tour-layer";
      layer.innerHTML =
        '<div class="fz-tour-card">' +
        '<p class="fz-tour-step" id="fz-tour-step"></p>' +
        '<p class="fz-tour-tip" id="fz-tour-tip"></p>' +
        '<div class="fz-tour-actions">' +
        '<button type="button" class="btn btn-ghost" id="fz-tour-skip">跳过</button>' +
        '<button type="button" class="btn btn-primary" id="fz-tour-next">下一步</button>' +
        "</div></div>";
      document.body.appendChild(layer);
    }
    layer.hidden = false;

    function clearHi() {
      document.querySelectorAll(".nav-item.is-tour-hi").forEach(function (el) {
        el.classList.remove("is-tour-hi");
      });
    }

    function finish(skipped) {
      clearHi();
      layer.hidden = true;
      var st = FZStore.read();
      FZStore.setMenuTourDone(st, true);
      FZStore.write(st);
      if (skipped && opts.onSkip) opts.onSkip();
      else if (opts.onDone) opts.onDone();
    }

    function render() {
      clearHi();
      var step = steps[i];
      document.getElementById("fz-tour-step").textContent =
        "菜单引导 " + (i + 1) + " / " + steps.length + " · " + step.label;
      document.getElementById("fz-tour-tip").textContent = step.tip;
      var nextBtn = document.getElementById("fz-tour-next");
      nextBtn.textContent = i >= steps.length - 1 ? "完成" : "下一步";
      var target = document.querySelector('.nav-item[data-nav-id="' + step.id + '"]');
      if (target) {
        target.classList.add("is-tour-hi");
        target.scrollIntoView({ block: "nearest" });
      }
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
    render();
  }

  global.FZMenuTour = {
    start: start,
    visibleSteps: visibleSteps
  };
})(window);
