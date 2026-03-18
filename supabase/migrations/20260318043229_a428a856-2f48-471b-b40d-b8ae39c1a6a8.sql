-- Core utility for updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  short_description text,
  price numeric(12,2) not null default 0,
  sale_price numeric(12,2),
  sku text,
  stock integer not null default 0,
  images text[] not null default '{}',
  category text,
  brand text,
  condition text default 'Nuevo',
  warranty text,
  specs jsonb not null default '{}'::jsonb,
  reviews jsonb not null default '[]'::jsonb,
  meta_title text,
  meta_description text,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products
for select
to anon, authenticated
using (active = true);

drop policy if exists "Public can manage products" on public.products;
create policy "Public can manage products"
on public.products
for all
to anon, authenticated
using (true)
with check (true);

create index if not exists idx_products_active_created_at on public.products(active, created_at desc);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_name on public.products(name);

-- Availability requests
create table if not exists public.availability_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  items jsonb not null default '[]'::jsonb,
  total numeric(12,2) not null default 0,
  status text not null default 'pending',
  admin_notes text,
  suggested_products jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.availability_requests enable row level security;

drop policy if exists "Public can manage availability requests" on public.availability_requests;
create policy "Public can manage availability requests"
on public.availability_requests
for all
to anon, authenticated
using (true)
with check (true);

create index if not exists idx_availability_requests_status_created_at on public.availability_requests(status, created_at desc);
create index if not exists idx_availability_requests_email on public.availability_requests(customer_email);

-- Customers table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  phone text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;

drop policy if exists "Public can manage customers" on public.customers;
create policy "Public can manage customers"
on public.customers
for all
to anon, authenticated
using (true)
with check (true);

create index if not exists idx_customers_created_at on public.customers(created_at desc);

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  customer_city text,
  items jsonb not null default '[]'::jsonb,
  total numeric(12,2) not null default 0,
  status text not null default 'pending',
  payment_provider text,
  payment_reference text,
  payment_url text,
  availability_request_id uuid references public.availability_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Public can manage orders" on public.orders;
create policy "Public can manage orders"
on public.orders
for all
to anon, authenticated
using (true)
with check (true);

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_customer_email on public.orders(customer_email);
create index if not exists idx_orders_reference on public.orders(reference);

-- Updated at triggers
create or replace trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create or replace trigger set_availability_requests_updated_at
before update on public.availability_requests
for each row execute function public.set_updated_at();

create or replace trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create or replace trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();