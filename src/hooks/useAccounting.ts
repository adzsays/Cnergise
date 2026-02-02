import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCurrentSpace } from '@/contexts/SpaceContext';

export interface AccountingPeriod {
  id: string;
  user_id: string;
  space_id: string | null;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  space_id: string | null;
  transaction_id: string | null;
  entry_date: string;
  description: string | null;
  reference_number: string | null;
  is_opening_balance: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  created_at: string;
}

export interface AccountWithBalance {
  id: string;
  name: string;
  account_code: string | null;
  account_class: 'asset' | 'liability' | 'equity' | 'income' | 'expense' | null;
  type: string;
  opening_balance: number;
  opening_balance_date: string | null;
  current_balance: number;
  debit_total: number;
  credit_total: number;
}

export interface TrialBalanceRow {
  account_id: string;
  account_name: string;
  account_code: string | null;
  account_class: string | null;
  opening_debit: number;
  opening_credit: number;
  period_debit: number;
  period_credit: number;
  closing_debit: number;
  closing_credit: number;
}

export const useAccounting = () => {
  const { currentSpaceId } = useCurrentSpace();
  const [accountingPeriods, setAccountingPeriods] = useState<AccountingPeriod[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalEntryLines, setJournalEntryLines] = useState<JournalEntryLine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccountingPeriods = async () => {
    const { data, error } = await supabase
      .from('accounting_periods')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching accounting periods:', error);
      return [];
    }
    return data || [];
  };

  const fetchJournalEntries = async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('entry_date', { ascending: false });

    if (error) {
      console.error('Error fetching journal entries:', error);
      return [];
    }
    return data || [];
  };

  const fetchJournalEntryLines = async () => {
    const { data, error } = await supabase
      .from('journal_entry_lines')
      .select('*');

    if (error) {
      console.error('Error fetching journal entry lines:', error);
      return [];
    }
    return data || [];
  };

  const refreshData = async () => {
    setLoading(true);
    const [periods, entries, lines] = await Promise.all([
      fetchAccountingPeriods(),
      fetchJournalEntries(),
      fetchJournalEntryLines(),
    ]);
    setAccountingPeriods(periods);
    setJournalEntries(entries);
    setJournalEntryLines(lines);
    setLoading(false);
  };

  // Create accounting period
  const createAccountingPeriod = async (period: Omit<AccountingPeriod, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('accounting_periods')
        .insert({
          ...period,
          user_id: user.id,
          space_id: currentSpaceId,
        });

      if (error) throw error;
      await refreshData();
      toast.success('Accounting period created');
    } catch (error) {
      console.error('Error creating accounting period:', error);
      toast.error('Failed to create accounting period');
    }
  };

  // Create journal entry with lines
  const createJournalEntry = async (
    entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    lines: Array<{ account_id: string; debit_amount: number; credit_amount: number }>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate double-entry: debits must equal credits
      const totalDebits = lines.reduce((sum, l) => sum + l.debit_amount, 0);
      const totalCredits = lines.reduce((sum, l) => sum + l.credit_amount, 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        toast.error('Debits must equal credits');
        return;
      }

      const { data: journalEntry, error: journalError } = await supabase
        .from('journal_entries')
        .insert({
          ...entry,
          user_id: user.id,
          space_id: currentSpaceId,
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Insert lines
      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines.map(line => ({
          ...line,
          journal_entry_id: journalEntry.id,
        })));

      if (linesError) throw linesError;

      await refreshData();
      toast.success('Journal entry created');
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast.error('Failed to create journal entry');
    }
  };

  // Calculate trial balance for a specific date range
  const calculateTrialBalance = (
    accounts: Array<{ 
      id: string; 
      name: string; 
      account_code: string | null; 
      account_class: string | null;
      opening_balance: number;
      opening_balance_date: string | null;
    }>,
    asOfDate: Date,
    periodStartDate?: Date
  ): TrialBalanceRow[] => {
    const result: TrialBalanceRow[] = [];

    accounts.forEach(account => {
      // Filter journal entries up to the as-of date
      const relevantEntries = journalEntries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate <= asOfDate;
      });

      const relevantEntryIds = new Set(relevantEntries.map(e => e.id));
      
      // Get lines for these entries for this account
      const accountLines = journalEntryLines.filter(
        line => line.account_id === account.id && relevantEntryIds.has(line.journal_entry_id)
      );

      // Calculate opening balance (entries before period start or opening balance entries)
      let openingDebit = 0;
      let openingCredit = 0;
      let periodDebit = 0;
      let periodCredit = 0;

      if (periodStartDate) {
        const openingEntries = journalEntries.filter(entry => {
          const entryDate = new Date(entry.entry_date);
          return entryDate < periodStartDate || entry.is_opening_balance;
        });
        const openingEntryIds = new Set(openingEntries.map(e => e.id));

        accountLines.forEach(line => {
          if (openingEntryIds.has(line.journal_entry_id)) {
            openingDebit += Number(line.debit_amount);
            openingCredit += Number(line.credit_amount);
          } else {
            const entry = journalEntries.find(e => e.id === line.journal_entry_id);
            if (entry && new Date(entry.entry_date) <= asOfDate) {
              periodDebit += Number(line.debit_amount);
              periodCredit += Number(line.credit_amount);
            }
          }
        });
      } else {
        accountLines.forEach(line => {
          periodDebit += Number(line.debit_amount);
          periodCredit += Number(line.credit_amount);
        });
      }

      // Add account's opening balance
      if (account.opening_balance !== 0) {
        const isDebitNormal = ['asset', 'expense'].includes(account.account_class || '');
        if (account.opening_balance > 0) {
          if (isDebitNormal) {
            openingDebit += account.opening_balance;
          } else {
            openingCredit += account.opening_balance;
          }
        } else {
          if (isDebitNormal) {
            openingCredit += Math.abs(account.opening_balance);
          } else {
            openingDebit += Math.abs(account.opening_balance);
          }
        }
      }

      // Calculate closing balances
      const closingDebit = openingDebit + periodDebit;
      const closingCredit = openingCredit + periodCredit;

      // Only include accounts with activity or balances
      if (openingDebit || openingCredit || periodDebit || periodCredit || closingDebit || closingCredit) {
        result.push({
          account_id: account.id,
          account_name: account.name,
          account_code: account.account_code,
          account_class: account.account_class,
          opening_debit: openingDebit,
          opening_credit: openingCredit,
          period_debit: periodDebit,
          period_credit: periodCredit,
          closing_debit: closingDebit > closingCredit ? closingDebit - closingCredit : 0,
          closing_credit: closingCredit > closingDebit ? closingCredit - closingDebit : 0,
        });
      }
    });

    return result;
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    accountingPeriods,
    journalEntries,
    journalEntryLines,
    loading,
    refreshData,
    createAccountingPeriod,
    createJournalEntry,
    calculateTrialBalance,
  };
};
