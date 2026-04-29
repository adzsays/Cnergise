// Mortgage / loan amortization with multi-term rate schedules.
// Each rate term defines a period with its own (fixed or variable) interest rate
// and an optional explicit monthly payment. When a payment isn't supplied for a
// term, we recompute it from the *remaining* balance and *remaining* months on
// the loan so the loan still pays off by its original maturity.

export interface RateTerm {
  id?: string;
  account_id?: string;
  sequence: number;
  start_date: string;       // ISO yyyy-mm-dd
  term_months: number | null; // null = open-ended (final period)
  rate_type: 'fixed' | 'variable';
  interest_rate: number;    // annual % APR
  payment_override?: number | null;
}

export interface AmortInputs {
  startingBalance: number;        // current outstanding (positive)
  loanStartDate: Date;            // original loan start
  totalTermMonths?: number | null; // original total term (used to recompute payment)
  fallbackRate: number;           // % APR to use when no schedule
  fallbackPayment: number;        // payment when no schedule
  schedule: RateTerm[];           // sorted by sequence
}

export interface MonthAmort {
  index: number;
  date: Date;            // first of month
  rate: number;          // APR used this month
  payment: number;       // total payment
  interest: number;
  principal: number;
  balanceAfter: number;
  termIndex: number;     // which schedule term applied
}

const annuityPayment = (principal: number, monthlyRate: number, months: number) => {
  if (months <= 0) return principal;
  if (monthlyRate <= 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
};

/** Find the schedule term active at `atDate`.
 *  Picks the term with the LATEST start_date that is still <= atDate,
 *  regardless of `sequence` ordering (sequence may not match chronology). */
const termAt = (schedule: RateTerm[], loanStart: Date, atDate: Date) => {
  if (!schedule.length) return -1;
  let active = -1;
  let activeStart = -Infinity;
  for (let i = 0; i < schedule.length; i++) {
    const t = schedule[i];
    const ts = new Date(t.start_date).getTime();
    if (ts <= atDate.getTime() && ts >= activeStart) {
      active = i;
      activeStart = ts;
    }
  }
  return active;
};

/** Project N months forward starting from `fromDate` (exclusive of that month, inclusive going forward). */
export function projectAmortization(inp: AmortInputs, fromDate: Date, months: number): MonthAmort[] {
  const out: MonthAmort[] = [];
  let balance = Math.max(0, inp.startingBalance);
  if (balance <= 0) return out;

  // Pre-compute payment per-term, recomputing at term boundaries so the loan amortises
  // over the *remaining* original life.
  const totalTerm = inp.totalTermMonths || 0;
  const monthsElapsed = Math.max(
    0,
    (fromDate.getFullYear() - inp.loanStartDate.getFullYear()) * 12 +
      (fromDate.getMonth() - inp.loanStartDate.getMonth())
  );
  let monthsRemaining = totalTerm > 0 ? Math.max(1, totalTerm - monthsElapsed) : 0;

  let lastTermIdx = -2;
  let currentPayment = inp.fallbackPayment;
  let currentRate = inp.fallbackRate;

  for (let i = 0; i < months; i++) {
    if (balance <= 0.005) break;
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth() + i, 1);
    const idx = termAt(inp.schedule, inp.loanStartDate, d);
    if (idx !== lastTermIdx) {
      if (idx === -1) {
        currentRate = inp.fallbackRate;
        currentPayment = inp.fallbackPayment > 0
          ? inp.fallbackPayment
          : annuityPayment(balance, currentRate / 100 / 12, monthsRemaining || 12);
      } else {
        const t = inp.schedule[idx];
        currentRate = t.interest_rate;
        const monthlyRate = currentRate / 100 / 12;
        if (t.payment_override && t.payment_override > 0) {
          currentPayment = t.payment_override;
        } else {
          // Recompute payment to fully amortize remaining balance across remaining life
          currentPayment = monthsRemaining > 0
            ? annuityPayment(balance, monthlyRate, monthsRemaining)
            : balance * monthlyRate; // interest-only fallback
        }
      }
      lastTermIdx = idx;
    }

    const monthlyRate = currentRate / 100 / 12;
    const interest = balance * monthlyRate;
    let payment = currentPayment;
    let principal = payment - interest;
    if (principal < 0) {
      // payment doesn't even cover interest -> balance grows (variable rate spike scenario)
      principal = 0;
      // do not let payment become negative
      payment = Math.max(payment, interest); // at minimum, log the interest accrual
    }
    if (principal > balance) {
      principal = balance;
      payment = interest + principal;
    }
    balance = Math.max(0, balance - principal);
    if (monthsRemaining > 0) monthsRemaining -= 1;

    out.push({
      index: i,
      date: d,
      rate: currentRate,
      payment,
      interest,
      principal,
      balanceAfter: balance,
      termIndex: idx,
    });
  }
  return out;
}

/** Apply monthly payments from `lastApplied` up to `today`, returning new balance + totals. */
export function applyHistoricalPayments(inp: AmortInputs, lastApplied: Date, today: Date) {
  const months = Math.max(
    0,
    (today.getFullYear() - lastApplied.getFullYear()) * 12 + (today.getMonth() - lastApplied.getMonth())
  );
  if (months <= 0) {
    return { balance: inp.startingBalance, monthsApplied: 0, totalInterest: 0, totalPrincipal: 0 };
  }
  const fromDate = new Date(lastApplied.getFullYear(), lastApplied.getMonth() + 1, 1);
  const rows = projectAmortization(inp, fromDate, months);
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0);
  const balance = rows.length ? rows[rows.length - 1].balanceAfter : inp.startingBalance;
  return { balance, monthsApplied: rows.length, totalInterest, totalPrincipal };
}
