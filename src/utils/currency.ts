/**
 * Currency utilities with Indian number formatting (lakhs & crores)
 * and integer-paise arithmetic to eliminate floating point rounding errors.
 */

export function toPaise(rupees: number): number {
  return Math.round(Number(rupees || 0) * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}

export function formatINR(amount: number, includeDecimals = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;
  
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });

  const formatted = formatter.format(absAmount);
  return isNegative ? `-${formatted}` : formatted;
}

export function formatNumberIndian(num: number): string {
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format large amounts in words (Lakhs / Crores)
 */
export function formatINRWords(amount: number): string {
  if (!amount || isNaN(amount)) return 'Zero Rupees';
  const abs = Math.abs(amount);
  if (abs >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return formatINR(amount);
}
