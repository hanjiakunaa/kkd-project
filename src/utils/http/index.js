import axios from 'axios'
import { setupInterceptors } from './interceptors'
import { createRequestOptimizer, setupRequestOptimizer } from './request-optimizer'

// 创建全局请求优化器
const requestOptimizer = createRequestOptimizer({
  cache: {
    maxSize: 100,
    defaultTTL: 5 * 60 * 1000, // 5分钟
  },
  maxConcurrent: 6, // 最大并发请求数
  retry: {
    maxRetries: 2,
    retryDelay: 1000,
  },
})

export function createAxios(options = {}) {
  const defaultOptions = {
    // 强制使用空字符串作为 baseURL，使用相对路径
    // 在开发环境下会使用 vite.config.js 中配置的代理
    // 在生产环境下会使用 vercel.json 中配置的路由
    // 不再读取 VITE_AXIOS_BASE_URL 环境变量，避免被 mock 地址覆盖
    baseURL: '',
    timeout: 12000,
  }
  const service = axios.create({
    ...defaultOptions,
    ...options,
  })

  // 设置请求优化器（在业务拦截器之前）
  setupRequestOptimizer(service, requestOptimizer)

  // 设置业务拦截器
  setupInterceptors(service)

  // 添加优化器方法到实例
  service.clearCache = (pattern) => {
    requestOptimizer.clearCache(pattern)
  }

  return service
}

export const request = createAxios()

export const mockRequest = createAxios({
  baseURL: '/mock-api',
})

// 导出优化器实例供外部使用
export { requestOptimizer }
