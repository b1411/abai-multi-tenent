export interface FormatNumberShortOptions {
  decimals?: number;           // Количество знаков после запятой
  currency?: boolean;          // Добавлять ли символ валюты
  currencySymbol?: string;     // Символ валюты (по умолчанию ₸)
  space?: boolean;             // Пробел перед символом валюты
}

// Форматирование больших чисел: 1.2K, 3.4M, 5.6B (+ опционально валюта)
export function formatNumberShort(value: number | null | undefined, options: FormatNumberShortOptions = {}): string {
  if (value === null || value === undefined || isNaN(value as number)) return '0';
  const { decimals = 1, currency = false, currencySymbol = '₸', space = true } = options;
  const abs = Math.abs(value);
  let suffix = '';
  let num = value;

  if (abs >= 1_000_000_000) {
    num = value / 1_000_000_000;
    suffix = 'B';
  } else if (abs >= 1_000_000) {
    num = value / 1_000_000;
    suffix = 'M';
  } else if (abs >= 1_000) {
    num = value / 1_000;
    suffix = 'K';
  }

  const fixed = num.toFixed(decimals);
  // Убираем лишний .0
  const trimmed = decimals > 0 ? fixed.replace(/\.0+$/,'').replace(/(\.[1-9]*)0+$/,'$1') : fixed;
  const core = trimmed + suffix;

  if (!currency) return core;
  return suffix ? `${core}${space ? ' ' : ''}${currencySymbol}` : new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}
