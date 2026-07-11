"use client";

import { useEffect, useState } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import PendingProfileCard from "@/components/PendingProfileCard";
import TeamProfile from "@/components/TeamProfile";
import {
  emptyTeamProfile,
  extractPendingProfileItems,
  mergeConfirmedItems,
  normalizeTeamProfile,
} from "@/lib/teamProfile";
import type {
  ChatMessage as ChatMessageType,
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

function createMentorReply(pendingItems: PendingProfileItem[]): string {
  if (pendingItems.length === 0) {
    return "我还没有识别到明确的团队画像信息。你可以补充专业、技能、比赛、资源、预算或目标奖项，我会先生成待确认画像。";
  }

  return `我提取到了 ${pendingItems.length} 条候选画像信息，已经放到下方待确认卡片里。\n\n你可以先修改、删除不准确的内容，再点击“确认写入”。`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [input, setInput] = useState("");
  const [teamProfile, setTeamProfile] = useState<TeamProfileType>(emptyTeamProfile);
  const [pendingItems, setPendingItems] = useState<PendingProfileItem[]>([]);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  useEffect(() => {
    const storedProfile = window.localStorage.getItem(teamProfileStorageKey);

    if (storedProfile) {
      try {
        setTeamProfile(normalizeTeamProfile(JSON.parse(storedProfile)));
      } catch {
        setTeamProfile(emptyTeamProfile);
      }
    }

    setHasLoadedProfile(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedProfile) {
      return;
    }

    window.localStorage.setItem(teamProfileStorageKey, JSON.stringify(teamProfile));
  }, [hasLoadedProfile, teamProfile]);

  function handleSendMessage() {
    const content = input.trim();

    if (!content) {
      return;
    }

    const extractedItems = extractPendingProfileItems(content);
    const timestamp = Date.now();
    const userMessage: ChatMessageType = {
      id: timestamp,
      role: "user",
      content,
    };
    const mentorReply: ChatMessageType = {
      id: timestamp + 1,
      role: "mentor",
      content: createMentorReply(extractedItems),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage, mentorReply]);
    setPendingItems(extractedItems);
    setInput("");
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
            <h1 className="mt-2 text-2xl font-bold">AI 创业导师</h1>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto bg-zinc-50 px-5 py-6 md:px-8">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            <PendingProfileCard
              items={pendingItems}
              onConfirm={handleConfirmPendingProfile}
              onCancel={() => setPendingItems([])}
              onDeleteItem={handleDeletePendingItem}
              onUpdateItem={handleUpdatePendingItem}
              onChangeSection={handleChangePendingItemSection}
            />
          </div>

          <ChatInput value={input} onChange={setInput} onSubmit={handleSendMessage} />
        </section>

        <TeamProfile profile={teamProfile} />
      </div>
    </main>
  );
}
