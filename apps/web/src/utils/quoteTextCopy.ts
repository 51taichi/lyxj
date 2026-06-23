export interface QuoteTextPriceLine {
  label: string
  pricePerPerson: number
  count: number
}

export interface QuoteTextCopyParams {
  days: number
  nights: number
  /** 如「5+1，0购物0自费」 */
  peopleTag: string
  hotelLabel: string
  priceLines: QuoteTextPriceLine[]
  promotionLine?: string
  finalTotal: number
  rooms: number
  vehicleDays: number
  guideLabel: string
}

function guideServiceNote(guideLabel: string): string {
  const isDriverGuide = /司兼导|司导/.test(guideLabel)
  const role = isDriverGuide ? '司兼导' : guideLabel || '导游'
  return `${role}，行程内市区9小时，上山10小时`
}

export function defaultPeopleTag(adults: number, children: number): string {
  if (children > 0) return `${adults}+${children}，0购物0自费`
  if (adults > 0) return `${adults}人，0购物0自费`
  return '0购物0自费'
}

export function buildQuoteTextCopy(params: QuoteTextCopyParams): string {
  const {
    days,
    nights,
    peopleTag,
    hotelLabel,
    priceLines,
    promotionLine,
    finalTotal,
    rooms,
    guideLabel,
  } = params

  const title = `尊享${days}天${nights}晚私人定制独立成团（${peopleTag}）`
  const lines: string[] = [title, '', hotelLabel || '—']

  for (const row of priceLines) {
    if (row.count <= 0 || row.pricePerPerson <= 0) continue
    lines.push(`${row.label}：${row.pricePerPerson}元/人（${row.count}人）`)
  }

  if (promotionLine?.trim()) {
    lines.push(promotionLine.trim())
  }

  lines.push(`优惠后总价：${Math.round(finalTotal)}元`, '', '费用包含：', '💰费用包含：')
  lines.push('🚌1.抵达北京机场/车站含接送机/站各一趟；')
  lines.push(`🏠2.${nights}晚酒店住宿，${rooms}间房`)
  lines.push('🍛3.每个床位一份早餐')
  lines.push(
    `🙋🏻‍♂4.行程${days}天导游服务(行程内市区9小时，上山10小时，因司导需开车，安全考虑。长城不陪爬）`,
  )
  lines.push(
    `🤵5.行程${days}天用车服务，共${days}天；(${guideServiceNote(guideLabel)}）`,
  )
  lines.push('🎫6.行程景点门票')
  lines.push('[福]7.旅行社责任险；')
  lines.push(
    '[庆祝]（注：因北京的特殊性，所以游玩顺序会根据实际情况进行调换，如节假日出行，故宫因政策原因限流或闭馆，换其他景点）',
  )

  return lines.join('\n')
}
