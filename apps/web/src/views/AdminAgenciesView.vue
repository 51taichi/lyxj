<template>
  <div class="phone-frame admin-page">
    <div class="page-bg">
      <img src="/proto-assets/goals/page-bg.png" alt="" />
    </div>

    <header class="page-header page-scroll">
      <RouterLink class="page-header__back" to="/admin">
        <img src="/proto-assets/detail/icon-back.png" alt="返回" />
      </RouterLink>
      <h1 class="page-header__title">合作品牌维护</h1>
      <div class="page-header__actions">
        <AdminHeaderToolbar>
          <AdminChangePasswordButton />
          <AdminLogoutButton />
          <AdminToolbarButton icon="save" label="保存" variant="primary" :loading="saving" :disabled="saving" @click="save" />
        </AdminHeaderToolbar>
      </div>
    </header>

    <main v-if="config" class="page-scroll page-content page-content--no-nav" style="padding-top: 0">
      <p class="step-hint step-hint--compact">维护方案汇总页可选旅行社品牌，用于生成客户页面、图片与 PDF。</p>

      <div class="section-header">
        <h2 class="section-header__title">合作品牌</h2>
        <button type="button" class="btn-outline" @click="addAgency">+ 品牌</button>
      </div>

      <div class="admin-agency-grid">
      <section v-for="(agency, ai) in sortedAgencies" :key="agency.id" class="admin-agency step-panel step-panel--flat">
        <div class="admin-row admin-row--action">
          <input v-model="agency.name" class="quote-meta-input" placeholder="旅行社名称" />
          <AdminIconButton icon="trash" label="删除品牌" @click="removeAgency(ai)" />
        </div>
        <label class="quote-field-label">Logo</label>
        <div class="admin-logo-row">
          <img v-if="agency.logoUrl" class="admin-logo-preview" :src="agency.logoUrl" alt="" />
          <span v-else class="admin-logo-placeholder">无 Logo</span>
          <label class="btn-outline admin-logo-upload">
            上传图片
            <input type="file" accept="image/*" hidden @change="onLogoUpload(agency, $event)" />
          </label>
          <AdminIconButton
            v-if="agency.logoUrl"
            icon="close"
            label="清除 Logo"
            variant="muted"
            @click="agency.logoUrl = ''"
          />
        </div>
        <label class="quote-field-label">联系电话</label>
        <input v-model="agency.phone" class="quote-meta-input" placeholder="400-xxx-xxxx" />
        <label class="quote-field-label">地址（可选）</label>
        <input v-model="agency.address" class="quote-meta-input" placeholder="北京市…" />
      </section>
      </div>

      <p v-if="message" class="admin-msg" :class="{ 'admin-msg--err': isError }">{{ message }}</p>

      <div class="wizard-actions" style="padding-bottom: calc(24px + var(--safe-bottom))">
        <button type="button" class="btn-primary btn-primary--inline" :disabled="saving" @click="save">保存</button>
      </div>
    </main>

    <div v-else class="page-loading">加载配置…</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminChangePasswordButton from '../components/AdminChangePasswordButton.vue'
import AdminHeaderToolbar from '../components/AdminHeaderToolbar.vue'
import AdminLogoutButton from '../components/AdminLogoutButton.vue'
import AdminToolbarButton from '../components/AdminToolbarButton.vue'
import AdminIconButton from '../components/AdminIconButton.vue'
import { api } from '../api/client'
import type { Agency, SystemConfig } from '../types'

const config = ref<SystemConfig | null>(null)
const saving = ref(false)
const message = ref('')
const isError = ref(false)

const sortedAgencies = computed(() =>
  [...(config.value?.agencies ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
)

function addAgency() {
  if (!config.value) return
  if (!config.value.agencies) config.value.agencies = []
  const nextOrder = config.value.agencies.length + 1
  config.value.agencies.push({
    id: `agency_${Date.now()}`,
    name: '新旅行社',
    logoUrl: '',
    phone: '',
    address: '',
    sortOrder: nextOrder,
  })
}

function removeAgency(index: number) {
  if (!config.value?.agencies) return
  const agency = sortedAgencies.value[index]
  const i = config.value.agencies.findIndex((a) => a.id === agency.id)
  if (i >= 0) config.value.agencies.splice(i, 1)
}

function onLogoUpload(agency: Agency, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 512000) {
    isError.value = true
    message.value = 'Logo 请小于 500KB'
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    agency.logoUrl = reader.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

async function load() {
  config.value = await api.getAdminConfig()
  if (!config.value.agencies) config.value.agencies = []
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

onMounted(load)
</script>

<style scoped>
.admin-row {
  display: flex;
  gap: calc(10px * var(--scale));
  align-items: flex-end;
  margin-bottom: calc(10px * var(--scale));
}

.admin-agency {
  margin-bottom: var(--space-card);
}

.admin-logo-row {
  display: flex;
  align-items: center;
  gap: calc(10px * var(--scale));
  margin-bottom: calc(10px * var(--scale));
}

.admin-logo-preview {
  width: calc(44px * var(--scale));
  height: calc(44px * var(--scale));
  object-fit: contain;
  border-radius: calc(8px * var(--scale));
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
}

.admin-logo-placeholder {
  font-size: var(--fs-caption);
  color: var(--color-text-muted);
}

.admin-logo-upload {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
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
</style>
