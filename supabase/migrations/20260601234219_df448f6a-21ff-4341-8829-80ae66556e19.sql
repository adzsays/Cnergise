-- Phase 2: drop tables with zero rows AND zero remaining code references.
DROP TABLE IF EXISTS public.journal_entry_lines CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.accounting_periods CASCADE;
DROP TABLE IF EXISTS public.external_messages CASCADE;