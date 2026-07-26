import type {
  PendingProfileItem,
  TeamProfile,
  TeamProfileSectionKey,
} from "./types";

export const emptyTeamProfile: TeamProfile = {
  membersAndMajors: [],
  skills: [],
  interests: [],
  competitions: [],
  resources: [],
  timeAndBudget: [],
  targetAwards: [],
};

type ProfileRule = {
  keyword: string;
  text: string;
};

export const profileSectionLabels: Record<TeamProfileSectionKey, string> = {
  membersAndMajors: "成员与专业",
  skills: "技能",
  interests: "兴趣方向",
  competitions: "比赛信息",
  resources: "可用资源",
  timeAndBudget: "时间与预算",
  targetAwards: "目标奖项",
};

const profileRules: Record<TeamProfileSectionKey, ProfileRule[]> = {
  membersAndMajors: [
    { keyword: "计算机", text: "计算机相关专业成员" },
    { keyword: "软件", text: "软件工程相关成员" },
    { keyword: "临床", text: "临床医学专业成员" },
    { keyword: "医学", text: "医学相关专业成员" },
    { keyword: "自动化", text: "自动化专业成员" },
    { keyword: "机械", text: "机械相关专业成员" },
    { keyword: "电子", text: "电子信息相关成员" },
    { keyword: "设计", text: "设计相关成员" },
    { keyword: "经管", text: "经管相关成员" },
  ],
  skills: [
    { keyword: "Python", text: "Python" },
    { keyword: "Java", text: "Java" },
    { keyword: "C++", text: "C++" },
    { keyword: "前端", text: "前端开发" },
    { keyword: "后端", text: "后端开发" },
    { keyword: "机器学习", text: "机器学习" },
    { keyword: "深度学习", text: "深度学习" },
    { keyword: "大模型", text: "大模型应用" },
    { keyword: "UI", text: "UI 设计" },
    { keyword: "市场", text: "市场分析" },
  ],
  interests: [
    { keyword: "医疗", text: "医疗健康" },
    { keyword: "教育", text: "教育科技" },
    { keyword: "农业", text: "智慧农业" },
    { keyword: "机器人", text: "机器人" },
    { keyword: "新能源", text: "新能源" },
    { keyword: "低空", text: "低空经济" },
    { keyword: "人工智能", text: "人工智能" },
  ],
  competitions: [
    { keyword: "互联网+", text: "中国国际大学生创新大赛" },
    { keyword: "挑战杯", text: "挑战杯" },
    { keyword: "创青春", text: "创青春" },
    { keyword: "校赛", text: "校赛" },
    { keyword: "省赛", text: "省赛" },
    { keyword: "国赛", text: "国赛" },
  ],
  resources: [
    { keyword: "实验室", text: "实验室资源" },
    { keyword: "导师", text: "导师指导" },
    { keyword: "医院", text: "医院场景资源" },
    { keyword: "企业", text: "企业合作资源" },
    { keyword: "数据", text: "数据资源" },
    { keyword: "专利", text: "专利或技术积累" },
  ],
  timeAndBudget: [
    { keyword: "一个月", text: "时间：约一个月" },
    { keyword: "三个月", text: "时间：约三个月" },
    { keyword: "半年", text: "时间：约半年" },
    { keyword: "预算", text: "已提到预算" },
    { keyword: "经费", text: "已提到经费" },
    { keyword: "没钱", text: "预算有限" },
  ],
  targetAwards: [
    { keyword: "金奖", text: "目标：金奖" },
    { keyword: "银奖", text: "目标：银奖" },
    { keyword: "铜奖", text: "目标：铜奖" },
    { keyword: "一等奖", text: "目标：一等奖" },
    { keyword: "二等奖", text: "目标：二等奖" },
    { keyword: "三等奖", text: "目标：三等奖" },
  ],
};

export const teamProfileSections = Object.keys(
  profileSectionLabels,
) as TeamProfileSectionKey[];

export function extractPendingProfileItems(text: string): PendingProfileItem[] {
  const normalizedText = text.toLowerCase();
  const items: PendingProfileItem[] = [];

  teamProfileSections.forEach((section) => {
    profileRules[section].forEach((rule) => {
      if (normalizedText.includes(rule.keyword.toLowerCase())) {
        items.push({
          id: `${section}-${rule.text}`,
          section,
          text: rule.text,
        });
      }
    });
  });

  return dedupePendingItems(items);
}

export function mergeConfirmedItems(
  profile: TeamProfile,
  items: PendingProfileItem[],
): TeamProfile {
  const nextProfile = cloneTeamProfile(profile);

  items.forEach((item) => {
    const value = item.text.trim();

    if (value && !nextProfile[item.section].includes(value)) {
      nextProfile[item.section] = [...nextProfile[item.section], value];
    }
  });

  return nextProfile;
}

export function normalizeTeamProfile(value: unknown): TeamProfile {
  if (!value || typeof value !== "object") {
    return cloneTeamProfile(emptyTeamProfile);
  }

  const record = value as Partial<Record<TeamProfileSectionKey, unknown>>;
  const profile = cloneTeamProfile(emptyTeamProfile);

  teamProfileSections.forEach((section) => {
    const items = record[section];

    if (Array.isArray(items)) {
      profile[section] = items.filter((item): item is string => typeof item === "string");
    }
  });

  return profile;
}

export function cloneTeamProfile(profile: TeamProfile): TeamProfile {
  return {
    membersAndMajors: [...profile.membersAndMajors],
    skills: [...profile.skills],
    interests: [...profile.interests],
    competitions: [...profile.competitions],
    resources: [...profile.resources],
    timeAndBudget: [...profile.timeAndBudget],
    targetAwards: [...profile.targetAwards],
  };
}

function dedupePendingItems(items: PendingProfileItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.section}:${item.text}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
