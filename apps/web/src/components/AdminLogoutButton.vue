<script setup lang="ts">
import { useRouter } from 'vue-router'
import AdminToolbarButton from './AdminToolbarButton.vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

function logout() {
  auth.logout()
  router.replace('/admin/login')
}
</script>

<template>
  <AdminToolbarButton icon="logout" label="退出" variant="muted" @click="logout" />
</template>
