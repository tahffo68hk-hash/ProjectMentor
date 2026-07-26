# Course Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a Tampermonkey userscript that monitors two specified course sections on the logged-in university course-selection page and attempts selection when capacity appears.

**Architecture:** A page-local userscript runs only on the supplied course-selection URL. It periodically reloads the page, parses visible course rows by exact course and section text, and clicks only the matching enabled “选择” button. It never clicks “退选”, never chooses a different section, stops after a success/confirmation/error signal, and shows a fixed status panel plus browser notifications where available.

**Tech Stack:** Tampermonkey userscript, browser DOM APIs, localStorage, MutationObserver-free polling.

---

### Task 1: Add the userscript

**Files:**
- Create: `tools/course-monitor/scmu-course-monitor.user.js`

- [ ] Write the script metadata, exact URL match, target configuration, status panel, capacity parser, row matcher, safe click routine, reload scheduler, and stop conditions.

- [ ] Keep all mutable state in `localStorage` under a namespaced key and expose Start/Pause controls in the panel.

### Task 2: Add installation and operating instructions

**Files:**
- Create: `tools/course-monitor/README.md`

- [ ] Document Tampermonkey installation, the exact two target sections, recommended refresh interval, how to pause, and the fact that final browser confirmation may require the user.

### Task 3: Verify locally

**Files:**
- Test: `tools/course-monitor/README.md`

- [ ] Run a syntax check with Node using `node --check tools/course-monitor/scmu-course-monitor.user.js`.

- [ ] Inspect the current browser page read-only and confirm the script’s selectors are based on observed course/section/operation text.

- [ ] Install or paste the script only after the user explicitly enables Tampermonkey; do not submit a course during verification.

### Task 4: Handoff

- [ ] Explain how to start the monitor and what exact page signal indicates that a course was selected.

- [ ] Keep the logged-in course page open for the user and stop browser control at the handoff state.
