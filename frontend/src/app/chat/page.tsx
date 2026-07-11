"use client";

import { useState } from "react";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import TeamProfile from "@/components/TeamProfile";
import type { ChatMessage as ChatMessageType, TeamProfile as TeamProfileType } from "@/types/chat";

const initialMessages: ChatMessageType[] = [
  {
    id: 1,
    role: "mentor",
    content:
      "你好！我是 ProjectMentor 的 AI 创业导师。在推荐项目之前，我想先了解一下你的团队。\n\n你可以先介绍：团队有几个人、分别是什么专业、擅长什么技能、准备参加什么比赛。",
  },
];

const initialProfile: TeamProfileType = {
  membersAndMajors: [],
  skills: [],
  interests: [],
  competitions: [],
  resources: [],
  timeAndBudget: [],
  targetAwards: [],
};

const profileRules: Record<keyof TeamProfileType, Array<{ keyword: string; label: string }>> = {
  membersAndMajors: [
    { keyword: "计算机", label: "计算机相关专业成员" },
    { keyword: "软件", label: "软件工程相关成员" },
    { keyword: "临床", label: "临床医学专业成员" },
    { keyword: "医学", label: "医学相关专业成员" },
    { keyword: "自动化", label: "自动化专业成员" },
    { keyword: "机械", label: "机械相关专业成员" },
    { keyword: "电子", label: "电子信息相关成员" },
    { keyword: "设计", label: "设计相关成员" },
    { keyword: "经管", label: "经管相关成员" },
  ],
  skills: [
    { keyword: "Python", label: "Python" },
    { keyword: "Java", label: "Java" },
    { keyword: "C++", label: "C++" },
    { keyword: "前端", label: "前端开发" },
    { keyword: "后端", label: "后端开发" },
    { keyword: "机器学习", label: "机器学习" },
    { keyword: "深度学习", label: "深度学习" },
    { keyword: "大模型", label: "大模型应用" },
    { keyword: "UI", label: "UI 设计" },
    { keyword: "市场", label: "市场分析" },
  ],
  interests: [
    { keyword: "医疗", label: "医疗健康" },
    { keyword: "教育", label: "教育科技" },
    { keyword: "农业", label: "智慧农业" },
    { keyword: "机器人", label: "机器人" },
    { keyword: "新能源", label: "新能源" },
    { keyword: "低空", label: "低空经济" },
    { keyword: "人工智能", label: "人工智能" },
  ],
  competitions: [
    { keyword: "互联网+", label: "中国国际大学生创新大赛" },
    { keyword: "挑战杯", label: "挑战杯" },
    { keyword: "创青春", label: "创青春" },
    { keyword: "校赛", label: "校赛" },
    { keyword: "省赛", label: "省赛" },
    { keyword: "国赛", label: "国赛" },
  ],
  resources: [
    { keyword: "实验室", label: "实验室资源" },
    { keyword: "导师", label: "导师指导" },
    { keyword: "医院", label: "医院场景资源" },
    { keyword: "企业", label: "企业合作资源" },
    { keyword: "数据", label: "数据资源" },
    { keyword: "专利", label: "专利或技术积累" },
  ],
  timeAndBudget: [
    { keyword: "一个月", label: "时间：约一个月" },
    { keyword: "三个月", label: "时间：约三个月" },
    { keyword: "半年", label: "时间：约半年" },
    { keyword: "预算", label: "已提到预算" },
    { keyword: "经费", label: "已提到经费" },
    { keyword: "没钱", label: "预算有限" },
  ],
  targetAwards: [
    { keyword: "金奖", label: "目标：金奖" },
    { keyword: "银奖", label: "目标：银奖" },
    { keyword: "铜奖", label: "目标：铜奖" },
    { keyword: "一等奖", label: "目标：一等奖" },
    { keyword: "二等奖", label: "目标：二等奖" },
    { keyword: "三等奖", label: "目标：三等奖" },
  ],
};

function addUniqueItem(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}

function extractTeamProfile(text: string, currentProfile: TeamProfileType): TeamProfileType {
  const nextProfile: TeamProfileType = {
    membersAndMajors: [...currentProfile.membersAndMajors],
    skills: [...currentProfile.skills],
    interests: [...currentProfile.interests],
    competitions: [...currentProfile.competitions],
    resources: [...currentProfile.resources],
    timeAndBudget: [...currentProfile.timeAndBudget],
    targetAwards: [...currentProfile.targetAwards],
  };

  const lowerText = text.toLowerCase();

  Object.entries(profileRules).forEach(([sectionKey, rules]) => {
    const key = sectionKey as keyof TeamProfileType;

    rules.forEach(({ keyword, label }) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        nextProfile[key] = addUniqueItem(nextProfile[key], label);
      }
    });
  });

  return nextProfile;
}

function createMentorReply(profile: TeamProfileType): string {
  const missingQuestions: Array<{ isMissing: boolean; question: string }> = [
    { isMissing: profile.membersAndMajors.length === 0, question: "团队成员分别是什么专业？" },
    { isMissing: profile.skills.length === 0, question: "你们最拿手的技术或能力是什么？" },
    { isMissing: profile.interests.length === 0, question: "你们更想做哪个方向的项目？" },
    { isMissing: profile.competitions.length === 0, question: "准备参加哪类比赛？" },
    { isMissing: profile.resources.length === 0, question: "目前有哪些导师、实验室、企业或数据资源？" },
    { isMissing: profile.timeAndBudget.length === 0, question: "你们大概有多少时间和预算？" },
    { isMissing: profile.targetAwards.length === 0, question: "目标奖项是什么？" },
  ];

  const nextQuestion = missingQuestions.find((item) => item.isMissing)?.question;

  if (!nextQuestion) {
    return "信息已经比较完整了。下一步我可以根据团队画像，帮你们筛选更适合的创新创业项目方向。";
  }

  return `收到，我已经根据你的回答更新了右侧团队画像。\n\n为了继续判断项目方向，下一步想了解：${nextQuestion}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>(initialMessages);
  const [input, setInput] = useState("");
  const [teamProfile, setTeamProfile] = useState<TeamProfileType>(initialProfile);

  function handleSendMessage() {
    const content = input.trim();

    if (!content) {
      return;
    }

    const updatedProfile = extractTeamProfile(content, teamProfile);
    const timestamp = Date.now();
    const userMessage: ChatMessageType = {
      id: timestamp,
      role: "user",
      content,
    };
    const mentorReply: ChatMessageType = {
      id: timestamp + 1,
      role: "mentor",
      content: createMentorReply(updatedProfile),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage, mentorReply]);
    setTeamProfile(updatedProfile);
    setInput("");
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
          </div>

          <ChatInput value={input} onChange={setInput} onSubmit={handleSendMessage} />
        </section>

        <TeamProfile profile={teamProfile} />
      </div>
    </main>
  );
}
