-- 1) Make profiles.id follow auth.users.id (1:1)
alter table public.profiles
  alter column id drop default;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_id_fkey'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id)
      references auth.users(id)
      on delete cascade;
  end if;
end
$$;

-- 2) Auto-create profile row whenever auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- 3) Enable RLS on user-owned tables
alter table public.profiles enable row level security;
alter table public.trades enable row level security;
alter table public.trade_emotions enable row level security;
alter table public.trade_strategies enable row level security;

-- 4) Profiles policies
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- No insert policy: profile insert is handled by auth trigger.

-- 5) Trades policies
drop policy if exists "trades_select_own" on public.trades;
create policy "trades_select_own"
on public.trades
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "trades_insert_own" on public.trades;
create policy "trades_insert_own"
on public.trades
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "trades_update_own" on public.trades;
create policy "trades_update_own"
on public.trades
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "trades_delete_own" on public.trades;
create policy "trades_delete_own"
on public.trades
for delete
to authenticated
using (user_id = auth.uid());

-- 6) trade_emotions policies (ownership follows parent trade)
drop policy if exists "trade_emotions_select_own" on public.trade_emotions;
create policy "trade_emotions_select_own"
on public.trade_emotions
for select
to authenticated
using (
  exists (
    select 1
    from public.trades t
    where t.id = trade_emotions.trade_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "trade_emotions_insert_own" on public.trade_emotions;
create policy "trade_emotions_insert_own"
on public.trade_emotions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trades t
    where t.id = trade_emotions.trade_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "trade_emotions_delete_own" on public.trade_emotions;
create policy "trade_emotions_delete_own"
on public.trade_emotions
for delete
to authenticated
using (
  exists (
    select 1
    from public.trades t
    where t.id = trade_emotions.trade_id
      and t.user_id = auth.uid()
  )
);

-- 7) trade_strategies policies (ownership follows parent trade)
drop policy if exists "trade_strategies_select_own" on public.trade_strategies;
create policy "trade_strategies_select_own"
on public.trade_strategies
for select
to authenticated
using (
  exists (
    select 1
    from public.trades t
    where t.id = trade_strategies.trade_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "trade_strategies_insert_own" on public.trade_strategies;
create policy "trade_strategies_insert_own"
on public.trade_strategies
for insert
to authenticated
with check (
  exists (
    select 1
    from public.trades t
    where t.id = trade_strategies.trade_id
      and t.user_id = auth.uid()
  )
);

drop policy if exists "trade_strategies_delete_own" on public.trade_strategies;
create policy "trade_strategies_delete_own"
on public.trade_strategies
for delete
to authenticated
using (
  exists (
    select 1
    from public.trades t
    where t.id = trade_strategies.trade_id
      and t.user_id = auth.uid()
  )
);
