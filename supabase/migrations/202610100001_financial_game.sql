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
