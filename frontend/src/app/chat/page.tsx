export default function ChatPage() {
  return (
    <main className="min-h-screen flex bg-gray-100">
      {/* 左侧聊天区域 */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold">
          AI 创业导师
        </h1>

        <div className="mt-8 bg-white rounded-xl shadow p-6 h-[600px]">
          🤖 你好！

          <br />

          在推荐项目之前，

          <br />

          我想先了解一下你的团队。
        </div>
      </div>

      {/* 右侧 Team Profile */}
      <div className="w-80 bg-white border-l p-6">
        <h2 className="text-xl font-bold">
          团队画像
        </h2>

        <div className="mt-6 space-y-4">
          <div>👥 成员：等待识别...</div>

          <div>🧠 技能：等待识别...</div>

          <div>🎯 兴趣：等待识别...</div>

          <div>🏆 比赛：等待识别...</div>
        </div>
      </div>
    </main>
  );
}
