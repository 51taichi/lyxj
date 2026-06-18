<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../api/client'
import SharePlanContent from '../components/SharePlanContent.vue'
import type { QuoteShareSnapshot } from '../types'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const snapshot = ref<QuoteShareSnapshot | null>(null)

const isPrintMode = computed(() => route.query.print === '1')

onMounted(async () => {
  const id = route.params.id as string
  if (!id) {
    error.value = '链接无效'
    loading.value = false
    return
  }
  try {
    snapshot.value = await api.getShare(id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="phone-frame" :class="{ 'phone-frame--print': isPrintMode }">
    <div v-if="!isPrintMode" class="page-bg">
      <img src="/proto-assets/goals/page-bg.png" alt="" />
    </div>

    <div v-if="loading" class="page-loading">加载方案…</div>

    <div v-else-if="error" class="page-error share-page__error">
      <p>{{ error }}</p>
      <p class="step-hint">链接可能已过期（有效期 7 天），请联系顾问重新获取。</p>
    </div>

    <div v-else-if="snapshot" class="share-page">
      <SharePlanContent
        :meta="snapshot.meta"
        :itinerary-days="snapshot.itineraryDays"
        :breakdown="snapshot.breakdown"
        :total="snapshot.total"
        :agency="snapshot.agency"
        :expires-at="snapshot.expiresAt"
      />
    </div>
  </div>
</template>
