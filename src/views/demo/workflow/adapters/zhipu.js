/**
 * 智谱 AI 适配器
 * 支持 GLM-4, CogView-3, CogVideoX 等
 */

import { BaseAdapter } from './base'

export class ZhipuAdapter extends BaseAdapter {
  constructor(config = {}) {
    super({
      baseUrl: config.baseUrl || 'https://open.bigmodel.cn/api/paas/v4',
      ...config,
    })
  }

  /**
   * Chat Completion
   */
  async chat(messages, options = {}) {
    const url = `${this.baseUrl}/chat/completions`
    const payload = {
      model: options.model || 'glm-4-flash',
      messages,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 0.7,
      max_tokens: options.maxTokens,
    }

    // 直接调用 API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`智谱 API 错误 ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }

  /**
   * 流式 Chat
   */
  async chatStream(messages, options = {}, onChunk) {
    const url = `${this.baseUrl}/chat/completions`
    const payload = {
      model: options.model || 'glm-4-flash',
      messages,
      temperature: options.temperature ?? 0.7,
      stream: true,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done)
        break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '))

      for (const line of lines) {
        const data = line.replace(/^data: /, '')
        if (data === '[DONE]')
          continue

        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content || ''
          if (content) {
            fullText += content
            if (onChunk) {
              onChunk(content)
            }
          }
        }
        catch (e) {
          // 忽略解析错误
        }
      }
    }

    return fullText
  }

  /**
   * 图片生成 (CogView)
   */
  async generateImage(prompt, options = {}) {
    const url = `${this.baseUrl}/images/generations`
    const payload = {
      model: options.model || 'cogview-3',
      prompt,
      size: options.size || '1024x1024',
    }

    const response = await this._proxyRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: payload,
    })

    return response.data?.data?.[0]?.url || ''
  }

  /**
   * 视频生成 (CogVideoX)
   */
  async generateVideo(input, options = {}) {
    const url = `${this.baseUrl}/videos/generations`

    // 支持文本生视频和图生视频
    const payload = {
      model: options.model || 'cogvideox',
      prompt: typeof input === 'string' ? input : input.prompt,
      image_url: typeof input === 'object' ? input.imageUrl : undefined,
    }

    const response = await this._proxyRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: payload,
    })

    // 智谱的视频生成是异步的，返回任务 ID
    return {
      taskId: response.data?.id,
      status: 'processing',
      url: response.data?.video_url,
    }
  }

  /**
   * 获取视频生成任务状态
   */
  async getTaskStatus(taskId) {
    const url = `${this.baseUrl}/async-result/${taskId}`

    const response = await this._proxyRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    })

    return {
      status: response.data?.task_status, // processing, success, failed
      url: response.data?.video_result?.[0]?.url,
      coverUrl: response.data?.video_result?.[0]?.cover_image_url,
    }
  }
}

