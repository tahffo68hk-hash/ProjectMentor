import { contextBridge, ipcRenderer } from "electron";

const projectMentorApi = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:get-version"),
};

contextBridge.exposeInMainWorld("projectMentor", projectMentorApi);
