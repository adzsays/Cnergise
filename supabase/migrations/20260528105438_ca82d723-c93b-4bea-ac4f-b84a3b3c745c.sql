ALTER TABLE public.booking_event_types
ADD COLUMN IF NOT EXISTS booking_calendar_id text;

UPDATE public.booking_event_types et
SET booking_calendar_id = p.booking_calendar_id
FROM public.profiles p
WHERE et.user_id = p.id
  AND et.booking_calendar_id IS NULL
  AND p.booking_calendar_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booking_event_types_booking_calendar
ON public.booking_event_types(user_id, booking_calendar_id);