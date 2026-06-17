-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  full_name text,
  avatar_url text,
  company_name text,
  industry text,
  website text,
  brand_voice text default 'professional',
  ai_instructions text,
  plan text default 'free' check (plan in ('free', 'starter', 'pro', 'agency')),
  stripe_customer_id text,
  stripe_subscription_id text,
  credits_remaining int default 100,
  onboarded boolean default false,
  created_at timestamptz default now()
);

-- Workspace / connected social accounts
create table public.connected_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles,
  platform text not null check (platform in ('twitter', 'instagram', 'linkedin', 'facebook', 'tiktok', 'youtube')),
  account_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- AI Content
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles,
  title text,
  body text not null,
  platform text,
  media_urls text[],
  status text default 'draft' check (status in ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  post_id_external text,
  analytics jsonb default '{}',
  ai_generated boolean default false,
  tone text,
  hashtags text[],
  created_at timestamptz default now()
);

-- Automations
create table public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles,
  name text not null,
  description text,
  trigger_type text not null,
  trigger_config jsonb default '{}',
  steps jsonb default '[]',
  is_active boolean default true,
  run_count int default 0,
  last_run_at timestamptz,
  n8n_workflow_id text,
  created_at timestamptz default now()
);

-- Automation runs / logs
create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid references public.automations,
  user_id uuid references public.profiles,
  status text check (status in ('running', 'success', 'failed')),
  input_data jsonb,
  output_data jsonb,
  error_message text,
  duration_ms int,
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- AI Chat / Assistant messages
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles,
  title text,
  context text,
  created_at timestamptz default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations,
  role text check (role in ('user', 'assistant')),
  content text not null,
  tokens_used int,
  created_at timestamptz default now()
);

-- Analytics snapshots
create table public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles,
  platform text,
  period_start date,
  period_end date,
  metrics jsonb default '{}',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.connected_accounts enable row level security;
alter table public.content_items enable row level security;
alter table public.automations enable row level security;
alter table public.automation_runs enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.analytics_snapshots enable row level security;

-- RLS policies
create policy "Users can view own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users can manage own accounts" on public.connected_accounts for all using (auth.uid() = user_id);
create policy "Users can manage own content" on public.content_items for all using (auth.uid() = user_id);
create policy "Users can manage own automations" on public.automations for all using (auth.uid() = user_id);
create policy "Users can view own runs" on public.automation_runs for all using (auth.uid() = user_id);
create policy "Users can manage own conversations" on public.conversations for all using (auth.uid() = user_id);
create policy "Users can manage own messages" on public.messages for select, insert using (
  auth.uid() = (select user_id from conversations where id = conversation_id)
);
create policy "Users can view own analytics" on public.analytics_snapshots for all using (auth.uid() = user_id);
