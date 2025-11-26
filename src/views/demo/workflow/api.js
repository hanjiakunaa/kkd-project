import { request } from '@/utils'

export default {
  // AI 代理请求
  aiProxy: data => request.post('/proxy', data),
}
