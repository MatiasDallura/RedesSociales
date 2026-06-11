export type Platform = "LinkedIn" | "Facebook" | "Instagram";

export type LeadStatus =
  | "Nuevo"
  | "Guardado"
  | "Revisado"
  | "Seguido manualmente"
  | "Contactado"
  | "Descartado";

export type LeadCategory =
  | "Alta prioridad"
  | "Buen encaje"
  | "Nutricion"
  | "Baja prioridad"
  | "No encaja";

export type UserSettings = {
  id: string;
  user_id: string;
  default_daily_review_limit: number;
  ai_model: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialAccount = {
  id: string;
  user_id: string;
  name: string;
  platform: Platform;
  url: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  id: string;
  user_id: string;
  name: string;
  platform: Platform;
  niche: string;
  location: string | null;
  keywords: string[];
  hashtags: string[];
  target_profile_type: string | null;
  daily_review_limit: number;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  user_id: string;
  campaign_id: string | null;
  name: string;
  platform: Platform;
  url: string;
  niche: string | null;
  location: string | null;
  bio: string | null;
  keywords_detected: string[];
  hashtags_related: string[];
  relevance_score: number;
  fit_reason: string | null;
  approach_suggestion: string | null;
  category: LeadCategory | null;
  status: LeadStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadNote = {
  id: string;
  user_id: string;
  lead_id: string;
  body: string;
  created_at: string;
};

export type DailyActivity = {
  id: string;
  user_id: string;
  activity_date: string;
  reviewed_count: number;
  opened_count: number;
  followed_manual_count: number;
  created_at: string;
  updated_at: string;
};

export type LeadAnalysis = {
  relevance_score: number;
  fit_reason: string;
  approach_suggestion: string;
  category: LeadCategory;
  keywords_detected: string[];
  hashtags_related: string[];
};
