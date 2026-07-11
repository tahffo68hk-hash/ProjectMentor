"use client";

import { FormEvent, useState } from "react";

type Message = {
    id: number;
    role: "mentor" | "user";
    content: string;
};

const initialMessages: Message[] = [
    {
        id: 1,
        role: "mentor",
        content:
            "你好！在推荐项目之前，我想先了解一下你的团队。请介绍一下团队有几个人、分别是什么专业，以及大家擅长什么。",
    },
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [input, setInput] = useState("");

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedInput = input.trim();

        if (!trimmedInput) {
            return;
        }

        const userMessage: Message = {
            id: Date.now(),
            role: "user",
            content: trimmedInput,
        };

        setMessages((currentMessages) => [
            ...currentMessages,
            userMessage,
            {
                id: Date.now() + 1,
                role: "mentor",
                content:
                    "收到。下一步请告诉我：你们以前做过哪些项目，或者掌握哪些比较具体的技能？",
            },
        ]);

        setInput("");
    }

    return (
        <main className="min-h-screen bg-gray-100">
            <div className="mx-auto flex min-h-screen max-w-7xl">
                {/* 左侧聊天区域 */}
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
                                placeholder="介绍一下你的团队……"
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

                {/* 右侧团队画像 */}
                <aside className="hidden w-80 shrink-0 border-l bg-white p-6 lg:block">
                    <h2 className="text-xl font-bold">团队画像</h2>

                    <div className="mt-6 space-y-6">
                        <ProfileSection title="👥 成员" content="等待识别……" />
                        <ProfileSection title="🧠 技能" content="等待识别……" />
                        <ProfileSection title="🎯 兴趣" content="等待识别……" />
                        <ProfileSection title="🏆 比赛" content="等待识别……" />

                        <div>
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">资料完成度</span>
                                <span className="text-gray-500">0%</span>
                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                                <div className="h-full w-0 rounded-full bg-black" />
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
    content: string;
};

function ProfileSection({ title, content }: ProfileSectionProps) {
    return (
        <section className="border-b pb-5">
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-gray-500">{content}</p>
        </section>
    );
}