<script setup lang="ts">
defineProps<{
  open: boolean
  imageUrl: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open && imageUrl" class="wx-sheet wx-sheet--image" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="wx-sheet__panel wx-sheet__panel--image">
        <button type="button" class="wx-sheet__close" aria-label="关闭" @click="emit('close')">×</button>

        <h3 class="wx-sheet__title">长图已生成</h3>
        <p class="wx-sheet__lead">长按下方图片 → <strong>发送给朋友</strong> 或 <strong>保存图片</strong></p>

        <div class="wx-image-preview">
          <img class="wx-image-preview__img" :src="imageUrl" alt="定制方案长图" />
        </div>

        <button type="button" class="btn-primary wx-sheet__btn wx-sheet__btn--full" @click="emit('close')">
          知道了
        </button>
      </div>
    </div>
  </Teleport>
</template>
