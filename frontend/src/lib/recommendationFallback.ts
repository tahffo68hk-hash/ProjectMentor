import type {
  ProjectRecommendation,
  RecommendationDifficulty,
  RecommendationResponse,
  TeamProfile,
} from "@/types/chat";

type DirectionSeed = {
  id: string;
  title: string;
  summary: string;
  problem: string;
  users: string[];
  skills: string[];
  features: string[];
  risk: string[];
  validation: string[];
};

export function createLocalRecommendationResult(
  confirmedProfile: TeamProfile,
): RecommendationResponse {
  const seeds = pickDirectionSeeds(confirmedProfile);
  const profileSummary = summarizeProfile(confirmedProfile);

  return {
    recommendations: seeds.map((seed, index) =>
      buildRecommendation(seed, index, confirmedProfile),
    ),
    profileSummary,
    warnings: createWarnings(confirmedProfile),
    source: "fallback",
  };
}

function pickDirectionSeeds(profile: TeamProfile): DirectionSeed[] {
  const text = flattenProfile(profile);

  if (includesAny(text, ["医疗", "医学", "临床", "医院"])) {
    return [
      {
        id: "med-workflow-helper",
        title: "医学生病例学习流程助手",
        summary: "面向医学生的病例学习和复盘工具，帮助团队快速做出可演示 MVP。",
        problem: "医学生在病例学习时常缺少结构化复盘流程，知识点、诊断思路和反思记录分散。",
        users: ["医学生", "临床见习学生", "医学社团"],
        skills: ["前端开发", "基础数据建模", "医学场景访谈"],
        features: ["病例卡片录入", "诊断思路时间线", "复盘清单", "学习报告导出"],
        risk: ["医学内容准确性需要导师把关", "真实病例数据需要脱敏或使用模拟数据"],
        validation: ["确认是否能获得医学导师反馈", "验证学生是否愿意持续记录病例复盘"],
      },
      {
        id: "rehab-home-tracker",
        title: "居家康复任务跟踪小程序",
        summary: "用轻量工具帮助康复人群完成每日训练打卡和反馈记录。",
        problem: "居家康复训练缺少持续记录和简单反馈，患者容易遗忘动作、频次和异常情况。",
        users: ["康复患者", "康复治疗师", "社区健康服务人员"],
        skills: ["前端开发", "用户调研", "简单可视化"],
        features: ["康复任务计划", "每日打卡", "异常反馈记录", "周报统计"],
        risk: ["不能宣称医疗疗效", "需要明确只做辅助记录而非诊断"],
        validation: ["确认是否有康复场景资源", "访谈康复治疗师确定真实流程"],
      },
      {
        id: "clinical-data-copilot-lite",
        title: "临床科研数据整理助手",
        summary: "帮助学生科研团队把表格数据清洗流程做成可演示工具。",
        problem: "学生科研项目常遇到表格字段混乱、缺失值标注不统一、变量说明缺失等问题。",
        users: ["医学科研学生", "导师课题组助理", "数据整理志愿者"],
        skills: ["Python", "数据清洗", "前端展示"],
        features: ["字段字典管理", "缺失值检查", "异常值提示", "清洗日志"],
        risk: ["真实数据合规要求高", "自动化建议不能替代统计分析判断"],
        validation: ["确认是否有可脱敏样例数据", "验证课题组是否有高频整理痛点"],
      },
    ];
  }

  if (includesAny(text, ["教育", "学习", "课程"])) {
    return [
      {
        id: "course-project-planner",
        title: "课程项目拆解与进度助手",
        summary: "帮助学生团队把课程大作业拆成任务、资料和里程碑。",
        problem: "学生团队做课程项目时容易任务不清、进度滞后、资料散落。",
        users: ["大学课程项目小组", "创新训练项目团队"],
        skills: ["前端开发", "任务管理", "可视化"],
        features: ["任务拆解", "成员分工", "截止日期提醒", "项目复盘"],
        risk: ["同类工具较多，需要聚焦学生课程场景"],
        validation: ["访谈 5 个课程项目小组", "验证是否比通用待办工具更好用"],
      },
      {
        id: "skill-map-mentor",
        title: "竞赛技能地图生成器",
        summary: "根据比赛目标生成团队技能缺口和学习计划。",
        problem: "新手团队不知道参加比赛前需要补齐哪些技能和材料。",
        users: ["创新创业竞赛新手团队", "社团培训负责人"],
        skills: ["规则整理", "前端开发", "内容结构化"],
        features: ["目标比赛选择", "技能缺口清单", "四周学习计划", "材料准备进度"],
        risk: ["比赛规则变化需要人工维护", "建议不能替代导师评审"],
        validation: ["收集目标比赛规则", "找竞赛导师验证清单准确性"],
      },
      {
        id: "learning-evidence-portfolio",
        title: "学生项目成果证据库",
        summary: "帮助团队沉淀调研、原型、测试和迭代证据。",
        problem: "参赛项目常缺少过程证据，答辩时难以证明真实调研和迭代。",
        users: ["创新创业项目团队", "指导老师"],
        skills: ["文档组织", "前端开发", "项目管理"],
        features: ["调研记录", "原型版本", "测试反馈", "证据导出"],
        risk: ["需要让团队养成持续记录习惯"],
        validation: ["确认参赛材料中最缺哪些证据", "验证导出格式是否符合老师需求"],
      },
    ];
  }

  return [
    {
      id: "campus-resource-matcher",
      title: "校园资源匹配助手",
      summary: "把团队需求与导师、实验室、设备和企业资源做轻量匹配。",
      problem: "学生团队知道自己需要资源，但不知道校内外有哪些资源可用、如何联系。",
      users: ["学生创新团队", "学院创新创业办公室", "社团负责人"],
      skills: ["前端开发", "信息整理", "匹配规则设计"],
      features: ["资源目录", "需求标签", "匹配结果", "联系记录"],
      risk: ["资源信息需要持续维护", "早期可先做小范围学院版本"],
      validation: ["确认学院是否愿意提供资源目录", "访谈学生团队常见资源需求"],
    },
    {
      id: "mvp-validation-board",
      title: "MVP 验证看板",
      summary: "帮助团队把项目假设、访谈反馈和 MVP 迭代放到一个看板里。",
      problem: "创新创业团队容易先做产品，缺少对真实用户和关键假设的验证。",
      users: ["创新创业竞赛团队", "项目制课程团队"],
      skills: ["产品设计", "前端开发", "用户访谈"],
      features: ["假设列表", "访谈记录", "验证状态", "下一步实验"],
      risk: ["需要清晰的新手引导，否则用户不知道如何填写"],
      validation: ["找 3 个团队试用一周", "确认看板是否帮助减少无效开发"],
    },
    {
      id: "prototype-demo-generator",
      title: "竞赛原型演示脚本助手",
      summary: "围绕项目场景生成可演示的用户流程和原型脚本。",
      problem: "学生团队即使有想法，也常难以在答辩中展示清楚 MVP 如何解决问题。",
      users: ["参赛团队", "产品原型负责人"],
      skills: ["前端开发", "交互设计", "场景拆解"],
      features: ["用户旅程", "演示脚本", "功能优先级", "原型检查表"],
      risk: ["不能替代真实产品验证", "容易变成包装工具，需要绑定实际 MVP"],
      validation: ["对比使用前后的答辩表达清晰度", "让导师评估脚本是否可信"],
    },
  ];
}

function buildRecommendation(
  seed: DirectionSeed,
  index: number,
  profile: TeamProfile,
): ProjectRecommendation {
  const difficulty = ["low", "medium", "high"][index] as RecommendationDifficulty;
  const duration = difficulty === "low" ? 4 : difficulty === "medium" ? 6 : 8;

  return {
    id: seed.id,
    title: seed.title,
    oneSentenceSummary: seed.summary,
    problem: seed.problem,
    targetUsers: seed.users,
    whySuitable: [
      `与团队兴趣方向相关：${joinOrFallback(profile.interests, "已确认的兴趣方向较少")}`,
      `可利用团队已有技能：${joinOrFallback(profile.skills, "需要进一步明确技能")}`,
    ],
    teamAdvantages: [
      joinOrFallback(profile.membersAndMajors, "团队成员专业信息还不充分"),
      joinOrFallback(profile.resources, "资源信息较少，适合先做低资源 MVP"),
    ],
    missingCapabilities: createMissingCapabilities(profile),
    requiredSkills: seed.skills,
    coreFeatures: seed.features,
    estimatedDifficulty: difficulty,
    estimatedDurationWeeks: duration,
    estimatedBudget: profile.timeAndBudget.length > 0
      ? `参考已确认约束：${profile.timeAndBudget.join("、")}`
      : "建议先按低预算方案推进，控制在原型和访谈验证成本内。",
    innovationPotential: difficulty === "low"
      ? "创新点偏场景聚焦，适合快速做出可演示闭环。"
      : difficulty === "medium"
        ? "有一定产品化和流程创新空间，适合平衡竞赛表达与落地。"
        : "挑战性更高，适合在已有资源支持下探索更强技术或行业深度。",
    implementationRisk: seed.risk,
    recommendedCompetitionTrack: profile.competitions.length > 0
      ? profile.competitions
      : ["创新创业类校赛", "课程项目展示"],
    nextSevenDaysPlan: createSevenDayPlan(seed),
    needsFurtherValidation: seed.validation,
  };
}

function createSevenDayPlan(seed: DirectionSeed) {
  return [
    { day: 1, task: "明确目标用户和一个最小使用场景。" },
    { day: 2, task: "访谈 3 位潜在用户，记录真实痛点。" },
    { day: 3, task: `画出 ${seed.title} 的 MVP 流程图。` },
    { day: 4, task: "确定首版核心功能和不做的功能。" },
    { day: 5, task: "完成低保真原型或页面草图。" },
    { day: 6, task: "找用户或导师演示并收集反馈。" },
    { day: 7, task: "整理验证结论，决定是否继续推进。" },
  ];
}

function createMissingCapabilities(profile: TeamProfile) {
  const missing = [];

  if (profile.skills.length === 0) missing.push("需要进一步明确可承担开发和调研的成员");
  if (profile.resources.length === 0) missing.push("需要补充导师、实验室、数据或用户访问资源");
  if (profile.timeAndBudget.length === 0) missing.push("需要明确每周投入时间和预算边界");

  return missing.length > 0 ? missing : ["需要通过用户访谈补充真实需求证据"];
}

function createWarnings(profile: TeamProfile) {
  const warnings = ["以下推荐只用于项目立项方向，不构成获奖承诺或完整商业计划。"];

  if (profile.resources.length === 0) {
    warnings.push("当前资源信息不足，推荐已避免假设拥有行业数据或企业合作。");
  }

  return warnings;
}

function summarizeProfile(profile: TeamProfile) {
  return [
    `成员与专业：${joinOrFallback(profile.membersAndMajors, "未确认")}`,
    `技能：${joinOrFallback(profile.skills, "未确认")}`,
    `兴趣：${joinOrFallback(profile.interests, "未确认")}`,
    `比赛/目标：${joinOrFallback([...profile.competitions, ...profile.targetAwards], "未确认")}`,
    `资源/约束：${joinOrFallback([...profile.resources, ...profile.timeAndBudget], "未确认")}`,
  ].join("；");
}

function flattenProfile(profile: TeamProfile) {
  return Object.values(profile).flat().join(" ");
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function joinOrFallback(items: string[], fallback: string) {
  return items.length > 0 ? items.join("、") : fallback;
}
