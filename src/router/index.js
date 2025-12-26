import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { setupRouteOptimizer } from '@/utils/route-optimizer'
import { basicRoutes } from './basic-routes'
import { setupRouterGuards } from './guards'

export const router = createRouter({
  history:
    import.meta.env.VITE_USE_HASH === 'true'
      ? createWebHashHistory(import.meta.env.VITE_PUBLIC_PATH || '/')
      : createWebHistory(import.meta.env.VITE_PUBLIC_PATH || '/'),
  routes: basicRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export async function setupRouter(app) {
  app.use(router)
  setupRouterGuards(router)
  // 启用路由优化和预加载
  setupRouteOptimizer(router)
}
