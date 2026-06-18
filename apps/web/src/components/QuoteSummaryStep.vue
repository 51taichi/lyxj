<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { api } from '../api/client'
import type { Agency, BreakdownItem, Dimension, QuoteSelections, QuoteShareSnapshot } from '../types'
import { BREAKDOWN_CATEGORY_LABELS, BREAKDOWN_CATEGORY_ORDER, type BreakdownCategory, groupBreakdown } from '../utils/breakdownGroups'
import {
  MARKUP_PERCENT_MAX,
  MARKUP_PERCENT_MIN,
  buildCustomerQuoteFromAmounts,
  computeMarkupPercentFromTotals,
  defaultCustomerAmounts,
} from '../utils/customerMarkup'
import { downloadBlob } from '../utils/exportImage'
import {
  buildDefaultItinerary,
  dayLabel,
  formatArrivalDisplay,
  formatDayLine,
  serializeItinerary,
  type ItineraryState,
} from '../utils/itinerary'
import { useItineraryPointerDrag } from '../utils/useItineraryPointerDrag'

const props = defineProps<{
  dimensions: Dimension[]
  selections: QuoteSelections
  breakdown: BreakdownItem[]
  total: number
  adults: number
  children: number
}>()

const emit = defineEmits<{
  confirmed: [payload: { itinerary: Record<string, string[]>; arrivalDate: string }]
  'pricing-change': [
    payload: {
      breakdown: BreakdownItem[]
      total: number
      matchedPeriod: { id: string; name: string } | null
    },
  ]
}>()

const itinerary = ref<ItineraryState>({ days: [], pool: [] })
const confirmed = ref(false)
const meta = reactive({ arrivalDate: '' })
const shareLoading = ref(false)
const shareError = ref('')
const shareResult = ref<{ id: string; expiresAt: string } | null>(null)
const imageLoading = ref(false)
const pdfLoading = ref(false)
const agencies = ref<Agency[]>([])
const selectedAgencyId = ref('')
const costDetail = ref<BreakdownItem[]>([])
const matchedPeriod = ref<{ id: string; name: string } | null>(null)
const customerAmounts = reactive<Partial<Record<BreakdownCategory, number>>>({})
const costLoading = ref(false)

const selectedAgency = computed(() => agencies.value.find((a) => a.id === selectedAgencyId.value))

const shareUrl = computed(() =>
  shareResult.value ? `${window.location.origin}/share/${shareResult.value.id}` : '',
)

onMounted(async () => {
  try {
    const { agencies: list } = await api.getAgencies()
    agencies.value = list
    if (list.length) selectedAgencyId.value = list[0].id
  } catch {
    agencies.value = []
  }
})

const {
  dragSession,
  floatPos,
  isSource,
  isPlaceholder,
  onChipPointerDown,
} = useItineraryPointerDrag(itinerary, () => !confirmed.value)

watch(
  () => [
    JSON.stringify(props.selections.attractions ?? []),
    props.selections.vehicleDays,
    props.selections.vehicleNeeds,
  ],
  () => {
    if (!confirmed.value) {
      itinerary.value = buildDefaultItinerary(props.selections, props.dimensions)
    }
  },
  { immediate: true },
)

const hotelLabel = computed(() => {
  const dim = props.dimensions.find((d) => d.id === 'hotel')
  const key = props.selections.hotel
  const opt = dim?.options?.find((o) => o.id === key || o.name === key)
  return opt?.name ?? ''
})

const vehicleLabel = computed(() => {
  const dim = props.dimensions.find((d) => d.id === 'vehicle')
  const key = props.selections.vehicle
  const opt = dim?.options?.find((o) => o.id === key || o.name === key)
  return opt?.name ?? ''
})

const guideLabel = computed(() => {
  const dim = props.dimensions.find((d) => d.id === 'guide')
  const key = props.selections.guide
  const opt = dim?.options?.find((o) => o.id === key || o.name === key)
  return opt?.name ?? ''
})

const nights = computed(() => Number(props.selections.nights ?? 0))
const rooms = computed(() => Number(props.selections.rooms ?? 0))
const vehicleDays = computed(() => Number(props.selections.vehicleDays ?? 0))

const peopleLabel = computed(() => `${props.adults}大${props.children ? `${props.children}小` : ''}`)

const stayLabel = computed(() => {
  if (!rooms.value || !nights.value) return ''
  return `${rooms.value}间 · ${nights.value}晚`
})

const transportLine = computed(() => {
  if (!vehicleLabel.value) return ''
  const parts = [vehicleLabel.value]
  if (guideLabel.value) parts.push(guideLabel.value)
  if (vehicleDays.value) parts.push(`${vehicleDays.value}天行程`)
  return parts.join(' · ')
})

const arrivalDisplay = computed(() => formatArrivalDisplay(meta.arrivalDate))
const hasArrivalDate = computed(() => Boolean(meta.arrivalDate?.trim()))

const costGrouped = computed(() => groupBreakdown(costDetail.value))
const costTotal = computed(() =>
  Math.round(costDetail.value.reduce((s, i) => s + i.amount, 0) * 100) / 100,
)
const customerQuote = computed(() => buildCustomerQuoteFromAmounts(costGrouped.value, customerAmounts))

const effectiveMarkupPercent = computed(() =>
  computeMarkupPercentFromTotals(costTotal.value, customerQuote.value.total),
)

const markupPercentDisplay = computed(() => {
  const n = effectiveMarkupPercent.value
  if (!Number.isFinite(n)) return '0'
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
})

const markupBarFill = computed(() => {
  const p = Math.min(MARKUP_PERCENT_MAX, Math.max(MARKUP_PERCENT_MIN, effectiveMarkupPercent.value))
  return ((p - MARKUP_PERCENT_MIN) / (MARKUP_PERCENT_MAX - MARKUP_PERCENT_MIN)) * 100
})

const markupOutOfRange = computed(
  () =>
    effectiveMarkupPercent.value < MARKUP_PERCENT_MIN ||
    effectiveMarkupPercent.value > MARKUP_PERCENT_MAX,
)

const compareRows = computed(() => {
  const costMap = new Map(costGrouped.value.map((i) => [i.category, i.amount]))
  return BREAKDOWN_CATEGORY_ORDER.filter(
    (cat) => (costMap.get(cat) ?? 0) > 0 || (customerAmounts[cat] ?? 0) > 0,
  ).map((cat) => ({
    category: cat,
    label: BREAKDOWN_CATEGORY_LABELS[cat],
    cost: costMap.get(cat) ?? 0,
    customer: customerAmounts[cat] ?? 0,
  }))
})

function syncCustomerAmountsFromCost() {
  Object.assign(customerAmounts, defaultCustomerAmounts(costGrouped.value))
}

function updateCustomerAmount(category: BreakdownCategory, raw: string) {
  const n = parseInt(raw, 10)
  customerAmounts[category] = Math.max(0, Number.isFinite(n) ? n : 0)
  shareResult.value = null
}

async function syncCostBreakdown() {
  costLoading.value = true
  try {
    if (!meta.arrivalDate) {
      costDetail.value = [...props.breakdown]
      matchedPeriod.value = null
    } else {
      const res = await api.calculate(props.selections, meta.arrivalDate)
      costDetail.value = res.breakdown
      matchedPeriod.value = res.matchedPeriod ?? null
    }
  } catch {
    costDetail.value = [...props.breakdown]
    matchedPeriod.value = null
  } finally {
    costLoading.value = false
    emit('pricing-change', {
      breakdown: costDetail.value,
      total: costTotal.value,
      matchedPeriod: matchedPeriod.value,
    })
  }
}

watch(
  () => costGrouped.value.map((i) => `${i.category}:${i.amount}`).join('|'),
  () => {
    syncCustomerAmountsFromCost()
  },
  { immediate: true },
)

watch(
  () => [meta.arrivalDate, props.breakdown, JSON.stringify(props.selections)],
  () => {
    void syncCostBreakdown()
  },
  { immediate: true },
)

watch(
  () => JSON.stringify(customerAmounts),
  () => {
    shareResult.value = null
  },
)

watch(costTotal, () => {
  shareResult.value = null
})

function confirmItinerary() {
  if (!hasArrivalDate.value) {
    shareError.value = '请填写抵达日期'
    return
  }
  confirmed.value = true
  shareResult.value = null
  shareError.value = ''
  emit('confirmed', {
    itinerary: serializeItinerary(itinerary.value),
    arrivalDate: meta.arrivalDate,
  })
}

function editItinerary() {
  confirmed.value = false
  shareResult.value = null
  shareError.value = ''
}

function buildSharePayload(): QuoteShareSnapshot {
  const itineraryDays = itinerary.value.days.map((day, index) => ({
    label: dayLabel(index),
    line: formatDayLine(day) || '—',
  }))
  return {
    id: '',
    createdAt: '',
    expiresAt: '',
    meta: {
      arrivalDate: meta.arrivalDate,
      arrivalDisplay: arrivalDisplay.value,
      peopleLabel: peopleLabel.value,
      hotelLabel: hotelLabel.value,
      stayLabel: stayLabel.value,
      transportLine: transportLine.value,
      title: `${vehicleDays.value || itinerary.value.days.length}日定制游`,
      matchedPeriodName: matchedPeriod.value?.name,
      markupPercent: effectiveMarkupPercent.value,
    },
    itineraryDays,
    breakdown: customerQuote.value.items,
    total: customerQuote.value.total,
    costTotal: costTotal.value,
    agency: selectedAgency.value,
  }
}

async function ensureShare(): Promise<boolean> {
  if (shareResult.value) return true
  if (!hasArrivalDate.value) {
    shareError.value = '请填写抵达日期'
    return false
  }
  if (!selectedAgencyId.value) {
    shareError.value = '请选择旅行社品牌'
    return false
  }
  shareLoading.value = true
  shareError.value = ''
  try {
    const draft = buildSharePayload()
    const { id: _id, createdAt: _c, expiresAt: _e, ...body } = draft
    void _id
    void _c
    void _e
    shareResult.value = await api.createShareLink(body)
    return true
  } catch (e) {
    shareError.value = e instanceof Error ? e.message : '生成失败'
    return false
  } finally {
    shareLoading.value = false
  }
}

async function generatePage() {
  if (!(await ensureShare())) return
  try {
    await navigator.clipboard.writeText(shareUrl.value)
  } catch {
    window.prompt('链接已生成，请复制发送给客户：', shareUrl.value)
  }
}

async function downloadShareImage() {
  if (!(await ensureShare())) return
  imageLoading.value = true
  shareError.value = ''
  try {
    const blob = await api.exportImage(shareResult.value!.id)
    downloadBlob(blob, `定制方案-${shareResult.value!.id}.png`)
  } catch (e) {
    shareError.value = e instanceof Error ? e.message : '图片生成失败'
  } finally {
    imageLoading.value = false
  }
}

async function downloadSharePdf() {
  if (!(await ensureShare())) return
  pdfLoading.value = true
  shareError.value = ''
  try {
    const blob = await api.exportPdf(shareResult.value!.id)
    downloadBlob(blob, `定制方案-${shareResult.value!.id}.pdf`)
  } catch (e) {
    shareError.value = e instanceof Error ? e.message : 'PDF 生成失败'
  } finally {
    pdfLoading.value = false
  }
}
</script>

<template>
  <section class="step-panel step-panel--flat pax-step summary-step">
    <p v-if="confirmed" class="step-hint step-hint--compact summary-step__hint summary-step__hint--ok">
      行程已确认，选择品牌后可生成页面、图片或 PDF 发给客户
    </p>

    <div class="pax-row" :class="{ 'pax-row--required-missing': !hasArrivalDate }">
      <span class="pax-row__label">抵达日期<span class="field-required" aria-hidden="true">*</span>：</span>
      <div class="pax-row__control">
        <input
          v-model="meta.arrivalDate"
          class="summary-field summary-field--date"
          type="date"
          required
          aria-required="true"
          @input="shareError = ''"
        />
      </div>
    </div>
    <p v-if="!hasArrivalDate" class="step-hint step-hint--warn step-hint--compact summary-step__warn">
      请填写抵达日期
    </p>

    <div class="summary-meta-grid">
      <div class="pax-row pax-row--meta">
        <span class="pax-row__label">出行人数：</span>
        <div class="pax-row__control summary-field-text">{{ peopleLabel }}</div>
      </div>

      <div class="pax-row pax-row--meta">
        <span class="pax-row__label">酒店标准：</span>
        <div class="pax-row__control summary-field-text">{{ hotelLabel || '—' }}</div>
      </div>

      <div class="pax-row pax-row--meta">
        <span class="pax-row__label">住宿：</span>
        <div class="pax-row__control summary-field-text">{{ stayLabel || '—' }}</div>
      </div>

      <div class="pax-row pax-row--meta">
        <span class="pax-row__label">用车导服：</span>
        <div class="pax-row__control summary-field-text">{{ transportLine || '—' }}</div>
      </div>
    </div>

    <!-- 每日行程 -->
    <template v-for="(day, dayIndex) in itinerary.days" :key="dayIndex">
      <div v-if="confirmed" class="pax-row pax-row--wrap">
        <span class="pax-row__label">{{ dayLabel(dayIndex) }}：</span>
        <div class="pax-row__control summary-field-text">{{ formatDayLine(day) || '—' }}</div>
      </div>
      <div v-else class="pax-row pax-row--wrap">
        <span class="pax-row__label">{{ dayLabel(dayIndex) }}：</span>
        <div class="pax-row__control">
          <div class="itinerary-zone">
            <template v-for="(item, index) in day" :key="item.id">
              <span
                v-if="isPlaceholder(dayIndex, index)"
                class="itinerary-placeholder"
                data-day-slot
                :data-day-index="dayIndex"
                :data-slot-index="index"
              >{{ dragSession?.item.label }}</span>
              <span
                class="itinerary-chip"
                :class="{ 'itinerary-chip--ghost': isSource(dayIndex, index) }"
                data-day-slot
                :data-day-index="dayIndex"
                :data-slot-index="index"
                @pointerdown="onChipPointerDown(dayIndex, index, $event)"
              >
                <span class="itinerary-chip__text">{{ item.label }}</span>
              </span>
            </template>
            <span
              v-if="isPlaceholder(dayIndex, day.length)"
              class="itinerary-placeholder"
              data-day-slot
              :data-day-index="dayIndex"
              :data-slot-index="day.length"
            >{{ dragSession?.item.label }}</span>
            <span
              v-if="!day.length && !isPlaceholder(dayIndex, 0)"
              class="itinerary-zone__empty"
              data-day-slot
              :data-day-index="dayIndex"
              :data-slot-index="0"
            >拖动景点到此处</span>
            <span
              class="itinerary-zone__tail"
              data-day-slot
              :data-day-index="dayIndex"
              :data-slot-index="day.length"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </template>

    <div class="summary-divider" role="separator" aria-label="费用汇总" />

    <p v-if="matchedPeriod" class="step-hint step-hint--compact summary-step__period">
      已命中价格段：{{ matchedPeriod.name }}
    </p>
    <p v-else-if="meta.arrivalDate && !costLoading" class="step-hint step-hint--compact">
      抵达日期未命中淡旺季，使用标准价
    </p>

    <div class="summary-markup-row">
      <div class="summary-markup-row__head">
        <span class="summary-markup-row__label">上浮比例</span>
        <span
          class="summary-markup-row__value"
          :class="{ 'summary-markup-row__value--warn': markupOutOfRange }"
        >
          {{ markupPercentDisplay }}%
        </span>
      </div>
      <div
        class="summary-markup-row__bar"
        aria-hidden="true"
        :style="{ '--markup-pct': `${markupBarFill}%` }"
      />
      <div class="summary-markup-row__scale">
        <span>{{ MARKUP_PERCENT_MIN }}%</span>
        <span>{{ MARKUP_PERCENT_MAX }}%</span>
      </div>
      <p v-if="markupOutOfRange" class="step-hint step-hint--warn step-hint--compact summary-markup-row__hint">
        当前比例超出 {{ MARKUP_PERCENT_MIN }}% ~ {{ MARKUP_PERCENT_MAX }}% 建议范围
      </p>
    </div>

    <div class="summary-compare">
      <div class="summary-compare__row summary-compare__row--head">
        <div class="summary-compare__col">
          <span class="summary-compare__col-title">成本</span>
        </div>
        <div class="summary-compare__col summary-compare__col--customer">
          <span class="summary-compare__col-title">客户报价</span>
        </div>
      </div>

      <div v-for="row in compareRows" :key="row.category" class="summary-compare__row">
        <div class="summary-compare__col">
          <span class="summary-compare__label">{{ row.label }}</span>
          <span class="summary-compare__amt">¥{{ row.cost.toLocaleString() }}</span>
        </div>
        <div class="summary-compare__col summary-compare__col--customer">
          <span class="summary-compare__label">{{ row.label }}</span>
          <label class="summary-price-field" :aria-label="`${row.label}客户报价`">
            <input
              class="summary-price-field__input"
              type="number"
              inputmode="numeric"
              min="0"
              step="1"
              :value="row.customer"
              @input="updateCustomerAmount(row.category, ($event.target as HTMLInputElement).value)"
            />
            <span class="summary-price-field__unit">元</span>
          </label>
        </div>
      </div>

      <div class="summary-compare__row summary-compare__row--total">
        <div class="summary-compare__col">
          <span class="summary-compare__label">合计</span>
          <span class="summary-compare__amt summary-compare__amt--total">¥{{ costTotal.toLocaleString() }}</span>
        </div>
        <div class="summary-compare__col summary-compare__col--customer">
          <span class="summary-compare__label">合计</span>
          <span class="summary-compare__amt summary-compare__amt--total">
            ¥{{ customerQuote.total.toLocaleString() }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="confirmed && agencies.length" class="agency-picker">
      <p class="agency-picker__label">请选择旅行社品牌</p>
      <div class="agency-picker__list">
        <button
          v-for="agency in agencies"
          :key="agency.id"
          type="button"
          class="agency-card"
          :class="{ 'agency-card--active': selectedAgencyId === agency.id }"
          @click="selectedAgencyId = agency.id"
        >
          <img v-if="agency.logoUrl" class="agency-card__logo" :src="agency.logoUrl" :alt="agency.name" />
          <span v-else class="agency-card__placeholder">{{ agency.name.slice(0, 1) }}</span>
          <span class="agency-card__name">{{ agency.name }}</span>
        </button>
      </div>
    </div>

    <div v-if="!confirmed" class="summary-step__actions">
      <button
        type="button"
        class="btn-primary btn-primary--inline"
        :disabled="!hasArrivalDate"
        @click="confirmItinerary"
      >
        确认行程排列
      </button>
    </div>

    <template v-else>
      <div class="summary-step__actions summary-step__actions--generate">
        <button
          type="button"
          class="btn-outline summary-step__gen-btn"
          :disabled="shareLoading || imageLoading || pdfLoading"
          @click="generatePage"
        >
          {{ shareLoading ? '生成中…' : '生成页面' }}
        </button>
        <button
          type="button"
          class="btn-outline summary-step__gen-btn"
          :disabled="shareLoading || imageLoading || pdfLoading"
          @click="downloadShareImage"
        >
          {{ imageLoading ? '生成中…' : '生成图片' }}
        </button>
        <button
          type="button"
          class="btn-outline summary-step__gen-btn"
          :disabled="shareLoading || imageLoading || pdfLoading"
          @click="downloadSharePdf"
        >
          {{ pdfLoading ? '生成中…' : '生成 PDF' }}
        </button>
      </div>

      <div class="summary-step__actions summary-step__actions--edit">
        <button type="button" class="btn-outline summary-step__edit-btn" @click="editItinerary">
          重新编辑
        </button>
      </div>
    </template>

    <p v-if="shareError" class="step-hint step-hint--warn summary-step__warn">{{ shareError }}</p>

    <div v-if="shareResult && shareUrl" class="share-link-box">
      <span class="share-link-box__label">客户页面链接（生成页面时已复制）</span>
      <input class="share-link-box__input" :value="shareUrl" readonly @focus="($event.target as HTMLInputElement).select()" />
    </div>

    <!-- 拖动中的「元神」跟随指针 -->
    <Teleport to="body">
      <span
        v-if="dragSession"
        class="itinerary-chip itinerary-chip--float"
        :style="{
          left: `${floatPos.x}px`,
          top: `${floatPos.y}px`,
        }"
      >{{ dragSession.item.label }}</span>
    </Teleport>
  </section>
</template>
