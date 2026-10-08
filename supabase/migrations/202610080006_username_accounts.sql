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
