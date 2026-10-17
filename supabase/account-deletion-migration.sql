alter table public.orders alter column customer_id drop not null;
alter table public.orders drop constraint if exists orders_customer_id_fkey;
alter table public.orders
  add constraint orders_customer_id_fkey
  foreign key (customer_id) references public.profiles(id) on delete set null;
