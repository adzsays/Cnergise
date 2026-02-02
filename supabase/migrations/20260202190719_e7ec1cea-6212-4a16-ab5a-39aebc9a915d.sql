-- Create accounting periods table
CREATE TABLE public.accounting_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  space_id UUID REFERENCES public.spaces(id),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;

-- RLS policies for accounting_periods
CREATE POLICY "Users can view their own accounting periods" 
ON public.accounting_periods FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accounting periods" 
ON public.accounting_periods FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounting periods" 
ON public.accounting_periods FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own accounting periods" 
ON public.accounting_periods FOR DELETE 
USING (auth.uid() = user_id);

-- Add opening balance fields to financial_accounts
ALTER TABLE public.financial_accounts 
ADD COLUMN opening_balance NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN opening_balance_date DATE,
ADD COLUMN account_code TEXT,
ADD COLUMN account_class TEXT CHECK (account_class IN ('asset', 'liability', 'equity', 'income', 'expense'));

-- Create journal entries table for double-entry accounting
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  space_id UUID REFERENCES public.spaces(id),
  transaction_id UUID REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  description TEXT,
  reference_number TEXT,
  is_opening_balance BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for journal_entries
CREATE POLICY "Users can view their own journal entries" 
ON public.journal_entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries" 
ON public.journal_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" 
ON public.journal_entries FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" 
ON public.journal_entries FOR DELETE 
USING (auth.uid() = user_id);

-- Create journal entry lines for debit/credit entries
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  debit_amount NUMERIC NOT NULL DEFAULT 0,
  credit_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- RLS policies for journal_entry_lines (through journal_entries ownership)
CREATE POLICY "Users can view their own journal entry lines" 
ON public.journal_entry_lines FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.journal_entries 
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id 
  AND journal_entries.user_id = auth.uid()
));

CREATE POLICY "Users can create their own journal entry lines" 
ON public.journal_entry_lines FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.journal_entries 
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id 
  AND journal_entries.user_id = auth.uid()
));

CREATE POLICY "Users can update their own journal entry lines" 
ON public.journal_entry_lines FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.journal_entries 
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id 
  AND journal_entries.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own journal entry lines" 
ON public.journal_entry_lines FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.journal_entries 
  WHERE journal_entries.id = journal_entry_lines.journal_entry_id 
  AND journal_entries.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_accounting_periods_updated_at
BEFORE UPDATE ON public.accounting_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();