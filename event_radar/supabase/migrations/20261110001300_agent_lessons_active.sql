-- Stage 13: let moderators switch persistent agent lessons on or off.
-- This extends the existing agent_lessons table; it does not replace it.

alter table public.agent_lessons
  add column if not exists active boolean not null default true;

alter table public.events
  add column if not exists lessons_used text[] not null default '{}'::text[];

create policy "Moderators can toggle agent lessons"
  on public.agent_lessons
  for update
  to authenticated
  using (public.is_moderator())
  with check (public.is_moderator());

grant update (active)
on table public.agent_lessons
to authenticated;
