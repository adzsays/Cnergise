-- Drop existing finance tables
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- Create financial_accounts table
CREATE TABLE public.financial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'GBP',
  type TEXT NOT NULL CHECK (type IN ('bank', 'pension', 'investment', 'liability')),
  credit_limit NUMERIC(15, 2),
  group_name TEXT NOT NULL CHECK (group_name IN ('Personal', 'Corential')),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_transactions table
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date BIGINT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  daily NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monthly NUMERIC(15, 2) NOT NULL,
  group_name TEXT NOT NULL CHECK (group_name IN ('Personal', 'Corential')),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'asset', 'liability')),
  projections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create physical_assets table
CREATE TABLE public.physical_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('home', 'car')),
  value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  group_name TEXT NOT NULL CHECK (group_name IN ('Personal', 'Corential')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_accounts
CREATE POLICY "Users can view their own financial accounts" 
ON public.financial_accounts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial accounts" 
ON public.financial_accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial accounts" 
ON public.financial_accounts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial accounts" 
ON public.financial_accounts FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for financial_transactions
CREATE POLICY "Users can view their own financial transactions" 
ON public.financial_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial transactions" 
ON public.financial_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial transactions" 
ON public.financial_transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial transactions" 
ON public.financial_transactions FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for physical_assets
CREATE POLICY "Users can view their own physical assets" 
ON public.physical_assets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own physical assets" 
ON public.physical_assets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own physical assets" 
ON public.physical_assets FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own physical assets" 
ON public.physical_assets FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_financial_accounts_updated_at
BEFORE UPDATE ON public.financial_accounts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_physical_assets_updated_at
BEFORE UPDATE ON public.physical_assets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_financial_accounts_user_id ON public.financial_accounts(user_id);
CREATE INDEX idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX idx_financial_transactions_type ON public.financial_transactions(type);
CREATE INDEX idx_physical_assets_user_id ON public.physical_assets(user_id);