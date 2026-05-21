-- Booking system: event types, availability, overrides, questions, bookings
create table if not exists public.booking_event_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  duration_minutes int not null default 30 check (duration_minutes between 5 and 480),
  location_type text not null default 'google_meet' check (location_type in ('google_meet','in_person','phone','custom')),
  location_details text,
  color text default '#0ea5e9',
  buffer_before_minutes int not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes int not null default 0 check (buffer_after_minutes >= 0),
  min_notice_minutes int not null default 60 check (min_notice_minutes >= 0),
  max_advance_days int not null default 60 check (max_advance_days between 1 and 365),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);
create index if not exists idx_booking_event_types_user_active on public.booking_event_types(user_id, is_active);

create table if not exists public.booking_availability_rules (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references public.booking_event_types(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index if not exists idx_booking_avail_event on public.booking_availability_rules(event_type_id);

create table if not exists public.booking_date_overrides (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references public.booking_event_types(id) on delete cascade,
  date date not null,
  is_unavailable boolean not null default false,
  start_time time,
  end_time time,
  unique (event_type_id, date)
);
create index if not exists idx_booking_override_event_date on public.booking_date_overrides(event_type_id, date);

create table if not exists public.booking_questions (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references public.booking_event_types(id) on delete cascade,
  label text not null,
  question_type text not null default 'text' check (question_type in ('text','textarea','phone','select','email')),
  options text[],
  required boolean not null default false,
  sort_order int not null default 0
);
create index if not exists idx_booking_questions_event on public.booking_questions(event_type_id);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references public.booking_event_types(id) on delete cascade,
  host_user_id uuid not null,
  invitee_name text not null,
  invitee_email text not null,
  invitee_notes text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  timezone text,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  cancellation_reason text,
  google_event_id text,
  google_calendar_id text,
  meet_link text,
  location_snapshot text,
  cancel_token text unique not null default encode(gen_random_bytes(24),'hex'),
  reschedule_token text unique not null default encode(gen_random_bytes(24),'hex'),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bookings_host_start on public.bookings(host_user_id, start_time);
create index if not exists idx_bookings_event_start on public.bookings(event_type_id, start_time);
create index if not exists idx_bookings_status on public.bookings(status);

-- updated_at triggers
create trigger trg_booking_event_types_updated before update on public.booking_event_types
  for each row execute function public.update_updated_at_column();
create trigger trg_bookings_updated before update on public.bookings
  for each row execute function public.update_updated_at_column();

-- Enable RLS
alter table public.booking_event_types enable row level security;
alter table public.booking_availability_rules enable row level security;
alter table public.booking_date_overrides enable row level security;
alter table public.booking_questions enable row level security;
alter table public.bookings enable row level security;

-- Owner full access on event_types
create policy "Owner manages own event types" on public.booking_event_types
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Public can view active event types (needed for public booking page)
create policy "Public can view active event types" on public.booking_event_types
  for select using (is_active = true);

-- Availability rules: owner manages, public reads (joined via active event type)
create policy "Owner manages availability rules" on public.booking_availability_rules
  for all using (exists (select 1 from public.booking_event_types e where e.id = event_type_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.booking_event_types e where e.id = event_type_id and e.user_id = auth.uid()));
create policy "Public reads availability rules" on public.booking_availability_rules
  for select using (exists (select 1 from public.booking_event_types e where e.id = event_type_id and e.is_active = true));

-- Date overrides
create policy "Owner manages date overrides" on public.booking_date_overrides
  for all using (exists (select 1 from public.booking_event_types e where e.id = event_type_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.booking_event_types e where e.id = event_type_id and e.user_id = auth.uid()));
create policy "Public reads date overrides" on public.booking_date_overrides
  for select using (exists (select 1 from public.booking_event_types e where e.id = event_type_id and e.is_active = true));

-- Questions
create policy "Owner manages questions" on public.booking_questions
  for all using (exists (select 1 from public.booking_event_types e where e.id = event_type_id and e.user_id = auth.uid()))
  with check (exists (select 1 from public.booking_event_types e where e.id = event_type_id and e.user_id = auth.uid()));
create policy "Public reads questions" on public.booking_questions
  for select using (exists (select 1 from public.booking_event_types e where e.id = event_type_id and e.is_active = true));

-- Bookings: only host can view/modify in-app; public writes happen via service-role edge function
create policy "Host views own bookings" on public.bookings
  for select using (auth.uid() = host_user_id);
create policy "Host updates own bookings" on public.bookings
  for update using (auth.uid() = host_user_id) with check (auth.uid() = host_user_id);
create policy "Host deletes own bookings" on public.bookings
  for delete using (auth.uid() = host_user_id);
-- Intentionally no public insert; edge function uses service role.
