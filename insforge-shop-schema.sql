-- SaleSwif360 / Succès Solution FLP — schéma boutique InsForge (PostgreSQL public)
-- Idempotent : à ré-exécuter sans risque (CREATE IF NOT EXISTS / policies DROP IF EXISTS).

create table if not exists public.products (
  id bigint primary key generated always as identity,
  name text not null,
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  description text,
  detailed_description text,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id bigint primary key generated always as identity,
  product_id bigint references public.products (id) on delete set null,
  product_name text not null,
  price integer not null,
  customer_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  status text not null default 'Nouvelle',
  created_at timestamptz default now()
);

create table if not exists public.shop_settings (
  id smallint primary key default 1 check (id = 1),
  shop_name text default 'Succès Solution FLP',
  whats_app text,
  relance_message text,
  facebook_pixel_id text,
  ga4_id text,
  updated_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.shop_settings enable row level security;

drop policy if exists "products_read" on public.products;
drop policy if exists "products_select" on public.products;
drop policy if exists "products_insert" on public.products;
drop policy if exists "products_update" on public.products;
drop policy if exists "products_delete" on public.products;

create policy "products_select" on public.products for select using (true);
create policy "products_insert" on public.products for insert with check (true);
create policy "products_update" on public.products for update using (true);
create policy "products_delete" on public.products for delete using (true);

drop policy if exists "orders_select" on public.orders;
drop policy if exists "orders_insert" on public.orders;
drop policy if exists "orders_update" on public.orders;
drop policy if exists "orders_delete" on public.orders;

create policy "orders_select" on public.orders for select using (true);
create policy "orders_insert" on public.orders for insert with check (true);
create policy "orders_update" on public.orders for update using (true);
create policy "orders_delete" on public.orders for delete using (true);

drop policy if exists "shop_settings_select" on public.shop_settings;
drop policy if exists "shop_settings_insert" on public.shop_settings;
drop policy if exists "shop_settings_update" on public.shop_settings;

create policy "shop_settings_select" on public.shop_settings for select using (true);
create policy "shop_settings_insert" on public.shop_settings for insert with check (true);
create policy "shop_settings_update" on public.shop_settings for update using (true);

insert into public.shop_settings (id, shop_name, whats_app, relance_message)
values (
  1,
  'Succès Solution FLP',
  '+2250506844901',
  'Bonjour ! Vous avez consulté nos produits Forever Living chez Succès Solution FLP. Une question ? Répondez à ce message.'
)
on conflict (id) do nothing;
