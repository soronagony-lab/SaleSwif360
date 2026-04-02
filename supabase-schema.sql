-- Schéma de référence pour J'achète.ci (Supabase / PostgreSQL)
-- À exécuter dans l’éditeur SQL Supabase si vous migrez hors du prototype local.

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
  product_id bigint references public.products (id),
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
  shop_name text default 'J''achète.ci',
  whats_app text,
  relance_message text,
  facebook_pixel_id text,
  ga4_id text,
  updated_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.shop_settings enable row level security;

-- Exemple : lecture publique des produits, écriture réservée aux admins (service role ou policies personnalisées).
create policy "products_read" on public.products for select using (true);
