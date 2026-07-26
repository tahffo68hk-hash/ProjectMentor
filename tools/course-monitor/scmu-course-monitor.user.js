// ==UserScript==
// @name         SCMU Course Monitor (Selectable Targets)
// @namespace    projectmentor
// @version      0.2.7
// @description  Read courses from Scheme and Recommended tabs, monitor checked sections, and select once when capacity appears.
// @match        https://xk.scmu.edu.cn/xk/plugins/eaxsxk/home*
// @grant        GM_notification
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";
  if (window.__projectmentorScmuMonitor) return;
  window.__projectmentorScmuMonitor = true;
  const SELECT = "\u9009\u62e9";
  const FULL = "\u6ee1\u5458";
  const TABS = ["\u65b9\u6848\u5185\u8bfe\u7a0b", "\u63a8\u8350\u8bfe\u7a0b"];
  const STATE_KEY = "projectmentor.scmu.course-monitor.v6";
  const state = Object.assign({ enabled: true, stopped: false, selected: {}, courses: {}, last: "Started" }, readState());
  if (state.stopped && !String(state.last).startsWith("Selection attempted:")) {
    state.stopped = false;
    state.enabled = true;
    state.last = "Resumed after previous monitor error";
    saveState();
  }
  let timer = null;
  let scanStarted = false;

  function readState() { try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; } }
  function saveState() { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
  function textOf(el) { return (el && (el.innerText || el.textContent) || "").replace(/\s+/g, " ").trim(); }
  function notify(title, text) { try { GM_notification({ title, text, timeout: 0 }); } catch { alert(title + "\n" + text); } }
  function visible(el) { return !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
  function parseCapacity(text) {
    if (text.includes(FULL)) return { available: false, raw: FULL };
    const m = text.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { available: Number(m[1]) < Number(m[2]), raw: m[0] } : { available: false, raw: "unknown" };
  }
  function courseFromRow(row) {
    const headers = Array.from(document.querySelectorAll("div,span,td,li"))
      .map(function (el) { return { el, text: textOf(el) }; })
      .filter(function (x) { return /\[\d{12}\]-[\d.]+\s*\u5b66\u5206/.test(x.text) && x.text.length < 140; });
    let best = "Unknown course";
    headers.forEach(function (x) {
      const relation = x.el.compareDocumentPosition(row);
      if (relation & Node.DOCUMENT_POSITION_FOLLOWING) {
        const m = x.text.match(/([^\n]{1,100}\[\d{12}\]-[\d.]+\s*\u5b66\u5206)/);
        if (m) best = m[1].replace(/\s+/g, " ").trim();
      }
    });
    return best;
  }
  function courseKey(course) {
    const code = (course.match(/\[(\d{12})\]/) || ["", course])[1];
    return code || course.replace(/\s+/g, " ").trim();
  }
  function scanRows(tabName) {
    const result = [];
    document.querySelectorAll("tr").forEach(function (row) {
      const text = textOf(row);
      if (text.includes("\u9000\u9009") || text.includes("\u5df2\u9009\u4e2d")) return;
      const section = (text.match(/(?:\u5206\u7ec4\s*)?(\d{2}-[^\s]+)/) || [])[1];
      if (!section || !text.includes("/") || !row.querySelector("button, a")) return;
      const course = courseFromRow(row);
      const key = courseKey(course) + "|" + section;
      const capacity = parseCapacity(text);
      state.courses[key] = { course, section, tab: tabName, capacity: capacity.raw };
      result.push({ key, course, section, capacity, row });
    });
    return result;
  }
  function clickTab(name) {
    const candidates = Array.from(document.querySelectorAll("[role=tab], .el-tabs__item, .ant-tabs-tab, li, button"));
    const tab = candidates.find(function (el) { return textOf(el).includes(name); });
    if (tab) tab.click();
  }
  function renderPanel() {
    let panel = document.getElementById("pm-scmu-monitor");
    if (!panel) {
      panel = document.createElement("aside"); panel.id = "pm-scmu-monitor";
      panel.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:2147483647;width:370px;max-height:55vh;overflow:auto;padding:12px;background:#073b2a;color:#fff;border-radius:10px;font:12px/1.45 system-ui;box-shadow:0 4px 18px #0005";
      document.body.appendChild(panel);
    }
    const entries = Object.values(state.courses).sort(function (a, b) { return a.course.localeCompare(b.course); });
    const status = state.stopped ? "Stopped" : (state.enabled ? "Monitoring" : "Paused");
    const rows = entries.map(function (item) {
      const checked = state.selected[item.course + "|" + item.section] ? " checked" : "";
      return "<label style='display:block;margin:5px 0'><input type='checkbox' data-key='" + encodeURIComponent(item.course + "|" + item.section) + "'" + checked + "> <b>" + item.course + "</b><br>&nbsp;&nbsp;" + item.section + " · " + item.capacity + " · " + item.tab + "</label>";
    }).join("");
    panel.innerHTML = "<b>SCMU monitor</b> <span>" + status + "</span><div style='opacity:.8'>" + state.last + "</div><div style='margin-top:8px'>" + (rows || "No course rows read yet") + "</div><button id='pm-toggle'>" + (state.enabled ? "Pause" : "Start") + "</button> <button id='pm-clear'>Clear targets</button>";
    panel.querySelectorAll("input[data-key]").forEach(function (input) { input.addEventListener("change", function () { const key = decodeURIComponent(input.dataset.key); if (input.checked) state.selected[key] = true; else delete state.selected[key]; saveState(); }); });
    panel.querySelector("#pm-toggle").onclick = function () { state.enabled = !state.enabled; state.stopped = false; saveState(); renderPanel(); schedule(); };
    panel.querySelector("#pm-clear").onclick = function () { state.selected = {}; state.stopped = false; saveState(); renderPanel(); };
  }
  function actOnRows(rows) {
    if (!state.enabled || state.stopped) return;
    for (const entry of rows) {
      if (!state.selected[entry.key]) continue;
      const cap = parseCapacity(textOf(entry.row));
      if (!cap.available) continue;
      const buttons = Array.from(entry.row.querySelectorAll("button, a")).filter(function (b) { return visible(b) && textOf(b).includes(SELECT) && !b.disabled; });
      if (buttons.length !== 1) { state.enabled = false; state.stopped = true; state.last = "Capacity found but Select button was ambiguous"; saveState(); renderPanel(); notify("SCMU monitor stopped", state.last); return; }
      buttons[0].click();
      state.enabled = false; state.stopped = true; state.last = "Select clicked; waiting for confirmation: " + entry.course + " " + entry.section; saveState(); renderPanel();
      setTimeout(function () {
        const confirms = Array.from(document.querySelectorAll("button, a")).filter(function (b) { return visible(b) && textOf(b).trim() === "\u786e\u5b9a" && !b.disabled; });
        if (confirms.length === 1) {
          confirms[0].click(); state.last = "Selection confirmed: " + entry.course + " " + entry.section; saveState(); renderPanel(); notify("Course selected", state.last);
        } else {
          notify("Please confirm course selection", "The Select button was clicked. Check the page for the confirmation dialog.");
        }
      }, 700);
      return;
    }
  }
  function scanCurrentTab() { const active = textOf(document.querySelector("[role=tab][aria-selected=true], .el-tabs__item.is-active, .ant-tabs-tab-active")); const rows = scanRows(active || "Current tab"); renderPanel(); actOnRows(rows); }
  function schedule() { if (timer) clearTimeout(timer); if (state.enabled && !state.stopped) timer = setTimeout(function () { location.reload(); }, 10000); }
  function startScan() {
    if (!state.enabled || state.stopped) return;
    if (scanStarted) return;
    scanStarted = true;
    state.courses = {};
    TABS.forEach(function (tabName, index) { setTimeout(function () { clickTab(tabName); setTimeout(scanCurrentTab, 700); }, index * 900); });
    setTimeout(schedule, TABS.length * 1000 + 1000);
  }
  GM_registerMenuCommand("Start/Pause SCMU monitor", function () { state.enabled = !state.enabled; state.stopped = false; saveState(); renderPanel(); schedule(); });
  renderPanel();
  window.addEventListener("load", function () { setTimeout(startScan, 1200); }, { once: true });
  if (document.readyState === "complete") setTimeout(startScan, 1200);
})();
