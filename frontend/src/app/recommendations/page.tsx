"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { emptyTeamProfile, normalizeTeamProfile } from "@/lib/teamProfile";
import type {
  ProjectRecommendation,
  RecommendationResponse,
  SelectedProject,
  TeamProfile,
} from "@/types/chat";

const teamProfileStorageKey = "projectmentor.teamProfile";
const selectedProjectStorageKey = "projectmentor.selectedProject";

function loadStoredTeamProfile(): TeamProfile {
  if (typeof window === "undefined") {
    return emptyTeamProfile;
  }

  const storedProfile = window.localStorage.getItem(teamProfileStorageKey);

  if (!storedProfile) {
    return emptyTeamProfile;
  }

  try {
    return normalizeTeamProfile(JSON.parse(storedProfile));
  } catch {
    return emptyTeamProfile;
  }
}

function hasProfileData(profile: TeamProfile) {
  return Object.values(profile).some((items) => items.length > 0);
}

function isRecommendationResponse(value: unknown): value is RecommendationResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<RecommendationResponse>;

  return (
    Array.isArray(record.recommendations) &&
    record.recommendations.length === 3 &&
    typeof record.profileSummary === "string" &&
    Array.isArray(record.warnings) &&
    (record.source === "ai" || record.source === "fallback")
  );
}

export default function RecommendationsPage() {
  const [teamProfile] = useState<TeamProfile>(loadStoredTeamProfile);
  const [response, setResponse] = useState<RecommendationResponse | null>(null);
  const [expandedId, setExpandedId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!hasProfileData(teamProfile)) {
      return;
    }

    void requestRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestRecommendations() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const apiResponse = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmedProfile: teamProfile }),
      });

      if (!apiResponse.ok) {
        throw new Error("推荐接口暂时不可用。");
      }

      const data: unknown = await apiResponse.json();

      if (!isRecommendationResponse(data)) {
        throw new Error("推荐接口返回格式不正确。");
      }

      setResponse(data);
      setExpandedId(data.recommendations[0]?.id ?? "");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "生成推荐失败，请稍后重试。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectRecommendation(recommendation: ProjectRecommendation) {
    const selectedProject: SelectedProject = {
      recommendation,
      selectedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      selectedProjectStorageKey,
      JSON.stringify(selectedProject),
    );
    setSelectedId(recommendation.id);
  }

  if (!hasProfileData(teamProfile)) {
    return (
      <main className="min-h-screen bg-zinc-100 px-5 py-10 text-zinc-950">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Project Recommendations
          </p>
          <h1 className="mt-3 text-3xl font-bold">还没有可用于推荐的团队画像</h1>
          <p className="mt-4 text-zinc-600">
            请先回到访谈页，确认并写入团队成员、技能、兴趣、资源等信息。
          </p>
          <Link
            href="/chat"
            className="mt-6 inline-flex rounded-xl bg-zinc-950 px-5 py-3 font-medium text-white transition hover:bg-zinc-800"
          >
            返回访谈页
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6 text-zinc-950 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-zinc-200 bg-white p-5 md:flex-row md:items-start md:justify-between md:rounded-t-2xl md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Project Recommendations
            </p>
            <h1 className="mt-2 text-3xl font-bold">项目方向推荐</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
              {response?.profileSummary ?? summarizeProfile(teamProfile)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/chat"
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
            >
              返回补充画像
            </Link>
            <button
              type="button"
              onClick={() => void requestRecommendations()}
              disabled={isLoading}
              className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {isLoading ? "生成中..." : "重新生成推荐"}
            </button>
          </div>
        </header>

        <section className="bg-white p-5 md:rounded-b-2xl md:p-8">
          {isLoading ? (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-zinc-500">
              正在根据团队画像生成 3 个项目方向...
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              <p>{errorMessage}</p>
              <button
                type="button"
                onClick={() => void requestRecommendations()}
                className="mt-3 rounded-lg bg-red-700 px-3 py-2 font-medium text-white transition hover:bg-red-800"
              >
                重试
              </button>
            </div>
          ) : null}

          {response ? (
            <>
              <div className="mb-5 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-zinc-600">
                  来源：{response.source === "ai" ? "真实 AI" : "本地 fallback"}
                </span>
                {response.warnings.map((warning) => (
                  <span key={warning} className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
                    {warning}
                  </span>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {response.recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    isExpanded={expandedId === recommendation.id}
                    isSelected={selectedId === recommendation.id}
                    onToggle={() =>
                      setExpandedId((currentId) =>
                        currentId === recommendation.id ? "" : recommendation.id,
                      )
                    }
                    onSelect={() => handleSelectRecommendation(recommendation)}
                  />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

type RecommendationCardProps = {
  recommendation: ProjectRecommendation;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
};

function RecommendationCard({
  recommendation,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
}: RecommendationCardProps) {
  return (
    <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">{recommendation.title}</h2>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {difficultyLabel[recommendation.estimatedDifficulty]}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          {recommendation.oneSentenceSummary}
        </p>

        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="font-semibold">预计周期</dt>
            <dd className="text-zinc-600">{recommendation.estimatedDurationWeeks} 周</dd>
          </div>
          <div>
            <dt className="font-semibold">推荐理由</dt>
            <dd className="text-zinc-600">{recommendation.whySuitable.slice(0, 2).join("；")}</dd>
          </div>
          <div>
            <dt className="font-semibold">主要风险</dt>
            <dd className="text-zinc-600">{recommendation.implementationRisk.slice(0, 2).join("；")}</dd>
          </div>
        </dl>

        {isExpanded ? <RecommendationDetails recommendation={recommendation} /> : null}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
        <button
          type="button"
          onClick={onToggle}
          className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
        >
          {isExpanded ? "收起详情" : "查看详情"}
        </button>
        <button
          type="button"
          onClick={onSelect}
          className={
            isSelected
              ? "rounded-xl bg-emerald-700 px-4 py-3 text-sm font-medium text-white"
              : "rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
          }
        >
          {isSelected ? "已选择" : "选择这个方向"}
        </button>
      </div>
    </article>
  );
}

function RecommendationDetails({
  recommendation,
}: {
  recommendation: ProjectRecommendation;
}) {
  return (
    <div className="mt-5 space-y-4 border-t border-zinc-100 pt-4 text-sm">
      <DetailList title="目标用户" items={recommendation.targetUsers} />
      <DetailList title="团队优势" items={recommendation.teamAdvantages} />
      <DetailList title="需要补齐" items={recommendation.missingCapabilities} />
      <DetailList title="所需技能" items={recommendation.requiredSkills} />
      <DetailList title="MVP 核心功能" items={recommendation.coreFeatures} />
      <DetailList title="适合赛道" items={recommendation.recommendedCompetitionTrack} />
      <DetailList title="需要验证" items={recommendation.needsFurtherValidation} />
      <div>
        <h3 className="font-semibold">真实问题</h3>
        <p className="mt-1 leading-6 text-zinc-600">{recommendation.problem}</p>
      </div>
      <div>
        <h3 className="font-semibold">创新潜力</h3>
        <p className="mt-1 leading-6 text-zinc-600">{recommendation.innovationPotential}</p>
      </div>
      <div>
        <h3 className="font-semibold">未来 7 天计划</h3>
        <ol className="mt-2 space-y-2 text-zinc-600">
          {recommendation.nextSevenDaysPlan.map((item) => (
            <li key={item.day}>
              Day {item.day}: {item.task}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1 text-zinc-600">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function summarizeProfile(profile: TeamProfile) {
  return [
    `成员与专业：${joinOrFallback(profile.membersAndMajors, "未确认")}`,
    `技能：${joinOrFallback(profile.skills, "未确认")}`,
    `兴趣：${joinOrFallback(profile.interests, "未确认")}`,
    `比赛与目标：${joinOrFallback([...profile.competitions, ...profile.targetAwards], "未确认")}`,
  ].join("；");
}

function joinOrFallback(items: string[], fallback: string) {
  return items.length > 0 ? items.join("、") : fallback;
}

const difficultyLabel = {
  low: "稳妥",
  medium: "平衡",
  high: "挑战",
} satisfies Record<ProjectRecommendation["estimatedDifficulty"], string>;
