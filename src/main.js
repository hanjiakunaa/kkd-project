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
import { setupPerformanceMonitor } from './utils/performance-monitor'
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
  // 标记应用启动开始
  performance?.mark('app-start')

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

  // 标记应用挂载开始
  performance?.mark('app-mount-start')
  app.mount('#app')
  performance?.mark('app-mount-end')

  setupNaiveDiscreteApi()
  setupPwa()

  // 初始化性能监控
  const monitor = setupPerformanceMonitor({
    enableLogging: import.meta.env.DEV,
    // reportEndpoint: '/api/performance', // 生产环境可以上报到后端
  })

  // 测量应用启动时间
  if (performance?.mark) {
    performance.mark('app-ready')
    performance.measure('app-bootstrap', 'app-start', 'app-ready')
    performance.measure('app-mount', 'app-mount-start', 'app-mount-end')

    const bootstrap = performance.getEntriesByName('app-bootstrap')[0]
    const mount = performance.getEntriesByName('app-mount')[0]

    if (import.meta.env.DEV) {
      console.log(`🚀 应用启动耗时: ${bootstrap.duration.toFixed(2)}ms`)
      console.log(`📦 应用挂载耗时: ${mount.duration.toFixed(2)}ms`)
    }
  }
}

bootstrap()
