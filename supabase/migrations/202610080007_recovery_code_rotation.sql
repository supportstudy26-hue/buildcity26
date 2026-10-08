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
