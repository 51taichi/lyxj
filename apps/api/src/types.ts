export interface PriceFields {
  [key: string]: number;
}

export interface DimensionOption {
  id: string;
  name: string;
  priceFields: PriceFields;
  isDefault?: boolean;
  linkedAttraction?: string;
  /** 用车需求：按天计费（×用车天数），默认按次 */
  isDailyRate?: boolean;
}

export interface Dimension {
  id: string;
  name: string;
  type: 'multi_select' | 'single_select' | 'number';
  sortOrder: number;
  required: boolean;
  min?: number;
  max?: number;
  defaultValue?: string | number | string[];
  options?: DimensionOption[];
}

export interface QuoteSelections {
  [dimensionId: string]: string | number | string[];
}

export interface BreakdownItem {
  label: string;
  amount: number;
  /** 汇总大类：门票 / 住宿 / 用车 / 餐补 / 导服 */
  category?: 'ticket' | 'hotel' | 'vehicle' | 'meal' | 'guide';
}

export interface QuoteResult {
  breakdown: BreakdownItem[];
  total: number;
  matchedPeriod?: { id: string; name: string } | null;
  pricingMode: 'standard' | 'period';
}

export interface PricePeriodOverride {
  dimensionId: string;
  optionId: string;
  priceFields: Partial<PriceFields>;
}

export interface PricePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  /** 覆盖标准餐补（可选） */
  mealAllowancePerPersonDay?: number;
  overrides: PricePeriodOverride[];
}

export interface QuoteShareMeta {
  arrivalDate: string;
  arrivalDisplay: string;
  peopleLabel: string;
  hotelLabel: string;
  stayLabel: string;
  transportLine: string;
  title: string;
  matchedPeriodName?: string;
  markupPercent?: number;
}

export interface QuoteShareItineraryDay {
  label: string;
  line: string;
}

export interface Agency {
  id: string;
  name: string;
  logoUrl: string;
  phone: string;
  address?: string;
  sortOrder: number;
}

export interface QuoteSharePayload {
  meta: QuoteShareMeta;
  itineraryDays: QuoteShareItineraryDay[];
  /** 客户报价（已含上浮） */
  breakdown: BreakdownItem[];
  total: number;
  agency?: Agency;
  /** 内部成本汇总（可选，客户页不展示） */
  costTotal?: number;
}

export interface QuoteShareSnapshot extends QuoteSharePayload {
  id: string;
  createdAt: string;
  expiresAt: string;
}

/** 系统配置（11 维度 + 公式 + 餐补按人按天 + 旅行社品牌 + 淡旺季） */
export interface SystemConfig {
  dimensions: Dimension[];
  /** 餐补：元/人/天 */
  mealAllowancePerPersonDay: number;
  formulaNote: string;
  agencies: Agency[];
  pricePeriods: PricePeriod[];
}
