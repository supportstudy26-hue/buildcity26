-- Run once in Supabase SQL Editor. Safe to re-run.
begin;
create table if not exists public.cities (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 36),
  state jsonb not null check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 2000000),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cities_owner_updated_idx on public.cities(owner_id, updated_at desc);
alter table public.cities enable row level security;
revoke all on public.cities from public, anon;
revoke all on public.cities from authenticated;
grant select, insert, update, delete on public.cities to authenticated;
drop policy if exists cities_select_own on public.cities;
drop policy if exists cities_insert_own on public.cities;
drop policy if exists cities_update_own on public.cities;
drop policy if exists cities_delete_own on public.cities;
create policy cities_select_own on public.cities for select to authenticated using ((select auth.uid()) = owner_id);
create policy cities_insert_own on public.cities for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy cities_update_own on public.cities for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy cities_delete_own on public.cities for delete to authenticated using ((select auth.uid()) = owner_id);

-- Atomic optimistic save: stale devices cannot overwrite a newer revision.
create or replace function public.save_city(p_city_id uuid, p_name text, p_state jsonb, p_expected_revision bigint)
returns setof public.cities
language plpgsql security invoker set search_path = '' as $$
declare saved public.cities;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_city_id is null or p_name is null or char_length(trim(p_name)) not between 1 and 36 or p_state is null
     or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text)>2000000
     or p_state->>'schemaVersion' is distinct from '1' or p_expected_revision is null or p_expected_revision<0 then
    raise exception 'Invalid save payload' using errcode='22023';
  end if;
  if p_expected_revision=0 then
    insert into public.cities(id,owner_id,name,state) values(p_city_id,auth.uid(),trim(p_name),p_state)
      on conflict (id) do nothing returning * into saved;
  else
    update public.cities set name=trim(p_name),state=p_state,revision=revision+1,updated_at=now()
      where id=p_city_id and owner_id=auth.uid() and revision=p_expected_revision returning * into saved;
  end if;
  if saved.id is null then raise exception 'BC26_CONFLICT' using errcode='40001'; end if;
  return next saved;
end;
$$;
revoke all on function public.save_city(uuid,text,jsonb,bigint) from public, anon;
grant execute on function public.save_city(uuid,text,jsonb,bigint) to authenticated;
commit;

-- Additive migration: existing cities, revisions and v1 clients are preserved.
begin;
alter table public.cities add column if not exists last_save_request uuid;

create or replace function public.save_city_v2(
  p_city_id uuid, p_name text, p_state jsonb, p_expected_revision bigint, p_request_id uuid
) returns setof public.cities
language plpgsql security invoker set search_path = '' as $$
declare saved public.cities;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_city_id is null or p_request_id is null or p_name is null
    or char_length(trim(p_name)) not between 1 and 36 or p_state is null
    or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text)>2000000
    or coalesce(p_state->>'schemaVersion','') not in ('1','2')
    or p_expected_revision is null or p_expected_revision<0 then
    raise exception 'Invalid save payload' using errcode='22023';
  end if;
  if p_expected_revision=0 then
    insert into public.cities(id,owner_id,name,state,last_save_request)
      values(p_city_id,auth.uid(),trim(p_name),p_state,p_request_id)
      on conflict (id) do nothing returning * into saved;
    if saved.id is not null then return next saved; return; end if;
  end if;
  -- Row lock serializes competing devices and retries of one request.
  select * into saved from public.cities
    where id=p_city_id and owner_id=auth.uid() for update;
  if saved.id is null then raise exception 'BC26_CONFLICT' using errcode='40001'; end if;
  if saved.last_save_request=p_request_id then return next saved; return; end if;
  if p_expected_revision=0 or saved.revision<>p_expected_revision then
    raise exception 'BC26_CONFLICT' using errcode='40001';
  end if;
  update public.cities set name=trim(p_name),state=p_state,
    revision=revision+1,updated_at=now(),last_save_request=p_request_id
    where id=p_city_id and owner_id=auth.uid() returning * into saved;
  return next saved;
end;
$$;
revoke all on function public.save_city_v2(uuid,text,jsonb,bigint,uuid) from public,anon;
grant execute on function public.save_city_v2(uuid,text,jsonb,bigint,uuid) to authenticated;

create or replace function public.delete_city_v2(p_city_id uuid,p_expected_revision bigint)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  delete from public.cities where id=p_city_id and owner_id=auth.uid() and revision=p_expected_revision;
  if not found then raise exception 'BC26_CONFLICT' using errcode='40001'; end if;
end;
$$;
revoke all on function public.delete_city_v2(uuid,bigint) from public,anon;
grant execute on function public.delete_city_v2(uuid,bigint) to authenticated;
create or replace function public.clear_legacy_save_request()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.state is distinct from old.state or new.name is distinct from old.name or new.revision is distinct from old.revision)
    and new.last_save_request is not distinct from old.last_save_request then
    new.last_save_request=null;
  end if;
  return new;
end;
$$;
drop trigger if exists cities_clear_legacy_request on public.cities;
create trigger cities_clear_legacy_request before update on public.cities
for each row execute function public.clear_legacy_save_request();
revoke all on function public.clear_legacy_save_request() from public,anon,authenticated;
notify pgrst,'reload schema';
commit;

-- Schema 3 simulation snapshots; additive, preserves all legacy saves.
begin;
create or replace function public.save_city_v2(
  p_city_id uuid, p_name text, p_state jsonb, p_expected_revision bigint, p_request_id uuid
) returns setof public.cities
language plpgsql security invoker set search_path = '' as $$
declare saved public.cities;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_city_id is null or p_request_id is null or p_name is null
    or char_length(trim(p_name)) not between 1 and 36 or p_state is null
    or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text)>2000000
    or coalesce(p_state->>'schemaVersion','') not in ('1','2','3')
    or p_expected_revision is null or p_expected_revision<0 then
    raise exception 'Invalid save payload' using errcode='22023';
  end if;
  if p_expected_revision=0 then
    insert into public.cities(id,owner_id,name,state,last_save_request)
      values(p_city_id,auth.uid(),trim(p_name),p_state,p_request_id)
      on conflict (id) do nothing returning * into saved;
    if saved.id is not null then return next saved; return; end if;
  end if;
  -- Row lock serializes competing devices and retries of one request.
  select * into saved from public.cities
    where id=p_city_id and owner_id=auth.uid() for update;
  if saved.id is null then raise exception 'BC26_CONFLICT' using errcode='40001'; end if;
  if saved.last_save_request=p_request_id then return next saved; return; end if;
  if p_expected_revision=0 or saved.revision<>p_expected_revision then
    raise exception 'BC26_CONFLICT' using errcode='40001';
  end if;
  update public.cities set name=trim(p_name),state=p_state,
    revision=revision+1,updated_at=now(),last_save_request=p_request_id
    where id=p_city_id and owner_id=auth.uid() returning * into saved;
  return next saved;
end;
$$;
revoke all on function public.save_city_v2(uuid,text,jsonb,bigint,uuid) from public,anon;
grant execute on function public.save_city_v2(uuid,text,jsonb,bigint,uuid) to authenticated;

notify pgrst,'reload schema';
commit;

-- 202610080003_terrain_saves.sql (additive)
-- Schema 3 simulation snapshots; additive, preserves all legacy saves.
begin;
create or replace function public.save_city_v2(
  p_city_id uuid, p_name text, p_state jsonb, p_expected_revision bigint, p_request_id uuid
) returns setof public.cities
language plpgsql security invoker set search_path = '' as $$
declare saved public.cities;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_city_id is null or p_request_id is null or p_name is null
    or char_length(trim(p_name)) not between 1 and 36 or p_state is null
    or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text)>2000000
    or coalesce(p_state->>'schemaVersion','') not in ('1','2','3','4')
    or p_expected_revision is null or p_expected_revision<0 then
    raise exception 'Invalid save payload' using errcode='22023';
  end if;
  if p_expected_revision=0 then
    insert into public.cities(id,owner_id,name,state,last_save_request)
      values(p_city_id,auth.uid(),trim(p_name),p_state,p_request_id)
      on conflict (id) do nothing returning * into saved;
    if saved.id is not null then return next saved; return; end if;
  end if;
  -- Row lock serializes competing devices and retries of one request.
  select * into saved from public.cities
    where id=p_city_id and owner_id=auth.uid() for update;
  if saved.id is null then raise exception 'BC26_CONFLICT' using errcode='40001'; end if;
  if saved.last_save_request=p_request_id then return next saved; return; end if;
  if p_expected_revision=0 or saved.revision<>p_expected_revision then
    raise exception 'BC26_CONFLICT' using errcode='40001';
  end if;
  update public.cities set name=trim(p_name),state=p_state,
    revision=revision+1,updated_at=now(),last_save_request=p_request_id
    where id=p_city_id and owner_id=auth.uid() returning * into saved;
  return next saved;
end;
$$;
revoke all on function public.save_city_v2(uuid,text,jsonb,bigint,uuid) from public,anon;
grant execute on function public.save_city_v2(uuid,text,jsonb,bigint,uuid) to authenticated;

notify pgrst,'reload schema';
commit;
