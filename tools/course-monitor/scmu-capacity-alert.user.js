// ==UserScript==
// @name         SCMU Course Capacity Alert Only
// @namespace    projectmentor
// @version      1.2.0
// @description  Refresh SCMU course pages and show on-screen alerts for available seats. Never selects courses.
// @match        https://xk.scmu.edu.cn/xk/plugins/eaxsxk/home*
// @grant        GM_notification
// ==/UserScript==

(function () {
  "use strict";
  if (window.__projectmentorCapacityAlert) return;
  window.__projectmentorCapacityAlert = true;

  const REFRESH_MS = 10000;
  const RECOMMENDED_TAB = "\u63a8\u8350\u8bfe\u7a0b";
  const STATE_KEY = "projectmentor.scmu.capacity-alert.targets.recommended.v2";
  const selected = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
  let timer = null;
  let scanned = {};

  function textOf(el) { return (el && (el.innerText || el.textContent) || "").replace(/\s+/g, " ").trim(); }
  function visible(el) { return !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function capacity(text) {
    if (text.includes("\u6ee1\u5458")) return { available: false, value: "\u6ee1\u5458" };
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { available: Number(m[1]) < Number(m[2]), value: m[0] } : { available: false, value: "\u672a\u77e5" };
  }
  function courseName(row) {
    const nodes = Array.from(document.querySelectorAll("div,span,td,li"));
    let best = "\u672a\u77e5\u8bfe\u7a0b";
    nodes.forEach(function (node) {
      const value = textOf(node);
      if (value.length > 140 || !/\[\d{12}\]-[\d.]+\s*\u5b66\u5206/.test(value)) return;
      if (node.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING) {
        const m = value.match(/([^\n]{1,100}\[\d{12}\]-[\d.]+\s*\u5b66\u5206)/);
        if (m) best = m[1].replace(/\s+/g, " ").trim();
      }
    });
    return best;
  }
  function scan(tabName) {
    document.querySelectorAll("tr").forEach(function (row) {
      const value = textOf(row);
      if (value.includes("\u9000\u9009") || value.includes("\u5df2\u9009\u4e2d")) return;
      const section = (value.match(/(?:\u5206\u7ec4\s*)?(\d{2}-[^\s]+)/) || [])[1];
      if (!section || !value.includes("/") || !row.querySelector("button, a")) return;
      const seats = capacity(value);
      const item = { course: courseName(row), section, seats: seats.value, tab: tabName };
      item.key = (item.course.match(/\[(\d{12})\]/) || ["", item.course])[1] + "|" + section;
      scanned[item.key] = item;
    });
  }
  function render() {
    let panel = document.getElementById("pm-capacity-alert");
    if (!panel) {
      panel = document.createElement("aside"); panel.id = "pm-capacity-alert";
      panel.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:2147483647;width:390px;max-height:48vh;overflow:auto;padding:12px;background:#102a43;color:#fff;border-radius:10px;font:13px/1.5 system-ui;box-shadow:0 4px 18px #0007";
      document.body.appendChild(panel);
    }
    const items = Object.values(scanned).sort(function (a, b) { return a.course.localeCompare(b.course); });
    const body = items.length ? items.map(function (x) {
      const isSelected = !!selected[x.key];
      const hasSeats = x.seats !== "\u6ee1\u5458" && x.seats !== "\u672a\u77e5";
      const style = isSelected && hasSeats ? "background:#166534;" : "background:#1f2937;";
      return "<label style='display:block;" + style + "padding:7px;margin:5px 0;border-radius:6px'><input type='checkbox' data-key='" + encodeURIComponent(x.key) + "'" + (isSelected ? " checked" : "") + "> " + x.course + "<br>&nbsp;&nbsp;" + x.section + " · " + x.seats + " · " + x.tab + "</label>";
    }).join("") : "<div style='opacity:.8'>\u6b63\u5728\u8bfb\u53d6\u8bfe\u7a0b...</div>";
    panel.innerHTML = "<b>SCMU \u5bb9\u91cf\u63d0\u9192</b><div style='opacity:.8'>\u53ea\u63d0\u793a\u5df2\u52fe\u9009\u7684\u8bfe\u7a0b</div><div style='margin-top:7px'>" + body + "</div>";
    panel.querySelectorAll("input[data-key]").forEach(function (input) { input.addEventListener("change", function () { const key = decodeURIComponent(input.dataset.key); if (input.checked) selected[key] = true; else delete selected[key]; localStorage.setItem(STATE_KEY, JSON.stringify(selected)); render(); }); });
    return items.filter(function (x) { return selected[x.key] && x.seats !== "\u6ee1\u5458" && x.seats !== "\u672a\u77e5"; });
  }
  function notify(available) {
    if (!available.length) return;
    const message = available.map(function (x) { return x.course + " " + x.section + " " + x.seats; }).join("\n");
    try { GM_notification({ title: "SCMU \u53d1\u73b0\u6709\u4f59\u91cf\u8bfe\u7a0b", text: message, timeout: 0 }); } catch { /* on-screen panel remains available */ }
  }
  function switchTab(name) {
    const tab = Array.from(document.querySelectorAll("[role=tab], .el-tabs__item, .ant-tabs-tab, li, button")).find(function (el) { return visible(el) && textOf(el).includes(name); });
    if (tab) tab.click();
  }
  function start() {
    scanned = {};
    switchTab(RECOMMENDED_TAB);
    setTimeout(function () { scan(RECOMMENDED_TAB); const found = render(); notify(found); }, 700);
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { location.reload(); }, REFRESH_MS);
  }
  render();
  window.addEventListener("load", function () { setTimeout(start, 1200); }, { once: true });
  if (document.readyState === "complete") setTimeout(start, 1200);
})();
