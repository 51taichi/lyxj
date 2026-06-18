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
      component: () => import('../layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, role: 'admin' },
      children: [
        {
          path: '',
          component: () => import('../views/AdminHomeView.vue'),
        },
        {
          path: 'config',
          component: () => import('../views/AdminConfigView.vue'),
        },
        {
          path: 'agencies',
          component: () => import('../views/AdminAgenciesView.vue'),
        },
      ],
    },
    { path: '/share/:id', component: () => import('../views/QuoteShareView.vue') },
    { path: '/share/:id/image', component: () => import('../views/ShareImagePreviewView.vue') },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path === '/admin/login' && auth.isLoggedInAdmin()) {
    return '/admin'
  }
  if (!to.meta.requiresAuth && !to.matched.some((r) => r.meta.requiresAuth)) return true
  const needsAuth = to.matched.some((r) => r.meta.requiresAuth)
  if (!needsAuth) return true
  if (!auth.token) return '/admin/login'
  const role = to.matched.find((r) => r.meta.role)?.meta.role
  if (role && auth.user?.role !== role) {
    return '/admin/login'
  }
  return true
})

export default router
