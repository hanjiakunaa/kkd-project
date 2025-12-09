import screenfull from 'screenfull'
import { createApp } from 'vue'
import App from './App.vue'
import { setupDirectives } from './directives'
import { setupGlobalComponents } from './plugins/components'
import { conponentIconPlugins } from './plugins/icons'
import { setupPwa } from './plugins/pwa'

import { setupRouter } from './router'
import { setupStore } from './store'
import { setupNaiveDiscreteApi } from './utils'
import '@/styles/reset.css'
import '@/styles/global.css'
import 'uno.css'

// 抑制开发环境中的 aria-hidden 可访问性警告（来自 Naive UI 组件）
if (import.meta.env.DEV) {
  const originalWarn = console.warn
  console.warn = (...args) => {
    const message = args[0]
    // 过滤 aria-hidden 相关的可访问性警告
    if (typeof message === 'string' && message.includes('aria-hidden')) {
      return
    }
    originalWarn.apply(console, args)
  }
}

async function bootstrap() {
  const app = createApp(App)

  // 挂载 screenfull 到全局属性
  app.config.globalProperties.$screenfull = screenfull

  // 注册全局通用组件
  app.use(setupGlobalComponents)
  // 先注册图标组件，确保在渲染菜单前可用
  app.use(conponentIconPlugins)
  setupStore(app)
  setupDirectives(app)
  await setupRouter(app)
  app.mount('#app')
  setupNaiveDiscreteApi()
  setupPwa()
}

bootstrap()
