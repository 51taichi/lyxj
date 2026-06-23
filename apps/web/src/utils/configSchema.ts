export interface PriceFieldDef {
  key: string
  label: string
  /** 紧凑布局下的短标签 */
  shortLabel?: string
  /** 数字后的单位，如 元/人、元/天 */
  unit: string
}

export const ATTRACTION_PASSES_KEY = 'attractionPasses'

/** 向导中不单独成步，与 adults 合并为「请选择人数」 */
export const WIZARD_HIDDEN_DIM_IDS = ['children', 'rooms', 'vehicleNeeds', 'nights']

/** 各维度选项可维护的价格字段 */
export const DIMENSION_PRICE_FIELDS: Record<string, PriceFieldDef[]> = {
  attractions: [
    { key: 'adultTicket', label: '成人门票（元/人）', shortLabel: '成人', unit: '元/人' },
    { key: 'childTicket', label: '儿童门票（元/人）', shortLabel: '儿童', unit: '元/人' },
    { key: 'passAddon', label: '通票加价（元/人，0=无通票）', shortLabel: '通票', unit: '元/人' },
  ],
  vehicle: [
    { key: 'cityDay', label: '市内日租（元/天）', shortLabel: '市内', unit: '元/天' },
    { key: 'greatWall', label: '上长城（元/次）', shortLabel: '长城', unit: '元/次' },
    { key: 'pickup', label: '接站（元/次）', shortLabel: '接站', unit: '元/次' },
    { key: 'airport', label: '接机（元/次）', shortLabel: '接机', unit: '元/次' },
    { key: 'flag', label: '升旗（元/次）', shortLabel: '升旗', unit: '元/次' },
    { key: 'minPax', label: '最少人数', shortLabel: '最少', unit: '人' },
    { key: 'maxPax', label: '最多人数', shortLabel: '最多', unit: '人' },
  ],
  hotel: [{ key: 'roomNight', label: '每晚每间（元）', shortLabel: '每晚', unit: '元' }],
  guide: [{ key: 'feeDay', label: '导服（元/整单）', shortLabel: '导服', unit: '元' }],
}

/** 管理后台维度维护说明（比向导提示更具体） */
export const ADMIN_HINTS: Record<string, string> = {
  attractions: '每个景点维护成人/儿童门票与通票加价；淡旺季不覆盖景点价。',
  adults: '仅维护人数范围与默认值，无单价。',
  children: '仅维护人数范围与默认值，无单价。',
  vehicle:
    '各车型按「用车需求项」动态显示价格列：市内为元/天，其余为元/次。最少/最多人数用于车型适配。',
  vehicleDays: '仅维护天数范围与默认值，无单价。',
  vehicleNeeds:
    '维护需求名称即可；「市内」按天×用车天数，其余按次。保存后各车型自动出现对应价格列。',
  hotel: '每个酒店标准维护「每晚」单价（元/间/晚）。',
  guide: '每个导服选项维护整单导服费（元/整单）。',
  nights: '仅维护晚数范围与默认值，无单价。',
  rooms: '仅维护间数范围与默认值，无单价。',
}

export const STEP_HINTS: Record<string, string> = {
  attractions:
    '选择游玩景点；部分景点可勾选通票（通票仅按成人数计费）。具体价格在底部「实时报价」明细中查看。',
  adults: '填写成人和小孩人数；门票按人头与已选景点单价相乘后求和。',
  children: '与已选景点儿童单价相乘后求和（向导中与成人同一步填写）。',
  vehicle: '根据上一步总人数自动预选合适车型；不适配的车型保留显示但不可选。',
  vehicleDays: '填写用车天数，并勾选用车需求（市内按天，其余按次）。',
  vehicleNeeds: '市内按「车型价格/天 × 用车天数」；上长城、接站、接机、升旗等按次计费（向导中与天数同一步填写）。',
  hotel: '选择酒店标准，并填写住宿晚数与房间数。',
  nights: '与酒店单价、间数相乘得出住宿费（向导中与酒店标准同一步填写）。',
  rooms: '与酒店单价、晚数相乘得出住宿费（向导中与酒店标准同一步填写）。',
  guide: '导服为整单一次性费用；司兼导可为 0。',
}

export const DIMENSION_TYPE_LABELS: Record<string, string> = {
  multi_select: '多选',
  single_select: '单选',
  number: '数字',
}
