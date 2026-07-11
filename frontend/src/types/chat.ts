export type MessageRole = "mentor" | "user";

export type ChatMessage = {
  id: number;
  role: MessageRole;
  content: string;
};

export type TeamProfile = {
  membersAndMajors: string[];
  skills: string[];
  interests: string[];
  competitions: string[];
  resources: string[];
  timeAndBudget: string[];
  targetAwards: string[];
};

export type TeamProfileSectionKey = keyof TeamProfile;

export type PendingProfileItem = {
  id: string;
  section: TeamProfileSectionKey;
  text: string;
};

export type ApiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PendingProfile = Partial<Record<TeamProfileSectionKey, string[]>>;

export type InterviewApiRequest = {
  message: string;
  messages: ApiChatMessage[];
  confirmedProfile: TeamProfile;
};

export type InterviewApiResponse = {
  reply: string;
  observations: string[];
  pendingProfile: PendingProfile;
  missingFields: string[];
  interviewComplete: boolean;
};

export type RecommendationDifficulty = "low" | "medium" | "high";

export type SevenDayPlanItem = {
  day: number;
  task: string;
};

export type ProjectRecommendation = {
  id: string;
  title: string;
  oneSentenceSummary: string;
  problem: string;
  targetUsers: string[];
  whySuitable: string[];
  teamAdvantages: string[];
  missingCapabilities: string[];
  requiredSkills: string[];
  coreFeatures: string[];
  estimatedDifficulty: RecommendationDifficulty;
  estimatedDurationWeeks: number;
  estimatedBudget: string;
  innovationPotential: string;
  implementationRisk: string[];
  recommendedCompetitionTrack: string[];
  nextSevenDaysPlan: SevenDayPlanItem[];
  needsFurtherValidation: string[];
};

export type RecommendationRequest = {
  confirmedProfile: TeamProfile;
};

export type RecommendationResponse = {
  recommendations: ProjectRecommendation[];
  profileSummary: string;
  warnings: string[];
  source: "ai" | "fallback";
};

export type SelectedProject = {
  recommendation: ProjectRecommendation;
  selectedAt: string;
};
