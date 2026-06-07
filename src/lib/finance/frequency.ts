// Shared frequency conversion helpers so the Inputs tab and Dashboard
// stay in sync about what "amount" means under each cadence.

export const FREQ_TO_MONTHLY: Record<string, number> = {
  daily: 30,
  weekly: 52 / 12,
  fortnightly: 26 / 12,
  'bi-weekly': 26 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  'half-yearly': 1 / 6,
  'semi-annually': 1 / 6,
  yearly: 1 / 12,
  annually: 1 / 12,
  'one-time': 0,
  once: 0,
};

/** Convert a per-occurrence input amount into a monthly-equivalent value. */
export const amountToMonthly = (amount: number, frequency: string | null | undefined): number => {
  const f = (frequency || 'monthly').toLowerCase();
  const factor = FREQ_TO_MONTHLY[f] ?? 1;
  return (Number(amount) || 0) * factor;
};

/** Build the standard 12-element projections array from a monthly amount. */
export const buildProjections = (monthly: number): number[] => Array(12).fill(monthly);

/** Step in days/months between occurrences for a given frequency. */
export const frequencyStep = (frequency: string | null | undefined): { months?: number; days?: number; oneTime?: boolean } => {
  const f = (frequency || 'monthly').toLowerCase();
  switch (f) {
    case 'one-time':
    case 'once':
      return { oneTime: true };
    case 'daily': return { days: 1 };
    case 'weekly': return { days: 7 };
    case 'fortnightly':
    case 'bi-weekly':
    case 'biweekly': return { days: 14 };
    case 'monthly': return { months: 1 };
    case 'quarterly': return { months: 3 };
    case 'half-yearly':
    case 'semi-annually': return { months: 6 };
    case 'yearly':
    case 'annually': return { months: 12 };
    default: return { months: 1 };
  }
};
