import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const CURRENCY_LOCALES: Record<string, string> = {
  GBP: 'en-GB',
  USD: 'en-US',
  EUR: 'en-IE',
  INR: 'en-IN',
  AUD: 'en-AU',
  CAD: 'en-CA',
  JPY: 'ja-JP',
  CHF: 'de-CH',
  SGD: 'en-SG',
  AED: 'en-AE',
};

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCY_LOCALES);

export function useUserCurrency() {
  const { data: currency = 'GBP' } = useQuery({
    queryKey: ['user-currency'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'GBP';
      const { data } = await supabase
        .from('profiles')
        .select('currency')
        .eq('id', user.id)
        .maybeSingle();
      return (data as any)?.currency || 'GBP';
    },
    staleTime: 5 * 60 * 1000,
  });

  const locale = CURRENCY_LOCALES[currency] || 'en-GB';

  const format = (n: number, opts: Intl.NumberFormatOptions = {}) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
      ...opts,
    }).format(Number.isFinite(n) ? n : 0);

  const formatWhole = (n: number) => format(n, { maximumFractionDigits: 0 });

  return { currency, locale, format, formatWhole };
}
