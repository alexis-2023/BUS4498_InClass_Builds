-- Stages 11–13: short-term context, event updates, and moderator lessons.

alter table public.events
  add column if not exists looked_at jsonb not null default '[]'::jsonb,
  add column if not exists replaced_by uuid references public.events(id);

create table if not exists public.agent_lessons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  lesson text not null
    check (char_length(btrim(lesson)) between 1 and 280)
);

alter table public.agent_lessons enable row level security;

revoke all on table public.agent_lessons from anon, authenticated;

create policy "Moderators can read agent lessons"
  on public.agent_lessons
  for select
  to authenticated
  using (public.is_moderator());

create policy "Moderators can write agent lessons"
  on public.agent_lessons
  for insert
  to authenticated
  with check (
    public.is_moderator()
    and created_by = auth.uid()
  );

grant select, insert
on table public.agent_lessons
to authenticated;

grant select, insert, update, delete
on table public.agent_lessons
to service_role;

grant select, update
on table public.events
to service_role;
