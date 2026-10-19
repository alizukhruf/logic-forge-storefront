create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default ''
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2),
  category_id uuid not null references public.categories(id) on delete restrict,
  image_url text not null,
  stock integer not null default 0 check (stock >= 0),
  sku text not null unique,
  rating numeric(3, 2) not null default 0 check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  is_active smallint not null default 1 check (is_active in (0, 1)),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists phone text not null default '';

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  hero_eyebrow text not null default 'Thoughtfully selected technology',
  hero_title text not null default 'Make room for better tech.',
  hero_description text not null default 'Useful everyday essentials, from personal audio to connected home and wearable technology.',
  hero_image_url text not null default 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&q=85',
  hero_cta_text text not null default 'Shop the collection',
  offer_title text not null default '10% off with',
  offer_description text not null default 'Enter the code at checkout.',
  offer_coupon_code text not null default 'WELCOME10',
  offer_cta_text text not null default 'Browse products',
  contact_email text not null default 'logicforge.admin@gmail.com',
  contact_phone text not null default '03440418249',
  contact_address text not null default ''
);

insert into public.store_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  tax numeric(12, 2) not null default 0 check (tax >= 0),
  total numeric(12, 2) not null check (total >= 0),
  coupon_code text,
  shipping_address jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.orders alter column customer_id drop not null;
alter table public.orders drop constraint if exists orders_customer_id_fkey;
alter table public.orders
  add constraint orders_customer_id_fkey
  foreign key (customer_id) references public.profiles(id) on delete set null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percent', 'fixed')),
  value numeric(12, 2) not null check (value > 0),
  active smallint not null default 1 check (active in (0, 1)),
  expires_at timestamptz,
  min_subtotal numeric(12, 2) not null default 0 check (min_subtotal >= 0),
  constraint coupon_percent_range check (type <> 'percent' or value <= 100)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_created_idx on public.products(is_active, created_at desc);
create index if not exists orders_customer_created_idx on public.orders(customer_id, created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists reviews_product_created_idx on public.reviews(product_id, created_at desc);
create index if not exists wishlist_customer_created_idx on public.wishlist(customer_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.set_review_customer_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select name into new.customer_name
  from public.profiles
  where id = new.customer_id;
  return new;
end;
$$;

drop trigger if exists reviews_set_customer_name on public.reviews;
create trigger reviews_set_customer_name
  before insert on public.reviews
  for each row execute procedure public.set_review_customer_name();

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create or replace function public.sync_profile_email_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_auth_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_profile_email_from_auth_user();

create or replace function public.refresh_product_review_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_product uuid;
begin
  affected_product := coalesce(new.product_id, old.product_id);
  update public.products
  set rating = coalesce((select avg(rating)::numeric(3, 2) from public.reviews where product_id = affected_product), 0),
      review_count = (select count(*) from public.reviews where product_id = affected_product)
  where id = affected_product;
  return null;
end;
$$;

drop trigger if exists reviews_refresh_product_totals on public.reviews;
create trigger reviews_refresh_product_totals
  after insert or update or delete on public.reviews
  for each row execute procedure public.refresh_product_review_totals();

create or replace function public.adjust_inventory(p_product_id uuid, p_delta integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required.';
  end if;
  update public.products
  set stock = greatest(0, stock + p_delta)
  where id = p_product_id;
  if not found then
    raise exception 'Product not found.';
  end if;
end;
$$;

create or replace function public.place_order(p_lines jsonb, p_address jsonb, p_coupon_code text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_profile public.profiles%rowtype;
  current_product public.products%rowtype;
  current_coupon public.coupons%rowtype;
  line_item record;
  order_id uuid := gen_random_uuid();
  order_subtotal numeric(12, 2) := 0;
  order_discount numeric(12, 2) := 0;
  order_tax numeric(12, 2) := 0;
  order_total numeric(12, 2) := 0;
  coupon_value text := null;
begin
  if current_user_id is null then
    raise exception 'Sign in before placing an order.';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if p_address is null or jsonb_typeof(p_address) <> 'object' then
    raise exception 'A shipping address is required.';
  end if;
  if exists (
    select 1
    from jsonb_to_recordset(p_lines) as line(product_id text, quantity numeric)
    where product_id is null or quantity is null or quantity < 1 or quantity <> trunc(quantity)
  ) then
    raise exception 'Cart items must have a product and a positive whole-number quantity.';
  end if;
  if exists (
    select 1
    from (values ('first_name'), ('last_name'), ('phone'), ('line1'), ('city'), ('state'), ('country')) as required_field(key)
    where nullif(btrim(p_address ->> required_field.key), '') is null
  ) then
    raise exception 'Complete all shipping address fields before placing your order.';
  end if;
  if p_address ->> 'country' <> 'Pakistan' then
    raise exception 'This store currently ships within Pakistan.';
  end if;

  select * into current_profile
  from public.profiles
  where id = current_user_id;
  if not found then
    raise exception 'Your customer profile could not be found.';
  end if;

  for line_item in
    select product_id::uuid as product_id, coalesce(sum(quantity), 0)::integer as quantity
    from jsonb_to_recordset(p_lines) as line(product_id text, quantity integer)
    group by product_id
    order by product_id
  loop
    if line_item.quantity < 1 then
      raise exception 'Product quantities must be at least one.';
    end if;
    select * into current_product
    from public.products
    where id = line_item.product_id and is_active = 1
    for update;
    if not found then
      raise exception 'A product in your cart is unavailable.';
    end if;
    if current_product.stock < line_item.quantity then
      raise exception 'Not enough stock for %.', current_product.name;
    end if;
    order_subtotal := order_subtotal + current_product.price * line_item.quantity;
  end loop;

  if p_coupon_code is not null and btrim(p_coupon_code) <> '' then
    select * into current_coupon
    from public.coupons
    where upper(code) = upper(btrim(p_coupon_code)) and active = 1;
    if not found then
      raise exception 'Coupon not found or inactive.';
    end if;
    if current_coupon.expires_at is not null and current_coupon.expires_at < now() then
      raise exception 'Coupon has expired.';
    end if;
    if order_subtotal < current_coupon.min_subtotal then
      raise exception 'Your order does not meet this coupon''s minimum subtotal.';
    end if;
    order_discount := case
      when current_coupon.type = 'percent' then order_subtotal * current_coupon.value / 100
      else least(current_coupon.value, order_subtotal)
    end;
    coupon_value := current_coupon.code;
  end if;

  order_tax := greatest(0, order_subtotal - order_discount) * 0.08;
  order_total := greatest(0, order_subtotal - order_discount) + order_tax;

  insert into public.orders (
    id, customer_id, customer_name, customer_email, status, subtotal, discount,
    tax, total, coupon_code, shipping_address
  ) values (
    order_id, current_user_id,
    concat_ws(' ', nullif(btrim(p_address ->> 'first_name'), ''), nullif(btrim(p_address ->> 'last_name'), '')),
    current_profile.email, 'pending',
    order_subtotal, order_discount, order_tax, order_total, coupon_value, p_address
  );

  for line_item in
    select product_id::uuid as product_id, quantity::integer as quantity
    from jsonb_to_recordset(p_lines) as line(product_id text, quantity integer)
    order by product_id
  loop
    select * into current_product from public.products where id = line_item.product_id;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (order_id, current_product.id, current_product.name, current_product.price, line_item.quantity);
    update public.products set stock = stock - line_item.quantity where id = current_product.id;
  end loop;

  return order_id;
end;
$$;

create or replace function public.admin_reset_sales()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  sold_item record;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Administrator access required.';
  end if;

  perform id from public.products order by id for update;

  for sold_item in
    select product_id, sum(quantity)::integer as quantity
    from public.order_items
    group by product_id
    order by product_id
  loop
    update public.products
    set stock = stock + sold_item.quantity
    where id = sold_item.product_id;
  end loop;

  delete from public.orders where id is not null;
end;
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlist enable row level security;

drop policy if exists "Categories are publicly readable" on public.categories;
create policy "Categories are publicly readable" on public.categories for select to anon, authenticated using (true);
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Active products are public" on public.products;
create policy "Active products are public" on public.products for select to anon, authenticated using (is_active = 1 or public.is_admin());
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users read own profile and admins read all" on public.profiles;
create policy "Users read own profile and admins read all" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_admin());
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "Store settings are publicly readable" on public.store_settings;
create policy "Store settings are publicly readable" on public.store_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins manage store settings" on public.store_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Customers read their orders and admins read all" on public.orders;
create policy "Customers read their orders and admins read all" on public.orders for select to authenticated using (customer_id = (select auth.uid()) or public.is_admin());
drop policy if exists "Admins update order status" on public.orders;
create policy "Admins update order status" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Order items follow order access" on public.order_items;
create policy "Order items follow order access" on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (orders.customer_id = (select auth.uid()) or public.is_admin())
  )
);

drop policy if exists "Active coupons are public" on public.coupons;
create policy "Active coupons are public" on public.coupons for select to anon, authenticated using (active = 1 or public.is_admin());
drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Admins manage coupons" on public.coupons for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Reviews are publicly readable" on public.reviews;
create policy "Reviews are publicly readable" on public.reviews for select to anon, authenticated using (true);
drop policy if exists "Customers create their own reviews" on public.reviews;
create policy "Customers create their own reviews" on public.reviews for insert to authenticated
with check (customer_id = (select auth.uid()));
drop policy if exists "Admins delete reviews" on public.reviews;
create policy "Admins delete reviews" on public.reviews for delete to authenticated using (public.is_admin());

drop policy if exists "Users manage their own wishlist" on public.wishlist;
create policy "Users manage their own wishlist" on public.wishlist for all to authenticated
using (customer_id = (select auth.uid()))
with check (customer_id = (select auth.uid()));

grant select on public.categories, public.products, public.coupons, public.reviews to anon, authenticated;
grant select on public.profiles, public.store_settings, public.orders, public.order_items, public.wishlist to anon, authenticated;
revoke update on public.profiles from anon, authenticated;
revoke update (id, name, email, phone, role, created_at) on public.profiles from anon, authenticated;
grant update (name, phone) on public.profiles to authenticated;
grant insert, update, delete on public.categories, public.products, public.coupons to authenticated;
grant insert, update on public.store_settings to authenticated;
grant insert, delete on public.reviews, public.wishlist to authenticated;
grant update (status) on public.orders to authenticated;
grant execute on function public.adjust_inventory(uuid, integer) to authenticated;
grant execute on function public.place_order(jsonb, jsonb, text) to authenticated;
revoke all on function public.admin_reset_sales() from public, anon;
grant execute on function public.admin_reset_sales() to authenticated;

insert into public.categories (id, name, slug, description) values
  ('10000000-0000-4000-8000-000000000001', 'Audio', 'audio', 'Headphones, speakers & more'),
  ('10000000-0000-4000-8000-000000000002', 'Wearables', 'wearables', 'Smart watches & trackers'),
  ('10000000-0000-4000-8000-000000000003', 'Home', 'home', 'Smart home essentials'),
  ('10000000-0000-4000-8000-000000000004', 'Accessories', 'accessories', 'Cables, cases & bags')
on conflict (id) do nothing;

insert into public.products (
  id, name, slug, description, price, compare_at_price, category_id, image_url, stock, sku, is_active
) values
  ('20000000-0000-4000-8000-000000000001', 'Aurora Wireless Headphones', 'aurora-wireless-headphones', 'Everyday audio, selected for the Logic Forge collection.', 129.99, 159.99, '10000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/product-0/600/600', 42, 'SKU-1000', 1),
  ('20000000-0000-4000-8000-000000000002', 'Pulse Bluetooth Speaker', 'pulse-bluetooth-speaker', 'Everyday audio, selected for the Logic Forge collection.', 59.99, null, '10000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/product-1/600/600', 60, 'SKU-1001', 1),
  ('20000000-0000-4000-8000-000000000003', 'Echo Earbuds Pro', 'echo-earbuds-pro', 'Everyday audio, selected for the Logic Forge collection.', 89.00, 109.00, '10000000-0000-4000-8000-000000000001', 'https://picsum.photos/seed/product-2/600/600', 25, 'SKU-1002', 1),
  ('20000000-0000-4000-8000-000000000004', 'Nimbus Fitness Watch', 'nimbus-fitness-watch', 'Wearable technology, selected for the Logic Forge collection.', 149.00, null, '10000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/product-3/600/600', 30, 'SKU-1003', 1),
  ('20000000-0000-4000-8000-000000000005', 'Orbit Smart Ring', 'orbit-smart-ring', 'Wearable technology, selected for the Logic Forge collection.', 199.00, 229.00, '10000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/product-4/600/600', 15, 'SKU-1004', 1),
  ('20000000-0000-4000-8000-000000000006', 'Flux Sleep Tracker Band', 'flux-sleep-tracker-band', 'Wearable technology, selected for the Logic Forge collection.', 79.00, null, '10000000-0000-4000-8000-000000000002', 'https://picsum.photos/seed/product-5/600/600', 50, 'SKU-1005', 1),
  ('20000000-0000-4000-8000-000000000007', 'Halo Smart Bulb (4-pack)', 'halo-smart-bulb-4-pack', 'Smart home technology, selected for the Logic Forge collection.', 39.99, 49.99, '10000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/product-6/600/600', 100, 'SKU-1006', 1),
  ('20000000-0000-4000-8000-000000000008', 'Drift Robot Vacuum', 'drift-robot-vacuum', 'Smart home technology, selected for the Logic Forge collection.', 299.00, 349.00, '10000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/product-7/600/600', 12, 'SKU-1007', 1),
  ('20000000-0000-4000-8000-000000000009', 'Vesta Smart Thermostat', 'vesta-smart-thermostat', 'Smart home technology, selected for the Logic Forge collection.', 179.00, null, '10000000-0000-4000-8000-000000000003', 'https://picsum.photos/seed/product-8/600/600', 20, 'SKU-1008', 1),
  ('20000000-0000-4000-8000-000000000010', 'Kilo Braided USB-C Cable', 'kilo-braided-usb-c-cable', 'Useful everyday accessories, selected for the Logic Forge collection.', 14.99, null, '10000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/product-9/600/600', 200, 'SKU-1009', 1),
  ('20000000-0000-4000-8000-000000000011', 'Case & Carry Laptop Sleeve', 'case-carry-laptop-sleeve', 'Useful everyday accessories, selected for the Logic Forge collection.', 34.99, 44.99, '10000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/product-10/600/600', 75, 'SKU-1010', 1),
  ('20000000-0000-4000-8000-000000000012', 'Voyager Travel Backpack', 'voyager-travel-backpack', 'Useful everyday accessories, selected for the Logic Forge collection.', 89.99, null, '10000000-0000-4000-8000-000000000004', 'https://picsum.photos/seed/product-11/600/600', 40, 'SKU-1011', 1)
on conflict (id) do update
set description = excluded.description
where public.products.description = 'A customer favorite with premium build quality, fast shipping, and a hassle-free 30-day return policy. Designed for everyday use.';

insert into public.coupons (id, code, type, value, active, min_subtotal) values
  ('30000000-0000-4000-8000-000000000001', 'WELCOME10', 'percent', 10, 1, 0),
  ('30000000-0000-4000-8000-000000000002', 'SHIP20', 'fixed', 20, 1, 100)
on conflict (id) do nothing;
