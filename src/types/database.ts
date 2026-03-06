export type UserRole =
  | "resident"
  | "owner"
  | "tenant"
  | "secretary"
  | "chairman"
  | "admin"
  | "guard";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  mobile: string | null;
  society_id: string | null;
  flat_no: string | null;
  block: string | null;
  floor: string | null;
  role: UserRole;
  aadhaar_last4: string | null;
  id_card_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Society {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  society_id: string;
  author_id: string;
  type: "general" | "question" | "alert" | "event";
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  // Joined fields
  author?: Pick<Profile, "full_name" | "avatar_url">;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  // Joined fields
  author?: Pick<Profile, "full_name" | "avatar_url">;
}

export interface Message {
  id: string;
  society_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string | null;
  other_user_avatar: string | null;
  last_message: string;
  last_time: string;
  unread_count: number;
}

export interface Vendor {
  id: string;
  society_id: string;
  name: string;
  name_hi: string | null;
  category: string;
  phone: string;
  timing: string | null;
  status: "available" | "on_the_way" | "done_for_today" | "holiday";
  rating: number;
  review_count: number;
  area: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  society_id: string;
  author_id: string;
  title: string;
  description: string;
  category: string;
  status: "open" | "in_progress" | "escalated" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to: string | null;
  escalation_level: number;
  upvotes_count: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  // Joined fields
  author?: Pick<Profile, "full_name" | "avatar_url">;
  assignee?: Pick<Profile, "full_name"> | null;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  // Joined fields
  author?: Pick<Profile, "full_name" | "avatar_url">;
}

export interface SOSAlert {
  id: string;
  society_id: string;
  author_id: string;
  type: string;
  message: string;
  location: string | null;
  is_active: boolean;
  created_at: string;
  resolved_at: string | null;
  // Joined fields
  author?: Pick<Profile, "full_name" | "avatar_url" | "flat_no" | "block">;
}

export interface EmergencyContact {
  id: string;
  society_id: string;
  name: string;
  name_hi: string | null;
  phone: string;
  type: "police" | "fire" | "ambulance" | "security" | "other";
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}
