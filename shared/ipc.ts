import type {
  InterviewApiRequest,
  InterviewApiResponse,
  RecommendationRequest,
  RecommendationResponse,
} from "./types";

export type DesktopIpcError = {
  code: "INVALID_REQUEST" | "INVALID_RESPONSE" | "INTERNAL_ERROR";
  message: string;
};

export type DesktopIpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DesktopIpcError };

export type ProjectMentorDesktopApi = {
  getAppVersion(): Promise<string>;
  interview(request: InterviewApiRequest): Promise<InterviewApiResponse>;
  getRecommendations(
    request: RecommendationRequest,
  ): Promise<RecommendationResponse>;
};
