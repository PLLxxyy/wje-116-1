import { Request } from 'express';

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  avatar_url: string;
  bio: string;
  total_km: number;
  best_marathon_time: string;
  created_at: string;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  city: string;
  status: 'pending' | 'approved' | 'rejected';
  member_count: number;
  created_at: string;
}

export interface ClubMember {
  id: number;
  club_id: number;
  user_id: number;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Activity {
  id: number;
  club_id: number;
  creator_id: number;
  title: string;
  description: string;
  location: string;
  route: string;
  datetime: string;
  pace: string;
  max_participants: number;
  status: 'upcoming' | 'ongoing' | 'finished';
  created_at: string;
}

export interface ActivityParticipant {
  id: number;
  activity_id: number;
  user_id: number;
  status: 'going' | 'cancelled';
}

export interface Post {
  id: number;
  user_id: number;
  activity_id: number | null;
  content: string;
  distance_km: number;
  duration_minutes: number;
  image_url: string;
  created_at: string;
}

export interface PostLike {
  id: number;
  post_id: number;
  user_id: number;
  created_at: string;
}

export interface PostComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export interface Challenge {
  id: number;
  club_a_id: number;
  club_b_id: number;
  month: string;
  status: 'pending' | 'active' | 'finished';
  winner_club_id: number | null;
  created_at: string;
}

export interface Report {
  id: number;
  reporter_id: number;
  target_type: 'post' | 'comment';
  target_id: number;
  reason: string;
  status: 'pending' | 'resolved';
  created_at: string;
}

export interface Medal {
  id: number;
  user_id: number;
  event_name: string;
  year: number;
  medal_type: string;
  created_at: string;
}

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}
