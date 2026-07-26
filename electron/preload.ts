import { contextBridge, ipcRenderer } from "electron";
import type { DesktopIpcResult, ProjectMentorDesktopApi } from "../shared/ipc";
import type {
  InterviewApiRequest,
  InterviewApiResponse,
  RecommendationRequest,
  RecommendationResponse,
} from "../shared/types";

const projectMentorApi: ProjectMentorDesktopApi = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:get-version"),
  interview: (request: InterviewApiRequest): Promise<InterviewApiResponse> =>
    invokeDesktop("projectmentor:interview", request),
  getRecommendations: (
    request: RecommendationRequest,
  ): Promise<RecommendationResponse> =>
    invokeDesktop("projectmentor:recommendations", request),
};

contextBridge.exposeInMainWorld("projectMentor", projectMentorApi);

async function invokeDesktop<T>(channel: string, request: unknown): Promise<T> {
  const result = (await ipcRenderer.invoke(channel, request)) as DesktopIpcResult<T>;

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  return result.data;
}
