import { createLocalInterviewResult } from "@/lib/interviewFallback";
import { createLocalRecommendationResult } from "@/lib/recommendationFallback";
import type {
  InterviewApiRequest,
  InterviewApiResponse,
  RecommendationRequest,
  RecommendationResponse,
} from "@/types/chat";

export async function interview(
  request: InterviewApiRequest,
): Promise<InterviewApiResponse> {
  if (typeof window !== "undefined" && window.projectMentor) {
    return window.projectMentor.interview(request);
  }

  return createLocalInterviewResult(request.message, request.confirmedProfile);
}

export async function getRecommendations(
  request: RecommendationRequest,
): Promise<RecommendationResponse> {
  if (typeof window !== "undefined" && window.projectMentor) {
    return window.projectMentor.getRecommendations(request);
  }

  return createLocalRecommendationResult(request.confirmedProfile);
}
