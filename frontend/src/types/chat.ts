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
