<template>
  <div class="phone-frame admin-page">
    <div class="page-bg">
      <img src="/proto-assets/goals/page-bg.png" alt="" />
    </div>

    <header class="page-header page-scroll">
      <RouterLink class="page-header__back" to="/admin">
        <img src="/proto-assets/detail/icon-back.png" alt="返回" />
      </RouterLink>
      <h1 class="page-header__title">维度与价格维护</h1>
      <div class="page-header__actions">
        <AdminHeaderToolbar>
          <AdminChangePasswordButton />
          <AdminLogoutButton />
          <AdminToolbarButton icon="save" label="保存" variant="primary" :loading="saving" :disabled="saving" @click="save" />
        </AdminHeaderToolbar>
      </div>
    </header>

    <main v-if="config" class="page-scroll page-content page-content--no-nav" style="padding-top: 0">
      <div class="section-header">
        <h2 class="section-header__title">淡旺季价格段</h2>
        <button type="button" class="btn-outline" @click="addPeriod">+ 时间段</button>
      </div>
      <p class="step-hint admin-section-hint">标准价为下方维度标准价；抵达日期命中时间段时覆盖用车、酒店、导服及餐补（景点不变）。</p>

      <div class="admin-dim-grid admin-dim-grid--periods">
      <section
        v-for="(period, pi) in config.pricePeriods"
        :key="period.id"
        class="admin-dim"
        :class="{ 'admin-dim--expanded': periodExpanded[period.id] }"
      >
        <button type="button" class="admin-dim__head" @click="togglePeriod(period.id)">
          <span class="admin-dim__name">{{ periodHeadLabel(period) }}</span>
          <span class="admin-dim__chev">{{ periodExpanded[period.id] ? '▾' : '▸' }}</span>
        </button>

        <div v-show="periodExpanded[period.id]" class="admin-dim__body step-panel step-panel--flat">
          <div class="admin-row admin-row--action">
            <input v-model="period.name" class="quote-meta-input" placeholder="时间段名称，如国庆旺季" />
            <AdminIconButton icon="trash" label="删除时间段" @click="removePeriod(pi)" />
          </div>
          <div class="admin-row">
            <div>
              <label class="quote-field-label">开始日期</label>
              <input v-model="period.startDate" type="date" class="quote-meta-input" />
            </div>
            <div>
              <label class="quote-field-label">结束日期</label>
              <input v-model="period.endDate" type="date" class="quote-meta-input" />
            </div>
          </div>
          <label class="quote-field-label">餐补覆盖（元/人/天，留空用标准价）</label>
          <input
            v-model.number="period.mealAllowancePerPersonDay"
            type="number"
            class="quote-meta-input"
            min="0"
            placeholder="标准餐补"
          />

          <div class="section-header" style="margin-top: calc(10px * var(--scale))">
            <span class="quote-field-label" style="margin: 0">时段价格覆盖</span>
          </div>
          <template v-for="dim in periodOverrideDimensions" :key="dim.id">
            <p class="admin-period__dim-name">{{ dim.name }}</p>
            <div class="admin-option-grid admin-option-grid--compact">
            <article v-for="opt in dim.options" :key="opt.id" class="admin-option admin-option--compact">
              <span class="admin-option__name" :title="opt.name">{{ opt.name }}</span>
              <div
                v-if="priceFieldsFor(dim.id).length"
                class="admin-price-grid"
                :style="priceGridStyle(dim.id)"
              >
                <div v-for="pf in priceFieldsFor(dim.id)" :key="pf.key" class="admin-price-cell">
                  <label class="admin-price-field" :title="pf.label">
                    <span class="admin-price-field__label">{{ priceFieldLabel(pf) }}</span>
                    <input
                      type="number"
                      class="admin-price-field__input"
                      min="0"
                      :placeholder="String(opt.priceFields[pf.key] ?? 0)"
                      :value="getOverridePrice(period, dim.id, opt.id, pf.key)"
                      @input="setOverridePrice(period, dim.id, opt.id, pf.key, $event)"
                    />
                    <span class="admin-price-field__unit">{{ pf.unit }}</span>
                  </label>
                </div>
              </div>
            </article>
            </div>
          </template>
        </div>
      </section>
      </div>

      <div class="section-header">
        <h2 class="section-header__title">核价维度（10项）</h2>
      </div>

      <div class="admin-dim-grid admin-dim-grid--dimensions">
      <section
        v-for="dim in sortedDimensions"
        :key="dim.id"
        class="admin-dim"
        :class="{ 'admin-dim--expanded': expanded[dim.id] }"
      >
        <button type="button" class="admin-dim__head" @click="toggle(dim.id)">
          <span class="admin-dim__order">{{ dim.sortOrder }}</span>
          <span class="admin-dim__name">{{ dim.name }}</span>
          <span class="btn-tag">{{ typeLabel(dim.type) }}</span>
          <span class="admin-dim__chev">{{ expanded[dim.id] ? '▾' : '▸' }}</span>
        </button>

        <div v-show="expanded[dim.id]" class="admin-dim__body step-panel step-panel--flat">
          <p v-if="stepHintFor(dim.id)" class="step-hint">{{ stepHintFor(dim.id) }}</p>
          <label class="quote-field-label">维度名称</label>
          <input v-model="dim.name" class="quote-meta-input" />

          <template v-if="dim.type === 'number'">
            <div class="admin-row">
              <div>
                <label class="quote-field-label">最小值</label>
                <input v-model.number="dim.min" type="number" class="quote-meta-input" />
              </div>
              <div>
                <label class="quote-field-label">最大值</label>
                <input v-model.number="dim.max" type="number" class="quote-meta-input" />
              </div>
              <div>
                <label class="quote-field-label">默认值</label>
                <input v-model.number="dim.defaultValue" type="number" class="quote-meta-input" />
              </div>
            </div>
          </template>

          <template v-else-if="dim.options">
            <div
              v-if="dim.id === 'vehicleNeeds'"
              class="admin-need-map step-panel step-panel--flat"
            >
              <p class="quote-field-label" style="margin-top: 0">需求与价格字段对应</p>
              <p class="step-hint step-hint--compact">新增需求后保存，「请选择车型」会自动出现对应价格列；所有需求均按「元/天 × 用车天数」计价。</p>
              <ul class="admin-need-map__list">
                <li v-for="row in vehicleNeedPriceMap" :key="row.needId">
                  <span class="admin-need-map__need">{{ row.needName }}</span>
                  <span class="admin-need-map__arrow">→</span>
                  <span class="admin-need-map__field">请选择车型 · {{ row.priceLabel }}</span>
                  <span class="admin-need-map__unit">{{ row.unit }}</span>
                </li>
              </ul>
            </div>

            <div class="section-header" style="margin-top: calc(8px * var(--scale))">
              <span class="quote-field-label" style="margin: 0">{{ optionsSectionTitle(dim.id) }}</span>
              <button type="button" class="btn-outline" @click="addOption(dim)">+ 选项</button>
            </div>

            <div class="admin-option-grid">
            <article v-for="(opt, oi) in dim.options" :key="opt.id" class="admin-option admin-option--stack">
              <div class="admin-row admin-row--action admin-row--tight">
                <input v-model="opt.name" class="quote-meta-input" placeholder="选项名称" />
                <AdminIconButton icon="trash" label="删除选项" @click="removeOption(dim, oi)" />
              </div>

              <div
                v-if="priceFieldsFor(dim.id).length"
                class="admin-price-grid"
                :style="priceGridStyle(dim.id)"
              >
                <div v-for="pf in priceFieldsFor(dim.id)" :key="pf.key" class="admin-price-cell">
                  <label class="admin-price-field" :title="pf.label">
                    <span class="admin-price-field__label">{{ priceFieldLabel(pf) }}</span>
                    <input
                      v-model.number="opt.priceFields[pf.key]"
                      type="number"
                      class="admin-price-field__input"
                      min="0"
                    />
                    <span class="admin-price-field__unit">{{ pf.unit }}</span>
                  </label>
                </div>
              </div>
            </article>
            </div>
          </template>
        </div>
      </section>
      </div>

      <div class="admin-config-footer">
      <section
        class="admin-dim admin-meal-section"
        :class="{ 'admin-dim--expanded': mealExpanded }"
      >
        <button type="button" class="admin-dim__head" @click="mealExpanded = !mealExpanded">
          <span class="admin-dim__order">{{ sortedDimensions.length + 1 }}</span>
          <span class="admin-dim__name">餐补</span>
          <span class="btn-tag">标准价</span>
          <span class="admin-dim__chev">{{ mealExpanded ? '▾' : '▸' }}</span>
        </button>
        <div v-show="mealExpanded" class="admin-dim__body step-panel step-panel--flat">
          <p class="step-hint">餐补仅补贴司导，不含游客：司兼导 1 人，独立/金牌导游 2 人（司机+导游）。公式 = 单价 × 司导人数 × 用车天数</p>
          <label class="quote-field-label">餐补单价（元/人/天）</label>
          <input v-model.number="config.mealAllowancePerPersonDay" type="number" class="quote-meta-input" min="0" />
          <p class="step-hint step-hint--compact">淡旺季可在上方时间段中单独覆盖餐补单价；与导服方式关联，与用车需求无关。</p>
        </div>
      </section>

      <section
        class="admin-dim admin-formula-section"
        :class="{ 'admin-dim--expanded': formulaExpanded }"
      >
        <button type="button" class="admin-dim__head" @click="formulaExpanded = !formulaExpanded">
          <span class="admin-dim__name">计价公式（docx）</span>
          <span class="admin-dim__chev">{{ formulaExpanded ? '▾' : '▸' }}</span>
        </button>
        <div v-show="formulaExpanded" class="admin-dim__body step-panel step-panel--flat">
          <p class="admin-formula__text">{{ config.formulaNote }}</p>
        </div>
      </section>
      </div>

      <p v-if="message" class="admin-msg" :class="{ 'admin-msg--err': isError }">{{ message }}</p>

      <div class="wizard-actions" style="padding-bottom: calc(24px + var(--safe-bottom))">
        <button type="button" class="btn-outline" @click="reset">恢复 docx 默认</button>
        <button type="button" class="btn-primary btn-primary--inline" :disabled="saving" @click="save">保存全部</button>
      </div>
    </main>

    <div v-else class="page-loading">加载配置…</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AdminChangePasswordButton from '../components/AdminChangePasswordButton.vue'
import AdminHeaderToolbar from '../components/AdminHeaderToolbar.vue'
import AdminLogoutButton from '../components/AdminLogoutButton.vue'
import AdminToolbarButton from '../components/AdminToolbarButton.vue'
import AdminIconButton from '../components/AdminIconButton.vue'
import { api } from '../api/client'
import type { Dimension, DimensionOption, PricePeriod, SystemConfig } from '../types'
import {
  ADMIN_HINTS,
  DIMENSION_PRICE_FIELDS,
  DIMENSION_TYPE_LABELS,
  STEP_HINTS,
} from '../utils/configSchema'
import {
  buildVehicleNeedDefs,
  removeVehicleNeedFromVehicles,
  syncVehicleOptionsWithNeeds,
  vehiclePriceFieldsFromNeeds,
} from '../utils/vehicleNeeds'

const config = ref<SystemConfig | null>(null)
const expanded = reactive<Record<string, boolean>>({})
const periodExpanded = reactive<Record<string, boolean>>({})
const formulaExpanded = ref(false)
const mealExpanded = ref(false)
const saving = ref(false)
const message = ref('')
const isError = ref(false)

const sortedDimensions = computed(() =>
  [...(config.value?.dimensions ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
)

/** 淡旺季仅覆盖用车、酒店、导服；景点始终用标准价 */
const PERIOD_OVERRIDE_DIM_IDS = ['vehicle', 'hotel', 'guide']

const periodOverrideDimensions = computed(() =>
  sortedDimensions.value.filter((d) => PERIOD_OVERRIDE_DIM_IDS.includes(d.id) && d.options?.length),
)

const vehicleNeedsDim = computed(() => config.value?.dimensions.find((d) => d.id === 'vehicleNeeds'))
const vehicleDim = computed(() => config.value?.dimensions.find((d) => d.id === 'vehicle'))
const vehicleNeedPriceMap = computed(() => buildVehicleNeedDefs(vehicleNeedsDim.value))

function typeLabel(type: string) {
  return DIMENSION_TYPE_LABELS[type] ?? type
}

function priceFieldsFor(dimId: string) {
  if (dimId === 'vehicle') return vehiclePriceFieldsFromNeeds(vehicleNeedsDim.value)
  return DIMENSION_PRICE_FIELDS[dimId] ?? []
}

function priceFieldLabel(pf: { label: string; shortLabel?: string }) {
  return pf.shortLabel ?? pf.label
}

function priceGridStyle(dimId: string) {
  const count = priceFieldsFor(dimId).length
  const cols = count <= 3 ? count : 3
  const colWidth = 'minmax(calc(78px * var(--scale)), 1fr)'
  return { gridTemplateColumns: `repeat(${cols}, ${colWidth})` }
}

function stepHintFor(dimId: string) {
  return ADMIN_HINTS[dimId] ?? STEP_HINTS[dimId] ?? ''
}

function optionsSectionTitle(dimId: string) {
  return priceFieldsFor(dimId).length ? '选项与价格' : '选项列表'
}

function toggle(id: string) {
  expanded[id] = !expanded[id]
}

function togglePeriod(id: string) {
  periodExpanded[id] = !periodExpanded[id]
}

function periodHeadLabel(period: PricePeriod) {
  const name = period.name?.trim() || '未命名时间段'
  if (period.startDate && period.endDate) {
    return `${name} · ${period.startDate} ~ ${period.endDate}`
  }
  if (period.startDate) return `${name} · ${period.startDate} 起`
  if (period.endDate) return `${name} · 至 ${period.endDate}`
  return name
}

function addOption(dim: Dimension) {
  if (!dim.options) dim.options = []
  const opt: DimensionOption = {
    id: dim.id === 'vehicleNeeds' ? `need_${Date.now()}` : `opt_${Date.now()}`,
    name: '新选项',
    priceFields: {},
  }
  for (const pf of priceFieldsFor(dim.id)) {
    opt.priceFields[pf.key] = 0
  }
  dim.options.push(opt)
  if (dim.id === 'vehicleNeeds') {
    syncVehicleOptionsWithNeeds(vehicleDim.value, dim)
  }
}

function removeOption(dim: Dimension, index: number) {
  const opt = dim.options?.[index]
  if (!opt) return
  if (dim.id === 'vehicleNeeds') {
    removeVehicleNeedFromVehicles(vehicleDim.value, opt)
  }
  dim.options!.splice(index, 1)
}

function addPeriod() {
  if (!config.value) return
  if (!config.value.pricePeriods) config.value.pricePeriods = []
  const id = `period_${Date.now()}`
  config.value.pricePeriods.push({
    id,
    name: '新时间段',
    startDate: '',
    endDate: '',
    overrides: [],
  })
  periodExpanded[id] = true
}

function removePeriod(index: number) {
  const period = config.value?.pricePeriods?.[index]
  if (period) delete periodExpanded[period.id]
  config.value?.pricePeriods?.splice(index, 1)
}

function getOrCreateOverride(period: PricePeriod, dimId: string, optId: string) {
  let o = period.overrides.find((x) => x.dimensionId === dimId && x.optionId === optId)
  if (!o) {
    o = { dimensionId: dimId, optionId: optId, priceFields: {} }
    period.overrides.push(o)
  }
  return o
}

function getOverridePrice(period: PricePeriod, dimId: string, optId: string, key: string) {
  const o = period.overrides.find((x) => x.dimensionId === dimId && x.optionId === optId)
  const v = o?.priceFields[key]
  return v === undefined ? '' : v
}

function setOverridePrice(
  period: PricePeriod,
  dimId: string,
  optId: string,
  key: string,
  e: Event,
) {
  const raw = (e.target as HTMLInputElement).value
  const o = getOrCreateOverride(period, dimId, optId)
  if (raw === '') {
    delete o.priceFields[key]
    return
  }
  const val = Number(raw)
  if (Number.isFinite(val) && val >= 0) o.priceFields[key] = val
}

async function load() {
  config.value = await api.getAdminConfig()
  if (!config.value.agencies) config.value.agencies = []
  if (!config.value.pricePeriods) config.value.pricePeriods = []
  for (const d of config.value!.dimensions) {
    expanded[d.id] = false
  }
}

async function save() {
  if (!config.value) return
  saving.value = true
  message.value = ''
  isError.value = false
  try {
    config.value = await api.saveAdminConfig(config.value)
    message.value = '已保存，业务员端将立即生效'
  } catch (e) {
    isError.value = true
    message.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    saving.value = false
  }
}

async function reset() {
  if (!confirm('确定恢复为《定制游核价系统.docx》默认数据？当前修改将丢失。')) return
  saving.value = true
  message.value = ''
  try {
    config.value = await api.resetAdminConfig()
    message.value = '已恢复 docx 默认配置'
  } catch (e) {
    isError.value = true
    message.value = e instanceof Error ? e.message : '恢复失败'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-formula-section {
  margin-top: 0;
}

.admin-config-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-card);
  margin-top: var(--space-card);
}

.admin-need-map {
  margin-top: calc(8px * var(--scale));
  margin-bottom: calc(8px * var(--scale));
  padding: calc(10px * var(--scale)) calc(12px * var(--scale));
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-border);
}

.admin-need-map__list {
  list-style: none;
  margin: calc(6px * var(--scale)) 0 0;
  padding: 0;
}

.admin-need-map__list li {
  display: flex;
  align-items: center;
  gap: calc(6px * var(--scale));
  padding: calc(4px * var(--scale)) 0;
  font-size: var(--fs-caption);
  color: var(--color-text-body);
}

.admin-need-map__need {
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: calc(48px * var(--scale));
}

.admin-need-map__arrow {
  color: var(--color-text-light);
}

.admin-need-map__field {
  flex: 1;
  color: var(--color-primary-dark);
}

.admin-need-map__unit {
  color: var(--color-text-muted);
  white-space: nowrap;
}

.admin-formula__text {
  font-size: var(--fs-body);
  color: var(--color-text-body);
  line-height: 1.6;
  margin-bottom: calc(12px * var(--scale));
}

.admin-dim {
  margin-bottom: var(--space-card);
}

.admin-dim__head {
  display: flex;
  align-items: center;
  gap: calc(10px * var(--scale));
  width: 100%;
  padding: calc(14px * var(--scale)) calc(16px * var(--scale));
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  text-align: left;
}

.admin-dim__order {
  font-family: var(--font-num);
  font-size: var(--fs-body);
  color: var(--color-primary);
  font-weight: 600;
  min-width: calc(24px * var(--scale));
}

.admin-dim__name {
  flex: 1;
  font-size: var(--fs-card-title);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.admin-dim__chev {
  color: var(--color-text-muted);
}

.admin-dim__body {
  margin-top: calc(8px * var(--scale));
}

.admin-row {
  display: flex;
  gap: calc(10px * var(--scale));
  align-items: flex-end;
}

.admin-row--tight {
  margin-bottom: calc(6px * var(--scale));
}

.admin-row > div {
  flex: 1;
}

.admin-option {
  padding: calc(8px * var(--scale)) 0;
  border-top: 1px solid var(--color-border);
}

.admin-option:first-of-type {
  border-top: none;
}

.admin-option--compact {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--scale));
  padding: calc(5px * var(--scale)) 0;
}

.admin-option--stack {
  padding: calc(8px * var(--scale)) 0;
}

.admin-option__name {
  flex: 0 1 auto;
  max-width: calc(108px * var(--scale));
  font-size: var(--fs-caption);
  font-weight: 500;
  color: var(--color-text-secondary);
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-option--compact .admin-price-grid {
  flex: 1 1 0;
  min-width: 0;
}

.admin-price-grid {
  display: grid;
  gap: calc(6px * var(--scale));
}

.admin-price-cell {
  min-width: 0;
}

.admin-price-field {
  display: flex;
  align-items: center;
  gap: calc(4px * var(--scale));
  min-height: calc(38px * var(--scale));
  min-width: 0;
  padding: 0 calc(6px * var(--scale));
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  cursor: text;
}

.admin-price-field:focus-within {
  border-color: var(--color-primary-light);
  box-shadow: 0 0 0 calc(2px * var(--scale)) rgba(87, 136, 248, 0.12);
}

.admin-price-field__label {
  flex-shrink: 0;
  font-size: var(--fs-caption-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  line-height: 1;
  white-space: nowrap;
}

.admin-price-field__input {
  flex: 1 1 auto;
  min-width: 0;
  width: calc(36px * var(--scale));
  max-width: calc(44px * var(--scale));
  border: none;
  background: transparent;
  padding: calc(8px * var(--scale)) 0;
  font-family: var(--font-num);
  font-size: var(--fs-body);
  font-weight: 500;
  color: var(--color-text-body);
  text-align: right;
  font-variant-numeric: tabular-nums;
  outline: none;
  -moz-appearance: textfield;
}

.admin-price-field__unit {
  flex-shrink: 0;
  font-size: var(--fs-caption-sm);
  color: var(--color-text-light);
  line-height: 1;
  white-space: nowrap;
}

.admin-price-field__input::-webkit-outer-spin-button,
.admin-price-field__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.admin-price-field__input::placeholder {
  color: var(--color-text-light);
  font-weight: 400;
}

.admin-check {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--scale));
  font-size: var(--fs-body);
  color: var(--color-text-muted);
  margin-top: calc(8px * var(--scale));
}

.admin-period__dim-name {
  margin: calc(8px * var(--scale)) 0 calc(2px * var(--scale));
  font-size: var(--fs-caption);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.admin-msg {
  text-align: center;
  font-size: var(--fs-body);
  color: var(--color-primary-dark);
  margin: calc(12px * var(--scale)) 0;
}

.admin-msg--err {
  color: #d64545;
}

.step-panel__title {
  font-size: var(--fs-section);
  font-weight: 600;
  margin-bottom: calc(10px * var(--scale));
}
</style>
