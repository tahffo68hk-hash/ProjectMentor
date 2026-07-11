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
