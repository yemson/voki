-- Allow authenticated users to insert new tickers for trade creation flow.
drop policy if exists tickers_insert_policy on public.tickers;
create policy tickers_insert_policy
on public.tickers
for insert
to authenticated
with check (true);

-- Keep update/delete blocked for authenticated users.
drop policy if exists tickers_update_policy on public.tickers;
create policy tickers_update_policy
on public.tickers
for update
to authenticated
using (false)
with check (false);

drop policy if exists tickers_delete_policy on public.tickers;
create policy tickers_delete_policy
on public.tickers
for delete
to authenticated
using (false);
