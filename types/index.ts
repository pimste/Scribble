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
  content_type?: 'text' | 'gif';
  media_url?: string;
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
  unreadCount?: number;
}

export type SafetyConcern = 'bullying' | 'swearing' | 'unsafe' | 'clean';

export interface MessageSafetyAnalysis {
  id: string;
  message_id: string;
  is_safe: boolean;
  concerns: string[];
  analysis_details: {
    bullying: boolean;
    swearing: boolean;
    unsafe: boolean;
    explanation: string;
  } | null;
  analyzed_at: string;
}

export interface MessageWithSafety extends Message {
  safety?: MessageSafetyAnalysis;
}
