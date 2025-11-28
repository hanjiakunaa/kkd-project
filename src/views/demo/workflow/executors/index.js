/**
 * 节点执行器注册表
 * 管理所有节点类型的执行器
 */

import { AudioGenExecutor } from './audio-gen'
import { BaseExecutor } from './base'
import { HttpExecutor } from './http'
import { ImageGenExecutor } from './image-gen'
import { LLMExecutor } from './llm'
import { LoopExecutor } from './loop'
import { OCRExecutor } from './ocr'
import { VideoGenExecutor } from './video-gen'
import { VisionExecutor } from './vision'

// 执行器映射
const EXECUTORS = {
  'llm-node': LLMExecutor,
  'image-gen-node': ImageGenExecutor,
  'video-gen-node': VideoGenExecutor,
  'audio-gen-node': AudioGenExecutor,
  'image-to-video-node': VideoGenExecutor, // 复用视频生成执行器
  'loop-node': LoopExecutor,
  'http-node': HttpExecutor,
  'vision-node': VisionExecutor,
  'ocr-node': OCRExecutor,

  // 简单节点执行器
  'input-node': class InputExecutor extends BaseExecutor {
    async execute(node, input) {
      // 输入节点直接返回节点中配置的输入值或传入的 input
      return input || node.data.variables?.input || node.data.params?.defaultValue || ''
    }
  },

  'output-node': class OutputExecutor extends BaseExecutor {
    async execute(node, input) {
      // 输出节点直接返回输入
      return input
    }
  },

  'text-process-node': class TextProcessExecutor extends BaseExecutor {
    async execute(node, input) {
      const { operation } = node.data.params
      const text = String(input)

      switch (operation) {
        case 'uppercase':
          return text.toUpperCase()
        case 'lowercase':
          return text.toLowerCase()
        case 'trim':
          return text.trim()
        case 'reverse':
          return text.split('').reverse().join('')
        case 'length':
          return `文本长度: ${text.length} 个字符`
        default:
          return text
      }
    }
  },

  'merge-node': class MergeExecutor extends BaseExecutor {
    async execute(node, input, context) {
      const { method, separator } = node.data.params

      // 获取所有输入边的数据
      const inputs = context.getNodeInputs(node.id)

      if (method === 'concat') {
        return inputs.join(separator || '\n')
      }
      else if (method === 'json') {
        return JSON.stringify(inputs, null, 2)
      }

      return inputs.join(separator || '\n')
    }
  },

  'branch-node': class BranchExecutor extends BaseExecutor {
    async execute(node, input) {
      const { condition, operator } = node.data.params
      const text = String(input)

      let result = false

      switch (operator) {
        case 'contains':
          result = text.includes(condition)
          break
        case 'equals':
          result = text === condition
          break
        case 'startsWith':
          result = text.startsWith(condition)
          break
        case 'endsWith':
          result = text.endsWith(condition)
          break
        case 'regex':
          result = new RegExp(condition).test(text)
          break
        default:
          result = Boolean(text)
      }

      return {
        value: input,
        branch: result ? 'true' : 'false',
        condition: result,
      }
    }
  },

  'tool-node': class ToolExecutor extends BaseExecutor {
    async execute(node, input) {
      const { code } = node.data.params

      // 执行自定义代码（需要注意安全性）
      try {
        // 创建函数并执行
        // eslint-disable-next-line no-new-func
        const fn = new Function('input', 'node', code)
        return await fn(input, node)
      }
      catch (error) {
        throw new Error(`自定义代码执行失败: ${error.message}`)
      }
    }
  },
}

/**
 * 获取节点执行器
 * @param {string} nodeType - 节点类型
 * @returns {BaseExecutor} - 执行器实例
 */
export function getExecutor(nodeType) {
  const ExecutorClass = EXECUTORS[nodeType]

  if (!ExecutorClass) {
    throw new Error(`不支持的节点类型: ${nodeType}`)
  }

  return new ExecutorClass()
}

/**
 * 检查节点类型是否支持
 * @param {string} nodeType - 节点类型
 * @returns {boolean}
 */
export function isNodeTypeSupported(nodeType) {
  return Boolean(EXECUTORS[nodeType])
}

/**
 * 获取所有支持的节点类型
 * @returns {Array<string>}
 */
export function getSupportedNodeTypes() {
  return Object.keys(EXECUTORS)
}

export { AudioGenExecutor, BaseExecutor, ImageGenExecutor, LLMExecutor, OCRExecutor, VideoGenExecutor, VisionExecutor }
