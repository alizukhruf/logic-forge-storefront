do $$
begin
  update public.profiles
  set role = 'admin'
  where lower(email) = 'logicforge.admin@gmail.com';

  if not found then
    raise exception 'No LogicForge admin profile exists yet. Register logicforge.admin@gmail.com in the app first.';
  end if;
end;
$$;
