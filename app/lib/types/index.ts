export type Poll = {
  id: string;
  question: string;
  options: string[];
  user_id: string;
  created_at: string;
  total_votes?: number;
  vote_counts?: number[];
};

export type VoteResult = {
  option_index: number;
  option_text: string;
  vote_count: number;
  percentage: number;
};

export type PollResults = {
  poll: Poll;
  results: VoteResult[];
  total_votes: number;
  has_user_voted: boolean;
  user_vote?: number;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type RegisterFormData = {
  email: string;
  password: string;
};