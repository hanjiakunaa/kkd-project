/**
 * OpenAI 适配器
 * 支持 GPT-4, GPT-3.5, DALL-E, TTS 等
 */

import { BaseAdapter } from './base'

export class OpenAIAdapter extends BaseAdapter {
  constructor(config = {}) {
    super({
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      ...config,
    })
  }

  /**
   * Chat Completion
   */
  async chat(messages, options = {}) {
    const url = `${this.baseUrl}/chat/completions`
    const payload = {
      model: options.model || 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens,
      top_p: options.topP,
      frequency_penalty: options.frequencyPenalty,
      presence_penalty: options.presencePenalty,
    }

    const response = await this._proxyRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: payload,
    })

    return response.data?.choices?.[0]?.message?.content || ''
  }

  /**
   * 流式 Chat
   */
  async chatStream(messages, options = {}, onChunk) {
    const url = `${this.baseUrl}/chat/completions`
    const payload = {
      model: options.model || 'gpt-4o-mini',
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
   * 图片生成 (DALL-E)
   */
  async generateImage(prompt, options = {}) {
    const url = `${this.baseUrl}/images/generations`
    const payload = {
      model: options.model || 'dall-e-3',
      prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'natural',
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
   * 音频生成 (TTS)
   */
  async generateAudio(text, options = {}) {
    const url = `${this.baseUrl}/audio/speech`
    const payload = {
      model: options.model || 'tts-1',
      input: text,
      voice: options.voice || 'alloy',
      speed: options.speed || 1.0,
    }

    const response = await this._proxyRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: payload,
    })

    // 返回音频 URL 或 base64
    return response.data || ''
  }

  /**
   * 文本向量化
   */
  async embedding(input, options = {}) {
    const url = `${this.baseUrl}/embeddings`
    const payload = {
      model: options.model || 'text-embedding-3-small',
      input: Array.isArray(input) ? input : [input],
    }

    const response = await this._proxyRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: payload,
    })

    return response.data?.data?.map(item => item.embedding) || []
  }
}
