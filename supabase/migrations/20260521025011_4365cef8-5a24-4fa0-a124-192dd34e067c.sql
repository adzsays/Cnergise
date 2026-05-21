alter table public.booking_event_types
  add column if not exists timezone text not null default 'Europe/London';