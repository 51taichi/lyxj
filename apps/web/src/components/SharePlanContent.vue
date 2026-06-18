<script setup lang="ts">
import { computed } from 'vue'
import type { Agency, BreakdownItem, QuoteShareItineraryDay, QuoteShareMeta } from '../types'
import { groupBreakdown } from '../utils/breakdownGroups'

const props = defineProps<{
  meta: QuoteShareMeta
  itineraryDays: QuoteShareItineraryDay[]
  breakdown: BreakdownItem[]
  total: number
  agency?: Agency
  expiresAt?: string
}>()

const expiresLabel = computed(() => {
  if (!props.expiresAt) return ''
  const d = new Date(props.expiresAt)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const phoneHref = computed(() => {
  const digits = props.agency?.phone?.replace(/\D/g, '') ?? ''
  return digits ? `tel:${digits}` : ''
})

const summaryBreakdown = computed(() => groupBreakdown(props.breakdown))
</script>

<template>
  <div class="share-plan">
    <header class="share-page__header">
      <div class="share-page__header-top">
        <h1 class="share-page__title">{{ meta.title }}</h1>
        <div class="share-page__brand">
          <img v-if="agency?.logoUrl" class="share-page__logo" :src="agency.logoUrl" :alt="agency.name" />
          <span class="share-page__brand-name">{{ agency?.name ?? '专属方案' }}</span>
        </div>
      </div>
    </header>

    <section class="share-page__card">
      <div v-if="meta.arrivalDisplay" class="share-page__meta-row">
        <span class="share-page__meta-icon">📅</span>
        <span>{{ meta.arrivalDisplay }}</span>
      </div>
      <div class="share-page__meta-row">
        <span class="share-page__meta-icon">👥</span>
        <span>{{ meta.peopleLabel }}</span>
      </div>
      <div v-if="meta.stayLabel" class="share-page__meta-row">
        <span class="share-page__meta-icon">🏨</span>
        <span>{{ meta.stayLabel }}</span>
      </div>
      <div v-if="meta.hotelLabel" class="share-page__meta-row">
        <span class="share-page__meta-icon">💎</span>
        <span>{{ meta.hotelLabel }}</span>
      </div>
      <div v-if="meta.transportLine" class="share-page__meta-row">
        <span class="share-page__meta-icon">🚗</span>
        <span>{{ meta.transportLine }}</span>
      </div>
    </section>

    <section class="share-page__section">
      <h2 class="share-page__section-title">行程安排</h2>
      <ol class="share-timeline">
        <li v-for="(day, index) in itineraryDays" :key="index" class="share-timeline__item">
          <span class="share-timeline__dot" aria-hidden="true" />
          <div class="share-timeline__body">
            <div class="share-timeline__label">{{ day.label }}</div>
            <div class="share-timeline__line">{{ day.line }}</div>
          </div>
        </li>
      </ol>
    </section>

    <section class="share-page__section">
      <h2 class="share-page__section-title">费用明细</h2>
      <div class="share-page__card share-page__card--flat">
        <div v-for="item in summaryBreakdown" :key="item.label" class="pax-row">
          <span class="pax-row__label summary-cost-label">{{ item.label }}</span>
          <div class="pax-row__control summary-amount">¥{{ item.amount.toLocaleString() }}</div>
        </div>
        <div class="pax-row pax-row--total">
          <span class="pax-row__label">报价总计</span>
          <div class="pax-row__control summary-amount summary-amount--total">¥{{ total.toLocaleString() }}</div>
        </div>
      </div>
    </section>

    <footer v-if="expiresAt" class="share-page__footer">
      <a v-if="phoneHref" class="btn-primary share-page__contact" :href="phoneHref">
        联系顾问 {{ agency?.phone }}
      </a>
      <div v-else class="btn-primary share-page__contact">联系顾问</div>
      <p class="share-page__legal">
        报价有效期至 {{ expiresLabel }} · 价格仅供参考，以最终合同为准
      </p>
    </footer>
  </div>
</template>
