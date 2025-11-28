/**
 * 阿里通义千问适配器
 * 支持 Qwen-Max, Qwen-Plus, 通义万相等
 */

import { BaseAdapter } from './base'

export class QwenAdapter extends BaseAdapter {
  constructor(config = {}) {
    super({
      baseUrl: config.baseUrl || 'https://dashscope.aliyuncs.com/api/v1',
      ...config,
    })
  }

  /**
   * Chat Completion
   */
  async chat(messages, options = {}) {
    const url = `${this.baseUrl}/services/aigc/text-generation/generation`
    const payload = {
      model: options.model || 'qwen-plus',
      input: {
        messages,
      },
      parameters: {
        temperature: options.temperature ?? 0.7,
        top_p: options.topP ?? 0.8,
        max_tokens: options.maxTokens,
        result_format: 'message',
      },
    }

    // 直接调用 API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-DashScope-SSE': 'disable',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`通义 API 错误 ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return data.output?.choices?.[0]?.message?.content || ''
  }

  /**
   * 流式 Chat
   */
  async chatStream(messages, options = {}, onChunk) {
    const url = `${this.baseUrl}/services/aigc/text-generation/generation`
    const payload = {
      model: options.model || 'qwen-plus',
      input: {
        messages,
      },
      parameters: {
        temperature: options.temperature ?? 0.7,
        result_format: 'message',
        incremental_output: true,
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-DashScope-SSE': 'enable',
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
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'))

      for (const line of lines) {
        const data = line.replace(/^data:\s*/, '')
        if (!data)
          continue

        try {
          const json = JSON.parse(data)
          const content = json.output?.choices?.[0]?.message?.content || ''
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
   * 图片生成 (通义万相)
   */
  async generateImage(prompt, options = {}) {
    const url = `${this.baseUrl}/services/aigc/text2image/image-synthesis`
    const payload = {
      model: options.model || 'wanx-v1',
      input: {
        prompt,
      },
      parameters: {
        size: options.size || '1024*1024',
        n: options.n || 1,
        style: options.style || '<auto>',
      },
    }

    const response = await this._proxyRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: payload,
    })

    return response.data?.output?.results?.[0]?.url || ''
  }

  /**
   * OCR 识别
   */
  async ocr(imageUrl, options = {}) {
    const url = `${this.baseUrl}/services/aigc/ocr/ocr`
    const payload = {
      model: 'qwen-vl-ocr',
      input: {
        image: imageUrl,
      },
    }

    const response = await this._proxyRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: payload,
    })

    return response.data?.output?.text || ''
  }

  /**
   * 文本向量化
   */
  async embedding(input, options = {}) {
    const url = `${this.baseUrl}/services/embeddings/text-embedding/text-embedding`
    const payload = {
      model: options.model || 'text-embedding-v1',
      input: {
        texts: Array.isArray(input) ? input : [input],
      },
    }

    const response = await this._proxyRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: payload,
    })

    return response.data?.output?.embeddings || []
  }
}
