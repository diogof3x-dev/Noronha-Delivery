-- Noronha Delivery — extensões e tipos base
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

create type lead_type as enum (
  'waitlist',
  'comercio',
  'operador',
  'motorista',
  'pousada'
);

create type business_type as enum (
  'restaurante',
  'mercado',
  'farmacia',
  'conveniencia',
  'loja',
  'operador_passeio',
  'pousada',
  'locadora',
  'servico',
  'motorista'
);

create type service_kind as enum (
  'food_item',
  'tour',
  'rental',
  'lodging',
  'transport',
  'service',
  'ticket'
);

create type order_status as enum (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'in_transit',
  'delivered',
  'completed',
  'cancelled',
  'refunded'
);

create type payment_method as enum ('pix', 'card', 'cash', 'wallet');
create type payment_status as enum ('pending', 'paid', 'failed', 'refunded');

create type wallet_tx_type as enum (
  'cashback',
  'topup',
  'order_payment',
  'order_refund',
  'withdrawal',
  'adjustment'
);

create type withdrawal_status as enum ('requested', 'processing', 'paid', 'rejected');

create type user_role as enum ('customer', 'business_owner', 'driver', 'admin');

create type rated_entity_kind as enum ('business', 'driver', 'service');
