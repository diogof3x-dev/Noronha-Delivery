-- Seed das 24 categorias oficiais (demandas do administrador, sem cigarro eletrônico)
insert into public.categories (id, label, group_id, icon, position) values
  ('farmacia',            'Farmácia e emergências',              'essenciais', 'Pill',           1),
  ('mercado',             'Mercado rápido',                       'essenciais', 'ShoppingBasket', 2),
  ('agua-gelo',           'Água, gelo e carvão',                  'essenciais', 'Flame',          3),
  ('conveniencia',        'Conveniência 24h',                     'essenciais', 'GlassWater',     4),
  ('itens-turisticos',    'Itens turísticos',                     'essenciais', 'Sun',            5),

  ('delivery-praia',      'Delivery de praia',                    'delivery',   'Umbrella',       10),
  ('delivery-pousada',    'Delivery para pousadas',               'delivery',   'Hotel',          11),
  ('delivery-barco',      'Delivery para barcos',                 'delivery',   'Sailboat',       12),
  ('delivery-b2b',        'Entregas entre empresas',              'delivery',   'Truck',          13),

  ('transporte-malas',    'Transporte de malas',                  'mobilidade', 'Luggage',        20),
  ('transfer',            'Transfer aeroporto / pousada',         'mobilidade', 'Bus',            21),
  ('bikes-scooters',      'Aluguel de bikes e scooters',          'mobilidade', 'Bike',           22),

  ('reserva-restaurante', 'Reserva de restaurantes',              'reservas',   'HandPlatter',    30),
  ('passeios',            'Agendamento de passeios',              'reservas',   'Waves',          31),
  ('ingressos',           'Venda de ingressos e eventos',         'reservas',   'PartyPopper',    32),

  ('recarga',             'Recarga de celular',                   'servicos',   'Smartphone',     40),
  ('power-bank',          'Aluguel de carregadores / power banks','servicos',   'Plug',           41),
  ('lavanderia',          'Retirada de lavanderia',               'servicos',   'WashingMachine', 42),
  ('pet',                 'Pet shop / veterinário',               'servicos',   'Dog',            43),
  ('academia',            'Academia e personal',                  'servicos',   'Dumbbell',       44),
  ('spa',                 'Massagens e spa',                      'servicos',   'Sparkles',       45),
  ('mecanica',            'Assistência mecânica',                 'servicos',   'Hammer',         46),

  ('turismo-vip',         'Turismo VIP',                          'premium',    'Star',           50),
  ('concierge',           'Concierge para turistas',              'premium',    'Headset',        51)
on conflict (id) do update
  set label    = excluded.label,
      group_id = excluded.group_id,
      icon     = excluded.icon,
      position = excluded.position;
