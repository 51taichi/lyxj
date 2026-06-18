import type { BreakdownItem } from '../types.js';
import { groupBreakdown } from './breakdownGroups.js';

export type MarkupCategory = 'hotel' | 'vehicle' | 'guide';

const UPLIFT_CATEGORIES: MarkupCategory[] = ['hotel', 'vehicle', 'guide'];

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function roundCustomerInt(n: number): number {
  return Math.round(n);
}

/** 上浮总额三等分（余数分配到前几项） */
function splitUplift(total: number, parts: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / parts);
  const remainder = cents - base * parts;
  const out = Array.from({ length: parts }, () => base);
  for (let i = 0; i < remainder; i++) out[i] += 1;
  return out.map((c) => c / 100);
}

function finalizeCustomerItems(items: BreakdownItem[]): BreakdownItem[] {
  const rounded = items.map((item) => ({ ...item, amount: roundCustomerInt(item.amount) }));
  return rounded.filter((item) => item.amount > 0);
}

/**
 * 客户报价上浮：基数 = 成本原价合计 × 比例，上浮额三等分加入住宿/用车/导服。
 * 门票、餐补不变；客户侧各项金额为整数四舍五入。
 */
export function applyCustomerMarkup(
  groupedCost: BreakdownItem[],
  markupPercent: number,
): { items: BreakdownItem[]; total: number; upliftAmount: number } {
  const baseTotal = roundMoney(groupedCost.reduce((s, i) => s + i.amount, 0));
  if (markupPercent <= 0 || baseTotal <= 0) {
    const items = finalizeCustomerItems(groupedCost);
    return {
      items,
      total: items.reduce((s, i) => s + i.amount, 0),
      upliftAmount: 0,
    };
  }

  const upliftAmount = roundMoney(baseTotal * (markupPercent / 100));
  const parts = splitUplift(upliftAmount, 3);
  const upliftByCat = new Map<MarkupCategory, number>([
    ['hotel', parts[0]],
    ['vehicle', parts[1]],
    ['guide', parts[2]],
  ]);

  const labelByCat: Record<MarkupCategory, string> = {
    hotel: '住宿',
    vehicle: '用车',
    guide: '导服',
  };

  const byCat = new Map<string, BreakdownItem>();
  for (const item of groupedCost) {
    if (item.category) byCat.set(item.category, { ...item });
  }

  for (const cat of UPLIFT_CATEGORIES) {
    const add = upliftByCat.get(cat) ?? 0;
    const existing = byCat.get(cat);
    if (existing) {
      existing.amount = roundMoney(existing.amount + add);
    } else if (add > 0) {
      byCat.set(cat, { label: labelByCat[cat], amount: add, category: cat });
    }
  }

  for (const item of groupedCost) {
    if (!item.category || UPLIFT_CATEGORIES.includes(item.category as MarkupCategory)) continue;
    if (!byCat.has(item.category)) byCat.set(item.category, { ...item });
  }

  const order = ['ticket', 'hotel', 'vehicle', 'meal', 'guide'];
  const rawItems = order
    .map((cat) => byCat.get(cat))
    .filter((i): i is BreakdownItem => !!i);

  const items = finalizeCustomerItems(rawItems);
  const total = items.reduce((s, i) => s + i.amount, 0);
  return { items, total, upliftAmount };
}

export function applyCustomerMarkupFromDetail(
  detailBreakdown: BreakdownItem[],
  markupPercent: number,
) {
  return applyCustomerMarkup(groupBreakdown(detailBreakdown), markupPercent);
}
