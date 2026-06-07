import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronRight, Calculator, Download } from 'lucide-react';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { applyHistoricalPayments, projectAmortization, RateTerm } from '@/utils/loanAmortization';
import { InlineTransactionsTable } from './InlineTransactionsTable';
import { ImportDialog } from './ImportDialog';
import { Upload } from 'lucide-react';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import { CurrencyInput } from './CurrencyInput';
import { exportBalances, exportCashFlowInputs } from '@/lib/finance/exportFinance';

const ASSET_CATEGORIES = ['Bank', 'Savings', 'Investment', 'Pension', 'Crypto', 'Cash', 'Other'];
const LIABILITY_CATEGORIES = ['Credit Card', 'Loan', 'Mortgage', 'Overdraft', 'Other'];

// Returns whole months elapsed from `from` to `to` (Date objects)
const monthsBetween = (from: Date, to: Date) => {
  if (to <= from) return 0;
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
};

const isLoanLike = (cat?: string | null) => {
  const c = (cat || '').toLowerCase();
  return c.includes('loan') || c.includes('mortgage');
};

export function BalancesView() {
  const { accounts, transactions, balanceSheet, balanceSheetSummary, monthLabels, refreshData } = useFinancialData();
  const { currency: userCurrency, formatWhole: fmtGBP } = useUserCurrency();
  const currencySymbol = (() => {
    try {
      return (0).toLocaleString(undefined, { style: 'currency', currency: userCurrency, maximumFractionDigits: 0 }).replace(/[\d\s.,]/g, '') || '£';
    } catch { return '£'; }
  })();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Record<string, RateTerm[]>>({});
  const [importOpen, setImportOpen] = useState(false);

  const loadSchedules = async () => {
    const { data, error } = await supabase
      .from('loan_rate_terms' as any)
      .select('*')
      .order('sequence', { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    const grouped: Record<string, RateTerm[]> = {};
    (data || []).forEach((r: any) => {
      grouped[r.account_id] = grouped[r.account_id] || [];
      grouped[r.account_id].push(r);
    });
    setSchedules(grouped);
  };

  useEffect(() => {
    loadSchedules();
    const ch = supabase
      .channel('loan-rate-terms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_rate_terms' }, () => loadSchedules())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const update = async (id: string, patch: Record<string, any>) => {
    setSavingId(id);
    const { error } = await supabase.from('financial_accounts').update(patch as any).eq('id', id);
    setSavingId(null);
    if (error) {
      toast.error('Save failed');
      console.error(error);
    } else {
      refreshData();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('financial_accounts').delete().eq('id', id);
    if (error) toast.error('Delete failed');
    else refreshData();
  };

  const addRow = async (type: 'asset' | 'liability', category: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error('Sign in required');

    // Map our UI "asset / liability" intent to the DB-allowed `type` values
    // (bank | pension | investment | liability) and set `account_class` for accounting.
    const dbType =
      type === 'liability'
        ? 'liability'
        : category === 'Pension'
          ? 'pension'
          : category === 'Investment' || category === 'Crypto'
            ? 'investment'
            : 'bank';

    const { error } = await supabase.from('financial_accounts').insert({
      user_id: user.id,
      name: 'New ' + category,
      type: dbType,
      account_class: type, // 'asset' | 'liability'
      category,
      balance: 0,
      currency: userCurrency,
      group_name: 'Personal',
      credit_limit: category === 'Credit Card' ? 0 : null,
    });
    if (error) {
      console.error('Add account failed:', error);
      toast.error(error.message || 'Add failed');
    } else refreshData();
  };

  // Auto-amortize using the multi-term rate schedule (falls back to single rate if none defined).
  // fromOrigin=true (default when origin data exists) rebuilds the current balance from the
  // original principal at loan start, applying every historical monthly payment using the
  // rate term active at each month — so the displayed balance is always
  // "original principal less all payments made up to today".
  const applyLoanPayments = async (a: any, fromOrigin = true) => {
    const start = a.loan_start_date ? new Date(a.loan_start_date) : null;
    if (!start) return toast.error('Set a loan start date first');

    const useOrigin = fromOrigin && a.original_principal && Number(a.original_principal) > 0;
    const startingBalance = useOrigin
      ? Number(a.original_principal)
      : Math.abs(Number(a.balance) || 0);
    const lastApplied = useOrigin
      ? start
      : a.last_payment_applied_date
        ? new Date(a.last_payment_applied_date)
        : start;
    const today = new Date();

    const schedule = (schedules[a.id] || []).slice().sort((x, y) => x.sequence - y.sequence);
    const fallbackPayment = Number(a.monthly_payment) || 0;
    const fallbackRate = Number(a.interest_rate) || 0;
    if (schedule.length === 0 && fallbackPayment <= 0 && fallbackRate <= 0) {
      return toast.error('Add a rate term or set a monthly payment / rate');
    }

    const result = applyHistoricalPayments(
      {
        startingBalance,
        loanStartDate: start,
        totalTermMonths: a.term_months || null,
        fallbackRate,
        fallbackPayment,
        schedule,
      },
      lastApplied,
      today
    );

    if (result.monthsApplied <= 0) return toast.info('No new monthly payments to apply');

    const newLastApplied = new Date(lastApplied);
    newLastApplied.setMonth(newLastApplied.getMonth() + result.monthsApplied);

    await update(a.id, {
      balance: -Math.abs(result.balance),
      last_payment_applied_date: newLastApplied.toISOString().slice(0, 10),
    });
    toast.success(
      `Applied ${result.monthsApplied} payment${result.monthsApplied > 1 ? 's' : ''} · Principal ${fmtGBP(
        result.totalPrincipal
      )} · Interest ${fmtGBP(result.totalInterest)}`
    );
  };


  const { assets, liabilities, totals } = useMemo(() => {
    // An account is a "liability" only if explicitly classified or typed as such.
    // Everything else (bank, pension, investment, etc.) is treated as an asset.
    const isLiability = (x: any) =>
      (x as any).account_class === 'liability' || x.type === 'liability';
    const createdMs = (x: any) => {
      const v = x.created_at ? new Date(x.created_at).getTime() : 0;
      return isNaN(v) ? 0 : v;
    };
    // Newly added items appear on top
    const a = accounts.filter((x) => !isLiability(x)).sort((x, y) => createdMs(y) - createdMs(x));
    const l = accounts.filter((x) => isLiability(x)).sort((x, y) => createdMs(y) - createdMs(x));
    const tA = a.reduce((s, x) => s + Number(x.balance), 0);
    const tL = l.reduce((s, x) => s + Math.abs(Number(x.balance)), 0);
    return { assets: a, liabilities: l, totals: { tA, tL, net: tA - tL } };
  }, [accounts]);

  const Row = ({
    a,
    showLimit,
    categoryOptions,
    isLiability,
  }: {
    a: any;
    showLimit?: boolean;
    categoryOptions: string[];
    isLiability?: boolean;
  }) => {
    const used = Math.abs(Number(a.balance));
    const limit = Number(a.credit_limit || 0);
    const utilisation = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const loan = isLiability && isLoanLike(a.category);
    const expanded = expandedId === a.id;

    return (
      <>
        <tr className={cn('border-b border-border/40 hover:bg-muted/30', savingId === a.id && 'opacity-60')}>
          <td className="py-1 px-1 w-6">
            {loan && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setExpandedId(expanded ? null : a.id)}
              >
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            )}
          </td>
          <td className="py-1 px-2">
            <Input
              defaultValue={a.name}
              onBlur={(e) => e.target.value !== a.name && update(a.id, { name: e.target.value })}
              className="h-7 border-0 bg-transparent px-1 focus-visible:ring-1"
            />
          </td>
          <td className="py-1 px-2">
            <Select defaultValue={a.category || categoryOptions[0]} onValueChange={(v) => update(a.id, { category: v })}>
              <SelectTrigger className="h-7 border-0 bg-transparent px-1 focus:ring-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </td>
          <td className="py-1 px-2">
            <div className="flex items-center gap-2">
              <CurrencyInput
                value={a.balance}
                onCommit={(v) => {
                  const nv = v ?? 0;
                  if (nv !== Number(a.balance)) update(a.id, { balance: nv });
                }}
                className="h-7 border-0 bg-transparent px-1 focus-visible:ring-1 flex-1"
              />
              {loan && a.original_principal && a.loan_start_date && (() => {
                const principal = Number(a.original_principal) || 0;
                const start = new Date(a.loan_start_date);
                const today = new Date();
                const sched = (schedules[a.id] || []).slice().sort((x, y) => x.sequence - y.sequence);
                const fbRate = Number(a.interest_rate) || 0;
                const fbPay = Number(a.monthly_payment) || 0;
                if (principal <= 0 || (sched.length === 0 && fbPay <= 0 && fbRate <= 0)) return null;
                const res = applyHistoricalPayments(
                  {
                    startingBalance: principal,
                    loanStartDate: start,
                    totalTermMonths: a.term_months || null,
                    fallbackRate: fbRate,
                    fallbackPayment: fbPay,
                    schedule: sched,
                  },
                  start,
                  today
                );
                const calc = res.balance;
                const actual = Math.abs(Number(a.balance) || 0);
                const diff = actual - calc;
                const tone = Math.abs(diff) < 1 ? 'text-muted-foreground' : Math.abs(diff) < principal * 0.02 ? 'text-amber-600' : 'text-destructive';
                return (
                  <span
                    className={cn('text-[10px] tabular-nums whitespace-nowrap', tone)}
                    title={`Calculated from original principal ${fmtGBP(principal)} on ${a.loan_start_date}, applying ${res.monthsApplied} scheduled payment(s). Diff vs entered: ${diff >= 0 ? '+' : ''}${fmtGBP(diff)}`}
                  >
                    calc: {fmtGBP(calc)}
                  </span>
                );
              })()}
            </div>
          </td>
          {showLimit && (
            <>
              <td className="py-1 px-2">
                <CurrencyInput
                  value={a.credit_limit ?? null}
                  allowNull
                  onCommit={(v) => {
                    if (v !== a.credit_limit) update(a.id, { credit_limit: v });
                  }}
                  className="h-7 border-0 bg-transparent px-1 focus-visible:ring-1"
                />
              </td>
              <td className="py-1 px-2">
                {(a.category || '').toLowerCase() === 'credit card' ? (
                  <CurrencyInput
                    value={a.monthly_payment ?? null}
                    allowNull
                    onCommit={(v) => {
                      if (v !== a.monthly_payment) update(a.id, { monthly_payment: v });
                    }}
                    className="h-7 border-0 bg-transparent px-1 focus-visible:ring-1"
                  />
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </td>
              <td className="py-1 px-2 min-w-[140px]">
                {limit > 0 ? (
                  <div className="flex items-center gap-2">
                    <Progress
                      value={utilisation}
                      className={cn(
                        'h-1.5 flex-1',
                        utilisation > 80 && '[&>div]:bg-destructive',
                        utilisation > 50 && utilisation <= 80 && '[&>div]:bg-orange-500'
                      )}
                    />
                    <span className="text-[10px] tabular-nums text-muted-foreground w-9 text-right">
                      {utilisation.toFixed(0)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground">—</span>
                )}
              </td>
            </>
          )}
          <td className="py-1 px-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => remove(a.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </td>
        </tr>
        {loan && expanded && (
          <LoanDetailRow
            a={a}
            update={update}
            apply={() => applyLoanPayments(a)}
            applyFromOrigin={() => applyLoanPayments(a, true)}
            schedule={schedules[a.id] || []}
            reloadSchedules={loadSchedules}
          />
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Assets</p>
              <p className="text-lg font-semibold text-success tabular-nums">{fmtGBP(totals.tA)}</p>
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Liabilities</p>
              <p className="text-lg font-semibold text-destructive tabular-nums">{fmtGBP(totals.tL)}</p>
            </div>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Worth</p>
              <p className={cn('text-lg font-semibold tabular-nums', totals.net >= 0 ? 'text-primary' : 'text-destructive')}>
                {fmtGBP(totals.net)}
              </p>
            </div>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
        </Card>
      </div>

      {/* Assets */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide">Assets</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  exportBalances(accounts, balanceSheet, balanceSheetSummary);
                  toast.success('Balances exported');
                } catch (e: any) {
                  console.error(e);
                  toast.error('Export failed');
                }
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Export Balances
            </Button>
            <Button size="sm" variant="outline" onClick={() => addRow('asset', 'Bank')}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Asset
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                <th className="w-6"></th>
                <th className="text-left py-2 px-2 font-medium">Name</th>
                <th className="text-left py-2 px-2 font-medium">Category</th>
                <th className="text-right py-2 px-2 font-medium">Balance</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted-foreground">
                    No assets yet.
                  </td>
                </tr>
              ) : (
                assets.map((a) => <Row key={a.id} a={a} categoryOptions={ASSET_CATEGORIES} />)
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Liabilities (incl. credit cards w/ utilisation, loans w/ amortization) */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">Liabilities</h3>
            <p className="text-[10px] text-muted-foreground">
              Credit cards show utilisation · Loans/mortgages expand for interest, term, and auto-amortization
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => addRow('liability', 'Credit Card')}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Credit Card
            </Button>
            <Button size="sm" variant="outline" onClick={() => addRow('liability', 'Loan')}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Loan
            </Button>
            <Button size="sm" variant="outline" onClick={() => addRow('liability', 'Mortgage')}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Mortgage
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                <th className="w-6"></th>
                <th className="text-left py-2 px-2 font-medium">Name</th>
                <th className="text-left py-2 px-2 font-medium">Category</th>
                <th className="text-right py-2 px-2 font-medium">Balance</th>
                <th className="text-right py-2 px-2 font-medium">Limit</th>
                <th className="text-right py-2 px-2 font-medium">Monthly Payment</th>
                <th className="text-left py-2 px-2 font-medium">Utilisation</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {liabilities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted-foreground">
                    No liabilities yet.
                  </td>
                </tr>
              ) : (
                liabilities.map((a) => (
                  <Row key={a.id} a={a} showLimit isLiability categoryOptions={LIABILITY_CATEGORIES} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cash Flow Inputs (moved from Cash Flow tab) */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide">Cash Flow Inputs</h3>
            <p className="text-[10px] text-muted-foreground">
              Add and edit income & expense entries — these feed the Cash Flow projections
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5 mr-1" /> Import CSV/Excel
          </Button>
        </div>
        <InlineTransactionsTable />
      </Card>

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

// Inline expandable loan editor with multi-term rate schedule + amortization preview
function LoanDetailRow({
  a,
  update,
  apply,
  applyFromOrigin,
  schedule,
  reloadSchedules,
}: {
  a: any;
  update: (id: string, patch: Record<string, any>) => Promise<void>;
  apply: () => void;
  applyFromOrigin: () => void;
  schedule: RateTerm[];
  reloadSchedules: () => Promise<void>;
}) {
  const { formatWhole: fmtGBP } = useUserCurrency();
  const balance = Math.abs(Number(a.balance) || 0);
  const start = a.loan_start_date ? new Date(a.loan_start_date) : new Date();
  const fallbackRate = Number(a.interest_rate) || 0;
  const fallbackPayment = Number(a.monthly_payment) || 0;
  const term = Number(a.term_months) || 0;
  const sortedSchedule = useMemo(
    () => schedule.slice().sort((x, y) => x.sequence - y.sequence),
    [schedule]
  );

  // 12-month projection using the schedule
  const projection = useMemo(() => {
    const today = new Date();
    return projectAmortization(
      {
        startingBalance: balance,
        loanStartDate: start,
        totalTermMonths: term || null,
        fallbackRate,
        fallbackPayment,
        schedule: sortedSchedule,
      },
      new Date(today.getFullYear(), today.getMonth(), 1),
      12
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, fallbackRate, fallbackPayment, term, sortedSchedule, a.loan_start_date]);

  const next = projection[0];
  const monthlyInterest = next?.interest ?? 0;
  const monthlyPrincipal = next?.principal ?? 0;
  const monthlyPayment = next?.payment ?? fallbackPayment;
  const principal = Number(a.original_principal) || balance;
  const suggested = (() => {
    const r = fallbackRate / 100 / 12;
    if (r > 0 && term > 0) return (principal * r) / (1 - Math.pow(1 + r, -term));
    return term > 0 ? principal / term : 0;
  })();

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );

  const addTerm = async () => {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      toast.error('Sign in required to add a term');
      return;
    }
    const lastSeq = sortedSchedule.length ? sortedSchedule[sortedSchedule.length - 1].sequence : -1;
    const lastEnd = (() => {
      if (!sortedSchedule.length) return a.loan_start_date || new Date().toISOString().slice(0, 10);
      const last = sortedSchedule[sortedSchedule.length - 1];
      const ls = new Date(last.start_date);
      ls.setMonth(ls.getMonth() + (last.term_months || 0));
      return ls.toISOString().slice(0, 10);
    })();
    const { error } = await supabase.from('loan_rate_terms' as any).insert({
      user_id: user.id,
      account_id: a.id,
      sequence: lastSeq + 1,
      start_date: lastEnd,
      term_months: 24,
      rate_type: 'fixed',
      interest_rate: fallbackRate || 5,
    });
    if (error) {
      console.error('addTerm failed', error);
      toast.error(error.message || 'Could not add term');
    } else {
      toast.success('Term added');
      await reloadSchedules();
    }
  };

  const updateTerm = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from('loan_rate_terms' as any).update(patch).eq('id', id);
    if (error) {
      console.error('updateTerm failed', error);
      toast.error(error.message || 'Save failed');
    } else {
      await reloadSchedules();
    }
  };

  const removeTerm = async (id: string) => {
    const { error } = await supabase.from('loan_rate_terms' as any).delete().eq('id', id);
    if (error) {
      console.error('removeTerm failed', error);
      toast.error(error.message || 'Delete failed');
    } else {
      await reloadSchedules();
    }
  };

  return (
    <tr className="bg-muted/20 border-b border-border/40">
      <td colSpan={7} className="px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Field label="Original Principal">
            <Input
              type="number"
              defaultValue={a.original_principal ?? ''}
              placeholder="0"
              onBlur={(e) => {
                const v = e.target.value === '' ? null : parseFloat(e.target.value) || 0;
                if (v !== a.original_principal) update(a.id, { original_principal: v });
              }}
              className="h-7 text-xs tabular-nums"
            />
          </Field>
          <Field label="Default Rate (% APR)">
            <Input
              type="number"
              step="0.01"
              defaultValue={a.interest_rate ?? ''}
              placeholder="0.0"
              onBlur={(e) => {
                const v = e.target.value === '' ? null : parseFloat(e.target.value) || 0;
                if (v !== a.interest_rate) update(a.id, { interest_rate: v });
              }}
              className="h-7 text-xs tabular-nums"
            />
          </Field>
          <Field label="Total Term (months)">
            <Input
              type="number"
              defaultValue={a.term_months ?? ''}
              placeholder="0"
              onBlur={(e) => {
                const v = e.target.value === '' ? null : parseInt(e.target.value, 10) || 0;
                if (v !== a.term_months) update(a.id, { term_months: v });
              }}
              className="h-7 text-xs tabular-nums"
            />
          </Field>
          <Field label="Default Payment">
            <Input
              type="number"
              step="0.01"
              defaultValue={a.monthly_payment ?? ''}
              placeholder={suggested ? suggested.toFixed(2) : '0.00'}
              onBlur={(e) => {
                const v = e.target.value === '' ? null : parseFloat(e.target.value) || 0;
                if (v !== a.monthly_payment) update(a.id, { monthly_payment: v });
              }}
              className="h-7 text-xs tabular-nums"
            />
          </Field>
          <Field label="Loan Start Date">
            <Input
              type="date"
              defaultValue={a.loan_start_date ?? ''}
              onBlur={(e) => {
                const v = e.target.value || null;
                if (v !== a.loan_start_date) update(a.id, { loan_start_date: v });
              }}
              className="h-7 text-xs"
            />
          </Field>
          <Field label="Last Payment Applied">
            <Input
              type="date"
              defaultValue={a.last_payment_applied_date ?? ''}
              onBlur={(e) => {
                const v = e.target.value || null;
                if (v !== a.last_payment_applied_date) update(a.id, { last_payment_applied_date: v });
              }}
              className="h-7 text-xs"
            />
          </Field>
          <Field label="Payment Day (1–31)">
            <Input
              type="number"
              min={1}
              max={31}
              defaultValue={a.payment_day ?? ''}
              placeholder="e.g. 1"
              onBlur={(e) => {
                const raw = e.target.value === '' ? null : parseInt(e.target.value, 10);
                const v = raw == null ? null : Math.min(31, Math.max(1, raw));
                if (v !== a.payment_day) update(a.id, { payment_day: v });
              }}
              className="h-7 text-xs tabular-nums"
            />
          </Field>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          The Payment Day is also the recurring date used in Cash Flow projections for this loan.
          Use <strong>Apply to Date</strong> to recompute the current balance from the original
          principal less every monthly payment based on the rate term active each month.
        </p>

        {/* Rate Schedule */}
        <div className="mt-4 border-t border-border/40 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide">Rate Schedule</p>
              <p className="text-[10px] text-muted-foreground">
                Add each fixed period in sequence. The final period can be variable (open-ended). Payment recalculates at each
                term boundary so the loan amortises across the remaining life.
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-7" onClick={addTerm}>
              <Plus className="h-3 w-3 mr-1" /> Add Term
            </Button>
          </div>
          {sortedSchedule.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">
              No terms defined — using the default rate &amp; payment above for all months.
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground uppercase text-[10px] tracking-wider border-b">
                  <th className="text-left py-1 px-1 font-medium">#</th>
                  <th className="text-left py-1 px-1 font-medium">Start</th>
                  <th className="text-left py-1 px-1 font-medium">Type</th>
                  <th className="text-right py-1 px-1 font-medium">Rate %</th>
                  <th className="text-right py-1 px-1 font-medium">Months</th>
                  <th className="text-right py-1 px-1 font-medium">Payment Override</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {sortedSchedule.map((t, i) => (
                  <tr key={t.id} className="border-b border-border/30">
                    <td className="py-1 px-1 text-muted-foreground">{i + 1}</td>
                    <td className="py-1 px-1">
                      <Input
                        type="date"
                        defaultValue={t.start_date}
                        onBlur={(e) => e.target.value !== t.start_date && updateTerm(t.id!, { start_date: e.target.value })}
                        className="h-6 text-[11px] px-1"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Select
                        defaultValue={t.rate_type}
                        onValueChange={(v) => updateTerm(t.id!, { rate_type: v })}
                      >
                        <SelectTrigger className="h-6 text-[11px] px-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="variable">Variable</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-1 px-1">
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={t.interest_rate}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          if (v !== t.interest_rate) updateTerm(t.id!, { interest_rate: v });
                        }}
                        className="h-6 text-[11px] px-1 text-right tabular-nums"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Input
                        type="number"
                        defaultValue={t.term_months ?? ''}
                        placeholder="—"
                        onBlur={(e) => {
                          const v = e.target.value === '' ? null : parseInt(e.target.value, 10) || 0;
                          if (v !== t.term_months) updateTerm(t.id!, { term_months: v });
                        }}
                        className="h-6 text-[11px] px-1 text-right tabular-nums"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={t.payment_override ?? ''}
                        placeholder="auto"
                        onBlur={(e) => {
                          const v = e.target.value === '' ? null : parseFloat(e.target.value) || 0;
                          if (v !== t.payment_override) updateTerm(t.id!, { payment_override: v });
                        }}
                        className="h-6 text-[11px] px-1 text-right tabular-nums"
                      />
                    </td>
                    <td className="py-1 px-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeTerm(t.id!)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Next Payment</p>
            <p className="text-sm font-semibold tabular-nums">{fmtGBP(monthlyPayment)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Next Interest</p>
            <p className="text-sm font-semibold text-destructive tabular-nums">{fmtGBP(monthlyInterest)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Next Principal</p>
            <p className="text-sm font-semibold text-success tabular-nums">{fmtGBP(monthlyPrincipal)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Outstanding</p>
            <p className="text-sm font-semibold tabular-nums">{fmtGBP(balance)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <Button size="sm" onClick={apply} className="h-7 text-[11px]">
              <Calculator className="h-3.5 w-3.5 mr-1" /> Apply to Date
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={applyFromOrigin}
              className="h-7 text-[11px]"
              disabled={!a.original_principal || !a.loan_start_date}
              title="Rebuilds the current balance from the original principal at loan start"
            >
              From Loan Start
            </Button>
          </div>
        </div>

        {/* 12-month payment schedule preview (drives cash flow) */}
        {projection.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Next 12 Months · Payment / Interest / Principal
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-muted-foreground border-b">
                    <th className="text-left py-1 px-1 font-medium">Month</th>
                    <th className="text-right py-1 px-1 font-medium">Rate</th>
                    <th className="text-right py-1 px-1 font-medium">Payment</th>
                    <th className="text-right py-1 px-1 font-medium">Interest</th>
                    <th className="text-right py-1 px-1 font-medium">Principal</th>
                    <th className="text-right py-1 px-1 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {projection.map((m) => (
                    <tr key={m.index} className="border-b border-border/20">
                      <td className="py-0.5 px-1">
                        {m.date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
                      </td>
                      <td className="py-0.5 px-1 text-right tabular-nums">{m.rate.toFixed(2)}%</td>
                      <td className="py-0.5 px-1 text-right tabular-nums">{fmtGBP(m.payment)}</td>
                      <td className="py-0.5 px-1 text-right tabular-nums text-destructive">{fmtGBP(m.interest)}</td>
                      <td className="py-0.5 px-1 text-right tabular-nums text-success">{fmtGBP(m.principal)}</td>
                      <td className="py-0.5 px-1 text-right tabular-nums">{fmtGBP(m.balanceAfter)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}

