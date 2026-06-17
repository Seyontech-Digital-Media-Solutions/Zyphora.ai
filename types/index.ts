export type Plan = "free" | "starter" | "pro" | "agency";

export type Platform =
  | "twitter"
  | "instagram"
  | "linkedin"
  | "facebook"
  | "tiktok"
  | "youtube";

export type ContentStatus = "draft" | "scheduled" | "published" | "failed";

export type ContentType = "post" | "thread" | "newsletter" | "caption" | "story";

export type BrandVoice =
  | "professional"
  | "casual"
  | "witty"
  | "educational"
  | "custom";

export type AutomationRunStatus = "running" | "success" | "failed";

export type MessageRole = "user" | "assistant";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  credits_remaining: number;
  onboarded: boolean;
  created_at: string;
  industry?: string | null;
  website?: string | null;
  brand_voice?: BrandVoice | null;
  ai_instructions?: string | null;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: Platform;
  account_name: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ContentItem {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  platform: string | null;
  media_urls: string[] | null;
  status: ContentStatus;
  scheduled_at: string | null;
  published_at: string | null;
  post_id_external: string | null;
  analytics: Record<string, unknown>;
  ai_generated: boolean;
  tone: string | null;
  hashtags: string[] | null;
  created_at: string;
}

export interface AutomationStep {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  steps: AutomationStep[];
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  n8n_workflow_id: string | null;
  created_at: string;
}

export interface AutomationRun {
  id: string;
  automation_id: string;
  user_id: string;
  status: AutomationRunStatus;
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  error_message: string | null;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  context: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tokens_used: number | null;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  user_id: string;
  platform: string | null;
  period_start: string;
  period_end: string;
  metrics: Record<string, unknown>;
  created_at: string;
}

export interface GeneratedPost {
  platform: string;
  content: string;
  hashtags: string[];
  bestTimeToPost?: string;
}

export interface GenerateContentResponse {
  posts: GeneratedPost[];
}
