<template>
  <div class="phone-frame login-page">
    <div class="page-bg">
      <img src="/proto-assets/goals/page-bg.png" alt="" />
    </div>

    <div class="page-scroll page-content page-content--no-nav login-page__panel">
      <header class="login-page__brand">
        <h1 class="hero__title">
          <img class="hero__logo" src="/assets/pricing-tool-logo.png" alt="" />
          定制游核价工具
        </h1>
        <p class="hero__subtitle login-page__subtitle">管理员登录 · 规则与维度维护</p>
      </header>

      <div class="login-page__center">
        <div class="login-page__mascot" aria-hidden="true">
          <img src="/assets/login-mascot.png" alt="" />
        </div>

        <form class="login-form" @submit.prevent="doLogin()">
        <label class="login-field">
          <span class="login-field__label">账号</span>
          <div class="login-field__row">
            <svg class="login-field__icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M5 20c0-3.866 3.134-7 7-7s7 3.134 7 7"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            <input
              v-model="username"
              class="login-field__input"
              type="text"
              placeholder="管理员账号"
              autocomplete="username"
            />
          </div>
          <span class="login-field__line" />
        </label>

        <label class="login-field">
          <span class="login-field__label">密码</span>
          <div class="login-field__row">
            <svg class="login-field__icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="6" y="11" width="12" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M9 11V8a3 3 0 0 1 6 0v3"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            <input
              v-model="password"
              class="login-field__input"
              type="password"
              placeholder="密码"
              autocomplete="current-password"
            />
          </div>
          <span class="login-field__line" />
        </label>

        <p v-if="error" class="login-error">{{ error }}</p>

        <label class="login-remember">
          <input v-model="rememberLogin" type="checkbox" class="login-remember__input" />
          <span class="login-remember__text">记住密码</span>
        </label>

        <button class="login-submit" type="submit" :disabled="loading">
          <span>{{ loading ? '登录中…' : '登录' }}</span>
          <svg class="login-submit__arrow" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M5 12h12M13 7l5 5-5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </form>

        <RouterLink class="top-link login-page__back" to="/quote">
          ← 返回核价向导（业务员无需登录）
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')
const rememberLogin = ref(auth.isRememberLoginEnabled())
const error = ref('')
const loading = ref(false)

function restoreSavedCredentials() {
  const saved = auth.getRememberLogin()
  if (!saved) return
  username.value = saved.username
  password.value = saved.password
  rememberLogin.value = true
}

async function doLogin(options?: { auto?: boolean }) {
  error.value = ''
  loading.value = true
  try {
    const { token, user } = await api.login(username.value, password.value)
    if (user.role !== 'admin') {
      error.value = '请使用管理员账号登录'
      return
    }
    auth.setAuth(token, user)
    auth.setRememberLogin(rememberLogin.value, username.value, password.value)
    await router.replace('/admin')
  } catch (e) {
    if (options?.auto) {
      auth.setRememberLogin(false)
      rememberLogin.value = false
    }
    error.value = e instanceof Error ? e.message : '登录失败'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (auth.isLoggedInAdmin()) {
    await router.replace('/admin')
    return
  }
  const skipAutoLogin = auth.consumeSkipAutoLogin()
  restoreSavedCredentials()
  if (!skipAutoLogin && rememberLogin.value && username.value && password.value) {
    await doLogin({ auto: true })
  }
})
</script>

<style scoped>
.login-page__panel {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-top: calc(12px * var(--scale));
  padding-bottom: calc(16px * var(--scale));
}

.login-page__brand {
  flex-shrink: 0;
  margin-top: calc(16px * var(--scale));
  padding-top: calc(8px * var(--scale));
  padding-bottom: calc(8px * var(--scale));
  text-align: center;
}

.login-page__brand .hero__title {
  justify-content: center;
  margin-bottom: calc(4px * var(--scale));
}

.login-page__subtitle {
  margin: 0;
  font-size: calc(14px * var(--scale));
  color: var(--color-text-muted);
}

.login-page__center {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-page__mascot {
  margin-bottom: calc(32px * var(--scale));
  line-height: 0;
  text-align: center;
}

.login-page__mascot img {
  width: min(100%, calc(400px * var(--scale)));
  height: auto;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: calc(22px * var(--scale));
  padding: 0 calc(88px * var(--scale));
}

.login-field {
  display: block;
  cursor: text;
}

.login-field__label {
  display: block;
  margin-bottom: calc(8px * var(--scale));
  font-size: calc(15px * var(--scale));
  font-weight: 500;
  color: var(--color-text-secondary);
}

.login-field__row {
  display: flex;
  align-items: center;
  gap: calc(12px * var(--scale));
  min-height: calc(42px * var(--scale));
}

.login-field__icon {
  flex-shrink: 0;
  width: calc(22px * var(--scale));
  height: calc(22px * var(--scale));
  color: var(--color-text-light);
}

.login-field__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: calc(6px * var(--scale)) 0;
  font-size: calc(17px * var(--scale));
  color: var(--color-text-primary);
  outline: none;
}

.login-field__input::placeholder {
  color: var(--color-text-light);
}

.login-field__line {
  display: block;
  height: 1px;
  margin-top: calc(2px * var(--scale));
  background: var(--color-border);
  transition: background 0.2s, transform 0.2s;
}

.login-field:focus-within .login-field__line {
  background: var(--color-primary);
  transform: scaleY(1.5);
  transform-origin: center;
}

.login-field:focus-within .login-field__icon {
  color: var(--color-primary);
}

.login-error {
  margin: calc(-4px * var(--scale)) 0 0;
  font-size: var(--fs-caption);
  color: #e74c3c;
  text-align: center;
}

.login-remember {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--scale));
  margin-top: calc(-4px * var(--scale));
  cursor: pointer;
  user-select: none;
}

.login-remember__input {
  width: calc(16px * var(--scale));
  height: calc(16px * var(--scale));
  accent-color: var(--color-primary);
  cursor: pointer;
}

.login-remember__text {
  font-size: calc(14px * var(--scale));
  color: var(--color-text-muted);
}

.login-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(10px * var(--scale));
  width: 100%;
  margin-top: calc(10px * var(--scale));
  min-height: calc(50px * var(--scale));
  padding: 0 calc(24px * var(--scale));
  border: none;
  border-radius: calc(25px * var(--scale));
  background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end));
  box-shadow: 0 calc(8px * var(--scale)) calc(20px * var(--scale)) rgba(87, 136, 248, 0.28);
  color: #fff;
  font-size: var(--fs-btn);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.login-submit:active:not(:disabled) {
  transform: translateY(1px);
}

.login-submit:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.login-submit__arrow {
  width: calc(18px * var(--scale));
  height: calc(18px * var(--scale));
}

.login-page__back {
  display: block;
  margin-top: calc(24px * var(--scale));
  text-align: center;
}
</style>
