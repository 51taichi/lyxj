import type { BreakdownItem } from '../types.js';

export type BreakdownCategory = NonNullable<BreakdownItem['category']>;

export const BREAKDOWN_CATEGORY_LABELS: Record<BreakdownCategory, string> = {
  ticket: '门票',
  hotel: '住宿',
  vehicle: '用车',
  meal: '餐补',
  guide: '导服',
};

const CATEGORY_ORDER: BreakdownCategory[] = ['ticket', 'hotel', 'vehicle', 'meal', 'guide'];

export function inferBreakdownCategory(label: string): BreakdownCategory {
  if (label.startsWith('门票') || label.startsWith('通票')) return 'ticket';
  if (label.startsWith('酒店')) return 'hotel';
  if (label.startsWith('导服')) return 'guide';
  if (label.startsWith('餐补')) return 'meal';
  return 'vehicle';
}

export function resolveBreakdownCategory(item: BreakdownItem): BreakdownCategory {
  return item.category ?? inferBreakdownCategory(item.label);
}

export function groupBreakdown(items: BreakdownItem[]): BreakdownItem[] {
  const sums = new Map<BreakdownCategory, number>();
  for (const item of items) {
    const cat = resolveBreakdownCategory(item);
    sums.set(cat, (sums.get(cat) ?? 0) + item.amount);
  }
  return CATEGORY_ORDER.filter((cat) => (sums.get(cat) ?? 0) > 0).map((cat) => ({
    label: BREAKDOWN_CATEGORY_LABELS[cat],
    amount: sums.get(cat) ?? 0,
    category: cat,
  }));
}
