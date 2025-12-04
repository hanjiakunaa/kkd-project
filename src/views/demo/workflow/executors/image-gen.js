/**
 * 图片生成节点执行器
 * 处理文本生成图片任务
 */

import { createAdapter } from '../adapters'
import { BaseExecutor } from './base'

export class ImageGenExecutor extends BaseExecutor {
  constructor() {
    super()
    this.name = 'ImageGenExecutor'
  }

  /**
   * 执行图片生成
   */
  async execute(node, input, context) {
    const { provider, model, size, style, quality } = node.data.params

    // 验证必要参数
    if (!provider) {
      throw new Error('未配置 AI 服务商')
    }

    // 获取 API 配置
    const apiKey = context.getApiKey(provider)
    const baseUrl = context.getBaseUrl(provider)

    if (!apiKey) {
      throw new Error(`未配置 ${provider} 的 API Key`)
    }

    // 创建适配器
    const adapter = createAdapter(provider, { apiKey, baseUrl })

    // 生成图片
    const prompt = String(input)
    const options = {
      model,
      size: size || '1024x1024',
      style,
      quality,
    }

    const imageUrl = await adapter.generateImage(prompt, options)

    // 调试：查看图片URL
    console.warn('[图片生成] 适配器返回的URL:', imageUrl)
    console.warn('[图片生成] URL类型:', typeof imageUrl)

    if (!imageUrl) {
      throw new Error('图片生成失败，未返回 URL')
    }

    // 返回 Markdown 格式
    const result = {
      type: 'image',
      url: imageUrl,
      prompt,
      markdown: `![${prompt}](${imageUrl})`,
    }
    
    console.warn('[图片生成] 返回的对象:', result)
    console.warn('[图片生成] Markdown格式:', result.markdown)
    
    return result
  }

  /**
   * 验证节点配置
   */
  validate(node) {
    const { provider, model } = node.data.params

    if (!provider) {
      return { valid: false, error: '请选择 AI 服务商' }
    }

    if (!model) {
      return { valid: false, error: '请选择模型' }
    }

    return { valid: true, error: null }
  }

  /**
   * 预估执行时间
   */
  getEstimatedDuration(node) {
    // 图片生成通常需要 10-30 秒
    return 20000
  }

  /**
   * 格式化输出
   */
  formatOutput(output, format = 'markdown') {
    if (typeof output === 'object' && output.markdown) {
      return output.markdown
    }
    return String(output)
  }
}

