-- ═══════════════════════════════════════════════════════════
-- SPE UI Admin - Supabase Schema (Production)
-- Run this in the SQL Editor at supabase.com/dashboard
-- ═══════════════════════════════════════════════════════════

-- 1. Team Members
create table if not exists team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  department text not null,
  email text not null,
  linkedin text,
  twitter text,
  image_url text,
  created_at timestamptz default now()
);

-- 2. Blog Posts (content is full HTML - stored and retrieved byte-for-byte)
create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  category text not null,
  description text default '',
  content text default '',
  cover_image_url text,
  author text not null,
  author_name text default '',
  author_image_url text,
  author_role text default '',
  tags text[] default '{}',
  status text default 'Draft' check (status in ('Published', 'Draft')),
  read_time text default '1 min read',
  created_at timestamptz default now()
);

-- 3. Events
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  date text not null,
  time text not null,
  location text default '',
  image_url text,
  youtube_url text,
  status text default 'Draft' check (status in ('Upcoming', 'Draft', 'Completed')),
  description text default '',
  created_at timestamptz default now()
);

-- 4. Media Files
create table if not exists media_files (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  url text not null,
  size text default '0 KB',
  type text default 'image/png',
  tags text[] default '{}',
  file_group text default 'All',
  created_at timestamptz default now()
);

-- 5. Spotlights (references team_members)
create table if not exists spotlights (
  id uuid default gen_random_uuid() primary key,
  team_member_id uuid references team_members(id) on delete cascade,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- 6. Submissions (from public website contact/newsletter forms)
create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  status text default 'New' check (status in ('New', 'Read')),
  created_at timestamptz default now()
);

-- 7. Admin Users (custom auth - NO Supabase Auth)
create table if not exists admin_users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  password_hash text not null,
  role text default 'events' check (role in ('admin', 'media', 'events')),
  created_at timestamptz default now()
);


-- ═══════════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════════

create index if not exists idx_blog_posts_slug on blog_posts (slug);
create index if not exists idx_blog_posts_status on blog_posts (status);
create index if not exists idx_events_status on events (status);
create index if not exists idx_media_files_group on media_files (file_group);
create index if not exists idx_submissions_status on submissions (status);
create index if not exists idx_admin_users_email on admin_users (email);


-- ═══════════════════════════════════════════════════════════
-- Storage Bucket
-- ═══════════════════════════════════════════════════════════
-- In Supabase Dashboard → Storage:
--   1. Create bucket called "media" 
--   2. Set it to PUBLIC (images must be accessible via URL)
--   3. Under Policies, add:
--      - Allow public SELECT (so images render on the public site)
--      - Allow INSERT/DELETE only for service_role (our API handles this)


-- ═══════════════════════════════════════════════════════════
-- Row Level Security (RLS) - Production Policies
--
-- Architecture:
--   • Admin panel API routes use service_role key → bypasses RLS
--   • Public-facing site (spe-ui) uses anon key → restricted by RLS
--   • RLS = defense-in-depth, not the only auth layer
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
alter table team_members enable row level security;
alter table blog_posts enable row level security;
alter table events enable row level security;
alter table media_files enable row level security;
alter table spotlights enable row level security;
alter table submissions enable row level security;
alter table admin_users enable row level security;


-- ── team_members ──────────────────────────────────────────
-- Public site can read team members (for About/Team page)
create policy "anon_read_team" on team_members
  for select to anon using (true);
-- No anon write access
create policy "anon_no_insert_team" on team_members
  for insert to anon with check (false);
create policy "anon_no_update_team" on team_members
  for update to anon using (false);
create policy "anon_no_delete_team" on team_members
  for delete to anon using (false);


-- ── blog_posts ────────────────────────────────────────────
-- Public site can ONLY read published posts
create policy "anon_read_published_blogs" on blog_posts
  for select to anon using (status = 'Published');
-- No anon write access
create policy "anon_no_insert_blogs" on blog_posts
  for insert to anon with check (false);
create policy "anon_no_update_blogs" on blog_posts
  for update to anon using (false);
create policy "anon_no_delete_blogs" on blog_posts
  for delete to anon using (false);


-- ── events ────────────────────────────────────────────────
-- Public site can read upcoming/completed events (not drafts)
create policy "anon_read_active_events" on events
  for select to anon using (status in ('Upcoming', 'Completed'));
-- No anon write access
create policy "anon_no_insert_events" on events
  for insert to anon with check (false);
create policy "anon_no_update_events" on events
  for update to anon using (false);
create policy "anon_no_delete_events" on events
  for delete to anon using (false);


-- ── media_files ───────────────────────────────────────────
-- Public site can read media (images render on blog posts, etc.)
create policy "anon_read_media" on media_files
  for select to anon using (true);
-- No anon write access
create policy "anon_no_insert_media" on media_files
  for insert to anon with check (false);
create policy "anon_no_update_media" on media_files
  for update to anon using (false);
create policy "anon_no_delete_media" on media_files
  for delete to anon using (false);


-- ── spotlights ────────────────────────────────────────────
-- Public site can read spotlights
create policy "anon_read_spotlights" on spotlights
  for select to anon using (true);
-- No anon write access
create policy "anon_no_insert_spotlights" on spotlights
  for insert to anon with check (false);
create policy "anon_no_update_spotlights" on spotlights
  for update to anon using (false);
create policy "anon_no_delete_spotlights" on spotlights
  for delete to anon using (false);


-- ── submissions ───────────────────────────────────────────
-- Public site CAN insert (contact form / newsletter signup)
create policy "anon_submit" on submissions
  for insert to anon with check (true);
-- Public site CANNOT read submissions
create policy "anon_no_read_submissions" on submissions
  for select to anon using (false);
create policy "anon_no_update_submissions" on submissions
  for update to anon using (false);
create policy "anon_no_delete_submissions" on submissions
  for delete to anon using (false);


-- ── admin_users ───────────────────────────────────────────
-- ZERO public access - completely locked down
create policy "anon_no_access_admins" on admin_users
  for all to anon using (false) with check (false);


-- 8. Sponsor Submissions (brochure download requests from public site)
create table if not exists sponsor_submissions (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  organization text not null,
  status text default 'New' check (status in ('New', 'Read')),
  created_at timestamptz default now()
);

create index if not exists idx_sponsor_submissions_status on sponsor_submissions (status);

-- Enable RLS
alter table sponsor_submissions enable row level security;

-- Public site CAN insert (sponsor brochure request form)
create policy "anon_submit_sponsor" on sponsor_submissions
  for insert to anon with check (true);
-- Public site CANNOT read/modify sponsor submissions
create policy "anon_no_read_sponsors" on sponsor_submissions
  for select to anon using (false);
create policy "anon_no_update_sponsors" on sponsor_submissions
  for update to anon using (false);
create policy "anon_no_delete_sponsors" on sponsor_submissions
  for delete to anon using (false);
