/**
 * LLM 节点执行器
 * 处理大语言模型文本生成任务
 */

import { createAdapter } from '../adapters'
import { BaseExecutor } from './base'

export class LLMExecutor extends BaseExecutor {
  constructor() {
    super()
    this.name = 'LLMExecutor'
  }

  /**
   * 执行 LLM 文本生成
   */
  async execute(node, input, context) {
    const { provider, model, temperature, maxTokens, systemPrompt } = node.data.params

    // 验证必要参数
    if (!provider) {
      throw new Error('未配置 AI 服务商')
    }

    // 获取 API 配置
    const apiKey = context.getApiKey(provider)
    const baseUrl = context.getBaseUrl(provider)

    if (!apiKey) {
      throw new Error(`未配置 ${provider} 的 API Key`)
    }

    // 创建适配器
    const adapter = createAdapter(provider, { apiKey, baseUrl })

    // 构建消息（确保 user 内容非空）
    const userContent = String(input || '').trim() || context.defaultInput || '你好，请介绍一下你自己。'
    const messages = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: userContent })

    // 调用 AI
    const options = {
      model,
      temperature: Number.parseFloat(temperature) || 0.7,
      maxTokens: Number.parseInt(maxTokens) || undefined,
    }

    let result
    if (context.useStream) {
      // 流式输出
      result = await adapter.chatStream(messages, options, (chunk) => {
        context.onStreamChunk?.(node.id, chunk)
      })
    }
    else {
      // 普通输出
      result = await adapter.chat(messages, options)
    }

    return result
  }

  /**
   * 验证节点配置
   */
  validate(node) {
    const { provider, model } = node.data.params

    if (!provider) {
      return { valid: false, error: '请选择 AI 服务商' }
    }

    if (!model) {
      return { valid: false, error: '请选择模型' }
    }

    return { valid: true, error: null }
  }

  /**
   * 预估执行时间
   */
  getEstimatedDuration(node) {
    const { model } = node.data.params
    // 根据模型类型预估时间
    if (model?.includes('gpt-4')) {
      return 5000 // 5 秒
    }
    return 3000 // 3 秒
  }
}
