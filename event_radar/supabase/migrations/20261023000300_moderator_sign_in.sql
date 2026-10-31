create or replace function public.is_moderator()
returns boolean
language sql
stable
as $function$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role' = 'moderator',
    false
  );
$function$;

revoke execute on function public.is_moderator() from public;
grant execute on function public.is_moderator() to authenticated;

create policy "Authenticated moderators can read all events"
  on public.events
  for select
  to authenticated
  using (public.is_moderator());

create policy "Authenticated moderators can review events"
  on public.events
  for update
  to authenticated
  using (public.is_moderator())
  with check (
    public.is_moderator()
    and status in ('published', 'waiting', 'rejected')
  );

grant select
on table public.events
to authenticated;

grant update (
  status,
  status_reason,
  reviewed_at,
  reviewed_by
)
on table public.events
to authenticated;
