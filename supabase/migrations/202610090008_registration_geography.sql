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
