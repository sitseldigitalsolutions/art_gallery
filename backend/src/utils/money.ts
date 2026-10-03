/**
 * Money helpers. All arithmetic is done in integer minor units (paise/cents)
 * to avoid floating point drift; values are stored as DECIMAL(12,2).
 */
export const toMinor = (value: number | string | { toString(): string }): number =>
  Math.round(Number(value.toString()) * 100);

export const fromMinor = (minor: number): string => (minor / 100).toFixed(2);

export interface CommissionBreakdown {
  grossMinor: number;
  commissionMinor: number;
  artistMinor: number;
}

/** Commission is rounded half-up to the nearest minor unit; artist gets the remainder. */
export function splitCommission(grossMinor: number, percentage: number): CommissionBreakdown {
  if (!Number.isInteger(grossMinor) || grossMinor < 0) throw new Error('grossMinor must be a non-negative integer');
  if (percentage < 0 || percentage > 100) throw new Error('percentage must be between 0 and 100');
  const commissionMinor = Math.round((grossMinor * percentage) / 100);
  return { grossMinor, commissionMinor, artistMinor: grossMinor - commissionMinor };
}
