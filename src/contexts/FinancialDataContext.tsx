import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FinancialTransaction {
  id: string;
  user_id: string;
  date: number;
  type: string;
  category: string;
  subcategory: string;
  group_name: string;
  amount: number;
  percentage: number;
  daily: number;
  monthly: number;
  projections: any;
  created_at: string;
  updated_at: string;
}

interface FinancialAccount {
  id: string;
  user_id: string;
  name: string;
  type: string;
  group_name: string;
  category: string | null;
  balance: number;
  currency: string;
  credit_limit: number | null;
  created_at: string;
  updated_at: string;
}

interface FinancialDataContextType {
  transactions: FinancialTransaction[];
  accounts: FinancialAccount[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

export const FinancialDataProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast.error('Failed to load transactions');
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data || [];
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('financial_accounts')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast.error('Failed to load accounts');
      console.error('Error fetching accounts:', error);
      return [];
    }
    return data || [];
  };

  const refreshData = async () => {
    setLoading(true);
    const [transactionsData, accountsData] = await Promise.all([
      fetchTransactions(),
      fetchAccounts(),
    ]);
    setTransactions(transactionsData);
    setAccounts(accountsData);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();

    const channel = supabase
      .channel('financial-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_transactions',
        },
        () => refreshData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_accounts',
        },
        () => refreshData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <FinancialDataContext.Provider value={{ transactions, accounts, loading, refreshData }}>
      {children}
    </FinancialDataContext.Provider>
  );
};

export const useFinancialData = () => {
  const context = useContext(FinancialDataContext);
  if (context === undefined) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider');
  }
  return context;
};
