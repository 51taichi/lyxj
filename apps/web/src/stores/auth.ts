import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types'

const REMEMBER_LOGIN_KEY = 'adminRememberLogin'
const SAVED_USERNAME_KEY = 'adminSavedUsername'
const SAVED_PASSWORD_KEY = 'adminSavedPassword'
const SKIP_AUTO_LOGIN_KEY = 'adminSkipAutoLoginOnce'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') ?? '')
  const user = ref<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  )

  function setAuth(t: string, u: User) {
    token.value = t
    user.value = u
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(u))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.setItem(SKIP_AUTO_LOGIN_KEY, '1')
  }

  function consumeSkipAutoLogin() {
    if (sessionStorage.getItem(SKIP_AUTO_LOGIN_KEY) !== '1') return false
    sessionStorage.removeItem(SKIP_AUTO_LOGIN_KEY)
    return true
  }

  function isRememberLoginEnabled() {
    return localStorage.getItem(REMEMBER_LOGIN_KEY) === '1'
  }

  function getRememberLogin() {
    if (!isRememberLoginEnabled()) return null
    const username = localStorage.getItem(SAVED_USERNAME_KEY) ?? ''
    const password = localStorage.getItem(SAVED_PASSWORD_KEY) ?? ''
    if (!username || !password) return null
    return { username, password }
  }

  function setRememberLogin(remember: boolean, username?: string, password?: string) {
    if (remember && username && password) {
      localStorage.setItem(REMEMBER_LOGIN_KEY, '1')
      localStorage.setItem(SAVED_USERNAME_KEY, username)
      localStorage.setItem(SAVED_PASSWORD_KEY, password)
      return
    }
    localStorage.removeItem(REMEMBER_LOGIN_KEY)
    localStorage.removeItem(SAVED_USERNAME_KEY)
    localStorage.removeItem(SAVED_PASSWORD_KEY)
  }

  function isLoggedInAdmin() {
    return Boolean(token.value && user.value?.role === 'admin')
  }

  return {
    token,
    user,
    setAuth,
    logout,
    isRememberLoginEnabled,
    getRememberLogin,
    setRememberLogin,
    isLoggedInAdmin,
    consumeSkipAutoLogin,
  }
})
