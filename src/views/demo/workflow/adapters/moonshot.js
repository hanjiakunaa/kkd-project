/**
 * Moonshot AI (Kimi) 适配器
 * 完全兼容 OpenAI 格式，支持超长上下文（200k tokens）
 */

import { OpenAIAdapter } from './openai'

export class MoonshotAdapter extends OpenAIAdapter {
  constructor(config = {}) {
    super({
      ...config,
      baseUrl: config.baseUrl || 'https://api.moonshot.cn/v1',
    })
  }

  /**
   * Moonshot 特点：支持超长上下文
   * 默认使用 moonshot-v1-8k，可选 moonshot-v1-32k, moonshot-v1-128k
   */
  async chat(messages, options = {}) {
    const {
      model = 'moonshot-v1-8k',
      ...restOptions
    } = options

    // 直接调用 OpenAI 适配器的 chat 方法
    return super.chat(messages, {
      model,
      ...restOptions,
    })
  }
}

