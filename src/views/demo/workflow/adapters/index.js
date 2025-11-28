/**
 * AI 适配器工厂
 * 根据服务商创建对应的适配器实例
 */

import { BaseAdapter } from './base'
import { BaiduAdapter } from './baidu'
import { DeepSeekAdapter } from './deepseek'
import { HunyuanAdapter } from './hunyuan'
import { MoonshotAdapter } from './moonshot'
import { OpenAIAdapter } from './openai'
import { QwenAdapter } from './qwen'
import { ZhipuAdapter } from './zhipu'

// 适配器映射
const ADAPTERS = {
  openai: OpenAIAdapter,
  zhipu: ZhipuAdapter,
  qwen: QwenAdapter,
  deepseek: DeepSeekAdapter,
  moonshot: MoonshotAdapter, // Moonshot 兼容 OpenAI 格式
  hunyuan: HunyuanAdapter, // ✅ 腾讯混元
  baidu: BaiduAdapter, // ✅ 百度文心
  xfyun: BaseAdapter, // TODO: 实现讯飞星火适配器
}

/**
 * 创建适配器实例
 * @param {string} provider - 服务商 ID
 * @param {Object} config - 配置对象 {apiKey, baseUrl}
 * @returns {BaseAdapter} - 适配器实例
 */
export function createAdapter(provider, config = {}) {
  const AdapterClass = ADAPTERS[provider]

  if (!AdapterClass) {
    throw new Error(`不支持的 AI 服务商: ${provider}`)
  }

  if (AdapterClass === BaseAdapter) {
    throw new Error(`${provider} 适配器尚未实现`)
  }

  return new AdapterClass(config)
}

/**
 * 检查服务商是否支持
 * @param {string} provider - 服务商 ID
 * @returns {boolean}
 */
export function isProviderSupported(provider) {
  return ADAPTERS[provider] && ADAPTERS[provider] !== BaseAdapter
}

/**
 * 获取所有已实现的服务商列表
 * @returns {Array<string>}
 */
export function getSupportedProviders() {
  return Object.keys(ADAPTERS).filter(
    provider => ADAPTERS[provider] !== BaseAdapter,
  )
}

export {
  BaiduAdapter,
  BaseAdapter,
  DeepSeekAdapter,
  HunyuanAdapter,
  MoonshotAdapter,
  OpenAIAdapter,
  QwenAdapter,
  ZhipuAdapter,
}

