<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: 'trash' | 'close'
    label: string
    variant?: 'danger' | 'muted'
  }>(),
  { variant: 'danger' },
)
</script>

<template>
  <button type="button" class="admin-icon-btn" :class="`admin-icon-btn--${variant}`" :aria-label="label">
    <svg class="admin-icon-btn__svg" viewBox="0 0 24 24" aria-hidden="true">
      <use :href="`/icons.svg#icon-${icon}`" />
    </svg>
  </button>
</template>
