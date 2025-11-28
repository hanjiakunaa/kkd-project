/**
 * AI 服务商统一路由
 * 根据 provider 参数选择对应的处理器
 */

import { handleBaiduRequest } from './baidu.js'
import { handleHunyuanRequest } from './hunyuan.js'
import { handleOpenAIRequest } from './openai.js'
import { handleQwenRequest } from './qwen.js'
import { handleZhipuRequest } from './zhipu.js'
import { handleDeepSeekRequest } from './deepseek.js'
import { handleMoonshotRequest } from './moonshot.js'

const PROVIDERS = {
  openai: handleOpenAIRequest,
  zhipu: handleZhipuRequest,
  qwen: handleQwenRequest,
  deepseek: handleDeepSeekRequest,
  moonshot: handleMoonshotRequest,
  hunyuan: handleHunyuanRequest,
  baidu: handleBaiduRequest,
}

/**
 * 获取 API Key（从环境变量）
 */
function getApiCredentials(provider) {
  const envKey = `${provider.toUpperCase()}_API_KEY`
  const apiKey = process.env[envKey]

  // 特殊服务商需要额外的凭证
  if (provider === 'hunyuan') {
    return {
      secretId: process.env.HUNYUAN_SECRET_ID,
      secretKey: process.env.HUNYUAN_SECRET_KEY,
    }
  }

  if (provider === 'baidu') {
    return {
      apiKey: process.env.BAIDU_API_KEY,
      secretKey: process.env.BAIDU_SECRET_KEY,
    }
  }

  return { apiKey }
}

/**
 * 处理 AI 请求
 */
export async function handleAIRequest(provider, body) {
  const handler = PROVIDERS[provider]

  if (!handler) {
    throw new Error(`不支持的 AI 服务商: ${provider}`)
  }

  // 获取凭证
  const credentials = getApiCredentials(provider)

  // 验证凭证
  if (provider === 'hunyuan') {
    if (!credentials.secretId || !credentials.secretKey) {
      throw new Error('未配置腾讯混元凭证，请设置 HUNYUAN_SECRET_ID 和 HUNYUAN_SECRET_KEY')
    }
    return await handler(body, credentials.secretId, credentials.secretKey)
  }

  if (provider === 'baidu') {
    if (!credentials.apiKey || !credentials.secretKey) {
      throw new Error('未配置百度凭证，请设置 BAIDU_API_KEY 和 BAIDU_SECRET_KEY')
    }
    return await handler(body, credentials.apiKey, credentials.secretKey)
  }

  if (!credentials.apiKey) {
    throw new Error(`未配置 ${provider} 的 API Key，请在环境变量中设置 ${provider.toUpperCase()}_API_KEY`)
  }

  return await handler(body, credentials.apiKey)
}
