/**
 * OCR 文字识别节点执行器
 * 从图片中识别文字内容
 */

import { BaseExecutor } from './base'

export class OCRExecutor extends BaseExecutor {
  constructor() {
    super()
    this.type = 'ocr-node'
  }

  /**
   * 执行 OCR 识别
   * @param {Object} node - 节点配置
   * @param {any} input - 输入数据（图片URL或base64）
   * @param {Object} context - 执行上下文
   * @returns {Promise<string>} OCR 识别结果
   */
  async execute(node, input, context) {
    const params = node.data.params || {}
    const {
      provider = 'qwen',
      language = 'auto', // auto, zh, en, zh_en
      outputFormat = 'text', // text, json, markdown
      detectOrientation = false, // 是否检测方向
      detectTable = false, // 是否识别表格
    } = params

    console.log(`[OCRExecutor] 开始识别文字: provider=${provider}, language=${language}`)

    try {
      // 验证输入
      if (!input) {
        throw new Error('请提供图片URL或base64数据')
      }

      // 获取 API Key（从 context，而不是环境变量）
      const apiKey = context?.getApiKey?.(provider)
      if (!apiKey) {
        throw new Error(`未配置 ${provider} 的 API Key，请在设置中配置`)
      }

      // 处理输入
      const imageUrl = this.processImageInput(input)

      // 根据服务商调用不同的 OCR API
      let result
      switch (provider) {
        case 'qwen':
          result = await this.executeQwen(imageUrl, language, outputFormat, apiKey)
          break

        case 'baidu':
          result = await this.executeBaidu(imageUrl, language, detectTable, apiKey, context)
          break

        case 'zhipu':
          result = await this.executeZhipu(imageUrl, language, apiKey)
          break

        case 'openai':
          result = await this.executeOpenAI(imageUrl, language, apiKey)
          break

        default:
          throw new Error(`不支持的服务商: ${provider}`)
      }

      // 根据输出格式处理结果
      const formattedResult = this.formatOutput(result, outputFormat)

      console.log('[OCRExecutor] 识别完成:', formattedResult.slice(0, 100))
      return formattedResult
    }
    catch (error) {
      console.error('[OCRExecutor] 执行失败:', error)
      throw new Error(`OCR 识别失败: ${error.message}`)
    }
  }

  /**
   * 处理图片输入
   */
  processImageInput(input) {
    if (typeof input === 'string') {
      // 如果是URL或base64,直接返回
      if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('data:image/')) {
        return input
      }

      // 尝试从 JSON 中提取
      try {
        const parsed = JSON.parse(input)
        return parsed.url || parsed.image || parsed.src || input
      }
      catch {
        return input
      }
    }

    // 如果是对象,提取图片URL
    if (typeof input === 'object' && input !== null) {
      return input.url || input.image || input.src || input.data || ''
    }

    return String(input)
  }

  /**
   * 通义千问 OCR
   */
  async executeQwen(imageUrl, language, outputFormat, apiKey) {
    // 使用通义的 VL 模型进行 OCR
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-SSE': 'disable',
      },
      body: JSON.stringify({
        model: 'qwen-vl-plus',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                { text: '请识别图片中的所有文字,保持原有格式和排版。' },
                { image: imageUrl },
              ],
            },
          ],
        },
        parameters: {
          temperature: 0.1,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`通义 API 错误: ${error}`)
    }

    const data = await response.json()
    return data.output?.choices?.[0]?.message?.content?.[0]?.text || ''
  }

  /**
   * 百度 OCR
   * 注意：百度需要 API Key 和 Secret Key，存储格式为 baidu
   */
  async executeBaidu(imageUrl, language, detectTable, apiKey, context) {
    // 百度的 Secret Key 也需要从 context 获取（如果单独配置）
    // 这里简化处理，假设 apiKey 包含了必要信息或使用固定配置
    const secretKey = context?.getApiKey?.('baidu_secret') || apiKey

    // 获取 Access Token
    const tokenResponse = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
      { method: 'POST' },
    )

    if (!tokenResponse.ok) {
      throw new Error('获取百度 Access Token 失败')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 将图片转为 base64（如果是 URL）
    let imageBase64 = imageUrl
    if (imageUrl.startsWith('http')) {
      const imgResponse = await fetch(imageUrl)
      const blob = await imgResponse.blob()
      imageBase64 = await this.blobToBase64(blob)
      // 移除 data:image/xxx;base64, 前缀
      imageBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')
    }

    // 调用 OCR API
    const ocrEndpoint = detectTable
      ? 'https://aip.baidubce.com/rest/2.0/ocr/v1/table'
      : 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic'

    const formData = new URLSearchParams()
    formData.append('image', imageBase64)
    formData.append('language_type', language === 'zh' ? 'CHN_ENG' : 'ENG')

    const response = await fetch(`${ocrEndpoint}?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`百度 OCR 错误: ${error}`)
    }

    const data = await response.json()

    // 提取文字
    if (data.words_result) {
      return data.words_result.map(item => item.words).join('\n')
    }

    return ''
  }

  /**
   * 智谱 AI OCR（使用 GLM-4V）
   */
  async executeZhipu(imageUrl, language, apiKey) {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'glm-4v',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '请识别图片中的所有文字内容,保持原有格式。' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`智谱 API 错误: ${error}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * OpenAI OCR（使用 GPT-4o）
   */
  async executeOpenAI(imageUrl, language, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: '请识别图片中的所有文字,保持原有格式和排版,只输出文字内容。' },
              { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API 错误: ${error}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * 格式化输出
   */
  formatOutput(text, format) {
    switch (format) {
      case 'json':
        return JSON.stringify({ text, lines: text.split('\n') }, null, 2)

      case 'markdown':
        return `## OCR 识别结果\n\n\`\`\`\n${text}\n\`\`\``

      case 'text':
      default:
        return text
    }
  }

  /**
   * Blob 转 Base64
   */
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  /**
   * 验证参数
   */
  validateParams(params) {
    const errors = []

    if (!params.provider) {
      errors.push('未选择服务商')
    }

    if (errors.length > 0) {
      throw new Error(`参数验证失败: ${errors.join(', ')}`)
    }

    return true
  }

  /**
   * 获取支持的参数
   */
  getSupportedParams() {
    return {
      provider: {
        type: 'select',
        label: 'OCR 服务商',
        options: [
          { label: '阿里通义', value: 'qwen' },
          { label: '百度 OCR', value: 'baidu' },
          { label: '智谱 AI', value: 'zhipu' },
          { label: 'OpenAI', value: 'openai' },
        ],
        default: 'qwen',
        required: true,
      },
      language: {
        type: 'select',
        label: '识别语言',
        options: [
          { label: '自动检测', value: 'auto' },
          { label: '中文', value: 'zh' },
          { label: '英文', value: 'en' },
          { label: '中英混合', value: 'zh_en' },
        ],
        default: 'auto',
      },
      outputFormat: {
        type: 'select',
        label: '输出格式',
        options: [
          { label: '纯文本', value: 'text' },
          { label: 'JSON', value: 'json' },
          { label: 'Markdown', value: 'markdown' },
        ],
        default: 'text',
      },
      detectTable: {
        type: 'switch',
        label: '识别表格',
        default: false,
        visible: params => params.provider === 'baidu',
      },
    }
  }
}

