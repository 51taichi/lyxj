import type { Agency, Dimension, SystemConfig } from '../types.js';

/** 首次启动写入 SQLite 的默认管理员（密码可在后台修改） */
export const defaultAdminUser = {
  id: 'u1',
  username: 'admin',
  password: 'admin123',
  role: 'admin' as const,
  name: '管理员',
};

export const DOCX_FORMULA_NOTE =
  'Σ(景点成人价)×成人数 + Σ(景点儿童价)×小孩数 + Σ(通票×人数) + Σ(用车需求价×天数) + 酒店×晚×间 + 导服(整单) + 餐补×司导人数×天数';

/** 业务员选择「通票」的景点 id 列表（非独立维度，存在 selections.attractionPasses） */
export const ATTRACTION_PASSES_KEY = 'attractionPasses';

/** 演示用占位价格（管理员后台可改） */
const pf = (fields: Record<string, number>) => fields;

export const dimensions: Dimension[] = [
  {
    id: 'attractions',
    name: '请选择景点',
    type: 'multi_select',
    sortOrder: 1,
    required: true,
    defaultValue: ['gugong', 'changcheng', 'yiheyuan', 'tiantan', 'yuanmingyuan', 'shengqi'],
    options: [
      { id: 'gugong', name: '故宫', priceFields: pf({ adultTicket: 60, childTicket: 30 }) },
      { id: 'changcheng', name: '长城', priceFields: pf({ adultTicket: 40, childTicket: 20 }) },
      { id: 'yiheyuan', name: '颐和园', priceFields: pf({ adultTicket: 30, childTicket: 15 }) },
      { id: 'tiantan', name: '天坛大门', priceFields: pf({ adultTicket: 15, childTicket: 0, passAddon: 15 }) },
      { id: 'yuanmingyuan', name: '圆明园大门', priceFields: pf({ adultTicket: 10, childTicket: 0, passAddon: 10 }) },
      { id: 'shengqi', name: '升旗', priceFields: pf({ adultTicket: 0, childTicket: 0 }) },
      { id: 'kejiguan', name: '科技馆', priceFields: pf({ adultTicket: 30, childTicket: 15 }) },
      { id: 'gongwangfu', name: '恭王府', priceFields: pf({ adultTicket: 40, childTicket: 20 }) },
      { id: 'yonghegong', name: '雍和宫', priceFields: pf({ adultTicket: 25, childTicket: 12 }) },
      { id: 'beihai', name: '北海大门', priceFields: pf({ adultTicket: 10, childTicket: 5 }) },
      { id: 'guobo', name: '国博', priceFields: pf({ adultTicket: 0, childTicket: 0 }) },
      { id: 'guozijian', name: '国子监', priceFields: pf({ adultTicket: 30, childTicket: 15 }) },
    ],
  },
  {
    id: 'adults',
    name: '请选择人数',
    type: 'number',
    sortOrder: 2,
    required: true,
    min: 1,
    max: 10,
    defaultValue: 2,
  },
  {
    id: 'children',
    name: '小孩人数',
    type: 'number',
    sortOrder: 3,
    required: true,
    min: 0,
    max: 10,
    defaultValue: 0,
  },
  {
    id: 'vehicle',
    name: '请选择车型',
    type: 'single_select',
    sortOrder: 4,
    required: true,
    options: [
      { id: 'v5', name: '5座', priceFields: pf({ cityDay: 600, greatWall: 150, pickup: 120, airport: 120, flag: 50, minPax: 1, maxPax: 4 }) },
      { id: 'v7', name: '7座', priceFields: pf({ cityDay: 800, greatWall: 200, pickup: 150, airport: 150, flag: 50, minPax: 1, maxPax: 6 }) },
      { id: 'v9', name: '9座', priceFields: pf({ cityDay: 950, greatWall: 250, pickup: 180, airport: 180, flag: 50, minPax: 1, maxPax: 8 }) },
      { id: 'v17', name: '17座', priceFields: pf({ cityDay: 1200, greatWall: 300, pickup: 200, airport: 200, flag: 80, minPax: 9, maxPax: 16 }) },
      { id: 'v20', name: '20座', priceFields: pf({ cityDay: 1400, greatWall: 350, pickup: 220, airport: 220, flag: 80, minPax: 17, maxPax: 19 }) },
      { id: 'v39', name: '39座', priceFields: pf({ cityDay: 2200, greatWall: 500, pickup: 300, airport: 300, flag: 100, minPax: 20, maxPax: 38 }) },
      { id: 'v49', name: '49座', priceFields: pf({ cityDay: 2800, greatWall: 600, pickup: 380, airport: 380, flag: 100, minPax: 39, maxPax: 48 }) },
    ],
  },
  {
    id: 'vehicleDays',
    name: '请选择用车',
    type: 'number',
    sortOrder: 5,
    required: true,
    min: 1,
    max: 6,
    defaultValue: 3,
  },
  {
    id: 'vehicleNeeds',
    name: '用车需求项',
    type: 'multi_select',
    sortOrder: 6,
    required: true,
    defaultValue: ['city'],
    options: [
      { id: 'city', name: '市内', priceFields: {} },
      { id: 'greatWall', name: '上长城', priceFields: {} },
      { id: 'pickup', name: '接站', priceFields: {} },
      { id: 'airport', name: '接机', priceFields: {} },
      { id: 'flag', name: '升旗', priceFields: {} },
    ],
  },
  {
    id: 'hotel',
    name: '请选择住宿',
    type: 'single_select',
    sortOrder: 7,
    required: true,
    defaultValue: 'h3l',
    options: [
      { id: 'h2', name: '连锁（2钻）', priceFields: { roomNight: 280 } },
      { id: 'h3', name: '商务（3钻）', priceFields: { roomNight: 400 } },
      { id: 'h3l', name: '轻奢（3钻）', priceFields: { roomNight: 480 }, isDefault: true },
      { id: 'h4', name: '豪华（4钻）', priceFields: { roomNight: 650 } },
      { id: 'h5', name: '五星', priceFields: { roomNight: 900 } },
    ],
  },
  {
    id: 'nights',
    name: '住宿晚数',
    type: 'number',
    sortOrder: 8,
    required: true,
    min: 1,
    max: 6,
    defaultValue: 3,
  },
  {
    id: 'rooms',
    name: '酒店间数',
    type: 'number',
    sortOrder: 9,
    required: true,
    min: 1,
    max: 6,
    defaultValue: 2,
  },
  {
    id: 'guide',
    name: '请选择导服方式',
    type: 'single_select',
    sortOrder: 10,
    required: true,
    defaultValue: 'driverGuide',
    options: [
      { id: 'driverGuide', name: '司兼导', priceFields: { feeDay: 0 }, isDefault: true },
      { id: 'guide', name: '独立导游', priceFields: { feeDay: 600 } },
      { id: 'goldGuide', name: '金牌导游', priceFields: { feeDay: 900 } },
    ],
  },
];

export const defaultAgencies: Agency[] = [
  { id: 'agency_yunyao', name: '云游', logoUrl: '', phone: '', address: '', sortOrder: 1 },
  { id: 'agency_chenyou', name: '宸游', logoUrl: '', phone: '', address: '', sortOrder: 2 },
  { id: 'agency_huijing', name: '汇京', logoUrl: '', phone: '', address: '', sortOrder: 3 },
  { id: 'agency_xinyu', name: '心语', logoUrl: '', phone: '', address: '', sortOrder: 4 },
  { id: 'agency_qingyang', name: '青杨', logoUrl: '', phone: '', address: '', sortOrder: 5 },
];

export function buildInitialConfig(): SystemConfig {
  return {
    dimensions: structuredClone(dimensions),
    mealAllowancePerPersonDay: 18,
    formulaNote: DOCX_FORMULA_NOTE,
    agencies: structuredClone(defaultAgencies),
    pricePeriods: [],
  };
}
