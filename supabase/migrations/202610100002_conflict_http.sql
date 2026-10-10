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
