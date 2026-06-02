-- ============================================================
-- beta_full_schema.sql
-- COMPLETE schema for a FRESH Supabase project (the beta database).
-- Run this once in: Supabase Dashboard → SQL Editor → New query
--
-- Includes: base tables + user_id multi-tenancy + RLS policies.
-- Do NOT run this on the production database (it already has tables).
-- ============================================================

-- ---------- 1. Tables ----------

CREATE TABLE IF NOT EXISTS accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username       text NOT NULL,
  display_name   text,
  ecosystem      text,            -- ronin | immutable | abstract | other
  category       text,            -- official_game | ecosystem | founder | creator | analytics | media | guild | influencer
  priority       integer NOT NULL DEFAULT 5,
  active         boolean NOT NULL DEFAULT true,
  last_checked   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  notes          text,
  follower_count integer,
  avatar_url     text
);

CREATE TABLE IF NOT EXISTS tweets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tweet_id      text NOT NULL UNIQUE,   -- required for collect upsert (onConflict: tweet_id)
  username      text,
  display_name  text,
  content       text,
  url           text,
  likes         integer NOT NULL DEFAULT 0,
  reposts       integer NOT NULL DEFAULT 0,
  replies       integer NOT NULL DEFAULT 0,
  views         integer NOT NULL DEFAULT 0,
  posted_at     timestamptz,
  fetched_at    timestamptz NOT NULL DEFAULT now(),
  processed     boolean NOT NULL DEFAULT false,
  raw_data      jsonb
);

CREATE TABLE IF NOT EXISTS events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title            text,
  summary          text,
  ecosystem        text,
  category         text,
  importance_score integer,
  keywords         text[],
  source_tweets    jsonb,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS summaries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  timeframe   text,
  ecosystems  text[],
  content     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_ideas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text,
  description   text,
  format        text,            -- thread | infographic | guide | comparison | analysis | narrative | breakdown
  angle         text,
  potential     text,            -- high | medium | low
  source_events jsonb,
  status        text NOT NULL DEFAULT 'idea',  -- idea | draft | preparing | review | published
  created_at    timestamptz NOT NULL DEFAULT now(),
  notes         text,
  priority      integer NOT NULL DEFAULT 5
);

CREATE TABLE IF NOT EXISTS activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type        text,
  message     text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  code        text NOT NULL,
  invited_by  uuid REFERENCES auth.users(id),
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email, code)
);

-- ---------- 2. Indexes (fast per-user queries) ----------

CREATE INDEX IF NOT EXISTS accounts_user_id_idx      ON accounts(user_id);
CREATE INDEX IF NOT EXISTS tweets_user_id_idx        ON tweets(user_id);
CREATE INDEX IF NOT EXISTS events_user_id_idx        ON events(user_id);
CREATE INDEX IF NOT EXISTS summaries_user_id_idx     ON summaries(user_id);
CREATE INDEX IF NOT EXISTS content_ideas_user_id_idx ON content_ideas(user_id);
CREATE INDEX IF NOT EXISTS activities_user_id_idx    ON activities(user_id);

-- ---------- 3. Row Level Security ----------

ALTER TABLE accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites       ENABLE ROW LEVEL SECURITY;

-- Each user can only touch their own rows. Service role bypasses RLS
-- automatically (used by the pipeline cron routes).
CREATE POLICY "accounts_owner"      ON accounts      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tweets_owner"        ON tweets        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "events_owner"        ON events        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "summaries_owner"     ON summaries     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "content_ideas_owner" ON content_ideas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_owner"    ON activities    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Invites: no anon/user access at all; only the service role (server) reads/writes.
CREATE POLICY "invites_deny_all"    ON invites       FOR ALL USING (false);
