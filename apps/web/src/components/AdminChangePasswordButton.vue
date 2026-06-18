<script setup lang="ts">
import { ref } from 'vue'
import AdminToolbarButton from './AdminToolbarButton.vue'
import { api } from '../api/client'

const open = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

function show() {
  open.value = true
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  error.value = ''
  success.value = ''
}

function close() {
  open.value = false
}

async function submit() {
  error.value = ''
  success.value = ''
  if (!currentPassword.value) {
    error.value = '请输入当前密码'
    return
  }
  if (newPassword.value.length < 6) {
    error.value = '新密码至少 6 位'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    error.value = '两次输入的新密码不一致'
    return
  }
  loading.value = true
  try {
    const res = await api.changePassword(currentPassword.value, newPassword.value)
    success.value = res.message
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    window.setTimeout(() => close(), 800)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '修改失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AdminToolbarButton icon="key" label="改密" @click="show" />

  <Teleport to="body">
    <div v-if="open" class="admin-sheet-backdrop" @click="close" />
    <section v-if="open" class="admin-sheet" role="dialog" aria-labelledby="change-password-title">
      <div class="admin-sheet__head">
        <h2 id="change-password-title" class="admin-sheet__title">修改密码</h2>
        <button type="button" class="admin-sheet__close" aria-label="关闭" @click="close">×</button>
      </div>

      <div class="admin-sheet__body">
        <label class="quote-field-label">当前密码</label>
        <input
          v-model="currentPassword"
          class="quote-meta-input"
          type="password"
          autocomplete="current-password"
          @keyup.enter="submit"
        />

        <label class="quote-field-label">新密码</label>
        <input
          v-model="newPassword"
          class="quote-meta-input"
          type="password"
          autocomplete="new-password"
          placeholder="至少 6 位"
          @keyup.enter="submit"
        />

        <label class="quote-field-label">确认新密码</label>
        <input
          v-model="confirmPassword"
          class="quote-meta-input"
          type="password"
          autocomplete="new-password"
          @keyup.enter="submit"
        />

        <p v-if="error" class="login-error">{{ error }}</p>
        <p v-if="success" class="admin-sheet__success">{{ success }}</p>

        <button type="button" class="btn-primary" :disabled="loading" @click="submit">
          {{ loading ? '保存中…' : '保存新密码' }}
        </button>
      </div>
    </section>
  </Teleport>
</template>

<style scoped>
.admin-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0, 0, 0, 0.35);
}

.admin-sheet {
  position: fixed;
  left: 50%;
  bottom: 0;
  z-index: 1201;
  width: min(100%, calc(390px * var(--scale)));
  max-height: 85vh;
  overflow: auto;
  padding: calc(16px * var(--scale)) calc(16px * var(--scale)) calc(24px + var(--safe-bottom));
  border-radius: calc(16px * var(--scale)) calc(16px * var(--scale)) 0 0;
  background: var(--color-bg-card);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
  transform: translateX(-50%);
}

.admin-sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: calc(12px * var(--scale));
}

.admin-sheet__title {
  font-size: var(--fs-section);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.admin-sheet__close {
  width: calc(32px * var(--scale));
  height: calc(32px * var(--scale));
  font-size: calc(24px * var(--scale));
  line-height: 1;
  color: var(--color-text-muted);
}

.admin-sheet__body {
  display: flex;
  flex-direction: column;
  gap: calc(8px * var(--scale));
}

.admin-sheet__success {
  font-size: var(--fs-body);
  color: var(--color-primary-dark);
  text-align: center;
}
</style>
