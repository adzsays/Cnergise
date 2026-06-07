import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { projectAmortization, RateTerm } from '@/utils/loanAmortization';
import { amountToMonthly, buildProjections } from '@/lib/finance/frequency';

export type CashFlowSection = 'operating' | 'investing' | 'financing';

interface FinancialTransaction {
  id: string;
  user_id: string;
  date: number;
  type: string;
  category: string;
  subcategory: string;
  group_name: string;
  /** Alias of group_name kept for compatibility with the ported Cash Flow views. */
  group: string;
  space_id: string | null;
  amount: number;
  percentage: number;
  daily: number;
  monthly: number;
  projections: number[];
  cost_centre: string | null;
  frequency: string | null;
  cash_flow_section: CashFlowSection;
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
  interest_rate?: number | null;
  term_months?: number | null;
  monthly_payment?: number | null;
  loan_start_date?: string | null;
  original_principal?: number | null;
  last_payment_applied_date?: string | null;
  payment_day?: number | null;
  cost_centre?: string | null;
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

/** Account shape expected by the ported Cash Flow Forecasting components. */
export interface SourceAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: 'bank' | 'pension' | 'investment' | 'liability';
  creditLimit?: number;
  group: string;
  category?: string;
}

/** BalanceSheet shape expected by the ported Cash Flow Forecasting components. */
export interface SourceBalanceSheet {
  netAsset: number;
  availableCash: number;
  availableCredit: number;
  bankAccounts: SourceAccount[];
  pensions: SourceAccount[];
  investments: SourceAccount[];
  liabilities: SourceAccount[];
  carValue: number;
  homeValue: number;
  carGroup: string;
  homeGroup: string;
}

interface FinancialDataContextType {
  transactions: FinancialTransaction[];
  accounts: FinancialAccount[];
  loading: boolean;
  refreshData: () => Promise<void>;
  // View mode and filters
  viewMode: 'type' | 'costcentre';
  setViewMode: (mode: 'type' | 'costcentre') => void;
  group: 'all' | 'personal' | 'corential';
  setGroup: (group: 'all' | 'personal' | 'corential') => void;
  // Computed data
  balanceSheetSummary: BalanceSheetSummary;
  /** Adapter shape consumed by the ported Cash Flow Forecasting views. */
  balanceSheet: SourceBalanceSheet;
  monthLabels: string[];
  // Transaction operations
  /**
   * Update the per-occurrence amount on a transaction. The cached `monthly` is
   * recomputed from the row's frequency (daily/weekly/monthly/quarterly/yearly)
   * so the dashboard, projections, balances and exports all stay in sync.
   */
  updateTransaction: (transactionId: string, newAmount: number) => Promise<void>;
  /** Update the frequency and recompute monthly + projections from the current amount. */
  updateTransactionFrequency: (transactionId: string, newFrequency: string) => Promise<void>;
  addTransaction: (transaction: Partial<FinancialTransaction> & {
    monthly: number;
    type: string;
    category: string;
    subcategory: string;
    group?: string;
    group_name?: string;
    cash_flow_section?: CashFlowSection;
  }) => Promise<void>;
  updateTransactionName: (transactionId: string, newName: string) => Promise<void>;
  updateTransactionGroup: (transactionId: string, newGroup: string) => Promise<void>;
  updateTransactionDate: (transactionId: string, newDate: number) => Promise<void>;
  updateTransactionCategory: (transactionId: string, newCategory: string) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  // Account operations (ported view API)
  updateAccountBalance: (accountId: string, newBalance: number, type: 'bank' | 'pension' | 'investment' | 'liability' | 'home' | 'car') => Promise<void>;
  updateAccountName: (accountId: string, newName: string, accountType: 'bank' | 'pension' | 'investment' | 'liability') => Promise<void>;
  updateAccountGroup: (accountId: string, newGroup: string, accountType: 'bank' | 'pension' | 'investment' | 'liability') => Promise<void>;
  updateAccountCategory: (accountId: string, newCategory: string, accountType: 'bank' | 'pension' | 'investment' | 'liability') => Promise<void>;
  updateHomeValue: (newValue: number) => Promise<void>;
  updateCarValue: (newValue: number) => Promise<void>;
  updatePhysicalAssetGroup: (assetType: 'home' | 'car', newGroup: string) => Promise<void>;
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
  const currentYear = currentDate.getFullYear();
  const labels: string[] = [];

  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const yearOffset = Math.floor((currentMonth + i) / 12);
    labels.push(`${monthNames[monthIndex]} ${currentYear + yearOffset}`);
  }
  return labels;
};

interface PhysicalAssetRow {
  id: string;
  asset_type: string;
  value: number;
  group_name: string;
}

// Map an account into one of the source-view buckets based on category/account_class.
const classifyAsset = (a: FinancialAccount): 'bank' | 'pension' | 'investment' => {
  const cat = (a.category || '').toLowerCase();
  if (cat.includes('pension')) return 'pension';
  if (cat.includes('investment') || cat.includes('crypto') || cat.includes('broker')) return 'investment';
  return 'bank';
};

export const FinancialDataProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [physicalAssets, setPhysicalAssets] = useState<PhysicalAssetRow[]>([]);
  const [rateTerms, setRateTerms] = useState<RateTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'type' | 'costcentre'>('costcentre');
  const [group, setGroup] = useState<'all' | 'personal' | 'corential'>('all');
  const [availableGroups, setAvailableGroups] = useState<string[]>(['Personal', 'Corential']);
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

    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return (data || []).map((t: any) => {
      const monthly = Number(t.monthly) || 0;
      const startDate = t.start_date ? new Date(t.start_date) : null;
      const endDate = t.end_date ? new Date(t.end_date) : null;
      // Build 12-month projections respecting start/end date bounds
      const projections: number[] = [];
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i + 1, 0);
        const beforeStart = startDate && monthEnd < startDate;
        const afterEnd = endDate && monthStart > endDate;
        if (beforeStart || afterEnd) {
          projections.push(0);
        } else if (Array.isArray(t.projections) && t.projections[i] != null) {
          projections.push(Number(t.projections[i]) || 0);
        } else {
          projections.push(monthly);
        }
      }
      return {
        ...t,
        group: t.group_name,
        projections,
        cash_flow_section: (t.cash_flow_section as CashFlowSection) || 'operating',
      };
    }) as FinancialTransaction[];
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
    return (data || []) as FinancialAccount[];
  };

  const fetchPhysicalAssets = async () => {
    const { data, error } = await supabase
      .from('physical_assets')
      .select('id, asset_type, value, group_name');
    if (error) {
      console.error('Error fetching physical assets:', error);
      return [];
    }
    return (data || []) as PhysicalAssetRow[];
  };

  const fetchRateTerms = async (): Promise<RateTerm[]> => {
    const { data, error } = await supabase
      .from('loan_rate_terms' as any)
      .select('*')
      .order('sequence', { ascending: true });
    if (error) {
      console.error('Error fetching loan rate terms:', error);
      return [];
    }
    return (data || []) as unknown as RateTerm[];
  };

  const hasLoadedRef = useRef(false);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const refreshData = useCallback(async () => {
    if (inFlightRef.current) return inFlightRef.current;
    // Only show full-page loading on the very first load. Subsequent refreshes
    // (realtime, post-mutation) update silently to keep tab switching snappy.
    if (!hasLoadedRef.current) setLoading(true);
    const p = (async () => {
      const [transactionsData, accountsData, physicalData, rateTermsData] = await Promise.all([
        fetchTransactions(),
        fetchAccounts(),
        fetchPhysicalAssets(),
        fetchRateTerms(),
      ]);
      setTransactions(transactionsData);
      setAccounts(accountsData);
      setPhysicalAssets(physicalData);
      setRateTerms(rateTermsData);

      const groupSet = new Set<string>(['Personal', 'Corential']);
      transactionsData.forEach((t) => t.group_name && groupSet.add(t.group_name));
      accountsData.forEach((a) => a.group_name && groupSet.add(a.group_name));
      setAvailableGroups(Array.from(groupSet));

      hasLoadedRef.current = true;
      setLoading(false);
    })();
    inFlightRef.current = p;
    try { await p; } finally { inFlightRef.current = null; }
  }, []);

  // ---- Adapter: build the SourceBalanceSheet shape from our existing tables.
  const balanceSheet = useMemo<SourceBalanceSheet>(() => {
    const toSource = (a: FinancialAccount, type: SourceAccount['type']): SourceAccount => ({
      id: a.id,
      name: a.name,
      balance: type === 'liability' ? -Math.abs(a.balance) : a.balance,
      currency: a.currency || 'GBP',
      type,
      creditLimit: a.credit_limit ?? undefined,
      group: a.group_name || 'Personal',
      category: a.category || (type === 'liability' ? 'Debt' : type === 'pension' ? 'Pension' : type === 'investment' ? 'Investment' : 'Bank Account'),
    });

    const isAsset = (a: FinancialAccount) =>
      (a.account_class || '').toLowerCase() === 'asset' ||
      (a.type || '').toLowerCase() === 'asset';
    const isLiability = (a: FinancialAccount) =>
      (a.account_class || '').toLowerCase() === 'liability' ||
      (a.type || '').toLowerCase() === 'liability';

    const assetAccounts = accounts.filter(isAsset);
    const liabilityAccounts = accounts.filter(isLiability);

    const bankAccounts: SourceAccount[] = [];
    const pensions: SourceAccount[] = [];
    const investments: SourceAccount[] = [];

    assetAccounts.forEach((a) => {
      const bucket = classifyAsset(a);
      const item = toSource(a, bucket);
      if (bucket === 'pension') pensions.push(item);
      else if (bucket === 'investment') investments.push(item);
      else bankAccounts.push(item);
    });

    const liabilities: SourceAccount[] = liabilityAccounts.map((a) => toSource(a, 'liability'));

    const home = physicalAssets.find((p) => p.asset_type?.toLowerCase() === 'home');
    const car = physicalAssets.find((p) => p.asset_type?.toLowerCase() === 'car');

    const homeValue = home?.value ?? 0;
    const carValue = car?.value ?? 0;
    const homeGroup = home?.group_name || 'Personal';
    const carGroup = car?.group_name || 'Personal';

    const totalAssets =
      bankAccounts.reduce((s, a) => s + a.balance, 0) +
      pensions.reduce((s, a) => s + a.balance, 0) +
      investments.reduce((s, a) => s + a.balance, 0) +
      homeValue +
      carValue;
    const totalLiabilitiesAbs = Math.abs(liabilities.reduce((s, a) => s + a.balance, 0));

    const availableCash = bankAccounts.reduce((s, a) => s + a.balance, 0);
    const availableCredit = liabilities
      .filter((l) => l.creditLimit)
      .reduce((s, l) => s + Math.max(0, (l.creditLimit || 0) - Math.abs(l.balance)), 0);

    return {
      bankAccounts,
      pensions,
      investments,
      liabilities,
      homeValue,
      carValue,
      homeGroup,
      carGroup,
      netAsset: totalAssets - totalLiabilitiesAbs,
      availableCash,
      availableCredit,
    };
  }, [accounts, physicalAssets]);

  // Calculate balance sheet summary (legacy consumers).
  const balanceSheetSummary = useMemo((): BalanceSheetSummary => {
    return {
      totalAssets:
        balanceSheet.bankAccounts.reduce((s, a) => s + a.balance, 0) +
        balanceSheet.pensions.reduce((s, a) => s + a.balance, 0) +
        balanceSheet.investments.reduce((s, a) => s + a.balance, 0) +
        balanceSheet.homeValue +
        balanceSheet.carValue,
      totalLiabilities: Math.abs(balanceSheet.liabilities.reduce((s, l) => s + l.balance, 0)),
      netWorth: balanceSheet.netAsset,
      availableCash: balanceSheet.availableCash,
      availableCredit: balanceSheet.availableCredit,
    };
  }, [balanceSheet]);

  // ---- Transaction operations
  // Apply (or reverse) a transaction's effect onto the linked account's stored balance.
  // `category` on a transaction holds the linked account name.
  // Stored balance convention: assets are positive, liabilities are negative.
  // Direction:
  //   - income to asset       -> balance += amount
  //   - expense from asset    -> balance -= amount
  //   - income on liability   -> balance -= amount (more debt)
  //   - expense on liability  -> balance += amount (paying down debt)
  const applyAccountDelta = async (
    accountName: string | null | undefined,
    type: 'income' | 'expense' | undefined,
    amount: number
  ) => {
    if (!accountName || !type || !amount) return;
    const account = accounts.find((a) => a.name === accountName);
    if (!account) return;
    const isLiability =
      (account.account_class || '').toLowerCase() === 'liability' ||
      (account.type || '').toLowerCase() === 'liability';
    const sign = type === 'income' ? 1 : -1;
    const delta = sign * amount * (isLiability ? -1 : 1);
    const newBalance = Number(account.balance || 0) + delta;
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .update({ balance: newBalance })
        .eq('id', account.id);
      if (error) throw error;
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? { ...a, balance: newBalance } : a)));
    } catch (error) {
      console.error('Error applying account delta:', error);
    }
  };

  const updateTransaction = async (transactionId: string, newAmount: number) => {
    try {
      const existing = transactions.find((t) => t.id === transactionId);
      const frequency = existing?.frequency || 'monthly';
      const newMonthly = amountToMonthly(newAmount, frequency);
      const projections = buildProjections(newMonthly);
      const { error } = await supabase
        .from('financial_transactions')
        .update({ amount: newAmount, monthly: newMonthly, daily: newMonthly / 30, projections })
        .eq('id', transactionId);
      if (error) throw error;

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, amount: newAmount, monthly: newMonthly, daily: newMonthly / 30, projections } : t
        )
      );

      // Adjust linked account by the *difference* in monthly cash impact
      if (existing) {
        const diff = newMonthly - Number(existing.monthly || 0);
        if (diff !== 0) {
          await applyAccountDelta(existing.category, existing.type as any, diff);
        }
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const updateTransactionFrequency = async (transactionId: string, newFrequency: string) => {
    try {
      const existing = transactions.find((t) => t.id === transactionId);
      const amount = Number(existing?.amount) || Number(existing?.monthly) || 0;
      const newMonthly = amountToMonthly(amount, newFrequency);
      const projections = buildProjections(newMonthly);
      const { error } = await supabase
        .from('financial_transactions')
        .update({ frequency: newFrequency, monthly: newMonthly, daily: newMonthly / 30, projections })
        .eq('id', transactionId);
      if (error) throw error;

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, frequency: newFrequency, monthly: newMonthly, daily: newMonthly / 30, projections } : t
        )
      );

      // Re-sync the linked account by the change in monthly cash impact.
      if (existing) {
        const diff = newMonthly - Number(existing.monthly || 0);
        if (diff !== 0) await applyAccountDelta(existing.category, existing.type as any, diff);
      }
    } catch (error) {
      console.error('Error updating transaction frequency:', error);
      toast.error('Failed to update frequency');
    }
  };

  const addTransaction: FinancialDataContextType['addTransaction'] = async (transactionData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        return;
      }

      const groupName = transactionData.group_name || transactionData.group || 'Personal';
      const monthly = transactionData.monthly;

      // Infer cash flow section from linked account when not explicitly provided
      const inferSection = (): CashFlowSection => {
        if (transactionData.cash_flow_section) return transactionData.cash_flow_section;
        const acct = accounts.find((a) => a.name === transactionData.category);
        if (acct) {
          const isLiab = (acct.account_class || '').toLowerCase() === 'liability' ||
                         (acct.type || '').toLowerCase() === 'liability';
          if (isLiab) return 'financing';
          const cat = (acct.category || '').toLowerCase();
          if (/(invest|pension|crypto|broker)/.test(cat)) return 'investing';
        }
        return 'operating';
      };

      const newRow = {
        user_id: user.id,
        date: transactionData.date || Date.now(),
        type: transactionData.type,
        category: transactionData.category,
        subcategory: transactionData.subcategory,
        group_name: groupName,
        space_id: transactionData.space_id ?? null,
        amount: transactionData.amount ?? monthly,
        percentage: 0,
        daily: monthly / 30,
        monthly,
        projections: Array(12).fill(monthly),
        cost_centre: transactionData.cost_centre || 'General',
        frequency: transactionData.frequency || 'monthly',
        cash_flow_section: inferSection(),
      };

      const { error } = await supabase.from('financial_transactions').insert(newRow);
      if (error) throw error;

      // Apply impact onto linked account balance, if one is selected
      await applyAccountDelta(transactionData.category, transactionData.type as any, Number(monthly) || 0);

      await refreshData();
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
      setTransactions((prev) => prev.map((t) => (t.id === transactionId ? { ...t, subcategory: newName } : t)));
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
      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? { ...t, group_name: newGroup, group: newGroup } : t))
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
      setTransactions((prev) => prev.map((t) => (t.id === transactionId ? { ...t, date: newDate } : t)));
    } catch (error) {
      console.error('Error updating transaction date:', error);
    }
  };

  const updateTransactionCategory = async (transactionId: string, newCategory: string) => {
    try {
      const existing = transactions.find((t) => t.id === transactionId);
      const { error } = await supabase
        .from('financial_transactions')
        .update({ category: newCategory })
        .eq('id', transactionId);
      if (error) throw error;
      setTransactions((prev) => prev.map((t) => (t.id === transactionId ? { ...t, category: newCategory } : t)));

      // When the linked account changes, reverse impact on the old account
      // and apply it to the new one (only if amount and type are present).
      if (existing && existing.category !== newCategory) {
        const amt = Number(existing.monthly || 0);
        if (amt) {
          await applyAccountDelta(existing.category, existing.type as any, -amt);
          await applyAccountDelta(newCategory, existing.type as any, amt);
        }
      }
    } catch (error) {
      console.error('Error updating transaction category:', error);
      toast.error('Failed to update category');
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      const existing = transactions.find((t) => t.id === transactionId);
      const { error } = await supabase.from('financial_transactions').delete().eq('id', transactionId);
      if (error) throw error;
      setTransactions((prev) => prev.filter((t) => t.id !== transactionId));

      // Reverse the transaction's impact from the linked account
      if (existing) {
        const amt = Number(existing.monthly || 0);
        if (amt) {
          await applyAccountDelta(existing.category, existing.type as any, -amt);
        }
      }
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
      setTransactions((prev) =>
        prev.map((t) =>
          t.category === oldCategory && t.type === type ? { ...t, category: newCategory } : t
        )
      );
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  // ---- Account operations
  const updateAccountBalance: FinancialDataContextType['updateAccountBalance'] = async (
    accountId,
    newBalance,
    type
  ) => {
    try {
      if (type === 'home' || type === 'car') {
        await supabase.from('physical_assets').update({ value: newBalance }).eq('id', accountId);
        setPhysicalAssets((prev) => prev.map((p) => (p.id === accountId ? { ...p, value: newBalance } : p)));
        return;
      }
      const value = type === 'liability' ? -Math.abs(newBalance) : Math.abs(newBalance);
      const { error } = await supabase
        .from('financial_accounts')
        .update({ balance: value })
        .eq('id', accountId);
      if (error) throw error;
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, balance: value } : a)));
    } catch (error) {
      console.error('Error updating account balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const updateAccountName: FinancialDataContextType['updateAccountName'] = async (accountId, newName) => {
    try {
      const { error } = await supabase.from('financial_accounts').update({ name: newName }).eq('id', accountId);
      if (error) throw error;
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, name: newName } : a)));
    } catch (error) {
      console.error('Error updating account name:', error);
    }
  };

  const updateAccountGroup: FinancialDataContextType['updateAccountGroup'] = async (accountId, newGroup) => {
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .update({ group_name: newGroup })
        .eq('id', accountId);
      if (error) throw error;
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, group_name: newGroup } : a)));
    } catch (error) {
      console.error('Error updating account group:', error);
    }
  };

  const updateAccountCategory: FinancialDataContextType['updateAccountCategory'] = async (accountId, newCategory) => {
    try {
      const { error } = await supabase
        .from('financial_accounts')
        .update({ category: newCategory })
        .eq('id', accountId);
      if (error) throw error;
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? { ...a, category: newCategory } : a)));
    } catch (error) {
      console.error('Error updating account category:', error);
    }
  };

  const upsertPhysicalAsset = async (assetType: 'home' | 'car', value: number, groupName?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const existing = physicalAssets.find((p) => p.asset_type?.toLowerCase() === assetType);
    if (existing) {
      const patch: any = { value };
      if (groupName) patch.group_name = groupName;
      await supabase.from('physical_assets').update(patch).eq('id', existing.id);
    } else {
      await supabase.from('physical_assets').insert({
        user_id: user.id,
        asset_type: assetType === 'home' ? 'Home' : 'Car',
        value,
        group_name: groupName || 'Personal',
      });
    }
    const physicalData = await fetchPhysicalAssets();
    setPhysicalAssets(physicalData);
  };

  const updateHomeValue = async (newValue: number) => {
    try { await upsertPhysicalAsset('home', newValue); }
    catch (e) { console.error(e); toast.error('Failed to update home value'); }
  };

  const updateCarValue = async (newValue: number) => {
    try { await upsertPhysicalAsset('car', newValue); }
    catch (e) { console.error(e); toast.error('Failed to update car value'); }
  };

  const updatePhysicalAssetGroup = async (assetType: 'home' | 'car', newGroup: string) => {
    try {
      const existing = physicalAssets.find((p) => p.asset_type?.toLowerCase() === assetType);
      if (!existing) {
        await upsertPhysicalAsset(assetType, 0, newGroup);
        return;
      }
      await supabase.from('physical_assets').update({ group_name: newGroup }).eq('id', existing.id);
      setPhysicalAssets((prev) => prev.map((p) => (p.id === existing.id ? { ...p, group_name: newGroup } : p)));
    } catch (e) {
      console.error(e);
      toast.error('Failed to update group');
    }
  };

  const addGroup = (groupName: string) => {
    if (!availableGroups.includes(groupName)) {
      setAvailableGroups((prev) => [...prev, groupName]);
    }
  };

  useEffect(() => {
    refreshData();

    // Debounce realtime refreshes so a burst of changes (e.g. bulk import,
    // cascading updates) collapses into a single refetch instead of 4×N.
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { refreshData(); }, 400);
    };

    const channel = supabase
      .channel('financial-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_transactions' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_accounts' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_assets' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_rate_terms' }, debouncedRefresh)
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synthesize loan-payment "transactions" from each loan's rate schedule so the
  // Cash Flow view automatically reflects future payment changes (e.g. when a
  // fixed-rate period ends and rolls onto a new fixed or variable rate).
  // Only loans that have a rate schedule defined are auto-projected here, to
  // avoid double-counting any existing manual recurring mortgage entry.
  const projectedTransactions = useMemo<FinancialTransaction[]>(() => {
    if (!accounts.length) return transactions;
    const termsByAccount: Record<string, RateTerm[]> = {};
    rateTerms.forEach((t: any) => {
      const id = t.account_id as string;
      termsByAccount[id] = termsByAccount[id] || [];
      termsByAccount[id].push(t);
    });

    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const synthetic: FinancialTransaction[] = [];
    const manualLoanIdsToHide = new Set<string>();

    accounts.forEach((a) => {
      if (a.type !== 'liability') return;
      const balance = Math.abs(Number(a.balance) || 0);
      const paymentDay = Math.min(31, Math.max(1, Number(a.payment_day) || 1));
      const groupName = a.group_name || 'Personal';
      const isCreditCard = /(credit|card)/i.test(a.category || '') || /(credit|card)/i.test(a.name || '');

      // ── Credit cards: split monthly payment into Interest (Operating) + Principal (Financing) ──
      if (isCreditCard) {
        const apr = Number(a.interest_rate) || 0;
        if (balance <= 0) return;

        // Manual payment rows linked to this card (by account name).
        // Used to derive scheduled monthly payment AND to inherit cost centre.
        const manualPayments = transactions.filter(
          (t) => t.category === a.name && (t.type === 'expense' || t.type === 'liability')
        );
        // Hide manual payment rows from the cash-flow view to avoid double-counting —
        // we re-emit the split (interest + principal) below.
        manualPayments.forEach((p) => manualLoanIdsToHide.add(p.id));

        const inheritedCostCentre =
          manualPayments.find((p) => p.cost_centre?.trim())?.cost_centre?.trim() ||
          a.cost_centre?.trim() ||
          a.name ||
          'Credit Card';

        const monthlyInterestProj: number[] = Array(12).fill(0);
        const monthlyPrincipalProj: number[] = Array(12).fill(0);
        const fallbackPayment = Number(a.monthly_payment) || 0;
        let projBal = balance;
        for (let i = 0; i < 12; i++) {
          const scheduledFromManual = manualPayments.reduce(
            (s, t) => s + Math.abs(t.projections[i] || 0),
            0
          );
          const scheduledPayment = scheduledFromManual > 0 ? scheduledFromManual : fallbackPayment;

          const interestThisMonth = apr > 0 ? (projBal * apr) / 100 / 12 : 0;
          // Payment first covers interest, the rest reduces principal.
          const principalThisMonth = Math.max(0, Math.min(projBal, scheduledPayment - interestThisMonth));
          monthlyInterestProj[i] = interestThisMonth;
          monthlyPrincipalProj[i] = principalThisMonth;
          projBal = Math.max(0, projBal + interestThisMonth - scheduledPayment);
        }

        const intMonthly = monthlyInterestProj.reduce((s, n) => s + n, 0) / 12;
        const prinMonthly = monthlyPrincipalProj.reduce((s, n) => s + n, 0) / 12;

        // Interest → Operating expense
        if (intMonthly > 0.01) {
          synthetic.push({
            id: `cc-interest-${a.id}`,
            user_id: a.user_id,
            date: paymentDay,
            type: 'expense',
            category: 'Credit Card Interest',
            subcategory: a.name,
            group_name: groupName,
            group: groupName,
            space_id: a.space_id ?? null,
            amount: intMonthly,
            percentage: 0,
            daily: intMonthly / 30,
            monthly: intMonthly,
            projections: monthlyInterestProj,
            cost_centre: inheritedCostCentre,
            frequency: 'monthly',
            cash_flow_section: 'operating',
            created_at: a.created_at,
            updated_at: a.updated_at,
          });
        }

        // Principal → Financing outflow (liability paydown)
        if (prinMonthly > 0.01) {
          synthetic.push({
            id: `cc-principal-${a.id}`,
            user_id: a.user_id,
            date: paymentDay,
            type: 'liability',
            category: a.name,
            subcategory: `${a.name} — Principal`,
            group_name: groupName,
            group: groupName,
            space_id: a.space_id ?? null,
            amount: prinMonthly,
            percentage: 0,
            daily: prinMonthly / 30,
            monthly: prinMonthly,
            projections: monthlyPrincipalProj,
            cost_centre: inheritedCostCentre,
            frequency: 'monthly',
            cash_flow_section: 'financing',
            created_at: a.created_at,
            updated_at: a.updated_at,
          });
        }
        return;
      }

      // ── Loans/mortgages: amortization-based projection split into interest + principal ──
      const schedule = termsByAccount[a.id];
      if (!schedule || schedule.length === 0) return;
      // If user already entered a manual recurring payment against this loan,
      // inherit its cost centre for the split rows and HIDE the manual row from
      // the cash-flow view (collected below in `manualLoanIdsToHide`) so the
      // mortgage is shown once — split into interest (Operating) + principal (Financing).
      const manualPayment = transactions.find(
        (t) => t.category === a.name && (t.type === 'expense' || t.type === 'liability')
      );
      if (manualPayment) manualLoanIdsToHide.add(manualPayment.id);
      const sharedCostCentre = manualPayment?.cost_centre?.trim() || a.cost_centre?.trim() || a.name || 'Debt Service';
      const start = a.loan_start_date ? new Date(a.loan_start_date) : startMonth;
      if (balance <= 0) return;

      const projection = projectAmortization(
        {
          startingBalance: balance,
          loanStartDate: start,
          totalTermMonths: a.term_months || null,
          fallbackRate: Number(a.interest_rate) || 0,
          fallbackPayment: Number(a.monthly_payment) || 0,
          schedule,
        },
        startMonth,
        12
      );
      if (projection.length === 0) return;

      const interestProj = Array(12).fill(0);
      const principalProj = Array(12).fill(0);
      projection.forEach((m) => {
        if (m.index >= 0 && m.index < 12) {
          interestProj[m.index] = m.interest;
          principalProj[m.index] = m.principal;
        }
      });
      const intMonthly = interestProj.reduce((s, n) => s + n, 0) / 12;
      const prinMonthly = principalProj.reduce((s, n) => s + n, 0) / 12;

      // Interest → Operating expense
      synthetic.push({
        id: `loan-interest-${a.id}`,
        user_id: a.user_id,
        date: paymentDay,
        type: 'expense',
        category: a.name,
        subcategory: `${a.name} — Interest`,
        group_name: groupName,
        group: groupName,
        space_id: a.space_id ?? null,
        amount: intMonthly,
        percentage: 0,
        daily: intMonthly / 30,
        monthly: intMonthly,
        projections: interestProj,
        cost_centre: sharedCostCentre,
        frequency: 'monthly',
        cash_flow_section: 'operating',
        created_at: a.created_at,
        updated_at: a.updated_at,
      });

      // Principal → Financing outflow (liability paydown)
      synthetic.push({
        id: `loan-principal-${a.id}`,
        user_id: a.user_id,
        date: paymentDay,
        type: 'liability',
        category: a.name,
        subcategory: `${a.name} — Principal`,
        group_name: groupName,
        group: groupName,
        space_id: a.space_id ?? null,
        amount: prinMonthly,
        percentage: 0,
        daily: prinMonthly / 30,
        monthly: prinMonthly,
        projections: principalProj,
        cost_centre: sharedCostCentre,
        frequency: 'monthly',
        cash_flow_section: 'financing',
        created_at: a.created_at,
        updated_at: a.updated_at,
      });
    });

    const visibleTransactions = manualLoanIdsToHide.size
      ? transactions.filter((t) => !manualLoanIdsToHide.has(t.id))
      : transactions;
    return [...visibleTransactions, ...synthetic];
  }, [transactions, accounts, rateTerms]);

  return (
    <FinancialDataContext.Provider
      value={{
        transactions: projectedTransactions,
        accounts,
        loading,
        refreshData,
        viewMode,
        setViewMode,
        group,
        setGroup,
        balanceSheetSummary,
        balanceSheet,
        monthLabels,
        updateTransaction,
        addTransaction,
        updateTransactionName,
        updateTransactionGroup,
        updateTransactionDate,
        updateTransactionCategory,
        deleteTransaction,
        updateAccountBalance,
        updateAccountName,
        updateAccountGroup,
        updateAccountCategory,
        updateHomeValue,
        updateCarValue,
        updatePhysicalAssetGroup,
        updateCategory,
        availableGroups,
        addGroup,
      }}
    >
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
