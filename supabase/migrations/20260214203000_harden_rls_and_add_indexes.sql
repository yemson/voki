-- Harden public table RLS policies and add missing indexes for join tables.

-- Profiles
alter table public.profiles enable row level security;

drop policy if exists profiles_owner_policy on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Trades
alter table public.trades enable row level security;

drop policy if exists trades_owner_policy on public.trades;
drop policy if exists trades_select_own on public.trades;
drop policy if exists trades_insert_own on public.trades;
drop policy if exists trades_update_own on public.trades;
drop policy if exists trades_delete_own on public.trades;

create policy trades_select_own
on public.trades
for select
to authenticated
using (user_id = (select auth.uid()));

create policy trades_insert_own
on public.trades
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy trades_update_own
on public.trades
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy trades_delete_own
on public.trades
for delete
to authenticated
using (user_id = (select auth.uid()));

-- Trade emotions
alter table public.trade_emotions enable row level security;

drop policy if exists trade_emotions_select_policy on public.trade_emotions;
drop policy if exists trade_emotions_insert_policy on public.trade_emotions;
drop policy if exists trade_emotions_delete_policy on public.trade_emotions;
drop policy if exists trade_emotions_select_own on public.trade_emotions;
drop policy if exists trade_emotions_insert_own on public.trade_emotions;
drop policy if exists trade_emotions_delete_own on public.trade_emotions;

create policy trade_emotions_select_own
on public.trade_emotions
for select
to authenticated
using (
  exists (
    select 1
    from public.trades t
    where t.id = trade_emotions.trade_id
      and t.user_id = (select auth.uid())
  )
);

create policy trade_emotions_insert_own
on public.trade_emotions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trades t
    where t.id = trade_emotions.trade_id
      and t.user_id = (select auth.uid())
  )
);

create policy trade_emotions_delete_own
on public.trade_emotions
for delete
to authenticated
using (
  exists (
    select 1
    from public.trades t
    where t.id = trade_emotions.trade_id
      and t.user_id = (select auth.uid())
  )
);

-- Trade strategies
alter table public.trade_strategies enable row level security;

drop policy if exists trade_strategies_select_policy on public.trade_strategies;
drop policy if exists trade_strategies_insert_policy on public.trade_strategies;
drop policy if exists trade_strategies_delete_policy on public.trade_strategies;
drop policy if exists trade_strategies_select_own on public.trade_strategies;
drop policy if exists trade_strategies_insert_own on public.trade_strategies;
drop policy if exists trade_strategies_delete_own on public.trade_strategies;

create policy trade_strategies_select_own
on public.trade_strategies
for select
to authenticated
using (
  exists (
    select 1
    from public.trades t
    where t.id = trade_strategies.trade_id
      and t.user_id = (select auth.uid())
  )
);

create policy trade_strategies_insert_own
on public.trade_strategies
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trades t
    where t.id = trade_strategies.trade_id
      and t.user_id = (select auth.uid())
  )
);

create policy trade_strategies_delete_own
on public.trade_strategies
for delete
to authenticated
using (
  exists (
    select 1
    from public.trades t
    where t.id = trade_strategies.trade_id
      and t.user_id = (select auth.uid())
  )
);

-- Tickers
alter table public.tickers enable row level security;

drop policy if exists tickers_select_policy on public.tickers;
drop policy if exists tickers_insert_policy on public.tickers;
drop policy if exists tickers_update_policy on public.tickers;
drop policy if exists tickers_delete_policy on public.tickers;

create policy tickers_select_policy
on public.tickers
for select
to authenticated
using (true);

create policy tickers_insert_policy
on public.tickers
for insert
to authenticated
with check (
  symbol = upper(symbol)
  and symbol ~ '^[A-Z0-9.-]{1,15}$'
);

create policy tickers_update_policy
on public.tickers
for update
to authenticated
using (false)
with check (false);

create policy tickers_delete_policy
on public.tickers
for delete
to authenticated
using (false);

-- Performance indexes
create index if not exists idx_trade_emotions_emotion_id
  on public.trade_emotions (emotion_id);

create index if not exists idx_trade_strategies_strategy_id
  on public.trade_strategies (strategy_id);

create index if not exists idx_trades_user_entry_at_desc
  on public.trades (user_id, entry_at desc);

create index if not exists idx_trades_user_created_at_desc
  on public.trades (user_id, created_at desc);
