export type UserRole = 'parent' | 'child';

export interface Profile {
  id: string;
  username: string;
  email?: string; // Optional for children
  role: UserRole;
  parent_id: string | null;
  invite_code: string;
  restricted: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface Contact {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

export interface ChatContact {
  id: string;
  username: string;
  role: UserRole;
  restricted: boolean;
}
