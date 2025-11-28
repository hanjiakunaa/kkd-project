/**
 * 腾讯混元适配器
 * 支持混元大模型、混元 DiT 图片生成
 */

import { BaseAdapter } from './base'

export class HunyuanAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config)
    this.baseUrl = config.baseUrl || 'https://hunyuan.tencentcloudapi.com'
  }

  /**
   * 文本生成（混元大模型）
   */
  async chat(messages, options = {}) {
    const {
      model = 'hunyuan-pro',
      temperature = 0.7,
      maxTokens = 2000,
    } = options

    try {
      const response = await this.request('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'hunyuan',
          action: 'chat',
          params: {
            model,
            messages,
            temperature,
            maxTokens,
          },
        }),
      })

      return response.content || ''
    }
    catch (error) {
      throw new Error(`腾讯混元 API 错误: ${error.message}`)
    }
  }

  /**
   * 图片生成（混元 DiT）
   */
  async generateImage(prompt, options = {}) {
    const {
      model = 'hunyuan-dit',
      size = '1024x1024',
      n = 1,
    } = options

    try {
      const response = await this.request('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'hunyuan',
          action: 'image',
          params: {
            model,
            prompt,
            size,
            n,
          },
        }),
      })

      // 返回图片 URL
      if (response.url) {
        return response.url
      }

      throw new Error('未生成图片')
    }
    catch (error) {
      throw new Error(`混元 DiT 图片生成错误: ${error.message}`)
    }
  }

  /**
   * 统一请求方法
   */
  async request(url, options = {}) {
    const response = await fetch(url, options)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.code !== 200) {
      throw new Error(result.message || '请求失败')
    }

    return result.data
  }
}

