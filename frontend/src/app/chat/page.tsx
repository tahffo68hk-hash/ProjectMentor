"use client";

import { FormEvent, useState } from "react";

type Message = {
    id: number;
    role: "mentor" | "user";
    content: string;
};

type TeamProfile = {
    members: string[];
    skills: string[];
    interests: string[];
    competition: string[];
};

const initialMessages: Message[] = [
    {
        id: 1,
        role: "mentor",
        content:
            "你好！在推荐项目之前，我想先了解一下你的团队。请介绍一下团队有几个人、分别是什么专业，以及大家擅长什么。",
    },
];

const initialProfile: TeamProfile = {
    members: [],
    skills: [],
    interests: [],
    competition: [],
};

function addUniqueItem(items: string[], item: string) {
    return items.includes(item) ? items : [...items, item];
}

function extractTeamProfile(
    text: string,
    currentProfile: TeamProfile,
): TeamProfile {
    let nextProfile = { ...currentProfile };

    const memberKeywords = [
        { keyword: "计算机", value: "计算机专业成员" },
        { keyword: "软件工程", value: "软件工程专业成员" },
        { keyword: "临床医学", value: "临床医学专业成员" },
        { keyword: "医学", value: "医学专业成员" },
        { keyword: "自动化", value: "自动化专业成员" },
        { keyword: "机械", value: "机械专业成员" },
        { keyword: "电子信息", value: "电子信息专业成员" },
        { keyword: "经管", value: "经济管理专业成员" },
        { keyword: "设计", value: "设计专业成员" },
    ];

    const skillKeywords = [
        "Python",
        "Java",
        "C++",
        "YOLO",
        "前端",
        "后端",
        "机器学习",
        "深度学习",
        "大模型",
        "嵌入式",
        "STM32",
        "UI设计",
        "市场分析",
    ];

    const interestKeywords = [
        "医疗AI",
        "教育",
        "农业",
        "机器人",
        "新能源",
        "低空经济",
        "智能制造",
        "人工智能",
    ];

    const competitionKeywords = [
        "中国国际大学生创新大赛",
        "互联网+",
        "挑战杯",
        "创青春",
        "校赛",
        "省赛",
        "国赛",
    ];

    memberKeywords.forEach(({ keyword, value }) => {
        if (text.includes(keyword)) {
            nextProfile = {
                ...nextProfile,
                members: addUniqueItem(nextProfile.members, value),
            };
        }
    });

    skillKeywords.forEach((skill) => {
        if (text.toLowerCase().includes(skill.toLowerCase())) {
            nextProfile = {
                ...nextProfile,
                skills: addUniqueItem(nextProfile.skills, skill),
            };
        }
    });

    interestKeywords.forEach((interest) => {
        if (text.includes(interest)) {
            nextProfile = {
                ...nextProfile,
                interests: addUniqueItem(nextProfile.interests, interest),
            };
        }
    });

    competitionKeywords.forEach((competition) => {
        if (text.includes(competition)) {
            nextProfile = {
                ...nextProfile,
                competition: addUniqueItem(
                    nextProfile.competition,
                    competition,
                ),
            };
        }
    });

    return nextProfile;
}

function calculateCompletion(profile: TeamProfile) {
    const completedSections = [
        profile.members.length > 0,
        profile.skills.length > 0,
        profile.interests.length > 0,
        profile.competition.length > 0,
    ].filter(Boolean).length;

    return completedSections * 25;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");
    const [teamProfile, setTeamProfile] =
        useState<TeamProfile>(initialProfile);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedInput = input.trim();

        if (!trimmedInput) {
            return;
        }

        const updatedProfile = extractTeamProfile(
            trimmedInput,
            teamProfile,
        );

        const userMessage: Message = {
            id: Date.now(),
            role: "user",
            content: trimmedInput,
        };

        const mentorReply: Message = {
            id: Date.now() + 1,
            role: "mentor",
            content:
                "我已经根据你的介绍更新了右侧团队画像。请继续介绍你们感兴趣的方向，以及准备参加什么比赛。",
        };

        setMessages((currentMessages) => [
            ...currentMessages,
            userMessage,
            mentorReply,
        ]);

        setTeamProfile(updatedProfile);
        setInput("");
    }

    const completion = calculateCompletion(teamProfile);

    return (
        <main className="min-h-screen bg-gray-100">
            <div className="mx-auto flex min-h-screen max-w-7xl">
                <section className="flex min-w-0 flex-1 flex-col bg-white">
                    <header className="border-b px-8 py-5">
                        <h1 className="text-2xl font-bold">ProjectMentor</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            AI 创新创业项目导师
                        </p>
                    </header>

                    <div className="flex-1 space-y-6 overflow-y-auto px-8 py-8">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={
                                    message.role === "user"
                                        ? "flex justify-end"
                                        : "flex justify-start"
                                }
                            >
                                <div
                                    className={
                                        message.role === "user"
                                            ? "max-w-xl rounded-2xl bg-black px-5 py-4 text-white"
                                            : "max-w-xl rounded-2xl bg-gray-100 px-5 py-4 text-gray-900"
                                    }
                                >
                                    <p className="mb-2 text-sm font-semibold">
                                        {message.role === "user" ? "你" : "AI 导师"}
                                    </p>

                                    <p className="whitespace-pre-wrap leading-7">
                                        {message.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="border-t bg-white px-8 py-5"
                    >
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="介绍团队专业、技能、兴趣或比赛……"
                                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                            />

                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                            >
                                发送
                            </button>
                        </div>
                    </form>
                </section>

                <aside className="hidden w-80 shrink-0 border-l bg-white p-6 lg:block">
                    <h2 className="text-xl font-bold">团队画像</h2>

                    <div className="mt-6 space-y-6">
                        <ProfileSection
                            title="👥 成员"
                            items={teamProfile.members}
                        />

                        <ProfileSection
                            title="🧠 技能"
                            items={teamProfile.skills}
                        />

                        <ProfileSection
                            title="🎯 兴趣"
                            items={teamProfile.interests}
                        />

                        <ProfileSection
                            title="🏆 比赛"
                            items={teamProfile.competition}
                        />

                        <div>
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">资料完成度</span>
                                <span className="text-gray-500">
                                    {completion}%
                                </span>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className="h-full rounded-full bg-black transition-all"
                                    style={{ width: `${completion}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}

type ProfileSectionProps = {
    title: string;
    items: string[];
};

function ProfileSection({
    title,
    items,
}: ProfileSectionProps) {
    return (
        <section className="border-b pb-5">
            <h3 className="font-semibold">{title}</h3>

            {items.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">
                    等待识别……
                </p>
            ) : (
                <ul className="mt-2 space-y-2">
                    {items.map((item) => (
                        <li
                            key={item}
                            className="rounded-lg bg-gray-100 px-3 py-2 text-sm"
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}