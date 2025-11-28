/**
 * 循环节点执行器
 * 支持批量处理和迭代操作
 */

import { BaseExecutor } from './base'

export class LoopExecutor extends BaseExecutor {
  constructor() {
    super()
    this.type = 'loop-node'
  }

  /**
   * 执行循环节点
   * @param {object} node - 节点配置
   * @param {any} input - 输入数据
   * @param {object} context - 执行上下文
   * @returns {Promise<any>} 输出数据
   */
  async execute(node, input, context) {
    const params = node.data.params || {}
    const {
      type = 'count', // 循环类型：count（计数）、array（数组）、while（条件）
      count = 3, // 循环次数（type=count 时）
      maxIterations = 10, // 最大迭代次数（防止死循环）
      separator = '\n---\n', // 结果分隔符
      aggregation = 'concat', // 聚合方式：concat（拼接）、array（数组）、last（最后一个）
    } = params

    console.log(`[LoopExecutor] 执行循环节点: type=${type}, count=${count}`)

    try {
      const results = []
      let iterations = 0

      switch (type) {
        case 'count':
          // 计数循环：执行固定次数
          iterations = Math.min(count, maxIterations)
          for (let i = 0; i < iterations; i++) {
            const iterationInput = this.prepareIterationInput(input, i, iterations)
            const result = await this.executeIteration(node, iterationInput, context, i)
            results.push(result)
          }
          break

        case 'array':
          // 数组循环：遍历数组元素
          if (!Array.isArray(input)) {
            // 尝试解析输入为数组
            try {
              const parsed = typeof input === 'string' ? JSON.parse(input) : input
              input = Array.isArray(parsed) ? parsed : [input]
            }
            catch {
              input = [input]
            }
          }

          iterations = Math.min(input.length, maxIterations)
          for (let i = 0; i < iterations; i++) {
            const iterationInput = input[i]
            const result = await this.executeIteration(node, iterationInput, context, i)
            results.push(result)
          }
          break

        case 'while':
          // 条件循环：满足条件时继续
          let shouldContinue = true
          while (shouldContinue && iterations < maxIterations) {
            const iterationInput = this.prepareIterationInput(input, iterations, maxIterations)
            const result = await this.executeIteration(node, iterationInput, context, iterations)
            results.push(result)
            iterations++

            // 检查是否继续（简单实现：如果结果包含 "continue" 则继续）
            shouldContinue = this.checkContinueCondition(result, params)
          }
          break

        default:
          throw new Error(`不支持的循环类型: ${type}`)
      }

      // 聚合结果
      const output = this.aggregateResults(results, aggregation, separator)

      console.log(`[LoopExecutor] 循环完成: 执行 ${iterations} 次迭代`)
      return output
    }
    catch (error) {
      console.error('[LoopExecutor] 执行失败:', error)
      throw error
    }
  }

  /**
   * 准备迭代输入
   */
  prepareIterationInput(input, index, total) {
    // 如果输入是字符串，添加迭代信息
    if (typeof input === 'string') {
      return `${input}\n[迭代 ${index + 1}/${total}]`
    }

    // 如果输入是对象，添加迭代元数据
    if (typeof input === 'object' && input !== null) {
      return {
        ...input,
        _iteration: index,
        _total: total,
      }
    }

    return input
  }

  /**
   * 执行单次迭代
   * 这里只是返回输入，实际的子流程执行由引擎处理
   */
  async executeIteration(node, input, context, index) {
    console.log(`[LoopExecutor] 执行迭代 ${index + 1}:`, typeof input === 'string' ? input.slice(0, 100) : input)

    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100))

    // 在实际实现中，这里应该执行子节点或子流程
    // 现在先简单返回输入
    return input
  }

  /**
   * 检查是否继续循环
   */
  checkContinueCondition(result, params) {
    const { whileCondition } = params

    // 如果没有设置条件，默认不继续
    if (!whileCondition) {
      return false
    }

    // 简单的条件检查
    const resultStr = String(result).toLowerCase()
    return resultStr.includes(whileCondition.toLowerCase())
  }

  /**
   * 聚合结果
   */
  aggregateResults(results, aggregation, separator) {
    switch (aggregation) {
      case 'concat':
        // 拼接字符串
        return results.map(r => String(r)).join(separator)

      case 'array':
        // 返回数组
        return results

      case 'last':
        // 返回最后一个
        return results[results.length - 1] || ''

      case 'first':
        // 返回第一个
        return results[0] || ''

      case 'json':
        // 返回 JSON 数组
        return JSON.stringify(results, null, 2)

      default:
        return results
    }
  }

  /**
   * 验证参数
   */
  validateParams(params) {
    const errors = []

    if (params.type === 'count' && (!params.count || params.count < 1)) {
      errors.push('循环次数必须大于 0')
    }

    if (params.maxIterations && params.maxIterations < 1) {
      errors.push('最大迭代次数必须大于 0')
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
      type: {
        type: 'select',
        label: '循环类型',
        options: [
          { label: '计数循环', value: 'count' },
          { label: '数组遍历', value: 'array' },
          { label: '条件循环', value: 'while' },
        ],
        default: 'count',
      },
      count: {
        type: 'number',
        label: '循环次数',
        min: 1,
        max: 100,
        default: 3,
        visible: params => params.type === 'count',
      },
      maxIterations: {
        type: 'number',
        label: '最大迭代次数',
        min: 1,
        max: 100,
        default: 10,
      },
      aggregation: {
        type: 'select',
        label: '结果聚合',
        options: [
          { label: '拼接字符串', value: 'concat' },
          { label: '数组', value: 'array' },
          { label: '最后一个', value: 'last' },
          { label: '第一个', value: 'first' },
          { label: 'JSON', value: 'json' },
        ],
        default: 'concat',
      },
      separator: {
        type: 'text',
        label: '分隔符',
        default: '\n---\n',
        visible: params => params.aggregation === 'concat',
      },
      whileCondition: {
        type: 'text',
        label: '继续条件',
        placeholder: '当结果包含此文本时继续',
        visible: params => params.type === 'while',
      },
    }
  }
}
