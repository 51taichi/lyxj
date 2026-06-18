import type { PriceFields, PricePeriod } from '../types.js';

export function findMatchingPeriod(arrivalDate: string, periods: PricePeriod[]): PricePeriod | null {
  if (!arrivalDate || !periods?.length) return null;
  const matches = periods.filter((p) => arrivalDate >= p.startDate && arrivalDate <= p.endDate);
  if (!matches.length) return null;
  return [...matches].sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
}

export function getEffectivePriceFields(
  period: PricePeriod | null,
  dimensionId: string,
  optionId: string,
  base: PriceFields,
): PriceFields {
  if (!period) return base;
  const ov = period.overrides.find((o) => o.dimensionId === dimensionId && o.optionId === optionId);
  if (!ov?.priceFields) return base;
  return { ...base, ...ov.priceFields } as PriceFields;
}

export function getEffectiveMealRate(base: number, period: PricePeriod | null): number {
  if (period?.mealAllowancePerPersonDay != null) return period.mealAllowancePerPersonDay;
  return base;
}
