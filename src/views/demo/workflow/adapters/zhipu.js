/**
 * 智谱 AI 适配器
 * 支持 GLM-4, CogView-4, CogVideoX 等
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

    // 带重试的请求（处理429错误）
    const maxRetries = 3
    let lastError = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        // 如果是重试，等待一段时间
        if (i > 0) {
          const delay = Math.min(1000 * (2 ** i), 10000)
          console.warn(`[智谱AI] 请求限流，${delay / 1000}秒后重试 (${i}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        })

        // 429 Too Many Requests - 继续重试
        if (response.status === 429) {
          const errorText = await response.text()
          lastError = new Error(`请求频率超限，请稍后重试`)
          console.warn(`[智谱AI] 429错误: ${errorText}`)
          continue
        }

        // 其他错误 - 直接抛出
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`智谱 API 错误 ${response.status}: ${errorText}`)
        }

        // 成功
        const data = await response.json()
        return data.choices?.[0]?.message?.content || ''
      }
      catch (error) {
        if (i === maxRetries - 1) {
          throw lastError || error
        }
        lastError = error
      }
    }

    throw lastError || new Error('对话生成失败')
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
        catch {
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
      model: options.model || 'cogview-4',
      prompt,
      size: options.size || '1024x1024',
    }

    // 带重试的请求（处理429错误）
    const maxRetries = 3
    let lastError = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        // 如果是重试，等待一段时间
        if (i > 0) {
          const delay = Math.min(1000 * (2 ** i), 10000) // 指数退避：1s, 2s, 4s
          console.warn(`[智谱AI] 请求限流，${delay / 1000}秒后重试 (${i}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(payload),
        })

        // 429 Too Many Requests - 继续重试
        if (response.status === 429) {
          const errorText = await response.text()
          lastError = new Error(`请求频率超限，请稍后重试`)
          console.warn(`[智谱AI] 429错误: ${errorText}`)
          continue
        }

        // 其他错误 - 直接抛出
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`智谱 API 错误 ${response.status}: ${errorText}`)
        }

        // 成功
        const data = await response.json()
        
        // 调试：查看API返回的数据
        console.warn('[智谱AI] 图片生成API返回:', data)
        
        // 智谱AI的响应格式可能是：
        // 格式1: {data: [{url: '...'}]}
        // 格式2: [{url: '...'}]
        let imageUrl = ''
        
        if (Array.isArray(data)) {
          // 格式2：直接返回数组
          imageUrl = data[0]?.url || ''
        }
        else if (data.data && Array.isArray(data.data)) {
          // 格式1：包裹在data字段中
          imageUrl = data.data[0]?.url || ''
        }
        else if (data.url) {
          // 格式3：直接返回url字段
          imageUrl = data.url
        }
        
        console.warn('[智谱AI] 提取的图片URL:', imageUrl)
        return imageUrl
      }
      catch (error) {
        // 如果是最后一次重试，抛出错误
        if (i === maxRetries - 1) {
          throw lastError || error
        }
        lastError = error
      }
    }

    throw lastError || new Error('图片生成失败')
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

    // 直接调用 API（不使用代理）
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

    // 智谱的视频生成是异步的，返回任务 ID
    return {
      taskId: data.id,
      status: 'processing',
      url: data.video_url,
    }
  }

  /**
   * 获取视频生成任务状态
   */
  async getTaskStatus(taskId) {
    const url = `${this.baseUrl}/async-result/${taskId}`

    // 直接调用 API（不使用代理）
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`智谱 API 错误 ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    return {
      status: data.task_status, // processing, success, failed
      url: data.video_result?.[0]?.url,
      coverUrl: data.video_result?.[0]?.cover_image_url,
    }
  }
}
