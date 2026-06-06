-- ============================================================
-- DISCOVA Tool Intelligence Readiness
-- Run in Supabase SQL Editor before Vercel production deploy.
-- Safe to run more than once.
-- ============================================================

create extension if not exists "uuid-ossp";

-- Core rich fields used by premium tool cards and tool pages.
alter table if exists tools add column if not exists long_description text;
alter table if exists tools add column if not exists company_name text;
alter table if exists tools add column if not exists hero_image text;
alter table if exists tools add column if not exists gallery_images text[] default '{}';
alter table if exists tools add column if not exists audience text[] default '{}';
alter table if exists tools add column if not exists use_cases text[] default '{}';
alter table if exists tools add column if not exists ai_summary_30 text;
alter table if exists tools add column if not exists ai_summary_120 text;
alter table if exists tools add column if not exists ai_deep_analysis text;
alter table if exists tools add column if not exists verified boolean default false;
alter table if exists tools add column if not exists is_featured boolean default false;
alter table if exists tools add column if not exists is_new boolean default false;
alter table if exists tools add column if not exists pricing_model text;
alter table if exists tools add column if not exists website_url text;
alter table if exists tools add column if not exists status text default 'active';
alter table if exists tools add column if not exists updated_at timestamptz default now();

update tools
set
  website_url = coalesce(website_url, website),
  is_featured = coalesce(is_featured, featured, false),
  long_description = coalesce(long_description, description),
  pricing_model = coalesce(pricing_model, case when has_free then 'freemium' else 'paid' end)
where true;

create table if not exists tool_companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  website_url text,
  logo_url text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists verification_status (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid not null unique references tools(id) on delete cascade,
  official_website_verified boolean default false,
  working_product boolean default false,
  reviewed_by_discova boolean default false,
  no_malware boolean default false,
  no_spam boolean default false,
  recently_updated boolean default false,
  trusted_source boolean default false,
  notes text,
  verified_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists tool_features (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid not null references tools(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  priority int default 0,
  created_at timestamptz default now()
);

create table if not exists tool_gallery (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid not null references tools(id) on delete cascade,
  image_url text not null,
  title text,
  alt text,
  media_type text default 'screenshot' check (media_type in ('screenshot','mobile','dashboard','feature','before_after','gif','video_preview')),
  position int default 0,
  cloudinary_public_id text,
  created_at timestamptz default now()
);

create table if not exists tool_faqs (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid not null references tools(id) on delete cascade,
  question text not null,
  answer text not null,
  display_order int default 0,
  created_at timestamptz default now()
);

create table if not exists tool_use_cases (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid not null references tools(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  priority int default 0,
  created_at timestamptz default now()
);

create table if not exists tool_tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz default now()
);

create table if not exists tool_tag_links (
  tool_id uuid not null references tools(id) on delete cascade,
  tag_id uuid not null references tool_tags(id) on delete cascade,
  primary key (tool_id, tag_id)
);

create table if not exists tool_pricing_details (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid not null references tools(id) on delete cascade,
  tier_name text not null,
  price_monthly numeric,
  price_annual numeric,
  currency text default 'USD',
  features text[] default '{}',
  is_popular boolean default false,
  is_free_tier boolean default false,
  created_at timestamptz default now()
);

create table if not exists tool_comparisons (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  tool_a_id uuid references tools(id) on delete cascade,
  tool_b_id uuid references tools(id) on delete cascade,
  summary text,
  verdict text,
  winner_tool_id uuid references tools(id) on delete set null,
  seo_title text,
  seo_description text,
  status text default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tool_collections (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  description text,
  hero_image text,
  featured boolean default false,
  status text default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tool_collection_items (
  collection_id uuid not null references tool_collections(id) on delete cascade,
  tool_id uuid not null references tools(id) on delete cascade,
  position int default 0,
  primary key (collection_id, tool_id)
);

create table if not exists tool_awards (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid not null references tools(id) on delete cascade,
  title text not null,
  description text,
  awarded_at date default current_date,
  created_at timestamptz default now()
);

create table if not exists tool_news (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid not null references tools(id) on delete cascade,
  title text not null,
  url text,
  source text,
  published_at timestamptz,
  summary text,
  created_at timestamptz default now()
);

create table if not exists user_tool_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  tool_id uuid references tools(id) on delete cascade,
  event_type text not null check (event_type in ('view','save','share','compare','visit','quick_view','watch_video')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Existing tool_videos table may already exist with older columns.
create table if not exists tool_videos (
  id uuid primary key default uuid_generate_v4(),
  tool_id uuid not null references tools(id) on delete cascade,
  title text,
  youtube_url text,
  thumbnail text,
  duration text,
  creator text,
  featured boolean default false,
  position int default 0,
  created_at timestamptz default now()
);

alter table if exists tool_videos add column if not exists title text;
alter table if exists tool_videos add column if not exists youtube_url text;
alter table if exists tool_videos add column if not exists embed_url text;
alter table if exists tool_videos add column if not exists thumbnail text;
alter table if exists tool_videos add column if not exists duration text;
alter table if exists tool_videos add column if not exists creator text;
alter table if exists tool_videos add column if not exists featured boolean default false;
alter table if exists tool_videos add column if not exists position int default 0;

create index if not exists tool_features_tool_idx on tool_features(tool_id, priority);
create index if not exists tool_gallery_tool_idx on tool_gallery(tool_id, position);
create index if not exists tool_faqs_tool_idx on tool_faqs(tool_id, display_order);
create index if not exists tool_use_cases_tool_idx on tool_use_cases(tool_id, priority);
create index if not exists tool_videos_tool_position_idx on tool_videos(tool_id, position);
create index if not exists tool_news_tool_idx on tool_news(tool_id, published_at desc);
create index if not exists user_tool_events_tool_idx on user_tool_events(tool_id, created_at desc);
create index if not exists user_tool_events_user_idx on user_tool_events(user_id, created_at desc);

alter table tool_companies enable row level security;
alter table verification_status enable row level security;
alter table tool_features enable row level security;
alter table tool_gallery enable row level security;
alter table tool_faqs enable row level security;
alter table tool_use_cases enable row level security;
alter table tool_tags enable row level security;
alter table tool_tag_links enable row level security;
alter table tool_pricing_details enable row level security;
alter table tool_comparisons enable row level security;
alter table tool_collections enable row level security;
alter table tool_collection_items enable row level security;
alter table tool_awards enable row level security;
alter table tool_news enable row level security;
alter table user_tool_events enable row level security;
alter table tool_videos enable row level security;

drop policy if exists "tool_companies_public_read" on tool_companies;
create policy "tool_companies_public_read" on tool_companies for select using (true);
drop policy if exists "verification_status_public_read" on verification_status;
create policy "verification_status_public_read" on verification_status for select using (true);
drop policy if exists "tool_features_public_read" on tool_features;
create policy "tool_features_public_read" on tool_features for select using (true);
drop policy if exists "tool_gallery_public_read" on tool_gallery;
create policy "tool_gallery_public_read" on tool_gallery for select using (true);
drop policy if exists "tool_faqs_public_read" on tool_faqs;
create policy "tool_faqs_public_read" on tool_faqs for select using (true);
drop policy if exists "tool_use_cases_public_read" on tool_use_cases;
create policy "tool_use_cases_public_read" on tool_use_cases for select using (true);
drop policy if exists "tool_tags_public_read" on tool_tags;
create policy "tool_tags_public_read" on tool_tags for select using (true);
drop policy if exists "tool_tag_links_public_read" on tool_tag_links;
create policy "tool_tag_links_public_read" on tool_tag_links for select using (true);
drop policy if exists "tool_pricing_details_public_read" on tool_pricing_details;
create policy "tool_pricing_details_public_read" on tool_pricing_details for select using (true);
drop policy if exists "tool_comparisons_public_read" on tool_comparisons;
create policy "tool_comparisons_public_read" on tool_comparisons for select using (status = 'published');
drop policy if exists "tool_collections_public_read" on tool_collections;
create policy "tool_collections_public_read" on tool_collections for select using (status = 'published');
drop policy if exists "tool_collection_items_public_read" on tool_collection_items;
create policy "tool_collection_items_public_read" on tool_collection_items for select using (true);
drop policy if exists "tool_awards_public_read" on tool_awards;
create policy "tool_awards_public_read" on tool_awards for select using (true);
drop policy if exists "tool_news_public_read" on tool_news;
create policy "tool_news_public_read" on tool_news for select using (true);
drop policy if exists "tool_videos_public_read" on tool_videos;
create policy "tool_videos_public_read" on tool_videos for select using (true);

drop policy if exists "user_tool_events_user_insert" on user_tool_events;
create policy "user_tool_events_user_insert" on user_tool_events
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "user_tool_events_user_read_own" on user_tool_events;
create policy "user_tool_events_user_read_own" on user_tool_events
  for select using (auth.uid() = user_id);

-- Server/service role writes for CMS sync and admin tools.
drop policy if exists "tool_intelligence_service_write_features" on tool_features;
create policy "tool_intelligence_service_write_features" on tool_features for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "tool_intelligence_service_write_gallery" on tool_gallery;
create policy "tool_intelligence_service_write_gallery" on tool_gallery for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "tool_intelligence_service_write_faqs" on tool_faqs;
create policy "tool_intelligence_service_write_faqs" on tool_faqs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
drop policy if exists "tool_intelligence_service_write_videos" on tool_videos;
create policy "tool_intelligence_service_write_videos" on tool_videos for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Newsletter route expects these columns.
alter table if exists newsletter_subscribers add column if not exists topics jsonb;
alter table if exists newsletter_subscribers add column if not exists frequency text default 'weekly';
alter table if exists newsletter_subscribers add column if not exists status text default 'active';
alter table if exists newsletter_subscribers add column if not exists updated_at timestamptz default now();
