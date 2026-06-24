import { getDimensions, getMealAllowancePerPersonDay, getPricePeriods } from '../store/configStore.js';
import { ATTRACTION_PASSES_KEY } from '../data/seed.js';
import type { BreakdownItem, Dimension, DimensionOption, PriceFields, QuoteResult, QuoteSelections } from '../types.js';
import { findMatchingPeriod, getEffectiveMealRate, getEffectivePriceFields } from '../utils/pricePeriod.js';
import {
  buildVehicleNeedDefs,
  vehicleNeedSelected,
} from '../utils/vehicleNeeds.js';
import { isDriverGuideOption } from '../utils/guide.js';

function getDimension(id: string): Dimension {
  const dim = getDimensions().find((d) => d.id === id);
  if (!dim) throw new Error(`Unknown dimension: ${id}`);
  return dim;
}

function findOption(dim: Dimension, key: string) {
  return dim.options?.find((o) => o.id === key || o.name === key);
}

function withPeriodPrices(dim: Dimension, opt: DimensionOption, period: ReturnType<typeof findMatchingPeriod>): DimensionOption {
  return {
    ...opt,
    priceFields: getEffectivePriceFields(period, dim.id, opt.id, opt.priceFields),
  };
}

function getEffectiveOption(dimId: string, key: string, period: ReturnType<typeof findMatchingPeriod>) {
  const dim = getDimension(dimId);
  const opt = findOption(dim, key);
  if (!opt) return undefined;
  // 景点不受淡旺季价格段影响
  if (dimId === 'attractions') return opt;
  return withPeriodPrices(dim, opt, period);
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value) return [value];
  return [];
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isSet(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** 餐补人数（仅司导，不含游客）：司兼导 1 人，独立/金牌导游 2 人 */
function getMealStaffCount(guideOpt: DimensionOption | undefined): number {
  if (!guideOpt) return 0;
  if (isDriverGuideOption(guideOpt)) return 1;
  return 2;
}

export interface CalculateOptions {
  /** 抵达日期：命中淡旺季则使用时段价，否则标准价 */
  arrivalDate?: string;
}

/**
 * 计价逻辑：向导用标准价；汇总页传 arrivalDate 可匹配淡旺季价。
 */
export function calculateQuote(selections: QuoteSelections, options?: CalculateOptions): QuoteResult {
  const period = options?.arrivalDate
    ? findMatchingPeriod(options.arrivalDate, getPricePeriods())
    : null;

  const breakdown: BreakdownItem[] = [];

  const adults = isSet(selections.adults) ? asNumber(selections.adults, 0) : 0;
  const children = isSet(selections.children) ? asNumber(selections.children, 0) : 0;
  const attractionKeys = asStringArray(selections.attractions);
  const passKeys = asStringArray(selections[ATTRACTION_PASSES_KEY]);

  const attractionsDim = getDimension('attractions');
  let adultUnitSum = 0;
  let childUnitSum = 0;

  for (const key of attractionKeys) {
    const opt = getEffectiveOption('attractions', key, period);
    if (!opt) continue;
    adultUnitSum += opt.priceFields.adultTicket ?? 0;
    childUnitSum += opt.priceFields.childTicket ?? 0;
  }

  if (isSet(selections.adults) && adults > 0 && adultUnitSum > 0) {
    breakdown.push({
      label: `门票·成人（${adultUnitSum}元/人×${adults}人）`,
      amount: adultUnitSum * adults,
      category: 'ticket',
    });
  }
  if (isSet(selections.children) && children > 0 && childUnitSum > 0) {
    breakdown.push({
      label: `门票·儿童（${childUnitSum}元/人×${children}人）`,
      amount: childUnitSum * children,
      category: 'ticket',
    });
  }
  if (
    isSet(selections.adults) &&
    adults > 0 &&
    adultUnitSum === 0 &&
    childUnitSum === 0 &&
    attractionKeys.length
  ) {
    breakdown.push({ label: '门票（所选景点均免费）', amount: 0, category: 'ticket' });
  }

  for (const key of passKeys) {
    if (!attractionKeys.includes(key)) continue;
    const opt = getEffectiveOption('attractions', key, period);
    if (!opt) continue;
    const passAddon = opt.priceFields.passAddon ?? 0;
    if (passAddon <= 0 || adults <= 0) continue;
    breakdown.push({
      label: `通票·${opt.name}（${passAddon}元/人×${adults}成人）`,
      amount: passAddon * adults,
      category: 'ticket',
    });
  }

  const vehicleOpt = isSet(selections.vehicle)
    ? getEffectiveOption('vehicle', String(selections.vehicle), period)
    : undefined;
  const vf: PriceFields = vehicleOpt?.priceFields ?? {};
  const vehicleName = vehicleOpt?.name ?? '用车';
  const vehicleDays = isSet(selections.vehicleDays) ? asNumber(selections.vehicleDays, 1) : 0;
  const vehicleNeeds = asStringArray(selections.vehicleNeeds);

  const vehicleNeedsDim = getDimension('vehicleNeeds');
  const vehicleNeedDefs = buildVehicleNeedDefs(vehicleNeedsDim);

  for (const def of vehicleNeedDefs) {
    if (!vehicleOpt || !vehicleNeedSelected(vehicleNeeds, def)) continue;
    const fee = vf[def.priceKey] ?? 0;
    if (fee <= 0) continue;
    if (def.isDailyRate) {
      if (!isSet(selections.vehicleDays)) continue;
      breakdown.push({
        label: `${def.needName}·${vehicleName}（${fee}元/天×${vehicleDays}天）`,
        amount: fee * vehicleDays,
        category: 'vehicle',
      });
    } else {
      breakdown.push({
        label: `${def.needName}·${vehicleName}（${fee}元/次）`,
        amount: fee,
        category: 'vehicle',
      });
    }
  }

  const hotelOpt = isSet(selections.hotel)
    ? getEffectiveOption('hotel', String(selections.hotel), period)
    : undefined;
  if (hotelOpt && isSet(selections.nights) && isSet(selections.rooms)) {
    const roomNight = hotelOpt.priceFields.roomNight ?? 0;
    const nights = asNumber(selections.nights, 1);
    const rooms = asNumber(selections.rooms, 1);
    breakdown.push({
      label: `酒店·${hotelOpt.name}（${roomNight}元/间/晚×${rooms}间×${nights}晚）`,
      amount: roomNight * nights * rooms,
      category: 'hotel',
    });
  }

  const guideOpt = isSet(selections.guide)
    ? getEffectiveOption('guide', String(selections.guide), period)
    : undefined;
  if (guideOpt) {
    const guideFee = guideOpt.priceFields.feeDay ?? guideOpt.priceFields.fee ?? 0;
    if (isDriverGuideOption(guideOpt)) {
      if (guideFee > 0) {
        breakdown.push({
          label: `导服·${guideOpt.name}（整单 ${guideFee} 元）`,
          amount: guideFee,
          category: 'guide',
        });
      }
    } else if (guideFee > 0 && isSet(selections.guideDays)) {
      const guideDays = asNumber(selections.guideDays, 1);
      if (guideDays > 0) {
        breakdown.push({
          label: `导服·${guideOpt.name}（${guideFee}元/天×${guideDays}天）`,
          amount: guideFee * guideDays,
          category: 'guide',
        });
      }
    }
  }

  const mealRate = getEffectiveMealRate(getMealAllowancePerPersonDay(), period);
  const mealStaff = getMealStaffCount(guideOpt);
  if (isSet(selections.vehicleDays) && mealRate > 0 && mealStaff > 0 && guideOpt) {
    const staffLabel = mealStaff === 1 ? '司兼导' : '司机+导游';
    breakdown.push({
      label: `餐补·${staffLabel}（${mealRate}元/人/天×${mealStaff}人×${vehicleDays}天）`,
      amount: mealRate * mealStaff * vehicleDays,
      category: 'meal',
    });
  }

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
  return {
    breakdown,
    total,
    matchedPeriod: period ? { id: period.id, name: period.name } : null,
    pricingMode: period ? 'period' : 'standard',
  };
}

/** 向导初始值：仅景点默认勾选，其余维度待用户逐步选择后再计价 */
export function getDefaultSelections(): QuoteSelections {
  const attractions = getDimensions().find((d) => d.id === 'attractions');
  return {
    attractions: Array.isArray(attractions?.defaultValue)
      ? [...attractions.defaultValue]
      : [],
    [ATTRACTION_PASSES_KEY]: [],
  };
}

/** 进入某一步时，填充该维度的配置默认值（单选需用户手动点选，不自动填充） */
export function getDimensionStepDefault(dimId: string): unknown {
  const dim = getDimensions().find((d) => d.id === dimId);
  if (!dim) return undefined;

  if (dim.type === 'number') {
    return dim.defaultValue !== undefined ? dim.defaultValue : (dim.min ?? 1);
  }
  if (dim.type === 'multi_select') {
    return dim.defaultValue !== undefined
      ? Array.isArray(dim.defaultValue)
        ? [...dim.defaultValue]
        : dim.defaultValue
      : [];
  }
  return undefined;
}
