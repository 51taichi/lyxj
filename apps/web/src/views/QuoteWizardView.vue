<template>
  <div class="phone-frame">
    <div class="page-bg">
      <img src="/proto-assets/goals/page-bg.png" alt="" />
    </div>

    <div v-if="loading" class="page-loading">加载核价配置…</div>
    <div v-else-if="loadError" class="page-error">
      <p>{{ loadError }}</p>
      <p class="step-hint">请确认 API 已启动：<code>cd apps/api && npm run dev</code></p>
      <button type="button" class="btn-primary btn-primary--inline" style="margin-top: calc(12px * var(--scale))" @click="init">
        重试
      </button>
    </div>

    <div v-else class="quote-layout">
      <header class="quote-top page-scroll">
        <div class="hero">
          <h1 class="hero__title">
            <img class="hero__logo" src="/assets/pricing-tool-logo.png" alt="" />
            定制核价工具
          </h1>
          <img class="hero__monster" src="/proto-assets/goals/hero-monster.png" alt="" />
        </div>

        <section class="summary-card">
          <img class="summary-card__bg" src="/proto-assets/goals/summary-card-bg.png" alt="" />
          <div class="summary-card__content">
            <div>
              <div class="summary-card__label">当前参考报价</div>
              <div>
                <span class="summary-card__value">{{ totalDisplay }}</span>
                <span class="summary-card__unit">元</span>
              </div>
              <div class="summary-card__goal">
                {{ isSummaryStep ? '已完成' : `第 ${step + 1} / ${wizardStepCount} 步` }} · {{ steps[step]?.name }}
              </div>
            </div>
            <div class="summary-card__ring circle-progress" role="img" :aria-label="`向导进度 ${progressPercent}%`">
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle
                  class="summary-ring__track"
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke-width="8"
                />
                <circle
                  class="summary-ring__fill"
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke-width="8"
                  stroke-linecap="round"
                  :stroke-dasharray="ringCircumference"
                  :stroke-dashoffset="ringDashOffset"
                />
              </svg>
              <div class="circle-progress__label">
                <span class="circle-progress__value">{{ progressPercent }}</span>
                <span class="circle-progress__text">%</span>
              </div>
            </div>
          </div>
        </section>

        <div class="wizard-progress">
          <div
            class="progress-figma"
            role="progressbar"
            :aria-valuenow="progressPercent"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`向导进度 ${progressPercent}%`"
          >
            <img
              class="progress-figma__fill"
              src="/proto-assets/goals/progress-fill-70.png"
              alt=""
              :style="{ width: progressPercent + '%' }"
            />
          </div>
        </div>

        <div class="section-header">
          <h2 class="section-header__title">{{ steps[step]?.name }}</h2>
          <RouterLink class="section-header__link top-link" to="/admin/login">管理员</RouterLink>
        </div>

        <p v-if="stepHint" class="step-hint step-hint--compact">{{ stepHint }}</p>
      </header>

      <main class="quote-scroll page-scroll">
      <p v-if="currentDim?.required && !canProceed" class="step-hint step-hint--warn">
        {{
          currentDim.id === 'attractions'
            ? '请至少选择一个景点'
            : isPaxStep
              ? '请填写成人和小孩人数'
              : isHotelStep
                ? '请选择酒店标准并填写住宿晚数、房间数'
                : isVehicleUseStep
                  ? '请填写用车天数并至少选择一项用车需求'
                  : `请完成「${currentDim.name}」`
        }}
      </p>
      <!-- 景点：名称 + 通票 -->
      <section v-if="currentDim?.id === 'attractions'" class="step-panel step-panel--flat spot-grid">
        <article
          v-for="opt in currentDim.options"
          :key="opt.id"
          class="spot-card"
          :class="{ 'spot-card--active': isSelected('attractions', opt) }"
        >
          <div class="spot-card__row">
            <button type="button" class="spot-card__select" @click="toggleOption(currentDim, opt)">
              <span class="spot-card__name">{{ opt.name }}</span>
              <span v-if="isFreeSpot(opt)" class="spot-card__free">免费</span>
            </button>
            <div v-if="hasPass(opt)" class="spot-card__pass-slot">
              <button
                v-if="isSelected('attractions', opt)"
                type="button"
                class="spot-card__pass-tag"
                :class="{ 'spot-card__pass-tag--on': isPassSelected(opt.id) }"
                @click.stop="togglePass(opt.id)"
              >
                <span class="spot-card__pass-check" aria-hidden="true">
                  <svg viewBox="0 0 12 12" width="12" height="12" fill="none">
                    <path
                      d="M2.5 6.2 5 8.7 9.5 3.8"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <span>通票</span>
              </button>
              <span v-else class="spot-card__pass-tag spot-card__pass-tag--hold" aria-hidden="true">
                <span class="spot-card__pass-check" />
                <span>通票</span>
              </span>
            </div>
          </div>
        </article>
      </section>

      <!-- 人数：成人 + 小孩同一步 -->
      <section v-else-if="isPaxStep" class="step-panel step-panel--flat pax-step">
        <div class="pax-row">
          <span class="pax-row__label">成人：</span>
          <div class="number-stepper">
            <button type="button" class="number-stepper__btn" @click="changeNumber('adults', -1)">−</button>
            <span class="number-stepper__value">{{ paxDisplay('adults') }}</span>
            <button type="button" class="number-stepper__btn" @click="changeNumber('adults', 1)">+</button>
          </div>
        </div>
        <div class="pax-row">
          <span class="pax-row__label">小孩：</span>
          <div class="number-stepper">
            <button type="button" class="number-stepper__btn" @click="changeNumber('children', -1)">−</button>
            <span class="number-stepper__value">{{ paxDisplay('children') }}</span>
            <button type="button" class="number-stepper__btn" @click="changeNumber('children', 1)">+</button>
          </div>
        </div>
      </section>

      <!-- 车型：不适配当前人数的选项保留但不可选 -->
      <section v-else-if="currentDim?.id === 'vehicle'" class="step-panel step-panel--flat">
        <button
          v-for="opt in visibleOptions"
          :key="opt.id"
          type="button"
          class="vehicle-card"
          :class="{
            'vehicle-card--active': isSelected('vehicle', opt),
            'vehicle-card--disabled': !isVehicleOptionAvailable(opt),
          }"
          :disabled="!isVehicleOptionAvailable(opt)"
          @click="toggleOption(currentDim, opt)"
        >
          <div class="vehicle-card__name">{{ opt.name }}</div>
          <div class="vehicle-card__meta">{{ vehicleCapacityLabel(opt) }}</div>
        </button>
      </section>

      <!-- 住宿：酒店标准 + 晚数 + 间数同一步 -->
      <section v-else-if="isHotelStep" class="step-panel step-panel--flat pax-step">
        <div class="pax-row pax-row--wrap">
          <span class="pax-row__label">酒店标准：</span>
          <div class="pax-row__control">
            <div class="option-grid">
              <button
                v-for="opt in hotelOptions"
                :key="opt.id"
                type="button"
                class="option-chip"
                :class="{ 'option-chip--active': isSelected('hotel', opt) }"
                @click="toggleHotelOption(opt)"
              >{{ opt.name }}</button>
            </div>
          </div>
        </div>
        <div class="pax-row">
          <span class="pax-row__label">住宿几晚：</span>
          <div class="pax-row__control">
            <div class="number-stepper">
              <button type="button" class="number-stepper__btn" @click="changeNumber('nights', -1)">−</button>
              <span class="number-stepper__value">{{ stayDisplay('nights') }}</span>
              <button type="button" class="number-stepper__btn" @click="changeNumber('nights', 1)">+</button>
            </div>
          </div>
        </div>
        <div class="pax-row">
          <span class="pax-row__label">房间数：</span>
          <div class="pax-row__control">
            <div class="number-stepper">
              <button type="button" class="number-stepper__btn" @click="changeNumber('rooms', -1)">−</button>
              <span class="number-stepper__value">{{ stayDisplay('rooms') }}</span>
              <button type="button" class="number-stepper__btn" @click="changeNumber('rooms', 1)">+</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 用车：天数 + 需求同一步 -->
      <section v-else-if="isVehicleUseStep" class="step-panel step-panel--flat pax-step">
        <div class="pax-row">
          <span class="pax-row__label">用车天数：</span>
          <div class="pax-row__control">
            <div class="number-stepper">
              <button type="button" class="number-stepper__btn" @click="changeNumber('vehicleDays', -1)">−</button>
              <span class="number-stepper__value">{{ vehicleDaysDisplay }}</span>
              <button type="button" class="number-stepper__btn" @click="changeNumber('vehicleDays', 1)">+</button>
            </div>
          </div>
        </div>
        <div class="pax-row pax-row--wrap">
          <span class="pax-row__label">用车需求：</span>
          <div class="pax-row__control">
            <div class="option-grid">
              <button
                v-for="opt in vehicleNeedsOptions"
                :key="opt.id"
                type="button"
                class="option-chip"
                :class="{ 'option-chip--active': isSelected('vehicleNeeds', opt) }"
                @click="toggleVehicleNeed(opt)"
              >{{ opt.name }}</button>
            </div>
          </div>
        </div>
      </section>

      <!-- 通用数字步 -->
      <section v-else-if="currentDim?.type === 'number'" class="step-panel step-panel--flat">
        <div class="number-stepper">
          <button type="button" class="number-stepper__btn" @click="changeNumber(currentDim.id, -1)">−</button>
          <span class="number-stepper__value">{{ selections[currentDim.id] }}</span>
          <button type="button" class="number-stepper__btn" @click="changeNumber(currentDim.id, 1)">+</button>
        </div>
      </section>

      <!-- 通用多选/单选 chips -->
      <section v-else-if="currentDim" class="step-panel step-panel--flat">
        <div class="option-grid">
          <button
            v-for="opt in visibleOptions"
            :key="opt.id"
            type="button"
            class="option-chip"
            :class="{ 'option-chip--active': isSelected(currentDim.id, opt) }"
            @click="toggleOption(currentDim, opt)"
          >{{ opt.name }}</button>
        </div>
      </section>

      <!-- 汇总步：行程拖拽 + 报价单预览 -->
      <QuoteSummaryStep
        v-else-if="isSummaryStep"
        :dimensions="dimensions"
        :selections="selections"
        :breakdown="breakdown"
        :total="total"
        :adults="adults"
        :children="children"
        @confirmed="onItineraryConfirmed"
        @pricing-change="onSummaryPricingChange"
      />
      </main>
    </div>

    <Transition name="price-backdrop">
      <div
        v-if="showBreakdown && displayBreakdown.length"
        class="price-sheet-backdrop"
        aria-hidden="true"
        @click="showBreakdown = false"
      />
    </Transition>

    <div v-if="!loading && !loadError" class="price-dock">
      <div
        class="price-sheet"
        :class="{ 'price-sheet--open': showBreakdown && displayBreakdown.length > 0 }"
        role="dialog"
        aria-label="实时明细"
      >
        <div class="price-sheet__handle" aria-hidden="true" />
        <div class="price-sheet__head">实时明细（{{ displayBreakdown.length }} 项）</div>
        <div class="price-sheet__body">
          <div v-for="item in displayBreakdown" :key="item.label" class="price-sheet__row">
            <span class="price-sheet__label">{{ item.label }}</span>
            <span class="price-sheet__amount">¥{{ item.amount.toLocaleString() }}</span>
          </div>
          <div class="price-sheet__total">
            <span>合计</span>
            <span>¥{{ displayTotal.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <div class="price-dock__foot">
        <div v-if="step > 0 || step < steps.length - 1" class="wizard-actions wizard-actions--dock">
          <button v-if="step > 0" type="button" class="btn-outline" @click="step--">上一步</button>
          <button
            v-if="step < steps.length - 1"
            type="button"
            class="btn-primary btn-primary--inline"
            :disabled="!canProceed"
            @click="goNext"
          >下一步</button>
        </div>

        <button
          type="button"
          class="price-bar"
          :aria-expanded="showBreakdown"
          @click="toggleBreakdown"
        >
        <div class="price-bar__main">
          <span class="price-bar__label">实时报价{{ priceBarMeta ? ` · ${priceBarMeta}` : '' }}</span>
          <span v-if="displayBreakdown.length" class="price-bar__hint">{{ showBreakdown ? '收起明细' : '查看明细' }}</span>
        </div>
        <div class="price-bar__right">
          <span class="price-bar__total">¥{{ displayTotal.toLocaleString() }}</span>
          <span v-if="displayBreakdown.length" class="price-bar__chev" aria-hidden="true">{{ showBreakdown ? '▾' : '▴' }}</span>
        </div>
      </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import QuoteSummaryStep from '../components/QuoteSummaryStep.vue'
import { api } from '../api/client'
import type { BreakdownItem, Dimension, DimensionOption, QuoteSelections } from '../types'
import { STEP_HINTS, ATTRACTION_PASSES_KEY, WIZARD_HIDDEN_DIM_IDS } from '../utils/configSchema'

const dimensions = ref<Dimension[]>([])
const selections = reactive<QuoteSelections>({})
const breakdown = ref<BreakdownItem[]>([])
const loading = ref(true)
const loadError = ref('')
const total = ref(0)
const step = ref(0)
const showBreakdown = ref(false)
const confirmedItinerary = ref<Record<string, string[]> | null>(null)
const summaryPricing = ref<{
  breakdown: BreakdownItem[]
  total: number
  matchedPeriod: { id: string; name: string } | null
} | null>(null)

const displayBreakdown = computed(() =>
  isSummaryStep.value && summaryPricing.value ? summaryPricing.value.breakdown : breakdown.value,
)
const displayTotal = computed(() =>
  isSummaryStep.value && summaryPricing.value ? summaryPricing.value.total : total.value,
)

const steps = computed(() => [
  ...wizardDimensions.value.map((d) => ({
    id: d.id,
    name:
      d.id === 'adults'
        ? '请选择人数'
        : d.id === 'hotel'
          ? '请选择住宿'
          : d.id === 'vehicleDays'
            ? '请选择用车'
            : d.name,
  })),
  { id: 'summary', name: '方案汇总' },
])

const wizardDimensions = computed(() =>
  dimensions.value.filter((d) => !WIZARD_HIDDEN_DIM_IDS.includes(d.id)),
)
const wizardStepCount = computed(() => wizardDimensions.value.length)

const currentStepId = computed(() => steps.value[step.value]?.id)
const currentDim = computed(() => dimensions.value.find((d) => d.id === currentStepId.value))
const isSummaryStep = computed(() => currentStepId.value === 'summary')
const isPaxStep = computed(() => currentStepId.value === 'adults')
const isHotelStep = computed(() => currentStepId.value === 'hotel')
const isVehicleUseStep = computed(() => currentStepId.value === 'vehicleDays')
const hotelDim = computed(() => dimensions.value.find((d) => d.id === 'hotel'))
const hotelOptions = computed(() => hotelDim.value?.options ?? [])
const vehicleNeedsDim = computed(() => dimensions.value.find((d) => d.id === 'vehicleNeeds'))
const vehicleNeedsOptions = computed(() => vehicleNeedsDim.value?.options ?? [])
const vehicleDaysDisplay = computed(() => {
  const val = selections.vehicleDays
  return val === undefined ? 0 : Number(val)
})
const stepHint = computed(() => (currentStepId.value ? STEP_HINTS[currentStepId.value] : ''))
const progressPercent = computed(() => {
  const total = wizardStepCount.value
  if (!total) return 0
  if (isSummaryStep.value) return 100
  return Math.round((step.value / total) * 100)
})

const RING_RADIUS = 42
const ringCircumference = 2 * Math.PI * RING_RADIUS
const ringDashOffset = computed(
  () => ringCircumference * (1 - progressPercent.value / 100),
)
const totalDisplay = computed(() => total.value.toLocaleString())
const adults = computed(() => Number(selections.adults ?? 0))
const children = computed(() => Number(selections.children ?? 0))

const priceBarMeta = computed(() => {
  const parts: string[] = []
  if (selections.adults !== undefined) {
    parts.push(`${adults.value}大${children.value ? `${children.value}小` : ''}`)
  }
  if (selections.vehicleDays !== undefined) {
    parts.push(`${selections.vehicleDays}天`)
  }
  return parts.join(' · ')
})

const canProceed = computed(() => isCurrentStepValid())

function isCurrentStepValid(): boolean {
  const stepId = currentStepId.value
  if (!stepId || stepId === 'summary') return true

  if (stepId === 'adults') {
    return isNumberDimValid('adults') && isNumberDimValid('children')
  }
  if (stepId === 'hotel') {
    const hotelVal = selections.hotel
    const hotelOk = hotelVal !== undefined && hotelVal !== null && String(hotelVal) !== ''
    return hotelOk && isNumberDimValid('nights') && isNumberDimValid('rooms')
  }
  if (stepId === 'vehicleDays') {
    return isNumberDimValid('vehicleDays') && asArray(selections.vehicleNeeds).length > 0
  }

  const dim = dimensions.value.find((d) => d.id === stepId)
  if (!dim?.required) return true

  const val = selections[dim.id]
  if (dim.type === 'multi_select' || dim.id === 'attractions') {
    return asArray(val).length > 0
  }
  if (dim.type === 'single_select') {
    return val !== undefined && val !== null && String(val) !== ''
  }
  if (dim.type === 'number') {
    return isNumberDimValid(dim.id)
  }
  return true
}

function isNumberDimValid(dimId: string): boolean {
  const dim = dimensions.value.find((d) => d.id === dimId)
  if (!dim) return false
  const val = selections[dimId]
  if (!Number.isFinite(Number(val))) return false
  const n = Number(val)
  const min = dim.min ?? 0
  const max = dim.max ?? 99
  return n >= min && n <= max
}

function paxDisplay(dimId: 'adults' | 'children'): number {
  const val = selections[dimId]
  if (val === undefined) return 0
  return Number(val)
}

function stayDisplay(dimId: 'nights' | 'rooms'): number {
  const val = selections[dimId]
  if (val === undefined) return 0
  return Number(val)
}

function goNext() {
  if (!canProceed.value) return
  step.value++
}

/** 进入某一步时填充该维度的配置默认（车型/酒店等单选仍须用户手动点选） */
function ensureDimensionInitialized(dimId: string) {
  if (selections[dimId] !== undefined) return
  const dim = dimensions.value.find((d) => d.id === dimId)
  if (!dim) return

  if (dim.type === 'single_select') {
    if (dim.defaultValue !== undefined) {
      selections[dimId] = dim.defaultValue
    } else if (dim.id === 'guide' && dim.options?.length) {
      const preferred = dim.options.find((o) => o.isDefault) ?? dim.options[0]
      selections[dimId] = preferred.id
    } else if (dim.id === 'hotel' && dim.options?.length) {
      const preferred = dim.options.find((o) => o.isDefault) ?? dim.options.find((o) => o.id === 'h3l') ?? dim.options[0]
      selections[dimId] = preferred.id
    }
    return
  }

  if (dim.defaultValue !== undefined) {
    selections[dimId] = Array.isArray(dim.defaultValue) ? [...dim.defaultValue] : dim.defaultValue
  } else if (dim.type === 'number') {
    selections[dimId] = dim.min ?? 1
  } else if (dim.type === 'multi_select') {
    selections[dimId] = []
  }
}

const visibleOptions = computed(() => currentDim.value?.options ?? [])

function vehicleFitsPax(opt: DimensionOption, pax: number): boolean {
  const min = opt.priceFields.minPax ?? 1
  const max = opt.priceFields.maxPax ?? 99
  return pax >= min && pax <= max
}

function isVehicleOptionAvailable(opt: DimensionOption): boolean {
  return vehicleFitsPax(opt, adults.value + children.value)
}

function vehiclesForPax(pax: number): DimensionOption[] {
  const vehicleDim = dimensions.value.find((d) => d.id === 'vehicle')
  if (!vehicleDim?.options) return []
  return vehicleDim.options
    .filter((o) => vehicleFitsPax(o, pax))
    .sort((a, b) => (a.priceFields.maxPax ?? 99) - (b.priceFields.maxPax ?? 99))
}

function vehicleCapacityLabel(opt: DimensionOption): string {
  return `不超过 ${opt.priceFields.maxPax ?? '—'} 人`
}

/** 按总人数预选最小可用车型；已选手动且仍适用则保留 */
function syncDefaultVehicle(options: { allowFirstPick?: boolean } = {}) {
  if (selections.adults === undefined && selections.children === undefined) return
  const pax = adults.value + children.value
  const fitting = vehiclesForPax(pax)
  if (!fitting.length) {
    if (selections.vehicle) delete selections.vehicle
    return
  }
  const current = selections.vehicle
  const stillValid = current && fitting.some((o) => o.id === current || o.name === current)
  if (!current || !stillValid) {
    if (!options.allowFirstPick && !current) return
    selections.vehicle = fitting[0].id
  }
}

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : []
}

function isSelected(dimId: string, opt: DimensionOption) {
  const val = selections[dimId]
  if (Array.isArray(val)) return val.includes(opt.id) || val.includes(opt.name)
  return val === opt.id || val === opt.name
}

function hasPass(opt: DimensionOption) {
  return (opt.priceFields.passAddon ?? 0) > 0
}

function isFreeSpot(opt: DimensionOption) {
  return (opt.priceFields.adultTicket ?? 0) === 0 && (opt.priceFields.childTicket ?? 0) === 0
}

function isPassSelected(id: string) {
  return asArray(selections[ATTRACTION_PASSES_KEY]).includes(id)
}

function togglePass(attractionId: string) {
  const arr = asArray(selections[ATTRACTION_PASSES_KEY])
  const idx = arr.indexOf(attractionId)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(attractionId)
  selections[ATTRACTION_PASSES_KEY] = arr
  recalc()
}

function toggleHotelOption(opt: DimensionOption) {
  const dim = hotelDim.value
  if (!dim) return
  toggleOption(dim, opt)
}

function toggleVehicleNeed(opt: DimensionOption) {
  const dim = vehicleNeedsDim.value
  if (!dim) return
  toggleOption(dim, opt)
}

function toggleOption(dim: Dimension, opt: DimensionOption) {
  if (dim.id === 'vehicle' && !isVehicleOptionAvailable(opt)) return
  if (dim.type === 'multi_select' || dim.id === 'attractions') {
    const arr = asArray(selections[dim.id])
    const key = opt.id
    const idx = arr.indexOf(key)
    if (idx >= 0) {
      arr.splice(idx, 1)
      const passes = asArray(selections[ATTRACTION_PASSES_KEY]).filter((id) => id !== key)
      selections[ATTRACTION_PASSES_KEY] = passes
    } else {
      arr.push(key)
    }
    selections[dim.id] = arr
  } else {
    selections[dim.id] = opt.id
  }
  recalc()
}

function changeNumber(dimId: string, delta: number) {
  const dim = dimensions.value.find((d) => d.id === dimId)
  const min = dim?.min ?? 0
  const max = dim?.max ?? 99
  const cur = Number(selections[dimId] ?? min)
  selections[dimId] = Math.min(max, Math.max(min, cur + delta))
  if (dimId === 'adults' || dimId === 'children') syncDefaultVehicle()
  recalc()
}

function toggleBreakdown() {
  if (!displayBreakdown.value.length) return
  showBreakdown.value = !showBreakdown.value
}

function onSummaryPricingChange(payload: {
  breakdown: BreakdownItem[]
  total: number
  matchedPeriod: { id: string; name: string } | null
}) {
  summaryPricing.value = payload
}

function onItineraryConfirmed(payload: {
  itinerary: Record<string, string[]>
  arrivalDate: string
}) {
  confirmedItinerary.value = payload.itinerary
}

async function recalc() {
  try {
    const res = await api.calculate({ ...selections })
    breakdown.value = res.breakdown
    total.value = res.total
  } catch {
    /* ignore */
  }
}

watch([adults, children], () => syncDefaultVehicle())

watch(step, () => {
  const id = currentStepId.value
  if (id === 'adults') {
    ensureDimensionInitialized('adults')
    ensureDimensionInitialized('children')
  } else if (id === 'hotel') {
    ensureDimensionInitialized('hotel')
    ensureDimensionInitialized('nights')
    ensureDimensionInitialized('rooms')
  } else if (id === 'vehicleDays') {
    ensureDimensionInitialized('vehicleDays')
    ensureDimensionInitialized('vehicleNeeds')
  } else if (id === 'vehicle') {
    syncDefaultVehicle({ allowFirstPick: true })
  } else if (id && id !== 'summary') {
    ensureDimensionInitialized(id)
  }
  recalc()
})

async function init() {
  loading.value = true
  loadError.value = ''
  try {
    const [{ dimensions: dims }, { selections: defaults }] = await Promise.all([
      api.getDimensions(),
      api.getDefaults(),
    ])
    dimensions.value = dims
    Object.assign(selections, defaults)
    if (!selections[ATTRACTION_PASSES_KEY]) selections[ATTRACTION_PASSES_KEY] = []
    await recalc()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : '加载失败，请检查 API 服务是否运行'
  } finally {
    loading.value = false
  }
}

onMounted(init)
</script>
