import * as XLSX from 'xlsx';
import type { SourceBalanceSheet } from '@/contexts/FinancialDataContext';

const GBP_FMT = '"£"#,##0.00;("£"#,##0.00);"-"';
const PCT_FMT = '0.00%';

const today = () => new Date().toISOString().slice(0, 10);

const autoFit = (rows: any[][]) => {
  if (!rows.length) return [];
  const widths: number[] = [];
  rows.forEach((r) =>
    r.forEach((cell, i) => {
      const len = cell == null ? 0 : String(cell).length;
      widths[i] = Math.max(widths[i] || 8, Math.min(40, len + 2));
    })
  );
  return widths.map((wch) => ({ wch }));
};

const numberCell = (n: number | null | undefined, fmt = GBP_FMT) =>
  n == null || isNaN(Number(n)) ? { v: 0, t: 'n', z: fmt } : { v: Number(n), t: 'n', z: fmt };

const applyFormat = (ws: XLSX.WorkSheet, rows: any[][], numericCols: { col: number; fmt?: string }[]) => {
  for (let r = 1; r < rows.length; r++) {
    numericCols.forEach(({ col, fmt }) => {
      const addr = XLSX.utils.encode_cell({ r, c: col });
      const v = rows[r][col];
      if (v == null || v === '') continue;
      const n = Number(v);
      if (!isNaN(n)) ws[addr] = { v: n, t: 'n', z: fmt || GBP_FMT };
    });
  }
};

const dateStr = (ms: number | string | null | undefined) => {
  if (!ms) return '';
  const d = typeof ms === 'string' ? new Date(ms) : new Date(Number(ms));
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

export function exportCashFlowInputs(transactions: any[], monthLabels: string[]) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Cash Flow Items ──
  const itemHeaders = [
    'Type',
    'Cash Flow Section',
    'Category',
    'Subcategory',
    'Cost Centre',
    'Group',
    'Frequency',
    'Day of Month',
    'Start Date',
    'End Date',
    'Amount',
    'Monthly',
    'Daily',
    'Annualised',
    ...monthLabels,
    'Year Total',
  ];

  const itemRows: any[][] = [itemHeaders];
  transactions.forEach((t: any) => {
    const monthly = Number(t.monthly) || 0;
    const projections: number[] = Array.isArray(t.projections) ? t.projections : Array(12).fill(monthly);
    const yearTotal = projections.reduce((s, n) => s + (Number(n) || 0), 0);
    itemRows.push([
      t.type ?? '',
      t.cash_flow_section ?? 'operating',
      t.category ?? '',
      t.subcategory ?? '',
      t.cost_centre ?? '',
      t.group_name ?? t.group ?? '',
      t.frequency ?? '',
      t.date && Number(t.date) > 0 && Number(t.date) < 32 ? Number(t.date) : '',
      dateStr(t.start_date),
      dateStr(t.end_date),
      Number(t.amount) || 0,
      monthly,
      Number(t.daily) || monthly / 30,
      monthly * 12,
      ...projections.map((p) => Number(p) || 0),
      yearTotal,
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(itemRows);
  ws1['!cols'] = autoFit(itemRows);
  // Numeric format: Amount → Year Total (cols 10..)
  const numCols = [];
  for (let c = 10; c < itemHeaders.length; c++) numCols.push({ col: c });
  applyFormat(ws1, itemRows, numCols);
  XLSX.utils.book_append_sheet(wb, ws1, 'Cash Flow Items');

  // ── Sheet 2: Monthly Summary (Section × Type) ──
  const sectionTypeMap = new Map<string, number[]>();
  transactions.forEach((t: any) => {
    const key = `${t.cash_flow_section || 'operating'} · ${t.type || ''}`;
    const arr = sectionTypeMap.get(key) || Array(12).fill(0);
    const proj: number[] = Array.isArray(t.projections) ? t.projections : Array(12).fill(Number(t.monthly) || 0);
    for (let i = 0; i < 12; i++) arr[i] += Number(proj[i]) || 0;
    sectionTypeMap.set(key, arr);
  });
  const sumHeaders = ['Section · Type', ...monthLabels, 'Total'];
  const sumRows: any[][] = [sumHeaders];
  Array.from(sectionTypeMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([k, arr]) => {
      const total = arr.reduce((s, n) => s + n, 0);
      sumRows.push([k, ...arr, total]);
    });
  const ws2 = XLSX.utils.aoa_to_sheet(sumRows);
  ws2['!cols'] = autoFit(sumRows);
  applyFormat(
    ws2,
    sumRows,
    Array.from({ length: sumHeaders.length - 1 }, (_, i) => ({ col: i + 1 }))
  );
  XLSX.utils.book_append_sheet(wb, ws2, 'Monthly Summary');

  // ── Sheet 3: Cost Centre Summary ──
  const ccMap = new Map<string, { income: number; expense: number; liabilityOut: number; assetOut: number }>();
  transactions.forEach((t: any) => {
    const cc = t.cost_centre?.trim() || '(none)';
    const cur = ccMap.get(cc) || { income: 0, expense: 0, liabilityOut: 0, assetOut: 0 };
    const monthly = Number(t.monthly) || 0;
    if (t.type === 'income') cur.income += monthly;
    else if (t.type === 'expense') cur.expense += monthly;
    else if (t.type === 'liability') cur.liabilityOut += monthly;
    else if (t.type === 'asset') cur.assetOut += monthly;
    ccMap.set(cc, cur);
  });
  const ccHeaders = [
    'Cost Centre',
    'Monthly Income',
    'Monthly Expense',
    'Monthly Financing (Liability)',
    'Monthly Investing (Asset)',
    'Net Monthly',
    'Annualised Net',
  ];
  const ccRows: any[][] = [ccHeaders];
  Array.from(ccMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([cc, v]) => {
      const net = v.income - v.expense - v.liabilityOut - v.assetOut;
      ccRows.push([cc, v.income, v.expense, v.liabilityOut, v.assetOut, net, net * 12]);
    });
  const ws3 = XLSX.utils.aoa_to_sheet(ccRows);
  ws3['!cols'] = autoFit(ccRows);
  applyFormat(
    ws3,
    ccRows,
    Array.from({ length: ccHeaders.length - 1 }, (_, i) => ({ col: i + 1 }))
  );
  XLSX.utils.book_append_sheet(wb, ws3, 'Cost Centre Summary');

  XLSX.writeFile(wb, `cnergise-cash-flow-inputs-${today()}.xlsx`);
}

export function exportBalances(
  accounts: any[],
  balanceSheet: SourceBalanceSheet,
  balanceSheetSummary: { totalAssets: number; totalLiabilities: number; netWorth: number; availableCash: number; availableCredit: number }
) {
  const wb = XLSX.utils.book_new();

  const findAccount = (id: string) => accounts.find((a) => a.id === id);

  // ── Sheet 1: Assets ──
  const assetHeaders = [
    'Name',
    'Category',
    'Bucket',
    'Group',
    'Currency',
    'Balance',
    'Cost Centre',
    'Account Code',
    'Opening Balance',
    'Opening Date',
  ];
  const assetRows: any[][] = [assetHeaders];
  const pushBucket = (items: any[], bucket: string) => {
    items.forEach((s) => {
      const a = findAccount(s.id) || {};
      assetRows.push([
        s.name,
        s.category ?? '',
        bucket,
        s.group ?? a.group_name ?? '',
        s.currency ?? 'GBP',
        Number(s.balance) || 0,
        a.cost_centre ?? '',
        a.account_code ?? '',
        Number(a.opening_balance) || 0,
        a.opening_balance_date ?? '',
      ]);
    });
  };
  pushBucket(balanceSheet.bankAccounts, 'Bank');
  pushBucket(balanceSheet.pensions, 'Pension');
  pushBucket(balanceSheet.investments, 'Investment');

  if (balanceSheet.homeValue > 0) {
    assetRows.push(['Home', 'Property', 'Physical', balanceSheet.homeGroup, 'GBP', balanceSheet.homeValue, '', '', '', '']);
  }
  if (balanceSheet.carValue > 0) {
    assetRows.push(['Car', 'Vehicle', 'Physical', balanceSheet.carGroup, 'GBP', balanceSheet.carValue, '', '', '', '']);
  }
  // Total row
  assetRows.push([]);
  assetRows.push(['TOTAL ASSETS', '', '', '', '', balanceSheetSummary.totalAssets, '', '', '', '']);

  const ws1 = XLSX.utils.aoa_to_sheet(assetRows);
  ws1['!cols'] = autoFit(assetRows);
  applyFormat(ws1, assetRows, [{ col: 5 }, { col: 8 }]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Assets');

  // ── Sheet 2: Liabilities ──
  const liabHeaders = [
    'Name',
    'Category',
    'Group',
    'Currency',
    'Balance (Outstanding)',
    'Credit Limit',
    'Available Credit',
    'Utilisation %',
    'APR %',
    'Monthly Payment',
    'Term (months)',
    'Loan Start',
    'Payment Day',
    'Cost Centre',
  ];
  const liabRows: any[][] = [liabHeaders];
  balanceSheet.liabilities.forEach((s) => {
    const a = findAccount(s.id) || {};
    const used = Math.abs(Number(s.balance) || 0);
    const limit = Number(s.creditLimit) || 0;
    const available = limit > 0 ? Math.max(0, limit - used) : '';
    const util = limit > 0 ? used / limit : '';
    liabRows.push([
      s.name,
      s.category ?? '',
      s.group ?? a.group_name ?? '',
      s.currency ?? 'GBP',
      used,
      limit || '',
      available,
      util,
      a.interest_rate != null ? Number(a.interest_rate) / 100 : '',
      a.monthly_payment ?? '',
      a.term_months ?? '',
      a.loan_start_date ?? '',
      a.payment_day ?? '',
      a.cost_centre ?? '',
    ]);
  });
  liabRows.push([]);
  liabRows.push([
    'TOTAL LIABILITIES',
    '',
    '',
    '',
    balanceSheetSummary.totalLiabilities,
    '',
    balanceSheetSummary.availableCredit,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ]);

  const ws2 = XLSX.utils.aoa_to_sheet(liabRows);
  ws2['!cols'] = autoFit(liabRows);
  // Currency cols
  [4, 5, 6, 9].forEach((c) => applyFormat(ws2, liabRows, [{ col: c }]));
  // Percent cols
  [7, 8].forEach((c) => applyFormat(ws2, liabRows, [{ col: c, fmt: PCT_FMT }]));
  XLSX.utils.book_append_sheet(wb, ws2, 'Liabilities');

  // ── Sheet 3: Summary ──
  const summaryRows: any[][] = [
    ['Metric', 'Amount'],
    ['Total Assets', balanceSheetSummary.totalAssets],
    ['Total Liabilities', balanceSheetSummary.totalLiabilities],
    ['Net Worth', balanceSheetSummary.netWorth],
    ['Available Cash (Bank only)', balanceSheetSummary.availableCash],
    ['Available Credit', balanceSheetSummary.availableCredit],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws3['!cols'] = autoFit(summaryRows);
  applyFormat(ws3, summaryRows, [{ col: 1 }]);
  XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

  XLSX.writeFile(wb, `cnergise-balances-${today()}.xlsx`);
}
