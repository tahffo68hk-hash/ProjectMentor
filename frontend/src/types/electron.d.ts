import type { ProjectMentorDesktopApi } from "../../../shared/ipc";

declare global {
  interface Window {
    projectMentor?: ProjectMentorDesktopApi;
  }
}

export {};
