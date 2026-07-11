import Link from "next/link";
import Button from "@/components/Button";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-[900px] bg-white rounded-xl shadow-lg p-12">
        <h1 className="text-4xl font-bold">
          ProjectMentor
        </h1>

        <div className="mt-10 space-y-6">
          <h2 className="text-3xl font-bold">
            你好 👋
          </h2>

          <p className="text-xl">
            我是你的 AI 创新创业导师。
          </p>

          <p className="text-xl">
            我不会直接帮你写商业计划书。
          </p>

          <p className="text-xl">
            我会先了解你的团队，然后推荐真正适合你们的项目方向。
          </p>
        </div>

        <Link href="/chat">
          <Button text="开始访谈" />
        </Link>
      </div>
    </main>
  );
}
