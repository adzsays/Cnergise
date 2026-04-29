import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useUserCurrency } from '@/hooks/useUserCurrency';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number | null | undefined;
  onCommit: (value: number | null) => void;
  allowNull?: boolean;
  placeholder?: string;
  className?: string;
  decimals?: number;
}

/**
 * Displays a number formatted as currency (e.g. £100,000) when not focused.
 * On focus, switches to a raw editable number for typing. On blur, commits
 * the parsed numeric value back to the parent and re-displays formatted.
 */
export function CurrencyInput({
  value,
  onCommit,
  allowNull = false,
  placeholder = '—',
  className,
  decimals = 2,
}: CurrencyInputProps) {
  const { currency, locale } = useUserCurrency();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const ref = useRef<HTMLInputElement>(null);

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  const formatted =
    value === null || value === undefined || (allowNull && value === null)
      ? ''
      : formatter.format(Number(value) || 0);

  useEffect(() => {
    if (!focused) {
      setDraft(value === null || value === undefined ? '' : String(value));
    }
  }, [value, focused]);

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={focused ? draft : formatted}
      placeholder={placeholder}
      onFocus={(e) => {
        setFocused(true);
        setDraft(value === null || value === undefined ? '' : String(value));
        // select all for easy overwrite
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => {
        // allow only digits, minus, dot
        const cleaned = e.target.value.replace(/[^0-9.\-]/g, '');
        setDraft(cleaned);
      }}
      onBlur={() => {
        setFocused(false);
        if (draft === '' || draft === '-') {
          if (allowNull) onCommit(null);
          else onCommit(0);
          return;
        }
        const v = parseFloat(draft);
        if (!Number.isFinite(v)) {
          if (allowNull) onCommit(null);
          else onCommit(0);
          return;
        }
        onCommit(v);
      }}
      className={cn('text-right tabular-nums', className)}
    />
  );
}
