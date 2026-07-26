import {
  extractPendingProfileItems,
  profileSectionLabels,
  teamProfileSections,
} from "./teamProfile";
import type {
  InterviewApiResponse,
  PendingProfile,
  PendingProfileItem,
  TeamProfile,
} from "./types";

export function pendingItemsToProfile(items: PendingProfileItem[]): PendingProfile {
  return items.reduce<PendingProfile>((profile, item) => {
    const currentItems = profile[item.section] ?? [];
    profile[item.section] = currentItems.includes(item.text)
      ? currentItems
      : [...currentItems, item.text];

    return profile;
  }, {});
}

export function pendingProfileToItems(profile: PendingProfile): PendingProfileItem[] {
  return teamProfileSections.flatMap((section) =>
    (profile[section] ?? []).map((text) => ({
      id: `${section}-${text}`,
      section,
      text,
    })),
  );
}

export function createLocalInterviewResult(
  message: string,
  confirmedProfile: TeamProfile,
): InterviewApiResponse {
  const pendingItems = extractPendingProfileItems(message).filter(
    (item) => !confirmedProfile[item.section].includes(item.text),
  );
  const missingFields = teamProfileSections
    .filter((section) => confirmedProfile[section].length === 0)
    .map((section) => profileSectionLabels[section]);

  return {
    reply: createLocalReply(pendingItems, missingFields),
    observations: createLocalObservations(pendingItems),
    pendingProfile: pendingItemsToProfile(pendingItems),
    missingFields,
    interviewComplete: missingFields.length <= 1,
  };
}

function createLocalReply(
  pendingItems: PendingProfileItem[],
  missingFields: string[],
) {
  const nextQuestions = missingFields.slice(0, 2);

  if (pendingItems.length === 0) {
    return [
      "我还没有识别到明确的新画像信息。",
      nextQuestions.length > 0
        ? `可以继续补充：${nextQuestions.join("、")}。`
        : "目前信息已经比较完整，可以进入后续分析阶段。",
    ].join("\n\n");
  }

  return [
    `我提取到了 ${pendingItems.length} 条候选画像信息，已放入待确认卡片。`,
    nextQuestions.length > 0
      ? `为了继续完善团队画像，我还想了解：${nextQuestions.join("、")}。`
      : "团队画像已经比较完整，确认候选信息后可以进入下一步。",
  ].join("\n\n");
}

function createLocalObservations(pendingItems: PendingProfileItem[]) {
  if (pendingItems.length === 0) {
    return ["本轮输入暂时没有形成明确的新画像信息。"];
  }

  return ["本轮输入包含可结构化的团队信息，建议先确认后再进入正式画像。"];
}
