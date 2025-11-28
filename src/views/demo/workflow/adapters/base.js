/**
 * AI 适配器基类
 * 定义所有 AI 服务商适配器的统一接口
 */

export class BaseAdapter {
  constructor(config = {}) {
    this.apiKey = config.apiKey || ''
    this.baseUrl = config.baseUrl || ''
    this.timeout = config.timeout || 60000 // 默认 60 秒超时
  }

  /**
   * 文本生成 (Chat Completion)
   * @param {Array} messages - 消息列表 [{role: 'user', content: '...'}]
   * @param {object} options - 配置选项
   * @returns {Promise<string>} - 生成的文本
   */
  async chat(messages, options = {}) {
    throw new Error('chat() method must be implemented by subclass')
  }

  /**
   * 流式文本生成
   * @param {Array} messages - 消息列表
   * @param {object} options - 配置选项
   * @param {Function} onChunk - 接收每个数据块的回调
   * @returns {Promise<string>} - 完整的生成文本
   */
  async chatStream(messages, options = {}, onChunk) {
    throw new Error('chatStream() method not implemented')
  }

  /**
   * 图片生成
   * @param {string} prompt - 图片描述
   * @param {object} options - 配置选项
   * @returns {Promise<string>} - 图片 URL
   */
  async generateImage(prompt, options = {}) {
    throw new Error('generateImage() method must be implemented by subclass')
  }

  /**
   * 视频生成
   * @param {string | object} input - 文本描述或图片 URL
   * @param {object} options - 配置选项
   * @returns {Promise<object>} - 视频信息 {url, taskId, status}
   */
  async generateVideo(input, options = {}) {
    throw new Error('generateVideo() method not supported by this provider')
  }

  /**
   * 音频生成 (TTS)
   * @param {string} text - 要转换的文本
   * @param {object} options - 配置选项
   * @returns {Promise<string>} - 音频 URL
   */
  async generateAudio(text, options = {}) {
    throw new Error('generateAudio() method not supported by this provider')
  }

  /**
   * OCR 识别
   * @param {string} imageUrl - 图片 URL
   * @param {object} options - 配置选项
   * @returns {Promise<string>} - 识别的文本
   */
  async ocr(imageUrl, options = {}) {
    throw new Error('ocr() method not supported by this provider')
  }

  /**
   * 文本向量化
   * @param {string|Array} input - 文本或文本数组
   * @param {object} options - 配置选项
   * @returns {Promise<Array>} - 向量数组
   */
  async embedding(input, options = {}) {
    throw new Error('embedding() method not supported by this provider')
  }

  /**
   * 获取任务状态（用于异步任务，如视频生成）
   * @param {string} taskId - 任务 ID
   * @returns {Promise<object>} - 任务状态信息
   */
  async getTaskStatus(taskId) {
    throw new Error('getTaskStatus() method not supported by this provider')
  }

  /**
   * 通用的 HTTP 请求方法
   * @protected
   */
  async _request(url, options = {}) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return await response.json()
    }
    catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error('请求超时')
      }
      throw error
    }
  }

  /**
   * 通过代理发送请求（解决跨域问题）
   * @protected
   */
  async _proxyRequest(url, options = {}) {
    const { request } = await import('@/utils')
    return request.post('/api/proxy', {
      url,
      method: options.method || 'POST',
      headers: options.headers || {},
      body: options.body || {},
    })
  }
}
