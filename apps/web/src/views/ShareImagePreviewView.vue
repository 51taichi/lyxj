<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => String(route.params.id))
const imageSrc = computed(() => `/api/quote/export/image/${id.value}`)

function openFullscreenImage() {
  window.location.href = imageSrc.value
}
</script>

<template>
  <div class="share-image-page">
    <header class="share-image-page__header">
      <router-link class="share-image-page__back" :to="`/share/${id}`">← 返回方案</router-link>
      <h1 class="share-image-page__title">方案长图</h1>
    </header>

    <p class="share-image-page__tip">
      长按下方图片 → <strong>发送给朋友</strong> 或 <strong>保存图片</strong>
    </p>

    <div class="share-image-page__frame">
      <img
        class="share-image-page__img"
        :src="imageSrc"
        alt="定制方案长图"
        draggable="false"
      />
    </div>

    <div class="share-image-page__actions">
      <button type="button" class="btn-primary share-image-page__btn" @click="openFullscreenImage">
        全屏查看（便于长按保存）
      </button>
      <p class="share-image-page__hint">若长按无效，请先点「全屏查看」，再长按图片</p>
    </div>
  </div>
</template>
