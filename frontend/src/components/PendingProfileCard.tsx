import type { PendingProfileItem, TeamProfileSectionKey } from "@/types/chat";
import { profileSectionLabels } from "@/lib/teamProfile";

type PendingProfileCardProps = {
  items: PendingProfileItem[];
  onConfirm: () => void;
  onCancel: () => void;
  onDeleteItem: (id: string) => void;
  onUpdateItem: (id: string, text: string) => void;
  onChangeSection: (id: string, section: TeamProfileSectionKey) => void;
};

const sectionOptions = Object.entries(profileSectionLabels) as Array<
  [TeamProfileSectionKey, string]
>;

export default function PendingProfileCard({
  items,
  onConfirm,
  onCancel,
  onDeleteItem,
  onUpdateItem,
  onChangeSection,
}: PendingProfileCardProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">待确认画像</p>
          <p className="mt-1 text-sm text-amber-800">
            系统只提取了候选信息。确认前，它们不会进入正式团队画像。
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            确认写入
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-[150px_1fr_auto]">
            <select
              value={item.section}
              onChange={(event) =>
                onChangeSection(item.id, event.target.value as TeamProfileSectionKey)
              }
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-950"
            >
              {sectionOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <input
              value={item.text}
              onChange={(event) => onUpdateItem(item.id, event.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-950"
            />

            <button
              type="button"
              onClick={() => onDeleteItem(item.id)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
