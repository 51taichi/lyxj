<template>
  <div class="phone-frame login-page">
    <div class="login-page__shell">
      <div class="login-page__card">
        <header class="login-page__brand">
          <img class="login-page__logo" src="/assets/pricing-tool-logo.png" alt="定制游核价" />
          <div class="login-page__brand-text">
            <h1 class="login-page__title">定制游核价工具</h1>
            <p class="login-page__subtitle">管理员登录 · 规则与维度维护</p>
          </div>
        </header>

        <div class="login-page__body">
          <div class="login-page__mascot" aria-hidden="true">
            <img src="/assets/login-mascot.png" alt="" />
          </div>

          <div class="login-page__form-wrap">
            <form class="login-form" @submit.prevent="doLogin()">
              <div class="login-form__fields">
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
              </div>

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
.login-page {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  background: #eef1f6;
}

.login-page__shell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: calc(16px * var(--scale));
  overflow: hidden;
}

.login-page__card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
  background: #fff;
  border-radius: calc(20px * var(--scale));
  box-shadow:
    0 4px 24px rgb(52 59 77 / 0.06),
    0 12px 32px rgb(52 59 77 / 0.08);
}

.login-page__brand {
  display: flex;
  align-items: center;
  gap: calc(12px * var(--scale));
  flex-shrink: 0;
  padding: calc(24px * var(--scale)) calc(24px * var(--scale)) calc(16px * var(--scale));
  border-bottom: 1px solid var(--color-border);
}

.login-page__logo {
  width: calc(44px * var(--scale));
  height: calc(44px * var(--scale));
  object-fit: contain;
  flex-shrink: 0;
}

.login-page__brand-text {
  min-width: 0;
}

.login-page__title {
  margin: 0 0 calc(2px * var(--scale));
  font-size: calc(18px * var(--scale));
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.login-page__subtitle {
  margin: 0;
  font-size: calc(13px * var(--scale));
  color: var(--color-text-muted);
  line-height: 1.3;
}

.login-page__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: calc(20px * var(--scale)) calc(24px * var(--scale)) calc(28px * var(--scale));
  overflow: hidden;
}

.login-page__mascot {
  flex-shrink: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  margin-bottom: calc(12px * var(--scale));
  line-height: 0;
}

.login-page__mascot img {
  width: auto;
  max-width: min(100%, calc(280px * var(--scale)));
  max-height: min(calc(160px * var(--scale)), 28vh);
  height: auto;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.login-page__form-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: calc(16px * var(--scale));
}

.login-form__fields {
  display: flex;
  flex-direction: column;
  gap: calc(18px * var(--scale));
}

.login-field {
  display: block;
  cursor: text;
  min-width: 0;
}

.login-field__label {
  display: block;
  margin-bottom: calc(6px * var(--scale));
  font-size: calc(14px * var(--scale));
  font-weight: 500;
  color: var(--color-text-secondary);
}

.login-field__row {
  display: flex;
  align-items: center;
  gap: calc(10px * var(--scale));
  min-height: calc(38px * var(--scale));
}

.login-field__icon {
  flex-shrink: 0;
  width: calc(20px * var(--scale));
  height: calc(20px * var(--scale));
  color: var(--color-text-light);
}

.login-field__input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: calc(4px * var(--scale)) 0;
  font-size: calc(16px * var(--scale));
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
  margin: 0;
  font-size: var(--fs-caption);
  color: #e74c3c;
  text-align: center;
}

.login-remember {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--scale));
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
  min-height: calc(46px * var(--scale));
  padding: 0 calc(24px * var(--scale));
  border: none;
  border-radius: calc(23px * var(--scale));
  background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end));
  box-shadow: 0 calc(6px * var(--scale)) calc(16px * var(--scale)) rgba(87, 136, 248, 0.24);
  color: #fff;
  font-size: var(--fs-btn);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.login-submit:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgba(87, 136, 248, 0.3);
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
  margin-top: calc(16px * var(--scale));
  text-align: center;
  font-size: calc(13px * var(--scale));
}

@media (min-width: 960px) {
  .login-page {
    --page-max-width: none;
    --scale: 1;
    display: flex;
    justify-content: center;
  }

  .login-page__shell {
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    padding: 24px;
  }

  .login-page__card {
    width: 100%;
    max-width: 680px;
    max-height: calc(100vh - 48px);
    margin: 0 auto;
    border-radius: 20px;
  }

  .login-page__brand {
    padding: 26px 28px 20px;
  }

  .login-page__logo {
    width: 44px;
    height: 44px;
  }

  .login-page__title {
    font-size: 18px;
  }

  .login-page__subtitle {
    font-size: 13px;
  }

  .login-page__body {
    display: grid;
    grid-template-columns: minmax(140px, 180px) minmax(0, 1fr);
    gap: 20px 28px;
    align-items: center;
    padding: 24px 28px 32px;
  }

  .login-page__mascot {
    margin-bottom: 0;
    align-self: center;
  }

  .login-page__mascot img {
    max-width: 100%;
    max-height: min(180px, calc(100vh - 320px));
  }

  .login-page__form-wrap {
    min-width: 0;
  }

  .login-form__fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 20px;
  }

  .login-form {
    gap: 18px;
  }

  .login-field__label {
    font-size: 14px;
  }

  .login-field__input {
    font-size: 15px;
  }

  .login-field__row {
    min-height: 40px;
  }

  .login-submit {
    min-height: 44px;
    border-radius: 22px;
  }

  .login-page__back {
    margin-top: 16px;
    font-size: 13px;
    text-align: left;
  }
}
</style>
