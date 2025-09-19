// TypeScript interfaces matching Rust structs
export interface SampleUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface SampleNote {
  id: number;
  title: string;
  content?: string;
  user_id: number;
  user: SampleUser;
  created_at: string;
  updated_at: string;
}
