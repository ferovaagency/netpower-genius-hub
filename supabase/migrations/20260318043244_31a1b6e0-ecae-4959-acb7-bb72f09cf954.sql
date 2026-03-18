drop policy if exists "Public can manage products" on public.products;
create policy "Public can manage products"
on public.products
for all
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists "Public can manage availability requests" on public.availability_requests;
create policy "Public can manage availability requests"
on public.availability_requests
for all
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists "Public can manage customers" on public.customers;
create policy "Public can manage customers"
on public.customers
for all
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists "Public can manage orders" on public.orders;
create policy "Public can manage orders"
on public.orders
for all
to anon, authenticated
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));