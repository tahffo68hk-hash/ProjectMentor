import { createLocalInterviewResult } from "@/lib/interviewFallback";
import { normalizeTeamProfile, teamProfileSections } from "@/lib/teamProfile";
import type {
  InterviewApiRequest,
  InterviewApiResponse,
  PendingProfile,
  TeamProfileSectionKey,
} from "@/types/chat";

type ProviderResult = {
  result: InterviewApiResponse;
  usedFallback: boolean;
  error?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const responseFormatInstruction = `
你是 ProjectMentor 的 AI 创业导师，只做团队访谈，不生成项目推荐。

访谈规则：
1. 目标是在 5 到 8 轮对话中了解团队。
2. 每次最多追问两个相关问题。
3. 已确认的信息不得重复询问。
4. 不允许猜测用户没有提供的信息。
5. 信息模糊时应追问。
6. 每轮可以给出一句简短、有帮助的团队观察。
7. 提取的信息只能进入 pendingProfile，不能直接修改 confirmedProfile。
8. 如果没有提取到有效新信息，pendingProfile 应为空对象。
9. 信息足够后将 interviewComplete 设置为 true。
10. 当前阶段不生成项目推荐。

至少需要了解：
团队人数、成员专业、每位成员的技能、既往项目经验、兴趣领域、目标比赛、比赛截止时间、每周可投入时间、预算、导师/实验室/数据/设备/企业合作等资源、目标奖项、风险偏好。

只返回 JSON，不要返回 Markdown。格式如下：
{
  "reply": "AI 下一条访谈回复",
  "observations": ["对团队的简短观察"],
  "pendingProfile": {
    "membersAndMajors": [],
    "skills": [],
    "interests": [],
    "competitions": [],
    "resources": [],
    "timeAndBudget": [],
    "targetAwards": []
  },
  "missingFields": ["仍然缺失的重要信息"],
  "interviewComplete": false
}
`;

export async function runInterviewProvider(
  request: InterviewApiRequest,
): Promise<ProviderResult> {
  if (shouldUseMockMode()) {
    return {
      result: createLocalInterviewResult(request.message, request.confirmedProfile),
      usedFallback: true,
    };
  }

  try {
    const result = await callConfiguredModel(request);
    return { result, usedFallback: false };
  } catch (error) {
    return {
      result: createLocalInterviewResult(request.message, request.confirmedProfile),
      usedFallback: true,
      error: error instanceof Error ? error.message : "Unknown AI provider error",
    };
  }
}

function shouldUseMockMode() {
  return (
    process.env.AI_MOCK_MODE === "true" ||
    !process.env.AI_API_KEY ||
    !process.env.AI_BASE_URL ||
    !process.env.AI_MODEL
  );
}

async function callConfiguredModel(
  request: InterviewApiRequest,
): Promise<InterviewApiResponse> {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("AI environment variables are incomplete.");
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: responseFormatInstruction },
        {
          role: "user",
          content: JSON.stringify({
            message: request.message,
            recentMessages: request.messages.slice(-10),
            confirmedProfile: request.confirmedProfile,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI provider returned ${response.status}.`);
  }

  const completion = (await response.json()) as ChatCompletionResponse;
  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned empty content.");
  }

  return parseInterviewResponse(content);
}

function parseInterviewResponse(content: string): InterviewApiResponse {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI provider returned invalid JSON.");
  }

  if (!isInterviewApiResponse(parsed)) {
    throw new Error("AI provider returned an invalid interview response.");
  }

  return {
    reply: parsed.reply,
    observations: parsed.observations,
    pendingProfile: normalizePendingProfile(parsed.pendingProfile),
    missingFields: parsed.missingFields,
    interviewComplete: parsed.interviewComplete,
  };
}

export function isInterviewApiResponse(value: unknown): value is InterviewApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<InterviewApiResponse>;

  return (
    typeof record.reply === "string" &&
    Array.isArray(record.observations) &&
    record.observations.every((item) => typeof item === "string") &&
    isPendingProfile(record.pendingProfile) &&
    Array.isArray(record.missingFields) &&
    record.missingFields.every((item) => typeof item === "string") &&
    typeof record.interviewComplete === "boolean"
  );
}

function isPendingProfile(value: unknown): value is PendingProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return Object.entries(record).every(([key, items]) => {
    return (
      teamProfileSections.includes(key as TeamProfileSectionKey) &&
      Array.isArray(items) &&
      items.every((item) => typeof item === "string")
    );
  });
}

function normalizePendingProfile(profile: PendingProfile): PendingProfile {
  const normalized: PendingProfile = {};

  teamProfileSections.forEach((section) => {
    const items = profile[section]?.filter((item) => item.trim().length > 0) ?? [];

    if (items.length > 0) {
      normalized[section] = Array.from(new Set(items));
    }
  });

  return normalized;
}

export function normalizeConfirmedProfile(value: unknown) {
  return normalizeTeamProfile(value);
}
