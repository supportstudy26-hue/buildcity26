-- Run in Supabase SQL Editor after schema.sql. Everything is rolled back.
-- Two isolated QA identities are temporary: no passwords/emails are used.
begin;
insert into auth.users(id,aud,role,email) values
('a0260000-0000-4000-8000-000000000001','authenticated','authenticated','bc26-rls-a@example.invalid'),
('b0260000-0000-4000-8000-000000000002','authenticated','authenticated','bc26-rls-b@example.invalid');

set local role authenticated;
select set_config('request.jwt.claim.sub','a0260000-0000-4000-8000-000000000001',true);
do $$
declare saved public.cities;
begin
  select * into saved from public.save_city_v2('c0260000-0000-4000-8000-000000000003','Thành phố A','{"schemaVersion":1}',0,'d0260000-0000-4000-8000-000000000004');
  if saved.revision<>1 then raise exception 'FAIL: create revision'; end if;
  select * into saved from public.save_city_v2(saved.id,'Thành phố A','{"schemaVersion":1}',0,'d0260000-0000-4000-8000-000000000004');
  if saved.revision<>1 then raise exception 'FAIL: create retry duplicated'; end if;
  select * into saved from public.save_city_v2(saved.id,'A cập nhật','{"schemaVersion":2}',1,'e0260000-0000-4000-8000-000000000005');
  if saved.revision<>2 then raise exception 'FAIL: update revision'; end if;
  select * into saved from public.save_city_v2(saved.id,'A cập nhật','{"schemaVersion":2}',1,'e0260000-0000-4000-8000-000000000005');
  if saved.revision<>2 then raise exception 'FAIL: update retry duplicated'; end if;
  begin
    perform public.save_city_v2(saved.id,'Thiết bị cũ','{"schemaVersion":1}',1,'f0260000-0000-4000-8000-000000000006');
    raise exception 'FAIL: stale device overwrote revision';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform public.delete_city_v2(saved.id,1);
    raise exception 'FAIL: stale delete';
  exception when sqlstate 'PT409' then null; end;
end $$;

select set_config('request.jwt.claim.sub','b0260000-0000-4000-8000-000000000002',true);
do $$
declare n integer;
begin
  select count(*) into n from public.cities where id='c0260000-0000-4000-8000-000000000003';
  if n<>0 then raise exception 'FAIL: B read A'; end if;
  update public.cities set name='B sửa A' where id='c0260000-0000-4000-8000-000000000003';
  get diagnostics n = row_count;
  if n<>0 then raise exception 'FAIL: B updated A'; end if;
  delete from public.cities where id='c0260000-0000-4000-8000-000000000003';
  get diagnostics n = row_count;
  if n<>0 then raise exception 'FAIL: B deleted A'; end if;
  begin
    insert into public.cities(id,owner_id,name,state) values('10260000-0000-4000-8000-000000000007','a0260000-0000-4000-8000-000000000001','Owner giả','{"schemaVersion":1}');
    raise exception 'FAIL: B forged owner';
  exception when insufficient_privilege then null; end;
  begin
    perform public.save_city_v2('c0260000-0000-4000-8000-000000000003','B RPC A','{"schemaVersion":1}',2,'10260000-0000-4000-8000-000000000007');
    raise exception 'FAIL: B RPC updated A';
  exception when sqlstate 'PT409' then null; end;
  begin
    perform public.delete_city_v2('c0260000-0000-4000-8000-000000000003',2);
    raise exception 'FAIL: B RPC deleted A';
  exception when sqlstate 'PT409' then null; end;
  perform public.save_city_v2('20260000-0000-4000-8000-000000000008','Thành phố B','{"schemaVersion":1}',0,'30260000-0000-4000-8000-000000000009');
  select count(*) into n from public.cities where id in ('c0260000-0000-4000-8000-000000000003','20260000-0000-4000-8000-000000000008');
  if n<>1 then raise exception 'FAIL: B library isolation'; end if;
end $$;

select set_config('request.jwt.claim.sub','a0260000-0000-4000-8000-000000000001',true);
do $$
declare n integer;
begin
  select count(*) into n from public.cities where id='20260000-0000-4000-8000-000000000008';
  if n<>0 then raise exception 'FAIL: A read B'; end if;
  perform public.delete_city_v2('c0260000-0000-4000-8000-000000000003',2);
  select count(*) into n from public.cities where id='c0260000-0000-4000-8000-000000000003';
  if n<>0 then raise exception 'FAIL: owner delete'; end if;
end $$;

set local role anon;
do $$
begin
  if has_table_privilege(current_user,'public.cities','SELECT') then raise exception 'FAIL: anon SELECT'; end if;
  if has_table_privilege(current_user,'public.cities','INSERT') then raise exception 'FAIL: anon INSERT'; end if;
  if has_function_privilege(current_user,'public.save_city_v2(uuid,text,jsonb,bigint,uuid)','EXECUTE') then raise exception 'FAIL: anon RPC'; end if;
end $$;
reset role;
select 'PASS: RLS A/B, owner spoof, guest, retry, revision conflict and delete' as result;
rollback;
