import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
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
  space_id: string | null;
  amount: number;
  percentage: number;
  daily: number;
  monthly: number;
  projections: number[];
  cost_centre: string | null;
  frequency: string | null;
  created_at: string;
  updated_at: string;
}

interface FinancialAccount {
  id: string;
  user_id: string;
  name: string;
  type: string;
  group_name: string;
  space_id: string | null;
  category: string | null;
  balance: number;
  currency: string;
  credit_limit: number | null;
  account_code: string | null;
  account_class: string | null;
  opening_balance: number;
  opening_balance_date: string | null;
  created_at: string;
  updated_at: string;
}

interface BalanceSheetSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  availableCash: number;
  availableCredit: number;
}

interface FinancialDataContextType {
  transactions: FinancialTransaction[];
  accounts: FinancialAccount[];
  loading: boolean;
  refreshData: () => Promise<void>;
  // View mode and filters
  viewMode: 'type' | 'costcentre';
  setViewMode: (mode: 'type' | 'costcentre') => void;
  group: 'all' | 'personal' | 'business';
  setGroup: (group: 'all' | 'personal' | 'business') => void;
  // Computed data
  balanceSheetSummary: BalanceSheetSummary;
  monthLabels: string[];
  // Transaction operations
  updateTransaction: (transactionId: string, newMonthly: number) => Promise<void>;
  addTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'user_id' | 'percentage' | 'daily' | 'projections' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTransactionName: (transactionId: string, newName: string) => Promise<void>;
  updateTransactionGroup: (transactionId: string, newGroup: string) => Promise<void>;
  updateTransactionDate: (transactionId: string, newDate: number) => Promise<void>;
  updateTransactionCategory: (transactionId: string, newCategory: string) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  // Category operations
  updateCategory: (oldCategory: string, newCategory: string, type: 'income' | 'expense') => Promise<void>;
  availableGroups: string[];
  addGroup: (groupName: string) => void;
}

const FinancialDataContext = createContext<FinancialDataContextType | undefined>(undefined);

// Generate forward-looking month labels
const getMonthLabels = () => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const labels: string[] = [];
  
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth + i) % 12;
    labels.push(monthNames[monthIndex]);
  }
  return labels;
};

export const FinancialDataProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'type' | 'costcentre'>('costcentre');
  const [group, setGroup] = useState<'all' | 'personal' | 'business'>('all');
  const [availableGroups, setAvailableGroups] = useState<string[]>(['Personal', 'Business']);
  const monthLabels = useMemo(() => getMonthLabels(), []);

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
    
    // Transform data to include projections array
    return (data || []).map(t => ({
      ...t,
      projections: Array.isArray(t.projections) ? t.projections : Array(12).fill(t.monthly)
    }));
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

  // Calculate balance sheet summary
  const balanceSheetSummary = useMemo((): BalanceSheetSummary => {
    const assets = accounts
      .filter(a => a.type === 'Asset')
      .reduce((sum, a) => sum + a.balance, 0);
    
    const liabilities = accounts
      .filter(a => a.type === 'Liability')
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
    
    const availableCash = accounts
      .filter(a => a.type === 'Asset' && (a.category === 'Bank Account' || a.category === 'Cash'))
      .reduce((sum, a) => sum + a.balance, 0);
    
    const availableCredit = accounts
      .filter(a => a.type === 'Liability' && a.credit_limit)
      .reduce((sum, a) => sum + ((a.credit_limit || 0) - Math.abs(a.balance)), 0);

    return {
      totalAssets: assets,
      totalLiabilities: liabilities,
      netWorth: assets - liabilities,
      availableCash,
      availableCredit: Math.max(0, availableCredit),
    };
  }, [accounts]);

  // Transaction operations
  const updateTransaction = async (transactionId: string, newMonthly: number) => {
    try {
      const projections = Array(12).fill(newMonthly);
      
      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          monthly: newMonthly,
          daily: newMonthly / 30,
          projections,
        })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev => 
        prev.map(t => 
          t.id === transactionId 
            ? { ...t, monthly: newMonthly, daily: newMonthly / 30, projections }
            : t
        )
      );
      
      toast.success('Transaction updated');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const addTransaction = async (transactionData: Omit<FinancialTransaction, 'id' | 'user_id' | 'percentage' | 'daily' | 'projections' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const newTransaction = {
        ...transactionData,
        user_id: user.id,
        date: transactionData.date || Date.now(),
        percentage: 0,
        daily: transactionData.monthly / 30,
        projections: Array(12).fill(transactionData.monthly),
        cost_centre: transactionData.cost_centre || 'General',
        frequency: transactionData.frequency || 'one-time',
      };

      const { error } = await supabase
        .from('financial_transactions')
        .insert(newTransaction);

      if (error) throw error;

      await refreshData();
      toast.success('Transaction added');
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const updateTransactionName = async (transactionId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ subcategory: newName })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t => t.id === transactionId ? { ...t, subcategory: newName } : t)
      );
    } catch (error) {
      console.error('Error updating transaction name:', error);
    }
  };

  const updateTransactionGroup = async (transactionId: string, newGroup: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ group_name: newGroup })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t => t.id === transactionId ? { ...t, group_name: newGroup } : t)
      );
    } catch (error) {
      console.error('Error updating transaction group:', error);
    }
  };

  const updateTransactionDate = async (transactionId: string, newDate: number) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ date: newDate })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t => t.id === transactionId ? { ...t, date: newDate } : t)
      );
    } catch (error) {
      console.error('Error updating transaction date:', error);
    }
  };

  const updateTransactionCategory = async (transactionId: string, newCategory: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ category: newCategory })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t => t.id === transactionId ? { ...t, category: newCategory } : t)
      );
      
      toast.success('Category updated');
    } catch (error) {
      console.error('Error updating transaction category:', error);
      toast.error('Failed to update category');
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const updateCategory = async (oldCategory: string, newCategory: string, type: 'income' | 'expense') => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ category: newCategory })
        .eq('category', oldCategory)
        .eq('type', type);

      if (error) throw error;

      setTransactions(prev =>
        prev.map(t =>
          t.category === oldCategory && t.type === type
            ? { ...t, category: newCategory }
            : t
        )
      );

      toast.success('Category updated');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const addGroup = (groupName: string) => {
    if (!availableGroups.includes(groupName)) {
      setAvailableGroups(prev => [...prev, groupName]);
    }
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
    <FinancialDataContext.Provider value={{ 
      transactions, 
      accounts, 
      loading, 
      refreshData,
      viewMode,
      setViewMode,
      group,
      setGroup,
      balanceSheetSummary,
      monthLabels,
      updateTransaction,
      addTransaction,
      updateTransactionName,
      updateTransactionGroup,
      updateTransactionDate,
      updateTransactionCategory,
      deleteTransaction,
      updateCategory,
      availableGroups,
      addGroup,
    }}>
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
