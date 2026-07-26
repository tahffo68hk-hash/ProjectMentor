import { teamProfileSections } from "./teamProfile";
import type {
  ApiChatMessage,
  InterviewApiRequest,
  InterviewApiResponse,
  PendingProfile,
  ProjectRecommendation,
  RecommendationRequest,
  RecommendationResponse,
  TeamProfile,
  TeamProfileSectionKey,
} from "./types";

export function parseInterviewRequest(value: unknown): InterviewApiRequest | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.message !== "string" ||
    value.message.trim().length === 0 ||
    !Array.isArray(value.messages) ||
    !value.messages.every(isApiChatMessage) ||
    !isTeamProfile(value.confirmedProfile)
  ) {
    return null;
  }

  return {
    message: value.message,
    messages: value.messages,
    confirmedProfile: value.confirmedProfile,
  };
}

export function parseRecommendationRequest(
  value: unknown,
): RecommendationRequest | null {
  if (!isRecord(value) || !isTeamProfile(value.confirmedProfile)) {
    return null;
  }

  return { confirmedProfile: value.confirmedProfile };
}

export function isInterviewApiResponse(
  value: unknown,
): value is InterviewApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.reply === "string" &&
    isStringArray(value.observations) &&
    isPendingProfile(value.pendingProfile) &&
    isStringArray(value.missingFields) &&
    typeof value.interviewComplete === "boolean"
  );
}

export function isRecommendationResponse(
  value: unknown,
): value is RecommendationResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.recommendations) &&
    value.recommendations.length === 3 &&
    value.recommendations.every(isProjectRecommendation) &&
    typeof value.profileSummary === "string" &&
    isStringArray(value.warnings) &&
    (value.source === "ai" || value.source === "fallback")
  );
}

function isTeamProfile(value: unknown): value is TeamProfile {
  if (!isRecord(value)) {
    return false;
  }

  return teamProfileSections.every((section) => isStringArray(value[section]));
}

function isApiChatMessage(value: unknown): value is ApiChatMessage {
  return (
    isRecord(value) &&
    (value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string"
  );
}

function isPendingProfile(value: unknown): value is PendingProfile {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([key, items]) =>
      teamProfileSections.includes(key as TeamProfileSectionKey) &&
      isStringArray(items),
  );
}

function isProjectRecommendation(value: unknown): value is ProjectRecommendation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.oneSentenceSummary === "string" &&
    typeof value.problem === "string" &&
    isStringArray(value.targetUsers) &&
    isStringArray(value.whySuitable) &&
    isStringArray(value.teamAdvantages) &&
    isStringArray(value.missingCapabilities) &&
    isStringArray(value.requiredSkills) &&
    isStringArray(value.coreFeatures) &&
    (value.estimatedDifficulty === "low" ||
      value.estimatedDifficulty === "medium" ||
      value.estimatedDifficulty === "high") &&
    typeof value.estimatedDurationWeeks === "number" &&
    typeof value.estimatedBudget === "string" &&
    typeof value.innovationPotential === "string" &&
    isStringArray(value.implementationRisk) &&
    isStringArray(value.recommendedCompetitionTrack) &&
    Array.isArray(value.nextSevenDaysPlan) &&
    value.nextSevenDaysPlan.every(
      (item) =>
        isRecord(item) &&
        typeof item.day === "number" &&
        typeof item.task === "string",
    ) &&
    isStringArray(value.needsFurtherValidation)
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}
