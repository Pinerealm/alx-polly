export type Poll = {
  id: string;
  question: string;
  options: string[];
  user_id: string;
  created_at: string;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type RegisterFormData = {
  email: string;
  password: string;
};