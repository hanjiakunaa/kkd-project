import { createApp } from 'vue'
import App from './App.vue'
import { setupDirectives } from './directives'

import { conponentIconPlugins } from './plugins/icons'
import { setupRouter } from './router'
import { setupStore } from './store'

import { setupNaiveDiscreteApi } from './utils'
import '@/styles/reset.css'
import '@/styles/global.css'
import 'uno.css'

async function bootstrap() {
  const app = createApp(App)
  setupStore(app)
  setupDirectives(app)
  await setupRouter(app)
  app.use(conponentIconPlugins)
  app.mount('#app')
  setupNaiveDiscreteApi()
}

bootstrap()
