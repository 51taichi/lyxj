export interface User {
  id: string
  username: string
  role: 'admin'
  name: string
}

export interface DimensionOption {
  id: string
  name: string
  priceFields: Record<string, number>
  isDefault?: boolean
  linkedAttraction?: string
  /** 用车需求：按天计费（×用车天数），默认按次 */
  isDailyRate?: boolean
}

export interface Dimension {
  id: string
  name: string
  type: 'multi_select' | 'single_select' | 'number'
  sortOrder: number
  required: boolean
  min?: number
  max?: number
  defaultValue?: string | number | string[]
  options?: DimensionOption[]
}

export interface BreakdownItem {
  label: string
  amount: number
  category?: 'ticket' | 'hotel' | 'vehicle' | 'meal' | 'guide'
}

export interface ItineraryItem {
  id: string
  label: string
}

export type QuoteSelections = Record<string, string | number | string[]>

export interface Agency {
  id: string
  name: string
  logoUrl: string
  phone: string
  address?: string
  sortOrder: number
}

export interface SystemConfig {
  dimensions: Dimension[]
  mealAllowancePerPersonDay: number
  formulaNote: string
  agencies: Agency[]
  pricePeriods: PricePeriod[]
}

export interface PricePeriodOverride {
  dimensionId: string
  optionId: string
  priceFields: Partial<Record<string, number>>
}

export interface PricePeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  mealAllowancePerPersonDay?: number
  overrides: PricePeriodOverride[]
}

export interface QuoteCalculateResult {
  breakdown: BreakdownItem[]
  total: number
  matchedPeriod?: { id: string; name: string } | null
  pricingMode: 'standard' | 'period'
}

export interface QuoteShareItineraryDay {
  label: string
  line: string
}

export interface QuoteShareMeta {
  arrivalDate: string
  arrivalDisplay: string
  peopleLabel: string
  hotelLabel: string
  stayLabel: string
  transportLine: string
  title: string
  matchedPeriodName?: string
  markupPercent?: number
}

export interface QuoteSharePayload {
  meta: QuoteShareMeta
  itineraryDays: QuoteShareItineraryDay[]
  /** 客户报价（已含上浮，客户页只展示此项） */
  breakdown: BreakdownItem[]
  total: number
  agency?: Agency
  costTotal?: number
}

export interface QuoteShareSnapshot extends QuoteSharePayload {
  id: string
  createdAt: string
  expiresAt: string
}
