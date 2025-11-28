/**
 * 音频生成节点执行器
 * 处理文本转语音任务
 */

import { createAdapter } from '../adapters'
import { BaseExecutor } from './base'

export class AudioGenExecutor extends BaseExecutor {
  constructor() {
    super()
    this.name = 'AudioGenExecutor'
  }

  /**
   * 执行音频生成
   */
  async execute(node, input, context) {
    const { provider, model, voice, speed } = node.data.params

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

    // 生成音频
    const text = String(input)
    const options = {
      model,
      voice: voice || 'alloy',
      speed: Number.parseFloat(speed) || 1.0,
    }

    const audioUrl = await adapter.generateAudio(text, options)

    if (!audioUrl) {
      throw new Error('音频生成失败，未返回 URL')
    }

    return {
      type: 'audio',
      url: audioUrl,
      text,
      markdown: `[播放音频](${audioUrl})`,
    }
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
    // TTS 通常较快，3-5 秒
    return 4000
  }

  /**
   * 格式化输出
   */
  formatOutput(output, format = 'markdown') {
    if (typeof output === 'object' && output.markdown) {
      return output.markdown
    }
    return String(output)
  }
}

