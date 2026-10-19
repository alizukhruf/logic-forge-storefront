alter table public.profiles
  add column if not exists phone text not null default '';

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

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.sync_profile_email_from_auth_user();

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
    raise exception 'Complete all required shipping address fields before placing your order.';
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

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
revoke update on public.profiles from anon, authenticated;
revoke update (id, name, email, phone, role, created_at) on public.profiles from anon, authenticated;
grant update (name, phone) on public.profiles to authenticated;

alter table public.store_settings enable row level security;

drop policy if exists "Store settings are publicly readable" on public.store_settings;
create policy "Store settings are publicly readable"
  on public.store_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage store settings" on public.store_settings;
create policy "Admins manage store settings"
  on public.store_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.store_settings to anon, authenticated;
grant insert, update on public.store_settings to authenticated;
revoke all on function public.admin_reset_sales() from public, anon;
grant execute on function public.admin_reset_sales() to authenticated;
