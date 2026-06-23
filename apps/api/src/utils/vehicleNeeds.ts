import type { Dimension, DimensionOption } from '../types.js';

export interface VehicleNeedDef {
  needId: string;
  needName: string;
  priceKey: string;
  unit: string;
  priceLabel: string;
  /** 市内按天×用车天数；其余默认按次 */
  isDailyRate: boolean;
}

/** 是否按天计费（仅市内；可配置 isDailyRate 覆盖） */
export function isVehicleNeedDaily(need: DimensionOption): boolean {
  if (need.isDailyRate !== undefined) return need.isDailyRate;
  return need.id === 'city';
}

/** 车型 priceFields 中对应的价格键；市内沿用 cityDay，其余与需求 id 相同 */
export function getVehicleNeedPriceKey(need: DimensionOption): string {
  if (need.id === 'city') return 'cityDay';
  return need.id;
}

export function buildVehicleNeedDefs(vehicleNeedsDim: Dimension | undefined): VehicleNeedDef[] {
  if (!vehicleNeedsDim?.options?.length) return [];
  return vehicleNeedsDim.options.map((need) => {
    const daily = isVehicleNeedDaily(need);
    return {
      needId: need.id,
      needName: need.name,
      priceKey: getVehicleNeedPriceKey(need),
      unit: daily ? '元/天' : '元/次',
      priceLabel: need.name,
      isDailyRate: daily,
    };
  });
}

export function vehicleNeedSelected(selected: string[], need: VehicleNeedDef): boolean {
  return selected.includes(need.needId) || selected.includes(need.needName);
}

/** 为各车型补齐用车需求对应的价格字段 */
export function syncVehicleOptionsWithNeeds(
  vehicleDim: Dimension | undefined,
  vehicleNeedsDim: Dimension | undefined,
): void {
  if (!vehicleDim?.options?.length || !vehicleNeedsDim?.options?.length) return;
  const priceKeys = buildVehicleNeedDefs(vehicleNeedsDim).map((d) => d.priceKey);
  const keys = new Set([...priceKeys, 'minPax', 'maxPax']);
  for (const opt of vehicleDim.options) {
    for (const key of keys) {
      if (opt.priceFields[key] === undefined) opt.priceFields[key] = 0;
    }
  }
}

export function removeVehicleNeedFromVehicles(
  vehicleDim: Dimension | undefined,
  need: DimensionOption,
): void {
  if (!vehicleDim?.options?.length) return;
  const priceKey = getVehicleNeedPriceKey(need);
  for (const opt of vehicleDim.options) {
    delete opt.priceFields[priceKey];
  }
}
