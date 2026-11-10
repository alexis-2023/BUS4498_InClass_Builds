-- Stage 11: the club list (stable knowledge for the event agent).
-- This adds a new table without changing the existing events or memory tables.

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique
    check (char_length(btrim(name)) between 1 and 160),
  nicknames text not null default '',
  usual_place_code text not null default '',
  usual_place_detail text not null default '',
  active boolean not null default true,
  note text not null default ''
);

alter table public.clubs enable row level security;

-- The website may see only active club names and nicknames. The usual place
-- and moderator note stay out of the public table API. The agent uses the
-- service-role connection, so it can read the full active rows.
revoke all on table public.clubs from anon, authenticated;

create policy "Public can read active clubs"
  on public.clubs
  for select
  to anon, authenticated
  using (active = true);

grant select (
  id,
  name,
  nicknames,
  active
)
on table public.clubs
to anon, authenticated;

grant select, insert, update, delete
on table public.clubs
to service_role;

insert into public.clubs
  (name, nicknames, usual_place_code, usual_place_detail, active, note)
values
  ('Board Game Guild', 'BGG, board game club', 'UU', 'Room 220', true, ''),
  ('Mustang Pitch Society', 'MPS, pitch society', 'UU-PLAZA', '', true, ''),
  ('Women in Finance Circle', 'WIFC, women in finance', '', '', true, ''),
  ('Sustainability Crew', 'SC, sustainability club', '', '', true, ''),
  ('Accounting Society', 'AS, accounting club', '', '', true, ''),
  ('Cal Poly Ski & Snowboard Club', 'ski club, snowboard club', '', '', true, '')
on conflict (name) do nothing;
