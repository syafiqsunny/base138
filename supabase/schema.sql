create extension if not exists pgcrypto;

create type source_type as enum ('rss', 'google_cse', 'newsapi', 'gdelt');
create type editorial_status as enum ('pending_review', 'approved', 'rejected', 'merged', 'assigned');
create type editorial_action_type as enum ('approve', 'reject', 'merge', 'assign_reporter', 'blacklist_source');

create table if not exists news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type source_type not null,
  url text not null unique,
  approved boolean not null default false,
  credibility_score integer not null default 50 check (credibility_score between 0 and 100),
  permissions_note text,
  robots_last_checked_at timestamptz,
  robots_allowed boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists monitored_keywords (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  state text,
  dun text,
  party text,
  leader text,
  issue text,
  active boolean not null default true,
  sample_data boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists article_clusters (
  cluster_key text primary key,
  representative_title text not null,
  state text,
  dun text,
  party text,
  leader text,
  issue text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists harvested_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_name text not null,
  source_type source_type not null,
  source_url text,
  original_url text not null,
  canonical_url text not null,
  published_at timestamptz,
  summary text,
  snippet text,
  ai_summary text not null,
  state text not null default 'Unknown',
  dun text,
  party text,
  leader text,
  issue text,
  attribution text not null,
  image_permission_status text not null default 'not_requested',
  relevance_score integer not null check (relevance_score between 0 and 100),
  source_credibility_score integer not null check (source_credibility_score between 0 and 100),
  urgency_score integer not null check (urgency_score between 0 and 100),
  content_hash text not null,
  cluster_key text not null references article_clusters(cluster_key) on delete restrict,
  editorial_status editorial_status not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (canonical_url),
  unique (content_hash)
);

create table if not exists article_cluster_members (
  cluster_key text not null references article_clusters(cluster_key) on delete cascade,
  article_id uuid not null references harvested_articles(id) on delete cascade,
  similarity_score numeric(4, 3) not null default 1,
  match_reason text not null,
  created_at timestamptz not null default now(),
  primary key (cluster_key, article_id)
);

create table if not exists editorial_queue (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references harvested_articles(id) on delete cascade,
  status editorial_status not null default 'pending_review',
  priority_score integer not null default 0,
  assigned_reporter_id text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id)
);

create table if not exists editorial_actions_audit (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid references editorial_queue(id) on delete set null,
  article_id uuid references harvested_articles(id) on delete set null,
  action editorial_action_type not null,
  editor_id text not null,
  note text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists source_blacklist (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique,
  reason text not null,
  active boolean not null default true,
  blacklisted_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists harvester_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  merged_count integer not null default 0,
  failed_count integer not null default 0
);

create table if not exists harvester_run_errors (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references harvester_runs(id) on delete cascade,
  source text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists harvested_articles_cluster_key_idx on harvested_articles(cluster_key);
create index if not exists harvested_articles_state_idx on harvested_articles(state);
create index if not exists harvested_articles_dun_idx on harvested_articles(dun);
create index if not exists harvested_articles_party_idx on harvested_articles(party);
create index if not exists harvested_articles_issue_idx on harvested_articles(issue);
create index if not exists editorial_queue_status_idx on editorial_queue(status, priority_score desc);

create or replace view news_stats_by_state as
select coalesce(state, 'Unknown') as label, count(*)::integer as count
from harvested_articles
group by 1
order by count desc;

create or replace view news_stats_by_dun as
select coalesce(dun, 'Unclassified') as label, count(*)::integer as count
from harvested_articles
where dun is not null
group by 1
order by count desc;

create or replace view news_stats_by_party as
select coalesce(party, 'Unclassified') as label, count(*)::integer as count
from harvested_articles
where party is not null
group by 1
order by count desc;

create or replace view news_stats_by_issue as
select coalesce(issue, 'Unclassified') as label, count(*)::integer as count
from harvested_articles
where issue is not null
group by 1
order by count desc;
