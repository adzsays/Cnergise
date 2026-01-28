/**
 * Business day utilities for cash flow forecasting
 * Handles weekend/holiday adjustments for recurring transactions
 */

// UK Bank Holidays - simplified list (can be expanded)
const getUKBankHolidays = (year: number): Date[] => {
  const holidays: Date[] = [];
  
  // New Year's Day (or substitute)
  let newYear = new Date(year, 0, 1);
  if (newYear.getDay() === 0) newYear = new Date(year, 0, 2);
  if (newYear.getDay() === 6) newYear = new Date(year, 0, 3);
  holidays.push(newYear);
  
  // Good Friday (varies - approximate)
  // Easter Monday (varies - approximate)
  
  // Early May Bank Holiday (first Monday in May)
  const mayFirst = new Date(year, 4, 1);
  const earlyMay = new Date(year, 4, 1 + ((8 - mayFirst.getDay()) % 7));
  holidays.push(earlyMay);
  
  // Spring Bank Holiday (last Monday in May)
  const mayEnd = new Date(year, 4, 31);
  const springBank = new Date(year, 4, 31 - ((mayEnd.getDay() + 6) % 7));
  holidays.push(springBank);
  
  // Summer Bank Holiday (last Monday in August)
  const augEnd = new Date(year, 7, 31);
  const summerBank = new Date(year, 7, 31 - ((augEnd.getDay() + 6) % 7));
  holidays.push(summerBank);
  
  // Christmas Day (or substitute)
  let christmas = new Date(year, 11, 25);
  if (christmas.getDay() === 0) christmas = new Date(year, 11, 27);
  if (christmas.getDay() === 6) christmas = new Date(year, 11, 27);
  holidays.push(christmas);
  
  // Boxing Day (or substitute)
  let boxing = new Date(year, 11, 26);
  if (boxing.getDay() === 0) boxing = new Date(year, 11, 28);
  if (boxing.getDay() === 6) boxing = new Date(year, 11, 28);
  holidays.push(boxing);
  
  return holidays;
};

/**
 * Check if a date is a weekend
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

/**
 * Check if a date is a UK bank holiday
 */
export const isBankHoliday = (date: Date): boolean => {
  const holidays = getUKBankHolidays(date.getFullYear());
  return holidays.some(h => 
    h.getDate() === date.getDate() && 
    h.getMonth() === date.getMonth() && 
    h.getFullYear() === date.getFullYear()
  );
};

/**
 * Check if a date is a business day
 */
export const isBusinessDay = (date: Date): boolean => {
  return !isWeekend(date) && !isBankHoliday(date);
};

/**
 * Get the next business day from a given date
 * If the date is already a business day, return it
 */
export const getNextBusinessDay = (date: Date): Date => {
  const result = new Date(date);
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
};

/**
 * Get the actual payment date for a recurring transaction
 * @param dayOfPeriod - The day within the period (1-31 for monthly, 1-7 for weekly, etc.)
 * @param frequency - The frequency type
 * @param referenceDate - The reference date to calculate from (defaults to today)
 */
export const getNextPaymentDate = (
  dayOfPeriod: number,
  frequency: string,
  referenceDate: Date = new Date()
): Date => {
  let targetDate: Date;
  
  switch (frequency) {
    case 'daily':
      targetDate = new Date(referenceDate);
      break;
      
    case 'weekly':
      // dayOfPeriod: 1=Monday, 7=Sunday
      const currentDay = referenceDate.getDay() || 7; // Convert Sunday from 0 to 7
      const daysUntilTarget = (dayOfPeriod - currentDay + 7) % 7;
      targetDate = new Date(referenceDate);
      targetDate.setDate(referenceDate.getDate() + (daysUntilTarget || 7));
      break;
      
    case 'monthly':
      // dayOfPeriod: 1-31 (day of month)
      targetDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), dayOfPeriod);
      // If we've passed this day, move to next month
      if (targetDate <= referenceDate) {
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
      // Handle months with fewer days (e.g., Feb 30 -> Mar 2)
      break;
      
    case 'quarterly':
      // dayOfPeriod: 1-90 (day of quarter)
      const currentQuarter = Math.floor(referenceDate.getMonth() / 3);
      const quarterStart = new Date(referenceDate.getFullYear(), currentQuarter * 3, 1);
      targetDate = new Date(quarterStart);
      targetDate.setDate(dayOfPeriod);
      // If we've passed this day, move to next quarter
      if (targetDate <= referenceDate) {
        targetDate = new Date(referenceDate.getFullYear(), (currentQuarter + 1) * 3, 1);
        targetDate.setDate(dayOfPeriod);
      }
      break;
      
    case 'yearly':
      // dayOfPeriod: 1-365 (day of year)
      const yearStart = new Date(referenceDate.getFullYear(), 0, 1);
      targetDate = new Date(yearStart);
      targetDate.setDate(dayOfPeriod);
      // If we've passed this day, move to next year
      if (targetDate <= referenceDate) {
        targetDate = new Date(referenceDate.getFullYear() + 1, 0, 1);
        targetDate.setDate(dayOfPeriod);
      }
      break;
      
    default: // one-time
      targetDate = new Date(referenceDate);
  }
  
  // Adjust to next business day if needed
  return getNextBusinessDay(targetDate);
};

/**
 * Get label for day of period based on frequency
 */
export const getDayOfPeriodLabel = (frequency: string): string => {
  switch (frequency) {
    case 'daily':
      return 'Repeats Daily';
    case 'weekly':
      return 'Day of Week';
    case 'monthly':
      return 'Day of Month';
    case 'quarterly':
      return 'Day of Quarter';
    case 'yearly':
      return 'Day of Year';
    default:
      return 'Transaction Date';
  }
};

/**
 * Get max value for day of period based on frequency
 */
export const getMaxDayOfPeriod = (frequency: string): number => {
  switch (frequency) {
    case 'weekly':
      return 7;
    case 'monthly':
      return 31;
    case 'quarterly':
      return 90;
    case 'yearly':
      return 365;
    default:
      return 31;
  }
};

/**
 * Get day options for weekly frequency
 */
export const getWeekdayOptions = (): { value: number; label: string }[] => [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

/**
 * Format day of period for display
 */
export const formatDayOfPeriod = (day: number, frequency: string): string => {
  switch (frequency) {
    case 'weekly':
      const weekdays = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      return weekdays[day] || `Day ${day}`;
    case 'monthly':
      return `${day}${getOrdinalSuffix(day)} of month`;
    case 'quarterly':
      return `Day ${day} of quarter`;
    case 'yearly':
      return `Day ${day} of year`;
    default:
      return `Day ${day}`;
  }
};

const getOrdinalSuffix = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};
