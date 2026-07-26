import { app, ipcMain, type IpcMainInvokeEvent } from "electron";
import { createLocalInterviewResult } from "../shared/interviewFallback";
import { createLocalRecommendationResult } from "../shared/recommendationFallback";
import type { DesktopIpcResult } from "../shared/ipc";
import type {
  InterviewApiResponse,
  RecommendationResponse,
} from "../shared/types";
import {
  isInterviewApiResponse,
  isRecommendationResponse,
  parseInterviewRequest,
  parseRecommendationRequest,
} from "../shared/validators";

const INTERVIEW_CHANNEL = "projectmentor:interview";
const RECOMMENDATIONS_CHANNEL = "projectmentor:recommendations";

export function registerProjectMentorIpc(): void {
  ipcMain.handle("app:get-version", (event) => {
    if (!isTrustedRenderer(event)) {
      throw new Error("请求来源不受信任。");
    }

    return app.getVersion();
  });

  ipcMain.handle(INTERVIEW_CHANNEL, (event, value: unknown) => {
    if (!isTrustedRenderer(event)) {
      return failure("INVALID_REQUEST", "请求来源不受信任。");
    }

    const request = parseInterviewRequest(value);

    if (!request) {
      return failure("INVALID_REQUEST", "访谈请求格式不正确。");
    }

    try {
      const response = createLocalInterviewResult(
        request.message,
        request.confirmedProfile,
      );

      return isInterviewApiResponse(response)
        ? success(response)
        : failure("INVALID_RESPONSE", "本地访谈结果格式不正确。");
    } catch {
      return failure("INTERNAL_ERROR", "本地访谈暂时无法处理，请稍后重试。");
    }
  });

  ipcMain.handle(RECOMMENDATIONS_CHANNEL, (event, value: unknown) => {
    if (!isTrustedRenderer(event)) {
      return failure("INVALID_REQUEST", "请求来源不受信任。");
    }

    const request = parseRecommendationRequest(value);

    if (!request) {
      return failure("INVALID_REQUEST", "推荐请求格式不正确。");
    }

    try {
      const response = createLocalRecommendationResult(request.confirmedProfile);

      return isRecommendationResponse(response)
        ? success(response)
        : failure("INVALID_RESPONSE", "本地推荐结果格式不正确。");
    } catch {
      return failure("INTERNAL_ERROR", "本地推荐暂时无法生成，请稍后重试。");
    }
  });
}

function isTrustedRenderer(event: IpcMainInvokeEvent): boolean {
  try {
    const url = new URL(event.senderFrame.url);

    return appIsDevelopmentUrl(url) || appIsProductionUrl(url);
  } catch {
    return false;
  }
}

function appIsDevelopmentUrl(url: URL): boolean {
  return url.protocol === "http:" && url.host === "localhost:3000";
}

function appIsProductionUrl(url: URL): boolean {
  return url.protocol === "app:" && url.host === "projectmentor";
}

function success<T>(data: T): DesktopIpcResult<T> {
  return { ok: true, data };
}

function failure<T>(
  code: "INVALID_REQUEST" | "INVALID_RESPONSE" | "INTERNAL_ERROR",
  message: string,
): DesktopIpcResult<T> {
  return { ok: false, error: { code, message } };
}
