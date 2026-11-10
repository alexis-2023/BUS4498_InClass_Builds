-- Stage 14 compatibility layer for the existing Club Event Radar memory schema.
-- This preserves looked_at, agent_lessons, replaced_by, archived statuses, and all
-- existing events policies. It only adds chat-source tracking and the reader cursor.

alter table public.events
  add column if not exists source text not null default 'website',
  add column if not exists source_id text not null default '',
  add column if not exists source_name text not null default '';

create unique index if not exists events_one_per_message
  on public.events (source, source_id)
  where source_id <> '';

create table if not exists public.channel_cursor (
  source text primary key,
  last_id text not null default '',
  read_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.channel_cursor enable row level security;
revoke all on table public.channel_cursor from anon, authenticated;
grant select, insert, update, delete on table public.channel_cursor to service_role;

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- After confirming the selected chat provider and replacing the two placeholders,
-- schedule the reader. This is intentionally left commented so applying this file
-- cannot start polling an unconfigured GroupMe account.
--
-- select cron.schedule(
--   'read-chat-channel',
--   '* * * * *',
--   $$
--     select net.http_post(
--       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/read-channel',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'apikey', 'YOUR_PUBLISHABLE_KEY'
--       ),
--       body := '{}'::jsonb,
--       timeout_milliseconds := 25000
--     ) as request_id
--   $$
-- );
