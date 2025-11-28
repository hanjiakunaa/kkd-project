/**
 * 百度文心适配器
 * 支持文心一言、文心一格图片生成、语音合成
 */

import { BaseAdapter } from './base'

export class BaiduAdapter extends BaseAdapter {
  constructor(config = {}) {
    super(config)
    this.baseUrl = config.baseUrl || 'https://aip.baidubce.com'
  }

  /**
   * 文本生成（文心一言）
   */
  async chat(messages, options = {}) {
    const {
      model = 'ernie-4.0-8k',
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
          provider: 'baidu',
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
      throw new Error(`百度文心 API 错误: ${error.message}`)
    }
  }

  /**
   * 图片生成（文心一格）
   */
  async generateImage(prompt, options = {}) {
    const {
      model = 'sd_xl',
      size = '1024x1024',
      n = 1,
      style = 'base',
    } = options

    try {
      const response = await this.request('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'baidu',
          action: 'image',
          params: {
            model,
            prompt,
            size,
            n,
            style,
          },
        }),
      })

      // 返回图片 URL（文心一格返回 base64，已在后端转换为 data URL）
      if (response.images && response.images.length > 0) {
        return response.images[0].url
      }

      throw new Error('未生成图片')
    }
    catch (error) {
      throw new Error(`文心一格图片生成错误: ${error.message}`)
    }
  }

  /**
   * 语音合成
   */
  async generateAudio(text, options = {}) {
    const {
      voice = 'zh_DuXiaoyao',
      speed = 5,
      pitch = 5,
      volume = 5,
      format = 'mp3',
    } = options

    try {
      const response = await this.request('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'baidu',
          action: 'audio',
          params: {
            text,
            voice,
            speed,
            pitch,
            volume,
            format,
          },
        }),
      })

      return response.audioData
    }
    catch (error) {
      throw new Error(`百度语音合成错误: ${error.message}`)
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
