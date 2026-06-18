<template>
  <div class="phone-frame">
    <div class="page-bg">
      <img src="/proto-assets/goals/page-bg.png" alt="" />
    </div>

    <header class="page-header page-scroll">
      <RouterLink class="page-header__back" to="/quote">
        <img src="/proto-assets/detail/icon-back.png" alt="返回" />
      </RouterLink>
      <h1 class="page-header__title">管理后台</h1>
      <div class="page-header__actions">
        <AdminHeaderToolbar>
          <AdminChangePasswordButton />
          <AdminLogoutButton />
        </AdminHeaderToolbar>
      </div>
    </header>

    <main class="page-scroll page-content page-content--no-nav" style="padding-top: 0">
      <section class="detail-goal">
        <img class="detail-goal__icon" src="/proto-assets/detail/icon-rocket-xl.png" alt="" />
        <div class="detail-goal__body">
          <div class="detail-goal__title">{{ auth.user?.name }}</div>
          <div class="detail-goal__desc">维护 docx 核价维度与价格</div>
        </div>
        <span class="btn-status">管理员</span>
      </section>

      <div class="admin-card-list">
        <RouterLink to="/admin/config" class="admin-card admin-card--link">
          <img class="admin-card__icon" src="/proto-assets/goals/icon-book.png" alt="" />
          <div>
            <div class="admin-card__title">维度与价格维护</div>
            <div class="admin-card__desc">核价维度、选项价格、淡旺季、餐补 — 数据来自《定制游核价系统.docx》</div>
          </div>
          <span class="admin-card__arrow">›</span>
        </RouterLink>

        <RouterLink to="/admin/agencies" class="admin-card admin-card--link">
          <img class="admin-card__icon" src="/proto-assets/goals/icon-rocket.png" alt="" />
          <div>
            <div class="admin-card__title">合作品牌维护</div>
            <div class="admin-card__desc">旅行社名称、Logo、联系电话与地址，用于生成客户方案。</div>
          </div>
          <span class="admin-card__arrow">›</span>
        </RouterLink>
      </div>

      <RouterLink class="btn-primary" to="/quote" style="margin-top: calc(20px * var(--scale)); text-decoration: none">
        预览核价向导
      </RouterLink>
    </main>
  </div>
</template>

<script setup lang="ts">
import AdminChangePasswordButton from '../components/AdminChangePasswordButton.vue'
import AdminHeaderToolbar from '../components/AdminHeaderToolbar.vue'
import AdminLogoutButton from '../components/AdminLogoutButton.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
</script>

<style scoped>
.admin-card--link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.admin-card__arrow {
  margin-left: auto;
  font-size: var(--fs-section);
  color: var(--color-text-muted);
}
</style>
