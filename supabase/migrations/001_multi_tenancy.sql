-- ============================================================
-- 001_multi_tenancy.sql
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add user_id to every table
ALTER TABLE accounts      ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tweets        ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE events        ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE summaries     ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE content_ideas ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE activities    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Indexes for fast per-user queries
CREATE INDEX IF NOT EXISTS accounts_user_id_idx      ON accounts(user_id);
CREATE INDEX IF NOT EXISTS tweets_user_id_idx        ON tweets(user_id);
CREATE INDEX IF NOT EXISTS events_user_id_idx        ON events(user_id);
CREATE INDEX IF NOT EXISTS summaries_user_id_idx     ON summaries(user_id);
CREATE INDEX IF NOT EXISTS content_ideas_user_id_idx ON content_ideas(user_id);
CREATE INDEX IF NOT EXISTS activities_user_id_idx    ON activities(user_id);

-- 3. Invites table (invite-only beta)
CREATE TABLE IF NOT EXISTS invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  code        text NOT NULL,
  invited_by  uuid REFERENCES auth.users(id),
  used_at     timestamp with time zone,
  created_at  timestamp with time zone DEFAULT now(),
  UNIQUE(email, code)
);

-- 4. Enable RLS on all tables
ALTER TABLE accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites       ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies — users see only their own rows
DROP POLICY IF EXISTS "accounts_owner"      ON accounts;
DROP POLICY IF EXISTS "tweets_owner"        ON tweets;
DROP POLICY IF EXISTS "events_owner"        ON events;
DROP POLICY IF EXISTS "summaries_owner"     ON summaries;
DROP POLICY IF EXISTS "content_ideas_owner" ON content_ideas;
DROP POLICY IF EXISTS "activities_owner"    ON activities;

CREATE POLICY "accounts_owner"      ON accounts      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "tweets_owner"        ON tweets        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "events_owner"        ON events        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "summaries_owner"     ON summaries     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "content_ideas_owner" ON content_ideas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "activities_owner"    ON activities    FOR ALL USING (auth.uid() = user_id);

-- Invites: only service role can read/write (via anon deny-all)
CREATE POLICY "invites_deny_all" ON invites FOR ALL USING (false);
