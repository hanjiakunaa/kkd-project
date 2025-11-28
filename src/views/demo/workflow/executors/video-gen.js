/**
 * 视频生成节点执行器
 * 处理文本/图片生成视频任务
 */

import { createAdapter } from '../adapters'
import { BaseExecutor } from './base'

export class VideoGenExecutor extends BaseExecutor {
  constructor() {
    super()
    this.name = 'VideoGenExecutor'
  }

  /**
   * 执行视频生成
   */
  async execute(node, input, context) {
    const { provider, model, duration, resolution, fps } = node.data.params

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

    // 判断输入类型：文本或图片 URL
    const inputData = typeof input === 'object' && input.url
      ? { prompt: input.prompt || '', imageUrl: input.url }
      : String(input)

    const options = {
      model,
      duration: Number.parseInt(duration) || 5,
      resolution: resolution || '720p',
      fps: Number.parseInt(fps) || 24,
    }

    // 生成视频（通常是异步任务）
    const result = await adapter.generateVideo(inputData, options)

    // 如果是异步任务，轮询获取结果
    if (result.status === 'processing' && result.taskId) {
      context.onStatusUpdate?.(node.id, '视频生成中...')

      // 轮询任务状态
      const maxRetries = 60 // 最多等待 60 次
      const retryInterval = 5000 // 每 5 秒查询一次

      for (let i = 0; i < maxRetries; i++) {
        await new Promise(resolve => setTimeout(resolve, retryInterval))

        const taskStatus = await adapter.getTaskStatus(result.taskId)

        if (taskStatus.status === 'success') {
          return {
            type: 'video',
            url: taskStatus.url,
            coverUrl: taskStatus.coverUrl,
            taskId: result.taskId,
            markdown: `[查看视频](${taskStatus.url})`,
          }
        }
        else if (taskStatus.status === 'failed') {
          throw new Error('视频生成失败')
        }

        // 继续等待
        context.onStatusUpdate?.(node.id, `视频生成中... ${i + 1}/${maxRetries}`)
      }

      throw new Error('视频生成超时')
    }

    // 同步返回结果
    return {
      type: 'video',
      url: result.url,
      taskId: result.taskId,
      markdown: `[查看视频](${result.url})`,
    }
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
    const { duration } = node.data.params
    // 视频生成通常需要视频时长的 10-20 倍
    const videoDuration = Number.parseInt(duration) || 5
    return videoDuration * 15 * 1000 // 15 倍时长
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

