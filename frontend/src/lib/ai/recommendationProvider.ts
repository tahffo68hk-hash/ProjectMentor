import { createLocalRecommendationResult } from "@/lib/recommendationFallback";
import { normalizeTeamProfile } from "@/lib/teamProfile";
import type {
  ProjectRecommendation,
  RecommendationRequest,
  RecommendationResponse,
} from "@/types/chat";

type ProviderResult = {
  result: RecommendationResponse;
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

const recommendationInstruction = `
你是 ProjectMentor 的项目方向推荐助手。只做项目立项方向推荐，不生成商业计划书、PPT、市场报告或答辩材料。

推荐规则：
1. 必须依据 TeamProfile 推荐，不得生成与团队能力、资源和时间明显不匹配的项目。
2. 三个方向必须明显不同，不能只是名称不同。
3. 至少包含一个稳妥易落地、一个平衡创新性与可实现性、一个更具挑战性的方向。
4. 如果团队时间少、预算低或技术能力有限，应降低实现复杂度。
5. 如果缺少行业资源，不得假设用户拥有医院、企业、数据集等条件。
6. 不得虚构市场规模、论文数量、专利数量或获奖概率。
7. 不要承诺“国奖”“高获奖率”等结果。
8. 无法确认的信息写入 needsFurtherValidation。
9. 推荐项目必须能在学生团队能力范围内做出可演示 MVP。
10. 当前阶段只做项目立项方向。

只返回 JSON，不要返回 Markdown。必须返回：
{
  "recommendations": [
    {
      "id": "stable-id",
      "title": "项目暂定名称",
      "oneSentenceSummary": "一句话说明",
      "problem": "真实问题",
      "targetUsers": ["目标用户"],
      "whySuitable": ["为什么适合团队"],
      "teamAdvantages": ["团队已有优势"],
      "missingCapabilities": ["短板或需要补充的资源"],
      "requiredSkills": ["实现所需技能"],
      "coreFeatures": ["MVP 核心功能"],
      "estimatedDifficulty": "low",
      "estimatedDurationWeeks": 4,
      "estimatedBudget": "预算区间或说明",
      "innovationPotential": "创新潜力说明",
      "implementationRisk": ["落地风险"],
      "recommendedCompetitionTrack": ["适合赛道"],
      "nextSevenDaysPlan": [{"day": 1, "task": "第一天任务"}],
      "needsFurtherValidation": ["需要验证的事项"]
    }
  ],
  "profileSummary": "用于推荐的团队画像摘要",
  "warnings": ["重要提醒"],
  "source": "ai"
}
`;

export async function runRecommendationProvider(
  request: RecommendationRequest,
): Promise<ProviderResult> {
  if (shouldUseMockMode()) {
    return {
      result: createLocalRecommendationResult(request.confirmedProfile),
      usedFallback: true,
    };
  }

  try {
    const result = await callConfiguredModel(request);
    return { result, usedFallback: false };
  } catch (error) {
    return {
      result: createLocalRecommendationResult(request.confirmedProfile),
      usedFallback: true,
      error: error instanceof Error ? error.message : "Unknown recommendation provider error",
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
  request: RecommendationRequest,
): Promise<RecommendationResponse> {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("AI environment variables are incomplete.");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: recommendationInstruction },
        {
          role: "user",
          content: JSON.stringify({
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

  return parseRecommendationResponse(content);
}

function parseRecommendationResponse(content: string): RecommendationResponse {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI provider returned invalid JSON.");
  }

  if (!isRecommendationResponse(parsed)) {
    throw new Error("AI provider returned an invalid recommendation response.");
  }

  return {
    recommendations: parsed.recommendations,
    profileSummary: parsed.profileSummary,
    warnings: parsed.warnings,
    source: "ai",
  };
}

export function isRecommendationResponse(value: unknown): value is RecommendationResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<RecommendationResponse>;

  return (
    Array.isArray(record.recommendations) &&
    record.recommendations.length === 3 &&
    record.recommendations.every(isProjectRecommendation) &&
    typeof record.profileSummary === "string" &&
    Array.isArray(record.warnings) &&
    record.warnings.every((item) => typeof item === "string") &&
    (record.source === "ai" || record.source === "fallback")
  );
}

function isProjectRecommendation(value: unknown): value is ProjectRecommendation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<ProjectRecommendation>;

  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.oneSentenceSummary === "string" &&
    typeof record.problem === "string" &&
    isStringArray(record.targetUsers) &&
    isStringArray(record.whySuitable) &&
    isStringArray(record.teamAdvantages) &&
    isStringArray(record.missingCapabilities) &&
    isStringArray(record.requiredSkills) &&
    isStringArray(record.coreFeatures) &&
    (record.estimatedDifficulty === "low" ||
      record.estimatedDifficulty === "medium" ||
      record.estimatedDifficulty === "high") &&
    typeof record.estimatedDurationWeeks === "number" &&
    typeof record.estimatedBudget === "string" &&
    typeof record.innovationPotential === "string" &&
    isStringArray(record.implementationRisk) &&
    isStringArray(record.recommendedCompetitionTrack) &&
    Array.isArray(record.nextSevenDaysPlan) &&
    record.nextSevenDaysPlan.every(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.day === "number" &&
        typeof item.task === "string",
    ) &&
    isStringArray(record.needsFurtherValidation)
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function normalizeRecommendationProfile(value: unknown) {
  return normalizeTeamProfile(value);
}
