-- La URL de cada producto (/producto/<slug>) se fija al crearlo y no cambia
-- aunque se edite el nombre, el precio o la ficha.
create or replace function public.mantener_slug_producto()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if old.slug is not null and old.slug <> '' and new.slug is distinct from old.slug then
    new.slug := old.slug;
  end if;
  return new;
end;
$$;

drop trigger if exists mantener_slug_producto on public.products;
create trigger mantener_slug_producto before update on public.products
for each row execute function public.mantener_slug_producto();
