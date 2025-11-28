/**
 * 重试机制工具
 * 实现指数退避重试策略
 */

/**
 * 重试配置
 */
export const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 3, // 最大重试次数
  initialDelay: 1000, // 初始延迟（毫秒）
  maxDelay: 10000, // 最大延迟（毫秒）
  backoffMultiplier: 2, // 退避倍数
  retryableErrors: ['NetworkError', 'TimeoutError', 'HTTP 429', 'HTTP 500', 'HTTP 502', 'HTTP 503'], // 可重试的错误
}

/**
 * 判断错误是否可重试
 * @param {Error} error - 错误对象
 * @param {Array<string>} retryableErrors - 可重试的错误类型
 * @returns {boolean}
 */
function isRetryableError(error, retryableErrors) {
  const errorMessage = error.message || ''
  return retryableErrors.some(pattern => errorMessage.includes(pattern) || error.name === pattern)
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 计算延迟时间（指数退避）
 * @param {number} attemptNumber - 当前尝试次数（从 0 开始）
 * @param {Object} options - 重试配置
 * @returns {number} - 延迟毫秒数
 */
function calculateDelay(attemptNumber, options) {
  const exponentialDelay = options.initialDelay * (options.backoffMultiplier ** attemptNumber)
  return Math.min(exponentialDelay, options.maxDelay)
}

/**
 * 带重试的异步函数执行器
 * @param {Function} fn - 要执行的异步函数
 * @param {Object} options - 重试配置
 * @param {Function} onRetry - 重试回调 (attemptNumber, error, nextDelay)
 * @returns {Promise<any>} - 执行结果
 */
export async function retry(fn, options = {}, onRetry) {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // 执行函数
      return await fn()
    }
    catch (error) {
      lastError = error

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === config.maxRetries) {
        throw error
      }

      // 判断是否可重试
      if (!isRetryableError(error, config.retryableErrors)) {
        throw error
      }

      // 计算延迟时间
      const delayTime = calculateDelay(attempt, config)

      // 触发重试回调
      if (onRetry) {
        onRetry(attempt + 1, error, delayTime)
      }

      // 等待后重试
      await delay(delayTime)
    }
  }

  // 理论上不会到这里，但为了类型安全
  throw lastError
}

/**
 * 创建可重试的函数
 * @param {Function} fn - 原始函数
 * @param {Object} options - 重试配置
 * @returns {Function} - 包装后的函数
 */
export function createRetryable(fn, options = {}) {
  return async function (...args) {
    return retry(() => fn(...args), options)
  }
}

