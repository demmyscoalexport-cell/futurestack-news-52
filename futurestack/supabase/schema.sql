-- ============================================================
-- FutureStack News — Supabase Database Schema
-- Run this in your Supabase SQL editor (dashboard.supabase.com)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- AUTHORS
-- ──────────────────────────────────────────────────────────
create table if not exists authors (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  avatar      text,
  role        text,
  bio         text,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────────────────
-- TOOL CATEGORIES
-- ──────────────────────────────────────────────────────────
create table if not exists tool_categories (
  id    text primary key,   -- e.g. 'writing', 'design'
  name  text not null,
  icon  text,
  count int  default 0
);

insert into tool_categories (id, name, icon, count) values
  ('writing',     'Writing',     'pen-tool',  24),
  ('design',      'Design',      'palette',   18),
  ('code',        'Code',        'code',      15),
  ('video',       'Video',       'video',     12),
  ('audio',       'Audio',       'mic',        8),
  ('data',        'Data',        'database',  10),
  ('automation',  'Automation',  'zap',       14),
  ('productivity','Productivity','layout',    20),
  ('marketing',   'Marketing',   'bar-chart', 11),
  ('analytics',   'Analytics',   'bar-chart',  9)
on conflict (id) do nothing;

-- ──────────────────────────────────────────────────────────
-- TOOLS
-- ──────────────────────────────────────────────────────────
create table if not exists tools (
  id                uuid primary key default uuid_generate_v4(),
  name              text    not null,
  slug              text    not null unique,
  description       text,
  short_description text,
  logo              text,
  category          text    references tool_categories(id),
  subcategories     text[]  default '{}',
  has_free          boolean default false,
  free_description  text,
  pricing_plans     jsonb   default '[]',
  rating            numeric(3,2) default 0,
  review_count      int     default 0,
  badges            text[]  default '{}',
  integrations      text[]  default '{}',
  platforms         text[]  default '{}',
  website           text,
  africa_friendly   boolean default false,
  best_for          text[]  default '{}',
  pros              text[]  default '{}',
  cons              text[]  default '{}',
  featured          boolean default false,
  last_updated      date    default current_date,
  created_at        timestamptz default now()
);

create index if not exists tools_category_idx  on tools(category);
create index if not exists tools_slug_idx       on tools(slug);
create index if not exists tools_rating_idx     on tools(rating desc);

-- ──────────────────────────────────────────────────────────
-- ARTICLES
-- ──────────────────────────────────────────────────────────
create table if not exists articles (
  id             uuid primary key default uuid_generate_v4(),
  slug           text    not null unique,
  title          text    not null,
  excerpt        text,
  content        text,
  featured_image text,
  author_id      uuid    references authors(id),
  status         text    not null default 'draft'   check (status in ('draft','published','archived')),
  published_at   timestamptz,
  updated_at     timestamptz default now(),
  read_time      int     default 5,
  category       text    not null,
  tags           text[]  default '{}',
  target_roles   text[]  default '{}',
  view_count     int     default 0,
  featured       boolean default false,
  created_at     timestamptz default now()
);

create index if not exists articles_slug_idx     on articles(slug);
create index if not exists articles_status_idx   on articles(status);
create index if not exists articles_published_idx on articles(published_at desc);

-- ──────────────────────────────────────────────────────────
-- STACKS
-- ──────────────────────────────────────────────────────────
create table if not exists stacks (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique,
  name        text not null,
  description text,
  creator_id  uuid references auth.users(id) on delete set null,
  target_role text,
  category    text,
  clone_count int  default 0,
  rating      numeric(3,2) default 0,
  featured    boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Junction table: stacks ↔ tools (with ordering)
create table if not exists stack_tools (
  id       uuid primary key default uuid_generate_v4(),
  stack_id uuid references stacks(id) on delete cascade,
  tool_id  uuid references tools(id)  on delete cascade,
  position int  default 0,
  unique(stack_id, tool_id)
);

create index if not exists stack_tools_stack_idx on stack_tools(stack_id);

-- ──────────────────────────────────────────────────────────
-- REVIEWS
-- ──────────────────────────────────────────────────────────
create table if not exists reviews (
  id         uuid primary key default uuid_generate_v4(),
  tool_id    uuid references tools(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  user_name  text,
  verified   boolean default false,
  rating     int     not null check (rating between 1 and 5),
  content    text,
  upvotes    int     default 0,
  downvotes  int     default 0,
  location   text,
  created_at timestamptz default now()
);

create index if not exists reviews_tool_idx on reviews(tool_id);

-- ──────────────────────────────────────────────────────────
-- USER SAVED ITEMS
-- ──────────────────────────────────────────────────────────
create table if not exists saved_tools (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  tool_id     uuid references tools(id) on delete cascade,
  saved_at    timestamptz default now(),
  unique(user_id, tool_id)
);

create table if not exists saved_stacks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  stack_id    uuid references stacks(id) on delete cascade,
  saved_at    timestamptz default now(),
  unique(user_id, stack_id)
);

-- ──────────────────────────────────────────────────────────
-- NEWSLETTER SUBSCRIBERS
-- ──────────────────────────────────────────────────────────
create table if not exists newsletter_subscribers (
  id             uuid primary key default uuid_generate_v4(),
  email          text not null unique,
  role           text,
  subscribed_at  timestamptz default now(),
  confirmed      boolean default false,
  unsubscribed   boolean default false
);

-- ──────────────────────────────────────────────────────────
-- USER PROFILES (mirrors auth.users with extra fields)
-- ──────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  avatar_url    text,
  role          text,
  bio           text,
  website       text,
  twitter       text,
  ai_tool_score int default 0,
  primary_goals TEXT[] DEFAULT '{}',
  monthly_tool_budget INT DEFAULT 0,
  team_size TEXT,
  onboarding_complete BOOLEAN DEFAULT false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'role'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ──────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────

-- Tools: public read, admin write
alter table tools              enable row level security;
create policy "tools_public_read"    on tools    for select using (true);

-- Articles: public read of published only
alter table articles           enable row level security;
create policy "articles_public_read" on articles for select using (status = 'published');

-- Stacks: public read
alter table stacks             enable row level security;
create policy "stacks_public_read"   on stacks   for select using (true);
create policy "stacks_owner_insert"  on stacks   for insert with check (auth.uid() = creator_id);
create policy "stacks_owner_update"  on stacks   for update using (auth.uid() = creator_id);
create policy "stacks_owner_delete"  on stacks   for delete using (auth.uid() = creator_id);

-- Stack tools: public read
alter table stack_tools        enable row level security;
create policy "stack_tools_public_read" on stack_tools for select using (true);
create policy "stack_tools_owner_write" on stack_tools for all using (
  auth.uid() = (select creator_id from stacks where id = stack_id)
);

-- Reviews: public read, authenticated write
alter table reviews            enable row level security;
create policy "reviews_public_read"  on reviews for select using (true);
create policy "reviews_auth_insert"  on reviews for insert with check (auth.uid() = user_id);

-- Saved tools: owner only
alter table saved_tools        enable row level security;
create policy "saved_tools_owner"    on saved_tools for all using (auth.uid() = user_id);

-- Saved stacks: owner only
alter table saved_stacks       enable row level security;
create policy "saved_stacks_owner"   on saved_stacks for all using (auth.uid() = user_id);

-- Profiles: public read, owner write
alter table profiles           enable row level security;
create policy "profiles_public_read" on profiles for select using (true);
create policy "profiles_owner_write" on profiles for update using (auth.uid() = id);

-- Newsletter: no direct access (use service role in API routes)
alter table newsletter_subscribers enable row level security;
create policy "newsletter_service_only" on newsletter_subscribers for all using (false);

-- Tool categories: public read
alter table tool_categories    enable row level security;
create policy "categories_public_read" on tool_categories for select using (true);


-- ----------------------------------------------------
-- SEMANTIC SEARCH EXTENSION (Phase 4 & 5)
-- ----------------------------------------------------
-- Enable pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tools' AND column_name='embedding') THEN
        ALTER TABLE tools ADD COLUMN embedding vector(1536);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='articles' AND column_name='embedding') THEN
        ALTER TABLE articles ADD COLUMN embedding vector(1536);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION search_tools_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid, name text, slug text, tagline text,
  similarity float
)
LANGUAGE sql STABLE AS \$\$
  SELECT id, name, slug, tagline,
  1 - (embedding <=> query_embedding) AS similarity
  FROM tools
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
\$\$;

CREATE OR REPLACE FUNCTION search_articles_semantic(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid, title text, slug text, meta_description text,
  similarity float
)
LANGUAGE sql STABLE AS \$\$
  SELECT id, title, slug, meta_description,
  1 - (embedding <=> query_embedding) AS similarity
  FROM articles
  WHERE 1 - (embedding <=> query_embedding) > match_threshold AND status = 'PUBLISHED'
  ORDER BY similarity DESC
  LIMIT match_count;
\$\$;

-- ----------------------------------------------------
-- ENHANCED PROFILES SCHEMA (Phase 6)
-- ----------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT; -- 'freelancer', 'founder', 'agency'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_goals TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_tool_budget INT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free'; -- 'free', 'pro', 'team'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email_radar": true, "email_alerts": false}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
