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

-- Clock/playback save version 5 (additive)
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
    or coalesce(p_state->>'schemaVersion','') not in ('1','2','3','4','5')
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

-- Schema 6 pinned geography snapshots; additive, preserves legacy saves and RLS/CAS.
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
    or coalesce(p_state->>'schemaVersion','') not in ('1','2','3','4','5','6')
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

-- Additive account layer. No password or plaintext recovery code is stored here.
begin;
create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
create table if not exists private.bc26_accounts(
  username text primary key check(username ~ '^[a-z0-9_]{3,24}$'),
  user_id uuid unique references auth.users(id) on delete cascade,
  identity_email text not null unique,
  request_hash text unique,
  first_city_id uuid not null,
  city_name text not null check(char_length(city_name) between 1 and 36),
  status text not null default 'pending' check(status in ('pending','ready')),
  recovery_hash text,recovery_generation integer not null default 0,code_acknowledged boolean not null default false,
  recovery_claim uuid,recovery_until timestamptz,
  revoked_after bigint not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists private.bc26_limits(
  key text primary key,bucket bigint not null,count integer not null
);
alter table private.bc26_accounts enable row level security;
alter table private.bc26_limits enable row level security;
revoke all on all tables in schema private from public,anon,authenticated;
create table if not exists public.profiles(
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check(username ~ '^[a-z0-9_]{3,24}$'),
  display_city_name text not null check(char_length(display_city_name) between 1 and 36),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public,anon,authenticated;
grant select on public.profiles to authenticated;

create or replace function public.bc26_session_valid() returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and not exists(
   select 1 from private.bc26_accounts a where a.user_id=auth.uid()
   and (a.recovery_claim is not null or coalesce((auth.jwt()->>'iat')::bigint,0)<a.revoked_after)
 )
$$;
revoke all on function public.bc26_session_valid() from public,anon;
grant execute on function public.bc26_session_valid() to authenticated;
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles for select to authenticated
 using(user_id=(select auth.uid()) and (select public.bc26_session_valid()));
-- Restrictive policy composes with all four existing owner policies/RPCs.
drop policy if exists cities_valid_account_session on public.cities;
create policy cities_valid_account_session on public.cities as restrictive to authenticated
 using((select public.bc26_session_valid())) with check((select public.bc26_session_valid()));

create or replace function public.bc26_account_rate(p_action text,p_ip_hash text,p_username_hash text)
returns boolean language plpgsql security definer set search_path='' as $$
declare b bigint:=floor(extract(epoch from clock_timestamp())/900); n integer; k text; cap integer; ok boolean:=true;
begin
 if p_action not in ('register','login','recover','claim','ack') or p_ip_hash !~ '^[a-f0-9]{64}$' or p_username_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid rate key';end if;
 for k,cap in select * from (values (p_action||':ip:'||p_ip_hash,case when p_action='login' then 60 else 20 end),
   (p_action||':user:'||p_username_hash,case when p_action='login' then 20 else 8 end)) as limits(key,cap) loop
  insert into private.bc26_limits(key,bucket,count) values(k,b,1)
  on conflict(key) do update set bucket=b,count=case when private.bc26_limits.bucket=b then private.bc26_limits.count+1 else 1 end returning count into n;
  if n>cap then ok:=false;end if;
 end loop;
 -- Bounded cleanup avoids growing indefinitely; correctness doesn't rely on it.
 delete from private.bc26_limits where key in(select key from private.bc26_limits where bucket<b-96 limit 100);
 return ok;
end $$;

create or replace function public.bc26_account_reserve(p_username text,p_request_hash text,p_city_name text,p_identity_email text,p_city_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a private.bc26_accounts;
begin
 if p_username !~ '^[a-z0-9_]{3,24}$' or p_request_hash !~ '^[a-f0-9]{64}$' or char_length(trim(p_city_name)) not between 1 and 36 or p_identity_email !~ '^[a-f0-9-]+@accounts\.buildcity26\.invalid$' or p_city_id is null then raise exception 'Invalid reservation';end if;
 insert into private.bc26_accounts(username,request_hash,city_name,identity_email,first_city_id)
 values(p_username,p_request_hash,trim(p_city_name),p_identity_email,p_city_id) on conflict do nothing;
 select * into a from private.bc26_accounts where username=p_username for update;
 if a.username is null or a.request_hash is distinct from p_request_hash then raise exception 'BC26_TAKEN';end if;
 return to_jsonb(a)-'recovery_hash'-'recovery_claim';
end $$;
create or replace function public.bc26_account_orphan(p_username text,p_request_hash text)
returns uuid language sql security definer set search_path='' as $$
 select u.id from private.bc26_accounts a join auth.users u on u.email=a.identity_email
 where a.username=p_username and a.request_hash=p_request_hash
$$;
create or replace function public.bc26_account_lookup(p_username text)
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('user_id',a.user_id,'identity_email',a.identity_email,
   'status',case when a.recovery_claim is not null then 'recovering' else a.status end,'revoked_after',a.revoked_after)
 from private.bc26_accounts a where a.username=p_username
$$;
create or replace function public.bc26_account_finish(p_username text,p_request_hash text,p_user_id uuid,p_state jsonb,p_code_hash text)
returns void language plpgsql security definer set search_path='' as $$
declare a private.bc26_accounts;
begin
 select * into a from private.bc26_accounts where username=p_username for update;
 if a.username is null or a.request_hash is distinct from p_request_hash or not exists(select 1 from auth.users where id=p_user_id and email=a.identity_email) or p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid account';end if;
 if a.status='ready' then if a.user_id<>p_user_id then raise exception 'Invalid owner';end if;return;end if;
 if p_state->>'schemaVersion'<>'6' or p_state->>'name' is distinct from a.city_name or octet_length(p_state::text)>2000000 then raise exception 'Invalid first city';end if;
 insert into public.profiles(user_id,username,display_city_name) values(p_user_id,p_username,a.city_name);
 insert into public.cities(id,owner_id,name,state) values(a.first_city_id,p_user_id,a.city_name,p_state);
 update private.bc26_accounts set user_id=p_user_id,status='ready',recovery_hash=p_code_hash where username=p_username;
end $$;
create or replace function public.bc26_account_ack(p_user_id uuid)
returns void language sql security definer set search_path='' as $$
 update private.bc26_accounts set code_acknowledged=true where user_id=p_user_id and status='ready'
$$;
create or replace function public.bc26_account_claim(p_username text,p_user_id uuid,p_code_hash text)
returns void language plpgsql security definer set search_path='' as $$
declare mail text;city_name text;
begin
 if p_username !~ '^[a-z0-9_]{3,24}$' or p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid claim';end if;
 select email into mail from auth.users where id=p_user_id;
 if mail is null or mail like '%@accounts.buildcity26.invalid' then raise exception 'Invalid legacy identity';end if;
 if exists(select 1 from private.bc26_accounts where user_id=p_user_id) then raise exception 'BC26_TAKEN';end if;
 select name into city_name from public.cities where owner_id=p_user_id order by updated_at desc limit 1;
 city_name:=coalesce(city_name,'Thành phố của tôi');
 begin
  insert into private.bc26_accounts(username,user_id,identity_email,first_city_id,city_name,status,recovery_hash)
    values(p_username,p_user_id,mail,gen_random_uuid(),city_name,'ready',p_code_hash);
  insert into public.profiles(user_id,username,display_city_name) values(p_user_id,p_username,city_name);
 exception when unique_violation then raise exception 'BC26_TAKEN';end;
end $$;
create or replace function public.bc26_recovery_begin(p_username text,p_code_hash text,p_claim uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare a private.bc26_accounts;
begin
 select * into a from private.bc26_accounts where username=p_username for update;
 if a.status is distinct from 'ready' or a.recovery_hash is distinct from p_code_hash or p_claim is null or (a.recovery_claim is not null and a.recovery_until>clock_timestamp()) then return false;end if;
 update private.bc26_accounts set recovery_claim=p_claim,recovery_until=clock_timestamp()+interval '5 minutes',
 revoked_after=ceil(extract(epoch from clock_timestamp()))::bigint where username=p_username;
 return true;
end $$;
create or replace function public.bc26_recovery_release(p_username text,p_claim uuid)
returns void language sql security definer set search_path='' as $$
 update private.bc26_accounts set recovery_claim=null,recovery_until=null where username=p_username and recovery_claim=p_claim
$$;
create or replace function public.bc26_recovery_finish(p_username text,p_claim uuid,p_code_hash text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid recovery hash';end if;
 update private.bc26_accounts set recovery_hash=p_code_hash,recovery_generation=recovery_generation+1,code_acknowledged=false,recovery_claim=null,recovery_until=null,
  revoked_after=ceil(extract(epoch from clock_timestamp()))::bigint where username=p_username and recovery_claim=p_claim;
 if not found then raise exception 'Invalid recovery claim';end if;
end $$;

-- Only the trusted server can reserve usernames, see mappings, or consume codes.
revoke all on function public.bc26_account_rate(text,text,text),public.bc26_account_reserve(text,text,text,text,uuid),
 public.bc26_account_orphan(text,text),public.bc26_account_lookup(text),public.bc26_account_finish(text,text,uuid,jsonb,text),
 public.bc26_account_ack(uuid),public.bc26_account_claim(text,uuid,text),public.bc26_recovery_begin(text,text,uuid),
 public.bc26_recovery_release(text,uuid),public.bc26_recovery_finish(text,uuid,text) from public,anon,authenticated;
grant execute on function public.bc26_account_rate(text,text,text),public.bc26_account_reserve(text,text,text,text,uuid),
 public.bc26_account_orphan(text,text),public.bc26_account_lookup(text),public.bc26_account_finish(text,text,uuid,jsonb,text),
 public.bc26_account_ack(uuid),public.bc26_account_claim(text,uuid,text),public.bc26_recovery_begin(text,text,uuid),
 public.bc26_recovery_release(text,uuid),public.bc26_recovery_finish(text,uuid,text) to service_role;
commit;

-- Recovery-code replacement for signed-in players who still know their password.
-- The API verifies the real JWT and re-authenticates the password before calling.
begin;
create or replace function public.bc26_account_codes(p_user_id uuid,p_code_hash text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid recovery hash';end if;
 update private.bc26_accounts set recovery_hash=p_code_hash,recovery_generation=recovery_generation+1,code_acknowledged=false
 where user_id=p_user_id and status='ready' and recovery_claim is null;
 if not found then raise exception 'Invalid account';end if;
end $$;
revoke all on function public.bc26_account_codes(uuid,text) from public,anon,authenticated;
grant execute on function public.bc26_account_codes(uuid,text) to service_role;
-- Include the new action in the shared database rate limiter.
create or replace function public.bc26_account_rate(p_action text,p_ip_hash text,p_username_hash text)
returns boolean language plpgsql security definer set search_path='' as $$
declare b bigint:=floor(extract(epoch from clock_timestamp())/900); n integer; k text; cap integer; ok boolean:=true;
begin
 if p_action not in ('register','login','recover','claim','ack','codes') or p_ip_hash !~ '^[a-f0-9]{64}$' or p_username_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid rate key';end if;
 for k,cap in select * from (values (p_action||':ip:'||p_ip_hash,case when p_action='login' then 60 else 20 end),
   (p_action||':user:'||p_username_hash,case when p_action='login' then 20 else 8 end)) as limits(key,cap) loop
  insert into private.bc26_limits(key,bucket,count) values(k,b,1)
  on conflict(key) do update set bucket=b,count=case when private.bc26_limits.bucket=b then private.bc26_limits.count+1 else 1 end returning count into n;
  if n>cap then ok:=false;end if;
 end loop;
 -- Bounded cleanup avoids growing indefinitely; correctness doesn't rely on it.
 delete from private.bc26_limits where key in(select key from private.bc26_limits where bucket<b-96 limit 100);
 return ok;
end $$;

commit;

-- Keep the first city's geographic choice stable across registration retries.
begin;
alter table private.bc26_accounts add column if not exists start_region_id text check(start_region_id ~ '^\d{2}-(start|island|coast)$');
alter table private.bc26_accounts add column if not exists start_choice_recorded boolean not null default false;
create or replace function public.bc26_account_reserve_region(p_username text,p_request_hash text,p_city_name text,p_identity_email text,p_city_id uuid,p_region_id text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a private.bc26_accounts;
begin
 if p_region_id is not null and p_region_id !~ '^\d{2}-(start|island|coast)$' then raise exception 'Invalid starting region';end if;
 perform public.bc26_account_reserve(p_username,p_request_hash,p_city_name,p_identity_email,p_city_id);
 select * into a from private.bc26_accounts where username=p_username for update;
 if a.status='pending' and not a.start_choice_recorded then
  update private.bc26_accounts set start_region_id=p_region_id,start_choice_recorded=true where username=p_username returning * into a;
 end if;
 return to_jsonb(a)-'recovery_hash'-'recovery_claim';
end $$;
revoke all on function public.bc26_account_reserve_region(text,text,text,text,uuid,text) from public,anon,authenticated;
grant execute on function public.bc26_account_reserve_region(text,text,text,text,uuid,text) to service_role;
create or replace function public.bc26_account_finish(p_username text,p_request_hash text,p_user_id uuid,p_state jsonb,p_code_hash text)
returns void language plpgsql security definer set search_path='' as $$
declare a private.bc26_accounts;
begin
 select * into a from private.bc26_accounts where username=p_username for update;
 if a.username is null or a.request_hash is distinct from p_request_hash or not exists(select 1 from auth.users where id=p_user_id and email=a.identity_email) or p_code_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid account';end if;
 if a.status='ready' then if a.user_id<>p_user_id then raise exception 'Invalid owner';end if;return;end if;
 if a.start_region_id is not null and p_state#>>'{world,geography,regionId}' is distinct from a.start_region_id then raise exception 'Invalid starting geography';end if;
 if p_state->>'schemaVersion'<>'6' or p_state->>'name' is distinct from a.city_name or octet_length(p_state::text)>2000000 then raise exception 'Invalid first city';end if;
 insert into public.profiles(user_id,username,display_city_name) values(p_user_id,p_username,a.city_name);
 insert into public.cities(id,owner_id,name,state) values(a.first_city_id,p_user_id,a.city_name,p_state);
 update private.bc26_accounts set user_id=p_user_id,status='ready',recovery_hash=p_code_hash where username=p_username;
end $$;
commit;

-- Virtual city money only. Prices/draws use database UTC, never the simulation clock.
-- Additive: no reset, no new starting grant, no access to another player's city.
begin;
create table if not exists private.bc26_market_seed(id integer primary key check(id=1), seed text not null);
insert into private.bc26_market_seed values(1,gen_random_uuid()::text||gen_random_uuid()::text) on conflict do nothing;
create table if not exists private.bc26_stocks(symbol text primary key,name text not null,base integer not null check(base>0));
insert into private.bc26_stocks values('BCD','Điện Bình Minh',24),('BCN','Nước Việt Xanh',18),('BCX','Xây dựng An Phú',36),('BCT','Thương mại Thành Đô',29),('BCV','Vận tải Hành Trình',42),('BCM','Môi trường Lộc Xanh',22) on conflict do nothing;
create table if not exists private.bc26_positions(city_id uuid references public.cities(id) on delete cascade,symbol text references private.bc26_stocks(symbol),quantity integer not null check(quantity>=0 and quantity<=1000000),cost numeric not null check(cost>=0),primary key(city_id,symbol));
create table if not exists private.bc26_lottery(id uuid primary key,city_id uuid not null references public.cities(id) on delete cascade,round bigint not null,numbers integer[] not null,quantity integer not null check(quantity between 1 and 50),claimed boolean not null default false,matches integer,prize numeric);
create table if not exists private.bc26_finance_receipts(id uuid primary key,city_id uuid not null references public.cities(id) on delete cascade,signature jsonb not null,result jsonb not null,created_at timestamptz not null default now());
alter table private.bc26_market_seed enable row level security;
alter table private.bc26_stocks enable row level security;
alter table private.bc26_positions enable row level security;
alter table private.bc26_lottery enable row level security;
alter table private.bc26_finance_receipts enable row level security;
revoke all on private.bc26_market_seed,private.bc26_stocks,private.bc26_positions,private.bc26_lottery,private.bc26_finance_receipts from public,anon,authenticated;

create or replace function private.bc26_stock_price(p_symbol text,p_round bigint) returns integer
language sql stable security definer set search_path='' as $$
 select greatest(1,round(s.base*(0.8+((('x'||substr(md5(k.seed||':'||p_symbol||':'||p_round::text),1,8))::bit(32)::bigint)%4001)/10000.0))::integer)
 from private.bc26_stocks s cross join private.bc26_market_seed k where s.symbol=p_symbol and k.id=1
$$;
create or replace function private.bc26_draw(p_round bigint) returns integer[]
language sql stable security definer set search_path='' as $$
 select array_agg(n order by n) from(select n from generate_series(1,45) n,private.bc26_market_seed k where k.id=1 order by md5(k.seed||':draw:'||p_round::text||':'||n::text) limit 6) draw
$$;
revoke all on function private.bc26_stock_price(text,bigint),private.bc26_draw(bigint) from public,anon,authenticated;

create or replace function public.bc26_market_board() returns jsonb
language plpgsql security definer set search_path='' as $$
declare r bigint:=floor(extract(epoch from clock_timestamp())/18000); board jsonb; past jsonb;
begin
 select jsonb_agg(jsonb_build_object('symbol',s.symbol,'name',s.name,'price',private.bc26_stock_price(s.symbol,r),'previous',private.bc26_stock_price(s.symbol,r-1),'series',(select jsonb_agg(jsonb_build_object('round',n,'price',private.bc26_stock_price(s.symbol,n)) order by n) from generate_series(r-11,r) n)) order by s.symbol) into board from private.bc26_stocks s;
 select jsonb_agg(jsonb_build_object('round',n,'numbers',private.bc26_draw(n),'drawAt',(n+1)*18000) order by n desc) into past from generate_series(r-5,r-1) n;
 return jsonb_build_object('rule','virtual-finance-5h-v1','serverSeconds',extract(epoch from clock_timestamp()),'round',r,'nextAt',(r+1)*18000,'intervalSeconds',18000,'stocks',board,'draws',past,'ticketPrice',10,'feeRate',0.001,'prizes',jsonb_build_object('3',30,'4',1000,'5',100000,'6',10000000));
end $$;
revoke all on function public.bc26_market_board() from public;
grant execute on function public.bc26_market_board() to anon,authenticated;

create or replace function public.bc26_finance_snapshot(p_city_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.bc26_session_valid() or not exists(select 1 from public.cities where id=p_city_id and owner_id=auth.uid()) then raise exception 'BC26_FINANCE_OWNER' using errcode='42501';end if;
 select jsonb_build_object('board',public.bc26_market_board(),'positions',coalesce((select jsonb_agg(to_jsonb(p)) from private.bc26_positions p where city_id=p_city_id and quantity>0),'[]'::jsonb),'tickets',coalesce((select jsonb_agg(to_jsonb(t) order by round desc,id) from(select * from private.bc26_lottery where city_id=p_city_id order by claimed,round desc,id limit 200)t),'[]'::jsonb)) into result;
 return result;
end $$;
revoke all on function public.bc26_finance_snapshot(uuid) from public,anon;
grant execute on function public.bc26_finance_snapshot(uuid) to authenticated;

create or replace function public.bc26_finance_order(p_city_id uuid,p_revision bigint,p_request_id uuid,p_order jsonb,p_round bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.cities; receipt private.bc26_finance_receipts; pos private.bc26_positions; t private.bc26_lottery;
 r bigint:=floor(extract(epoch from clock_timestamp())/18000); action text:=p_order->>'action'; qty integer; price integer; fee numeric; delta numeric:=0; balance numeric; ledger jsonb; entry jsonb; numbers integer[]; winners integer[]; match_count integer; v_prize numeric; total_prize numeric:=0; outcome jsonb:='{}'::jsonb; sig jsonb:=jsonb_build_object('order',p_order,'round',p_round,'revision',p_revision); n integer;
begin
 if not public.bc26_session_valid() then raise exception 'Authentication required' using errcode='28000';end if;
 select * into c from public.cities where id=p_city_id and owner_id=auth.uid() for update;
 if c.id is null then raise exception 'BC26_FINANCE_OWNER' using errcode='42501';end if;
 if p_request_id is null or p_order is null or jsonb_typeof(p_order)<>'object' or octet_length(p_order::text)>1024 then raise exception 'BC26_FINANCE_INPUT' using errcode='22023';end if;
 select * into receipt from private.bc26_finance_receipts where id=p_request_id;
 if receipt.id is not null then
  if receipt.city_id<>c.id or receipt.signature<>sig then raise exception 'BC26_FINANCE_RECEIPT' using errcode='22023';end if;
  return jsonb_build_object('city',to_jsonb(c),'result',receipt.result,'replayed',true);
 end if;
 if p_revision is distinct from c.revision then raise exception 'BC26_CONFLICT' using errcode='PT409';end if;
 if action is null or action not in ('buy','sell','ticket','settle') then raise exception 'BC26_FINANCE_INPUT' using errcode='22023';end if;
 if p_round is distinct from r and action<>'settle' then raise exception 'BC26_QUOTE_EXPIRED' using errcode='22023';end if;
 if (select count(*) from private.bc26_finance_receipts where city_id=c.id and created_at>clock_timestamp()-interval '1 minute')>=30 then raise exception 'BC26_FINANCE_RATE' using errcode='54000';end if;
 if c.state->>'schemaVersion' is distinct from '6' or jsonb_typeof(c.state->'ledger') is distinct from 'object' or jsonb_typeof(c.state#>'{ledger,entries}') is distinct from 'array' or jsonb_typeof(c.state#>'{ledger,receipts}') is distinct from 'array' or jsonb_typeof(c.state->'money') is distinct from 'number' or jsonb_typeof(c.state#>'{ledger,openingCash}') is distinct from 'number' then raise exception 'BC26_FINANCE_SAVE' using errcode='22023';end if;
 balance:=(c.state->>'money')::numeric;ledger:=c.state->'ledger';
 if abs(balance-((ledger->>'openingCash')::numeric+coalesce((select sum((v->>'amount')::numeric) from jsonb_array_elements(ledger->'entries') v),0)))>0.01 then raise exception 'BC26_FINANCE_LEDGER' using errcode='22023';end if;
 if jsonb_array_length(ledger->'receipts')>=19000 then raise exception 'BC26_FINANCE_LEDGER_FULL' using errcode='54000';end if;
 if action in ('buy','sell') then
  if coalesce(p_order->>'quantity','') !~ '^\d{1,5}$' then raise exception 'BC26_FINANCE_QUANTITY' using errcode='22023';end if;
  qty:=(p_order->>'quantity')::integer;if qty not between 1 and 10000 then raise exception 'BC26_FINANCE_QUANTITY' using errcode='22023';end if;
  price:=private.bc26_stock_price(p_order->>'symbol',r);if price is null then raise exception 'BC26_FINANCE_SYMBOL' using errcode='22023';end if;
  fee:=ceil(price*qty*0.001);
  select * into pos from private.bc26_positions where city_id=c.id and symbol=p_order->>'symbol';
  if action='buy' then
   delta:=-(price*qty+fee);if balance+delta<0 or coalesce(pos.quantity,0)+qty>1000000 then raise exception 'BC26_FINANCE_FUNDS' using errcode='22023';end if;
   insert into private.bc26_positions values(c.id,p_order->>'symbol',qty,price*qty+fee) on conflict(city_id,symbol) do update set quantity=private.bc26_positions.quantity+qty,cost=private.bc26_positions.cost+price*qty+fee;
  else
   if coalesce(pos.quantity,0)<qty then raise exception 'BC26_FINANCE_HOLDING' using errcode='22023';end if;
   delta:=price*qty-fee;
   outcome:=jsonb_build_object('realizedProfit',delta-pos.cost*qty/pos.quantity);
   update private.bc26_positions set cost=case when quantity=qty then 0 else cost*(quantity-qty)/quantity end,quantity=quantity-qty where city_id=c.id and symbol=pos.symbol;
  end if;
  outcome:=outcome||jsonb_build_object('symbol',p_order->>'symbol','quantity',qty,'price',price,'fee',fee,'delta',delta);
 elsif action='ticket' then
 if jsonb_typeof(p_order->'numbers') is distinct from 'array' then raise exception 'BC26_LOTTERY_NUMBERS' using errcode='22023';end if;
 if jsonb_array_length(p_order->'numbers')<>6 or coalesce(p_order->>'quantity','1') !~ '^\d{1,2}$' then raise exception 'BC26_LOTTERY_NUMBERS' using errcode='22023';end if;
  for entry in select value from jsonb_array_elements(p_order->'numbers') loop
   if entry::text !~ '^\d{1,2}$' or entry::integer not between 1 and 45 then raise exception 'BC26_LOTTERY_NUMBERS' using errcode='22023';end if;
  end loop;
  select array_agg(v::integer order by v::integer) into numbers from jsonb_array_elements_text(p_order->'numbers') v;
  if (select count(distinct v) from unnest(numbers)v)<>6 then raise exception 'BC26_LOTTERY_NUMBERS' using errcode='22023';end if;
  qty:=coalesce((p_order->>'quantity')::integer,1);if qty not between 1 and 50 then raise exception 'BC26_FINANCE_QUANTITY' using errcode='22023';end if;
  if (select count(*) from private.bc26_lottery where city_id=c.id and not claimed)>=200 then raise exception 'BC26_LOTTERY_LIMIT' using errcode='54000';end if;
  delta:=-10*qty;if balance+delta<0 then raise exception 'BC26_FINANCE_FUNDS' using errcode='22023';end if;
  insert into private.bc26_lottery values(p_request_id,c.id,r,numbers,qty,false,null,null);
  outcome:=jsonb_build_object('numbers',numbers,'quantity',qty,'round',r,'drawAt',(r+1)*18000,'delta',delta);
 else
  for t in select * from private.bc26_lottery where city_id=c.id and not claimed and round<r for update loop
   winners:=private.bc26_draw(t.round);select count(*) into match_count from unnest(t.numbers)v where v=any(winners);
   v_prize:=case match_count when 6 then 10000000 when 5 then 100000 when 4 then 1000 when 3 then 30 else 0 end*t.quantity;
   update private.bc26_lottery set claimed=true,matches=match_count,prize=v_prize where id=t.id;
   total_prize:=total_prize+v_prize;
  end loop;
  delta:=total_prize;outcome:=jsonb_build_object('prize',total_prize,'delta',delta);
 end if;
 entry:=jsonb_build_object('id','finance-'||p_request_id::text,'seconds',(c.state#>>'{clock,seconds}')::bigint,'category',case action when 'ticket' then 'lottery-purchase' when 'settle' then 'lottery-payout' else 'stock-'||action end,'amount',delta,'reference',p_request_id::text);
 ledger:=jsonb_set(ledger,'{entries}',(ledger->'entries')||jsonb_build_array(entry));
 ledger:=jsonb_set(ledger,'{receipts}',(ledger->'receipts')||jsonb_build_array('finance-'||p_request_id::text));
 if jsonb_array_length(ledger->'entries')>3000 then ledger:=jsonb_set(ledger,'{openingCash}',to_jsonb((ledger->>'openingCash')::numeric+(ledger#>>'{entries,0,amount}')::numeric));ledger:=jsonb_set(ledger,'{entries}',(ledger->'entries')-0);end if;
 c.state:=jsonb_set(jsonb_set(c.state,'{money}',to_jsonb(balance+delta)),'{ledger}',ledger);
 if octet_length(c.state::text)>2000000 then raise exception 'BC26_FINANCE_SAVE_SIZE' using errcode='22023';end if;
 update public.cities set state=c.state,revision=revision+1,updated_at=clock_timestamp(),last_save_request=p_request_id where id=c.id returning * into c;
 insert into private.bc26_finance_receipts(id,city_id,signature,result) values(p_request_id,c.id,sig,outcome);
 return jsonb_build_object('city',to_jsonb(c),'result',outcome,'replayed',false);
end $$;
revoke all on function public.bc26_finance_order(uuid,bigint,uuid,jsonb,bigint) from public,anon;
grant execute on function public.bc26_finance_order(uuid,bigint,uuid,jsonb,bigint) to authenticated;
notify pgrst,'reload schema';
commit;

-- PostgREST 14 retries SQLSTATE 40001 forever; business CAS conflicts are HTTP 409.
-- Original ownership checks, row locks, payload validation and grants are preserved.
begin;
do $$
declare f record; definition text;
begin
 for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.proname in ('save_city','save_city_v2','delete_city_v2','bc26_finance_order') loop
  definition:=pg_get_functiondef(f.oid);
  if position('BC26_CONFLICT' in definition)>0 and position('40001' in definition)>0 then
   execute replace(definition,'''40001''','''PT409''');
  end if;
 end loop;
end $$;
notify pgrst,'reload schema';
commit;
