-- One active city per account. Existing multiple cities are preserved until the
-- player explicitly confirms replacing the complete, revision-checked list.
begin;
create table if not exists private.bc26_city_replacements (
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  signature text not null,
  city_id uuid not null,
  created_at timestamptz not null default now(),
  primary key(owner_id,request_id)
);
alter table private.bc26_city_replacements enable row level security;
revoke all on private.bc26_city_replacements from public, anon, authenticated;

-- Retain only server-verified mission evidence so restoring a player's backup
-- after a reset cannot repay rewards or forge someone else's receipts.
create table if not exists private.bc26_retired_campaigns(
  city_id uuid primary key,owner_id uuid not null references auth.users(id) on delete cascade,
  checkpoint jsonb not null,claims jsonb not null
);
alter table private.bc26_retired_campaigns enable row level security;
revoke all on private.bc26_retired_campaigns from public,anon,authenticated;
create or replace function public.bc26_keep_retired_campaign() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into private.bc26_retired_campaigns(city_id,owner_id,checkpoint,claims)
 select old.id,old.owner_id,p.checkpoint,coalesce((select jsonb_agg(to_jsonb(r)) from private.bc26_mission_claims r where r.city_id=old.id),'[]')
 from private.bc26_mission_checkpoints p where p.city_id=old.id
 on conflict(city_id) do update set checkpoint=excluded.checkpoint,claims=excluded.claims;
 return old;
end $$;
revoke all on function public.bc26_keep_retired_campaign() from public,anon,authenticated;
drop trigger if exists cities_retire_campaign on public.cities;
create trigger cities_retire_campaign before delete on public.cities for each row execute function public.bc26_keep_retired_campaign();

create or replace function public.bc26_guard_campaign_claims() returns trigger
language plpgsql security definer set search_path='' as $$
declare canonical jsonb;source_id uuid;
begin
 if auth.uid() is null then return new;end if;
 select checkpoint#>'{state,progression,campaign,claims}' into canonical from private.bc26_mission_checkpoints where city_id=new.id;
 if tg_op='INSERT' and canonical is null and jsonb_array_length(coalesce(new.state#>'{progression,campaign,claims}','[]'))>0 then
  source_id:=(new.state#>>'{progression,campaign,originCity}')::uuid;
  select p.checkpoint#>'{state,progression,campaign,claims}' into canonical from private.bc26_mission_checkpoints p join public.cities c on c.id=p.city_id where c.id=source_id and c.owner_id=auth.uid();
  if canonical is null then select checkpoint#>'{state,progression,campaign,claims}' into canonical from private.bc26_retired_campaigns where city_id=source_id and owner_id=auth.uid();end if;
 end if;
 if coalesce(new.state#>'{progression,campaign,claims}','[]') is distinct from coalesce(canonical,'[]') then raise exception 'BC26_CONFLICT: mission receipts require server' using errcode='PT409';end if;
 return new;
end $$;
create or replace function public.bc26_copy_campaign_checkpoint() returns trigger
language plpgsql security definer set search_path='' as $$
declare source_id uuid;cp jsonb;progress jsonb;retired jsonb;
begin
 if auth.uid() is null or jsonb_array_length(coalesce(new.state#>'{progression,campaign,claims}','[]'))=0 then return new;end if;
 source_id:=(new.state#>>'{progression,campaign,originCity}')::uuid;
 select p.checkpoint into cp from private.bc26_mission_checkpoints p join public.cities c on c.id=p.city_id where c.id=source_id and c.owner_id=auth.uid();
 if cp is null then select checkpoint,claims into cp,retired from private.bc26_retired_campaigns where city_id=source_id and owner_id=auth.uid();end if;
 if cp is null or cp#>'{state,progression,campaign,claims}' is distinct from new.state#>'{progression,campaign,claims}' then raise exception 'BC26_CONFLICT: cannot copy unverified claims' using errcode='PT409';end if;
 progress:=jsonb_set(jsonb_set(cp#>'{state,progression,campaign}','{originCity}',to_jsonb(new.id::text)),'{lastSaveRevision}','0');
 cp:=jsonb_build_object('state',jsonb_set(new.state,'{progression,campaign}',progress),'wallMs',floor(extract(epoch from clock_timestamp())*1000));
 insert into private.bc26_mission_checkpoints(city_id,checkpoint) values(new.id,cp);
 if retired is null then insert into private.bc26_mission_claims select new.id,catalogue_id,mission_id,source_revision,signature,created_at from private.bc26_mission_claims where city_id=source_id;
 else insert into private.bc26_mission_claims select new.id,r.catalogue_id,r.mission_id,r.source_revision,r.signature,r.created_at from jsonb_to_recordset(retired) as r(catalogue_id text,mission_id text,source_revision bigint,signature text,created_at timestamptz);end if;
 return new;
end $$;
revoke all on function public.bc26_guard_campaign_claims(),public.bc26_copy_campaign_checkpoint() from public,anon,authenticated;

create or replace function public.bc26_one_active_city()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,2611));
  -- The same ID is allowed through for idempotent save_city_v2 retries.
  if exists(select 1 from public.cities where owner_id=new.owner_id and id<>new.id) then
    raise exception 'BC26_CITY_LIMIT: confirm replacing the old city first' using errcode='PT409';
  end if;
  return new;
end;
$$;
drop trigger if exists cities_one_active on public.cities;
create trigger cities_one_active before insert on public.cities
for each row execute function public.bc26_one_active_city();
revoke all on function public.bc26_one_active_city() from public,anon,authenticated;

create or replace function public.replace_city_v1(
  p_old_cities jsonb,p_city_id uuid,p_name text,p_state jsonb,p_request_id uuid
) returns setof public.cities
language plpgsql security definer set search_path='' as $$
declare owner uuid:=auth.uid(); refs jsonb; current_refs jsonb; sig text;
  receipt private.bc26_city_replacements; saved public.cities;
begin
  if owner is null or not public.bc26_session_valid() then raise exception 'Authentication required' using errcode='28000';end if;
  if p_city_id is null or p_request_id is null or p_name is null or char_length(trim(p_name)) not between 1 and 36
    or p_state is null or jsonb_typeof(p_state)<>'object' or octet_length(p_state::text)>2000000
    or coalesce(p_state->>'schemaVersion','') not in('1','2','3','4','5','6')
    or p_old_cities is null or jsonb_typeof(p_old_cities)<>'array' or jsonb_array_length(p_old_cities)>100 then
    raise exception 'Invalid replacement payload' using errcode='22023';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',(x->>'id')::uuid,'revision',(x->>'revision')::bigint) order by (x->>'id')::uuid),'[]')
    into refs from jsonb_array_elements(p_old_cities) x;
  sig:=md5(refs::text||p_city_id::text||trim(p_name)||p_state::text);
  perform pg_advisory_xact_lock(hashtextextended(owner::text,2611));
  select * into receipt from private.bc26_city_replacements where owner_id=owner and request_id=p_request_id;
  if found then
    if receipt.signature<>sig then raise exception 'Replacement request changed' using errcode='22023';end if;
    select * into saved from public.cities where id=receipt.city_id and owner_id=owner;
    if saved.id is null then raise exception 'BC26_CONFLICT: replacement no longer active' using errcode='PT409';end if;
    return next saved;return;
  end if;
  -- Lock the exact old versions. Any concurrent save makes the whole transaction fail.
  perform 1 from public.cities where owner_id=owner order by id for update;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'revision',revision) order by id),'[]') into current_refs
    from public.cities where owner_id=owner;
  if refs<>current_refs then raise exception 'BC26_CONFLICT: old city list changed' using errcode='PT409';end if;
  if exists(select 1 from public.cities where id=p_city_id) then raise exception 'BC26_CONFLICT: new ID already exists' using errcode='PT409';end if;
  delete from public.cities where owner_id=owner;
  insert into public.cities(id,owner_id,name,state,last_save_request)
    values(p_city_id,owner,trim(p_name),p_state,p_request_id) returning * into saved;
  insert into private.bc26_city_replacements(owner_id,request_id,signature,city_id) values(owner,p_request_id,sig,p_city_id);
  return next saved;
end;
$$;
revoke all on function public.replace_city_v1(jsonb,uuid,text,jsonb,uuid) from public,anon;
grant execute on function public.replace_city_v1(jsonb,uuid,text,jsonb,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
