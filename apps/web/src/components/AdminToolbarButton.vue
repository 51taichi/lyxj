<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: 'save' | 'logout' | 'key' | 'trash' | 'close'
    label: string
    variant?: 'default' | 'primary' | 'muted'
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    variant: 'default',
    disabled: false,
    loading: false,
  },
)
</script>

<template>
  <button
    type="button"
    class="admin-toolbar-btn"
    :class="`admin-toolbar-btn--${variant}`"
    :disabled="disabled || loading"
    :aria-label="label"
  >
    <svg class="admin-toolbar-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
      <use :href="`/icons.svg#icon-${icon}`" />
    </svg>
    <span class="admin-toolbar-btn__label">{{ loading ? '…' : label }}</span>
  </button>
</template>
