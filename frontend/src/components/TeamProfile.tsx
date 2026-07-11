import type { TeamProfile as TeamProfileType } from "@/types/chat";

type TeamProfileProps = {
  profile: TeamProfileType;
};

type ProfileSectionProps = {
  title: string;
  items: string[];
};

const sections: Array<{
  key: keyof TeamProfileType;
  title: string;
}> = [
  { key: "membersAndMajors", title: "成员与专业" },
  { key: "skills", title: "技能" },
  { key: "interests", title: "兴趣方向" },
  { key: "competitions", title: "比赛信息" },
  { key: "resources", title: "可用资源" },
  { key: "timeAndBudget", title: "时间与预算" },
  { key: "targetAwards", title: "目标奖项" },
];

export default function TeamProfile({ profile }: TeamProfileProps) {
  const completedCount = sections.filter(({ key }) => profile[key].length > 0).length;
  const completion = Math.round((completedCount / sections.length) * 100);

  return (
    <aside className="hidden w-80 shrink-0 border-l border-zinc-200 bg-white p-6 lg:block">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
          Team Profile
        </p>
        <h2 className="mt-2 text-xl font-bold text-zinc-950">团队画像</h2>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-zinc-700">资料完成度</span>
          <span className="text-zinc-500">{completion}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-zinc-950 transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {sections.map(({ key, title }) => (
          <ProfileSection key={key} title={title} items={profile[key]} />
        ))}
      </div>
    </aside>
  );
}

function ProfileSection({ title, items }: ProfileSectionProps) {
  return (
    <section className="border-b border-zinc-100 pb-4">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">等待识别...</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item} className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
