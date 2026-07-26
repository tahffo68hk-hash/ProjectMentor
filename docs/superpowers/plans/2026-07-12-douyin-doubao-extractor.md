# 抖音豆包视频提取器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local browser-driven tool that collects all publicly accessible videos from a Douyin creator page and sends them one by one to Doubao Web for transcription and copy extraction.

**Architecture:** Keep collection, queue/checkpointing, Doubao interaction, export, and UI as separate modules. Browser automation operates only on visible web UI; the queue persists after every state change so collection and analysis can resume safely.

**Tech Stack:** Existing Next.js frontend, TypeScript, Playwright/browser automation, local JSON/Markdown persistence.

---

### Task 1: Define shared job model and persistence

**Files:**
- Create: `frontend/src/lib/douyin/types.ts`
- Create: `frontend/src/lib/douyin/jobStore.ts`
- Test: `frontend/src/lib/douyin/jobStore.test.ts`

- [ ] **Step 1: Write tests for job creation, deduplication, and state transitions.**
- [ ] **Step 2: Run the focused test and confirm it fails because the store does not exist.**
- [ ] **Step 3: Implement `VideoJob`, `JobStatus`, `createJob`, `upsertVideo`, `updateVideoStatus`, and JSON persistence.**
- [ ] **Step 4: Run the focused test and confirm it passes.**

### Task 2: Implement visible-page Douyin collector

**Files:**
- Create: `frontend/src/lib/douyin/collector.ts`
- Create: `frontend/src/lib/douyin/collector.test.ts`

- [ ] **Step 1: Write tests for normalizing relative video URLs, preserving visible order, and removing duplicates.**
- [ ] **Step 2: Run the focused test and confirm it fails.**
- [ ] **Step 3: Implement a collector interface that accepts a browser tab adapter and returns visible cards plus collection-stop reasons.**
- [ ] **Step 4: Add bounded scrolling with stop conditions for page bottom, displayed work count, login prompt, and CAPTCHA/security interruption.**
- [ ] **Step 5: Run collector tests and confirm they pass.**

### Task 3: Implement Doubao Web adapter

**Files:**
- Create: `frontend/src/lib/douyin/doubaoAdapter.ts`
- Create: `frontend/src/lib/douyin/doubaoAdapter.test.ts`

- [ ] **Step 1: Write tests using a fake tab for prompt construction, login-block detection, and response extraction.**
- [ ] **Step 2: Run tests and confirm they fail.**
- [ ] **Step 3: Implement `analyzeVideo` with a fixed Chinese extraction prompt, visible textbox interaction, bounded response wait, and explicit blocked/timeout errors.**
- [ ] **Step 4: Ensure the adapter never reads credentials, cookies, tokens, or hidden page state.**
- [ ] **Step 5: Run the adapter tests and confirm they pass.**

### Task 4: Add orchestration and checkpoint resume

**Files:**
- Create: `frontend/src/lib/douyin/orchestrator.ts`
- Create: `frontend/src/lib/douyin/orchestrator.test.ts`

- [ ] **Step 1: Write tests for collect-all-then-analyze, retrying one failed item, pausing, and resuming persisted jobs.**
- [ ] **Step 2: Run tests and confirm they fail.**
- [ ] **Step 3: Implement orchestration that persists after each collected URL and after every analysis result.**
- [ ] **Step 4: Stop the run on login/CAPTCHA blocks while retaining completed work and queue state.**
- [ ] **Step 5: Run orchestration tests and confirm they pass.**

### Task 5: Add Markdown and CSV export

**Files:**
- Create: `frontend/src/lib/douyin/exporter.ts`
- Create: `frontend/src/lib/douyin/exporter.test.ts`

- [ ] **Step 1: Write tests for safe filenames, duplicate filenames, Markdown sections, and summary CSV.**
- [ ] **Step 2: Run tests and confirm they fail.**
- [ ] **Step 3: Implement deterministic filenames using sequence number and video ID, without overwriting existing files.**
- [ ] **Step 4: Run exporter tests and confirm they pass.**

### Task 6: Build the first UI workflow

**Files:**
- Create: `frontend/src/app/douyin/page.tsx`
- Create: `frontend/src/components/douyin/DouyinJobPanel.tsx`
- Modify: `frontend/src/app/globals.css`

- [ ] **Step 1: Add a page with homepage URL input, output location, start/pause/resume controls, and live counts.**
- [ ] **Step 2: Render every job with title, URL, status, error, and retry action.**
- [ ] **Step 3: Add clear states for login required, CAPTCHA/security interruption, page end, and completed collection.**
- [ ] **Step 4: Verify TypeScript, lint, and the production build.**

### Task 7: End-to-end verification

**Files:**
- Create: `frontend/tests/douyin-flow.spec.ts`
- Modify: `README.md` or the project setup documentation file after confirming its actual format.

- [ ] **Step 1: Add a mocked browser-flow test covering collection, one Doubao response, export, and resume.**
- [ ] **Step 2: Run the full test suite and fix failures.**
- [ ] **Step 3: Manually verify against the supplied public creator page, stopping if the page requires user login or shows CAPTCHA.**
- [ ] **Step 4: Record exact run instructions and known limitations.**
