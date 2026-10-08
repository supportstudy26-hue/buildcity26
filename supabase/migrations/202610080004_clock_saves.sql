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
