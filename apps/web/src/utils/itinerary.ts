import type { Dimension, QuoteSelections } from '../types'

export interface ItineraryItem {
  id: string
  label: string
}

export interface ItineraryState {
  days: ItineraryItem[][]
  pool: ItineraryItem[]
}

const DAY_NAMES = ['一', '二', '三', '四', '五', '六']

const NEED_LABELS: Record<string, string> = {
  city: '市内',
  greatWall: '上长城',
  pickup: '接站',
  airport: '接机',
  flag: '升旗',
}

function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string' && v) return [v]
  return []
}

function needSelected(needs: string[], key: string): boolean {
  const label = NEED_LABELS[key] ?? key
  return needs.includes(key) || needs.includes(label)
}

export function dayLabel(dayIndex: number): string {
  return `第${DAY_NAMES[dayIndex] ?? String(dayIndex + 1)}天`
}

export function formatDayLine(items: ItineraryItem[]): string {
  return items.map((item) => item.label).join('-')
}

export function formatArrivalDisplay(isoDate: string): string {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  return `${m}.${d}抵达`
}

export function serializeItinerary(state: ItineraryState): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  state.days.forEach((day, index) => {
    out[`day${index + 1}`] = day.map((item) => item.label)
  })
  return out
}

/** 汇总页默认行程天数（与用车天数无关，客服可调整） */
export const DEFAULT_ITINERARY_DAYS = 4

/** 按行程天数生成默认行程（接站/入住、景点分配、返程） */
export function buildDefaultItinerary(
  selections: QuoteSelections,
  dimensions: Dimension[],
  dayCount = DEFAULT_ITINERARY_DAYS,
): ItineraryState {
  const daysTotal = Math.max(1, dayCount)
  const needs = asArray(selections.vehicleNeeds)
  const attractionsDim = dimensions.find((d) => d.id === 'attractions')

  const attractionItems: ItineraryItem[] = asArray(selections.attractions).map((id) => {
    const opt = attractionsDim?.options?.find((o) => o.id === id || o.name === id)
    return { id: `attr:${id}`, label: opt?.name ?? id }
  })

  const days: ItineraryItem[][] = Array.from({ length: daysTotal }, () => [])

  if (needSelected(needs, 'pickup')) {
    days[0].push({ id: '__pickup', label: '接站' })
  } else if (needSelected(needs, 'airport')) {
    days[0].push({ id: '__airport', label: '接机' })
  }
  days[0].push({ id: '__checkin', label: '入住酒店' })

  if (daysTotal === 1) {
    days[0].push(...attractionItems)
    days[0].push({ id: '__return', label: '返程' })
    return { days, pool: [] }
  }

  let attrIndex = 0
  for (let d = 1; d < daysTotal - 1 && attrIndex < attractionItems.length; d++) {
    days[d].push(attractionItems[attrIndex])
    attrIndex++
  }
  while (attrIndex < attractionItems.length) {
    days[daysTotal - 1].push(attractionItems[attrIndex])
    attrIndex++
  }
  days[daysTotal - 1].push({ id: '__return', label: '返程' })

  return { days, pool: [] }
}
