import type { Dimension, DimensionOption } from '../types'

export interface VehicleNeedDef {
  needId: string
  needName: string
  priceKey: string
  unit: string
  priceLabel: string
  isDailyRate: boolean
}

export function isVehicleNeedDaily(need: DimensionOption): boolean {
  if (need.isDailyRate !== undefined) return need.isDailyRate
  return need.id === 'city'
}

export interface VehiclePriceFieldDef {
  key: string
  label: string
  shortLabel?: string
  unit: string
}

export function getVehicleNeedPriceKey(need: DimensionOption): string {
  if (need.id === 'city') return 'cityDay'
  return need.id
}

export function buildVehicleNeedDefs(vehicleNeedsDim: Dimension | undefined): VehicleNeedDef[] {
  if (!vehicleNeedsDim?.options?.length) return []
  return vehicleNeedsDim.options.map((need) => {
    const daily = isVehicleNeedDaily(need)
    return {
      needId: need.id,
      needName: need.name,
      priceKey: getVehicleNeedPriceKey(need),
      unit: daily ? '元/天' : '元/次',
      priceLabel: need.name,
      isDailyRate: daily,
    }
  })
}

export function vehiclePriceFieldsFromNeeds(vehicleNeedsDim: Dimension | undefined): VehiclePriceFieldDef[] {
  const needFields = buildVehicleNeedDefs(vehicleNeedsDim).map((n) => ({
    key: n.priceKey,
    label: `${n.needName}（${n.unit}）`,
    shortLabel: n.needName,
    unit: n.unit,
  }))
  return [
    ...needFields,
    { key: 'minPax', label: '最少人数', shortLabel: '最少', unit: '人' },
    { key: 'maxPax', label: '最多人数', shortLabel: '最多', unit: '人' },
  ]
}

export function syncVehicleOptionsWithNeeds(
  vehicleDim: Dimension | undefined,
  vehicleNeedsDim: Dimension | undefined,
): void {
  if (!vehicleDim?.options?.length || !vehicleNeedsDim?.options?.length) return
  const priceKeys = buildVehicleNeedDefs(vehicleNeedsDim).map((d) => d.priceKey)
  const keys = new Set([...priceKeys, 'minPax', 'maxPax'])
  for (const opt of vehicleDim.options) {
    for (const key of keys) {
      if (opt.priceFields[key] === undefined) opt.priceFields[key] = 0
    }
  }
}

export function removeVehicleNeedFromVehicles(
  vehicleDim: Dimension | undefined,
  need: DimensionOption,
): void {
  if (!vehicleDim?.options?.length) return
  const priceKey = getVehicleNeedPriceKey(need)
  for (const opt of vehicleDim.options) {
    delete opt.priceFields[priceKey]
  }
}
