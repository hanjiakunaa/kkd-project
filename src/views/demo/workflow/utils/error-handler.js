/**
 * 错误处理工具
 * 统一处理和格式化错误
 */

export class WorkflowError extends Error {
  constructor(message, nodeId, type = 'EXECUTION_ERROR') {
    super(message)
    this.name = 'WorkflowError'
    this.nodeId = nodeId
    this.type = type
    this.timestamp = new Date().toISOString()
  }
}

/**
 * 错误类型
 */
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 配置验证错误
  EXECUTION_ERROR: 'EXECUTION_ERROR', // 执行错误
  NETWORK_ERROR: 'NETWORK_ERROR', // 网络错误
  TIMEOUT_ERROR: 'TIMEOUT_ERROR', // 超时错误
  API_ERROR: 'API_ERROR', // API 调用错误
  CONFIG_ERROR: 'CONFIG_ERROR', // 配置错误
}

/**
 * 解析错误信息
 * @param {Error} error - 错误对象
 * @returns {Object} - 格式化的错误信息
 */
export function parseError(error) {
  let message = error.message || '未知错误'
  let type = ErrorTypes.EXECUTION_ERROR

  // 网络错误
  if (error.name === 'NetworkError' || message.includes('fetch') || message.includes('network')) {
    type = ErrorTypes.NETWORK_ERROR
    message = '网络请求失败，请检查网络连接'
  }

  // 超时错误
  if (error.name === 'AbortError' || message.includes('timeout') || message.includes('超时')) {
    type = ErrorTypes.TIMEOUT_ERROR
    message = '请求超时，请稍后重试'
  }

  // API 错误
  if (message.includes('HTTP') || message.includes('API') || message.includes('401') || message.includes('403')) {
    type = ErrorTypes.API_ERROR
  }

  // 配置错误
  if (message.includes('API Key') || message.includes('配置') || message.includes('未设置')) {
    type = ErrorTypes.CONFIG_ERROR
  }

  return {
    type,
    message,
    originalError: error,
  }
}

/**
 * 获取用户友好的错误提示
 * @param {Error} error - 错误对象
 * @returns {string}
 */
export function getUserFriendlyMessage(error) {
  const { type, message } = parseError(error)

  const tips = {
    [ErrorTypes.VALIDATION_ERROR]: '请检查节点配置是否正确',
    [ErrorTypes.NETWORK_ERROR]: '请检查网络连接，或尝试使用代理',
    [ErrorTypes.TIMEOUT_ERROR]: '请求超时，建议降低并发数或增加超时时间',
    [ErrorTypes.API_ERROR]: '请检查 API Key 是否有效，以及是否有足够的配额',
    [ErrorTypes.CONFIG_ERROR]: '请在设置中配置正确的 API Key 和服务地址',
  }

  return `${message}\n\n💡 建议：${tips[type] || '请查看详细错误信息'}`
}

/**
 * 错误日志记录
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文信息
 */
export function logError(error, context = {}) {
  console.error('Workflow Error:', {
    error,
    context,
    timestamp: new Date().toISOString(),
  })
}

