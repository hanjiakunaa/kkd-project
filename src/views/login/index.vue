<template>
  <div class="login-container wh-full flex-col bg-cover">
    <div class="canvas-background" />
    <canvas id="canvas" ref="canvasRef" />
    <div class="login-content">
      <div class="login-card">
        <div class="login-banner hidden md:block">
          <img src="@/assets/images/login_banner.webp" class="banner-image" alt="login_banner">
        </div>

        <div class="login-form">
          <div class="login-header">
            <h-icon name="pi-gastly" :scale="2.5" :hover="true" animation="ring" speed="slow" />
            <h2 class="login-title">
              {{ title }}
            </h2>
          </div>

          <div class="form-group">
            <n-input
              v-model:value="loginInfo.username"
              autofocus
              class="custom-input"
              placeholder="请输入用户名"
              :maxlength="20"
              size="large"
            >
              <template #prefix>
                <i class="input-icon i-fe:user" />
              </template>
            </n-input>
          </div>

          <div class="form-group">
            <n-input
              v-model:value="loginInfo.password"
              class="custom-input"
              type="password"
              show-password-on="mousedown"
              placeholder="请输入密码"
              :maxlength="20"
              size="large"
              @keydown.enter="handleLogin()"
            >
              <template #prefix>
                <i class="input-icon i-fe:lock" />
              </template>
            </n-input>
          </div>

          <div class="form-options">
            <n-checkbox
              :checked="isRemember"
              label="记住我"
              :on-update:checked="(val) => (isRemember = val)"
            />
          </div>

          <div class="form-actions">
            <n-button
              class="action-button secondary-button"
              size="large"
              @click="quickLogin()"
            >
              <span class="button-content">
                <i class="button-icon i-fe:zap" />
                <span>一键体验</span>
              </span>
            </n-button>

            <n-button
              class="action-button primary-button"
              size="large"
              :loading="loading"
              @click="handleLogin()"
            >
              <span class="button-content">
                <span>登录</span>
                <i class="button-icon i-fe:arrow-right" />
              </span>
            </n-button>
          </div>
        </div>
      </div>

      <the-footer class="footer-wrapper" />
    </div>
  </div>
</template>

<script setup>
import { useStorage } from '@vueuse/core'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import TubesCursor from '@/lib/tubes1.min.js'
import { useAuthStore } from '@/store'
import { lStorage, throttle } from '@/utils'

// import api from './api'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const title = import.meta.env.VITE_TITLE

const loginInfo = ref({
  username: '',
  password: '',
})

const captchaUrl = ref('')
const initCaptcha = throttle(() => {
  // 移除验证码接口，使用本地图片或不显示
  captchaUrl.value = ''
}, 500)

const localLoginInfo = lStorage.get('loginInfo')
if (localLoginInfo) {
  loginInfo.value.username = localLoginInfo.username || ''
  loginInfo.value.password = localLoginInfo.password || ''
}
initCaptcha()

function quickLogin() {
  loginInfo.value.username = 'admin'
  loginInfo.value.password = '123456'
  handleLogin()
}

const isRemember = useStorage('isRemember', true)
const loading = ref(false)
async function handleLogin() {
  const { username, password } = loginInfo.value
  if (!username || !password)
    return $message.warning('请输入用户名和密码')
  // 移除验证码验证
  try {
    loading.value = true
    $message.loading('正在验证，请稍后...', { key: 'login' })
    // 移除接口调用，前端直接处理登录
    // 模拟登录验证
    await new Promise(resolve => setTimeout(resolve, 500))

    // 模拟返回的 token 数据
    const data = {
      accessToken: `mock_token_${Date.now()}`,
    }

    if (isRemember.value) {
      lStorage.set('loginInfo', { username, password })
    }
    else {
      lStorage.remove('loginInfo')
    }
    onLoginSuccess(data)
  }
  catch (error) {
    $message.destroy('login')
    console.error(error)
  }
  loading.value = false
}

async function onLoginSuccess(data = {}) {
  authStore.setToken(data)
  $message.loading('登录中...', { key: 'login' })
  try {
    $message.success('登录成功', { key: 'login' })
    if (route.query.redirect) {
      const path = route.query.redirect
      delete route.query.redirect
      router.push({ path, query: route.query })
    }
    else {
      router.push('/')
    }
  }
  catch (error) {
    console.error(error)
    $message.destroy('login')
  }
}

const canvasRef = ref(null)
const canvasDom = ref(null)

// 生成随机颜色的辅助函数
function randomColors(count) {
  return Array.from({ length: count }, () => {
    const hex = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    return `#${hex}`
  })
}

// 初始化画布
function initCanvas() {
  const canvasElement = canvasRef.value || document.getElementById('canvas')
  if (!canvasElement) {
    console.warn('Canvas element not found')
    return
  }

  try {
    canvasDom.value = new TubesCursor(canvasElement, {
      tubes: {
        colors: ['#f967fb', '#53bc28', '#6958d5'],
        lights: {
          intensity: 200,
          colors: ['#83f36e', '#fe8a2e', '#ff008a', '#60aed5'],
        },
      },
    })
  }
  catch (error) {
    console.error('Failed to initialize canvas:', error)
  }
}

// 处理点击事件，更新颜色
function handleCanvasClick() {
  if (!canvasDom.value?.tubes)
    return

  try {
    const colors = randomColors(3)
    const lightsColors = randomColors(4)
    canvasDom.value.tubes.setColors(colors)
    canvasDom.value.tubes.setLightsColors(lightsColors)
  }
  catch (error) {
    console.error('Failed to update canvas colors:', error)
  }
}

// 组件挂载时初始化
onMounted(async () => {
  await nextTick()
  initCanvas()
  document.body.addEventListener('click', handleCanvasClick)
})

// 组件卸载时清理
onUnmounted(() => {
  document.body.removeEventListener('click', handleCanvasClick)
  if (canvasDom.value) {
    try {
      canvasDom.value.dispose?.()
    }
    catch (error) {
      console.error('Failed to dispose canvas:', error)
    }
    canvasDom.value = null
  }
})
</script>

<style scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

/* Canvas 背景渐变层 - 让背景不那么黑 */
.canvas-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: radial-gradient(circle at 20% 50%, rgba(64, 224, 208, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(138, 43, 226, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 20%, rgba(30, 144, 255, 0.06) 0%, transparent 50%),
    linear-gradient(135deg, rgba(18, 18, 28, 0.98) 0%, rgba(15, 15, 25, 0.99) 50%, rgba(12, 12, 22, 0.98) 100%);
  pointer-events: none;
}

#canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.8;
  mix-blend-mode: screen;
}

.login-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  justify-content: center;
  align-items: center;
  padding: 20px;
  pointer-events: none;
}

.login-card {
  position: relative;
  pointer-events: auto;
  max-width: 900px;
  width: 100%;
  min-width: 345px;
  display: flex;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(64, 224, 208, 0.1) inset,
    0 1px 2px rgba(255, 255, 255, 0.15) inset,
    0 2px 8px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(64, 224, 208, 0.5), transparent);
  opacity: 0.6;
}

.login-card:hover {
  box-shadow:
    0 16px 56px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(64, 224, 208, 0.2) inset,
    0 1px 2px rgba(255, 255, 255, 0.2) inset,
    0 4px 12px rgba(0, 0, 0, 0.3);
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.18);
}

.login-banner {
  width: 420px;
  padding: 40px 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.03);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.banner-image {
  width: 100%;
  height: auto;
  border-radius: 12px;
  opacity: 0.9;
}

.login-form {
  flex: 1;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  min-width: 320px;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.85) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 2px 12px rgba(0, 212, 255, 0.2);
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 24px;
}

.custom-input {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.custom-input:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.custom-input:focus-within {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(0, 212, 255, 0.6);
  box-shadow:
    0 0 0 3px rgba(0, 212, 255, 0.15),
    0 4px 12px rgba(0, 212, 255, 0.1);
}

:deep(.custom-input .n-input__input-el) {
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
}

:deep(.custom-input .n-input__input-el::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.input-icon {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.5);
  margin-right: 8px;
}

.form-options {
  margin-bottom: 32px;
}

:deep(.form-options .n-checkbox) {
  color: rgba(255, 255, 255, 0.8);
}

.form-actions {
  display: flex;
  gap: 16px;
  margin-top: auto;
}

.action-button {
  flex: 1;
  height: 52px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.button-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
}

/* 主按钮 - 登录按钮 */
:deep(.primary-button) {
  background: linear-gradient(135deg, #00d4ff 0%, #00a8cc 100%);
  border: 1px solid rgba(0, 212, 255, 0.5);
  color: #fff;
  box-shadow:
    0 4px 20px rgba(0, 212, 255, 0.3),
    0 0 0 0 rgba(0, 212, 255, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
}

:deep(.primary-button::before) {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

:deep(.primary-button:hover) {
  background: linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%);
  border-color: rgba(0, 229, 255, 0.7);
  box-shadow:
    0 6px 28px rgba(0, 212, 255, 0.4),
    0 0 0 4px rgba(0, 212, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

:deep(.primary-button:hover::before) {
  left: 100%;
}

:deep(.primary-button:active) {
  transform: translateY(0);
  box-shadow:
    0 2px 12px rgba(0, 212, 255, 0.3),
    0 0 0 2px rgba(0, 212, 255, 0.2);
}

:deep(.primary-button:hover .button-icon) {
  transform: translateX(2px);
}

/* 次按钮 - 一键体验按钮 */
:deep(.secondary-button) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  position: relative;
}

:deep(.secondary-button::after) {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 14px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

:deep(.secondary-button:hover) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
  color: #fff;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

:deep(.secondary-button:hover::after) {
  opacity: 1;
}

:deep(.secondary-button:active) {
  transform: translateY(0);
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

:deep(.secondary-button:hover .button-icon) {
  transform: scale(1.1) rotate(5deg);
}

.footer-wrapper {
  position: relative;
  z-index: 10;
  pointer-events: auto;
  margin-top: 32px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
  }

  .login-banner {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 24px;
  }

  .login-form {
    padding: 32px 24px;
  }

  .form-actions {
    flex-direction: column;
  }

  .action-button {
    width: 100%;
  }
}
</style>
