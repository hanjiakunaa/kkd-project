/**
 * Vision 图片理解节点执行器
 * 支持多模态大模型理解图片内容
 */

import { BaseExecutor } from './base'

export class VisionExecutor extends BaseExecutor {
  constructor() {
    super()
    this.type = 'vision-node'
  }

  /**
   * 执行图片理解
   * @param {Object} node - 节点配置
   * @param {any} input - 输入数据（图片URL或base64）
   * @param {Object} context - 执行上下文
   * @returns {Promise<string>} 图片理解结果
   */
  async execute(node, input, context) {
    const params = node.data.params || {}
    const {
      provider = 'openai',
      model = 'gpt-4o',
      prompt = '请详细描述这张图片的内容。',
      temperature = 0.7,
      maxTokens = 1000,
      detail = 'auto', // auto, low, high
    } = params

    console.log(`[VisionExecutor] 开始理解图片: provider=${provider}, model=${model}`)

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

      // 处理输入 - 支持多种格式
      const imageUrl = this.processImageInput(input)

      // 根据服务商调用不同的 API
      let result
      switch (provider) {
        case 'openai':
          result = await this.executeOpenAI(imageUrl, prompt, model, temperature, maxTokens, detail, apiKey)
          break

        case 'zhipu':
          result = await this.executeZhipu(imageUrl, prompt, model, temperature, apiKey)
          break

        case 'qwen':
          result = await this.executeQwen(imageUrl, prompt, model, temperature, apiKey)
          break

        case 'moonshot':
          result = await this.executeMoonshot(imageUrl, prompt, model, temperature, apiKey)
          break

        default:
          throw new Error(`不支持的服务商: ${provider}`)
      }

      console.log('[VisionExecutor] 图片理解完成:', result.slice(0, 100))
      return result
    }
    catch (error) {
      console.error('[VisionExecutor] 执行失败:', error)
      throw new Error(`图片理解失败: ${error.message}`)
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

      // 尝试从对象中提取URL
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
   * OpenAI Vision API
   */
  async executeOpenAI(imageUrl, prompt, model, temperature, maxTokens, detail, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail,
                },
              },
            ],
          },
        ],
        temperature,
        max_tokens: maxTokens,
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
   * 智谱 AI Vision API
   */
  async executeZhipu(imageUrl, prompt, model, temperature, apiKey) {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'glm-4v',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature,
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
   * 通义千问 Vision API
   */
  async executeQwen(imageUrl, prompt, model, temperature, apiKey) {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-SSE': 'disable',
      },
      body: JSON.stringify({
        model: model || 'qwen-vl-plus',
        input: {
          messages: [
            {
              role: 'user',
              content: [
                { text: prompt },
                { image: imageUrl },
              ],
            },
          ],
        },
        parameters: {
          temperature,
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
   * Moonshot Vision API
   */
  async executeMoonshot(imageUrl, prompt, model, temperature, apiKey) {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'moonshot-v1-8k',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Moonshot API 错误: ${error}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  /**
   * 验证参数
   */
  validateParams(params) {
    const errors = []

    if (!params.provider) {
      errors.push('未选择服务商')
    }

    if (!params.model) {
      errors.push('未选择模型')
    }

    if (params.temperature !== undefined && (params.temperature < 0 || params.temperature > 2)) {
      errors.push('temperature 应在 0-2 之间')
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
        label: 'AI 服务商',
        options: [
          { label: 'OpenAI', value: 'openai' },
          { label: '智谱 AI', value: 'zhipu' },
          { label: '阿里通义', value: 'qwen' },
          { label: 'Moonshot', value: 'moonshot' },
        ],
        default: 'openai',
        required: true,
      },
      model: {
        type: 'select',
        label: '模型',
        options: [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
          { label: 'GLM-4V', value: 'glm-4v' },
          { label: 'Qwen-VL-Plus', value: 'qwen-vl-plus' },
          { label: 'Moonshot-V1', value: 'moonshot-v1-8k' },
        ],
        default: 'gpt-4o',
        required: true,
      },
      prompt: {
        type: 'textarea',
        label: '提示词',
        placeholder: '请详细描述这张图片的内容...',
        default: '请详细描述这张图片的内容。',
        rows: 3,
      },
      temperature: {
        type: 'number',
        label: '创造性',
        min: 0,
        max: 2,
        step: 0.1,
        default: 0.7,
      },
      maxTokens: {
        type: 'number',
        label: '最大输出',
        min: 100,
        max: 4000,
        default: 1000,
      },
      detail: {
        type: 'select',
        label: '细节程度',
        options: [
          { label: '自动', value: 'auto' },
          { label: '低', value: 'low' },
          { label: '高', value: 'high' },
        ],
        default: 'auto',
        visible: params => params.provider === 'openai',
      },
    }
  }
}

