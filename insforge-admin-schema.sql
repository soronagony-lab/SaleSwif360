-- Extension InsForge : logistique, marketing, collaborateurs, champs commande
-- À exécuter après insforge-shop-schema.sql (idempotent).

-- Zones de livraison
create table if not exists public.delivery_zones (
  id text primary key,
  name text not null,
  fee integer not null default 0 check (fee >= 0),
  note text default '',
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- Livreurs
create table if not exists public.couriers (
  id text primary key,
  name text not null,
  phone text default '',
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Modèles WhatsApp marketing / info
create table if not exists public.whatsapp_templates (
  id text primary key,
  title text not null,
  angle text not null default 'information',
  body text not null,
  created_at timestamptz default now()
);

-- Modèles suivi après commande
create table if not exists public.order_follow_up_templates (
  id text primary key,
  title text not null,
  category text not null,
  body text not null,
  created_at timestamptz default now()
);

-- Journal des envois / campagnes marketing
create table if not exists public.marketing_campaign_log (
  id bigint primary key generated always as identity,
  mode text,
  template_id text,
  phone text,
  preview text,
  logged_at timestamptz not null default now()
);

-- Collaborateurs (accès / contacts internes)
create table if not exists public.shop_collaborators (
  id text primary key,
  name text not null,
  role text default '',
  email text default '',
  phone text default '',
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Champs logistique & note sur les commandes
alter table public.orders add column if not exists delivery_zone_id text;
alter table public.orders add column if not exists courier_id text;
alter table public.orders add column if not exists internal_note text default '';

-- RLS
alter table public.delivery_zones enable row level security;
alter table public.couriers enable row level security;
alter table public.whatsapp_templates enable row level security;
alter table public.order_follow_up_templates enable row level security;
alter table public.marketing_campaign_log enable row level security;
alter table public.shop_collaborators enable row level security;

drop policy if exists "delivery_zones_all" on public.delivery_zones;
create policy "delivery_zones_all" on public.delivery_zones for all using (true) with check (true);

drop policy if exists "couriers_all" on public.couriers;
create policy "couriers_all" on public.couriers for all using (true) with check (true);

drop policy if exists "whatsapp_templates_all" on public.whatsapp_templates;
create policy "whatsapp_templates_all" on public.whatsapp_templates for all using (true) with check (true);

drop policy if exists "order_follow_up_templates_all" on public.order_follow_up_templates;
create policy "order_follow_up_templates_all" on public.order_follow_up_templates for all using (true) with check (true);

drop policy if exists "marketing_campaign_log_all" on public.marketing_campaign_log;
create policy "marketing_campaign_log_all" on public.marketing_campaign_log for all using (true) with check (true);

drop policy if exists "shop_collaborators_all" on public.shop_collaborators;
create policy "shop_collaborators_all" on public.shop_collaborators for all using (true) with check (true);

-- Données par défaut (zones + modèles) si tables vides
insert into public.delivery_zones (id, name, fee, note, sort_order)
select * from (values
  ('z_seed_1', 'Abidjan Nord (Cocody, Bingerville…)', 2000, '', 1),
  ('z_seed_2', 'Abidjan Sud (Marcory, Koumassi…)', 2500, '', 2),
  ('z_seed_3', 'Intérieur du pays', 5000, '', 3)
) as v(id, name, fee, note, sort_order)
where not exists (select 1 from public.delivery_zones limit 1);

insert into public.whatsapp_templates (id, title, angle, body)
select * from (values
  ('wt_inf_1', 'Suivi commande (info)', 'information', 'Bonjour {{nom}}, petite info : votre commande chez {{boutique}} est bien prise en charge. Besoin d''un créneau de livraison ? Répondez à ce message.'),
  ('wt_inf_2', 'Confirmation d''adresse', 'information', 'Bonjour {{nom}}, pour finaliser la livraison, pouvez-vous confirmer votre adresse et un numéro joignable ? Merci, équipe {{boutique}}.'),
  ('wt_mkt_1', 'Offre limitée', 'marketing', 'Bonjour {{nom}} ! {{boutique}} : profitez d''une offre sur nos produits cette semaine. Dites « OUI » pour recevoir le détail en image.'),
  ('wt_mkt_2', 'Réactivation panier', 'marketing', 'Bonjour {{nom}}, vous aviez regardé nos produits Forever Living. Un conseiller peut vous aider à choisir — répondez « CONSEIL ».')
) as v(id, title, angle, body)
where not exists (select 1 from public.whatsapp_templates limit 1);
