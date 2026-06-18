import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/quote' },
    {
      path: '/quote',
      component: () => import('../views/QuoteWizardView.vue'),
    },
    { path: '/login', redirect: '/admin/login' },
    {
      path: '/admin/login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/admin',
      component: () => import('../views/AdminHomeView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/config',
      component: () => import('../views/AdminConfigView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/agencies',
      component: () => import('../views/AdminAgenciesView.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    { path: '/share/:id', component: () => import('../views/QuoteShareView.vue') },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path === '/admin/login' && auth.isLoggedInAdmin()) {
    return '/admin'
  }
  if (!to.meta.requiresAuth) return true
  if (!auth.token) return '/admin/login'
  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return '/admin/login'
  }
  return true
})

export default router
