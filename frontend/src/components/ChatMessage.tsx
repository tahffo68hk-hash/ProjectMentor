import type { ChatMessage as ChatMessageType } from "@/types/chat";

type ChatMessageProps = {
  message: ChatMessageType;
};

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <article
        className={
          isUser
            ? "max-w-2xl rounded-2xl rounded-tr-sm bg-zinc-950 px-5 py-4 text-white shadow-sm"
            : "max-w-2xl rounded-2xl rounded-tl-sm border border-zinc-200 bg-white px-5 py-4 text-zinc-900 shadow-sm"
        }
      >
        <p className={isUser ? "mb-2 text-sm font-semibold text-zinc-200" : "mb-2 text-sm font-semibold text-zinc-500"}>
          {isUser ? "你" : "AI 创业导师"}
        </p>
        <p className="whitespace-pre-wrap leading-7">{message.content}</p>
      </article>
    </div>
  );
}
