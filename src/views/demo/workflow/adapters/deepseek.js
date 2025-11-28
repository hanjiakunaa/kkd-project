/**
 * DeepSeek 适配器
 * 支持 DeepSeek-Chat, DeepSeek-Coder
 */

import { BaseAdapter } from './base'

export class DeepSeekAdapter extends BaseAdapter {
  constructor(config = {}) {
    super({
      baseUrl: config.baseUrl || 'https://api.deepseek.com',
      ...config,
    })
  }

  /**
   * Chat Completion (兼容 OpenAI 格式)
   */
  async chat(messages, options = {}) {
    const url = `${this.baseUrl}/chat/completions`
    const payload = {
      model: options.model || 'deepseek-chat',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
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
      throw new Error(`DeepSeek API 错误 ${response.status}: ${errorText}`)
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
      model: options.model || 'deepseek-chat',
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
}
