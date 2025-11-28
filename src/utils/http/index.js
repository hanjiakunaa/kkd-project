import axios from 'axios'
import { setupInterceptors } from './interceptors'

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
  setupInterceptors(service)
  return service
}

export const request = createAxios()

export const mockRequest = createAxios({
  baseURL: '/mock-api',
})
