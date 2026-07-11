"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import PendingProfileCard from "@/components/PendingProfileCard";
import TeamProfile from "@/components/TeamProfile";
import {
  createLocalInterviewResult,
  pendingProfileToItems,
} from "@/lib/interviewFallback";
import {
  emptyTeamProfile,
  mergeConfirmedItems,
  normalizeTeamProfile,
} from "@/lib/teamProfile";
import type {
  ApiChatMessage,
  ChatMessage as ChatMessageType,
  InterviewApiResponse,
  PendingProfileItem,
  TeamProfile as TeamProfileType,
  TeamProfileSectionKey,
} from "@/types/chat";

const teamProfileStorageKey = "projectmentor.teamProfile";

const initialMessages: ChatMessageType[] = [
  {
    id: 1,
    role: "mentor",
    content:
      "你好！我是 ProjectMentor 的 AI 创业导师。在推荐项目之前，我想先了解一下你的团队。\n\n你可以先介绍：团队有几个人、分别是什么专业、擅长什么技能、有什么资源、预算和目标奖项。",
  },
];

type RetryPayload = {
  message: string;
  messages: ApiChatMessage[];
  confirmedProfile: TeamProfileType;
};

function loadStoredTeamProfile(): TeamProfileType {
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

function toApiMessages(messages: ChatMessageType[]): ApiChatMessage[] {
  return messages.map((message) => ({
    role: message.role === "mentor" ? "assistant" : "user",
    content: message.content,
  }));
}

function isInterviewApiResponse(value: unknown): value is InterviewApiResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<InterviewApiResponse>;

  return (
    typeof record.reply === "string" &&
    Array.isArray(record.observations) &&
    record.observations.every((item) => typeof item === "string") &&
    !!record.pendingProfile &&
    typeof record.pendingProfile === "object" &&
    Array.isArray(record.missingFields) &&
    record.missingFields.every((item) => typeof item === "string") &&
    typeof record.interviewComplete === "boolean"
  );
}

function getRecommendationMissingFields(profile: TeamProfileType) {
  const missingFields: string[] = [];

  if (profile.membersAndMajors.length === 0) missingFields.push("成员与专业");
  if (profile.skills.length === 0) missingFields.push("技能");
  if (profile.interests.length === 0) missingFields.push("兴趣方向");
  if (profile.competitions.length === 0 && profile.targetAwards.length === 0) {
    missingFields.push("比赛或目标奖项");
  }
  if (profile.resources.length === 0 && profile.timeAndBudget.length === 0) {
    missingFields.push("可用资源或时间预算");
  }

  return missingFields;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [input, setInput] = useState("");
  const [teamProfile, setTeamProfile] = useState<TeamProfileType>(loadStoredTeamProfile);
  const [pendingItems, setPendingItems] = useState<PendingProfileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [retryPayload, setRetryPayload] = useState<RetryPayload | null>(null);
  const recommendationMissingFields = getRecommendationMissingFields(teamProfile);
  const canViewRecommendations = recommendationMissingFields.length === 0;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(teamProfileStorageKey, JSON.stringify(teamProfile));
  }, [teamProfile]);

  async function requestInterview(payload: RetryPayload) {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("访谈接口暂时不可用。");
      }

      const data: unknown = await response.json();

      if (!isInterviewApiResponse(data)) {
        throw new Error("访谈接口返回格式不正确。");
      }

      applyInterviewResult(data);
      setRetryPayload(null);
    } catch (error) {
      const fallbackResult = createLocalInterviewResult(
        payload.message,
        payload.confirmedProfile,
      );

      applyInterviewResult(fallbackResult);
      setRetryPayload(payload);
      setErrorMessage(
        error instanceof Error
          ? `${error.message} 已自动使用本地模拟结果。`
          : "请求失败，已自动使用本地模拟结果。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function applyInterviewResult(result: InterviewApiResponse) {
    const timestamp = Date.now();
    const observationText =
      result.observations.length > 0
        ? `\n\n观察：${result.observations.join("；")}`
        : "";
    const completionText = result.interviewComplete
      ? "\n\n团队访谈信息已经比较完整。"
      : "";

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: timestamp,
        role: "mentor",
        content: `${result.reply}${observationText}${completionText}`,
      },
    ]);
    setPendingItems(pendingProfileToItems(result.pendingProfile));
  }

  function handleSendMessage() {
    const content = input.trim();

    if (!content || isLoading) {
      return;
    }

    const userMessage: ChatMessageType = {
      id: Date.now(),
      role: "user",
      content,
    };
    const nextMessages = [...messages, userMessage];
    const payload: RetryPayload = {
      message: content,
      messages: toApiMessages(nextMessages).slice(-10),
      confirmedProfile: teamProfile,
    };

    setMessages(nextMessages);
    setPendingItems([]);
    setInput("");
    void requestInterview(payload);
  }

  function handleRetry() {
    if (!retryPayload || isLoading) {
      return;
    }

    void requestInterview(retryPayload);
  }

  function handleConfirmPendingProfile() {
    setTeamProfile((currentProfile) => mergeConfirmedItems(currentProfile, pendingItems));
    setPendingItems([]);
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        role: "mentor",
        content: "已确认，正式团队画像已更新并保存到本地。页面刷新后也会恢复这些信息。",
      },
    ]);
  }

  function handleDeletePendingItem(id: string) {
    setPendingItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }

  function handleUpdatePendingItem(id: string, text: string) {
    setPendingItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, text } : item)),
    );
  }

  function handleChangePendingItemSection(id: string, section: TeamProfileSectionKey) {
    setPendingItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, section } : item)),
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-7xl border-x border-zinc-200 bg-white">
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-zinc-200 bg-white px-5 py-5 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              ProjectMentor Interview
            </p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold">AI 创业导师</h1>
                {canViewRecommendations ? (
                  <p className="mt-2 text-sm text-emerald-700">
                    团队画像已足够生成第一版项目方向，你仍然可以继续补充信息。
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">
                    距离推荐还缺：{recommendationMissingFields.join("、")}。
                  </p>
                )}
              </div>

              {canViewRecommendations ? (
                <Link
                  href="/recommendations"
                  className="inline-flex rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
                >
                  查看项目推荐
                </Link>
              ) : null}
            </div>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto bg-zinc-50 px-5 py-6 md:px-8">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-500 shadow-sm">
                正在生成下一条访谈问题...
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p>{errorMessage}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isLoading || !retryPayload}
                  className="mt-3 rounded-lg bg-red-700 px-3 py-2 font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  重试真实接口
                </button>
              </div>
            ) : null}

            <PendingProfileCard
              items={pendingItems}
              onConfirm={handleConfirmPendingProfile}
              onCancel={() => setPendingItems([])}
              onDeleteItem={handleDeletePendingItem}
              onUpdateItem={handleUpdatePendingItem}
              onChangeSection={handleChangePendingItemSection}
            />
          </div>

          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSendMessage}
            disabled={isLoading}
          />
        </section>

        <TeamProfile profile={teamProfile} />
      </div>
    </main>
  );
}
