// ==UserScript==
// @name         SCMU 解剖生理学谢莺班容量提醒
// @namespace    projectmentor
// @version      1.0.0
// @description  只监控解剖生理学 03-谢莺教学班，只提示，不自动选课。
// @match        https://xk.scmu.edu.cn/xk/plugins/eaxsxk/home*
// @grant        GM_notification
// ==/UserScript==

(function () {
  "use strict";
  if (window.__projectmentorAnatomyXieying) return;
  window.__projectmentorAnatomyXieying = true;

  const COURSE_CODE = "212103006213";
  const COURSE_NAME = "\u89e3\u5256\u751f\u7406\u5b66";
  const SECTION = "03-\u8c22\u83ba";
  const REFRESH_MS = 10000;
  let timer = null;
  let lastAvailable = false;

  function textOf(el) { return (el && (el.innerText || el.textContent) || "").replace(/\s+/g, " ").trim(); }
  function isVisible(el) { return !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function getTargetRow() {
    return Array.from(document.querySelectorAll("tr")).find(function (row) {
      const text = textOf(row);
      return text.includes(SECTION) && !text.includes("\u9000\u9009") && !text.includes("\u5df2\u9009\u4e2d");
    }) || null;
  }
  function getCapacity(text) {
    if (text.includes("\u6ee1\u5458")) return { available: false, value: "\u6ee1\u5458" };
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { available: Number(m[1]) < Number(m[2]), value: m[0] } : { available: false, value: "\u672a\u77e5" };
  }
  function render(capacity, message) {
    let panel = document.getElementById("pm-anatomy-xieying-alert");
    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "pm-anatomy-xieying-alert";
      panel.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:2147483647;width:360px;padding:13px;background:#102a43;color:#fff;border-radius:10px;font:14px/1.5 system-ui;box-shadow:0 4px 18px #0007";
      document.body.appendChild(panel);
    }
    const color = capacity.available ? "#166534" : "#1f2937";
    panel.innerHTML = "<b>SCMU \u5bb9\u91cf\u63d0\u9192</b><div style='background:" + color + ";padding:9px;margin-top:8px;border-radius:6px'><b>" + COURSE_NAME + " [" + COURSE_CODE + "]</b><br>\u5206\u7ec4：" + SECTION + "<br>\u5bb9\u91cf：" + capacity.value + "<br>" + message + "</div><div style='margin-top:8px;opacity:.75'>\u53ea\u76d1\u63a7\u8be5\u73ed\uff0c\u6bcf 10 \u79d2\u68c0\u67e5</div>";
  }
  function notify(capacity) {
    if (!capacity.available || lastAvailable) return;
    lastAvailable = true;
    try { GM_notification({ title: "\u89e3\u5256\u751f\u7406\u5b66\u53d1\u73b0\u4f59\u91cf", text: SECTION + " " + capacity.value, timeout: 0 }); } catch { /* on-screen alert remains */ }
  }
  function check() {
    const row = getTargetRow();
    if (!row) {
      render({ available: false, value: "\u672a\u627e\u5230" }, "\u8bf7\u5207\u6362\u5230\u63a8\u8350\u8bfe\u7a0b\u9875\u6216\u7b49\u5f85\u9875\u9762\u52a0\u8f7d");
      return;
    }
    const capacity = getCapacity(textOf(row));
    if (!capacity.available) lastAvailable = false;
    render(capacity, capacity.available ? "\u53d1\u73b0\u4f59\u91cf\uff0c\u8bf7\u4f60\u624b\u52a8\u9009\u8bfe" : "\u6682\u65e0\u4f59\u91cf");
    notify(capacity);
  }
  function schedule() { if (timer) clearTimeout(timer); timer = setTimeout(function () { location.reload(); }, REFRESH_MS); }
  function start() { check(); schedule(); }
  render({ available: false, value: "\u8bfb\u53d6\u4e2d" }, "\u6b63\u5728\u8bfb\u53d6\u76ee\u6807\u8bfe\u7a0b");
  window.addEventListener("load", function () { setTimeout(start, 1200); }, { once: true });
  if (document.readyState === "complete") setTimeout(start, 1200);
})();
