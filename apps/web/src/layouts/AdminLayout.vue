<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()

const navItems = [
  { to: '/admin', label: '概览', exact: true },
  { to: '/admin/config', label: '维度与价格' },
  { to: '/admin/agencies', label: '合作品牌' },
]

function isActive(item: (typeof navItems)[number]) {
  if (item.exact) return route.path === item.to
  return route.path.startsWith(item.to)
}

const pageTitle = computed(() => {
  if (route.path.startsWith('/admin/config')) return '维度与价格维护'
  if (route.path.startsWith('/admin/agencies')) return '合作品牌维护'
  return '管理后台'
})
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-layout__sidebar" aria-label="管理导航">
      <div class="admin-layout__brand">
        <img class="admin-layout__logo" src="/assets/pricing-tool-logo.png" alt="" />
        <div>
          <div class="admin-layout__brand-title">定制游核价</div>
          <div class="admin-layout__brand-sub">管理后台</div>
        </div>
      </div>

      <nav class="admin-layout__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="admin-layout__nav-link"
          :class="{ 'admin-layout__nav-link--active': isActive(item) }"
        >
          {{ item.label }}
        </RouterLink>
        <a class="admin-layout__nav-link admin-layout__nav-link--external" href="/quote" target="_blank" rel="noopener">
          预览核价向导 ↗
        </a>
      </nav>

      <div class="admin-layout__footer">
        <div class="admin-layout__user">{{ auth.user?.name ?? '管理员' }}</div>
      </div>
    </aside>

    <div class="admin-layout__main">
      <header class="admin-layout__topbar">
        <h1 class="admin-layout__page-title">{{ pageTitle }}</h1>
      </header>
      <RouterView />
    </div>
  </div>
</template>
