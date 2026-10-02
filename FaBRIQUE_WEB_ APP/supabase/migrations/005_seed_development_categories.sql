-- Development taxonomy only; no vendors, products, customers, orders, or financial activity are seeded.
insert into public.categories (name, slug, description, sort_order)
values
  ('Aso Oke', 'aso-oke', 'Handwoven Yoruba cloth.', 10),
  ('Atiku', 'atiku', 'Lightweight embroidered and patterned fabric.', 20),
  ('Polish Lace', 'polish-lace', 'Decorative lace fabric for occasion wear.', 30),
  ('Voile Lace', 'voile-lace', 'Lightweight lace with an open, airy weave.', 40),
  ('Net Lace', 'net-lace', 'Net-based embroidered lace fabric.', 50),
  ('Hand-Cut Lace', 'hand-cut-lace', 'Lace with hand-finished embroidered motifs.', 60),
  ('Cord Lace', 'cord-lace', 'Embroidered lace with raised cord detailing.', 70),
  ('Dry Lace', 'dry-lace', 'Structured lace fabric for occasion wear.', 80),
  ('Swiss Lace', 'swiss-lace', 'Fine embroidered Swiss voile lace.', 90)
on conflict (slug) do nothing;
